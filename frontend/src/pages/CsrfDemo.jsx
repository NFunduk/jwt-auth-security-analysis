import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

const emptyResult = { status: 'nije pokrenuto', message: '' };

function CsrfDemo() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState({
    unsafeLegitimate: emptyResult,
    unsafeAttack: emptyResult,
    protectedLegitimate: emptyResult,
    protectedAttack: emptyResult,
  });

  const saveResult = (key, status, message) =>
    setResults((current) => ({ ...current, [key]: { status, message } }));

  useEffect(() => {
    const receiveAttackerResult = (event) => {
      if (event.origin !== 'http://localhost:5174' || event.data?.type !== 'csrf-demo-result') return;
      const key = event.data.target === 'unsafe' ? 'unsafeAttack' : 'protectedAttack';
      saveResult(key, `HTTP ${event.data.status}`, event.data.message);
    };
    window.addEventListener('message', receiveAttackerResult);
    return () => window.removeEventListener('message', receiveAttackerResult);
  }, []);

  const createSessions = async (event) => {
    event.preventDefault();
    setReady(false);
    try {
      await api.post('/api/csrf-demo/unsafe/login', { username, password }, { withCredentials: true });
      const protectedResponse = await api.post(
        '/api/csrf-demo/protected/login', { username, password }, { withCredentials: true }
      );
      setCsrfToken(protectedResponse.data.csrfToken);
      setReady(true);
    } catch (error) {
      saveResult('unsafeLegitimate', `HTTP ${error.response?.status || 'greška'}`,
        error.response?.data?.message || error.message);
    }
  };

  const legitimateUnsafe = async () => runRequest('unsafeLegitimate', () =>
    api.post('/api/csrf-demo/unsafe/transfer', {}, { withCredentials: true }));

  const legitimateProtected = async () => runRequest('protectedLegitimate', () =>
    api.post('/api/csrf-demo/protected/transfer', {}, {
      withCredentials: true,
      headers: { 'X-CSRF-Token': csrfToken },
    }));

  const runRequest = async (key, request) => {
    try {
      const response = await request();
      saveResult(key, `HTTP ${response.status}`, response.data.message);
    } catch (error) {
      saveResult(key, `HTTP ${error.response?.status || 'greška'}`,
        error.response?.data?.message || error.message);
    }
  };

  const launchAttack = (target) => {
    const key = target === 'unsafe' ? 'unsafeAttack' : 'protectedAttack';
    saveResult(key, 'čeka rezultat', 'Otvoren je attacker origin; zahtev ne sadrži token ni Authorization zaglavlje.');
    window.open(`http://localhost:5174/?target=${target}`, `csrf-${target}`, 'width=620,height=520');
  };

  return (
    <main className="csrf-page">
      <h1>CSRF laboratorija</h1>
      <p className="warning">Izolovana demonstracija. Cookie sesije važe 30 minuta i nisu deo standardnog JWT toka.</p>

      <section className="csrf-card">
        <h2>1. Uspostavi demo sesije</h2>
        <form onSubmit={createSessions} className="csrf-form">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Lozinka" required />
          <button>Prijavi se u oba CSRF režima</button>
        </form>
        <p>{ready ? '✓ Unsafe i protected HttpOnly cookie sesije su aktivne.' : 'Unesi postojeći nalog.'}</p>
      </section>

      <section className="csrf-grid">
        <DemoCard title="Legitimni UNSAFE zahtev" result={results.unsafeLegitimate}
          explanation="Aplikacija šalje zahtev; server prihvata identitet samo iz cookie-ja i ne proverava CSRF token."
          action={() => legitimateUnsafe()} disabled={!ready} label="Pošalji legitimni zahtev" />
        <DemoCard title="CSRF napad na UNSAFE" result={results.unsafeAttack}
          explanation="Attacker origin šalje zahtev bez pristupa cookie-ju. Browser cookie dodaje automatski, pa ranjivi server izvršava transfer."
          action={() => launchAttack('unsafe')} disabled={!ready} label="Otvori attacker stranicu" />
        <DemoCard title="Legitimni PROTECTED zahtev" result={results.protectedLegitimate}
          explanation="Aplikacija šalje serverom generisan sesijski CSRF token i dolazi sa dozvoljenog Origin-a."
          action={() => legitimateProtected()} disabled={!ready} label="Pošalji legitimni zahtev" />
        <DemoCard title="CSRF napad na PROTECTED" result={results.protectedAttack}
          explanation="Attacker nema CSRF token, a njegov Origin je localhost:5174; server vraća 403 i beleži razlog."
          action={() => launchAttack('protected')} disabled={!ready} label="Otvori attacker stranicu" />
      </section>

      <section className="csrf-card">
        <h2>Zašto CORS nije odbrana</h2>
        <p>Attacker origin je namerno dozvoljen u laboratorijskom CORS-u samo radi prikaza odgovora. Unsafe zahtev ipak prolazi, dok protected zahtev blokiraju CSRF token i Origin provera.</p>
        <p>Portovi 5173 i 5174 su različiti origin-i, ali isti browser site na localhost-u. Produkcijska demonstracija preko različitih domena zahteva HTTPS i <code>Secure</code> cookie.</p>
      </section>
    </main>
  );
}

function DemoCard({ title, result, explanation, action, disabled, label }) {
  const ok = result.status === 'HTTP 200';
  return <section className="csrf-card">
    <h2>{title}</h2><p>{explanation}</p>
    <button onClick={action} disabled={disabled}>{label}</button>
    <div className={ok ? 'csrf-result success' : 'csrf-result'}>
      <strong>{result.status}</strong><br />{result.message}
    </div>
  </section>;
}

export default CsrfDemo;
