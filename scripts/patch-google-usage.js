import fs from 'fs';
import path from 'path';

const target = path.join('node_modules', '@ai-sdk', 'google', 'dist', 'index.js');

try {
  const content = fs.readFileSync(target, 'utf8');
  const needle = 'candidatesTokenCount: import_zod2.z.number(),';
  const replacement = 'candidatesTokenCount: import_zod2.z.number().optional(),';

  if (!content.includes(needle) && !content.includes(replacement)) {
    console.log('[patch-google-usage] Expected schema snippet not found; skipping');
    process.exit(0);
  }

  const patched = content.replaceAll(needle, replacement);

  if (patched === content) {
    console.log('[patch-google-usage] Already patched');
    process.exit(0);
  }

  fs.writeFileSync(target, patched, 'utf8');
  console.log('[patch-google-usage] Applied optional candidatesTokenCount patch');
} catch (error) {
  console.error('[patch-google-usage] Failed to patch google provider schema:', error);
  process.exitCode = 1;
}
