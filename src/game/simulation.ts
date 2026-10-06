import { createBattleOrders, earnMomentum, issueBattleOrder, activeBattleOrder, ORDER_EFFECTS } from './battle-orders.ts';
import { normalizeChronicle, chronicleEncounter, recordChronicleWin, type ChronicleAction } from './chronicle.ts';
import { planChronicleAction } from './chronicle-actions.ts';
import { createChronicleBattle, chronicleStartingFood, chronicleGateFactor, chronicleSpawn, toggleRally, chronicleMovementLimit, chronicleDamage, chronicleBaseDamage, chronicleAfterHit, chronicleSkill, captainSkill, chronicleTick, chronicleOutcome, type ChronicleHost } from './chronicle-combat.ts';
import { isLegacyChoice, legacyEffects, prestigePreview } from './prestige.ts';
import { advanceStatus, canRetry, createMastery, masteryAward } from './mastery.ts';
import { encounterForAge, scheduledSpawns, wavePreview } from './encounters.ts';
import type { Encounter, ScheduledSpawn, WaveStatus } from './encounters.ts';
import { resolveRoleHit, sweepTarget } from './role-traits.ts';
import { battleStats } from './statistics.ts';
import { cardPackCost, drawCard, nextCardRandom } from './cards.ts';
import { ERAS, QUESTS, dailyReward, eraEconomyScale, baseUpgradeCost, cardBonus, foodRate, foodUpgradeCost, unlockCost } from './data.ts';
import { defaultProfile, loadProfile } from './save.ts';
import { syncWeekly, weeklyStatus } from './weekly.ts';
import type { Action, BattleState, DeploymentStatus, GameEvent, GamePort, Profile, Side, Skill, Unit, UnitKind } from './types.ts';

const FIXED_STEP = 1 / 60;

export class Game implements GamePort {
  profile: Profile;
  state: BattleState;
  private events: GameEvent[] = [];
  private encounter: Encounter = encounterForAge(0);
  private schedule: readonly ScheduledSpawn[] = [];
  private nextSpawn = 0;
  private nextId = 1;
  private playerLane = 0;
  private enemyLane = 0;
  private accumulator = 0;
  private damageEarnings = 0;
  private rewardRemainder = 0;
  private tickBonuses: ReturnType<typeof cardBonus> | null = null;
  private bonuses() { return this.tickBonuses ?? cardBonus(this.profile); }

  constructor(profile: Profile = defaultProfile()) {
    this.profile = loadProfile({ getItem: () => JSON.stringify(profile) });
    this.state = this.newBattle();
    this.restorePendingVictory();
  }

  private restorePendingVictory(): void {
    const victory = this.profile.pendingVictory;
    if (victory) {
      this.state.phase = 'won';
      this.state.stats = battleStats(victory.stats);
      this.state.enemyHp = Math.min(this.state.enemyMaxHp,victory.story?.enemyHp??0);
      this.state.playerHp = Math.min(this.state.playerMaxHp, victory.playerHp);
      this.state.earned = victory.earned;
      this.state.time = victory.seconds;
      this.state.wave = this.state.totalWaves;
      if(this.state.chronicle){
        const c=this.state.chronicle,story=victory.story;c.settled=true;
        if(story){
          c.cart={x:story.cartX,hp:Math.min(story.cartHp,story.cartMaxHp),maxHp:story.cartMaxHp};
          c.rescued=story.rescued;c.rescueProgress=story.rescueProgress;c.lightSeconds=story.lightSeconds;
          c.boss.spawned=story.bossDefeated;c.boss.interrupts=story.interrupts;
          c.coveredHits=story.coveredHits;c.shatters=story.shatters;
        }
      }
      this.nextSpawn = this.schedule.length;
    }
  }

