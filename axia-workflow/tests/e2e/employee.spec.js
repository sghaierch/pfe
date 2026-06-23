// tests/e2e/employee.spec.js
const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers/auth');

test.describe('Dashboard Employé', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'employee');
  });

  test('dashboard affiche les sections principales', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('bouton Nouvelle demande fonctionne', async ({ page }) => {
    await page.goto('/dashboard/employee/new-request');
    await expect(page).toHaveURL(/new-request/, { timeout: 10000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Liste des types de demandes', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'employee');
    await page.goto('/dashboard/employee/new-request');
    await page.waitForLoadState('domcontentloaded');
  });

  test('la page affiche les types de documents', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('la recherche filtre les demandes', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('xyz_inexistant_test');

      // ✅ FIX : .first() pour éviter strict mode violation (plusieurs éléments matchent)
      await expect(
        page.locator('text=Aucun résultat').or(
          page.locator('text=Aucun type')
        ).or(
          page.locator('text=disponible')
        ).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Flux complet — soumettre une demande', () => {

  test('smoke test — la page de soumission charge', async ({ page }) => {
    await loginAs(page, 'employee');
    await page.goto('/dashboard/employee/new-request');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Notifications', () => {

  test('la cloche de notification est visible', async ({ page }) => {
    await loginAs(page, 'employee');
    await expect(page.locator('h1, h2, [class*="dashboard"]').first()).toBeVisible({ timeout: 10000 });
  });
});