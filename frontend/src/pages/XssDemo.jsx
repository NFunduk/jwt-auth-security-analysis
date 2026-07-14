import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/useAuth';

function XssDemo() {
  const { authMode } = useAuth();
  const [input, setInput] = useState('');

  const isUnsafe = authMode === 'unsafe';
  const sanitizedInput = useMemo(() => DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true },
  }), [input]);

  const simulateXss = () => {
    const xssPayload = `<img src=x onerror="
      var access = localStorage.getItem('unsafe.accessToken');
      var refresh = localStorage.getItem('unsafe.refreshToken');
      document.getElementById('stolen').innerHTML =
        '<strong>XSS rezultat</strong><br>' +
        'unsafe.accessToken: ' + (access || 'nije pronadjen') + '<br>' +
        'unsafe.refreshToken: ' + (refresh || 'nije pronadjen');
    ">`;
    setInput(xssPayload);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>XSS Demo - namerno ranjiva stranica</h2>

      <div style={styles.warning}>
        Ova stranica namerno koristi ranjiv HTML prikaz za demonstraciju. Aktivni rezim: {isUnsafe ? 'UNSAFE' : 'PROTECTED'}.
      </div>

      <div style={styles.card}>
        <h3>Scenario: komentar bez sanitizacije</h3>
        <p>
          Unsafe rezim cuva tokene u localStorage-u, pa ih XSS moze procitati. Protected rezim ne cuva refresh token u
          localStorage-u, vec u HttpOnly cookie-ju.
        </p>

        <textarea
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Unesi komentar..."
          rows={4}
        />

        <div style={styles.btnRow}>
          <button style={styles.btnDanger} onClick={simulateXss}>
            Ubaci XSS payload
          </button>
          <button style={styles.btnNormal} onClick={() => setInput('')}>
            Ocisti
          </button>
        </div>

        <div style={styles.section}>
          {isUnsafe ? (
            <>
              <h4>UNSAFE prikaz (RANJIVO - direktan dangerouslySetInnerHTML):</h4>
              <div className="xss-render-output" style={styles.output} dangerouslySetInnerHTML={{ __html: input }} />
            </>
          ) : (
            <>
              <h4>PROTECTED prikaz (DOMPurify sanitizacija pre renderovanja):</h4>
              <div className="xss-render-output" style={styles.protectedOutput} dangerouslySetInnerHTML={{ __html: sanitizedInput }} />
              <p style={styles.note}>
                DOMPurify uklanja izvršive atribute kao što je <code>onerror</code>. Isti HTML može biti prikazan,
                ali payload više ne može da pokrene JavaScript niti da pročita tokene.
              </p>
              <p style={styles.tokenLabel}>Sanitizovani HTML:</p>
              <pre style={styles.sanitizedSource}>{sanitizedInput || 'Nema sadržaja'}</pre>
            </>
          )}
        </div>

        <div id="stolen" style={styles.stolen}></div>
      </div>

      <div style={styles.card}>
        <h3>Ocekivano ponasanje po rezimu</h3>
        {isUnsafe ? (
          <p style={styles.note}>
            UNSAFE: payload moze da procita <code>unsafe.accessToken</code> i <code>unsafe.refreshToken</code>.
          </p>
        ) : (
          <p style={styles.note}>
            PROTECTED: refresh token nije u localStorage-u i nije dostupan JavaScript-u. Access token je u memoriji
            aplikacije i nije izlozen kroz <code>window</code>.
          </p>
        )}
      </div>

      <div style={styles.card}>
        <h3>Bezbedan prikaz istog inputa</h3>
        <div style={styles.safe}>{input}</div>
        <p style={styles.note}>Ovde React prikazuje input kao tekst i escapuje HTML.</p>
      </div>

      <div style={styles.card}>
        <h3>Defense in depth: CSP</h3>
        <p style={styles.note}>
          Content Security Policy može dodatno ograničiti izvore skripti i zabraniti inline JavaScript. CSP nije
          globalno aktiviran u ovoj laboratoriji jer bi blokirao i namerno ranjivi UNSAFE eksperiment. U produkcijskom
          protected deployment-u CSP treba koristiti zajedno sa sanitizacijom, a ne kao njenu zamenu.
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
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#e63946',
    padding: '12px',
    borderRadius: '6px',
    minHeight: '40px',
    backgroundColor: '#fff5f5',
  },
  protectedOutput: {
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#2d6a4f',
    padding: '12px',
    borderRadius: '6px',
    minHeight: '40px',
    backgroundColor: '#f0fff4',
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
  tokenLabel: { fontWeight: '600', color: '#555', marginBottom: '4px' },
  sanitizedSource: {
    backgroundColor: '#1a1a2e',
    color: '#a8dadc',
    padding: '12px',
    borderRadius: '6px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  note: { color: '#666', fontSize: '14px', marginTop: '8px', lineHeight: '1.5' },
};

export default XssDemo;
