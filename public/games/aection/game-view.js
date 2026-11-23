import { WorldScene } from "./world-view.js";
import { WORLDS } from "./worlds.js";
import { drawNewEnemy } from "./new-enemies.js";
import { drawSheep } from "./sheep-view.js";
import { drawObstacle } from "./obstacle-view.js";
const GREEN = "#6cff00", PAPER = "#fcfcfc", INK = "#0b0b0b";
function imageAt(url) {
  return new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = url; });
}
export class GameView {
  constructor(canvas, words) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d", { alpha: false });
    this.words = words; this.width = 900; this.height = 500;
    this.scale = 1; this.dpr = 1; this.last = 0; this.fps = 60;
    this.particles = Array.from({ length: 256 }, () => ({ life: 0, x: 0, y: 0, vx: 0, vy: 0, c: GREEN, size: 4 }));
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas);
    this.explosions = Array.from({length:24},()=>({life:0,duration:.75,x:0,y:0,size:0}));
    this.heroParts = []; this.images = {}; this.shake = 0; this.worldScene = new WorldScene();
  }
  async load() {
    const [city, grey, idea, parts, person1, person2, person3, daria, michael, bus, excavator] = await Promise.all([
      imageAt("./assets/city.webp"), imageAt("./assets/city-grey.webp"),
      imageAt("./assets/loki-coin.svg"), fetch("./assets/hero-paths.json").then(r => { if (!r.ok) throw new Error("mark"); return r.json(); }),
      imageAt("./assets/comic-opponent-1.webp"), imageAt("./assets/comic-opponent-2.webp"), imageAt("./assets/comic-opponent-3.webp"), imageAt("./assets/comic-daria.webp"), imageAt("./assets/comic-michael-roll.webp"), imageAt("./assets/comic-schnyder-bus.webp"), imageAt("./assets/comic-oli-excavator.webp")
    ]);
    this.images = { city, grey, idea, people:[person1, person2, person3], daria, michael, bus, excavator };
    this.heroParts = parts.map(d => new Path2D(d));
    this.images.worlds = Object.fromEntries(await Promise.all(WORLDS.slice(1).map(async w => [w.id, await imageAt("./assets/world-"+w.id+".webp")])));
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    // Frame the action for portrait screens instead of shrinking a desktop view.
    const portrait = r.width <= 680 && r.height > r.width;
    this.width = portrait ? Math.max(540, r.width * 1.1) : 900;
    this.scale = r.width / this.width;
    this.height = r.height / this.scale;
    // Keep the complete hero ring above the touch controls.
    this.ground = portrait
      ? (r.height - 112) / this.scale
      : this.height - Math.min(210, this.height * 0.27);
    this.playerX = portrait ? this.width * 0.20 : Math.max(155, this.width * 0.2);
  }
  emit(kind, state, reduced) {
    if (state.bursts?.length) {
      for(const burst of state.bursts) {
        const ring=this.explosions.find(e=>e.life<=0)||this.explosions[0];
        ring.duration=reduced ? .32 : .75;ring.life=ring.duration;
        ring.x=this.playerX+burst.x;ring.y=this.ground-burst.y;ring.size=burst.size;
        if(reduced)continue;
        let count=0;
        for(let i=0;i<this.particles.length&&count<28;i++){
          const p=this.particles[i];if(p.life>0)continue;
          const a=count*Math.PI*2/28, speed=175+(count%5)*48;
          p.x=ring.x;p.y=ring.y;p.vx=Math.cos(a)*speed;p.vy=Math.sin(a)*speed;
          p.life=.48+(count%4)*.10;
          p.c=count%5===0?PAPER:count%3===0?"#f7df48":GREEN;
          p.size=4+count%6;count++;
        }
      }
      if(kind==="smash" || kind==="laserHit")return;
    }
    if (reduced) return;
    const colors = ["hit", "sheepHit", "personHit"].includes(kind) ? ["#ff7a7a", PAPER] : [GREEN, PAPER, "#f5ff00"];
    const amount = kind === "boost" ? 48 : ["finish", "rescue", "smash"].includes(kind) ? 28 : 8;
    let count = 0;
    for (let i = 0; i < this.particles.length && count < amount; i++) {
      const p = this.particles[i]; if (p.life > 0) continue;
      const a = (i * 2.39996 + state.tick * 0.6);
      p.x = this.playerX; p.y = this.ground - state.y - 45;
      p.vx = Math.cos(a) * (80 + i % 5 * 30); p.vy = Math.sin(a) * 120 - 80;
      p.life = 0.45 + i % 4 * 0.08; p.c = colors[i % colors.length]; p.size = i % 3 + 3; count++;
    }
    if (kind === "hit" || kind === "sheepHit" || kind === "personHit") this.shake = 0.16;
  }
  hero(x, bottom, size, state, opts) {
    const c = this.ctx;
    c.save();
    c.translate(x, bottom);
    const airborne = state.y > 0;
    const bob = opts.reduced ? 0 : Math.sin(state.time * 21) * (airborne ? 0 : 2.5);
    const lean = opts.reduced ? 0 : airborne ? -0.10 + state.vy * 0.00014 : Math.sin(state.time * 12) * 0.035;
    c.translate(0, bob); c.rotate(lean);
    if (state.boost > 0) {
      // Cloth trails behind the Ä. Reduced motion keeps the same clear silhouette.
      const wave = opts.reduced ? 0 : Math.sin(state.time * 15) * size * .10;
      c.save(); c.fillStyle=GREEN; c.strokeStyle=INK; c.lineWidth=3;
      c.beginPath(); c.moveTo(-size*.18,-size*.85);
      c.bezierCurveTo(-size*.55,-size*.92,-size*.90,-size*.48+wave,-size*1.40,-size*.57+wave);
      c.lineTo(-size*1.16,-size*.24+wave*.5); c.lineTo(-size*1.35,-size*.03+wave);
      c.bezierCurveTo(-size*.83,size*.04,-size*.36,-size*.07,-size*.16,-size*.27);
      c.closePath(); c.fill(); c.stroke();
      c.strokeStyle="#287d00";c.lineWidth=2;
      c.beginPath();c.moveTo(-size*.22,-size*.72);c.quadraticCurveTo(-size*.72,-size*.35+wave,-size*1.13,-size*.34+wave);c.stroke();
      c.strokeStyle="#c5ff9e";c.beginPath();c.moveTo(-size*.27,-size*.55);c.quadraticCurveTo(-size*.67,-size*.12,-size*.95,-size*.12+wave*.5);c.stroke();
      c.restore();
    }
    const blink = state.invulnerable > 0 && Math.floor(state.time * 16) % 2 === 0;
    c.globalAlpha = blink ? 0.45 : 1;
    c.strokeStyle=GREEN; c.lineWidth=state.boost>0?3:2;
    c.beginPath();c.arc(0,-size*.52,size*.80,0,Math.PI*2);c.closePath();c.stroke();
    if (state.boost > 0) {
      c.fillStyle = "#6cff0020"; c.beginPath(); c.arc(0, -size * 0.52, size * 0.83, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GREEN; c.lineWidth = 2; c.beginPath(); c.arc(0, -size * 0.52, size * 0.83, 0, Math.PI * 2); c.stroke();
    }
    c.scale(size / 26, size / 26);
    c.translate(-125.5, -28);
    for (let i = 0; i < this.heroParts.length; i++) {
      c.fillStyle = i < 2 && state.dots < Math.ceil((i + 1) * state.powerCharge / 2) && state.boost <= 0 ? "#63bc24" : GREEN;
      c.fill(this.heroParts[i]);
    }
    c.restore();
  }
  draw(state, dt, opts) {
    const started = performance.now();
    const c = this.ctx, W = this.width, H = this.height, G = this.ground || H * 0.73;
    const transform = this.scale * this.dpr;
    c.setTransform(transform, 0, 0, transform, 0, 0);
    c.fillStyle = "#eee9e1"; c.fillRect(0, 0, W, H);
    c.save();
    if (!opts.reduced && this.shake > 0) {
      this.shake -= dt;
      c.translate(Math.sin(state.tick * 11) * 3, Math.cos(state.tick * 9) * 2);
    }
    const worldPalette = this.worldScene.draw(c, W, G, state, this.images, opts, this.scale);
    // An anchored street keeps collisions clear at every aspect ratio.
    c.fillStyle = worldPalette.floor; c.fillRect(0, G, W, H - G);
    c.fillStyle = state.boost > 0 ? GREEN : worldPalette.edge; c.fillRect(0, G, W, 4);
    c.fillStyle = "#272727"; c.fillRect(0, G + 39, W, 1);
    c.fillStyle = "#454545";
    const roadShift = (state.distance * 1.05) % 105;
    for (let x = -roadShift; x < W; x += 105) c.fillRect(x, G + 56, 30, 2);
    if (!opts.reduced) {
      c.fillStyle = "#1c1c1c";
      for (let i = 0; i < 20; i++) { const x = (i * 83 - state.distance * (1 + i % 2 * 0.15)) % W; c.fillRect(x < 0 ? x + W : x, G + 80 + i % 4 * 14, 13, 1); }
    }
    if (state.boost > 0 && !opts.reduced) {
      c.strokeStyle = "#6cff0080"; c.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const yy = G - 18 - (i * 31) % Math.max(160,G-80);
        const xx = W - (state.distance * 2.4 + i * 165) % (W + 140);
        c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 75 + i % 3 * 22, yy); c.stroke();
      }
    }
    c.fillStyle = "#0003"; c.beginPath();
    c.ellipse(this.playerX, G + 8, Math.max(16, 38 - state.y * 0.065), 7, 0, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < state.entities.length; i++) {
      const e = state.entities[i], x = this.playerX + e.x, yy = G - e.y;
      if(e.type==="runner" && x>W-30 && x<W+360){
        c.save();c.fillStyle=INK;c.fillRect(W-104,G-146,88,26);c.fillStyle=GREEN;
        c.font="800 12px Agency,Arial";c.textAlign="center";c.fillText(this.words.runnerWarning,W-60,G-129);c.restore();
      }
      if ((e.type==="bus" || e.type==="excavator") && x>W-30 && x<W+420) {
        c.save();c.fillStyle=INK;c.fillRect(W-155,G-188,140,28);c.fillStyle=GREEN;
        c.font="800 12px Agency,Arial";c.textAlign="center";c.fillText(this.words.vehicleWarning,W-85,G-170,132);c.restore();
      }
      if (["taxman","raclette","herens","ufo"].includes(e.type) && x>W-30 && x<W+300) {
        const cue=e.type==="ufo" ? (e.y>100?this.words.stayLow:this.words.jumpOrLaser) : e.type==="raclette"?this.words.vehicleWarning:this.words.jump;
        c.save();c.fillStyle=INK;c.fillRect(W-202,G-238,184,44);c.fillStyle=GREEN;
        c.font="900 13px Agency,Arial";c.textAlign="center";
        c.fillText(this.words.enemyNames[e.type],W-110,G-220,174);
        c.fillStyle=PAPER;c.font="700 11px Agency,Arial";c.fillText(cue,W-110,G-204,174);c.restore();
      }
      if (x < -200 || x > W + 200) continue;
      if (e.type === "idea") {
        const bounce = opts.reduced ? 0 : Math.sin(state.time * 5 + e.id) * 3;
        c.save();c.translate(x, yy - e.h / 2 - bounce);
        c.rotate(opts.reduced ? 0 : Math.sin(state.time * 3 + e.id) * .09);
        c.drawImage(this.images.idea, -16, -16, 32, 32);c.restore();
      } else if (e.type === "dot") {
        const rotate = opts.reduced ? -0.1 : -0.1 + Math.sin(state.time * 3 + e.id) * 0.08;
        c.save(); c.translate(x, yy - 14); c.rotate(rotate);
        c.fillStyle = INK; c.fillRect(-18, -18, 36, 36);
        c.fillStyle = GREEN; c.fillRect(-13, -13, 26, 26);
        c.strokeStyle = "#6cff0040"; c.lineWidth = 1; c.strokeRect(-24, -24, 48, 48);
        c.restore();
      } else if (e.type === "michael") {
        const sprite=this.images.michael, size=94, scale=size/Math.max(sprite.width,sprite.height);
        c.save();c.translate(x,yy-size/2);
        c.rotate(opts.reduced?0:-state.time*(6+(e.speedBonus||0)/80));
        c.drawImage(sprite,-sprite.width*scale/2,-sprite.height*scale/2,sprite.width*scale,sprite.height*scale);c.restore();
      } else if (e.type === "bus" || e.type === "excavator") {
        const sprite=this.images[e.type], w=e.w+(e.type==="bus"?22:28), h=w*sprite.height/sprite.width;
        const rumble=opts.reduced?0:Math.abs(Math.sin(state.time*23+e.id))*1.7;
        c.save();c.translate(x,yy-rumble);c.drawImage(sprite,-w/2,-h,w,h);c.restore();
      } else if (e.type === "person" || e.type === "runner") {
        const runner=e.type==="runner",sprite=runner?this.images.daria:this.images.people[e.variant%3], h=runner?118:112, w=h*sprite.width/sprite.height;
        const walk=opts.reduced?0:Math.sin(state.time*(runner?24:13)+e.id)*(runner?4:2.5);
        c.save();c.translate(x,yy-Math.abs(walk));c.rotate(opts.reduced?0:walk*.006);
        if(runner||e.variant%3<2)c.scale(-1,1);
        c.drawImage(sprite,-w/2,-h,w,h);c.restore();
      } else if (e.type === "flyer") {
        c.save(); c.translate(x, yy-e.h/2);
        // Paper-plane silhouette points towards the player. The two flight
        // heights stay fixed so the player can read jump versus stay-low.
        c.strokeStyle=INK; c.lineWidth=3; c.fillStyle=opts.contrast?"#ff5252":"#ff7a7a";
        c.beginPath();c.moveTo(-e.w/2,0);c.lineTo(e.w/2,-e.h/2);
        c.lineTo(e.w*.28,0);c.lineTo(e.w/2,e.h/2);c.closePath();c.fill();c.stroke();
        c.beginPath();c.moveTo(-e.w/2,0);c.lineTo(e.w*.28,0);c.stroke();
        c.fillStyle=INK;c.font="800 11px Agency,Arial";c.textAlign="center";
        c.fillText(this.words.flyerLabel,8,-4,45);
        c.strokeStyle="#ff5252";c.lineWidth=2;
        for(let trail=0;trail<3;trail++){
          c.beginPath();c.moveTo(e.w/2+8,trail*12-12);c.lineTo(e.w/2+34+trail*8,trail*12-12);c.stroke();
        }
        c.restore();
      } else if (["cone","barrier","roller","drone"].includes(e.type)) {
        drawObstacle(c,x,yy,e,state.time,opts,this.words);
      } else if (["taxman","raclette","herens","ufo"].includes(e.type)) {
        drawNewEnemy(c,x,yy,e,state.time,opts,this.words);
      } else if (e.type === "sheep") {
        drawSheep(c,x,yy,e,state.time,opts);
      } else {
        c.save(); c.translate(x, yy);
        c.fillStyle = opts.contrast ? "#ff5252" : "#ff7a7a";
        c.strokeStyle = INK; c.lineWidth = 3;
        const flying = e.y > 0;
        const ew = e.w, eh = e.h;
        c.beginPath(); c.roundRect(-ew / 2, -eh, ew, eh, flying ? 18 : 3); c.fill(); c.stroke();
        c.fillStyle = INK;
        const labels = flying ? (this.words.flyingHazards || this.words.hazards) : this.words.hazards;
        const label = labels[(e.id + (e.variant || 0)) % labels.length];
        const parts = label.split(" ");
        const lines = parts.length > 1 ? [parts.slice(0,Math.ceil(parts.length/2)).join(" "), parts.slice(Math.ceil(parts.length/2)).join(" ")] : [label];
        let fs = flying ? 15 : 18;
        c.font = "800 " + fs + "px Agency,Arial";
        while (Math.max(...lines.map(line=>c.measureText(line).width)) > ew - 10 && fs > 10) c.font = "800 " + (--fs) + "px Agency,Arial";
        c.textAlign = "center"; c.textBaseline = "middle";
        lines.forEach((line,index)=>c.fillText(line,0,-eh/2+(index-(lines.length-1)/2)*(fs+2),ew-8));
        if (flying) {
          c.strokeStyle = "#0005"; c.lineWidth = 1;
          c.beginPath(); c.moveTo(-22, 0); c.quadraticCurveTo(-32, 18, -19, 24); c.stroke();
        } else {
          c.fillRect(-ew / 2 + 8, -eh + 7, 5, 4);
          c.fillRect(ew / 2 - 13, -eh + 7, 5, 4);
        }
        c.restore();
      }
    }
    if (state.boost > 0) {
      if (!opts.reduced) {
        for (let trail = 4; trail > 0; trail--) {
          c.save(); c.globalAlpha = .06 + (4-trail)*.035; c.fillStyle = GREEN;
          c.translate(this.playerX-trail*23, G-state.y+Math.sin(state.time*7-trail)*3);
          c.scale(95/26,95/26); c.translate(-125.5,-28);
          for (let part=0;part<this.heroParts.length;part++) c.fill(this.heroParts[part]);
          c.restore();
        }
      }
      c.save(); c.strokeStyle = GREEN; c.lineWidth = 3;
      c.translate(this.playerX,G-state.y-49);
      c.rotate(opts.reduced ? 0 : state.time*2);
      for (let ring=0;ring<3;ring++) {
        c.globalAlpha = .65-ring*.17;
        c.beginPath(); c.arc(0,0,81+ring*10,ring*2,ring*2+1.3); c.stroke();
      }
      c.restore();
    }
    // The bolt stays at its firing height, so aerial targets require a jump.
    for (const shot of state.shots) {
      const x=this.playerX+shot.x, y=G-shot.y;
      c.save(); c.lineCap="round";
      c.strokeStyle=INK;c.lineWidth=12;c.beginPath();c.moveTo(x-23,y);c.lineTo(x+23,y);c.stroke();
      if(!opts.reduced){c.shadowColor=GREEN;c.shadowBlur=12;}
      c.strokeStyle=GREEN;c.lineWidth=8;c.stroke();
      c.shadowBlur=0;c.strokeStyle=PAPER;c.lineWidth=3;c.stroke();
      c.restore();
    }
    this.hero(this.playerX, G - state.y, 95, state, opts);
    if (state.laserCooldownTicks > state.laserCooldownMax-9) {
      c.save();c.translate(this.playerX+42,G-state.y-43);
      c.fillStyle=INK;c.fillRect(-16,-7,27,14);
      c.fillStyle=GREEN;c.fillRect(-11,-3,28,6);
      if(!opts.reduced){c.strokeStyle=PAPER;c.lineWidth=2;c.beginPath();c.moveTo(16,-9);c.lineTo(23,0);c.lineTo(16,9);c.stroke();}
      c.restore();
    }
    if (!opts.reduced) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i]; if (p.life <= 0) continue;
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 250 * dt;
        c.globalAlpha = Math.min(1, p.life * 3); c.fillStyle = p.c; c.fillRect(p.x, p.y, p.size, p.size);
      }
      c.globalAlpha = 1;
    }
    // High-contrast cartoon explosion: white flash, neon blast and flying shards.
    for(const ring of this.explosions){
      if(ring.life<=0)continue;
      ring.life=Math.max(0,ring.life-dt);
      const progress=1-ring.life/ring.duration;
      const fade=Math.max(0,1-progress);
      const radius=(opts.reduced ? .25+progress*.45 : .18+progress*1.15)*ring.size;
      c.save();c.translate(ring.x,ring.y);
      if(!opts.reduced && progress<.28){
        c.globalAlpha=(1-progress/.28)*.90;
        c.fillStyle=PAPER;
        c.beginPath();c.arc(0,0,ring.size*(.25+progress*.60),0,Math.PI*2);c.fill();
      }
      c.globalAlpha=fade*.95;
      c.strokeStyle=GREEN;c.lineWidth=opts.reduced?4:Math.max(2,8*(1-progress));
      c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();
      if(!opts.reduced){
        c.strokeStyle=PAPER;c.lineWidth=Math.max(1,3*(1-progress));
        c.beginPath();c.arc(0,0,radius*.70,0,Math.PI*2);c.stroke();
        c.strokeStyle="#f7df48";c.lineWidth=3;
        for(let spoke=0;spoke<10;spoke++){
          const a=spoke*Math.PI/5 + progress*.2, inner=radius*.48, outer=radius*(1.1+(spoke%3)*.12);
          c.beginPath();c.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);
          c.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);c.stroke();
        }
      }
      c.restore();
    }
    if (opts.contrast) {
      c.strokeStyle = "#000"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, G); c.lineTo(W, G); c.stroke();
    }
    c.restore();
    this.renderMs = performance.now() - started;
    if (dt > 0) this.fps = this.fps * 0.94 + Math.min(120, 1 / dt) * 0.06;
  }
}
