const examDate = new Date(2026,11,6,23,59,59);
const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
let doneDays = JSON.parse(localStorage.getItem("jlptDoneDays") || "[]");
let calendarView = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

// Hari libur nasional Jepang 2026–2027 berdasarkan daftar resmi Cabinet Office Jepang.
const japanHolidays = {
  "2026-01-01":"Tahun Baru", "2026-01-12":"Hari Kedewasaan",
  "2026-02-11":"Hari Pembentukan Negara", "2026-02-23":"Ulang Tahun Kaisar",
  "2026-03-20":"Hari Ekuinoks Musim Semi", "2026-04-29":"Hari Showa",
  "2026-05-03":"Hari Konstitusi", "2026-05-04":"Hari Hijau",
  "2026-05-05":"Hari Anak", "2026-05-06":"Hari Libur Pengganti",
  "2026-07-20":"Hari Laut", "2026-08-11":"Hari Gunung",
  "2026-09-21":"Hari Penghormatan Lansia", "2026-09-22":"Hari Libur Nasional",
  "2026-09-23":"Hari Ekuinoks Musim Gugur", "2026-10-12":"Hari Olahraga",
  "2026-11-03":"Hari Kebudayaan", "2026-11-23":"Hari Syukur Pekerja",
  "2027-01-01":"Tahun Baru", "2027-01-11":"Hari Kedewasaan",
  "2027-02-11":"Hari Pembentukan Negara", "2027-02-23":"Ulang Tahun Kaisar",
  "2027-03-21":"Hari Ekuinoks Musim Semi", "2027-03-22":"Hari Libur Pengganti",
  "2027-04-29":"Hari Showa", "2027-05-03":"Hari Konstitusi",
  "2027-05-04":"Hari Hijau", "2027-05-05":"Hari Anak",
  "2027-07-19":"Hari Laut", "2027-08-11":"Hari Gunung",
  "2027-09-20":"Hari Penghormatan Lansia", "2027-09-23":"Hari Ekuinoks Musim Gugur",
  "2027-10-11":"Hari Olahraga", "2027-11-03":"Hari Kebudayaan",
  "2027-11-23":"Hari Syukur Pekerja"
};

