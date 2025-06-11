'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PersonalExpenses', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      description: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.FLOAT, allowNull: false },
      isMonthly: { type: Sequelize.BOOLEAN, defaultValue: false },
      dueDay: { type: Sequelize.INTEGER },
      date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('PersonalExpenses');
  }
}; 