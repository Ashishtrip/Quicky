const http = require('http');

console.log('Testing local API...');
http.get('http://127.0.0.1:4000/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Local API Response:', res.statusCode, data));
}).on('error', (err) => console.log('Local API Error:', err.message));

console.log('Testing remote tunnel...');
const https = require('https');
https.get('https://36bdea98f03cb8.lhr.life/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Tunnel Response:', res.statusCode, data));
}).on('error', (err) => console.log('Tunnel Error:', err.message));
