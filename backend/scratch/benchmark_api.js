const http = require('http');

function timeFetch(urlName, url) {
  const start = Date.now();
  http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[GET ${urlName}] Status: ${res.statusCode}, Time: ${Date.now() - start}ms, Size: ${Math.round(data.length / 1024)} KB`);
    });
  }).on('error', (err) => console.error(err));
}

timeFetch('products', 'http://localhost:5000/api/products');
timeFetch('categories', 'http://localhost:5000/api/categories');
