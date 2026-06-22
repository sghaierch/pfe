import React, { useState } from 'react';

// ─── Constantes partagées ─────────────────────────────────────────────────────
const C = {
  primary: '#2563eb',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
};

const font = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const fileIcon = (type) => {
  if (!type) return { icon: 'ri-attachment-2', bg: '#f1f5f9', color: '#64748b' };
  if (type === 'pdf') return { icon: 'PDF', bg: '#fee2e2', color: '#dc2626' };
  if (type === 'image') return { icon: 'IMG', bg: '#e0f2fe', color: '#0369a1' };
  if (type === 'video') return { icon: 'VID', bg: '#dbeafe', color: '#1d4ed8' };
  if (type === 'document') return { icon: 'DOC', bg: '#dbeafe', color: '#1d4ed8' };
  return { icon: 'FILE', bg: '#f1f5f9', color: '#64748b' };
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const stepColors = [
  { color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
  { color: '#059669', bg: '#dcfce7', border: '#86efac' },
  { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  { color: '#0891b2', bg: '#cffafe', border: '#67e8f9' },
  { color: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc' },
];

// ─── Composant principal ─────────────────────────────────────────────────────
const DocumentsSection = ({ documents = [], steps = [], title }) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  const [downloading, setDownloading] = useState(null);
  const [view, setView] = useState('step');

  const handleDownload = async (doc, key) => {
    const url = doc.url ? baseUrl + doc.url : null;
    if (!url) return;

    setDownloading(key);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(url, {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = doc.filename || doc.originalName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  const DocCard = ({ doc, idx }) => {
    const fi = fileIcon(doc.type);
    const downloadUrl = doc.url ? baseUrl + doc.url : null;
    const isLoading = downloading === idx;
    const isTextIcon = !fi.icon.startsWith('ri-');

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 14px', borderRadius: '10px',
        border: `1px solid ${C.border}`, background: '#fafafa'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '8px',
          background: fi.bg, color: fi.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: isTextIcon ? '10px' : '18px', flexShrink: 0
        }}>
          {isTextIcon ? fi.icon : <i className={fi.icon}></i>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: '0 0 3px', fontSize: '13px', fontWeight: 600,
            color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {doc.filename || doc.originalName}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {doc.uploadedByName && (
              <span style={{ fontSize: '11px', color: C.textMuted, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <i className="ri-user-line"></i> {doc.uploadedByName}
              </span>
            )}
            {doc.size && <span style={{ fontSize: '11px', color: C.textLight }}>{formatSize(doc.size)}</span>}
            {doc.createdAt && <span style={{ fontSize: '11px', color: C.textLight }}>{fmtDate(doc.createdAt)}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '7px',
                background: '#f0fdf4', color: '#059669',
                border: '1px solid #86efac',
                fontWeight: 700, fontSize: '11px', textDecoration: 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
              onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
            >
              <i className="ri-eye-line"></i> Voir
            </a>
          )}

          {downloadUrl && (
            <button
              onClick={() => handleDownload(doc, idx)}
              disabled={isLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '7px',
                background: isLoading ? '#f1f5f9' : C.primary + '10',
                color: isLoading ? C.textLight : C.primary,
                border: `1px solid ${isLoading ? C.border : C.primary + '30'}`,
                fontWeight: 700, fontSize: '11px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: font
              }}
            >
              {isLoading ? <i className="ri-loader-4-line"></i> : <><i className="ri-download-2-line"></i> Télécharger</>}
            </button>
          )}
        </div>
      </div>
    );
  };

  const groupByStep = () => {
    const groups = {};
    documents.forEach((doc, i) => {
      const si = doc.stepIndex !== null && doc.stepIndex !== undefined ? Number(doc.stepIndex) : -1;
      const name = si >= 0 && steps[si] ? steps[si].name : si === -1 ? 'Documents généraux' : `Étape ${si + 1}`;
      const key = `step_${si}`;

      if (!groups[key]) {
        groups[key] = {
          label: name,
          stepIndex: si,
          stepObj: steps[si] || null,
          docs: []
        };
      }
      groups[key].docs.push({ doc, idx: i });
    });
    return Object.values(groups).sort((a, b) => a.stepIndex - b.stepIndex);
  };

  const groupByUser = () => {
    const groups = {};
    documents.forEach((doc, i) => {
      const key = doc.uploadedByName || 'Utilisateur inconnu';
      if (!groups[key]) groups[key] = { label: key, docs: [] };
      groups[key].docs.push({ doc, idx: i });
    });
    return Object.values(groups);
  };

  const GroupBlock = ({ label, icon, color, bg, border, count, badge, children }) => (
    <div style={{ marginBottom: '14px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: bg }}>
        <i className={icon} style={{ fontSize: '16px', color }}></i>
        <span style={{ fontWeight: 700, fontSize: '13px', color }}>{label}</span>
        {badge && (
          <span style={{ fontSize: '10px', background: color + '20', color, padding: '2px 8px', borderRadius: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <i className={badge.icon}></i> {badge.label}
          </span>
        )}
        <span style={{ marginLeft: 'auto', background: color + '20', color, padding: '2px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
          {count} fichier{count > 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '7px', background: '#fff' }}>
        {children}
      </div>
    </div>
  );

  const stepStatusBadge = (stepObj) => {
    if (!stepObj) return null;
    const cfg = {
      completed:   { icon: 'ri-checkbox-circle-fill', label: 'Validée' },
      in_progress: { icon: 'ri-time-line', label: 'En cours' },
      rejected:    { icon: 'ri-close-circle-fill', label: 'Rejetée' },
      pending:     { icon: 'ri-radio-button-line', label: 'En attente' },
    }[stepObj.status];
    return cfg || null;
  };

  if (!documents || documents.length === 0) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: C.textLight, fontFamily: font }}>
        <i className="ri-folder-open-line" style={{ fontSize: '36px', marginBottom: '10px', display: 'block' }}></i>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Aucun document joint.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {title && <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.text }}>{title}</h2>}

        <div style={{ display: 'flex', gap: '6px', marginLeft: title ? 'auto' : '0' }}>
          {[
            { key: 'step', label: 'Par étape', icon: 'ri-list-check-2' },
            { key: 'user', label: 'Par utilisateur', icon: 'ri-user-line' },
            { key: 'all', label: 'Tous', icon: 'ri-attachment-2' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                padding: '6px 13px', borderRadius: '20px',
                border: `1.5px solid ${view === tab.key ? C.primary : C.border}`,
                background: view === tab.key ? C.primary : C.surface,
                color: view === tab.key ? '#fff' : C.textMuted,
                fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
                fontFamily: font
              }}
            >
              <i className={tab.icon}></i> {tab.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '12px', color: C.textMuted, fontWeight: 600, marginLeft: title ? '0' : 'auto' }}>
          {documents.length} document{documents.length > 1 ? 's' : ''}
        </span>
      </div>

      {view === 'step' && groupByStep().map((group, gi) => {
        const sc = stepColors[gi % stepColors.length];
        const badge = stepStatusBadge(group.stepObj);
        return (
          <GroupBlock
            key={gi}
            label={group.label}
            icon="ri-list-check-2"
            color={sc.color}
            bg={sc.bg}
            border={sc.border}
            count={group.docs.length}
            badge={badge}
          >
            {group.docs.map(({ doc, idx }) => <DocCard key={idx} doc={doc} idx={idx} />)}
          </GroupBlock>
        );
      })}

      {view === 'user' && groupByUser().map((group, gi) => {
        const sc = stepColors[gi % stepColors.length];
        return (
          <GroupBlock
            key={gi}
            label={group.label}
            icon="ri-user-line"
            color={sc.color}
            bg={sc.bg}
            border={sc.border}
            count={group.docs.length}
          >
            {group.docs.map(({ doc, idx }) => {
              const si = doc.stepIndex !== null && doc.stepIndex !== undefined ? Number(doc.stepIndex) : -1;
              const sName = si >= 0 && steps[si] ? steps[si].name : si === -1 ? 'Général' : `Étape ${si + 1}`;
              return (
                <div key={idx}>
                  <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="ri-list-check-2"></i> {sName}
                  </p>
                  <DocCard doc={doc} idx={idx} />
                </div>
              );
            })}
          </GroupBlock>
        );
      })}

      {view === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {documents.map((doc, i) => <DocCard key={i} doc={doc} idx={i} />)}
        </div>
      )}
    </div>
  );
};

export default DocumentsSection;