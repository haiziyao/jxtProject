const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function documentHelpers() {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, 'src/lib/markdown-document.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports });
  return module.exports;
}

test('opening a legacy document preserves its Markdown and all supplementary notes', () => {
  const { resolveDocument, BODY_PREFIX } = documentHelpers();
  const original = '# 实验\n\n![图](http://storage.example/image.png "说明")\n\n$E=mc^2$\n';
  const notes = [{ id: 2, content: BODY_PREFIX + original }, { id: 1, content: '旧笔记' }, { id: 3, content: BODY_PREFIX + '另一条正文' }];
  const result = resolveDocument(notes);
  assert.equal(result.markdown, original);
  assert.equal(result.bodyNoteId, 2);
  assert.equal(result.remarks.length, 2);
  assert.equal(result.remarks[1].content, '另一条正文');
  assert.equal(notes[2].content, BODY_PREFIX + '另一条正文');
});

test('Markdown exports use a safe filename without changing the content', () => {
  const { documentFilename } = documentHelpers();
  assert.equal(documentFilename('实验: 结果/测试'), '实验- 结果-测试.md');
  assert.equal(documentFilename(' '), '实验记录.md');
});

require('vditor/dist/js/lute/lute.min.js');
test('the actual Vditor engine renders headings, tables, tasks, code, math and footnotes', () => {
  const lute = global.Lute.New();
  lute.SetSanitize(true); lute.SetFootnotes(true); lute.SetVditorMathBlockPreview(true);
  const html = lute.Md2HTML('# 实验目的\n\n**重点**\n\n| 条件 | 结果 |\n| --- | --- |\n| A | 1 |\n\n- [ ] 待处理\n\n```javascript\nconst result = 1;\n```\n\n$$\nE=mc^2\n$$\n\n说明[^1]\n\n[^1]: 实验备注');
  for (const pattern of [/<h1/, /<strong>重点<\/strong>/, /<table>/, /type="checkbox"/, /language-javascript/, /language-math/, /实验备注/]) assert.match(html, pattern);
});

test('the renderer strips executable HTML and dangerous links', () => {
  const lute = global.Lute.New(); lute.SetSanitize(true);
  const html = lute.Md2HTML('<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n[危险](javascript:alert(1))');
  assert.doesNotMatch(html, /<script|onerror=|href="javascript:/i);
});
