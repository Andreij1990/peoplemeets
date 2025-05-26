import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showResend, setShowResend] = useState(false);
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      localStorage.setItem('resendEmail', email);
      localStorage.setItem('resendPassword', password);

      alert('Du måste verifiera din e-post innan du loggar in.');
      setShowResend(true);
      await signOut(auth);
      return;
    }

    navigate('/profile');
    localStorage.removeItem('resendEmail');
localStorage.removeItem('resendPassword');
  } catch (error) {
    console.error('Fel vid inloggning:', error.message);
    alert('Fel vid inloggning: ' + error.message);
  }
};

const resendVerification = async () => {
  const resendEmail = localStorage.getItem('resendEmail');
  const resendPassword = localStorage.getItem('resendPassword');

  if (!resendEmail || !resendPassword) {
    alert('Inloggningsuppgifter saknas. Försök logga in igen.');
    return;
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, resendEmail, resendPassword);
    const user = credential.user;

    if (user.emailVerified) {
      alert('E-postadressen är redan verifierad.');
      localStorage.removeItem('resendEmail');
      localStorage.removeItem('resendPassword');
      return;
    }

    await sendEmailVerification(user);
    alert('Verifieringsmail skickades igen.');
    await signOut(auth);
  } catch (error) {
    console.error('Fel vid skickande av verifieringsmail:', error.message);
    alert('Det gick inte att skicka verifieringsmail: ' + error.message);
  }
};

  return (
    <form onSubmit={handleLogin}>
      <h2>Logga in</h2>
      <p>Har du inget konto? <Link to="/signup">Skapa konto här</Link></p>

      <input
        type="email"
        placeholder="E-post"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit">Logga in</button>

{showResend && (
  <div style={{ marginTop: '1em' }}>
    <p>Fick du inget verifieringsmail?</p>
    <button type="button" onClick={resendVerification}>
      Skicka verifieringsmail igen
    </button>
  </div>
)}
    </form>
  );
};

export default Login;
