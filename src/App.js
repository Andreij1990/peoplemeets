import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Chat from './Chat';
import Signup from './Signup';
import Login from './Login';
import UserProfile from './UserProfile';
import UserList from './UserList';
import Navbar from './Navbar';
import ConversationList from './ConversationList';
import SearchUsers from './SearchUsers';
import VerifyEmailNotice from './VerifyEmailNotice';
import './css/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

useEffect(() => {
  if (!user) return;

  const docRef = doc(db, 'users', user.uid);

  updateDoc(docRef, {
    lastActive: serverTimestamp()
  }).catch(console.error);

  const interval = setInterval(() => {
    updateDoc(docRef, {
      lastActive: serverTimestamp()
    }).catch(console.error);
  }, 300000);

  return () => clearInterval(interval);

}, [user]);




  if (loading) return <p>Laddar app...</p>;

  return (
    <Router basename="/peoplemeets">
      <Navbar user={user} unreadCount={unreadCount} />
            <div className="app-container">
      <Routes>
        <Route path="/conversations" element={user ? <ConversationList currentUser={user} setUnreadCount={setUnreadCount} /> : <Navigate to="/login" />} />
        <Route path="/chat/:id" element={user ? <Chat currentUser={user} /> : <Navigate to="/login" />} />
        <Route path="/sok" element={<SearchUsers />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile"
          element={user ? <Navigate to={`/users/${user.uid}`} /> : <Navigate to="/login" />}
        />
        <Route
          path="/users"
          element={user ? <UserList /> : <Navigate to="/login" />}
        />
        <Route
          path="/users/:id"
          element={user ? <UserProfile /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={user ? `/users/${user.uid}` : "/login"} />} />
        <Route path="/verify-email" element={<VerifyEmailNotice />} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;
