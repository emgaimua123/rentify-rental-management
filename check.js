const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf-8');
const cards = html.match(/class=[\"'].*?modal-card.*?[\"']/g);
console.log('modal-cards:', cards ? cards.length : 0);
const bodies = html.match(/class=[\"'].*?modal-body.*?[\"']/g);
console.log('modal-bodies:', bodies ? bodies.length : 0);
