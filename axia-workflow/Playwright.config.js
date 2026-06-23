// playwright.config.js
// À mettre dans le dossier FRONTEND (axia-workflow/)
// C'est le fichier de configuration central de Playwright

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

  // Dossier où se trouvent les tests E2E
  testDir: './tests/e2e',

  // Pattern des fichiers de test
  testMatch: '**/*.spec.js',

  // Timeout global pour chaque test (30 secondes)
  timeout: 30_000,

  // Timeout pour chaque assertion expect()
  expect: { timeout: 10_000 },

  // ✅ Lance les tests en parallèle (1 worker = séquentiel, plus stable)
  workers: 1,

  // Recommence automatiquement si un test échoue (0 en dev, 2 en CI)
  retries: process.env.CI ? 2 : 0,

  // Rapport de test — 'html' génère un rapport visuel dans le navigateur
  reporter: [
    ['list'],          // affichage dans le terminal
    ['html', { open: 'never' }], // rapport HTML (ouvrir avec: npx playwright show-report)
  ],

  // Configuration partagée pour tous les tests
  use: {
    // URL de base de ton frontend
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Capture d'écran automatique quand un test échoue
    screenshot: 'only-on-failure',

    // Vidéo automatique quand un test échoue
    video: 'retain-on-failure',

    // Trace pour debug (ouvrir avec: npx playwright show-trace)
    trace: 'on-first-retry',

    // Simule un vrai utilisateur — pas de headless parfois détecté
    headless: true, // false = tu vois le navigateur s'ouvrir (utile pour debug)
  },

  // Navigateurs sur lesquels tourner les tests
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Décommenter pour tester sur Firefox et Safari aussi
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // Lance automatiquement le serveur frontend avant les tests
  // (commente si tu préfères le lancer manuellement)
  // webServer: {
  //   command: 'npm start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});