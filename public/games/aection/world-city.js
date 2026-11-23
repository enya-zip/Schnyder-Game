import { REFERENCE_CLIENTS } from "./clients.js";

// The same moving shopfront layer as Wallis, with architecture native to each world.
const THEMES = {
  planet:{wall:"#bdc5d8",side:"#939eb7",roof:"#727e9c",glass:"#526d87",trim:"#a9dce0",ink:"#475268"},
  jungle:{wall:"#c7bc91",side:"#9c9674",roof:"#8f9f72",glass:"#526d61",trim:"#e2d0a2",ink:"#525e48"},
  hell:{wall:"#a19a97",side:"#777579",roof:"#675d68",glass:"#cf986b",trim:"#c6b9a2",ink:"#524a53"},
  heaven:{wall:"#eeece2",side:"#c6d2d3",roof:"#cbd9dc",glass:"#8aaebf",trim:"#d0b875",ink:"#7c929b"},
  greece:{wall:"#e3dece",side:"#b7bdb6",roof:"#c09e88",glass:"#7494a5",trim:"#f3e9ce",ink:"#788b8d"},
  egypt:{wall:"#d6ba8b",side:"#b39b77",roof:"#a68f70",glass:"#927e65",trim:"#eee0b4",ink:"#8b795d"}
};
function box(c,x,y,w,h,fill,stroke=true) {
  c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke)c.strokeRect(x,y,w,h);
}
function shape(c,points,fill) {
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();c.stroke();
}
function round(c,x,y,w,h,r,fill) {
  c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();c.stroke();
}
function arch(c,x,y,w,h,fill) {
  c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+w/2);c.arc(x+w/2,y+w/2,w/2,Math.PI,Math.PI*2);c.lineTo(x+w,y+h);c.closePath();c.fillStyle=fill;c.fill();c.stroke();
}
function cloud(c,x,y,w) {
  c.fillStyle="#e4ebeb";c.beginPath();c.ellipse(x+w*.5,y,w*.57,16,0,0,Math.PI*2);c.fill();
  for(let i=0;i<5;i++){c.beginPath();c.ellipse(x+i*w/4,y-6-(i%2)*7,24,19,0,0,Math.PI*2);c.fill();}
}
function label(c,text,x,y,w,theme,restored) {
  box(c,x,y,w,49,restored?"#e6edce":"#f4f0e5");
  c.fillStyle=theme.ink;c.textAlign="center";c.textBaseline="middle";
  let lines=[text],size=23;c.font="800 "+size+"px Agency,Arial";
  if(c.measureText(text).width>w-14&&text.includes(" ")){
    const words=text.split(" ");let split=1,balance=Infinity;
    for(let i=1;i<words.length;i++){const n=Math.abs(words.slice(0,i).join(" ").length-words.slice(i).join(" ").length);if(n<balance){balance=n;split=i;}}
    lines=[words.slice(0,split).join(" "),words.slice(split).join(" ")];size=19;
  }
  c.font="800 "+size+"px Agency,Arial";
  while(Math.max(...lines.map(line=>c.measureText(line).width))>w-14&&size>10)c.font="800 "+(--size)+"px Agency,Arial";
  lines.forEach((line,i)=>c.fillText(line,x+w/2,y+24.5+(i-(lines.length-1)/2)*(size+2),w-14));
}
function building(c,id,variant,theme,name,restored) {
  const w=238,h=[340,425,365,470,330,405,380][variant],top=-h;
  c.strokeStyle=theme.ink;c.lineWidth=2.4;c.lineJoin="round";
  if(id==="planet"){
    round(c,0,top,w,h,24,theme.wall);
    box(c,w-30,top+25,30,h-49,theme.side,false);
    c.beginPath();c.ellipse(w/2,top+7,w*.48,variant%2?46:26,0,Math.PI,Math.PI*2);c.closePath();c.fillStyle=theme.roof;c.fill();c.stroke();
    box(c,15,top+24,w-30,8,theme.trim,false);
    c.beginPath();c.moveTo(w*.70,top-28);c.lineTo(w*.70,top-80);c.stroke();
    c.beginPath();c.ellipse(w*.70,top-74,27,10,-.35,0,Math.PI);c.stroke();
    if(variant%2===0){round(c,16,top+55,42,57,18,theme.glass);round(c,w-58,top+55,42,57,18,theme.glass);}
  }else if(id==="jungle"){
    // Stilts and diagonal braces meet the common pavement, not the collision layer.
    box(c,15,-85,17,85,theme.side);box(c,w-32,-85,17,85,theme.side);
    c.beginPath();c.moveTo(26,-3);c.lineTo(w-26,-85);c.moveTo(w-26,-3);c.lineTo(26,-85);c.stroke();
    box(c,0,top,w,h-76,theme.wall);
    for(let y=top+25;y<-80;y+=27){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    shape(c,[[-17,top+12],[w*.5,top-70],[w+17,top+12]],theme.roof);
    for(let i=0;i<12;i++){c.beginPath();c.moveTo(w*.5+(i-5.5)*8,top-54);c.lineTo(i*w/11,top+10);c.stroke();}
    box(c,-8,-88,w+16,13,theme.trim);
    c.strokeStyle="#738466";c.lineWidth=6;
    for(let i=0;i<3;i++){const x=14+i*93;c.beginPath();c.moveTo(x,top+5);c.bezierCurveTo(x-18,top+55,x+20,top+80,x+4,top+126);c.stroke();}
    c.strokeStyle=theme.ink;c.lineWidth=2.4;
  }else if(id==="hell"){
    box(c,0,top,w,h,theme.wall);box(c,w-24,top,24,h,theme.side,false);
    shape(c,[[-12,top+2],[w*.5,top-92-(variant%2)*28],[w+12,top+2]],theme.roof);
    for(const x of [10,w-26]){box(c,x,top-42,16,42,theme.side);shape(c,[[x-4,top-42],[x+8,top-67],[x+20,top-42]],theme.roof);}
    for(let y=top+26;y<-20;y+=38){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    arch(c,w/2-23,top+30,46,68,theme.glass);
  }else if(id==="heaven"){
    round(c,0,top,w,h,9,theme.wall);
    box(c,w-24,top+12,24,h-12,theme.side,false);
    arch(c,w*.5-44,top-68,88,82,theme.roof);
    box(c,-9,top+2,w+18,15,theme.trim);
    for(const x of [14,w-31]){box(c,x,top+23,17,h-23,theme.trim);box(c,x-4,top+20,25,13,theme.wall);}
    c.beginPath();c.ellipse(w/2,top-83,31,8,0,0,Math.PI*2);c.strokeStyle=theme.trim;c.lineWidth=5;c.stroke();c.strokeStyle=theme.ink;c.lineWidth=2.4;
  }else if(id==="greece"){
    box(c,0,top,w,h,theme.wall);box(c,w-22,top,22,h,theme.side,false);
    shape(c,[[-13,top],[w/2,top-65],[w+13,top]],variant%2?theme.roof:theme.trim);
    box(c,-12,top,w+24,15,theme.trim);
    if(variant%2===0){
      for(let i=0;i<5;i++){const x=12+i*49;box(c,x,top+20,15,h-20,theme.trim);box(c,x-4,top+17,23,13,theme.wall);box(c,x-3,-12,21,12,theme.wall);}
    }else{
      for(let x=12;x<w;x+=27){c.beginPath();c.moveTo(w/2,top-57);c.lineTo(x,top);c.stroke();}
    }
  }else{
    shape(c,[[0,0],[14,top],[w-14,top],[w,0]],theme.wall);
    shape(c,[[w-38,0],[w-44,top],[w-14,top],[w,0]],theme.side);
    box(c,7,top-7,w-14,22,theme.trim);
    for(let i=0;i<7;i++)box(c,15+i*31,top-20,20,17,theme.roof);
    for(let y=top+43;y<-15;y+=41){c.beginPath();c.moveTo(10,y);c.lineTo(w-12,y);c.stroke();}
    // Pylon doorway and paired lotus columns.
    for(const x of [20,w-39]){box(c,x,top+22,18,h-22,theme.trim);shape(c,[[x-7,top+22],[x+25,top+22],[x+18,top+41],[x,top+41]],theme.roof);}
  }
  const windowTop=top+69;
  for(const x of [49,w-83]){
    if(id==="planet"){round(c,x,windowTop,34,50,15,theme.glass);}
    else if(id==="hell"||id==="heaven"){arch(c,x,windowTop,34,61,theme.glass);}
    else {box(c,x,windowTop,34,51,theme.glass);c.beginPath();c.moveTo(x+17,windowTop);c.lineTo(x+17,windowTop+51);c.moveTo(x,windowTop+25);c.lineTo(x+34,windowTop+25);c.stroke();}
  }
  const doorBottom=id==="jungle"?-88:0;
  arch(c,w/2-25,doorBottom-83,50,83,theme.glass);
  c.beginPath();c.moveTo(w/2,doorBottom-52);c.lineTo(w/2,doorBottom);c.stroke();
  label(c,name,25,-h*.62,w-50,theme,restored);
  if(id==="heaven")cloud(c,-10,-4,w+20);
}
export function drawWorldCity(c,W,G,state,id,opts) {
  const theme=THEMES[id];if(!theme)return;
  const scale=Math.min(.82,G/900),step=258,tile=step*7*scale;
  const travel=state.distance*.30,first=Math.floor(travel/tile),offset=travel%tile;
  c.save();c.globalAlpha=opts.contrast?.72:.94;
  for(let x=-offset,t=first;x<W;x+=tile,t++){
    c.save();c.translate(x,G);c.scale(scale,scale);
    for(let i=0;i<7;i++){
      if(x+(i*step+258)*scale < -20 || x+i*step*scale > W+20)continue;
      const n=((t*7+i+(state.citySeed||0))%REFERENCE_CLIENTS.length+REFERENCE_CLIENTS.length)%REFERENCE_CLIENTS.length;
      c.save();c.translate(i*step,0);building(c,id,i,theme,REFERENCE_CLIENTS[n],state.rescued>i+2||state.boost>0);c.restore();
    }
    c.restore();
  }
  c.restore();
}
