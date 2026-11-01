// Deterministic lock service implementing the Web Locks callback lifetime.
export class TestLockManager{
 constructor(){this.held=new Set();}
 async request(name,options,callback){
  if(!options.ifAvailable)throw new Error('Tests expect nonblocking ownership claims');
  if(this.held.has(name))return callback(null);
  this.held.add(name);try{return await callback({name,mode:'exclusive'});}finally{this.held.delete(name);}
 }
}
export function tabStorage(values=new Map()){
 return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key),copy:()=>tabStorage(new Map(values))};
}
