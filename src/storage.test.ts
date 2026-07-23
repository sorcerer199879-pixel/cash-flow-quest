import { beforeEach,describe,expect,it,vi } from "vitest";
import { createGame } from "./engine/game";
import { loadGame,saveGame } from "./storage";
const data=new Map<string,string>();
beforeEach(()=>{data.clear();vi.stubGlobal("localStorage",{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)});});
describe("save data",()=>{it("round trips a game",()=>{const s=createGame("standard",99);saveGame(s);expect(loadGame()).toEqual(s)});it("rejects corrupt data",()=>{data.set("cash-flow-quest-save-v1","{bad");expect(loadGame()).toBeNull()});});
