'use strict';

const SAVE_KEY='corona-de-ceniza-save-v2';
const META_KEY='corona-de-ceniza-meta-v2';
const SAVE_KEY_V1='corona-de-ceniza-save-v1';
const META_KEY_V1='corona-de-ceniza-meta-v1';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const deepClone = o => JSON.parse(JSON.stringify(o));

function hashSeed(str){
  let h1=0xdeadbeef^str.length,h2=0x41c6ce57^str.length;
  for(let i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return 4294967296*(2097151&h2)+(h1>>>0);
}
class RNG{
  constructor(seed,counter=0){this.seed=String(seed);this.state=(hashSeed(this.seed)>>>0)||0x9e3779b9;this.counter=0;for(let i=0;i<counter;i++)this.next()}
  next(){let t=this.state+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);this.counter++;return ((t^t>>>14)>>>0)/4294967296}
  int(a,b){return Math.floor(this.next()*(b-a+1))+a}
  pick(a){return a[Math.floor(this.next()*a.length)]}
  chance(p){return this.next()<p}
  weighted(items,weightFn){let total=0,ws=items.map(x=>{const w=Math.max(0,weightFn(x));total+=w;return w});if(total<=0)return this.pick(items);let r=this.next()*total;for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i]}return items.at(-1)}
}

function defaultMeta(){return {legacy:0,perks:[],packs:[],totalReigns:0,totalDecisions:0,bestReign:0,achievements:[],discoveredAdvisors:[],secrets:[],endings:[],lifetimeDeaths:{}}}
function loadMeta(){
  try{
    const raw=localStorage.getItem(META_KEY)||localStorage.getItem(META_KEY_V1)||'{}';
    const parsed=JSON.parse(raw);
    return {...defaultMeta(),...parsed,packs:parsed.packs||[]};
  }catch{return defaultMeta()}
}
function initialState(seed,dynasty,mode,meta,house){
  return {
    version:VERSION,seed,rngCounter:0,dynasty,mode,house:house||{color:'#c6a45b',motto:'',founder:''},
    reign:1,reignYear:1,worldYear:1,decision:0,reignDecisions:0,
    ruler:'',rulerAge:22,rulerGender:'f',
    stats:{pueblo:50,tesoro:50,ejercito:50,saber:50},
    hidden:{corrupcion:10,autoridad:50,salud:70,inteligencia:20,deuda:0,reservas:0,mercenarios:0,void:0,influenciaNorte:0,balanceStreak:0,treasuryLowSeen:false,religion:40},
    factions:{nobleza:50,clero:50,gremios:50,frontera:50},
    neighbors:{norte:45,sahr:50,ceniza:40},
    personality:{clemencia:0,razon:0},
    flags:[],edicts:[],places:{},
    persistent:{heirTrait:null,heirPeople:0,spouse:null,children:[],assassin:null,plotFace:null,plotsFoiled:0},
    heir:null,guardUsed:false,undoUsed:false,tutorialDone:false,
    relationships:Object.fromEntries(Object.keys(ADVISORS).map(k=>[k,0])),
    history:[],samples:[],recent:[],seen:{},onceSeen:[],delayed:[],forced:[],
    currentCard:null,season:0,agendaBias:null,lastAgenda:0,lastConsult:-99,consulted:false,
    lastUltimatum:{},sealed:false,pendingSide:null,snapshot:null,busy:false,
    meta,settings:{sound:true,hints:true,music:true,reduceMotion:false},endingShown:[]
  };
}
function patchState(s){
  const base=initialState(s.seed||'0',s.dynasty||'de Valdoria',s.mode||'normal',{...defaultMeta(),...(s.meta||{})},s.house);
  const merged={...base,...s,stats:{...base.stats,...(s.stats||{})},hidden:{...base.hidden,...(s.hidden||{})},
    factions:{...base.factions,...(s.factions||{})},neighbors:{...base.neighbors,...(s.neighbors||{})},
    personality:{...base.personality,...(s.personality||{})},persistent:{...base.persistent,...(s.persistent||{})},
    settings:{...base.settings,...(s.settings||{})},house:{...base.house,...(s.house||{})},
    relationships:{...base.relationships,...(s.relationships||{})}};
  merged.meta={...defaultMeta(),...merged.meta};
  return merged;
}

let state=null,rng=null,drag={active:false,startX:0,x:0},audio={ac:null,drone:null};
const el={};

function cacheEls(){
  ['card','cardText','speakerName','speakerTitle','portraitGlyph','advisorMood','cardTag','rarityTag',
   'leftText','rightText','leftEffects','rightEffects','leftBtnText','rightBtnText','swipeLeftText','swipeRightText',
   'rulerName','yearLabel','reignLabel','ageLabel','seasonLabel','omens','whisper','legacyValue','chronicleCount',
   'seedReadout','soundToggle','hintToggle','musicToggle','motionToggle','consultBtn','consultHint','cardEcho','fxLayer']
    .forEach(id=>el[id]=$('#'+id));
}

function randomSeed(){const a=new Uint32Array(3);crypto.getRandomValues(a);return [...a].map(x=>x.toString(36)).join('-')}
function dailySeed(){const d=new Date();return `dia-${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`}
function applyHouse(){
  const c=state?.house?.color||'#c6a45b';
  document.documentElement.style.setProperty('--house',c);
  document.documentElement.style.setProperty('--gold',c);
}
function applyStartPerks(){
  const p=state.meta.perks||[];
  if(p.includes('granero'))state.stats.pueblo=clamp(state.stats.pueblo+5,0,100);
  if(p.includes('cofre'))state.stats.tesoro=clamp(state.stats.tesoro+5,0,100);
  if(p.includes('guardia'))state.stats.ejercito=clamp(state.stats.ejercito+5,0,100);
  if(p.includes('archivo'))state.stats.saber=clamp(state.stats.saber+5,0,100);
  if(p.includes('pacto_sangre')){state.neighbors.norte=clamp(state.neighbors.norte+12,0,100);state.hidden.influenciaNorte+=8}
}
function inferGenderFromName(full){
  if(!full)return null;
  const parts=String(full).trim().split(/\s+/);
  const first=parts[0];
  if(NAME_F.includes(first))return 'f';
  if(NAME_M.includes(first))return 'm';
  const rest=parts.slice(1).join(' ').toLowerCase();
  if(rest.startsWith('la '))return 'f';
  if(rest.startsWith('el '))return 'm';
  return null;
}
function pickGender(){
  const sel=$('#genderSelect')?.value||'auto';
  if(sel==='f'||sel==='m')return sel;
  const inferred=inferGenderFromName($('#founderInput')?.value||state?.house?.founder);
  if(inferred)return inferred;
  return rng.chance(.5)?'f':'m';
}
function nameFor(gender){return rng.pick(gender==='f'?NAME_F:NAME_M)}
function epithetFor(gender,trait){
  let pool=EPITHETS.filter(e=>gender==='f'?e.startsWith('la '):e.startsWith('el '));
  if(!pool.length)pool=EPITHETS;
  if(trait==='estratega'&&rng.chance(.65))return gender==='f'?'la de Hierro':'el Estratega';
  if(trait==='erudito'&&rng.chance(.65))return gender==='f'?'la Sabia':'el Erudito';
  return rng.pick(pool);
}
function setRuler(fromHeir){
  if(fromHeir&&state.heir?.name){
    state.rulerGender=state.heir.gender||state.rulerGender;
    state.rulerAge=clamp(state.heir.age||18,16,40);
    const epi=epithetFor(state.rulerGender,state.persistent.heirTrait);
    state.ruler=`${state.heir.name} ${epi}`;
  }else{
    const founder=(state.house?.founder||'').trim();
    if(founder&&state.reign===1){
      const inferred=inferGenderFromName(founder);
      if(inferred)state.rulerGender=inferred;
      else if(!state.rulerGender)state.rulerGender=rng.chance(.5)?'f':'m';
      state.ruler=founder.includes(' ')?founder:`${founder} ${epithetFor(state.rulerGender,state.persistent.heirTrait)}`;
      state.rulerAge=rng.int(19,27);
    }else{
      if(!state.rulerGender)state.rulerGender=rng.chance(.5)?'f':'m';
      state.ruler=`${nameFor(state.rulerGender)} ${epithetFor(state.rulerGender,state.persistent.heirTrait)}`;
      if(state.reign===1)state.rulerAge=rng.int(19,27);
    }
  }
  if((state.meta.perks||[]).includes('primogenitura')&&!state.heir)ensureHeir(true);
  state.rngCounter=rng.counter;
}
function ensureHeir(forceName){
  if(state.heir?.name&&!forceName)return state.heir;
  const g=rng.chance(.5)?'f':'m';
  const named=!!forceName||(state.meta.perks||[]).includes('primogenitura');
  state.heir={name:named?nameFor(g):null,gender:g,age:Math.max(1,state.rulerAge-rng.int(16,22)),trait:state.persistent.heirTrait,people:state.persistent.heirPeople||0,alive:true};
  return state.heir;
}
function hasFlag(f){return state.flags.includes(f)}
function addFlag(f){if(f&&!hasFlag(f))state.flags.push(f)}
function clearFlag(f){state.flags=state.flags.filter(x=>x!==f)}
function addEdict(name,year){if(!name)return;if(state.edicts.some(e=>e.name===name))return;state.edicts.push({name,year:year??state.worldYear})}
function rememberPlace(place,work){
  if(!place||!work)return;
  const p=state.places[place]||{works:[],resentment:0};
  if(!p.works.includes(work))p.works.push(work);
  p.resentment=Math.max(0,p.resentment-2);
  state.places[place]=p;
}
function discoverAdvisor(id){if(id&&!state.meta.discoveredAdvisors.includes(id))state.meta.discoveredAdvisors.push(id)}
function relOf(id){return state.relationships[id]||0}

