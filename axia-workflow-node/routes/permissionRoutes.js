const express = require("express");
const router = express.Router();
const { 
  getAllPermissions, 
  getPermissionsByCategory,
  createPermission, 
  updatePermission, 
  deletePermission 
} = require("../controllers/permissionController");
const { protectorMW, permitMW } = require("../controllers/authController");

router.use(protectorMW);
router.use(permitMW("superadmin"));

router.route("/")
  .get(getAllPermissions)
  .post(createPermission);

router.route("/category/:category")
  .get(getPermissionsByCategory);

router.route("/:id")
  .patch(updatePermission)
  .delete(deletePermission);

module.exports = router;