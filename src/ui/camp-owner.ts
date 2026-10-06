import type {Action,BattleState,Profile,UnitKind} from '../game/types.ts';
export type CampStation='storehouse'|'gate'|'company'|'journal';
export type CampFocus=CampStation|{readonly recruit:UnitKind};
export type CampOwner={kind:'root'}|{kind:'focus';focus:CampFocus;returnTarget:CampStation}|{kind:'advanced';returnTarget:CampStation};
/** Presentation admission is deliberately narrower than canonical transactions. */
export function canOwnCamp(profile:Readonly<Profile>,state:Readonly<BattleState>):boolean {
 return state.phase==='ready'&&!profile.pendingVictory;
}
export function isCampStation(value:string|undefined):value is CampStation {
 return value!==undefined&&['storehouse','gate','company','journal'].includes(value);
}
/** A hidden legacy control cannot borrow a focused station's authority. */
export function campActionFromData(focus:CampFocus,data:Record<string,string|undefined>):Action|null {
 if(focus==='storehouse'&&data.campAction==='food')return {type:'upgrade',stat:'food'};
 if(focus==='gate'&&data.campAction==='base')return {type:'upgrade',stat:'base'};
 if(typeof focus==='object'&&[1,2].includes(focus.recruit)&&data.campAction==='unlock')return {type:'unlock',kind:focus.recruit};
 if(focus==='storehouse'&&(data.campPreparation==='bread'||data.campPreparation==='none'))return {type:'chronicle-preparation',preparation:data.campPreparation};
 if(focus==='gate'&&(data.campPreparation==='repair'||data.campPreparation==='none'))return {type:'chronicle-preparation',preparation:data.campPreparation};
 return null;
}
