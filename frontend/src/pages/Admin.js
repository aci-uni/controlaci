import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, contestService, notificationService } from '../services/api';
import './Admin.css';

const Admin = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('contests');
  const [users, setUsers] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newContest, setNewContest] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    totalHours: 100
  });
  const [selectedContest, setSelectedContest] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [notification, setNotification] = useState({
    userId: '',
    contestId: '',
    message: '',
    type: 'info'
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, contestsRes] = await Promise.all([
        authService.getUsers(),
        contestService.getAll()
      ]);
      setUsers(usersRes.data);
      setContests(contestsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await contestService.create(newContest);
      setNewContest({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        totalHours: 100
      });
      fetchData();
      alert('Concurso creado exitosamente');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al crear concurso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateContest = async (e) => {
    e.preventDefault();
    if (!selectedContest) return;
    
    setSubmitting(true);
    try {
      await contestService.update(selectedContest._id, selectedContest);
      setSelectedContest(null);
      fetchData();
      alert('Concurso actualizado exitosamente');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al actualizar concurso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedContest || !selectedUser) return;
    
    setSubmitting(true);
    try {
      await contestService.addMember(selectedContest._id, selectedUser);
      setSelectedUser('');
      fetchData();
      // Refresh selected contest
      const updatedContest = await contestService.getById(selectedContest._id);
      setSelectedContest(updatedContest.data);
      alert('Miembro agregado exitosamente');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al agregar miembro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedContest) return;
    
    if (!window.confirm('¿Estás seguro de eliminar este miembro?')) return;
    
    setSubmitting(true);
    try {
      await contestService.removeMember(selectedContest._id, userId);
      fetchData();
      // Refresh selected contest
      const updatedContest = await contestService.getById(selectedContest._id);
      setSelectedContest(updatedContest.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar miembro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await notificationService.send(
        notification.userId,
        notification.message,
        notification.type,
        notification.contestId || null
      );
      setNotification({
        userId: '',
        contestId: '',
        message: '',
        type: 'info'
      });
      alert('Notificación enviada exitosamente');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al enviar notificación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendBulkNotification = async () => {
    if (!selectedContest) return;
    
    const userIds = selectedContest.members.map(m => m._id);
    if (userIds.length === 0) {
      alert('No hay miembros en este concurso');
      return;
    }
    
    setSubmitting(true);
    try {
      await notificationService.sendBulk(
        userIds,
        notification.message,
        notification.type,
        selectedContest._id
      );
      setNotification(prev => ({ ...prev, message: '' }));
      alert(`Notificación enviada a ${userIds.length} miembros`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al enviar notificaciones');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>Solo los administradores pueden acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  const nonMembers = selectedContest 
    ? users.filter(u => !selectedContest.members.some(m => m._id === u._id))
    : users;

  return (
    <div className="admin-container">
      <h1>Panel de Administración</h1>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'contests' ? 'active' : ''}`}
          onClick={() => setActiveTab('contests')}
        >
          Concursos
        </button>
        <button 
          className={`admin-tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Miembros
        </button>
        <button 
          className={`admin-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notificaciones
        </button>
      </div>

      {activeTab === 'contests' && (
        <div className="admin-section">
          <div className="section-card">
            <h2>Crear Nuevo Concurso</h2>
            <form onSubmit={handleCreateContest} className="admin-form">
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={newContest.name}
                  onChange={(e) => setNewContest(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={newContest.description}
                  onChange={(e) => setNewContest(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <input
                    type="date"
                    value={newContest.startDate}
                    onChange={(e) => setNewContest(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Fin</label>
                  <input
                    type="date"
                    value={newContest.endDate}
                    onChange={(e) => setNewContest(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Horas Totales</label>
                <input
                  type="number"
                  value={newContest.totalHours}
                  onChange={(e) => setNewContest(prev => ({ ...prev, totalHours: parseInt(e.target.value) }))}
                  min="1"
                  required
                />
              </div>
              <button type="submit" className="admin-button" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear Concurso'}
              </button>
            </form>
          </div>

          <div className="section-card">
            <h2>Concursos Existentes</h2>
            <div className="contests-list">
              {contests.map(contest => (
                <div key={contest._id} className="contest-list-item">
                  <div className="contest-info">
                    <h3>{contest.name}</h3>
                    <span>{contest.members?.length || 0} miembros • {contest.totalHours} horas</span>
                  </div>
                  <button 
                    className="edit-button"
                    onClick={() => setSelectedContest(contest)}
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedContest && (
            <div className="section-card">
              <h2>Editar: {selectedContest.name}</h2>
              <form onSubmit={handleUpdateContest} className="admin-form">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={selectedContest.name}
                    onChange={(e) => setSelectedContest(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={selectedContest.description || ''}
                    onChange={(e) => setSelectedContest(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha Inicio</label>
                    <input
                      type="date"
                      value={selectedContest.startDate?.split('T')[0] || ''}
                      onChange={(e) => setSelectedContest(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha Fin</label>
                    <input
                      type="date"
                      value={selectedContest.endDate?.split('T')[0] || ''}
                      onChange={(e) => setSelectedContest(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Horas Totales</label>
                  <input
                    type="number"
                    value={selectedContest.totalHours}
                    onChange={(e) => setSelectedContest(prev => ({ ...prev, totalHours: parseInt(e.target.value) }))}
                    min="1"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="admin-button" disabled={submitting}>
                    {submitting ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setSelectedContest(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="admin-section">
          <div className="section-card">
            <h2>Gestionar Miembros</h2>
            
            <div className="form-group">
              <label>Seleccionar Concurso</label>
              <select
                value={selectedContest?._id || ''}
                onChange={(e) => {
                  const contest = contests.find(c => c._id === e.target.value);
                  setSelectedContest(contest || null);
                }}
              >
                <option value="">Selecciona un concurso</option>
                {contests.map(contest => (
                  <option key={contest._id} value={contest._id}>
                    {contest.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedContest && (
              <>
                <div className="add-member-section">
                  <h3>Agregar Miembro</h3>
                  <div className="add-member-form">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Selecciona un usuario</option>
                      {nonMembers.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="admin-button"
                      onClick={handleAddMember}
                      disabled={!selectedUser || submitting}
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                <div className="members-list">
                  <h3>Miembros Actuales ({selectedContest.members?.length || 0})</h3>
                  {selectedContest.members?.length === 0 ? (
                    <p className="no-members">No hay miembros en este concurso</p>
                  ) : (
                    <div className="members-grid">
                      {selectedContest.members?.map(member => (
                        <div key={member._id} className="member-item">
                          <span>{member.username}</span>
                          <button 
                            className="remove-button"
                            onClick={() => handleRemoveMember(member._id)}
                            disabled={submitting}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="section-card">
            <h2>Todos los Usuarios</h2>
            <div className="users-list">
              {users.map(user => (
                <div key={user._id} className="user-item">
                  <span className="user-name">{user.username}</span>
                  <span className={`user-role ${user.role}`}>
                    {user.role === 'admin' ? 'Admin' : 'Usuario'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="admin-section">
          <div className="section-card">
            <h2>Enviar Notificación</h2>
            <form onSubmit={handleSendNotification} className="admin-form">
              <div className="form-group">
                <label>Usuario</label>
                <select
                  value={notification.userId}
                  onChange={(e) => setNotification(prev => ({ ...prev, userId: e.target.value }))}
                  required
                >
                  <option value="">Selecciona un usuario</option>
                  {users.filter(u => u.role !== 'admin').map(user => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Concurso (opcional)</label>
                <select
                  value={notification.contestId}
                  onChange={(e) => setNotification(prev => ({ ...prev, contestId: e.target.value }))}
                >
                  <option value="">Sin concurso específico</option>
                  {contests.map(contest => (
                    <option key={contest._id} value={contest._id}>
                      {contest.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={notification.type}
                  onChange={(e) => setNotification(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="info">Información</option>
                  <option value="success">¡Vas avanzando bien!</option>
                  <option value="warning">Estás retrasado</option>
                  <option value="danger">Urgente</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mensaje</label>
                <textarea
                  value={notification.message}
                  onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Escribe tu mensaje aquí..."
                  required
                />
              </div>
              <button type="submit" className="admin-button" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar Notificación'}
              </button>
            </form>
          </div>

          <div className="section-card">
            <h2>Enviar a Todo el Equipo</h2>
            <div className="form-group">
              <label>Concurso</label>
              <select
                value={selectedContest?._id || ''}
                onChange={(e) => {
                  const contest = contests.find(c => c._id === e.target.value);
                  setSelectedContest(contest || null);
                }}
              >
                <option value="">Selecciona un concurso</option>
                {contests.map(contest => (
                  <option key={contest._id} value={contest._id}>
                    {contest.name} ({contest.members?.length || 0} miembros)
                  </option>
                ))}
              </select>
            </div>
            {selectedContest && (
              <>
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={notification.type}
                    onChange={(e) => setNotification(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="info">Información</option>
                    <option value="success">¡Vas avanzando bien!</option>
                    <option value="warning">Estás retrasado</option>
                    <option value="danger">Urgente</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mensaje</label>
                  <textarea
                    value={notification.message}
                    onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>
                <button 
                  className="admin-button bulk"
                  onClick={handleSendBulkNotification}
                  disabled={!notification.message || submitting}
                >
                  {submitting ? 'Enviando...' : `Enviar a ${selectedContest.members?.length || 0} miembros`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
