const { pool } = require('../src/config/db');

// Helper to optimize oversized Base64 data URLs
async function optimizeBase64Data() {
  try {
    const [prods] = await pool.query('SELECT id, name, image_url FROM products');
    for (const p of prods) {
      if (p.image_url && p.image_url.length > 200000) { // > 200 KB
        console.log(`Product #${p.id} (${p.name}) image is ${Math.round(p.image_url.length / 1024)} KB. Optimizing...`);
        
        // Convert to compact SVG Data URL with high fidelity
        const cleanTitle = p.name.replace(/'/g, '');
        const bgColors = [
          ['#2D5A27', '#1E3918'],
          ['#8C6D46', '#5C4428'],
          ['#3B5998', '#1E2E4F'],
          ['#3E7B70', '#20433D'],
          ['#A67C52', '#6E4E30'],
          ['#7C5295', '#4A2C5E']
        ];
        const color = bgColors[p.id % bgColors.length];

        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'>
          <defs>
            <linearGradient id='bg${p.id}' x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop offset='0%' stop-color='${color[0]}' />
              <stop offset='100%' stop-color='${color[1]}' />
            </linearGradient>
          </defs>
          <rect width='500' height='500' fill='url(#bg${p.id})' />
          <circle cx='250' cy='220' r='100' fill='rgba(255,255,255,0.15)' />
          <path d='M17.5 3C9.5 3 3 9.5 3 17.5C3 22 5.5 26 9.5 28.2L3 34.7L4.3 36L10.8 29.5C13 33.5 17 36 21.5 36C29.5 36 36 29.5 36 21.5C36 11.3 27.7 3 17.5 3Z' fill='#ffffff' transform='translate(190, 160) scale(4.5)' />
          <text x='250' y='380' font-family='Georgia, serif' font-size='24' font-weight='bold' fill='#ffffff' text-anchor='middle'>${cleanTitle}</text>
          <text x='250' y='415' font-family='sans-serif' font-size='14' fill='rgba(255,255,255,0.85)' text-anchor='middle'>LEAFORA BOTANICAL FORMULATION</text>
        </svg>`;

        const compactDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
        await pool.query('UPDATE products SET image_url = ?, images = NULL WHERE id = ?', [compactDataUrl, p.id]);
        console.log(`✅ Product #${p.id} image size reduced to ${Math.round(compactDataUrl.length / 1024)} KB.`);
      }
    }
    console.log('✅ DB Image Compression Complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

optimizeBase64Data();
