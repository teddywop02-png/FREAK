#!/usr/bin/env node
const https = require('https');

const apiToken = process.env.TURSO_API_TOKEN;
const orgName = 'teddywop02-png';
const dbName = 'freak-newsletter';

if (!apiToken) {
  console.error('Error: TURSO_API_TOKEN environment variable not set');
  process.exit(1);
}

// Create database via Turso API
const postData = JSON.stringify({
  name: dbName,
});

const options = {
  hostname: 'api.turso.tech',
  path: `/v1/organizations/${orgName}/databases`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
    'Content-Length': postData.length,
  },
};

console.log('Creating Turso database...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      const response = JSON.parse(data);
      console.log('✓ Database created successfully!');
      console.log('Database URL:', response.database.primaryUrl);
      console.log('\nAdd this to your .env file:');
      console.log(`TURSO_DB_URL=${response.database.primaryUrl}`);
      console.log(`TURSO_API_TOKEN=${apiToken}`);
    } else if (res.statusCode === 409) {
      console.log('Database already exists');
      // Get database URL
      getDbUrl();
    } else {
      console.error('Error:', res.statusCode, data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();

function getDbUrl() {
  const getOptions = {
    hostname: 'api.turso.tech',
    path: `/v1/organizations/${orgName}/databases/${dbName}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    },
  };

  const getReq = https.request(getOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('Database URL:', response.database.primaryUrl);
        console.log('\nAdd this to your .env file:');
        console.log(`TURSO_DB_URL=${response.database.primaryUrl}`);
        console.log(`TURSO_API_TOKEN=${apiToken}`);
      } else {
        console.error('Error getting database:', res.statusCode, data);
      }
    });
  });

  getReq.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  getReq.end();
}
