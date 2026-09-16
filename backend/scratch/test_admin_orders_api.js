const { pool } = require('../src/config/db');

async function testGetOrders() {
  try {
    const [rows] = await pool.query('SELECT o.* FROM orders o WHERE o.deleted_at IS NULL ORDER BY o.id DESC');
    console.log('Active Orders count in DB query:', rows.length);
    for (let o of rows) {
      const [itemsCnt] = await pool.query('SELECT COUNT(*) as cnt, SUM(quantity) as total_qty FROM order_items WHERE order_id = ?', [o.id]);
      o.items_count = itemsCnt[0]?.total_qty || itemsCnt[0]?.cnt || 1;
      console.log(`Order #${o.order_number} | ID: ${o.id} | Customer: ${o.customer_name} (${o.customer_email}) | Total: ₹${o.total_amount} | Status: ${o.status} | Payment: ${o.payment_status} | Items: ${o.items_count}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    process.exit(1);
  }
}

testGetOrders();
