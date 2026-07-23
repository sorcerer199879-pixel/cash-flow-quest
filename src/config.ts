import type { DifficultyConfig, GameEvent, PlayerAction } from "./types";

export const YEN = 1;
export const MAN = 10_000 * YEN;
export const ACTION_POINTS = 3;

export const DIFFICULTIES: Record<string, DifficultyConfig> = {
  beginner: { id:"beginner", label:"初級", description:"解説多め・回収1か月", initialCash:500*MAN, initialDebt:100*MAN, receivableMonths:1, duration:24, eventSeverity:.65, eventChance:.36, tutorial:true },
  standard: { id:"standard", label:"中級", description:"標準的な資金繰り", initialCash:300*MAN, initialDebt:200*MAN, receivableMonths:2, duration:24, eventSeverity:1, eventChance:.45, tutorial:false },
  advanced: { id:"advanced", label:"上級", description:"回収長期・強い逆風", initialCash:200*MAN, initialDebt:300*MAN, receivableMonths:3, duration:36, eventSeverity:1.35, eventChance:.55, tutorial:false }
};

const a = (x: PlayerAction) => x;
export const ACTIONS: PlayerAction[] = [
  a({id:"ads",name:"広告宣伝を増やす",category:"sales",ap:1,cashCost:25*MAN,risk:"中",duration:3,delay:0,description:"今すぐ販促。売上を伸ばすが現金を先に使う。",effect:{revenueMultiplier:.10,growthChange:.004}}),
  a({id:"discount",name:"価格を引き下げる",category:"sales",ap:1,cashCost:0,risk:"中",duration:2,delay:0,description:"販売量を増やす一方、粗利率が下がる。",effect:{revenueMultiplier:.14,variableCostRateChange:.04}}),
  a({id:"raise-price",name:"価格を引き上げる",category:"sales",ap:1,cashCost:0,risk:"中",duration:2,delay:0,description:"粗利改善。売上数量が落ちる可能性。",effect:{revenueMultiplier:-.06,variableCostRateChange:-.035}}),
  a({id:"new-clients",name:"新規顧客を開拓する",category:"sales",ap:2,cashCost:35*MAN,risk:"中",duration:5,delay:1,description:"将来の基礎売上を育てる。",effect:{revenueMultiplier:.08,growthChange:.009}}),
  a({id:"large-order",name:"大口案件を受注する",category:"sales",ap:2,cashCost:15*MAN,risk:"高",duration:1,delay:0,description:"売上は急増するが在庫・売掛金も膨らむ。",effect:{revenueMultiplier:.38,inventoryChange:55*MAN,receivableMonthsChange:1}}),
  a({id:"shorten-terms",name:"回収条件を短縮する",category:"workingCapital",ap:2,cashCost:10*MAN,risk:"低",duration:6,delay:0,description:"売上を少し犠牲に、現金化を早める。",effect:{receivableMonthsChange:-1,revenueMultiplier:-.04}}),
  a({id:"extend-terms",name:"回収条件を延ばす",category:"sales",ap:1,cashCost:0,risk:"高",duration:4,delay:0,description:"売上は増えるが回収まで現金が寝る。",effect:{receivableMonthsChange:1,revenueMultiplier:.14}}),
  a({id:"hire",name:"人材を採用する",category:"cost",ap:2,cashCost:30*MAN,risk:"中",duration:4,delay:1,description:"翌月から販売力が増え、固定費は恒久的に増える。",effect:{revenueMultiplier:.10},permanentEffect:{fixedCostChange:22*MAN,growthChange:.006}}),
  a({id:"cut-staff",name:"人員を削減する",category:"cost",ap:2,cashCost:45*MAN,risk:"高",duration:3,delay:0,description:"一時費用を払い、固定費を恒久的に圧縮する。",effect:{revenueMultiplier:-.07,creditChange:-2},permanentEffect:{fixedCostChange:-18*MAN}}),
  a({id:"cost-cut",name:"コスト削減を実施",category:"cost",ap:1,cashCost:15*MAN,risk:"低",duration:5,delay:0,description:"固定費を小さくする。成長余力も少し低下。",effect:{fixedCostChange:-8*MAN,growthChange:-.002}}),
  a({id:"outsource",name:"外注を利用する",category:"cost",ap:1,cashCost:8*MAN,risk:"低",duration:3,delay:0,description:"固定費を抑えつつ変動費で能力を確保。",effect:{revenueMultiplier:.08,variableCostRateChange:.025}}),
  a({id:"quality",name:"品質管理を強化",category:"cost",ap:1,cashCost:18*MAN,risk:"低",duration:4,delay:1,description:"短期負担と引き換えに安定成長。",effect:{growthChange:.005,variableCostRateChange:.008,creditChange:2}}),
  a({id:"stock-up",name:"在庫を積み増す",category:"workingCapital",ap:1,cashCost:0,risk:"中",duration:1,delay:0,description:"欠品を防ぐが現金を在庫に変える。",effect:{inventoryChange:65*MAN,revenueMultiplier:.06}}),
  a({id:"reduce-stock",name:"在庫を削減する",category:"workingCapital",ap:1,cashCost:0,risk:"低",duration:1,delay:0,description:"在庫を現金化。販売機会は少し減る。",effect:{inventoryChange:-45*MAN,revenueMultiplier:-.04}}),
  a({id:"supplier-terms",name:"支払条件を交渉する",category:"workingCapital",ap:2,cashCost:12*MAN,risk:"中",duration:5,delay:0,description:"買掛金の支払いを遅らせ、現金余力を作る。",effect:{payableMonthsChange:1,variableCostRateChange:.008}}),
  a({id:"factoring",name:"売掛金を早期回収する",category:"workingCapital",ap:1,cashCost:12*MAN,risk:"低",duration:1,delay:0,description:"手数料を払い、回収を早める。",effect:{receivableMonthsChange:-2}}),
  a({id:"clearance",name:"過剰在庫を値引き販売",category:"workingCapital",ap:1,cashCost:0,risk:"低",duration:1,delay:0,description:"粗利を譲って在庫を現金化する。",effect:{inventoryChange:-80*MAN,revenueMultiplier:.05,variableCostRateChange:.05}}),
  a({id:"equipment",name:"設備を購入する",category:"investment",ap:2,cashCost:0,risk:"中",duration:5,delay:1,description:"今の現金を将来の生産力へ振り替える。",effect:{capex:120*MAN,revenueMultiplier:.12},permanentEffect:{variableCostRateChange:-.025,growthChange:.004}}),
  a({id:"system",name:"システムを導入する",category:"investment",ap:2,cashCost:0,risk:"低",duration:4,delay:1,description:"設備投資で固定費とミスを減らす。",effect:{capex:75*MAN},permanentEffect:{fixedCostChange:-7*MAN,variableCostRateChange:-.01}}),
  a({id:"product",name:"新商品を開発する",category:"investment",ap:3,cashCost:0,risk:"高",duration:8,delay:2,description:"先行投資の後、大きな成長機会。",effect:{capex:95*MAN,revenueMultiplier:.18,growthChange:.012}}),
  a({id:"borrow",name:"銀行から借り入れる",category:"finance",ap:1,cashCost:0,risk:"中",duration:1,delay:0,description:"現金を増やすが返済と利息が残る。",effect:{borrowing:120*MAN,creditChange:-2}}),
  a({id:"short-loan",name:"短期借入を利用する",category:"finance",ap:1,cashCost:0,risk:"高",duration:1,delay:0,description:"すぐ調達できるが高金利。",effect:{borrowing:60*MAN,creditChange:-4}}),
  a({id:"repay",name:"借入金を返済する",category:"finance",ap:1,cashCost:0,risk:"低",duration:1,delay:0,description:"現金を使い、将来の利息負担を減らす。",effect:{repayment:60*MAN,creditChange:3}}),
  a({id:"equity",name:"増資を実施する",category:"finance",ap:3,cashCost:20*MAN,risk:"中",duration:1,delay:0,description:"返済不要の資金を得るが実行コストがかかる。",effect:{equityRaised:150*MAN,creditChange:4}}),
  a({id:"office",name:"営業拠点を増やす",category:"investment",ap:3,cashCost:0,risk:"高",duration:6,delay:2,description:"先行投資後に販路を広げる。固定費も恒久的に増える。",effect:{capex:140*MAN,revenueMultiplier:.16},permanentEffect:{fixedCostChange:16*MAN,growthChange:.007}}),
  a({id:"renew",name:"老朽設備を更新する",category:"investment",ap:2,cashCost:0,risk:"低",duration:4,delay:1,description:"故障リスクを抑え、原価率を改善する。",effect:{capex:90*MAN},permanentEffect:{variableCostRateChange:-.018}}),
  a({id:"emergency-loan",name:"緊急融資を申し込む",category:"finance",ap:2,cashCost:8*MAN,risk:"高",duration:1,delay:0,description:"信用を消費して当座の現金を確保する。",effect:{borrowing:80*MAN,creditChange:-8}})
];

