import { describe,expect,it } from "vitest";
import { createGame, drawEvent, isGameOver, prepareMonth, processMonth, scoreGame, toggleAction } from "./game";
describe("game engine",()=>{
 it("processes a month and preserves accounting equation",()=>{let s=prepareMonth(createGame("beginner",42));s=toggleAction(s,"ads");const n=processMonth(s);expect(n.history).toHaveLength(1);expect(n.financial.balance.cash).toBe(n.history[0].openingCash+n.financial.cashFlow.cashChange)});
 it("detects game over state",()=>{const s=createGame("advanced",1);expect(isGameOver({...s,gameOverReason:"test"})).toBe(true)});
 it("calculates bounded score",()=>{const score=scoreGame(createGame("beginner",1));expect(score.score).toBeGreaterThanOrEqual(0);expect(["S","A","B","C","D"]).toContain(score.rank)});
 it("same seed produces same event sequence",()=>{const a=createGame("advanced",1234),b=createGame("advanced",1234);expect(drawEvent(a)).toEqual(drawEvent(b))});
});
