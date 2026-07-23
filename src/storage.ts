import type { GameState, SaveData } from "./types";
const KEY="cash-flow-quest-save-v1", BEST="cash-flow-quest-best-v1";
export function saveGame(state:GameState){const data:SaveData={version:1,savedAt:new Date().toISOString(),state};localStorage.setItem(KEY,JSON.stringify(data));}
export function loadGame():GameState|null{try{const raw=localStorage.getItem(KEY);if(!raw)return null;const d=JSON.parse(raw) as SaveData;if(d.version!==1||!d.state||typeof d.state.month!=="number"||!d.state.financial?.balance)return null;return d.state;}catch{return null;}}
export function deleteSave(){localStorage.removeItem(KEY);}
export function hasSave(){return Boolean(localStorage.getItem(KEY));}
export function saveBest(score:number){const old=Number(localStorage.getItem(BEST)||0);if(score>old)localStorage.setItem(BEST,String(score));}
export function getBest(){return Number(localStorage.getItem(BEST)||0);}
