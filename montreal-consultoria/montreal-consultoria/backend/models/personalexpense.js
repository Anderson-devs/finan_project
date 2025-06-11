'use strict';
module.exports = (sequelize, DataTypes) => {
  const PersonalExpense = sequelize.define('PersonalExpense', {
    description: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    isMonthly: DataTypes.BOOLEAN,
    dueDay: DataTypes.INTEGER,
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {});
  PersonalExpense.associate = function(models) {
    // associations can be defined here
  };
  return PersonalExpense;
}; 