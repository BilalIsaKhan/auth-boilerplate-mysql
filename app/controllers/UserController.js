const path = require("path");
exports.getUser = async (req, res, next) => {
  try {
    const { User } = req.db.models;
    const userId = req?.auth?.data?.userId;
    await User.findOne({
      id: userId,
    })
      .then((user) => {
        if (user) {
          return res.status(200).send({
            success: true,
            message: "user found successfully",
            user,
          });
        } else {
          return res.status(400).send({
            success: false,
            message: "user not found",
          });
        }
      })
      .catch((err) => {
        return res.status(400).send({
          success: false,
          message: "Some Error occured. Try again",
        });
      });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getImage = async (req, res, next) => {
  const { User } = req.db.models;
  res.sendFile(
    path.join(
      "F:Loyalist/backendauth-user-boiler-mysqlapp",
      "files",
      "/1680085903058-abc.png"
    )
  );
};

exports.completeProfile = async (req, res, next) => {
  try {
    const { User } = req.db.models;
    console.log("Req.auth is :", req.auth);
    const userId = req?.auth?.data?.userId;
    console.log("User Id : ", userId);
    console.log("Body is ", req.files["profileImage"][0].filename);

    const ProfileImageName = req.files["profileImage"][0].filename;

    await User.findOne({
      where: {
        id: userId,
      },
    }).then(async (user) => {
      if (user) {
        await user
          .update({
            phoneNo: req.body.phoneNo,
            email: req.body.email,
            tiktok: req.body.tiktok,
            instagram: req.body.instagram,
            spotify: req.body.spotify,
            isProfileComplete: true,
            fullName: req.body.fullName,
            profile: "/files/" + ProfileImageName,
          })
          .then(() => {
            return res
              .status(200)
              .send({
                success: true,
                message: "Profile Updated successfully.",
              });
          })
          .catch((err) => {
            return res.status(400).send({
              success: false,
              message: "error updating profile" + err.message,
            });
          });
      }
    });
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Internal Server Error : " + err.message,
    });
  }
};
