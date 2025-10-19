'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add subtotal column
    await queryInterface.addColumn('bookings', 'subtotal', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true, // Allow null for existing records
      defaultValue: 0.00
    });

    // Add serviceFee column
    await queryInterface.addColumn('bookings', 'serviceFee', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true, // Allow null for existing records
      defaultValue: 0.00
    });

    // For existing bookings, set subtotal = totalAmount and serviceFee = 0
    await queryInterface.sequelize.query(`
      UPDATE bookings
      SET subtotal = "totalAmount",
          serviceFee = 0.00
      WHERE subtotal IS NULL;
    `);

    // Now make the columns NOT NULL
    await queryInterface.changeColumn('bookings', 'subtotal', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });

    await queryInterface.changeColumn('bookings', 'serviceFee', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns if we need to rollback
    await queryInterface.removeColumn('bookings', 'subtotal');
    await queryInterface.removeColumn('bookings', 'serviceFee');
  }
};
