import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import './css/Navbar.css';
import logo from './assets/logo.png';

const Navbar = ({ user, unreadCount }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
<nav className="navbar">
  <div className="navbar-logo-group">
    <img src={logo} alt="logotyp" className="navbar-logo-img" />
    <h3 className="navbar-logo">Peoplemeets</h3>
  </div>
  <div className="navbar-links">
        {user ? (
          <>
            <Link className="navbar-link" to={`/users/${user.uid}`}>Min profil</Link>
            <Link className="navbar-link" id='listusers' to="/users">Användare</Link>
            <Link className="navbar-link" to="/conversations">
              Meddelanden
              {unreadCount > 0 && (
                <span className="navbar-unread">{unreadCount}</span>
              )}
            </Link>
            <Link className="navbar-link" to="/sok">Sök användare</Link>
            <button className="navbar-button" onClick={handleLogout}>Logga ut</button>
          </>
        ) : (
          <>
            <Link className="navbar-link" to="/login">Logga in</Link>
            <Link className="navbar-link" to="/signup">Skapa konto</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
