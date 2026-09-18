import { cleanGenerated } from './lib/manifest.mjs';

const removed = cleanGenerated();
console.log(`clean: removed ${removed} generated file(s).`);
