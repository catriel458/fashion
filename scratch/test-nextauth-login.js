const http = require('http');

function getCsrf() {
  return new Promise((resolve) => {
    http.get('http://localhost:3005/api/auth/csrf', (res) => {
      const cookies = res.headers['set-cookie'] || [];
      const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const json = JSON.parse(body);
        resolve({ csrfToken: json.csrfToken, cookieStr });
      });
    });
  });
}

function postLogin(csrfToken, csrfCookie) {
  return new Promise((resolve, reject) => {
    const postData = `csrfToken=${encodeURIComponent(csrfToken)}&email=super%40admin.com&password=superadmin123&redirect=false&json=true`;
    
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': csrfCookie
      }
    };

    const req = http.request(options, (res) => {
      const cookies = res.headers['set-cookie'] || [];
      const sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve(sessionCookie);
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
    console.log("Fetching CSRF token...");
    const { csrfToken, cookieStr } = await getCsrf();
    console.log("CSRF Token:", csrfToken);
    
    console.log("Posting credentials...");
    const sessionCookie = await postLogin(csrfToken, cookieStr);
    console.log("Session Cookie:", sessionCookie);

    if (!sessionCookie || !sessionCookie.includes('session-token')) {
      console.log("No session token cookie returned. Full cookies:", sessionCookie);
      return;
    }

    await hitWithCookie('/api/shopping-admin/config', sessionCookie);
    await hitWithCookie('/api/shopping-admin/stores', sessionCookie);
  } catch (e) {
    console.error("Failed:", e);
  }
}

main();
