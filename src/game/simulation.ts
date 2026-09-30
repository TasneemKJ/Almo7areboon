import { encounterForAge, scheduledSpawns, wavePreview } from './encounters.ts';
import type { Encounter, ScheduledSpawn, WaveStatus } from './encounters.ts';
import { resolveRoleHit, sweepTarget } from './role-traits.ts';
import { battleStats } from './statistics.ts';
import { cardPackCost, drawCard, nextCardRandom } from './cards.ts';
import { ERAS, QUESTS, eraEconomyScale, baseUpgradeCost, cardBonus, foodRate, foodUpgradeCost, unlockCost } from './data.ts';
import { defaultProfile, loadProfile } from './save.ts';
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
    const victory = this.profile.pendingVictory;
    if (victory) {
      this.state.phase = 'won';
      this.state.stats = battleStats(victory.stats);
      this.state.enemyHp = 0;
      this.state.playerHp = Math.min(this.state.playerMaxHp, victory.playerHp);
      this.state.earned = victory.earned;
      this.state.time = victory.seconds;
      this.state.wave = this.state.totalWaves;
      this.nextSpawn = this.schedule.length;
    }
  }

  private newBattle(): BattleState {
    this.events = [];
    this.encounter = encounterForAge(this.profile.enemyAge);
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
    return { stats: battleStats(), phase: 'ready', paused: false, time: 0, food: 6, playerHp, playerMaxHp: playerHp, enemyHp, enemyMaxHp: enemyHp, units: [], wave: 0, totalWaves: this.encounter.waves.length, earned: 0, freezeUntil: 0, skillsUsed: [] };
  }

  private baseHealth(): number { return Math.round(180 * 1.65 ** this.profile.age * (1 + this.profile.baseLevel * 0.4) * this.bonuses().base); }
  private refreshBaseHealth(): void {
    const nextMaxHp = this.baseHealth();
    this.state.playerHp = this.state.phase === 'lost' ? 0 : Math.max(0, Math.min(nextMaxHp, this.state.playerHp + nextMaxHp - this.state.playerMaxHp));
    this.state.playerMaxHp = nextMaxHp;
  }

  private timelinePower(): number { return 1 + (this.profile.timeline - 1) * 0.22; }
  private isActive(): boolean { return this.state.phase === 'running' && !this.state.paused; }
  private canPrepare(): boolean { return this.state.phase !== 'running' || this.state.paused; }

  dispatch(action: Action): boolean {
    switch (action.type) {
      case 'start':
        if (this.state.phase !== 'ready') return false;
        this.state.phase = 'running';
        return true;
      case 'pause':
        if (this.state.phase !== 'running') return false;
        this.state.paused = !this.state.paused;
        return true;
      case 'spawn':
        if (!this.deploymentStatus(action.kind).allowed) return false;
        if (!this.spawn('player', action.kind)) return false;
        this.state.food -= ERAS[this.profile.age].units[action.kind].cost;
        this.profile.deployed++;
        this.state.stats.deployed++;
        this.state.stats.foodSpent += ERAS[this.profile.age].units[action.kind].cost;
        this.state.stats.peakArmy = Math.max(this.state.stats.peakArmy, this.state.units.filter(unit => unit.side === 'player' && unit.hp > 0).length);
        return true;
      case 'skill': return this.skill(action.skill);
      case 'retry':
        if (this.state.phase !== 'lost' && this.state.phase !== 'won') return false;
        this.profile.pendingVictory = null;
        this.state = this.newBattle();
        return true;
      case 'next':
        if (this.state.phase !== 'won') return false;
        this.profile.pendingVictory = null;
        if (this.profile.enemyAge < 5) {
          this.profile.enemyAge++;
          this.profile.furthestBattle = Math.max(this.profile.furthestBattle, this.profile.enemyAge);
        }
        else {
          this.profile.timeline = Math.min(1000, this.profile.timeline + 1);
          this.profile.enemyAge = 0;
          this.profile.furthestBattle = 0;
          this.profile.coins = 0;
          this.profile.age = 0;
          this.profile.foodLevel = 0;
          this.profile.baseLevel = 0;
          this.profile.unlocked = [true, false, false];
          this.profile.gems = Math.min(1e7, this.profile.gems + 100);
        }
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
        this.profile.pendingVictory = null;
        this.profile.age++;
        this.profile.coins = 0;
        this.profile.enemyAge = 0;
        this.profile.furthestBattle = 0;
        this.profile.foodLevel = 0;
        this.profile.baseLevel = 0;
        this.profile.unlocked = [true, false, false];
        this.state = this.newBattle();
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
    const nextValue = stat === 'food' ? (0.8 + (level + 1) * 0.14) * this.bonuses().food : Math.round(180 * 1.65 ** this.profile.age * (1 + (level + 1) * 0.4) * this.bonuses().base);
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
    this.events.push({ type: 'spawn', x, lane, side });
    return true;
  }

  canUseSkill(skill: Skill): boolean {
    if (!this.isActive() || !['food', 'freeze', 'meteor'].includes(skill) || this.state.skillsUsed.includes(skill)) return false;
    if (skill === 'food' && this.state.food >= 99) return false;
    if (skill === 'meteor' && !this.state.units.some(unit => unit.side === 'enemy' && unit.hp > 0)) return false;
    return true;
  }

  private skill(skill: Skill): boolean {
    if (!this.canUseSkill(skill)) return false;
    const foodGain = Math.min(10, 99 - this.state.food);
    this.state.skillsUsed.push(skill);
    this.state.stats.skillsCast++;
    if (skill === 'food') this.state.food = Math.min(99, this.state.food + 10);
    if (skill === 'freeze') this.state.freezeUntil = this.state.time + 7;
    if (skill === 'meteor') {
      const damage = 36 * 1.65 ** this.profile.age * this.bonuses().damage;
      for (const unit of this.state.units) if (unit.side === 'enemy' && unit.hp > 0) this.hurt(unit, damage);
      this.state.units = this.state.units.filter(u => u.hp > 0);
    }
    this.events.push({ type: 'skill', skill, amount: skill === 'food' ? foodGain : undefined });
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
    if (this.checkEnd()) return;
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
          const damage = def.damage * power;
          const source = { id: unit.id, x: unit.x, lane: unit.lane, side: unit.side, age: unit.age, kind: unit.kind };
          const hit = (targetUnit: Unit, secondary = false) => {
            const resolved = resolveRoleHit(unit.kind, targetUnit.kind, damage, secondary);
            const actual = this.hurt(targetUnit, resolved.damage);
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
            this.events.push({ type: 'hit', x: baseX, lane: unit.lane, side: unit.side, amount: actual, source, target: 'base' });
          }
        }
      } else {
        let nextX = unit.x + def.speed * direction * dt;
        for (const friend of this.state.units) {
          if (friend.id === unit.id || friend.side !== unit.side || friend.lane !== unit.lane || friend.hp <= 0) continue;
          if ((friend.x - unit.x) * direction > 0) nextX = direction === 1 ? Math.min(nextX, friend.x - 22) : Math.max(nextX, friend.x + 22);
        }
        // Never retreat because two bodies were added at an identical position.
        unit.x = direction === 1 ? Math.max(unit.x, Math.min(910, nextX)) : Math.min(unit.x, Math.max(90, nextX));
      }
      if (this.checkEnd()) break;
    }
    this.state.units = this.state.units.filter(u => u.hp > 0);
  }

  private hurt(unit: Unit, damage: number): number {
    if (unit.hp <= 0) return 0;
    const actual = Math.min(unit.hp, damage);
    if (unit.side === 'enemy') this.state.stats.damageDealt += actual;
    else this.state.stats.damageTaken += actual;
    unit.hp = Math.max(0, unit.hp - actual);
    unit.hitFlash = 0.16;
    if (unit.hp === 0) {
      this.events.push({ type: 'death', x: unit.x, lane: unit.lane, side: unit.side });
      if (unit.side === 'enemy') {
        this.profile.kills++;
        this.state.stats.kills++;
        this.reward(Math.round((12 + unit.kind * 9) * (1 + unit.age * 0.5)), unit.x);
      }
    }
    return actual;
  }

  private hurtBase(attacker: Side, damage: number): number {
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

  private checkEnd(): boolean {
    if (this.state.phase !== 'running') return true;
    if (this.state.playerHp <= 0) {
      this.state.playerHp = 0;
      this.state.phase = 'lost';
      this.events.push({ type: 'lose' });
      return true;
    }
    if (this.state.enemyHp <= 0) {
      this.state.enemyHp = 0;
      this.state.phase = 'won';
      this.nextSpawn = this.schedule.length;
      this.profile.wins++;
      this.reward(120 * (1 + this.profile.enemyAge), 910);
      this.profile.gems = Math.min(1e7, this.profile.gems + 10);
      this.profile.pendingVictory = { stats: { ...this.state.stats }, timeline: this.profile.timeline, battle: this.profile.enemyAge, earned: this.state.earned, seconds: this.state.time, playerHp: this.state.playerHp };
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
