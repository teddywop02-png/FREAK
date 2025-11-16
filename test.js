// Quick test script to verify basic functionality
const fs = require('fs');
const path = require('path');

console.log('FREAK Streetwear - Quick Test\n');

// Check if all required files exist
const requiredFiles = [
    'package.json',
    'server/server.js',
    'server/db/init_db.js',
    'public/index.html',
    'public/drop.html',
    'public/shop.html',
    'public/admin.html',
    'public/css/main.css',
    'public/js/app.js',
    'public/js/slideshow.js',
    'public/js/drop.js',
    'public/js/shop.js',
    'public/js/admin.js',
    '.env.example',
    'README.md',
    'demo_credentials.txt'
];

console.log('Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✓' : '✗'} ${file}`);
    if (!exists) allFilesExist = false;
});

console.log(`\nFile check: ${allFilesExist ? 'PASSED' : 'FAILED'}\n`);

// Check package.json
console.log('Checking package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDependencies = ['express', 'sqlite3', 'bcryptjs', 'jsonwebtoken', 'stripe', 'cors', 'dotenv'];
    
    let allDepsExist = true;
    requiredDependencies.forEach(dep => {
        const exists = packageJson.dependencies && packageJson.dependencies[dep];
        console.log(`${exists ? '✓' : '✗'} ${dep}`);
        if (!exists) allDepsExist = false;
    });
    
    console.log(`Package dependencies: ${allDepsExist ? 'PASSED' : 'FAILED'}\n`);
} catch (error) {
    console.log('✗ Error reading package.json\n');
}

// Check environment variables
console.log('Checking environment variables...');
try {
    const envExample = fs.readFileSync('.env.example', 'utf8');
    const requiredVars = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'JWT_SECRET', 'PORT'];
    
    let allVarsExist = true;
    requiredVars.forEach(varName => {
        const exists = envExample.includes(varName);
        console.log(`${exists ? '✓' : '✗'} ${varName}`);
        if (!exists) allVarsExist = false;
    });
    
    console.log(`Environment variables: ${allVarsExist ? 'PASSED' : 'FAILED'}\n`);
} catch (error) {
    console.log('✗ Error reading .env.example\n');
}

// Check HTML files for basic structure
console.log('Checking HTML files...');
const htmlFiles = ['public/index.html', 'public/drop.html', 'public/shop.html', 'public/admin.html'];

htmlFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const hasTitle = content.includes('<title>');
        const hasCSS = content.includes('main.css');
        const hasJS = content.includes('.js');
        
        console.log(`✓ ${path.basename(file)} (Title: ${hasTitle ? '✓' : '✗'}, CSS: ${hasCSS ? '✓' : '✗'}, JS: ${hasJS ? '✓' : '✗'})`);
    } catch (error) {
        console.log(`✗ ${path.basename(file)} - Error reading file`);
    }
});

console.log('\nBasic test completed!\n');
console.log('To start the application:');
console.log('1. Run: npm install');
console.log('2. Copy .env.example to .env and configure');
console.log('3. Run: npm run init-db');
console.log('4. Run: npm run dev');
console.log('\nAccess the site at: http://localhost:3000');