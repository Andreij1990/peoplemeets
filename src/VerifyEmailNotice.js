import React from 'react';
import { Link } from 'react-router-dom';

const VerifyEmailNotice = () => {
  return (
    <div style={styles.container}>
      <h2>Verifiera din e-postadress</h2>
      <p>
        Ett verifieringsmail har skickats till din inkorg. Klicka på länken i mailet för att aktivera ditt konto.
      </p>
      <p>
        När du har verifierat din e-post kan du <Link to="/login">logga in här</Link>.
      </p>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
};

export default VerifyEmailNotice;