function conditionOK(card){
  if(!card)return false;
  if(card.tutorial)return false;
  if(state.rulerAge<card.minAge||state.rulerAge>card.maxAge)return false;
  if(state.reign<card.minReign||state.reign>card.maxReign||state.decision<card.minDecision||state.decision>card.maxDecision)return false;
  if(card.requires&&card.requires.some(f=>!hasFlag(f)))return false;
  if(card.excludes&&card.excludes.some(f=>hasFlag(f)))return false;
  if(card.once&&state.onceSeen.includes(card.id))return false;
  const last=state.seen[card.id];if(last!=null&&state.decision-last<(card.cooldown||0))return false;
  if(card.ally&&relOf(card.advisor)<18)return false;
  if(card.foe&&relOf(card.advisor)>-18)return false;
  if(card.season&&SEASON_KEYS[state.season]!==card.season)return false;
  if(/^plot-(gold|protocol|cipher)-blade/.test(card.id))return false;
  if((hasFlag('plot_active')||hasFlag('plot_seeded'))&&/^(plague-0|war-0|void-0|famine-0|schism-0|mutiny-0|flood-0|heresy-0|crisis-0)$/.test(card.id))return false;
  if(card.pack&&!card.requires&&!(state.meta.packs||[]).includes(card.pack))return false;
  if(card.tags?.includes('faccion')&&card.weight<=5){
    const map={'noble-ultimatum':'nobleza','clero-ultimatum':'clero','guild-ultimatum':'gremios','border-ultimatum':'frontera'};
    const fac=map[card.id];if(fac&&(state.factions[fac]||50)>22)return false;
  }
  return true;
}
function unresolvedEffects(choice){return choice.effects||{}}
function beneficialForNeed(card){let score=0;for(const k of STAT_KEYS){const v=state.stats[k];if(v<22){const a=unresolvedEffects(card.left)[k],b=unresolvedEffects(card.right)[k];if((typeof a==='number'&&a>0)||(typeof b==='number'&&b>0))score+=3}if(v>78){const a=unresolvedEffects(card.left)[k],b=unresolvedEffects(card.right)[k];if((typeof a==='number'&&a<0)||(typeof b==='number'&&b<0))score+=3}}return score}
function cardWeight(card){
  let w=card.weight||10;
  if((state.meta.perks||[]).includes('destino')&&['rara','legendaria'].includes(card.rarity))w*=1.28;
  const last=state.seen[card.id];if(last==null)w*=1.55;else w*=clamp((state.decision-last)/35,.2,1.25);
  if(state.recent.includes(card.id))w*=.08;
  w*=1+beneficialForNeed(card)*.2;
  if(card.chain&&state.flags.some(f=>/plague_|war_|void_|famine_|schism_|mutiny_|flood_|heresy_|crisis_|sahr_|wedding_|plot_/.test(f)))w*=1.2;
  if(hasFlag('plot_active')&&card.chain&&/Mesa de Bruno|Firma del protocolo|Correo cifrado/.test(card.chain))w*=2.8;
  const rel=relOf(card.advisor);w*=clamp(1+rel*.015,.65,1.4);
  if(card.season&&SEASON_KEYS[state.season]===card.season)w*=2.2;
  if(state.agendaBias&&ADVISORS[card.advisor]){
    if(state.agendaBias==='law'&&['ines','bruno','elian'].includes(card.advisor))w*=1.45;
    if(state.agendaBias==='street'&&['tala','roldan','lupo'].includes(card.advisor))w*=1.45;
  }
  if(state.mode==='chaos')w*=rng.next()*.9+.55;
  return w;
}

function makeProceduralCard(){
  const [tpl,advisor]=rng.pick(PROCEDURAL.petitions);
  const lugar=rng.pick(PROCEDURAL.places);
  const obra=rng.pick(PROCEDURAL.works);
  const memory=state.places[lugar];
  let text=tpl.replace('{grupo}',rng.pick(PROCEDURAL.groups)).replace('{lugar}',lugar).replace('{obra}',obra)
    .replace('{oficio}',rng.pick(PROCEDURAL.trades)).replace('{demanda}',rng.pick(PROCEDURAL.demands)).replace('{demandaMil}',rng.pick(PROCEDURAL.demandsMil));
  if(memory?.works?.length&&rng.chance(.55)){
    const old=rng.pick(memory.works);
    text=`Los de ${lugar} vuelven: ${old} ya está, pero se raja. Piden mantenimiento o una disculpa con presupuesto.`;
  }else if((memory?.resentment||0)>4&&rng.chance(.4)){
    text=`En ${lugar} recuerdan que les dijiste que no. Esta vez no piden: reclaman.`;
  }
  const focus=rng.pick(STAT_KEYS),other=rng.pick(STAT_KEYS.filter(x=>x!==focus));const mag=rng.int(4,9),cost=rng.int(3,8);
  const accept={[focus]:mag,[other]:-cost};const reject={[focus]:-rng.int(2,6),[other]:rng.int(1,4)};
  return C('proc-'+state.decision+'-'+rng.int(1000,9999),advisor,text,O('No esta vez',reject,{placeResent:lugar}),O('Concedido',accept),{tags:['petición','procedural'],weight:7,cooldown:0,place:lugar,work:obra.includes(' ') ? obra.replace(/^un[a]? /,'') : obra});
}
function delayedToCard(d){
  const blade=/^plot_(gold|protocol|cipher)_blade$/.exec(d.type);
  if(blade){
    const kind=blade[1];
    const id=hasFlag('plot_named')?`plot-${kind}-blade-named`:`plot-${kind}-blade`;
    const c=CARDS.find(x=>x.id===id);
    if(c)return {...deepClone(c),weight:100,rarity:'consecuencia',cooldown:0,once:false,interrupt:true,years:0};
  }
  const base=DELAYED[d.type];if(!base)return null;
  return {...deepClone(base),id:'delayed-'+d.type+'-'+d.created,weight:100,rarity:'consecuencia',cooldown:0,once:false,minReign:0,maxReign:999,minDecision:0,maxDecision:999,minAge:0,maxAge:200,years:base.years??1,interrupt:!!base.interrupt,chain:base.chain||''};
}
function maybeUltimatum(){
  const map={nobleza:'noble-ultimatum',clero:'clero-ultimatum',gremios:'guild-ultimatum',frontera:'border-ultimatum'};
  for(const fac of FACTION_KEYS){
    if((state.factions[fac]||50)>20)continue;
    if((state.lastUltimatum[fac]||0)>state.decision-12)continue;
    const card=CARDS.find(c=>c.id===map[fac]);
    if(card&&!state.recent.includes(card.id)){state.lastUltimatum[fac]=state.decision;return deepClone(card)}
  }
  return null;
}
function getNextCard(){
  if(!state.tutorialDone&&state.reign===1){
    const next=TUTORIAL.find(c=>!state.onceSeen.includes(c.id));
    if(next)return deepClone(next);
    state.tutorialDone=true;
  }
  if(state.forced.length){const id=state.forced.shift();const c=CARDS.find(x=>x.id===id)||TUTORIAL.find(x=>x.id===id);if(c)return deepClone(c)}
  const due=state.delayed.filter(d=>d.at<=state.worldYear);
  if(due.length){
    due.sort((a,b)=>(b.interrupt-a.interrupt)||(a.at-b.at));
    const d=due[0];state.delayed=state.delayed.filter(x=>x!==d);const c=delayedToCard(d);if(c)return c;
  }
  const ult=maybeUltimatum();if(ult)return ult;
  let candidates=CARDS.filter(conditionOK);
  if(!candidates.length)return makeProceduralCard();
  const arcActive=state.flags.some(f=>/plague_active|war_active|void_active|famine_active|schism_open|mutiny_on|flood_on|heresy_on|crisis_active|plot_active/.test(f));
  if(rng.chance(arcActive?.07:.14))return makeProceduralCard();
  const selected=rng.weighted(candidates,cardWeight);state.rngCounter=rng.counter;return deepClone(selected);
}

