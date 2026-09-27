// Production Next cache integration with real Muse pages and a local content source.
// Never contacts or mutates Sanity. Requires Node 22.15+ and installed dependencies.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from '@sanity/webhook';

const root = path.resolve(import.meta.dirname, '..');
const fixture = await mkdtemp(path.join(tmpdir(), 'muse-cache-'));
const secret = 'integration-only-secret';
const counts = new Map();
let posts = [
  { _id: 'one', title: 'BEFORE_TITLE', slug: 'one', category: 'beauty', publishedAt: '2026-09-25', mainImage: {url:'https://images.museofseoul.com/old.webp',alt:'test'}, body: [] },
  { _id: 'two', title: 'UNRELATED_TITLE', slug: 'two', category: 'stay', publishedAt: '2026-09-24', body: [] },
];
const source = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const query = url.searchParams.get('query');
  const params = JSON.parse(url.searchParams.get('params'));
  counts.set(req.url, (counts.get(req.url) || 0) + 1);
  let result;
  const content = posts.map(p => url.searchParams.get('perspective') === 'drafts' && p._id === 'one' ? {...p,title:'DRAFT_ONLY_TITLE'} : p);
  if (query.includes('slug.current == $slug')) result = content.find(p => p.slug === params.slug) ?? null;
  else if (query.includes('category == $category')) result = content.filter(p => p.category === params.category);
  else if (query.includes('defined(subcategory)')) result = [];
  else result = content;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
});
await new Promise((resolve, reject) => { source.once('error', reject); source.listen(0, '127.0.0.1', resolve); });
const sourceUrl = `http://127.0.0.1:${source.address().port}`;
let next;
let logs = '';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const put = async (name, text) => { await mkdir(path.dirname(path.join(fixture,name)),{recursive:true}); await writeFile(path.join(fixture,name),text); };
const run = (args, env) => new Promise((resolve,reject) => {
  const child = spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),...args],{cwd:fixture,env});
  child.stdout.on('data',d=>{logs+=d;}); child.stderr.on('data',d=>{logs+=d;});
  child.on('error',reject); child.on('exit',code=>code===0?resolve():reject(Error(`Next exited ${code}\n${logs}`)));
});
try {
  await symlink(path.join(root,'node_modules'),path.join(fixture,'node_modules'),'dir');
  for (const dir of ['lib','components']) await cp(path.join(root,dir),path.join(fixture,dir),{recursive:true,filter: src => !src.includes('/components/admin')});
  for (const file of ['package.json','tsconfig.json','next.config.ts','app/page.tsx','app/blog/page.tsx','app/blog/[slug]/page.tsx','app/category/[category]/page.tsx','app/api/sanity/revalidate/route.ts']) {
    await put(file,await readFile(path.join(root,file),'utf8'));
  }
  await put('app/layout.tsx','export default function Layout({children}:{children:React.ReactNode}){return <html><body>{children}</body></html>}');
  await put('app/api/test-preview/route.ts',`import {draftMode} from 'next/headers'; export async function GET(){(await draftMode()).enable();return Response.json({ok:true})}`);
  await put('lib/sanity/client.ts',`export const apiVersion="2024-10-01"; export const client={async fetch<T>(query:string,params:unknown,options:any):Promise<T>{const url=new URL(${JSON.stringify(sourceUrl)});url.searchParams.set('query',query);url.searchParams.set('params',JSON.stringify(params));url.searchParams.set('perspective',options.perspective);const res=await fetch(url,{next:options.next});return res.json()}};`);
  // Keep the application's real 3600s default; a separate probe exercises Next's expiry semantics in 1s.
  await put('app/api/test-expiry/route.ts',`export async function GET(){const r=await fetch(${JSON.stringify(sourceUrl+'?query=expiry&params={}&perspective=published')},{next:{revalidate:1}});return Response.json(await r.json())}`);
  const env = {...process.env, NODE_ENV:'production', NEXT_TELEMETRY_DISABLED:'1', SANITY_REVALIDATE_SECRET:secret, NEXT_PUBLIC_SANITY_PROJECT_ID:'fixture', NEXT_PUBLIC_SANITY_DATASET:'fixture', SANITY_API_READ_TOKEN:'fixture'};
  console.log('Building isolated production fixture with Muse pages…');
  await run(['build','--webpack'],env);
  const portProbe = createServer();
  await new Promise(resolve=>portProbe.listen(0,'127.0.0.1',resolve));
  const port = portProbe.address().port;
  await new Promise(resolve=>portProbe.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  next=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:fixture,env});
  next.stdout.on('data',d=>{logs+=d;}); next.stderr.on('data',d=>{logs+=d;});
  let ready=false;
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{ /* Server is still starting. */ } await sleep(100);}
  assert.ok(ready,'Next server started');
  const page=async(route,options)=>{const r=await fetch(base+route,options);return {status:r.status,text:await r.text()};};
  const snapshot=p=>p?{_id:p._id,_type:'post',slug:p.slug,category:p.category}:null;
  const notify=async(before,after)=>{
    const body=JSON.stringify({projectId:'fixture',dataset:'fixture',operation:!before?'create':!after?'delete':'update',before:snapshot(before),after:snapshot(after)});
    const r=await fetch(base+'/api/sanity/revalidate',{method:'POST',body,headers:{[SIGNATURE_HEADER_NAME]:await encodeSignatureHeader(body,Date.now(),secret)}});
    assert.equal(r.status,200,await r.text());
  };
  for(const route of ['/','/blog','/category/beauty','/blog/one']) assert.match((await page(route)).text,/BEFORE_TITLE/);
  await page('/blog/two');
  const previousCounts=new Map(counts);
  for(const route of ['/','/blog','/category/beauty','/blog/one','/blog/two']) await page(route);
  assert.deepEqual(counts,previousCounts,'unchanged requests reuse cached content');
  console.log('PASS: unchanged home/list/detail cache reuse');
  const old={...posts[0]};
  posts[0]={...old,title:'AFTER_TITLE',mainImage:{url:'https://images.museofseoul.com/new.webp',alt:'new'}};
  await notify(old,posts[0]);
  for(const route of ['/','/blog','/category/beauty','/blog/one']) {
    const {text}=await page(route); assert.match(text,/AFTER_TITLE/); assert.match(text,/new\.webp/); assert.doesNotMatch(text,/BEFORE_TITLE|old\.webp/);
  }
  await page('/blog/two');
  for(const [key,count] of previousCounts) if(key.includes('two')) assert.equal(counts.get(key),count,'unrelated detail cache preserved');
  console.log('PASS: title/image updates across real Muse pages; unrelated detail preserved');
  const beforeMove={...posts[0]}; posts[0]={...posts[0],slug:'renamed',category:'k-beauty'};
  await notify(beforeMove,posts[0]);
  assert.equal((await page('/blog/one')).status,404);
  assert.match((await page('/blog/renamed')).text,/AFTER_TITLE/);
  assert.doesNotMatch((await page('/category/beauty')).text,/AFTER_TITLE/);
  assert.match((await page('/category/k-beauty')).text,/AFTER_TITLE/);
  assert.match((await page('/')).text,/\/blog\/renamed/);
  console.log('PASS: old URL 404; both categories and home reflect move');
  const beforeDraft=new Map(counts);
  await notify(null,{...posts[0],_id:'drafts.one'});
  assert.doesNotMatch((await page('/blog/renamed')).text,/DRAFT_ONLY_TITLE/);
  assert.deepEqual(counts,beforeDraft,'draft event did not invalidate public cache');
  const preview=await fetch(base+'/api/test-preview');
  const cookie=preview.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
  assert.match((await page('/blog/renamed',{headers:{cookie}})).text,/DRAFT_ONLY_TITLE/);
  assert.doesNotMatch((await page('/blog/renamed')).text,/DRAFT_ONLY_TITLE/);
  console.log('PASS: uncached authenticated draft mode; no public draft exposure');
  const deleted=posts.shift(); await notify(deleted,null);
  assert.equal((await page('/blog/renamed')).status,404);
  for(const route of ['/','/blog','/category/k-beauty']) assert.doesNotMatch((await page(route)).text,/AFTER_TITLE/);
  console.log('PASS: deletion removes detail/list/home content');
  assert.equal((await page('/blog/new-post')).status,404);
  const published={...deleted,_id:'new-post',slug:'new-post',category:'beauty',title:'NEW_PUBLISHED_TITLE'};
  posts.push(published); await notify(null,published);
  for(const route of ['/blog/new-post','/category/beauty','/blog','/']) assert.match((await page(route)).text,/NEW_PUBLISHED_TITLE/);
  console.log('PASS: publication replaces cached 404 and appears in detail/list/home');
  await page('/api/test-expiry'); posts[0]={...posts[0],title:'TTL_UPDATED_WITHOUT_WEBHOOK'};
  await sleep(1200); await page('/api/test-expiry');
  let recovered=false;
  for(let i=0;i<30;i++){if((await page('/api/test-expiry')).text.includes('TTL_UPDATED_WITHOUT_WEBHOOK')){recovered=true;break;} await sleep(100);}
  assert.ok(recovered,'time-based revalidation recovers without webhook');
  console.log('PASS: time expiry fallback (1s probe; application TTL asserted separately as 3600s)');
} catch(error) { console.error(logs.slice(-6000)); throw error; }
finally {
  if(next && next.exitCode===null){next.kill('SIGTERM');await new Promise(resolve=>next.once('exit',resolve));}
  await new Promise(resolve=>source.close(resolve));
  await rm(fixture,{recursive:true,force:true});
}