  private newBattle(): BattleState {
    this.events = [];
    this.profile.chronicle=normalizeChronicle(this.profile.chronicle,this.profile.timeline,this.profile.enemyAge);
    this.encounter = chronicleEncounter(encounterForAge(this.profile.enemyAge),this.profile.chronicle,this.profile.enemyAge);
    this.schedule = scheduledSpawns(this.encounter);
    this.nextSpawn = 0;
    this.nextId = 1;
    const playerHp = this.baseHealth();
    const enemyHp = Math.round(160 * 1.65 ** this.profile.enemyAge * this.timelinePower());
    this.accumulator = 0;
    this.damageEarnings = 0;
    this.rewardRemainder = 0;
    this.playerLane = 0;
    this.enemyLane = 0;
    return { orders: createBattleOrders(), chronicle: createChronicleBattle(this.profile), stats: battleStats(), phase: 'ready', paused: false, time: 0, food: Math.min(99,legacyEffects(this.profile.legacy).startingFood+chronicleStartingFood(this.profile)), playerHp, playerMaxHp: playerHp, enemyHp, enemyMaxHp: enemyHp, units: [], wave: 0, totalWaves: this.encounter.waves.length, earned: 0, freezeUntil: 0, skillsUsed: [] };
  }

  private baseHealth(): number { return Math.round(180 * 1.65 ** this.profile.age * (1 + this.profile.baseLevel * 0.4) * this.bonuses().base * legacyEffects(this.profile.legacy).gateFactor * chronicleGateFactor(this.profile)); }
  private refreshBaseHealth(): void {
    const nextMaxHp = this.baseHealth();
    this.state.playerHp = this.state.phase === 'lost' ? 0 : Math.max(0, Math.min(nextMaxHp, this.state.playerHp + nextMaxHp - this.state.playerMaxHp));
    this.state.playerMaxHp = nextMaxHp;
  }

  private timelinePower(): number { return 1 + (this.profile.timeline - 1) * 0.22; }
  private isActive(): boolean { return this.state.phase === 'running' && !this.state.paused; }
  private canPrepare(): boolean { return this.state.phase !== 'running' || this.state.paused; }

  private chronicleHost(): ChronicleHost {
    return {hurt:(unit,damage)=>this.hurt(unit,damage),spawnEnemy:(kind)=>this.spawn('enemy',kind)?this.state.units[this.state.units.length-1]:undefined,emit:event=>this.events.push(event)};
  }

