const { pool } = require('../src/config/db');

async function inspectOrders() {
  try {
    const [rows] = await pool.query('SELECT id, order_number, customer_name, customer_email, total_amount, status, payment_status, deleted_at FROM orders');
    console.log('Total orders in DB:', rows.length);
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error inspecting orders:', err);
    process.exit(1);
  }
}

inspectOrders();
