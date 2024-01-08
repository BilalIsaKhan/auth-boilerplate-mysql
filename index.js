const path = require("path");
// load dependencies
const env = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
var { expressjwt: jwt } = require("express-jwt");

const app = express();

//Loading Routes
const webRoutes = require("./routes/web");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const roleRoutes = require("./routes/roles");
const userRoutes = require("./routes/user");

const { sequelize } = require("./models/index");
const errorController = require("./app/controllers/ErrorController");

env.config();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "files")));
app.use(bodyParser.json());

app.use(
  jwt({
    secret: process.env.JWT_TOKEN_KEY,
    algorithms: ["HS256"],
  }).unless({
    path: [
      "/api/auth/sign-up",
      "/api/auth/login",
      "/api/user/getimg",
      "localhost:4000/files/*",
      "/api/auth/googlelogin",
      "/api/auth/reset-password",
      "/api/auth/forget-password",
      "/api/auth/verify",
      "/api/auth/verify?verificationToken=",
      "/api/test",
      "/api/ping",
      "/api/role/getroles",
    ],
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://127.0.0.1:3306");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Headers", "authorization");
  next();
});

app.use((req, res, next) => {
  req.db = sequelize;
  next();
});

app.use("/api", webRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/user", userRoutes);

sequelize
  // .sync({ force: true })
  .sync({ alter: true })
  // .sync()
  .then(() => {
    app.listen(process.env.PORT);
    //pending set timezone

    console.log("App listening on port " + process.env.PORT);
  })
  .catch((err) => {
    console.log(err);
  });
