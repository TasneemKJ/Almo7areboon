/** Original fictional phrases; no sampled performance or historical instrument claim. */
export interface ScoreNote {readonly at:number;readonly semitones:number;readonly decay:number}
export interface ChapterScore {
 readonly root:number;readonly air:number;readonly water:number;readonly pluck:number;readonly breath:number;readonly seed:number;
 readonly plucks:readonly ScoreNote[];readonly answers:readonly ScoreNote[];
}
const notes=(decay:number,positions:readonly (readonly [number,number])[]):readonly ScoreNote[]=>positions.map(([at,semitones])=>({at,semitones,decay}));
export const CHAPTER_SCORES:readonly ChapterScore[]=[
 {root:146.83,air:.012,water:0,pluck:.073,breath:.011,seed:319,plucks:notes(2.4,[[1.2,0],[3.2,3],[5.2,2],[14,0]]),answers:notes(3,[[18.5,12]])},
 {root:130.81,air:.011,water:.003,pluck:.069,breath:.014,seed:887,plucks:notes(2.4,[[1,0],[1.8,3],[6.4,2],[13,7],[13.8,5]]),answers:notes(3,[[19,12]])},
 {root:146.83,air:.019,water:.019,pluck:.055,breath:.010,seed:1319,plucks:notes(1.9,[[1.2,0],[4,3],[6.2,2],[15,-12]]),answers:notes(3,[[19.5,7]])},
 {root:130.81,air:.007,water:.002,pluck:.085,breath:.016,seed:2039,plucks:notes(2.8,[[1,0],[2.1,3],[5,2],[13,7],[14.4,5]]),answers:notes(2.4,[[19,12]])},
 {root:110,air:.016,water:0,pluck:.059,breath:.009,seed:3251,plucks:notes(2.4,[[1.2,-12],[4.2,-9],[7.2,-10]]),answers:notes(3,[[18,0]])},
 {root:146.83,air:.009,water:.004,pluck:.061,breath:.023,seed:4441,plucks:notes(1.7,[[1,0],[3,3],[5.2,2],[13,7],[16,5]]),answers:notes(3,[[20.5,12]])},
];
