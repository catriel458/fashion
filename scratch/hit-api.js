const http = require('http');

function hit(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        // We can pass cookies if we need session, but let's see what it returns without auth
        'Accept': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      console.log(`\n--- Hitting ${path} ---`);
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Body (first 300 chars):`, data.substring(0, 300));
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`Error hitting ${path}:`, err.message);
      resolve();
    });

    req.end();
  });
}

async function main() {
  await hit('/api/shopping-admin/config');
  await hit('/api/shopping-admin/stores');
}

main();
