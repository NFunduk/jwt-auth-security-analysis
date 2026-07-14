import { useState } from 'react';
import api from '../api/axiosConfig';
import {
  getDisplayToken,
  getUnsafeRefreshToken,
  setAccessToken,
  setUnsafeSession,
} from '../api/tokenStore';
import { useAuth } from '../context/useAuth';

function RotationDemo() {
  const { authMode } = useAuth();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lab, setLab] = useState(null);
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [labMessage, setLabMessage] = useState('');

  const isUnsafe = authMode === 'unsafe';

  const addLog = (message, type = 'info') => {
    setLog((prev) => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const clearLog = () => setLog([]);

  const startFamilyLab = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/rotation-lab/start');
      setLab(response.data); setTokenA(response.data.issuedToken); setTokenB('');
      setLabMessage('Token A je izdat kao ACTIVE i predstavlja koren nove izolovane family.');
    } catch (err) { setLabMessage(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  const rotateTokenA = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/rotation-lab/rotate', { refreshToken: tokenA });
      setLab(response.data); setTokenB(response.data.issuedToken);
      setLabMessage('A je ROTATED; B je ACTIVE i parentTokenId pokazuje na A.');
    } catch (err) { setLab(err.response?.data || lab); setLabMessage(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  const reuseTokenA = async () => {
    setLoading(true);
    try { await api.post('/api/rotation-lab/rotate', { refreshToken: tokenA }); }
    catch (err) {
      setLab(err.response?.data || lab);
      setLabMessage(`HTTP ${err.response?.status}: reuse A je detektovan; A=REUSED, aktivni B=REVOKED.`);
    } finally { setLoading(false); }
  };

  const retryTokenB = async () => {
    setLoading(true);
    try { await api.post('/api/rotation-lab/rotate', { refreshToken: tokenB }); }
    catch (err) {
      setLab(err.response?.data || lab);
      setLabMessage(`HTTP ${err.response?.status}: opozvani naslednik B ne može da osveži sesiju.`);
    } finally { setLoading(false); }
  };

  const unsafeRefresh = async () => {
    const tokenBefore = getUnsafeRefreshToken();
    addLog(`Unsafe refresh pre zahteva: ${getDisplayToken(tokenBefore)}`, 'info');

    const response = await api.post('/api/unsafe/auth/refresh', { refreshToken: tokenBefore });
    setUnsafeSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      username: response.data.username,
      role: response.data.role,
    });

    const tokenAfter = getUnsafeRefreshToken();
    addLog(`Unsafe refresh posle zahteva: ${getDisplayToken(tokenAfter)}`, 'info');
    addLog(
      tokenBefore === tokenAfter
        ? 'Refresh token je ostao isti. Ovo je namerno ranjivo ponasanje unsafe rezima.'
        : 'Refresh token se promenio.',
      tokenBefore === tokenAfter ? 'warning' : 'success'
    );
  };

  const protectedRefresh = async () => {
    addLog('Protected refresh salje HttpOnly cookie automatski. Vrednost refresh tokena nije dostupna JS-u.', 'info');

    const response = await api.post('/api/protected/auth/refresh', {}, { withCredentials: true });
    setAccessToken(response.data.accessToken);

    addLog('Novi access token je dobijen i sacuvan u memoriji aplikacije.', 'success');
    addLog('Refresh cookie je rotiran na backendu, ali njegova vrednost nije prikazana u JS-u.', 'success');
  };

  const runRefresh = async () => {
    setLoading(true);
    try {
      if (isUnsafe) {
        await unsafeRefresh();
      } else {
        await protectedRefresh();
      }
    } catch (err) {
      addLog('Refresh neuspesan: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const runRepeatedUnsafeRefresh = async () => {
    clearLog();
    setLoading(true);

    try {
      addLog('Pokrecem dva uzastopna unsafe refresh zahteva istim refresh tokenom.', 'info');
      await unsafeRefresh();
      await unsafeRefresh();
      addLog('Oba zahteva prolaze jer unsafe endpoint ne rotira refresh token.', 'warning');
    } catch (err) {
      addLog('Unsafe demonstracija nije uspela: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const runRepeatedProtectedRefresh = async () => {
    clearLog();
    setLoading(true);

    try {
      addLog('Pokrecem dva protected refresh zahteva preko HttpOnly cookie-ja.', 'info');
      await protectedRefresh();
      await protectedRefresh();
      addLog('Oba zahteva prolaze jer browser salje najnoviji rotirani cookie.', 'success');
    } catch (err) {
      addLog('Protected demonstracija nije uspela: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const logColors = {
    info: '#1a1a2e',
    success: '#2d6a4f',
    error: '#e63946',
    warning: '#f4a261',
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Refresh Token Rotation Demo</h2>

      <div style={styles.warning}>
        Aktivni rezim: <strong>{isUnsafe ? 'UNSAFE' : 'PROTECTED'}</strong>.{' '}
        {isUnsafe
          ? 'Unsafe refresh ne rotira refresh token i dozvoljava ponovnu upotrebu.'
          : 'Protected refresh koristi HttpOnly cookie i backend rotaciju.'}
      </div>

      <div style={styles.card}>
        <h3>Izolovana token-family reuse laboratorija</h3>
        <p>
          Standardni HttpOnly cookie ostaje nedostupan JavaScript-u. Ovaj panel izdaje zasebnu laboratorijsku
          family i sirove vrednosti A/B drži samo u memoriji stranice radi kontrolisanog eksperimenta.
        </p>
        <div style={styles.btnRow}>
          <button style={styles.btnPrimary} onClick={startFamilyLab} disabled={loading}>1. Izdaj token A</button>
          <button style={styles.btnSuccess} onClick={rotateTokenA} disabled={loading || !tokenA || tokenB}>2. Rotiraj A → B</button>
          <button style={styles.btnWarning} onClick={reuseTokenA} disabled={loading || !tokenB}>3. Ponovo upotrebi A</button>
          <button style={styles.btnGray} onClick={retryTokenB} disabled={loading || !tokenB}>4. Pokušaj opozvani B</button>
        </div>
        {lab && <>
          <p><strong>Family ID:</strong> <code>{lab.familyId}</code></p>
          <p><strong>Token A:</strong> <code>{getDisplayToken(tokenA)}</code></p>
          <p><strong>Token B:</strong> <code>{getDisplayToken(tokenB)}</code></p>
          <table style={styles.table}>
            <thead><tr style={styles.tableHeader}><th style={styles.th}>Token</th><th style={styles.th}>ID</th><th style={styles.th}>Parent</th><th style={styles.th}>Status</th><th style={styles.th}>Reuse vreme</th></tr></thead>
            <tbody>{lab.tokens?.map((token) => <tr key={token.id}>
              <td style={styles.td}>{token.sequence === 1 ? 'A' : `B${token.sequence > 2 ? token.sequence - 1 : ''}`}</td>
              <td style={styles.td}>{token.id}</td><td style={styles.td}>{token.parentTokenId || '—'}</td>
              <td style={styles.td}><strong>{token.status}</strong></td><td style={styles.td}>{token.reuseDetectedAt || '—'}</td>
            </tr>)}</tbody>
          </table>
          {lab.auditResult && <p><strong>Audit:</strong> {lab.auditResult}</p>}
        </>}
        {labMessage && <p style={styles.warning}>{labMessage}</p>}
      </div>

      <div style={styles.card}>
        <h3>Kontrole</h3>
        <div style={styles.btnRow}>
          <button style={styles.btnPrimary} onClick={runRefresh} disabled={loading}>
            Pokreni refresh
          </button>
          {isUnsafe ? (
            <button style={styles.btnWarning} onClick={runRepeatedUnsafeRefresh} disabled={loading}>
              Dva unsafe refresh-a
            </button>
          ) : (
            <button style={styles.btnSuccess} onClick={runRepeatedProtectedRefresh} disabled={loading}>
              Dva protected refresh-a
            </button>
          )}
          <button style={styles.btnGray} onClick={clearLog} disabled={loading}>
            Ocisti log
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3>Log dogadjaja</h3>
        <div style={styles.logContainer}>
          {log.length === 0 && <p style={styles.emptyLog}>Pokreni refresh demonstraciju...</p>}
          {log.map((entry, index) => (
            <div
              key={index}
              style={{
                ...styles.logEntry,
                color: logColors[entry.type] || '#1a1a2e',
              }}
            >
              <span style={styles.logTime}>[{entry.time}]</span> {entry.message}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h3>Poredjenje rezima</h3>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Rezim</th>
              <th style={styles.th}>Refresh token</th>
              <th style={styles.th}>Rotacija</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>UNSAFE</td>
              <td style={styles.td}>localStorage, dostupan JS-u</td>
              <td style={styles.td}>Ne, isti token se moze koristiti vise puta</td>
            </tr>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <td style={styles.td}>PROTECTED</td>
              <td style={styles.td}>HttpOnly cookie, nije dostupan JS-u</td>
              <td style={styles.td}>Da, backend izdaje novi cookie na refresh</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '32px auto', padding: '0 16px' },
  title: { color: '#4361ee' },
  warning: {
    backgroundColor: '#e8f4fd',
    border: '1px solid #4361ee',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    backgroundColor: '#4361ee',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
  },
  btnSuccess: {
    backgroundColor: '#2d6a4f',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
  },
  btnWarning: {
    backgroundColor: '#f4a261',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
  },
  btnGray: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
  },
  logContainer: {
    backgroundColor: '#1a1a2e',
    padding: '16px',
    borderRadius: '6px',
    minHeight: '200px',
    maxHeight: '400px',
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  logEntry: {
    marginBottom: '4px',
    lineHeight: '1.5',
  },
  logTime: {
    color: '#6c757d',
    fontSize: '11px',
  },
  emptyLog: {
    color: '#6c757d',
    textAlign: 'center',
    marginTop: '60px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeader: {
    backgroundColor: '#1a1a2e',
    color: 'white',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
  },
};

export default RotationDemo;
