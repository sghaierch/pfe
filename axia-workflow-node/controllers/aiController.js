const fetch = require('node-fetch');

// ── Génération de workflow par IA ─────────────────────────────────────────────
exports.generateWorkflow = async (req, res) => {
  try {
    console.log('API KEY chargee:', process.env.GROQ_API_KEY ?
      'OUI — commence par: ' + process.env.GROQ_API_KEY.substring(0, 20) + '...' :
      'NON — cle manquante !'
    );

    const { description, posts = [] } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ status: 'fail', message: 'Description trop courte' });
    }

    const postsContext = posts.length > 0
      ? 'Postes disponibles : ' + posts.map(p => '"' + p.name + '"').join(', ')
      : 'Utilise des postes generiques comme "Directeur RH", "Directeur Financier"';

    const exampleJSON = '{"workflowName":"Demande de depot materiel","description":"Circuit de validation des demandes de sortie de stock","visibility":"global","steps":['
      + '{"name":"Demande Employe","description":"L\'employe soumet sa demande","assignedPost":"","delai":"",'
      + '"claims":{"canValidate":false,"canReject":false,"canModify":true,"canView":true},'
      + '"form":{"fields":['
      + '{"id":"f_0_0","label":"N Demande","type":"auto_number","required":false,"readOnly":true,"options":[],"columns":[],"inheritTableFrom":"","extraColumns":[]},'
      + '{"id":"f_0_1","label":"Demandeur","type":"auto_user","required":false,"readOnly":true,"options":[],"columns":[],"inheritTableFrom":"","extraColumns":[]},'
      + '{"id":"f_0_2","label":"Date de demande","type":"date","required":true,"readOnly":false,"options":[],"columns":[],"inheritTableFrom":"","extraColumns":[]},'
      + '{"id":"f_0_3","label":"Articles demandes","type":"table","required":true,"readOnly":false,"options":[],'
      + '"columns":[{"id":"col_0_1","label":"Nom article","type":"text","required":true},{"id":"col_0_2","label":"Qte demandee","type":"number","required":true}],'
      + '"inheritTableFrom":"","extraColumns":[]},'
      + '{"id":"f_0_4","label":"Motif","type":"textarea","required":true,"readOnly":false,"options":[],"columns":[],"inheritTableFrom":"","extraColumns":[]}'
      + ']},"checklist":[]},'
      + '{"name":"Validation Achat","description":"Verification disponibilite stock","assignedPost":"Responsable Achat","delai":"2j",'
      + '"claims":{"canValidate":true,"canReject":true,"canModify":false,"canView":true},'
      + '"form":{"fields":['
      + '{"id":"f_1_0","label":"Articles demandes","type":"table","required":false,"readOnly":false,"options":[],'
      + '"columns":[],"inheritTableFrom":"f_0_3","extraColumns":[]},'
      + '{"id":"f_1_1","label":"Decision","type":"select","required":true,"readOnly":false,"options":["Approuve","Approuve partiellement","Refuse"],"columns":[],"inheritTableFrom":"","extraColumns":[]},'
      + '{"id":"f_1_2","label":"Commentaire","type":"textarea","required":false,"readOnly":false,"options":[],"columns":[],"inheritTableFrom":"","extraColumns":[]}'
      + ']},"checklist":[{"id":"c_1_0","label":"Stock verifie","required":true,"checked":false}]},'
      + '{"name":"Confirmation RH","description":"Confirmation finale et choix du bon","assignedPost":"Responsable RH","delai":"1j",'
      + '"claims":{"canValidate":true,"canReject":true,"canModify":false,"canView":true},'
      + '"form":{"fields":['
      + '{"id":"f_2_0","label":"Articles confirmes","type":"table","required":true,"readOnly":false,"options":[],'
      + '"columns":[],"inheritTableFrom":"f_0_3",'
      + '"extraColumns":[{"id":"col_extra_1","label":"Qte validee","type":"number","required":true}]},'
      + '{"id":"f_2_1","label":"Type de bon","type":"select","required":true,"readOnly":false,"options":["Bon Achat","Bon Sortie","Bon Fabrication"],"columns":[],"inheritTableFrom":"","extraColumns":[]},'
      + '{"id":"f_2_2","label":"Signature","type":"signature","required":true,"readOnly":false,"options":[],"columns":[],"inheritTableFrom":"","extraColumns":[]}'
      + ']},"checklist":[{"id":"c_2_0","label":"Documents verifies","required":true,"checked":false}]}'
      + ']}';
    const prompt = 'Tu es un expert en gestion de processus metier. Genere un workflow JSON professionnel.\n\n'
      + 'Description du processus : "' + description + '"\n\n'
      + postsContext + '\n\n'
      + 'REGLES OBLIGATOIRES :\n'
      + '1. UNE SEULE etape employe (index 0) : assignedPost = "" (VIDE), claims = {"canValidate":false,"canReject":false,"canModify":true,"canView":true}. INTERDIT de creer 2 etapes employe, INTERDIT d\'avoir "Soumission employee" ET "Demande Employe" en meme temps.\n'
      + '2. Apres l\'etape 0 : UNIQUEMENT des etapes de validation/confirmation avec un poste assigne.\n'
      + '3. Structure OBLIGATOIRE : [Demande Employe] -> [Validation X] -> [Confirmation Y eventuelle]. JAMAIS [Demande] -> [Soumission] -> [Validation].\n'
      + '4. Pour les DATES : un champ separe par date (ex: "Date de debut" ET "Date de fin" = 2 champs distincts)\n'
      + '5. Pour les champs "select" de decision : options TOUJOURS ["Approuve","Refuse"] sauf indication contraire\n'
      + '6. Utilise "auto_number" (readOnly:true) pour le N de document, "auto_user" (readOnly:true) pour le demandeur\n'
      + '7. Pour les listes d\'articles/produits : utilise "table" avec columns dans l\'etape 0 UNIQUEMENT.\n'
      + '8. Pour les etapes suivantes (validation/confirmation) qui ont le meme tableau :\n'
      + '   - NE PAS redefinir les columns\n'
      + '   - Utilise inheritTableFrom: "id_du_champ_table_etape_0" (ex: "f_0_3")\n'
      + '   - Ajoute seulement les nouvelles colonnes dans extraColumns (ex: Qte validee)\n'
      + '   - columns doit etre [] (vide) si inheritTableFrom est defini\n'
      + '9. Types autorises : text, number, date, select, textarea, file, checkbox, signature, table, auto_number, auto_user, auto_status\n'
      + '- Chaque champ DOIT avoir un "label" en français explicite (ex: "Numéro de demande", "Demandeur", "Date de demande", "Articles demandés", "Motif"). INTERDIT d\'utiliser "Champ 1", "field1" ou tout label générique.\n'
      + '- Pour auto_number : label="Numéro de demande", readOnly:true\n'
      + '- Pour auto_user : label="Demandeur", readOnly:true\n'
      + '- Les ids doivent être explicites : "f_0_num_demande", "f_0_demandeur", "f_0_date_demande", "f_0_articles_demandes", etc.\n\n'
      + 'EXEMPLE DE FORMAT :\n'
      + exampleJSON + '\n\n'
      + 'GENERE MAINTENANT un JSON adapte a la description fournie en respectant TOUTES les regles. UNIQUEMENT le JSON, rien d\'autre.';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        max_tokens:  3000,
        temperature: 0.3,
        messages:    [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq error:', errText);
      return res.status(500).json({ status: 'fail', message: 'Erreur API IA : ' + response.status });
    }

    const data  = await response.json();
    const text  = data.choices?.[0]?.message?.content || '';
    console.log('Reponse IA brute:', text.substring(0, 200));

    let clean = text.trim();
    clean = clean.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const jsonStart = clean.indexOf('{');
    const jsonEnd   = clean.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      clean = clean.substring(jsonStart, jsonEnd + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('JSON parse error:', clean.substring(0, 300));
      parsed = buildFallbackWorkflow(description);
    }

    if (!parsed.steps || parsed.steps.length === 0) {
      parsed = buildFallbackWorkflow(description);
    }

    // ✅ FIX 1 : supprimer les doublons d'etapes employe generes par l'IA
    const employeeKeywords = ['soumission', 'submission', 'demande employ'];
    if (parsed.steps.length > 1) {
      parsed.steps = parsed.steps.filter((step, si) => {
        if (si === 0) return true;
        const nameLower = (step.name || '').toLowerCase();
        const isExtraEmployeeStep = !step.assignedPost && employeeKeywords.some(k => nameLower.includes(k));
        if (isExtraEmployeeStep) {
          console.log('Doublon etape employe supprime:', step.name);
          return false;
        }
        return true;
      });
    }

    parsed.steps = parsed.steps.map((step, si) => {
      const isEmployeeStep = si === 0;

      const fields = (step.form?.fields || []).length > 0
      ? step.form.fields.map((f, fi) => ({
          id:               f.id               || 'f_' + si + '_' + fi,
          label:            f.label            || 'Champ ' + (fi + 1),
          type:             f.type             || 'text',
          required:         f.required         === true,
          readOnly:         f.readOnly         === true,
          autoSource:       f.autoSource       || '',
          options:          Array.isArray(f.options)      ? f.options      : [],
          columns:          Array.isArray(f.columns)      ? f.columns      : [],
          inheritTableFrom: f.inheritTableFrom || '',   // ✅ AJOUTER
          extraColumns:     Array.isArray(f.extraColumns) ? f.extraColumns : [], // ✅ AJOUTER
        }))
      : buildDefaultFields(step.name, si);

      return {
        ...step,
        form: { fields },
        // ✅ FIX 2 : step 0 (employe) n'a JAMAIS de checklist
        checklist: isEmployeeStep
          ? []
          : (step.checklist || []).length > 0
            ? step.checklist
            : [{ id: 'c_' + si + '_1', label: 'Verification effectuee', required: true, checked: false }],
        // ✅ FIX 3 : claims corrects selon le role
        claims: isEmployeeStep
          ? { canValidate: false, canReject: false, canModify: true, canView: true }
          : step.claims || { canValidate: true, canReject: true, canModify: false, canView: true },
        // ✅ FIX 4 : step 0 n'a jamais de poste assigne
        assignedPost: isEmployeeStep ? '' : (step.assignedPost || ''),
      };
    });

    res.status(200).json({ status: 'success', data: parsed });
  } catch (err) {
    console.error('generateWorkflow error:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── Analyse et suggestions d'optimisation ────────────────────────────────────
exports.analyzeWorkflow = async (req, res) => {
  try {
    const { workflow } = req.body;
    if (!workflow) return res.status(400).json({ status: 'fail', message: 'Workflow requis' });

    const now = new Date();

    const stepsContext = (workflow.steps || []).map((step, i) => {
      const duration = step.completedAt && step.createdAt
        ? Math.floor((new Date(step.completedAt) - new Date(step.createdAt)) / (1000 * 60 * 60 * 24))
        : null;
      const delaiDays = step.delai ? parseInt(step.delai) : null;
      return 'Etape ' + (i + 1) + ' : "' + step.name + '"\n'
        + '  - Statut : ' + step.status + '\n'
        + '  - Assigne a : ' + (step.assignedToName || step.assignedPost || 'Non assigne') + '\n'
        + '  - Delai prevu : ' + (step.delai || 'Non defini') + '\n'
        + '  - Duree reelle : ' + (duration !== null ? duration + ' jours' : 'Non terminee') + '\n'
        + '  - Depassement delai : ' + (duration !== null && delaiDays !== null && duration > delaiDays ? 'OUI (+' + (duration - delaiDays) + 'j)' : 'NON') + '\n'
        + '  - Champs formulaire : ' + (step.form?.fields?.length || 0) + '\n'
        + '  - Checklist : ' + (step.checklist?.length || 0) + ' items\n'
        + '  - Commentaire : ' + (step.comment || 'Aucun');
    }).join('\n\n');

    const historyContext = (workflow.history || []).map(h =>
      '[' + new Date(h.date).toLocaleDateString('fr-FR') + '] ' + h.action + ' — ' + (h.byName || '') + (h.comment ? ' ("' + h.comment + '")' : '')
    ).join('\n');

    const workflowAge = workflow.startedAt
      ? Math.floor((now - new Date(workflow.startedAt)) / (1000 * 60 * 60 * 24))
      : null;

    // ── Calcul de pre-score cote serveur (donnees objectives) ─────────────────
    const steps        = workflow.steps || [];
    const totalSteps   = steps.length;
    const doneSteps    = steps.filter(s => s.status === 'completed').length;
    const hasDelais    = steps.filter(s => s.delai).length;
    const hasChecks    = steps.filter(s => s.checklist?.length > 0).length;
    const hasAssigned  = steps.filter(s => s.assignedPost || s.assignedToName).length;
    const overdueCount = steps.filter(s => {
      if (!s.completedAt || !s.createdAt || !s.delai) return false;
      const actual = Math.floor((new Date(s.completedAt) - new Date(s.createdAt)) / 86400000);
      return actual > parseInt(s.delai);
    }).length;
    const hasRejections   = (workflow.history || []).filter(h => h.action?.includes('rejected')).length;
    const deactivations   = (workflow.history || []).filter(h => h.action?.includes('deactivat')).length;
    const totalFormFields = steps.reduce((a, s) => a + (s.form?.fields?.length || 0), 0);

    let baseScore = 55;
    if (totalSteps > 0) {
      if (hasDelais   === totalSteps) baseScore += 12; else if (hasDelais > 0)   baseScore += 4;
      if (hasChecks   > 0)            baseScore +=  8;
      if (hasAssigned === totalSteps) baseScore += 10; else if (hasAssigned > 0) baseScore += 3;
      if (totalFormFields >= totalSteps * 2) baseScore += 6;
    }
    if (overdueCount === 0 && doneSteps > 0) baseScore += 8; else baseScore -= (overdueCount * 6);
    if (hasRejections > 0) baseScore -= (hasRejections * 7);
    if (deactivations > 0) baseScore -= 12;
    if (workflow.status === 'completed') baseScore += 10;
    if (workflow.status === 'rejected')  baseScore -= 15;
    baseScore = Math.max(5, Math.min(97, baseScore));
    const scoreLow  = Math.max(5,  baseScore - 18);
    const scoreHigh = Math.min(97, baseScore + 18);

    const analyzePrompt = 'Tu es un expert en optimisation de processus metier. Analyse ce workflow et fournis une evaluation PRECISE.\n\n'
      + 'WORKFLOW : "' + workflow.name + '"\n'
      + 'Statut : ' + workflow.status + '\n'
      + 'Age : ' + (workflowAge !== null ? workflowAge + ' jours depuis le demarrage' : 'Non demarre') + '\n'
      + 'Progression : ' + doneSteps + '/' + totalSteps + ' etapes completees\n\n'
      + 'METRIQUES CALCULEES :\n'
      + '- Score base calcule : ' + baseScore + '/100\n'
      + '- Etapes avec delai : ' + hasDelais + '/' + totalSteps + '\n'
      + '- Etapes avec checklist : ' + hasChecks + '/' + totalSteps + '\n'
      + '- Etapes avec responsable : ' + hasAssigned + '/' + totalSteps + '\n'
      + '- Depassements de delai : ' + overdueCount + '\n'
      + '- Rejets : ' + hasRejections + '\n'
      + '- Desactivations : ' + deactivations + '\n'
      + '- Total champs formulaire : ' + totalFormFields + '\n\n'
      + 'DETAIL DES ETAPES :\n' + stepsContext + '\n\n'
      + 'HISTORIQUE :\n' + (historyContext || 'Aucun historique') + '\n\n'
      + 'REGLES STRICTES :\n'
      + '1. Score DOIT etre entre ' + scoreLow + ' et ' + scoreHigh + ' — calcule sur donnees reelles.\n'
      + '2. INTERDIT de retourner 75 sauf si c\'est justifie par le calcul.\n'
      + '3. Chaque suggestion cite des donnees concretes (noms etapes, chiffres).\n'
      + '4. Resume mentionne le nom du workflow et une metrique precise.\n\n'
      + 'JSON STRICT (sans backticks, sans texte avant ou apres) :\n'
      + '{"score":<ENTIER entre ' + scoreLow + ' et ' + scoreHigh + '>,"resume":"<phrase specifique>","suggestions":[{"type":"<warning|success|danger|info>","titre":"<titre>","detail":"<detail avec donnees reelles>","priorite":"<haute|moyenne|info>"}]}\n\n'
      + 'Types : warning=attention, success=bon, danger=critique, info=suggestion.\n'
      + 'Genere 4 a 7 suggestions. UNIQUEMENT le JSON.';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        max_tokens:  1500,
        temperature: 0.4,
        messages:    [{ role: 'user', content: analyzePrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq analyzeWorkflow error:', errText);
      return res.status(500).json({ status: 'fail', message: 'Erreur API IA : ' + response.status });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    let clean = text.trim()
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();
    const jsonStart = clean.indexOf('{');
    const jsonEnd   = clean.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) clean = clean.substring(jsonStart, jsonEnd + 1);

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      parsed = {
        score: baseScore,
        resume: 'Analyse indisponible — donnees insuffisantes',
        suggestions: [
          { type: 'info', titre: 'Donnees insuffisantes', detail: 'Demarrez et progressez dans le workflow pour obtenir des recommandations.', priorite: 'info' },
        ],
      };
    }

    res.status(200).json({ status: 'success', data: parsed });
  } catch (err) {
    console.error('analyzeWorkflow error:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── Assistant chatbot de configuration ────────────────────────────────────────
exports.chatAssistant = async (req, res) => {
  try {
    const { messages = [], context = {} } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Messages requis' });
    }

    const availablePosts = context.availablePosts || [];
    const postsContext = availablePosts.length > 0
      ? 'Postes disponibles dans l\'entreprise : ' + availablePosts.join(', ')
      : '';

    // ✅ NOUVEAU systemPrompt — assistant de conseil uniquement, pas de création de workflow
    const systemPrompt =
      'Tu es un assistant expert en gestion de processus métier pour l\'application AxiaWorkflow.\n'
      + 'Ton rôle est d\'aider et conseiller l\'utilisateur pendant qu\'il configure son workflow manuellement.\n\n'

      + 'CE QUE TU DOIS FAIRE :\n'
      + '- Répondre aux questions sur la configuration des workflows\n'
      + '- Conseiller sur le nombre d\'étapes recommandées selon le processus\n'
      + '- Suggérer les bons délais pour chaque type de validation\n'
      + '- Recommander les champs de formulaire adaptés au contexte métier\n'
      + '- Expliquer la différence entre les types de champs (text, select, table, signature...)\n'
      + '- Conseiller sur les bonnes pratiques des processus métier\n'
      + '- Aider à résoudre les problèmes de configuration\n'
      + '- Suggérer des améliorations sur le workflow en cours de création\n'
      + '- Expliquer les rôles, permissions et assignations d\'étapes\n\n'

      + 'CE QUE TU NE DOIS JAMAIS FAIRE :\n'
      + '- Ne jamais générer de JSON\n'
      + '- Ne jamais créer un workflow complet automatiquement\n'
      + '- Ne pas collecter des informations pour générer un workflow\n'
      + '- Ne pas écrire WORKFLOW_JSON ou tout autre format de données structurées\n\n'

      + 'STYLE DE RÉPONSE :\n'
      + '- Réponds directement et clairement à la question posée\n'
      + '- Sois concis (3-5 lignes maximum sauf si explication technique nécessaire)\n'
      + '- Utilise des exemples concrets liés au contexte métier\n'
      + '- Réponds toujours en français\n'
      + '- Si la question n\'est pas liée aux workflows, redirige poliment vers ce sujet\n\n'

      + (postsContext ? 'Contexte de l\'entreprise :\n' + postsContext + '\n\n' : '')
      + (context.workflowName ? 'Workflow en cours de configuration : "' + context.workflowName + '"\n' : '')
      + (context.steps?.length ? 'Nombre d\'étapes actuelles : ' + context.steps.length + '\n\n' : '');

    const userMessages = messages.map(m => ({ role: m.role, content: m.content }));

    // ✅ Injecter le systemPrompt dans le premier message user
    const firstUserIndex = userMessages.findIndex(m => m.role === 'user');
    if (firstUserIndex !== -1) {
      userMessages[firstUserIndex] = {
        role: 'user',
        content: systemPrompt + '\n\n---\n\n' + userMessages[firstUserIndex].content,
      };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        max_tokens:  800,
        temperature: 0.5,
        messages:    userMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq chatAssistant error:', errText);
      return res.status(500).json({ status: 'fail', message: 'Erreur API IA : ' + response.status });
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    res.status(200).json({
      status: 'success',
      data: {
        message:      content.trim(),
        workflowJson: null,  // ✅ toujours null — l'assistant ne génère plus de workflow
      },
    });

  } catch (err) {
    console.error('chatAssistant error:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};
// ── Helpers ───────────────────────────────────────────────────────────────────
const buildDefaultFields = (stepName, stepIndex) => [
  { id: 'f_' + stepIndex + '_1', label: 'Decision', type: 'select', required: true, options: ['Approuve', 'Refuse', 'En attente'] },
  { id: 'f_' + stepIndex + '_2', label: 'Commentaire', type: 'textarea', required: false, options: [] },
  { id: 'f_' + stepIndex + '_3', label: 'Date de traitement', type: 'date', required: true, options: [] },
];

const buildFallbackWorkflow = (description) => ({
  workflowName: 'Workflow — ' + description.substring(0, 30),
  description:  description.substring(0, 80),
  visibility:   'global',
  steps: [
    {
      name: 'Demande Employe', description: "Soumission de la demande par l'employe",
      assignedPost: '', delai: '',
      claims: { canValidate: false, canReject: false, canModify: true, canView: true },
      form: { fields: [
        { id: 'f_0_1', label: 'N Demande',       type: 'auto_number', required: false, readOnly: true,  options: [], columns: [] },
        { id: 'f_0_2', label: 'Demandeur',        type: 'auto_user',   required: false, readOnly: true,  options: [], columns: [] },
        { id: 'f_0_3', label: 'Date de demande',  type: 'date',        required: true,  readOnly: false, options: [], columns: [] },
        { id: 'f_0_4', label: 'Motif',            type: 'textarea',    required: true,  readOnly: false, options: [], columns: [] },
      ]},
      checklist: [],
    },
    {
      name: 'Validation Manager', description: 'Validation par le responsable',
      assignedPost: 'Responsable', delai: '2j',
      claims: { canValidate: true, canReject: true, canModify: false, canView: true },
      form: { fields: [
        { id: 'f_1_1', label: 'Decision',    type: 'select',   required: true,  options: ['Approuve', 'Refuse', 'Renvoye'], columns: [] },
        { id: 'f_1_2', label: 'Commentaire', type: 'textarea', required: false, options: [], columns: [] },
      ]},
      checklist: [
        { id: 'c_1_1', label: 'Dossier complet verifie', required: true,  checked: false },
      ],
    },
  ],
});
