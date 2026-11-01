// Web Locks coordinate saved-session ownership between tabs on this origin.
// Room membership and player movement still use the shared server/database.
export class TabSessionOwner{
 constructor({locks=globalThis.navigator?.locks}={}){this.locks=locks;this.disabled=false;this.id=null;this.hold=null;this.request=null;this.generation=0;}
 get canResume(){return !this.disabled&&typeof this.locks?.request==='function';}
 async claim(id,{resume=false}={}){
  if(this.id===id)return true;
  await this.release();
  if(!this.canResume){if(!resume)this.id=id;return !resume;}
  const generation=++this.generation;
  return new Promise(resolve=>{
   const unavailable=()=>{this.disabled=true;this.id=resume?null:id;resolve(!resume);};
   try{
    this.request=this.locks.request('times-square-player:'+id,{ifAvailable:true},async lock=>{
     if(!lock||generation!==this.generation){resolve(false);return;}
     const held=new Promise(release=>this.hold=release);this.id=id;resolve(true);
     await held;if(generation===this.generation){this.id=null;this.hold=null;}
    }).catch(unavailable);
   }catch{unavailable();}
  });
 }
 async release(){
  ++this.generation;this.hold?.();this.hold=null;this.id=null;
  const request=this.request;this.request=null;await request;
 }
}
