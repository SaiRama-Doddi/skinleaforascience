const { pool } = require('../src/config/db');

async function restoreOrders() {
  try {
    const [result] = await pool.query('UPDATE orders SET deleted_at = NULL WHERE deleted_at IS NOT NULL');
    console.log('Restored orders count:', result.affectedRows);
    process.exit(0);
  } catch (err) {
    console.error('Error restoring orders:', err);
    process.exit(1);
  }
}

restoreOrders();
