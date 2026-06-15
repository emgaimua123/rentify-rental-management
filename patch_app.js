const fs = require('fs');
const path = 'public/js/app.js';
let code = fs.readFileSync(path, 'utf-8');

// Replace rentify_bills
code = code.replace(/'rentify_bills'/g, "(window.app && !window.app.isPro() && window.app.isTestUser() ? 'rentify_bills_temp' : 'rentify_bills')");

fs.writeFileSync(path, code);
console.log('Patched app.js');
