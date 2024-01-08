exports.getRoles = async (req, res, next) => {
  const { Role } = req.db.models;

  await Role.findAll({})
    .then((roles) => {
      res.status(200).send({
        success: true,
        message: "Following are roles: ",
        roles: roles,
      });
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: "Internal Server Error",
      });
    });
};
