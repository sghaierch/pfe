const express = require("express");
const router = express.Router();
const {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleById,              // ← ajouter cet import
  addPermissionsToRole,
  removePermissionsFromRole
} = require("../controllers/roleController");
const { protectorMW, permitMW } = require("../controllers/authController");

// Route publique
router.get("/public", async (req, res) => {
  try {
    const Role = require("../models/roleModel");
    const roles = await Role.find({ isSystemRole: false }).select("name description");
    res.status(200).json({
      status: "success",
      data: { roles }
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
});

router.use(protectorMW);
router.use(permitMW("superadmin"));

router.route("/")
  .get(getAllRoles)
  .post(createRole);

router.route("/:id/permissions")
  .post(addPermissionsToRole)
  .delete(removePermissionsFromRole);

router.route("/:id")
  .get(getRoleById)    // ← ligne ajoutée
  .patch(updateRole)
  .delete(deleteRole);

module.exports = router;