'use strict';

const Score=(function(){
  let ac=null,allowMusic=true,bed=null,bedName='',pending='',gen=0,stinger=null;
  const LOOPS={court:1,winter:1,plague:1,war:1,void:1,plot:1,coronation:1};
  const VOL=.34;

  function ctx(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      ac=ac||new AC();
      if(ac.state==='suspended')ac.resume();
      return ac;
    }catch{return null}
  }
  function now(){return ac?ac.currentTime:0}
  function extPref(){
    const a=document.createElement('audio');
    const opus=a.canPlayType('audio/ogg; codecs=opus')||a.canPlayType('audio/opus');
    return opus?'opus':'mp3';
  }
  function srcFor(name,ext){return 'musica/'+name+'.'+(ext||extPref())}
  function holder(){
    let h=document.getElementById('scoreBeds');
    if(!h){h=document.createElement('div');h.id='scoreBeds';h.hidden=true;document.body.appendChild(h)}
    return h;
  }
  function makeEl(name,loop){
    const el=document.createElement('audio');
    el.preload='auto';el.loop=!!loop;el.volume=0;el.setAttribute('data-bed',name);
    let ext=extPref();
    el.src=srcFor(name,ext);
    el.addEventListener('error',()=>{
      if(ext==='opus'){ext='mp3';el.src=srcFor(name,'mp3');el.load()}
    },{once:true});
    holder().appendChild(el);
    return el;
  }
  function fade(el,to,ms,done){
    if(!el){if(done)done();return}
    if(el._fade)clearInterval(el._fade);
    const from=el.volume,t0=performance.now();
    el._fade=setInterval(()=>{
      const p=Math.min(1,(performance.now()-t0)/ms);
      try{el.volume=Math.max(0,from+(to-from)*p)}catch{}
      if(p>=1){clearInterval(el._fade);el._fade=null;if(done)done()}
    },40);
  }
  function stopEl(el){if(!el)return;try{if(el._fade)clearInterval(el._fade);el.pause();el.removeAttribute('src');el.load();el.remove()}catch{}}
  function haltBed(){
    gen++;pending='';
    stopEl(bed);bed=null;bedName='';
    stopEl(stinger);stinger=null;
  }
  function applyBed(name){
    name=name||'court';
    if(name===bedName||name===pending){
      if(bed&&bed.paused)bed.play().catch(()=>{});
      return;
    }
    pending=name;
    const my=++gen;
    const el=makeEl(name,!!LOOPS[name]);
    const start=()=>{
      if(my!==gen){stopEl(el);return}
      const prev=bed;
      bed=el;bedName=name;pending='';
      el.play().then(()=>fade(el,VOL,480)).catch(()=>{});
      if(prev&&prev!==el)fade(prev,0,420,()=>stopEl(prev));
    };
    if(el.readyState>=3)start();
    else el.addEventListener('canplay',start,{once:true});
  }
  function setBed(name,on){
    if(!on){allowMusic=false;haltBed();return}
    allowMusic=true;
    applyBed(name||'court');
  }
  function tick(state){
    allowMusic=!!state?.settings?.music;
    if(!allowMusic){haltBed();return}
    let name='court';
    if(state.season===3)name='winter';
    if(state.flags?.includes('plague_active'))name='plague';
    if(state.flags?.includes('war_active')||state.flags?.includes('mutiny_on'))name='war';
    if(state.flags?.includes('void_active')||state.flags?.includes('void_door'))name='void';
    if(state.flags?.includes('plot_active')||state.flags?.includes('plot_named'))name='plot';
    applyBed(name);
  }
  function playOne(name){
    stopEl(stinger);
    const el=makeEl(name,false);
    stinger=el;
    el.volume=VOL;
    const go=()=>el.play().catch(()=>{});
    if(el.readyState>=3)go();
    else el.addEventListener('canplay',go,{once:true});
  }
  function noiseBurst(dur,amp,hp){
    if(!ctx())return;
    const n=ac.createBufferSource(),buf=ac.createBuffer(1,Math.max(1,ac.sampleRate*dur),ac.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*amp;
    n.buffer=buf;
    const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=hp||800;
    const g=ac.createGain();g.gain.setValueAtTime(amp,now());g.gain.exponentialRampToValueAtTime(.0001,now()+dur);
    n.connect(f);f.connect(g);g.connect(ac.destination);n.start();n.stop(now()+dur+.02);
  }
  function pluck(freq,dur,amp){
    if(!ctx())return;
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='triangle';o.frequency.value=freq;
    g.gain.setValueAtTime(amp,now());g.gain.exponentialRampToValueAtTime(.0001,now()+dur);
    o.connect(g);g.connect(ac.destination);o.start();o.stop(now()+dur+.05);
  }
  function swipe(dir){
    if(!ctx())return;
    pluck(dir==='right'?523.25:329.63,.2,.07);
    pluck(dir==='right'?659.25:246.94,.26,.03);
  }
  function deal(){if(!ctx())return;pluck(392,.16,.045);pluck(587.33,.22,.022)}
  function stamp(){if(!ctx())return;pluck(98,.3,.08);noiseBurst(.1,.05,350)}
  function year(){if(!ctx())return;pluck(523.25,.4,.05);pluck(784,.5,.022)}
  function consult(){if(!ctx())return;pluck(415.3,.26,.045);pluck(622.25,.32,.022)}
  function death(){
    haltBed();
    if(allowMusic){playOne('death');return}
    if(!ctx())return;
    [220,174.61,146.83,110].forEach((f,i)=>{setTimeout(()=>pluck(f,.6,.07),i*160)});
  }
  function foil(){if(!ctx())return;pluck(523.25,.2,.06);pluck(659.25,.26,.04);pluck(783.99,.4,.03)}
  return {ctx,tick,swipe,deal,stamp,year,consult,death,foil,setBed};
})();
