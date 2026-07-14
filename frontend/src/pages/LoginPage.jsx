import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { authMode, changeAuthMode, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setError('Pogrešan username ili lozinka.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Prijava</h2>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.modeBox}>
          <button
            type="button"
            style={{
              ...styles.modeButton,
              ...(authMode === 'protected' ? styles.modeButtonActive : {}),
            }}
            onClick={() => changeAuthMode('protected')}
          >
            Protected mode
          </button>
          <button
            type="button"
            style={{
              ...styles.modeButton,
              ...(authMode === 'unsafe' ? styles.modeButtonUnsafe : {}),
            }}
            onClick={() => changeAuthMode('unsafe')}
          >
            Unsafe mode
          </button>
        </div>

        <p style={styles.modeNote}>
          {authMode === 'unsafe'
            ? 'Tokeni su u localStorage-u i dostupni JavaScript-u. Ovo je namerno ranjiv eksperimentalni rezim.'
            : 'Access token je u memoriji, refresh token je HttpOnly cookie, a refresh koristi rotaciju.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Unesite username"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Lozinka</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Unesite lozinku"
              required
            />
          </div>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Prijavljivanje...' : 'Prijavi se'}
          </button>
        </form>

        <p style={styles.link}>
          Nemate nalog?{' '}
          <Link to="/register">Registrujte se</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg)',
    padding: '24px',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    padding: 'clamp(28px, 5vw, 44px)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--color-border)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '24px',
    color: 'var(--color-primary)',
  },
  field: {
    marginBottom: '16px',
  },
  modeBox: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '10px',
  },
  modeButton: {
    padding: '10px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-surface-muted)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontWeight: '600',
  },
  modeButtonActive: {
    backgroundColor: 'var(--color-primary)',
    borderColor: 'var(--color-primary)',
    color: 'white',
  },
  modeButtonUnsafe: {
    backgroundColor: 'var(--color-danger)',
    borderColor: 'var(--color-danger)',
    color: 'white',
  },
  modeNote: {
    fontSize: '13px',
    lineHeight: '1.4',
    color: 'var(--color-muted)',
    backgroundColor: 'var(--color-surface-muted)',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: 'var(--color-text)',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    backgroundColor: 'var(--color-soft-danger)',
    color: '#754235',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  link: {
    textAlign: 'center',
    marginTop: '16px',
    color: 'var(--color-muted)',
  },
};

export default LoginPage;
