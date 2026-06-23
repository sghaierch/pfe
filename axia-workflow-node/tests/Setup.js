// tests/setup.js
// Variables d'environnement pour les tests
// Ces valeurs sont FAUSSES — uniquement pour les tests unitaires et d'intégration
// Elles ne touchent PAS ta vraie base de données

process.env.DATABASE_URL         = 'mongodb://localhost:27017/test';
process.env.DATABASE_PASSWORD    = 'test_password';
process.env.JWT_SECRET_KEY       = 'test_secret_key_very_long_for_jest_tests_only';
process.env.JWT_EXPIRES_IN       = '1h';
process.env.NODE_ENV             = 'test';
process.env.EMAIL                = 'test@test.com';
process.env.PASSWORD_APPLICATION = 'test_app_password';
process.env.VAPID_PUBLIC_KEY     = 'BDtvjRbwOMB2TOFo_TEST_FAKE_KEY_FOR_TESTS_ONLY';
process.env.VAPID_PRIVATE_KEY    = 'V9mNBiBZmbRy_TEST_FAKE_KEY_FOR_TESTS_ONLY';
process.env.VAPID_EMAIL          = 'mailto:test@test.com';
process.env.STRIPE_SECRET_KEY    = 'sk_test_fake_key_for_tests';
process.env.STRIPE_WEBHOOK_SECRET= 'whsec_fake_key_for_tests';
process.env.GROQ_API_KEY         = 'gsk_fake_key_for_tests';
process.env.FRONTEND_URL         = 'http://localhost:3000';
process.env.ALLOWED_ORIGINS      = 'http://localhost:3000';
process.env.MONGODB_BASE_URI     = 'mongodb://localhost:27017';

// Silence les logs pendant les tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});