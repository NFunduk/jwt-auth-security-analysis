import { useState } from 'react';

function XssDemo() {
  const [input, setInput] = useState('');
  const [stolenToken, setStolenToken] = useState('');

  // Simulacija XSS napada — napadač ubacuje skriptu
  const simulateXss = () => {
    // Ovo je ono što napadač ubaci u input
    const xssPayload = `<img src=x onerror="
      var token = localStorage.getItem('accessToken');
      var refresh = localStorage.getItem('refreshToken');
      document.getElementById('stolen').innerHTML = 
        '<strong>UKRADENO!</strong><br>Access: ' + token + '<br>Refresh: ' + refresh;
    ">`;
    setInput(xssPayload);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🚨 XSS Demo — Ranjiva stranica</h2>

      <div style={styles.warning}>
        ⚠️ Ova stranica namerno prikazuje XSS ranjivost za demonstraciju!
      </div>

      <div style={styles.card}>
        <h3>Scenario: Komentar sistem bez sanitizacije</h3>
        <p>Korisnik unosi komentar koji se direktno renderuje kao HTML:</p>

        <textarea
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Unesi komentar..."
          rows={4}
        />

        <div style={styles.btnRow}>
          <button style={styles.btnDanger} onClick={simulateXss}>
            💉 Ubaci XSS Payload
          </button>
          <button style={styles.btnNormal} onClick={() => setInput('')}>
            Očisti
          </button>
        </div>

        <div style={styles.section}>
          <h4>Renderovan sadržaj (RANJIVO — dangerouslySetInnerHTML):</h4>
          <div
            style={styles.output}
            dangerouslySetInnerHTML={{ __html: input }}
          />
        </div>

        <div id="stolen" style={styles.stolen}></div>
      </div>

      <div style={styles.card}>
        <h3>✅ Bezbedna verzija (sa sanitizacijom):</h3>
        <div style={styles.safe}>
          {input}
        </div>
        <p style={styles.note}>
          Ovde se input prikazuje kao čist tekst — React automatski escapuje HTML.
        </p>
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
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
  },
  btnRow: { display: 'flex', gap: '12px', margin: '12px 0' },
  btnDanger: {
    backgroundColor: '#e63946',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnNormal: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  section: { marginTop: '16px' },
  output: {
    border: '2px solid #e63946',
    padding: '12px',
    borderRadius: '6px',
    minHeight: '40px',
    backgroundColor: '#fff5f5',
  },
  stolen: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#1a1a2e',
    color: '#e63946',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '12px',
    wordBreak: 'break-all',
    minHeight: '20px',
  },
  safe: {
    border: '2px solid #2d6a4f',
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: '#f0fff4',
    wordBreak: 'break-all',
  },
  note: { color: '#666', fontSize: '14px', marginTop: '8px' },
};

export default XssDemo;