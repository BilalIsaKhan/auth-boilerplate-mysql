const crypto = require("crypto");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
const validator = require("validator");

const { OAuth2Client } = require("google-auth-library");

// const Twilio = require("twilio");
// const client = new Twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

const sendMail = require("../../helpers/nodeMailer");

exports.login = (req, res, next) => {
  try {
    const { User } = req.db.models;
    const validationErrors = [];
    console.log("LJLJLJLJ");

    if (
      validator.isEmpty(req.body.phoneNo) ||
      req.body.phoneNo.toString().length < 6 ||
      req.body.phoneNo.toString().length > 12
    )
      validationErrors.push("Enter a correct phone no.");
    if (validator.isEmpty(req.body.password))
      validationErrors.push("Password cannot be blank.");
    if (validationErrors.length) {
      return res
        .status(400)
        .send({ status: false, message: "Email and Password is required." });
    }
    User.findOne({
      where: {
        phoneNo: req.body.phoneNo,
      },
    })
      .then((user) => {
        console.log("User is here");
        if (user) {
          console.log("User exists");
          bcrypt
            .compare(req.body.password, user.password)
            .then(async (doMatch) => {
              if (doMatch) {
                console.log(" user is matched");
                // req.session.isLoggedIn = true;
                // req.session.user = .dataValues;
                // return req.session.save(err => {
                // 	console.log(err);
                // 	res.redirect('/');
                // });
                if (!user.dataValues.isVerified) {
                  return res.status(200).send({
                    status: false,
                    message:
                      "veification is required, verify your account and try again.",
                  });
                }
                const token = await jwt.sign(
                  {
                    data: {
                      userId: user.dataValues.id,
                      phoneNo: user.dataValues.phoneNo,
                    },
                  },
                  process.env.JWT_TOKEN_KEY,
                  { expiresIn: "1h" }
                );

                const refreshToken = await jwt.sign(
                  {
                    data: {
                      userId: user.dataValues.id,
                      phoneNo: user.dataValues.phoneNo,
                    },
                  },
                  process.env.JWT_REFRESH_TOKEN_KEY,
                  { expiresIn: "7d" }
                );
                const { fullName, id, email } = user.dataValues;

                return res.status(200).send({
                  status: true,
                  message: "Login successfull.",
                  token,
                  refreshToken,
                  user,
                });
              } else {
                return res.status(200).send({
                  status: false,
                  message: "Phone Number or Password is incorrect.",
                });
              }
            })
            .catch((err) => {
              console.log(err);
              return res.status(500).send({
                status: false,
                message: "Sorry! Somethig went wrong.",
                err,
              });
            });
        } else {
          return res.status(200).send({
            status: false,
            message: "No user found with this phone number",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        return res.status(500)({
          status: false,
          message: "Sorry! Somethig went wrong.",
          err,
        });
      });
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .send({ status: false, message: "Sorry! Somethig went wrong.", err });
  }
};

exports.logout = (req, res, next) => {
  if (res.locals.isAuthenticated) {
    req.session.destroy((err) => {
      return res.redirect("/");
    });
  } else {
    return res.redirect("/login");
  }
};

exports.signUp = async (req, res, next) => {
  try {
    // if (!req.body.password) {
    //   return res.status(422).send({
    //     success: false,
    //     message: "Password must be provided",
    //   });
    // }

    const { User } = req.db.models;
    const existingUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(req.body.password, 12);
      const token = await jwt.sign(
        {
          data: { email: req.body.email },
        },
        process.env.JWT_VERIFY_TOKEN,
        { expiresIn: `${process.env.VERIFY_TOKEN_EXPIRY}` }
      );

      const newUser = new User({
        email: req.body.email,
        fullName: req.body.fullName,
        password: hashedPassword,
        verificationToken: token,
        role_id: req.body.roleId,
      });

      const result = await newUser.save();

      const verificationLink = `${process.env.VERIFY_URL}/verify?verificationToken=${result.verificationToken}`;
      console.log("Verification link is   ", verificationLink);

      const emailResponse = await sendMail({
        from: '"Fred Foo :ghost:" <foo@example.com>',
        to: req.body.email,
        subject: "Verify Email",
        html: `<b>Verify email at <a href=${verificationLink}>Click Here to verify Email</a></b>`,
      });

      return res.status(200).send({
        status: true,
        message: "User created successfully.",
        testURI: emailResponse.testURI,
      });
    } else {
      return res.status(400).send({
        success: false,
        message: "Email exists already, please pick a different one.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
};

exports.accountVerify = async (req, res, next) => {
  try {
    const { User } = req.db.models;
    const { verificationToken } = req.query;
    var decoded = await jwt.verify(
      verificationToken,
      process.env.JWT_VERIFY_TOKEN
    );
    User.findOne({
      where: {
        email: decoded.data.email,
      },
    })
      .then(async (user) => {
        if (user && user.verificationToken === verificationToken) {
          let result = await user.update({
            isVerified: true,
            verificationToken: null,
          });
          if (result) {
            res.redirect(process.env.VERIFY_RETURN_URL_SUCCESS);
          } else {
            res.redirect(process.env.VERIFY_RETURN_URL_FAIL);
          }
        } else {
          res.redirect(process.env.VERIFY_RETURN_URL_FAIL);
          // res.status(200).send({ message:"Invalid token",status:false })
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ status: false, message: "Something went wrong", err });
  }
};

exports.googleLogin = async (req, res, next) => {
  const googleclient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const { idToken } = req.body;

  var response = await googleclient
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then(async (response) => {
      const { email_verified, name, email } = response.payload;
      if (email_verified) {
        await User.findOne({
          where: {
            email: email,
          },
        })
          .then(async (user) => {
            //User Already Exists
            if (user) {
              const token = await jwt.sign(
                {
                  data: { userId: user.dataValues.id, role: "User" },
                },
                process.env.JWT_TOKEN_KEY,
                { expiresIn: "2y" }
              );

              const refreshToken = await jwt.sign(
                {
                  data: { userId: user.dataValues.id, role: "User" },
                },
                process.env.JWT_REFRESH_TOKEN_KEY,
                { expiresIn: "2y" }
              );

              return res.status(200).send({
                success: true,
                message: "Login successful.",
                token,
                refreshToken,
                user,
                alreadyExists: true,
              });
            }
            //User not exists
            else {
              const token = await jwt.sign(
                {
                  data: { email: req.body.phoneNo },
                },
                process.env.JWT_VERIFY_TOKEN,
                { expiresIn: `${process.env.VERIFY_TOKEN_EXPIRY}` }
              );

              await User.create({
                phoneNo: req.body.phoneNo,
                password: hashedPassword,
                verificationToken: token,
                verificationToken: null,
                isVerified: true,
              }).then((usr) => {
                if (usr) {
                  return res.status(200).send({
                    success: true,
                    message:
                      "Signup successful; Kindly complete your profile your profile",
                    user: usr,
                  });
                }
              });
            }
          })
          .catch((err) => {
            return res
              .status(400)
              .send({ success: false, message: "Some Error happend" });
          });
      } else {
        return res.status(400).send({
          message: "Email not verified from Google",
          success: false,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        message: "please try again",
        success: false,
      });
    });
};

// exports.accountVerify = async (req, res, next) => {
//   try {
//     const { User } = req.db.models;

//     const { verificationToken } = req.query;
//     var decoded = await jwt.verify(
//       verificationToken,
//       process.env.JWT_VERIFY_TOKEN
//     );
//     User.findOne({
//       where: {
//         email: decoded.data.email,
//       },
//     })
//       .then(async (user) => {
//         if (user && user.verificationToken === verificationToken) {
//           let result = await user.update({
//             isVerified: true,
//             verificationToken: null,
//           });
//           if (result) {
//             res.status(200).send({ message: "Verified successfully" });
//           } else {
//             res.status(201).send({ message: "Not verified. try again" });
//           }
//         } else {
//           res.status(201).send({ message: "Not verified. try again" });

//           // res.status(200).send({ message:"Invalid token",status:false })
//         }
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   } catch (err) {
//     console.log(err);
//     return res
//       .status(500)
//       .send({ status: false, message: "Something went wrong", err });
//   }
// };

exports.forgotPassword = async (req, res, next) => {
  const { User } = req.db.models;

  const validationErrors = [];
  console.log("email", req.body.email);
  try {
    if (!validator.isEmail(req?.body?.email))
      validationErrors.push("Please enter a valid email address.");

    if (validationErrors.length) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter a valid email address" });
    }

    User.findOne({
      where: {
        email: req?.body?.email,
      },
    })
      .then(async (user) => {
        if (user) {
          const token = await jwt.sign(
            {
              data: { email: req.body.email },
            },
            process.env.JWT_RESET_TOKEN,
            { expiresIn: `${process.env.VERIFY_TOKEN_EXPIRY}` }
          );

          user.resetToken = token;
          user.resetTokenExpiry = Date.now() + 3600000;
          const userSave = await user.save();
          if (!userSave) {
            return res
              .status(500)
              .send({ status: false, message: "Something went wrong" });
          }
          let emailResponse = await sendMail({
            from: '"Fred Foo 👻" <foo@example.com>', // sender address
            to: req.body.email, // list of receivers
            subject: "Reset password Email", // Subject line
            text: "reset email", // plain text body
            html: `<b>Verify email at <a href=${process.env.VERIFY_URL}/reset-password?verificationToken=${token}>Click Here to reset Password</a></b>`, // html body
          });
          res.status(200).send({
            message: "A link has been sent to your registered email. ",
            status: !!user,
            testURI: emailResponse.testURI,
          });
        } else {
          res.status(200).send({
            message: "A link has been sent to your registered email. ",
            status: !!user,
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ status: false, message: "Something went wrong", err });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { User } = req.db.models;

    const { verificationToken, password } = req.body;
    var decoded = await jwt.verify(
      verificationToken,
      process.env.JWT_RESET_TOKEN
    );
    User.findOne({
      where: {
        email: decoded.data.email,
      },
    })
      .then(async (user) => {
        if (user && user.resetToken === verificationToken) {
          return bcrypt.hash(password, 12).then(async (hashedPassword) => {
            let result = await user.update({
              password: hashedPassword,
              resetToken: null,
              resetTokenExpiry: null,
            });
            if (result) {
              res
                .status(200)
                .send({ message: "Password updated", status: true });
            } else {
              res.status(200).send({
                message: "Err updating password try again",
                status: false,
              });
            }
          });
        } else {
          // res.redirect(process.env.VERIFY_RETURN_URL_FAIL)

          res.status(200).send({ message: "Invalid token", status: false });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ status: false, message: "Something went wrong", err });
  }
};
exports.getUser = async (req, res, next) => {
  try {
    const { User, Role } = req.db.models;
    const userId = req?.auth?.data?.userId;
    User.findOne({
      where: {
        id: userId,
      },
      include: [
        {
          model: Role,
          required: false,
        },
      ],
    })
      .then(async (user) => {
        if (user) {
          // res.redirect(process.env.VERIFY_RETURN_URL_FAIL)
          const { fullName, id, email } = user;

          res.status(200).send({
            status: true,
            user: { fullName, id, email, role: user.Role },
          });
        } else {
          res
            .status(200)
            .send({ status: false, user: null, message: "User not found" });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ status: false, message: "Something went wrong", err });
  }
};
