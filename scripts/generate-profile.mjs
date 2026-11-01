import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { xml, wrapText, svg, badge, validateProfile } from './profile-lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const p = JSON.parse(await readFile(resolve(root, 'profile.json'), 'utf8'));
const g = JSON.parse(await readFile(resolve(root, 'data/github.json'), 'utf8'));
validateProfile(p);
const out = resolve(root, 'assets/generated');
await mkdir(resolve(out, 'projects'), { recursive: true });
const save = (name, content) => writeFile(resolve(out, name), content, 'utf8');
const metric = g.commits === null ? ['Contributions', g.contributions] : ['Commits', g.commits];
const overview = svg(800, 212, `<defs><linearGradient id="mint"><stop stop-color="#f0fffb"/><stop offset="1" stop-color="#99f6d6"/></linearGradient><clipPath id="round"><rect x=".5" y=".5" width="799" height="211" rx="6"/></clipPath></defs><g clip-path="url(#round)"><rect width="800" height="212" fill="#fff"/><rect x="534" width="266" height="212" fill="url(#mint)"/></g><rect x=".5" y=".5" width="799" height="211" rx="6" fill="none" stroke="#d8dee4"/><path d="M266 30v152" stroke="#e5e5e5"/><circle cx="400" cy="82" r="44" fill="none" stroke="#ff8a00" stroke-width="5"/><g fill="#202020" text-anchor="middle"><text x="133" y="91" font-size="32" font-weight="650">${g.publicRepos}</text><text x="400" y="93" font-size="32" font-weight="650">${metric[1]}</text><text x="667" y="91" font-size="32" font-weight="650">${g.activeDays}</text><g font-size="15"><text x="133" y="141">Public Repositories</text><text x="400" y="153" fill="#d16a00" font-weight="600">${metric[0]}</text><text x="667" y="141">Active Days</text></g><g fill="#59636e" font-size="12"><text x="133" y="172">Build &amp; share</text><text x="400" y="180">近三个月 · GitHub 主页口径</text><text x="667" y="172">近三个月 · 有贡献的日期</text></g></g>`, `${g.publicRepos} public repositories; ${metric[1]} ${metric[0]}; ${g.activeDays} active days. ${g.from} to ${g.to}.`);
await save('overview.svg', overview);
await save('overview-mobile.svg', svg(360, 174, `<defs><linearGradient id="mint"><stop stop-color="#f0fffb"/><stop offset="1" stop-color="#99f6d6"/></linearGradient><clipPath id="round"><rect x=".5" y=".5" width="359" height="173" rx="6"/></clipPath></defs><g clip-path="url(#round)"><rect width="360" height="174" fill="#fff"/><rect x="240" width="120" height="174" fill="url(#mint)"/></g><rect x=".5" y=".5" width="359" height="173" rx="6" fill="none" stroke="#d8dee4"/><path d="M120 25v120" stroke="#e5e5e5"/><circle cx="180" cy="60" r="32" fill="none" stroke="#ff8a00" stroke-width="4"/><g fill="#202020" text-anchor="middle"><text x="60" y="69" font-size="28" font-weight="650">${g.publicRepos}</text><text x="180" y="69" font-size="28" font-weight="650">${metric[1]}</text><text x="300" y="69" font-size="28" font-weight="650">${g.activeDays}</text><g font-size="12"><text x="60" y="117">Public Repos</text><text x="180" y="117" fill="#c46600">${metric[0]}</text><text x="300" y="117">Active Days</text></g><g fill="#59636e" font-size="11"><text x="60" y="143">公开仓库</text><text x="180" y="143">近三个月</text><text x="300" y="143">近三个月</text></g></g>`, `${g.publicRepos} public repositories; ${metric[1]} ${metric[0]}; ${g.activeDays} active days.`));

