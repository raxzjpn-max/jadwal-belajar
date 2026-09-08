const examDate = new Date(2026,11,6,23,59,59);
const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
let doneDays = JSON.parse(localStorage.getItem("jlptDoneDays") || "[]");

function dateKey(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function startOfDay(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }

function shinkanzenPlan(date){
  const m = date.getMonth(); // 8=Sep, 9=Oct, 10=Nov, 11=Dec
  const d = date.getDate();

  // September–October: tuntaskan materi.
  // November: hanya latihan soal.
  // 1–5 Desember: review ringan. 6 Desember: hari ujian/target akhir.
  if (m === 10) {
    const weekly = [
      "Mojigoi + Goi",
      "Bunpou soal",
      "Dokkai",
      "Choukai",
      "Campuran",
      "Analisis salah",
      "Mini Mock Test"
    ];
    return {chapter:"Latihan Soal", part:weekly[(d-1)%7]};
  }

  if (m === 11) {
    if (d === 6) return {chapter:"JLPT N3", part:"Hari H"};
    if (d <= 5) return {chapter:"Review Ringan", part:"Kesalahan penting"};
    return {chapter:"Selesai", part:""};
  }

  if (m === 8 || m === 9) {
    // Review mingguan agar materi tetap melekat
    if ([7,14,21,28].includes(d)) return {chapter:"Review Shinkanzen", part:"Ulang materi minggu ini"};

    // Bab berjalan terus dari September sampai Oktober
    const start = new Date(2026,8,1);
    const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let studyDay = 0;
    for (let x = new Date(start); x <= current; x.setDate(x.getDate()+1)) {
      if (![7,14,21,28].includes(x.getDate())) studyDay++;
    }
    const chapter = Math.ceil(studyDay/2);
    const part = studyDay % 2 === 1 ? "Bagian 1" : "Bagian 2";
    return {chapter:`Shinkanzen Bab ${chapter}`, part};
  }

  return {chapter:"Persiapan", part:""};
}

function updateCountdown(){
  const now=new Date();
  let diff=Math.max(0,examDate-now);
  const days=Math.floor(diff/86400000); diff%=86400000;
  const hours=Math.floor(diff/3600000); diff%=3600000;
  const minutes=Math.floor(diff/60000); diff%=60000;
  const seconds=Math.floor(diff/1000);
  daysLeft.textContent=days; hoursLeft.textContent=hours; minutesLeft.textContent=minutes; secondsLeft.textContent=seconds;
}

function renderCalendar(){
  const now=new Date(), year=now.getFullYear(), month=now.getMonth();
  monthTitle.textContent=`${monthNames[month]} ${year}`;
  calendar.innerHTML="";
  const first=new Date(year,month,1), lastDay=new Date(year,month+1,0).getDate();

  for(let i=0;i<first.getDay();i++){
    const e=document.createElement("div"); e.className="day empty"; calendar.appendChild(e);
  }

  for(let d=1;d<=lastDay;d++){
    const dt=new Date(year,month,d), key=dateKey(dt), plan=shinkanzenPlan(dt);
    const cell=document.createElement("button");
    cell.type="button"; cell.className="day";
    if(startOfDay(dt)<startOfDay(now)) cell.classList.add("past");
    if(sameDay(dt,now)) cell.classList.add("today");
    if(doneDays.includes(key)) cell.classList.add("done");
    if(sameDay(dt,examDate)) cell.classList.add("examday");

    if (month === 10) {
      cell.innerHTML=`<div class="num">${d}</div><div class="mini">${plan.part}<br>Latihan soal</div>`;
    } else if (month === 11) {
      cell.innerHTML=`<div class="num">${d}</div><div class="mini">${plan.chapter}<br>${plan.part}</div>`;
    } else {
      cell.innerHTML=`<div class="num">${d}</div><div class="mini">20 kotoba<br>${plan.chapter.replace("Shinkanzen ","")}</div>`;
    }
    cell.addEventListener("click",()=>{
      if(doneDays.includes(key)) doneDays=doneDays.filter(x=>x!==key);
      else doneDays.push(key);
      localStorage.setItem("jlptDoneDays",JSON.stringify(doneDays));
      renderCalendar();
    });
    calendar.appendChild(cell);
  }
}

function renderToday(){
  const now = new Date();
  const p = shinkanzenPlan(now);

  if (now.getMonth() === 10) {
    grammarChapter.textContent = "100% Latihan Soal";
    grammarPart.textContent = p.part;
    const labels = document.querySelectorAll(".target-line");
    labels[0].innerHTML = `<div><span>Target November</span><br><b>${p.part}</b></div><div style="text-align:right"><span>Fokus</span><br><b>Latihan soal</b></div>`;
    labels[1].innerHTML = `<div><span>Materi baru</span><br><b>0 kosakata / 0 bunpou</b></div><div style="text-align:right"><span>Tujuan</span><br><b>Analisis kesalahan</b></div>`;
    return;
  }

  if (now.getMonth() === 11) {
    grammarChapter.textContent = p.chapter;
    grammarPart.textContent = p.part;
    return;
  }

  grammarChapter.textContent = p.chapter;
  grammarPart.textContent = p.part;
}

let timerInt = null;
let running = false;
let phase = "focus";
let focusLockActive = false;
let round = 1;
let focusMin = 25;
let breakMin = 5;
let totalRounds = 4;
let left = focusMin * 60;
let warned = false;

function fmt(s){
  return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
}

function paint(){
  timer.textContent = fmt(left);
  phaseLabel.textContent = phase === "focus" ? "Fokus Belajar" : "Istirahat";
  roundLabel.textContent = `${round} / ${totalRounds}`;
  document.title = `${fmt(left)} • ${phase === "focus" ? "Belajar" : "Istirahat"}`;
}

function readMode(){
  const value = studyMode.value;
  if(value === "custom"){
    focusMin = Number(customStudy.value);
    breakMin = Number(customBreak.value);
    totalRounds = 4;
  }else{
    const [f,b,r] = value.split(",").map(Number);
    focusMin = f;
    breakMin = b;
    totalRounds = r;
  }
}

function resetSession(){
  focusLockActive = false;
  leaveFocusFullscreen();
  if(timerInt) clearInterval(timerInt);
  running = false;
  readMode();
  phase = "focus";
  round = 1;
  left = focusMin * 60;
  warned = false;
  paint();
}

function nextPhase(autoStart = true){
  beep();

  if(phase === "focus"){
    if(round >= totalRounds){
      if(timerInt) clearInterval(timerInt);
      running = false;
      focusLockActive = false;
      leaveFocusFullscreen();
      phaseLabel.textContent = "Selesai 🎉";
      timer.textContent = "00:00";
      document.title = "Sesi belajar selesai";
      return;
    }
    focusLockActive = false;
    phase = "break";
    leaveFocusFullscreen();
    left = breakMin * 60;
  }else{
    phase = "focus";
    focusLockActive = true;
    round++;
    left = focusMin * 60;
    restoreFocusFullscreenIfNeeded();
  }

  warned = false;
  paint();

  if(autoStart){
    running = true;
    startTicking();
  }
}

function startTicking(){
  if(timerInt) clearInterval(timerInt);
  timerInt = setInterval(()=>{
    left--;
    if(left === 10 && !warned){
      warned = true;
      warningBeep();
      if("vibrate" in navigator) navigator.vibrate([120,80,120]);
    }
    if(left <= 0){
      left = 0;
      paint();
      clearInterval(timerInt);
      timerInt = null;
      nextPhase(true);
      return;
    }
    paint();
  },1000);
}


async function enterFullscreen(){
  let entered = false;
  try{
    const el = document.getElementById("focusScreen");
    const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if(!document.fullscreenElement && !document.webkitFullscreenElement && request){
      const result = request.call(el);
      if(result && typeof result.then === "function") await result;
      entered = !!(document.fullscreenElement || document.webkitFullscreenElement);
    }
  }catch(e){}

  // Fallback: hanya timer yang menutupi layar jika fullscreen asli diblokir.
  if(!entered){
    document.body.classList.add("focus-fallback");
  }
}


async function leaveFocusFullscreen(){
  try{
    if(document.fullscreenElement && document.exitFullscreen){
      await document.exitFullscreen();
    }else if(document.webkitFullscreenElement && document.webkitExitFullscreen){
      document.webkitExitFullscreen();
    }
  }catch(e){}
  document.body.classList.remove("focus-fallback");
}

function shouldLockFullscreen(){
  return focusLockActive && phase === "focus";
}

async function restoreFocusFullscreenIfNeeded(){
  if(!shouldLockFullscreen()) return;
  try{
    const el = document.getElementById("focusScreen");
    const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if(!document.fullscreenElement && !document.webkitFullscreenElement && request){
      const result = request.call(el);
      if(result && typeof result.then === "function") await result;
      if(document.fullscreenElement || document.webkitFullscreenElement) return;
    }
  }catch(e){}
  document.body.classList.add("focus-fallback");
}

function warningBeep(){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const g = ctx.createGain();
    g.gain.value = .18;
    g.connect(ctx.destination);

    [0, .22, .44].forEach((delay,i)=>{
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = i === 2 ? 980 : 760;
      o.connect(g);
      o.start(ctx.currentTime + delay);
      o.stop(ctx.currentTime + delay + .13);
    });
  }catch(e){}
}

