const Sequelize = require("sequelize");

const sequelize = require("../../util/database");

const link = sequelize.define(
  "guest",
  {
    id: {
      type: Sequelize.INTEGER,
      allowedNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    file_id: {
      type: Sequelize.INTEGER,
      allowedNull: true,
    },
    folder_id: {
      type: Sequelize.INTEGER,
      allowedNull: true,
    },
    guest_email: {
      type: Sequelize.STRING,
      allowedNull: false,
    },
    expiry_date: {
      type: Sequelize.STRING,
      allowedNull: true,
    },
    share: {
      type: Sequelize.STRING,
      allowedNull: false,
    },
    rename: {
      type: Sequelize.STRING,
      allowedNull: false,
    },
    move: {
      type: Sequelize.STRING,
      allowedNull: false,
    },
    rights: {
      type: Sequelize.STRING,
      allowedNull: false,
    },
    comment: {
      type: Sequelize.STRING,
      allowedNull: false,
    },
    properties: {
      type: Sequelize.STRING,
      allowedNull: false,
    },
    delete_action: {
      type: Sequelize.STRING,
      allowedNull: false,
    },
    download: {
      type: Sequelize.STRING,
      allowedNull: true,
    },
    view: {
      type: Sequelize.STRING,
      allowedNull: true,
    },
    create_folder: {
      type: Sequelize.STRING,
      allowedNull: true,
    },
    upload_file: {
      type: Sequelize.STRING,
      allowedNull: true,
    },
    upload_folder: {
      type: Sequelize.STRING,
      allowedNull: true,
    },
    shared_by: {
      type: Sequelize.STRING,
      allowedNull: false,
    },
  },
  {
    schema: "Link-sharing",
  }
);

module.exports = link;
