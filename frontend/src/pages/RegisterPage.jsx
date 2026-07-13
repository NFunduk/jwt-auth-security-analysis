import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { authMode, changeAuthMode, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri registraciji.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Registracija</h2>

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
            ? 'Tokeni se cuvaju u localStorage-u i dostupni su JavaScript-u za XSS demonstraciju.'
            : 'Access token ostaje u memoriji, a refresh token se cuva u HttpOnly cookie-ju.'}
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
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Unesite email"
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
              placeholder="Minimum 6 karaktera"
              required
            />
          </div>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Registrovanje...' : 'Registruj se'}
          </button>
        </form>

        <p style={styles.link}>
          Već imate nalog?{' '}
          <Link to="/login">Prijavite se</Link>
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
    backgroundColor: '#f0f2f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#1a1a2e',
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
    border: '1px solid #ddd',
    backgroundColor: '#f8f9fa',
    color: '#333',
    cursor: 'pointer',
    fontWeight: '600',
  },
  modeButtonActive: {
    backgroundColor: '#2d6a4f',
    borderColor: '#2d6a4f',
    color: 'white',
  },
  modeButtonUnsafe: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
    color: 'white',
  },
  modeNote: {
    fontSize: '13px',
    lineHeight: '1.4',
    color: '#555',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4361ee',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#c0392b',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  link: {
    textAlign: 'center',
    marginTop: '16px',
    color: '#666',
  },
};

export default RegisterPage;
