import fs from 'fs';
import path from 'path';

const targets = [
  path.join('node_modules', '@ai-sdk', 'google', 'dist', 'index.js'),
  path.join('node_modules', '@ai-sdk', 'google', 'dist', 'index.mjs'),
];

const replacements = [
  {
    needle: 'candidatesTokenCount: import_zod2.z.number(),',
    replacement: 'candidatesTokenCount: import_zod2.z.number().optional(),',
  },
  {
    needle: 'candidatesTokenCount: z2.number(),',
    replacement: 'candidatesTokenCount: z2.number().optional(),',
  },
];

let patchedAny = false;

for (const target of targets) {
  try {
    const content = fs.readFileSync(target, 'utf8');

    let next = content;
    for (const { needle, replacement } of replacements) {
      next = next.replaceAll(needle, replacement);
    }

    if (next === content) {
      console.log(`[patch-google-usage] Already patched or pattern missing for ${target}`);
      continue;
    }

    fs.writeFileSync(target, next, 'utf8');
    patchedAny = true;
    console.log(`[patch-google-usage] Applied optional candidatesTokenCount patch to ${target}`);
  } catch (error) {
    console.error(`[patch-google-usage] Failed to patch ${target}:`, error);
    process.exitCode = 1;
  }
}

if (!patchedAny) {
  console.warn('[patch-google-usage] No files updated; ensure dependency version matches expected schema');
}