  dispatch(action: Action): boolean {
    if(action.type==='rally'){const changed=toggleRally(this.profile,this.state);if(changed)this.events.push({type:'hit',storyCue:'rally',x:235,amount:0});return changed;}
    if(action.type.startsWith('chronicle-')){
      const plan=planChronicleAction(this.profile,this.state,action as ChronicleAction);
      if(!plan)return false;
      this.profile.chronicle=plan.chronicle;this.profile.enemyAge=plan.enemyAge;
      if(plan.reset){this.profile.pendingVictory=null;this.state=this.newBattle();}
      return true;
    }
    if(this.profile.chronicle?.expedition&&['next','prestige','select-battle','evolve'].includes(action.type))return false;
    switch (action.type) {
      case 'order':
        if (!issueBattleOrder(this.state, action.order)) return false;
        this.events.push({type:'order',order:action.order,x:235});
        return true;
      case 'start':
        if (this.state.phase !== 'ready') return false;
        this.state.phase = 'running';
        return true;
      case 'retreat':
        // Some fights stall (long-range defenders against a weak army), and only a reload could end them. Retreating is an ordinary
        // loss: coins already earned are kept, no seals or rewards are added, and nothing is written to the pending-victory receipt.
        if (this.state.phase !== 'running') return false;
        this.state.phase = 'lost';
        this.state.paused = false;
        this.events.push({ type: 'lose' });
        return true;
      case 'pause':
        if (this.state.phase !== 'running') return false;
        this.state.paused = !this.state.paused;
        return true;
      case 'spawn':
        if (!this.deploymentStatus(action.kind).allowed) return false;
        if (!this.spawn('player', action.kind)) return false;
        this.state.food -= ERAS[this.profile.age].units[action.kind].cost;
        chronicleSpawn(this.profile,this.state,this.state.units[this.state.units.length-1]);
        earnMomentum(this.state,12);
        this.profile.deployed++;
        this.state.stats.deployed++;
        this.state.stats.deployedByKind[action.kind]++;
        this.state.stats.foodSpent += ERAS[this.profile.age].units[action.kind].cost;
        this.state.stats.peakArmy = Math.max(this.state.stats.peakArmy, this.state.units.filter(unit => unit.side === 'player' && unit.hp > 0).length);
        return true;
      case 'skill': return this.skill(action.skill);
      case 'retry':
        if (!canRetry(this.profile,this.state)) return false;
        this.profile.pendingVictory = null;
        this.state = this.newBattle();
        return true;
      case 'next': {
        const advancement = advanceStatus(this.profile,this.state);
        if (!advancement.allowed || advancement.target !== 'battle') return false;
        this.profile.pendingVictory = null;
        this.profile.enemyAge++;
        this.profile.furthestBattle = Math.max(this.profile.furthestBattle,this.profile.enemyAge);
        this.state = this.newBattle();
        return true;
      }
      case 'prestige': {
        if (!Number.isInteger(action.expectedTimeline) || action.expectedTimeline !== this.profile.timeline) return false;
        const preview = prestigePreview(this.profile,this.state,action.legacy);
        if (!preview) return false;
        Object.assign(this.profile, {
          legacy: {rank:preview.rankAfter,selected:preview.choice},
          timeline:preview.nextTimeline,gems:preview.gemsAfter,
          mastery:createMastery(preview.nextTimeline),pendingVictory:null,
          enemyAge:0,furthestBattle:0,coins:0,age:0,foodLevel:0,baseLevel:0,
          unlocked:[true,false,false],
        });
        this.state = this.newBattle();
        return true;
      }
      case 'select-legacy':
        if (this.state.phase !== 'ready' || this.profile.legacy.rank === 0 || !isLegacyChoice(action.legacy)) return false;
        this.profile.legacy = {...this.profile.legacy,selected:action.legacy};
        this.state = this.newBattle();
        return true;
      case 'select-battle':
        if (this.state.phase !== 'ready' || !Number.isInteger(action.battle) || action.battle < 0 || action.battle > this.profile.furthestBattle) return false;
        this.profile.enemyAge = action.battle;
        this.state = this.newBattle();
        return true;
      case 'unlock':
        if (![1, 2].includes(action.kind) || this.profile.unlocked[action.kind] || !this.spend(unlockCost(action.kind, this.profile))) return false;
        this.profile.unlocked[action.kind] = true;
        this.events.push({ type: 'upgrade' });
        return true;
      case 'upgrade': {
        if (!this.upgradeStatus(action.stat).allowed) return false;
        if (action.stat === 'food') {
          if (this.profile.foodLevel >= 100 || !this.spend(foodUpgradeCost(this.profile))) return false;
          this.profile.foodLevel++;
        } else if (action.stat === 'base') {
          if (this.profile.baseLevel >= 100 || !this.spend(baseUpgradeCost(this.profile))) return false;
          this.profile.baseLevel++;
          this.refreshBaseHealth();
        } else return false;
        this.events.push({ type: 'upgrade' });
        return true;
      }
      case 'evolve':
        if (this.state.phase === 'running' || this.profile.age >= 5 || this.profile.age > this.profile.enemyAge || !this.spend(ERAS[this.profile.age].evolveCost)) return false;
        this.profile.age++;
        this.profile.coins = 0;
        this.profile.foodLevel = 0;
        this.profile.baseLevel = 0;
        this.profile.unlocked = [true, false, false];
        this.state = this.newBattle();
        this.restorePendingVictory();
        this.events.push({ type: 'evolve' });
        return true;
      case 'summon': {
        const count = action.count ?? 1;
        if (!this.canPrepare() || ![1, 10, 50].includes(count)) return false;
        const cost = cardPackCost(count);
        if (this.profile.gems < cost) return false;
        // Stage the entire pack before touching the wallet or saved random stream.
        const cards = [...this.profile.cards];
        const indices: number[] = [];
        let seed = this.profile.summonSeed;
        let draws = this.profile.summonCount;
        for (let i = 0; i < count; i++) {
          const rarity = nextCardRandom(seed);
          const choice = nextCardRandom(rarity.seed);
          const index = drawCard(draws, rarity.value, choice.value, cards);
          if (index < 0 || cards[index] >= 1000) return false;
          cards[index]++;
          indices.push(index);
          seed = choice.seed;
          draws = Math.min(1e9, draws + 1);
        }
        this.profile.gems -= cost;
        this.profile.cards = cards;
        this.refreshBaseHealth();
        this.profile.summonSeed = seed;
        this.profile.summonCount = draws;
        this.events.push({ type: 'upgrade', amount: indices[0], cardIndices: indices });
        return true;
      }
      case 'daily': {
        const reward = dailyReward(this.profile, action.day);
        if (!reward.available) return false;
        this.profile.dailyDay = action.day;
        this.profile.dailyStreak = Math.min(1e6, reward.streak);
        if (reward.graced) this.profile.graceDay = action.day;
        this.profile.gems = Math.min(1e7, this.profile.gems + reward.gems);
        this.events.push({ type: 'upgrade' });
        return true;
      }
      case 'weekly-sync':
        return syncWeekly(this.profile, action.week, action.earned);
      case 'weekly': {
        syncWeekly(this.profile, action.week);
        const status = weeklyStatus(this.profile, action.week);
        if (!status.ready) return false;
        this.profile.weekly = { ...this.profile.weekly!, claimed: true };
        this.profile.gems = Math.min(1e7, this.profile.gems + status.gems);
        this.events.push({ type: 'upgrade' });
        return true;
      }
      case 'claim': {
        const quest = QUESTS.find(q => q.id === action.id);
        if (!quest || this.profile.claimed.includes(quest.id) || this.profile[quest.stat] < quest.target) return false;
        this.profile.claimed.push(quest.id);
        this.profile.gems = Math.min(1e7, this.profile.gems + quest.reward);
        this.events.push({ type: 'upgrade' });
        return true;
      }
      default: return false;
    }
  }