function resolveMagnitude(v){if(Array.isArray(v))return rng.int(v[0],v[1]);return v||0}
function effectPreview(choice,precise){
  const parts=[];for(const k of STAT_KEYS){const v=choice.effects?.[k];if(v==null)continue;let mag=Array.isArray(v)?Math.max(Math.abs(v[0]),Math.abs(v[1])):Math.abs(v);let dots=mag>=10?'●●●':mag>=6?'●●':'●';if(precise||(state.meta.perks||[]).includes('consejo'))dots=(v>0?'+':'−')+mag;parts.push(`${STAT_ICONS[k]}${state.settings.hints||precise?dots:''}`)}return parts.join('  ')
}
function wouldKill(choice){
  const modeMult=modeMultiplier();
  for(const k of STAT_KEYS){if(choice.effects?.[k]==null)continue;const d=Math.round(resolveMagnitude(choice.effects[k])*modeMult);const n=clamp(state.stats[k]+d,0,100);if(n<=0||n>=100)return k}
  return null;
}
function modeMultiplier(){
  if(state.mode==='relaxed')return .82;
  if(state.mode==='harsh')return 1.18;
  if(state.mode==='chaos')return rng.next()*.75+.75;
  return 1;
}
function applyEffects(choice){
  const modeMult=modeMultiplier();
  const realized={};
  for(const k of STAT_KEYS){
    if(choice.effects?.[k]==null)continue;
    let d=Math.round(resolveMagnitude(choice.effects[k])*modeMult);
    if(k==='tesoro'&&d<0&&(state.meta.perks||[]).includes('tesoro_sagrado'))d=Math.round(d*.75);
    state.stats[k]=clamp(state.stats[k]+d,0,100);realized[k]=d;
  }
  if(choice.hidden)for(const [k,v] of Object.entries(choice.hidden)){state.hidden[k]=clamp((state.hidden[k]??0)+resolveMagnitude(v),-100,150)}
  if(choice.relationship)for(const [k,v] of Object.entries(choice.relationship)){state.relationships[k]=clamp((state.relationships[k]||0)+v,-50,50)}
  if(choice.factions)for(const [k,v] of Object.entries(choice.factions)){state.factions[k]=clamp((state.factions[k]??50)+v,0,100)}
  if(choice.neighbors)for(const [k,v] of Object.entries(choice.neighbors)){state.neighbors[k]=clamp((state.neighbors[k]??50)+v,0,100)}
  if(choice.personality)for(const [k,v] of Object.entries(choice.personality)){state.personality[k]=clamp((state.personality[k]||0)+v,-50,50)}
  if(choice.setFlags)choice.setFlags.forEach(addFlag);
  if(choice.clearFlags)choice.clearFlags.forEach(clearFlag);
  if(choice.edict)addEdict(choice.edict);
  if(choice.persistent)Object.assign(state.persistent,choice.persistent);
  if(choice.schedule)choice.schedule.forEach(s=>{const after=Array.isArray(s.after)?rng.int(s.after[0],s.after[1]):s.after;state.delayed.push({type:s.type,at:state.worldYear+after,created:state.worldYear,interrupt:!!s.interrupt})});
  if(choice.placeResent){const p=state.places[choice.placeResent]||{works:[],resentment:0};p.resentment+=3;state.places[choice.placeResent]=p}
  if(choice.special)runSpecial(choice.special);
  return realized;
}
function runSpecial(id){
  if(id==='peaceAttempt'){
    const chance=clamp(.28+(state.hidden.inteligencia/200)+(hasFlag('war_intel')?.18:0)+(state.stats.saber/250)+(relOf('garrik')/200),.15,.88);
    if(rng.chance(chance)){addFlag('war_peace');clearFlag('war_active');state.stats.pueblo=clamp(state.stats.pueblo+8,0,100);state.stats.tesoro=clamp(state.stats.tesoro+5,0,100);toast('Paz de Ceniza','La conferencia tuvo éxito. Tres firmas terminaron una guerra que parecía interminable.');addSecret('La tinta que detuvo tres ejércitos')}
    else{state.stats.ejercito=clamp(state.stats.ejercito-10,0,100);state.stats.pueblo=clamp(state.stats.pueblo-6,0,100);toast('La mesa se rompió','Un delegado fue asesinado durante la negociación. La guerra continúa.')}
  }
  if(id==='nameHeirSelf'){ensureHeir(true);state.heir.name=state.ruler.split(' ')[0];toast('Nombre del heredero',state.heir.name+' llevará tu nombre.')}
  if(id==='nameHeirPeople'){ensureHeir(true);state.heir.name=nameFor(state.heir.gender);toast('Nombre del heredero','La plaza eligió a '+state.heir.name+'.')}
  if(id==='marrySelf'){state.persistent.spouse=state.persistent.spouse||nameFor(state.rulerGender==='f'?'m':'f');addFlag('casado');addEdict('Matrimonio real')}
  if(id==='secondChild'){addFlag('segundo_hijo');state.persistent.children=(state.persistent.children||[]).concat([{name:nameFor(rng.chance(.5)?'f':'m')}]);toast('Segunda cuna','La corte ya discute primogenitura.')}
  if(id==='agendaLaw'){state.agendaBias='law';state.lastAgenda=state.decision;toast('Agenda','Inés, Bruno y Elián tendrán más oído.')}
  if(id==='agendaStreet'){state.agendaBias='street';state.lastAgenda=state.decision;toast('Agenda','Tala, Roldán y Lupo tendrán más oído.')}
  if(id==='plotLook')plotLook();
  if(id==='plotIgnore')plotIgnore();
  if(id==='plotClue'){addFlag(hasFlag('plot_clue1')?'plot_clue2':'plot_clue1');state.hidden.inteligencia=clamp(state.hidden.inteligencia+3,-100,150)}
  if(id==='nameTraitor')nameTraitor();
  if(id==='betrayKill')betrayKill();
  if(id==='betrayFoil')betrayFoil();
  if(id==='shadowPurge'){state.persistent.assassin=null;state.persistent.plotFace=null;['shadow_gold','shadow_protocol','shadow_cipher'].forEach(clearFlag);toast('La mesa se limpia','El oficio del cuchillo no se hereda. Esta vez.')}
  if(id==='shadowKeep'){state.hidden.corrupcion=clamp(state.hidden.corrupcion+6,-100,150);toast('El copero sigue','La casa prefiere no preguntar de qué murió el anterior.')}
}

