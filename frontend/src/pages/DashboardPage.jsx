import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHello();
    fetchProfile();
  }, []);

  const fetchHello = async () => {
    try {
      const response = await api.get('/api/protected/hello');
      setMessage(response.data.message);
    } catch (err) {
      setError('Greška pri učitavanju poruke.');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/protected/profile');
      setProfile(response.data);
    } catch (err) {
      setError('Greška pri učitavanju profila.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h1 style={styles.navTitle}>JWT Auth Demo</h1>
        <div style={styles.navRight}>
          <span style={styles.navUser}>👤 {user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Odjavi se
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🧪 Demonstracije napada</h2>
        <button
          style={{...styles.logoutBtn, backgroundColor: '#e63946', marginRight: '12px'}}
          onClick={() => navigate('/xss-demo')}
        >
          💉 XSS Demo
        </button>

        <button
          style={{...styles.logoutBtn, backgroundColor: '#f4a261'}}
          onClick={() => navigate('/csrf-demo')}
        >
          🎭 CSRF Demo
        </button>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>✅ Zaštićen endpoint</h2>
          <p style={styles.message}>{message || 'Učitavanje...'}</p>
        </div>

        {profile && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>👤 Profil</h2>
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
              <span>{profile.accountActive ? '✅ Da' : '❌ Ne'}</span>
            </div>
          </div>
        )}

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🔑 Tokeni u localStorage</h2>
          <p style={styles.tokenLabel}>Access Token:</p>
          <p style={styles.token}>
            {localStorage.getItem('accessToken')?.substring(0, 50)}...
          </p>
          <p style={styles.tokenLabel}>Refresh Token:</p>
          <p style={styles.token}>{localStorage.getItem('refreshToken')}</p>
        </div>
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
  error: {
    backgroundColor: '#ffe0e0',
    color: '#c0392b',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
  },
};

export default DashboardPage;