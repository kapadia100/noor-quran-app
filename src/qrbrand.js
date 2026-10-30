import qrcode from 'qrcode-generator';
export const INSTALL_URL='https://kapadia100.github.io/noor-quran-app/install/';
let M=null;const mods=()=>{if(!M){const q=qrcode(0,'M');q.addData(INSTALL_URL);q.make();const n=q.getModuleCount();M={n,d:(r,c)=>q.isDark(r,c)}}return M};
// Draws "Quran Safar" brand + QR (cream quiet zone) centred at bottom; returns top y of block.
export function brand(g,W,H,{cell=4,bottom=80,gold='#F3D9A0'}={}){
 const {n,d}=mods(),q=4,tile=(n+q*2)*cell,top=H-bottom-tile;
 g.save();g.direction='ltr';g.textAlign='left';g.textBaseline='middle';g.shadowBlur=0;g.font=`600 ${Math.round(cell*10)}px Fraunces, Georgia, serif`;
 const tw=g.measureText('Quran Safar').width,gap=cell*6,x0=Math.round((W-(tw+gap+tile))/2),qx=x0+tw+gap;
 g.fillStyle=gold;g.fillText('Quran Safar',x0,top+tile/2);
 g.fillStyle='#FFFBEF';g.shadowColor='rgba(0,0,0,.3)';g.shadowBlur=14;g.beginPath();g.roundRect?g.roundRect(qx,top,tile,tile,cell*2.5):g.rect(qx,top,tile,tile);g.fill();g.shadowBlur=0;
 g.fillStyle='#1b1b1b';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(d(r,c))g.fillRect(qx+(q+c)*cell,top+(q+r)*cell,cell,cell);
 g.restore();return top}
