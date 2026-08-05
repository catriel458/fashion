const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/shopping-admin/config',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Finished request.`);
  });
});

req.on('error', (err) => {
  console.error(`Error:`, err.message);
});

req.end();
