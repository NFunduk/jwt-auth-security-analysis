import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  getAccessToken,
  getDisplayToken,
  getUnsafeAccessToken,
  getUnsafeRefreshToken,
} from '../api/tokenStore';
import { useAuth } from '../context/useAuth';

function DashboardPage() {
  const { authMode, user, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const helloResponse = await api.get('/api/protected/hello');
        setMessage(helloResponse.data.message);

        const profileResponse = await api.get('/api/protected/profile');
        setProfile(profileResponse.data);
      } catch {
        setError('Greska pri ucitavanju dashboard podataka.');
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isUnsafe = authMode === 'unsafe';

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h1 style={styles.navTitle}>JWT Auth Demo</h1>
        <div style={styles.navRight}>
          <span
            style={{
              ...styles.modeBadge,
              backgroundColor: isUnsafe ? '#e63946' : '#2d6a4f',
            }}
          >
            {isUnsafe ? 'UNSAFE MODE' : 'PROTECTED MODE'}
          </span>
          <span style={styles.navUser}>{user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Odjavi se
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Demonstracije napada</h2>
        <button
          style={{ ...styles.logoutBtn, backgroundColor: '#e63946', marginRight: '12px' }}
          onClick={() => navigate('/xss-demo')}
        >
          XSS Demo
        </button>

        <button
          style={{ ...styles.logoutBtn, backgroundColor: '#f4a261', marginRight: '12px' }}
          onClick={() => navigate('/csrf-demo')}
        >
          CSRF Demo
        </button>

        <button
          style={{ ...styles.logoutBtn, backgroundColor: '#4361ee', marginRight: '12px' }}
          onClick={() => navigate('/rotation-demo')}
        >
          Rotation Demo
        </button>

        <button
          style={{ ...styles.logoutBtn, backgroundColor: '#6f42c1' }}
          onClick={() => navigate('/replay-demo')}
        >
          Replay laboratorija
        </button>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Zasticen endpoint</h2>
          <p style={styles.message}>{message || 'Ucitavanje...'}</p>
        </div>

        {profile && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Profil</h2>
            <div style={styles.profileItem}>
              <span style={styles.profileLabel}>Username:</span>
              <span>{profile.username}</span>
            </div>
            <div style={styles.profileItem}>
              <span style={styles.profileLabel}>Uloga:</span>
              <span>{profile.roles}</span>
            </div>
            <div style={styles.profileItem}>
              <span style={styles.profileLabel}>Nalog aktivan:</span>
              <span>{profile.accountActive ? 'Da' : 'Ne'}</span>
            </div>
          </div>
        )}

        {isUnsafe ? (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Unsafe localStorage tokeni</h2>
            <p style={styles.note}>
              Access i refresh token su dostupni JavaScript-u kroz namespacovane localStorage kljuceve.
            </p>
            <p style={styles.tokenLabel}>unsafe.accessToken:</p>
            <p style={styles.token}>{getDisplayToken(getUnsafeAccessToken())}</p>
            <p style={styles.tokenLabel}>unsafe.refreshToken:</p>
            <p style={styles.token}>{getDisplayToken(getUnsafeRefreshToken())}</p>
          </div>
        ) : (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Protected storage model</h2>
            <p style={styles.note}>
              Access token je samo u memoriji aplikacije. Refresh token nije dostupan JavaScript-u jer je u HttpOnly cookie-ju.
            </p>
            <p style={styles.tokenLabel}>In-memory access token:</p>
            <p style={styles.token}>{getDisplayToken(getAccessToken())}</p>
            <p style={styles.tokenLabel}>Refresh token:</p>
            <p style={styles.token}>HttpOnly cookie - nije dostupan kroz JavaScript</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
  },
  navbar: {
    backgroundColor: '#1a1a2e',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navTitle: {
    color: 'white',
    margin: 0,
    fontSize: '20px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navUser: {
    color: '#a8dadc',
    fontSize: '14px',
  },
  modeBadge: {
    color: 'white',
    fontSize: '12px',
    fontWeight: '700',
    padding: '6px 10px',
    borderRadius: '6px',
  },
  logoutBtn: {
    backgroundColor: '#e63946',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    maxWidth: '800px',
    margin: '32px auto',
    padding: '0 16px',
  },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  cardTitle: {
    marginTop: 0,
    color: '#1a1a2e',
    borderBottom: '2px solid #f0f2f5',
    paddingBottom: '12px',
  },
  message: {
    fontSize: '18px',
    color: '#2d6a4f',
    fontWeight: '600',
  },
  profileItem: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
    fontSize: '15px',
  },
  profileLabel: {
    fontWeight: '600',
    color: '#555',
    width: '120px',
  },
  tokenLabel: {
    fontWeight: '600',
    color: '#555',
    marginBottom: '4px',
  },
  token: {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: '#f8f9fa',
    padding: '8px',
    borderRadius: '4px',
    wordBreak: 'break-all',
    color: '#4361ee',
    marginBottom: '12px',
  },
  note: {
    color: '#555',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#c0392b',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
  },
};

export default DashboardPage;
