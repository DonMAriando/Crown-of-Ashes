'use strict';

const Score=(function(){
  let ac=null,master=null,filter=null,voices=[],mode='',lfo=null;
  function ctx(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      ac=ac||new AC();
      if(ac.state==='suspended')ac.resume();
      if(!master){
        master=ac.createGain();master.gain.value=0.0001;
        filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=520;filter.Q.value=.7;
        filter.connect(master);master.connect(ac.destination);
      }
      return ac;
    }catch{return null}
  }
  function now(){return ac?ac.currentTime:0}
  function clearVoices(){
    voices.forEach(n=>{try{if(n.gain)n.gain.gain.setTargetAtTime(.0001,now(),.08);if(n.stop)n.stop(now()+.25)}catch{}});
    voices=[];
    if(lfo){try{lfo.stop()}catch{}lfo=null}
  }
  function osc(type,freq,gain,dest){
    const o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.value=freq;g.gain.value=gain;
    o.connect(g);g.connect(dest||filter);o.start();
    voices.push(o,g);return {o,g};
  }
  function noiseBurst(dur,amp,hp){
    if(!ctx())return;
    const n=ac.createBufferSource(),buf=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate);
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
  const beds={
    court(){osc('sine',110,.018);osc('sine',164.81,.008);osc('triangle',329.63,.0035);filter.frequency.value=500},
    winter(){osc('sine',98,.016);osc('sine',146.83,.007);osc('sine',196,.003);filter.frequency.value=360},
    plague(){osc('sine',92,.014);osc('sine',93.7,.01);osc('triangle',184,.003);filter.frequency.value=280},
    war(){osc('sawtooth',130.81,.006);osc('sine',196,.01);osc('sine',65.41,.012);filter.frequency.value=620},
    void(){osc('sine',73.42,.016);osc('sine',110,.006);osc('sine',146.83,.002);filter.frequency.value=220},
    plot(){
      osc('sine',138.59,.01);osc('sine',207.65,.005);osc('triangle',55,.014);
      const {g}=osc('sine',220,.004);
      lfo=ac.createOscillator();const lg=ac.createGain();lfo.frequency.value=1.15;lg.gain.value=.003;
      lfo.connect(lg);lg.connect(g.gain);lfo.start();voices.push(lfo,lg);
      filter.frequency.value=440;
    }
  };
  function setBed(name,on){
    if(!on){if(master)master.gain.setTargetAtTime(.0001,now(),.4);return}
    if(!ctx())return;
    if(mode!==name){clearVoices();mode=name;(beds[name]||beds.court)()}
    master.gain.setTargetAtTime(.055,now(),.6);
  }
  function tick(state){
    if(!state?.settings?.music){setBed(mode,false);return}
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
    pluck(dir==='right'?523.25:329.63,.18,.045);
    pluck(dir==='right'?659.25:246.94,.22,.02);
    noiseBurst(.09,.04,1200);
  }
  function deal(){if(!ctx())return;pluck(392,.14,.03);pluck(587.33,.2,.018)}
  function stamp(){if(!ctx())return;pluck(98,.28,.06);noiseBurst(.12,.07,400)}
  function year(){if(!ctx())return;pluck(523.25,.4,.035);pluck(784,.5,.018)}
  function consult(){if(!ctx())return;pluck(415.3,.25,.03);pluck(622.25,.3,.016)}
  function death(){
    if(!ctx())return;
    [220,174.61,146.83,110].forEach((f,i)=>{
      setTimeout(()=>pluck(f,.55,.05),i*160);
    });
    noiseBurst(.4,.05,200);
  }
  function foil(){if(!ctx())return;pluck(523.25,.2,.04);pluck(659.25,.25,.03);pluck(783.99,.4,.025)}
  return {ctx,tick,swipe,deal,stamp,year,consult,death,foil,setBed};
})();
