// Snapshot source for isolated Next preview/build. Never touch serving .next/.env.
import { cp, mkdir, readFile, readdir, realpath, symlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const source = resolve('.');
const snapshotName = process.env.SCOPUS_PREVIEW_NAME || '.scopus-thai-copy-preview-e04b29f';
if (!/^\.[a-z0-9][a-z0-9-]+$/.test(snapshotName)) throw new Error('Snapshot name must be one hidden directory name');
const target = resolve(source, '..', snapshotName);
const marker = resolve(target, 'source-snapshot.json');
try {
  const previous = JSON.parse(await readFile(marker, 'utf8'));
  if (previous.source !== source) throw new Error('Different snapshot owner');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  try { if ((await readdir(target)).length) throw new Error('Snapshot directory is not owned by this helper'); }
  catch (directoryError) { if (directoryError.code !== 'ENOENT') throw directoryError; }
}
await mkdir(target, { recursive: true });
await writeFile(marker, JSON.stringify({ source, purpose: 'Isolated faculty insights verification' }, null, 2));
for (const name of ['app', 'public', 'middleware.js', 'jsconfig.json', 'package.json', 'next.config.mjs', 'postcss.config.mjs']) {
  await cp(resolve(source, name), resolve(target, name), { recursive: true, force: true });
}
const dependencies = resolve(source, 'node_modules');
try { await symlink(dependencies, resolve(target, 'node_modules'), 'junction'); }
catch (error) {
  if (error.code !== 'EEXIST' || await realpath(resolve(target, 'node_modules')) !== await realpath(dependencies)) throw error;
}
console.log(JSON.stringify({ preview_directory: target, cache_directory: resolve(target, '.next'), environment_file_copied: false }));
