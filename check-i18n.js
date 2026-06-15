const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const regex = /<([a-z0-9]+)[^>]*>([^<]+)<\/\1>/gi;
let match;
const results = [];
while ((match = regex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const tagStr = match[0];
    const text = match[2].trim();
    if (text.length > 2 && /[a-zA-ZáàãảạăắằẵẳặâấầẫẩậéèẽẻẹêếềễểệíìĩỉịóòõỏọôốồỗổộơớờỡởợúùũủụưứừữửựýỳỹỷỵđĐ]/.test(text) && !tagStr.includes('data-i18n')) {
        // Skip script, style
        if (['script', 'style', 'option', 'i', 'div', 'p'].includes(tag)) continue;
        results.push(tagStr);
    }
}
console.log(results.join('\n'));
