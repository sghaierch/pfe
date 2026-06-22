import React from 'react';

const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconGithub = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);
const IconTwitter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconLinkedin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const FOOTER_LINKS = {
  Produit:    ['Fonctionnalités', 'Plans & Tarifs', 'Sécurité', 'Nouveautés'],
  Entreprise: ['À propos', 'Blog', 'Carrières', 'Contact'],
  Support:    ['Documentation', "Centre d'aide", 'Statut système', 'Confidentialité'],
};

const SOCIAL = [
  { icon: <IconGithub />,   label: 'GitHub' },
  { icon: <IconTwitter />,  label: 'Twitter' },
  { icon: <IconLinkedin />, label: 'LinkedIn' },
];

const Footer = () => {
  return (
    <>
      <style>{`
        .axia-footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; font-family: 'Inter', -apple-system, sans-serif; padding: 56px 0 0; }
        .axia-footer-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
        .axia-footer-grid { display: grid; grid-template-columns: 1.8fr repeat(3, 1fr); gap: 48px; padding-bottom: 48px; }
        .axia-footer-logo-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .axia-footer-logo-icon { width: 28px; height: 28px; border-radius: 7px; background: #2563EB; display: flex; align-items: center; justify-content: center; color: #fff; }
        .axia-footer-logo-text { font-size: 15px; font-weight: 800; color: #0F172A; }
        .axia-footer-logo-text span { color: #2563EB; }
        .axia-footer-desc { color: #64748B; font-size: 14px; line-height: 1.7; margin-bottom: 20px; max-width: 220px; }
        .axia-footer-socials { display: flex; gap: 8px; }
        .axia-footer-social-btn { width: 34px; height: 34px; border-radius: 8px; background: #fff; border: 1.5px solid #E2E8F0; display: flex; align-items: center; justify-content: center; color: #94A3B8; cursor: pointer; transition: all 0.15s; }
        .axia-footer-social-btn:hover { color: #2563EB; border-color: #BFDBFE; background: #EFF6FF; }
        .axia-footer-col-title { font-size: 12px; font-weight: 700; color: #2563EB; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
        .axia-footer-link { display: block; background: none; border: none; padding: 0; margin-bottom: 11px; color: #64748B; font-size: 14px; cursor: pointer; text-align: left; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .axia-footer-link:hover { color: #2563EB; }
        .axia-footer-bottom { border-top: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px 0; }
        .axia-footer-copy { color: #94A3B8; font-size: 13px; }
        .axia-footer-legal { display: flex; gap: 20px; }
        .axia-footer-legal-btn { background: none; border: none; color: #94A3B8; font-size: 13px; cursor: pointer; padding: 0; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .axia-footer-legal-btn:hover { color: #2563EB; }
        @media (max-width: 768px) { .axia-footer-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .axia-footer-grid { grid-template-columns: 1fr; } }
      `}</style>

      <footer className="axia-footer">
        <div className="axia-footer-inner">
          <div className="axia-footer-grid">
            {/* Brand */}
            <div>
              <div className="axia-footer-logo-row">
                <div className="axia-footer-logo-icon"><IconZap /></div>
                <span className="axia-footer-logo-text">Axia<span>Workflow</span></span>
              </div>
              <p className="axia-footer-desc">
                La plateforme de gestion de workflows pour les équipes modernes. Simple, rapide, sécurisée.
              </p>
              <div className="axia-footer-socials">
                {SOCIAL.map(({ icon, label }) => (
                  <button key={label} className="axia-footer-social-btn" aria-label={label}>{icon}</button>
                ))}
              </div>
            </div>

            {/* Columns */}
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <div className="axia-footer-col-title">{section}</div>
                {links.map(item => (
                  <button key={item} className="axia-footer-link">{item}</button>
                ))}
              </div>
            ))}
          </div>

          <div className="axia-footer-bottom">
            <p className="axia-footer-copy">© {new Date().getFullYear()} Axia Workflow · Tous droits réservés.</p>
            <div className="axia-footer-legal">
              {['Confidentialité', 'CGU', 'Cookies'].map(item => (
                <button key={item} className="axia-footer-legal-btn">{item}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;