'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Saida extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Saida.init({
    nome: DataTypes.STRING,
    justificativa: DataTypes.STRING,
    valor: DataTypes.FLOAT,
    data: DataTypes.DATE,
    cliente: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Saida',
  });
  return Saida;
};