export const EVENTS: GameEvent[] = [
  {id:"key-client",title:"大口顧客からの紹介",description:"評判が広がり、受注が増えました。",probability:.13,effect:{revenueMultiplier:.22},duration:2,lesson:"成長時ほど売掛金と在庫も増えます。"},
  {id:"late-payment",title:"入金遅延",description:"取引先の支払いが1か月遅れます。",probability:.15,effect:{receivableMonthsChange:1},duration:2,lesson:"利益があっても、回収までは現金ではありません。",responses:[
    {id:"wait",label:"通常回収を待つ",description:"費用なし。資金余力で耐える。",cashCost:0,effect:{}},
    {id:"factor",label:"早期回収を依頼",description:"手数料を払い回収遅延を相殺する。",cashCost:15*MAN,effect:{receivableMonthsChange:-1}}
  ]},
  {id:"material",title:"原材料価格の上昇",description:"仕入単価が上昇しました。",probability:.13,effect:{variableCostRateChange:.055},duration:3,lesson:"固定費だけでなく変動費率の管理も利益と現金を守ります。"},
  {id:"recession",title:"景気後退の兆し",description:"市場全体の需要が弱まっています。",probability:.10,effect:{revenueMultiplier:-.18},duration:3,lesson:"固定費が高いほど売上減少時の損失が大きくなります。"},
  {id:"boom",title:"市場が急成長",description:"カテゴリーへの注目が集まっています。",probability:.10,effect:{revenueMultiplier:.28,growthChange:.006},duration:2,lesson:"好況は運転資金需要も連れてきます。"},
  {id:"breakdown",title:"設備トラブル",description:"修繕と一時的な生産低下が発生。",probability:.09,minMonth:4,effect:{fixedCostChange:35*MAN,revenueMultiplier:-.12},duration:1,lesson:"安全余裕は予期せぬ支出への保険です。",responses:[
    {id:"repair",label:"応急修理",description:"少額修理で売上低下を受け入れる。",cashCost:0,effect:{}},
    {id:"rush",label:"緊急復旧",description:"追加費用で売上低下を抑える。",cashCost:25*MAN,effect:{revenueMultiplier:.10,fixedCostChange:-20*MAN}}
  ]},
  {id:"obsolete",title:"在庫の陳腐化",description:"一部在庫の価値が失われました。",probability:.08,minMonth:5,effect:{inventoryChange:-55*MAN,variableCostRateChange:.03},duration:1,lesson:"在庫は現金を拘束し、価値が下がるリスクもあります。"},
  {id:"grant",title:"業務改善補助金",description:"改善活動が評価され補助金を受給。",probability:.07,minMonth:3,effect:{equityRaised:45*MAN},duration:1,lesson:"一時的な入金と持続的な営業CFは区別しましょう。"},
  {id:"rate-hike",title:"金利上昇",description:"借入金利が上がりました。",probability:.11,minMonth:6,advancedOnly:true,effect:{},duration:5,lesson:"借入は成長を加速しますが、金利変動リスクがあります。"},
  {id:"default",title:"取引先の倒産",description:"売掛金の一部が回収不能に。",probability:.08,minMonth:8,advancedOnly:true,effect:{receivableMonthsChange:1,creditChange:-5},duration:1,lesson:"取引先の集中と回収期間は信用リスクを増幅します。"}
];

export const GLOSSARY = [
  ["営業CF","本業で生んだ現金。利益に減価償却と運転資金の増減を調整します。"],
  ["フリーCF","営業CFから設備投資を差し引いた、自由度の高い現金。"],
  ["売掛金","売上済みだが、まだ回収していない代金。"],
  ["買掛金","仕入済みだが、まだ支払っていない代金。"],
  ["自己資本比率","総資産のうち返済不要の純資産が占める割合。"],
  ["減価償却","設備の取得額を利用期間に分けて費用化する処理。"]
];
