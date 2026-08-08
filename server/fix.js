const fs = require('fs');
let content = fs.readFileSync('prisma/seed.ts', 'utf8');
content = content.replace(/Role\.([A-Z]+)/g, '"$1"');
content = content.replace(/CustomerType\.([A-Z]+)/g, '"$1"');
content = content.replace(/CustomerStatus\.([A-Z]+)/g, '"$1"');
content = content.replace(/MovementType\.([A-Z]+)/g, '"$1"');
content = content.replace(/ChallanStatus\.([A-Z]+)/g, '"$1"');
fs.writeFileSync('prisma/seed.ts', content);
