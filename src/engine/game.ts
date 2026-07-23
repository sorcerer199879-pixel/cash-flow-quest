import { ACTION_POINTS, ACTIONS, DIFFICULTIES, EVENTS, MAN } from "../config";
import type { ActionEffect, Difficulty, GameEvent, GameScore, GameState, MonthlyResult } from "../types";
import { calculateMonth, emptyCashFlow, emptyIncome } from "./finance";
import { nextRandom } from "./rng";

export function createGame(difficulty: Difficulty, seed: number): GameState {
  const d = DIFFICULTIES[difficulty];
  const debt = d.initialDebt;
  const assets = d.initialCash + 90*MAN + 45*MAN;
  return {version:1,screen:"game",difficulty,seed,rngState:seed||1,month:1,duration:d.duration,actionPoints:ACTION_POINTS,selectedActionIds:[],
    financial:{income:emptyIncome(),cashFlow:emptyCashFlow(),balance:{cash:d.initialCash,receivables:0,inventory:45*MAN,equipment:90*MAN,otherAssets:0,payables:0,shortDebt:0,longDebt:debt,equity:assets-debt},baseRevenue:180*MAN,growthRate:.012,variableCostRate:.43,monthlyFixedCosts:68*MAN,interestRate:.035,receivableMonths:d.receivableMonths,payableMonths:1},
    creditScore:72,activeEffects:[],history:[],decisionHistory:[],cumulativeRevenue:0,cumulativeProfit:0,cumulativeOperatingCF:0,cumulativeFreeCF:0,peakCashShortfall:0,insolventMonths:0};
}

export function drawEvent(state: GameState): {event?: GameEvent;rngState:number} {
  let [roll, rngState] = nextRandom(state.rngState);
  const d = DIFFICULTIES[state.difficulty];
  if (roll > d.eventChance) return {rngState};
  const eligible = EVENTS.filter(e => (!e.minMonth || state.month>=e.minMonth) && (!e.advancedOnly || state.difficulty==="advanced"));
  [roll, rngState] = nextRandom(rngState);
  const total = eligible.reduce((n,e)=>n+e.probability,0);
  let cursor=roll*total;
  return {event:eligible.find(e=>(cursor-=e.probability)<=0) ?? eligible[0],rngState};
}

export function prepareMonth(state: GameState): GameState {
  if (state.currentEvent) return state;
  const {event,rngState}=drawEvent(state);
  return {...state,currentEvent:event,rngState};
}

export function toggleAction(state: GameState, id: string): GameState {
  const action=ACTIONS.find(x=>x.id===id); if(!action) return state;
  const selected=state.selectedActionIds.includes(id);
  if(selected) return {...state,selectedActionIds:state.selectedActionIds.filter(x=>x!==id),actionPoints:state.actionPoints+action.ap};
  if(action.ap>state.actionPoints) return state;
  return {...state,selectedActionIds:[...state.selectedActionIds,id],actionPoints:state.actionPoints-action.ap};
}

