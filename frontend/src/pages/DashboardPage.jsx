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
    <div className="dashboard-page" style={styles.container}>
      <div className="dashboard-navbar" style={styles.navbar}>
        <h1 style={styles.navTitle}>JWT Auth Demo</h1>
        <div className="dashboard-nav-actions" style={styles.navRight}>
          <span
            style={{
              ...styles.modeBadge,
              backgroundColor: isUnsafe ? 'var(--color-danger)' : 'var(--color-primary)',
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

      <div className="dashboard-lab-nav" style={styles.card}>
        <h2 style={styles.cardTitle}>Demonstracije napada</h2>
        <button
          style={{ ...styles.logoutBtn, backgroundColor: 'var(--color-danger)', marginRight: '12px' }}
          onClick={() => navigate('/xss-demo')}
        >
          XSS Demo
        </button>

        <button
          style={{ ...styles.logoutBtn, backgroundColor: 'var(--color-info)', marginRight: '12px' }}
          onClick={() => navigate('/csrf-demo')}
        >
          CSRF Demo
        </button>

        <button
          style={{ ...styles.logoutBtn, backgroundColor: 'var(--color-primary)', marginRight: '12px' }}
          onClick={() => navigate('/rotation-demo')}
        >
          Rotation Demo
        </button>

        <button
          style={{ ...styles.logoutBtn, backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}
          onClick={() => navigate('/replay-demo')}
        >
          Replay laboratorija
        </button>
      </div>

      <div className="dashboard-content" style={styles.content}>
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
    backgroundColor: 'var(--color-bg)',
  },
  navbar: {
    backgroundColor: 'var(--color-primary)',
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
    color: '#f7f1e6',
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
    backgroundColor: 'var(--color-danger)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    maxWidth: '960px',
    margin: '32px auto',
    padding: '0 16px',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--color-border)',
    marginBottom: '24px',
  },
  cardTitle: {
    marginTop: 0,
    color: 'var(--color-primary)',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '12px',
  },
  message: {
    fontSize: '18px',
    color: 'var(--color-primary)',
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
    color: 'var(--color-muted)',
    width: '120px',
  },
  tokenLabel: {
    fontWeight: '600',
    color: 'var(--color-muted)',
    marginBottom: '4px',
  },
  token: {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: 'var(--color-surface-muted)',
    padding: '8px',
    borderRadius: '4px',
    wordBreak: 'break-all',
    color: 'var(--color-primary)',
    marginBottom: '12px',
  },
  note: {
    color: 'var(--color-muted)',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  error: {
    backgroundColor: 'var(--color-soft-danger)',
    color: '#754235',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
  },
};

export default DashboardPage;
