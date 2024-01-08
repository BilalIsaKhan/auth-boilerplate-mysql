"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static getUserWithRole() {
      console.log("user with log called");
    }
  }
  User.init(
    {
      fullName: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      phoneNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },

      isProfileComplete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      profile: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      tiktok: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      instagram: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      spotify: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      verificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