function dateKey(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function startOfDay(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }

function shinkanzenPlan(date){
  const m = date.getMonth(); // 8=Sep, 9=Oct, 10=Nov, 11=Dec
  const d = date.getDate();

  // September: kosakata + kanji. Oktober: bunpou, reading, choukai.
  // November: latihan soal. 1–5 Desember: review akhir. 6 Desember: ujian.
  if (m === 8) {
    if ([7,14,21,28].includes(d)) return {chapter:"Review Materi", part:"Kosakata + Kanji"};
    return {chapter:"Kosakata + Kanji", part:"20 kosakata • 5 kanji"};
  }

  if (m === 9) {
    const octoberFocus = ["Bunpou", "Reading", "Choukai"];
    return {chapter:"Materi Oktober", part:octoberFocus[(d-1)%3]};
  }

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
    if (d <= 5) return {chapter:"Review Akhir", part:"Kesalahan penting"};
    return {chapter:"Selesai", part:""};
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
  const now=new Date(), year=calendarView.getFullYear(), month=calendarView.getMonth();
  monthTitle.textContent=`${monthNames[month]} ${year}`;
  calendar.innerHTML="";
  const monthNotes = {
    8: "<b>Keterangan September:</b> fokus 20 kosakata dan 5 kanji setiap hari. Tanggal 7, 14, 21, dan 28 digunakan untuk review kosakata dan kanji.",
    9: "<b>Keterangan Oktober:</b> fokus materi Bunpou, Reading, dan Choukai secara bergantian setiap hari.",
    10: "<b>Keterangan November:</b> tidak ada materi baru. Fokus penuh pada latihan soal, analisis kesalahan, dan mini mock test.",
    11: "<b>Keterangan Desember:</b> tanggal 1–5 untuk review akhir. Tanggal 6 Desember adalah Hari Ujian JLPT N3."
  };
  calendarNote.innerHTML = year === 2026
    ? (monthNotes[month] || "<b>Keterangan:</b> persiapan menuju JLPT N3 tanggal 6 Desember 2026.")
    : "<b>Keterangan:</b> tanggal berwarna merah merupakan hari libur nasional Jepang.";
  calendarNote.innerHTML += "<br><b>Libur rutin:</b> setiap hari Minggu ditandai merah dan tidak memiliki target belajar.";
  const first=new Date(year,month,1), lastDay=new Date(year,month+1,0).getDate();

  for(let i=0;i<first.getDay();i++){
    const e=document.createElement("div"); e.className="day empty"; calendar.appendChild(e);
  }

  for(let d=1;d<=lastDay;d++){
    const dt=new Date(year,month,d), key=dateKey(dt), plan=shinkanzenPlan(dt);
    const nationalHoliday=japanHolidays[key], isSunday=dt.getDay()===0;
    const holiday=nationalHoliday || (isSunday ? "Hari Minggu" : "");
    const cell=document.createElement("button");
    cell.type="button"; cell.className="day";
    if(startOfDay(dt)<startOfDay(now)) cell.classList.add("past");
    if(sameDay(dt,now)) cell.classList.add("today");
    if(doneDays.includes(key)) cell.classList.add("done");
    if(sameDay(dt,examDate)) cell.classList.add("examday");
    if(holiday){ cell.classList.add("holiday"); cell.title=holiday; }

    if (isSunday) {
      cell.innerHTML=`<div class="num">${d}</div><div class="mini">Libur<br>Hari Minggu</div>`;
    } else if (year === 2026 && month === 8) {
      const isReview = plan.chapter === "Review Materi";
      cell.innerHTML=`<div class="num">${d}</div><div class="mini">${isReview ? "Review" : "20 kosakata"}<br>${isReview ? "Kosakata + Kanji" : "5 kanji"}</div>`;
    } else if (year === 2026 && month === 9) {
      cell.innerHTML=`<div class="num">${d}</div><div class="mini">${plan.part}<br>Fokus materi</div>`;
    } else if (year === 2026 && month === 10) {
      cell.innerHTML=`<div class="num">${d}</div><div class="mini">${plan.part}<br>Latihan soal</div>`;
    } else if (year === 2026 && month === 11) {
      cell.innerHTML=`<div class="num">${d}</div><div class="mini">${plan.chapter}<br>${plan.part}</div>`;
    } else {
      cell.innerHTML=`<div class="num">${d}</div><div class="mini">${plan.chapter}<br>${plan.part}</div>`;
    }
    if(nationalHoliday) cell.insertAdjacentHTML("beforeend",`<div class="holiday-name">${nationalHoliday}</div>`);
    cell.addEventListener("click",()=>{
      if(doneDays.includes(key)) doneDays=doneDays.filter(x=>x!==key);
      else doneDays.push(key);
      localStorage.setItem("jlptDoneDays",JSON.stringify(doneDays));
      renderCalendar();
    });
    calendar.appendChild(cell);
  }
}

prevMonth.addEventListener("click",()=>{
  calendarView = new Date(calendarView.getFullYear(), calendarView.getMonth()-1, 1);
  renderCalendar();
});
nextMonth.addEventListener("click",()=>{
  calendarView = new Date(calendarView.getFullYear(), calendarView.getMonth()+1, 1);
  renderCalendar();
});
currentMonth.addEventListener("click",()=>{
  const now = new Date();
  calendarView = new Date(now.getFullYear(), now.getMonth(), 1);
  renderCalendar();
});

function renderToday(){
  const now = new Date();
  const p = shinkanzenPlan(now);
  const target = document.getElementById("todayTargets");

  if (now.getMonth() === 8) {
    const review = p.chapter === "Review Materi";
    target.innerHTML = review
      ? `<div class="target-line"><div><span>Fokus hari ini</span><br><b>Review Kosakata</b></div><div style="text-align:right"><span>Tambahan</span><br><b>Review Kanji</b></div></div>`
      : `<div class="target-line"><div><span>Kosakata</span><br><b>20 kata</b></div><div style="text-align:right"><span>Kanji</span><br><b>5 kanji</b></div></div>`;
    return;
  }

  if (now.getMonth() === 9) {
    target.innerHTML = `<div class="target-line"><div><span>Fokus Oktober</span><br><b>${p.part}</b></div><div style="text-align:right"><span>Materi bulan ini</span><br><b>Bunpou • Reading • Choukai</b></div></div>`;
    return;
  }

  if (now.getMonth() === 10) {
    target.innerHTML = `<div class="target-line"><div><span>Target November</span><br><b>${p.part}</b></div><div style="text-align:right"><span>Fokus</span><br><b>Latihan soal</b></div></div><div class="target-line"><div><span>Materi baru</span><br><b>Tidak ada</b></div><div style="text-align:right"><span>Tujuan</span><br><b>Analisis kesalahan</b></div></div>`;
    return;
  }

  if (now.getMonth() === 11) {
    target.innerHTML = `<div class="target-line"><div><span>Target Desember</span><br><b>${p.chapter}</b></div><div style="text-align:right"><span>Status</span><br><b>${p.part}</b></div></div>`;
    return;
  }

  target.innerHTML = `<div class="target-line"><div><span>Program</span><br><b>${p.chapter}</b></div><div style="text-align:right"><span>Target</span><br><b>JLPT N3</b></div></div>`;
}

let timerInt = null;
let running = false;
let phase = "focus";
let focusLockActive = false;
let forcedFullscreenPause = false;
let round = 1;
let focusMin = 25;
let breakMin = 5;
let totalRounds = 4;
let left = focusMin * 60;
let warned = false;

function fmt(s){
  return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
}

function fullscreenSessionName(){
  if(phase === "break") return "Sesi Istirahat";

  const plan = shinkanzenPlan(new Date());
  if(plan.chapter === "Latihan Soal") return "Sesi Latihan Soal";
  if(plan.chapter === "Review Akhir" || plan.chapter === "Review Materi") return "Sesi Review";
  if(plan.chapter === "JLPT N3") return "Sesi Ujian";
  return "Sesi Materi";
}

function paint(){
  timer.textContent = fmt(left);
  phaseLabel.textContent = phase === "focus" ? "Fokus Belajar" : "Istirahat";
  roundLabel.textContent = `${round} / ${totalRounds}`;
  fullscreenSessionTitle.textContent = `${fullscreenSessionName()} • Ronde ${round}/${totalRounds}`;
  document.title = `${fmt(left)} • ${phase === "focus" ? "Belajar" : "Istirahat"} • By RyzenMZKSHI`;
  const fullscreenActive = document.fullscreenElement === focusScreen || document.webkitFullscreenElement === focusScreen || document.body.classList.contains("focus-fallback");
  focusScreen.classList.toggle("timer-ending", running && left > 0 && left <= 10 && fullscreenActive);
  const pauseLabel = focusLockActive && !running ? "Lanjutkan" : "Pause";
  pause.textContent = pauseLabel;
  fullscreenPause.textContent = pauseLabel;
  pause.disabled = !focusLockActive;
  fullscreenPause.disabled = !focusLockActive;
}

function readMode(){
  const value = studyMode.value;
  if(value === "custom"){
    focusMin = Math.min(1440, Math.max(1, Number(customStudy.value) || 1));
    breakMin = Math.min(480, Math.max(1, Number(customBreak.value) || 1));
    totalRounds = Math.min(20, Math.max(1, Number(customRounds.value) || 1));
    customStudy.value = focusMin;
    customBreak.value = breakMin;
    customRounds.value = totalRounds;
  }else{
    const [f,b,r] = value.split(",").map(Number);
    focusMin = f;
    breakMin = b;
    totalRounds = r;
  }
}

function resetSession(){
  forcedFullscreenPause = false;
  resumeFullscreen.classList.remove("show");
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
      forcedFullscreenPause = false;
      resumeFullscreen.classList.remove("show");
      focusLockActive = false;
      leaveFocusFullscreen();
      phaseLabel.textContent = "Selesai 🎉";
      timer.textContent = "00:00";
      document.title = "Sesi belajar selesai • By RyzenMZKSHI";
      return;
    }
    forcedFullscreenPause = false;
    resumeFullscreen.classList.remove("show");
    phase = "break";
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
  paint();
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



function pauseBecauseFullscreenExited(){
  if(!focusLockActive || phase !== "focus") return;
  forcedFullscreenPause = true;
  if(timerInt) clearInterval(timerInt);
  running = false;
  const overlay = document.getElementById("resumeFullscreen");
  if(overlay) overlay.classList.add("show");
  document.title = "Sesi dijeda • By RyzenMZKSHI";
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
    g.gain.value = .38;
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
customRounds.addEventListener("change",resetSession);

start.addEventListener("click",async ()=>{
  if(running) return;
  focusLockActive = true;
  await enterFullscreen();
  running = true;
  warned = false;
  startTicking();
});

function toggleTimerPause(){
  if(!focusLockActive) return;
  if(running){
    if(timerInt) clearInterval(timerInt);
    timerInt = null;
    running = false;
    paint();
  }else{
    running = true;
    startTicking();
  }
}

pause.addEventListener("click",toggleTimerPause);
fullscreenPause.addEventListener("click",toggleTimerPause);

async function stopToDashboard(){
  if(timerInt) clearInterval(timerInt);
  timerInt = null;
  running = false;
  forcedFullscreenPause = false;
  focusLockActive = false;
  resumeFullscreen.classList.remove("show");
  await leaveFocusFullscreen();
  setSpotifyPanel(false);
  spotifyFrame.removeAttribute("src");
  spotifyFrame.hidden = true;
  spotifyPanel.classList.remove("minimized");
  spotifyMinimize.textContent = "−";
  spotifyMinimize.setAttribute("aria-pressed","false");
  readMode();
  phase = "focus";
  round = 1;
  left = focusMin * 60;
  warned = false;
  paint();
  window.scrollTo({top:0,behavior:"smooth"});
}

fullscreenStop.addEventListener("click",stopToDashboard);

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
    g.gain.value=.58;
    g.connect(ctx.destination);

    [0,.28,.56].forEach((delay,i)=>{
      const o=ctx.createOscillator();
      o.type=i === 1 ? "square" : "sine";
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
  if(!document.fullscreenElement && focusLockActive && phase === "focus"){
    pauseBecauseFullscreenExited();
  }
});
document.addEventListener("webkitfullscreenchange",()=>{
  if(!document.webkitFullscreenElement && focusLockActive && phase === "focus"){
    pauseBecauseFullscreenExited();
  }
});


resumeFullscreenBtn.addEventListener("click", async ()=>{
  if(!forcedFullscreenPause) return;

  await enterFullscreen();

  const isNativeFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
  const isFallbackFullscreen = document.body.classList.contains("focus-fallback");

  if(isNativeFullscreen || isFallbackFullscreen){
    forcedFullscreenPause = false;
    running = true;
    resumeFullscreen.classList.remove("show");
    startTicking();
  }
});

function spotifyEmbedUrl(value){
  const raw = value.trim();
  const uriMatch = raw.match(/^spotify:(track|album|playlist|artist|show|episode):([A-Za-z0-9]+)$/i);
  if(uriMatch) return `https://open.spotify.com/embed/${uriMatch[1].toLowerCase()}/${uriMatch[2]}?utm_source=generator&theme=0`;

  try{
    const url = new URL(raw);
    if(url.hostname !== "open.spotify.com") return "";
    const parts = url.pathname.split("/").filter(Boolean);
    if(parts[0] && parts[0].startsWith("intl-")) parts.shift();
    const allowed = ["track","album","playlist","artist","show","episode"];
    if(!allowed.includes(parts[0]) || !/^[A-Za-z0-9]+$/.test(parts[1] || "")) return "";
    return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}?utm_source=generator&theme=0`;
  }catch(e){ return ""; }
}

function youtubeEmbedUrl(value){
  try{
    const url = new URL(value.trim());
    let videoId = "";
    if(url.hostname === "youtu.be") videoId = url.pathname.slice(1);
    if(["youtube.com","www.youtube.com","music.youtube.com"].includes(url.hostname)) videoId = url.searchParams.get("v") || "";
    if(!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }catch(e){ return ""; }
}

function setSpotifyPanel(open){
  spotifyPanel.hidden = !open;
  spotifyToggle.setAttribute("aria-expanded", String(open));
}

spotifyToggle.addEventListener("click",()=>setSpotifyPanel(spotifyPanel.hidden));
spotifyClose.addEventListener("click",()=>setSpotifyPanel(false));
spotifyMinimize.addEventListener("click",()=>{
  const minimized = spotifyPanel.classList.toggle("minimized");
  spotifyMinimize.textContent = minimized ? "+" : "−";
  spotifyMinimize.setAttribute("aria-label", minimized ? "Perbesar pemutar musik" : "Minimize pemutar musik");
  spotifyMinimize.setAttribute("aria-pressed", String(minimized));
});
spotifyForm.addEventListener("submit",event=>{
  event.preventDefault();
  const query = spotifyUrl.value.trim();
  if(!query){
    spotifyMessage.textContent = "Masukkan judul lagu, nama artis/band, atau tautan musik.";
    spotifyMessage.classList.add("error");
    return;
  }

  const provider = musicProvider.value;
  const embedUrl = provider === "youtube" ? youtubeEmbedUrl(query) : spotifyEmbedUrl(query);
  if(!embedUrl){
    const searchUrl = provider === "youtube"
      ? `https://music.youtube.com/search?q=${encodeURIComponent(query)}`
      : `https://open.spotify.com/search/${encodeURIComponent(query)}`;
    const popup = window.open(searchUrl,"musicMiniSearch","popup=yes,width=480,height=720,resizable=yes,scrollbars=yes");
    spotifyMessage.textContent = popup
      ? `Hasil pencarian dibuka di jendela ${provider === "youtube" ? "YouTube Music" : "Spotify"} kecil. Timer tetap berjalan.`
      : "Popup diblokir browser. Izinkan popup untuk memakai pencarian musik.";
    spotifyMessage.classList.toggle("error",!popup);
    return;
  }
  localStorage.setItem("studySpotifyUrl", query);
  localStorage.setItem("studyMusicProvider", provider);
  spotifyMessage.textContent = `${provider === "youtube" ? "YouTube Music" : "Spotify"} berjalan di panel kecil tanpa meninggalkan timer.`;
  spotifyMessage.classList.remove("error");
  spotifyPanel.dataset.provider = provider;
  spotifyFrame.src = embedUrl;
  spotifyFrame.hidden = false;
});

const savedSpotifyUrl = localStorage.getItem("studySpotifyUrl");
if(savedSpotifyUrl) spotifyUrl.value = savedSpotifyUrl;
const savedMusicProvider = localStorage.getItem("studyMusicProvider");
if(savedMusicProvider === "youtube") musicProvider.value = "youtube";

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
