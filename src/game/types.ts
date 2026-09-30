import type { CombatTrait } from './role-traits.ts';
export type UnitKind = 0 | 1 | 2;
export type Side = 'player' | 'enemy';
export type Phase = 'ready' | 'running' | 'won' | 'lost';
export type Skill = 'freeze' | 'meteor' | 'food';
export interface UnitDef { name: string; role: string; cost: number; hp: number; damage: number; speed: number; range: number; interval: number; }
export interface Era { name: string; year: string; color: string; ground: string; units: [UnitDef,UnitDef,UnitDef]; evolveCost: number; }
export interface BattleStats { deployed: number; kills: number; foodSpent: number; peakArmy: number; damageDealt: number; damageTaken: number; skillsCast: number; gateDamageTaken: number; deployedByKind: [number,number,number]; maxFreezeTargets: number; meteorKills: number; }
export interface ChapterMasteryRecord { earnedMask: number; bestSeconds: number | null; bestGateDamage: number | null; }
export interface MasteryProgress { timeline: number; chapters: [ChapterMasteryRecord,ChapterMasteryRecord,ChapterMasteryRecord,ChapterMasteryRecord,ChapterMasteryRecord,ChapterMasteryRecord]; }
export type VictorySettlement = { settlement: 'legacy' } | { settlement: 'mastery-v1'; eligibleMask: number; newMask: number; masteryCoins: number; masteryGems: number };
export type PendingVictory = { stats?: BattleStats; timeline: number; battle: number; earned: number; seconds: number; playerHp: number } & VictorySettlement;
export interface Profile { version: 3; mastery: MasteryProgress; timeline: number; age: number; enemyAge: number; furthestBattle: number; coins: number; gems: number; foodLevel: number; baseLevel: number; unlocked: [boolean,boolean,boolean]; cards: number[]; summonCount: number; summonSeed: number; pendingVictory: PendingVictory | null; kills: number; wins: number; deployed: number; claimed: string[]; dailyDay: number; dailyStreak: number; sound: boolean; speed: 1 | 2; motion: 'system' | 'reduced'; }
export interface Unit { id: number; side: Side; kind: UnitKind; age: number; x: number; lane: number; hp: number; maxHp: number; attackTimer: number; attacking: boolean; hitFlash: number; }
export interface BattleState { stats: BattleStats; phase: Phase; paused: boolean; time: number; food: number; playerHp: number; playerMaxHp: number; enemyHp: number; enemyMaxHp: number; units: Unit[]; wave: number; totalWaves: number; earned: number; freezeUntil: number; skillsUsed: Skill[]; }
export interface GameEvent { trait?: CombatTrait; source?: Pick<Unit, 'id'|'x'|'lane'|'side'|'age'|'kind'>; target?: 'unit'|'base'; type: 'spawn'|'hit'|'death'|'coin'|'win'|'lose'|'skill'|'upgrade'|'evolve'; x?: number; lane?: number; side?: Side; amount?: number; skill?: Skill; cardIndices?: number[]; }
export type Action = {type:'start'|'retry'|'next'|'evolve'|'pause'|'retreat'} | {type:'spawn'|'unlock';kind:UnitKind} | {type:'upgrade';stat:'food'|'base'} | {type:'skill';skill:Skill} | {type:'claim';id:string} | {type:'daily';day:number} | {type:'select-battle';battle:number} | {type:'summon';count?:1|10|50};
export interface DeploymentStatus { allowed: boolean; reason: 'available'|'invalid'|'locked'|'ready'|'paused'|'food'|'capacity'|'blocked'; missingFood: number; waitSeconds: number; }
export interface GamePort { profile: Profile; state: BattleState; dispatch(action: Action): boolean; step(dt: number): void; drainEvents(): GameEvent[]; }
