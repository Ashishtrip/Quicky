const http = require('http');

const data = JSON.stringify({
  catalogItemId: "df3c6642-9b71-4785-be52-c8094e991c72",
  stockQuantity: 10,
  expiryBucket: "FRESH_STOCK",
  price: 200,
  isCustom: false,
  name: "Kashmiri Apples",
  unit: "1 kg"
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/stores/store_1/listings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