studyMode.addEventListener("change",()=>{
  customBox.style.display = studyMode.value === "custom" ? "block" : "none";
  resetSession();
});

customStudy.addEventListener("change",resetSession);
customBreak.addEventListener("change",resetSession);

start.addEventListener("click",async ()=>{
  if(running) return;
  focusLockActive = true;
  await enterFullscreen();
  running = true;
  warned = false;
  startTicking();
});

pause.addEventListener("click",()=>{
  if(timerInt) clearInterval(timerInt);
  timerInt = null;
  running = false;
});

skip.addEventListener("click",()=>{
  if(timerInt) clearInterval(timerInt);
  timerInt = null;
  running = false;
  nextPhase(false);
});

reset.addEventListener("click",resetSession);

function beep(){
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const g=ctx.createGain();
    g.gain.value=.24;
    g.connect(ctx.destination);

    [0,.28,.56].forEach((delay,i)=>{
      const o=ctx.createOscillator();
      o.type="sine";
      o.frequency.value = phase === "focus" ? (880 + i*90) : (650 + i*70);
      o.connect(g);
      o.start(ctx.currentTime+delay);
      o.stop(ctx.currentTime+delay+.2);
    });

    if("vibrate" in navigator) navigator.vibrate([180,100,180,100,260]);
  }catch(e){}
}


function applyTheme(theme){
  document.body.classList.toggle("light", theme === "light");
  localStorage.setItem("studyTheme", theme);
  darkBtn.classList.toggle("active", theme === "dark");
  lightBtn.classList.toggle("active", theme === "light");
}


document.addEventListener("fullscreenchange",()=>{
  if(!document.fullscreenElement){
    document.body.classList.remove("focus-fallback");
    if(shouldLockFullscreen()){
      setTimeout(restoreFocusFullscreenIfNeeded, 120);
    }
  }
});
document.addEventListener("webkitfullscreenchange",()=>{
  if(!document.webkitFullscreenElement){
    document.body.classList.remove("focus-fallback");
    if(shouldLockFullscreen()){
      setTimeout(restoreFocusFullscreenIfNeeded, 120);
    }
  }
});

darkBtn.addEventListener("click",()=>applyTheme("dark"));
lightBtn.addEventListener("click",()=>applyTheme("light"));

const savedTheme = localStorage.getItem("studyTheme");
if(savedTheme){
  applyTheme(savedTheme);
}else{
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(prefersLight ? "light" : "dark");
}

updateCountdown(); setInterval(updateCountdown,1000);
renderCalendar(); renderToday(); resetSession();



if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
