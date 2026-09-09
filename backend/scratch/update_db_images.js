const { pool } = require('../src/config/db');

function makeSvgBase64(title, iconPath, bg1, bg2) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'>
    <defs>
      <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='${bg1}' />
        <stop offset='100%' stop-color='${bg2}' />
      </linearGradient>
    </defs>
    <rect width='600' height='600' fill='url(#bg)' />
    <circle cx='300' cy='260' r='120' fill='rgba(255,255,255,0.15)' />
    <path d='${iconPath}' fill='#ffffff' transform='translate(236, 196) scale(5.33)' />
    <text x='300' y='440' font-family='Georgia, serif' font-size='32' font-weight='bold' fill='#ffffff' text-anchor='middle'>${title}</text>
    <text x='300' y='480' font-family='sans-serif' font-size='16' fill='rgba(255,255,255,0.8)' text-anchor='middle'>LEAFORA BOTANICALS</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

const leafIcon = 'M17.5 3C9.5 3 3 9.5 3 17.5C3 22 5.5 26 9.5 28.2L3 34.7L4.3 36L10.8 29.5C13 33.5 17 36 21.5 36C29.5 36 36 29.5 36 21.5C36 11.3 27.7 3 17.5 3Z';
const jarIcon = 'M12 4H28V8H12V4ZM10 10H30V32C30 34.2 28.2 36 26 36H14C11.8 36 10 34.2 10 32V10ZM14 16V28H26V16H14Z';
const dropperIcon = 'M19 3L14 8L16.5 10.5L10 17L12 19L18.5 12.5L21 15L26 10L19 3ZM8 20L4 24V28L8 32H12L16 28L10 22L8 20Z';

async function updateDbImages() {
  try {
    const catImages = {
      1: makeSvgBase64('Herbal Extracts', leafIcon, '#2D5A27', '#1E3918'),
      2: makeSvgBase64('Supplements', jarIcon, '#8C6D46', '#5C4428'),
      3: makeSvgBase64('Formulations', dropperIcon, '#3B5998', '#1E2E4F'),
      4: makeSvgBase64('Skin Care', leafIcon, '#3E7B70', '#20433D'),
      5: makeSvgBase64('Face Creams', jarIcon, '#A67C52', '#6E4E30'),
      7: makeSvgBase64('Moisturizers', jarIcon, '#5B8C5A', '#335432'),
      8: makeSvgBase64('Face Masks', dropperIcon, '#7C5295', '#4A2C5E')
    };

    for (const [id, url] of Object.entries(catImages)) {
      await pool.query('UPDATE categories SET image_url = ? WHERE id = ?', [url, id]);
    }
    console.log('✅ Updated all categories with DB Base64 images.');

    const prod1Url = makeSvgBase64('LeafExtract Pharma', leafIcon, '#2D5A27', '#1E3918');
    await pool.query('UPDATE products SET image_url = ?, images = ? WHERE id = 1', [prod1Url, JSON.stringify([prod1Url])]);
    console.log('✅ Updated Product #1 with DB Base64 image.');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateDbImages();