function plotKind(){
  if(hasFlag('plot_gold')||hasFlag('shadow_gold'))return 'gold';
  if(hasFlag('plot_protocol')||hasFlag('shadow_protocol'))return 'protocol';
  if(hasFlag('plot_cipher')||hasFlag('shadow_cipher'))return 'cipher';
  return state.persistent.assassin?.kind||null;
}
function heavyArcActive(){
  return state.flags.some(f=>/plague_active|war_active|void_active|famine_active|schism_open|mutiny_on|flood_on|heresy_on|crisis_active|plot_active/.test(f));
}
function plotCandidates(){
  const list=[];
  if(state.hidden.corrupcion>=52||(hasFlag('banco')&&state.hidden.corrupcion>=40)){
    list.push({kind:'gold',score:state.hidden.corrupcion+(hasFlag('banco')?12:0)+(state.hidden.deuda>20?8:0)});
  }
  if(state.hidden.autoridad<=36||(state.factions.nobleza||50)<=34||relOf('ines')<=-10){
    list.push({kind:'protocol',score:(50-state.hidden.autoridad)+(50-(state.factions.nobleza||50))+Math.max(0,-relOf('ines')*2)});
  }
  if(state.hidden.inteligencia<=30||relOf('mara')<=-10||(state.neighbors.norte||50)<=28||((state.hidden.influenciaNorte||0)>=18&&state.hidden.inteligencia<42)){
    list.push({kind:'cipher',score:(40-state.hidden.inteligencia)+Math.max(0,-relOf('mara')*2)+(50-(state.neighbors.norte||50))+Math.min(20,state.hidden.influenciaNorte||0)});
  }
  return list.sort((a,b)=>b.score-a.score);
}
function maybeStartPlot(){
  if(state.reign<2||state.reignDecisions<14||state.rulerAge<24)return;
  if(hasFlag('plot_seeded')||hasFlag('plot_active')||hasFlag('plot_foiled')||hasFlag('plot_done'))return;
  if(heavyArcActive())return;
  const cands=plotCandidates();if(!cands.length)return;
  const top=cands[0];
  if(top.score<48&&!rng.chance(.42))return;
  addFlag('plot_seeded');addFlag('plot_'+top.kind);
  state.delayed.push({type:'plot_'+top.kind+'_knock',at:state.worldYear+rng.int(1,3),created:state.worldYear,interrupt:true});
}
function schedulePlotBlade(soon){
  const kind=plotKind();if(!kind)return;
  const after=soon?rng.int(3,6):rng.int(8,13);
  if(state.delayed.some(d=>String(d.type).includes('plot_')&&String(d.type).includes('_blade')))return;
  state.delayed.push({type:'plot_'+kind+'_blade',at:state.worldYear+after,created:state.worldYear,interrupt:true});
}
function plotLook(){
  addFlag('plot_looked');addFlag('plot_knock');addFlag('plot_active');
  state.hidden.inteligencia=clamp(state.hidden.inteligencia+4,-100,150);
  schedulePlotBlade(false);
  toast('El cubierto de más','Alguien cuenta copas que no son de cortesía.');
}
function plotIgnore(){
  addFlag('plot_ignore');addFlag('plot_knock');addFlag('plot_active');
  schedulePlotBlade(true);
}
function nameTraitor(){
  const k=plotKind();
  if(k==='gold')state.persistent.plotFace=relOf('bruno')<=-8?'Bruno Varda':'Ciro el copero';
  else if(k==='protocol')state.persistent.plotFace=relOf('ines')<=-8?'Inés de Aramonte':'el duque de la izquierda';
  else state.persistent.plotFace=relOf('mara')<=-8?'Mara Velo':'un correo del Norte';
  addFlag('plot_named');addFlag('plot_clue2');
  toast('Un nombre','Quedó escrito en la palma. No lo leas en voz alta.');
}
function assassinRecord(kind){
  if(kind==='gold')return {kind:'gold',faction:'gremios',advisor:'bruno',neighbor:null};
  if(kind==='protocol')return {kind:'protocol',faction:'nobleza',advisor:'ines',neighbor:null};
  return {kind:'cipher',faction:'frontera',advisor:'mara',neighbor:'norte'};
}
function betrayKill(){
  const kind=plotKind()||'gold';
  addFlag('plot_killed');
  state.persistent.assassin=assassinRecord(kind);
}
function betrayFoil(){
  const kind=plotKind()||'gold';
  const named=hasFlag('plot_named');
  addFlag('plot_foiled');addFlag('plot_done');
  ['plot_active','plot_gold','plot_protocol','plot_cipher','plot_seeded'].forEach(clearFlag);
  state.delayed=state.delayed.filter(d=>!String(d.type).startsWith('plot_'));
  state.persistent.assassin=null;
  state.persistent.plotsFoiled=(state.persistent.plotsFoiled||0)+1;
  if(kind==='gold'){state.hidden.corrupcion=clamp(state.hidden.corrupcion-(named?18:8),-100,150);state.factions.gremios=clamp((state.factions.gremios||50)-(named?8:3),0,100)}
  if(kind==='protocol'){state.hidden.autoridad=clamp(state.hidden.autoridad+(named?10:4),-100,150);state.factions.nobleza=clamp((state.factions.nobleza||50)-(named?10:4),0,100)}
  if(kind==='cipher'){state.hidden.inteligencia=clamp(state.hidden.inteligencia+(named?10:4),-100,150);state.neighbors.norte=clamp((state.neighbors.norte||50)-(named?8:3),0,100)}
  if(named){
    const edict={gold:'El copero juzgado',protocol:'El protocolo del banquete',cipher:'El correo abierto'}[kind];
    const secret={gold:'Quién mezclaba metal en el vino',protocol:'La cláusula que era un cuchillo',cipher:'La letra del Norte en palacio'}[kind];
    addEdict(edict);addSecret(secret);
    toast('La daga no alcanzó',`${state.persistent.plotFace||'El traidor'} pierde el oficio. Vos, no.`);
  }else{
    addEdict('La copa retirada');
    toast('Suerte de palacio','La copa no se bebió. El nombre sigue suelto en los pasillos.');
  }
}
function substPlot(s){return String(s||'').replace(/\{traidor\}/g,state.persistent.plotFace||'el traidor')}
function checkBetrayalDeath(){
  if(!hasFlag('plot_killed'))return false;
  endReign('betrayal',false);return true;
}

function scheduleWorldEvents(){
  if(state.hidden.corrupcion>65&&rng.chance(.07))state.stats.pueblo=clamp(state.stats.pueblo-rng.int(2,5),0,100);
  if(state.hidden.salud<30&&rng.chance(.1))state.stats.pueblo=clamp(state.stats.pueblo-rng.int(2,6),0,100);
  if(state.hidden.deuda>40&&rng.chance(.08))state.stats.tesoro=clamp(state.stats.tesoro-rng.int(2,5),0,100);
  if(state.hidden.reservas>0){state.hidden.reservas=Math.max(0,state.hidden.reservas-1);if(state.stats.pueblo<25)state.stats.pueblo=clamp(state.stats.pueblo+1,0,100)}
  if(hasFlag('hospital'))state.hidden.salud=clamp(state.hidden.salud+.3,-100,150);
  if(hasFlag('censo')&&state.decision%8===0)state.stats.tesoro=clamp(state.stats.tesoro+1,0,100);
  if(hasFlag('calzada_sur')&&state.decision%10===0)state.stats.pueblo=clamp(state.stats.pueblo+1,0,100);
  if(state.season===3&&!hasFlag('silos')&&rng.chance(.12))state.stats.pueblo=clamp(state.stats.pueblo-1,0,100);
  if(state.season===1&&state.hidden.reservas<2&&rng.chance(.1))state.stats.pueblo=clamp(state.stats.pueblo-2,0,100);
  for(const k of FACTION_KEYS){if(state.factions[k]<25&&rng.chance(.05))state.stats.pueblo=clamp(state.stats.pueblo-1,0,100)}
  if(state.neighbors.norte<20&&rng.chance(.06))state.stats.ejercito=clamp(state.stats.ejercito-2,0,100);
  if(state.heir&&rng.chance(.08))state.heir.age+=1;
  maybeStartPlot();
}
function updateHiddenMilestones(){
  if(state.stats.tesoro<10)state.hidden.treasuryLowSeen=true;
  if(STAT_KEYS.every(k=>state.stats[k]>=40&&state.stats[k]<=60))state.hidden.balanceStreak++;else state.hidden.balanceStreak=0;
}
function addSecret(s){if(!state.meta.secrets.includes(s)){state.meta.secrets.push(s);toast('Secreto descubierto',s)}}
function checkSecrets(){
  if(state.hidden.corrupcion>=70)addSecret('El precio exacto de una conciencia');
  if(state.hidden.inteligencia>=80)addSecret('La red bajo la red');
  if(hasFlag('void_active'))addSecret('Tres pulsos desde la oscuridad');
  if(hasFlag('constitucion'))addSecret('El trono puede sobrevivir al poder');
  if(hasFlag('schism_healed'))addSecret('Un reino puede tener dos cielos');
  if(hasFlag('famine_mercy'))addSecret('El Sur cuenta, pero a veces perdona');
  if(hasFlag('plot_named')&&hasFlag('plot_foiled'))addSecret('La palma donde cupo un nombre');
}
function checkAchievements(){for(const [id,title,desc,icon,test] of ACHIEVEMENTS){if(!state.meta.achievements.includes(id)&&test(state)){state.meta.achievements.push(id);state.meta.legacy+=5;toast(`Logro: ${title}`,`${desc}  +5 ✧`)}}}
function checkSpecialEnding(){
  for(const e of SPECIAL_ENDINGS){
    if(!state.endingShown.includes(e.id)&&e.test(state)){
      state.endingShown.push(e.id);
      if(!state.meta.endings.includes(e.id))state.meta.endings.push(e.id);
      if(e.pack&&!(state.meta.packs||[]).includes(e.pack))state.meta.packs.push(e.pack);
      if((state.meta.perks||[]).includes('cronista'))state.meta.legacy+=8;
      saveAll();showEnding(e);return true;
    }
  }
  return false;
}

function annalLine(h){
  const long=(state.meta.perks||[]).includes('cronista');
  const year=`En el año ${roman(h.year)} de ${h.ruler}`;
  const body=`${h.speaker} planteó: “${h.text}” ${h.ruler.split(' ')[0]} eligió “${h.choice}”.`;
  const fx=formatEffects(h.effects);
  return long?`${year}, ${body} ${fx}`:`${year}: ${h.choice}. ${fx}`;
}

