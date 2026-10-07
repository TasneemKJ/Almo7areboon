/** Deterministic rendered regression cases. See tests/fixtures/layering.html. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import {freePort, launchChromium} from './lib/browser.mjs';

const output = 'artifacts/browser-review/layering';
mkdirSync(output, { recursive: true });
const port = await freePort(), origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });
let browser;
const reports = [];
const failures = [];
function assertVillage(diagnostic, fixture) {
  const v=diagnostic.village;assert.ok(v,'actual village diagnostics required');
  assert.deepEqual(v.light,{width:64,height:64});assert.equal(v.softLight,false);
  assert.equal(v.decodedBytes,41_989_912,'actual decoded source dimensions stay within the 42 MB budget');
  assert.equal(v.textures.filter(key=>key==='village-light').length,1);
  assert.deepEqual(v.pools,{lights:6,stars:0,clouds:0,mist:0});
  assert.ok(v.skyIndex<v.ambience.paintIndex&&v.ambience.paintIndex<v.shadows.paintIndex&&v.shadows.paintIndex<v.halos.paintIndex,'village ink below combat shadows/halos');
  const visibleLamps=v.lamps.filter(lamp=>lamp.visible);assert.equal(visibleLamps.length,v.plate.lamps.length);
  const {placement,visibleSource,hudSourceBounds}=v.viewport,s=placement.scale*v.viewport.cssWorldScale;
  const inverse=([x,y])=>[(x-placement.x)/placement.scale,(y-placement.y)/placement.scale];
  const inside=([x,y],[l,t,r,b],pad=1e-5)=>x>=l-pad&&x<=r+pad&&y>=t-pad&&y<=b+pad;
  const inPane=(point,pane)=>pane.every((a,i)=>{const b=pane[(i+1)%pane.length];return (b.x-a.x)*(point[1]-a.y)-(b.y-a.y)*(point[0]-a.x)>=-1e-5;});
  for(const [index,lamp] of visibleLamps.entries()) {
    const [x,y,rx,ry]=v.plate.lamps[index];
    assert.ok(Math.abs(lamp.x-(placement.x+x*placement.scale))<1e-5&&Math.abs(lamp.y-(placement.y+y*placement.scale))<1e-5,'real lamp remains on painted anchor');
    assert.ok(Math.abs(lamp.width-2*rx*placement.scale)<1e-5&&Math.abs(lamp.height-2*ry*placement.scale)<1e-5);
    assert.equal(lamp.tint,diagnostic.age===5&&index>=2?0x8edfc9:0xffd08a);
    assert.ok(lamp.paintIndex>v.ambience.paintIndex&&lamp.paintIndex<v.shadows.paintIndex);
  }
  const triangles=v.paths.triangles;
  assert.ok(triangles.length<=120,'cached depth never exceeds its fill cap');
  if(diagnostic.age!==0)assert.equal(triangles.length,0,'other chapters retain their original painting');
  else if(fixture.crop!==220)assert.ok(triangles.length>=20,'First Fires depth is present in actual Graphics commands');
  for(const triangle of triangles){
    assert.ok(Number.isFinite(triangle.alpha)&&triangle.alpha>0&&triangle.alpha<=.25);
    assert.ok([0x92b9c6,0xffd28a].includes(triangle.color),'depth uses only chapter-authored air and reflected warmth');
    const points=triangle.points.map(inverse);
    assert.ok(points.every(point=>inside(point,visibleSource)),'actual triangle remains inside the current source crop');
    assert.ok(v.depth.some(mark=>mark.points.every((point,index)=>Math.abs(point.x-triangle.points[index][0])<1e-5&&Math.abs(point.y-triangle.points[index][1])<1e-5)),'Graphics output uses cached source-registered geometry');
    for(const rect of hudSourceBounds){
      let polygon=points;
      for(const [axis,value,sign] of [[0,rect[0],1],[1,rect[1],1],[0,rect[2],-1],[1,rect[3],-1]]){
        const next=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],aa=(a[axis]-value)*sign,bb=(b[axis]-value)*sign;if(aa>=0)next.push(a);if((aa>=0)!==(bb>=0)){const t=aa/(aa-bb);next.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}polygon=next;
      }
      const area=polygon.length<3?0:Math.abs(polygon.reduce((sum,p,i)=>sum+p[0]*polygon[(i+1)%polygon.length][1]-p[1]*polygon[(i+1)%polygon.length][0],0))/2;
      assert.ok(area<1e-5,'actual depth triangles exclude occupied HUD interiors');
    }
  }
  const bird=[];const occupied=new Set();
  for(const polygon of v.paths.fills) {
    const points=polygon.points.map(inverse);
    const window=v.plate.windows.find(room=>points.every(point=>inside(point,room.bounds)));
    if(window) {
      assert.ok(window.panes.some(pane=>points.every(point=>inPane(point,pane))),'actual complete polygon clips inside one framing-safe pane');
      occupied.add(window.id);
    } else {
      assert.ok(points.every(point=>inside(point,v.plate.sky)&&inside(point,visibleSource)),'actual bird stays in roof-free visible sky');bird.push(...points);
    }
  }
  assert.ok(occupied.size<=2);assert.ok(v.paths.strokes.length<=3);
  if(v.mood.time===2||v.mood.time===5)assert.ok(occupied.size>0,'actual quiet occupants or alarm pane darkness must be drawn');
  assert.equal(v.paths.strokes.length,diagnostic.age===2?3:0,'only Harbor draws its three registered reflections');
  for(const stroke of v.paths.strokes)assert.ok(diagnostic.age===2&&stroke.points.map(inverse).every(point=>inside(point,[480,473,591,526])),'actual water remains in open harbor rectangle');
  if(bird.length) {
    assert.ok(fixture.reduced!==true&&fixture.crop!==220&&fixture.mood==='quiet','motion/crop/alarm gate suppresses inadmissible flight');
    const xs=bird.map(p=>p[0]),ys=bird.map(p=>p[1]),bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
    assert.ok((bounds[2]-bounds[0])*s>=8,'actual rendered full bird is readable');
    for(const hud of hudSourceBounds){const pad=4/s;assert.ok(bounds[2]<=hud[0]-pad+1e-5||bounds[0]>=hud[2]+pad-1e-5||bounds[3]<=hud[1]-pad+1e-5||bounds[1]>=hud[3]+pad-1e-5,'actual bird clears padded HUD');}
  }
  if(fixture.mood==='quiet'&&!fixture.reduced&&v.viewport.skyPath&&[10+diagnostic.age*.7,13+diagnostic.age*.7].includes(v.mood.time))assert.ok(bird.length>0,'scheduled flight must actually paint when its measured path is safe');
  if(fixture.reduced||fixture.mood==='alarmed'||fixture.crop===220)assert.equal(bird.length,0);
  for(const troop of diagnostic.images.filter(image=>image.texture.startsWith('army-')))assert.ok(troop.paintIndex>v.ambience.paintIndex&&visibleLamps.every(lamp=>troop.paintIndex>lamp.paintIndex),'actual crossing troops remain in front of village life');
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`Fixture server exited ${server.exitCode}: ${serverLog}`);
    try { ready = (await fetch(`${origin}/tests/fixtures/layering.html`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, `Fixture server did not start: ${serverLog}`);
  browser = await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 490, height: 550 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
  const cases = [];
  for (const age of [0, 1, 3, 4, 5]) for (const health of [70, 25]) for (const lane of [0, 1, 2]) {
    cases.push({ age, health, lane, effects: 'both' });
  }
  // Mixed armies now use painted art on both sides of these chapter transitions.
  cases.push({ age: 3, enemyAge: 4, health: 25, lane: 1, effects: 'both' });
  cases.push({ age: 4, enemyAge: 5, health: 25, lane: 1, effects: 'both' });
  // Isolated views make damage marks and each source effect easier to review.
  for (const age of [0, 1, 3, 4, 5]) cases.push({ age, health: 25, lane: 0, effects: 'none', troops: 0 });
  for (const effects of ['attack', 'dust']) cases.push({ age: 3, health: 25, lane: 0, effects });

  // Keep all 39 original layering cases, then exercise the actual village draw
  // path at mobile widths. These snapshots never advance combat simulation.
  for(const age of [0,1,2,3,4,5])for(const mood of ['quiet','alarmed','recovering'])cases.push({village:1,age,mood,width:390,health:70,lane:1,effects:'none'});
  for(const age of [0,1,2,4])for(const mood of ['quiet','alarmed','recovering'])cases.push({village:1,age,mood,width:320,health:70,lane:1,effects:'none'});
  for(const age of [0,1,2,3,4,5])for(const mood of ['quiet','alarmed','recovering'])cases.push({village:1,age,mood,width:390,reduced:true,health:70,lane:1,effects:'none'});
  for(const age of [0,1,2,4])cases.push({village:1,age,mood:'quiet',width:320,crop:220,health:70,lane:1,effects:'none'});

  for (const fixture of cases) {
    const query = new URLSearchParams(Object.entries(fixture).map(([key, value]) => [key, String(value)]));
    const name = `age-${fixture.age}-enemy-${fixture.enemyAge ?? fixture.age}-hp-${fixture.health}-lane-${fixture.lane}-${fixture.effects}${fixture.troops === 0 ? '-bases' : ''}${fixture.village?`-village-${fixture.mood}-${fixture.width}${fixture.reduced?'-reduced':''}${fixture.crop?'-short':''}`:''}`;
    const page = await context.newPage();
    const errors = [], assetFailures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().includes('/art/storybook/') && !response.ok()) assetFailures.push(`${response.status()} ${response.url()}`); });
    let diagnostic;
    try {
      if(fixture.village)await page.setViewportSize({width:fixture.width,height:Math.max(400,(fixture.crop??430)+110)});
      await page.emulateMedia({reducedMotion:fixture.reduced?'reduce':'no-preference'});
      await page.goto(`${origin}/tests/fixtures/layering.html?${query}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('body[data-ready="true"]', { timeout: 30000 });
      await page.screenshot({ path: `${output}/${name}.png` });
      diagnostic = await page.evaluate(() => window.layeringReview.inspect());
      assert.deepEqual(errors, [], 'renderer must not raise page errors');
      assert.deepEqual(assetFailures, [], 'all painted assets must load');
      assert.equal(await page.locator('body').getAttribute('data-fallback'), null, 'fixture must use loaded art');
      assert.deepEqual(diagnostic.canvas, { width: (fixture.width??450)*2, height: fixture.village?Math.round((fixture.crop??430)*fixture.width/450)*2:860 }, 'renderer maintains 2x density');
      assert.equal(diagnostic.state.time, 0, 'fixture cannot advance gameplay');
      const bases = diagnostic.images.filter(image => image.texture.startsWith('base-')).sort((a, b) => a.x - b.x);
      assert.equal(bases.length, 2, 'both base images render');
      assert.equal(bases[0].flipX, false, 'player painted base keeps its authored orientation');
      if ((fixture.enemyAge ?? fixture.age) <= 5) assert.equal(bases[1].flipX, true, 'enemy painted base is mirrored');
      assert.ok(diagnostic.baseDamage?.commandCount > 8, 'damaged bases draw actual damage graphics');
      if (fixture.troops !== 0) {
        const troops = diagnostic.images.filter(image => image.texture.startsWith('army-')).sort((a, b) => a.x - b.x);
        assert.equal(troops.length, 2, 'both overlapping troop images render');
        for (const [index, troop] of troops.entries()) {
          const base = bases[index], a = troop.bounds, b = base.bounds;
          assert.ok(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y, 'fixture troop must genuinely overlap its base');
          assert.equal(troop.paintIndex > base.paintIndex, fixture.lane > 0, 'rear troops hide behind bases; middle/front troops paint over them');
          assert.equal(troop.paintIndex > diagnostic.baseDamage.paintIndex, fixture.lane > 0, 'base damage must share the building occlusion boundary');
        }
      }
      if (fixture.effects !== 'none') {
        const effects = diagnostic.groundEffects[fixture.lane];
        assert.ok(effects?.commandCount > 8, 'source attack/dust events must paint a ground effect');
        for (const base of bases) assert.equal(effects.paintIndex > base.paintIndex, fixture.lane > 0, 'source attacks and foot dust follow their lane behind/in front of buildings');
      }
      if(fixture.village) {
        assertVillage(diagnostic,fixture);
        const second=await page.evaluate(()=>window.layeringReview.setClock(5));assertVillage(second,fixture);
        await page.screenshot({path:`${output}/${name}-time-5.png`});
        assert.equal(second.village.objects,diagnostic.village.objects,'no frame creates scene objects');
        assert.equal(second.village.depthBuilds,diagnostic.village.depthBuilds,'clock changes reuse cached clipping and triangulation');
        if(fixture.reduced){assert.deepEqual(second.village.paths,diagnostic.village.paths);assert.deepEqual(second.village.lamps,diagnostic.village.lamps,'reduced atmosphere remains still');}
        if(fixture.mood==='quiet'&&!fixture.reduced) {
          const flightTime=10+fixture.age*.7;
          for(const time of [flightTime,flightTime+3]){const flight=await page.evaluate(time=>window.layeringReview.setClock(time),time);assertVillage(flight,fixture);await page.screenshot({path:`${output}/${name}-flight-${time.toFixed(1)}.png`});}
          const crossing=await page.evaluate(()=>window.layeringReview.crossing(500));assertVillage(crossing,fixture);await page.screenshot({path:`${output}/${name}-combat-crossing.png`});
        }
        if(fixture.width===390&&fixture.mood==='quiet'&&!fixture.reduced){
          const baseline=await page.evaluate(()=>window.layeringReview.inspect());const samples=[];
          for(let time=0;time<=180;time+=3){const frame=await page.evaluate(time=>window.layeringReview.setClock(time),time);assertVillage(frame,fixture);assert.equal(frame.village.objects,baseline.village.objects);assert.deepEqual(frame.village.textures,baseline.village.textures);samples.push({time,objects:frame.village.objects,commands:frame.village.ambience.commandCount,lamps:frame.village.lamps.filter(lamp=>lamp.visible).length});}
          diagnostic.village.runtimeSamples=samples;
          // Actual same-scene chapter swaps must reuse its four lights/texture.
          for(let age=0;age<6;age++){const frame=await page.evaluate(age=>window.layeringReview.chapter(age),age);assertVillage(frame,{...fixture,age});assert.equal(frame.village.objects,baseline.village.objects);assert.deepEqual(frame.village.textures,baseline.village.textures);}
        }
        diagnostic.village.timePair=second.village;
      }
      reports.push({ name, status: 'passed', diagnostic });
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      reports.push({ name, status: 'failed', error: error.message, diagnostic, errors, assetFailures });
      await page.screenshot({ path: `${output}/${name}-failure.png` }).catch(() => {});
    } finally { await page.close(); }
  }
  await context.close();
  writeFileSync(`${output}/diagnostics.json`, JSON.stringify(reports, null, 2));
  assert.deepEqual(failures, [], failures.join('\n'));
  console.log(`Layering review passed: ${reports.length} frozen rendered cases; screenshots and diagnostics in ${output}`);
} finally {
  await browser?.close();
  server.kill();
}
