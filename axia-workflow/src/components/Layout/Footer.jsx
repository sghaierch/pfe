import React from 'react';

// ✅ FIX : href="#" remplacé par button ou href réel
const FooterLink = ({ children }) => (
  <button
    onClick={() => {}}
    style={{
      display: 'block',
      background: 'none',
      border: 'none',
      padding: '0',
      marginBottom: '10px',
      color: '#475569',
      fontSize: '0.9rem',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'color 0.15s',
    }}
    onMouseOver={e => e.target.style.color = '#818cf8'}
    onMouseOut={e  => e.target.style.color = '#475569'}
  >
    {children}
  </button>
);

const Footer = () => {
  return (
    <footer style={{
      background: '#06080f',
      borderTop: '1px solid rgba(79,70,229,0.15)',
      padding: '48px 24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: '1140px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
        marginBottom: '40px',
      }}>

        {/* Brand */}
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>
            <span style={{ color: '#f1f5f9' }}>Axia</span>
            <span style={{ color: '#818cf8' }}>Workflow</span>
          </div>
          <p style={{
            color: '#475569', fontSize: '0.88rem',
            lineHeight: 1.7, maxWidth: '220px'
          }}>
            La plateforme de gestion de workflows pour les équipes modernes.
          </p>
        </div>

        {/* Produit */}
        <div>
          <h4 style={{
            color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px'
          }}>
            Produit
          </h4>
          {['Fonctionnalités', 'Plans & Tarifs', 'Sécurité', 'Mises à jour'].map(item => (
            <FooterLink key={item}>{item}</FooterLink>
          ))}
        </div>

        {/* Entreprise */}
        <div>
          <h4 style={{
            color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px'
          }}>
            Entreprise
          </h4>
          {['À propos', 'Blog', 'Carrières', 'Contact'].map(item => (
            <FooterLink key={item}>{item}</FooterLink>
          ))}
        </div>

        {/* Support */}
        <div>
          <h4 style={{
            color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px'
          }}>
            Support
          </h4>
          {['Documentation', "Centre d'aide", 'Statut', 'Confidentialité'].map(item => (
            <FooterLink key={item}>{item}</FooterLink>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: '1140px',
        margin: '0 auto',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <p style={{ color: '#334155', fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} Axia Workflow. Tous droits réservés.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Confidentialité', 'CGU', 'Cookies'].map(item => (
            <button
              key={item}
              onClick={() => {}}
              style={{
                background: 'none', border: 'none',
                color: '#334155', fontSize: '0.82rem',
                cursor: 'pointer', padding: 0,
              }}
              onMouseOver={e => e.target.style.color = '#818cf8'}
              onMouseOut={e  => e.target.style.color = '#334155'}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;