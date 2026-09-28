import { ERAS, CARD_DEFS, QUESTS, baseUpgradeCost, cardBonus, foodRate, foodUpgradeCost, unlockCost } from './data.ts';
import { defaultProfile, loadProfile } from './save.ts';
import type { Action, BattleState, GameEvent, GamePort, Profile, Side, Skill, Unit, UnitKind } from './types.ts';

const FIXED_STEP = 1 / 60;
const WAVES: { time: number; kinds: UnitKind[] }[] = [
  { time: 3, kinds: [0] },
  { time: 12, kinds: [0, 0] },
  { time: 22, kinds: [0, 1] },
  { time: 33, kinds: [0, 0, 1] },
  { time: 44, kinds: [0, 2] },
];

export class Game implements GamePort {
  profile: Profile;
  state: BattleState;
  private events: GameEvent[] = [];
  private nextId = 1;
  private playerLane = 0;
  private enemyLane = 0;
  private accumulator = 0;
  private damageEarnings = 0;

  constructor(profile: Profile = defaultProfile()) {
    this.profile = loadProfile({ getItem: () => JSON.stringify(profile) });
    this.state = this.newBattle();
  }

  private newBattle(): BattleState {
    const playerHp = this.baseHealth();
    const enemyHp = Math.round(160 * 1.65 ** this.profile.enemyAge * this.timelinePower());
    this.accumulator = 0;
    this.damageEarnings = 0;
    this.playerLane = 0;
    this.enemyLane = 0;
    return { phase: 'ready', paused: false, time: 0, food: 6, playerHp, playerMaxHp: playerHp, enemyHp, enemyMaxHp: enemyHp, units: [], wave: 0, totalWaves: WAVES.length, earned: 0, freezeUntil: 0, skillsUsed: [] };
  }