  private spend(cost: number): boolean {
    if (!Number.isFinite(cost) || cost < 0 || this.profile.coins < cost) return false;
    this.profile.coins -= cost;
    return true;
  }

  upgradeStatus(stat: 'food' | 'base'): { allowed: boolean; reason: 'available' | 'coins' | 'max' | 'invalid'; cost: number | null; nextValue: number | null } {
    if (stat !== 'food' && stat !== 'base') return { allowed: false, reason: 'invalid', cost: null, nextValue: null };
    const level = stat === 'food' ? this.profile.foodLevel : this.profile.baseLevel;
    if (level >= 100) return { allowed: false, reason: 'max', cost: null, nextValue: null };
    const cost = stat === 'food' ? foodUpgradeCost(this.profile) : baseUpgradeCost(this.profile);
    const nextValue = stat === 'food' ? (0.8 + (level + 1) * 0.14) * this.bonuses().food : Math.round(180 * 1.65 ** this.profile.age * (1 + (level + 1) * 0.4) * this.bonuses().base * legacyEffects(this.profile.legacy).gateFactor * chronicleGateFactor(this.profile));
    return { allowed: this.profile.coins >= cost, reason: this.profile.coins >= cost ? 'available' : 'coins', cost, nextValue };
  }

  waveStatus(): WaveStatus {
    const preview = wavePreview(this.encounter, this.state.time, this.state.wave);
    const enemiesRemaining = this.state.units.filter(unit => unit.side === 'enemy' && unit.hp > 0).length;
    const pendingEnemies = this.state.phase === 'won' || this.state.phase === 'lost' ? 0 : this.schedule.slice(this.nextSpawn).filter(spawn => spawn.waveIndex < this.state.wave).length;
    return { spawned: this.state.wave, total: this.encounter.waves.length, nextIn: preview?.nextIn ?? null, enemiesRemaining, pendingEnemies, cleared: !preview && this.nextSpawn === this.schedule.length && enemiesRemaining === 0, preview };
  }

