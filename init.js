const fs = require('fs');

// Generate empty development and production environment files
fs.createWriteStream('./.env.development','utf-8').write('');
fs.createWriteStream('./.env.production','utf-8').write('');