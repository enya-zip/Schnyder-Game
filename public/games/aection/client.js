import { worldFrame } from "./worlds.js";
import { GameAudio } from "./game-audio.js";
import { LifeReward, earnedLife } from "./life-reward.js";
import { chooseLanguage, loadDictionaries, livesLabel } from "./localization.js";
import { drawWallisCity } from "./scenery.js";
import { setup, validateAction, applyAction, viewFor } from "./logic.js";
import { GameView } from "./game-view.js";
import { setupLeaderboard } from "./leaderboard.js";

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
if (params.get("embed") === "1") document.body.classList.add("embedded");
const dictionaries = await loadDictionaries();
let language = chooseLanguage(params.get("lang"), readStore("aection:language", "de"));
const words = { ...dictionaries[language] };

function readStore(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function writeStore(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Optional storage may be blocked in an iframe. */ } }
let best = Number(readStore("aection:best:endless", 0)) || 0;
const saved = readStore("aection:settings", {});
const settings = {
  reduced: saved.reduced ?? matchMedia("(prefers-reduced-motion: reduce)").matches,
  contrast: Boolean(saved.contrast), large: Boolean(saved.large),
  binding: typeof saved.binding === "string" ? saved.binding : "Space",
  pad: Number.isInteger(saved.pad) ? saved.pad : 0
};
let soundEnabled = readStore("aection:sound", true) !== false, remapping = false, pointerAt = -1000, padWasDown = false, padPauseWasDown = false, padFireWasDown = false;
let lastFrame = 0, accumulator = 0, lastEvent = -1, lastHud = -1, ended = false, wasRunningForSettings = false;
let countdown = 0, ready = false;
let seed = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
let state = setup([seed]);
const view = new GameView($("game"), words);
const ui = {
 score:$("score"),time:$("time"),timebar:$("timebar"),lives:$("lives"),
 dots:Array.from(document.querySelectorAll("#charge-meter i")),level:$("level-count"),boost:$("boost-label"),boostbar:$("boostbar"),
 chapter:$("chapter"),hint:$("playhint"),toast:$("toast"),status:$("live-status")
};
const lifeReward = new LifeReward($("arena"), ui.lives);
const audio = new GameAudio(soundEnabled, showError => {
  updateSoundButtons();
  if (showError) toast(words.soundBlocked);
});
function updateSoundButtons() {
  const label = words[audio.blocked ? "soundRetry" : soundEnabled ? "soundStateOn" : "soundStateOff"];
  for (const id of ["sound", "pause-sound", "arena-sound"]) {
    const button = $(id); if (!button) continue;
    button.setAttribute("aria-pressed", String(soundEnabled && !audio.blocked));
    button.setAttribute("aria-label", words[audio.blocked ? "soundRetry" : soundEnabled ? "soundOff" : "soundOn"]);
    button.title = words[audio.blocked ? "soundRetry" : soundEnabled ? "soundOff" : "soundOn"];
    const text = button.querySelector("[data-i18n]");
    if (text) text.textContent = label; else if (id !== "arena-sound") button.textContent = label;
  }
}
function play(name) { audio.play(name); }
function musicSync() {
  audio.sync(soundEnabled && state.phase === "running" && !document.hidden,
    !soundEnabled || document.hidden || state.phase === "paused",
    state.boost > 0, state.powerSeconds - state.boost);
}
function toggleSound() {
  soundEnabled = audio.blocked || !soundEnabled;
  audio.setEnabled(soundEnabled); writeStore("aection:sound", soundEnabled);
  if (soundEnabled) audio.unlock();
  musicSync();
  if (soundEnabled && state.phase !== "running") audio.preview();
  updateSoundButtons();
}
function applySettings() {
  document.body.classList.toggle("reduced-motion", settings.reduced);
  document.body.classList.toggle("high-contrast", settings.contrast);
  document.body.classList.toggle("large-text", settings.large);
  $("reduce-motion").checked = settings.reduced;
  $("contrast").checked = settings.contrast;
  $("large-text").checked = settings.large;
  $("remap").textContent = settings.binding;
  $("pad-binding").value = String(settings.pad);
  writeStore("aection:settings", settings);
}
applySettings();
$("best").textContent = String(best).padStart(4, "0");
$("game").tabIndex = 0;
$("start").disabled = true;
const finePointer = matchMedia("(pointer:fine)").matches;
ui.hint.textContent = words[finePointer ? "spaceHint" : "tapHint"];
function dispatch(action) {
  if (!validateAction(state, seed, action).ok) return false;
  const previousState = state;
  const previousLevel = state.level, previousWorld = worldFrame(state).visit;
  state = applyAction(state, seed, action);
  handleEvent();
  if (earnedLife(previousState, state)) {
    updateHud(true);
    lifeReward.start(state, words.extraLife);
    audio.playLife();
    const text = words.levelUpHeart.replace("{level}", state.level);
    toast(text); ui.status.textContent = text;
  }
  if (worldFrame(state).visit > previousWorld) {
    ui.status.textContent = (state.level > previousLevel ? ui.status.textContent + " · " : "") + words.worldEnter.replace("{world}", words.worldNames[worldFrame(state).index]);
  }
  return true;
}
function jump() {
  if (!ready || countdown > 0 || state.phase !== "running" || document.querySelector("dialog[open]")) return;
  if (soundEnabled && (audio.blocked || audio.context?.state !== "running")) { audio.unlock(); musicSync(); }
  dispatch({ type:"jump" });
}
function shoot() {
  if (!ready || state.phase !== "running" || document.querySelector("dialog[open]")) return;
  if (soundEnabled && (audio.blocked || audio.context?.state !== "running")) { audio.unlock(); musicSync(); }
  if (dispatch({type:"shoot"})) updateHud(true);
}
function toast(text) {
  ui.toast.textContent = text;
  ui.toast.classList.add("on");
  toastUntil = performance.now() + 1100;
}
let toastUntil = 0;
function handleEvent() {
  if (state.eventId === lastEvent) return;
  lastEvent = state.eventId;
  const e = state.event;
  if (!e) return;
  view.emit(e, state, settings.reduced);
  if (e === "jump" || e === "doubleJump") play("jump");
  if (e === "boost") { play("power"); toast(words.boostToast); }
  if (e === "idea" || e === "rescue") play("coin");
  if (e === "dot") { play("coin"); if (!state.boost) toast(words.dotToast.replace("{count}",state.dots).replace("{total}",state.powerCharge)); }
  if (e === "smash" || e === "laserHit") play("hit");
  if (e === "shoot") play("laser");
  if (e === "level") { const text=words.levelUp.replace("{level}",state.level); toast(text); ui.status.textContent=text; }
  if (e === "rescue") toast(words.rescueToast);
  if (e === "hit") { play("hit"); toast(words.hitToast); }
  if (e === "sheepHit") { play("hit"); toast(words.sheepHitToast); }
  if (e === "personHit") { play("hit"); toast(words.personHitToast); }
  if (e === "gameOver") play("hit");
  if (e === "gameOver") showResult();
}
function startRun() {
  if (!ready) return;
  document.querySelectorAll("dialog[open]").forEach(d => d.close());
  seed = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  lifeReward.clear();
  leaderboard.reset();
  state = setup([seed]); ended = false; lastEvent = -1; lastHud = -1;
  accumulator = 0; lastFrame = performance.now(); countdown = 0;
  document.body.classList.add("playing");
  $("arena").hidden = false;
  $("share-fallback").hidden = true;
  $("share").textContent = words.share;
  // Reset before the first play request; seeking after play can abort the iOS start.
  audio.restart(); audio.unlock();
  view.resize(); dispatch({type:"start"}); updateHud(true);
  $("game").focus({preventScroll:true});
  $("arena").scrollIntoView({block:"start",behavior:"instant"});
  musicSync();
  ui.status.textContent = words.ready;
}
function pause(show = true) {
  if (!dispatch({type:"pause"})) return;
  accumulator = 0; musicSync();
  if (show && !$("pause-dialog").open) $("pause-dialog").showModal();
}
function resume() {
  $("pause-dialog").close();
  if (dispatch({type:"resume"})) {
    accumulator = 0; lastFrame = performance.now(); audio.unlock(); musicSync(); $("game").focus({preventScroll:true});
  }
}
function openHelp() {
  if (state.phase === "running") { pause(false); wasRunningForSettings = true; }
  $("help-dialog").showModal();
}
function openSettings() {
  if (state.phase === "running") { pause(false); wasRunningForSettings = true; }
  $("settings-dialog").showModal();
}
for (const id of ["help-dialog","settings-dialog"]) $(id).addEventListener("close", () => {
  remapping = false; $("remap").textContent = settings.binding;
  if (wasRunningForSettings && !$("pause-dialog").open && !document.querySelector("dialog[open]")) {
    wasRunningForSettings = false; resume();
  }
});
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
$("pause-dialog").addEventListener("cancel", e => { e.preventDefault(); resume(); });
$("result-dialog").addEventListener("cancel", e => e.preventDefault());
$("start").addEventListener("click", startRun);
$("again").addEventListener("click", startRun);
const leaderboard = setupLeaderboard({ $, words, readStore, writeStore, getRun: () => state, onPlayAgain: startRun });
$("sound").addEventListener("click", toggleSound);
$("pause-sound").addEventListener("click", toggleSound);
$("arena-sound").addEventListener("click", toggleSound);
$("settings").addEventListener("click", openSettings);
$("how").addEventListener("click", openHelp);
$("pause-help").addEventListener("click", openHelp);
$("pause").addEventListener("click", () => pause());
$("resume").addEventListener("click", resume);
$("arena").addEventListener("pointerdown", e => {
  if ((!e.isPrimary && e.pointerType !== "touch") || (e.target.closest("button") && !e.target.closest("#jump"))) return;
  if (e.button !== 0 && e.pointerType !== "touch") return;
  e.preventDefault(); pointerAt = performance.now(); jump();
});
$("jump").addEventListener("click", e => { if (e.detail === 0) jump(); });
$("fire").addEventListener("pointerdown", e => {
  if (e.button !== 0 && e.pointerType !== "touch") return;
  e.preventDefault(); e.stopPropagation(); shoot();
});
$("fire").addEventListener("click", e => {
  e.preventDefault(); e.stopPropagation();
  if (e.detail === 0) shoot();
});
// Scope the Safari double-tap guard to game controls; page zoom elsewhere stays available.
// Pointerdown already performs the action; cancelling touchend suppresses synthetic clicks/zoom.
for (const id of ["fire", "jump"]) {
  const control = $(id);
  control.addEventListener("touchend", e => {
    // iOS accepts touchend as a media gesture even when its synthetic click is cancelled.
    if (soundEnabled && state.phase === "running") audio.unlock();
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
  }, { passive: false });
  control.addEventListener("dblclick", e => {
    e.preventDefault(); e.stopPropagation();
  });
}
window.addEventListener("keydown", e => {
  if (remapping) {
    e.preventDefault();
    if (!["Escape","Tab"].includes(e.code)) { settings.binding = e.code; applySettings(); }
    remapping = false; $("remap").textContent = settings.binding; return;
  }
  if (e.repeat || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.code === "Escape" && state.phase === "running") { e.preventDefault(); pause(); return; }
  if (e.code === "KeyP" && !document.querySelector("dialog[open]")) {
    e.preventDefault(); if (state.phase === "running") pause(); else if (state.phase === "paused") resume(); return;
  }
  if (["KeyX","KeyK"].includes(e.code) && e.code !== settings.binding && state.phase === "running" && !document.querySelector("dialog[open]")) {
    e.preventDefault(); shoot(); return;
  }
  if ([settings.binding,"ArrowUp"].includes(e.code) && state.phase === "running" && !document.querySelector("dialog[open]")) {
    e.preventDefault(); if (performance.now() - pointerAt > 35) jump();
  }
});
$("remap").addEventListener("click", () => { remapping = true; $("remap").textContent = words.pressKey; });
for (const [id,key] of [["reduce-motion","reduced"],["contrast","contrast"],["large-text","large"]]) {
  $(id).addEventListener("change", e => { settings[key] = e.target.checked; applySettings(); });
}
$("pad-binding").addEventListener("change", e => { settings.pad = Number(e.target.value); applySettings(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && state.phase === "running") pause(); musicSync(); });
window.addEventListener("blur", () => { if (state.phase === "running") pause(); });
$("fullscreen").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else { toast(words.noFullscreen); window.open(gameUrl(),"_blank","noopener"); }
  } catch { toast(words.noFullscreen); }
  view.resize();
});
document.addEventListener("fullscreenchange", () => {
  $("fullscreen").setAttribute("aria-label", words[document.fullscreenElement ? "exitFullscreen" : "fullscreen"]);
  view.resize();
});
function gamepad() {
  if (!navigator.getGamepads) return;
  let pads; try { pads = navigator.getGamepads(); } catch { return; }
  const pad = pads[0]; if (!pad) { padWasDown = false; padPauseWasDown = false; padFireWasDown = false; return; }
  const down = Boolean(pad.buttons[settings.pad]?.pressed);
  const pauseDown = Boolean(pad.buttons[9]?.pressed);
  const fireDown = Boolean(pad.buttons[7]?.pressed);
  if (down && !padWasDown) {
    if (state.phase === "ready" || state.phase === "over") startRun(); else if ($("pause-dialog").open) resume(); else jump();
  }
  if (pauseDown && !padPauseWasDown) { if (state.phase === "running") pause(); else if (state.phase === "paused") resume(); }
  if (fireDown && !padFireWasDown) shoot();
  padWasDown = down; padPauseWasDown = pauseDown; padFireWasDown = fireDown;
}
function timeLabel(seconds) { return Math.floor(seconds/60)+":"+String(Math.floor(seconds)%60).padStart(2,"0"); }
function resultSummary() { return words.endText.replace("{time}",timeLabel(state.time)).replace("{level}",state.level); }
function updateHud(force = false) {
  if (!force && state.tick - lastHud < 4) return;
  lastHud = state.tick;
  ui.score.textContent = String(state.score).padStart(4,"0");
  ui.time.textContent = timeLabel(state.time);
  ui.timebar.style.transform = "scaleX(" + (state.levelTime/state.levelSeconds) + ")";
  ui.timebar.parentElement.setAttribute("aria-label",words.nextLevel.replace("{seconds}",Math.ceil(state.levelSeconds-state.levelTime)));
  for (let i=0;i<3;i++) ui.lives.children[i].classList.toggle("lost",i>=state.lives);
  ui.lives.setAttribute("aria-label",livesLabel(words,state.lives));
  for (let i=0;i<ui.dots.length;i++) ui.dots[i].classList.toggle("on",state.dots>i||state.boost>0);
  $("charge-meter").setAttribute("aria-label",state.boost>0 ? words.powerActive : words.chargeCount.replace("{count}",state.dots).replace("{total}",state.powerCharge));
  ui.boost.textContent = state.boost>0 ? words.boost+" · "+Math.ceil(state.boost)+"s" : state.dots+"/"+state.powerCharge;
  ui.boostbar.style.transform = "scaleX("+state.boost/state.powerSeconds+")";
  $("arena").classList.toggle("boosting",state.boost>0);
  $("power-headline").hidden = !(state.boost > state.powerSeconds - 1.6);
  const laserReady = state.laserCooldownTicks === 0;
  // Keep accepting touch events while reloading: native disabled buttons can let iOS double-taps zoom.
  $("fire").setAttribute("aria-disabled", String(state.phase !== "running" || !laserReady));
  $("fire").setAttribute("aria-label", words[laserReady ? "shootAria" : "laserReloading"]);
  $("laser-status").textContent = laserReady ? words.laserReady : (Math.ceil(state.laserCooldownTicks/6)/10).toFixed(1)+"s";
  $("laser-bar").style.transform = "scaleX("+(1-state.laserCooldownTicks/state.laserCooldownMax)+")";
  ui.level.textContent = words.levelLabel.replace("{level}",state.level);
  const world = worldFrame(state);
  ui.chapter.textContent = words.worldNames[world.index];
  ui.chapter.classList.toggle("world-entering", world.visit > 0 && world.age < 3);
  musicSync();
  ui.hint.style.opacity = state.time>8 ? "0" : "1";
}
function showResult() {
  if (ended) return;
  lifeReward.clear();
  ended = true; updateHud(true); musicSync();
  const record = state.score > best;
  if (record) { best = state.score; writeStore("aection:best:endless",best); $("best").textContent=String(best).padStart(4,"0"); }
  $("new-record").hidden=!record;
  $("result-title").textContent = words.endTitle;
  $("result-text").textContent = resultSummary();
  $("result-score").textContent=state.score;
  $("result-rescued").textContent=state.rescued;
  $("result-ideas").textContent=state.ideas;
  $("result-level").textContent=state.level;
  ui.status.textContent = state.score+" "+words.points.toLowerCase();
  $("result-dialog").showModal();
}
function gameUrl() {
  const url = new URL("./index.html", location.href);
  url.searchParams.set("lang", language);
  return url.href;
}
function applyLanguage(code) {
  language = chooseLanguage(code, language);
  Object.assign(words, dictionaries[language]);
  document.documentElement.lang = {de:"de-CH",fr:"fr-CH",en:"en"}[language];
  document.title = words.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const value = words[el.dataset.i18n];
    if (typeof value === "string") el.textContent = value;
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => {
    const value = words[el.dataset.i18nAria];
    if (typeof value === "string") el.setAttribute("aria-label", value);
  });
  $("language").value = language;
  updateSoundButtons();
  $("fullscreen").setAttribute("aria-label", words[document.fullscreenElement ? "exitFullscreen" : "fullscreen"]);
  $("remap").textContent = remapping ? words.pressKey : settings.binding;
  ui.hint.textContent = words[finePointer ? "spaceHint" : "tapHint"];
  ui.toast.classList.remove("on"); toastUntil = 0;
  updateHud(true);
  if (state.phase === "over") {
    $("result-title").textContent = words.endTitle;
    $("result-text").textContent = resultSummary();
  }
  if (!$("share-fallback").hidden) $("share-value").value = shareText() + " " + gameUrl();
  ui.status.textContent = state.phase === "ready" ? words.ready : state.phase === "paused" ? words.paused : state.score + " " + words.points.toLowerCase();
  writeStore("aection:language", language);
  try {
    const url = new URL(location.href); url.searchParams.set("lang", language);
    history.replaceState(null, "", url.href);
  } catch { /* A restricted embed can still switch and play in any language. */ }
}
$("language").addEventListener("change", event => {
  if (state.phase === "running") pause();
  applyLanguage(event.target.value);
});
function shareText() { return words.shareText.replace("{score}",state.score).replace("{rescued}",state.rescued).replace("{level}",state.level).replace("{time}",timeLabel(state.time)); }
$("share").addEventListener("click",async()=>{
  const text=shareText(),url=gameUrl();
  if(navigator.share) {
    try { await navigator.share({title:"ÄCTION!",text,url}); return; } catch(e) { if(e.name==="AbortError") return; }
  }
  try { await navigator.clipboard.writeText(text+" "+url); $("share").textContent=words.shared; }
  catch { $("share-fallback").hidden=false; $("share-value").value=text+" "+url; $("share-value").select(); }
});
$("save-card").addEventListener("click",async()=>{
  const card=document.createElement("canvas");card.width=1200;card.height=1200;const c=card.getContext("2d");
  c.fillStyle="#0b0b0b";c.fillRect(0,0,1200,1200);
  c.strokeStyle="#6cff00";c.lineWidth=3;c.strokeRect(48,48,1104,1104);
  c.fillStyle="#fcfcfc";c.font="900 170px Agency,Arial";c.fillText("ÄCTION!",90,255);
  c.fillStyle="#6cff00";c.font="900 280px Agency,Arial";c.fillText(String(state.score),85,590);
  c.fillStyle="#fcfcfc";c.font="700 35px Agency,Arial";c.fillText(words.points,100,655);
  c.font="700 45px Agency,Arial";c.fillText(state.rescued+" "+words.rescued.toLowerCase(),95,810);
  c.fillStyle="#b8b8b8";c.font="26px Agency,Arial";c.fillText(words.tagline,95,930);
  c.fillStyle="#6cff00";c.font="750 28px Agency,Arial";c.fillText("SCHNYDÄR",95,1070);
  card.toBlob(blob=>{if(!blob)return;const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="aection-"+state.score+".png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},"image/png");
});
function animate(now) {
  const dt = lastFrame ? Math.min(0.1,(now-lastFrame)/1000) : 0; lastFrame=now;
  gamepad();
  if (ready && state.phase==="running") {
    accumulator+=dt;
    let steps=0;
    while(accumulator>=1/60 && steps<6 && state.phase==="running") {
      dispatch({type:"step"});accumulator-=1/60;steps++;
    }
    updateHud();
  }
  if (!$("arena").hidden) { view.draw(state,dt,settings); lifeReward.render(state,settings.reduced); }
  if (toastUntil && now>toastUntil) { ui.toast.classList.remove("on");toastUntil=0; }
  if (params.get("debug")==="1" && !$("arena").hidden) {
    $("debug").hidden=false;
    $("debug").textContent=Math.round(view.fps)+" FPS · "+(view.renderMs||0).toFixed(1)+" ms · "+state.entities.length+" entities · "+state.tick+" ticks · laser "+state.shotsFired+"/"+state.laserHits;
  }
  requestAnimationFrame(animate);
}
applyLanguage(language);
try {
  await view.load(); ready=true; $("start").disabled=false;
  const introCanvas=$("intro-city");
  function paintIntro() {
    if(!introCanvas)return;
    const r=introCanvas.getBoundingClientRect(); if(!r.width||!r.height)return;
    const dpr=Math.min(2,window.devicePixelRatio||1), scale=r.width/900;
    introCanvas.width=Math.round(r.width*dpr);introCanvas.height=Math.round(r.height*dpr);
    const c=introCanvas.getContext("2d"), h=r.height/scale;
    c.setTransform(scale*dpr,0,0,scale*dpr,0,0);
    c.fillStyle="#eee9e1";c.fillRect(0,0,900,h);
    drawWallisCity(c,900,h*.92,{distance:80,rescued:5,boost:0,time:0},view.images,{reduced:true},scale);
  }
  const introResize=new ResizeObserver(paintIntro);introResize.observe(introCanvas);paintIntro();

  if(params.get("debug")==="1") window.__aection=Object.freeze({
    getState:()=>structuredClone(viewFor(state,seed)),
    getMetrics:()=>({fps:view.fps,renderMs:view.renderMs,entities:state.entities.length}),
    start:startRun,jump,shoot,pause:()=>pause(),resume
  });
} catch {
  $("start").disabled=false;
  $("start").textContent=words.loading;
  $("start").addEventListener("click",()=>location.reload(),{once:true});
}
requestAnimationFrame(animate);
