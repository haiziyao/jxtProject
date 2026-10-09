const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.JXT_SOURCE || path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));

function load(relative, mocks = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports, Date, Map, Set, JSON, Number, console, TextEncoder, URL,
    fetch: (...args) => mocks.fetch(...args),
    require: name => {
      if (name in mocks) return mocks[name];
      if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts', mocks);
      throw new Error('Unexpected dependency: ' + name);
    },
  }, { filename: relative });
  return module.exports;
}

test('calendar validation rejects impossible dates and accepts leap days', () => {
  const { isCalendarDate } = load('src/lib/dates.ts');
  assert.equal(isCalendarDate('2026-02-31'), false);
  assert.equal(isCalendarDate('2026-02-29'), false);
  assert.equal(isCalendarDate('2028-02-29'), true);
  assert.equal(isCalendarDate('not-a-date'), false);
});

test('failed TODO mutation does not change input or re-fetch after a successful write', async () => {
  const item = { id: 1, title: 'existing', done: false, deletedAt: null };
  const next = { ...item, done: true };
  const calls = [];
  const store = load('src/lib/todo-store.ts', { fetch: async (url, request) => {
    calls.push({ url, body: JSON.parse(request.body) });
    return { ok: true, json: async () => next };
  } });
  const saved = await store.saveTodosToStorage([next], [item]);
  assert.equal(saved[0].done, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { url: '/api/todos/1', body: { done: true } });
  assert.equal(item.done, false);
  const failing = load('src/lib/todo-store.ts', { fetch: async () => ({ ok: false }) });
  await assert.rejects(() => failing.saveTodosToStorage([next], [item]));
  assert.equal(item.done, false);
});

test('new TODO uses the database ID returned by POST', async () => {
  const store = load('src/lib/todo-store.ts', { fetch: async (_url, request) => {
    assert.equal(request.method, 'POST');
    return { ok: true, json: async () => ({ id: 42, title: 'new' }) };
  } });
  assert.equal((await store.saveTodosToStorage([{ id: 999, title: 'new' }], []))[0].id, 42);
});

function mockDatabase(failNote = false) {
  let state = { experiment: { id: 1, title: 'original', recorder: 'tester', summary: 'original', expDate: new Date('2026-10-01'), tags: [{ tag: { id: 5 } }] }, notes: [] };
  const findNote = (target, query) => target.notes.find(note => (query.where.id === undefined || note.id === query.where.id) && note.experimentId === query.where.experimentId && (!query.where.content || note.content.startsWith(query.where.content.startsWith)));
  const prisma = {
    experiment: { findUnique: async query => query.where.id === 1 ? state.experiment : null },
    experimentNote: { findFirst: async query => findNote(state, query) },
    $transaction: async callback => {
      const candidate = structuredClone(state);
      const tx = {
        experiment: { update: async ({ data }) => {
          for (const field of ['title', 'summary', 'recorder', 'expDate']) if (data[field] !== undefined) candidate.experiment[field] = data[field];
          if (data.tags !== undefined) candidate.experiment.tags = [];
          return candidate.experiment;
        } },
        experimentNote: {
          findFirst: async query => findNote(candidate, query),
          create: async ({ data }) => {
            if (failNote) throw new Error('simulated note failure');
            const note = { id: 99, ...data };
            candidate.notes.push(note); return note;
          },
          update: async ({ where, data }) => {
            if (failNote) throw new Error('simulated note failure');
            const note = candidate.notes.find(note => note.id === where.id && note.experimentId === where.experimentId);
            Object.assign(note, data); return note;
          },
        },
      };
      const result = await callback(tx);
      state = candidate;
      return result;
    },
  };
  const route = load('src/app/api/experiments/[id]/route.ts', {
    '@/lib/prisma': { prisma },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
  });
  return { state: () => state, save: payload => route.PUT({ json: async () => payload }, { params: { id: '1' } }) };
}

test('metadata and body commit together and retries reuse the body note', async () => {
  const db = mockDatabase();
  const result = await db.save({ title: 'updated', bodyMarkdown: 'first', bodyNoteId: null });
  assert.equal(result.status, 200);
  assert.equal(result.body.bodyNoteId, 99);
  assert.equal(db.state().experiment.title, 'updated');
  assert.equal(db.state().experiment.tags.length, 1, 'omitting tags preserves existing tags');
  await db.save({ bodyMarkdown: 'second', bodyNoteId: null });
  assert.equal(db.state().notes.length, 1);
  assert.ok(db.state().notes[0].content.endsWith('second'));
});

test('note failure rolls back metadata; wrong experiment note IDs cannot mutate records', async () => {
  const db = mockDatabase(true);
  await assert.rejects(() => db.save({ title: 'should rollback', bodyMarkdown: 'body' }));
  assert.equal(db.state().experiment.title, 'original');
  assert.equal(db.state().notes.length, 0);
  const result = await db.save({ title: 'must not change', bodyMarkdown: 'body', bodyNoteId: 999 });
  assert.equal(result.status, 404);
  assert.equal(db.state().experiment.title, 'original');
});
