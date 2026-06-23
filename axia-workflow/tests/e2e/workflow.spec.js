// tests/e2e/workflow.spec.js
const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers/auth');

test.describe('Projets', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/company/projects');
    await page.waitForLoadState('domcontentloaded');
  });

  test('la liste des projets s\'affiche', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('bouton Nouveau projet est visible pour l\'admin', async ({ page }) => {
    await expect(
      page.locator('button').filter({ hasText: /Nouveau|Créer|projet/i }).first()
        .or(page.locator('a').filter({ hasText: /Nouveau|Créer/i }).first())
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Templates de workflow', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/company/templates');
    await page.waitForLoadState('domcontentloaded');
  });

  test('la page templates charge correctement', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('bouton Nouveau template est visible', async ({ page }) => {
    await expect(
      page.locator('button').filter({ hasText: /Nouveau template|template/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('créer un template — ouvre le formulaire', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Nouveau template|Nouveau/i }).first().click();

    // ✅ FIX : utilise getByRole heading pour éviter le strict mode violation
    await expect(
      page.getByRole('heading', { name: /Créer un template/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('sélectionner le type validation + confirmation', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Nouveau template|Nouveau/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('button').filter({ hasText: /Validation.*Confirmation/i }).first().click();

    // ✅ FIX : utilise getByText avec exact pour éviter strict mode violation
    await expect(
      page.getByText('Demande Employé', { exact: true }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Types de documents', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/company/document-types');
    await page.waitForLoadState('domcontentloaded');
  });

  test('la page types de documents charge', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Utilisateurs', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/company/users');
    await page.waitForLoadState('domcontentloaded');
  });

  test('la liste des utilisateurs s\'affiche', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('bouton Ajouter utilisateur est présent', async ({ page }) => {
    await expect(
      page.locator('a[href*="users/create"], a[href*="user/create"]')
        .or(page.locator('button').filter({ hasText: /Ajouter|Créer|Nouveau/i }).first())
        .or(page.locator('a').filter({ hasText: /Ajouter|Créer|Nouveau/i }).first())
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Sécurité des accès', () => {

  test('employee redirigé si accès page admin', async ({ page }) => {
    await loginAs(page, 'employee');
    await page.goto('/dashboard/company/users');
    await expect(page).toHaveURL(/dashboard\/employee|login/, { timeout: 10000 });
  });

  test('page unauthorized existe', async ({ page }) => {
    await page.goto('/unauthorized');
    await expect(page.locator('body')).toBeVisible();
  });
});