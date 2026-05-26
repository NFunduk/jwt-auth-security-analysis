import { useState } from 'react';
import api from '../api/axiosConfig';

function CsrfDemo() {
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('#1a1a2e');

  const simulateCsrfAttack = async () => {
    setResult('Napadač šalje zahtev...');

    try {
      // Napadač šalje zahtev sa tuđe stranice
      // Browser bi automatski poslao cookie ako postoji
      const response = await api.post('/api/auth/transfer-cookie');
      setResult('🚨 CSRF NAPAD USPEO: ' + response.data.message);
      setResultColor('#e63946');
    } catch (err) {
      setResult('❌ Napad neuspešan: ' + (err.response?.data?.error || err.message));
      setResultColor('#2d6a4f');
    }
  };

  const simulateCsrfProtected = async () => {
    setResult('Pokušaj napada na zaštićen endpoint...');

    try {
      // Napadač nema CSRF token — ne može da ga pošalje
      const response = await api.post('/api/auth/transfer-protected');
      setResult('🚨 Napad uspeo: ' + response.data.message);
      setResultColor('#e63946');
    } catch (err) {
      setResult('✅ Napad blokiran: ' + (err.response?.data?.error || err.message));
      setResultColor('#2d6a4f');
    }
  };

  const simulateLegitimateRequest = async () => {
    setResult('Legitimni korisnik šalje zahtev...');

    try {
      // Legitimni korisnik ima CSRF token
      const response = await api.post('/api/auth/transfer-protected', {}, {
        headers: { 'X-CSRF-Token': 'diplomski-csrf-token' }
      });
      setResult('✅ LEGITIMNI ZAHTEV PROŠAO: ' + response.data.message);
      setResultColor('#2d6a4f');
    } catch (err) {
      setResult('Greška: ' + err.message);
      setResultColor('#e63946');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎭 CSRF Demo</h2>

      <div style={styles.warning}>
        ⚠️ Demonstracija CSRF napada — napadač navodi korisnika da pošalje neželjeni zahtev
      </div>

      <div style={styles.card}>
        <h3>Šta je CSRF?</h3>
        <p>
          Cross-Site Request Forgery — napadač kreira stranicu koja automatski
          šalje zahtev na tvoju aplikaciju. Ako korisnik ima aktivan cookie,
          browser ga automatski šalje — bez znanja korisnika.
        </p>
      </div>

      <div style={styles.card}>
        <h3>🔴 Scenario 1 — Endpoint BEZ zaštite</h3>
        <p>Napadač šalje POST zahtev na <code>/api/auth/transfer-cookie</code></p>
        <p>Endpoint ne proverava nikakav CSRF token.</p>
        <button style={styles.btnDanger} onClick={simulateCsrfAttack}>
          💀 Simuliraj CSRF napad
        </button>
      </div>

      <div style={styles.card}>
        <h3>🟡 Scenario 2 — Endpoint SA zaštitom, napadač bez tokena</h3>
        <p>Napadač pokušava napad na <code>/api/auth/transfer-protected</code></p>
        <p>Ne poseduje CSRF token — zahtev treba biti odbijen.</p>
        <button style={styles.btnWarning} onClick={simulateCsrfProtected}>
          🔒 Napad na zaštićen endpoint
        </button>
      </div>

      <div style={styles.card}>
        <h3>🟢 Scenario 3 — Legitimni korisnik SA tokenom</h3>
        <p>Legitimni korisnik šalje zahtev sa ispravnim CSRF tokenom.</p>
        <button style={styles.btnSuccess} onClick={simulateLegitimateRequest}>
          ✅ Legitimni zahtev
        </button>
      </div>

      {result && (
        <div style={{...styles.result, borderColor: resultColor, color: resultColor}}>
          <strong>Rezultat:</strong> {result}
        </div>
      )}

      <div style={styles.card}>
        <h3>📊 Poređenje storage modela</h3>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Storage</th>
              <th style={styles.th}>XSS rizik</th>
              <th style={styles.th}>CSRF rizik</th>
              <th style={styles.th}>Preporuka</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>localStorage</td>
              <td style={{...styles.td, color: '#e63946'}}>🔴 Visok</td>
              <td style={{...styles.td, color: '#2d6a4f'}}>🟢 Nizak</td>
              <td style={styles.td}>Izbegavati za osetljive tokene</td>
            </tr>
            <tr style={{backgroundColor: '#f8f9fa'}}>
              <td style={styles.td}>sessionStorage</td>
              <td style={{...styles.td, color: '#e63946'}}>🔴 Visok</td>
              <td style={{...styles.td, color: '#2d6a4f'}}>🟢 Nizak</td>
              <td style={styles.td}>Bolje od localStorage, ali i dalje rizično</td>
            </tr>
            <tr>
              <td style={styles.td}>HttpOnly Cookie</td>
              <td style={{...styles.td, color: '#2d6a4f'}}>🟢 Nizak</td>
              <td style={{...styles.td, color: '#e63946'}}>🔴 Visok bez zaštite</td>
              <td style={styles.td}>Koristiti sa SameSite + CSRF tokenom</td>
            </tr>
            <tr style={{backgroundColor: '#f8f9fa'}}>
              <td style={styles.td}>HttpOnly + SameSite</td>
              <td style={{...styles.td, color: '#2d6a4f'}}>🟢 Nizak</td>
              <td style={{...styles.td, color: '#f4a261'}}>🟡 Srednji</td>
              <td style={{...styles.td, color: '#2d6a4f', fontWeight: '600'}}>✅ Preporučeno</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '32px auto', padding: '0 16px' },
  title: { color: '#e63946' },
  warning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
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
  btnDanger: {
    backgroundColor: '#e63946',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    marginTop: '8px',
  },
  btnWarning: {
    backgroundColor: '#f4a261',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    marginTop: '8px',
  },
  btnSuccess: {
    backgroundColor: '#2d6a4f',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    marginTop: '8px',
  },
  result: {
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid',
    marginBottom: '24px',
    fontSize: '16px',
    backgroundColor: 'white',
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

export default CsrfDemo;