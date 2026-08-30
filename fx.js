'use strict';

const CourtFx=(function(){
  let canvas=null,ctx=null,parts=[],mood='',quiet=false,raf=0,W=0,H=0;
  let cx=.5,cy=.44,tcx=.5,tcy=.44,amb=0;

  function reduced(){
    return quiet||(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function finePointer(){
    return typeof matchMedia==='function'&&matchMedia('(hover: hover) and (pointer: fine)').matches;
  }
  function cardPoint(){
    const card=document.getElementById('card');
    if(!card)return {x:W*.5,y:H*.52};
    const r=card.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height*.42};
  }
  function size(){
    if(!canvas||!ctx)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    W=window.innerWidth;H=window.innerHeight;
    canvas.width=Math.max(1,W*dpr);canvas.height=Math.max(1,H*dpr);
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function applyCandle(){
    const bg=document.getElementById('kingdomBg');
    if(!bg)return;
    if(reduced()||!finePointer()){
      bg.style.setProperty('--cx','50%');
      bg.style.setProperty('--cy','44%');
      return;
    }
    cx+=(tcx-cx)*.14;cy+=(tcy-cy)*.14;
    bg.style.setProperty('--cx',(cx*100).toFixed(2)+'%');
    bg.style.setProperty('--cy',(cy*100).toFixed(2)+'%');
  }
  function onMove(e){
    if(!finePointer()||reduced()||!W)return;
    tcx=e.clientX/W;tcy=e.clientY/H;
    kick();
  }
  function spawn(n,make){
    if(reduced())return;
    const room=140-parts.length;
    n=Math.min(n,Math.max(0,room));
    for(let i=0;i<n;i++)parts.push(make(i));
    kick();
  }
  function swipe(side,x,y){
    const gold=side==='right';
    const pal=gold?[[210,183,119],[236,214,156]]:[[78,70,64],[132,120,108]];
    const dir=gold?1:-1;
    const p=x==null?cardPoint():{x,y};
    spawn(20,()=>{
      const c=pal[Math.random()>.55?1:0];
      return {x:p.x,y:p.y,vx:(Math.random()*2.4+.5)*dir,vy:-(Math.random()*2.2+.15),life:1,decay:.02+Math.random()*0.02,r:1.1+Math.random()*2.1,col:c,g:.38};
    });
  }
  function deal(x,y){
    const p=x==null?cardPoint():{x,y};
    spawn(9,()=>({x:p.x+(Math.random()-.5)*36,y:p.y+18,vx:(Math.random()-.5)*1.1,vy:-(Math.random()*1.5+.35),life:1,decay:.032,r:1+Math.random()*1.5,col:[232,214,176],g:.42}));
  }
  function death(){
    document.body.classList.add('hall-dim');
    if(reduced())return;
    spawn(64,()=>({x:Math.random()*W,y:-8-Math.random()*90,vx:(Math.random()-.5)*.32,vy:.4+Math.random()*1.05,life:1,decay:.0055+Math.random()*0.004,r:1+Math.random()*2.3,col:[36,32,28],g:.58,ash:1}));
  }
  function lift(){document.body.classList.remove('hall-dim')}
  function setMood(m){mood=m||'';if(mood)kick()}
  function setQuiet(on){quiet=!!on;if(reduced())parts=parts.filter(p=>!p.amb)}
  function ambient(){
    if(reduced()||!mood||document.hidden)return;
    let n=0;for(const p of parts)if(p.amb)n++;
    if(n>=16)return;
    const pal={plague:[[86,138,98],[150,186,148]],war:[[158,58,48],[78,28,24]],void:[[68,48,118],[28,22,48]]}[mood];
    if(!pal)return;
    const c=pal[Math.random()>.5?1:0];
    parts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.14,vy:-.06-Math.random()*.1,life:1,decay:.0038,r:.7+Math.random()*1.5,col:c,g:.2,amb:1});
  }
  function tick(){
    raf=0;
    applyCandle();
    if(mood&&(++amb%20===0))ambient();
    if(ctx){
      ctx.clearRect(0,0,W,H);
      let i=0;
      while(i<parts.length){
        const p=parts[i];
        p.x+=p.vx;p.y+=p.vy;p.vy+=p.ash?.011:.009;p.life-=p.decay;
        if(p.life<=0){parts.splice(i,1);continue}
        ctx.beginPath();
        ctx.fillStyle=`rgba(${p.col[0]},${p.col[1]},${p.col[2]},${(p.life*p.g).toFixed(3)})`;
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fill();
        i++;
      }
    }
    const need=parts.length||(finePointer()&&!reduced())||(!!mood&&!reduced());
    if(need&&!document.hidden)raf=requestAnimationFrame(tick);
  }
  function kick(){if(!raf&&!document.hidden)raf=requestAnimationFrame(tick)}
  function init(){
    canvas=document.getElementById('courtFx');
    if(!canvas){
      canvas=document.createElement('canvas');
      canvas.id='courtFx';
      canvas.setAttribute('aria-hidden','true');
      document.body.appendChild(canvas);
    }
    ctx=canvas.getContext('2d',{alpha:true});
    size();applyCandle();
    window.addEventListener('resize',size,{passive:true});
    window.addEventListener('pointermove',onMove,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}else kick()});
    kick();
  }
  return {init,swipe,deal,death,lift,setMood,setQuiet};
})();
