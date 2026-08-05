const http = require('http');

function login() {
  return new Promise((resolve, reject) => {
    // NextAuth handles credential callbacks at /api/auth/callback/credentials
    const postData = 'email=super%40admin.com&password=superadmin123&redirect=false&json=true';
    
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let cookies = res.headers['set-cookie'] || [];
      // Combine cookies into a single Cookie header string
      const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log("Login Response Status:", res.statusCode);
        console.log("Captured Session Cookies:", cookieStr);
        resolve(cookieStr);
      });
    });

    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

function hitWithCookie(path, cookie) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookie
      }
    };

    const req = http.request(options, (res) => {
      console.log(`\n--- GET ${path} ---`);
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Body (first 500 chars):`, data.substring(0, 500));
        resolve();
      });
    });

    req.on('error', err => {
      console.error("Error:", err.message);
      resolve();
    });

    req.end();
  });
}

async function main() {
  try {
    const cookie = await login();
    if (!cookie) {
      console.error("Could not obtain session cookie");
      return;
    }
    await hitWithCookie('/api/shopping-admin/config', cookie);
    await hitWithCookie('/api/shopping-admin/stores', cookie);
  } catch (e) {
    console.error("Authentication test failed:", e);
  }
}

main();
