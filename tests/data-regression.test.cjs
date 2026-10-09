const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.JXT_SOURCE || path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const response = { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } };
function load(relative, mocks = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports, Date, Map, Set, JSON, Number, TextEncoder, URL, console,
    require: name => name in mocks ? mocks[name] : name === 'next/server' ? response : name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts', mocks) : (() => { throw new Error('Unexpected dependency: ' + name); })(),
  }, { filename: relative });
  return module.exports;
}
const request = body => ({ json: async () => body });

test('malformed JSON and non-object bodies are rejected before database writes', async () => {
  const route = load('src/app/api/todos/route.ts', { '@/lib/prisma': { prisma: { todo: { create: () => { throw new Error('must not write'); } } } } });
  for (const body of [null, [], 'bad', 1]) assert.equal((await route.POST(request(body))).status, 400);
  assert.equal((await route.POST({ json: async () => { throw new SyntaxError('bad JSON'); } })).status, 400);
});

test('Chinese TEXT content is checked by bytes, and invalid or duplicate tags are rejected', () => {
  const { validateExperiment, validId } = load('src/lib/experiment-input.ts');
  const record = { title: 'test', recorder: 'test', summary: '中'.repeat(22000), expDate: '2026-10-09' };
  assert.ok(validateExperiment(record));
  record.summary = '中'.repeat(21000);
  assert.equal(validateExperiment(record), null);
  assert.ok(validateExperiment({ ...record, tagIds: [1, 1] }));
  assert.equal(validId(2147483648), false);
});

test('concurrent settings edits preserve fields absent from each request', async () => {
  let row = { id: 1, projectName: 'before', teamMembers: 'members', advisors: 'advisor', progressSteps: ['step'] };
  const writes = [];
  const route = load('src/app/api/dashboard/settings/route.ts', { '@/lib/prisma': { prisma: { dashboardSetting: {
    findFirst: async () => ({ ...row }),
    update: async ({ data }) => { writes.push(Object.keys(data)); row = { ...row, ...data }; return row; },
  } } } });
  const results = await Promise.all([route.PUT(request({ projectName: 'after' })), route.PUT(request({ progressSteps: ['new'] }))]);
  assert.ok(results.every(result => result.status === 200));
  assert.deepEqual(writes, [['projectName'], ['progressSteps']]);
  assert.equal(row.projectName, 'after');
  assert.equal(row.progressSteps[0], 'new');
  assert.equal(row.teamMembers, 'members');
  assert.equal((await route.PUT(request({ projectName: 123 }))).status, 400);
});

test('concurrent TODO completion and archive changes both survive, including restoration', async () => {
  let row = { id: 1, title: 'todo', level: 'medium', detail: '', dueDate: new Date('2026-10-09'), done: false, deletedAt: null, createdAt: new Date('2026-10-09') };
  const route = load('src/app/api/todos/[id]/route.ts', { '@/lib/prisma': { prisma: { todo: { update: async ({ data }) => { row = { ...row, ...data }; return row; } } } } });
  const params = { params: { id: '1' } };
  await Promise.all([route.PATCH(request({ done: true }), params), route.PATCH(request({ deletedAt: '2026-10-09T00:00:00.000Z' }), params)]);
  assert.equal(row.done, true);
  assert.ok(row.deletedAt);
  await route.PATCH(request({ deletedAt: null }), params);
  assert.equal(row.done, true);
  assert.equal(row.deletedAt, null);
  for (const body of [{ done: 'false' }, { deletedAt: '2026-02-31T00:00:00.000Z' }, {}, null]) assert.equal((await route.PATCH(request(body), params)).status, 400);
});

test('TODO creation returns the inserted record without a separate full-table read', async () => {
  const row = { id: 42, title: 'todo', level: 'medium', detail: '', dueDate: new Date('2026-10-09'), done: false, deletedAt: null, createdAt: new Date('2026-10-09') };
  const route = load('src/app/api/todos/route.ts', { '@/lib/prisma': { prisma: { todo: { create: async () => row, findMany: () => { throw new Error('should not re-read'); } } } } });
  const result = await route.POST(request({ title: 'todo', level: 'medium', detail: '', dueDate: '2026-10-09' }));
  assert.equal(result.status, 201);
  assert.equal(result.body.id, 42);
});

test('storage URLs preserve external Markdown images and correctly decode object names', () => {
  const { objectNameFromStorageUrl, inlineImageUrl } = load('src/lib/storage-url.ts');
  const base = 'http://storage.example:9000/jxt/';
  const url = base + encodeURIComponent('实验 image.pdf');
  assert.equal(objectNameFromStorageUrl(url, base), '实验 image.pdf');
  for (const bad of ['http://other.example:9000/jxt/image.png', 'http://storage.example:9000/another/image.png', base + '%ZZ', base + '%2E%2E/file.png', base + '%00.png']) assert.equal(objectNameFromStorageUrl(bad, base), '');
  assert.equal(inlineImageUrl('https://external.example/image.png', base), 'https://external.example/image.png');
  assert.ok(inlineImageUrl(base + 'image.png', base).startsWith('/api/files/proxy?'));
});

test('image deletion cannot delete an image belonging to another experiment', async () => {
  let image = { id: 9, experimentId: 2 };
  const route = load('src/app/api/experiments/[id]/images/[imageId]/route.ts', { '@/lib/prisma': { prisma: { experimentImage: { deleteMany: async ({ where }) => {
    if (image && where.id === image.id && where.experimentId === image.experimentId) { image = null; return { count: 1 }; }
    return { count: 0 };
  } } } } });
  assert.equal((await route.DELETE({}, { params: { id: '1', imageId: '9' } })).status, 404);
  assert.ok(image);
  assert.equal((await route.DELETE({}, { params: { id: '2', imageId: '9' } })).status, 200);
  assert.equal(image, null);
});
