const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const rows = [['Received at (Chicago)', 'Name', 'Company', 'Email', 'Subject', 'Goal', 'Submission ID']];
let locked=false, failWrite=false;
const emailOrder=[];let failEmail=false;
function range(r,c,h=1,w=1){
  return {
    getDisplayValues(){return Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>String(rows[r+i-1]?.[c+j-1]??'')));},
    createTextFinder(id){return {matchEntireCell(){return this;},findNext(){const i=rows.findIndex((row,k)=>k>=r-1&&row[c-1]===id);return i<0?null:{getRow:()=>i+1};}};},
    setValue(v){(rows[r-1]??=[])[c-1]=v;return this;},
    setValues(values){if(failWrite)throw Error('Write failed');values.forEach((row,i)=>row.forEach((v,j)=>{(rows[r+i-1]??=[])[c+j-1]=v.startsWith("'")?v.slice(1):v;}));return this;},
    setNumberFormat(){return this;},setFontFamily(){return this;},setFontSize(){return this;},setVerticalAlignment(){return this;},setWrap(){return this;}
  };
}
const cache=new Map();
const context={Date,sendEnquiryNotifications(id){assert.equal(locked,false);emailOrder.push('owner:'+id);if(failEmail)throw Error('Email failed');},sendEnquiryAcknowledgements(id){emailOrder.push('client:'+id);},ContentService:{MimeType:{JSON:'json'},createTextOutput(text){return {setMimeType(){return JSON.parse(text);}};}},
  PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test-sheet'})},
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>({getRange:range,getLastRow:()=>rows.length,getMaxRows:()=>1000})}),newRichTextValue:()=>({setText(text){this.text=text;return this;},build(){return {text:this.text};}}),flush(){}},
  LockService:{getScriptLock:()=>({tryLock(){if(locked)return false;locked=true;return true;},hasLock:()=>locked,releaseLock(){locked=false;}})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},
  Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()]}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../integrations/apps-script/Code.gs'),'utf8'),context);
const valid={name:'Test Sender',company:'Example Co',email:'test@example.com',subject:'=1+1',goal:'Research business buyers',submissionId:crypto.randomUUID(),website:''};
const event=p=>({postData:{length:JSON.stringify(p).length},parameter:p});
assert.equal(context.doPost(event({...valid,email:'invalid'})).ok,false);
assert.equal(context.doPost(event({...valid,website:'bot'})).ok,false);
assert.equal(rows.length,1);
let result=context.doPost(event(valid));assert.equal(result.ok,true);assert.equal(result.submissionId,valid.submissionId);
assert.deepEqual(emailOrder,['owner:'+valid.submissionId,'client:'+valid.submissionId]);
assert.equal(rows.length,2);assert.equal(rows[1][4],'=1+1');assert(rows[1][0] instanceof Date);
assert.equal(context.doPost(event(valid)).ok,true);assert.equal(rows.length,2);
assert.equal(context.doPost(event({...valid,goal:'Changed content'})).error,'conflicting_request');
failWrite=true;assert.equal(context.doPost(event({...valid,submissionId:crypto.randomUUID()})).ok,false);assert.equal(locked,false);failWrite=false;
assert.equal(context.doPost(event({...valid,goal:' '.repeat(4)})).ok,false);
assert.equal(context.doPost({...event(valid),parameters:{name:['one','two']}}).ok,false);
failEmail=true;const emailFailureId=crypto.randomUUID();assert.equal(context.doPost(event({...valid,submissionId:emailFailureId})).ok,true);assert.equal(emailOrder.at(-1),'owner:'+emailFailureId);assert.equal(rows.at(-1)[6],emailFailureId);
assert.equal(context.doGet().service,'website-enquiries');
console.log('PASS: input rejection, literal text write path, duplicate receipt, conflicting retry, failed write and lock release. Live Google verification still required.');
