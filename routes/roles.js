const express = require("express");
const router = express.Router();
const RoleController = require("../app/controllers/RoleController");

router.get("/getroles", RoleController.getRoles);

module.exports = router;
