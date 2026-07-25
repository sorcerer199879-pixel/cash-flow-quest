import { ACTIONS } from "../config";
import type { ActionCategory, GameState } from "../types";

export interface CoachingReport {
  styleName: string;
  styleSummary: string;
  tendencies: string[];
  goodChoices: string[];
  weakChoices: string[];
  nextStrategies: string[];
}

const categoryLabels: Record<ActionCategory,string> = {
  sales:"売上づくり", cost:"コスト管理", workingCapital:"資金繰り",
  investment:"将来への投資", finance:"資金調達"
};

export function analyzePlay(game: GameState): CoachingReport {
  const counts = Object.fromEntries(Object.keys(categoryLabels).map(key=>[key,0])) as Record<ActionCategory,number>;
  const actionCounts = new Map<string,number>();
  for(const result of game.history){
    for(const name of result.selectedActions){
      const action=ACTIONS.find(item=>item.name===name);
      if(action){
        counts[action.category]++;
        actionCounts.set(action.id,(actionCounts.get(action.id)??0)+1);
      }
    }
  }
  const totalActions=Object.values(counts).reduce((sum,value)=>sum+value,0);
  const dominant=(Object.entries(counts) as [ActionCategory,number][]).sort((a,b)=>b[1]-a[1])[0];
  const negativeCashMonths=game.history.filter(month=>month.cashFlow.cashChange<0).length;
  const negativeOperatingMonths=game.history.filter(month=>month.cashFlow.operatingCF<0).length;
  const highInventoryMonths=game.history.filter(month=>month.balance.inventory>Math.max(1,month.income.cogs)*1.4).length;
  const cashCrunchMonths=game.history.filter(month=>month.balance.cash<game.financial.monthlyFixedCosts).length;
  const borrowing=(actionCounts.get("borrow")??0)+(actionCounts.get("short-loan")??0)+(actionCounts.get("emergency-loan")??0);
  const investment=["equipment","system","product","office","renew"].reduce((sum,id)=>sum+(actionCounts.get(id)??0),0);
  const workingCapital=["shorten-terms","factoring","reduce-stock","clearance","supplier-terms"].reduce((sum,id)=>sum+(actionCounts.get(id)??0),0);
  const growthActions=["ads","new-clients","large-order","hire","product","office"].reduce((sum,id)=>sum+(actionCounts.get(id)??0),0);
  const tendencies=[
    totalActions?`${categoryLabels[dominant[0]]}の判断が最多（${dominant[1]}回）でした。`:"アクションを温存する慎重な月が中心でした。",
    `${game.history.length}か月中、現金が減った月は${negativeCashMonths}回、本業の現金がマイナスだった月は${negativeOperatingMonths}回でした。`,
    borrowing?`借入系の判断を${borrowing}回使い、成長や資金不足に備えました。`:"借入を使わず、手元資金の範囲で経営しました。"
  ];
  const goodChoices:string[]=[];
  if(game.cumulativeOperatingCF>0)goodChoices.push("累計営業CFがプラスで、本業から現金を生み出せています。");
  if(game.financial.balance.cash>=game.financial.monthlyFixedCosts*3)goodChoices.push("最後に固定費3か月分以上の現金を残し、十分な安全余裕を作りました。");
  if(investment>0&&game.financial.baseRevenue>180*10_000)goodChoices.push("投資を売上基盤の成長につなげました。借入を避けるだけでは得られない成長です。");
  if(workingCapital>0)goodChoices.push("回収・在庫・支払条件に手を入れ、利益だけでなく資金繰りも管理しました。");
  if(!goodChoices.length)goodChoices.push("厳しい環境でも最後まで判断を続け、財務の変化を経験として残しました。");
  const weakChoices:string[]=[];
  if(cashCrunchMonths>=Math.max(2,game.history.length*.2))weakChoices.push(`現金が固定費1か月分を下回る月が${cashCrunchMonths}回ありました。投資や返済の前に安全資金を確保すると安定します。`);
  if(highInventoryMonths>=Math.max(2,game.history.length*.2))weakChoices.push(`在庫が重い月が${highInventoryMonths}回ありました。仕入れた商品が現金に戻るまでの時間を見落としやすい傾向です。`);
  if(negativeOperatingMonths>game.history.length/3)weakChoices.push("営業CFがマイナスの月が多く、利益より先に売掛金や在庫へ現金が出ていました。");
  if(borrowing>=3&&game.financial.balance.longDebt>game.financial.balance.cash)weakChoices.push("借入を重ねた一方、返済原資となる現金が十分に育っていません。借りる前に回収見込みを確認しましょう。");
  if(growthActions===0)weakChoices.push("成長につながる行動が少なく、現金を守るだけで機会を逃しました。小さな成長投資も必要です。");
  if(investment>=4&&cashCrunchMonths>0)weakChoices.push("設備・開発への投資が手元現金に対して速すぎました。投資を数か月に分けると資金ショートを防げます。");
  if(!weakChoices.length)weakChoices.push("大きな弱点はありません。次回は同じ安全性を保ちながら、もう一段高い成長を狙えます。");
  const nextStrategies:string[]=[];
  if(cashCrunchMonths||negativeOperatingMonths>game.history.length/3)nextStrategies.push("最初に固定費3か月分の現金を目標にし、回収条件短縮や在庫削減で土台を整えてから成長投資を行う。");
  if(highInventoryMonths)nextStrategies.push("大口受注や在庫積み増しの前に、売掛金の入金月まで払える現金があるかを確認する。");
  if(growthActions===0||game.financial.baseRevenue<=180*10_000)nextStrategies.push("安全資金を残したうえで、新規顧客・広告・システムなど効果の異なる成長策を小さく組み合わせる。");
  if(borrowing)nextStrategies.push("借入は設備や顧客開拓など将来の営業CFを増やす用途に絞り、現金が増えた月に一部返済する。");
  if(!nextStrategies.length)nextStrategies.push("今のバランスを維持し、売上が伸びた月ほど売掛金・在庫・営業CFを確認して投資時期を決める。");
  const styleName=dominant[0]==="sales"?"売上先行のチャレンジャー":dominant[0]==="investment"?"未来をつくる投資家":dominant[0]==="finance"?"資金調達のプランナー":dominant[0]==="workingCapital"?"現金を回す管理者":"守りを整える改善家";
  return {styleName,styleSummary:`${categoryLabels[dominant[0]]}を軸にした経営です。安全性と成長性の両方を見ると、次の一手がさらに明確になります。`,tendencies,goodChoices,weakChoices,nextStrategies};
}

