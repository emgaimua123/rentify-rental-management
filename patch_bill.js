const fs = require('fs');
const path = 'public/js/bill.js';
let code = fs.readFileSync(path, 'utf-8');

// Replace static rentify_bills with dynamic key
code = code.replace(/'rentify_bills'/g, "(window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_bills_temp' : 'rentify_bills')");

// Replace static rentify_presets with dynamic key
code = code.replace(/'rentify_presets'/g, "(window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_presets_temp' : 'rentify_presets')");

fs.writeFileSync(path, code);
console.log('Patched bill.js');
