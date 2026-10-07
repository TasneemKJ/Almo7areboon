import type Phaser from 'phaser';
import type {arenaLayout} from './visual-theme.ts';
import type {BattlefieldMemoryInput} from './battlefield-memory.ts';
import type {Unit,Side} from '../game/types';

/** Shared shapes and tiny helpers for the battlefield collaborators. */
export type Layout=ReturnType<typeof arenaLayout>;
export type ImageOrFallback=Phaser.GameObjects.Image|Phaser.GameObjects.Graphics;
export type TroopView={body:ImageOrFallback;x:number;y:number;lane:number;side:Side;dustAt:number};
export type Spark={x:number;y:number;vx:number;vy:number;life:number;max:number;size:number;color:number;dust:boolean;lane?:number};
export type Bolt={from:{x:number;y:number};to:{x:number;y:number};life:number;max:number;arc:number;age:number;kind:Unit['kind'];side:Side;heavy:boolean;damage:number;meteor?:boolean;memory?:BattlefieldMemoryInput;targetBase?:boolean;targetSide?:Side;targetAge?:number};
export type Ring={x:number;y:number;life:number;max:number;radius:number;color:number};
export type Floater={text:Phaser.GameObjects.Text;life:number;max:number;startY:number;banner:boolean;reward?:number};
export type AttackCue={x:number;y:number;lane:number;age:number;kind:Unit['kind'];side:Side;life:number;max:number};
export type ImpactCue={x:number;y:number;age:number;kind:Unit['kind'];side:Side;life:number;max:number;trait?:'guard'|'pierce'|'sweep';lane?:number};
export type Flare={x:number;y:number;life:number;max:number;radius:number;color:number};
export type ReviewSnapshot={image:HTMLImageElement|null;resultOpen:boolean;aftermath:unknown;villageVerdict:unknown};
export const xAt=(x:number)=>x*.45;
/** View-only: nudges bodies sharing a lane by a few pixels so crowded columns read as individuals, not one stacked sprite. */
export const noise=(n:number)=>{const value=Math.sin(n*117.13)*43758.5453;return value-Math.floor(value);};
export const tint=(hex:string)=>parseInt(hex.slice(1),16);
export const stillReaction={x:0,y:0,angle:0} as const;
