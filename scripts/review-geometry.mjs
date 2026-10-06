/** Browser measurements only. No CSS, renderer, simulation, clock or visibility overrides. */
import assert from 'node:assert/strict';

export const inside = (outer, inner, tolerance = 1) => inner.left >= outer.left - tolerance &&
  inner.right <= outer.right + tolerance && inner.top >= outer.top - tolerance && inner.bottom <= outer.bottom + tolerance;
export const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
export function assertReachable(row, label = row.key) {
  assert(row.visible, `${label}: visible control required`);
  assert(row.name.trim(), `${label}: accessible name required`);
  assert(row.box.width >= 43.5 && row.box.height >= 43.5, `${label}: native target is below 44px`);
  assert(row.effective.width >= 43.5 && row.effective.height >= 43.5, `${label}: clipped visible hit bounds are below 44px`);
  assert(inside(row.viewport, row.box), `${label}: full target must be in view after permitted scrolling`);
  assert(row.hits.every(hit => hit.accepted), `${label}: visible target is occluded at sampled hit points`);
}
export function inspectControl(node) {
  const box = el => { const r = el.getBoundingClientRect(); return {left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height}; };
  const viewport = {left:0, top:0, right:innerWidth, bottom:innerHeight, width:innerWidth, height:innerHeight};
  const r = box(node), style = getComputedStyle(node), effective = {...r};
  const clip = (bounds, x, y) => { if(x){effective.left=Math.max(effective.left,bounds.left);effective.right=Math.min(effective.right,bounds.right);} if(y){effective.top=Math.max(effective.top,bounds.top);effective.bottom=Math.min(effective.bottom,bounds.bottom);} };
  clip(viewport,true,true);
  const clippingAncestors=[];
  for(let p=node.parentElement;p;p=p.parentElement){
    const s=getComputedStyle(p),x=/(hidden|clip|auto|scroll)/.test(s.overflowX),y=/(hidden|clip|auto|scroll)/.test(s.overflowY);
    if(x||y){const bounds=box(p);clip(bounds,x,y);clippingAncestors.push({key:p.id||p.className,bounds,x,y});}
  }
  effective.width=Math.max(0,effective.right-effective.left);effective.height=Math.max(0,effective.bottom-effective.top);
  // Quarter points avoid rounded-corner false negatives while detecting an occluded target band.
  const hits=[[.5,.5],[.25,.25],[.75,.25],[.25,.75],[.75,.75]].map(([x,y])=>{
    const px=r.left+r.width*x,py=r.top+r.height*y,target=document.elementFromPoint(px,py);
    return {x:px,y:py,accepted:!!target&&(target===node||node.contains(target)),topElement:target?.id||target?.tagName||null};
  });
  return {key:node.id||node.dataset.campStation||node.dataset.campRecruit||node.dataset.command||node.dataset.tab||node.dataset.unit||node.dataset.skill||node.dataset.order,
    name:node.getAttribute('aria-label')||node.textContent||'', disabled:node.disabled,
    visible:node.checkVisibility()&&!node.closest('[hidden],[inert]')&&style.visibility!=='hidden',
    box:r,effective,viewport,hits,clippingAncestors,focused:node===document.activeElement,
    focusVisible:node.matches(':focus-visible'),outline:{width:style.outlineWidth,style:style.outlineStyle,color:style.outlineColor,offset:style.outlineOffset}};
}
export async function tabTo(page, selector, maxPresses = 80) {
  const path=[];
  for(let i=0;i<=maxPresses;i++){
    if(await page.locator(selector).evaluate(node=>node===document.activeElement))return {selector,presses:i,path};
    if(i===maxPresses)break;
    await page.keyboard.press('Tab');
    path.push(await page.evaluate(()=>{const n=document.activeElement;return n?.id||n?.getAttribute('data-tab')||n?.getAttribute('data-unit')||n?.tagName;}));
  }
  throw Error(`Real Tab input could not reach ${selector}; path=${JSON.stringify(path)}`);
}
export async function reachableControls(page, selector) {
  const rows=[],controls=page.locator(selector);
  for(let i=0;i<await controls.count();i++){
    const control=controls.nth(i);
    const before=await control.evaluate(inspectControl);
    if(!before.visible)continue;
    await control.scrollIntoViewIfNeeded();
    const after=await control.evaluate(inspectControl);
    assertReachable(after,`${selector} [${i}]`);rows.push({before,after});
  }
  assert(rows.length,`${selector}: expected visible controls`);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  return rows;
}
export async function troopLabels(page) {
  return page.locator('#unit-cards [data-unit]').evaluateAll(nodes=>nodes.map(node=>{
    const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    return {unit:Number(node.dataset.unit),box:box(node),locked:node.classList.contains('locked'),disabled:node.disabled,name:node.getAttribute('aria-label'),
      labels:['.unit-name','.unit-role','.unit-price'].map(selector=>{
        const n=node.querySelector(selector),range=document.createRange();range.selectNodeContents(n);
        return {selector,text:n.textContent.trim(),box:box(n),fragments:[...range.getClientRects()].map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height})),clipped:n.scrollWidth>n.clientWidth+1||n.scrollHeight>n.clientHeight+1,font:parseFloat(getComputedStyle(n).fontSize)};
      })};
  }));
}
export function assertTroopLabels(cards) {
  assert.equal(cards.length,3);
  for(const card of cards){
    assert(card.name,`troop ${card.unit}: accessible name`);
    for(const label of card.labels){
      assert(label.text&&!label.clipped,`troop ${card.unit}: ${label.selector} must remain complete`);
      assert(inside(card.box,label.box),`troop ${card.unit}: label region stays in the card`);
      for(const fragment of label.fragments)assert(inside(label.box,fragment),`troop ${card.unit}: painted text or icon fragment is clipped`);
    }
    assert(!overlaps(card.labels[0].box,card.labels[1].box),`troop ${card.unit}: name and role cannot overlap`);
  }
}
