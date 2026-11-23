import { REFERENCE_CLIENTS } from "./clients.js";
export { REFERENCE_CLIENTS } from "./clients.js";
// Follow the existing illustration's roofline. The original buildings remain;
// the old generic mountains are outside this canvas clipping path.
const skyline = new Path2D("M0 340H362V445H389L494 412L586 446H641V340H939V415H966L992 383V361H1038V309H1366V383H1484V348H1800V792H0Z");
skyline.moveTo(250,300);
skyline.ellipse(202, 300, 48, 44, 0, 0, Math.PI * 2);
skyline.closePath();
skyline.rect(655, 261, 73, 80);
skyline.rect(735, 273, 169, 68);
skyline.rect(1080, 276, 55, 36);
skyline.rect(1166, 246, 176, 65);
skyline.rect(1615, 277, 167, 73);
const signs = [
  [113, 506, 174, 36], [369, 515, 247, 34], [742, 278, 154, 43],
  [942, 551, 190, 28], [1172, 251, 165, 36], [1376, 543, 198, 31],
  [1622, 543, 156, 32]
];
function polygon(c, points, fill, stroke = "#8c9492") {
  c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.closePath(); c.fillStyle=fill; c.fill();
  if (stroke) { c.strokeStyle=stroke; c.lineWidth=1.35; c.stroke(); }
}
function peak(c, x, top, w, h, matterhorn = false) {
  const p = (a,b) => [x+a*w,top+b*h];
  if (matterhorn) {
    // The asymmetric summit and steep north/east faces of the Matterhorn.
    polygon(c, [p(-.56,1),p(-.37,.80),p(-.27,.61),p(-.19,.50),p(-.11,.27),
      p(-.025,.055),p(0,0),p(.045,.15),p(.12,.28),p(.20,.52),
      p(.31,.70),p(.53,1)], "#d4d8d6");
    polygon(c,[p(0,0),p(.045,.15),p(.12,.28),p(.20,.52),p(.31,.70),
      p(.53,1),p(.02,1),p(.035,.63),p(-.025,.36)],"#aab4b7",null);
    polygon(c,[p(-.27,.61),p(-.19,.50),p(-.11,.27),p(-.025,.055),p(0,0),
      p(-.025,.36),p(-.085,.48),p(-.10,.39),p(-.16,.60),p(-.17,.52)],"#fcfcf7",null);
    polygon(c,[p(0,0),p(.045,.15),p(.12,.28),p(.20,.52),
      p(.125,.43),p(.065,.29),p(.02,.31),p(-.025,.36)],"#edf0ed",null);
    c.strokeStyle="#7b888e"; c.lineWidth=1.15;
    for (const [a,b,d,e] of [[.04,.47,.10,.64],[.075,.65,.18,.83],[-.18,.69,-.26,.86],[.22,.78,.32,.92]]) {
      c.beginPath();c.moveTo(...p(a,b));c.lineTo(...p(d,e));c.stroke();
    }
  } else {
    polygon(c,[p(-.65,1),p(-.34,.55),p(-.15,.33),p(0,0),p(.15,.28),
      p(.30,.40),p(.45,.72),p(.70,1)],"#d9ddda");
    polygon(c,[p(0,0),p(.15,.28),p(.30,.40),p(.45,.72),p(.70,1),p(.12,1),
      p(-.025,.35)],"#b8c2c2",null);
    polygon(c,[p(-.34,.55),p(-.15,.33),p(0,0),p(.15,.28),p(.30,.40),
      p(.14,.37),p(.08,.28),p(-.025,.35),p(-.08,.48),p(-.18,.39)],"#fcfcf7",null);
  }
}

