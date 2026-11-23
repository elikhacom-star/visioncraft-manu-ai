import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isSecureVideoApiConfigured } from '@/api/videoApi';

const API_URL = (import.meta.env.VITE_VIDEO_API_URL || '').replace(/\/$/, '');

async function call(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Une erreur est survenue.');
  return data;
}

export default function VideoAccessGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isSecureVideoApiConfigured) { setChecking(false); return; }
    fetch(`${API_URL}/api/me`, { credentials: 'include' })
      .then((response) => setAuthenticated(response.ok))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecking(false));
  }, []);

  if (!isSecureVideoApiConfigured || authenticated) return children;
  if (checking) return <div className="fixed inset-0 flex items-center justify-center bg-background"><div className="animate-pulse">Vérification de votre accès vidéo…</div></div>;

  async function sendCode(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await call('/api/auth/request-code', { email }); setStep('code'); setMessage('Si cette adresse est valide, un code a été envoyé.'); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }

  async function verifyCode(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await call('/api/auth/verify-code', { email, code }); setAuthenticated(true); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }

  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle>Accès à la génération vidéo</CardTitle><CardDescription>Une adresse e-mail vérifiée est nécessaire pour utiliser le quota gratuit.</CardDescription></CardHeader>
      <CardContent>
        {step === 'email' ? <form onSubmit={sendCode} className="space-y-4">
          <Input type="email" placeholder="vous@exemple.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          <Button className="w-full" type="submit" disabled={busy}>{busy ? 'Envoi…' : 'Recevoir mon code'}</Button>
        </form> : <form onSubmit={verifyCode} className="space-y-4">
          <Input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="Code à 6 chiffres" value={code} onChange={(event) => setCode(event.target.value)} required autoComplete="one-time-code" />
          <Button className="w-full" type="submit" disabled={busy}>{busy ? 'Vérification…' : 'Valider mon adresse'}</Button>
          <button type="button" className="text-sm underline" onClick={() => setStep('email')}>Modifier l’adresse</button>
        </form>}
        {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  </div>;
}
