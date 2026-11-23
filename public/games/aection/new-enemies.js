// Original canvas characters in the existing Schnyder comic palette.
// Only their limbs/accessories animate: collision silhouettes stay predictable.
const INK="#111311", PAPER="#faf7ec", GREEN="#6cff00", CORAL="#ff7a7a";
function oval(c,x,y,rx,ry,fill,stroke=true) {
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke)c.stroke();
}
function box(c,x,y,w,h,fill,r=3) {
  c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();c.stroke();
}
function line(c,points,color=INK,width=3) {
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);c.stroke();
  c.strokeStyle=INK;c.lineWidth=2.5;
}
function boot(c,x,y,angle,color="#353a3b") {
  c.save();c.translate(x,y);c.rotate(angle);
  line(c,[0,0,0,18,4,30],color,9);box(c,-6,25,19,8,INK,3);c.restore();
}
function taxman(c,t,reduced,words) {
  const gait=reduced?0:Math.sin(t*13);
  oval(c,0,3,35,4,"#0002",false);
  boot(c,7,-34,-gait*.36,"#777d7c");
  boot(c,-9,-34,gait*.36);
  // Boxy jacket, white shirt and a determined tie.
  box(c,-19,-78,36,48,"#42484a",5);
  c.fillStyle=PAPER;c.beginPath();c.moveTo(-9,-77);c.lineTo(4,-77);c.lineTo(-3,-45);c.closePath();c.fill();
  c.fillStyle=CORAL;c.beginPath();c.moveTo(-4,-73);c.lineTo(1,-68);c.lineTo(0,-49);c.lineTo(-5,-45);c.lineTo(-8,-50);c.lineTo(-7,-67);c.closePath();c.fill();c.stroke();
  oval(c,-3,-91,17,18,"#ebc7a7");
  oval(c,12,-89,5,6,"#ebc7a7");
  // Flat cap, square glasses and an exaggerated nose.
  box(c,-22,-110,36,9,"#414747",2);line(c,[-26,-101,17,-101],INK,4);
  box(c,-21,-96,14,10,PAPER,2);box(c,-3,-96,12,10,PAPER,2);line(c,[-7,-91,-3,-91]);
  oval(c,-13,-91,2,2,INK,false);oval(c,2,-91,2,2,INK,false);
  c.fillStyle="#ebc7a7";c.beginPath();c.moveTo(-20,-89);c.lineTo(-26,-83);c.lineTo(-14,-82);c.fill();c.stroke();
  line(c,[-13,-77,-5,-78],INK,2);
  // Tax demand in one hand, briefcase in the other.
  const sway=reduced?0:Math.sin(t*13)*3;
  line(c,[-15,-69,-29,-57-sway], "#42484a",10);
  box(c,-44,-74-sway,29,34,PAPER,1);
  c.fillStyle=INK;c.textAlign="center";c.font="900 6px Agency,Arial";c.fillText(words.taxPaper,-29,-65-sway,25);
  line(c,[-39,-59-sway,-20,-59-sway],"#777",1);
  line(c,[-39,-54-sway,-25,-54-sway],"#777",1);
  c.fillStyle=CORAL;c.font="900 15px Agency,Arial";c.fillText("%",-29,-42-sway);
  line(c,[16,-68,27,-48+sway],"#42484a",9);
  box(c,20,-47+sway,29,23,"#5b4a39",3);box(c,29,-52+sway,12,6,"#8b7050",2);
  box(c,31,-40+sway,6,4,"#e0b255",1);
}
function raclette(c,t,reduced) {
  const gait=reduced?0:Math.sin(t*11), steam=reduced?0:t*1.1%1;
  oval(c,0,4,63,5,"#0002",false);
  boot(c,27,-34,-gait*.28,"#676b6b");boot(c,10,-34,gait*.28,"#383a3a");
  box(c,1,-85,38,53,"#f0e9da",6);
  c.fillStyle=CORAL;c.beginPath();c.moveTo(8,-76);c.lineTo(30,-76);c.lineTo(38,-32);c.lineTo(1,-32);c.closePath();c.fill();c.stroke();
  line(c,[13,-85,14,-74,27,-74,28,-84],PAPER,3);
  oval(c,20,-96,15,16,"#e3b18e");
  // Chef's toque and a cheerful moustache.
  oval(c,7,-112,9,9,PAPER);oval(c,20,-119,12,10,PAPER);oval(c,32,-112,9,9,PAPER);box(c,7,-112,26,9,PAPER,2);
  oval(c,12,-98,2,2,INK,false);
  c.fillStyle=INK;c.beginPath();c.moveTo(6,-89);c.quadraticCurveTo(13,-97,19,-89);c.quadraticCurveTo(13,-87,6,-89);c.fill();
  line(c,[5,-72,-7,-59,-13,-59],"#e3b18e",8);
  // A broad raclette scraper: a cooking utensil held over the cheese.
  const scrape=reduced?0:Math.sin(t*5)*3;
  line(c,[-12,-59,-24,-65-scrape],"#663d24",6);
  c.fillStyle="#bdc8cb";c.beginPath();c.moveTo(-25,-69-scrape);c.lineTo(-47,-70-scrape);c.lineTo(-42,-61-scrape);c.lineTo(-22,-62-scrape);c.closePath();c.fill();c.stroke();
  // Wheeled oven trolley, glowing heating element, half-wheel of cheese.
  box(c,-58,-49,67,10,"#a4aaab",2);line(c,[-49,-39,-49,-10,0,-10,0,-39],"#737b7c",4);
  for(const x of [-49,0]) {oval(c,x,-5,7,7,INK);oval(c,x,-5,2.5,2.5,"#9ba2a2",false);}
  box(c,-54,-88,7,40,"#5b6265",2);box(c,-55,-90,55,10,"#454d50",2);
  line(c,[-48,-77,-7,-77],"#fa7d35",4);
  c.fillStyle="#e6b641";c.beginPath();c.moveTo(-46,-50);c.lineTo(-46,-65);c.quadraticCurveTo(-27,-83,-8,-65);c.lineTo(-8,-50);c.closePath();c.fill();c.stroke();
  c.fillStyle="#ffdd68";c.beginPath();c.moveTo(-43,-53);c.lineTo(-43,-63);c.quadraticCurveTo(-27,-76,-11,-63);c.lineTo(-11,-53);c.closePath();c.fill();
  for(const [x,y] of [[-37,-61],[-24,-64],[-16,-57]])oval(c,x,y,2.5,2,"#bd8a23",false);
  line(c,[-35,-52,-35,-45,-30,-44],"#ffdd68",3);
  c.save();c.strokeStyle="#fcfcfc";c.lineWidth=2.5;
  for(let i=0;i<2;i++) {const x=-34+i*19;const rise=reduced?0:(steam+i*.45)%1*13;c.globalAlpha=reduced?.6:.7-rise/26;c.beginPath();c.moveTo(x,-92-rise);c.bezierCurveTo(x-7,-99-rise,x+8,-105-rise,x,-112-rise);c.stroke();}c.restore();
}
function cowLeg(c,x,phase,far) {
  const swing=Math.sin(phase)*9,lift=Math.max(0,Math.cos(phase))*5;
  line(c,[x,-35,x+swing*.4,-19-lift,x+swing,-5-lift],far?"#55534a":"#262923",9);
  box(c,x+swing-6,-7-lift,13,7,"#d5cbb5",2);
}
function herens(c,t,reduced) {
  const phase=reduced?0:t*15;
  oval(c,0,4,62,5,"#0003",false);
  cowLeg(c,-19,phase+Math.PI,true);cowLeg(c,35,phase,true);
  // Low, stocky black-brown body, heavy neck and upward pale horns.
  oval(c,7,-53,46,28,"#30332b");
  oval(c,-23,-53,24,30,"#242821");
  c.save();c.strokeStyle="#77766b";c.lineWidth=2;c.beginPath();c.moveTo(-13,-75);c.quadraticCurveTo(18,-85,39,-64);c.stroke();c.restore();
  line(c,[49,-62,60,-50,57,-28],"#34372c",4);oval(c,57,-26,5,8,INK,false);
  oval(c,-39,-65,18,23,"#292d25");oval(c,-50,-48,18,11,"#747466");
  oval(c,-40,-63,4,4,PAPER,false);oval(c,-42,-63,2,2.5,INK,false);
  oval(c,-60,-48,3,2,INK,false);
  oval(c,-25,-78,13,5,"#474a3e");oval(c,-53,-78,10,5,"#474a3e");
  for(const side of [-1,1]) {
    const x=side<0?-48:-31;
    c.fillStyle="#eee1bc";c.beginPath();c.moveTo(x,-78);c.quadraticCurveTo(x+side*15,-86,x+side*12,-99);c.quadraticCurveTo(x+side*5,-85,x+6,-79);c.closePath();c.fill();c.stroke();
  }
  // Red collar and brass cowbell.
  line(c,[-21,-62,-23,-38,-35,-32],CORAL,5);
  c.save();c.translate(-28,-28);c.rotate(reduced?0:Math.sin(t*15)*.16);
  c.fillStyle="#d9ae45";c.beginPath();c.moveTo(-6,-4);c.lineTo(6,-4);c.lineTo(9,10);c.quadraticCurveTo(0,15,-9,10);c.closePath();c.fill();c.stroke();oval(c,0,12,2,3,INK,false);c.restore();
  cowLeg(c,-17,phase,false);cowLeg(c,34,phase+Math.PI,false);
}
function ufo(c,t,reduced,contrast) {
  const tilt=reduced?0:Math.sin(t*4)*.025;
  c.rotate(tilt);
  // Glass dome remains translucent; a clearly visible alien waves inside.
  c.fillStyle="#b5dbe8dd";c.beginPath();c.ellipse(0,-28,36,34,0,Math.PI,Math.PI*2);c.lineTo(36,-24);c.lineTo(-36,-24);c.closePath();c.fill();c.stroke();
  box(c,-13,-34,26,17,"#789849",6);oval(c,0,-42,15,18,GREEN);
  c.save();c.translate(-6,-44);c.rotate(-.3);oval(c,0,0,4,7,INK,false);c.restore();
  c.save();c.translate(6,-44);c.rotate(.3);oval(c,0,0,4,7,INK,false);c.restore();
  line(c,[-3,-32,3,-32],INK,1.5);
  line(c,[13,-29,24,-38,25+(reduced?0:Math.sin(t*8)*3),-49],GREEN,5);
  line(c,[22,-50,25,-47,29,-50],GREEN,2);
  c.save();c.strokeStyle="#fff9";c.lineWidth=3;c.beginPath();c.ellipse(0,-29,30,28,0,Math.PI*1.07,Math.PI*1.38);c.stroke();c.restore();
  oval(c,0,-20,59,16,"#a7afb0");oval(c,0,-13,40,10,"#596267");
  line(c,[-51,-21,-27,-27,27,-27,51,-21],"#e6edec",3);
  for(let i=0;i<5;i++) {
    const pulse=reduced||Math.sin(t*6+i)>0;
    oval(c,-40+i*20,-18,4,3,pulse?(contrast?"#ff5252":CORAL):"#62545a");
  }
  // Small engine glow stays within the saucer's safe, fixed flight lane.
  c.fillStyle="#6cff0066";c.beginPath();c.moveTo(-17,-4);c.lineTo(0,4);c.lineTo(17,-4);c.closePath();c.fill();
}
export function drawNewEnemy(c,x,ground,e,time,opts,words) {
  c.save();c.translate(x,ground);c.lineWidth=2.5;c.lineJoin="round";c.lineCap="round";c.strokeStyle=INK;
  // A light keyline keeps dark characters readable in hell and space too.
  c.shadowColor="#faf7ec";c.shadowBlur=opts.contrast?3:1.5;
  const t=time+e.id*.13;
  if(e.type==="taxman")taxman(c,t,opts.reduced,words);
  else if(e.type==="raclette")raclette(c,t,opts.reduced);
  else if(e.type==="herens")herens(c,t,opts.reduced);
  else if(e.type==="ufo")ufo(c,t,opts.reduced,opts.contrast);
  c.restore();
}
