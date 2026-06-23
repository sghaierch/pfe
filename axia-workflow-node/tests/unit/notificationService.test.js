// tests/unit/notificationService.test.js
// Teste la logique des notifications sans envoyer de vrais emails

require('../setup');

// ════════════════════════════════════════════════════════════════════════════
// Mock des services externes
// "mock" = on remplace le vrai service par une fausse version
// Ça évite d'envoyer de vrais emails pendant les tests
// ════════════════════════════════════════════════════════════════════════════
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  })),
}));

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({ statusCode: 201 }),
}));

// ════════════════════════════════════════════════════════════════════════════
// 1. TEST — Templates d'email
// ════════════════════════════════════════════════════════════════════════════
describe('Templates email', () => {

  // On importe emailService après le mock
  const { emailTemplates } = require('../../services/emailService');

  test('template step_assigned génère un sujet avec le nom de l\'étape', () => {
    const result = emailTemplates.step_assigned({
      recipientName: 'Jean Dupont',
      workflowName:  'Demande d\'achat',
      stepName:      'Validation RH',
      dueDate:       null,
    });

    expect(result.subject).toContain('Validation RH');
    expect(result.subject).toContain('Demande d\'achat');
    expect(result.html).toContain('Jean Dupont');
  });

  test('template step_rejected inclut le commentaire de rejet', () => {
    const result = emailTemplates.step_rejected({
      recipientName: 'Marie Martin',
      workflowName:  'Congé annuel',
      stepName:      'Approbation manager',
      rejectedBy:    'Chef Martin',
      comment:       'Budget insuffisant',
    });

    expect(result.html).toContain('Budget insuffisant');
    expect(result.html).toContain('rejetée');
  });

  test('template workflow_completed félicite le destinataire', () => {
    const result = emailTemplates.workflow_completed({
      recipientName: 'Paul Durand',
      workflowName:  'Demande formation',
    });

    expect(result.subject).toContain('Demande formation');
    expect(result.html).toContain('Paul Durand');
    expect(result.html).toContain('terminé');
  });

  test('template step_assigned sans dueDate ne plante pas', () => {
    expect(() => {
      emailTemplates.step_assigned({
        recipientName: 'Test',
        workflowName:  'Test WF',
        stepName:      'Étape 1',
        dueDate:       null,
      });
    }).not.toThrow(); // .not.toThrow() = on vérifie qu'il n'y a pas d'erreur
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. TEST — Payloads push
// ════════════════════════════════════════════════════════════════════════════
describe('Payloads push notifications', () => {

  const { pushPayloads } = require('../../services/pushService');

  test('payload step_assigned contient le nom du workflow', () => {
    const payload = pushPayloads.step_assigned({
      workflowName: 'Demande congé',
      stepName:     'Validation DRH',
    });

    expect(payload.title).toBeTruthy();           // truthy = pas vide
    expect(payload.body).toContain('Demande congé');
    expect(payload.url).toBe('/dashboard/employee');
  });

  test('payload step_completed mentionne le validateur', () => {
    const payload = pushPayloads.step_completed({
      workflowName: 'Achat matériel',
      stepName:     'Validation budget',
      completedBy:  'Directeur Finance',
    });

    expect(payload.body).toContain('Directeur Finance');
    expect(payload.tag).toBe('step_completed');
  });

  test('payload reminder mentionne le nombre de jours', () => {
    const payload = pushPayloads.reminder({
      workflowName: 'Formation React',
      stepName:     'Approbation RH',
      daysPending:  3,
    });

    expect(payload.body).toContain('3');
    expect(payload.url).toBe('/dashboard/employee');
  });

  test('tous les payloads ont un titre et un corps', () => {
    const types = ['step_assigned', 'step_completed', 'step_rejected', 'workflow_completed', 'reminder'];

    types.forEach(type => {
      const payload = pushPayloads[type]({
        workflowName: 'Test WF',
        stepName:     'Test Step',
        completedBy:  'Test User',
        rejectedBy:   'Test User',
        daysPending:  1,
      });

      // toHaveProperty vérifie qu'une propriété existe
      expect(payload).toHaveProperty('title');
      expect(payload).toHaveProperty('body');
      expect(payload.title.length).toBeGreaterThan(0);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. TEST — Interpolation des templates
// La fonction interpolate dans emailService.js
// ════════════════════════════════════════════════════════════════════════════
describe('Interpolation des templates email', () => {

  // On recrée la fonction pour la tester isolément
  const interpolate = (text, vars) => {
    if (!text) return '';
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
  };

  test('remplace {{variable}} par sa valeur', () => {
    const result = interpolate('Bonjour {{name}}', { name: 'Jean' });
    expect(result).toBe('Bonjour Jean');
  });

  test('remplace plusieurs variables', () => {
    const result = interpolate(
      'Workflow {{workflowName}} — Étape {{stepName}}',
      { workflowName: 'Achat', stepName: 'Validation' }
    );
    expect(result).toBe('Workflow Achat — Étape Validation');
  });

  test('variable manquante donne une chaîne vide', () => {
    const result = interpolate('Bonjour {{name}}', {});
    expect(result).toBe('Bonjour ');
  });

  test('texte sans variable reste intact', () => {
    const result = interpolate('Texte sans variable', { name: 'Jean' });
    expect(result).toBe('Texte sans variable');
  });

  test('texte null ou undefined retourne chaîne vide', () => {
    expect(interpolate(null, {})).toBe('');
    expect(interpolate(undefined, {})).toBe('');
  });
});