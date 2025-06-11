'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Entry extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Entry.init({
    cliente: DataTypes.STRING,
    servico: DataTypes.STRING,
    formaPagamento: DataTypes.STRING,
    dataRef: DataTypes.DATE,
    parcelas: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Entry',
  });
  return Entry;
};