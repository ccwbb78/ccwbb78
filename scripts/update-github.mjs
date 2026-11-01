import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseCalendar, validateProfile } from './profile-lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const p = JSON.parse(await readFile(resolve(root, 'profile.json'), 'utf8'));
validateProfile(p);
async function get(url, json = true) {
  const response = await fetch(url, { headers: { 'User-Agent': 'ccwbb78-profile', Accept: json ? 'application/vnd.github+json' : 'text/html' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return json ? response.json() : response.text();
}
// Public endpoints only. No private repositories, tokens, prompts, or file paths.
const [calendar, account, repos] = await Promise.all([
  get(`https://github.com/users/${p.username}/contributions`, false).then(html => parseCalendar(html, { months: 3 })),
  get(`https://api.github.com/users/${p.username}`),
  Promise.all(p.projects.filter(x => x.publicRepo).map(async x => [x.publicRepo, await get(`https://api.github.com/repos/${p.username}/${x.publicRepo}`)]))
]);
if (!Number.isSafeInteger(account.public_repos)) throw new Error('Invalid public repository count');
const projects = {};
for (const [name, repo] of repos) {
  if (repo.private !== false || !Number.isSafeInteger(repo.stargazers_count) || !Number.isSafeInteger(repo.forks_count)) throw new Error('Invalid public repository metadata');
  projects[name] = { stars: repo.stargazers_count, forks: repo.forks_count };
}
const snapshot = { observedOn: new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Shanghai' }).format(new Date()), ...calendar, publicRepos: account.public_repos, projects };
// All sources must validate before replacing the previous snapshot.
const target = resolve(root, 'data/github.json');
await writeFile(target + '.tmp', JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
await rename(target + '.tmp', target);
console.log(`Updated public GitHub aggregate for the last 3 months: ${calendar.contributions} contributions, ${calendar.activeDays} active days.`);
