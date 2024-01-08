const express = require("express");
const router = express.Router();

const UserController = require("../app/controllers/UserController");
const { profileImage } = require("../middleware/ImageUpload");
console.log("Profile Image: ", profileImage);

router.get("/getuser", UserController.getUser);
router.post("/completeprofile", profileImage, UserController.completeProfile);

router.get("/getimg", UserController.getImage);

module.exports = router;
