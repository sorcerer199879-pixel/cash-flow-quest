import { useEffect, useMemo, useState } from "react";
import { ACTIONS, DIFFICULTIES, GLOSSARY, MAN } from "./config";
import { ACTION_GUIDES, RULE_SECTIONS, TUTORIAL_STEPS } from "./education";
import { createGame, nextMonth, prepareMonth, processMonth, scoreGame, selectEventResponse, toggleAction } from "./engine/game";
import { calculateBusinessStatus } from "./engine/status";
import { analyzePlay } from "./engine/coach";
import { deleteSave, getBest, hasSave, loadGame, saveBest, saveGame } from "./storage";
import type { Difficulty, GameState } from "./types";

const money=(v:number)=>`${Math.round(v/MAN).toLocaleString("ja-JP")}万円`;
const signed=(v:number)=>`${v>=0?"+":""}${money(v)}`;
const categories={sales:"売上",cost:"費用",workingCapital:"運転資金",investment:"投資",finance:"資金調達"} as const;

function App(){
  const [game,setGame]=useState<GameState|null>(null);
  const [seed,setSeed]=useState(()=>Math.floor(Date.now()%999999));
  const [modal,setModal]=useState<"guide"|"rules"|"actions"|"glossary"|null>(null);
  useEffect(()=>{if(game){saveGame(game);}},[game]);
  const start=(d:Difficulty)=>{setGame(prepareMonth(createGame(d,seed||1)));if(d==="beginner")setModal("guide");};
  if(!game) return <Title onStart={start} seed={seed} setSeed={setSeed} onContinue={()=>{const s=loadGame();if(s)setGame(s);}} modal={modal} setModal={setModal}/>;
  const restart=()=>setGame(prepareMonth(createGame(game.difficulty,game.seed)));
  if(game.screen==="final")return <Final game={game} onHome={()=>setGame(null)} onRestart={restart}/>;
  if(game.screen==="result")return <MonthResult game={game} onNext={()=>setGame(nextMonth(game))}/>;
  return <Game game={game} setGame={setGame} onHome={()=>setGame(null)} onGlossary={()=>setModal("glossary")} modal={modal} setModal={setModal}/>;
}

type LearningModal = "guide"|"rules"|"actions"|"glossary";
function Title({onStart,seed,setSeed,onContinue,modal,setModal}:{onStart:(d:Difficulty)=>void;seed:number;setSeed:(n:number)=>void;onContinue:()=>void;modal:LearningModal|null;setModal:(m:LearningModal|null)=>void}){
 return <main className="title-shell">
   <header className="title-top"><span className="brand-mark">CF</span><span>FINANCIAL SIMULATION</span><button className="text-button" onClick={()=>setModal("guide")}>チュートリアル</button><button className="text-button" onClick={()=>setModal("rules")}>ルールブック</button></header>
   <section className="hero"><div><p className="eyebrow">利益を追うか、現金を守るか。</p><h1>Cash Flow<br/><em>Quest</em></h1><p className="lead">小さな事業の24か月。売上、在庫、投資、借入——<br/>あなたの一手が、帳簿と銀行残高を別々に動かす。</p></div><div className="cash-orbit" aria-hidden="true"><div>¥</div><span>PROFIT</span><span>CASH</span></div></section>
   <section className="start-panel"><div className="panel-heading"><div><span>01</span><h2>難易度を選ぶ</h2></div><label>乱数シード<input type="number" value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label></div>
   <div className="difficulty-grid">{Object.values(DIFFICULTIES).map((d,i)=><button key={d.id} className="difficulty" onClick={()=>onStart(d.id)}><span className="difficulty-no">0{i+1}</span><strong>{d.label}</strong><small>{d.description}</small><dl><div><dt>初期現金</dt><dd>{money(d.initialCash)}</dd></div><div><dt>期間</dt><dd>{d.duration}か月</dd></div><div><dt>回収</dt><dd>{d.receivableMonths}か月</dd></div></dl><span className="start-arrow">開始 →</span></button>)}</div>
   {hasSave()&&<div className="continue-row"><button className="primary" onClick={onContinue}>続きから再開</button><button className="ghost" onClick={()=>{deleteSave();location.reload();}}>セーブを削除</button></div>}</section>
   <footer><span>利益 ≠ 現金</span><span>© Cash Flow Quest — original learning simulation</span></footer>
   {modal&&<Modal type={modal} close={()=>setModal(null)}/>}
 </main>
}

