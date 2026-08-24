const game=document.getElementById("game"),player=document.getElementById("player");
const layer=document.getElementById("fallingLayer"),pointsLayer=document.getElementById("pointsLayer");
const scoreEl=document.getElementById("scoreValue"),bestEl=document.getElementById("bestValue");
const livesEl=document.getElementById("livesValue"),levelEl=document.getElementById("levelValue");
const startOverlay=document.getElementById("startOverlay"),pauseOverlay=document.getElementById("pauseOverlay"),endOverlay=document.getElementById("gameOverOverlay");
const finalScore=document.getElementById("finalScore");
let x=innerWidth/2,score=0,best=3250,lives=3,level=3,running=false,paused=false,last=0,spawn=0,raf=0;
let items=[],keys={},musicOn=true,sfxOn=true,audio=null,musicTimer=null;
const flowers=["🌸","🌼","🌺","🌻","🌷","💮"];

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rand=(a,b)=>a+Math.random()*(b-a);

function moveGirl(v){x=clamp(v,90,innerWidth-90);player.style.left=x+"px"}
function render(){
  scoreEl.textContent=score;bestEl.textContent=Math.max(best,score);levelEl.textContent=level;
  livesEl.innerHTML=[0,1,2].map(i=>`<span style="opacity:${i<lives?1:.2}">♥</span>`).join("");
}
function sfx(freq=700,d=.08){
  if(!sfxOn)return;
  try{
    audio=audio||new(window.AudioContext||window.webkitAudioContext)();
    if(audio.state==="suspended")audio.resume();
    const o=audio.createOscillator(),g=audio.createGain();
    o.type="triangle";o.frequency.value=freq;g.gain.value=.045;
    g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);
    o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d);
  }catch(e){}
}
function startMusic(){
  if(!musicOn)return;
  try{
    audio=audio||new(window.AudioContext||window.webkitAudioContext)();
    if(audio.state==="suspended")audio.resume();
    clearInterval(musicTimer);
    const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];
    let i=0;
    musicTimer=setInterval(()=>{if(running&&!paused&&musicOn)sfx(notes[i++%notes.length],.18)},450);
  }catch(e){}
}
function spawnFlower(){
  const e=document.createElement("div"),isDrop=Math.random()<.18;
  e.className="falling";e.textContent=isDrop?"💧":flowers[(Math.random()*flowers.length)|0];
  layer.appendChild(e);
  const px=rand(innerWidth*.12,innerWidth*.88);
  items.push({e,x:px,y:-70,v:125+Math.random()*70+level*8,isDrop});
}
function popup(text,px,py,cls="point"){
  const e=document.createElement("div");e.className=cls;e.textContent=text;e.style.left=px+"px";e.style.top=py+"px";
  pointsLayer.appendChild(e);setTimeout(()=>e.remove(),760);
}
function basketHit(o){
  // Match the visible basket at the right side of the supplied girl image.
  const basketX=x+75, basketY=innerHeight*.88;
  return Math.abs(o.x-basketX)<68 && o.y>basketY-75 && o.y<basketY+25;
}
function clearItems(){items.forEach(o=>o.e.remove());items=[]}
function update(t){
  raf=requestAnimationFrame(update);if(!running||paused)return;
  const dt=Math.min((t-last)/1000,.04);last=t;
  if(keys.ArrowLeft||keys.a)moveGirl(x-520*dt);
  if(keys.ArrowRight||keys.d)moveGirl(x+520*dt);
  spawn+=dt;
  if(spawn>Math.max(.42,.8-level*.035)){spawn=0;spawnFlower()}
  for(let i=items.length-1;i>=0;i--){
    const o=items[i];o.y+=o.v*dt;
    o.e.style.transform=`translate3d(${o.x}px,${o.y}px,0) translateX(-50%)`;
    if(basketHit(o)){
      o.e.remove();items.splice(i,1);
      if(o.isDrop){
        lives--;render();popup("💧 Avoid! ",o.x,o.y,"miss");sfx(180,.16);
        if(lives<=0)finish();
      }else{
        const add=50;score+=add;best=Math.max(best,score);
        level=3+Math.floor(Math.max(0,score-1250)/300);
        render();popup("+"+add,o.x,o.y);sfx(850,.09);
      }
    }else if(o.y>innerHeight+80){o.e.remove();items.splice(i,1)}
  }
}
function start(){
  clearItems();score=0;lives=3;level=3;render();running=true;paused=false;
  startOverlay.classList.add("hidden");pauseOverlay.classList.add("hidden");endOverlay.classList.add("hidden");
  moveGirl(innerWidth/2);startMusic();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(update);
}
function finish(){running=false;paused=false;clearItems();finalScore.textContent=score;endOverlay.classList.remove("hidden");sfx(500,.2)}
function pause(){
  if(!running)return;paused=!paused;pauseOverlay.classList.toggle("hidden",!paused);
  if(!paused){last=performance.now();raf=requestAnimationFrame(update)}
}
game.addEventListener("pointermove",e=>{if(running&&!paused)moveGirl(e.clientX)});
game.addEventListener("pointerdown",e=>{if(running&&!paused){moveGirl(e.clientX);if(audio&&audio.state==="suspended")audio.resume()}});
addEventListener("keydown",e=>{keys[e.key]=true;if(e.key===" "||e.key==="Escape")pause()});
addEventListener("keyup",e=>keys[e.key]=false);
addEventListener("resize",()=>moveGirl(x));
document.getElementById("startBtn").onclick=start;
document.getElementById("againBtn").onclick=start;
document.getElementById("resumeBtn").onclick=pause;
document.getElementById("pauseBtn").onclick=pause;
document.getElementById("musicBtn").onclick=()=>{musicOn=!musicOn;document.getElementById("musicBtn").textContent=musicOn?"♫":"×";if(musicOn)startMusic()};
document.getElementById("soundBtn").onclick=()=>{sfxOn=!sfxOn;document.getElementById("soundBtn").textContent=sfxOn?"🔊":"🔇"};
render();moveGirl(innerWidth/2);