  deploymentStatus(kind: UnitKind): DeploymentStatus {
    const status = (reason: DeploymentStatus['reason'], missingFood = 0, waitSeconds = 0): DeploymentStatus => ({ allowed: reason === 'available', reason, missingFood, waitSeconds });
    if (![0, 1, 2].includes(kind)) return status('invalid');
    if (!this.profile.unlocked[kind]) return status('locked');
    if (this.state.phase !== 'running') return status('ready');
    if (this.state.paused) return status('paused');
    if (this.state.units.filter(unit => unit.side === 'player' && unit.hp > 0).length >= 60) return status('capacity');
    if (!this.findSpawnSpot('player')) return status('blocked');
    const missing = Math.max(0, ERAS[this.profile.age].units[kind].cost - this.state.food);
    return missing > 0 ? status('food', missing, missing / foodRate(this.profile)) : status('available');
  }

  private findSpawnSpot(side: Side): { lane: number; x: number } | null {
    const nextLane = side === 'player' ? this.playerLane : this.enemyLane;
    for (let attempt = 0; attempt < 3; attempt++) {
      const lane = (nextLane + attempt) % 3;
      const sameLane = this.state.units.filter(unit => unit.side === side && unit.lane === lane && unit.hp > 0);
      const x = side === 'player' ? Math.min(140, ...sameLane.map(unit => unit.x - 24)) : Math.max(860, ...sameLane.map(unit => unit.x + 24));
      if (side === 'enemy' || x >= 92) return { lane, x };
    }
    return null;
  }

  private spawn(side: Side, kind: UnitKind): boolean {
    if (this.state.units.filter(unit => unit.side === side && unit.hp > 0).length >= 60) return false;
    const spot = this.findSpawnSpot(side);
    if (!spot) return false;
    const { lane, x } = spot;
    const age = side === 'player' ? this.profile.age : this.profile.enemyAge;
    const def = ERAS[age].units[kind];
    if (side === 'player') this.playerLane = lane + 1;
    else this.enemyLane = lane + 1;
    const healthBonus = side === 'player' ? this.bonuses().health : this.timelinePower() * 0.94;
    const hp = Math.round(def.hp * healthBonus);
    this.state.units.push({ id: this.nextId++, side, kind, age, x, lane, hp, maxHp: hp, attackTimer: 0, attacking: false, hitFlash: 0 });
    if(side==='enemy')chronicleSpawn(this.profile,this.state,this.state.units[this.state.units.length-1]);
    this.events.push({ type: 'spawn', x, lane, side });
    return true;
  }

  canUseSkill(skill: Skill): boolean {
    if (!this.isActive() || !['food', 'freeze', 'meteor'].includes(skill) || this.state.skillsUsed.includes(skill)) return false;
    if (skill === 'food' && this.state.food >= 99 && (!this.profile.chronicle?.enabled || this.profile.chronicle.captain==='none')) return false;
    if (skill === 'meteor' && !this.state.units.some(unit => unit.side === 'enemy' && unit.hp > 0) && !(this.state.chronicle?.landmark.kind==='cover'&&!this.state.chronicle.landmark.broken)) return false;
    return true;
  }

  private skill(skill: Skill): boolean {
    if (!this.canUseSkill(skill)) return false;
    const foodGain = Math.min(10, 99 - this.state.food);
    this.state.skillsUsed.push(skill);
    this.state.stats.skillsCast++;
    const captainUsed=skill==='food'&&captainSkill(this.profile,this.state);
    if (skill === 'food'&&!captainUsed) this.state.food = Math.min(99, this.state.food + 10);
    if (skill === 'freeze') {
      this.state.stats.maxFreezeTargets = Math.max(this.state.stats.maxFreezeTargets,this.state.units.filter(unit=>unit.side === 'enemy' && unit.hp > 0).length);
      this.state.freezeUntil = this.state.time + legacyEffects(this.profile.legacy).freezeSeconds;
    }
    if (skill === 'meteor') {
      const damage = 36 * 1.65 ** this.profile.age * this.bonuses().damage;
      for (const unit of this.state.units) if (unit.side === 'enemy' && unit.hp > 0) {
        this.hurt(unit, damage);
        if (unit.hp === 0) this.state.stats.meteorKills++;
      }
      this.state.units = this.state.units.filter(u => u.hp > 0);
    }
    chronicleSkill(this.profile,this.state,skill);
    this.events.push({ type: 'skill', skill, ...(captainUsed?{storyCue:'captain' as const}:{}), amount: skill === 'food' ? (captainUsed?0:foodGain) : undefined });
    return true;
  }