  private baseHealth(): number { return Math.round(180 * 1.65 ** this.profile.age * (1 + this.profile.baseLevel * 0.4)); }
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
        if (!this.isActive() || ![0, 1, 2].includes(action.kind) || !this.profile.unlocked[action.kind]) return false;
        if (this.state.food < ERAS[this.profile.age].units[action.kind].cost) return false;
        if (!this.spawn('player', action.kind)) return false;
        this.state.food -= ERAS[this.profile.age].units[action.kind].cost;
        this.profile.deployed++;
        return true;
      case 'skill': return this.skill(action.skill);
      case 'retry':
        if (this.state.phase !== 'lost' && this.state.phase !== 'won') return false;
        this.state = this.newBattle();
        return true;
      case 'next':
        if (this.state.phase !== 'won') return false;
        if (this.profile.enemyAge < 5) this.profile.enemyAge++;
        else {
          this.profile.timeline = Math.min(1000, this.profile.timeline + 1);
          this.profile.enemyAge = 0;
          this.profile.age = 0;
          this.profile.foodLevel = 0;
          this.profile.baseLevel = 0;
          this.profile.unlocked = [true, false, false];
          this.profile.gems += 100;
        }
        this.state = this.newBattle();
        return true;
      case 'unlock':
        if (![1, 2].includes(action.kind) || this.profile.unlocked[action.kind] || !this.spend(unlockCost(action.kind))) return false;
        this.profile.unlocked[action.kind] = true;
        this.events.push({ type: 'upgrade' });
        return true;
      case 'upgrade': {
        if (action.stat === 'food') {
          if (this.profile.foodLevel >= 100 || !this.spend(foodUpgradeCost(this.profile))) return false;
          this.profile.foodLevel++;
        } else if (action.stat === 'base') {
          if (this.profile.baseLevel >= 100 || !this.spend(baseUpgradeCost(this.profile))) return false;
          this.profile.baseLevel++;
          const nextMaxHp = this.baseHealth();
          this.state.playerHp += nextMaxHp - this.state.playerMaxHp;
          this.state.playerMaxHp = nextMaxHp;
        } else return false;
        this.events.push({ type: 'upgrade' });
        return true;
      }
      case 'evolve':
        if (this.state.phase === 'running' || this.profile.age >= 5 || this.profile.age > this.profile.enemyAge || !this.spend(ERAS[this.profile.age].evolveCost)) return false;
        this.profile.age++;
        this.profile.foodLevel = 0;
        this.profile.baseLevel = 0;
        this.profile.unlocked = [true, false, false];
        this.state = this.newBattle();
        this.events.push({ type: 'evolve' });
        return true;
      case 'summon': {
        if (!this.canPrepare() || this.profile.gems < 100) return false;
        const total = this.profile.cards.reduce((sum, n) => sum + n, 0);
        // A fixed shuffle is reproducible in saves and tests without random state.
        const index = [0, 1, 3, 2, 5, 4][total % CARD_DEFS.length];
        if (this.profile.cards[index] >= 1000) return false;
        this.profile.gems -= 100;
        this.profile.cards[index]++;
        this.events.push({ type: 'upgrade', amount: index });
        return true;
      }
      case 'claim': {
        const quest = QUESTS.find(q => q.id === action.id);
        if (!quest || this.profile.claimed.includes(quest.id) || this.profile[quest.stat] < quest.target) return false;
        this.profile.claimed.push(quest.id);
        this.profile.gems += quest.reward;
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

  private spawn(side: Side, kind: UnitKind): boolean {
    if (this.state.units.filter(u => u.side === side).length >= 60) return false;
    const age = side === 'player' ? this.profile.age : this.profile.enemyAge;
    const def = ERAS[age].units[kind];
    const nextLane = side === 'player' ? this.playerLane : this.enemyLane;
    let lane = nextLane % 3;
    let x = side === 'player' ? 140 : 860;
    // Put waiting troops behind the last body, keeping deployment stacks readable.
    for (let attempt = 0; attempt < 3; attempt++) {
      lane = (nextLane + attempt) % 3;
      const sameLane = this.state.units.filter(u => u.side === side && u.lane === lane && u.hp > 0);
      x = side === 'player' ? Math.min(140, ...sameLane.map(u => u.x - 24)) : Math.max(860, ...sameLane.map(u => u.x + 24));
      if (side === 'enemy' || x >= 92) break;
    }
    if (side === 'player' && x < 92) return false;
    if (side === 'player') this.playerLane = lane + 1;
    else this.enemyLane = lane + 1;
    const healthBonus = side === 'player' ? cardBonus(this.profile).health : this.timelinePower() * 0.94;
    const hp = Math.round(def.hp * healthBonus);
    this.state.units.push({ id: this.nextId++, side, kind, age, x, lane, hp, maxHp: hp, attackTimer: 0, attacking: false, hitFlash: 0 });
    this.events.push({ type: 'spawn', x, lane, side });
    return true;
  }

  private skill(skill: Skill): boolean {
    if (!this.isActive() || !['food', 'freeze', 'meteor'].includes(skill) || this.state.skillsUsed.includes(skill)) return false;
    this.state.skillsUsed.push(skill);
    if (skill === 'food') this.state.food = Math.min(99, this.state.food + 10);
    if (skill === 'freeze') this.state.freezeUntil = this.state.time + 7;
    if (skill === 'meteor') {
      const damage = 36 * 1.65 ** this.profile.age * cardBonus(this.profile).damage;
      for (const unit of this.state.units) if (unit.side === 'enemy' && unit.hp > 0) this.hurt(unit, damage);
      this.state.units = this.state.units.filter(u => u.hp > 0);
    }
    this.events.push({ type: 'skill', skill });
    return true;
  }

  step(dt: number): void {
    if (!this.isActive() || !Number.isFinite(dt) || dt <= 0) return;
    // Bound a stalled frame rather than fast-forwarding combat after tab suspension.
    this.accumulator += Math.min(dt, 0.25);
    while (this.accumulator + 1e-9 >= FIXED_STEP && this.isActive()) {
      this.accumulator -= FIXED_STEP;
      this.tick(FIXED_STEP);
    }
  }

  private tick(dt: number): void {
    this.state.time += dt;
    this.state.food = Math.min(99, this.state.food + foodRate(this.profile) * dt);
    this.state.units = this.state.units.filter(u => u.hp > 0);
    if (this.checkEnd()) return;
    const wave = WAVES[this.state.wave];
    if (wave && this.state.time >= wave.time) {
      for (const kind of wave.kinds) this.spawn('enemy', kind);
      this.state.wave++;
    }

    // Front bodies move first so the spacing check sees their new positions.
    const actors = [...this.state.units].sort((a, b) => a.side === b.side ? (a.side === 'player' ? b.x - a.x : a.x - b.x) : a.id - b.id);
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
      const target = targets.sort((a, b) => distance(a) - distance(b))[0];
      const baseX = unit.side === 'player' ? 910 : 90;
      const targetInRange = target && distance(target) <= def.range;
      const baseInRange = Math.abs(baseX - unit.x) <= def.range;
      if (targetInRange || baseInRange) {
        unit.attacking = true;
        if (unit.attackTimer <= 0) {
          unit.attackTimer = def.interval;
          const power = unit.side === 'player' ? cardBonus(this.profile).damage : this.timelinePower() * 0.94;
          const damage = def.damage * power;
          if (targetInRange) this.hurt(target, damage);
          else this.hurtBase(unit.side, damage);
          this.events.push({ type: 'hit', x: targetInRange ? target.x : baseX, lane: targetInRange ? target.lane : unit.lane, side: unit.side, amount: damage });
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

  private hurt(unit: Unit, damage: number): void {
    if (unit.hp <= 0) return;
    unit.hp = Math.max(0, unit.hp - damage);
    unit.hitFlash = 0.16;
    if (unit.hp === 0) {
      this.events.push({ type: 'death', x: unit.x, lane: unit.lane, side: unit.side });
      if (unit.side === 'enemy') {
        this.profile.kills++;
        this.reward(Math.round((12 + unit.kind * 9) * (1 + unit.age * 0.5)), unit.x);
      }
    }
  }

  private hurtBase(attacker: Side, damage: number): void {
    if (attacker === 'player') {
      const actual = Math.min(this.state.enemyHp, damage);
      this.state.enemyHp = Math.max(0, this.state.enemyHp - actual);
      this.damageEarnings += actual * 0.3;
      const coins = Math.floor(this.damageEarnings);
      this.damageEarnings -= coins;
      if (coins) this.reward(coins, 910);
    } else this.state.playerHp = Math.max(0, this.state.playerHp - damage);
  }

  private reward(coins: number, x?: number): void {
    this.profile.coins = Math.min(1e9, this.profile.coins + coins);
    this.state.earned += coins;
    this.events.push({ type: 'coin', x, amount: coins });
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
      this.profile.wins++;
      this.reward(120 * (1 + this.profile.enemyAge), 910);
      this.profile.gems += 10;
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
