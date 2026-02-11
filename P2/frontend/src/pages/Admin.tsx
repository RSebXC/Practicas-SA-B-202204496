/**
 * Página de Administración
 * 
 * Solo accesible para usuarios con rol 'admin'
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { protectedService } from '../services/api';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdminPanel();
  }, []);

  const loadAdminPanel = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await protectedService.getAdminPanel();
      setAdminData(data);
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
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Panel de Administración</h1>
            <p style={styles.subtitle}>Área restringida solo para administradores</p>
          </div>
          <div style={styles.headerButtons}>
            <button onClick={() => navigate('/dashboard')} style={styles.dashboardButton}>
              Volver al Dashboard
            </button>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Información del admin */}
        <div style={styles.adminInfo}>
          <h2 style={styles.sectionTitle}>Información del Administrador</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Nombre</div>
              <div style={styles.infoValue}>{user?.full_name}</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Email</div>
              <div style={styles.infoValue}>{user?.email}</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Rol</div>
              <div style={styles.roleBadge}>ADMINISTRADOR</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>ID</div>
              <div style={styles.infoValue}>{user?.id}</div>
            </div>
          </div>
        </div>

        {/* Permisos */}
        {adminData && (
          <div style={styles.permissionsSection}>
            <h2 style={styles.sectionTitle}>Permisos de Administrador</h2>
            <div style={styles.permissionsGrid}>
              {adminData.data.permissions.map((permission: string) => (
                <div key={permission} style={styles.permissionCard}>
                  <span style={styles.permissionIcon}>✓</span>
                  <span style={styles.permissionText}>{permission}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Funcionalidades de ejemplo */}
        <div style={styles.featuresSection}>
          <h2 style={styles.sectionTitle}>Funcionalidades Administrativas</h2>
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <h3 style={styles.featureTitle}>👥 Gestión de Usuarios</h3>
              <p style={styles.featureDescription}>
                Crear, editar y eliminar usuarios del sistema
              </p>
              <button style={styles.featureButton}>Acceder</button>
            </div>

            <div style={styles.featureCard}>
              <h3 style={styles.featureTitle}>📊 Reportes</h3>
              <p style={styles.featureDescription}>
                Generar reportes y estadísticas del sistema
              </p>
              <button style={styles.featureButton}>Acceder</button>
            </div>

            <div style={styles.featureCard}>
              <h3 style={styles.featureTitle}>⚙️ Configuración</h3>
              <p style={styles.featureDescription}>
                Administrar configuraciones generales
              </p>
              <button style={styles.featureButton}>Acceder</button>
            </div>

            <div style={styles.featureCard}>
              <h3 style={styles.featureTitle}>🔒 Seguridad</h3>
              <p style={styles.featureDescription}>
                Gestionar permisos y roles de usuarios
              </p>
              <button style={styles.featureButton}>Acceder</button>
            </div>
          </div>
        </div>

        {/* Nota de seguridad */}
        <div style={styles.securityNote}>
          <strong>🔐 Nota de Seguridad:</strong> Este panel solo es accesible para usuarios 
          con rol de administrador. Los usuarios con rol de cliente no pueden acceder a esta área.
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
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
    paddingBottom: '20px',
    borderBottom: '3px solid #dc3545'
  },
  headerButtons: {
    display: 'flex',
    gap: '10px'
  },
  title: {
    margin: 0,
    color: '#dc3545',
    fontSize: '32px'
  },
  subtitle: {
    margin: '5px 0 0 0',
    color: '#666',
    fontSize: '14px'
  },
  dashboardButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: '500'
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
  sectionTitle: {
    fontSize: '22px',
    marginBottom: '20px',
    color: '#333',
    borderLeft: '4px solid #dc3545',
    paddingLeft: '15px'
  },
  adminInfo: {
    marginBottom: '40px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  infoCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6c757d',
    marginBottom: '8px',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: '18px',
    color: '#333',
    fontWeight: '500'
  },
  roleBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '700'
  },
  permissionsSection: {
    marginBottom: '40px'
  },
  permissionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  permissionCard: {
    padding: '15px',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  permissionIcon: {
    fontSize: '20px',
    color: '#28a745',
    fontWeight: 'bold'
  },
  permissionText: {
    color: '#155724',
    fontWeight: '500'
  },
  featuresSection: {
    marginBottom: '30px'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  featureCard: {
    padding: '25px',
    backgroundColor: 'white',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    transition: 'all 0.3s'
  },
  featureTitle: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    color: '#333'
  },
  featureDescription: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5'
  },
  featureButton: {
    padding: '8px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  securityNote: {
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    color: '#856404'
  },
  error: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '5px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb'
  }
};