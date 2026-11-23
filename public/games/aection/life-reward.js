// Presentation only: the authoritative rules still award one life, capped at three.
export function earnedLife(before, after) {
  return before.phase === "running" && after.phase === "running"
    && after.level > before.level && after.lives > before.lives;
}
const clamp = value => Math.max(0, Math.min(1, value));
export class LifeReward {
  constructor(arena, lives) {
    this.arena = arena; this.lives = lives; this.active = null;
    this.element = document.createElement("div");
    this.element.className = "life-reward"; this.element.hidden = true;
    this.element.setAttribute("aria-hidden", "true");
    this.heart = lives.firstElementChild.cloneNode(true);
    this.heart.removeAttribute("class"); this.heart.classList.add("life-reward-heart");
    this.label = document.createElement("strong"); this.label.className = "life-reward-label";
    this.element.append(this.heart, this.label); arena.append(this.element);
  }
  start(state, label) {
    this.clear();
    this.active = {time:state.time, slot:state.lives-1};
    this.label.textContent = label; this.element.hidden = false;
  }
  clear() {
    this.active = null; this.element.hidden = true;
    this.arena.classList.remove("life-reward-active");
    for (const heart of this.lives.children) {
      heart.classList.remove("life-received"); heart.style.removeProperty("--life-glow");
    }
  }
  render(state, reduced = false) {
    if (!this.active) return;
    if (state.phase === "over" || state.phase === "intro") { this.clear(); return; }
    // Use game time: pausing or switching away freezes the complete celebration.
    const age = Math.max(0, state.time-this.active.time);
    if (age >= 2.3) { this.clear(); return; }
    const target = this.lives.children[this.active.slot];
    const arena = this.arena.getBoundingClientRect(), rect = target.getBoundingClientRect();
    const size = Math.min(160, arena.width*.35, arena.height*.30);
    const startX = arena.width*.5, startY = Math.max(size*.65+110, arena.height*.37);
    const endX = rect.left-arena.left+rect.width/2, endY = rect.top-arena.top+rect.height/2;
    const flight = clamp((age-.9)/.7), eased = flight*flight*(3-2*flight);
    let x=startX, y=startY, scale=1, opacity=1;
    if (reduced) {
      opacity = 1-clamp((age-1.25)/.25);
    } else {
      const pop=clamp(age/.28);
      scale = age < .28 ? .25+1.02*Math.sin(pop*Math.PI/2) : age < .45 ? 1.27-.27*clamp((age-.28)/.17) : 1;
      if (flight > 0) {
        x += (endX-startX)*eased;
        y += (endY-startY)*eased-Math.sin(flight*Math.PI)*Math.min(55,arena.height*.1);
        scale = 1+(rect.width/size-1)*eased;
      }
      if (age >= 1.6) opacity=0;
    }
    this.arena.classList.toggle("life-reward-active",age<.95);
    Object.assign(this.heart.style,{
      width:size+"px",height:size+"px",left:x+"px",top:y+"px",
      transform:"translate(-50%,-50%) scale("+scale+")",opacity:String(opacity)
    });
    Object.assign(this.label.style,{
      left:startX+"px",top:(startY+size*.55)+"px",
      opacity:String(1-clamp((age-.85)/.25))
    });
    const landed = reduced ? age >= 1.5 : age >= 1.6;
    target.classList.toggle("life-received",landed && !target.classList.contains("lost"));
    target.style.setProperty("--life-glow",String(reduced ? 1 : 1+Math.sin(clamp((age-1.6)/.7)*Math.PI)*.6));
  }
}
