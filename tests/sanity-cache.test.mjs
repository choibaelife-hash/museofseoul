import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from '@sanity/webhook';

const root = path.resolve(import.meta.dirname, '..');
const calls = [];
let fail = false;
let preview = false;
let fetchOptions;
globalThis.__sanityCacheTest = {
  invalidate: (...args) => { if (fail) throw Error('injected failure'); calls.push(args); },
  draftMode: async () => ({ isEnabled: preview }),
  fetch: async (_query, _params, options) => { fetchOptions = options; return []; },
};
registerHooks({
  resolve(specifier, context, next) {
    if (['next/cache', 'next/headers', '@/lib/sanity/client'].includes(specifier)) {
      return { url: `test:${specifier}`, shortCircuit: true };
    }
    let filename;
    if (specifier.startsWith('@/')) filename = path.join(root, specifier.slice(2));
    else if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts')) {
      filename = fileURLToPath(new URL(specifier, context.parentURL));
    }
    if (filename && existsSync(`${filename}.ts`)) return { url: pathToFileURL(`${filename}.ts`).href, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    const mocks = {
      'test:next/cache': 'export const revalidateTag = (...a) => globalThis.__sanityCacheTest.invalidate(...a)',
      'test:next/headers': 'export const draftMode = () => globalThis.__sanityCacheTest.draftMode()',
      'test:@/lib/sanity/client': 'export const client = {fetch: (...a) => globalThis.__sanityCacheTest.fetch(...a)}',
    };
    if (mocks[url]) return { format: 'module', source: mocks[url], shortCircuit: true };
    if (url.startsWith(pathToFileURL(root).href) && url.endsWith('.ts') && !url.includes('/node_modules/')) {
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText };
    }
    return next(url, context);
  },
});
const { changedPostTags, postCacheTags, PUBLIC_POST_REVALIDATE } = await import('../lib/sanity/cache.ts');
const { POST } = await import('../app/api/sanity/revalidate/route.ts');
const { sanityFetch } = await import('../lib/sanity/fetch.ts');
process.env.SANITY_REVALIDATE_SECRET = 'local-test-secret';
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
process.env.SANITY_API_READ_TOKEN = 'test-preview-token';
const snap = (slug = 'one', category = 'beauty', id = 'post-one') => ({ _id: id, _type: 'post', slug, category });
const event = (before = snap(), after = snap()) => ({
  projectId: 'test-project', dataset: 'test-dataset',
  operation: before === null ? 'create' : after === null ? 'delete' : 'update', before, after,
});
async function send(body, secret = 'local-test-secret') {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const signature = await encodeSignatureHeader(raw, Date.now(), secret);
  return POST(new Request('http://localhost/api/sanity/revalidate', {
    method: 'POST', body: raw, headers: { [SIGNATURE_HEADER_NAME]: signature },
  }));
}

test('public reads have an hour TTL; previews bypass cache and CDN with draft perspective', async () => {
  assert.equal(PUBLIC_POST_REVALIDATE, 3600);
  await sanityFetch({ query: 'test', tags: [postCacheTags.detail('one')] });
  assert.deepEqual(fetchOptions.next, { revalidate: 3600, tags: [postCacheTags.detail('one')] });
  assert.equal(fetchOptions.useCdn, false);
  assert.equal(fetchOptions.perspective, 'published');
  assert.equal(fetchOptions.token, undefined);
  preview = true;
  await sanityFetch({ query: 'test', tags: ['unused'] });
  assert.deepEqual(fetchOptions.next, { revalidate: 0 });
  assert.equal(fetchOptions.perspective, 'drafts');
  assert.equal(fetchOptions.token, 'test-preview-token');
  preview = false;
});
test('category move and slug change expire both old and new targets, not unrelated details', () => {
  const tags = changedPostTags(event(snap(), snap('renamed', 'k-beauty')));
  assert.deepEqual(new Set(tags), new Set([
    postCacheTags.home, postCacheTags.detail('one'), postCacheTags.detail('renamed'),
    postCacheTags.category('beauty'), postCacheTags.category('k-beauty'),
  ]));
  assert.ok(!tags.includes(postCacheTags.detail('unrelated')));
  assert.ok(postCacheTags.detail('한'.repeat(1000)).length < 256);
});
test('signed publish, update and delete immediately expire their targets; duplicates are safe', async () => {
  for (const body of [event(null, snap()), event(), event(snap(), null), event(snap(), null)]) {
    calls.length = 0;
    const response = await send(body);
    assert.equal(response.status, 200);
    assert.deepEqual(calls.map(([tag]) => tag), changedPostTags(body));
    assert.ok(calls.every(([, profile]) => profile.expire === 0));
  }
});
test('signed drafts and release versions cannot invalidate public data', async () => {
  for (const id of ['drafts.post-one', 'versions.release.post-one']) {
    calls.length = 0;
    const response = await send(event(null, snap('one', 'beauty', id)));
    assert.equal((await response.json()).result, 'Ignored');
    assert.equal(calls.length, 0);
  }
});
test('rejects forged signatures and absent secret without invalidation', async () => {
  calls.length = 0;
  assert.equal((await send(event(), 'wrong-secret')).status, 401);
  delete process.env.SANITY_REVALIDATE_SECRET;
  assert.equal((await send(event())).status, 503);
  process.env.SANITY_REVALIDATE_SECRET = 'local-test-secret';
  assert.equal(calls.length, 0);
});
test('rejects wrong dataset, missing before-state and malformed signed JSON', async () => {
  calls.length = 0;
  assert.equal((await send({ ...event(), dataset: 'other' })).status, 403);
  assert.equal((await send({ ...event(), before: undefined })).status, 400);
  assert.equal((await send('{broken')).status, 400);
  assert.equal(calls.length, 0);
});
test('cache failure is logged with request ID and returns retriable 500', async () => {
  fail = true;
  const errors = [];
  const original = console.error;
  console.error = (line) => errors.push(JSON.parse(line));
  try {
    const response = await send(event());
    assert.equal(response.status, 500);
    const { requestId } = await response.json();
    assert.ok(errors.some((entry) => entry.requestId === requestId && entry.status === 'failed'));
  } finally { fail = false; console.error = original; }
});
