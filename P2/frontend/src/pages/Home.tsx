/**
 * Página de Inicio (Landing Page)
 * 
 * Página pública que muestra información y enlaces de login/registro
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Sistema de Autenticación JWT</h1>
        <p style={styles.subtitle}>
          Sistema seguro con autenticación JWT, cookies HttpOnly y encriptación AES
        </p>

        {user ? (
          <div style={styles.userSection}>
            <p style={styles.welcomeText}>
              Bienvenido, <strong>{user.full_name}</strong>!
            </p>
            <div style={styles.buttonGroup}>
              <button 
                onClick={() => navigate('/dashboard')} 
                style={styles.primaryButton}
              >
                Ir al Dashboard
              </button>
              {user.role === 'admin' && (
                <button 
                  onClick={() => navigate('/admin')} 
                  style={styles.adminButton}
                >
                  Panel de Administración
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={styles.buttonGroup}>
            <button 
              onClick={() => navigate('/login')} 
              style={styles.primaryButton}
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => navigate('/register')} 
              style={styles.secondaryButton}
            >
              Registrarse
            </button>
          </div>
        )}
      </div>

      <div style={styles.features}>
        <h2 style={styles.featuresTitle}>Características de Seguridad</h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <div style={styles.icon}>🔐</div>
            <h3 style={styles.featureCardTitle}>JWT Authentication</h3>
            <p style={styles.featureCardText}>
              Autenticación segura mediante JSON Web Tokens con tiempo de expiración configurable
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>🍪</div>
            <h3 style={styles.featureCardTitle}>HttpOnly Cookies</h3>
            <p style={styles.featureCardText}>
              Tokens almacenados en cookies HttpOnly, inaccesibles desde JavaScript del navegador
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>🔒</div>
            <h3 style={styles.featureCardTitle}>Encriptación AES</h3>
            <p style={styles.featureCardText}>
              Datos sensibles encriptados con AES-256 para máxima seguridad
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>🔄</div>
            <h3 style={styles.featureCardTitle}>Renovación Automática</h3>
            <p style={styles.featureCardText}>
              Los tokens se renuevan automáticamente dentro de la ventana de tiempo configurada
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>👥</div>
            <h3 style={styles.featureCardTitle}>Sistema de Roles</h3>
            <p style={styles.featureCardText}>
              Control de acceso basado en roles: Administrador y Cliente
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>🛡️</div>
            <h3 style={styles.featureCardTitle}>Protección CSRF</h3>
            <p style={styles.featureCardText}>
              Cookies con SameSite=strict para protección contra ataques CSRF
            </p>
          </div>
        </div>
      </div>

      <div style={styles.techStack}>
        <h2 style={styles.techTitle}>Stack Tecnológico</h2>
        <div style={styles.techGrid}>
          <div style={styles.techItem}>
            <strong>Backend:</strong> Node.js + Express + TypeScript
          </div>
          <div style={styles.techItem}>
            <strong>Frontend:</strong> React + TypeScript + Vite
          </div>
          <div style={styles.techItem}>
            <strong>Base de Datos:</strong> PostgreSQL
          </div>
          <div style={styles.techItem}>
            <strong>Autenticación:</strong> JWT + bcrypt
          </div>
          <div style={styles.techItem}>
            <strong>Encriptación:</strong> AES-256 (crypto-js)
          </div>
          <div style={styles.techItem}>
            <strong>Seguridad:</strong> HttpOnly Cookies + CORS
          </div>
        </div>
      </div>

      <footer style={styles.footer}>
        <p>Práctica 2 - Software Avanzado - USAC 2026</p>
        <p style={styles.footerNote}>
          Desarrollado por: Rodrigo Sebastian Castro Aguilar - 202204496
        </p>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  },
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '80px 20px',
    textAlign: 'center'
  },
  title: {
    fontSize: '48px',
    margin: '0 0 20px 0',
    fontWeight: '700'
  },
  subtitle: {
    fontSize: '20px',
    margin: '0 0 40px 0',
    opacity: 0.9,
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  userSection: {
    marginTop: '30px'
  },
  welcomeText: {
    fontSize: '24px',
    marginBottom: '20px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: '600',
    backgroundColor: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  secondaryButton: {
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  adminButton: {
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: '600',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  features: {
    maxWidth: '1200px',
    margin: '60px auto',
    padding: '0 20px'
  },
  featuresTitle: {
    fontSize: '36px',
    textAlign: 'center',
    marginBottom: '40px',
    color: '#333'
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px'
  },
  featureCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.3s'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  featureCardTitle: {
    fontSize: '20px',
    marginBottom: '10px',
    color: '#333'
  },
  featureCardText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6'
  },
  techStack: {
    backgroundColor: 'white',
    padding: '60px 20px',
    marginTop: '60px'
  },
  techTitle: {
    fontSize: '36px',
    textAlign: 'center',
    marginBottom: '40px',
    color: '#333'
  },
  techGrid: {
    maxWidth: '900px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  techItem: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #667eea',
    fontSize: '16px',
    color: '#333'
  },
  footer: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '30px 20px',
    textAlign: 'center',
    marginTop: '60px'
  },
  footerNote: {
    opacity: 0.8,
    fontSize: '14px',
    marginTop: '10px'
  }
};