function choose(side,opts={}){
  if(!state?.currentCard||(state.busy&&!opts.confirmed))return;
  const card=state.currentCard,choice=card[side];
  if(!opts.confirmed&&state.mode==='harsh'&&wouldKill(choice)){
    state.pendingSide=side;$('#confirmText').textContent=`${STAT_LABELS[wouldKill(choice)]} llegaría al extremo. En Corona de Hierro, eso termina el reinado.`;
    $('#confirmDialog').showModal();return;
  }
  state.busy=true;
  playTone(side==='right'?520:330);
  if(state.mode==='relaxed'&&!state.undoUsed)state.snapshot=deepClone({...state,currentCard:card,snapshot:null});
  const realized=applyEffects(choice);
  if(card.place&&side==='right')rememberPlace(card.place,card.work);
  const years=card.years??1;
  state.decision++;state.reignDecisions++;state.meta.totalDecisions++;
  state.reignYear+=years;state.worldYear+=years;state.rulerAge+=years;
  if(years>0)state.season=(state.season+years)%4;
  state.consulted=false;
  scheduleWorldEvents();updateHiddenMilestones();
  state.history.unshift({year:state.reignYear,world:state.worldYear,reign:state.reign,ruler:state.ruler,speaker:ADVISORS[card.advisor]?.name||'Destino',text:cardTextOf(card),choice:choice.label,effects:realized,annal:''});
  state.history[0].annal=annalLine(state.history[0]);
  state.history=state.history.slice(0,160);
  state.samples.push({year:state.worldYear,...state.stats});if(state.samples.length>220)state.samples.shift();
  state.seen[card.id]=state.decision;state.recent.unshift(card.id);state.recent=state.recent.slice(0,7);
  if((card.once||card.tutorial)&&!state.onceSeen.includes(card.id))state.onceSeen.push(card.id);
  discoverAdvisor(card.advisor);
  if(card.id==='plague-herbs'&&side==='right')addFlag('plague_research');
  if(card.id==='void-door'&&side==='right')addSecret('Las medidas de una puerta que no debería existir');
  if(card.tutorial&&card.id==='tut-5')state.tutorialDone=true;
  checkSecrets();checkAchievements();state.rngCounter=rng.counter;saveAll();
  spawnDeltas(realized);
  animateChoice(side,()=>{
    try{
      renderStats();renderHeader();
      if(checkDeath()||checkAgeDeath()||checkBetrayalDeath()||checkSpecialEnding())return;
      dealCard();
    }finally{state.busy=false}
  });
}
function undoLast(){
  if(state.mode!=='relaxed'){toast('Sin deshacer','Solo el modo Consejo Real permite deshacer, una vez por reinado.');return}
  if(state.undoUsed||!state.snapshot){toast('No hay marcha atrás','Ya usaste el deshacer de este reinado o no hay carta previa.');return}
  const snap=state.snapshot;state=patchState(snap);state.undoUsed=true;state.snapshot=null;rng=new RNG(state.seed,state.rngCounter||0);saveAll();renderAll();renderCard();toast('El Consejo corrige','Una carta vuelve al mazo. No volverá a pasar en este reinado.');
}

function checkDeath(){
  for(const k of STAT_KEYS){
    if(state.stats[k]<=0||state.stats[k]>=100){
      const high=state.stats[k]>=100;
      if((state.meta.perks||[]).includes('ancla')&&!state.guardUsed){
        state.guardUsed=true;state.stats[k]=high?92:8;
        toast('El Ancla de la Corona',`El legado dinástico evita el colapso de ${STAT_LABELS[k]} una vez en este reinado.`);
        saveAll();renderStats();return false;
      }
      endReign(k,high);return true;
    }
  }
  return false;
}
function checkAgeDeath(){
  if(state.rulerAge<64)return false;
  const p=clamp((state.rulerAge-63)*0.045,0,.55);
  if(state.rulerAge>=78||rng.chance(p)){endReign('age',false);return true}
  return false;
}
function rumorOfDead(){
  const clem=state.personality.clemencia||0;
  if(clem>8)return 'En las plazas dicen que fue demasiado blando y, aun así, extrañamente llorado.';
  if(clem<-8)return 'En las plazas dicen que el palacio respira mejor. Nadie lo dice cerca de la guardia.';
  if((state.personality.razon||0)>8)return 'Los anales lo recuerdan como alguien que midió de más y amó de menos.';
  return 'El pueblo lo recuerda a trozos: un peaje, una fiesta, una peste, un nombre.';
}
function endReign(stat,high){
  state.meta.totalReigns++;state.meta.bestReign=Math.max(state.meta.bestReign,state.reignYear);
  const key=stat==='betrayal'?'betrayal':stat==='age'?'age':stat+(high?'High':'Low');
  state.meta.lifetimeDeaths[key]=(state.meta.lifetimeDeaths[key]||0)+1;
  const earned=Math.max(1,Math.floor(state.reignYear/8)+Math.floor(state.reignDecisions/18));
  state.meta.legacy+=earned;localStorage.setItem(META_KEY,JSON.stringify(state.meta));
  checkAchievements();
  const kind=plotKind();
  const txt=stat==='betrayal'?rng.pick(deathReasons['betrayal_'+(kind||'gold')]||deathReasons.betrayal):stat==='age'?rng.pick(deathReasons.age):rng.pick(deathReasons[key]);
  $('#deathTitle').textContent=stat==='betrayal'?'La daga encontró el oficio':stat==='age'?'El cuerpo cedió':`${STAT_LABELS[stat]} ${high?'desbordado':'colapsado'}`;
  $('#deathText').textContent=txt;
  $('#deathMemory').textContent=stat==='betrayal'?(state.persistent.plotFace?`${state.persistent.plotFace} sigue comiendo en palacio. El heredero heredará esa silla.`:rumorOfDead()):rumorOfDead();
  $('#deathYears').textContent=state.reignYear;
  $('#deathAge').textContent=Math.round(state.rulerAge);
  $('#deathLegacy').textContent='+'+earned;
  $('#deathIcon').textContent=stat==='betrayal'?'🗡':stat==='age'?'⌛':STAT_ICONS[stat];
  const works=state.edicts.slice(-6).map(e=>`<div class="unlock">Sobrevió: ${escapeHtml(e.name)}</div>`).join('')||'<div class="unlock">Ninguna obra nombrada sobrevive con claridad.</div>';
  $('#deathEdicts').innerHTML=works;
  ensureHeir(true);
  if(!state.heir.name)state.heir.name=nameFor(state.heir.gender);
  $('#deathHeir').innerHTML=`<b>${escapeHtml(state.heir.name)}</b><span>Hered${state.heir.gender==='f'?'era':'ero'} de ${Math.max(1,Math.round(state.heir.age))} años. ${state.persistent.heirTrait?('Rasgo: '+state.persistent.heirTrait+'.'):'Todavía sin tutor claro.'}</span>`;
  $('#deathUnlocks').innerHTML=earned>=4?'<div class="unlock">✧ Tu largo reinado fortalece el legado de la dinastía.</div>':'';
  $('#deathDialog').showModal();saveAll();
}
function inheritKingdom(){
  const next={pueblo:50,tesoro:50,ejercito:50,saber:50};
  for(const k of STAT_KEYS){next[k]=clamp(50+(state.stats[k]-50)*0.42,22,78)}
  if(hasFlag('hospital'))next.pueblo+=3;
  if(hasFlag('silos'))next.pueblo+=2;
  if(hasFlag('banco'))next.tesoro+=3;
  if(hasFlag('academia_militar'))next.ejercito+=3;
  if(hasFlag('imprenta')||hasFlag('escuela'))next.saber+=3;
  if(hasFlag('calzada_sur'))next.pueblo+=2;
  const bias=clamp(state.persistent.heirPeople||0,-8,8);next.pueblo+=bias;
  if(state.persistent.heirTrait==='estratega')next.ejercito+=6;
  if(state.persistent.heirTrait==='erudito')next.saber+=6;
  for(const k of STAT_KEYS)state.stats[k]=clamp(Math.round(next[k]),15,88);
  for(const k of FACTION_KEYS)state.factions[k]=clamp(50+(state.factions[k]-50)*0.55,15,85);
  for(const k of NEIGHBOR_KEYS)state.neighbors[k]=clamp(50+(state.neighbors[k]-50)*0.7,10,90);
  state.personality.clemencia=Math.round(state.personality.clemencia*0.35);
  state.personality.razon=Math.round(state.personality.razon*0.35);
  for(const id of Object.keys(state.relationships))state.relationships[id]=Math.round((state.relationships[id]||0)*0.55);
  state.hidden.autoridad=clamp(state.hidden.autoridad,25,75);
  state.hidden.salud=clamp(state.hidden.salud,35,85);
  state.hidden.balanceStreak=0;state.hidden.treasuryLowSeen=false;
  const a=state.persistent.assassin;
  if(a){
    if(a.faction)state.factions[a.faction]=clamp((state.factions[a.faction]||50)-14,8,90);
    if(a.advisor)state.relationships[a.advisor]=Math.min(state.relationships[a.advisor]||0,-8);
    if(a.neighbor)state.neighbors[a.neighbor]=clamp((state.neighbors[a.neighbor]||50)-10,8,90);
    state.hidden.inteligencia=clamp(state.hidden.inteligencia+6,-100,150);
  }
}
function nextReign(){
  $('#deathDialog').close();
  const heir=ensureHeir(true);
  state.reign++;state.reignYear=1;state.reignDecisions=0;state.guardUsed=false;state.undoUsed=false;state.snapshot=null;state.consulted=false;
  inheritKingdom();applyStartPerks();
  const killer=state.persistent.assassin;
  state.flags=state.flags.filter(f=>!/^plot_/.test(f));
  if(killer?.kind)addFlag('shadow_'+killer.kind);
  setRuler(true);
  state.heir=null;state.currentCard=null;state.busy=false;
  if((state.meta.perks||[]).includes('primogenitura'))ensureHeir(true);
  checkAchievements();saveAll();renderAll();dealCard();
  toast('Nueva corona',killer?`${state.ruler} hereda un reino… y al que sirvió el vino.`:`${state.ruler} hereda un reino que recuerda.`);
}

