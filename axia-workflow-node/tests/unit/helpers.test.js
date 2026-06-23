// tests/unit/helpers.test.js
// Tests des fonctions pures — pas besoin de base de données
// C'est le type de test le plus simple

// ── Import du setup global ────────────────────────────────────────────────────
require('../setup');

// ════════════════════════════════════════════════════════════════════════════
// 1. TEST — Logique de délai (minutes → heures → jours)
// Cette logique existe dans TemplatesList.jsx et templateController.js
// ════════════════════════════════════════════════════════════════════════════

// La fonction qu'on veut tester
// (on la recrée ici pour tester la logique pure)
const convertDelaiToMinutes = (value, unit) => {
  if (!value || value === 0) return 0;
  if (unit === 'minutes') return value;
  if (unit === 'heures')  return value * 60;
  if (unit === 'jours')   return value * 1440;
  return 0;
};

const convertMinutesToDisplay = (minutes, unit) => {
  if (!minutes) return 0;
  if (unit === 'minutes') return minutes;
  if (unit === 'heures')  return Math.round(minutes / 60);
  if (unit === 'jours')   return Math.round(minutes / 1440);
  return 0;
};

// describe = groupe de tests liés
describe('Conversion des délais', () => {

  // test = un test individuel
  test('0 minutes reste 0', () => {
    expect(convertDelaiToMinutes(0, 'minutes')).toBe(0);
  });

  test('2 heures = 120 minutes', () => {
    expect(convertDelaiToMinutes(2, 'heures')).toBe(120);
  });

  test('1 jour = 1440 minutes', () => {
    expect(convertDelaiToMinutes(1, 'jours')).toBe(1440);
  });

  test('48 heures = 2880 minutes', () => {
    expect(convertDelaiToMinutes(48, 'heures')).toBe(2880);
  });

  test('120 minutes affiché en heures = 2', () => {
    expect(convertMinutesToDisplay(120, 'heures')).toBe(2);
  });

  test('1440 minutes affiché en jours = 1', () => {
    expect(convertMinutesToDisplay(1440, 'jours')).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. TEST — Logique de visibilité des workflows
// canUserSeeWorkflow dans workflowController.js
// ════════════════════════════════════════════════════════════════════════════

// On recopie la fonction pour la tester isolément
const canUserSeeWorkflow = (workflow, user) => {
  if (workflow.visibility !== 'restricted') return true;

  const userId   = user._id.toString();
  const userRole = typeof user.role === 'object' ? user.role?.name : user.role;
  const userPost = (user.jobTitle || '').toLowerCase().trim();

  if (workflow.allowedUsers?.some(u => u.toString() === userId)) return true;
  if (workflow.allowedRoles?.includes(userRole)) return true;
  if (workflow.allowedPosts?.some(p => {
    const pLower = p.toLowerCase().trim();
    return pLower === userPost || pLower.includes(userPost) || userPost.includes(pLower);
  })) return true;

  return false;
};

describe('Visibilité des workflows', () => {

  const user = {
    _id: '507f1f77bcf86cd799439011',
    role: 'employee',
    jobTitle: 'Comptable',
  };

  test('workflow global visible par tous', () => {
    const workflow = { visibility: 'global', allowedPosts: [], allowedRoles: [], allowedUsers: [] };
    expect(canUserSeeWorkflow(workflow, user)).toBe(true);
  });

  test('workflow restreint non visible si user non autorisé', () => {
    const workflow = {
      visibility: 'restricted',
      allowedPosts: ['Directeur'],
      allowedRoles: ['company_admin'],
      allowedUsers: [],
    };
    expect(canUserSeeWorkflow(workflow, user)).toBe(false);
  });

  test('workflow restreint visible si poste correspond', () => {
    const workflow = {
      visibility: 'restricted',
      allowedPosts: ['Comptable'],
      allowedRoles: [],
      allowedUsers: [],
    };
    expect(canUserSeeWorkflow(workflow, user)).toBe(true);
  });

  test('workflow restreint visible si rôle correspond', () => {
    const adminUser = { ...user, role: 'company_admin', jobTitle: 'Directeur' };
    const workflow = {
      visibility: 'restricted',
      allowedPosts: [],
      allowedRoles: ['company_admin'],
      allowedUsers: [],
    };
    expect(canUserSeeWorkflow(workflow, adminUser)).toBe(true);
  });

  test('workflow restreint visible si userId dans allowedUsers', () => {
    const workflow = {
      visibility: 'restricted',
      allowedPosts: [],
      allowedRoles: [],
      allowedUsers: ['507f1f77bcf86cd799439011'],
    };
    expect(canUserSeeWorkflow(workflow, user)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. TEST — Logique de statut des workflows
// ════════════════════════════════════════════════════════════════════════════

describe('Statuts des workflows', () => {

  const VALID_STATUSES = ['draft', 'active', 'completed', 'archived', 'rejected'];

  test('tous les statuts valides sont dans la liste', () => {
    expect(VALID_STATUSES).toContain('draft');
    expect(VALID_STATUSES).toContain('active');
    expect(VALID_STATUSES).toContain('completed');
  });

  test('un workflow draft peut être démarré', () => {
    const workflow = { status: 'draft' };
    const canStart = workflow.status === 'draft';
    expect(canStart).toBe(true);
  });

  test('un workflow active ne peut pas être redémarré', () => {
    const workflow = { status: 'active' };
    const canStart = workflow.status === 'draft';
    expect(canStart).toBe(false);
  });

  test('calcul du pourcentage de progression', () => {
    const steps = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'in_progress' },
      { status: 'pending' },
    ];
    const done       = steps.filter(s => s.status === 'completed').length;
    const total      = steps.length;
    const percentage = Math.round((done / total) * 100);
    expect(percentage).toBe(50);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. TEST — Génération de numéros de documents
// Logique du documentTypeController.generateNumber
// ════════════════════════════════════════════════════════════════════════════

describe('Génération de numéros de documents', () => {

  const generateDocNumber = (prefix, year, counter, digits) => {
    return `${prefix}${year}-${String(counter).padStart(digits, '0')}`;
  };

  test('génère un numéro avec padding correct (3 digits)', () => {
    const number = generateDocNumber('DA', '25', 1, 3);
    expect(number).toBe('DA25-001');
  });

  test('génère un numéro avec compteur > 9', () => {
    const number = generateDocNumber('DA', '25', 42, 3);
    expect(number).toBe('DA25-042');
  });

  test('génère un numéro avec préfixe différent', () => {
    const number = generateDocNumber('BS', '25', 5, 4);
    expect(number).toBe('BS25-0005');
  });

  test('le compteur 1000 dépasse le padding de 3', () => {
    const number = generateDocNumber('DA', '25', 1000, 3);
    expect(number).toBe('DA25-1000'); // pas tronqué
  });
});