function Game({game,setGame,onHome,onGlossary,modal,setModal}:{game:GameState;setGame:(s:GameState)=>void;onHome:()=>void;onGlossary:()=>void;modal:LearningModal|null;setModal:(m:LearningModal|null)=>void}){
 const f=game.financial, selected=new Set(game.selectedActionIds);
 const grouped=[...Object.entries(categories),["status","ステータス"]];
 const [tab,setTab]=useState("sales");
 const [statement,setStatement]=useState<"pl"|"bs"|"cf"|"trend">("pl");
 const [financeOpen,setFinanceOpen]=useState(false);
 const needsResponse=Boolean(game.currentEvent?.responses?.length);
 const canProcess=game.selectedActionIds.length>0&&(!needsResponse||Boolean(game.selectedEventResponseId));
 return <main className="app-shell"><header className="app-header"><button className="logo-button" onClick={onHome}><span>CF</span> Cash Flow Quest</button><div className="month"><strong>{game.month}</strong><span>/ {game.duration} MONTH</span></div><div className="header-actions"><button onClick={()=>saveGame(game)}>保存</button><button onClick={()=>setModal("guide")}>学び方</button><button onClick={onGlossary}>用語集</button></div></header>
 <section className="kpi-strip" aria-label="主要指標">{[
 ["現金残高",money(f.balance.cash),f.cashFlow.cashChange],["売上高",money(f.income.revenue),0],["純利益",money(f.income.netIncome),f.income.netIncome],["営業CF",money(f.cashFlow.operatingCF),f.cashFlow.operatingCF],["フリーCF",money(f.cashFlow.freeCF),f.cashFlow.freeCF],["借入金",money(f.balance.shortDebt+f.balance.longDebt),0],["信用スコア",`${game.creditScore} / 100`,game.creditScore-60]
 ].map(([l,v,d])=><div className="kpi" key={String(l)}><span>{l}</span><strong>{v}</strong>{Number(d)!==0&&<small className={Number(d)>=0?"up":"down"}>{Number(d)>=0?"▲":"▼"} {l==="信用スコア"?"健全性":signed(Number(d))}</small>}</div>)}</section>
 <div className="dashboard"><section className="decision-column"><div className="event-card"><div><span className="section-label">MARKET / EVENT</span><h2>{game.currentEvent?.title??"穏やかな市場"}</h2><p>{game.currentEvent?.description??"今月は大きな外部変化はありません。足元の経営に集中できます。"}</p>{game.currentEvent?.responses?.length?<fieldset className="event-responses"><legend>対応策を選択</legend>{game.currentEvent.responses.map(response=><button type="button" key={response.id} className={game.selectedEventResponseId===response.id?"selected":""} aria-pressed={game.selectedEventResponseId===response.id} onClick={()=>setGame(selectEventResponse(game,response.id))}><strong>{response.label}</strong><span>{response.description}</span></button>)}</fieldset>:null}</div><div className="event-pulse">今月</div></div>
 <div className="action-head"><div><span className="section-label">DECISIONS</span><h2>経営判断</h2></div><div className="ap"><span>ACTION POINT</span><strong>{game.actionPoints}</strong><i>/ 3</i></div></div>
 <nav className="tabs" aria-label="アクション分類">{grouped.map(([id,label])=><button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}>{label}</button>)}</nav>
 {tab==="status"?<StatusPanel game={game}/>:<div className="actions">{ACTIONS.filter(a=>a.category===tab).map(a=>{const guide=ACTION_GUIDES[a.id];return <button key={a.id} className={`action-card ${selected.has(a.id)?"selected":""}`} onClick={()=>setGame(toggleAction(game,a.id))} aria-pressed={selected.has(a.id)} disabled={!selected.has(a.id)&&a.ap>game.actionPoints}><div className="action-title"><span className="checkbox">{selected.has(a.id)?"✓":""}</span><strong>{a.name}</strong><b>{a.ap} AP</b></div><p className="easy-summary">{guide.simple}</p><div className="effect-story"><span><b>いま</b>{guide.now}</span><span><b>あとで</b>{guide.later}</span><span><b>注意</b>{guide.watch}</span></div><div className="action-meta"><span>先に出る現金 {money(a.cashCost||a.effect.capex||0)}</span><span>リスク {a.risk}</span><span>効果 {a.duration}か月</span></div></button>})}</div>}
 <div className="commit-bar"><div><strong>{game.selectedActionIds.length}件を選択</strong><span>{needsResponse&&!game.selectedEventResponseId?"イベント対応を選択してください":`残りAP ${game.actionPoints}`}</span></div><button className="commit" disabled={!canProcess} onClick={()=>setGame(processMonth(game))}>今月を実行 <span>→</span></button></div></section>
 <button className="mobile-finance-toggle" type="button" aria-expanded={financeOpen} onClick={()=>setFinanceOpen(open=>!open)}>{financeOpen?"財務詳細を閉じる":"財務詳細を表示"}</button><aside className={`finance-column ${financeOpen?"mobile-open":""}`}><div className="liquidity-card"><span className="section-label">RUNWAY</span><h3>現金安全余裕</h3><strong>{(f.balance.cash/Math.max(1,f.monthlyFixedCosts)).toFixed(1)}<small>か月</small></strong><div className="meter"><i style={{width:`${Math.min(100,f.balance.cash/Math.max(1,f.monthlyFixedCosts)*20)}%`}}/></div><p>固定費を賄える月数。3か月以上がひとつの目安です。</p></div>
 <div className="statement-card"><nav>{(["pl","bs","cf","trend"] as const).map(x=><button key={x} className={statement===x?"active":""} onClick={()=>setStatement(x)}>{x==="pl"?"損益":x==="bs"?"貸借":x==="cf"?"CF":"推移"}</button>)}</nav><Statement type={statement} game={game}/></div>
 <div className="tip"><span>今月の視点</span><p>売上の増加は、売掛金と在庫も増やします。成長に必要な現金を先回りして確保できていますか？</p></div></aside></div>
 {modal&&<Modal type={modal} close={()=>setModal(null)}/>}</main>
}

