import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { contestService, timeEntryService } from '../services/api';
import './Contest.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Contest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [activeTab, setActiveTab] = useState('hours');
  const [loading, setLoading] = useState(true);
  const [openEntry, setOpenEntry] = useState(null);
  const [myEntries, setMyEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [entryPhoto, setEntryPhoto] = useState(null);
  const [activityCount, setActivityCount] = useState(1);
  const [activityPhotos, setActivityPhotos] = useState([]);
  const [activityDescriptions, setActivityDescriptions] = useState(['']);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyEntries, setDailyEntries] = useState([]);
  const fileInputRef = useRef(null);
  const activityInputRefs = useRef([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchDailyEntries = useCallback(async () => {
    try {
      const response = await timeEntryService.getDaily(id, selectedDate);
      setDailyEntries(response.data);
    } catch (error) {
      console.error('Error fetching daily entries:', error);
    }
  }, [id, selectedDate]);

  const fetchData = useCallback(async () => {
    try {
      const [contestRes, openRes, myRes, statsRes] = await Promise.all([
        contestService.getById(id),
        timeEntryService.getOpenEntry(id),
        timeEntryService.getMyEntries(id),
        timeEntryService.getStats(id)
      ]);
      setContest(contestRes.data);
      setOpenEntry(openRes.data);
      setMyEntries(myRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyEntries();
    }
  }, [selectedDate, fetchDailyEntries]);

  const handleClockIn = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('contestId', id);
      if (entryPhoto) {
        formData.append('entryPhoto', entryPhoto);
      }
      await timeEntryService.clockIn(formData);
      setEntryPhoto(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al marcar entrada');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!openEntry) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('activityCount', activityCount);
      formData.append('activityDescriptions', JSON.stringify(activityDescriptions));
      activityPhotos.forEach((photo) => {
        if (photo) {
          formData.append('activityPhotos', photo);
        }
      });
      await timeEntryService.clockOut(openEntry._id, formData);
      setActivityCount(1);
      setActivityPhotos([]);
      setActivityDescriptions(['']);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al marcar salida');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivityPhotoChange = (index, file) => {
    const newPhotos = [...activityPhotos];
    newPhotos[index] = file;
    setActivityPhotos(newPhotos);
  };

  const handleActivityDescriptionChange = (index, value) => {
    const newDescriptions = [...activityDescriptions];
    newDescriptions[index] = value;
    setActivityDescriptions(newDescriptions);
  };

  const addActivity = () => {
    setActivityCount(prev => prev + 1);
    setActivityDescriptions(prev => [...prev, '']);
    setActivityPhotos(prev => [...prev, null]);
  };

  const removeActivity = (index) => {
    if (activityCount <= 1) return;
    setActivityCount(prev => prev - 1);
    setActivityDescriptions(prev => prev.filter((_, i) => i !== index));
    setActivityPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTotalHours = () => {
    return myEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0).toFixed(2);
  };

  const chartData = stats ? {
    labels: stats.stats.map(s => s.user.username),
    datasets: [
      {
        label: 'Horas Acumuladas',
        data: stats.stats.map(s => s.totalHours),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1
      },
      {
        label: 'Horas Totales',
        data: stats.stats.map(() => stats.contest.totalHours),
        backgroundColor: 'rgba(200, 200, 200, 0.3)',
        borderColor: 'rgba(200, 200, 200, 1)',
        borderWidth: 1
      }
    ]
  } : null;

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Horas Acumuladas vs Horas Totales'
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: stats?.contest?.totalHours || 100
      }
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!contest) {
    return <div className="error">Concurso no encontrado</div>;
  }

  return (
    <div className="contest-container">
      <div className="contest-header">
        <h1>{contest.name}</h1>
        <p>{contest.description}</p>
        <div className="contest-meta">
          <span>📅 {formatDate(contest.startDate)} - {formatDate(contest.endDate)}</span>
          <span>⏱️ Total: {contest.totalHours} horas</span>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'hours' ? 'active' : ''}`}
          onClick={() => setActiveTab('hours')}
        >
          Control de Horas
        </button>
        <button 
          className={`tab ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Equipo
        </button>
      </div>

      {activeTab === 'hours' && (
        <div className="hours-section">
          <div className="hours-summary">
            <div className="summary-card">
              <h3>Mis Horas</h3>
              <p className="big-number">{getTotalHours()}</p>
              <span>de {contest.totalHours} horas</span>
            </div>
            <div className="summary-card">
              <h3>Entradas</h3>
              <p className="big-number">{myEntries.length}</p>
              <span>registros totales</span>
            </div>
          </div>

          <div className="clock-section">
            {!openEntry ? (
              <div className="clock-in">
                <h3>Marcar Entrada</h3>
                <p>Toma una foto para registrar tu entrada</p>
                <div className="photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setEntryPhoto(e.target.files[0])}
                    ref={fileInputRef}
                  />
                  {entryPhoto && (
                    <div className="photo-preview">
                      <img src={URL.createObjectURL(entryPhoto)} alt="Preview" />
                    </div>
                  )}
                </div>
                <button 
                  className="clock-button entry"
                  onClick={handleClockIn}
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : '📥 MARCAR ENTRADA'}
                </button>
              </div>
            ) : (
              <div className="clock-out">
                <h3>Marcar Salida</h3>
                <p>Entrada registrada: {formatTime(openEntry.entryTime)}</p>
                
                <div className="activities-section">
                  <h4>Actividades realizadas</h4>
                  {[...Array(activityCount)].map((_, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-header">
                        <span>Actividad {index + 1}</span>
                        {activityCount > 1 && (
                          <button 
                            type="button"
                            className="remove-activity"
                            onClick={() => removeActivity(index)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Descripción de la actividad"
                        value={activityDescriptions[index] || ''}
                        onChange={(e) => handleActivityDescriptionChange(index, e.target.value)}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleActivityPhotoChange(index, e.target.files[0])}
                        ref={el => activityInputRefs.current[index] = el}
                      />
                      {activityPhotos[index] && (
                        <div className="photo-preview small">
                          <img src={URL.createObjectURL(activityPhotos[index])} alt="Activity" />
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-activity" onClick={addActivity}>
                    + Agregar otra actividad
                  </button>
                </div>
                
                <button 
                  className="clock-button exit"
                  onClick={handleClockOut}
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : '📤 MARCAR SALIDA'}
                </button>
              </div>
            )}
          </div>

          <div className="entries-history">
            <h3>Historial de Registros</h3>
            {myEntries.length === 0 ? (
              <p className="no-entries">No hay registros aún</p>
            ) : (
              <div className="entries-list">
                {myEntries.map(entry => (
                  <div key={entry._id} className="entry-item">
                    <div className="entry-date">{formatDate(entry.date)}</div>
                    <div className="entry-times">
                      <span>Entrada: {formatTime(entry.entryTime)}</span>
                      {entry.exitTime && <span>Salida: {formatTime(entry.exitTime)}</span>}
                    </div>
                    <div className="entry-hours">
                      {entry.hoursWorked > 0 ? `${entry.hoursWorked.toFixed(2)} horas` : 'En curso'}
                    </div>
                    {entry.activities?.length > 0 && (
                      <div className="entry-activities">
                        {entry.activities.map((activity, i) => (
                          <div key={i} className="activity-preview">
                            {activity.photo && (
                              <img src={`${API_URL}${activity.photo}`} alt={`Actividad ${i+1}`} />
                            )}
                            <span>{activity.description || `Actividad ${i + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="team-section">
          <div className="team-chart">
            <h3>Progreso del Equipo</h3>
            {chartData && (
              <div className="chart-container">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
          </div>

          <div className="team-stats">
            <h3>Estadísticas del Equipo</h3>
            <div className="stats-grid">
              {stats?.stats.map(stat => (
                <div key={stat.user._id} className="stat-card">
                  <div className="stat-user">
                    {stat.user.profilePhoto ? (
                      <img src={`${API_URL}${stat.user.profilePhoto}`} alt={stat.user.username} />
                    ) : (
                      <div className="user-placeholder">
                        {stat.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{stat.user.username}</span>
                  </div>
                  <div className="stat-info">
                    <div className="stat-row">
                      <span>Horas:</span>
                      <strong>{stat.totalHours} / {stats.contest.totalHours}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Porcentaje:</span>
                      <strong>{stat.percentage}%</strong>
                    </div>
                    <div className="stat-row">
                      <span>Constancia:</span>
                      <strong>{stat.consistency}%</strong>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="daily-attendance">
            <h3>Asistencia Diaria</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
            {dailyEntries.length === 0 ? (
              <p className="no-entries">No hay registros para esta fecha</p>
            ) : (
              <div className="daily-list">
                {dailyEntries.map(entry => (
                  <div key={entry._id} className="daily-entry">
                    <div className="daily-user">
                      {entry.user.profilePhoto ? (
                        <img src={`${API_URL}${entry.user.profilePhoto}`} alt={entry.user.username} />
                      ) : (
                        <div className="user-placeholder">
                          {entry.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{entry.user.username}</span>
                    </div>
                    <div className="daily-times">
                      <span>🕐 {formatTime(entry.entryTime)}</span>
                      {entry.exitTime && <span>🕐 {formatTime(entry.exitTime)}</span>}
                    </div>
                    <div className="daily-hours">
                      {entry.hoursWorked > 0 ? `${entry.hoursWorked.toFixed(2)}h` : 'En curso'}
                    </div>
                    {entry.activities?.length > 0 && (
                      <div className="daily-activities">
                        {entry.activities.map((activity, i) => (
                          <div key={i} className="activity-thumb">
                            {activity.photo && (
                              <img src={`${API_URL}${activity.photo}`} alt={`Act ${i+1}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contest;
