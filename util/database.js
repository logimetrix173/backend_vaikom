const Sequelize=require('sequelize')

const sequelize = new Sequelize('dms', 'dmsadminsql', 'Dms@1234', {
    host: '10.10.0.60',
    port: '5432',
    dialect: 'postgres',
  });
  
module.exports=sequelize;

