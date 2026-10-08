import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultProfile} from '../src/game/save.ts';
import {cardsScreenHtml} from '../src/ui/cards-screen.ts';

test('Cards offer native quantity choices and exactly one Summon command with its selected cost',()=>{
 const profile=defaultProfile();profile.gems=1000;
 for(const [count,cost,disabled] of [[1,100,false],[10,950,false],[50,4600,true]] as const){
  const html=cardsScreenHtml(profile,count);
  assert.equal((html.match(/data-pack=/g)??[]).length,1);
  assert.match(html,/<label for="card-quantity">Quantity<\/label>/);
  assert.match(html,/<select[^>]+id="card-quantity"[^>]*>/);
  for(const choice of [1,10,50])assert.match(html,new RegExp(`<option value="${choice}"`));
  assert.match(html,new RegExp(`<option value="${count}" selected>`));
  assert.match(html,new RegExp(`data-pack="${count}"[^>]+aria-label="Summon ${count} cards? for ${cost} gems"`));
  const button=html.match(/<button[^>]+data-pack=[^>]+>/)![0];assert.equal(button.includes('disabled'),disabled);
 }
});
