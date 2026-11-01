import {normalizeDesign} from './character-designs.js';
const KEY='swipe-city-design';
export function readDesignSelection(host=globalThis){try{return normalizeDesign(host.sessionStorage?.getItem(KEY)??host.localStorage?.getItem(KEY));}catch{return 'white_male';}}
export function saveDesignSelection(id,host=globalThis){const selected=normalizeDesign(id);try{host.sessionStorage?.setItem(KEY,selected);}catch{}try{host.localStorage?.setItem(KEY,selected);}catch{}return selected;}
