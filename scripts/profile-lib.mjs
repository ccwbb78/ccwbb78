export function xml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
}

export function wrapText(text, maxWidth = 40, maxLines = 3) {
  const lines = [];
  let line = '', width = 0;
  for (const c of String(text)) {
    const size = /[^\u0000-\u00ff]/u.test(c) ? 2 : 1;
    if (width + size > maxWidth && line) {
      lines.push(line);
      line = ''; width = 0;
    }
    line += c; width += size;
  }
  if (line) lines.push(line);
  return lines.length > maxLines ? [...lines.slice(0, maxLines - 1), lines[maxLines - 1].slice(0, -1) + '…'] : lines;
}

function attrs(tag) {
  return Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), m => [m[1], m[2]]));
}

export function parseCalendar(html) {
  const tips = new Map();
  const tipsByCell = new Map();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)) {
    const a = attrs(match[1]);
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    tips.set(a.id, text);
    if (a.for) tipsByCell.set(a.for, text);
  }
  const days = new Map();
  for (const match of html.matchAll(/<td\b([^>]*)>/g)) {
    const a = attrs(match[1]);
    if (!a['data-date']) continue;
    const date = a['data-date'];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || days.has(date)) throw new Error('Invalid or duplicate calendar date');
    const label = (a['aria-labelledby'] || '').split(/\s+/).map(id => tips.get(id) || '').join(' ').trim() || tipsByCell.get(a.id) || '';
    const count = label.match(/^(\d[\d,]*) contributions?\b/);
    if (!count && !/^No contributions\b/.test(label)) throw new Error('Unrecognized contribution label');
    days.set(date, count ? Number(count[1].replaceAll(',', '')) : 0);
  }
  const heading = html.replace(/<[^>]*>/g, ' ').match(/([\d,]+)\s+contributions?\s+in the last year/i);
  if (days.size < 350 || days.size > 371 || !heading) throw new Error('Incomplete contribution calendar');
  const contributions = [...days.values()].reduce((a, b) => a + b, 0);
  if (contributions !== Number(heading[1].replaceAll(',', ''))) throw new Error('Calendar total does not match heading');
  const dates = [...days.keys()].sort();
  // The profile percentage is rounded. Only infer an exact all-commit count
  // below 200 total contributions, where one non-commit would round to >=1%.
  const allCommits = contributions > 0 && contributions < 200 && /The contributions are\s+100% commits,\s+0% issues,\s+0% pull requests,\s+0% code review/.test(html);
  return { from: dates[0], to: dates.at(-1), contributions, commits: allCommits ? contributions : null, activeDays: [...days.values()].filter(n => n > 0).length };
}

export function validateProfile(p) {
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(p.username)) throw new Error('Invalid GitHub username');
  if (!Number.isSafeInteger(p.linesAddedEstimate) || p.linesAddedEstimate < 0) throw new Error('Invalid code estimate');
  if (!p.projects?.length || p.projects.length > 8) throw new Error('Expected 1–8 projects');
  const ids = new Set();
  for (const item of p.projects) {
    if (!/^[a-z\d-]+$/.test(item.id) || ids.has(item.id)) throw new Error('Invalid or duplicate project id');
    ids.add(item.id);
    if (item.publicRepo && !/^[\w.-]+$/.test(item.publicRepo)) throw new Error('Invalid public repository');
    if (!/^#[\da-f]{6}$/i.test(item.color)) throw new Error('Invalid project color');
    if (![item.title, item.description, item.stack].every(x => typeof x === 'string' && x.length < 300)) throw new Error('Invalid project text');
  }
}

export function svg(width, height, content, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xml(label)}"><title>${xml(label)}</title><style>text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif}</style>${content}</svg>\n`;
}

export function badge(label, value) {
  const a = Math.ceil([...label].length * 6.8 + 15), b = Math.ceil([...value].length * 6.8 + 15);
  return svg(a + b, 24, `<defs><linearGradient id="shade" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-opacity=".12"/></linearGradient><clipPath id="clip"><rect width="${a + b}" height="24" rx="3"/></clipPath></defs><g clip-path="url(#clip)"><path fill="#555" d="M0 0h${a}v24H0z"/><path fill="#007fb5" d="M${a} 0h${b}v24H${a}z"/><rect width="${a + b}" height="24" fill="url(#shade)"/></g><g fill="#fff" font-size="12" text-anchor="middle"><text x="${a / 2}" y="16">${xml(label)}</text><text x="${a + b / 2}" y="16">${xml(value)}</text></g>`, `${label}: ${value}`);
}
