const express = require("express");
const { signup, signin, logout } = require("../controllers/authController");
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);

// ✅ FIX : Register.jsx appelle GET /roles/public — route manquante ajoutée ici
// On retourne les rôles publics (superadmin seulement pour l'inscription publique)
router.get("/roles/public", (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      roles: [
        { _id: 'superadmin', name: 'superadmin' },
      ],
    },
  });
});

module.exports = router;