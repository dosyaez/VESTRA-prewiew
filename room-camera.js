/* Local camera mirror. No recording, uploading or virtual garment rendering. */
(function(root){
'use strict';
class RoomCamera {
 constructor({video,getMedia,onState}){this.video=video;this.getMedia=getMedia;this.onState=onState;this.stream=null;this.epoch=0;this.facing='user';}
 stop(message='Камера выключена'){this.epoch++;const stream=this.stream;this.stream=null;this.video.srcObject=null;stream?.getTracks().forEach(t=>t.stop());this.onState('off',message);}
 async start(facing='user'){
  this.stop();const epoch=this.epoch;this.facing=facing;this.onState('pending','Разрешите доступ к камере');let acquired;
  try{
   acquired=await this.getMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:720},height:{ideal:1280}}});
   if(epoch!==this.epoch){acquired.getTracks().forEach(t=>t.stop());return;}
   this.stream=acquired;this.video.srcObject=acquired;await this.video.play();
   if(epoch!==this.epoch)return;
   this.onState('live','Камера включена · примерка одежды пока недоступна');
   acquired.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(epoch===this.epoch)this.stop('Камера отключена устройством');},{once:true}));
  }catch(error){
   acquired?.getTracks().forEach(t=>t.stop());
   if(epoch!==this.epoch)return;
   const message={NotAllowedError:'Доступ к камере запрещён. Разрешите его в настройках сайта.',NotFoundError:'Камера не найдена. Подключите её и попробуйте снова.',NotReadableError:'Камера занята другим приложением. Закройте его и попробуйте снова.'}[error.name]||'Не удалось открыть камеру. Попробуйте снова.';
   this.stop(message);
  }
 }
}
if(typeof module==='object'&&module.exports){module.exports={RoomCamera};return;}
root.RoomCamera=RoomCamera;
const mirror=document.getElementById('mirror');if(!mirror)return;
const video=document.createElement('video');video.className='mirror-camera-video';video.autoplay=true;video.muted=true;video.playsInline=true;video.hidden=true;video.setAttribute('aria-label','Ваше отражение с камеры');mirror.prepend(video);
const controls=document.createElement('div');controls.className='mirror-camera-controls';
const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Включить камеру';toggle.setAttribute('aria-pressed','false');
const flip=document.createElement('button');flip.type='button';flip.textContent='Сменить камеру';flip.hidden=true;
const status=document.createElement('p');status.className='mirror-camera-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.textContent='Камера только на вашем устройстве · без записи';
controls.append(toggle,flip,status);mirror.append(controls);
let state='off';const camera=new RoomCamera({video,getMedia:c=>navigator.mediaDevices.getUserMedia(c),onState:(next,message)=>{state=next;video.hidden=next!=='live';mirror.classList.toggle('camera-live',next==='live');video.style.transform=camera.facing==='user'?'scaleX(-1)':'none';toggle.textContent=next==='off'?'Включить камеру':next==='pending'?'Отменить':'Выключить камеру';toggle.setAttribute('aria-pressed',String(next==='live'));flip.hidden=next!=='live';status.textContent=message;}});
toggle.addEventListener('click',()=>{if(state!=='off'){camera.stop();return;}if(!navigator.mediaDevices?.getUserMedia||!window.isSecureContext){status.textContent='Для камеры откройте сайт по HTTPS или на localhost.';return;}camera.start(camera.facing);});
flip.addEventListener('click',()=>camera.start(camera.facing==='user'?'environment':'user'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)camera.stop('Камера выключена при выходе из комнаты');});
window.addEventListener('pagehide',()=>camera.stop());
})(typeof window==='undefined'?globalThis:window);
