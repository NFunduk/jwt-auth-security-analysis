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

  const isUnsafe = authMode === 'unsafe';

  const addLog = (message, type = 'info') => {
    setLog((prev) => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const clearLog = () => setLog([]);

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
