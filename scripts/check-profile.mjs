import { readFile, readdir, stat, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
async function files(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes:true })) {
    if (['.local','.git','node_modules'].includes(item.name)) continue;
    const path = resolve(dir,item.name);
    result.push(...(item.isDirectory() ? await files(path) : [path]));
  }
  return result;
}
const all = await files(root);
for (const path of all) {
  const content = await readFile(path,'utf8');
  if (/[A-Z]:[\\/](?:Users|Myproject)[\\/]|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(content)) throw new Error(`Local path or credential pattern in ${relative(root,path)}`);
  if (path.endsWith('.svg') && (/<(?:script|foreignObject)\b|(?:href|src)=["']https?:/i.test(content))) throw new Error(`External or active SVG in ${relative(root,path)}`);
}
const readme = await readFile(resolve(root,'README.md'),'utf8');
const links = [...readme.matchAll(/(?:src(?:set)?="|\]\()\.\/([^"\s)]+)(?:"|\))/g)].map(m=>m[1]);
for (const link of links) {
  const target = resolve(root,link);
  if (!relative(root,target).startsWith('assets')) throw new Error('README asset outside assets directory');
  await access(target);
  if (!(await stat(target)).size) throw new Error('Empty asset');
}
if (!readme.includes('Lines Added (estimated)') || !readme.includes('非精确 Git 行数统计')) throw new Error('Estimate must be disclosed');
const profile = JSON.parse(await readFile(resolve(root,'profile.json'),'utf8'));
if (![profile.codeTime,profile.aiCodeTime].every(value => readme.includes(value))) throw new Error('Time snapshot differs from profile.json');
console.log(`Checked ${all.length} public files and ${links.length} README assets; no private material, local paths or credential patterns found.`);