function StatusPanel({game}:{game:GameState}){
 const f=game.financial,s=calculateBusinessStatus(f);
 const chosen=ACTIONS.filter(action=>game.selectedActionIds.includes(action.id));
 const selectedCash=chosen.reduce((total,action)=>total+action.cashCost+(action.effect.capex??0)-(action.effect.borrowing??0)-(action.effect.equityRaised??0)+(action.effect.repayment??0),0);
 const revenueGap=s.expectedRevenue-s.breakEvenRevenue;
 const runwayTone=s.cashRunwayMonths>=3?"good":s.cashRunwayMonths>=1.5?"watch":"danger";
 const growthTone=s.monthlyGrowthRate>=.01?"good":s.monthlyGrowthRate>=0?"watch":"danger";
 return <section className="status-panel" aria-labelledby="status-title">
  <header><div><span className="section-label">BUSINESS STATUS</span><h3 id="status-title">今月の会社の体力</h3><p>まだアクションを実行しない場合の、現在の設定から計算した目安です。</p></div><div className={`status-badge ${runwayTone}`}><span>現金の安心度</span><strong>{runwayTone==="good"?"安心":runwayTone==="watch"?"注意":"危険"}</strong></div></header>
  <div className="status-summary">
   <article><span>今月の予想売上</span><strong>{money(s.expectedRevenue)}</strong><small>今の成長率で進んだ場合</small></article>
   <article><span>製品を作る費用</span><strong>{money(s.productionCost)}</strong><small>売上の {(f.variableCostRate*100).toFixed(1)}%</small></article>
   <article><span>毎月ほぼ決まる費用</span><strong>{money(f.monthlyFixedCosts)}</strong><small>売上がゼロでもかかる費用</small></article>
   <article><span>すべての月間コスト</span><strong>{money(s.totalMonthlyCost)}</strong><small>生産費・固定費・利息など</small></article>
  </div>
  <div className="status-columns">
   <section className="cost-map"><h4>お金は何に使われる？</h4>{[
    ["製品の生産",s.productionCost,s.totalMonthlyCost],
    ["人件費",s.payroll,s.totalMonthlyCost],
    ["家賃",s.rent,s.totalMonthlyCost],
    ["その他固定費",s.otherFixed,s.totalMonthlyCost],
    ["減価償却・利息",s.depreciation+s.interest,s.totalMonthlyCost]
   ].map(([label,value,total])=><div key={String(label)}><span>{label}</span><div className="status-meter"><i style={{width:`${Math.max(2,Number(value)/Math.max(1,Number(total))*100)}%`}}/></div><b>{money(Number(value))}</b></div>)}</section>
   <section className="health-grid"><h4>経営のものさし</h4><div><span>損益分岐点</span><strong>{money(s.breakEvenRevenue)}</strong><small className={revenueGap>=0?"up":"down"}>予想売上は {signed(revenueGap)}</small><p>これより多く売ると利益が出やすくなります。</p></div><div><span>成長性</span><strong className={growthTone}>{(s.monthlyGrowthRate*100).toFixed(1)}% / 月</strong><small>年率換算 約{(s.annualizedGrowthRate*100).toFixed(1)}%</small><p>毎月の基礎売上が伸びる力です。</p></div><div><span>現金安全余裕</span><strong className={runwayTone}>{s.cashRunwayMonths.toFixed(1)}か月</strong><small>目安は3か月以上</small><p>売上がなくても固定費を払える期間です。</p></div><div><span>運転資金</span><strong>{money(s.workingCapital)}</strong><small>売掛金＋在庫−買掛金</small><p>商売を回すために、今は使えないお金です。</p></div></section>
  </div>
  <div className="status-details"><div><span>売掛金の回収</span><strong>{f.receivableMonths}か月</strong></div><div><span>仕入代金の支払い</span><strong>{f.payableMonths}か月</strong></div><div><span>借入金利</span><strong>{(f.interestRate*100).toFixed(1)}%</strong></div><div><span>自己資本比率</span><strong>{(s.equityRatio*100).toFixed(1)}%</strong></div></div>
  <aside className="selection-preview"><div><span>選択中のアクション</span><strong>{chosen.length?chosen.map(a=>a.name).join("・"):"まだ選んでいません"}</strong></div><p>{chosen.length?`実行時に先に出る現金の概算は ${money(Math.max(0,selectedCash))} です。借入・増資は差し引いて表示しています。`:"各アクションを選んだあと、ここへ戻ると必要な現金の概算を確認できます。"}</p></aside>
 </section>
}

