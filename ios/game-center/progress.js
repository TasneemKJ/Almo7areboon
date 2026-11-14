/* Game Center for the iPhone app: the seven achievements, the one leaderboard,
   and the expression TasKit evaluates in the page to read them off the save.

   TasKit (TasBootScripts.snapshot) splices PROGRESS_SCRIPT into one line,
   `try{out.progress=(EXPR);}catch(e){}`, beside the save copy, so the
   expression must never break that line: single quotes only, no comments, no
   backslashes, no double quotes, no trailing semicolon. It returns
   {achievements:{key:true|false}, scores:{key:whole number}} and guards every
   field itself, because it reads the raw save, not decodeSave's output.
   Almo7areboonConfig.swift embeds the same string; tests/ios-game-center.test.ts
   checks they match, byte for byte.

   Nothing paid counts: every achievement can be earned in the two free
   chapters (the dusk raid's one free sample included), and the dusk raid
   itself never adds kills (src/game/dusk-raid.ts). Every condition reads a
   field the game already saves (SAVE_KEY, src/game/save.ts):
   - firstVictory   wins, battles won
   - oliveTerraces  furthestBattle >= 2: chapter 2, the Olive Terraces, won
   - secondTroop    unlocked[1] or unlocked[2]: a second troop invited in Camp
   - breadEnough    foodLevel >= 5, the storehouse's fifth level (the counsel's first bread)
   - gateUnbroken   any chapter's mastery.chapters[i].earnedMask has bit 2,
                    the Gate Unbroken seal (src/game/mastery.ts)
   - hundredBack    kills >= 100, rivals turned back
   - lampsDoNotFight (hidden) dusk.day > 0: the wall lamps lit once
   - rivalsTurnedBack (leaderboard) kills */

export const SAVE_KEY = 'almo7areboon.save.v1';

export const PROGRESS_SCRIPT = [
  '(function(){',
  'var o={achievements:{},scores:{}},s=null;',
  "try{s=JSON.parse(localStorage.getItem('almo7areboon.save.v1'));}catch(e){s=null;}",
  "var ob=function(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};};",
  "var n=function(v){return typeof v==='number'&&isFinite(v)&&v>0?Math.floor(Math.min(v,1e12)):0;};",
  's=ob(s);',
  'var a=o.achievements,u=Array.isArray(s.unlocked)?s.unlocked:[],m=ob(s.mastery),c=Array.isArray(m.chapters)?m.chapters:[];',
  'a.firstVictory=n(s.wins)>=1;',
  'a.oliveTerraces=n(s.furthestBattle)>=2;',
  'a.secondTroop=u[1]===true||u[2]===true;',
  'a.breadEnough=n(s.foodLevel)>=5;',
  'a.gateUnbroken=c.some(function(x){return (n(ob(x).earnedMask)&2)===2;});',
  'a.hundredBack=n(s.kills)>=100;',
  'a.lampsDoNotFight=n(ob(s.dusk).day)>=1;',
  'var k=n(s.kills);',
  'if(k>0)o.scores.rivalsTurnedBack=k;',
  'return o;',
  '})()',
].join('');

/* What App Store Connect shows. Names ≤ 30 characters, descriptions ≤ 200,
   Arabic in plain fusha, in the game's own words. `hidden` keeps the
   description secret until earned. */
export const ACHIEVEMENTS = Object.freeze([
  {
    key: 'firstVictory', id: 'almo.milestone.1_first_battle', points: 10, hidden: false,
    en: { name: 'First Fires', before: 'Win your first battle.', after: 'The rival company went home before supper. The valley lit its lamps all the same.' },
    ar: { name: 'النيران الأولى', before: 'انتصر في معركتك الأولى.', after: 'عادت السريّة المنافسة قبل العشاء، وأشعل الوادي قناديله كعادته.' },
  },
  {
    key: 'oliveTerraces', id: 'almo.milestone.2_olive_terraces', points: 20, hidden: false,
    en: { name: 'The Olive Terraces', before: 'Win the battle at the Olive Terraces.', after: 'The terraces are quiet again. The olives did not notice. The farmers did.' },
    ar: { name: 'مدرّجات الزيتون', before: 'انتصر في معركة مدرّجات الزيتون.', after: 'هدأت المدرّجات من جديد. لم يلحظ الزيتون شيئاً، أمّا المزارعون فلاحظوا.' },
  },
  {
    key: 'secondTroop', id: 'almo.milestone.3_by_the_fire', points: 10, hidden: false,
    en: { name: 'Waiting by the Fire', before: 'Invite a second troop to your company.', after: 'He had been waiting by the fire all along, and he brought his own stones.' },
    ar: { name: 'عند النار', before: 'ادعُ جندياً ثانياً إلى سريّتك.', after: 'كان ينتظر عند النار منذ البداية، وجاء بحجارته معه.' },
  },
  {
    key: 'breadEnough', id: 'almo.milestone.4_bread_enough', points: 15, hidden: false,
    en: { name: 'Bread Enough', before: 'Raise the storehouse to its fifth level.', after: 'Courage was never short. Now bread is not either.' },
    ar: { name: 'خبزٌ يكفي', before: 'ارفع المخزن إلى مستواه الخامس.', after: 'لم تنقصك الشجاعة يوماً، والآن لا ينقصك الخبز.' },
  },
  {
    key: 'gateUnbroken', id: 'almo.milestone.5_gate_unbroken', points: 30, hidden: false,
    en: { name: 'Gate Unbroken', before: 'Win a battle before the rival lands a single blow on your gate.', after: 'Not a scratch on the home gate. The carpenter is almost disappointed.' },
    ar: { name: 'بوّابةٌ لم تُكسر', before: 'انتصر في معركة قبل أن يصيب الخصم بوّابتك بضربة واحدة.', after: 'لم تُخدش بوّابة الديار، حتى كاد النجّار يأسف.' },
  },
  {
    key: 'hundredBack', id: 'almo.milestone.6_a_hundred_turned_back', points: 20, hidden: false,
    en: { name: 'A Hundred Turned Back', before: 'Turn back a hundred rivals.', after: 'A hundred went home by the long road. The road knows your banner now.' },
    ar: { name: 'مئةٌ عادوا أدراجهم', before: 'رُدّ مئةً من الخصوم.', after: 'عاد مئةٌ منهم من الطريق الطويل، وصار الطريق يعرف رايتك.' },
  },
  {
    key: 'lampsDoNotFight', id: 'almo.milestone.7_lamps_do_not_fight', points: 25, hidden: true,
    en: { name: 'Lamps Do Not Fight', before: 'Some lamps on the village wall are lit for a reason.', after: 'Lamps do not fight, but they give away whoever creeps in.' },
    ar: { name: 'القناديل لا تقاتل', before: 'بعض قناديل سور القرية تُشعَل لسبب.', after: 'القناديل لا تقاتل، لكنها تفضح من يتسلّل.' },
  },
]);

export const LEADERBOARD = Object.freeze({
  key: 'rivalsTurnedBack', id: 'almo.rivals_turned_back',
  en: { name: 'Rivals Turned Back', suffix: 'rivals', suffixSingular: 'rival' },
  ar: { name: 'خصومٌ رُدّوا' },
});
