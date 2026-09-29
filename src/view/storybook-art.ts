/** Authored chapters share raster assets across both teams; mirroring and halos identify sides. */
const chapters = [
 {folder:'/art/storybook',roles:['pathkeeper','thrower','rider'],frameWidth:256},
 {folder:'/art/storybook/olive',roles:['fieldhand','slinger','harvester'],frameWidth:224},
 {folder:'/art/storybook/harbor',roles:['quay-guard','archer','quay-rider'],frameWidth:224},
] as const;
export function storybookArt(age:number){
 return Number.isInteger(age)&&age>=0&&age<chapters.length?chapters[age]:undefined;
}