  step(dt: number): void {
    if (!this.isActive() || !Number.isFinite(dt) || dt <= 0) return;
    // Bound a stalled frame rather than fast-forwarding combat after tab suspension.
    this.accumulator += Math.min(dt, 0.25);
    while (this.accumulator + 1e-9 >= FIXED_STEP && this.isActive()) {
      this.accumulator -= FIXED_STEP;
      this.tickBonuses = cardBonus(this.profile);
      try { this.tick(FIXED_STEP); } finally { this.tickBonuses = null; }
    }
  }

  private tick(dt: number): void {
    this.state.time += dt;
    this.state.food = Math.min(99, this.state.food + (0.8 + this.profile.foodLevel * 0.14) * this.bonuses().food * dt);
    this.state.units = this.state.units.filter(u => u.hp > 0);
    chronicleTick(this.profile,this.state,dt,this.chronicleHost());
    const deferChronicleWin=this.state.chronicle?.enabled===true&&chronicleOutcome(this.profile,this.state)==='won';
    if (this.checkEnd(deferChronicleWin)) return;
    while (this.state.wave < this.encounter.waves.length && this.state.time + 1e-9 >= this.encounter.waves[this.state.wave].time) this.state.wave++;
    while (this.nextSpawn < this.schedule.length && this.state.time + 1e-9 >= this.schedule[this.nextSpawn].time) {
      this.spawn('enemy', this.schedule[this.nextSpawn].kind);
      // Rejected arrivals are finite attempts, never deferred until capacity frees.
      this.nextSpawn++;
    }

    // Front bodies move first so the spacing check sees their new positions.
    const actors = [...this.state.units].sort((a, b) => a.side === b.side ? ((a.side === 'player' ? b.x - a.x : a.x - b.x) || a.id - b.id) : (a.side === 'player' ? -1 : 1));
    for (const unit of actors) {
      if (unit.hp <= 0) continue;
      unit.hitFlash = Math.max(0, unit.hitFlash - dt);
      unit.attacking = false;
      if (unit.side === 'enemy' && this.state.time < this.state.freezeUntil) continue;
      unit.attackTimer = Math.max(0, unit.attackTimer - dt);
      const def = ERAS[unit.age].units[unit.kind];
      const direction = unit.side === 'player' ? 1 : -1;
      const targets = this.state.units.filter(other => other.side !== unit.side && other.hp > 0);
      const distance = (other: Unit) => Math.hypot(other.x - unit.x, (other.lane - unit.lane) * 10);
      const target = targets.sort((a, b) => (distance(a) - distance(b)) || a.id - b.id)[0];
      const baseX = unit.side === 'player' ? 910 : 90;
      const targetInRange = target && distance(target) <= def.range;
      const baseInRange = Math.abs(baseX - unit.x) <= def.range;
      if (targetInRange || baseInRange) {
        unit.attacking = true;
        if (unit.attackTimer <= 0) {
          unit.attackTimer = def.interval;
          const power = unit.side === 'player' ? this.bonuses().damage : this.timelinePower() * 0.94;
          const damage = def.damage * power * (unit.side === 'player' && activeBattleOrder(this.state,this.state.time) === 'advance' ? ORDER_EFFECTS.advance.damage : 1);
          const source = { id: unit.id, x: unit.x, lane: unit.lane, side: unit.side, age: unit.age, kind: unit.kind };
          const hit = (targetUnit: Unit, secondary = false) => {
            const resolved = resolveRoleHit(unit.kind, targetUnit.kind, damage, secondary);
            const actual = this.hurt(targetUnit, chronicleDamage(this.profile,this.state,unit,targetUnit,resolved.damage,secondary));
            this.credit(unit,actual);
            chronicleAfterHit(this.profile,this.state,unit,targetUnit,resolved.damage,secondary,this.chronicleHost());
            this.events.push({ type: 'hit', x: targetUnit.x, lane: targetUnit.lane, side: unit.side, amount: actual, source, target: 'unit', ...(resolved.trait ? { trait: resolved.trait } : {}) });
          };
          if (targetInRange) {
            hit(target);
            if (unit.kind === 2) {
              const secondary = sweepTarget(unit, target, this.state.units);
              if (secondary) hit(secondary, true);
            }
          } else {
            const actual = this.hurtBase(unit.side, damage);
            this.credit(unit,actual);
            this.events.push({ type: 'hit', x: baseX, lane: unit.lane, side: unit.side, amount: actual, source, target: 'base' });
          }
        }
      } else {
        let nextX = unit.x + def.speed * direction * dt * (unit.side === 'player' && activeBattleOrder(this.state,this.state.time) === 'advance' ? ORDER_EFFECTS.advance.movement : 1);
        const rallyLimit=chronicleMovementLimit(this.state,unit);
        if(rallyLimit!==null)nextX=Math.min(nextX,rallyLimit);
        for (const friend of this.state.units) {
          if (friend.id === unit.id || friend.side !== unit.side || friend.lane !== unit.lane || friend.hp <= 0) continue;
          if ((friend.x - unit.x) * direction > 0) nextX = direction === 1 ? Math.min(nextX, friend.x - 22) : Math.max(nextX, friend.x + 22);
        }
        // Never retreat because two bodies were added at an identical position.
        unit.x = direction === 1 ? Math.max(unit.x, Math.min(910, nextX)) : Math.min(unit.x, Math.max(90, nextX));
      }
      if (this.checkEnd(deferChronicleWin)) break;
    }
    this.state.units = this.state.units.filter(u => u.hp > 0);
    if(this.state.phase==='running')this.checkEnd();
  }