function cardTextOf(c){
  let t=c.text||'';
  if(c.coda){for(const [flag,extra] of Object.entries(c.coda)){if(hasFlag(flag))t+=extra}}
  return substPlot(t);
}
function dealCard(){state.currentCard=getNextCard();state.consulted=false;state.rngCounter=rng.counter;saveAll();renderCard()}
function renderCard(){
  const c=state.currentCard;if(!c)return;
  const a=ADVISORS[c.advisor]||{name:'El Destino',title:'sin título',glyph:'✶',mood:'•',sil:''};
  el.card.style.transition='none';el.card.style.transform='';el.card.style.opacity='1';el.card.classList.remove('fly','dragging','tint-left','tint-right');
  el.cardText.textContent=cardTextOf(c);
  el.speakerName.textContent=a.name;el.speakerTitle.textContent=a.title;
  const rel=relOf(c.advisor);
  el.advisorMood.textContent=rel>=18?'◆':rel<=-18?'✗':(a.mood||'');
  el.portraitGlyph.className='sil '+(a.sil||c.advisor||'');
  el.portraitGlyph.innerHTML='<i class="sil-head"></i><i class="sil-body"></i>';
  el.cardTag.textContent=(c.tags?.[0]||'CORTE').toUpperCase();
  el.rarityTag.textContent=String(c.rarity||'común').toUpperCase();
  const left=substPlot(flexLabel(c.left.label,'left')),right=substPlot(flexLabel(c.right.label,'right'));
  el.leftText.textContent=left;el.rightText.textContent=right;el.leftBtnText.textContent=left;el.rightBtnText.textContent=right;
  el.swipeLeftText.textContent=left;el.swipeRightText.textContent=right;
  el.leftEffects.textContent=effectPreview(c.left);el.rightEffects.textContent=effectPreview(c.right);
  $('#chainHint').innerHTML=c.chain?`<span class="chain">◇ ${c.chain}</span>`:(c.years===0?'<span>Una noche</span>':'');
  el.cardEcho.textContent='';el.consultHint.textContent='';
  const canConsult=canUseConsult(c);
  el.consultBtn.disabled=!canConsult;
  discoverAdvisor(c.advisor);
  requestAnimationFrame(()=>el.card.style.transition='transform .18s, opacity .18s');
}
function flexLabel(label,side){
  const clem=state.personality?.clemencia||0;
  if(clem>12&&/Colg|horca|código|Arrest/i.test(label))return side==='left'?label:label;
  return label;
}
function canUseConsult(c){
  if(!c||c.tutorial)return false;
  if((c.interrupt||c.rarity==='legendaria')&&!c.consult)return false;
  if((state.meta.perks||[]).includes('consejo'))return !state.consulted;
  return !state.consulted&&(state.worldYear-state.lastConsult>=4);
}
function consultCouncil(){
  const c=state.currentCard;if(!canUseConsult(c))return;
  state.consulted=true;state.lastConsult=state.worldYear;
  const a=ADVISORS[c.advisor];
  const line=c.consult||`${a?.name||'El Consejo'} murmura: izquierda ${effectPreview(c.left,true) || 'casi nada'}; derecha ${effectPreview(c.right,true)||'casi nada'}.`;
  el.consultHint.textContent=substPlot(line);
  el.leftEffects.textContent=effectPreview(c.left,true);
  el.rightEffects.textContent=effectPreview(c.right,true);
  el.consultBtn.disabled=true;
  playTone(410);saveAll();
}

function renderStats(){
  for(const k of STAT_KEYS){
    const v=Math.round(state.stats[k]);
    $('#'+k+'Bar').style.width=v+'%';$('#'+k+'Text').textContent=v;
    const wrap=document.querySelector(`[data-stat="${k}"]`);
    wrap.classList.toggle('warning',v<18||v>82);wrap.classList.toggle('danger',v<8||v>92);
  }
}
function renderHeader(){
  el.rulerName.textContent=state.ruler;
  el.yearLabel.textContent=`Año ${state.reignYear}`;
  el.ageLabel.textContent=`${Math.round(state.rulerAge)} años`;
  el.reignLabel.textContent=`Reinado ${roman(state.reign)} · ${state.dynasty}`;
  el.seasonLabel.textContent=SEASON_NAMES[state.season]||'Primavera';
  el.legacyValue.textContent=state.meta.legacy;
  el.chronicleCount.textContent=state.history.length;
  el.seedReadout.textContent=state.seed;
  document.body.classList.remove('season-spring','season-summer','season-autumn','season-winter','omen-plague','omen-war','omen-void');
  document.body.classList.add('season-'+SEASON_KEYS[state.season]);
  if(hasFlag('plague_active'))document.body.classList.add('omen-plague');
  if(hasFlag('war_active')||hasFlag('mutiny_on'))document.body.classList.add('omen-war');
  if(hasFlag('void_active')||hasFlag('void_door'))document.body.classList.add('omen-void');
  document.body.classList.toggle('reduce-motion',!!state.settings.reduceMotion);
  applyHouse();renderOmens();renderWhisper();tuneDrone();
}
function renderOmens(){
  const arr=[];
  if(hasFlag('plague_active'))arr.push(['⚕ Fiebre de Vidrio','urgent']);
  if(hasFlag('war_active'))arr.push(['⚔ Tres Banderas','urgent']);
  if(hasFlag('void_active'))arr.push(['☽ Estrella Negra','urgent']);
  if(hasFlag('famine_active'))arr.push(['♟ Hambruna','urgent']);
  if(hasFlag('flood_on')||hasFlag('flood_active'))arr.push(['Las Marismas','urgent']);
  if(hasFlag('mutiny_on'))arr.push(['Motín','urgent']);
  if(hasFlag('plot_active'))arr.push([hasFlag('plot_named')?'🗡 El nombre está en la mesa':'🗡 Conspiración','urgent']);
  else if(hasFlag('plot_seeded'))arr.push(['Un cubierto de más','']);
  if(hasFlag('shadow_gold')||hasFlag('shadow_protocol')||hasFlag('shadow_cipher'))arr.push(['El copero de ayer','']);
  if(state.hidden.corrupcion>55)arr.push(['◐ Corrupción','']);
  if(state.hidden.salud<35)arr.push(['Salud frágil','']);
  if(state.delayed.length)arr.push([`⌛ ${state.delayed.length} pendientes`,'']);
  for(const k of FACTION_KEYS){if(state.factions[k]<22)arr.push([FACTION_LABELS[k]+' tensa','urgent'])}
  el.omens.innerHTML=arr.slice(0,5).map(([t,c])=>`<span class="omen ${c}">${t}</span>`).join('');
}
function renderWhisper(){
  const w=whisperFor(state);
  el.whisper.textContent=w.length?rng?w[state.decision%w.length]:w[0]:'';
}
function renderAll(){
  renderStats();renderHeader();
  if(el.soundToggle)el.soundToggle.checked=state.settings.sound;
  if(el.hintToggle)el.hintToggle.checked=state.settings.hints;
  if(el.musicToggle)el.musicToggle.checked=state.settings.music;
  if(el.motionToggle)el.motionToggle.checked=state.settings.reduceMotion;
}
function roman(n){
  if(n<=0)return 'I';
  const map=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let s='';for(const [v,c] of map)while(n>=v){s+=c;n-=v}return s;
}

function spawnDeltas(realized){
  const layer=el.fxLayer;if(!layer)return;
  layer.innerHTML='';
  STAT_KEYS.forEach((k,i)=>{
    const d=realized[k];if(!d)return;
    const wrap=document.querySelector(`[data-stat="${k}"]`);
    wrap.classList.remove('flash-up','flash-down');void wrap.offsetWidth;
    wrap.classList.add(d>0?'flash-up':'flash-down');
    setTimeout(()=>wrap.classList.remove('flash-up','flash-down'),500);
    const n=document.createElement('span');n.className='fx-delta '+(d>0?'up':'down');
    n.textContent=(d>0?'+':'')+d+' '+STAT_LABELS[k];
    const r=wrap.getBoundingClientRect(),app=$('#app').getBoundingClientRect();
    n.style.left=(r.left-app.left+8)+'px';n.style.top=(r.top-app.top-8)+'px';
    layer.appendChild(n);
  });
  const c=state.history[0];
  if(c&&el.cardEcho)el.cardEcho.textContent=c.choice+' — '+formatEffects(realized);
}

function animateChoice(side,cb){
  if(state.settings.reduceMotion||window.matchMedia('(prefers-reduced-motion:reduce)').matches){cb();return}
  el.card.classList.add('fly');const dir=side==='right'?1:-1;
  el.card.style.transform=`translateX(${dir*620}px) rotate(${dir*24}deg)`;el.card.style.opacity='0';
  setTimeout(cb,300);
}
function updateDrag(x){
  drag.x=x;const dx=x-drag.startX,rot=clamp(dx/22,-13,13);
  const snap=Math.abs(dx)>70?Math.sign(dx)*Math.min(Math.abs(dx),140):dx;
  el.card.style.transform=`translateX(${snap}px) rotate(${rot}deg)`;
  $('#leftPreview').classList.toggle('active',dx<-25);$('#rightPreview').classList.toggle('active',dx>25);
  $('#swipeLeft').classList.toggle('show',dx<-28);$('#swipeRight').classList.toggle('show',dx>28);
  el.card.classList.toggle('tint-left',dx<-40);el.card.classList.toggle('tint-right',dx>40);
}
function endDrag(){
  if(!drag.active)return;drag.active=false;el.card.classList.remove('dragging');
  const dx=drag.x-drag.startX;
  $('#leftPreview').classList.remove('active');$('#rightPreview').classList.remove('active');
  $('#swipeLeft').classList.remove('show');$('#swipeRight').classList.remove('show');
  el.card.classList.remove('tint-left','tint-right');
  if(Math.abs(dx)>90&&!state.busy){if(navigator.vibrate)navigator.vibrate(12);choose(dx>0?'right':'left')}
  else{el.card.style.transform='';el.card.style.opacity='1'}
}

