// tests/unit/workflowController.test.js
require('../setup');

// ════════════════════════════════════════════════════════════════════════════
// 1. TEST — Logique completeStep
// ════════════════════════════════════════════════════════════════════════════
describe('Logique completeStep', () => {

  const completeStep = (workflow, stepIndex, userId, comment = '') => {
    const step = workflow.steps[stepIndex];
    if (!step) return { error: 'Étape introuvable' };
    if (step.status === 'completed') return { error: 'Étape déjà complétée' };
    if (workflow.status !== 'active') return { error: 'Workflow non actif' };

    step.status      = 'completed';
    step.completedAt = new Date();
    step.completedBy = userId;
    step.comment     = comment;

    const nextIndex = stepIndex + 1;
    if (nextIndex < workflow.steps.length) {
      workflow.steps[nextIndex].status = 'in_progress';
      workflow.currentStep             = nextIndex;
    } else {
      workflow.status      = 'completed';
      workflow.completedAt = new Date();
    }

    return { success: true, workflow };
  };

  test('complète une étape et passe à la suivante', () => {
    const workflow = {
      status: 'active',
      currentStep: 0,
      steps: [
        { name: 'Étape 1', status: 'in_progress' },
        { name: 'Étape 2', status: 'pending' },
      ],
    };

    const result = completeStep(workflow, 0, 'user123');

    expect(result.success).toBe(true);
    expect(result.workflow.steps[0].status).toBe('completed');
    expect(result.workflow.steps[1].status).toBe('in_progress');
    expect(result.workflow.currentStep).toBe(1);
    expect(result.workflow.status).toBe('active');
  });

  test('complète la dernière étape → workflow terminé', () => {
    const workflow = {
      status: 'active',
      currentStep: 1,
      steps: [
        { name: 'Étape 1', status: 'completed' },
        { name: 'Étape 2', status: 'in_progress' },
      ],
    };

    const result = completeStep(workflow, 1, 'user123');

    expect(result.success).toBe(true);
    expect(result.workflow.steps[1].status).toBe('completed');
    expect(result.workflow.status).toBe('completed');
    expect(result.workflow.completedAt).toBeDefined();
  });

  test('erreur si étape déjà complétée', () => {
    const workflow = {
      status: 'active',
      currentStep: 0,
      steps: [{ name: 'Étape 1', status: 'completed' }],
    };

    const result = completeStep(workflow, 0, 'user123');
    expect(result.error).toBe('Étape déjà complétée');
  });

  test('erreur si workflow non actif', () => {
    const workflow = {
      status: 'draft',
      currentStep: 0,
      steps: [{ name: 'Étape 1', status: 'pending' }],
    };

    const result = completeStep(workflow, 0, 'user123');
    expect(result.error).toBe('Workflow non actif');
  });

  test('le commentaire est sauvegardé', () => {
    const workflow = {
      status: 'active',
      currentStep: 0,
      steps: [
        { name: 'Étape 1', status: 'in_progress' },
        { name: 'Étape 2', status: 'pending' },
      ],
    };

    completeStep(workflow, 0, 'user123', 'Validé après vérification');
    expect(workflow.steps[0].comment).toBe('Validé après vérification');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. TEST — Logique rejectStep
// ════════════════════════════════════════════════════════════════════════════
describe('Logique rejectStep', () => {

  const rejectStep = (workflow, stepIndex, userId, comment = '') => {
    const step = workflow.steps[stepIndex];
    if (!step) return { error: 'Étape introuvable' };
    if (workflow.status !== 'active') return { error: 'Workflow non actif' };

    step.status      = 'rejected';
    step.completedBy = userId;
    step.comment     = comment;
    workflow.status  = 'rejected';

    return { success: true, workflow };
  };

  test('rejette une étape et marque le workflow rejeté', () => {
    const workflow = {
      status: 'active',
      steps: [{ name: 'Validation', status: 'in_progress' }],
    };

    const result = rejectStep(workflow, 0, 'admin123', 'Budget insuffisant');

    expect(result.success).toBe(true);
    expect(result.workflow.steps[0].status).toBe('rejected');
    expect(result.workflow.status).toBe('rejected');
    expect(result.workflow.steps[0].comment).toBe('Budget insuffisant');
  });

  test('erreur si workflow non actif', () => {
    const workflow = {
      status: 'completed',
      steps: [{ name: 'Étape 1', status: 'completed' }],
    };

    const result = rejectStep(workflow, 0, 'admin123');
    expect(result.error).toBe('Workflow non actif');
  });

  test('erreur si index étape invalide', () => {
    const workflow = {
      status: 'active',
      steps: [{ name: 'Étape 1', status: 'in_progress' }],
    };

    const result = rejectStep(workflow, 99, 'admin123');
    expect(result.error).toBe('Étape introuvable');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. TEST — Logique startWorkflow
// ════════════════════════════════════════════════════════════════════════════
describe('Logique startWorkflow', () => {

  const startWorkflow = (workflow) => {
    if (workflow.status !== 'draft') return { error: 'Seuls les brouillons peuvent être démarrés' };
    if (!workflow.steps || workflow.steps.length === 0) return { error: 'Le workflow doit avoir au moins une étape' };

    workflow.status              = 'active';
    workflow.startedAt           = new Date();
    workflow.currentStep         = 0;
    workflow.steps[0].status     = 'in_progress';

    return { success: true, workflow };
  };

  test('démarre un workflow draft correctement', () => {
    const workflow = {
      status: 'draft',
      steps: [
        { name: 'Étape 1', status: 'pending' },
        { name: 'Étape 2', status: 'pending' },
      ],
    };

    const result = startWorkflow(workflow);

    expect(result.success).toBe(true);
    expect(result.workflow.status).toBe('active');
    expect(result.workflow.steps[0].status).toBe('in_progress');
    expect(result.workflow.currentStep).toBe(0);
    expect(result.workflow.startedAt).toBeDefined();
  });

  test('erreur si workflow déjà actif', () => {
    const workflow = { status: 'active', steps: [{ name: 'Étape 1' }] };
    const result   = startWorkflow(workflow);
    expect(result.error).toContain('brouillons');
  });

  test('erreur si aucune étape', () => {
    const workflow = { status: 'draft', steps: [] };
    const result   = startWorkflow(workflow);
    expect(result.error).toContain('au moins une étape');
  });

  test('seule la première étape passe en in_progress', () => {
    const workflow = {
      status: 'draft',
      steps: [
        { name: 'Étape 1', status: 'pending' },
        { name: 'Étape 2', status: 'pending' },
        { name: 'Étape 3', status: 'pending' },
      ],
    };

    startWorkflow(workflow);

    expect(workflow.steps[0].status).toBe('in_progress');
    expect(workflow.steps[1].status).toBe('pending');
    expect(workflow.steps[2].status).toBe('pending');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. TEST — Logique historique workflow
// ════════════════════════════════════════════════════════════════════════════
describe('Historique du workflow', () => {

  const addHistory = (workflow, action, stepIndex, stepName, userId, userName, comment = '') => {
    if (!workflow.history) workflow.history = [];
    workflow.history.push({
      action,
      stepIndex,
      stepName,
      by:     userId,
      byName: userName,
      comment,
      date:   new Date(),
    });
    return workflow;
  };

  test('ajoute une entrée dans l\'historique', () => {
    const workflow = { history: [] };

    addHistory(workflow, 'completed', 0, 'Validation', 'user1', 'Jean');

    expect(workflow.history.length).toBe(1);
    expect(workflow.history[0].action).toBe('completed');
    expect(workflow.history[0].byName).toBe('Jean');
  });

  test('accumule plusieurs entrées', () => {
    const workflow = { history: [] };

    addHistory(workflow, 'started',   0, 'Étape 1', 'user1', 'Jean');
    addHistory(workflow, 'completed', 0, 'Étape 1', 'user1', 'Jean');
    addHistory(workflow, 'completed', 1, 'Étape 2', 'user2', 'Marie');

    expect(workflow.history.length).toBe(3);
    expect(workflow.history[2].stepName).toBe('Étape 2');
  });

  test('crée history si inexistant', () => {
    const workflow = {};
    addHistory(workflow, 'started', 0, 'Étape 1', 'user1', 'Jean');
    expect(workflow.history).toBeDefined();
    expect(workflow.history.length).toBe(1);
  });
});