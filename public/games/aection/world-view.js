import { drawWallisCity } from "./scenery.js";
import { drawWorldCity } from "./world-city.js";
import { WORLDS, worldFrame } from "./worlds.js";

function mix(a,b,t) {
  const rgb = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const aa=rgb(a),bb=rgb(b);
  return "rgb("+aa.map((v,i)=>Math.round(v+(bb[i]-v)*t)).join(",")+")";
}
export class WorldScene {
  constructor() { this.layer=document.createElement("canvas");this.context=this.layer.getContext("2d",{alpha:false}); }
  render(c,W,G,index,state,images,opts,scale) {
    const world=WORLDS[index];
    c.save();c.beginPath();c.rect(0,0,W,G);c.clip();
    c.fillStyle=world.sky;c.fillRect(0,0,W,G);
    if(index===0) drawWallisCity(c,W,G,state,images,opts,scale);
    else {
      const image=images.worlds?.[world.id];
      if(image) {
        // Cover without stretching; keep the central landmark on portrait screens.
        const s=Math.max(W/image.width,G/image.height)*1.06;
        const w=image.width*s,h=image.height*s;
        const drift=opts.reduced?0:Math.sin(state.distance/1800)*(w-W)*.18;
        c.drawImage(image,(W-w)/2+drift,(G-h)*.45,w,h);
      }
      drawWorldCity(c,W,G,state,world.id,opts);
      // Quiet the lower action corridor, preserving readable opponents and pickups.
      const veil=c.createLinearGradient(0,Math.max(0,G-210),0,G);
      veil.addColorStop(0,"rgba(247,241,224,0)");
      veil.addColorStop(1,opts.contrast?"rgba(247,241,224,.84)":"rgba(247,241,224,.30)");
      c.fillStyle=veil;c.fillRect(0,Math.max(0,G-210),W,Math.min(210,G));
      // Slow atmospheric layers are decorative, never collision objects.
      if(!opts.reduced) {
        c.globalAlpha=.30;
        const count=index===1?14:8;
        for(let i=0;i<count;i++) {
          const x=((i*137-state.distance*(index===1?.025:.075))%W+W)%W;
          const y=55+((i*79+Math.sin(state.time*.45+i)*9)%Math.max(80,G-220));
          c.fillStyle=index===3?"#ffc36b":index===2?"#c7dc95":"#fff8e5";
          c.beginPath();c.ellipse(x,y,index===1?1.4:2.3,index===2?4:1.5,-.5,0,Math.PI*2);c.fill();
        }
      }
    }
    c.restore();
  }
  draw(c,W,G,state,images,opts,scale) {
    const frame=worldFrame(state);
    const current=WORLDS[frame.index],previous=WORLDS[frame.previous];
    if(frame.blend>=1) this.render(c,W,G,frame.index,state,images,opts,scale);
    else {
      this.render(c,W,G,frame.previous,state,images,opts,scale);
      // Composite a complete opaque scene; no alpha leaks from legacy city art.
      const w=Math.ceil(W),h=Math.ceil(G);
      if(this.layer.width!==w||this.layer.height!==h){this.layer.width=w;this.layer.height=h;}
      this.context.setTransform(1,0,0,1,0,0);
      this.render(this.context,W,G,frame.index,state,images,opts,scale);
      c.save();c.globalAlpha=frame.blend;c.drawImage(this.layer,0,0);c.restore();
    }
    return {edge:mix(previous.edge,current.edge,frame.blend),floor:mix(previous.floor,current.floor,frame.blend)};
  }
}
