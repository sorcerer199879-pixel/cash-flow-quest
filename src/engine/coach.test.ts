import { describe,expect,it } from "vitest";
import { createGame,processMonth,toggleAction } from "./game";
import { analyzePlay } from "./coach";

describe("end-game coaching",()=>{
 it("detects a sales-led play style from decision history",()=>{
  let game=createGame("beginner",1);
  game=toggleAction(game,"ads");
  game=processMonth(game);
  expect(analyzePlay(game).styleName).toBe("売上先行のチャレンジャー");
 });
 it("always returns actionable reflection sections",()=>{
  const report=analyzePlay(createGame("beginner",1));
  expect(report.tendencies.length).toBeGreaterThan(0);
  expect(report.goodChoices.length).toBeGreaterThan(0);
  expect(report.weakChoices.length).toBeGreaterThan(0);
  expect(report.nextStrategies.length).toBeGreaterThan(0);
 });
});

