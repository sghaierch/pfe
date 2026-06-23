// tests/e2e/auth.spec.js
const { test, expect } = require('@playwright/test');
const { loginAs, clearAuth } = require('./helpers/auth');

test.describe('Page de connexion', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('la page de login s\'affiche correctement', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('le lien "Mot de passe oublié" fonctionne', async ({ page }) => {
    await page.click('text=Mot de passe oublié');
    await expect(page).toHaveURL('/forget-password');
  });

  test('le lien "Créer un compte" fonctionne', async ({ page }) => {
    await page.click('text=Créer un compte');
    await expect(page).toHaveURL('/company/register');
  });

  test('erreur avec mauvais identifiants', async ({ page }) => {
    await page.fill('input[type="email"]',    'faux@email.com');
    await page.fill('input[type="password"]', 'mauvaismdp');
    await page.click('button[type="submit"]');

    // ✅ FIX : attend que le bouton redevienne cliquable (loading terminé)
    // puis vérifie qu'on est toujours sur /login
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL('/login');

    // ✅ FIX : cherche le div d'erreur par sa couleur de fond rouge exacte
    const errorDiv = page.locator('div').filter({
      has: page.locator('i.ri-error-warning-fill')
    }).first();
    await expect(errorDiv).toBeVisible({ timeout: 5000 });
  });

  test('le bouton afficher/masquer le mot de passe fonctionne', async ({ page }) => {
    await page.fill('input[type="password"]', 'test123');
    await page.locator('button:near(input[type="password"])').first().click();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });
});

test.describe('Connexion Superadmin', () => {

  test('superadmin est redirigé vers son dashboard', async ({ page }) => {
    await loginAs(page, 'superadmin');
    await expect(page).toHaveURL(/dashboard\/superadmin/);
  });

  test('dashboard superadmin affiche les menus corrects', async ({ page }) => {
    await loginAs(page, 'superadmin');
    await expect(page.locator('text=Tableau de bord').or(page.locator('text=Dashboard'))).toBeVisible();
    await expect(page.locator('text=Entreprises')).toBeVisible();
    await expect(page.locator('text=Abonnements')).toBeVisible();
    await expect(page.locator('text=Plans')).toBeVisible();
  });

  test('déconnexion superadmin fonctionne', async ({ page }) => {
    await loginAs(page, 'superadmin');
    await page.click('button:has-text("Déconnexion")');
    await expect(page).toHaveURL('/login');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});

test.describe('Connexion Company Admin', () => {

  test('company admin est redirigé vers le dashboard company', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/dashboard\/company/);
  });

  test('sidebar company affiche les bons menus', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page.locator('text=Projets')).toBeVisible();
    await expect(page.locator('text=Utilisateurs')).toBeVisible();
    await expect(page.locator('text=Templates')).toBeVisible();
  });
});

test.describe('Connexion Employee', () => {

  test('employee est redirigé vers le dashboard employee', async ({ page }) => {
    await loginAs(page, 'employee');
    await expect(page).toHaveURL(/dashboard\/employee/);
  });

  test('employee ne peut pas accéder au dashboard company', async ({ page }) => {
    await loginAs(page, 'employee');
    await page.goto('/dashboard/company');
    await expect(page).toHaveURL(/dashboard\/employee/);
  });
});

test.describe('Protection des routes', () => {

  test('accès dashboard sans token → redirection login', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/dashboard/company');
    await expect(page).toHaveURL('/login');
  });

  test('accès superadmin sans token → redirection login', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/dashboard/superadmin');
    await expect(page).toHaveURL('/login');
  });
});