  private hurt(unit: Unit, damage: number): number {
    if (unit.hp <= 0) return 0;
    if (unit.side === 'player' && activeBattleOrder(this.state,this.state.time) === 'hold') damage *= ORDER_EFFECTS.hold.received;
    const actual = Math.min(unit.hp, damage);
    if (unit.side === 'enemy') this.state.stats.damageDealt += actual;
    else this.state.stats.damageTaken += actual;
    unit.hp = Math.max(0, unit.hp - actual);
    unit.hitFlash = 0.16;
    if (unit.hp === 0) {
      this.events.push({ type: 'death', x: unit.x, lane: unit.lane, side: unit.side, kind: unit.kind });
      if (unit.side === 'enemy') {
        earnMomentum(this.state,8);
        this.profile.kills++;
        this.state.stats.kills++;
        this.reward(Math.round((12 + unit.kind * 9) * (1 + unit.age * 0.5)), unit.x);
      }
    }
    return actual;
  }

  /** Presentation-only ledger of player damage per troop role, for the defeat recap. */
  private credit(attacker: Unit, actual: number): void {
    if (attacker.side !== 'player' || !(actual > 0) || ![0, 1, 2].includes(attacker.kind)) return;
    const ledger = this.state.stats.damageByKind ??= [0, 0, 0];
    ledger[attacker.kind] += actual;
  }

  private hurtBase(attacker: Side, damage: number): number {
    damage=chronicleBaseDamage(this.state,attacker,damage);
    if (attacker === 'enemy' && activeBattleOrder(this.state,this.state.time) === 'hold') damage *= ORDER_EFFECTS.hold.received;
    if (attacker === 'player') {
      const actual = Math.min(this.state.enemyHp, damage);
      this.state.enemyHp = Math.max(0, this.state.enemyHp - actual);
      this.state.stats.damageDealt += actual;
      this.damageEarnings += actual * 0.3;
      const coins = Math.floor(this.damageEarnings);
      this.damageEarnings -= coins;
      if (coins) this.reward(coins, 910);
      return actual;
    } else {
      const actual = Math.min(this.state.playerHp, damage);
      this.state.stats.damageTaken += actual;
      this.state.stats.gateDamageTaken += actual;
      this.state.playerHp = Math.max(0, this.state.playerHp - actual);
      return actual;
    }
  }

