import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contestService } from '../services/api';
import './Home.css';

const Home = () => {
  const { user, isAdmin } = useAuth();
  const [contests, setContests] = useState([]);
  const [myContests, setMyContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const [allResponse, myResponse] = await Promise.all([
        contestService.getAll(),
        contestService.getMy()
      ]);
      setContests(allResponse.data);
      setMyContests(myResponse.data);
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isMember = (contest) => {
    return myContests.some(c => c._id === contest._id);
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Bienvenido, {user?.username}</h1>
        <p>Concursos activos disponibles</p>
      </div>

      {myContests.length === 0 && (
        <div className="no-contests-message">
          <h3>No estás inscrito en ningún concurso</h3>
          <p>Espera a que el administrador te asigne a un concurso para comenzar a registrar tus horas.</p>
        </div>
      )}

      <div className="contests-section">
        <h2>Mis Concursos</h2>
        <div className="contests-grid">
          {myContests.map(contest => (
            <Link to={`/contest/${contest._id}`} key={contest._id} className="contest-card member">
              <div className="contest-badge">Inscrito</div>
              <h3>{contest.name}</h3>
              <p className="contest-description">{contest.description || 'Sin descripción'}</p>
              <div className="contest-info">
                <span>📅 {formatDate(contest.startDate)} - {formatDate(contest.endDate)}</span>
                <span>⏱️ {contest.totalHours} horas totales</span>
                <span>👥 {contest.members?.length || 0} miembros</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="contests-section">
          <h2>Todos los Concursos</h2>
          <div className="contests-grid">
            {contests.filter(c => !isMember(c)).map(contest => (
              <div key={contest._id} className="contest-card disabled">
                <h3>{contest.name}</h3>
                <p className="contest-description">{contest.description || 'Sin descripción'}</p>
                <div className="contest-info">
                  <span>📅 {formatDate(contest.startDate)} - {formatDate(contest.endDate)}</span>
                  <span>⏱️ {contest.totalHours} horas totales</span>
                  <span>👥 {contest.members?.length || 0} miembros</span>
                </div>
                <p className="access-note">Solo disponible para miembros asignados</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
