import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return password.length >= minLength && hasUpperCase && hasNumber;
  };

const handleSignup = async (e) => {
  e.preventDefault();

  const trimmedName = name.trim();
  const lowerCaseName = trimmedName.toLowerCase();

  if (!validatePassword(password)) {
    alert("Lösenordet måste vara minst 8 tecken långt, innehålla minst en stor bokstav och en siffra.");
    return;
  }

const q = query(collection(db, "users"), where("nameLower", "==", lowerCaseName));
const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    alert("Användarnamnet är redan taget, välj ett annat.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      name: trimmedName,
      nameLower: lowerCaseName,
      profileText: '',
      photoURL: '',
      email: email,
      createdAt: serverTimestamp(),
    });

    await sendEmailVerification(user);
    alert('Ett verifieringsmail har skickats. Klicka på länken i mailet.');

    await signOut(auth);

    navigate('/login');
  } catch (error) {
    console.error('Fel vid skapande av konto:', error.message);
    alert('Fel vid skapande av konto: ' + error.message);
  }
};

  return (
    <form onSubmit={handleSignup}>
      <h2>Skapa konto</h2>
      <input type="text" placeholder="Namn" value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="email" placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Lösenord" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Skapa konto</button>
    </form>
  );
};

export default Signup;
