const fs = require('fs');
const path = 'src/modules/room/room.controller.ts';
let code = fs.readFileSync(path, 'utf-8');

// replace import
code = code.replace(/import prisma from '\.\.\/\.\.\/core\/database\/prismaClient';/g, "import { getPrisma } from '../../core/database/prismaClient';");

// replace all prisma. with getPrisma(req).
code = code.replace(/prisma\./g, 'getPrisma(req).');

fs.writeFileSync(path, code);
console.log('Patched room.controller.ts');
