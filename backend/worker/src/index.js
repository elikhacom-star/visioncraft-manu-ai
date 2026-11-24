const json = (data, status = 200, origin = '*', headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type, X-Idempotency-Key', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', ...headers }
});

const now = () => Math.floor(Date.now() / 1000);
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=None`;
}

function getSession(request) {
  const raw = request.headers.get('Cookie') || '';
  const match = raw.match(/(?:^|;\s*)vc_session=([^;]+)/);
  return match?.[1] || null;
}

function getOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return origin && origin === env.FRONTEND_ORIGIN ? origin : env.FRONTEND_ORIGIN;
}

async function sendCode(email, code, env) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [email], subject: 'Votre code VisionCraft AI', text: `Votre code de confirmation est : ${code}\n\nIl expire dans 10 minutes.` })
  });
  if (!response.ok) throw new Error('EMAIL_PROVIDER_ERROR');
}

async function replicateModel(model, input, env) {
  const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'REPLICATE_ERROR');
  return data;
}

function outputUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return output.find((item) => typeof item === 'string' && item.startsWith('http')) || null;
  if (output && typeof output === 'object') return output.video || output.url || null;
  return null;
}

async function requireUser(request, env) {
  const sessionId = getSession(request);
  if (!sessionId) return null;
  return env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?').bind(sessionId, now()).first();
}

async function handle(request, env) {
  const origin = getOrigin(request, env);
  if (request.method === 'OPTIONS') return json({}, 204, origin);
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'POST' && path === '/api/auth/request-code') {
    const { email } = await request.json();
    const normalized = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return json({ code: 'INVALID_EMAIL', message: 'Adresse e-mail invalide.' }, 422, origin);
    const emailId = await hmac(normalized, env.EMAIL_HASH_SECRET);
    const recent = await env.DB.prepare('SELECT created_at FROM verification_codes WHERE email_id = ?').bind(emailId).first();
    if (recent && now() - recent.created_at < 60) return json({ code: 'RATE_LIMITED', message: 'Veuillez patienter avant de demander un nouveau code.' }, 429, origin);
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const code = String(100000 + (random[0] % 900000));
    await env.DB.prepare('INSERT OR REPLACE INTO verification_codes(email_id, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, ?)').bind(emailId, await digest(code), now() + 600, now()).run();
    try { await sendCode(normalized, code, env); } catch (_) { return json({ code: 'EMAIL_ERROR', message: 'Impossible d’envoyer le code pour le moment.' }, 502, origin); }
    return json({ ok: true, message: 'Si cette adresse est valide, un code a été envoyé.' }, 200, origin);
  }

  if (request.method === 'POST' && path === '/api/auth/verify-code') {
    const { email, code } = await request.json();
    const emailId = await hmac(normalizeEmail(email), env.EMAIL_HASH_SECRET);
    const record = await env.DB.prepare('SELECT * FROM verification_codes WHERE email_id = ?').bind(emailId).first();
    if (!record || record.expires_at < now() || record.attempts >= 5 || (await digest(String(code || ''))) !== record.code_hash) {
      if (record) await env.DB.prepare('UPDATE verification_codes SET attempts = attempts + 1 WHERE email_id = ?').bind(emailId).run();
      return json({ code: 'INVALID_CODE', message: 'Code invalide ou expiré.' }, 401, origin);
    }
    await env.DB.prepare('DELETE FROM verification_codes WHERE email_id = ?').bind(emailId).run();
    await env.DB.prepare('INSERT OR IGNORE INTO users(email_id, verified_at, daily_count, daily_started_at) VALUES (?, ?, 0, ?)' ).bind(emailId, now(), now()).run();
    const sessionId = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO sessions(id, email_id, expires_at) VALUES (?, ?, ?)').bind(sessionId, emailId, now() + 60 * 60 * 24 * 30).run();
    return json({ ok: true }, 200, origin, { 'Set-Cookie': cookie('vc_session', sessionId, 60 * 60 * 24 * 30) });
  }

  if (request.method === 'GET' && path === '/api/me') {
    const user = await requireUser(request, env);
    if (!user) return json({ authenticated: false }, 401, origin);
    const data = await env.DB.prepare('SELECT daily_count, daily_started_at FROM users WHERE email_id = ?').bind(user.email_id).first();
    const used = data && now() - data.daily_started_at < 86400 ? data.daily_count : 0;
    return json({ authenticated: true, remainingGenerations: Math.max(0, Number(env.DAILY_LIMIT || 1) - used), quotaResetAt: new Date(((data?.daily_started_at || now()) + 86400) * 1000).toISOString() }, 200, origin);
  }

  if (request.method === 'POST' && path === '/api/video/generate') {
    const user = await requireUser(request, env);
    if (!user) return json({ code: 'AUTH_REQUIRED', message: 'Veuillez vérifier votre adresse e-mail.' }, 401, origin);
    const body = await request.json();
    const prompt = String(body.prompt || '').slice(0, 1000);
    const imageUrl = body.imageUrl ? String(body.imageUrl) : null;
    const mode = ['text-to-video', 'image-to-video', 'hybrid'].includes(body.mode) ? body.mode : (imageUrl ? 'image-to-video' : 'text-to-video');
    if (!prompt && !imageUrl) return json({ code: 'INVALID_INPUT', message: 'Un prompt ou une image est nécessaire.' }, 422, origin);
    const existing = await env.DB.prepare('SELECT id, replicate_id FROM generations WHERE email_id = ? AND idempotency_key = ?').bind(user.email_id, request.headers.get('X-Idempotency-Key') || '').first();
    if (existing) return json({ jobId: existing.id, replicateId: existing.replicate_id }, 200, origin);
    const userData = await env.DB.prepare('SELECT * FROM users WHERE email_id = ?').bind(user.email_id).first();
    const used = userData && now() - userData.daily_started_at < 86400 ? userData.daily_count : 0;
    if (used >= Number(env.DAILY_LIMIT || 1)) return json({ code: 'QUOTA_EXCEEDED', message: 'Votre quota gratuit est atteint.' }, 429, origin);
    await env.DB.prepare('UPDATE users SET daily_count = ?, daily_started_at = ? WHERE email_id = ?').bind((used + 1), userData && now() - userData.daily_started_at < 86400 ? userData.daily_started_at : now(), user.email_id).run();
    const input = { prompt, duration: '5s' };
    if (imageUrl) input.image = imageUrl;
    const model = imageUrl ? env.REPLICATE_I2V_MODEL : env.REPLICATE_T2V_MODEL;
    let prediction;
    try { prediction = await replicateModel(model, input, env); } catch (error) {
      await env.DB.prepare('UPDATE users SET daily_count = ? WHERE email_id = ?').bind(used, user.email_id).run();
      return json({ code: 'PROVIDER_ERROR', message: 'Le fournisseur vidéo est momentanément indisponible.' }, 502, origin);
    }
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO generations(id, email_id, idempotency_key, replicate_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, user.email_id, request.headers.get('X-Idempotency-Key') || id, prediction.id, prediction.status, now()).run();
    return json({ jobId: id, replicateId: prediction.id, status: prediction.status }, 202, origin);
  }

  const statusMatch = path.match(/^\/api\/video\/status\/([^/]+)$/);
  if (request.method === 'GET' && statusMatch) {
    const user = await requireUser(request, env);
    const job = user && await env.DB.prepare('SELECT * FROM generations WHERE id = ? AND email_id = ?').bind(statusMatch[1], user.email_id).first();
    if (!job) return json({ code: 'NOT_FOUND', message: 'Tâche introuvable.' }, 404, origin);
    const response = await fetch(`https://api.replicate.com/v1/predictions/${job.replicate_id}`, { headers: { Authorization: `Bearer ${env.REPLICATE_API_TOKEN}` } });
    const prediction = await response.json();
    const videoUrl = outputUrl(prediction.output);
    await env.DB.prepare('UPDATE generations SET status = ?, output_url = ?, error = ? WHERE id = ?').bind(prediction.status, videoUrl, prediction.error || null, job.id).run();
    return json({ jobId: job.id, status: prediction.status, videoUrl, output: videoUrl, message: prediction.error || null }, 200, origin);
  }

  return json({ code: 'NOT_FOUND', message: 'Route introuvable.' }, 404, origin);
}

export default { async fetch(request, env) { try { return await handle(request, env); } catch (error) { console.error(error); return json({ code: 'INTERNAL_ERROR', message: 'Erreur interne.' }, 500, env.FRONTEND_ORIGIN || '*'); } } };