for (const project of p.projects) {
  const lines = wrapText(project.description, 43, 3);
  const repo = g.projects[project.publicRepo];
  const text = lines.map((line, i) => `<text x="22" y="${75 + i * 21}" font-size="14" fill="#243247">${xml(line)}</text>`).join('');
  const privateTag = !project.publicRepo ? `<rect x="281" y="20" width="87" height="21" rx="10" fill="#fff" stroke="#d1d9e0"/><text x="324" y="34" text-anchor="middle" fill="#57606a" font-size="11">源码私有</text>` : '';
  await save(`projects/${project.id}.svg`, svg(390, 194, `<rect x=".5" y=".5" width="389" height="181" rx="6" fill="#fff" stroke="#d8dee4"/><g stroke="#57606a" stroke-width="1.5" fill="none"><path d="M23 24h12v15H23zM26 24v6l3-2 3 2v-6M23 36h12"/></g><text x="45" y="37" font-size="17" font-weight="600" fill="#0969da">${xml(project.title)}</text>${privateTag}${text}<circle cx="27" cy="154" r="5" fill="${project.color}"/><text x="40" y="158" font-size="11" fill="#57606a">${xml(project.stack)}</text>${repo ? `<text x="22" y="175" font-size="11" fill="#57606a">☆ ${repo.stars}　⑂ ${repo.forks}</text>` : ''}`, `${project.title}${project.publicRepo ? '' : '（源码私有）'} — ${project.description} ${project.stack}`));
}

await save('code-time.svg', badge('Code Time', p.codeTime));
await save('ai-code-time.svg', badge('AI Code Time', p.aiCodeTime));
await save('lines-added.svg', badge('Lines Added (est.)', `~${Math.round(p.linesAddedEstimate / 1000)}k lines`));
await save('focus-android.svg', badge('Focus', 'Android'));
await save('focus-ai.svg', badge('Build with', 'AI'));
await save('focus-web.svg', badge('Explore', 'Web & Tools'));

const cards = p.projects.map(item => {
  const image = `<img src="./assets/generated/projects/${item.id}.svg" width="390" alt="${xml(item.title + '：' + item.description)}" />`;
  return item.publicRepo ? `<a href="https://github.com/${p.username}/${item.publicRepo}">${image}</a>` : image;
}).join('\n');
const techNames = { kotlin:'Kotlin', go:'Go', java:'Java', javascript:'JavaScript', typescript:'TypeScript', python:'Python', react:'React', jetpackcompose:'Jetpack Compose', cloudflare:'Cloudflare', git:'Git' };
const icons = p.technologies.map(id => `<img src="./assets/icons/${id}.svg" width="52" height="52" alt="${techNames[id] || id}" />`).join('\n');
const markdown = `# Hi there 👋 I'm ${p.displayName}\n\n${p.tagline}  \n${p.intro}\n\n<p>\n<img src="./assets/generated/focus-android.svg" alt="Focus: Android" />\n<img src="./assets/generated/focus-ai.svg" alt="Build with: AI" />\n<img src="./assets/generated/focus-web.svg" alt="Explore: Web &amp; Tools" />\n</p>\n\n<picture>\n<source media="(max-width: 600px)" srcset="./assets/generated/overview-mobile.svg" />\n<img src="./assets/generated/overview.svg" width="800" alt="GitHub activity: ${metric[1]} ${metric[0]}, ${g.activeDays} active days" />\n</picture>\n\n<p>\n${cards}\n</p>\n\n## Languages & tools\n\n<p>\n${icons}\n</p>\n\n![Code Time: ${p.codeTime}](./assets/generated/code-time.svg)\n\n![AI Code Time: ${p.aiCodeTime}](./assets/generated/ai-code-time.svg)\n\n![Lines Added (estimated): approximately ${p.linesAddedEstimate.toLocaleString('en-US')} lines](./assets/generated/lines-added.svg)\n\n<sub>代码量为数量级粗估，非精确 Git 行数统计。编码时长更新于 ${p.timeUpdatedOn}。</sub>\n\n## What I work with\n\n\`\`\`text\nAndroid    Kotlin · Java · Compose\nWeb        TypeScript · JavaScript · React\nBackend    Go · Workers · D1 · R2\nWorkflow   Python · Git · AI tools\n\`\`\`\n\n<details>\n<summary>More explorations</summary>\n\n- Android 网络客户端与设备生命周期\n- Godot / C# 的 Android 平台适配学习\n- Minecraft 数据包玩法与服务端扩展\n- 数据可视化与 Web 交互体验\n\n</details>\n\n<sub>GitHub 统计区间（近三个月）：${g.from} — ${g.to}。仅展示聚合数据。</sub>\n`;
await writeFile(resolve(root, 'README.md'), markdown, 'utf8');
console.log('Generated README and 12 SVG cards/badges.');