export function processMonth(state: GameState): GameState {
  const actions=ACTIONS.filter(a=>state.selectedActionIds.includes(a.id));
  const active=state.activeEffects.filter(e=>e.remaining>0);
  const severity=DIFFICULTIES[state.difficulty].eventSeverity;
  const eventEffect: ActionEffect | undefined = state.currentEvent ? Object.fromEntries(Object.entries(state.currentEvent.effect).map(([k,v])=>[k,typeof v==="number"?v*severity:v])) : undefined;
  if(state.currentEvent?.id==="rate-hike") state={...state,financial:{...state.financial,interestRate:state.financial.interestRate+.025}};
  const effects=[...active.map(e=>e.effect),...actions.map(a=>a.effect),...(eventEffect?[eventEffect]:[])];
  const openingCash=state.financial.balance.cash;
  const directCosts=actions.reduce((n,a)=>n+a.cashCost,0);
  const financial=calculateMonth(state.financial,effects,directCosts);
  const debt=financial.balance.shortDebt+financial.balance.longDebt;
  let credit=Math.max(0,Math.min(100,state.creditScore+effects.reduce((n,e)=>n+(e.creditChange??0),0)+(financial.cashFlow.operatingCF>=0?1:-2)));
  const insolvent=financial.balance.equity<0?state.insolventMonths+1:0;
  let gameOverReason:string|undefined;
  if(financial.balance.cash<0 && credit<45) gameOverReason="現金が不足し、追加調達できる信用力もありません。";
  else if(insolvent>=3) gameOverReason="債務超過が3か月継続しました。";
  else if(credit<25) gameOverReason="信用スコアが危険水準を下回りました。";
  else if(financial.cashFlow.repayment>openingCash+Math.max(0,financial.cashFlow.operatingCF)+financial.cashFlow.borrowing) gameOverReason="借入返済を実行できませんでした。";
  const cf=financial.cashFlow;
  const difference=cf.cashChange-financial.income.netIncome;
  const reasons:string[]=[];
  if(cf.receivablesChange>0) reasons.push("売掛金の増加で現金化が遅れた");
  if(cf.inventoryChange>0) reasons.push("在庫の増加が現金を拘束した");
  if(cf.payablesChange>0) reasons.push("買掛金の増加が支払いを先送りした");
  if(cf.capex>0) reasons.push("設備投資に現金を使った");
  if(cf.borrowing>0) reasons.push("借入で現金を調達した");
  const lesson=`${financial.income.netIncome>=0?"黒字":"赤字"}で、現金は${cf.cashChange>=0?"増加":"減少"}。利益との差は${formatSigned(difference)}です。${reasons.join("、")||"利益と現金の動きは概ね一致しました"}。`;
  const result:MonthlyResult={month:state.month,openingCash,income:financial.income,balance:financial.balance,cashFlow:cf,selectedActions:actions.map(a=>a.name),event:state.currentEvent,lesson,
    goodDecision:financial.balance.cash>financial.monthlyFixedCosts*2?"2か月超の固定費を賄える現金余力を維持しました。":cf.operatingCF>0?"本業から現金を生みました。":"厳しい月にも意思決定を行いました。",
    improvement:financial.balance.cash<financial.monthlyFixedCosts?"手元流動性を優先し、投資規模や回収条件を見直しましょう。":financial.balance.inventory>financial.income.cogs*1.5?"在庫が厚めです。現金化を検討しましょう。":"成長と安全余裕のバランスを継続しましょう。"};
  const newEffects=[...active.map(e=>({...e,remaining:e.remaining-1})).filter(e=>e.remaining>0),...actions.filter(a=>a.duration>1).map(a=>({source:a.name,remaining:a.duration-1,effect:a.effect})),...(state.currentEvent&&state.currentEvent.duration>1?[{source:state.currentEvent.title,remaining:state.currentEvent.duration-1,effect:eventEffect??{}}]:[])];
  const last=state.month>=state.duration;
  return {...state,screen:gameOverReason||last?"final":"result",financial,creditScore:credit,insolventMonths:insolvent,activeEffects:newEffects,history:[...state.history,result],decisionHistory:[...state.decisionHistory,`${state.month}月: ${actions.map(a=>a.name).join("・")||"温存"}`],
    cumulativeRevenue:state.cumulativeRevenue+financial.income.revenue,cumulativeProfit:state.cumulativeProfit+financial.income.netIncome,cumulativeOperatingCF:state.cumulativeOperatingCF+cf.operatingCF,cumulativeFreeCF:state.cumulativeFreeCF+cf.freeCF,peakCashShortfall:Math.min(state.peakCashShortfall,financial.balance.cash),gameOverReason};
}
export function nextMonth(state:GameState):GameState { return prepareMonth({...state,screen:"game",month:state.month+1,actionPoints:ACTION_POINTS,selectedActionIds:[],currentEvent:undefined}); }
export function isGameOver(s:GameState){return Boolean(s.gameOverReason);}
export function scoreGame(s:GameState):GameScore {
  const b=s.financial.balance,total=Math.max(1,b.cash+b.receivables+b.inventory+b.equipment+b.otherAssets);
  const equityRatio=b.equity/total,cashToSales=b.cash/Math.max(1,s.financial.income.revenue);
  const cfs=s.history.map(h=>h.cashFlow.operatingCF),mean=cfs.reduce((a,x)=>a+x,0)/Math.max(1,cfs.length);
  const variance=cfs.reduce((a,x)=>a+(x-mean)**2,0)/Math.max(1,cfs.length);
  const stability=Math.max(0,100-Math.sqrt(variance)/Math.max(MAN,Math.abs(mean)+20*MAN)*30);
  const growth=s.financial.baseRevenue/(180*MAN)-1;
  const liquidity=Math.min(25,Math.max(0,cashToSales*18)),safety=Math.min(25,Math.max(0,equityRatio*45)),grow=Math.min(25,Math.max(0,(growth+.1)*45)),cashQuality=Math.min(25,Math.max(0,stability*.25));
  const score=Math.round(liquidity+safety+grow+cashQuality-(s.gameOverReason?25:0));
  const rank=score>=88?"S":score>=74?"A":score>=58?"B":score>=42?"C":"D";
  const type=growth>.35&&cashToSales<.7?"攻めの成長型":equityRatio>.55&&cashToSales>1.5?"堅実な金庫番":stability>75?"安定CF設計者":"転機を探す挑戦者";
  return {rank,score,equityRatio,cashToSales,growth,stability,risk:s.gameOverReason?"高":equityRatio<.2||cashToSales<.5?"中":"低",type};
}
function formatSigned(v:number){return `${v>=0?"+":""}${Math.round(v/MAN)}万円`;}
