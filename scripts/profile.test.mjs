import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendar, xml, wrapText } from './profile-lib.mjs';

function fixture() {
  const days = Array.from({ length:365 }, (_, i) => {
    const date = new Date(Date.UTC(2025, 10, 2 + i)).toISOString().slice(0,10);
    return `<td data-date="${date}" aria-labelledby="tip-${i}"></td><tool-tip id="tip-${i}">${i < 174 ? '1 contribution' : 'No contributions'} on date.</tool-tip>`;
  }).join('');
  return `<h2>174 contributions in the last year</h2>${days}<title>The contributions are 100% commits, 0% issues, 0% pull requests, 0% code review.</title>`;
}
test('calendar aggregates dates and keeps a precise period', () => {
  assert.deepEqual(parseCalendar(fixture()), { from:'2025-11-02', to:'2026-11-01', contributions:174, commits:174, activeDays:174 });
});
test('restricts statistics to the last three months', () => {
  const days = Array.from({ length:365 }, (_, i) => {
    const date = new Date(Date.UTC(2025, 10, 2 + i)).toISOString().slice(0,10);
    const label = i >= 273 ? '1 contribution' : 'No contributions';
    return `<td data-date="${date}" aria-labelledby="tip-${i}"></td><tool-tip id="tip-${i}">${label} on date.</tool-tip>`;
  }).join('');
  const html = `<h2>92 contributions in the last year</h2>${days}<title>The contributions are 100% commits, 0% issues, 0% pull requests, 0% code review.</title>`;
  assert.deepEqual(parseCalendar(html, { months:3 }), { from:'2026-08-02', to:'2026-11-01', contributions:92, commits:92, activeDays:92 });
});
test('does not mislabel mixed contributions as commits', () => {
  assert.equal(parseCalendar(fixture().replace('100% commits', '99% commits')).commits, null);
});
test('supports server-rendered tooltips before browser accessibility wiring', () => {
  const raw = fixture().replace(/aria-labelledby="tip-(\d+)"/g, 'id="cell-$1"').replace(/<tool-tip id="tip-(\d+)"/g, '<tool-tip id="tip-$1" for="cell-$1"');
  assert.equal(parseCalendar(raw).contributions, 174);
});
test('rejects incomplete, changed and duplicate calendar data', () => {
  assert.throws(() => parseCalendar('<h2>174 contributions in the last year</h2>'), /Incomplete/);
  assert.throws(() => parseCalendar(fixture().replace('174 contributions in the last year', '175 contributions in the last year')), /total/);
  assert.throws(() => parseCalendar(fixture().replace('2025-11-03', '2025-11-02')), /duplicate/);
  assert.throws(() => parseCalendar(fixture().replace('1 contribution on date.', 'Unknown label')), /Unrecognized/);
});
test('SVG text escapes markup and wraps mixed Chinese/English', () => {
  assert.equal(xml('<a>&"'), '&lt;a&gt;&amp;&quot;');
  assert.deepEqual(wrapText('中文AB中文', 6), ['中文AB','中文']);
  assert.equal(wrapText('很多很多很多很多很多很多很多很多', 6, 2).length, 2);
});
