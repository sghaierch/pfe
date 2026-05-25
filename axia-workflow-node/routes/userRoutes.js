const { createUser, getAllUsers, getUserById, updateUser, deleteUser, forgetPassword } = require("../controllers/userController");
const { protectorMW, permitMW } = require("../controllers/authController"); 

const express = require("express");
const router = express.Router();

router.post("/forgetPassword", forgetPassword);

router.use(protectorMW);
router.use(permitMW("superadmin"));

router.route("/")
  .post(createUser)
  .get(getAllUsers);

router.route("/:id")
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;