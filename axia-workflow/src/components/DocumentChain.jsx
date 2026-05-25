import React, { useState, useEffect } from 'react';
import workflowService from '../../../services/workflowService';

const TYPE_LABELS = {
  DA:  { label: 'Demande achat',    color: '#4f46e5', bg: '#ede9fe' },
  DAC: { label: 'Demande confirmée',color: '#0891b2', bg: '#e0f2fe' },
  BS:  { label: 'Bon de sortie',    color: '#d97706', bg: '#fef3c7' },
  DF:  { label: 'Facturation',      color: '#7c3aed', bg: '#ede9fe' },
  BR:  { label: 'Bon de réception', color: '#059669', bg: '#dcfce7' },
};

const STATUT_COLORS = {
  brouillon: { bg: '#f1f5f9', color: '#64748b' },
  en_cours:  { bg: '#dbeafe', color: '#1d4ed8' },
  validé:    { bg: '#dcfce7', color: '#166534' },
  rejeté:    { bg: '#fee2e2', color: '#991b1b' },
};

const DocumentChain = ({ workflowId }) => {
  const [chain,   setChain]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workflowService.getDocumentChain(workflowId)
      .then(res => setChain(res.data?.chain || []))
      .catch(() => setChain([]))
      .finally(() => setLoading(false));
  }, [workflowId]);

  if (loading) return null;
  if (chain.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
        Chaîne documentaire
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {chain.map((doc, i) => {
          const typeInfo   = TYPE_LABELS[doc.type]   || {};
          const statutInfo = STATUT_COLORS[doc.statut] || STATUT_COLORS.brouillon;
          return (
            <React.Fragment key={doc._id}>
              <div style={{ background: typeInfo.bg, borderRadius: '10px', padding: '12px 16px', minWidth: '140px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: typeInfo.color }}>
                  {doc.number}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '11px', color: typeInfo.color, opacity: 0.8 }}>
                  {typeInfo.label}
                </p>
                <span style={{ background: statutInfo.bg, color: statutInfo.color, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                  {doc.statut}
                </span>
              </div>
              {i < chain.length - 1 && (
                <span style={{ color: '#94a3b8', fontSize: '18px' }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Détail du dernier document actif */}
      {chain.length > 0 && (
        <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
            Document actif — {chain[chain.length - 1].number}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
            {chain[chain.length - 1].demandeur && (
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Demandeur</p>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{chain[chain.length - 1].demandeur}</p>
              </div>
            )}
            {chain[chain.length - 1].depot && (
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Dépôt</p>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{chain[chain.length - 1].depot}</p>
              </div>
            )}
            {chain[chain.length - 1].lignes?.length > 0 && (
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Articles</p>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{chain[chain.length - 1].lignes.length} ligne(s)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentChain;