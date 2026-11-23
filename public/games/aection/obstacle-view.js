const INK="#0b0b0b", PAPER="#fcfcfc";
export function drawObstacle(c,x,ground,e,time,opts,words) {
  c.save(); c.translate(x,ground); c.lineWidth=3; c.strokeStyle=INK;
  const warn=opts.contrast?"#ff5252":"#ff7a7a";
  if(e.type==="cone") {
    c.fillStyle=INK;c.fillRect(-e.w/2,-7,e.w,7);
    c.fillStyle=warn;c.beginPath();c.moveTo(-e.w*.40,-7);c.lineTo(-7,-e.h);
    c.lineTo(7,-e.h);c.lineTo(e.w*.40,-7);c.closePath();c.fill();c.stroke();
    c.fillStyle=PAPER;
    for(const y of [24,43]) { const half=7+(e.h-y)*.23;c.fillRect(-half,-y,half*2,8); }
  } else if(e.type==="barrier") {
    c.fillStyle=INK;c.fillRect(-e.w/2+10,-24,7,24);c.fillRect(e.w/2-17,-24,7,24);
    c.fillStyle=PAPER;c.fillRect(-e.w/2,-e.h,e.w,34);c.strokeRect(-e.w/2,-e.h,e.w,34);
    c.save();c.beginPath();c.rect(-e.w/2+2,-e.h+2,e.w-4,30);c.clip();c.fillStyle=warn;
    for(let i=-e.w;i<e.w;i+=30){c.beginPath();c.moveTo(i,-e.h);c.lineTo(i+18,-e.h);
      c.lineTo(i-3,-e.h+34);c.lineTo(i-21,-e.h+34);c.closePath();c.fill();}
    c.restore();
    c.fillStyle=warn;c.beginPath();c.arc(-e.w/2+15,-e.h-5,5,0,Math.PI*2);c.fill();c.stroke();
    c.beginPath();c.arc(e.w/2-15,-e.h-5,5,0,Math.PI*2);c.fill();c.stroke();
  } else if(e.type==="roller") {
    const radius=e.w/2;c.translate(0,-radius);
    c.rotate(opts.reduced?0:-time*(8+(e.speedBonus||0)/70));
    c.fillStyle=warn;c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle=PAPER;c.beginPath();c.arc(0,0,radius-8,0,Math.PI*2);c.fill();c.stroke();
    c.strokeStyle="#777";c.lineWidth=2;
    for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);c.beginPath();c.moveTo(8,0);c.lineTo(radius-12,0);c.stroke();}
    c.strokeStyle=INK;c.fillStyle=INK;c.beginPath();c.arc(0,0,7,0,Math.PI*2);c.fill();
  } else if(e.type==="drone") {
    c.translate(0,-e.h/2);
    c.strokeStyle=INK;c.beginPath();c.moveTo(-e.w*.39,-9);c.lineTo(e.w*.39,-9);c.stroke();
    const rotor=opts.reduced?1:.45+.55*Math.abs(Math.sin(time*45));
    for(const side of [-1,1]){
      c.fillStyle=PAPER;c.beginPath();c.ellipse(side*e.w*.38,-15,16*rotor+2,4,0,0,Math.PI*2);c.fill();c.stroke();
      c.beginPath();c.moveTo(side*e.w*.38,-12);c.lineTo(side*e.w*.28,9);c.stroke();
    }
    c.fillStyle=warn;c.beginPath();c.roundRect(-34,-11,68,32,6);c.fill();c.stroke();
    c.fillStyle=INK;c.font="800 13px Agency,Arial";c.textAlign="center";
    c.fillText(words.droneLabel,0,10,60);
    c.fillStyle=PAPER;c.beginPath();c.arc(0,-7,4,0,Math.PI*2);c.fill();c.stroke();
  }
  c.restore();
}