function toast(title,text){const d=document.createElement('div');d.className='toast';d.innerHTML=`<b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span>`;$('#toastLayer').appendChild(d);setTimeout(()=>d.remove(),4200)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function formatEffects(e){return Object.entries(e||{}).map(([k,v])=>`${STAT_ICONS[k]} ${v>0?'+':''}${v}`).join(' · ')}

function ensureAudio(){
  if(!state?.settings.sound&&!state?.settings.music)return null;
  try{const AC=window.AudioContext||window.webkitAudioContext;audio.ac=audio.ac||new AC();if(audio.ac.state==='suspended')audio.ac.resume();return audio.ac}catch{return null}
}
function playTone(freq){
  if(!state?.settings.sound)return;const ac=ensureAudio();if(!ac)return;
  try{
    const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain();
    o.type='sine';o2.type='triangle';o.frequency.value=freq;o2.frequency.value=freq*1.5;
    g.gain.setValueAtTime(.03,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.16);
    o.connect(g);o2.connect(g);g.connect(ac.destination);o.start();o2.start();o.stop(ac.currentTime+.16);o2.stop(ac.currentTime+.16);
  }catch{}
}
function tuneDrone(){
  if(!state?.settings.music){stopDrone();return}
  const ac=ensureAudio();if(!ac)return;
  if(!audio.drone){
    const o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
    o.type='sine';o.frequency.value=110;g.gain.value=.012;f.type='lowpass';f.frequency.value=420;
    o.connect(f);f.connect(g);g.connect(ac.destination);o.start();audio.drone={o,g,f};
  }
  let freq=108;
  if(hasFlag('plague_active'))freq=92;
  if(hasFlag('war_active'))freq=128;
  if(hasFlag('void_active')||hasFlag('void_door'))freq=73;
  try{audio.drone.o.frequency.setTargetAtTime(freq,ac.currentTime,.4);audio.drone.g.gain.setTargetAtTime(state.settings.music?0.014:0.0001,ac.currentTime,.5)}catch{}
}
function stopDrone(){if(!audio.drone)return;try{audio.drone.g.gain.setTargetAtTime(.0001,audio.ac.currentTime,.3)}catch{}}

function saveAll(){if(!state)return;localStorage.setItem(SAVE_KEY,JSON.stringify({...state,snapshot:state.mode==='relaxed'?state.snapshot:null}));localStorage.setItem(META_KEY,JSON.stringify(state.meta))}
function loadGame(){
  try{
    const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(SAVE_KEY_V1);
    if(!raw)return false;
    state=patchState(JSON.parse(raw));rng=new RNG(state.seed,state.rngCounter||0);if(!state.ruler)setRuler();applyHouse();return true;
  }catch(e){console.error(e);return false}
}
function startNew(opts={}){
  const dynasty=$('#dynastyInput').value.trim()||'de Valdoria';
  const seed=opts.daily?dailySeed():($('#seedInput').value.trim()||randomSeed());
  const mode=$('#modeSelect').value;
  const meta=loadMeta();
  const house={color:$('#colorInput').value||'#c6a45b',motto:$('#mottoInput').value.trim(),founder:$('#founderInput').value.trim()};
  state=initialState(seed,dynasty,mode,meta,house);
  rng=new RNG(seed);state.rulerGender=pickGender();applyStartPerks();setRuler();applyHouse();saveAll();
  $('#startDialog').close();renderAll();dealCard();tuneDrone();
  toast(opts.daily?'Desafío del día':'La crónica comienza',`${state.ruler} recibe la Corona de Ceniza.`);
}
function exportSave(){saveAll();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`corona-de-ceniza-${state.dynasty.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.json`;a.click();URL.revokeObjectURL(a.href)}
function importSave(file){const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(!s.seed||!s.stats)throw new Error('Formato inválido');state=patchState(s);rng=new RNG(state.seed,state.rngCounter||0);saveAll();$('#menuDialog').close();renderAll();renderCard();toast('Partida importada',`Dinastía ${state.dynasty}`)}catch(e){toast('No se pudo importar',e.message)}};r.readAsText(file)}
function exportBook(){
  const lines=[
    `# ${state.dynasty}`,
    state.house?.motto?`*${state.house.motto}*`: '',
    '',
    `Soberano actual: ${state.ruler}, año ${state.reignYear} del reinado ${roman(state.reign)}.`,
    `Semilla: ${state.seed}`,
    '',
    '## Edictos y obras',
    ...(state.edicts.length?state.edicts.map(e=>`- ${e.name} (año mundial ${e.year})`):['- (ninguno)']),
    '',
    '## Anales',
    ...[...state.history].reverse().map(h=>`- ${h.annal||annalLine(h)}`)
  ].filter(Boolean);
  const blob=new Blob([lines.join('\n')],{type:'text/markdown'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`anales-${state.dynasty.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.md`;a.click();URL.revokeObjectURL(a.href);
}

function openChronicle(){
  const box=$('#chronicleList');
  box.innerHTML=state.history.length?state.history.map(h=>`<div class="chronicle-item"><time>Año ${h.year}</time><div><p>${escapeHtml(h.annal||h.text)}</p><small>${escapeHtml(h.speaker)} · <b>${escapeHtml(h.choice)}</b></small></div></div>`).join(''):'<p class="lead">Todavía no hay decisiones registradas.</p>';
  $('#chronicleDialog').showModal();
}
function sparkSVG(){
  if(!state.samples.length)return '';
  const w=640,h=88,pad=6;
  const xs=state.samples;
  const path=k=>{
    return xs.map((s,i)=>{
      const x=pad+(i/(xs.length-1||1))*(w-pad*2);
      const y=h-pad-(s[k]/100)*(h-pad*2);
      return `${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };
  const colors={pueblo:'#8fbf9c',tesoro:'#d2b777',ejercito:'#c28181',saber:'#8aa0c8'};
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-label="Curva de los cuatro pilares">${STAT_KEYS.map(k=>`<path d="${path(k)}" fill="none" stroke="${colors[k]}" stroke-width="1.6"/>`).join('')}</svg>`;
}
function mapSVG(){
  return `<svg class="map-svg" viewBox="0 0 260 230" role="img" aria-label="Mapa de Valdoria">${REGIONS.map(r=>{
    const on=r.on?r.on(state):false;const hurt=r.hurt?r.hurt(state):false;
    const cls=['region',on?'on':'',hurt?'hurt':''].filter(Boolean).join(' ');
    return `<path class="${cls}" data-id="${r.id}" d="${r.d}"><title>${r.name}</title></path>`;
  }).join('')}<text x="130" y="222" text-anchor="middle" fill="#8f899b" font-size="9" font-family="Georgia">Valdoria y sus orillas</text></svg>`;
}
function renderCodex(tab='achievements'){
  $$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));const box=$('#codexContent');
  if(tab==='achievements')box.innerHTML=ACHIEVEMENTS.map(([id,t,d,i])=>`<div class="achievement ${state.meta.achievements.includes(id)?'unlocked':''}"><div class="badge">${state.meta.achievements.includes(id)?i:'?'}</div><div><b>${state.meta.achievements.includes(id)?t:'Logro oculto'}</b><small>${state.meta.achievements.includes(id)?d:'Seguí gobernando para descubrirlo.'}</small></div></div>`).join('');
  if(tab==='legacy')box.innerHTML=PERKS.map(([id,t,d,cost,icon])=>{const own=state.meta.perks?.includes(id),can=state.meta.legacy>=cost;return `<div class="achievement ${own?'unlocked':''}"><div class="badge">${icon}</div><div><b>${t}</b><small>${d}</small><span class="perk-cost">${own?'Adquirido':cost+' ✧'}</span></div><button class="perk-buy" data-perk="${id}" ${own||!can?'disabled':''}>${own?'Activo':'Adquirir'}</button></div>`}).join('');
  if(tab==='advisors')box.innerHTML=`<div class="advisor-grid">${Object.entries(ADVISORS).map(([id,a])=>{const r=relOf(id);const cls=state.meta.discoveredAdvisors.includes(id)?'':'locked';const mood=r>=18?'ally':r<=-18?'foe':'';return `<div class="advisor-cell ${cls} ${mood}"><b>${state.meta.discoveredAdvisors.includes(id)?a.glyph+' '+a.name:'? Desconocido'}</b><small>${state.meta.discoveredAdvisors.includes(id)?a.title:'Todavía no llegó a tu corte.'}</small>${state.meta.discoveredAdvisors.includes(id)?`<span class="rel">Afinidad: ${r>0?'+':''}${r}${r>=18?' · aliado':r<=-18?' · enemigo':''}</span>`:''}</div>`}).join('')}</div>`;
  if(tab==='edicts'){
    const list=state.edicts.length?state.edicts.map(e=>`<div class="edict"><b>${escapeHtml(e.name)}</b><div>Año mundial ${e.year}</div></div>`).join(''):'<p class="lead">Todavía no hay edictos. Construí, firmá, casá.</p>';
    const flags=Object.entries(EDICT_LABELS).filter(([id])=>hasFlag(id)).map(([,n])=>n);
    box.innerHTML=list+(flags.length?`<p class="lead">El reino recuerda: ${flags.join(', ')}.</p>`:'');
  }
  if(tab==='map'){
    const legend=REGIONS.map(r=>{
      const hurt=r.hurt&&r.hurt(state);
      const on=r.on&&r.on(state);
      const status=r.id==='capital'?(hurt?'herida':'sede de la corona'):hurt?'herido':on?'marcado en el estandarte':'en calma';
      return `<div><b>${r.name}</b> — ${status}</div>`;
    }).join('');
    box.innerHTML=`<div class="map-wrap">${mapSVG()}<div class="map-legend">${legend}<p>Vecinos: ${NEIGHBOR_KEYS.map(k=>`${NEIGHBOR_LABELS[k]} ${Math.round(state.neighbors[k])}`).join(' · ')}</p><p>Facciones: ${FACTION_KEYS.map(k=>`${FACTION_LABELS[k]} ${Math.round(state.factions[k])}`).join(' · ')}</p></div></div>`;
  }
  if(tab==='secrets')box.innerHTML=state.meta.secrets.length?state.meta.secrets.map(s=>`<div class="secret found"><b>✦ ${escapeHtml(s)}</b></div>`).join(''):'<p class="lead">Los secretos no se anuncian. Se encuentran.</p>';
  if(tab==='stats'){
    const rows=[['Dinastía',state.dynasty],['Lema',state.house?.motto||'—'],['Años de historia',state.worldYear],['Reinados completados',state.meta.totalReigns],['Decisiones totales',state.meta.totalDecisions],['Mejor reinado',state.meta.bestReign+' años'],['Edad del soberano',Math.round(state.rulerAge)],['Clemencia / razón',`${state.personality.clemencia} / ${state.personality.razon}`],['Legado',state.meta.legacy+' ✧'],['Finales',`${state.meta.endings.length}/${SPECIAL_ENDINGS.length}`],['Cartas escritas',CARDS.length],['Consecuencias pendientes',state.delayed.length],['Corrupción',Math.round(state.hidden.corrupcion)],['Salud pública',Math.round(state.hidden.salud)],['Inteligencia',Math.round(state.hidden.inteligencia)],['Packs NG+',(state.meta.packs||[]).join(', ')||'—']];
    box.innerHTML=sparkSVG()+rows.map(([a,b])=>`<div class="stat-table"><span>${a}</span><b>${escapeHtml(String(b))}</b></div>`).join('');
  }
}
function buyPerk(id){const p=PERKS.find(x=>x[0]===id);if(!p)return;state.meta.perks=state.meta.perks||[];if(state.meta.perks.includes(id)||state.meta.legacy<p[3])return;state.meta.legacy-=p[3];state.meta.perks.push(id);saveAll();renderHeader();renderCodex('legacy');toast('Legado adquirido',p[1])}

function showEnding(e){
  $('#endingTitle').textContent=e.title;$('#endingText').textContent=e.text;
  $('#endingSummary').innerHTML=`<b>${state.ruler}</b> alcanzó este destino en el año ${state.reignYear} de su reinado.`;
  $('#endingSealBtn').classList.toggle('hidden',false);
  $('#endingContinueBtn').classList.toggle('hidden',!!e.terminal);
  $('#endingDialog').dataset.terminal=e.terminal?'1':'0';
  $('#endingDialog').showModal();
}
function sealChronicle(){
  $('#endingDialog').close();
  state.sealed=true;saveAll();
  $('#sealedText').textContent=`${state.dynasty}${state.house?.motto?': “'+state.house.motto+'”':''}. ${state.ruler} cierra el libro en el año ${state.worldYear} de Valdoria. ${rumorOfDead()}`;
  $('#sealedDialog').showModal();
}

function parseURL(){
  const q=new URLSearchParams(location.search);
  if(q.get('seed'))$('#seedInput').value=q.get('seed');
  if(q.get('mode')&&['normal','relaxed','harsh','chaos'].includes(q.get('mode')))$('#modeSelect').value=q.get('mode');
  return q.get('daily')==='1';
}

function bind(){
  $('#startBtn').onclick=()=>startNew();
  $('#dailyBtn').onclick=()=>startNew({daily:true});
  $('#continueBtn').onclick=()=>{if(loadGame()){ $('#startDialog').close();renderAll();if(!state.currentCard)dealCard();else renderCard();tuneDrone()}};
  $('#menuBtn').onclick=$('#brandBtn').onclick=()=>$('#menuDialog').showModal();
  $('#helpBtn').onclick=()=>$('#helpDialog').showModal();
  $('#resumeBtn').onclick=()=>$('#menuDialog').close();
  $('#undoBtn').onclick=()=>{$('#menuDialog').close();undoLast()};
  $('#saveBtn').onclick=()=>{saveAll();toast('Guardado','La crónica quedó almacenada en este navegador.')};
  $('#exportBtn').onclick=exportSave;$('#importBtn').onclick=()=>$('#importFile').click();
  $('#importFile').onchange=e=>e.target.files[0]&&importSave(e.target.files[0]);
  $('#newGameBtn').onclick=()=>{if(confirm('¿Fundar una nueva dinastía? El progreso meta (logros y legado) se conserva.')){localStorage.removeItem(SAVE_KEY);$('#menuDialog').close();$('#continueBtn').classList.add('hidden');$('#startDialog').showModal()}};
  el.soundToggle.onchange=e=>{state.settings.sound=e.target.checked;saveAll()};
  el.hintToggle.onchange=e=>{state.settings.hints=e.target.checked;saveAll();renderCard()};
  el.musicToggle.onchange=e=>{state.settings.music=e.target.checked;saveAll();if(e.target.checked)tuneDrone();else stopDrone()};
  el.motionToggle.onchange=e=>{state.settings.reduceMotion=e.target.checked;saveAll();renderHeader()};
  $$('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
  $('#leftBtn').onclick=()=>choose('left');$('#rightBtn').onclick=()=>choose('right');
  $('#consultBtn').onclick=consultCouncil;
  $('#chronicleBtn').onclick=openChronicle;$('#exportBookBtn').onclick=exportBook;
  $('#codexBtn').onclick=()=>{renderCodex();$('#codexDialog').showModal()};
  $$('.tab').forEach(b=>b.onclick=()=>renderCodex(b.dataset.tab));
  $('#codexContent').addEventListener('click',e=>{const b=e.target.closest('[data-perk]');if(b)buyPerk(b.dataset.perk)});
  $('#nextReignBtn').onclick=nextReign;
  $('#endingContinueBtn').onclick=()=>{$('#endingDialog').close();dealCard()};
  $('#endingSealBtn').onclick=sealChronicle;
  $('#sealedExportBtn').onclick=exportBook;
  $('#sealedNewBtn').onclick=()=>{localStorage.removeItem(SAVE_KEY);$('#sealedDialog').close();$('#startDialog').showModal()};
  $('#confirmNo').onclick=()=>{$('#confirmDialog').close();state.pendingSide=null};
  $('#confirmYes').onclick=()=>{const s=state.pendingSide;$('#confirmDialog').close();if(s)choose(s,{confirmed:true})};
  el.card.addEventListener('pointerdown',e=>{if(!state||state.busy)return;drag={active:true,startX:e.clientX,x:e.clientX};el.card.setPointerCapture(e.pointerId);el.card.classList.add('dragging');ensureAudio()});
  el.card.addEventListener('pointermove',e=>drag.active&&updateDrag(e.clientX));
  el.card.addEventListener('pointerup',endDrag);el.card.addEventListener('pointercancel',endDrag);
  document.addEventListener('keydown',e=>{
    if(e.key==='?'||(e.key==='/'&&e.shiftKey)){$('#helpDialog').showModal();return}
    if(!state||document.querySelector('dialog[open]'))return;
    if(e.key==='ArrowLeft')choose('left');
    if(e.key==='ArrowRight')choose('right');
    if(e.key==='z'||e.key==='Z')undoLast();
    if(e.key==='c'||e.key==='C')consultCouncil();
  });
}

function registerPWA(){if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{})}

function boot(){
  cacheEls();bind();
  const daily=parseURL();
  const has=!!(localStorage.getItem(SAVE_KEY)||localStorage.getItem(SAVE_KEY_V1));
  $('#continueBtn').classList.toggle('hidden',!has);
  if(daily){$('#seedInput').value=dailySeed();$('#startDialog').showModal()}
  else $('#startDialog').showModal();
  registerPWA();
}
boot();
