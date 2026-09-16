const { pool } = require('../src/config/db');

async function inspectItems() {
  try {
    const [orders] = await pool.query('SELECT o.id, o.order_number, o.customer_name, COUNT(i.id) as items_count FROM orders o LEFT JOIN order_items i ON o.id = i.order_id GROUP BY o.id');
    console.table(orders);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

inspectItems();
