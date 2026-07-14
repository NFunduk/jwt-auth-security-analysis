import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { getDisplayToken, getUnsafeAccessToken, setUnsafeSession } from '../api/tokenStore';
import { useAuth } from '../context/useAuth';

function ReplayDemo() {
  const { authMode, user } = useAuth();
  const [originalToken, setOriginalToken] = useState(getUnsafeAccessToken());
  const [stolenToken, setStolenToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0);
    }, 250);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const issueDemoToken = async () => {
    try {
      const response = await api.post('/api/replay-lab/short-lived-token');
      const token = response.data.accessToken;
      setUnsafeSession({ accessToken: token, username: user?.username, role: user?.role });
      setOriginalToken(token);
      setStolenToken('');
      setExpiresAt(response.data.expiresAt);
      setSecondsLeft(response.data.lifetimeSeconds);
      setMessage('Kratkotrajni JWT je sada unsafe.accessToken. Postojeci XSS payload moze da ga procita.');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
    }
  };

  const captureStolenToken = () => {
    const token = getUnsafeAccessToken();
    setStolenToken(token || '');
    setMessage(token ? 'Token je preuzet iz JavaScript-dostupnog localStorage-a kao ukradeni token.' : 'Token nije dostupan.');
  };

  const copyToken = async () => {
    await navigator.clipboard.writeText(stolenToken);
    setMessage('Cela vrednost ukradenog tokena je kopirana. Nalepi je u odvojeni attacker klijent.');
  };

  if (authMode !== 'unsafe') return <main style={styles.page}><h1>Replay laboratorija</h1><p style={styles.warning}>Laboratorija zahteva prijavu u UNSAFE režimu.</p></main>;

  return <main style={styles.page}>
    <h1>Replay laboratorija access tokena</h1>
    <p style={styles.warning}>Izolovani token traje 30 sekundi. Standardni access token i njegova konfiguracija od 15 minuta nisu promenjeni.</p>

    <section style={styles.card}>
      <h2>1. Izdavanje kratkotrajnog tokena</h2>
      <button style={styles.button} onClick={issueDemoToken}>Izdaj demo JWT (30 s)</button>
      <p>Preostalo vreme: <strong>{secondsLeft} s</strong></p>
      <TokenRow label="Originalni access token" token={originalToken} />
    </section>

    <section style={styles.card}>
      <h2>2. Simulirana XSS krađa</h2>
      <p>Otvori postojeći XSS Demo da vidiš kako payload čita <code>unsafe.accessToken</code>, zatim ovde preuzmi istu vrednost.</p>
      <button style={styles.button} onClick={captureStolenToken}>Prikaži ukradeni token</button>{' '}
      <button style={styles.button} onClick={copyToken} disabled={!stolenToken}>Kopiraj celu vrednost</button>
      <TokenRow label="Ukradeni access token" token={stolenToken} />
    </section>

    <section style={styles.card}>
      <h2>3. Replay iz drugog klijenta</h2>
      <p>Attacker origin nema pristup localStorage-u aplikacije. Token moraš ručno nalepiti; zatim on koristi postojeći Bearer mehanizam i postojeći <code>/api/protected/hello</code>.</p>
      <button style={styles.button} onClick={() => window.open('http://localhost:5174/replay.html', 'replay-attacker', 'width=720,height=650')}>Otvori attacker replay klijent</button>
    </section>
    {message && <p style={styles.message}>{message}</p>}
  </main>;
}

function TokenRow({ label, token }) {
  return <div><strong>{label}:</strong><pre style={styles.token}>{getDisplayToken(token)}</pre></div>;
}

const styles = {
  page: { maxWidth: 850, margin: '32px auto', padding: '0 16px', color: '#1a1a2e' },
  card: { background: 'white', padding: 22, marginBottom: 18, borderRadius: 8, boxShadow: '0 2px 10px #0002' },
  warning: { background: '#fff3cd', border: '1px solid #ffc107', padding: 12, borderRadius: 6 },
  button: { background: '#4361ee', color: 'white', border: 0, padding: '10px 15px', borderRadius: 6, cursor: 'pointer', marginBottom: 8 },
  token: { background: '#f4f4f4', padding: 12, wordBreak: 'break-all' },
  message: { background: '#e8f5e9', padding: 14, borderRadius: 6 },
};

export default ReplayDemo;
