import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, contestService, timeEntryService } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [contests, setContests] = useState([]);
  const [contestHours, setContestHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newPhoto, setNewPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchData = useCallback(async () => {
    try {
      const contestsRes = await contestService.getMy();
      setContests(contestsRes.data);

      // Fetch hours for each contest
      const hoursPromises = contestsRes.data.map(async (contest) => {
        const statsRes = await timeEntryService.getStats(contest._id);
        const userStats = statsRes.data.stats.find(s => s.user._id === user._id);
        return {
          contestId: contest._id,
          hours: userStats?.totalHours || 0,
          percentage: userStats?.percentage || 0,
          consistency: userStats?.consistency || 0
        };
      });

      const hoursResults = await Promise.all(hoursPromises);
      const hoursMap = {};
      hoursResults.forEach(result => {
        hoursMap[result.contestId] = result;
      });
      setContestHours(hoursMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setNewPhoto(e.target.files[0]);
    }
  };

  const handleSavePhoto = async () => {
    if (!newPhoto) return;
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('profilePhoto', newPhoto);
      
      const response = await authService.updateProfile(formData);
      updateUser(response.data);
      setNewPhoto(null);
      setEditing(false);
    } catch (error) {
      alert('Error al guardar la foto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-photo-section">
            {editing ? (
              <div className="photo-edit">
                {newPhoto ? (
                  <img src={URL.createObjectURL(newPhoto)} alt="Nueva foto" />
                ) : user.profilePhoto ? (
                  <img src={`${API_URL}${user.profilePhoto}`} alt="Perfil" />
                ) : (
                  <div className="photo-placeholder large">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  ref={fileInputRef}
                  className="photo-input"
                />
                <div className="photo-actions">
                  <button onClick={handleSavePhoto} disabled={!newPhoto || saving}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button onClick={() => { setEditing(false); setNewPhoto(null); }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="photo-display" onClick={() => setEditing(true)}>
                {user.profilePhoto ? (
                  <img src={`${API_URL}${user.profilePhoto}`} alt="Perfil" />
                ) : (
                  <div className="photo-placeholder large">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="edit-hint">Clic para cambiar foto</span>
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1>{user.username}</h1>
            <span className="role-badge">{user.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
          </div>
        </div>

        <div className="profile-contests">
          <h2>Horas por Concurso</h2>
          {contests.length === 0 ? (
            <div className="no-contests">
              <p>No estás inscrito</p>
              <span>Espera a que el administrador te asigne a un concurso</span>
            </div>
          ) : (
            <div className="contests-list">
              {contests.map(contest => {
                const hours = contestHours[contest._id] || {};
                return (
                  <div key={contest._id} className="contest-hours-card">
                    <div className="contest-name">{contest.name}</div>
                    <div className="hours-info">
                      <div className="hours-row">
                        <span>Horas:</span>
                        <strong>{hours.hours?.toFixed(2) || 0} / {contest.totalHours}</strong>
                      </div>
                      <div className="hours-row">
                        <span>Porcentaje:</span>
                        <strong>{hours.percentage?.toFixed(2) || 0}%</strong>
                      </div>
                      <div className="hours-row">
                        <span>Constancia:</span>
                        <strong>{hours.consistency?.toFixed(2) || 0}%</strong>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${Math.min(hours.percentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
