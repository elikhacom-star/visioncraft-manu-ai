const API_URL = (import.meta.env.VITE_VIDEO_API_URL || '').replace(/\/$/, '');

export const isSecureVideoApiConfigured = Boolean(API_URL);

async function request(path, options = {}) {
  if (!API_URL) throw new Error('Video API non configurée. Définissez VITE_VIDEO_API_URL.');
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  let payload = {};
  try { payload = await response.json(); } catch (_) {}
  if (!response.ok) {
    const error = new Error(payload.message || 'La demande vidéo a échoué.');
    error.status = response.status;
    error.code = payload.code;
    throw error;
  }
  return payload;
}

export async function requestVideoGeneration({ prompt = '', imageUrl = null, duration = 5, mode = 'image-to-video', idempotencyKey = crypto.randomUUID() }) {
  return request('/api/video/generate', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ prompt, imageUrl, duration: Math.min(Number(duration) || 5, 5), mode })
  });
}

export function getVideoGenerationStatus(jobId) {
  return request(`/api/video/status/${encodeURIComponent(jobId)}`);
}

export async function waitForVideoGeneration(jobId, { onStatus, timeoutMs = 180000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = await getVideoGenerationStatus(jobId);
    onStatus?.(status);
    if (status.status === 'succeeded' || status.status === 'completed') return status;
    if (['failed', 'canceled'].includes(status.status)) throw new Error(status.message || 'La génération vidéo a échoué.');
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
  throw new Error('Délai dépassé en attendant la vidéo.');
}

export async function generateSecureVideo(options) {
  const job = await requestVideoGeneration(options);
  if (job.videoUrl) return job.videoUrl;
  if (!job.jobId) throw new Error('Réponse vidéo invalide.');
  const result = await waitForVideoGeneration(job.jobId, options);
  return result.videoUrl || result.output;
}