function Statement({type,game}:{type:"pl"|"bs"|"cf"|"trend";game:GameState}){
 const f=game.financial;
 if(type==="trend")return <Trend game={game}/>;
 const rows=type==="pl"?[["売上高",f.income.revenue],["売上原価",-f.income.cogs],["売上総利益",f.income.grossProfit],["人件費",-f.income.payroll],["広告宣伝費",-f.income.marketing],["家賃・固定費",-(f.income.rent+f.income.otherFixed)],["減価償却費",-f.income.depreciation],["支払利息",-f.income.interest],["当期純利益",f.income.netIncome]]
 :type==="bs"?[["現金",f.balance.cash],["売掛金",f.balance.receivables],["在庫",f.balance.inventory],["設備",f.balance.equipment],["買掛金",-f.balance.payables],["借入金",-(f.balance.shortDebt+f.balance.longDebt)],["純資産",f.balance.equity]]
 :[["税引後利益",f.cashFlow.netIncome],["減価償却",f.cashFlow.depreciation],["売掛金増減",-f.cashFlow.receivablesChange],["在庫増減",-f.cashFlow.inventoryChange],["買掛金増減",f.cashFlow.payablesChange],["営業CF",f.cashFlow.operatingCF],["設備投資",f.cashFlow.investingCF],["財務CF",f.cashFlow.financingCF],["現金増減",f.cashFlow.cashChange]];
 return <div className="statement"><h3>{type==="pl"?"損益計算書":type==="bs"?"貸借対照表":"キャッシュフロー計算書"}</h3>{rows.map(([l,v],i)=><div className={i===rows.length-1?"total":""} key={String(l)}><span>{l}</span><b className={Number(v)<0?"negative":""}>{money(Number(v))}</b></div>)}</div>
}
function Trend({game}:{game:GameState}){
 const data=game.history.slice(-12); if(!data.length)return <div className="empty-chart">月を実行すると<br/>現金・売上・利益の推移が表示されます。</div>;
 const max=Math.max(...data.flatMap(x=>[Math.abs(x.balance.cash),x.income.revenue]),1);
 return <div className="chart" role="img" aria-label="過去12か月の現金と売上の棒グラフ"><h3>月次推移（万円）</h3><div className="bars">{data.map(x=><div key={x.month} title={`${x.month}月 現金${money(x.balance.cash)} 売上${money(x.income.revenue)}`}><i style={{height:`${Math.max(2,Math.abs(x.balance.cash)/max*100)}%`}}/><em style={{height:`${x.income.revenue/max*100}%`}}/><small>{x.month}</small></div>)}</div><div className="legend"><span>■ 現金</span><span>■ 売上</span></div></div>
}
function MonthResult({game,onNext}:{game:GameState;onNext:()=>void}){
 const r=game.history.at(-1)!;const cf=r.cashFlow;return <main className="result-shell"><header><span className="brand-mark">CF</span><div><span>MONTHLY REVIEW</span><h1>{r.month}月の経営結果</h1></div></header><section className="result-hero"><div><span>月末現金</span><strong>{money(r.balance.cash)}</strong><small className={cf.cashChange>=0?"up":"down"}>{signed(cf.cashChange)}</small></div><div><span>純利益</span><strong>{money(r.income.netIncome)}</strong></div><div><span>営業CF</span><strong>{money(cf.operatingCF)}</strong></div><div><span>利益と現金の差</span><strong>{signed(cf.cashChange-r.income.netIncome)}</strong></div></section>
 <div className="result-grid"><section className="waterfall"><span className="section-label">CASH BRIDGE</span><h2>現金増減の内訳</h2>{[["月初現金",r.openingCash],["営業CF",cf.operatingCF],["投資CF",cf.investingCF],["財務CF",cf.financingCF],["月末現金",r.balance.cash]].map(([l,v],i)=><div className={i===4?"final-line":""} key={String(l)}><span>{l}</span><b className={Number(v)<0?"negative":""}>{i>0&&i<4?signed(Number(v)):money(Number(v))}</b></div>)}<p className="equation">月初現金 ＋ 営業CF ＋ 投資CF ＋ 財務CF ＝ 月末現金</p></section>
 <section className="learning"><span className="section-label">LEARNING NOTE</span><h2>今月の学び</h2><blockquote>{r.lesson}</blockquote>{r.eventResponse&&<div className="response-result"><span>EVENT RESPONSE</span><h3>{r.eventResponse.label}</h3><p>{r.eventResponse.description}</p><ul>{r.eventImpact.map(item=><li key={item}>{item}</li>)}</ul><small>{r.eventResponse.learning}</small></div>}<div className="feedback good"><span>GOOD</span><p>{r.goodDecision}</p></div><div className="feedback improve"><span>NEXT</span><p>{r.improvement}</p></div>{r.event&&<p className="event-lesson"><strong>{r.event.title}:</strong> {r.event.lesson}</p>}</section></div>
 <section className="chosen"><span>選択した判断</span><strong>{r.selectedActions.join(" ／ ")||"アクションを温存"}{r.eventResponse?` ／ イベント対応: ${r.eventResponse.label}`:""}</strong></section><button className="next-button" onClick={onNext}>次の月へ進む <span>→</span></button></main>
}
function Final({game,onHome,onRestart}:{game:GameState;onHome:()=>void;onRestart:()=>void}){
 const s=scoreGame(game),coach=analyzePlay(game);useEffect(()=>saveBest(s.score),[s.score]);return <main className="final-shell"><p className="eyebrow">{game.gameOverReason?"BUSINESS CLOSED":"QUEST COMPLETE"}</p><div className="rank">{s.rank}</div><h1>{game.gameOverReason?"資金繰りの旅はここで終了":"安定した事業への一歩"}</h1>{game.gameOverReason&&<p className="gameover">{game.gameOverReason}</p>}<p className="type">経営タイプ — <strong>{coach.styleName}</strong></p><p className="coach-summary">{coach.styleSummary}</p>
 <section className="score-grid">{[["総合スコア",`${s.score}点`],["最終現金",money(game.financial.balance.cash)],["累計売上",money(game.cumulativeRevenue)],["累計純利益",money(game.cumulativeProfit)],["累計営業CF",money(game.cumulativeOperatingCF)],["累計フリーCF",money(game.cumulativeFreeCF)],["借入残高",money(game.financial.balance.longDebt+game.financial.balance.shortDebt)],["自己資本比率",`${(s.equityRatio*100).toFixed(1)}%`],["現金月商倍率",`${s.cashToSales.toFixed(2)}倍`],["事業成長率",`${(s.growth*100).toFixed(1)}%`],["CF安定性",`${s.stability.toFixed(0)} / 100`],["倒産リスク",s.risk]].map(([l,v])=><div key={l}><span>{l}</span><strong>{v}</strong></div>)}</section>
 <section className="coach-report" aria-labelledby="coach-title"><div className="coach-heading"><span className="section-label">MANAGEMENT COACH</span><h2 id="coach-title">今回の経営を振り返る</h2><p>結果だけでなく、毎月の選び方とお金の動きから分析しています。</p></div><CoachBlock label="PLAY STYLE" title="プレイ傾向" items={coach.tendencies}/><CoachBlock label="GOOD" title="良かった判断" items={coach.goodChoices} tone="good"/><CoachBlock label="REVIEW" title="良くなかった行動" items={coach.weakChoices} tone="review"/><CoachBlock label="NEXT QUEST" title="次回おすすめの戦略" items={coach.nextStrategies} tone="strategy"/></section>
 <div className="final-actions"><button className="primary" onClick={onRestart}>同じ条件で再挑戦</button><button className="ghost" onClick={onHome}>タイトルへ</button></div><p>ベストスコア {Math.max(getBest(),s.score)}点</p></main>
}
function CoachBlock({label,title,items,tone=""}:{label:string;title:string;items:string[];tone?:""|"good"|"review"|"strategy"}){
 return <article className={`coach-block ${tone}`}><span>{label}</span><h3>{title}</h3><ul>{items.map(item=><li key={item}>{item}</li>)}</ul></article>
}
function Modal({type,close}:{type:LearningModal;close:()=>void}){
 const [step,setStep]=useState(0);
 const [view,setView]=useState<LearningModal>(type);
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(e.key==="Escape")close()};addEventListener("keydown",fn);return()=>removeEventListener("keydown",fn)},[close]);
 const titles={guide:"はじめてチュートリアル",rules:"やさしいルールブック",actions:"アクション図鑑",glossary:"ことば図鑑"};
 return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)close()}}><section className="modal learning-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" autoFocus onClick={close} aria-label="閉じる">×</button><span className="section-label">LEARNING CENTER</span><h2 id="modal-title">{titles[view]}</h2><nav className="learn-tabs" aria-label="学習メニュー">{([["guide","はじめて"],["rules","ルール"],["actions","アクション"],["glossary","ことば"]] as const).map(([id,label])=><button key={id} className={view===id?"active":""} onClick={()=>{setView(id);setStep(0)}}>{label}</button>)}</nav>
 {view==="guide"&&<div className="tutorial"><div className="tutorial-progress" aria-label={`${step+1}/${TUTORIAL_STEPS.length}`}>{TUTORIAL_STEPS.map((_,i)=><i key={i} className={i<=step?"done":""}/>)}</div><div className="tutorial-icon" aria-hidden="true">{TUTORIAL_STEPS[step].icon}</div><small>その {step+1} / {TUTORIAL_STEPS.length}</small><h3>{TUTORIAL_STEPS[step].title}</h3><p>{TUTORIAL_STEPS[step].body}</p><aside>たとえば：{TUTORIAL_STEPS[step].example}</aside><div className="tutorial-actions"><button disabled={step===0} onClick={()=>setStep(s=>s-1)}>← もどる</button>{step<TUTORIAL_STEPS.length-1?<button className="primary" onClick={()=>setStep(s=>s+1)}>つぎへ →</button>:<button className="primary" onClick={close}>わかった！ゲームへ</button>}</div></div>}
 {view==="rules"&&<div className="rulebook">{RULE_SECTIONS.map((section,i)=><article key={section.title}><span>{i+1}</span><div><h3>{section.title}</h3><p>{section.body}</p></div></article>)}</div>}
 {view==="actions"&&<div className="action-encyclopedia">{ACTIONS.map(action=>{const guide=ACTION_GUIDES[action.id];return <details key={action.id}><summary><strong>{action.name}</strong><span>{categories[action.category]}・{action.ap}AP</span></summary><p>{guide.simple}</p><dl><div><dt>いま</dt><dd>{guide.now}</dd></div><div><dt>あとで</dt><dd>{guide.later}</dd></div><div><dt>注意</dt><dd>{guide.watch}</dd></div></dl></details>})}</div>}
 {view==="glossary"&&<dl className="glossary">{GLOSSARY.map(([t,d])=><div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>}</section></div>
}
export default App;