function futureFlight(c, W, G, time, opts) {
  const duration=5, phase=(time-6)%18;
  if(time<6 || phase<0 || phase>duration)return;
  const progress=opts.reduced?.50:phase/duration;
  const x=-180+(W+360)*progress;
  const y=Math.max(85,G-Math.min(480,G*.61))-progress*25;
  c.save();c.translate(x,y);c.rotate(-.07);c.scale(.48,.48);
  const flame=opts.reduced?38:38+Math.sin(time*28)*9;
  polygon(c,[[-98,-13],[-98,13],[-140-flame,0]],"#ffae00",null);
  polygon(c,[[-100,-8],[-100,8],[-125-flame*.65,0]],"#fff3b3",null);
  polygon(c,[[-92,-17],[-126,-44],[-70,-30],[-53,-16]],"#111");
  polygon(c,[[-92,17],[-126,44],[-70,30],[-53,16]],"#111");
  c.beginPath();c.moveTo(-103,-23);c.lineTo(62,-23);
  c.quadraticCurveTo(112,-23,137,0);c.quadraticCurveTo(112,23,62,23);
  c.lineTo(-103,23);c.closePath();c.fillStyle="#ffdc00";c.fill();
  c.strokeStyle="#101010";c.lineWidth=2.5;c.stroke();
  polygon(c,[[91,-19],[137,0],[91,19]],"#101010",null);
  c.fillStyle="#111";c.fillRect(-105,-23,10,46);
  c.font="900 16px Agency,Arial";c.textAlign="center";c.textBaseline="middle";
  c.fillText("FUTURE FLIGHT",-2,1,166);
  c.restore();
}

export function drawWallisCity(c, W, G, state, images, opts, screenScale = 1) {
  const topMargin = Math.max(28, Math.min(94 / screenScale, G * .22));
  const mountainHeight = Math.min(620, Math.max(80, G - topMargin - 38));
  const base = G - 28;
  const top = base - mountainHeight;
  // The distant skyline is anchored and contained, never tiled or cover-cropped.
  polygon(c, [[0,G],[0,top+mountainHeight*.70],[W*.12,top+mountainHeight*.48],
    [W*.28,top+mountainHeight*.72],[W*.45,top+mountainHeight*.40],
    [W*.63,top+mountainHeight*.60],[W*.85,top+mountainHeight*.42],
    [W,top+mountainHeight*.66],[W,G]], "#e2e4dd", null);
  peak(c,W*.19,top+mountainHeight*.20,W*.38,mountainHeight*.80);
  peak(c,W*.43,top+mountainHeight*.34,W*.29,mountainHeight*.66);
  peak(c,W*.84,top+mountainHeight*.28,W*.33,mountainHeight*.72);
  peak(c,W*.65,top,W*.52,mountainHeight,true);
  futureFlight(c,W,G,state.time||0,opts);
  const im=images.city, grey=images.grey;
  if (!im || !grey) return;
  const s=Math.min(.82,G/900), tile=1800*s, by=G-790*s;
  const travel=state.distance*.30, firstTile=Math.floor(travel/tile), offset=travel%tile;
  const restored=Math.min(.95,state.rescued/14+(state.boost>0?.36:0));
  for (let x=-offset,t=firstTile; x<W; x+=tile,t++) {
    c.save(); c.translate(x,by); c.scale(s,s);
    c.save(); c.clip(skyline);
    c.drawImage(grey,0,0);c.globalAlpha=restored;c.drawImage(im,0,0);c.globalAlpha=1;
    c.restore();
    for (let i=0;i<signs.length;i++) {
      const [sx,sy,sw,sh]=signs[i];
      const n=((t*signs.length+i+(state.citySeed||0))%REFERENCE_CLIENTS.length+REFERENCE_CLIENTS.length)%REFERENCE_CLIENTS.length;
      const label=REFERENCE_CLIENTS[n];
      c.fillStyle=i===4&&restored>.25?"#b6f65e":"#f7f3e9";c.fillRect(sx,sy,sw,sh);
      c.fillStyle="#161918"; c.textAlign="center";c.textBaseline="middle";
      let size=Math.min(26,sh*.70), lines=[label];
      c.font="800 "+size+"px Agency,Arial";
      if(c.measureText(label).width>sw-10 && label.includes(" ")) {
        const words=label.split(" "); let split=1, balance=Infinity;
        for(let j=1;j<words.length;j++) {
          const difference=Math.abs(words.slice(0,j).join(" ").length-words.slice(j).join(" ").length);
          if(difference<balance){balance=difference;split=j;}
        }
        lines=[words.slice(0,split).join(" "),words.slice(split).join(" ")];
        size=Math.min(20,(sh-4)/2);c.font="800 "+size+"px Agency,Arial";
      }
      while(Math.max(...lines.map(line=>c.measureText(line).width))>sw-10&&size>10)c.font="800 "+(--size)+"px Agency,Arial";
      lines.forEach((line,j)=>c.fillText(line,sx+sw/2,sy+sh/2+1+(j-(lines.length-1)/2)*(size+1),sw-10));
    }
    c.restore();
  }
}