  private reward(coins: number, x?: number): void {
    if (!Number.isFinite(coins) || coins <= 0) return;
    const scaled = coins * eraEconomyScale(this.profile.enemyAge) * this.bonuses().coins + this.rewardRemainder;
    const whole = Math.floor(scaled + 1e-9);
    this.rewardRemainder = Math.max(0, scaled - whole);
    const credited = Math.min(whole, Math.max(0, 1e9 - this.profile.coins));
    if (credited <= 0) return;
    this.profile.coins += credited;
    this.state.earned = Math.min(1e9, this.state.earned + credited);
    this.events.push({ type: 'coin', x, amount: credited });
  }

  private checkEnd(deferChronicleWin=false): boolean {
    if (this.state.phase !== 'running') return true;
    const outcome=chronicleOutcome(this.profile,this.state);
    if (outcome==='lost') {
      this.state.playerHp = Math.max(0,this.state.playerHp);
      this.state.phase = 'lost';
      this.events.push({ type: 'lose' });
      return true;
    }
    if (outcome==='won') {
      if(deferChronicleWin&&this.state.chronicle?.enabled)return false;
      if(!this.state.chronicle || ['siege','light','boss'].includes(this.state.chronicle.objective))this.state.enemyHp=0;
      this.state.phase = 'won';
      if(this.profile.chronicle&&this.state.chronicle&&!this.state.chronicle.settled){
        this.profile.chronicle=recordChronicleWin(this.profile.chronicle,this.profile,{deployedByKind:this.state.stats.deployedByKind,survivingRoles:[0,1].map(kind=>{const id=this.state.chronicle!.veteranIds[kind];return id!==null&&this.state.units.some(unit=>unit.id===id&&unit.side==='player'&&unit.hp>0);}),food:this.state.food});
        this.state.chronicle.settled=true;
      }
      this.nextSpawn = this.schedule.length;
      this.profile.wins++;
      this.reward(120 * (1 + this.profile.enemyAge), 910);
      this.profile.gems = Math.min(1e7, this.profile.gems + 10);
      const award = masteryAward(this.profile,this.state);
      this.state.earned = Math.min(1e9,this.state.earned + award.coins);
      const mastery = { ...this.profile.mastery, chapters: [...this.profile.mastery.chapters] as Profile['mastery']['chapters'] };
      mastery.chapters[this.profile.enemyAge] = award.record;
      Object.assign(this.profile, {
        mastery, coins: this.profile.coins + award.coins, gems: this.profile.gems + award.gems,
        furthestBattle: Math.max(this.profile.furthestBattle,Math.min(5,this.profile.enemyAge+1)),
        pendingVictory: { settlement: 'mastery-v1', stats: battleStats(this.state.stats), timeline: this.profile.timeline, battle: this.profile.enemyAge, earned: this.state.earned, seconds: this.state.time, playerHp: this.state.playerHp, eligibleMask: award.eligibleMask, newMask: award.newMask, masteryCoins: award.coins, masteryGems: award.gems },
      });
      if (award.coins) this.events.push({type:'coin',x:910,amount:award.coins});
      const c=this.state.chronicle;
      if(c&&this.profile.pendingVictory)this.profile.pendingVictory.story={
        route:c.route,enemyHp:this.state.enemyHp,cartX:c.cart.x,cartHp:c.cart.hp,cartMaxHp:c.cart.maxHp,
        rescued:c.rescued,rescueProgress:c.rescueProgress,lightSeconds:c.lightSeconds,
        bossDefeated:c.boss.spawned&&!this.state.units.some(unit=>unit.id===c.boss.id&&unit.hp>0),
        interrupts:c.boss.interrupts,coveredHits:c.coveredHits,shatters:c.shatters,
      };
      this.events.push({ type: 'win' });
      return true;
    }
    return false;
  }

  drainEvents(): GameEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }
}
