const http = require('http');

http.get('http://localhost:3005/api/seed/migrate', (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Migration Result:", JSON.parse(data));
  });
});
