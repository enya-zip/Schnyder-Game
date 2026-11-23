// Music uses a media element; effects share one gesture-unlocked Web Audio context.
// Never await loading before resume()/play(): iOS needs those calls inside the tap.
export class GameAudio {
  constructor(enabled, onChange = () => {}) {
    this.enabled = enabled; this.onChange = onChange; this.blocked = false;
    this.powerRequested = false; this.powerElapsed = 0; this.powerSource = null;
    this.musicPending = false; this.musicAttempt = 0; this.musicNeedsGesture = false;
    this.running = false; this.context = null; this.buffers = {}; this.active = null; this.laserNodes = new Set(); this.lifeNodes = new Set();
    // One persistent HTMLAudioElement for both music tracks. Safari keeps its
    // gesture authorisation when the game swaps the source mid-run.
    this.tracks = {
      normal: new URL("./assets/aection-hiphop-108.mp3", import.meta.url).href,
      superpower: new URL("./assets/aection-superpower-dnb.mp3", import.meta.url).href
    };
    this.track = "normal"; this.normalPosition = 0;
    this.music = new Audio(this.tracks.normal);
    this.music.loop = true; this.music.volume = .65; this.music.preload = "auto";
    this.music.setAttribute("playsinline", "");
    this.music.id = "game-music"; this.music.hidden = true;
    // Keep the media element in the document for embedded mobile browsers.
    if (typeof document !== "undefined") document.body.append(this.music);
    this.music.addEventListener("playing", () => {
      if (!this.enabled || !this.running) this.music.pause();
      else { this.stopPower(); this.blocked = false; this.onChange(); }
    });
    this.music.addEventListener("error", () => {
      if (this.track === "superpower" && this.startPowerFallback()) return;
      this.fail(new Error("music load"));
    });
    this.levels = {jump:.70,coin:.72,hit:.65,power:.40};
    const files = {jump:"cartoon-jump.mp3",coin:"loki-coin.mp3",hit:"cartoon-hit.mp3",power:"power.mp3",superpower:"aection-superpower-dnb.mp3"};
    this.raw = Promise.all(Object.entries(files).map(async ([name, file]) => {
      try {
        const r = await fetch(new URL("./assets/" + file, import.meta.url));
        if (!r.ok) throw new Error("effect load");
        return [name, await r.arrayBuffer()];
      } catch { return [name, null]; }
    }));
  }
  fail(error) {
    if (!this.enabled || error?.name === "AbortError") return;
    const first = !this.blocked; this.blocked = true; this.onChange(first);
  }
  unlock() {
    if (!this.enabled) return;
    this.musicNeedsGesture = false;
    // Request media playback, including Web Audio effects, after an explicit tap.
    try { if (globalThis.navigator?.audioSession) globalThis.navigator.audioSession.type = "playback"; } catch {}
    this.music.muted = false;
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) { this.syncMusic(); return; }
    try {
      if (!this.context) {
        this.context = new Context();
        this.decoded = this.raw.then(async entries => {
          for (const [name, bytes] of entries) {
            if (!bytes) continue;
            try { this.buffers[name] = await this.context.decodeAudioData(bytes.slice(0)); }
            catch { /* One unavailable effect must not silence the music. */ }
          }
          if (this.powerRequested && this.musicNeedsGesture) this.startPowerFallback();
          this.syncMusic();
        });
      }
      // This invocation is synchronous, in the original click/touch handler.
      if (this.context.state !== "running") {
        this.context.resume().then(() => this.syncMusic()).catch(error => this.fail(error));
      }
    } catch (error) { this.fail(error); }
    // Call play synchronously too: resuming Web Audio alone does not unlock a media element.
    this.syncMusic();
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) { this.pauseMusic(); this.stopPower(); this.stopEffects(); this.blocked = false; }
  }
  restart() {
    this.running = false; this.pauseMusic(); this.stopEffects(); this.stopPower();
    this.powerRequested = false; this.powerElapsed = 0; this.normalPosition = 0;
    this.setTrack("normal");
    try { this.music.currentTime = 0; } catch {}
  }
  pauseMusic() {
    this.musicAttempt++; this.musicPending = false; this.music.pause();
  }
  startMusic() {
    if (!this.music.paused || this.musicPending || this.musicNeedsGesture) return;
    const attempt = ++this.musicAttempt;
    this.musicPending = true;
    const failed = error => {
      if (attempt !== this.musicAttempt) return;
      this.musicPending = false;
      if (this.track === "superpower" && this.startPowerFallback()) return;
      this.musicNeedsGesture = error?.name === "NotAllowedError";
      this.fail(error);
    };
    try {
      const playing = this.music.play();
      Promise.resolve(playing).then(() => {
        if (attempt === this.musicAttempt) this.musicPending = false;
      }, failed);
    } catch (error) { failed(error); }
  }
  sync(running, stopEffects = false, powered = false, powerElapsed = 0) {
    this.running = running; this.powerRequested = powered; this.powerElapsed = powerElapsed;
    this.syncMusic();
    if (stopEffects || !this.enabled) this.stopEffects();
  }
  setTrack(next) {
    if (this.track === next) return;
    if (this.track === "normal") this.normalPosition = Number(this.music.currentTime) || 0;
    this.pauseMusic();
    this.stopPower();
    this.track = next;
    this.musicNeedsGesture = false;
    // Changing src on the already-unlocked element avoids a second, untrusted
    // audio autoplay request when a coin activates superpowär on iOS.
    this.music.src = this.tracks[next];
    this.music.load?.();
    try {
      const offset = next === "superpower" ? this.powerElapsed % 11.0759 : this.normalPosition;
      this.music.currentTime = offset;
    } catch { /* Metadata may arrive after play; starting at zero is fine. */ }
  }
  syncMusic() {
    if (!this.enabled || !this.running) {
      this.pauseMusic(); this.stopPower(); return;
    }
    this.setTrack(this.powerRequested ? "superpower" : "normal");
    if (!this.powerSource) this.startMusic();
  }
  startPowerFallback() {
    // If mobile Safari disallows the media source switch, a predecoded Web
    // Audio loop still provides the requested DNB while the normal music is off.
    if (this.powerSource) return true;
    const context = this.context, buffer = this.buffers.superpower;
    if (!this.powerRequested || !buffer || context?.state !== "running") return false;
    try {
      const source=context.createBufferSource(), gain=context.createGain();
      source.buffer=buffer; source.loop=true; gain.gain.value=.65;
      source.connect(gain); gain.connect(context.destination);
      source.start(0,this.powerElapsed % (buffer.duration || 11.0759));
      this.powerSource=source;this.powerGain=gain;
      this.blocked=false;this.musicNeedsGesture=false;this.onChange();
      return true;
    } catch { return false; }
  }
  stopPower() {
    if (!this.powerSource) return;
    const source = this.powerSource; this.powerSource = null;
    try { source.stop(); } catch { /* May already be stopped. */ }
    source.disconnect(); this.powerGain?.disconnect(); this.powerGain = null;
  }
  playLife() {
    if (!this.enabled || !this.running || this.context?.state !== "running") return;
    const c=this.context, now=c.currentTime;
    [523.25,659.25,1046.5].forEach((frequency,index)=>{
      const oscillator=c.createOscillator(), gain=c.createGain(), at=now+index*.10;
      oscillator.type="sine"; oscillator.frequency.setValueAtTime(frequency,at);
      gain.gain.setValueAtTime(.001,at);
      gain.gain.exponentialRampToValueAtTime(.12,at+.012);
      gain.gain.exponentialRampToValueAtTime(.001,at+.23);
      oscillator.connect(gain);gain.connect(c.destination);this.lifeNodes.add(oscillator);
      oscillator.onended=()=>{this.lifeNodes.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.start(at);oscillator.stop(at+.24);
    });
  }
  playLaser() {
    if (!this.enabled || this.context?.state !== "running") return;
    const c=this.context, now=c.currentTime;
    const oscillator=c.createOscillator(), gain=c.createGain();
    oscillator.type="triangle";
    oscillator.frequency.setValueAtTime(1300,now);
    oscillator.frequency.exponentialRampToValueAtTime(140,now+.16);
    gain.gain.setValueAtTime(.001,now);
    gain.gain.exponentialRampToValueAtTime(.16,now+.008);
    gain.gain.exponentialRampToValueAtTime(.001,now+.18);
    oscillator.connect(gain);gain.connect(c.destination);
    this.laserNodes.add(oscillator);
    oscillator.onended=()=>{this.laserNodes.delete(oscillator);oscillator.disconnect();gain.disconnect();};
    oscillator.start(now);oscillator.stop(now+.19);
  }
  play(name) {
    if (name === "laser") { this.playLaser(); return; }
    if (!this.enabled || !this.context || !this.buffers[name]) return;
    if (this.context.state !== "running") { this.fail(new Error("audio suspended")); return; }
    this.stopEffects(false);
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    source.buffer = this.buffers[name]; gain.gain.value = this.levels[name] || .6;
    source.connect(gain); gain.connect(this.context.destination);
    this.active = source;
    source.onended = () => {
      source.disconnect(); gain.disconnect();
      if (this.active === source) this.active = null;
    };
    source.start();
  }
  preview() {
    this.decoded?.then(() => { if (this.enabled && !this.running) this.play("coin"); });
  }
  stopEffects(includeLife = true) {
    if (includeLife) {
      for (const oscillator of this.lifeNodes) { try { oscillator.stop(); } catch {} }
      this.lifeNodes.clear();
    }
    for (const oscillator of this.laserNodes) { try { oscillator.stop(); } catch {} }
    this.laserNodes.clear();
    if (!this.active) return;
    const source = this.active; this.active = null;
    try { source.stop(); } catch { /* The effect may already have ended. */ }
  }
}
