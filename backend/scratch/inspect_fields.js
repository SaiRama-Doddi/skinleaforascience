const ProductModel = require('../src/models/productModel');

async function check() {
  const prods = await ProductModel.findAll();
  prods.forEach(p => {
    console.log(`Product ID ${p.id}: ${p.name}`);
    for (const [k, v] of Object.entries(p)) {
      const len = JSON.stringify(v).length;
      if (len > 500) {
        console.log(`  Field '${k}': ${Math.round(len / 1024)} KB`);
      }
    }
  });
  process.exit(0);
}

check();
