const http = require('http');

const postData = JSON.stringify({
  catalogItemId: 'custom_test_123',
  price: 100,
  stockQuantity: 10,
  expiryBucket: 'FRESH_STOCK',
  isCustom: true,
  name: 'Test Product',
  unit: '1 kg',
  imageUrl: '',
  categoryId: 'c4e36502-3c3e-4b40-9a3d-4956381ab8c0' // Just a dummy
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/stores/f37ea095-3104-4d72-ac88-e21fa069a0a3/listings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
