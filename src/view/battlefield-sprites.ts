import {storybookArt} from './storybook-art.ts';
import {baseTexture,unitTexture} from './visual-assets.ts';
import {drawBase} from './art';
import type Phaser from 'phaser';
import type {Side,Unit} from '../game/types';
import type {ImageOrFallback} from './battlefield-types.ts';

/** A troop sprite for an era and role: the painted sheet when loaded, else an empty vector canvas. */
export function createTroopSprite(scene:Phaser.Scene,age:number,kind:Unit['kind'],side:Side):ImageOrFallback {
  const key=unitTexture(age,kind,side);
  if(scene.textures.exists(key))return scene.add.image(0,0,key,'0').setOrigin(.5,136/144);
  return scene.add.graphics();
}

/** A base building sprite, mirrored for the enemy of a storybook era; vector art when the texture is missing. */
export function createBaseSprite(scene:Phaser.Scene,age:number,side:Side):ImageOrFallback {
  const key=baseTexture(age,side);
  if(scene.textures.exists(key)){
    const image=scene.add.image(0,0,key).setOrigin(.5,140/160);
    return image.setScale(.62*160/image.width).setFlipX(!!storybookArt(age)&&side==='enemy');
  }
  const graphic=scene.add.graphics();drawBase(graphic,age,side);return graphic;
}
