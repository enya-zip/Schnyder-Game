// Original vector character, facing left. Movement is owned by the rules;
// time only animates the trot, so pausing also freezes the legs.
const wool = new Path2D("M-26 -47 Q-32 -59 -18 -62 Q-13 -71 -2 -65 Q9 -73 18 -64 Q31 -69 35 -57 Q47 -55 43 -43 Q51 -33 40 -25 Q39 -14 26 -17 Q17 -10 8 -17 Q-4 -10 -11 -19 Q-27 -16 -26 -30 Q-36 -34 -26 -47Z");
function oval(c,x,y,rx,ry,color,stroke=false) {
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
  if(stroke)c.stroke();
}
function leg(c,x,phase,far) {
  const swing=Math.sin(phase)*8,lift=Math.max(0,Math.cos(phase))*6;
  c.strokeStyle=far?"#75746b":"#e8e5d7";c.lineWidth=7;c.lineCap="round";
  c.beginPath();c.moveTo(x,-27);c.lineTo(x+swing*.55,-13-lift*.3);c.lineTo(x+swing,-4-lift);c.stroke();
  c.strokeStyle="#181a19";c.lineWidth=8;
  c.beginPath();c.moveTo(x+swing-3,-3-lift);c.lineTo(x+swing+3,-3-lift);c.stroke();
}
export function drawSheep(c,x,ground,e,time,opts) {
  const phase=opts.reduced?0:time*15+e.id;
  c.save();c.translate(x,ground);
  oval(c,0,5,49,5,"#00000025");
  leg(c,-13,phase+Math.PI,true);leg(c,25,phase,true);
  c.save();c.translate(0,opts.reduced?0:-Math.abs(Math.sin(phase))*1.8);
  c.strokeStyle="#191b18";c.lineWidth=2.4;
  // Short woolly tail, scalloped fleece and black patches at the knees.
  oval(c,44,-42,9,6,"#f6f3e6",true);
  c.fillStyle="#fbf9ed";c.fill(wool);c.stroke(wool);
  c.strokeStyle="#d0cfc1";c.lineWidth=1.5;
  for(const [cx,cy] of [[-12,-49],[6,-55],[24,-46],[-13,-30],[10,-32],[31,-28]]) {
    c.beginPath();c.arc(cx,cy,4,.2,Math.PI*1.7);c.stroke();
  }
  // Both sexes have curled horns; black ears and the whole dark face
  // distinguish the Valais Blacknose from an ordinary white sheep.
  c.strokeStyle="#25261f";c.lineWidth=2;
  oval(c,-19,-59,10,11,"#d7c49b",true);
  c.strokeStyle="#857451";c.lineWidth=2;c.beginPath();c.arc(-19,-59,5,-1,Math.PI*1.5);c.stroke();
  oval(c,-39,-53,12,5,"#161918",true);
  oval(c,-30,-44,15,18,"#191b1a",true);
  oval(c,-40,-36,12,9,"#171918",true);
  c.strokeStyle="#181a17";c.lineWidth=2;
  oval(c,-22,-61,10,10,"#e1cea6",true);
  c.strokeStyle="#8d7a54";c.lineWidth=2;c.beginPath();c.arc(-22,-61,5,-1,Math.PI*1.5);c.stroke();
  oval(c,-29,-59,9,5,"#faf8ed");
  oval(c,-35,-45,3.6,3.7,"#fff");
  oval(c,-36.5,-45,1.7,2.2,"#0b0d0c");
  oval(c,-48,-37,2.4,1.7,"#62655f");
  c.strokeStyle="#6cff00";c.lineWidth=3;
  c.beginPath();c.moveTo(-27,-28);c.lineTo(-19,-32);c.stroke();
  c.restore();
  leg(c,-19,phase,false);leg(c,28,phase+Math.PI,false);
  c.restore();
}
