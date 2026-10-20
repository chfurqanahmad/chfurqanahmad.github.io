const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const headers=['Received at (Chicago)','Name','Company','Email','Subject','Goal','Submission ID'];
const id='a3b126d0-dc77-4788-9229-389527725812';
const rows=[headers,['2026-10-20 10:00','Test Name','Example','test@example.com','Project\nrequest','=literal goal',id]];
const logs=[['Submission ID','Status','Updated at','Note']];
const sent=[];let fail=false,quota=10,locked=false;
function range(data,r,c,h=1,w=1){return {getDisplayValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>String(data[r+i-1]?.[c+j-1]??''))),setValues(values){for(let i=0;i<values.length;i++)for(let j=0;j<values[i].length;j++)(data[r+i-1]??=[])[c+j-1]=values[i][j];return this;}};}
const makeSheet=data=>({getLastRow:()=>data.length,getRange:(...args)=>range(data,...args),getSheetId:()=>1});
const sheet=makeSheet(rows),log=makeSheet(logs);
const book={getSheetByName:n=>n==='Enquiries'?sheet:log,getUrl:()=> 'https://docs.google.com/spreadsheets/d/test/edit'};
const ctx={Date,Map,Math,PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test'})},SpreadsheetApp:{openById:()=>book,flush(){}},LockService:{getUserLock:()=>({tryLock(){if(locked)return false;locked=true;return true;},releaseLock(){locked=false;}})},MailApp:{getRemainingDailyQuota:()=>quota,sendEmail(m){if(fail)throw Error('mail unavailable');sent.push(m);}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../integrations/owner-notifications/Notifications.gs'),'utf8'),ctx);
ctx.sendEnquiryNotifications();assert.equal(sent.length,1);assert.equal(sent[0].to,'thisisfurqanahmad@gmail.com');assert(!sent[0].subject.includes('\n'));assert(sent[0].body.includes('=literal goal'));assert.equal(logs[1][1],'Sent');
ctx.sendEnquiryNotifications();assert.equal(sent.length,1);
logs[1][1]='Retry';fail=true;ctx.sendEnquiryNotifications();assert.equal(logs[1][1],'Retry');assert.equal(locked,false);
fail=false;ctx.sendEnquiryNotifications();assert.equal(sent.length,2);assert.equal(logs[1][1],'Sent');
logs[1][1]='Sending';ctx.sendEnquiryNotifications();assert.equal(sent.length,2);
logs[1][1]='Retry';quota=0;ctx.sendEnquiryNotifications();assert.equal(sent.length,2);assert.equal(logs[1][1],'Retry');
assert.equal(rows.length,2);console.log('PASS: owner-only recipient, full details, subject sanitation, deduplication, retry after mail failure, ambiguous-send suppression, quota deferral and original row preservation.');
