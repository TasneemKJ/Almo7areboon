export type UnitKind = 0 | 1 | 2;
export type Side = 'player' | 'enemy';
export type Phase = 'ready' | 'running' | 'won' | 'lost';
export type Skill = 'freeze' | 'meteor' | 'food';
export interface UnitDef { name: string; role: string; cost: number; hp: number; damage: number; speed: number; range: number; interval: number; }
export interface Era { name: string; year: string; color: string; ground: string; units: [UnitDef,UnitDef,UnitDef]; evolveCost: number; }
export interface Profile { version: 1; timeline: number; age: number; enemyAge: number; coins: number; gems: number; foodLevel: number; baseLevel: number; unlocked: [boolean,boolean,boolean]; cards: number[]; kills: number; wins: number; deployed: number; claimed: string[]; sound: boolean; }
export interface Unit { id: number; side: Side; kind: UnitKind; age: number; x: number; lane: number; hp: number; maxHp: number; attackTimer: number; attacking: boolean; hitFlash: number; }
export interface BattleState { phase: Phase; paused: boolean; time: number; food: number; playerHp: number; playerMaxHp: number; enemyHp: number; enemyMaxHp: number; units: Unit[]; wave: number; totalWaves: number; earned: number; freezeUntil: number; skillsUsed: Skill[]; }
export interface GameEvent { type: 'spawn'|'hit'|'death'|'coin'|'win'|'lose'|'skill'|'upgrade'|'evolve'; x?: number; lane?: number; side?: Side; amount?: number; skill?: Skill; }
export type Action = {type:'start'|'retry'|'next'|'evolve'|'summon'|'pause'} | {type:'spawn'|'unlock';kind:UnitKind} | {type:'upgrade';stat:'food'|'base'} | {type:'skill';skill:Skill} | {type:'claim';id:string};
export interface GamePort { profile: Profile; state: BattleState; dispatch(action: Action): boolean; step(dt: number): void; drainEvents(): GameEvent[]; }
