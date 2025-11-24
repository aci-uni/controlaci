import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch {
      // Ignore errors
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Control de Horas</Link>
      </div>
      
      <div className="navbar-links">
        <Link to="/" className="nav-link">Concursos</Link>
        {isAdmin && <Link to="/admin" className="nav-link admin-link">Admin</Link>}
      </div>

      <div className="navbar-profile">
        <div className="profile-trigger" onClick={() => setShowMenu(!showMenu)}>
          {user.profilePhoto ? (
            <img 
              src={`${API_URL}${user.profilePhoto}`} 
              alt="Perfil" 
              className="profile-photo"
            />
          ) : (
            <div className="profile-placeholder">
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="username">{user.username}</span>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>

        {showMenu && (
          <div className="profile-menu">
            <Link to="/profile" onClick={() => setShowMenu(false)}>
              Mi Perfil
            </Link>
            <Link to="/notifications" onClick={() => setShowMenu(false)}>
              Notificaciones {unreadCount > 0 && `(${unreadCount})`}
            </Link>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
