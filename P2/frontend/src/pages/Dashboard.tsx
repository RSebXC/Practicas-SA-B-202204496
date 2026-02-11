/**
 * Página de Dashboard
 * 
 * Accesible para Admin y Cliente
 * Muestra información del usuario y permite acceder a recursos
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { protectedService } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await protectedService.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Información del usuario */}
        <div style={styles.userInfo}>
          <h2 style={styles.subtitle}>Información del Usuario</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>Nombre:</strong> {user?.full_name}
            </div>
            <div style={styles.infoItem}>
              <strong>Usuario:</strong> {user?.username}
            </div>
            <div style={styles.infoItem}>
              <strong>Email:</strong> {user?.email}
            </div>
            <div style={styles.infoItem}>
              <strong>Rol:</strong> 
              <span style={{
                ...styles.badge,
                backgroundColor: user?.role === 'admin' ? '#dc3545' : '#28a745'
              }}>
                {user?.role === 'admin' ? 'Administrador' : 'Cliente'}
              </span>
            </div>
          </div>
        </div>

        {/* Datos del dashboard */}
        {dashboardData && (
          <div style={styles.dashboardInfo}>
            <h2 style={styles.subtitle}>Acceso al Dashboard</h2>
            <div style={styles.accessInfo}>
              <p><strong>Nivel de acceso:</strong> {dashboardData.data.accessLevel}</p>
              <div style={styles.permissions}>
                <strong>Permisos:</strong>
                <div style={styles.permissionsList}>
                  {dashboardData.data.permissions.map((perm: string) => (
                    <span key={perm} style={styles.permissionBadge}>
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div style={styles.actions}>
          {user?.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin')} 
              style={styles.adminButton}
            >
              Ir al Panel de Administración
            </button>
          )}
        </div>

        {/* Información adicional */}
        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>ℹ️ Información de Seguridad</h3>
          <ul style={styles.infoList}>
            <li>Tu sesión está protegida con JWT (JSON Web Token)</li>
            <li>El token se almacena en cookies HttpOnly (no accesibles desde JavaScript)</li>
            <li>Tus datos están encriptados con AES-256</li>
            <li>El token expira en 15 minutos de inactividad</li>
            <li>Se renueva automáticamente si sigue activo</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: '900px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #eee'
  },
  title: {
    margin: 0,
    color: '#333'
  },
  subtitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#555'
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  userInfo: {
    marginBottom: '30px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  infoItem: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '10px'
  },
  dashboardInfo: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '8px'
  },
  accessInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  permissions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  permissionsList: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  permissionBadge: {
    padding: '6px 14px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '5px',
    fontSize: '14px'
  },
  actions: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px'
  },
  adminButton: {
    padding: '12px 24px',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '16px'
  },
  error: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '5px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb'
  },
  infoBox: {
    backgroundColor: '#d1ecf1',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #bee5eb'
  },
  infoTitle: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#0c5460'
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#0c5460'
  }
};