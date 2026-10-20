const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../integrations/prospect-acknowledgements/Acknowledgements.gs'),'utf8');
const id=n=>`${String(n).padStart(8,'0')}-dc77-4788-9229-389527725812`;
const now=Date.now(),enabled=now-10000;
function harness(data){
 const rows=[[],...data],logs=[['Submission ID','Recipient','Status','Updated at','Note']],sent=[],props=new Map([['ACK_ENABLED_AT',new Date(enabled).toISOString()]]),triggers=[];
 let fail=false,quota=100,locked=false;
 const range=(data,r,c,h=1,w=1)=>({getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>data[r+i-1]?.[c+j-1]??'')),getDisplayValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>String(data[r+i-1]?.[c+j-1]??''))),setValues(values){values.forEach((row,i)=>row.forEach((v,j)=>{(data[r+i-1]??=[])[c+j-1]=typeof v==='string'&&v.startsWith("'")?v.slice(1):v;}));return this;},setNumberFormat(){return this;}});
 const sheet=d=>({getLastRow:()=>d.length,getMaxRows:()=>1000,getRange:(...args)=>range(d,...args)});
 const enquiry=sheet(rows),log=sheet(logs),book={getSheetByName:n=>n==='Enquiries'?enquiry:log};
 const ctx={Date,Map,Set,Math,Number,notificationBook_:()=>book,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)})},SpreadsheetApp:{flush(){}},LockService:{getUserLock:()=>({tryLock(){if(locked)return false;locked=true;return true;},releaseLock(){locked=false;}})},MailApp:{getRemainingDailyQuota:()=>quota,sendEmail(m){if(fail)throw Error('mail unavailable');sent.push(m);}},ScriptApp:{getProjectTriggers:()=>triggers,newTrigger:name=>({timeBased(){return this;},everyMinutes(n){assert.equal(n,5);return this;},create(){triggers.push({getHandlerFunction:()=>name});}})}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,sent,logs,rows,props,triggers,setFail:v=>fail=v,setQuota:v=>quota=v};
}
const row=(n,email='lead@acme.com',time=now-1000)=>[new Date(time),'Injected name','Company',email,'Untrusted subject','Untrusted content https://untrusted.invalid',id(n)];
let h=harness([row(1),row(2,'LEAD@acme.com'),row(3,'a@acme.com,b@acme.com'),row(4,'test@example.com'),row(5,'old@acme.com',enabled-1000)]);
h.ctx.sendEnquiryAcknowledgements();assert.equal(h.sent.length,1);assert.equal(h.sent[0].to,'lead@acme.com');assert.equal(h.sent[0].replyTo,'thisisfurqanahmad@gmail.com');assert(!h.sent[0].body.includes('Untrusted'));assert.equal(h.logs[1][2],'Sent');assert.equal(h.logs[2][2],'Skipped');assert.equal(h.logs.length,5);
h.ctx.sendEnquiryAcknowledgements();assert.equal(h.sent.length,1);
h=harness([row(6)]);h.setFail(true);h.ctx.sendEnquiryAcknowledgements();assert.equal(h.logs[1][2],'Retry');h.setFail(false);h.ctx.sendEnquiryAcknowledgements();assert.equal(h.sent.length,1);assert.equal(h.logs[1][2],'Sent');
h=harness([row(7)]);h.setQuota(20);h.ctx.sendEnquiryAcknowledgements();assert.equal(h.sent.length,0);h.setQuota(21);h.ctx.sendEnquiryAcknowledgements();assert.equal(h.sent.length,1);
h=harness([row(8)]);h.logs.push([id(8),'lead@acme.com','Sending',new Date(),'']);h.ctx.sendEnquiryAcknowledgements();assert.equal(h.sent.length,0);
h=harness([]);h.ctx.setupEnquiryAcknowledgements();h.ctx.setupEnquiryAcknowledgements();assert.equal(h.triggers.length,1);assert.equal(h.sent.length,1);assert.equal(h.sent[0].to,'thisisfurqanahmad@gmail.com');
console.log('PASS: exact recipient, fixed message, reply-to, old-enquiry exclusion, per-address throttle, invalid/reserved address rejection, deduplication, retries, quota reserve, ambiguous-send suppression and idempotent setup.');
