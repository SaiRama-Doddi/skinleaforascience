const { pool } = require('../src/config/db');

async function optimizeDbImages() {
  try {
    const [prods] = await pool.query('SELECT id, image_url, images FROM products');
    for (const p of prods) {
      if (p.image_url && p.images) {
        let imgs = [];
        try { imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images; } catch(e) {}
        if (Array.isArray(imgs) && (imgs.length === 0 || (imgs.length === 1 && imgs[0] === p.image_url))) {
          await pool.query('UPDATE products SET images = NULL WHERE id = ?', [p.id]);
          console.log(`Cleared duplicate images column for Product #${p.id}`);
        }
      }
    }
    console.log('✅ DB Image Column Optimization Complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

optimizeDbImages();
