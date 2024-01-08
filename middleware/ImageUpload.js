const multer = require("multer");
//Multer Setup Started
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: (req, file, cb) => {
    console.log("file.originalname ", file.originalname);
    var originalname = file.originalname;
    originalname = originalname.replace(/\s/g, "");
    console.log("originalname", originalname);
    cb(null, Date.now() + "-" + originalname);
  },
});
const profileImage = multer({
  storage: storage,
  limits: { fieldSize: 100 * 1024 * 1024 },
}).fields([{ name: "profileImage" }]);

module.exports = {
  profileImage,
};
