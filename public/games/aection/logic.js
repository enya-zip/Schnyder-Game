// ÄCTION! Deterministic endless solo runner. Rendering and audio stay outside the rules.
export const meta = { game: "ÄCTION!", minPlayers: 1, maxPlayers: 1 };
const DT = 1 / 60, LEVEL_SECONDS = 20;
const OBSTACLE_RATE = .7; // 30% fewer obstacle waves at every difficulty level.
const ROUND_SPEED_STEP = 18;
const NEW_ENEMIES = [[2,"taxman"],[3,"raclette"],[4,"herens"],[5,"ufo"]];
const GRAVITY = 1900, JUMP = 700, POWER_SECONDS = 8, POWER_CHARGE = 10;
const LASER_COOLDOWN = 300, LASER_SPEED = 1050; // Five seconds at 60 simulation ticks/s.
// Every harmful object in the runner is a valid laser target. Collectibles are excluded.
const LASER_TARGETS = ["hazard", "cone", "barrier", "roller", "flyer", "drone", "ufo",
  "taxman", "raclette", "herens", "sheep", "person", "runner", "michael", "bus", "excavator"];
function nextRandom(seed) {
  const n = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return [n, n / 4294967296];
}
function seedFor(value) {
  let n = 2166136261;
  for (const c of String(value)) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  return n || 971;
}
function emit(s, event) {
  if (s.event === "boost" && event !== "gameOver") return;
  s.event = event; s.eventId++;
}
export function setup(players = ["solo"]) {
  return {
    player: players[0] || "solo", phase: "ready", tick: 0, time: 0,
    level: 1, levelSeconds: LEVEL_SECONDS, levelTime: 0,
    powerCharge: POWER_CHARGE, powerSeconds: POWER_SECONDS, powersUsed: 0,
    y: 0, vy: 0, jumps: 0, buffer: 0, distance: 0, speed: 252,
    laserCooldownTicks: 0, laserCooldownMax: LASER_COOLDOWN, shots: [], shotsFired: 0, laserHits: 0,
    lives: 3, score: 0, ideas: 0, rescued: 0, dots: 0, boost: 0, boostTicks: 0,
    invulnerable: 0, combo: 0, bestCombo: 0, event: null, eventId: 0,
    seed: seedFor(players[0]), citySeed: seedFor(players[0]), spawnIn: 1.2 / OBSTACLE_RATE, nextId: 10, pattern: 0, opponentsSpawned: 0, dariaSpawned: 0, dariaLevel: 0, busSeen: false, excavatorSeen: false, enemyIntroduced: [], ufoLowNext: true, obstacleBag: [], lastObstacle: null, bursts: [],
    entities: [
      { id: 1, type: "idea", x: 380, y: 42, w: 30, h: 30 },
      { id: 2, type: "dot", x: 470, y: 36, w: 28, h: 28 },
      { id: 3, type: "dot", x: 650, y: 80, w: 28, h: 28 },
      { id: 4, type: "hazard", x: 650, y: 0, w: 70, h: 60, variant: 0 },
      { id: 5, type: "idea", x: 660, y: 116, w: 30, h: 30 }
    ]
  };
}
export function validateAction(state, playerId, action) {
  if (!state || playerId !== state.player) return { ok: false, error: "invalid player" };
  if (!action || typeof action !== "object") return { ok: false, error: "invalid action" };
  if (action.type === "start") return { ok: state.phase === "ready" };
  if (action.type === "resume") return { ok: state.phase === "paused" };
  if (action.type === "shoot") return { ok: state.phase === "running" && state.laserCooldownTicks === 0 };
  if (["step", "pause", "jump"].includes(action.type)) {
    return { ok: state.phase === "running" };
  }
  return { ok: false, error: "unknown action" };
}
export function applyAction(state, playerId, action) {
  if (!validateAction(state, playerId, action).ok) return state;
  if (action.type === "start") return { ...state, phase: "running" };
  if (action.type === "pause") return { ...state, phase: "paused" };
  if (action.type === "resume") return { ...state, phase: "running" };
  if (action.type === "shoot") {
    // On touchscreens the fire button has no aiming control: assist towards the
    // nearest approaching obstacle, including high drones and UFOs.
    const target = state.entities
      .filter(e => LASER_TARGETS.includes(e.type) && e.x > 58 && e.x < 925)
      .sort((a,b) => a.x-b.x)[0];
    const originY = state.y + 43;
    const targetY = target ? target.y + target.h / 2 : originY;
    return { ...state, laserCooldownTicks: LASER_COOLDOWN, shotsFired: state.shotsFired + 1,
      nextId: state.nextId + 1,
      shots: [...state.shots, { id:state.nextId, x:42, y:originY, originY, targetY,
        targetX:target?.x ?? null, targetId:target?.id ?? null, w:46, h:12, ttl:55 }],
      event:"shoot", eventId:state.eventId+1 };
  }
  if (action.type === "jump") {
    if (state.jumps >= 2) return { ...state, buffer: 0.12 };
    return { ...state, vy: JUMP, jumps: state.jumps + 1, buffer: 0,
      event: state.jumps ? "doubleJump" : "jump", eventId: state.eventId + 1 };
  }
  const s = { ...state, entities: [], shots: [], bursts: [], event: null, tick: state.tick + 1 };
  s.time = s.tick * DT;
  s.level = 1 + Math.floor(s.tick / (LEVEL_SECONDS * 60));
  s.levelTime = (s.tick % (LEVEL_SECONDS * 60)) * DT;
  if (s.level > state.level) {
    s.obstacleBag = [];
    s.score += 50;
    s.lives = Math.min(3, s.lives + 1);
    emit(s, "level");
  }
  s.boostTicks = Math.max(0, s.boostTicks - 1);
  s.boost = s.boostTicks * DT;
  // First stage runs 30% slower; ease back to the established pace over the next minute.
  const openingPace = .7 + .3 * Math.min(1, Math.max(0, (s.time - LEVEL_SECONDS) / 60));
  s.speed = (360 + 80 * (1 - Math.exp(-s.time / 6)) + 52 * Math.log2(s.level) + ROUND_SPEED_STEP * (s.level - 1)) * openingPace * (s.boost > 0 ? 1.22 : 1);
  s.laserCooldownTicks = Math.max(0, s.laserCooldownTicks - 1);
  s.distance += s.speed * DT;
  s.invulnerable = Math.max(0, s.invulnerable - DT);
  s.buffer = Math.max(0, s.buffer - DT);
  s.vy -= GRAVITY * DT; s.y += s.vy * DT;
  if (s.y <= 0) {
    s.y = 0; s.vy = 0; s.jumps = 0;
    if (s.buffer > 0) { s.vy = JUMP; s.jumps = 1; s.buffer = 0; }
  }
  const moved = state.entities.map(e => ({ ...e, x:e.x-(s.speed+(e.speedBonus||0))*DT }));
  const destroyed = new Set();
  for (const original of state.shots) {
    const shot = { ...original, x:original.x+LASER_SPEED*DT, ttl:original.ttl-1 };
    if (original.targetX != null) {
      // The visible bolt bends smoothly from the character towards its target.
      const travel = Math.max(30, original.targetX - 42 - 45);
      const progress = Math.min(1, Math.max(0, (shot.x - 42) / travel));
      shot.y = original.originY + (original.targetY - original.originY) * progress;
    }
    let target = -1, firstContact = Infinity;
    for (let i=0;i<moved.length;i++) {
      const e=moved[i], previous=state.entities[i];
      if (destroyed.has(e.id) || !LASER_TARGETS.includes(e.type)) continue;
      // Swept height prevents a fast diagonal bolt from slipping through a target.
      if (Math.max(shot.y, original.y)+shot.h/2 < e.y ||
          Math.min(shot.y, original.y)-shot.h/2 > e.y+e.h) continue;
      // Relative swept collision catches fast projectiles and oncoming obstacles.
      const from=original.x-previous.x, to=shot.x-e.x, radius=(e.w+shot.w)/2;
      if (from>radius || to < -radius) continue;
      const contact=Math.max(0,(-radius-from)/(to-from));
      if (contact<firstContact) { firstContact=contact; target=i; }
    }
    if (target>=0) {
      const e=moved[target]; destroyed.add(e.id); s.laserHits++; s.score+=15;
      s.bursts.push({id:e.id,x:e.x,y:e.y+e.h/2,size:Math.max(e.w,e.h)});
      emit(s,"laserHit");
    } else if (shot.ttl>0 && shot.x<1000) s.shots.push(shot);
  }
  for (const e of moved) {
    if (destroyed.has(e.id)) continue;
    if (e.x < -140) continue;
    const horizontal = e.x - e.w / 2 < 24 && e.x + e.w / 2 > -24;
    const vertical = s.y + 12 < e.y + e.h && s.y + 66 > e.y;
    const collectible = e.type === "idea" || e.type === "dot";
    const magnet = s.boost > 0 && collectible && Math.abs(e.x) < 190 && Math.abs(e.y - s.y - 45) < 145;
    if ((horizontal && vertical) || magnet) {
      const multiplier = s.boost > 0 ? 2 : 1;
      if (e.type === "idea") {
        s.ideas++; s.combo++; s.bestCombo = Math.max(s.bestCombo, s.combo);
        s.score += (10 + Math.min(20, Math.floor(s.combo / 5) * 5)) * multiplier;
        if (s.ideas % 4 === 0) { s.rescued++; emit(s, "rescue"); }
        else emit(s, "idea");
        continue;
      }
      if (e.type === "dot") {
        s.score += 25 * multiplier;
        if (s.boost <= 0) {
          s.dots++;
          if (s.dots >= POWER_CHARGE) {
            s.dots = 0; s.boostTicks = POWER_SECONDS * 60; s.boost = POWER_SECONDS;
            s.powersUsed++; s.rescued += 2; s.score += 100; emit(s, "boost");
          } else emit(s, "dot");
        } else emit(s, "dot");
        continue;
      }
      if (s.boost > 0) {
        s.score += 30;
        s.bursts.push({id:e.id,x:e.x,y:e.y+e.h/2,size:Math.max(e.w,e.h)});
        emit(s,"smash"); continue;
      }
      // Ordinary character contact costs one life; invulnerability avoids repeat hits.
      if (e.type === "sheep" || e.type === "person" || e.type === "runner" || e.type === "taxman" || e.type === "raclette" || e.type === "herens") {
        if (!e.hit && s.invulnerable <= 0) {
          s.lives--; s.combo = 0; s.invulnerable = 1.2; e.hit = true; emit(s, e.type !== "sheep" ? "personHit" : "sheepHit");
        }
        s.entities.push(e); continue;
      }
      if (s.invulnerable <= 0) {
        s.lives--; s.combo = 0; s.invulnerable = 1.2; emit(s, "hit"); continue;
      }
    }
    s.entities.push(e);
  }
  s.spawnIn -= DT;
  if (s.spawnIn <= 0) {
    let n, r; [n, r] = nextRandom(s.seed); s.seed = n; s.pattern++;
    // A shuffled bag covers every available obstacle before repeating a type.
    // Daria makes one special appearance in levels 3, 6, 9, ...
    const runner = s.level % 3 === 0 && s.dariaLevel !== s.level;
    const debut = s.level >= 4 && !s.excavatorSeen ? "excavator" : s.level >= 2 && !s.busSeen ? "bus" : null;
    const newEnemy = NEW_ENEMIES.find(([level,type]) => s.level >= level && !s.enemyIntroduced.includes(type))?.[1];
    const bonus = !runner && !debut && !newEnemy && s.pattern % 8 === 0;
    let type = runner ? "runner" : debut || newEnemy;
    if (!runner && !debut && !newEnemy && !bonus) {
      const bag = [...s.obstacleBag];
      if (!bag.length) {
        bag.push("hazard", "cone", "barrier", "person", "michael");
        if (s.level >= 2) bag.push("roller", "sheep", "bus");
        if (s.level >= 3) bag.push("flyer");
        if (s.level >= 4) bag.push("drone", "excavator");
        for (const [level,type] of NEW_ENEMIES) if (s.level >= level) bag.push(type);
        for (let i = bag.length - 1; i > 0; i--) {
          let pick; [s.seed, pick] = nextRandom(s.seed);
          const j = Math.floor(pick * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        if (bag[0] === s.lastObstacle) [bag[0], bag[1]] = [bag[1], bag[0]];
      }
      type = bag.shift(); s.obstacleBag = bag;
    }
    const low = (type === "flyer" && s.level >= 5 && r < .5) || (type === "ufo" && s.level >= 7 && s.ufoLowNext);
    const speedBonus = type === "ufo" ? 90 + 12 * Math.log2(s.level)
      : type === "herens" ? 85 + 12 * Math.log2(s.level)
      : type === "taxman" ? 30 + 8 * Math.log2(s.level)
      : type === "raclette" ? 20 + 6 * Math.log2(s.level)
      : runner ? 220 + 35 * Math.log2(s.level)
      : type === "flyer" ? 105 + 22 * Math.log2(s.level)
      : type === "bus" ? 150 + 18 * Math.log2(s.level)
      : type === "excavator" ? 80 + 15 * Math.log2(s.level)
      : type === "michael" ? 130 + 16 * Math.log2(s.level)
      : type === "roller" ? 90 + 18 * Math.log2(s.level)
      : type === "drone" ? 80 + 14 * Math.log2(s.level)
      : type === "person" ? 40 + 10 * Math.log2(s.level)
      : type === "sheep" ? 55 + 12 * Math.log2(s.level) : 0;
    const velocity = s.speed + speedBonus;
    // Keep unlike flight/ground patterns separated, including faster rollers.
    let latestArrival = 0;
    for (const e of s.entities) {
      if (e.type !== "idea" && e.type !== "dot" && e.x > 0) {
        latestArrival = Math.max(latestArrival, e.x / (s.speed + (e.speedBonus || 0)));
      }
    }
    const largeVehicle = type === "bus" || type === "excavator" || type === "raclette";
    const x = Math.max(1000, (latestArrival + (largeVehicle ? 1.4 : 1.15)) * velocity);
    if (runner) { s.dariaSpawned++; s.dariaLevel = s.level; }
    const dimensions = {
      taxman: [64,92], raclette: [114,96], herens: [112,82], ufo: [116,62],
      runner: [62,84], flyer: [100,42], person: [64,88], sheep: [94,64],
      michael: [72,72], bus: [160,84], excavator: [184,102],
      cone: [52,66], barrier: [Math.round(112 * openingPace),44], roller: [68,68], drone: [118,48],
      hazard: [58 + Math.floor(r*20) + Math.min(12,s.level), 56 + Math.floor(r*14)]
    };
    if (type) {
      const [w,h] = dimensions[type];
      s.entities.push({
        id:s.nextId++,type,x,y:type==="ufo"?(low?30:142):type==="drone"?148:type==="flyer"?(low?30:160):0,
        w,h,speedBonus,variant:type==="person"?s.opponentsSpawned++%3:s.pattern%4
      });
      s.lastObstacle = type;
      if (type === "ufo" && s.level >= 7) s.ufoLowNext = !s.ufoLowNext;
      if (type === "bus") s.busSeen = true;
      if (type === "excavator") s.excavatorSeen = true;
      if (NEW_ENEMIES.some(([,name])=>name===type) && !s.enemyIntroduced.includes(type)) s.enemyIntroduced = [...s.enemyIntroduced,type];
    }
    // Alternate arches, staircases and safe low lines; a bonus wave is a breather.
    const grounded = bonus || type === "drone" || ((type === "flyer" || type === "ufo") && !low);
    const formation = Math.floor(r * 3), count = bonus ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const y = grounded ? 36 : largeVehicle ? (i===1?218:172) : formation === 0 ? (i===1?145:100)
        : formation === 1 ? 85+i*35 : 125;
      s.entities.push({id:s.nextId++,type:"idea",x:x-110+i*90,y,w:28,h:28,speedBonus});
    }
    s.entities.push({id:s.nextId++,type:"dot",x:x+(bonus?390:230),
      y:grounded?36:s.pattern%2?36:90,w:28,h:28,speedBonus});
    s.spawnIn = (.85 + .60 / Math.sqrt(s.level) + r * .25 + (bonus ? .35 : 0)) / OBSTACLE_RATE;
  }
  if (s.lives <= 0) { s.phase = "over"; emit(s, "gameOver"); }
  return s;
}
export function isGameOver(state) {
  return state.phase === "over"
    ? { over: true, winner: null,
      score: state.score, rescued: state.rescued, level: state.level, time: state.time }
    : { over: false };
}
export function viewFor(state, playerId) { return { ...state, canAct: state.player === playerId }; }
