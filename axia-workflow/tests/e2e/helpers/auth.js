// tests/e2e/helpers/auth.js

const TEST_ACCOUNTS = {
  superadmin: {
    email:    'admin@axiaworkflow.com',
    password: 'SuperAdmin2024!',
    role:     'superadmin',
  },
  admin: {
    email:    'chaimasghaier12345@gmail.com',
    password: '123456abc*/',
    role:     'company_admin',
  },
  employee: {
    email:    'sghaiermolka7@gmail.com',
    password: 'sghaiermolka7',
    role:     'employee',
  },
};

// ✅ FIX : remplace waitForLoadState('networkidle') par waitForURL
// networkidle timeout car l'app fait des requêtes continues (notifications, polling)
const loginAs = async (page, accountType) => {
  const account = TEST_ACCOUNTS[accountType];
  if (!account) throw new Error(`Compte inconnu : ${accountType}`);

  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { state: 'visible' });

  await page.fill('input[type="email"]',     account.email);
  await page.fill('input[type="password"]',  account.password);
  await page.click('button[type="submit"]');

  // ✅ FIX : attend que l'URL change plutôt que networkidle
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
};

const logout = async (page) => {
  const logoutBtn = page.locator('button:has-text("Déconnexion")');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL('**/login', { timeout: 10000 });
  }
};

// ✅ FIX : goto une page d'abord pour avoir accès au localStorage
const clearAuth = async (page) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
};

const waitForToast = async (page, text) => {
  await page.waitForSelector(`text=${text}`, { timeout: 5000 });
};

module.exports = { loginAs, logout, clearAuth, waitForToast, TEST_ACCOUNTS };