'use strict';

const Score=(function(){
  let ac=null,master=null,filter=null,voices=[],mode='',lfo=null,seq=null,step=0;
  const phrases={
    court:[196,220,246.94,261.63,293.66,246.94,220,174.61],
    winter:[174.61,196,220,196,164.81,146.83,164.81,174.61],
    plague:[155.56,174.61,185,174.61,146.83,138.59],
    war:[196,233.08,261.63,233.08,196,155.56,196,233.08],
    void:[146.83,164.81,174.61,196,174.61,130.81],
    plot:[207.65,246.94,277.18,233.08,207.65,185,207.65]
  };
  function ctx(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      ac=ac||new AC();
      if(!master){
        master=ac.createGain();master.gain.value=0.0001;
        filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;filter.Q.value=.6;
        filter.connect(master);master.connect(ac.destination);
      }
      if(ac.state==='suspended')ac.resume();
      return ac;
    }catch{return null}
  }
  function now(){return ac?ac.currentTime:0}
  function clearVoices(){
    voices.forEach(n=>{try{if(n.gain)n.gain.gain.setTargetAtTime(.0001,now(),.05);if(n.stop)n.stop(now()+.18)}catch{}});
    voices=[];
    if(lfo){try{lfo.stop()}catch{}lfo=null}
  }
  function stopSeq(){if(seq){clearInterval(seq);seq=null}}
  function osc(type,freq,gain,dest){
    const o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.value=freq;g.gain.value=gain;
    o.connect(g);g.connect(dest||filter);o.start();
    voices.push(o,g);return {o,g};
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
  function phraseNote(freq){
    if(!ac||!filter)return;
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='sine';o.frequency.value=freq;
    g.gain.setValueAtTime(.0001,now());
    g.gain.exponentialRampToValueAtTime(.07,now()+.04);
    g.gain.exponentialRampToValueAtTime(.0001,now()+1.15);
    o.connect(g);g.connect(filter);o.start();o.stop(now()+1.2);
    const o2=ac.createOscillator(),g2=ac.createGain();
    o2.type='triangle';o2.frequency.value=freq*2;
    g2.gain.setValueAtTime(.0001,now());
    g2.gain.exponentialRampToValueAtTime(.018,now()+.03);
    g2.gain.exponentialRampToValueAtTime(.0001,now()+.9);
    o2.connect(g2);g2.connect(filter);o2.start();o2.stop(now()+.95);
  }
  function startSeq(name){
    stopSeq();step=0;
    const notes=phrases[name]||phrases.court;
    const beat=()=>{if(!ac||ac.state!=='running')return;phraseNote(notes[step%notes.length]);step++};
    beat();
    seq=setInterval(beat,name==='war'?920:name==='plot'?1100:1320);
  }
  const beds={
    court(){osc('sine',98,.012);osc('sine',146.83,.008);filter.frequency.value=880},
    winter(){osc('sine',87.31,.01);osc('sine',130.81,.006);filter.frequency.value=720},
    plague(){osc('sine',82.41,.01);osc('sine',123.47,.005);filter.frequency.value=640},
    war(){osc('sine',116.54,.012);osc('triangle',174.61,.006);filter.frequency.value=1100},
    void(){osc('sine',73.42,.012);osc('sine',110,.005);filter.frequency.value=560},
    plot(){osc('sine',103.83,.01);osc('sine',155.56,.006);filter.frequency.value=900}
  };
  function breathe(){
    if(!filter||!ac)return;
    lfo=ac.createOscillator();const lg=ac.createGain();
    lfo.frequency.value=.08;lg.gain.value=180;
    lfo.connect(lg);lg.connect(filter.frequency);lfo.start();voices.push(lfo,lg);
  }
  function haltBed(){
    stopSeq();
    clearVoices();
    mode='';
    if(master)master.gain.setTargetAtTime(.0001,now(),.2);
  }
  function applyBed(name){
    if(mode!==name||!seq){
      clearVoices();stopSeq();mode=name;
      (beds[name]||beds.court)();breathe();startSeq(name);
    }
    if(master)master.gain.setTargetAtTime(.22,now(),.3);
  }
  function setBed(name,on){
    if(!on){haltBed();return}
    if(!ctx())return;
    const go=()=>applyBed(name||'court');
    if(ac.state==='suspended')ac.resume().then(go).catch(()=>{});
    else go();
  }
  function tick(state){
    if(!state?.settings?.music){setBed(mode||'court',false);return}
    let name='court';
    if(state.season===3)name='winter';
    if(state.flags?.includes('plague_active'))name='plague';
    if(state.flags?.includes('war_active')||state.flags?.includes('mutiny_on'))name='war';
    if(state.flags?.includes('void_active')||state.flags?.includes('void_door'))name='void';
    if(state.flags?.includes('plot_active')||state.flags?.includes('plot_named'))name='plot';
    setBed(name,true);
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
    if(!ctx())return;
    stopSeq();mode='';
    [220,174.61,146.83,110].forEach((f,i)=>{setTimeout(()=>pluck(f,.6,.07),i*160)});
  }
  function foil(){if(!ctx())return;pluck(523.25,.2,.06);pluck(659.25,.26,.04);pluck(783.99,.4,.03)}
  return {ctx,tick,swipe,deal,stamp,year,consult,death,foil,setBed};
})();
