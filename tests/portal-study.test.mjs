import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
test('study files require verified membership and both shared reports', async t => {
  const env={PORTAL_ORIGIN:'https://portal.example',CONVEX_SITE_URL:'https://backend.example',SITE_ASSETS:{fetch:async()=>new Response('study')}};
  const call=(path,cookie='demo')=>worker.fetch(new Request(env.PORTAL_ORIGIN+path,{headers:cookie?{Cookie:cookie}:{}}),env);
  let member={linked:true,status:'approved',company:'Other'};
  let reports=[{site:'Sugar Land Regional Airport'}];
  t.mock.method(globalThis,'fetch',async url=>Response.json(url.pathname.endsWith('/me')?member:reports));
  assert.equal((await call('/site-files/models.zip','')).status,401);
  assert.equal((await call('/internal-studies/models.zip')).status,404);
  assert.equal((await call('/site-files/study.html')).status,403);
  member.company='Sky Harbour';
  assert.equal((await call('/site-files/models.zip')).status,403);
  reports.push({site:'Nashville International Airport'});
  assert.equal(await (await call('/site-files/models.zip')).text(),'study');
  member.status='revoked';
  assert.equal((await call('/site-files/models.zip')).status,403);
});
