// ============================================================
// FOOD ORDER SYSTEM 
// ============================================================
const SHEETS={
  MENU:'MENU',OPTIONS:'OPTIONS',ORDERS:'ORDERS',ORDER_ITEMS:'ORDER_ITEMS',
  PAYMENTS:'PAYMENTS',SETTINGS:'SETTINGS',
  PROMOTIONS:'PROMOTIONS',USERS:'USERS',TEMP_ORDERS:'TEMP_ORDERS',ACTIVITY_LOGS:'ACTIVITY_LOGS',SESSIONS:'SESSIONS',LOGS:'LOGS',PRINT_JOBS:'PRINT_JOBS'
};
const TTL={MENU:300,CFG:300,DEPT:600,PROMO:300,SETTINGS:300,STATUS:60,RATE:120};
const PERF={DASH:45,ORDERS_LIST:15};
const CACHE_KEYS={
  MENU_FULL:'fo_menu_full_v3',
  MENU_VERSION:'fo_menu_version_v3',
  SETTINGS_VERSION:'fo_settings_version_v3',
  PROMOTIONS_VERSION:'fo_promotions_version_v3',
  SETTINGS_PUBLIC:'fo_settings_public_v3',
  SETTINGS_FULL:'fo_settings_full_v3',
  NOTIFY_SETTINGS:'fo_notify_settings_v3',
  DEPARTMENTS:'fo_departments_v3',
  PROMOTIONS:'fo_promotions_v3',
  ORDERS_LIGHT:'fo_orders_light_v3',
  DASHBOARD:'fo_dashboard_v3',
  DASHBOARD_FULL:'fo_dashboard_full_v3',
  LOG_QUEUE:'fo_log_queue_v3'
};
var __sheetObjCache={};
var __reqDataCache={rows:{},objs:{},idx:{},grp:{},settingsMap:null,perf:{},authByToken:{}};

function getSpreadsheet_(){
  if(typeof SPREADSHEET_ID!=='undefined'&&SPREADSHEET_ID){
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  const active=SpreadsheetApp.getActiveSpreadsheet();
  if(!active)throw new Error('Spreadsheet not found. Please set SPREADSHEET_ID.');
  return active;
}
function SS(){return getSpreadsheet_();}
function SC(){return CacheService.getScriptCache();}
// Backward-compat helper: some legacy code may still call ss('SHEET_NAME')
function ss(name){
  if(name==null||name==='')return getSpreadsheet_();
  return getSpreadsheet_().getSheetByName(String(name));
}
function getSheet(n){
  const key=String(n||'');
  if(__sheetObjCache[key])return __sheetObjCache[key];
  const sh=SS().getSheetByName(key);
  __sheetObjCache[key]=sh||null;
  return sh;
}
function genId(p){return p+Date.now().toString(36).toUpperCase()+Math.random().toString(36).substr(2,6).toUpperCase();}
function sanitize(s){return String(s||'').replace(/[<>"'`\\]/g,'').trim().substr(0,200);}
function toNum(v){const n=parseFloat(v);return isNaN(n)?0:n;}
function respond(data){return{success:true,data};}
function err(code,msg){return{success:false,code:String(code),message:String(msg)};}
function nowMs(){return Date.now();}
function round2(v){return Math.round((toNum(v)+Number.EPSILON)*100)/100;}
function sanitizeText(v,maxLen){
  const m=maxLen||200;
  return String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,'').replace(/[<>"'`\\]/g,'').trim().substring(0,m);
}
function parsePositiveNumber(v,def,min,max){
  const n=toNum(v);
  if(!isFinite(n)||isNaN(n))return def!=null?toNum(def):0;
  let x=n;
  if(min!=null&&x<min)x=min;
  if(max!=null&&x>max)x=max;
  return x;
}
function normalizeQty(v){
  const n=parseInt(v,10);
  if(!isFinite(n)||isNaN(n))return 1;
  return Math.max(1,Math.min(99,n));
}
function normalizeStock(v){
  const s=String(v==null?'':v).trim();
  if(!s)return -1;
  const n=parseInt(s,10);
  if(!isFinite(n)||isNaN(n))return -1;
  if(n<0)return -1;
  if(n===0)return 0;
  return n;
}
function isOutOfStock(v){
  return normalizeStock(v)===0;
}
function safeCompareMoney(a,b){
  return Math.abs(round2(a)-round2(b))<0.01;
}
function _mkKey(raw){
  return String(raw||'').replace(/[^a-zA-Z0-9:_-]/g,'').substring(0,120);
}
function rateLimit(key,limit,windowSec){
  const lim=Math.max(1,parseInt(limit||1,10));
  const win=Math.max(1,parseInt(windowSec||60,10));
  const cacheKey='rl_'+_mkKey(key);
  const cache=SC();
  const cur=cache.get(cacheKey);
  const next=cur?parseInt(cur,10)+1:1;
  cache.put(cacheKey,String(next),win);
  return next<=lim;
}
function _requireRateLimit(scope,key,limit,windowSec,msg){
  if(!rateLimit(scope+':'+key,limit,windowSec)){
    const e=new Error(msg||'เรียกใช้งานถี่เกินไป กรุณาลองใหม่');
    e.code='RATE_LIMIT';
    throw e;
  }
}
function _perfStart(tag){
  perfStart(tag);
}
function _perfEnd(tag,meta){
  perfEnd(tag,meta);
}
function _isPerfDebugEnabled(){
  if(__reqDataCache&&Object.prototype.hasOwnProperty.call(__reqDataCache,'perfEnabled')){
    return __reqDataCache.perfEnabled===true;
  }
  let enabled=false;
  try{
    const m=_settingsMap();
    const raw=(m&&m.perf_debug_enabled!=null)?m.perf_debug_enabled:m&&m.perf_debug;
    enabled=String(raw||'0')==='1';
  }catch(_){enabled=false;}
  __reqDataCache.perfEnabled=enabled;
  return enabled;
}
function perfStart(label){
  try{
    if(!_isPerfDebugEnabled())return;
    const key=String(label||'').trim();
    if(!key)return;
    __reqDataCache.perf[key]={start:nowMs(),last:nowMs(),steps:[]};
  }catch(_){}
}
function perfStep(label,step){
  try{
    if(!_isPerfDebugEnabled())return;
    const key=String(label||'').trim();
    const rec=__reqDataCache.perf[key];
    if(!rec)return;
    const cur=nowMs();
    rec.steps.push({step:String(step||'step'),ms:Math.max(0,cur-rec.last)});
    rec.last=cur;
  }catch(_){}
}
function perfEnd(label,meta){
  try{
    if(!_isPerfDebugEnabled())return;
    const key=String(label||'').trim();
    const rec=__reqDataCache.perf[key];
    if(!rec||!rec.start)return;
    const totalMs=Math.max(0,nowMs()-rec.start);
    log('info','perf',key,{ms:totalMs,steps:rec.steps||[],meta:meta||{}});
    delete __reqDataCache.perf[key];
  }catch(_){}
}
function _cacheGet(key){
  try{
    const raw=SC().get(String(key||''));
    return raw?JSON.parse(raw):null;
  }catch(_){return null;}
}
function _cachePut(key,value,ttlSec){
  try{SC().put(String(key||''),JSON.stringify(value),ttlSec||300);}catch(_){}
}
function _cacheRemove(){
  const keys=[].slice.call(arguments).filter(Boolean).map(String);
  if(!keys.length)return;
  try{SC().removeAll(keys);}catch(_){keys.forEach(k=>{try{SC().remove(k);}catch(__){}});}
}
function _invalidateMenuCaches(){
  // PERF: invalidate all menu-related caches together
  _cacheRemove(CACHE_KEYS.MENU_FULL,CACHE_KEYS.MENU_VERSION,CACHE_KEYS.DEPARTMENTS);
  try{SC().remove('menu');}catch(_){}
  _bumpMenuVersion();
}
function _invalidateSettingsCaches(opts){
  // PERF: settings updates should invalidate only related caches.
  opts=opts||{};
  const keys=['fo_settings_staff_v3',CACHE_KEYS.SETTINGS_PUBLIC,CACHE_KEYS.SETTINGS_FULL,CACHE_KEYS.NOTIFY_SETTINGS];
  if(opts.includeDepartments)keys.push(CACHE_KEYS.DEPARTMENTS);
  if(opts.includeMenu)keys.push(CACHE_KEYS.MENU_FULL,CACHE_KEYS.MENU_VERSION);
  if(opts.includePromotions)keys.push(CACHE_KEYS.PROMOTIONS,CACHE_KEYS.PROMOTIONS_VERSION);
  if(opts.includeDashboard)keys.push(CACHE_KEYS.DASHBOARD,CACHE_KEYS.DASHBOARD_FULL);
  _cacheRemove.apply(null,keys);
  _bumpSettingsVersion();
}
function _sheetRows(sheetName){
  const key=String(sheetName||'');
  if(__reqDataCache.rows[key])return __reqDataCache.rows[key];
  const sh=getSheet(key);
  // PERF/FIX: must allow header-only sheets (lastRow===1), otherwise first batch insert never works.
  if(!sh||sh.getLastRow()<1){__reqDataCache.rows[key]=[];return [];}
  // PERF: read each sheet once per request lifecycle
  __reqDataCache.rows[key]=sh.getDataRange().getValues();
  return __reqDataCache.rows[key];
}
function _sheetObjects(sheetName){
  const key=String(sheetName||'');
  if(__reqDataCache.objs[key])return __reqDataCache.objs[key];
  const rows=_sheetRows(key);
  if(!rows.length){__reqDataCache.objs[key]=[];return [];}
  const headers=rows[0]||[];
  __reqDataCache.objs[key]=rows.slice(1).map(r=>{const o={};headers.forEach((h,i)=>o[h]=r[i]);return o;});
  return __reqDataCache.objs[key];
}
function _buildIdx(sheetName,keyCol){
  const cacheKey=String(sheetName||'')+':'+String(keyCol||'id');
  if(__reqDataCache.idx[cacheKey])return __reqDataCache.idx[cacheKey];
  const rows=_sheetRows(sheetName);
  if(!rows.length){__reqDataCache.idx[cacheKey]={};return {};}
  const headers=rows[0];
  const colIdx=typeof keyCol==='string'?headers.indexOf(keyCol):keyCol;
  const map={};
  if(colIdx<0){__reqDataCache.idx[cacheKey]=map;return map;}
  for(let i=1;i<rows.length;i++){
    const k=String(rows[i][colIdx]||'');
    if(k)map[k]={row:i+1,data:rows[i],headers:headers};
  }
  __reqDataCache.idx[cacheKey]=map;
  return map;
}
function _settingsMap(){
  if(__reqDataCache.settingsMap)return __reqDataCache.settingsMap;
  const rows=_sheetRows(SHEETS.SETTINGS);
  const map={};
  for(let i=1;i<rows.length;i++){
    map[String(rows[i][0]||'')]=rows[i][1];
  }
  __reqDataCache.settingsMap=map;
  return map;
}
function _normalizeDateLikeString(v){
  if(v===undefined||v===null||v==='')return '';
  try{
    if(v instanceof Date){
      if(isNaN(v.getTime()))return '';
      return v.toISOString();
    }
    const s=String(v).trim();
    if(!s)return '';
    const d=new Date(s);
    if(isNaN(d.getTime()))return '';
    return s;
  }catch(_){return '';}
}
function _looksLeakedDateText(v){
  const s=String(v==null?'':v).trim();
  if(!s)return false;
  // รองรับรูปแบบ Date.toString() ที่เคยหลุดมาอยู่ใน note/customer_note
  if(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s/i.test(s) && /\bGMT[+-]\d{4}\b/i.test(s))return true;
  // รองรับข้อความวันที่อังกฤษที่ parse ได้ชัดเจนและมี timezone
  if(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(s) && /\b\d{4}\b/.test(s) && /\bGMT\b/i.test(s))return true;
  return false;
}
function _safeText(v,maxLen){
  const m=maxLen||500;
  return String(v==null?'':v).substring(0,m);
}
function _toJson(v,maxLen){
  const m=maxLen||5000;
  try{return _safeText(JSON.stringify(v||{}),m);}catch(_){return _safeText(String(v||''),m);}
}
function ensureActivityLogSheet(){
  let sh=getSheet(SHEETS.ACTIVITY_LOGS);
  const headers=['created_at','level','actor','role','action','message','payload'];
  if(!sh){
    sh=SS().insertSheet(SHEETS.ACTIVITY_LOGS);
    sh.appendRow(headers);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    return sh;
  }
  if(sh.getLastRow()<1){
    sh.appendRow(headers);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    return sh;
  }
  const firstRow=sh.getRange(1,1,1,Math.max(headers.length,sh.getLastColumn())).getValues()[0];
  const hasExactHeader=headers.every((h,i)=>String(firstRow[i]||'').trim()===h);
  if(!hasExactHeader){
    sh.insertRowBefore(1);
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    return sh;
  }
  const existing=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  headers.forEach(h=>{
    if(existing.indexOf(h)===-1){
      const col=sh.getLastColumn()+1;
      sh.getRange(1,col).setValue(h).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    }
  });
  return sh;
}
function _ensureSheetHeaders(sheetName,headers){
  const list=Array.isArray(headers)?headers.filter(Boolean):[];
  if(!list.length)return null;
  let sh=getSheet(sheetName);
  if(!sh){
    sh=SS().insertSheet(sheetName);
    sh.appendRow(list);
    sh.getRange(1,1,1,list.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    return sh;
  }
  if(sh.getLastRow()<1){
    sh.appendRow(list);
    sh.getRange(1,1,1,list.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    return sh;
  }
  const existing=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0];
  list.forEach(h=>{
    if(existing.indexOf(h)===-1){
      const col=sh.getLastColumn()+1;
      sh.getRange(1,col).setValue(h).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    }
  });
  return sh;
}
function _ensureOrderDataSchema(){
  _ensureSheetHeaders(SHEETS.ORDERS,['id','customer','department','note','customer_note','subtotal','discount','total','payment_amount','payment_suffix','promo','status','created_at','updated_at','printed_count','printed_at','last_print_mode']);
  _ensureSheetHeaders(SHEETS.TEMP_ORDERS,['order_id','customer','department','note','customer_note','subtotal','discount','total','payment_amount','payment_suffix','payment_method','status','ref1','ref2','ref3','payload','created_at','expires_at','updated_at']);
  _ensureSheetHeaders(SHEETS.ORDER_ITEMS,['id','order_id','menu_id','name','options','qty','price','total']);
}
function _ensurePrintJobsSchema(){
  _ensureSheetHeaders(SHEETS.PRINT_JOBS,['job_id','type','order_ids','status','progress','created_at','updated_at','created_by','error_message','meta_json']);
}
function _ensureCatalogSchema(){
  _ensureSheetHeaders(SHEETS.MENU,['id','name','price','image','category','description','status','topic_ids','stock']);
  _ensureSheetHeaders(SHEETS.OPTIONS,['id','menu_id','group_name','is_required','type','choices','status','stock']);
}
function _appendActivityLog(rec){
  try{
    const sh=ensureActivityLogSheet();
    if(!sh)return;
    sh.appendRow([
      rec.created_at||new Date(),
      _safeText(rec.level||'info',20),
      _safeText(rec.actor||'system',80),
      _safeText(rec.role||'system',40),
      _safeText(rec.action||'-',120),
      _safeText(rec.message||'',1000),
      _safeText(rec.payload||'',5000)
    ]);
    try{SC().remove('fo_activity_logs_latest');}catch(_){}
  }catch(_){}
}
function _queueActivityLog(rec){
  try{
    // PERF: keep only truly critical levels synchronous; queue warn/info to reduce write latency.
    const critical=['error','security'];
    if(critical.indexOf(String(rec&&rec.level||'info').toLowerCase())>-1){
      _appendActivityLog(rec);
      return;
    }
    // PERF: queue non-critical logs to reduce request latency
    const list=_cacheGet(CACHE_KEYS.LOG_QUEUE)||[];
    list.push(rec);
    _cachePut(CACHE_KEYS.LOG_QUEUE,list.slice(-200),120);
  }catch(_){
    _appendActivityLog(rec);
  }
}
function flushActivityLogQueue(){
  try{
    const list=_cacheGet(CACHE_KEYS.LOG_QUEUE)||[];
    if(!Array.isArray(list)||!list.length)return;
    const sh=ensureActivityLogSheet();
    if(!sh)return;
    const rows=list.map(rec=>[
      rec.created_at||new Date(),
      _safeText(rec.level||'info',20),
      _safeText(rec.actor||'system',80),
      _safeText(rec.role||'system',40),
      _safeText(rec.action||'-',120),
      _safeText(rec.message||'',1000),
      _safeText(rec.payload||'',5000)
    ]);
    const start=sh.getLastRow()+1;
    sh.getRange(start,1,rows.length,rows[0].length).setValues(rows);
    _cacheRemove(CACHE_KEYS.LOG_QUEUE,'fo_activity_logs_latest');
  }catch(_){}
}
function auditLog(token,action,message,payload,level){
  try{
    const u=requireAuth(token);
    _queueActivityLog({
      created_at:new Date(),
      level:level||'info',
      actor:String(u.username||u.id||'unknown'),
      role:String(u.role||'staff'),
      action:String(action||'action'),
      message:String(message||''),
      payload:_toJson(payload||{},5000)
    });
  }catch(_){}
}
function ensureActivityLogPurgeTrigger(){
  try{
    const fn='purgeOldActivityLogs';
    const exists=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()===fn);
    if(!exists)ScriptApp.newTrigger(fn).timeBased().everyDays(1).atHour(4).create();
    const flushFn='flushActivityLogQueue';
    const hasFlush=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()===flushFn);
    if(!hasFlush)ScriptApp.newTrigger(flushFn).timeBased().everyMinutes(1).create();
  }catch(_){}
}
function purgeOldActivityLogs(){
  try{
    const sh=getSheet(SHEETS.ACTIVITY_LOGS);if(!sh||sh.getLastRow()<2)return;
    const rows=sh.getDataRange().getValues();const headers=rows[0];
    const dateCol=headers.indexOf('created_at');
    if(dateCol===-1)return;
    const cutoff=new Date(Date.now()-7*24*60*60*1000);
    const delRows=[];
    for(let i=1;i<rows.length;i++){
      const dt=new Date(rows[i][dateCol]);
      if(!isNaN(dt.getTime())&&dt<cutoff)delRows.push(i+1);
    }
    if(!delRows.length)return;
    const blocks=[];
    let start=delRows[0],prev=delRows[0];
    for(let i=1;i<delRows.length;i++){
      const cur=delRows[i];
      if(cur===prev+1){prev=cur;continue;}
      blocks.push({start:start,count:prev-start+1});
      start=cur;prev=cur;
    }
    blocks.push({start:start,count:prev-start+1});
    blocks.sort((a,b)=>b.start-a.start).forEach(b=>{sh.deleteRows(b.start,b.count);});
  }catch(_){}
}
// PERF-FIX: Collision-safe Order ID generation (timestamp + random + cache + lock)
function generateOrderId(){
  const now=new Date();
  const pad=(n)=>n.toString().padStart(2,'0');
  const datePart=now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate());
  const timePart=pad(now.getHours())+pad(now.getMinutes())+pad(now.getSeconds());
  const randomPart=Math.random().toString(36).substring(2,8).toUpperCase();
  const extraRandom=Math.random().toString(36).substring(2,4).toUpperCase();
  return 'ORD-'+datePart+'-'+timePart+'-'+randomPart+'-'+extraRandom;
}
// PERF-FIX: Collision-safe Order ID generation (timestamp + random + cache + lock)
function generateSafeOrderId(){
  const cache=SC();
  let id;
  do{id=generateOrderId();}while(cache.get('order_id_'+id));
  cache.put('order_id_'+id,'1',300);
  return id;
}
// PERF-FIX: Orders cache invalidation helpers
function _trackOrdersListCacheKey(key){
  try{
    const prop=PropertiesService.getScriptProperties();
    const raw=prop.getProperty('orders_list_cache_keys')||'[]';
    const arr=JSON.parse(raw);
    if(arr.indexOf(key)===-1){arr.push(key);prop.setProperty('orders_list_cache_keys',JSON.stringify(arr.slice(-100)));} // cap keys
  }catch(_){}
}
// PERF-FIX: Orders cache invalidation helpers
function _invalidateOrdersCaches(){
  try{
    const prop=PropertiesService.getScriptProperties();
    const raw=prop.getProperty('orders_list_cache_keys')||'[]';
    const arr=JSON.parse(raw);
    _cacheRemove.apply(null,arr.concat([CACHE_KEYS.ORDERS_LIGHT,CACHE_KEYS.DASHBOARD,CACHE_KEYS.DASHBOARD_FULL]));
    prop.deleteProperty('orders_list_cache_keys');
  }catch(_){}
  _cacheRemove('order_stats_today','dash_summary_v3');
  _cacheRemove('fo_print_jobs_recent_v1');
  _bumpOrdersVersion();
}
function _invalidatePrintQueueCache(){
  _cacheRemove('fo_print_jobs_recent_v1');
}
function _bumpOrdersVersion(){
  const v=String(Date.now())+'_'+Math.floor(Math.random()*100000);
  try{SC().put('orders_version_bump',v,21600);}catch(_){}
  try{PropertiesService.getScriptProperties().setProperty('orders_version_bump',v);}catch(_){}
  return v;
}
function _bumpMenuVersion(){
  const v=String(Date.now());
  try{_cachePut(CACHE_KEYS.MENU_VERSION,v,21600);}catch(_){}
  try{SC().put('menu_version',v,21600);}catch(_){}
  try{PropertiesService.getScriptProperties().setProperty('menu_version_bump',v);}catch(_){}
  return v;
}
function _bumpSettingsVersion(){
  const v=String(Date.now());
  try{_cachePut(CACHE_KEYS.SETTINGS_VERSION,v,21600);}catch(_){}
  try{SC().put('settings_version',v,21600);}catch(_){}
  try{PropertiesService.getScriptProperties().setProperty('settings_version_bump',v);}catch(_){}
  return v;
}
function _bumpPromotionVersion(){
  const v=String(Date.now());
  try{_cachePut(CACHE_KEYS.PROMOTIONS_VERSION,v,21600);}catch(_){}
  try{SC().put('promo_version',v,21600);}catch(_){}
  try{PropertiesService.getScriptProperties().setProperty('promo_version_bump',v);}catch(_){}
  return v;
}
function _getOrdersVersionBump(){
  let v='';
  try{v=String(SC().get('orders_version_bump')||'').trim();}catch(_){v='';}
  if(v)return v;
  try{return String(PropertiesService.getScriptProperties().getProperty('orders_version_bump')||'').trim();}catch(_){return '';}
}
function withRetry(fn,maxAttempts,baseDelayMs){
  maxAttempts=maxAttempts||3;
  baseDelayMs=baseDelayMs||200;
  let last;
  // PERF: exponential backoff with jitter reduces lock contention on Sheets writes
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{return fn();}
    catch(e){
      last=e;
      if(attempt===maxAttempts)break;
      const delay=baseDelayMs*Math.pow(2,attempt-1)+Math.random()*100;
      Utilities.sleep(Math.min(delay,3000));
    }
  }
  throw last;
}

// === ROUTING ===
function doGet(e){
  const qp=(e&&e.parameter)||{};
  if(qp&&qp.action){
    let payload=[];
    if(qp.payload){
      try{payload=JSON.parse(String(qp.payload||'[]'));}catch(_){payload=[];}
    }
    return _jsonOut(_dispatchApiAction(String(qp.action||''),payload));
  }
  // Auto-init sheets if USERS sheet is missing or empty
  try{var uSh=getSheet(SHEETS.USERS);if(!uSh||uSh.getLastRow()<2)initSheets();}catch(_){}
  try{_ensureOrderDataSchema();}catch(_){}
  try{_ensureAuthRuntimeReady();}catch(_){}
  try{ensureActivityLogSheet();ensureActivityLogPurgeTrigger();}catch(_){}
  const eParam=(e&&e.parameter)||{};
  const ePath=(e&&e.pathInfo)||'';
  const eQS=(e&&e.queryString)||'';
  let page='customer';
  if(eParam.page==='admin')page='admin';
  else if(ePath==='admin'||ePath==='/admin')page='admin';
  else if(eQS.indexOf('page=admin')>-1)page='admin';
  const tmpl=HtmlService.createTemplateFromFile('index');
  tmpl.page=page;
  tmpl.isAdmin=(page==='admin');
  tmpl.promptpay=String(cfg('promptpay')||'').replace(/[^0-9]/g,'');
  tmpl.payTimeout=String(parseInt(cfg('payment_timeout')||'900'));
  const title=page==='admin'?'FoodOrder Admin':'FoodOrder';
  let html=tmpl.evaluate().getContent();
  // build config object — ปลอดภัยสำหรับ JSON.stringify
  let customerTheme={};let adminTheme={};
  try{customerTheme=JSON.parse(cfg('customer_theme')||cfg('theme')||'{}');}catch(_){customerTheme={};}
  try{adminTheme=JSON.parse(cfg('admin_theme')||'{}');}catch(_){adminTheme={};}
  const cfgObj={
    isAdmin:(page==='admin'),
    gasPage:page,
    promptpay:String(cfg('promptpay')||'').replace(/[^0-9]/g,''),
    promptpayEnabled:String(cfg('promptpay_enabled')||'1')==='1',
    payTimeout:parseInt(cfg('payment_timeout')||'900'),
    cashPaymentEnabled:String(cfg('cash_payment_enabled')||'0')==='1',
    bankPaymentEnabled:String(cfg('bank_payment_enabled')||'1')==='1',
    deliveryCategoryType:String(cfg('delivery_category_type')||'village'),
    deliveryNoteMode:(String(cfg('delivery_category_type')||'village')==='village'?'address':'note'),
    restaurantName:String(cfg('restaurant_name')||'FoodOrder'),
    restaurantLogo:String(cfg('restaurant_logo')||''),
    shopOpen:isShopWithinHours(),
    customerTheme:customerTheme,
    adminTheme:adminTheme
  };
  const injectScript='<script id="_gas_inject">\nwindow._CFG='+JSON.stringify(cfgObj)+';\nwindow._isAdmin=window._CFG.isAdmin;\nwindow._gasPage=window._CFG.gasPage;\nwindow._promptpay=window._CFG.promptpay;\nwindow._promptpayEnabled=window._CFG.promptpayEnabled===true;\nwindow._payTimeout=window._CFG.payTimeout;\nwindow._cashPaymentEnabled=window._CFG.cashPaymentEnabled===true;\nwindow._bankPaymentEnabled=window._CFG.bankPaymentEnabled===true;\nwindow._deliveryCategoryType=window._CFG.deliveryCategoryType||\'village\';\nwindow._deliveryNoteMode=window._CFG.deliveryNoteMode||\'note\';\nwindow._restaurantName=window._CFG.restaurantName;\nwindow._restaurantLogo=window._CFG.restaurantLogo||\'\';\nwindow._shopOpen=window._CFG.shopOpen;\nwindow._customerTheme=window._CFG.customerTheme||{};\nwindow._adminTheme=window._CFG.adminTheme||{};\n<\/script>';
  html=html.replace('<head>','<head>'+injectScript);
  return HtmlService.createHtmlOutput(html).setTitle(title)
    .addMetaTag('viewport','width=device-width,initial-scale=1,maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function include(f){return HtmlService.createHtmlOutputFromFile(f).getContent();}

// === WEBHOOK ===
function isLineWebhookPayload_(raw){
  if(!raw||typeof raw!=='object')return false;
  return (typeof raw.destination==='string'&&Array.isArray(raw.events));
}
function handleLineWebhookFast_(payload){
  try{
    const events=Array.isArray(payload&&payload.events)?payload.events:[];
    if(!events.length){
      return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
    }
    let latestGroupId='';
    let latestUserId='';
    let latestRoomId='';
    events.forEach(function(ev){
      const src=ev&&ev.source||{};
      if(src.groupId)latestGroupId=String(src.groupId||'').trim();
      if(src.userId)latestUserId=String(src.userId||'').trim();
      if(src.roomId)latestRoomId=String(src.roomId||'').trim();
    });
    if(latestGroupId||latestUserId||latestRoomId){
      const sp=PropertiesService.getScriptProperties();
      if(latestGroupId)sp.setProperty('notification_line_last_group_id',latestGroupId);
      if(latestUserId)sp.setProperty('notification_line_last_user_id',latestUserId);
      if(latestRoomId)sp.setProperty('notification_line_last_room_id',latestRoomId);
    }
  }catch(_){}
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}
function doPost(e){
  if(!e||!e.postData||!e.postData.contents)return _jsonOut({success:false,message:'No payload'});
  let body;
  try{body=JSON.parse(e.postData.contents);}catch(_){return _jsonOut({success:false,message:'Invalid JSON'});}
  // LINE Webhook verify/receive: must return HTTP 200 quickly
  if(isLineWebhookPayload_(body)){
    return handleLineWebhookFast_(body);
  }
  if(body&&body.action){
    const payload=(body.payload==null?[]:body.payload);
    return _jsonOut(_dispatchApiAction(String(body.action||''),payload));
  }
  const lock=LockService.getScriptLock();
  try{
    lock.waitLock(25000);
    const refNbr=String(body.transRef||body.refNbr||(body.data&&(body.data.transRef||body.data.refNbr))||'').trim();
    const amount=toNum(body.amount||(body.data&&body.data.amount)||0);
    const orderId=String(body.orderId||body.order_id||(body.data&&body.data.orderId)||'').trim();
    if(!refNbr)return _jsonOut({success:false,message:'Missing refNbr'});
    if(amount<=0)return _jsonOut({success:false,message:'Invalid amount'});
    const refKey='ref_'+String(refNbr).replace(/\W/g,'').substr(0,50);
    if(SC().get(refKey))return _jsonOut({success:true,message:'Already processed (cache)'});
    const dupPay=crud(SHEETS.PAYMENTS,'findOne',{ref_nbr:String(refNbr)});
    if(dupPay){SC().put(refKey,'1',3600);return _jsonOut({success:true,message:'Already processed'});}
    if(!orderId){
      // PromptPay phone mode has no reliable ref mapping; keep webhook as audit only.
      withRetry(()=>crud(SHEETS.PAYMENTS,'insert',{id:genId('PAY'),order_id:'',ref_nbr:String(refNbr),amount:round2(amount),status:'webhook_unmatched',payment_method:'scan',ref1:'',ref2:'',ref3:'',created_at:new Date()}));
      SC().put(refKey,'1',3600);
      return _jsonOut({success:true,message:'Webhook received (unmatched)'});
    }
    const matchedOrderId=sanitizeText(orderId,80);
    const tempRaw=SC().get('temp_'+matchedOrderId)||_getTempOrderFromSheet(matchedOrderId);
    let orderTotal=0;
    if(tempRaw){
      const tempData=typeof tempRaw==='string'?JSON.parse(tempRaw):(tempRaw.payload?JSON.parse(tempRaw.payload):tempRaw);
      orderTotal=toNum(tempData.payment_amount||tempData.total);
    }
    if(orderTotal>0&&!safeCompareMoney(amount,orderTotal))return _jsonOut({success:false,message:'Amount mismatch'});
    withRetry(()=>crud(SHEETS.PAYMENTS,'insert',{id:genId('PAY'),order_id:matchedOrderId,ref_nbr:String(refNbr),amount:round2(amount),status:'verified',payment_method:'scan',ref1:'',ref2:'',ref3:'',created_at:new Date()}));
    _updateTempOrderStatus(matchedOrderId,'paid');
    _doConfirmOrder(matchedOrderId);
    SC().put(refKey,'1',3600);SC().put('status_'+matchedOrderId,'paid',TTL.STATUS);
    log('info','doPost','Webhook OK: '+matchedOrderId,{refNbr,amount});
    return _jsonOut({success:true,orderId:matchedOrderId});
  }catch(ex){log('error','doPost',ex.message);return _jsonOut({success:false,message:'Internal error'});}
  finally{try{lock.releaseLock();}catch(_){}}
}
function _jsonOut(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function _dispatchApiAction(action,payload){
  try{
    const name=String(action||'').trim();
    if(!name)return {success:false,message:'Missing action'};
    const allow={
      getInitialData:1,getMenu:1,getMenuVersion:1,getSettings:1,getSettingsPublic:1,getDepartments:1,getPromotions:1,
      createTempOrder:1,createCashOrder:1,verifySlipOK:1,checkPaymentStatus:1,cancelTempOrder:1,
      adminLogin:1,adminLoginV2:1,adminGuestLogin:1,verifyAdminSession:1,adminLogout:1,
      dashboardSummary:1,getOrders:1,getOrdersVersion:1,getOrderStats:1,getOrderDetail:1,getOrderDetailsBulk:1,updateOrderStatus:1,
      adminCRUDMenu:1,adminCRUDOption:1,adminCRUDPromotion:1,saveMenuOrder:1,
      getUsers:1,updateAdminUser:1,deleteAdminUser:1,
      saveSettings:1,saveSettingsPartial:1,getNotificationSettings:1,saveNotificationSettings:1,getActivityLogs:1,getLatestLineWebhookIds:1,
      testSlipOKConnection:1,testGoogleDriveConnection:1,testLineNotification:1,testTelegramNotification:1,
      uploadImageToDrive:1,createMenuImageFolder:1,migrateMenuImagesToDrive:1,verifyMigratedMenuImages:1,rollbackMenuImageMigration:1,backupMenuBeforeImageMigration:1,getMenuImageMigrationRollbackCandidates:1,migrateSheetBase64MenuImagesToDrive:1,verifyMenuImageStorage:1,
      getPrintTemplates:1,getPrintJobs:1,createPrintJob:1,processPrintJob:1,updatePrintJobStatus:1,retryPrintJob:1,completePrintJob:1,
      bulkAcceptOrders:1,markOrdersPrinted:1,resetOrdersPrinted:1,clearAllOrders:1,generateTestOrders:1,exportOrdersPdfByDepartment:1
    };
    if(!allow[name])return {success:false,message:'Action not allowed'};
    const fn=(typeof this[name]==='function')?this[name]:null;
    if(typeof fn!=='function')return {success:false,message:'Action not allowed'};
    const args=Array.isArray(payload)?payload:[payload];
    const out=fn.apply(null,args);
    if(out&&typeof out==='object'&&Object.prototype.hasOwnProperty.call(out,'success'))return out;
    return {success:true,data:(out===undefined?null:out)};
  }catch(ex){
    return {success:false,message:String((ex&&ex.message)||ex||'Internal error')};
  }
}

// ============================================================
// === SlipOK VERIFY (COMPLETE) ===
// ============================================================
function verifySlipOK(orderId,imageBase64,mimeType){
  perfStart('verifySlipOK');
  const lock=LockService.getScriptLock();
  try{
    _requireRateLimit('verify_slip','global',100,60,'ระบบกำลังประมวลผลจำนวนมาก กรุณาลองใหม่');
    if(!orderId)return err('INVALID','ไม่ระบุ orderId');
    orderId=sanitizeText(orderId,80);
    _requireRateLimit('verify_slip','order_'+orderId,8,60,'ตรวจสอบสลิปถี่เกินไป กรุณารอสักครู่');
    const mt=String(mimeType||'').toLowerCase();
    if(mt&&mt.indexOf('image/')!==0)return err('INVALID_FILE','รองรับเฉพาะไฟล์รูปภาพ');
    let rawBase64=String(imageBase64||'');
    if(rawBase64.indexOf(',')>-1)rawBase64=rawBase64.split(',')[1];
    rawBase64=rawBase64.replace(/\s/g,'');
    if(!rawBase64||rawBase64.length<100)return err('INVALID_FILE','ไฟล์สลิปไม่ถูกต้อง');
    const approxBytes=Math.floor(rawBase64.length*0.75);
    if(approxBytes>10*1024*1024)return err('FILE_TOO_LARGE','ไฟล์ใหญ่เกิน 10MB');
    lock.waitLock(20000);
    const cached=SC().get('status_'+orderId);
    if(cached==='paid')return err('ALREADY_PAID','ออเดอร์ชำระแล้ว');
    const tempRow=_getTempOrderFromSheet(orderId);
    if(!tempRow)return err('EXPIRED','ไม่พบออเดอร์หรือหมดเวลา');
    const tempData=(tempRow&&tempRow.payload)?JSON.parse(tempRow.payload):tempRow;
    tempData.status=String(tempRow.status||tempData.status||'pending_payment');
    tempData.created_at=tempRow.created_at||tempData.created_at||new Date();
    tempData.expires_at=tempRow.expires_at||tempData.expires_at||'';
    _assertOrderPayable(orderId,tempData);
    const alreadyPay=_findLatestPaymentByOrderId(orderId);
    if(alreadyPay&&['paid','verified','cash'].indexOf(String(alreadyPay.status||'').toLowerCase())>-1){
      SC().put('status_'+orderId,'paid',TTL.STATUS);
      return err('ALREADY_PAID','ออเดอร์ชำระแล้ว');
    }
    const orderTotal=round2(tempData.payment_amount||tempData.total||0);
    if(orderTotal<=0)return err('INVALID_ORDER','ยอดออเดอร์ไม่ถูกต้อง');
    const apiKey=cfg('slipok_api_key');
    const branchId=cfg('slipok_branch_id');
    if(!apiKey||!apiKey.trim())return err('NO_API_KEY','กรุณาตั้งค่า SlipOK API Key ในหน้า Admin > ตั้งค่า');
    if(!branchId||!branchId.trim())return err('NO_BRANCH_ID','กรุณาตั้งค่า SlipOK Branch ID ในหน้า Admin > ตั้งค่า');
    const url='https://api.slipok.com/api/line/apikey/'+branchId.trim();
    const payload={files:rawBase64,log:true,amount:orderTotal};
    const options={method:'POST',headers:{'Content-Type':'application/json','x-authorization':apiKey.trim()},payload:JSON.stringify(payload),muteHttpExceptions:true};
    log('info','verifySlipOK','Calling SlipOK',{orderId:orderId,amount:orderTotal});
    const response=UrlFetchApp.fetch(url,options);
    perfStep('verifySlipOK','slipok_fetch');
    const httpCode=response.getResponseCode();
    const responseText=response.getContentText()||'';
    let responseData={};
    try{responseData=JSON.parse(responseText);}catch(_){responseData={};}
    if(httpCode!==200){
      const errorCode=String(responseData.code||'UNKNOWN');
      if(errorCode==='1003'){
        return err('PACKAGE_EXPIRED','แพ็กเกจ SlipOK หมดอายุ กรุณาแจ้งร้านค้าหรือแอดมินต่ออายุแพ็กเกจก่อนใช้งานตรวจสลิปอัตโนมัติ');
      }
      if(errorCode==='1004'){
        return err('QUOTA_EXCEEDED','โควต้า SlipOK หมด กรุณาแจ้งแอดมิน');
      }
      const errorMessages={
        '1000':'กรุณาใส่ข้อมูล QR Code ให้ครบ',
        '1001':'ไม่พบข้อมูลสาขา กรุณาตรวจสอบ Branch ID',
        '1002':'API Key ไม่ถูกต้อง',
        '1005':'ไฟล์ไม่ใช่ภาพ',
        '1006':'รูปภาพไม่ถูกต้อง',
        '1007':'รูปภาพไม่มี QR Code',
        '1008':'QR ไม่ใช่สลิปชำระเงิน',
        '1009':'ธนาคารขัดข้องชั่วคราว ลองใหม่ใน 15 นาที',
        '1010':'กรุณารอสักครู่ ธนาคารมี delay',
        '1011':'QR หมดอายุหรือไม่มีรายการนี้',
        '1012':'สลิปนี้ถูกใช้แล้ว',
        '1013':'ยอดเงินไม่ตรง',
        '1014':'บัญชีผู้รับไม่ตรง',
        '1015':'ไม่พบข้อมูล Package'
      };
      const friendlyMsg=errorMessages[errorCode]||sanitizeText(responseData.message||'ตรวจสอบสลิปไม่สำเร็จ',180);
      return err('SLIP_INVALID',friendlyMsg);
    }
    const slipData=(responseData&&responseData.data)||{};
    if(!(responseData&&responseData.success&&slipData&&slipData.success))return err('UNEXPECTED','รูปแบบผลตรวจสลิปไม่ถูกต้อง');
    const transRef=sanitizeText(
      slipData.transRef||
      slipData.ref_nbr||
      slipData.refNbr||
      slipData.transactionRef||
      slipData.transactionId||
      slipData.transaction_id||
      slipData.slipId||
      slipData.slip_id||
      '',
      120
    );
    const slipAmount=round2(slipData.amount||0);
    if(!transRef)return err('SLIP_INVALID','ไม่พบเลขอ้างอิงธุรกรรมจากสลิป');
    if(!safeCompareMoney(slipAmount,orderTotal)){
      log('warn','verifySlipOK','Amount mismatch',{orderId:orderId,order:orderTotal,slip:slipAmount});
      return err('AMOUNT_MISMATCH','ยอดเงินไม่ตรงกับออเดอร์');
    }
    const refKey='ref_'+String(transRef).replace(/\W/g,'').substring(0,80);
    if(SC().get(refKey))return err('DUPLICATE_SLIP','สลิปนี้ถูกใช้ไปแล้ว กรุณาใช้สลิปใหม่');
    const dupPay=crud(SHEETS.PAYMENTS,'findOne',{ref_nbr:String(transRef)});
    if(dupPay)return err('DUPLICATE_SLIP','สลิปนี้ถูกใช้ไปแล้ว กรุณาใช้สลิปใหม่');
    withRetry(()=>crud(SHEETS.PAYMENTS,'insert',{
      id:genId('PAY'),
      order_id:orderId,
      ref_nbr:String(transRef),
      amount:slipAmount,
      status:'paid',
      payment_method:'scan',
      ref1:'',
      ref2:'',
      ref3:'',
      verified_at:new Date(),
      slip_trans_ref:String(transRef),
      slip_sender:sanitizeText((slipData.sender&&slipData.sender.displayName)||slipData.senderName||'',200),
      slip_amount:slipAmount,
      slip_verified_payload_json:_safeText(JSON.stringify(slipData||{}),9000),
      created_at:new Date()
    }));
    perfStep('verifySlipOK','save_payment');
    _updateTempOrderStatus(orderId,'paid');
    _doConfirmOrder(orderId);
    SC().put(refKey,'1',3600);
    SC().put('status_'+orderId,'paid',TTL.STATUS);
    log('info','verifySlipOK','Slip OK',{orderId:orderId,transRef:transRef,amount:slipAmount});
    return respond({orderId:orderId,verified:true,transRef:transRef,amount:slipAmount,message:'ชำระเงินสำเร็จ'});
  }catch(ex){log('error','verifySlipOK','Exception: '+ex.message);return err(ex.code||'ERROR',ex.message||'เกิดข้อผิดพลาด');}
  finally{try{lock.releaseLock();}catch(_){} perfEnd('verifySlipOK');}
}

// === UPLOAD IMAGE TO DRIVE ===
// ใช้ Drive REST API ผ่าน UrlFetchApp + ScriptApp.getOAuthToken()
// ไม่ต้องการ DriveApp OAuth scope แยก — ใช้ token ของ script เองได้เลย
function uploadImageToDrive(imageData,fileName,mimeTypeOrToken,tokenOrOptions,maybeOptions){
  try{
    // รองรับทั้ง signature เดิมและใหม่:
    // เดิม: uploadImageToDrive(rawBase64,fileName,mimeType,token)
    // ใหม่: uploadImageToDrive(dataUrlOrBase64,fileName,token,options)
    let mimeType='',token='',options={};
    if(arguments.length>=4&&String(mimeTypeOrToken||'').indexOf('image/')===0){
      mimeType=String(mimeTypeOrToken||'');
      token=String(tokenOrOptions||'');
      options=maybeOptions||{};
    }else{
      token=String(mimeTypeOrToken||'');
      options=tokenOrOptions||{};
      mimeType='';
    }
    requireEditor(token);
    if(!imageData)return err('INVALID','ไม่มีข้อมูลรูปภาพ');
    const raw=String(imageData||'').trim();
    const isDataUrl=/^data:image\//i.test(raw);
    const safeMime=(isDataUrl?(String((raw.match(/^data:(image\/[a-zA-Z0-9.+-]+)/i)||[])[1]||'image/jpeg')):(mimeType||'image/jpeg'));
    const safeFileName=fileName||('menu_'+Date.now()+'.jpg');
    const base64Data=isDataUrl?(raw.split(',')[1]||''):raw;
    if(!base64Data)return err('INVALID','ไม่มีข้อมูลรูปภาพ');
    const oauthToken=ScriptApp.getOAuthToken();
    // resolve + validate folder
    const folderId=_resolveDriveFolderIdFromSettings();
    if(!folderId)return err('DRIVE_FOLDER_NOT_CONFIGURED','กรุณาสร้างโฟลเดอร์ Google Drive จากหน้า ตั้งค่า > API ก่อนอัปโหลดรูปเมนู');
    const chk=_checkDriveFolderWriteAccess(folderId,{createTestFile:false});
    if(!chk||!chk.ok){
      const c=String(chk&&chk.code||'');
      if(c==='DRIVE_FOLDER_NOT_FOUND')return err('DRIVE_FOLDER_NOT_FOUND','ไม่พบโฟลเดอร์ Google Drive กรุณาสร้างโฟลเดอร์ใหม่');
      if(c==='DRIVE_FOLDER_NO_EDITOR')return err('DRIVE_FOLDER_NO_EDITOR','บัญชี Apps Script ไม่มีสิทธิ์ Editor ในโฟลเดอร์นี้');
      return err('DRIVE_FOLDER_NOT_FOUND','ไม่พบโฟลเดอร์ Google Drive กรุณาสร้างโฟลเดอร์ใหม่');
    }
    // multipart upload ไปยัง Drive REST API
    const boundary='FoodOrderBoundary'+Date.now();
    const metadata=JSON.stringify({name:safeFileName,parents:[folderId]});
    Utilities.base64Decode(base64Data); // validate base64
    const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+metadata+'\r\n'
      +'--'+boundary+'\r\nContent-Type: '+safeMime+'\r\nContent-Transfer-Encoding: base64\r\n\r\n'+base64Data+'\r\n'
      +'--'+boundary+'--';
    const uploadRes=UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{
      method:'POST',
      headers:{Authorization:'Bearer '+oauthToken,'Content-Type':'multipart/related; boundary='+boundary},
      payload:body,
      muteHttpExceptions:true
    });
    const uploadJson=JSON.parse(uploadRes.getContentText());
    if(!uploadJson.id)return err('UPLOAD_FAILED','Upload failed: '+(uploadJson.error&&uploadJson.error.message||uploadRes.getContentText()));
    const fileId=uploadJson.id;
    // ตั้งให้ public anyone with link
    UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/'+fileId+'/permissions',{
      method:'POST',
      headers:{Authorization:'Bearer '+oauthToken,'Content-Type':'application/json'},
      payload:JSON.stringify({role:'reader',type:'anyone'}),
      muteHttpExceptions:true
    });
    const lh3Url='https://lh3.googleusercontent.com/d/'+fileId;
    const thumb='https://drive.google.com/thumbnail?id='+fileId+'&sz=w800';
    log('info','uploadImageToDrive','OK: '+lh3Url);
    return respond({fileId:fileId,url:lh3Url,thumbnailUrl:thumb,lh3Url:lh3Url,folderId:folderId,fileName:safeFileName});
  }catch(ex){
    log('error','uploadImageToDrive',ex.message);
    if(String(ex&&ex.message)==='NO_DRIVE_FOLDER_ID')return err('DRIVE_FOLDER_NOT_CONFIGURED','กรุณาสร้างโฟลเดอร์ Google Drive จากหน้า ตั้งค่า > API ก่อนอัปโหลดรูปเมนู');
    if(String(ex&&ex.message)==='INVALID_DRIVE_FOLDER_ID')return err('INVALID_DRIVE_FOLDER_ID','Folder ID ไม่ถูกต้อง');
    if(String(ex&&ex.message)==='DRIVE_FOLDER_NOT_ACCESSIBLE')return err('DRIVE_FOLDER_NOT_FOUND','ไม่พบโฟลเดอร์ Google Drive กรุณาสร้างโฟลเดอร์ใหม่');
    if(String(ex&&ex.message)==='DRIVE_FOLDER_NO_EDITOR')return err('DRIVE_FOLDER_NO_EDITOR','บัญชี Apps Script ไม่มีสิทธิ์ Editor ในโฟลเดอร์นี้');
    return err('ERROR',ex.message);
  }
}

function _getOrCreateDriveFolder(oauthToken){
  const cfgFolderId=_resolveDriveFolderIdFromSettings();
  if(cfgFolderId){
    const chk=_checkDriveFolderWriteAccess(cfgFolderId,{createTestFile:false});
    if(chk&&chk.ok)return cfgFolderId;
    const code=String(chk&&chk.code||'');
    if(code==='DRIVE_FOLDER_NO_EDITOR')throw new Error('DRIVE_FOLDER_NO_EDITOR');
    if(code==='INVALID_DRIVE_FOLDER_ID')throw new Error('INVALID_DRIVE_FOLDER_ID');
    if(code==='DRIVE_FOLDER_NOT_FOUND'||code==='DRIVE_FOLDER_ACCESS_ERROR')throw new Error('DRIVE_FOLDER_NOT_ACCESSIBLE');
    throw new Error('DRIVE_FOLDER_NOT_ACCESSIBLE');
  }
  const root=ensureFoodOrderAssetsFolder();
  const folder=ensureMenuImagesFolder(root,'FoodOrder Menu Images');
  const newId=String(folder.getId()||'').trim();
  if(!newId)throw new Error('NO_DRIVE_FOLDER_ID');
  _upsertSettingsBatch({
    drive_folder_id:newId,
    google_drive_folder_id:newId,
    menu_image_folder_id:newId
  });
  return newId;
}

function _normalizeGoogleDriveResourceId(raw){
  const s=String(raw||'').trim();
  if(!s)return '';
  const patterns=[
    /\/folders\/([A-Za-z0-9_-]{10,})/i,
    /[?&]id=([A-Za-z0-9_-]{10,})/i,
    /^https?:\/\/drive\.google\.com\/(?:drive\/u\/\d+\/)?folders\/([A-Za-z0-9_-]{10,})/i
  ];
  for(let i=0;i<patterns.length;i++){
    const m=s.match(patterns[i]);
    if(m&&m[1])return String(m[1]).trim();
  }
  if(/^[A-Za-z0-9_-]{10,}$/.test(s))return s;
  return '';
}
function normalizeDriveFolderId(input){
  return _normalizeGoogleDriveResourceId(input);
}
function verifyDriveFolderExists(folderId){
  return _checkDriveFolderWriteAccess(folderId,{createTestFile:false});
}
function ensureFoodOrderAssetsFolder(){
  const baseName='FoodOrder Assets';
  const it=DriveApp.getFoldersByName(baseName);
  if(it&&it.hasNext())return it.next();
  return DriveApp.createFolder(baseName);
}
function ensureMenuImagesFolder(parentFolder,folderName){
  const p=parentFolder||ensureFoodOrderAssetsFolder();
  const safeName=String(folderName||'FoodOrder Menu Images').trim()||'FoodOrder Menu Images';
  const it=p.getFoldersByName(safeName);
  if(it&&it.hasNext())return it.next();
  return p.createFolder(safeName);
}
function _resolveDriveFolderIdFromSettings(inputValue){
  const inputId=_normalizeGoogleDriveResourceId(inputValue||'');
  if(inputId)return inputId;
  const cands=[
    cfg('drive_folder_id'),
    cfg('google_drive_folder_id'),
    cfg('menu_image_folder_id')
  ];
  for(let i=0;i<cands.length;i++){
    const id=_normalizeGoogleDriveResourceId(cands[i]||'');
    if(id)return id;
  }
  return '';
}
function _checkDriveFolderWriteAccess(folderId,opts){
  opts=opts||{};
  const id=_normalizeGoogleDriveResourceId(folderId||'');
  if(!id)return {ok:false,code:'INVALID_DRIVE_FOLDER_ID',message:'Folder ID ไม่ถูกต้อง'};
  let folder=null;
  try{
    folder=DriveApp.getFolderById(id);
  }catch(e){
    const msg=String((e&&e.message)||'');
    if(/Invalid argument|File not found|No item/i.test(msg)){
      return {ok:false,code:'DRIVE_FOLDER_NOT_FOUND',message:'Folder ถูกลบหรือเข้าไม่ได้'};
    }
    if(/Exception: Access denied|Insufficient Permission|not have permission/i.test(msg)){
      return {ok:false,code:'DRIVE_FOLDER_NO_EDITOR',message:'Apps Script account ไม่มีสิทธิ์ Editor'};
    }
    if(/Service invoked too many times|Quota|Rate Limit/i.test(msg)){
      return {ok:false,code:'DRIVE_QUOTA',message:'quota/permission error: '+msg};
    }
    return {ok:false,code:'DRIVE_FOLDER_ACCESS_ERROR',message:'Folder ถูกลบ/เข้าไม่ได้: '+msg};
  }
  if(!folder)return {ok:false,code:'DRIVE_FOLDER_NOT_FOUND',message:'Folder ถูกลบ/เข้าไม่ได้'};
  if(opts.createTestFile===false){
    return {ok:true,folderId:id,folderName:String(folder.getName()||'')};
  }
  let file=null;
  try{
    const testName='foodorder_drive_test_'+Date.now()+'.tmp';
    file=folder.createFile(testName,'foodorder drive access test '+new Date().toISOString(),'text/plain');
    if(file)file.setTrashed(true);
    return {ok:true,folderId:id,folderName:String(folder.getName()||'')};
  }catch(e){
    const msg=String((e&&e.message)||'');
    try{if(file)file.setTrashed(true);}catch(_){}
    if(/Access denied|Insufficient Permission|not have permission/i.test(msg)){
      return {ok:false,code:'DRIVE_FOLDER_NO_EDITOR',message:'Apps Script account ไม่มีสิทธิ์ Editor'};
    }
    if(/File not found|No item/i.test(msg)){
      return {ok:false,code:'DRIVE_FOLDER_NOT_FOUND',message:'Folder ถูกลบ/เข้าไม่ได้'};
    }
    if(/Service invoked too many times|Quota|Rate Limit/i.test(msg)){
      return {ok:false,code:'DRIVE_QUOTA',message:'quota/permission error: '+msg};
    }
    return {ok:false,code:'DRIVE_WRITE_FAILED',message:'quota/permission error: '+msg};
  }
}

function normalizeDriveFileId(input){
  const s=String(input||'').trim();
  if(!s)return '';
  const patterns=[
    /\/d\/([A-Za-z0-9_-]{10,})/i,
    /[?&]id=([A-Za-z0-9_-]{10,})/i,
    /\/file\/d\/([A-Za-z0-9_-]{10,})/i,
    /^([A-Za-z0-9_-]{10,})$/
  ];
  for(let i=0;i<patterns.length;i++){
    const m=s.match(patterns[i]);
    if(m&&m[1])return String(m[1]).trim();
  }
  return '';
}
function isBase64ImageDataUrl(value){
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(value||''));
}
function _parseDataImageUrl_(raw){
  const s=String(raw||'');
  const m=s.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
  if(!m)return null;
  return {
    mimeType:String(m[1]||'image/jpeg').toLowerCase(),
    base64:String(m[2]||'').replace(/\s/g,'')
  };
}
function buildDriveDisplayUrl(fileId){
  const id=normalizeDriveFileId(fileId);
  if(!id)return '';
  return 'https://lh3.googleusercontent.com/d/'+id;
}
function safeFileName(name){
  const s=String(name||'').replace(/[\\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim();
  return s||'menu_image';
}
function _slugName(s){
  return String(s||'').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9ก-๙_]+/g,'').substring(0,40)||'item';
}
function _extFromMime(mime){
  const m=String(mime||'').toLowerCase();
  if(m.indexOf('png')>-1)return 'png';
  if(m.indexOf('webp')>-1)return 'webp';
  if(m.indexOf('gif')>-1)return 'gif';
  return 'jpg';
}
function fetchImageBlobFromUrl(url,filename){
  const raw=String(url||'').trim();
  if(!raw)return {ok:false,reason:'URL ว่าง'};
  try{
    const resp=UrlFetchApp.fetch(raw,{muteHttpExceptions:true,followRedirects:true});
    const code=resp.getResponseCode();
    if(code!==200)return {ok:false,reason:'โหลดรูปไม่สำเร็จ (HTTP '+code+')'};
    const ct=String(resp.getHeaders()['Content-Type']||resp.getHeaders()['content-type']||'').toLowerCase();
    if(ct&&ct.indexOf('image/')!==0)return {ok:false,reason:'ลิงก์ไม่ใช่ไฟล์รูปภาพ'};
    const blob=resp.getBlob();
    if(!blob)return {ok:false,reason:'ไม่พบข้อมูลรูป'};
    if(blob.getBytes().length>12*1024*1024)return {ok:false,reason:'ไฟล์รูปใหญ่เกินกำหนด'};
    blob.setName(filename||('menu_'+Date.now()+'.'+_extFromMime(blob.getContentType())));
    return {ok:true,blob:blob};
  }catch(e){
    return {ok:false,reason:'ไม่สามารถดึงรูปจากลิงก์นี้ได้'};
  }
}
function createImageFileInFolder(folder,blob,filename){
  const b=blob.copyBlob();
  b.setName(filename||b.getName()||('menu_'+Date.now()+'.jpg'));
  const file=folder.createFile(b);
  try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(_){}
  const fid=String(file.getId()||'').trim();
  return {file:file,fileId:fid,url:buildDriveDisplayUrl(fid)};
}
function isImageAlreadyInTargetFolder(imageValue,folderId){
  const fid=normalizeDriveFileId(imageValue);
  if(!fid)return false;
  try{
    const f=DriveApp.getFileById(fid);
    const parents=f.getParents();
    while(parents&&parents.hasNext()){
      const p=parents.next();
      if(String(p.getId()||'')===String(folderId||''))return true;
    }
  }catch(_){}
  return false;
}
function getMenuSheetAndHeaders(ssObj){
  const sh=(ssObj&&typeof ssObj.getSheetByName==='function')?ssObj.getSheetByName(SHEETS.MENU):getSheet(SHEETS.MENU);
  if(!sh)return null;
  const lastRow=sh.getLastRow();
  const lastCol=Math.max(1,sh.getLastColumn());
  if(lastRow<1)return null;
  const headers=sh.getRange(1,1,1,lastCol).getValues()[0].map(x=>String(x||'').trim());
  const idx={};
  headers.forEach(function(h,i){if(h)idx[h.toLowerCase()]=i;});
  return {sheet:sh,headers:headers,idx:idx,lastRow:lastRow,lastCol:lastCol};
}
function updateMenuImageCell(rowNumber,newUrl){
  const info=getMenuSheetAndHeaders();
  if(!info)return false;
  const iImg=info.idx.image;
  if(iImg==null||iImg<0)return false;
  info.sheet.getRange(rowNumber,iImg+1).setValue(String(newUrl||''));
  return true;
}
const MENU_IMAGE_MIGRATION_LOG_SHEET='MENU_IMAGE_MIGRATION_LOG';
const MENU_BACKUP_BEFORE_IMAGE_MIGRATION_SHEET='MENU_BACKUP_BEFORE_IMAGE_MIGRATION';
function _getOrCreateMigrationLogSheet_(ssObj){
  const wb=(ssObj&&typeof ssObj.getSheetByName==='function')?ssObj:getSpreadsheet_();
  let sh=wb.getSheetByName(MENU_IMAGE_MIGRATION_LOG_SHEET);
  const required=['id','menu_id','menu_name','old_image_type','old_image','new_image','new_file_id','target_folder_id','status','reason','migrated_at','migrated_by','rollback_available','old_file_id'];
  if(!sh){
    sh=wb.insertSheet(MENU_IMAGE_MIGRATION_LOG_SHEET);
    sh.appendRow(required);
  }else{
    const lr=sh.getLastRow();
    const lc=Math.max(1,sh.getLastColumn());
    const headers=(lr>=1)?sh.getRange(1,1,1,lc).getValues()[0].map(x=>String(x||'').trim()):[];
    let changed=false;
    required.forEach(function(h){if(headers.indexOf(h)===-1){headers.push(h);changed=true;}});
    if(changed)sh.getRange(1,1,1,headers.length).setValues([headers]);
  }
  return sh;
}
function _appendMigrationLog_(x,ssObj){
  const sh=_getOrCreateMigrationLogSheet_(ssObj);
  const headers=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(v=>String(v||'').trim());
  const oldImgRaw=String(x.old_image||'');
  const oldType=isBase64ImageDataUrl(oldImgRaw)?'base64':(normalizeDriveFileId(oldImgRaw)?'drive_url':(oldImgRaw?'external_url':'empty'));
  const oldImg=(oldType==='base64'&&oldImgRaw.length>220)?(oldImgRaw.substring(0,200)+'...[base64 truncated]'):oldImgRaw;
  const row=headers.map(function(h){
    if(h==='id')return String(x.id||genId('MIG'));
    if(h==='menu_id')return String(x.menu_id||'');
    if(h==='menu_name')return String(x.menu_name||'');
    if(h==='old_image_type')return oldType;
    if(h==='old_image')return oldImg;
    if(h==='new_image')return String(x.new_image||'');
    if(h==='new_file_id')return String(x.new_file_id||'');
    if(h==='target_folder_id')return String(x.target_folder_id||'');
    if(h==='status')return String(x.status||'');
    if(h==='reason')return String(x.reason||'');
    if(h==='migrated_at')return x.migrated_at||new Date();
    if(h==='migrated_by')return String(x.migrated_by||'system');
    if(h==='rollback_available')return x.rollback_available?'true':'false';
    if(h==='old_file_id')return String(x.old_file_id||'');
    return '';
  });
  sh.appendRow(row);
}
function _ensureMenuBackupSheet_(ssObj){
  const wb=(ssObj&&typeof ssObj.getSheetByName==='function')?ssObj:getSpreadsheet_();
  let sh=wb.getSheetByName(MENU_BACKUP_BEFORE_IMAGE_MIGRATION_SHEET);
  if(sh)return {ok:true,created:false,sheetName:MENU_BACKUP_BEFORE_IMAGE_MIGRATION_SHEET};
  const src=wb.getSheetByName(SHEETS.MENU);
  if(!src)return {ok:false,message:'ไม่พบชีต MENU'};
  sh=wb.insertSheet(MENU_BACKUP_BEFORE_IMAGE_MIGRATION_SHEET);
  const lr=src.getLastRow(),lc=Math.max(1,src.getLastColumn());
  if(lr>0){
    const vals=src.getRange(1,1,lr,lc).getValues();
    sh.getRange(1,1,vals.length,vals[0].length).setValues(vals);
  }
  return {ok:true,created:true,sheetName:MENU_BACKUP_BEFORE_IMAGE_MIGRATION_SHEET};
}
function _verifyImageValueReadable_(image){
  const raw=String(image||'').trim();
  if(!raw)return {status:'skipped',reason:'ไม่มีรูป'};
  if(isBase64ImageDataUrl(raw))return {status:'ok',reason:'base64'};
  const fid=normalizeDriveFileId(raw);
  if(fid){
    try{
      const f=DriveApp.getFileById(fid);
      if(f)return {status:'ok',reason:'drive_file_ok',fileId:fid};
    }catch(_){}
  }
  try{
    const r=UrlFetchApp.fetch(raw,{muteHttpExceptions:true,followRedirects:true});
    const code=r.getResponseCode();
    if(code===200)return {status:'ok',reason:'url_ok'};
    return {status:'broken',reason:'HTTP '+code};
  }catch(e){
    return {status:'broken',reason:'เข้าถึงรูปไม่ได้'};
  }
}
function _decodeBase64ImageBlob(raw,nameSeed){
  try{
    const parsed=_parseDataImageUrl_(raw);
    if(!parsed)return {ok:false,reason:'base64 ไม่ถูกต้อง'};
    const mime=String(parsed.mimeType||'image/jpeg');
    const b64=String(parsed.base64||'');
    if(!b64)return {ok:false,reason:'ไม่มีข้อมูลรูป'};
    const bytes=Utilities.base64Decode(b64);
    if(!bytes||!bytes.length)return {ok:false,reason:'ถอดรหัสรูปไม่สำเร็จ'};
    if(bytes.length>12*1024*1024)return {ok:false,reason:'ไฟล์รูปใหญ่เกินกำหนด'};
    const ext=_extFromMime(mime);
    const blob=Utilities.newBlob(bytes,mime,(nameSeed||'menu')+'.'+ext);
    return {ok:true,blob:blob,mime:mime};
  }catch(e){
    return {ok:false,reason:'ถอดรหัสรูป base64 ไม่สำเร็จ'};
  }
}
function _getMigrationLogRows_(ssObj){
  const wb=(ssObj&&typeof ssObj.getSheetByName==='function')?ssObj:getSpreadsheet_();
  const sh=wb.getSheetByName(MENU_IMAGE_MIGRATION_LOG_SHEET);
  if(!sh||sh.getLastRow()<2)return {headers:[],rows:[]};
  const lc=Math.max(1,sh.getLastColumn());
  const headers=sh.getRange(1,1,1,lc).getValues()[0].map(v=>String(v||'').trim());
  const vals=sh.getRange(2,1,sh.getLastRow()-1,lc).getValues();
  const rows=vals.map(function(r){
    const o={};
    headers.forEach(function(h,i){o[h]=r[i];});
    return o;
  });
  return {headers:headers,rows:rows};
}
function _findMigratedLogByOldImage_(oldImage,targetFolderId){
  const g=_getMigrationLogRows_();
  const vals=g.rows||[];
  for(let i=vals.length-1;i>=0;i--){
    const r=vals[i]||{};
    const oldImg=String(r.old_image||'').trim();
    const newImg=String(r.new_image||'').trim();
    const folderId=String(r.target_folder_id||'').trim();
    const st=String(r.status||'').trim().toLowerCase();
    if(oldImg===String(oldImage||'').trim()&&folderId===String(targetFolderId||'').trim()&&st==='migrated'&&newImg){
      return {newImage:newImg,newFileId:String(r.new_file_id||'').trim()};
    }
  }
  return null;
}
function migrateOneMenuImage_(rowObj,folder,options,urlMap){
  options=options||{};
  urlMap=urlMap||{};
  const oldUrl=String(rowObj.image||'').trim();
  const menuId=String(rowObj.menuId||'').trim();
  const menuName=String(rowObj.menuName||'').trim();
  if(!oldUrl)return {status:'skipped',reason:'ไม่มีรูป',oldUrl:oldUrl,newUrl:''};
  if(isImageAlreadyInTargetFolder(oldUrl,folder.getId()))return {status:'skipped',reason:'อยู่ในโฟลเดอร์นี้แล้ว',oldUrl:oldUrl,newUrl:oldUrl};
  if(!options.force){
    const prev=_findMigratedLogByOldImage_(oldUrl,folder.getId());
    if(prev&&prev.newImage){
      const checkPrev=_verifyImageValueReadable_(prev.newImage);
      if(checkPrev.status==='ok'){
        updateMenuImageCell(rowObj.rowNumber,prev.newImage);
        return {status:'migrated',reason:'อ้างอิงจาก log เดิม',oldUrl:oldUrl,newUrl:prev.newImage,newFileId:prev.newFileId||normalizeDriveFileId(prev.newImage)};
      }
    }
  }
  if(urlMap[oldUrl])return {status:'migrated',reason:'ใช้ไฟล์ที่ย้ายแล้ว (ซ้ำ URL)',oldUrl:oldUrl,newUrl:urlMap[oldUrl],fromCache:true};
  const seed='menu_'+(menuId||String(rowObj.rowNumber||''))+'_'+_slugName(menuName||'item')+'_'+Date.now();
  let outUrl='';
  let newFileId='';
  try{
    if(isBase64ImageDataUrl(oldUrl)){
      // IMPORTANT: data URL ต้อง decode->blob โดยตรง ห้าม treat เป็น URL ปกติ
      const b64=_decodeBase64ImageBlob(oldUrl,seed);
      if(!b64.ok)return {status:'failed',reason:b64.reason,oldUrl:oldUrl,newUrl:''};
      const ext=_extFromMime(b64.mime);
      const name=safeFileName(seed+'.'+ext);
      const crt=createImageFileInFolder(folder,b64.blob,name);
      outUrl=crt.url||'';
      newFileId=String(crt.fileId||'').trim();
    }else{
      const fileId=normalizeDriveFileId(oldUrl);
      if(fileId){
        try{
          const src=DriveApp.getFileById(fileId);
          const cp=src.makeCopy(safeFileName(seed+'.'+_extFromMime(src.getMimeType())),folder);
          try{cp.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(_){}
          outUrl=buildDriveDisplayUrl(cp.getId());
          newFileId=String(cp.getId()||'').trim();
        }catch(_e){
          const fetched=fetchImageBlobFromUrl(oldUrl,safeFileName(seed+'.jpg'));
          if(!fetched.ok)return {status:'failed',reason:fetched.reason,oldUrl:oldUrl,newUrl:''};
          const crt2=createImageFileInFolder(folder,fetched.blob,safeFileName(seed+'.'+_extFromMime(fetched.blob.getContentType())));
          outUrl=crt2.url||'';
          newFileId=String(crt2.fileId||'').trim();
        }
      }else{
        // URL ปกติเท่านั้น (ไม่ใช่ data URL)
        const fetched2=fetchImageBlobFromUrl(oldUrl,safeFileName(seed+'.jpg'));
        if(!fetched2.ok)return {status:'failed',reason:fetched2.reason,oldUrl:oldUrl,newUrl:''};
        const crt3=createImageFileInFolder(folder,fetched2.blob,safeFileName(seed+'.'+_extFromMime(fetched2.blob.getContentType())));
        outUrl=crt3.url||'';
        newFileId=String(crt3.fileId||'').trim();
      }
    }
    if(!outUrl)return {status:'failed',reason:'สร้างไฟล์รูปใหม่ไม่สำเร็จ',oldUrl:oldUrl,newUrl:''};
    const verifyNew=_verifyImageValueReadable_(outUrl);
    if(verifyNew.status!=='ok')return {status:'failed',reason:'ตรวจสอบรูปใหม่ไม่ผ่าน',oldUrl:oldUrl,newUrl:'',newFileId:newFileId};
    updateMenuImageCell(rowObj.rowNumber,outUrl);
    urlMap[oldUrl]=outUrl;
    return {status:'migrated',reason:'คัดลอกสำเร็จ',oldUrl:oldUrl,newUrl:outUrl,newFileId:newFileId};
  }catch(e){
    return {status:'failed',reason:String((e&&e.message)||'ย้ายรูปไม่สำเร็จ'),oldUrl:oldUrl,newUrl:''};
  }
}

// === CONFIG ===
function getSheetValuesCached(name){
  return _sheetRows(name);
}
function getRowsAsObjectsCached(name){
  return _sheetObjects(name);
}
function getSheetValuesFast(sheetName){
  return _sheetRows(sheetName);
}
function getSheetObjectsFast(sheetName){
  return _sheetObjects(sheetName);
}
function getHeaderMap(sheetName){
  const rows=_sheetRows(sheetName);
  if(!rows.length)return {};
  const headers=rows[0]||[];
  const map={};
  headers.forEach(function(h,idx){
    const key=String(h||'').trim();
    if(key)map[key]=idx;
  });
  return map;
}
function findRowByIdFast(sheetName,id){
  const map=_buildIdx(sheetName,'id');
  return map[String(id||'')]||null;
}
function buildIndexById(rows,idKey){
  const k='id:'+String(idKey||'id')+':'+String((rows&&rows.length)||0);
  if(__reqDataCache.idx[k])return __reqDataCache.idx[k];
  const idx={};
  (rows||[]).forEach(r=>{
    const id=String((r&&r[idKey||'id'])||'').trim();
    if(id)idx[id]=r;
  });
  __reqDataCache.idx[k]=idx;
  return idx;
}
function buildGroupIndex(rows,keyName){
  const k='grp:'+String(keyName||'')+':'+String((rows&&rows.length)||0);
  if(__reqDataCache.grp[k])return __reqDataCache.grp[k];
  const grp={};
  (rows||[]).forEach(r=>{
    const kx=String((r&&r[keyName])||'').trim();
    if(!grp[kx])grp[kx]=[];
    grp[kx].push(r);
  });
  __reqDataCache.grp[k]=grp;
  return grp;
}
function _getSettingsMapCached(){
  const raw=_settingsMap();
  const map={};
  Object.keys(raw||{}).forEach(k=>{
    map[k]=(raw[k]===undefined||raw[k]===null)?'':String(raw[k]);
  });
  __reqDataCache.settingsMap=map;
  return map;
}
function cfg(k){
  const cacheKey='cfg_'+k;
  const cached=SC().get(cacheKey);if(cached)return cached;
  const m=_settingsMap();
  if(Object.prototype.hasOwnProperty.call(m,String(k))){
    const val=String(m[String(k)]==null?'':m[String(k)]);
    SC().put(cacheKey,val,TTL.CFG);
    return val;
  }
  return null;
}
function _normalizePromptPayNumber(v){
  return String(v==null?'':v).replace(/[^0-9]/g,'');
}
function _isValidPromptPayNumber(v){
  const digits=_normalizePromptPayNumber(v);
  return digits.length===10||digits.length===13;
}

function _applyMenuSort(items){
  const arr=Array.isArray(items)?items.slice():[];
  let orderIds=[];
  try{orderIds=JSON.parse(cfg('menu_sort')||'[]');}catch(_){orderIds=[];}
  if(!Array.isArray(orderIds)||!orderIds.length)return arr;
  const pos={};orderIds.forEach((id,idx)=>{pos[String(id)]=idx;});
  return arr.sort((a,b)=>{
    const pa=pos.hasOwnProperty(String(a.id))?pos[String(a.id)]:999999;
    const pb=pos.hasOwnProperty(String(b.id))?pos[String(b.id)]:999999;
    if(pa!==pb)return pa-pb;
    return String(a.name||'').localeCompare(String(b.name||''));
  });
}

function _persistMenuSort(orderIds){
  const sh=getSheet('SETTINGS');if(!sh)return;
  const rows=sh.getDataRange().getValues();
  const payload=JSON.stringify((orderIds||[]).map(x=>String(x)).filter(Boolean));
  let found=false;
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][0])==='menu_sort'){sh.getRange(i+1,2).setValue(payload);found=true;break;}
  }
  if(!found)sh.appendRow(['menu_sort',payload]);
  SC().remove('cfg_menu_sort');
  try{__reqDataCache.settingsMap=null;delete __reqDataCache.rows['SETTINGS'];delete __reqDataCache.objs['SETTINGS'];}catch(_){}
}

// === CRUD HELPER ===
function crud(sheetName,action,data){
  const sh=getSheet(sheetName);
  if(!sh||sh.getLastRow()<1)return action==='getAll'?[]:(action==='findOne'?null:false);
  // PERF-FIX: CRUD caching + faster high-volume reads + write invalidation
  const cacheKey='crud_cache_'+sheetName;
  const ttlMap={ORDERS:30,ORDER_ITEMS:30,TEMP_ORDERS:30,MENU:300,OPTIONS:300,PROMOTIONS:300};
  const cacheTtl=ttlMap[sheetName]||60;
  const readRows=()=>{
    const lr=sh.getLastRow(),lc=sh.getLastColumn();
    if(lr<1||lc<1)return [];
    if(sheetName===SHEETS.ORDERS||sheetName===SHEETS.ORDER_ITEMS||sheetName===SHEETS.TEMP_ORDERS){
      return sh.getRange(1,1,lr,lc).getValues();
    }
    return sh.getDataRange().getValues();
  };
  if(action==='getAll'){
    const cached=SC().get(cacheKey);
    if(cached){try{return JSON.parse(cached);}catch(_){SC().remove(cacheKey);}}
    const rows=readRows();
    if(!rows.length)return [];
    const headers=rows[0];
    const list=rows.slice(1).map(r=>{const obj={};headers.forEach((h,i)=>obj[h]=r[i]);return obj;});
    try{SC().put(cacheKey,JSON.stringify(list),cacheTtl);}catch(_){}
    return list;
  }
  const rows=readRows();
  if(!rows.length)return action==='findOne'?null:false;
  const headers=rows[0];
  const makeObj=(r)=>{const obj={};headers.forEach((h,i)=>obj[h]=r[i]);return obj;};
  if(action==='findOne'){
    for(let i=1;i<rows.length;i++){const obj=makeObj(rows[i]);let match=true;for(const k in data){if(String(obj[k])!==String(data[k])){match=false;break;}}if(match)return obj;}
    return null;
  }
  if(action==='insert'){
    sh.appendRow(headers.map(h=>data[h]!==undefined?data[h]:''));
    try{SC().remove(cacheKey);}catch(_){}
    try{delete __reqDataCache.rows[String(sheetName)];delete __reqDataCache.objs[String(sheetName)];}catch(_){}
    return true;
  }
  if(action==='update'){
    const idCol=headers.indexOf('id');if(idCol===-1)return false;
    const targetId=String(data.id);
    for(let i=1;i<rows.length;i++){
      if(String(rows[i][idCol])===targetId){
        const nextRow=rows[i].slice();
        let changed=false;
        headers.forEach((h,idx)=>{
          if(data[h]!==undefined){
            nextRow[idx]=data[h];
            changed=true;
          }
        });
        if(changed)sh.getRange(i+1,1,1,nextRow.length).setValues([nextRow]);
        try{SC().remove(cacheKey);}catch(_){}
        try{delete __reqDataCache.rows[String(sheetName)];delete __reqDataCache.objs[String(sheetName)];}catch(_){}
        return true;
      }
    }
    return false;
  }
  if(action==='delete'){
    const idCol=headers.indexOf('id');if(idCol===-1)return false;
    const targetId=String(data.id);
    for(let i=rows.length-1;i>=1;i--){if(String(rows[i][idCol])===targetId){sh.deleteRow(i+1);try{SC().remove(cacheKey);}catch(_){}try{delete __reqDataCache.rows[String(sheetName)];delete __reqDataCache.objs[String(sheetName)];}catch(_){}return true;}}
    return false;
  }
  return false;
}
function _appendRowsByHeaders(sheetName,rowsObj){
  const list=Array.isArray(rowsObj)?rowsObj:[];
  if(!list.length)return 0;
  const sh=getSheet(sheetName);if(!sh)return 0;
  const rows=getSheetValuesCached(sheetName);
  if(!rows.length)return 0;
  const headers=rows[0]||[];
  const values=list.map(obj=>headers.map(h=>obj[h]!==undefined?obj[h]:''));
  const start=sh.getLastRow()+1;
  sh.getRange(start,1,values.length,headers.length).setValues(values);
  try{SC().remove('data_'+String(sheetName));}catch(_){}
  try{delete __reqDataCache.rows[String(sheetName)];delete __reqDataCache.objs[String(sheetName)];}catch(_){}
  return values.length;
}

// === TEMP ORDER HELPERS ===
function _getAllTempOrders(){
  return getRowsAsObjectsCached(SHEETS.TEMP_ORDERS);
}
function _getTempOrderFromSheet(orderId){
  const list=_getAllTempOrders();
  const idx=buildIndexById(list,'order_id');
  return idx[sanitize(orderId)]||null;
}
function _updateTempOrderStatus(orderId,status){
  const sh=getSheet(SHEETS.TEMP_ORDERS);if(!sh||sh.getLastRow()<2)return;
  const rows=sh.getDataRange().getValues();const headers=rows[0];
  const idCol=headers.indexOf('order_id'),statusCol=headers.indexOf('status');
  const updCol=headers.indexOf('updated_at');
  const sid=sanitize(orderId);
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][idCol])===sid){
      sh.getRange(i+1,statusCol+1).setValue(status);
      if(updCol>-1)sh.getRange(i+1,updCol+1).setValue(new Date());
      try{delete __reqDataCache.rows[String(SHEETS.TEMP_ORDERS)];delete __reqDataCache.objs[String(SHEETS.TEMP_ORDERS)];}catch(_){}
      return;
    }
  }
}
function _findLatestPaymentByOrderId(orderId){
  const target=String(orderId||'').trim();
  if(!target)return null;
  const grp=buildGroupIndex(getRowsAsObjectsCached(SHEETS.PAYMENTS),'order_id');
  const list=grp[target]||[];
  if(!list.length)return null;
  return list[list.length-1];
}
function _doConfirmOrder(orderId){
  // FIX: use script-scoped lock (document lock not available in web app context)
  const lock=LockService.getScriptLock();
  let notifyPayload=null;
  try{
    lock.waitLock(15000);
    _ensureOrderDataSchema();
    const tempRaw=SC().get('temp_'+orderId)||_getTempOrderFromSheet(orderId);if(!tempRaw)return;
    const tempData=typeof tempRaw==='string'?JSON.parse(tempRaw):(tempRaw.payload?JSON.parse(tempRaw.payload):tempRaw);
    // ตรวจซ้ำภายใน lock scope
    const existingOrder=crud(SHEETS.ORDERS,'findOne',{id:orderId});
    if(existingOrder){log('info','_doConfirmOrder','Order already exists: '+orderId);SC().remove('order_id_'+orderId);return;}
    // PERF-FIX: Optional fallback safety on duplicate (max 2 attempts)
    let finalOrderId=orderId;
    for(let attempt=0;attempt<2;attempt++){
      const dup=crud(SHEETS.ORDERS,'findOne',{id:finalOrderId});
      if(!dup)break;
      finalOrderId=generateSafeOrderId();
    }
    const now=new Date();
    withRetry(()=>crud(SHEETS.ORDERS,'insert',{
      id:finalOrderId,customer:sanitize(tempData.customer||''),department:sanitize(tempData.department||''),
      note:sanitize(tempData.note||''),customer_note:sanitize(tempData.customer_note||''),subtotal:toNum(tempData.subtotal||0),discount:toNum(tempData.discount||0),
      total:toNum(tempData.total||0),payment_amount:toNum(tempData.payment_amount||tempData.total||0),payment_suffix:String(tempData.payment_suffix||'00'),
      promo:JSON.stringify(tempData.promo||{}),status:'paid',created_at:now,updated_at:now,printed_count:0,printed_at:'',last_print_mode:''
    }));
    const items=tempData.items||[];
    const itemRows=items.map(item=>{
      const unitPrice=round2(item.unitPrice!=null?item.unitPrice:item.price||0);
      const qty=normalizeQty(item.qty||1);
      return {
        id:genId('OI'),
        order_id:finalOrderId,
        menu_id:sanitize(item.menuId||''),
        name:sanitize(item.name||''),
        options:JSON.stringify(item.options||[]),
        qty:qty,
        price:unitPrice,
        total:round2(unitPrice*qty)
      };
    });
    _deductStockFromOrderItems(items);
    if(itemRows.length)withRetry(()=>_appendRowsByHeaders(SHEETS.ORDER_ITEMS,itemRows));

    if(finalOrderId!==orderId){
      const pays=crud(SHEETS.PAYMENTS,'getAll',{}).filter(p=>String(p.order_id||'')===String(orderId));
      pays.forEach(p=>withRetry(()=>crud(SHEETS.PAYMENTS,'update',{id:p.id,order_id:finalOrderId})));
      SC().remove('status_'+orderId);
      SC().put('status_'+finalOrderId,'paid',TTL.STATUS);
    }
    SC().remove('temp_'+orderId);
    SC().remove('order_id_'+orderId);
    SC().remove('order_id_'+finalOrderId);
    _invalidateOrdersCaches();
    // PERF: queue payload and send after lock released; do not block critical section with external API.
    notifyPayload={
      id:finalOrderId,
      customer:sanitize(tempData.customer||''),
      department:sanitize(tempData.department||''),
      note:sanitize(tempData.note||''),
      customer_note:sanitize(tempData.customer_note||''),
      total:toNum(tempData.total||0),
      created_at:now,
      items:(Array.isArray(items)?items:[]).map(function(it){
        return {
          name:String(it&&it.name||''),
          qty:normalizeQty(it&&it.qty||1),
          options:it&&it.options
        };
      })
    };
    log('info','_doConfirmOrder','Order confirmed: '+finalOrderId);
  }catch(e){
    log('error','_doConfirmOrder',e.message);
  }finally{
    try{lock.releaseLock();}catch(_){}
  }
  if(notifyPayload){
    try{_maybeAutoCreatePrintJob(notifyPayload.id);}catch(_){}
    try{sendOrderNotification(notifyPayload);}catch(_){}
  }
}

function _toCsvOrderIds(ids){
  return (Array.isArray(ids)?ids:[]).map(function(id){return sanitizeText(String(id||''),80);}).filter(Boolean).join(',');
}
function _fromCsvOrderIds(raw){
  return String(raw||'').split(',').map(function(x){return sanitizeText(x,80);}).filter(Boolean);
}
function _readPrintJobRows(){
  _ensurePrintJobsSchema();
  return _sheetObjects(SHEETS.PRINT_JOBS);
}
function _makePrintJobSnapshot(r){
  let meta={};
  try{meta=JSON.parse(String(r&&r.meta_json||'{}'));}catch(_){meta={};}
  const allIds=_fromCsvOrderIds(r&&r.order_ids);
  const doneCount=Math.max(0,Math.min(allIds.length,parseInt(meta&&meta.processed_count||0,10)||0));
  const retryCount=Math.max(0,parseInt(meta&&meta.retry_count||0,10)||0);
  return {
    jobId:String(r&&r.job_id||''),
    type:(String(r&&r.type||'').toLowerCase()==='sticker')?'sticker':'receipt',
    orderIds:_fromCsvOrderIds(r&&r.order_ids),
    total_items:allIds.length,
    status:String(r&&r.status||'pending'),
    progress:Math.max(0,Math.min(100,parseInt(r&&r.progress||0,10)||0)),
    created_at:_normalizeDateLikeString(r&&r.created_at),
    updated_at:_normalizeDateLikeString(r&&r.updated_at),
    created_by:String(r&&r.created_by||''),
    error_message:String(r&&r.error_message||''),
    processed_count:doneCount,
    retry_count:retryCount,
    remaining_items:Math.max(0,allIds.length-doneCount)
  };
}
function getPrintTemplates(token){
  try{
    requireAuth(token);
    return respond({
      sticker:[
        {id:'sticker_default',name:'Sticker Default',paper:'A4',layout:'3col',size:'100x70'},
        {id:'sticker_thermal',name:'Sticker Thermal',paper:'Thermal',layout:'single',size:'58x40'}
      ],
      receipt:[
        {id:'receipt_80',name:'Receipt 80mm',paper:'80mm',layout:'single',size:'80mm'},
        {id:'receipt_58',name:'Receipt 58mm',paper:'58mm',layout:'single',size:'58mm'}
      ]
    });
  }catch(e){return err(e.code||'ERROR',e.message);}
}
function createPrintJob(data,token){
  perfStart('createPrintJob');
  try{
    const isAutoToken=String(token||'')==='AUTO_PRINT';
    if(!isAutoToken)requireEditor(token);
    _ensurePrintJobsSchema();
    const payload=data||{};
    const type=(String(payload.type||'').toLowerCase()==='sticker')?'sticker':'receipt';
    const orderIds=Array.isArray(payload.orderIds)?payload.orderIds:[];
    const ids=orderIds.map(function(id){return sanitizeText(String(id||''),80);}).filter(Boolean);
    if(!ids.length)return err('INVALID','ไม่พบรายการออเดอร์');
    const pending=_readPrintJobRows().map(_makePrintJobSnapshot).filter(function(j){
      const st=String(j&&j.status||'');
      return st==='pending'||st==='processing';
    });
    const busyMap={};
    pending.forEach(function(j){(j.orderIds||[]).forEach(function(id){busyMap[id]=1;});});
    const filteredIds=ids.filter(function(id){return !busyMap[id];});
    const skippedIds=ids.filter(function(id){return !!busyMap[id];});
    if(!filteredIds.length)return err('DUPLICATE','ออเดอร์ที่เลือกมีอยู่ในคิวรอพิมพ์ทั้งหมดแล้ว');
    const jobId='JOB'+Utilities.formatDate(new Date(),'Asia/Bangkok','yyyyMMddHHmmss')+Math.floor(Math.random()*1000);
    const user=isAutoToken?{username:'system'}:requireAuth(token);
    const now=new Date();
    withRetry(function(){
      _appendRowsByHeaders(SHEETS.PRINT_JOBS,[{
        job_id:jobId,
        type:type,
        order_ids:_toCsvOrderIds(filteredIds),
        status:'pending',
        progress:0,
        created_at:now,
        updated_at:now,
        created_by:String(user.username||user.id||'admin'),
        error_message:'',
        meta_json:JSON.stringify({processed_count:0,retry_count:0,batch_size:20})
      }]);
    });
    _invalidatePrintQueueCache();
    ensurePrintQueueWorkerTrigger();
    return respond({jobId:jobId,status:'pending',type:type,total_items:filteredIds.length,skipped_ids:skippedIds});
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('createPrintJob');}
}
function getPrintJobs(token){
  try{
    requireAuth(token);
    const cached=_cacheGet('fo_print_jobs_recent_v1');
    if(cached)return respond(cached);
    const rows=_readPrintJobRows().map(_makePrintJobSnapshot);
    rows.sort(function(a,b){
      const atA=new Date(a.created_at||0).getTime()||0;
      const atB=new Date(b.created_at||0).getTime()||0;
      return atB-atA;
    });
    const payload=rows.slice(0,200);
    _cachePut('fo_print_jobs_recent_v1',payload,12);
    return respond(payload);
  }catch(e){return err(e.code||'ERROR',e.message);}
}
function updatePrintJobStatus(jobId,status,token,meta){
  try{
    const isAutoToken=String(token||'')==='AUTO_PRINT';
    if(!isAutoToken)requireEditor(token);
    _ensurePrintJobsSchema();
    const sid=sanitizeText(String(jobId||''),80);
    if(!sid)return err('INVALID','ไม่ระบุ jobId');
    const allowed={pending:1,processing:1,done:1,error:1,cancelled:1};
    const next=String(status||'').toLowerCase();
    if(!allowed[next])return err('INVALID','สถานะไม่ถูกต้อง');
    const hit=_buildIdx(SHEETS.PRINT_JOBS,'job_id')[sid];
    if(!hit||!hit.row||!hit.headers)return err('NOT_FOUND','ไม่พบงานพิมพ์');
    const sh=getSheet(SHEETS.PRINT_JOBS);
    const headers=hit.headers||[];
    const statusCol=headers.indexOf('status');
    const progressCol=headers.indexOf('progress');
    const updatedCol=headers.indexOf('updated_at');
    const errCol=headers.indexOf('error_message');
    const metaCol=headers.indexOf('meta_json');
    if(statusCol<0)return err('INVALID','โครงสร้าง PRINT_JOBS ไม่ถูกต้อง');
    const progress=Math.max(0,Math.min(100,parseInt(meta&&meta.progress!=null?meta.progress:(next==='done'?100:0),10)||0));
    withRetry(function(){
      sh.getRange(hit.row,statusCol+1).setValue(next);
      if(progressCol>-1)sh.getRange(hit.row,progressCol+1).setValue(progress);
      if(updatedCol>-1)sh.getRange(hit.row,updatedCol+1).setValue(new Date());
      if(errCol>-1)sh.getRange(hit.row,errCol+1).setValue(sanitizeText(meta&&meta.error_message||'',500));
      if(metaCol>-1&&meta&&meta.meta_json!=null)sh.getRange(hit.row,metaCol+1).setValue(String(meta.meta_json||'{}'));
    });
    try{
      delete __reqDataCache.rows[String(SHEETS.PRINT_JOBS)];
      delete __reqDataCache.objs[String(SHEETS.PRINT_JOBS)];
      delete __reqDataCache.idx[String(SHEETS.PRINT_JOBS)+':job_id'];
    }catch(_){}
    _invalidatePrintQueueCache();
    return respond({jobId:sid,status:next,progress:progress});
  }catch(e){return err(e.code||'ERROR',e.message);}
}
function _processPrintJobInternal(jobId,actorToken){
  const sid=sanitizeText(String(jobId||''),80);
  if(!sid)return err('INVALID','ไม่ระบุ jobId');
  const rows=_readPrintJobRows();
  const raw=(rows||[]).filter(function(r){return String(r&&r.job_id||'')===sid;})[0];
  if(!raw)return err('NOT_FOUND','ไม่พบงานพิมพ์');
  const job=_makePrintJobSnapshot(raw);
  if(job.status==='done'||job.status==='cancelled')return respond({jobId:sid,status:job.status,progress:job.progress});
  const allIds=Array.isArray(job.orderIds)?job.orderIds:[];
  let meta={};
  try{meta=JSON.parse(String(raw&&raw.meta_json||'{}'));}catch(_){meta={};}
  const processed=Math.max(0,Math.min(allIds.length,parseInt(meta.processed_count||0,10)||0));
  const batchSize=Math.max(1,Math.min(50,parseInt(meta.batch_size||20,10)||20));
  const remain=allIds.slice(processed);
  if(!remain.length){
    return completePrintJob(sid,actorToken);
  }
  const chunk=remain.slice(0,batchSize);
  const pre=updatePrintJobStatus(sid,'processing',actorToken,{progress:Math.floor((processed/allIds.length)*100),meta_json:JSON.stringify(meta)});
  if(!pre||!pre.success)return pre;
  const printed=markOrdersPrinted(chunk,job.type,actorToken);
  if(!printed||!printed.success){
    const nextRetry=Math.max(0,parseInt(meta.retry_count||0,10)||0)+1;
    meta.retry_count=nextRetry;
    updatePrintJobStatus(sid,'error',actorToken,{progress:Math.floor((processed/allIds.length)*100),error_message:(printed&&printed.message)||'mark printed failed',meta_json:JSON.stringify(meta)});
    return printed||err('ERROR','พิมพ์ไม่สำเร็จ');
  }
  meta.processed_count=processed+chunk.length;
  const pct=Math.floor((meta.processed_count/allIds.length)*100);
  if(meta.processed_count>=allIds.length){
    return updatePrintJobStatus(sid,'done',actorToken,{progress:100,error_message:'',meta_json:JSON.stringify(meta)});
  }
  return updatePrintJobStatus(sid,'processing',actorToken,{progress:pct,error_message:'',meta_json:JSON.stringify(meta)});
}
function processPrintJob(jobId,token){
  try{
    requireEditor(token);
    return _processPrintJobInternal(jobId,token);
  }catch(e){return err(e.code||'ERROR',e.message);}
}
function completePrintJob(jobId,token){
  return updatePrintJobStatus(jobId,'done',token,{progress:100});
}
function retryPrintJob(jobId,token){
  try{
    requireEditor(token);
    const sid=sanitizeText(String(jobId||''),80);
    const rows=_readPrintJobRows();
    const raw=(rows||[]).filter(function(r){return String(r&&r.job_id||'')===sid;})[0];
    if(!raw)return err('NOT_FOUND','ไม่พบงานพิมพ์');
    let meta={};
    try{meta=JSON.parse(String(raw&&raw.meta_json||'{}'));}catch(_){meta={};}
    meta.retry_count=Math.max(0,parseInt(meta.retry_count||0,10)||0)+1;
    const upd=updatePrintJobStatus(sid,'pending',token,{progress:Math.max(0,parseInt(raw&&raw.progress||0,10)||0),error_message:'',meta_json:JSON.stringify(meta)});
    if(!upd||!upd.success)return upd;
    return _processPrintJobInternal(sid,token);
  }catch(e){return err(e.code||'ERROR',e.message);}
}
function processPrintQueueWorker(){
  try{
    _ensurePrintJobsSchema();
    const jobs=_readPrintJobRows().map(_makePrintJobSnapshot).filter(function(j){
      const st=String(j&&j.status||'');
      return st==='pending'||st==='processing';
    });
    if(!jobs.length)return;
    jobs.sort(function(a,b){
      const atA=new Date(a.created_at||0).getTime()||0;
      const atB=new Date(b.created_at||0).getTime()||0;
      return atA-atB;
    });
    _processPrintJobInternal(jobs[0].jobId,'AUTO_PRINT');
  }catch(e){log('error','processPrintQueueWorker',e.message);}
}
function ensurePrintQueueWorkerTrigger(){
  try{
    const fn='processPrintQueueWorker';
    const exists=ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()===fn;});
    if(!exists)ScriptApp.newTrigger(fn).timeBased().everyMinutes(1).create();
  }catch(e){log('error','ensurePrintQueueWorkerTrigger',e.message);}
}
function _maybeAutoCreatePrintJob(orderId){
  try{
    const enabled=String(_settingsMap().auto_print_enabled||'0')==='1';
    if(!enabled)return;
    const printType=String(_settingsMap().auto_print_type||'sticker').toLowerCase()==='receipt'?'receipt':'sticker';
    const delaySec=Math.max(0,parseInt(_settingsMap().auto_print_delay||'0',10)||0);
    if(delaySec>0)Utilities.sleep(Math.min(1500,delaySec*1000));
    const token='AUTO_PRINT';
    createPrintJob({type:printType,orderIds:[orderId],templateId:'auto',settings:{paper:'auto',layout:'auto',size:'auto'}},token);
  }catch(_){}
}

// === LOG ===
function log(level,fn,msg,payload){
  _queueActivityLog({
    created_at:new Date(),
    level:String(level||'info'),
    actor:'system',
    role:'system',
    action:String(fn||'-'),
    message:String(msg||''),
    payload:_toJson(payload||{},5000)
  });
}

// === AUTH ===
function _sha256(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s).map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('');}
function _ensureUsersAuthColumns(){
  const sh=getSheet(SHEETS.USERS);
  if(!sh)return null;
  const headers=['id','username','password','role','status','password_algo','password_updated_at','failed_login_count','last_failed_login_at','locked_until'];
  if(sh.getLastRow()<1){
    sh.appendRow(headers);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    return sh;
  }
  const existing=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0];
  headers.forEach(h=>{
    if(existing.indexOf(h)===-1){
      const col=sh.getLastColumn()+1;
      sh.getRange(1,col).setValue(h).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    }
  });
  return sh;
}
function _ensureBootstrapAdmin(){
  const users=crud(SHEETS.USERS,'getAll',{})||[];
  const hasActiveAdmin=users.some(u=>String(u&&u.role||'').toLowerCase()==='admin'&&String(u&&u.status||'')==='active');
  if(hasActiveAdmin)return;
  const existingAdmin=users.find(u=>String(u&&u.username||'').toLowerCase()==='admin');
  if(existingAdmin){
    withRetry(()=>crud(SHEETS.USERS,'update',{
      id:String(existingAdmin.id),
      username:'admin',
      role:'admin',
      status:'active',
      password:String(existingAdmin.password||'').trim()||('sha256$'+_sha256('1234')),
      password_algo:'sha256',
      failed_login_count:0,
      last_failed_login_at:'',
      locked_until:''
    }));
    return;
  }
  withRetry(()=>crud(SHEETS.USERS,'insert',{
    id:genId('U'),
    username:'admin',
    password:'sha256$'+_sha256('1234'),
    role:'admin',
    status:'active',
    password_algo:'sha256',
    password_updated_at:new Date(),
    failed_login_count:0,
    last_failed_login_at:'',
    locked_until:''
  }));
}
function _ensureAuthRuntimeReady(){
  try{_ensureUsersAuthColumns();}catch(_){}
  try{_ensureSessionSheet();}catch(_){}
  try{_ensureBootstrapAdmin();}catch(_){}
}
function _tokenHash(token){return _sha256(String(token||''));}
function _sessionTtlSec(){return 8*60*60;}
function _nowDate(){return new Date();}
function _toDate(v){const d=new Date(v);return isNaN(d.getTime())?null:d;}
function _isExpiredDate(v){const d=_toDate(v);if(!d)return true;return d.getTime()<=nowMs();}
function _ensureSessionSheet(){
  const name='SESSIONS';
  const headers=['id','user_id','role','token_hash','status','created_at','expires_at','last_seen_at'];
  let sh=getSheet(name);
  if(!sh){
    sh=SS().insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    return sh;
  }
  if(sh.getLastRow()<1){
    sh.appendRow(headers);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    return sh;
  }
  const existing=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  headers.forEach(h=>{
    if(existing.indexOf(h)===-1){
      const col=sh.getLastColumn()+1;
      sh.getRange(1,col).setValue(h).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    }
  });
  return sh;
}
function _findSessionByToken(token){
  _ensureSessionSheet();
  const tHash=_tokenHash(token);
  return crud('SESSIONS','findOne',{token_hash:tHash});
}
function _newSession(user){
  _ensureSessionSheet();
  const raw=user.id+':'+Utilities.getUuid()+':'+Utilities.getUuid().replace(/-/g,'');
  const now=_nowDate();
  const exp=new Date(now.getTime()+(_sessionTtlSec()*1000));
  const rec={
    id:genId('S'),
    user_id:String(user.id||''),
    role:String(user.role||'staff'),
    token_hash:_tokenHash(raw),
    status:'active',
    created_at:now,
    expires_at:exp,
    last_seen_at:now
  };
  const ok=withRetry(()=>crud('SESSIONS','insert',rec));
  if(!ok)throw Object.assign(new Error('Session store not ready'),{code:'SESSION_STORE_ERROR'});
  return {token:raw,expiresAt:exp};
}
function _invalidateSessionByToken(token){
  _ensureSessionSheet();
  const s=_findSessionByToken(token);
  if(!s||!s.id)return false;
  try{if(__reqDataCache.authByToken)delete __reqDataCache.authByToken[String(token||'').trim()];}catch(_){}
  return withRetry(()=>crud('SESSIONS','update',{id:String(s.id),status:'revoked',last_seen_at:new Date()}));
}
function _revokeSessionsByUserId(userId){
  _ensureSessionSheet();
  try{__reqDataCache.authByToken={};}catch(_){}
  const all=crud('SESSIONS','getAll',{}).filter(s=>String(s.user_id||'')===String(userId||'')&&String(s.status||'')==='active');
  all.forEach(s=>{
    try{crud('SESSIONS','update',{id:String(s.id),status:'revoked',last_seen_at:new Date()});}catch(_){}
  });
}
function _verifyPassword(user,passwordRaw){
  let stored=String(user&&user.password||'').trim();
  if(stored.charAt(0)==="'")stored=stored.substring(1).trim();
  const pass=String(passwordRaw==null?'':passwordRaw);
  if(!stored)return false;
  if(stored.indexOf('sha256$')===0){
    return stored===('sha256$'+_sha256(pass));
  }
  if(/^[a-f0-9]{64}$/i.test(stored)){
    return stored.toLowerCase()===_sha256(pass).toLowerCase();
  }
  return stored===pass;
}
function _upgradePasswordIfNeeded(user,passwordRaw){
  const stored=String(user&&user.password||'').trim();
  const pref='sha256$'+_sha256(String(passwordRaw==null?'':passwordRaw));
  if(stored===pref)return;
  withRetry(()=>crud(SHEETS.USERS,'update',{id:String(user.id),password:pref,password_algo:'sha256',password_updated_at:new Date()}));
}
function _recordLoginFailure(user){
  if(!user||!user.id)return;
  const cnt=Math.max(0,parseInt(user.failed_login_count||0,10)||0)+1;
  const lockMins=cnt>=5?15:0;
  const lockUntil=lockMins?new Date(nowMs()+lockMins*60*1000):'';
  withRetry(()=>crud(SHEETS.USERS,'update',{
    id:String(user.id),
    failed_login_count:cnt,
    last_failed_login_at:new Date(),
    locked_until:lockUntil
  }));
}
function _resetLoginFailure(user){
  if(!user||!user.id)return;
  withRetry(()=>crud(SHEETS.USERS,'update',{
    id:String(user.id),
    failed_login_count:0,
    last_failed_login_at:'',
    locked_until:''
  }));
}
function requireAuth(token){
  _ensureAuthRuntimeReady();
  if(!token||String(token).trim()===''){const e=new Error('No token');e.code='NO_SESSION';throw e;}
  const tokenStr=String(token).trim();
  try{
    const cachedUser=__reqDataCache.authByToken&&__reqDataCache.authByToken[tokenStr];
    if(cachedUser&&String(cachedUser.status||'')==='active')return cachedUser;
  }catch(_){}
  const session=_findSessionByToken(tokenStr);
  if(session&&String(session.status||'')==='active'){
    if(_isExpiredDate(session.expires_at)){
      try{crud('SESSIONS','update',{id:String(session.id),status:'expired',last_seen_at:new Date()});}catch(_){}
      const e=new Error('Session expired');e.code='EXPIRED';throw e;
    }
    const u=crud(SHEETS.USERS,'findOne',{id:String(session.user_id||'')});
    if(!u){const e=new Error('User not found');e.code='NO_SESSION';throw e;}
    if(String(u.status||'')!=='active'){
      try{crud('SESSIONS','update',{id:String(session.id),status:'revoked',last_seen_at:new Date()});}catch(_){}
      const e=new Error('User inactive');e.code='NO_SESSION';throw e;
    }
    try{crud('SESSIONS','update',{id:String(session.id),last_seen_at:new Date(),role:String(u.role||session.role||'staff')});}catch(_){}
    try{
      if(!__reqDataCache.authByToken)__reqDataCache.authByToken={};
      __reqDataCache.authByToken[tokenStr]=u;
    }catch(_){}
    return u;
  }
  // Legacy token fallback: userId:uuid (temporary compatibility path)
  const colonIdx=tokenStr.indexOf(':');
  const legacyUserId=colonIdx>-1?tokenStr.substring(0,colonIdx):'';
  if(legacyUserId){
    const legacyUser=crud(SHEETS.USERS,'findOne',{id:legacyUserId});
    if(legacyUser&&String(legacyUser.status||'')==='active'){
      try{
        if(!__reqDataCache.authByToken)__reqDataCache.authByToken={};
        __reqDataCache.authByToken[tokenStr]=legacyUser;
      }catch(_){}
      return legacyUser;
    }
  }
  const e=new Error('Session not found');e.code='NO_SESSION';throw e;
}
function requireAdmin(token){
  const u=requireAuth(token);
  if(String(u.role||'staff')!=='admin'){const e=new Error('Forbidden');e.code='FORBIDDEN';throw e;}
  return u;
}
function requireEditor(token){
  const u=requireAuth(token);
  const role=String(u.role||'guest').toLowerCase();
  if(role==='guest'){const e=new Error('Forbidden');e.code='FORBIDDEN';throw e;}
  return u;
}

// === ADMIN ===
function adminLogin(username,password){
  try{
    _ensureAuthRuntimeReady();
    username=sanitize(username);
    const usernameLower=String(username||'').toLowerCase();
    if(!usernameLower)return err('INVALID','กรุณากรอกชื่อผู้ใช้');
    _requireRateLimit('admin_login','global',30,300,'พยายามเข้าสู่ระบบถี่เกินไป');
    _requireRateLimit('admin_login','user_'+usernameLower,6,120,'พยายามเข้าสู่ระบบถี่เกินไป');
    const users=crud(SHEETS.USERS,'getAll',{})||[];
    const user=users.find(u=>String(u&&u.username||'').toLowerCase()===usernameLower);
    let loginUser=user||null;
    if((!loginUser||String(loginUser.status||'')!=='active')&&usernameLower==='admin'&&String(password||'')==='1234'){
      const activeAdmin=(users||[]).find(u=>String(u&&u.username||'').toLowerCase()==='admin');
      if(activeAdmin){
        withRetry(()=>crud(SHEETS.USERS,'update',{id:String(activeAdmin.id),username:'admin',role:'admin',status:'active',password:'sha256$'+_sha256('1234'),password_algo:'sha256',password_updated_at:new Date(),failed_login_count:0,last_failed_login_at:'',locked_until:''}));
        loginUser=crud(SHEETS.USERS,'findOne',{id:String(activeAdmin.id)});
      }else{
        const rec={id:'U001',username:'admin',password:'sha256$'+_sha256('1234'),role:'admin',status:'active',password_algo:'sha256',password_updated_at:new Date(),failed_login_count:0,last_failed_login_at:'',locked_until:''};
        withRetry(()=>crud(SHEETS.USERS,'insert',rec));
        loginUser=crud(SHEETS.USERS,'findOne',{id:'U001'});
      }
      log('warn','adminLogin','Admin recovery applied',{username:'admin'});
    }
    if(!loginUser)return err('INVALID','ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    if(String(loginUser.status)!=='active')return err('INACTIVE','บัญชีถูกปิดใช้งาน');
    const lockUntil=_toDate(loginUser.locked_until);
    const passOk=_verifyPassword(loginUser,password);
    if(!passOk){
      if(lockUntil&&lockUntil.getTime()>nowMs())return err('LOCKED','บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง');
      _recordLoginFailure(loginUser);
      log('warn','adminLogin','Login failed: '+username);
      return err('INVALID','ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
    _upgradePasswordIfNeeded(loginUser,password);
    _resetLoginFailure(loginUser);
    let s=null;
    try{s=_newSession(loginUser);}catch(se){log('warn','adminLogin','session fallback',{error:String(se&&se.message||'')});}
    const token=(s&&s.token)?s.token:(String(loginUser.id||'')+':'+Utilities.getUuid());
    log('info','adminLogin','Login success: '+username);
    auditLog(token,'admin_login_success','เข้าสู่ระบบสำเร็จ',{username:username,role:loginUser.role||'staff'},'info');
    return respond({token,role:loginUser.role||'staff',username:String(loginUser.username||''),expiresAt:(s&&s.expiresAt)?s.expiresAt:''});
  }catch(e){return err((e&&e.code)||'ERROR',(e&&e.message)?String(e.message):'เข้าสู่ระบบไม่สำเร็จ (server exception)');}
}
function adminLoginV2(username,password){
  try{
    const res=adminLogin(username,password);
    if(!res||typeof res!=='object')return err('BAD_RESPONSE_SERVER','รูปแบบข้อมูลล็อกอินจากเซิร์ฟเวอร์ไม่ถูกต้อง');
    if(!res.success)return err(String(res.code||'LOGIN_FAILED'),String(res.message||'เข้าสู่ระบบไม่สำเร็จ'));
    const data=res.data||{};
    const out={
      token:String(data.token||''),
      role:String(data.role||'guest'),
      username:String(data.username||''),
      expiresAt:(function(v){
        if(v instanceof Date)return v.toISOString();
        return String(v||'');
      })(data.expiresAt)
    };
    if(!out.token)return err('NO_TOKEN','ไม่พบโทเคนการเข้าสู่ระบบ');
    return respond(out);
  }catch(e){
    return err((e&&e.code)||'ERROR',(e&&e.message)?String(e.message):'เข้าสู่ระบบไม่สำเร็จ (v2)');
  }
}
function adminLogout(token){
  try{
    if(!token)return respond({loggedOut:true});
    _invalidateSessionByToken(token);
    return respond({loggedOut:true});
  }catch(e){return err(e.code||'ERROR',e.message);}
}
function verifyAdminSession(token){
  try{
    const u=requireAuth(token);
    return respond({valid:true,role:String(u.role||'staff'),username:String(u.username||u.id||'')});
  }catch(e){return err(e.code||'NO_SESSION',e.message||'Session หมดอายุ');}
}

function adminCRUDMenu(action,data,token){
  perfStart('adminCRUDMenu');
  try{
    _requireRateLimit('admin_menu_crud',_tokenHash(token||'na'),120,60,'ส่งคำขอจัดการเมนูถี่เกินไป');
    requireAuth(token);
    _ensureCatalogSchema();
    if(action==='getAll'){return respond(_applyMenuSort(crud(SHEETS.MENU,'getAll',{})));}
    if(action==='insert'||action==='update'){
      requireEditor(token);
      if(action==='update'&&!String(data.id||'').trim())return err('INVALID','แก้ไขเมนูต้องระบุ id');
      if(action==='insert'&&(!data.name||!data.price))return err('INVALID','ต้องมีชื่อและราคา');
      let existing=null;
      if(action==='update'){
        const map=_buildIdx(SHEETS.MENU,'id');
        const got=map[String(data.id||'')];
        if(!got||!got.data||!got.headers)return err('NOT_FOUND','ไม่พบเมนูที่ต้องการแก้ไข');
        const obj={};
        got.headers.forEach(function(h,i){obj[h]=got.data[i];});
        existing=obj;
      }
      const topicIds=(data.topic_ids!==undefined)?data.topic_ids:((existing&&existing.topic_ids)||'[]');
      const rawImage=(data.image!==undefined)?String(data.image==null?'':data.image).trim():String((existing&&existing.image)||'').trim();
      const isDataImage=rawImage.indexOf('data:image')===0;
      if(isDataImage)return err('MENU_IMAGE_BASE64_NOT_ALLOWED','ระบบไม่อนุญาตให้บันทึกรูปเมนูเป็น Base64 กรุณาเชื่อมต่อ Google Drive ก่อน');
      const imageVal=rawImage.substring(0,50000);
      const rec={
        id:data.id||genId('M'),
        name:sanitize((data.name!==undefined)?data.name:((existing&&existing.name)||'')),
        price:toNum((data.price!==undefined)?data.price:((existing&&existing.price)||0)),
        image:imageVal,
        category:sanitize((data.category!==undefined)?data.category:((existing&&existing.category)||'')),
        description:sanitize((data.description!==undefined)?data.description:((existing&&existing.description)||'')),
        status:(data.status!==undefined?data.status:((existing&&existing.status)||'active')),
        topic_ids:topicIds
      };
      if(data.stock!==undefined)rec.stock=normalizeStock(data.stock);
      else if(action==='insert')rec.stock=-1;
      else if(existing&&existing.stock!==undefined)rec.stock=normalizeStock(existing.stock);
      const menuSaved=withRetry(()=>crud(SHEETS.MENU,action,rec));
      if(!menuSaved)return err('NOT_FOUND','ไม่พบเมนูที่ต้องการแก้ไข');
      if(action==='insert'){
        const all=crud(SHEETS.MENU,'getAll',{}).map(m=>String(m.id||''));
        let old=[];try{old=JSON.parse(cfg('menu_sort')||'[]');}catch(_){old=[];}
        const merged=[].concat(old||[]).concat([String(rec.id)]).filter(Boolean);
        const uniq=[];const seen={};merged.forEach(x=>{if(!seen[x]&&all.indexOf(x)>-1){seen[x]=1;uniq.push(x);}});
        all.forEach(x=>{if(!seen[x]){seen[x]=1;uniq.push(x);}});
        _persistMenuSort(uniq);
      }
      // รองรับการใช้หัวข้อเดียวกันได้หลายเมนู: ใช้ MENU.topic_ids เป็นตัวผูกหลัก
      _invalidateMenuCaches();
      try{SC().put('menu_version',String(Date.now()),600);}catch(_){}
      auditLog(token,'admin_menu_'+action,(action==='insert'?'เพิ่ม':'แก้ไข')+'เมนู',{id:rec.id,name:rec.name,status:rec.status},'info');
      return respond(rec);
    }
    if(action==='delete'){
      requireEditor(token);
      if(!data.id)return err('INVALID','ต้องระบุ id');
      const delId=sanitize(data.id);
      const deleted=withRetry(()=>crud(SHEETS.MENU,'delete',{id:delId}));
      if(!deleted)return err('NOT_FOUND','ไม่พบเมนูที่ต้องการลบ');
      let old=[];try{old=JSON.parse(cfg('menu_sort')||'[]');}catch(_){old=[];}
      _persistMenuSort((old||[]).filter(x=>String(x)!==String(delId)));
      _invalidateMenuCaches();
      try{SC().put('menu_version',String(Date.now()),600);}catch(_){}
      auditLog(token,'admin_menu_delete','ลบเมนู',{id:delId},'warn');
      return respond({deleted:true});
    }
    return err('INVALID','Unknown action');
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('adminCRUDMenu',{action:String(action||'')});}
}

function adminCRUDOption(action,data,token){
  perfStart('adminCRUDOption');
  try{
    _requireRateLimit('admin_option_crud',_tokenHash(token||'na'),120,60,'ส่งคำขอจัดการตัวเลือกถี่เกินไป');
    requireAuth(token);
    _ensureCatalogSchema();
    if(action==='getAll')return respond(crud(SHEETS.OPTIONS,'getAll',{}));
    if(action==='insert'||action==='update'){
      requireEditor(token);
      if(!data.group_name)return err('INVALID','ต้องมีชื่อหัวข้อ');
      const oid=data.id||genId('O');
      let menuIdVal=sanitize(data.menu_id||'');
      if(!menuIdVal)menuIdVal='*_unlinked_'+String(oid);
      const rec={id:oid,menu_id:menuIdVal,group_name:sanitize(data.group_name),is_required:data.is_required||'false',type:data.type||'single',choices:data.choices||'[]',status:data.status||'active'};
      if(data.stock!==undefined)rec.stock=normalizeStock(data.stock);
      else if(action==='insert')rec.stock=-1;
      withRetry(()=>crud(SHEETS.OPTIONS,action,rec));_invalidateMenuCaches();try{SC().put('menu_version',String(Date.now()),600);}catch(_){}
      auditLog(token,'admin_option_'+action,(action==='insert'?'เพิ่ม':'แก้ไข')+'หัวข้อตัวเลือก',{id:rec.id,group_name:rec.group_name,status:rec.status},'info');
      return respond(rec);
    }
    if(action==='delete'){
      requireEditor(token);
      if(!data.id)return err('INVALID','ต้องระบุ id');
      const oid=sanitize(data.id);
      withRetry(()=>crud(SHEETS.OPTIONS,'delete',{id:oid}));_invalidateMenuCaches();try{SC().put('menu_version',String(Date.now()),600);}catch(_){}
      auditLog(token,'admin_option_delete','ลบหัวข้อตัวเลือก',{id:oid},'warn');
      return respond({deleted:true});
    }
    return err('INVALID','Unknown action');
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('adminCRUDOption',{action:String(action||'')});}
}

function adminCRUDPromotion(action,data,token){
  perfStart('adminCRUDPromotion');
  try{
    _requireRateLimit('admin_promo_crud',_tokenHash(token||'na'),120,60,'ส่งคำขอจัดการโปรโมชันถี่เกินไป');
    requireAuth(token);
    if(action==='getAll'){return respond(crud(SHEETS.PROMOTIONS,'getAll',{}));}
    if(action==='insert'||action==='update'){
      requireEditor(token);
      if(action==='update'&&!String(data.id||'').trim())return err('INVALID','แก้ไขโปรโมชันต้องระบุ id');
      const type=String(data.type||'qty');
      if(type!=='qty'&&type!=='spend')return err('INVALID','ประเภทโปรโมชันไม่ถูกต้อง');
      const threshold=toNum(data.threshold);
      const discount=toNum(data.discount);
      if(threshold<=0||discount<=0)return err('INVALID','เงื่อนไขและส่วนลดต้องมากกว่า 0');
      const rec={id:data.id||genId('PR'),type:type,threshold:threshold,discount:discount,description:sanitize(data.description||''),status:data.status||'active'};
      const saved=withRetry(()=>crud(SHEETS.PROMOTIONS,action,rec));
      if(!saved)return err('NOT_FOUND','ไม่พบโปรโมชันที่ต้องการแก้ไข');
      _cacheRemove(CACHE_KEYS.PROMOTIONS);
      _bumpPromotionVersion();
      auditLog(token,'admin_promotion_'+action,(action==='insert'?'เพิ่ม':'แก้ไข')+'โปรโมชัน',{id:rec.id,type:rec.type,status:rec.status},'info');
      return respond(rec);
    }
    if(action==='delete'){
      requireEditor(token);
      if(!data.id)return err('INVALID','ต้องระบุ id');
      const pid=sanitize(data.id);
      const deleted=withRetry(()=>crud(SHEETS.PROMOTIONS,'delete',{id:pid}));
      if(!deleted)return err('NOT_FOUND','ไม่พบโปรโมชันที่ต้องการลบ');
      _cacheRemove(CACHE_KEYS.PROMOTIONS);
      _bumpPromotionVersion();
      auditLog(token,'admin_promotion_delete','ลบโปรโมชัน',{id:pid},'warn');
      return respond({deleted:true});
    }
    return err('INVALID','Unknown action');
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('adminCRUDPromotion',{action:String(action||'')});}
}

function getUsers(token){
  try{
    _requireRateLimit('admin_get_users',_tokenHash(token||'na'),60,60,'เรียกดูผู้ใช้ถี่เกินไป');
    requireAdmin(token);
    // PERF-FIX: short cache for users list
    const cacheKey='fo_users_list_v1';
    try{
      const cached=SC().get(cacheKey);
      if(cached)return respond(JSON.parse(cached));
    }catch(_){}
    const users=crud(SHEETS.USERS,'getAll',{});
    const data=users.map(u=>({id:u.id,username:u.username,role:u.role,status:u.status}));
    try{SC().put(cacheKey,JSON.stringify(data),20);}catch(_){}
    return respond(data);
  }
  catch(e){return err('ERROR',e.message);}
}

function getActivityLogs(token,limit){
  try{
    _requireRateLimit('admin_get_logs',_tokenHash(token||'na'),60,60,'เรียกดูบันทึกถี่เกินไป');
    requireAuth(token);
    const lim=Math.max(20,Math.min(1000,parseInt(limit||200,10)||200));
    // PERF-FIX: short cache for activity logs to reduce repeated sheet reads
    const cacheKey='fo_activity_logs_latest';
    try{
      const cached=SC().get(cacheKey);
      if(cached){
        const arr=JSON.parse(cached);
        if(Array.isArray(arr))return respond(arr.slice(0,lim));
      }
    }catch(_){}
    let sh=null;
    try{sh=ensureActivityLogSheet();}catch(_){return respond([]);}
    if(!sh||sh.getLastRow()<2)return respond([]);
    const last=sh.getLastRow();
    const tz=Session.getScriptTimeZone()||'Asia/Bangkok';
    // PERF-FIX: read only tail rows (latest logs) instead of full sheet
    const totalRows=Math.max(0,last-1);
    const takeRows=Math.min(1500,totalRows);
    const startRow=Math.max(2,last-takeRows+1);
    const rows=sh.getRange(startRow,1,takeRows,7).getValues();
    if(!rows.length)return respond([]);
    const list=rows.map(r=>{
      const dt=r[0] instanceof Date?r[0]:new Date(r[0]);
      const created=(dt&&!isNaN(dt.getTime()))?Utilities.formatDate(dt,tz,"yyyy-MM-dd'T'HH:mm:ssXXX"):String(r[0]||'');
      return{
        created_at:created,
        level:String(r[1]||''),
        actor:String(r[2]||''),
        role:String(r[3]||''),
        action:String(r[4]||''),
        message:String(r[5]||''),
        payload:String(r[6]||'')
      };
    }).filter(x=>x.created_at||x.level||x.actor||x.role||x.action||x.message||x.payload);
    list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    try{SC().put(cacheKey,JSON.stringify(list.slice(0,1000)),10);}catch(_){}
    return respond(list.slice(0,lim));
  }catch(_){return respond([]);}
}

function updateAdminUser(data,token){
  try{
    _requireRateLimit('admin_update_user',_tokenHash(token||'na'),80,60,'บันทึกผู้ใช้ถี่เกินไป');
    requireAdmin(token);
    const username=sanitize(data.username||'');
    const originalUsername=sanitize(data.originalUsername||'');
    const userId=sanitize(data.id||'');
    if(!username)return err('INVALID','ต้องระบุ username');
    const allUsers=crud(SHEETS.USERS,'getAll',{});
    let user=userId?allUsers.find(u=>String(u.id)===String(userId)):null;
    if(!user&&originalUsername)user=allUsers.find(u=>String(u.username)===String(originalUsername));
    const roleRaw=String(data.role||(user&&user.role)||'staff').toLowerCase();
    const roleAllowed=['admin','staff','guest'].includes(roleRaw)?roleRaw:'staff';
    const lowerUsername=String(username||'').toLowerCase();
    const hasOtherGuest=allUsers.some(u=>{
      if(user&&String(u.id)===String(user.id))return false;
      return String(u.role||'').toLowerCase()==='guest'||String(u.username||'').toLowerCase()==='guest';
    });
    if(roleAllowed==='guest'&&lowerUsername!=='guest')return err('INVALID','บัญชี guest ต้องใช้ username เป็น guest เท่านั้น');
    if(lowerUsername==='guest'&&roleAllowed!=='guest')return err('INVALID','username guest ต้องใช้ role เป็น guest เท่านั้น');
    if((roleAllowed==='guest'||lowerUsername==='guest')&&hasOtherGuest)return err('LIMIT','ระบบอนุญาตบัญชี guest ได้เพียง 1 บัญชี');
    const dup=allUsers.find(u=>String(u.username)===String(username)&&(!user||String(u.id)!==String(user.id)));
    if(dup)return err('DUPLICATE','Username นี้ถูกใช้งานแล้ว');
    if(user){
      const update={id:user.id,username:username,role:roleAllowed||user.role,status:user.status||'active'};
      if(data.newPassword){
        if(String(data.newPassword).length<4)return err('INVALID','รหัสผ่านต้องมีอย่างน้อย 4 ตัว');
        update.password='sha256$'+_sha256(String(data.newPassword));
        update.password_algo='sha256';
        update.password_updated_at=new Date();
        update.failed_login_count=0;
        update.last_failed_login_at='';
        update.locked_until='';
      }
      withRetry(()=>crud(SHEETS.USERS,'update',update));
      if(data.newPassword){
        _revokeSessionsByUserId(user.id);
      }
      try{SC().remove('fo_users_list_v1');}catch(_){}
      log('info','updateAdminUser','Updated: '+user.username);
      auditLog(token,'admin_user_update','แก้ไขผู้ใช้งาน',{id:user.id,username:username,role:roleAllowed},'info');
      return respond({id:user.id,username:username,mode:'update'});
    }
    if(!data.newPassword||String(data.newPassword).length<4)return err('INVALID','ผู้ใช้ใหม่ต้องมีรหัสผ่านอย่างน้อย 4 ตัว');
    const rec={id:genId('U'),username:username,password:'sha256$'+_sha256(String(data.newPassword)),role:roleAllowed,status:'active',password_algo:'sha256',password_updated_at:new Date(),failed_login_count:0,last_failed_login_at:'',locked_until:''};
    withRetry(()=>crud(SHEETS.USERS,'insert',rec));
    try{SC().remove('fo_users_list_v1');}catch(_){}
    log('info','updateAdminUser','Inserted: '+username);
    auditLog(token,'admin_user_insert','เพิ่มผู้ใช้งาน',{id:rec.id,username:username,role:roleAllowed},'info');
    return respond({id:rec.id,username:username,mode:'insert'});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function deleteAdminUser(userId,token){
  try{
    _requireRateLimit('admin_delete_user',_tokenHash(token||'na'),60,60,'ลบผู้ใช้ถี่เกินไป');
    const me=requireAdmin(token);
    const id=sanitize(userId||'');
    if(!id)return err('INVALID','ต้องระบุผู้ใช้งาน');
    const allUsers=crud(SHEETS.USERS,'getAll',{})||[];
    const target=allUsers.find(u=>String(u.id||'')===String(id));
    if(!target)return err('NOT_FOUND','ไม่พบผู้ใช้งาน');
    const targetRole=String(target.role||'').toLowerCase();
    const targetUsername=String(target.username||'').toLowerCase();
    if(targetRole==='admin'||targetUsername==='admin')return err('FORBIDDEN','ไม่สามารถลบบัญชี admin ได้');
    if(String(target.id||'')===String(me.id||''))return err('FORBIDDEN','ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
    withRetry(()=>crud(SHEETS.USERS,'delete',{id:String(target.id)}));
    _revokeSessionsByUserId(String(target.id));
    try{SC().remove('fo_users_list_v1');}catch(_){}
    log('info','deleteAdminUser','Deleted user: '+String(target.username||target.id));
    auditLog(token,'admin_user_delete','ลบผู้ใช้งาน',{id:String(target.id),username:String(target.username||'')},'warn');
    return respond({deleted:true,id:String(target.id)});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function saveMenuOrder(orderIds,token){
  try{
    _requireRateLimit('admin_save_menu_order',_tokenHash(token||'na'),40,60,'จัดลำดับเมนูถี่เกินไป');
    requireEditor(token);
    const ids=Array.isArray(orderIds)?orderIds.map(x=>String(x)).filter(Boolean):[];
    const all=(crud(SHEETS.MENU,'getAll',{})||[]).map(m=>String(m.id||''));
    const unique=[];const seen={};
    ids.forEach(id=>{if(all.indexOf(id)>-1&&!seen[id]){seen[id]=1;unique.push(id);}});
    all.forEach(id=>{if(!seen[id]){seen[id]=1;unique.push(id);}});
    _persistMenuSort(unique);
    _invalidateMenuCaches();
    try{SC().put('menu_version',String(Date.now()),600);}catch(_){}
    auditLog(token,'admin_menu_reorder','จัดลำดับเมนู',{count:unique.length},'info');
    return respond({saved:true});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function adminGuestLogin(){
  try{
    _requireRateLimit('admin_guest_login','global',10,120,'พยายามเข้าสู่ระบบถี่เกินไป');
    const users=crud(SHEETS.USERS,'getAll',{});
    const guest=users.find(u=>String(u.username||'').toLowerCase()==='guest'&&String(u.role||'').toLowerCase()==='guest');
    if(!guest||String(guest.status||'active')!=='active')return err('NOT_AVAILABLE','ยังไม่มีบัญชี guest ที่ใช้งานได้');
    const s=_newSession(guest);
    const token=s.token;
    auditLog(token,'admin_guest_login','เข้าสู่ระบบโหมด Guest',{username:'guest'},'info');
    return respond({token:token,role:String(guest.role||'guest'),username:String(guest.username||'guest'),expiresAt:s.expiresAt});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function getGuestLoginState(){
  try{
    const users=crud(SHEETS.USERS,'getAll',{});
    const enabled=users.some(u=>String(u.username||'').toLowerCase()==='guest'&&String(u.role||'').toLowerCase()==='guest'&&String(u.status||'active')==='active');
    return respond({enabled:enabled});
  }catch(_){return respond({enabled:false});}
}

function _maskSecretTail(v){
  const s=String(v==null?'':v).trim();
  if(!s)return '';
  const tail=s.slice(-4);
  return '********'+tail;
}
function _isMaskedSecretInput(v){
  const s=String(v==null?'':v).trim();
  return !!s && s.indexOf('*')>-1;
}
function _setSettingValue(key,val){
  const k=String(key||'').trim();
  if(!k)return;
  const sh=getSheet(SHEETS.SETTINGS);if(!sh)return;
  const rows=sh.getDataRange().getValues();
  let found=false;
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][0]||'')===k){
      sh.getRange(i+1,2).setValue(String(val==null?'':val));
      found=true;
      break;
    }
  }
  if(!found)sh.appendRow([k,String(val==null?'':val)]);
  try{SC().put('cfg_'+k,String(val==null?'':val),900);}catch(_){}
  try{__reqDataCache.settingsMap=null;delete __reqDataCache.rows['SETTINGS'];delete __reqDataCache.objs['SETTINGS'];}catch(_){}
}
function _notificationSentKey(orderId){
  return 'notify_'+String(orderId||'').trim();
}
function _notificationProcessingKey(orderId){
  return 'fo_notify_processing_'+String(orderId||'').trim();
}
function _safeNotifyErr(e){
  const s=String((e&&e.message)||e||'');
  return _safeText(s.replace(/Bearer\s+[A-Za-z0-9\-_\.]+/ig,'Bearer ***'),180);
}
function _logNotificationEvent(orderId,channel,status,errorMsg){
  log(status==='error'?'warn':'info','notification',status==='error'?'Notification failed':'Notification success',{
    created_at:new Date().toISOString(),
    order_id:String(orderId||''),
    channel:String(channel||''),
    status:String(status||''),
    error:status==='error'?_safeText(String(errorMsg||''),180):''
  });
}
function _validateLineTargetId(targetType,targetId){
  const t=String(targetType||'group').toLowerCase()==='user'?'user':'group';
  const id=String(targetId||'').trim();
  if(!id)throw Object.assign(new Error('กรุณากรอก LINE Target ID'),{code:'NO_LINE_TARGET'});
  if(t==='user'&&id.charAt(0)!=='U')throw Object.assign(new Error('LINE User ID ควรขึ้นต้นด้วย U'),{code:'INVALID_LINE_USER_ID'});
  if(t==='group'&&id.charAt(0)!=='C')throw Object.assign(new Error('LINE Group ID ควรขึ้นต้นด้วย C'),{code:'INVALID_LINE_GROUP_ID'});
  return id;
}
function wasNotificationSent(orderId){
  const key=_notificationSentKey(orderId);
  if(!key||key==='notify_')return false;
  try{return String(SC().get(key)||'')==='1';}catch(_){return false;}
}
function markNotificationSent(orderId){
  const key=_notificationSentKey(orderId);
  if(!key||key==='notify_')return;
  try{SC().put(key,'1',600);}catch(_){}
}
function _ensureNotificationLogSheet(){
  let sh=getSheet(SHEETS.LOGS);
  const headers=['type','order_id','channel','status','message','created_at'];
  if(!sh){
    sh=SS().insertSheet(SHEETS.LOGS);
    sh.appendRow(headers);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
    return sh;
  }
  if(sh.getLastRow()<1){
    sh.appendRow(headers);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');
  }
  return sh;
}
function _appendNotificationLog(orderId,channel,status,msg){
  try{
    const sh=_ensureNotificationLogSheet();
    if(!sh)return;
    sh.appendRow([
      'notification',
      String(orderId||''),
      String(channel||''),
      String(status||''),
      _safeText(String(msg||''),150),
      new Date()
    ]);
  }catch(_){}
}
function _getOrderLink(orderId){
  const include=String(cfg('notification_include_admin_link')||'0')==='1';
  if(!include)return '';
  const oid=String(orderId||'').trim();
  let base=String(cfg('webapp_url')||'').trim();
  if(!base){
    try{base=String(ScriptApp.getService().getUrl()||'').trim();}catch(_){base='';}
  }
  if(!base)return '';
  if(base.indexOf('/exec')===-1)return '';
  if(/[?&](token|session|auth|password)=/i.test(base))return '';
  const sep=base.indexOf('?')>-1?'&':'?';
  let link=base+sep+'page=admin&view=order';
  if(oid)link+='&id='+encodeURIComponent(oid);
  return link;
}
function buildOrderNotificationMessage(order){
  order=order||{};
  const id=String(order.id||order.order_id||'-').trim()||'-';
  const customer=String(order.customer||order.customer_name||'').trim()||'ไม่ระบุ';
  const departmentRaw=String(order.department||'').trim();
  const noteRaw=String(order.note||'').trim();
  const customerNoteRaw=String(order.customer_note||'').trim();
  const department=departmentRaw||noteRaw||'-';
  const total=round2(toNum(order.total||0));
  const dt=(function(raw){
    try{
      const d=(raw instanceof Date)?raw:new Date(raw||new Date());
      if(!d||isNaN(d.getTime()))return Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Bangkok','dd/MM/yyyy HH:mm');
      return Utilities.formatDate(d,Session.getScriptTimeZone()||'Asia/Bangkok','dd/MM/yyyy HH:mm');
    }catch(_){return Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Bangkok','dd/MM/yyyy HH:mm');}
  })(order.created_at);
  let items=Array.isArray(order.items)?order.items:[];
  if(!items.length&&id&&id!=='-'){
    try{
      items=(crud(SHEETS.ORDER_ITEMS,'getAll',{})||[])
        .filter(it=>String(it&&it.order_id||'').trim()===id)
        .map(it=>({name:String(it&&it.name||''),qty:normalizeQty(it&&it.qty||1),options:it&&it.options}));
    }catch(_){items=[];}
  }
  const parseOptionLabels=function(raw){
    if(raw==null)return [];
    if(Array.isArray(raw)){
      return raw.map(function(x){
        if(typeof x==='string')return String(x||'').trim();
        if(typeof x==='object'&&x)return String(x.label||x.name||x.value||'').trim();
        return String(x||'').trim();
      }).filter(Boolean);
    }
    const s=String(raw||'').trim();
    if(!s)return [];
    try{
      const j=JSON.parse(s);
      if(Array.isArray(j))return parseOptionLabels(j);
    }catch(_){}
    return s.split(/\r?\n|,/).map(v=>String(v||'').trim()).filter(Boolean);
  };
  const itemsText=(items.length?items.map(it=>{
    const nm=String((it&&it.name)||'').trim()||'รายการ';
    const qty=normalizeQty(it&&it.qty||1);
    const opts=parseOptionLabels(it&&it.options);
    const optsTxt=opts.length?(' ('+opts.join(', ')+')'):'';
    return '• '+nm+' x'+qty+optsTxt;
  }).join('\n'):'ไม่มีรายการสินค้า');
  const orderLink=_getOrderLink(id);
  const lines=[
    '🔔 มีออเดอร์ใหม่!',
    '',
    'เลขออเดอร์: #'+id,
    'ลูกค้า: '+customer,
    'หมู่บ้าน: '+department,
    'ยอดรวม: ฿'+Math.round(total).toLocaleString('th-TH'),
    'รายการ:',
    itemsText,
    '',
    'สถานะ: รอดำเนินการ',
    'เวลา: '+dt
  ];
  if(orderLink){
    lines.push('');
    lines.push('🔎 เปิดดูออเดอร์:');
    lines.push(orderLink);
  }
  return lines.join('\n');
}
function _sendWithRetry(fn,maxRetry,delayMs){
  const retries=Math.max(0,parseInt(maxRetry,10)||0);
  const delay=Math.max(100,parseInt(delayMs,10)||300);
  const deadline=Date.now()+7000;
  let lastErr=null;
  for(let i=0;i<=retries;i++){
    try{return fn();}
    catch(e){
      lastErr=e;
      if(i>=retries||Date.now()>deadline)break;
      Utilities.sleep(delay);
    }
  }
  throw lastErr||new Error('NOTIFY_FAILED');
}
function sendLineNotification(message,overrideCfg){
  const o=overrideCfg||{};
  const enabled=(o.force===true)?'1':String(o.enabled!=null?o.enabled:cfg('notification_line_enabled')||'0');
  if(String(enabled)!=='1')return {ok:false,skipped:true,channel:'line',reason:'disabled'};
  const token=String(o.token!=null?o.token:cfg('notification_line_channel_access_token')||'').trim();
  const targetType=String(o.targetType!=null?o.targetType:cfg('notification_line_target_type')||'group').toLowerCase();
  const targetId=String(o.targetId!=null?o.targetId:cfg('notification_line_target_id')||'').trim();
  if(!token)throw Object.assign(new Error('กรุณากรอก LINE Channel Access Token'),{code:'NO_LINE_TOKEN'});
  const validTargetId=_validateLineTargetId(targetType,targetId);
  const payload={
    to:validTargetId,
    messages:[{type:'text',text:String(message||'')}]
  };
  const res=UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push',{
    method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    payload:JSON.stringify(payload),
    muteHttpExceptions:true
  });
  const code=res.getResponseCode();
  if(code>=200&&code<300)return {ok:true,channel:'line',targetType:targetType};
  throw new Error('LINE_PUSH_HTTP_'+code);
}
function sendTelegramNotification(message,overrideCfg){
  const o=overrideCfg||{};
  const enabled=(o.force===true)?'1':String(o.enabled!=null?o.enabled:cfg('notification_telegram_enabled')||'0');
  if(String(enabled)!=='1')return {ok:false,skipped:true,channel:'telegram',reason:'disabled'};
  const token=String(o.token!=null?o.token:cfg('notification_telegram_bot_token')||'').trim();
  const chatId=String(o.chatId!=null?o.chatId:cfg('notification_telegram_chat_id')||'').trim();
  if(!token)throw Object.assign(new Error('กรุณากรอก Telegram Bot Token'),{code:'NO_TELEGRAM_TOKEN'});
  if(!chatId)throw Object.assign(new Error('กรุณากรอก Telegram Chat ID'),{code:'NO_TELEGRAM_CHAT'});
  if(!/^-?\d+$/.test(chatId))throw Object.assign(new Error('Telegram Chat ID ต้องเป็นตัวเลข เช่น 123456 หรือ -1001234567890'),{code:'INVALID_TELEGRAM_CHAT'});
  const url='https://api.telegram.org/bot'+token+'/sendMessage';
  const payload={chat_id:chatId,text:String(message||'')};
  const res=UrlFetchApp.fetch(url,{
    method:'POST',
    contentType:'application/json',
    payload:JSON.stringify(payload),
    muteHttpExceptions:true
  });
  const code=res.getResponseCode();
  if(code>=200&&code<300)return {ok:true,channel:'telegram'};
  throw new Error('TELEGRAM_HTTP_'+code);
}
function sendNotificationSafe(order){
  try{
    const oid=String(order&&order.id||order&&order.order_id||'').trim();
    if(!oid)return {ok:false,skipped:true,reason:'no_order_id'};
    if(wasNotificationSent(oid))return {ok:true,skipped:true,reason:'already_sent'};
    const procKey=_notificationProcessingKey(oid);
    try{
      if(String(SC().get(procKey)||'')==='1')return {ok:true,skipped:true,reason:'in_progress'};
      SC().put(procKey,'1',120);
    }catch(_){}
    const message=buildOrderNotificationMessage(order||{});
    let sentCount=0;
    try{
      const r1=_sendWithRetry(function(){return sendLineNotification(message,{});},2,300);
      if(r1&&r1.ok){sentCount++;_appendNotificationLog(oid,'line','success','');}
    }catch(e1){
      _appendNotificationLog(oid,'line','error',_safeNotifyErr(e1));
    }
    try{
      const r2=_sendWithRetry(function(){return sendTelegramNotification(message,{});},2,300);
      if(r2&&r2.ok){sentCount++;_appendNotificationLog(oid,'telegram','success','');}
    }catch(e2){
      _appendNotificationLog(oid,'telegram','error',_safeNotifyErr(e2));
    }
    if(sentCount>0){
      markNotificationSent(oid);
      try{SC().remove(procKey);}catch(_){}
      return {ok:true,sent:sentCount};
    }
    try{SC().remove(procKey);}catch(_){}
    return {ok:false,skipped:true,reason:'all_disabled_or_failed'};
  }catch(e){
    _appendNotificationLog(String(order&&order.id||order&&order.order_id||''),'system','error',_safeNotifyErr(e));
    return {ok:false,error:String(e&&e.message||e||'')};
  }
}
function sendOrderNotification(order){
  return sendNotificationSafe(order);
}
function getNotificationSettings(token){
  try{
    requireAuth(token);
    const cached=_cacheGet(CACHE_KEYS.NOTIFY_SETTINGS);
    if(cached&&typeof cached==='object')return respond(cached);
    const m=_settingsMap();
    const out={
      notification_line_enabled:String(m.notification_line_enabled||'0'),
      notification_line_channel_access_token_masked:_maskSecretTail(m.notification_line_channel_access_token||''),
      notification_line_target_type:String(m.notification_line_target_type||'group'),
      notification_line_target_id:String(m.notification_line_target_id||''),
      notification_telegram_enabled:String(m.notification_telegram_enabled||'0'),
      notification_telegram_bot_token_masked:_maskSecretTail(m.notification_telegram_bot_token||''),
      notification_telegram_chat_id:String(m.notification_telegram_chat_id||''),
      notification_include_admin_link:String(m.notification_include_admin_link||'0')
    };
    // PERF: cache masked notification settings for fast admin page open
    _cachePut(CACHE_KEYS.NOTIFY_SETTINGS,out,300);
    return respond(out);
  }catch(e){return err(e.code||'ERROR',e.message);}
}
function getLatestLineWebhookIds(token){
  try{
    requireAuth(token);
    const m=_settingsMap();
    return respond({
      notification_line_last_group_id:String(m.notification_line_last_group_id||''),
      notification_line_last_user_id:String(m.notification_line_last_user_id||'')
    });
  }catch(e){return err(e.code||'ERROR',e.message);}
}
function _upsertSettingsBatch(payload){
  payload=payload||{};
  const sh=getSheet(SHEETS.SETTINGS);
  if(!sh)return {ok:false,changedKeys:[],beforeMap:{},afterMap:{}};
  const rows=_sheetRows(SHEETS.SETTINGS);
  if(!rows.length)return {ok:false,changedKeys:[],beforeMap:{},afterMap:{}};
  const beforeMap={};
  for(let i=1;i<rows.length;i++){
    const k=String(rows[i][0]||'').trim();
    if(!k)continue;
    beforeMap[k]=String(rows[i][1]==null?'':rows[i][1]);
  }
  const rowByKey={};
  for(let i=1;i<rows.length;i++){
    const k=String(rows[i][0]||'').trim();
    if(k)rowByKey[k]=i;
  }
  const appendRows=[];
  const changedKeys=[];
  const changedExisting=[];
  const afterMap={};
  Object.keys(payload).forEach(function(k){
    const nextVal=String(payload[k]==null?'':payload[k]);
    const idx=rowByKey[k];
    if(idx!=null){
      const prev=String(rows[idx][1]==null?'':rows[idx][1]);
      if(prev!==nextVal){
        changedExisting.push({row:idx+1,value:nextVal});
        changedKeys.push(k);
      }
      afterMap[k]=nextVal;
    }else{
      appendRows.push([k,nextVal]);
      changedKeys.push(k);
      afterMap[k]=nextVal;
    }
  });
  if(changedExisting.length){
    changedExisting.sort(function(a,b){return a.row-b.row;});
    let blockStart=changedExisting[0].row;
    let blockVals=[[changedExisting[0].value]];
    let prevRow=changedExisting[0].row;
    for(let i=1;i<changedExisting.length;i++){
      const cur=changedExisting[i];
      if(cur.row===prevRow+1){
        blockVals.push([cur.value]);
        prevRow=cur.row;
        continue;
      }
      sh.getRange(blockStart,2,blockVals.length,1).setNumberFormat('@');
      sh.getRange(blockStart,2,blockVals.length,1).setValues(blockVals);
      blockStart=cur.row;
      blockVals=[[cur.value]];
      prevRow=cur.row;
    }
    sh.getRange(blockStart,2,blockVals.length,1).setNumberFormat('@');
    sh.getRange(blockStart,2,blockVals.length,1).setValues(blockVals);
  }
  if(appendRows.length){
    const start=sh.getLastRow()+1;
    sh.getRange(start,2,appendRows.length,1).setNumberFormat('@');
    sh.getRange(start,1,appendRows.length,2).setValues(appendRows);
  }
  Object.keys(payload).forEach(function(k){
    if(!Object.prototype.hasOwnProperty.call(afterMap,k))afterMap[k]=String(payload[k]==null?'':payload[k]);
  });
  Object.keys(payload).forEach(function(k){
    try{SC().put('cfg_'+k,String(afterMap[k]||''),900);}catch(_){}
  });
  try{
    __reqDataCache.settingsMap=null;
    delete __reqDataCache.rows[String(SHEETS.SETTINGS)];
    delete __reqDataCache.objs[String(SHEETS.SETTINGS)];
  }catch(_){}
  return {ok:true,changedKeys:changedKeys,beforeMap:beforeMap,afterMap:afterMap};
}
function saveNotificationSettings(data,token){
  perfStart('saveSettings.notifications');
  try{
    _requireRateLimit('save_notification_settings',_tokenHash(token||'na'),40,60,'บันทึกการตั้งค่าแจ้งเตือนถี่เกินไป');
    requireEditor(token);
    data=data||{};
    const map=_settingsMap();
    const resolveSecret=function(nextVal,prevVal){
      const raw=String(nextVal==null?'':nextVal).trim();
      if(!raw||_isMaskedSecretInput(raw))return String(prevVal||'');
      return raw;
    };
    const payload={
      notification_line_enabled:String(data.notification_line_enabled||'0')==='1'?'1':'0',
      notification_line_channel_access_token:resolveSecret(data.notification_line_channel_access_token,map.notification_line_channel_access_token),
      notification_line_target_type:(String(data.notification_line_target_type||'group').toLowerCase()==='user'?'user':'group'),
      notification_line_target_id:String(data.notification_line_target_id||'').trim(),
      notification_telegram_enabled:String(data.notification_telegram_enabled||'0')==='1'?'1':'0',
      notification_telegram_bot_token:resolveSecret(data.notification_telegram_bot_token,map.notification_telegram_bot_token),
      notification_telegram_chat_id:String(data.notification_telegram_chat_id||'').trim(),
      notification_include_admin_link:String(data.notification_include_admin_link||'0')==='1'?'1':'0'
    };
    if(String(payload.notification_line_enabled)==='1'){
      if(!String(payload.notification_line_channel_access_token||'').trim())return err('NO_LINE_TOKEN','กรุณากรอก LINE Channel Access Token');
      try{_validateLineTargetId(payload.notification_line_target_type,payload.notification_line_target_id);}catch(ex){return err(ex.code||'INVALID_LINE_TARGET',ex.message||'LINE Target ID ไม่ถูกต้อง');}
    }
    if(String(payload.notification_telegram_enabled)==='1'){
      if(!String(payload.notification_telegram_bot_token||'').trim())return err('NO_TELEGRAM_TOKEN','กรุณากรอก Telegram Bot Token');
      if(!String(payload.notification_telegram_chat_id||'').trim())return err('NO_TELEGRAM_CHAT','กรุณากรอก Telegram Chat ID');
      if(!/^-?\d+$/.test(String(payload.notification_telegram_chat_id||'')))return err('INVALID_TELEGRAM_CHAT','Telegram Chat ID ต้องเป็นตัวเลข เช่น 123456 หรือ -1001234567890');
    }
    const upsertResult=_upsertSettingsBatch(payload);
    if(!upsertResult.ok)return err('ERROR','No SETTINGS sheet');
    perfStep('saveSettings.notifications','upsert_settings_batch');
    _cacheRemove(CACHE_KEYS.NOTIFY_SETTINGS);
    _invalidateSettingsCaches();
    auditLog(token,'admin_notification_settings_save','บันทึกการตั้งค่าแจ้งเตือน',{keys:Object.keys(payload)},'info');
    return respond({saved:true});
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('saveSettings.notifications');}
}
function testLineNotification(input,token){
  try{
    _requireRateLimit('test_line_notification',_tokenHash(token||'na'),20,60,'ทดสอบ LINE ถี่เกินไป');
    requireEditor(token);
    input=input||{};
    const cur=_settingsMap();
    const tokenVal=(function(){
      const v=String(input.notification_line_channel_access_token||'').trim();
      if(v&&!_isMaskedSecretInput(v))return v;
      return String(cur.notification_line_channel_access_token||'').trim();
    })();
    const targetId=String(input.notification_line_target_id||cur.notification_line_target_id||'').trim();
    const targetType=String(input.notification_line_target_type||cur.notification_line_target_type||'group').toLowerCase();
    if(!tokenVal)return err('NO_LINE_TOKEN','กรุณากรอก Channel Access Token');
    if(!targetId)return err('NO_LINE_TARGET','กรุณากรอก Target ID');
    sendLineNotification('🔔 ทดสอบระบบแจ้งเตือนจาก FoodOrder สำเร็จ',{force:true,token:tokenVal,targetId:targetId,targetType:targetType});
    return respond({ok:true,message:'ส่ง LINE สำเร็จ'});
  }catch(e){return err(e.code||'ERROR',e.message);}
}
function testTelegramNotification(input,token){
  try{
    _requireRateLimit('test_telegram_notification',_tokenHash(token||'na'),20,60,'ทดสอบ Telegram ถี่เกินไป');
    requireEditor(token);
    input=input||{};
    const cur=_settingsMap();
    const tokenVal=(function(){
      const v=String(input.notification_telegram_bot_token||'').trim();
      if(v&&!_isMaskedSecretInput(v))return v;
      return String(cur.notification_telegram_bot_token||'').trim();
    })();
    const chatId=String(input.notification_telegram_chat_id||cur.notification_telegram_chat_id||'').trim();
    if(!tokenVal)return err('NO_TELEGRAM_TOKEN','กรุณากรอก Telegram Bot Token');
    if(!chatId)return err('NO_TELEGRAM_CHAT','กรุณากรอก Telegram Chat ID');
    sendTelegramNotification('🔔 ทดสอบระบบแจ้งเตือนจาก FoodOrder สำเร็จ',{force:true,token:tokenVal,chatId:chatId});
    return respond({ok:true,message:'ส่ง Telegram สำเร็จ'});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function getSettings(token){
  perfStart('getSettings');
  try{
    let role='public';
    if(token){
      try{
        const u=requireAuth(token);
        role=String(u.role||'staff').toLowerCase();
      }catch(_){role='public';}
    }
    // PERF: serve public settings from versioned script cache
    if(role==='public')return respond(_getPublicSettings());
    const cacheKey=role==='staff'?'fo_settings_staff_v3':CACHE_KEYS.SETTINGS_FULL;
    const cached=_cacheGet(cacheKey);
    if(cached&&typeof cached==='object')return respond(cached);
    const map=_settingsMap();
    const obj={};
    Object.keys(map||{}).forEach(k=>{obj[k]=map[k];});
    const driveFolderId=_normalizeGoogleDriveResourceId(obj.drive_folder_id||obj.google_drive_folder_id||obj.menu_image_folder_id||'');
    obj.drive_folder_id=driveFolderId;
    obj.google_drive_folder_id=driveFolderId;
    obj.menu_image_folder_id=driveFolderId;
    // SECURITY: never expose notification secrets via generic settings endpoint
    obj.notification_line_channel_access_token='';
    obj.notification_telegram_bot_token='';
    if(role==='staff'){
      obj.slipok_api_key='';
      obj.slipok_branch_id='';
      obj.drive_folder_id='';
      obj.google_drive_folder_id='';
      obj.menu_image_folder_id='';
    }
    _cachePut(cacheKey,obj,Math.max(60,Math.min(TTL.SETTINGS,300)));
    return respond(obj);
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('getSettings');}
}

function saveSettings(data,token){
  perfStart('saveSettings');
  try{
    _requireRateLimit('save_settings','global',40,60,'บันทึกการตั้งค่าถี่เกินไป');
    const user=requireEditor(token);const sh=getSheet('SETTINGS');if(!sh)return err('ERROR','No SETTINGS sheet');
    const validKeys=['departments','delivery_category_type','delivery_note_mode','restaurant_name','restaurant_logo','promptpay','promptpay_enabled','payment_timeout','cash_payment_enabled','bank_payment_enabled',
      'slipok_api_key','slipok_branch_id','payee_name','payment_banks','drive_folder_id','google_drive_folder_id','menu_image_folder_id','theme','customer_theme','admin_theme','shop_open','shop_open_range','menu_sort',
      'notification_line_enabled','notification_line_channel_access_token','notification_line_target_type','notification_line_target_id',
      'notification_telegram_enabled','notification_telegram_bot_token','notification_telegram_chat_id','notification_include_admin_link','webapp_url',
      'notification_line_last_group_id','notification_line_last_user_id','print_method','bluetooth_auto_connect'];
    const promptpayEnabled=String(data&&data.promptpay_enabled||'0')==='1';
    const cashEnabled=String(data&&data.cash_payment_enabled||'0')==='1';
    const bankEnabled=String(data&&data.bank_payment_enabled==null?'1':(data&&data.bank_payment_enabled))==='1';
    const promptpayNumber=_normalizePromptPayNumber(data&&data.promptpay||'');
    if(!promptpayEnabled&&!cashEnabled&&!bankEnabled)return err('INVALID','ต้องเปิดใช้งานการชำระเงินอย่างน้อย 1 วิธี');
    if(promptpayEnabled&&!promptpayNumber)return err('INVALID','หากเปิดใช้ PromptPay กรุณากรอกเลข PromptPay');
    if(promptpayEnabled&&!_isValidPromptPayNumber(promptpayNumber))return err('INVALID','เลข PromptPay ต้องเป็นมือถือ 10 หลัก หรือบัตรประชาชน 13 หลัก');
    const role=String(user.role||'guest').toLowerCase();
    const blockedForStaff={slipok_api_key:1,slipok_branch_id:1,drive_folder_id:1,google_drive_folder_id:1,menu_image_folder_id:1};
    const aliasToCanonical={google_drive_folder_id:'drive_folder_id',menu_image_folder_id:'drive_folder_id'};
    const payload={};
    for(const k in data){
      if(!validKeys.includes(k))continue;
      if(role==='staff'&&blockedForStaff[k])continue;
      const key=aliasToCanonical[k]||k;
      let afterVal=(data[k]===undefined||data[k]===null)?'':String(data[k]);
      if(key==='promptpay')afterVal=_normalizePromptPayNumber(afterVal);
      if(key==='bank_payment_enabled')afterVal=(afterVal==='0'?'0':'1');
      if(key==='drive_folder_id'){
        const rawInput=String(afterVal||'').trim();
        afterVal=_normalizeGoogleDriveResourceId(afterVal);
        if(rawInput&&!afterVal)return err('INVALID_DRIVE_FOLDER_ID','Folder ID ไม่ถูกต้อง');
      }
      payload[key]=afterVal;
    }
    const upsertResult=_upsertSettingsBatch(payload);
    if(!upsertResult.ok)return err('ERROR','No SETTINGS sheet');
    perfStep('saveSettings','upsert_settings_batch');
    const sensitive=['promptpay','promptpay_enabled','slipok_api_key','slipok_branch_id','payment_timeout','cash_payment_enabled','payment_banks','drive_folder_id','notification_line_channel_access_token','notification_telegram_bot_token'];
    const sensitiveChanges=[];
    upsertResult.changedKeys.forEach(function(k){
      if(sensitive.indexOf(k)===-1)return;
      const beforeVal=String(upsertResult.beforeMap[k]||'');
      const afterVal=String(upsertResult.afterMap[k]||'');
      const maskedBefore=(k==='notification_line_channel_access_token'||k==='notification_telegram_bot_token'||k==='slipok_api_key')?_maskSecretTail(beforeVal):_safeText(beforeVal,300);
      const maskedAfter=(k==='notification_line_channel_access_token'||k==='notification_telegram_bot_token'||k==='slipok_api_key')?_maskSecretTail(afterVal):_safeText(afterVal,300);
      sensitiveChanges.push({key:k,before:maskedBefore,after:maskedAfter});
    });
    if(sensitiveChanges.length){
      auditLog(token,'admin_settings_sensitive_change','แก้ไขค่าความปลอดภัย/การชำระเงิน',{count:sensitiveChanges.length,changes:sensitiveChanges},'warn');
    }
    const changedSet={};
    upsertResult.changedKeys.forEach(function(k){changedSet[k]=1;});
    _invalidateSettingsCaches({
      includeDepartments:!!(changedSet.departments||changedSet.delivery_category_type||changedSet.delivery_note_mode),
      includeMenu:!!(changedSet.restaurant_name||changedSet.restaurant_logo||changedSet.payment_banks||changedSet.promptpay||changedSet.promptpay_enabled||changedSet.cash_payment_enabled||changedSet.bank_payment_enabled),
      includePromotions:false,
      includeDashboard:false
    });
    log('info','saveSettings','Settings saved');
    auditLog(token,'admin_settings_save','บันทึกการตั้งค่า',{keys:Object.keys(data||{})},'info');
    return respond({saved:true});
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('saveSettings');}
}
function saveSettingsPartial(data,token){
  return saveSettings(data,token);
}

function testSlipOKConnection(input,token){
  try{
    _requireRateLimit('admin_test_slipok',_tokenHash(token||'na'),20,60,'ตรวจสอบ API ถี่เกินไป');
    requireAdmin(token);
    input=input||{};
    const apiKey=String(input.apiKey||cfg('slipok_api_key')||'').trim();
    const branchId=String(input.branchId||cfg('slipok_branch_id')||'').trim();
    if(!apiKey)return err('NO_API_KEY','กรุณากรอก SlipOK API Key');
    if(!branchId)return err('NO_BRANCH_ID','กรุณากรอก SlipOK Branch ID');
    const url='https://api.slipok.com/api/line/apikey/'+branchId;
    const payload={files:'',log:false,amount:1};
    const response=UrlFetchApp.fetch(url,{
      method:'POST',
      headers:{'Content-Type':'application/json','x-authorization':apiKey},
      payload:JSON.stringify(payload),
      muteHttpExceptions:true
    });
    const httpCode=response.getResponseCode();
    const text=response.getContentText()||'';
    let data={};
    try{data=JSON.parse(text);}catch(_){data={};}
    const code=String((data&&data.code)||'');
    if(httpCode===200){
      return respond({ok:true,httpCode:httpCode,message:'เชื่อมต่อ SlipOK API สำเร็จ'});
    }
    if(code==='1002')return err('INVALID_API_KEY','API Key ไม่ถูกต้อง');
    if(code==='1001')return err('INVALID_BRANCH','Branch ID ไม่ถูกต้อง');
    if(code==='1003')return err('PACKAGE_EXPIRED','Package SlipOK หมดอายุ');
    if(code==='1004')return err('QUOTA_EXCEEDED','โควต้า SlipOK หมด');
    if(code==='1015')return err('PACKAGE_NOT_FOUND','ไม่พบ Package ของ SlipOK');
    // 1000/1005/1006/1007/1008 มักเป็น error จาก payload ทดสอบ
    if(code==='1000'||code==='1005'||code==='1006'||code==='1007'||code==='1008'){
      return respond({ok:true,httpCode:httpCode,message:'เชื่อมต่อ SlipOK API สำเร็จ (ข้อมูลทดสอบไม่ครบตามที่คาด)'});
    }
    return err('SLIPOK_CHECK_FAILED',(data&&data.message)?String(data.message):('ตรวจสอบ SlipOK ไม่สำเร็จ (HTTP '+httpCode+')'));
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function testGoogleDriveConnection(input,token){
  try{
    _requireRateLimit('admin_test_drive',_tokenHash(token||'na'),20,60,'ตรวจสอบ API ถี่เกินไป');
    requireAdmin(token);
    input=input||{};
    const folderId=_resolveDriveFolderIdFromSettings(input.folderId||input.google_drive_folder_id||input.menu_image_folder_id||'');
    if(!folderId)return err('DRIVE_FOLDER_NOT_CONFIGURED','ยังไม่ได้สร้างโฟลเดอร์ กรุณากดสร้างโฟลเดอร์อัตโนมัติก่อน');
    const chk=_checkDriveFolderWriteAccess(folderId,{createTestFile:true});
    if(!chk||!chk.ok){
      const code=String(chk&&chk.code||'');
      if(code==='INVALID_DRIVE_FOLDER_ID')return err('INVALID_DRIVE_FOLDER_ID','Folder ID ไม่ถูกต้อง');
      if(code==='DRIVE_FOLDER_NO_EDITOR')return err('DRIVE_FOLDER_NO_EDITOR','Apps Script account ไม่มีสิทธิ์ Editor');
      if(code==='DRIVE_FOLDER_NOT_FOUND')return err('DRIVE_FOLDER_NOT_FOUND','ไม่พบโฟลเดอร์เดิม กรุณาสร้างโฟลเดอร์ใหม่');
      if(code==='DRIVE_QUOTA')return err('DRIVE_QUOTA',String((chk&&chk.message)||'quota/permission error'));
      return err('DRIVE_CHECK_FAILED',String((chk&&chk.message)||'ตรวจสอบ Google Drive ไม่สำเร็จ'));
    }
    return respond({ok:true,folderId:chk.folderId,folderName:String(chk.folderName||''),folderUrl:'https://drive.google.com/drive/folders/'+chk.folderId,writable:true,exists:true,message:'เชื่อมต่อ Google Drive สำเร็จ'});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function createMenuImageFolder(folderName,token){
  try{
    _requireRateLimit('admin_create_drive_folder',_tokenHash(token||'na'),20,60,'สร้างโฟลเดอร์ถี่เกินไป');
    requireAdmin(token);
    const requestedName=String(folderName||'FoodOrder Menu Images').trim()||'FoodOrder Menu Images';
    const existingId=_resolveDriveFolderIdFromSettings();
    if(existingId){
      const chk=verifyDriveFolderExists(existingId);
      if(chk&&chk.ok){
        return respond({
          folderId:existingId,
          folderUrl:'https://drive.google.com/drive/folders/'+existingId,
          folderName:String(chk.folderName||requestedName),
          writable:true,
          exists:true,
          created:false
        });
      }
    }
    const root=ensureFoodOrderAssetsFolder();
    const menuFolder=ensureMenuImagesFolder(root,requestedName);
    const folderId=String(menuFolder.getId()||'').trim();
    _upsertSettingsBatch({
      drive_folder_id:folderId,
      google_drive_folder_id:folderId,
      menu_image_folder_id:folderId
    });
    try{menuFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(_){}
    _invalidateSettingsCaches({includeMenu:false,includeDepartments:false,includePromotions:false,includeDashboard:false});
    return respond({
      folderId:folderId,
      folderUrl:'https://drive.google.com/drive/folders/'+folderId,
      folderName:String(menuFolder.getName()||requestedName),
      writable:true,
      exists:true,
      created:true
    });
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function migrateMenuImagesToDrive(token,options){
  const lock=LockService.getScriptLock();
  try{
    const ss=getSpreadsheet_();
    _requireRateLimit('admin_migrate_menu_images',_tokenHash(token||'na'),40,60,'เรียกย้ายรูปถี่เกินไป');
    const session=requireAdmin(token)||{};
    const actor=String(session.username||session.user||session.email||session.role||'admin');
    lock.waitLock(5000);
    options=options||{};
    const limit=Math.max(1,Math.min(25,parseInt(options.limit||15,10)||15));
    const cursor=Math.max(0,parseInt(options.cursor||0,10)||0);
    const dryRun=String(options.dryRun||'')==='true'||options.dryRun===true;
    const onlyBase64=String(options.onlyBase64||'')==='true'||options.onlyBase64===true;
    const folderId=_resolveDriveFolderIdFromSettings();
    if(!folderId)return err('DRIVE_FOLDER_NOT_CONFIGURED','ยังไม่ได้สร้างโฟลเดอร์ Google Drive');
    const chk=_checkDriveFolderWriteAccess(folderId,{createTestFile:false});
    if(!chk||!chk.ok)return err(String(chk&&chk.code||'DRIVE_FOLDER_NOT_FOUND'),'ไม่พบโฟลเดอร์เดิม กรุณาสร้างโฟลเดอร์ใหม่');
    const folder=DriveApp.getFolderById(folderId);
    const backupInfo=_ensureMenuBackupSheet_(ss);
    if(!backupInfo.ok)return err('BACKUP_FAILED',String(backupInfo.message||'สำรองข้อมูลเมนูไม่สำเร็จ'));
    const menuInfo=getMenuSheetAndHeaders(ss);
    if(!menuInfo||!menuInfo.sheet)return err('MENU_NOT_FOUND','ไม่พบชีต MENU');
    if(!menuInfo)return respond({done:true,cursor:null,total:0,migrated:0,skipped:0,failed:0,results:[]});
    const iImg=menuInfo.idx.image;
    const iName=(menuInfo.idx.name!=null)?menuInfo.idx.name:menuInfo.idx.menu_name;
    const iId=(menuInfo.idx.id!=null)?menuInfo.idx.id:menuInfo.idx.menu_id;
    if(iImg==null||iImg<0)return err('MENU_IMAGE_COLUMN_NOT_FOUND','ไม่พบคอลัมน์ image ในชีต MENU');
    const totalRows=Math.max(0,menuInfo.lastRow-1);
    if(cursor>=totalRows)return respond({done:true,cursor:null,total:totalRows,migrated:0,skipped:0,failed:0,results:[]});
    const startDataRow=2+cursor;
    const len=Math.min(limit,totalRows-cursor);
    const vals=menuInfo.sheet.getRange(startDataRow,1,len,menuInfo.lastCol).getValues();
    let migrated=0,skipped=0,failed=0;
    const results=[];
    const dedupMap={};
    for(let i=0;i<vals.length;i++){
      const r=vals[i];
      const rowNumber=startDataRow+i;
      const rowObj={
        rowNumber:rowNumber,
        menuId:(iId!=null&&iId>=0)?String(r[iId]||'').trim():String(rowNumber-1),
        menuName:(iName!=null&&iName>=0)?String(r[iName]||'').trim():'',
        image:String(r[iImg]||'').trim()
      };
      let itemRes={status:'skipped',reason:'',oldUrl:rowObj.image,newUrl:''};
      if(dryRun){
        if(!rowObj.image)itemRes={status:'skipped',reason:'ไม่มีรูป',oldUrl:'',newUrl:''};
        else if(isImageAlreadyInTargetFolder(rowObj.image,folderId))itemRes={status:'skipped',reason:'อยู่ในโฟลเดอร์นี้แล้ว',oldUrl:rowObj.image,newUrl:rowObj.image};
        else if(onlyBase64&&!isBase64ImageDataUrl(rowObj.image))itemRes={status:'skipped',reason:'ไม่ใช่ base64',oldUrl:rowObj.image,newUrl:''};
        else itemRes={status:'migrated',reason:'dry-run',oldUrl:rowObj.image,newUrl:rowObj.image};
      }else{
        if(onlyBase64&&!isBase64ImageDataUrl(rowObj.image))itemRes={status:'skipped',reason:'ไม่ใช่ base64',oldUrl:rowObj.image,newUrl:''};
        else itemRes=migrateOneMenuImage_(rowObj,folder,options,dedupMap);
      }
      const oldFileId=normalizeDriveFileId(itemRes.oldUrl||rowObj.image||'');
      const newFileId=normalizeDriveFileId(itemRes.newUrl||'')||String(itemRes.newFileId||'');
      _appendMigrationLog_({
        id:genId('MIG'),
        menu_id:rowObj.menuId,
        menu_name:rowObj.menuName,
        old_image:itemRes.oldUrl||rowObj.image||'',
        new_image:itemRes.newUrl||'',
        old_file_id:oldFileId,
        new_file_id:newFileId,
        target_folder_id:folderId,
        status:itemRes.status,
        reason:itemRes.reason||'',
        migrated_at:new Date(),
        migrated_by:actor,
        rollback_available:!!((itemRes.oldUrl||rowObj.image||'')&&(itemRes.newUrl||''))
      },ss);
      if(itemRes.status==='migrated')migrated++;
      else if(itemRes.status==='failed')failed++;
      else skipped++;
      results.push({
        menuId:rowObj.menuId,
        menuName:rowObj.menuName,
        status:itemRes.status,
        oldUrl:itemRes.oldUrl||'',
        newUrl:itemRes.newUrl||'',
        reason:itemRes.reason||''
      });
    }
    if(migrated>0){
      _invalidateMenuCaches();
      try{SC().put('menu_version',String(Date.now()),600);}catch(_){}
    }
    const nextCursor=cursor+len;
    return respond({
      done:nextCursor>=totalRows,
      cursor:(nextCursor>=totalRows?null:nextCursor),
      total:totalRows,
      processed:nextCursor>=totalRows?totalRows:nextCursor,
      backupCreated:!!backupInfo.created,
      backupExists:true,
      migrated:migrated,
      skipped:skipped,
      failed:failed,
      results:results
    });
  }catch(e){
    return err('MIGRATION_ERROR',e&&e.message?e.message:String(e));
  }finally{
    try{lock.releaseLock();}catch(_){}
  }
}

function backupMenuBeforeImageMigration(token){
  try{
    const ss=getSpreadsheet_();
    requireAdmin(token);
    const b=_ensureMenuBackupSheet_(ss);
    if(!b.ok)return err('BACKUP_FAILED',String(b.message||'สำรองข้อมูลไม่สำเร็จ'));
    return respond({ok:true,created:!!b.created,sheetName:b.sheetName});
  }catch(e){return err('MIGRATION_ERROR',e&&e.message?e.message:String(e));}
}

function verifyMigratedMenuImages(token,options){
  try{
    const ss=getSpreadsheet_();
    requireAdmin(token);
    options=options||{};
    const limit=Math.max(1,Math.min(25,parseInt(options.limit||20,10)||20));
    const cursor=Math.max(0,parseInt(options.cursor||0,10)||0);
    const info=getMenuSheetAndHeaders(ss);
    if(!info||!info.sheet)return err('MENU_NOT_FOUND','ไม่พบชีต MENU');
    if(!info)return respond({done:true,cursor:null,total:0,ok:0,skipped:0,broken:0,results:[]});
    const iImg=info.idx.image;
    const iName=(info.idx.name!=null)?info.idx.name:info.idx.menu_name;
    const iId=(info.idx.id!=null)?info.idx.id:info.idx.menu_id;
    if(iImg==null||iImg<0)return err('MENU_IMAGE_COLUMN_NOT_FOUND','ไม่พบคอลัมน์ image ในชีต MENU');
    const totalRows=Math.max(0,info.lastRow-1);
    if(cursor>=totalRows)return respond({done:true,cursor:null,total:totalRows,ok:0,skipped:0,broken:0,results:[]});
    const start=2+cursor;
    const len=Math.min(limit,totalRows-cursor);
    const rows=info.sheet.getRange(start,1,len,info.lastCol).getValues();
    let ok=0,skipped=0,broken=0;
    const results=[];
    rows.forEach(function(r,idx){
      const menuId=(iId!=null&&iId>=0)?String(r[iId]||'').trim():String(start+idx-1);
      const menuName=(iName!=null&&iName>=0)?String(r[iName]||'').trim():'';
      const image=String(r[iImg]||'').trim();
      const vr=_verifyImageValueReadable_(image);
      const st=(vr.status==='ok'||vr.status==='skipped')?vr.status:'broken';
      if(st==='ok')ok++; else if(st==='skipped')skipped++; else broken++;
      results.push({menuId:menuId,menuName:menuName,image:image,status:st,reason:vr.reason||''});
    });
    const next=cursor+len;
    return respond({done:next>=totalRows,cursor:(next>=totalRows?null:next),total:totalRows,ok:ok,skipped:skipped,broken:broken,results:results});
  }catch(e){return err('MIGRATION_ERROR',e&&e.message?e.message:String(e));}
}

function getMenuImageMigrationRollbackCandidates(token){
  try{
    const ss=getSpreadsheet_();
    requireAdmin(token);
    const vals=_getMigrationLogRows_(ss).rows||[];
    const items=[];
    for(let i=vals.length-1;i>=0&&items.length<200;i--){
      const r=vals[i];
      if(String(r.rollback_available||'').toLowerCase()!=='true')continue;
      if(String(r.status||'').toLowerCase()!=='migrated')continue;
      items.push({menuId:String(r.menu_id||''),menuName:String(r.menu_name||''),oldImage:String(r.old_image||''),newImage:String(r.new_image||''),targetFolderId:String(r.target_folder_id||''),migratedAt:String(r.migrated_at||'')});
    }
    return respond({total:items.length,items:items});
  }catch(e){return err('MIGRATION_ERROR',e&&e.message?e.message:String(e));}
}

function rollbackMenuImageMigration(token,options){
  const lock=LockService.getScriptLock();
  try{
    const ss=getSpreadsheet_();
    const session=requireAdmin(token)||{};
    const actor=String(session.username||session.user||session.email||session.role||'admin');
    lock.waitLock(5000);
    options=options||{};
    const mode=String(options.mode||'last_migration');
    const dryRun=!(options&&options.dryRun===false);
    const selected=(Array.isArray(options.menuIds)?options.menuIds:[]).map(function(x){return String(x||'').trim();}).filter(Boolean);
    const menuInfo=getMenuSheetAndHeaders(ss);
    if(!menuInfo)return err('MENU_NOT_FOUND','ไม่พบชีต MENU');
    const iImg=menuInfo.idx.image;
    const iId=(menuInfo.idx.id!=null)?menuInfo.idx.id:menuInfo.idx.menu_id;
    if(iImg==null||iImg<0||iId==null||iId<0)return err('MENU_SCHEMA_INVALID','คอลัมน์ MENU ไม่ครบ');
    const vals=menuInfo.sheet.getRange(2,1,Math.max(0,menuInfo.lastRow-1),menuInfo.lastCol).getValues();
    const rowMap={};
    vals.forEach(function(r,idx){rowMap[String(r[iId]||'').trim()]=2+idx;});
    const logs=_getMigrationLogRows_(ss).rows||[];
    const targets=[];
    const seen={};
    for(let i=logs.length-1;i>=0;i--){
      const r=logs[i];
      const st=String(r.status||'').toLowerCase();
      const can=String(r.rollback_available||'').toLowerCase()==='true';
      const menuId=String(r.menu_id||'').trim();
      if(!menuId||!can||st!=='migrated')continue;
      if(mode==='selected'&&selected.indexOf(menuId)===-1)continue;
      if(seen[menuId])continue;
      seen[menuId]=1;
      targets.push({menuId:menuId,menuName:String(r.menu_name||''),oldImage:String(r.old_image||''),newImage:String(r.new_image||'')});
      if(mode==='last_migration'&&targets.length>=1000)break;
    }
    let restored=0,skipped=0,failed=0;
    targets.forEach(function(t){
      const rowNum=rowMap[t.menuId];
      if(!rowNum||!t.oldImage){skipped++;return;}
      try{
        if(!dryRun)menuInfo.sheet.getRange(rowNum,iImg+1).setValue(String(t.oldImage||''));
        restored++;
        if(!dryRun){
          _appendMigrationLog_({
            id:genId('MIGRB'),
            menu_id:t.menuId,menu_name:t.menuName,old_image:t.newImage,new_image:t.oldImage,
            old_file_id:normalizeDriveFileId(t.newImage),new_file_id:normalizeDriveFileId(t.oldImage),
            target_folder_id:'',status:'rolled_back',reason:'rollback',migrated_at:new Date(),
            migrated_by:actor,rollback_available:false
          },ss);
        }
      }catch(_e){failed++;}
    });
    return respond({total:targets.length,restored:restored,skipped:skipped,failed:failed,dryRun:dryRun});
  }catch(e){return err('MIGRATION_ERROR',e&&e.message?e.message:String(e));}
  finally{try{lock.releaseLock();}catch(_){}}
}

function verifyMenuImageStorage(token){
  try{
    const ss=getSpreadsheet_();
    requireAdmin(token);
    const info=getMenuSheetAndHeaders(ss);
    if(!info)return respond({base64:0,drive:0,external:0,empty:0,total:0});
    const iImg=info.idx.image;
    if(iImg==null||iImg<0)return err('MENU_IMAGE_COLUMN_NOT_FOUND','ไม่พบคอลัมน์ image ในชีต MENU');
    const rows=info.lastRow>1?info.sheet.getRange(2,1,info.lastRow-1,info.lastCol).getValues():[];
    let base64=0,drive=0,external=0,empty=0;
    rows.forEach(function(r){
      const v=String(r[iImg]||'').trim();
      if(!v){empty++;return;}
      if(isBase64ImageDataUrl(v)){base64++;return;}
      if(normalizeDriveFileId(v)||/lh3\.googleusercontent\.com/i.test(v)||/drive\.google\.com/i.test(v)){drive++;return;}
      external++;
    });
    return respond({base64:base64,drive:drive,external:external,empty:empty,total:rows.length});
  }catch(e){return err('MIGRATION_ERROR',e&&e.message?e.message:String(e));}
}

function migrateSheetBase64MenuImagesToDrive(token,options){
  try{
    options=options||{};
    options.onlyBase64=true;
    if(options.limit==null)options.limit=10;
    return migrateMenuImagesToDrive(token,options);
  }catch(e){return err('MIGRATION_ERROR',e&&e.message?e.message:String(e));}
}

function exportOrdersPdfByDepartment(orders,token){
  try{
    _requireRateLimit('admin_export_pdf',_tokenHash(token||'na'),30,60,'ส่งออก PDF ถี่เกินไป');
    _ensureOrderDataSchema();
    requireEditor(token);
    const deliveryType=String(cfg('delivery_category_type')||'village');
    const deptLabel=deliveryType==='company'?'บริษัท':'หมู่บ้าน';
    const noteLabel=(deliveryType==='village')?'ที่อยู่จัดส่ง':'หมายเหตุ';
    const customerNoteLabel=(deliveryType==='village')?'หมายเหตุ':'หมายเหตุเพิ่มเติม';
    const list=(Array.isArray(orders)?orders:[]).filter(o=>String((o&&o.status)||'').trim().toLowerCase()!=='cancelled');
    if(!list.length)return err('NO_DATA','ไม่มีข้อมูลสำหรับ Export');
    const grouped={};
    list.forEach(o=>{
      const dept=sanitize(o&&o.department?o.department:('ไม่ระบุ'+deptLabel))||('ไม่ระบุ'+deptLabel);
      if(!grouped[dept])grouped[dept]=[];
      grouped[dept].push(o||{});
    });
    const now=new Date();
    const pad=(n)=>String(n).padStart(2,'0');
    const fileName='orders_by_department_'+now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'_'+pad(now.getHours())+pad(now.getMinutes())+'.pdf';
    // PERF-FIX: Browser-downloadable PDF via temporary Spreadsheet (no DocumentApp scope)
    const ss=SpreadsheetApp.create('Orders Export By Department');
    const depts=Object.keys(grouped).sort();
    const usedSheetNames={};
    const sanitizeSheetName=(name)=>{
      const x=String(name||deptLabel).replace(/[\\\/\?\*\[\]\:]/g,' ').trim();
      let base=(x||deptLabel).substring(0,90);
      if(!usedSheetNames[base]){usedSheetNames[base]=1;return base;}
      usedSheetNames[base]++;
      const suffix='-'+usedSheetNames[base];
      return (base.substring(0,Math.max(1,90-suffix.length))+suffix);
    };
    depts.forEach((dept,idx)=>{
      let sh;
      if(idx===0){
        sh=ss.getSheets()[0];
        sh.setName(sanitizeSheetName(dept));
      }else{
        sh=ss.insertSheet(sanitizeSheetName(dept));
      }
      const rows=grouped[dept]||[];
      const subtotal=rows.reduce((s,o)=>s+toNum(o.total||0),0);
      const data=[
        ['รายงานออเดอร์ลูกค้า (แยกตาม'+deptLabel+')','','','','','','','','','',''],
        [deptLabel,dept,'','','','','','','','',''],
        ['สร้างเมื่อ',now.toLocaleString('th-TH'),'','','','','','','','',''],
        ['จำนวนรายการ',rows.length,'ยอดรวม (บาท)',Math.round(subtotal),'','','','','','',''],
        ['','','','','','','','','','',''],
        ['#','รหัสออเดอร์','วันที่เวลา','ลูกค้า','รายการ','ตัวเลือก','ยอดรวม','วิธีชำระเงิน','สถานะ',noteLabel,customerNoteLabel]
      ];
      const stripMainOption=(v)=>String(v||'').replace(/^[^:：]+[:：]\s*/,'').trim();
      const parseOptions=(raw)=>{
        if(raw==null)return [];
        if(Array.isArray(raw))return raw.map(x=>{
          if(typeof x==='string')return stripMainOption(x);
          if(typeof x==='object'&&x)return stripMainOption(x.label||x.name||x.value||'');
          return stripMainOption(String(x||''));
        }).filter(Boolean);
        const s=String(raw||'').trim();
        if(!s)return [];
        try{
          const j=JSON.parse(s);
          if(Array.isArray(j))return parseOptions(j);
        }catch(_){}
        return s.split(',').map(x=>stripMainOption(x)).filter(Boolean);
      };
      rows.forEach((o,i)=>{
        const dt=o&&o.created_at?new Date(o.created_at):null;
        const dtTxt=dt&&!isNaN(dt.getTime())?dt.toLocaleString('th-TH'):'';
        const items=Array.isArray(o&&o.items)?o.items:[];
        const itemsTxt=items.map(it=>sanitize(String((it&&it.name)||''))+' x'+parseInt((it&&it.qty)||1)).join(', ');
        const optMap={};
        items.forEach(it=>{
          const labels=parseOptions(it&&it.options);
          const qty=Math.max(1,parseInt((it&&it.qty)||1)||1);
          labels.forEach(lb=>{optMap[lb]=(optMap[lb]||0)+qty;});
        });
        const optionsTxt=Object.keys(optMap).map(k=>sanitize(k)+(optMap[k]>1?' X'+optMap[k]:'')).join(', ');
        const payMethod=String((o&&o.payment_method)||'').toLowerCase()==='cash'?'เก็บเงินปลายทาง':'สแกนจ่าย';
        data.push([
          i+1,
          sanitize(String((o&&o.id)||'')),
          sanitize(dtTxt),
          sanitize(String((o&&o.customer)||'')),
          sanitize(itemsTxt),
          sanitize(optionsTxt),
          Math.round(toNum(o&&o.total||0)),
          sanitize(payMethod),
          sanitize(String((o&&o.status)||'')),
          sanitize(String((o&&o.note)||'')),
          sanitize(String((o&&o.customer_note)||''))
        ]);
      });
      sh.getRange(1,1,data.length,11).setValues(data);
      sh.getRange(1,1,1,11).setFontWeight('bold').setFontSize(12).setHorizontalAlignment('left');
      sh.getRange(2,1,3,1).setFontWeight('bold').setFontSize(10).setHorizontalAlignment('left');
      sh.getRange(2,2,3,3).setFontSize(10).setHorizontalAlignment('left');
      try{sh.setRowHeights(1,5,24);}catch(_){}
      sh.getRange(6,1,1,11).setFontWeight('bold').setBackground('#F1F5F9').setFontSize(10).setHorizontalAlignment('center');
      if(data.length>6){
        sh.getRange(7,1,data.length-6,11).setFontSize(10).setVerticalAlignment('top');
        sh.getRange(7,7,data.length-6,1).setHorizontalAlignment('right').setNumberFormat('#,##0');
      }
      sh.getRange(6,1,Math.max(1,data.length-5),11).setBorder(true,true,true,true,true,true,'#CBD5E1',SpreadsheetApp.BorderStyle.SOLID);
      sh.setColumnWidth(1,120);
      sh.setColumnWidth(2,190);
      sh.setColumnWidth(3,135);
      sh.setColumnWidth(4,130);
      sh.setColumnWidth(5,230);
      sh.setColumnWidth(6,210);
      sh.setColumnWidth(7,88);
      sh.setColumnWidth(8,120);
      sh.setColumnWidth(9,88);
      sh.setColumnWidth(10,170);
      sh.setColumnWidth(11,170);
      sh.getRange(1,1,5,11).setWrap(false).setVerticalAlignment('middle');
      if(data.length>6)sh.getRange(7,1,data.length-6,11).setWrap(true);
      sh.setFrozenRows(6);
    });
    SpreadsheetApp.flush();
    const exportUrl='https://docs.google.com/spreadsheets/d/'+ss.getId()+'/export?format=pdf&size=A4&portrait=false&fitw=true&sheetnames=false&printtitle=false&pagenumbers=true&gridlines=false&fzr=false&top_margin=0.45&bottom_margin=0.45&left_margin=0.35&right_margin=0.35';
    const resp=UrlFetchApp.fetch(exportUrl,{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
    if(resp.getResponseCode()!==200){
      try{DriveApp.getFileById(ss.getId()).setTrashed(true);}catch(_){}
      return err('EXPORT_FAILED','สร้างไฟล์ PDF ไม่สำเร็จ');
    }
    const pdfBlob=resp.getBlob().setName(fileName);
    const b64=Utilities.base64Encode(pdfBlob.getBytes());
    try{DriveApp.getFileById(ss.getId()).setTrashed(true);}catch(_){}
    auditLog(token,'admin_export_pdf','ส่งออก PDF ออเดอร์ตาม'+deptLabel,{orders:list.length,depts:depts.length,fileName:fileName},'info');
    return respond({fileName:fileName,base64:b64});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

// === CUSTOMER ===
function getMenu(){
  perfStart('getMenu');
  try{
    _ensureCatalogSchema();
    return respond(_getMenuData());
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('getMenu');}
}

function exportPrintPdf(orders,mode,token){
  try{
    _requireRateLimit('admin_export_print_pdf',_tokenHash(token||'na'),30,60,'ส่งออก PDF ถี่เกินไป');
    _ensureOrderDataSchema();
    requireEditor(token);
    const list=Array.isArray(orders)?orders:[];
    if(!list.length)return err('NO_DATA','ไม่มีข้อมูลสำหรับ Export');
    const printMode=String(mode||'receipt').toLowerCase()==='sticker'?'sticker':'receipt';
    const deliveryType=String(cfg('delivery_category_type')||'village');
    const deptLabel=deliveryType==='company'?'บริษัท':'หมู่บ้าน';
    const noteLabel=(deliveryType==='village')?'ที่อยู่จัดส่ง':'หมายเหตุ';
    const customerNoteLabel=(deliveryType==='village')?'หมายเหตุ':'หมายเหตุเพิ่มเติม';
    const now=new Date();
    const pad=(n)=>String(n).padStart(2,'0');
    const fileName='orders_'+printMode+'_'+now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'_'+pad(now.getHours())+pad(now.getMinutes())+'.pdf';
    const ss=SpreadsheetApp.create('Orders '+printMode.toUpperCase()+' PDF');
    const sh=ss.getSheets()[0];
    sh.setName(printMode==='receipt'?'ใบเสร็จ':'สติ๊กเกอร์');
    const parseOptions=(raw)=>{
      if(raw==null)return [];
      if(Array.isArray(raw))return raw.map(x=>{
        if(typeof x==='string')return String(x||'').replace(/^[^:：]+[:：]\s*/,'').trim();
        if(typeof x==='object'&&x)return String(x.label||x.name||x.value||'').replace(/^[^:：]+[:：]\s*/,'').trim();
        return String(x||'').replace(/^[^:：]+[:：]\s*/,'').trim();
      }).filter(Boolean);
      const s=String(raw||'').trim();
      if(!s)return [];
      try{
        const j=JSON.parse(s);
        if(Array.isArray(j))return parseOptions(j);
      }catch(_){}
      return s.split(',').map(x=>String(x||'').replace(/^[^:：]+[:：]\s*/,'').trim()).filter(Boolean);
    };
    const header=printMode==='receipt'
      ?['#','รหัสออเดอร์','วันที่เวลา','ลูกค้า',deptLabel,'วิธีชำระเงิน','รายการ','ยอดรวม',noteLabel,customerNoteLabel]
      :['#','ลูกค้า',deptLabel,'รหัสออเดอร์','รายการ','ยอดรวม','วิธีชำระเงิน',noteLabel];
    const data=[
      [printMode==='receipt'?'ไฟล์พิมพ์ใบเสร็จ':'ไฟล์พิมพ์สติ๊กเกอร์','','','','','','','','',''],
      ['สร้างเมื่อ',now.toLocaleString('th-TH'),'','','','','','','',''],
      ['จำนวนรายการ',list.length,'','','','','','','',''],
      ['','','','','','','','','',''],
      header
    ];
    list.forEach((o,i)=>{
      const dt=o&&o.created_at?new Date(o.created_at):null;
      const dtTxt=dt&&!isNaN(dt.getTime())?dt.toLocaleString('th-TH'):'';
      const items=Array.isArray(o&&o.items)?o.items:[];
      const itemTxt=items.map(it=>{
        const qty=Math.max(1,parseInt((it&&it.qty)||1,10)||1);
        const labels=parseOptions(it&&it.options);
        const optTxt=labels.length?(' ('+labels.join(', ')+')'):'';
        return String((it&&it.name)||'')+' x'+qty+optTxt;
      }).join(', ');
      const payMethod=String((o&&o.payment_method)||'').toLowerCase()==='cash'?'เก็บเงินปลายทาง':'สแกนจ่าย';
      if(printMode==='receipt'){
        data.push([
          i+1,
          String((o&&o.id)||''),
          dtTxt,
          String((o&&o.customer)||''),
          String((o&&o.department)||''),
          payMethod,
          itemTxt,
          Math.round(toNum((o&&o.total)||0)),
          String((o&&o.note)||''),
          String((o&&o.customer_note)||'')
        ]);
      }else{
        data.push([
          i+1,
          String((o&&o.customer)||''),
          String((o&&o.department)||''),
          String((o&&o.id)||''),
          itemTxt,
          Math.round(toNum((o&&o.total)||0)),
          payMethod,
          String((o&&o.note)||'')
        ]);
      }
    });
    const colCount=header.length;
    sh.getRange(1,1,data.length,colCount).setValues(data.map(r=>r.slice(0,colCount)));
    sh.getRange(1,1,1,colCount).setFontWeight('bold').setFontSize(12);
    sh.getRange(5,1,1,colCount).setFontWeight('bold').setBackground('#F1F5F9').setHorizontalAlignment('center');
    if(data.length>5){
      sh.getRange(6,1,data.length-5,colCount).setFontSize(10).setVerticalAlignment('top');
      const amountCol=printMode==='receipt'?8:6;
      sh.getRange(6,amountCol,data.length-5,1).setHorizontalAlignment('right').setNumberFormat('#,##0');
    }
    sh.getRange(5,1,Math.max(1,data.length-4),colCount).setBorder(true,true,true,true,true,true,'#CBD5E1',SpreadsheetApp.BorderStyle.SOLID);
    for(let c=1;c<=colCount;c++)sh.setColumnWidth(c,c===1?60:(c===colCount?190:150));
    SpreadsheetApp.flush();
    const exportUrl='https://docs.google.com/spreadsheets/d/'+ss.getId()+'/export?format=pdf&size=A4&portrait=true&fitw=true&sheetnames=false&printtitle=false&pagenumbers=true&gridlines=false&fzr=false&top_margin=0.45&bottom_margin=0.45&left_margin=0.35&right_margin=0.35';
    const resp=UrlFetchApp.fetch(exportUrl,{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
    if(resp.getResponseCode()!==200){
      try{DriveApp.getFileById(ss.getId()).setTrashed(true);}catch(_){}
      return err('EXPORT_FAILED','สร้างไฟล์ PDF ไม่สำเร็จ');
    }
    const pdfBlob=resp.getBlob().setName(fileName);
    const b64=Utilities.base64Encode(pdfBlob.getBytes());
    try{DriveApp.getFileById(ss.getId()).setTrashed(true);}catch(_){}
    auditLog(token,'admin_export_print_pdf','ส่งออก PDF พิมพ์'+(printMode==='receipt'?'ใบเสร็จ':'สติ๊กเกอร์'),{orders:list.length,fileName:fileName,mode:printMode},'info');
    return respond({fileName:fileName,base64:b64});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function getMenuVersion(){
  try{
    const v=_getMenuVersionStr()||'0';
    return respond({version:v});
  }
  catch(e){return respond({version:'0'});}
}

function exportPrintPdfByOrderIds(orderIds,mode,token){
  try{
    _requireRateLimit('admin_export_print_pdf_by_ids',_tokenHash(token||'na'),30,60,'ส่งออก PDF ถี่เกินไป');
    _ensureOrderDataSchema();
    requireEditor(token);
    const ids=(Array.isArray(orderIds)?orderIds:[]).map(function(x){return sanitizeText(String(x||''),80);}).filter(Boolean);
    if(!ids.length)return err('NO_DATA','ไม่มีข้อมูลสำหรับ Export');
    const idSet={};ids.forEach(function(id){idSet[id]=1;});
    const ordersMap={};
    _sheetObjects(SHEETS.ORDERS).forEach(function(o){
      const oid=String(o&&o.id||'').trim();
      if(!oid||!idSet[oid])return;
      ordersMap[oid]={
        id:oid,
        customer:String(o.customer||''),
        department:String(o.department||''),
        note:String(o.note||''),
        customer_note:String(o.customer_note||''),
        total:toNum(o.total||0),
        created_at:_normalizeDateLikeString(o.created_at),
        payment_method:'scan',
        items:[]
      };
    });
    _sheetObjects(SHEETS.PAYMENTS).forEach(function(p){
      const oid=String(p&&p.order_id||'').trim();
      if(!ordersMap[oid])return;
      const st=String(p&&p.status||'').toLowerCase();
      if(st==='cash')ordersMap[oid].payment_method='cash';
      else if(st==='paid'||st==='verified')ordersMap[oid].payment_method='scan';
    });
    _sheetObjects(SHEETS.ORDER_ITEMS).forEach(function(it){
      const oid=String(it&&it.order_id||'').trim();
      if(!ordersMap[oid])return;
      ordersMap[oid].items.push({
        name:String(it&&it.name||''),
        qty:parseInt(it&&it.qty||1,10)||1,
        price:toNum(it&&it.price||0),
        total:toNum(it&&it.total||0),
        options:String(it&&it.options||'').trim()
      });
    });
    const list=ids.map(function(id){return ordersMap[id];}).filter(Boolean);
    if(!list.length)return err('NO_DATA','ไม่พบออเดอร์สำหรับ Export');
    return exportPrintPdf(list,mode,token);
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function getOrdersVersion(token, bump){
  try{
    requireEditor(token);
    const cacheKey='fo_orders_ver_'+String(bump||'0');
    const cached=_cacheGet(cacheKey);
    if(cached&&typeof cached==='object')return respond(cached);
    const sh=getSheet(SHEETS.ORDERS);
    if(!sh)return respond({version:'0',count:0});
    const lastRow=sh.getLastRow();
    const lastCol=sh.getLastColumn();
    if(lastCol<1)return respond({version:'0',count:0});
    const headers=sh.getRange(1,1,1,lastCol).getValues()[0];
    const idCol=headers.indexOf('id');
    const tsCol=headers.indexOf('created_at');
    if(idCol<0)return respond({version:'0',count:0});
    const rowCount=lastRow-1;
    const ids=sh.getRange(2,idCol+1,rowCount,1).getValues();
    let count=0;
    let lastIdx=-1;
    for(let i=rowCount-1;i>=0;i--){
      if(String(ids[i][0]||'').trim()){
        count++;
        if(lastIdx===-1)lastIdx=i;
      }
    }
    let lastTs='';
    if(tsCol>-1&&lastIdx>-1){
      try{
        const d=sh.getRange(2+lastIdx,tsCol+1).getValue();
        lastTs=d instanceof Date?d.toISOString():String(d||'');
      }catch(_){}
    }
    const v=String(count)+'_'+lastTs+'_'+String(bump||'0');
    const result={version:v,count:count};
    // cache ไว้ 4 วินาที (น้อยกว่า poll interval 3 วินาที เพื่อให้ miss เมื่อมีออเดอร์ใหม่)
    _cachePut(cacheKey,result,4);
    return respond(result);
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function getDepartments(){
  try{
    return respond(_getDepartmentList());
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function getPromotions(){
  try{
    return respond(_getActivePromotions());
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function _getMenuVersionStr(){
  let version=String(_cacheGet(CACHE_KEYS.MENU_VERSION)||SC().get('menu_version')||'').trim();
  if(version)return version;
  const rows=_sheetRows(SHEETS.MENU);
  version=String(rows.length>1?rows.length-1:0)+'_'+String(cfg('menu_sort')||'');
  _cachePut(CACHE_KEYS.MENU_VERSION,version,300);
  try{SC().put('menu_version',version,300);}catch(_){}
  return version;
}
function _getSettingsVersionStr(){
  let version=String(_cacheGet(CACHE_KEYS.SETTINGS_VERSION)||SC().get('settings_version')||'').trim();
  if(version)return version;
  const rows=_sheetRows(SHEETS.SETTINGS);
  version=String(rows.length>1?rows.length-1:0);
  _cachePut(CACHE_KEYS.SETTINGS_VERSION,version,300);
  try{SC().put('settings_version',version,300);}catch(_){}
  return version;
}
function _getPromotionVersionStr(){
  let version=String(_cacheGet(CACHE_KEYS.PROMOTIONS_VERSION)||SC().get('promo_version')||'').trim();
  if(version)return version;
  const rows=_sheetRows(SHEETS.PROMOTIONS);
  version=String(rows.length>1?rows.length-1:0);
  _cachePut(CACHE_KEYS.PROMOTIONS_VERSION,version,300);
  try{SC().put('promo_version',version,300);}catch(_){}
  return version;
}

function _getDepartmentList(){
  const cached=_cacheGet(CACHE_KEYS.DEPARTMENTS);
  if(cached&&Array.isArray(cached))return cached;
  const raw=String(cfg('departments')||'ครัว,บัญชี,ขาย,IT,Admin');
  let list=[];
  try{
    const arr=JSON.parse(raw);
    if(Array.isArray(arr))list=arr;
  }catch(_){}
  if(!list.length)list=raw.split(',');
  const out=list.map(x=>sanitize(String(x||'').trim())).filter(Boolean);
  _cachePut(CACHE_KEYS.DEPARTMENTS,out,300);
  return out;
}

function _getPublicSettings(){
  const cached=_cacheGet(CACHE_KEYS.SETTINGS_PUBLIC);
  if(cached&&typeof cached==='object')return cached;
  const map=_settingsMap();
  const publicKeys=['departments','delivery_category_type','delivery_note_mode','restaurant_name','restaurant_logo','promptpay','promptpay_enabled','payment_timeout','cash_payment_enabled','bank_payment_enabled','payee_name','payment_banks','shop_open','shop_open_range','theme','customer_theme'];
  const safeObj={};
  publicKeys.forEach(function(k){safeObj[k]=map[k]!==undefined?map[k]:'';});
  _cachePut(CACHE_KEYS.SETTINGS_PUBLIC,safeObj,300);
  return safeObj;
}

function _getActivePromotions(){
  const cached=_cacheGet(CACHE_KEYS.PROMOTIONS);
  if(cached&&Array.isArray(cached))return cached;
  const promos=_sheetObjects(SHEETS.PROMOTIONS).filter(function(p){
    return String(p&&p.id||'').trim()&&String(p&&p.status||'active')==='active';
  }).map(function(p){
    return{
      id:String(p.id||''),
      type:String(p.type||'qty'),
      threshold:toNum(p.threshold||0),
      discount:toNum(p.discount||0),
      description:String(p.description||''),
      status:String(p.status||'active')
    };
  });
  _cachePut(CACHE_KEYS.PROMOTIONS,promos,300);
  return promos;
}

function _getMenuData(){
  perfStart('_getMenuData');
  let outCount=0;
  try{
    _ensureCatalogSchema();
    const cached=_cacheGet(CACHE_KEYS.MENU_FULL);
    if(cached&&cached.items&&cached.options){
      outCount=Array.isArray(cached.items)?cached.items.length:0;
      return cached;
    }
    // PERF: read each menu-related sheet once per request and build all outputs in O(n)
    const menuRows=_sheetRows(SHEETS.MENU);
    perfStep('_getMenuData','read_menu_rows');
    if(!menuRows.length)return {items:[],options:[],categories:[],version:_getMenuVersionStr()};
    const menuItems=_applyMenuSort(_sheetObjects(SHEETS.MENU).filter(function(m){
      return String(m&&m.id||'').trim()&&String(m&&m.status||'active')==='active';
    }));
    const activeOptions=_sheetObjects(SHEETS.OPTIONS).filter(function(o){
      return String(o&&o.id||'').trim()&&String(o&&o.status||'active')==='active';
    });
    perfStep('_getMenuData','build_menu_option_objects');
    const optionById={};
    activeOptions.forEach(function(o){optionById[String(o.id||'')]=o;});
    const parseTopicIds=function(raw){
      try{
        const arr=JSON.parse(String(raw||'[]'));
        return Array.isArray(arr)?arr.map(function(x){return String(x||'');}).filter(Boolean):[];
      }catch(_){return [];}
    };
    const normalizeOpt=function(o,menuId){
      return{
        id:String(o&&o.id||''),
        menu_id:String(menuId==null?(o&&o.menu_id||''):menuId||''),
        group_name:String(o&&o.group_name||''),
        is_required:String(o&&o.is_required||'false'),
        type:String(o&&o.type||'single'),
        choices:String(o&&o.choices||'[]'),
        status:String(o&&o.status||'active'),
        stock:normalizeStock(o&&o.stock)
      };
    };
    // PERF: include both legacy menu_id links and topic_ids links without duplicate topic groups
    const options=[];
    const seen={};
    activeOptions.forEach(function(o){
      const menuId=String(o&&o.menu_id||'').trim();
      if(!menuId)return;
      const key=String(o&&o.id||'')+'::'+menuId;
      if(seen[key])return;
      seen[key]=1;
      options.push(normalizeOpt(o,menuId));
    });
    menuItems.forEach(function(m){
      const menuId=String(m&&m.id||'').trim();
      if(!menuId)return;
      parseTopicIds(m&&m.topic_ids).forEach(function(topicId){
        const src=optionById[String(topicId||'')];
        if(!src)return;
        const key=String(src.id||'')+'::'+menuId;
        if(seen[key])return;
        seen[key]=1;
        options.push(normalizeOpt(src,menuId));
      });
    });
    const omitDescription=menuItems.length>200;
    const categoryMap={};
    const items=menuItems.map(function(m){
      const item={
        id:String(m.id||''),
        name:String(m.name||''),
        price:toNum(m.price||0),
        image:String(m.image||''),
        category:String(m.category||''),
        status:String(m.status||'active'),
        stock:normalizeStock(m.stock)
      };
      if(!omitDescription)item.description=String(m.description||'');
      if(item.category)categoryMap[item.category]=1;
      return item;
    });
    const data={
      items:items,
      options:options,
      categories:Object.keys(categoryMap).sort(),
      version:_getMenuVersionStr()
    };
    _cachePut(CACHE_KEYS.MENU_FULL,data,300);
    outCount=items.length;
    return data;
  }finally{
    perfEnd('_getMenuData',{items:outCount});
  }
}

function getInitialData(guestToken){
  perfStart('getInitialData');
  try{
    const menu=_getMenuData();
    perfStep('getInitialData','menu');
    const departments=_getDepartmentList();
    const settings=_getPublicSettings();
    const promotions=_getActivePromotions();
    perfStep('getInitialData','public_payloads');
    const menuVersion=_getMenuVersionStr();
    const settingsVersion=_getSettingsVersionStr();
    const promoVersion=_getPromotionVersionStr();
    return respond({
      menu:menu,
      departments:departments,
      settings:settings,
      promotions:promotions,
      version:menuVersion,
      menuVersion:menuVersion,
      settingsVersion:settingsVersion,
      promoVersion:promoVersion
    });
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('getInitialData');}
}

function normalizeSelectedOptions(item){
  const labels=[];
  const pushLabel=(l)=>{if(typeof l==='string'&&l.trim())labels.push(l.trim());};
  const selectedChoices=item&&item.selectedChoices;
  if(Array.isArray(selectedChoices))selectedChoices.forEach(pushLabel);
  const selectedOptionIds=item&&item.selectedOptionIds;
  if(Array.isArray(selectedOptionIds))selectedOptionIds.forEach(pushLabel);
  const opts=item&&item.options;
  if(Array.isArray(opts)){
    opts.forEach(o=>{
      if(typeof o==='string')return pushLabel(o);
      if(o&&typeof o==='object')return pushLabel(o.label||o.name||o.value||'');
    });
  }
  const uniq={};const out=[];
  labels.forEach(l=>{const k=l.toLowerCase();if(!uniq[k]){uniq[k]=1;out.push(l);}});
  return out;
}

function validatePaymentMethod(pm){
  const m=String(pm||'').toLowerCase();
  if(m==='cash')return 'cash';
  return 'scan';
}
function _calcScanPaymentAmount(total,orderId){
  const paymentAmount=round2(Math.max(0,toNum(total)));
  return {payment_amount:paymentAmount,payment_suffix:'00'};
}

function isShopWithinHours(){
  try{
    const shopOpenCfg=cfg('shop_open');
    const openRaw=String(shopOpenCfg==null?'1':shopOpenCfg).trim().toLowerCase();
    if(openRaw==='0'||openRaw==='false')return false;
    const range=String(cfg('shop_open_range')||'').trim();
    if(!range)return true;
    const parts=range.split('-');
    if(parts.length!==2)return true;
    const start=parts[0].trim(), end=parts[1].trim();
    if(!start||!end)return true;
    const now=new Date();
    const cur=now.getHours()*60+now.getMinutes();
    const sParts=start.split(':'), eParts=end.split(':');
    const sMins=parseInt(sParts[0]||0)*60+parseInt(sParts[1]||0);
    const eMins=parseInt(eParts[0]||0)*60+parseInt(eParts[1]||0);
    if(sMins<eMins) return cur>=sMins && cur<=eMins;
    return cur>=sMins || cur<=eMins; // overnight
  }catch(_){return true;}
}

function _parseChoices(raw){
  try{
    const arr=JSON.parse(String(raw||'[]'));
    if(!Array.isArray(arr))return [];
    return arr.map((x,idx)=>{
      if(typeof x==='string')return {id:'c'+idx,label:x.trim(),price:0};
      if(typeof x==='object'&&x){
        return {
          id:x.id||('c'+idx),
          label:String(x.label||x.name||'').trim(),
          price:toNum(x.price||0)
        };
      }
      return null;
    }).filter(x=>x&&x.label);
  }catch(_){return [];}
}
function _computePromoServerSide(subtotal,totalQty,promosInput){
  const promos=(Array.isArray(promosInput)?promosInput:getRowsAsObjectsCached(SHEETS.PROMOTIONS)).filter(p=>String(p.status||'')==='active');
  let discount=0;
  const applied=[];
  promos.forEach(p=>{
    const thresh=toNum(p.threshold),disc=toNum(p.discount);
    if(disc<=0||thresh<=0)return;
    if(String(p.type)==='qty'&&totalQty>=thresh){discount+=disc;applied.push(p);}
    if(String(p.type)==='spend'&&subtotal>=thresh){discount+=disc;applied.push(p);}
  });
  discount=Math.min(round2(discount),round2(subtotal));
  return {discount:discount,promos:applied};
}
function computeOrderTotalsServerSide(payload){
  if(!payload||!Array.isArray(payload.items)||!payload.items.length)throw Object.assign(new Error('ข้อมูลรายการอาหารไม่ถูกต้อง'),{code:'INVALID'});
  _perfStart('computeOrderTotalsServerSide');
  _ensureCatalogSchema();
  const menuAll=getRowsAsObjectsCached(SHEETS.MENU).filter(m=>String(m.status||'')==='active');
  const menuMap={};menuAll.forEach(m=>{menuMap[String(m.id)]=m;});
  const optionsAll=getRowsAsObjectsCached(SHEETS.OPTIONS).filter(o=>String(o.status||'')==='active');
  const globalGroups=optionsAll.filter(o=>String(o.menu_id||'')==='*');
  const byMenu=buildGroupIndex(optionsAll,'menu_id');
  const optionById={};optionsAll.forEach(function(o){optionById[String(o&&o.id||'')]=o;});
  const parseTopicIds=function(raw){
    try{
      const arr=JSON.parse(String(raw||'[]'));
      return Array.isArray(arr)?arr.map(x=>String(x||'').trim()).filter(Boolean):[];
    }catch(_){return [];}
  };
  const choicesByGroup={};
  optionsAll.forEach(g=>{choicesByGroup[String(g.id||'')]=_parseChoices(g.choices||'[]');});

  const normalizedItems=[];
  let subtotal=0;
  let totalQty=0;
  payload.items.forEach((raw,idx)=>{
    const menuId=sanitizeText(raw&&raw.menuId,80);
    if(!menuId||!menuMap[menuId])throw Object.assign(new Error('ไม่พบเมนูที่เลือก (#'+(idx+1)+')'),{code:'INVALID_MENU'});
    const menu=menuMap[menuId];
    const qty=normalizeQty(raw&&raw.qty);
    const menuStock=normalizeStock(menu&&menu.stock);
    if(menuStock===0)throw Object.assign(new Error('เมนูหมด: '+sanitizeText(menu&&menu.name,120)),{code:'OUT_OF_STOCK'});
    if(menuStock>0&&qty>menuStock)throw Object.assign(new Error('สต๊อกเมนูไม่พอ: '+sanitizeText(menu&&menu.name,120)),{code:'INSUFFICIENT_STOCK'});
    const basePrice=round2(menu.price||0);
    const selectedLabels=normalizeSelectedOptions(raw||{});
    const labelsMap={};selectedLabels.forEach(l=>{labelsMap[l.toLowerCase()]=l;});
    // PERF/FIX: include both direct menu_id groups and topic_ids-linked groups (same logic as getMenu)
    const directGroups=[].concat(byMenu[menuId]||[]).concat(globalGroups||[]);
    const linkedGroups=parseTopicIds(menu&&menu.topic_ids).map(function(topicId){return optionById[String(topicId||'')]||null;}).filter(Boolean);
    const relatedGroups=[].concat(directGroups||[]).concat(linkedGroups||[]);
    const seenGroup={};
    const selectedOptions=[];
    relatedGroups.forEach(g=>{
      const gid=String(g&&g.id||'');
      if(!gid||seenGroup[gid])return;
      seenGroup[gid]=1;
      const choices=choicesByGroup[String(g.id||'')]||[];
      const chosen=choices.filter(c=>labelsMap[c.label.toLowerCase()]);
      const isReq=String(g.is_required||'false').toLowerCase()==='true';
      const type=String(g.type||'single').toLowerCase();
      const groupStock=normalizeStock(g&&g.stock);
      if(groupStock===0&&chosen.length>0)throw Object.assign(new Error('ตัวเลือกหมด: '+sanitizeText(g.group_name,80)),{code:'OUT_OF_STOCK'});
      if(type==='single'&&chosen.length>1)throw Object.assign(new Error('เลือกตัวเลือกเกิน 1 ค่าในหัวข้อ '+sanitizeText(g.group_name,80)),{code:'INVALID_OPTION'});
      if(isReq&&groupStock===0)throw Object.assign(new Error('ตัวเลือกที่จำเป็นหมด: '+sanitizeText(g.group_name,80)),{code:'OUT_OF_STOCK'});
      if(isReq&&chosen.length===0)throw Object.assign(new Error('กรุณาเลือกตัวเลือกที่จำเป็น: '+sanitizeText(g.group_name,80)),{code:'REQUIRED_OPTION'});
      chosen.forEach(c=>{
        selectedOptions.push({
          group_id:String(g.id||''),
          group_name:sanitizeText(g.group_name,120),
          label:c.label,
          price:round2(c.price||0)
        });
      });
    });
    const optionUnitTotal=round2(selectedOptions.reduce((s,x)=>s+toNum(x.price||0),0));
    const unitPrice=round2(basePrice+optionUnitTotal);
    const lineTotal=round2(unitPrice*qty);
    subtotal=round2(subtotal+lineTotal);
    totalQty+=qty;
    normalizedItems.push({
      menuId:menuId,
      name:sanitizeText(menu.name,200),
      qty:qty,
      basePrice:basePrice,
      unitPrice:unitPrice,
      options:selectedOptions,
      total:lineTotal
    });
  });
  const promosActive=getRowsAsObjectsCached(SHEETS.PROMOTIONS).filter(p=>String(p.status||'')==='active');
  const promo=_computePromoServerSide(subtotal,totalQty,promosActive);
  const total=round2(Math.max(0,subtotal-promo.discount));
  _perfEnd('computeOrderTotalsServerSide',{items:payload.items.length,total:total});
  return {
    items:normalizedItems,
    subtotal:subtotal,
    discount:promo.discount,
    total:total,
    promo:promo.promos
  };
}
function _getPaymentTimeoutSec(){
  const raw=parseInt(cfg('payment_timeout')||'900',10);
  if(!isFinite(raw)||isNaN(raw))return 900;
  return raw<0?0:raw;
}
function _buildOrderSnapshot(payload,paymentMethod,orderIdForScan){
  const cleanCustomer=sanitizeText(payload&&payload.customer,120);
  const cleanDept=sanitizeText(payload&&payload.department,120);
  const cleanNote=sanitizeText(payload&&payload.note,500);
  const cleanCustomerNote=sanitizeText(payload&&payload.customerNote,500);
  if(!cleanCustomer)throw Object.assign(new Error('กรุณากรอกชื่อผู้สั่ง'),{code:'INVALID'});
  const computed=computeOrderTotalsServerSide(payload||{});
  const now=new Date();
  const timeoutSec=_getPaymentTimeoutSec();
  const expiresAt=timeoutSec>0?new Date(now.getTime()+timeoutSec*1000):'';
  let paymentAmount=computed.total;
  let paymentSuffix='00';
  if(validatePaymentMethod(paymentMethod)==='scan'){
    const scanAmt=_calcScanPaymentAmount(computed.total,orderIdForScan||Utilities.getUuid());
    paymentAmount=scanAmt.payment_amount;
    paymentSuffix='00';
  }
  return {
    customer:cleanCustomer,
    department:cleanDept,
    note:cleanNote,
    customer_note:cleanCustomerNote,
    payment_method:validatePaymentMethod(paymentMethod),
    items:computed.items,
    subtotal:computed.subtotal,
    discount:computed.discount,
    total:computed.total,
    payment_amount:paymentAmount,
    payment_suffix:paymentSuffix,
    promo:computed.promo,
    created_at:now,
    expires_at:expiresAt
  };
}
function _assertOrderPayable(orderId,tempData){
  if(!tempData)throw Object.assign(new Error('ไม่พบออเดอร์หรือหมดเวลา'),{code:'EXPIRED'});
  const st=String(tempData.status||'');
  if(st==='paid'||st==='done')throw Object.assign(new Error('ออเดอร์ชำระแล้ว'),{code:'ALREADY_PAID'});
  if(st==='cancelled'||st==='expired')throw Object.assign(new Error('ออเดอร์ถูกยกเลิกหรือหมดเวลา'),{code:'EXPIRED'});
  if(st!=='pending_payment'&&st!=='pending')throw Object.assign(new Error('สถานะออเดอร์ไม่พร้อมชำระเงิน'),{code:'INVALID_STATE'});
  const timeoutSec=_getPaymentTimeoutSec();
  if(timeoutSec>0){
    const baseDt=_toDate(tempData.expires_at)||_toDate(tempData.created_at);
    if(baseDt&&baseDt.getTime()<=nowMs()){
      try{_updateTempOrderStatus(orderId,'expired');}catch(_){}
      throw Object.assign(new Error('หมดเวลาชำระเงิน'),{code:'EXPIRED'});
    }
  }
}
function createTempOrder(payload){
  perfStart('createTempOrder');
  try{
    _requireRateLimit('create_temp_order','global',80,60,'คำขอสร้างออเดอร์มากเกินไป');
    _requireRateLimit('create_temp_order','customer_'+_sha256(JSON.stringify((payload&&payload.customer)||'')),12,60,'กรุณารอสักครู่แล้วลองใหม่');
    _ensureOrderDataSchema();
    if(String(cfg('promptpay_enabled')||'1')!=='1')return err('PROMPTPAY_DISABLED','ยังไม่เปิดใช้ PromptPay');
    const promptpayNumber=_normalizePromptPayNumber(cfg('promptpay')||'');
    if(!promptpayNumber)return err('PROMPTPAY_MISSING','ยังไม่ได้ตั้งค่าเลข PromptPay');
    if(!_isValidPromptPayNumber(promptpayNumber))return err('PROMPTPAY_INVALID','เลข PromptPay ต้องเป็นมือถือ 10 หลัก หรือบัตรประชาชน 13 หลัก');
    try{
      if(!payload||!payload.customer||!payload.items||!payload.items.length)return err('INVALID','ข้อมูลไม่ครบถ้วน');
      if(!isShopWithinHours())return err('SHOP_CLOSED','ร้านปิดในขณะนี้');
      const orderId=generateSafeOrderId();
      const tempData=_buildOrderSnapshot(payload,'scan',orderId);
      withRetry(()=>crud(SHEETS.TEMP_ORDERS,'insert',{
        order_id:orderId,
        customer:tempData.customer,
        department:tempData.department,
        note:tempData.note,
        customer_note:tempData.customer_note,
        subtotal:tempData.subtotal,
        discount:tempData.discount,
        total:tempData.total,
        payment_amount:tempData.payment_amount,
        payment_suffix:tempData.payment_suffix,
        payment_method:'scan',
        status:'pending_payment',
        ref1:'',
        ref2:'',
        ref3:'',
        payload:JSON.stringify(tempData),
        created_at:tempData.created_at,
        expires_at:tempData.expires_at,
        updated_at:new Date()
      }));
      perfStep('createTempOrder','save_temp_order');
      const ttlSec=Math.max(120,_getPaymentTimeoutSec()||900);
      SC().put('temp_'+orderId,JSON.stringify(tempData),ttlSec);
      SC().put('status_'+orderId,'pending_payment',TTL.STATUS);
      log('info','createTempOrder','Created: '+orderId,{total:tempData.total});
      return respond({
        orderId:orderId,
        total:tempData.total,
        payment_amount:tempData.payment_amount,
        payment_suffix:tempData.payment_suffix,
        subtotal:tempData.subtotal,
        discount:tempData.discount,
        paymentMethod:'scan',
        timeoutSec:_getPaymentTimeoutSec(),
        expiresAt:tempData.expires_at ? new Date(tempData.expires_at).toISOString() : ''
      });
    }catch(e){return err(e.code||'ERROR',e.message);}
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('createTempOrder');}
}

function createCashOrder(payload){
  perfStart('createCashOrder');
  const lock=LockService.getScriptLock();
  let notifyPayload=null;
  let out=null;
  try{
    _requireRateLimit('create_cash_order','global',50,60,'คำขอชำระเงินสดมากเกินไป');
    _ensureOrderDataSchema();
    if(!payload||!payload.customer||!payload.items||!payload.items.length)return err('INVALID','ข้อมูลไม่ครบถ้วน');
    if(!isShopWithinHours())return err('SHOP_CLOSED','ร้านปิดในขณะนี้');
    if(String(cfg('cash_payment_enabled')||'0')!=='1')return err('CASH_DISABLED','ยังไม่เปิดใช้การจ่ายเงินสด');
    lock.waitLock(15000);
    const orderId=generateSafeOrderId();
    const tempData=_buildOrderSnapshot(payload,'cash',orderId);
    const now=new Date();
    // 1. บันทึกลง ORDERS โดยตรง (status=paid) ทันที
    withRetry(()=>crud(SHEETS.ORDERS,'insert',{
      id:orderId,
      customer:tempData.customer,
      department:tempData.department,
      note:tempData.note,
      customer_note:tempData.customer_note,
      subtotal:tempData.subtotal,
      discount:tempData.discount,
      total:tempData.total,
      payment_amount:tempData.total,
      payment_suffix:'00',
      promo:JSON.stringify(tempData.promo||[]),
      status:'paid',
      created_at:now,
      updated_at:now,
      printed_count:0,
      printed_at:'',
      last_print_mode:''
    }));
    perfStep('createCashOrder','insert_order');
    // 2. บันทึกรายการอาหารลง ORDER_ITEMS
    const itemRows=(tempData.items||[]).map(function(item){
      const unitPrice=round2(item.unitPrice!=null?item.unitPrice:item.price||0);
      const qty=normalizeQty(item.qty||1);
      return{
        id:genId('OI'),
        order_id:orderId,
        menu_id:sanitize(item.menuId||''),
        name:sanitize(item.name||''),
        options:JSON.stringify(item.options||[]),
        qty:qty,
        price:unitPrice,
        total:round2(unitPrice*qty)
      };
    });
    _deductStockFromOrderItems(tempData.items || []);
    if(itemRows.length)withRetry(()=>_appendRowsByHeaders(SHEETS.ORDER_ITEMS,itemRows));
    perfStep('createCashOrder','write_items_and_stock');

    // 3. บันทึก Payment record
    withRetry(()=>crud(SHEETS.PAYMENTS,'insert',{
      id:genId('PAY'),
      order_id:orderId,
      ref_nbr:'CASH-'+orderId,
      amount:tempData.total,
      status:'cash',
      payment_method:'cash',
      ref1:'',ref2:'',ref3:'',
      verified_at:now,
      slip_trans_ref:'',slip_sender:'',
      slip_amount:tempData.total,
      slip_verified_payload_json:'',
      created_at:now
    }));
    perfStep('createCashOrder','insert_payment');
    // 4. อัปเดต cache ให้ admin เห็นทันที
    SC().put('status_'+orderId,'paid',TTL.STATUS);
    _invalidateOrdersCaches();
    notifyPayload={
      id:orderId,
      customer:tempData.customer,
      department:tempData.department,
      note:tempData.note,
      customer_note:tempData.customer_note,
      total:tempData.total,
      created_at:now,
      items:(tempData.items||[]).map(function(it){
        return {name:String(it&&it.name||''),qty:normalizeQty(it&&it.qty||1),options:it&&it.options};
      })
    };
    log('info','createCashOrder','Created and confirmed directly: '+orderId,{total:tempData.total});
    out=respond({orderId:orderId,total:tempData.total,payment_amount:tempData.total,payment_suffix:'00',subtotal:tempData.subtotal,discount:tempData.discount,paymentMethod:'cash',confirmed:true});
  }catch(e){
    out=err(e.code||'ERROR',e.message);
  }finally{
    try{lock.releaseLock();}catch(_){}
    perfEnd('createCashOrder');
  }
  if(out&&out.success&&notifyPayload){
    try{_maybeAutoCreatePrintJob(notifyPayload.id);}catch(_){}
    try{sendOrderNotification(notifyPayload);}catch(_){}
  }
  return out||err('ERROR','createCashOrder failed');
}

function checkPaymentStatus(orderId){
  try{
    _requireRateLimit('check_payment_status','global',300,60,'เรียกตรวจสถานะถี่เกินไป');
    if(!orderId)return err('INVALID','ไม่ระบุ orderId');
    orderId=sanitizeText(String(orderId),80);
    const cached=SC().get('status_'+orderId);if(cached)return respond({orderId,status:cached});
    const pay=_findLatestPaymentByOrderId(orderId);
    if(pay&&['paid','verified','cash'].indexOf(String(pay.status))>-1){SC().put('status_'+orderId,'paid',TTL.STATUS);return respond({orderId,status:'paid'});}
    const confirmed=crud(SHEETS.ORDERS,'findOne',{id:orderId});
    if(confirmed){
      const st=String(confirmed.status||'paid').toLowerCase();
      SC().put('status_'+orderId,st,TTL.STATUS);
      return respond({orderId,status:st});
    }
    const tempOrder=_getTempOrderFromSheet(orderId);
    if(tempOrder){
      let status=String(tempOrder.status||'pending_payment');
      if((status==='pending_payment'||status==='pending')&&_getPaymentTimeoutSec()>0){
        const exp=_toDate(tempOrder.expires_at)||(function(){const c=_toDate(tempOrder.created_at);return c?new Date(c.getTime()+_getPaymentTimeoutSec()*1000):null;})();
        if(exp&&exp.getTime()<=nowMs()){
          status='expired';
          try{_updateTempOrderStatus(orderId,'expired');}catch(_){}
        }
      }
      SC().put('status_'+orderId,status,Math.max(15,Math.min(60,TTL.STATUS)));return respond({orderId,status:status});
    }
    return respond({orderId,status:'unknown'});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function cancelTempOrder(orderId){
  try{
    _requireRateLimit('cancel_temp_order','global',120,60,'ยกเลิกออเดอร์ถี่เกินไป');
    if(!orderId)return err('INVALID','ไม่ระบุ orderId');
    orderId=sanitizeText(String(orderId),80);
    const cached=SC().get('status_'+orderId);if(cached==='paid')return err('ALREADY_PAID','ออเดอร์ชำระแล้ว');
    const pay=_findLatestPaymentByOrderId(orderId);
    if(pay)return err('ALREADY_PAID','ออเดอร์ชำระแล้ว');
    const confirmed=crud(SHEETS.ORDERS,'findOne',{id:orderId});
    if(confirmed)return err('ALREADY_SENT','ออเดอร์ถูกส่งให้แอดมินแล้ว ไม่สามารถยกเลิกได้');
    const temp=_getTempOrderFromSheet(orderId);
    if(!temp)return err('NOT_FOUND','ไม่พบออเดอร์');
    const st=String(temp.status||'');
    if(st==='paid'||st==='done')return err('ALREADY_PAID','ออเดอร์ชำระแล้ว');
    if(st==='cancelled'||st==='expired')return respond({cancelled:true,orderId:orderId});
    SC().remove('temp_'+orderId);SC().remove('status_'+orderId);_updateTempOrderStatus(orderId,'cancelled');
    return respond({cancelled:true,orderId});
  }catch(e){return err(e.code||'ERROR',e.message);}
}

function getOrders(filters,token){
  try{
    _requireRateLimit('admin_get_orders',_tokenHash(token||'na'),120,60,'โหลดรายการออเดอร์ถี่เกินไป');
    _ensureOrderDataSchema();
    requireAuth(token);
    perfStart('getOrders');
    filters=filters||{};
    const forceRefresh=String(filters.forceRefresh||'')==='true'||filters.forceRefresh===true||!!filters._force;
    const lite=filters.lite!==false;
    const page=Math.max(1,parseInt(filters.page||1,10)||1);
    const pageSize=Math.max(1,Math.min(200,parseInt(filters.pageSize||50,10)||50));
    const cacheKey='orders_v3_'+JSON.stringify({f:filters,lite:lite,page:page,pageSize:pageSize});
    const cached=!forceRefresh?_cacheGet(cacheKey):null;
    if(cached)return respond(cached);
    let orders=_sheetObjects(SHEETS.ORDERS).filter(function(o){return String(o&&o.id||'').trim()!=='';});
    const paymentRows=_sheetObjects(SHEETS.PAYMENTS);
    perfStep('getOrders','read_orders_payments');
    const payMap={};
    paymentRows.forEach(function(p){
      const oid=String(p&&p.order_id||'').trim();
      if(!oid)return;
      const st=String(p&&p.status||'').toLowerCase();
      const method=(st==='cash')?'cash':((st==='paid'||st==='verified')?'scan':'');
      if(!method)return;
      if(method==='cash'||!payMap[oid])payMap[oid]=method;
    });
    orders=orders.map(function(o){
      let note=String(o.note||'');
      let customerNote=String(o.customer_note||'');
      let createdAt=_normalizeDateLikeString(o.created_at);
      // PERF: auto-heal legacy rows where date leaked into note/customer_note from old test generators
      if(!createdAt){
        const fromCustomerNote=_normalizeDateLikeString(o.customer_note);
        const fromNote=_normalizeDateLikeString(o.note);
        const fromUpdated=_normalizeDateLikeString(o.updated_at);
        if(fromCustomerNote){createdAt=fromCustomerNote;customerNote='';}
        else if(fromNote){createdAt=fromNote;note='';}
        else if(fromUpdated){createdAt=fromUpdated;}
      }
      // PERF/FIX: sanitize leaked date string in note/customer_note even when created_at exists
      if(_looksLeakedDateText(note)){
        if(!createdAt){
          const fromNote2=_normalizeDateLikeString(note);
          if(fromNote2)createdAt=fromNote2;
        }
        note='';
      }
      if(_looksLeakedDateText(customerNote)){
        if(!createdAt){
          const fromCust2=_normalizeDateLikeString(customerNote);
          if(fromCust2)createdAt=fromCust2;
        }
        customerNote='';
      }
      const ts=createdAt?(new Date(createdAt).getTime()||0):0;
      return{
        id:String(o.id||''),
        customer:String(o.customer||''),
        department:String(o.department||''),
        note:note,
        customer_note:customerNote,
        subtotal:toNum(o.subtotal||0),
        discount:toNum(o.discount||0),
        total:toNum(o.total||0),
        payment_amount:toNum(o.payment_amount||o.total||0),
        payment_suffix:String(o.payment_suffix||''),
        status:String(o.status||''),
        printed_count:Math.max(0,parseInt(o.printed_count||0,10)||0),
        printed_at:_normalizeDateLikeString(o.printed_at),
        last_print_mode:String(o.last_print_mode||''),
        payment_method:String(payMap[String(o.id||'')]||''),
        created_at:createdAt,
        __ts:ts
      };
    });
    if(filters.status)orders=orders.filter(function(o){return String(o.status||'')===String(filters.status);});
    if(filters.department)orders=orders.filter(function(o){return String(o.department||'')===String(filters.department);});
    if(filters.dateFrom){
      const fromTs=new Date(filters.dateFrom).getTime();
      if(!isNaN(fromTs))orders=orders.filter(function(o){return (o.__ts||0)>=fromTs;});
    }
    if(filters.dateTo){
      const toTs=new Date(filters.dateTo).getTime();
      if(!isNaN(toTs))orders=orders.filter(function(o){return (o.__ts||0)<=toTs+86400000-1;});
    }
    if(filters.search){
      const q=String(filters.search||'').toLowerCase().trim();
      if(q)orders=orders.filter(function(o){
        return [o.id,o.customer,o.department,o.note,o.customer_note].some(function(v){
          return String(v||'').toLowerCase().indexOf(q)>-1;
        });
      });
    }
    orders.sort(function(a,b){return (b.__ts||0)-(a.__ts||0);});
    perfStep('getOrders','filter_sort');
    const total=orders.length;
    const pageItems=orders.slice((page-1)*pageSize,(page-1)*pageSize+pageSize);
    if(!lite){
      const itemRows=_sheetObjects(SHEETS.ORDER_ITEMS);
      const itemMap={};
      itemRows.forEach(function(item){
        const oid=String(item.order_id||'').trim();
        if(!oid)return;
        if(!itemMap[oid])itemMap[oid]=[];
        itemMap[oid].push({
          name:String(item.name||''),
          qty:parseInt(item.qty||1,10)||1,
          price:toNum(item.price||0),
          total:toNum(item.total||0),
          options:String(item.options||'').trim()
        });
      });
      pageItems.forEach(function(o){o.items=itemMap[String(o.id||'')]||[];});
      perfStep('getOrders','attach_items');
    }
    pageItems.forEach(function(o){delete o.__ts;});
    const payload={items:pageItems,total:total,page:page,pageSize:pageSize,lite:lite};
    _trackOrdersListCacheKey(cacheKey);
    _cachePut(cacheKey,payload,lite?15:10);
    return respond(payload);
  }catch(e){log('error','getOrders',e.message);return err(e.code||'ERROR',e.message);}
  finally{perfEnd('getOrders');}
}
function getOrderDetail(orderId,token){
  perfStart('getOrderDetail');
  try{
    _requireRateLimit('admin_get_order_detail',_tokenHash(token||'na'),140,60,'โหลดรายละเอียดออเดอร์ถี่เกินไป');
    requireAuth(token);
    const oid=sanitizeText(String(orderId||''),80);
    if(!oid)return err('INVALID','ไม่ระบุ orderId');
    const orderRaw=crud(SHEETS.ORDERS,'findOne',{id:oid});
    if(!orderRaw)return err('NOT_FOUND','ไม่พบออเดอร์');
    const cacheKey=(function(o){
      const u=String(o&&o.updated_at||o&&o.created_at||'').replace(/[^\dA-Za-z]/g,'').slice(-24)||'na';
      return 'fo_print_detail_v1_'+oid+'_'+u;
    })(orderRaw);
    const cached=_cacheGet(cacheKey);
    if(cached&&cached.id===oid)return respond(cached);
    const paymentRows=_sheetObjects(SHEETS.PAYMENTS);
    const pay=paymentRows.filter(function(p){return String(p&&p.order_id||'')===oid;}).slice(-1)[0]||null;
    const items=_sheetObjects(SHEETS.ORDER_ITEMS).filter(function(i){return String(i&&i.order_id||'')===oid;}).map(function(item){
      return{
        name:String(item.name||''),
        qty:parseInt(item.qty||1,10)||1,
        price:toNum(item.price||0),
        total:toNum(item.total||0),
        options:String(item.options||'').trim()
      };
    });
    const createdAt=_normalizeDateLikeString(orderRaw.created_at);
    const payload={
      id:String(orderRaw.id||''),
      customer:String(orderRaw.customer||''),
      department:String(orderRaw.department||''),
      note:String(orderRaw.note||''),
      customer_note:String(orderRaw.customer_note||''),
      subtotal:toNum(orderRaw.subtotal||0),
      discount:toNum(orderRaw.discount||0),
      total:toNum(orderRaw.total||0),
      payment_amount:toNum(orderRaw.payment_amount||orderRaw.total||0),
      payment_suffix:String(orderRaw.payment_suffix||''),
      status:String(orderRaw.status||''),
      printed_count:Math.max(0,parseInt(orderRaw.printed_count||0,10)||0),
      printed_at:_normalizeDateLikeString(orderRaw.printed_at),
      last_print_mode:String(orderRaw.last_print_mode||''),
      payment_method:(function(){
        const st=String(pay&&pay.status||'').toLowerCase();
        if(st==='cash')return 'cash';
        if(st==='paid'||st==='verified')return 'scan';
        return '';
      })(),
      created_at:createdAt,
      items:items
    };
    _cachePut(cacheKey,payload,20);
    return respond(payload);
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('getOrderDetail',{orderId:String(orderId||'')});}
}
function getOrderDetailsBulk(orderIds,token){
  perfStart('getOrderDetailsBulk');
  try{
    _requireRateLimit('admin_get_order_detail_bulk',_tokenHash(token||'na'),80,60,'โหลดรายละเอียดออเดอร์ถี่เกินไป');
    requireAuth(token);
    const ids=(Array.isArray(orderIds)?orderIds:[]).map(function(x){return sanitizeText(String(x||''),80);}).filter(Boolean);
    if(!ids.length)return respond({items:[]});
    const idSet={};ids.forEach(function(id){idSet[id]=1;});
    const orders=_sheetObjects(SHEETS.ORDERS).filter(function(o){return !!idSet[String(o&&o.id||'')];});
    const orderById={};orders.forEach(function(o){orderById[String(o&&o.id||'')]=o;});
    const cacheKeys={};
    const detailMap={};
    const missSet={};
    ids.forEach(function(oid){
      const o=orderById[oid];
      if(!o)return;
      const u=String(o&&o.updated_at||o&&o.created_at||'').replace(/[^\dA-Za-z]/g,'').slice(-24)||'na';
      const k='fo_print_detail_v1_'+oid+'_'+u;
      cacheKeys[oid]=k;
      const c=_cacheGet(k);
      if(c&&c.id===oid)detailMap[oid]=c;
      else missSet[oid]=1;
    });
    const payments=_sheetObjects(SHEETS.PAYMENTS);
    const lastPay={};
    payments.forEach(function(p){
      const oid=String(p&&p.order_id||'').trim();
      if(!oid||!idSet[oid])return;
      lastPay[oid]=p;
    });
    const itemMap={};
    if(Object.keys(missSet).length){
      _sheetObjects(SHEETS.ORDER_ITEMS).forEach(function(item){
        const oid=String(item&&item.order_id||'').trim();
        if(!oid||!missSet[oid])return;
        if(!itemMap[oid])itemMap[oid]=[];
        itemMap[oid].push({
          name:String(item.name||''),
          qty:parseInt(item.qty||1,10)||1,
          price:toNum(item.price||0),
          total:toNum(item.total||0),
          options:String(item.options||'').trim()
        });
      });
    }
    const out=ids.map(function(oid){
      if(detailMap[oid])return detailMap[oid];
      const o=orderById[oid];
      if(!o)return null;
      const pay=lastPay[oid]||null;
      const row={
        id:oid,
        customer:String(o.customer||''),
        department:String(o.department||''),
        note:String(o.note||''),
        customer_note:String(o.customer_note||''),
        subtotal:toNum(o.subtotal||0),
        discount:toNum(o.discount||0),
        total:toNum(o.total||0),
        payment_amount:toNum(o.payment_amount||o.total||0),
        payment_suffix:String(o.payment_suffix||''),
        status:String(o.status||''),
        printed_count:Math.max(0,parseInt(o.printed_count||0,10)||0),
        printed_at:_normalizeDateLikeString(o.printed_at),
        last_print_mode:String(o.last_print_mode||''),
        payment_method:(function(){
          const st=String(pay&&pay.status||'').toLowerCase();
          if(st==='cash')return 'cash';
          if(st==='paid'||st==='verified')return 'scan';
          return '';
        })(),
        created_at:_normalizeDateLikeString(o.created_at),
        items:itemMap[oid]||[]
      };
      if(cacheKeys[oid])_cachePut(cacheKeys[oid],row,20);
      return row;
    }).filter(Boolean);
    return respond({items:out});
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('getOrderDetailsBulk');}
}
function markOrdersPrinted(orderIds,mode,token){
  perfStart('markOrdersPrinted');
  try{
    _requireRateLimit('admin_mark_orders_printed',_tokenHash(token||'na'),200,60,'อัปเดตสถานะการพิมพ์ถี่เกินไป');
    if(String(token||'')!=='AUTO_PRINT')requireEditor(token);
    _ensureOrderDataSchema();
    const ids=Array.isArray(orderIds)?orderIds.map(function(x){return sanitizeText(String(x||''),80);}).filter(Boolean):[];
    if(!ids.length)return respond({updated:0});
    const modeVal=(String(mode||'').toLowerCase()==='sticker')?'sticker':'receipt';
    const idSet={};ids.forEach(function(id){idSet[id]=1;});
    const sh=getSheet(SHEETS.ORDERS);
    if(!sh||sh.getLastRow()<2)return respond({updated:0});
    const rows=_sheetRows(SHEETS.ORDERS);
    if(!rows.length)return respond({updated:0});
    const headers=rows[0]||[];
    const idCol=headers.indexOf('id');
    const countCol=headers.indexOf('printed_count');
    const atCol=headers.indexOf('printed_at');
    const modeCol=headers.indexOf('last_print_mode');
    if(idCol<0||countCol<0||atCol<0||modeCol<0)return err('INVALID','โครงสร้าง ORDERS ไม่รองรับสถานะการพิมพ์');
    const nowIso=(new Date()).toISOString();
    const updates=[];
    for(let i=1;i<rows.length;i++){
      const oid=String(rows[i][idCol]||'').trim();
      if(!oid||!idSet[oid])continue;
      const nextCount=Math.max(0,parseInt(rows[i][countCol]||0,10)||0)+1;
      updates.push({row:i+1,count:nextCount});
    }
    updates.forEach(function(u){
      sh.getRange(u.row,countCol+1).setValue(u.count);
      sh.getRange(u.row,atCol+1).setValue(nowIso);
      sh.getRange(u.row,modeCol+1).setValue(modeVal);
    });
    if(updates.length){
      try{
        delete __reqDataCache.rows[String(SHEETS.ORDERS)];
        delete __reqDataCache.objs[String(SHEETS.ORDERS)];
        delete __reqDataCache.idx[String(SHEETS.ORDERS)+':id'];
      }catch(_){}
      _invalidateOrdersCaches();
    }
    return respond({updated:updates.length,mode:modeVal});
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('markOrdersPrinted');}
}
function resetOrdersPrinted(orderIds,token){
  perfStart('resetOrdersPrinted');
  try{
    _requireRateLimit('admin_reset_orders_printed',_tokenHash(token||'na'),60,60,'ล้างสถานะพิมพ์ถี่เกินไป');
    requireEditor(token);
    _ensureOrderDataSchema();
    const ids=Array.isArray(orderIds)?orderIds.map(function(x){return sanitizeText(String(x||''),80);}).filter(Boolean):[];
    if(!ids.length)return respond({updated:0});
    const idSet={};ids.forEach(function(id){idSet[id]=1;});
    const sh=getSheet(SHEETS.ORDERS);
    if(!sh||sh.getLastRow()<2)return respond({updated:0});
    const rows=_sheetRows(SHEETS.ORDERS);
    if(!rows.length)return respond({updated:0});
    const headers=rows[0]||[];
    const idCol=headers.indexOf('id');
    const countCol=headers.indexOf('printed_count');
    const atCol=headers.indexOf('printed_at');
    const modeCol=headers.indexOf('last_print_mode');
    if(idCol<0||countCol<0||atCol<0||modeCol<0)return err('INVALID','โครงสร้าง ORDERS ไม่รองรับสถานะการพิมพ์');
    const updates=[];
    for(let i=1;i<rows.length;i++){
      const oid=String(rows[i][idCol]||'').trim();
      if(!oid||!idSet[oid])continue;
      updates.push(i+1);
    }
    updates.forEach(function(r){
      sh.getRange(r,countCol+1).setValue(0);
      sh.getRange(r,atCol+1).setValue('');
      sh.getRange(r,modeCol+1).setValue('');
    });
    if(updates.length){
      try{
        delete __reqDataCache.rows[String(SHEETS.ORDERS)];
        delete __reqDataCache.objs[String(SHEETS.ORDERS)];
        delete __reqDataCache.idx[String(SHEETS.ORDERS)+':id'];
      }catch(_){}
      _invalidateOrdersCaches();
    }
    auditLog(token,'admin_reset_orders_printed','ล้างสถานะพิมพ์แล้ว',{updated:updates.length},'warn');
    return respond({updated:updates.length});
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('resetOrdersPrinted');}
}
function getOrderStats(token){
  perfStart('getOrderStats');
  try{
    _requireRateLimit('admin_get_stats',_tokenHash(token||'na'),80,60,'โหลดสถิติถี่เกินไป');
    requireAuth(token);
    const statsKey='order_stats_today';
    const cached=_cacheGet(statsKey);
    if(cached)return respond(cached);
    const orders=_sheetObjects(SHEETS.ORDERS);
    const items=_sheetObjects(SHEETS.ORDER_ITEMS);
    const menuItems=_sheetObjects(SHEETS.MENU);
    const today=new Date();today.setHours(0,0,0,0);
    const todayOrders=orders.filter(o=>{const t=new Date(o.created_at);return t>=today&&['paid','cooking','done'].includes(String(o.status));});
    const totalRevenue=todayOrders.reduce((s,o)=>s+toNum(o.total),0);
    // Build menuId->name map from MENU sheet
    const menuNameMap={};menuItems.forEach(m=>{menuNameMap[String(m.id)]=String(m.name);});
    const todayOrderIds=new Set(todayOrders.map(o=>String(o.id)));
    const orderById={};orders.forEach(o=>{orderById[String(o.id)]=o;});
    const menuCount={};
    items.forEach(i=>{
      if(!todayOrderIds.has(String(i.order_id)))return;
      const o=orderById[String(i.order_id)];
      if(!o||!['paid','cooking','done'].includes(String(o.status)))return;
      const n=menuNameMap[String(i.menu_id)]||String(i.name);
      menuCount[n]=(menuCount[n]||0)+parseInt(i.qty||1);
    });
    const menuRanking=Object.entries(menuCount).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}));
    const depts={};
    todayOrders.forEach(o=>{const d=String(o.department||'?');if(!depts[d])depts[d]={department:d,count:0,total:0};depts[d].count++;depts[d].total+=toNum(o.total);});
    const payload={totalToday:todayOrders.length,totalRevenue:Math.round(totalRevenue),menuRanking,deptStats:Object.values(depts)};
    _cachePut(statsKey,payload,30);
    return respond(payload);
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('getOrderStats');}
}

function updateOrderStatus(orderId,status,token){
  perfStart('updateOrderStatus');
  try{
    _requireRateLimit('admin_update_order_status',_tokenHash(token||'na'),100,60,'เปลี่ยนสถานะออเดอร์ถี่เกินไป');
    requireEditor(token);const VALID=['pending','paid','cooking','done','cancelled'];
    if(!VALID.includes(status))return err('INVALID','สถานะไม่ถูกต้อง');
    const sid=sanitize(orderId);
    const sh=getSheet(SHEETS.ORDERS);
    if(!sh)return err('NOT_FOUND','ไม่พบออเดอร์');
    const hit=findRowByIdFast(SHEETS.ORDERS,sid);
    if(!hit||!hit.row||!hit.headers)return err('NOT_FOUND','ไม่พบออเดอร์');
    const headers=hit.headers||[];
    const statusCol=headers.indexOf('status');
    const updCol=headers.indexOf('updated_at');
    if(statusCol<0)return err('INVALID','โครงสร้าง ORDERS ไม่ถูกต้อง');
    withRetry(function(){
      sh.getRange(hit.row,statusCol+1).setValue(status);
      if(updCol>-1)sh.getRange(hit.row,updCol+1).setValue(new Date());
    });
    try{delete __reqDataCache.rows[String(SHEETS.ORDERS)];delete __reqDataCache.objs[String(SHEETS.ORDERS)];delete __reqDataCache.idx[String(SHEETS.ORDERS)+':id'];}catch(_){}
    // PERF-FIX: Invalidate order list/stat caches after status updates
    _invalidateOrdersCaches();
    auditLog(token,'admin_update_order_status','เปลี่ยนสถานะออเดอร์',{orderId:sid,status:status},'info');
    SC().remove('status_'+sid);return respond({orderId:sid,status});
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('updateOrderStatus');}
}

function bulkAcceptOrders(orderIds,token){
  perfStart('bulkAcceptOrders');
  try{
    _requireRateLimit('admin_bulk_accept_orders',_tokenHash(token||'na'),40,60,'รับออเดอร์จำนวนมากถี่เกินไป');
    requireEditor(token);
    const ids=Array.isArray(orderIds)?orderIds.map(x=>sanitize(String(x||''))).filter(Boolean):[];
    if(!ids.length)return respond({accepted:0,ids:[],skipped:0});
    const idSet={};ids.forEach(id=>{idSet[id]=1;});
    const sh=getSheet(SHEETS.ORDERS);
    if(!sh||sh.getLastRow()<2)return respond({accepted:0,ids:[],skipped:ids.length});
    const rows=sh.getDataRange().getValues();
    const headers=rows[0];
    const idCol=headers.indexOf('id');
    const statusCol=headers.indexOf('status');
    const updCol=headers.indexOf('updated_at');
    if(idCol<0||statusCol<0)return err('INVALID','โครงสร้าง ORDERS ไม่ถูกต้อง');
    const now=new Date();
    const acceptedIds=[];
    const changedRows=[];
    for(let i=1;i<rows.length;i++){
      const oid=String(rows[i][idCol]||'').trim();
      if(!oid||!idSet[oid])continue;
      const st=String(rows[i][statusCol]||'').toLowerCase();
      if(st!=='paid')continue; // รับเฉพาะออเดอร์ใหม่
      rows[i][statusCol]='cooking';
      if(updCol>-1)rows[i][updCol]=now;
      acceptedIds.push(oid);
      changedRows.push(i+1);
    }
    if(acceptedIds.length){
      const blocks=[];
      let s=changedRows[0],p=changedRows[0];
      for(let i=1;i<changedRows.length;i++){
        const cur=changedRows[i];
        if(cur===p+1){p=cur;continue;}
        blocks.push({start:s,end:p});
        s=cur;p=cur;
      }
      blocks.push({start:s,end:p});
      blocks.forEach(function(b){
        const statusVals=[];
        const updVals=[];
        for(let r=b.start;r<=b.end;r++){
          statusVals.push([rows[r-1][statusCol]]);
          if(updCol>-1)updVals.push([rows[r-1][updCol]]);
        }
        sh.getRange(b.start,statusCol+1,statusVals.length,1).setValues(statusVals);
        if(updCol>-1&&updVals.length)sh.getRange(b.start,updCol+1,updVals.length,1).setValues(updVals);
      });
      try{delete __reqDataCache.rows[String(SHEETS.ORDERS)];delete __reqDataCache.objs[String(SHEETS.ORDERS)];delete __reqDataCache.idx[String(SHEETS.ORDERS)+':id'];}catch(_){}
      _invalidateOrdersCaches();
    }
    auditLog(token,'admin_bulk_accept_orders','รับออเดอร์ทั้งหมด',{requested:ids.length,accepted:acceptedIds.length},'info');
    return respond({accepted:acceptedIds.length,ids:acceptedIds,skipped:Math.max(0,ids.length-acceptedIds.length)});
  }catch(e){return err(e.code||'ERROR',e.message);}
  finally{perfEnd('bulkAcceptOrders');}
}

function getOrderItems(orderId){
  try{
    if(!orderId)return err('INVALID','ไม่ระบุ orderId');
    const oid=sanitize(orderId);
    return respond(_sheetObjects(SHEETS.ORDER_ITEMS).filter(i=>String(i.order_id)===oid));
  }
  catch(e){return err('ERROR',e.message);}
}

// === DASHBOARD ===
function dashboardSummary(token){
  try{
    _requireRateLimit('admin_dashboard',_tokenHash(token||'na'),80,60,'โหลดข้อมูลแดชบอร์ดถี่เกินไป');
    requireAuth(token);
    const dashCached=_cacheGet(CACHE_KEYS.DASHBOARD);
    if(dashCached)return respond(dashCached);
    _perfStart('dashboardSummary');
    const today=new Date();today.setHours(0,0,0,0);const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);
    const allOrders=_sheetObjects(SHEETS.ORDERS);
    const todayMs=today.getTime();
    const tomorrowMs=tomorrow.getTime();
    const todayOrders=allOrders.filter(o=>{const t=new Date(o.created_at).getTime();return t>=todayMs&&t<tomorrowMs;});
    const revenue=todayOrders.filter(o=>['paid','cooking','done'].includes(String(o.status))).reduce((s,o)=>s+toNum(o.total),0);
    const cooking=todayOrders.filter(o=>String(o.status)==='cooking').length;
    const done=todayOrders.filter(o=>String(o.status)==='done').length;
    const allItems=_sheetObjects(SHEETS.ORDER_ITEMS);
    const mc={};allItems.forEach(i=>{mc[i.name]=(mc[i.name]||0)+parseInt(i.qty||1);});
    const topMenu=Object.entries(mc).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));
    const chart7=[];
    const dayBuckets={};
    for(let d=6;d>=0;d--){
      const dt=new Date(today);dt.setDate(dt.getDate()-d);
      const key=dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate();
      dayBuckets[key]={date:dt.getDate()+'/'+(dt.getMonth()+1),revenue:0};
    }
    allOrders.forEach(o=>{
      if(String(o.status)==='pending')return;
      const t=new Date(o.created_at);
      if(isNaN(t.getTime()))return;
      t.setHours(0,0,0,0);
      const key=t.getFullYear()+'-'+(t.getMonth()+1)+'-'+t.getDate();
      if(dayBuckets[key])dayBuckets[key].revenue+=toNum(o.total);
    });
    for(let d=6;d>=0;d--){
      const dt=new Date(today);dt.setDate(dt.getDate()-d);
      const key=dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate();
      const b=dayBuckets[key]||{date:dt.getDate()+'/'+(dt.getMonth()+1),revenue:0};
      chart7.push({date:b.date,revenue:Math.round(b.revenue||0)});
    }
    const deptMap={};
    todayOrders.filter(o=>['paid','cooking','done'].includes(String(o.status))).forEach(o=>{
      const d=o.department||'?';if(!deptMap[d])deptMap[d]={department:d,count:0,total:0};deptMap[d].count++;deptMap[d].total+=toNum(o.total);
    });
    const payload={todayCount:todayOrders.length,revenue:Math.round(revenue),cooking,done,topMenu,chart7,deptSummary:Object.values(deptMap),recentOrders:[...todayOrders].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5)};
    _cachePut(CACHE_KEYS.DASHBOARD,payload,45);
    _perfEnd('dashboardSummary',{todayCount:todayOrders.length});
    return respond(payload);
  }catch(e){log('error','dashboardSummary',e.message);return err('ERROR',e.message);}
}

function adminGetDashboardFull(token){
  try{
    _requireRateLimit('admin_dashboard_full',_tokenHash(token||'na'),60,60,'โหลดข้อมูลแดชบอร์ดถี่เกินไป');
    requireAuth(token);
    const cached=_cacheGet(CACHE_KEYS.DASHBOARD_FULL);
    if(cached)return respond(cached);
    const dash=dashboardSummary(token);
    if(!dash||!dash.success)return dash;
    const orders=getOrders({page:1,pageSize:20,lite:false},token);
    if(!orders||!orders.success)return orders;
    const stats=getOrderStats(token);
    if(!stats||!stats.success)return stats;
    const payload={dashboard:dash.data,recentOrders:orders.data,stats:stats.data};
    _cachePut(CACHE_KEYS.DASHBOARD_FULL,payload,45);
    return respond(payload);
  }catch(e){return err(e.code||'ERROR',e.message);}
}

// === CLEAR ALL ORDERS ===
function clearAllOrders(token){
  try{
    _requireRateLimit('admin_clear_orders',_tokenHash(token||'na'),5,300,'ล้างข้อมูลถี่เกินไป');
    requireEditor(token);
    const targets=[SHEETS.ORDERS,SHEETS.ORDER_ITEMS,SHEETS.PAYMENTS,SHEETS.TEMP_ORDERS];
    let cleared={};
    targets.forEach(name=>{
      const sh=getSheet(name);
      if(!sh){cleared[name]=0;return;}
      const lastRow=sh.getLastRow();
      if(lastRow<2){cleared[name]=0;return;}
      const count=lastRow-1;
      const lastCol=Math.max(1,sh.getLastColumn());
      // PERF-FIX: clear values in bulk instead of deleteRows (much faster on large sheets)
      sh.getRange(2,1,count,lastCol).clearContent();
      cleared[name]=count;
    });
    SC().remove('menu');
    SC().remove('promo');
    SC().remove('depts');
    [SHEETS.ORDERS,SHEETS.ORDER_ITEMS,SHEETS.PAYMENTS,SHEETS.TEMP_ORDERS].forEach(n=>{try{SC().remove('crud_cache_'+n);}catch(_){}});
    _invalidateOrdersCaches();
    log('warn','clearAllOrders','Cleared order data',cleared);
    auditLog(token,'admin_clear_all_orders','ล้างข้อมูลออเดอร์ทั้งหมด',cleared,'warn');
    return respond({cleared:true,details:cleared});
  }catch(e){
    log('error','clearAllOrders',e.message);
    return err(e.code||'ERROR',e.message);
  }
}

// === GENERATE TEST ORDERS ===
function generateTestOrders(token){
  try{
    // COMPAT: รองรับทั้ง signature ใหม่/เก่า
    // new:    generateTestOrders(token,count,mode)
    // legacy: generateTestOrders(count,token,mode)
    // old:    generateTestOrders(token,count)
    const args=Array.prototype.slice.call(arguments||[]);
    const normalizeSimMode=(v)=>{
      const s=String(v||'').trim().toLowerCase();
      if(s==='company'||s==='บริษัท')return 'company';
      if(s==='village'||s==='หมู่บ้าน')return 'village';
      return 'auto';
    };
    const isIntLike=(v)=>/^\d+$/.test(String(v||'').trim());
    const isModeLike=(v)=>{
      const s=String(v||'').trim().toLowerCase();
      return s==='auto'||s==='company'||s==='village'||s==='บริษัท'||s==='หมู่บ้าน';
    };
    let resolvedToken='';
    let requested=30;
    let requestedMode='auto';
    args.forEach(a=>{
      if(a===undefined||a===null)return;
      if(typeof a==='number'&&isFinite(a)){requested=parseInt(a,10);return;}
      const s=String(a).trim();
      if(!s)return;
      if(isModeLike(s)){requestedMode=normalizeSimMode(s);return;}
      if(isIntLike(s)){requested=parseInt(s,10);return;}
      if(!resolvedToken)resolvedToken=s;
    });
    token=resolvedToken||String(token||'');

    _requireRateLimit('admin_generate_test_orders',_tokenHash(token||'na'),10,300,'สร้างข้อมูลทดสอบถี่เกินไป');
    _ensureOrderDataSchema();
    requireEditor(token);
    // PERF-FIX: Batch writes for test order generation to reduce Sheets API calls
    requested=parseInt(requested,10);
    const cfgModeRaw=normalizeSimMode(cfg('delivery_category_type')||'village');
    const cfgMode=(cfgModeRaw==='auto'?'village':cfgModeRaw);
    const deliveryType=(requestedMode==='auto')?cfgMode:requestedMode;
    _ensureCatalogSchema();
    const menus=(crud(SHEETS.MENU,'getAll',{})||[]).filter(m=>String(m.status||'active')==='active'&&normalizeStock(m.stock)!==0);
    const optionsAll=(crud(SHEETS.OPTIONS,'getAll',{})||[]).filter(o=>String(o.status||'active')==='active'&&normalizeStock(o.stock)!==0);
    const depts=(String(cfg('departments')||'ครัว,บัญชี,ขาย,IT,Admin').split(',').map(s=>sanitize(s.trim())).filter(Boolean));
    const villageGroups=['โซน A','โซน B','โซน C','โซน D','โซน E','หน้าหมู่บ้าน','กลางหมู่บ้าน','ท้ายหมู่บ้าน'];
    const names=[
      'สมชาย ใจดี','สมหญิง พรใจ','อนันต์ วงศ์ดี','ชุติมา พิพัฒน์','กิตติศักดิ์ มั่นคง',
      'ปวีณา ศรีสุข','วิทยา จันทร์เพ็ญ','นฤมล ทองคำ','ธนพล วัฒนะ','รัตนา แสงงาม',
      'ภูวดล เกรียงไกร','วราภรณ์ บุญมี','พีรพล สายชล','ชลธิชา ใจงาม','ศุภชัย จิตต์ดี',
      'สุชาดา พราวพรรณ','จักรินทร์ แก้วตา','ปาริชาติ ดีพร้อม','ณัฐวุฒิ ศรีทอง','กนกวรรณ สุขใจ'
    ];
    const notes=['ไม่ใส่ผัก','ไม่เผ็ด','เผ็ดน้อย','ข้าวน้อย','เพิ่มน้ำแข็ง','', '', ''];
    const addressPartsA=['99/12','88/7','12/3','120/5','9/99','45/8','7/11'];
    const addressPartsB=['ซอยสุขใจ','ซอยพัฒนา','ซอยร่วมใจ','ซอยสมหวัง','ซอยใจดี','ซอยเพิ่มทรัพย์'];
    const addressPartsC=['ถนนสุขุมวิท','ถนนรัชดา','ถนนพหลโยธิน','ถนนเพชรเกษม','ถนนพระราม 2','ถนนแจ้งวัฒนะ'];
    const addressPartsD=['แขวงบางนา','แขวงดินแดง','แขวงจตุจักร','แขวงบางรัก','แขวงลาดพร้าว','แขวงบางเขน'];
    const addressPartsE=['เขตบางนา','เขตดินแดง','เขตลาดพร้าว','เขตหลักสี่','เขตสาทร','เขตจตุจักร'];
    const buildAddress=function(groupName){
      const p1=pick(addressPartsA,'99/1');
      const p2=pick(addressPartsB,'ซอยสุขใจ');
      const p3=pick(addressPartsC,'ถนนสุขุมวิท');
      const p4=pick(addressPartsD,'แขวงบางนา');
      const p5=pick(addressPartsE,'เขตบางนา');
      const tail=String(groupName||'').trim()?(' ('+String(groupName||'').trim()+')'):'';
      return p1+' '+p2+' '+p3+' '+p4+' '+p5+tail;
    };
    const fallbackMenus=[
      {id:'M-DEMO-1',name:'ข้าวผัด',price:55,category:'อาหาร'},
      {id:'M-DEMO-2',name:'กะเพราไก่',price:60,category:'อาหาร'},
      {id:'M-DEMO-3',name:'ชาเย็น',price:35,category:'เครื่องดื่ม'}
    ];
    const pickMenus=(menus.length?menus:fallbackMenus);
    const count=Math.max(1,Math.min(300,isNaN(requested)?30:requested));
    const nowMs=Date.now();
    const sevenDaysMs=7*24*60*60*1000;
    const randInt=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
    const pick=(arr,fallback)=>arr&&arr.length?arr[randInt(0,arr.length-1)]:fallback;
    const byMenu={};
    const optionById={};
    const parseTopicIds=(raw)=>{
      try{
        const arr=JSON.parse(String(raw||'[]'));
        return Array.isArray(arr)?arr.map(x=>String(x)).filter(Boolean):[];
      }catch(_){return [];}
    };
    const normalizeChoices=(raw)=>{
      let arr=[];
      if(Array.isArray(raw))arr=raw;
      else{
        const s=String(raw==null?'':raw).trim();
        if(!s||s==='[]')arr=[];
        else{
          try{
            const parsed=JSON.parse(s);
            arr=Array.isArray(parsed)?parsed:[];
          }catch(_){
            arr=s.split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean);
          }
        }
      }
      return (arr||[]).map(c=>{
        if(typeof c==='string')return {label:String(c).trim(),price:0};
        if(typeof c==='object'&&c){
          return {label:String(c.label||c.name||c.value||'').trim(),price:toNum(c.price||0)};
        }
        return {label:String(c||'').trim(),price:0};
      }).filter(c=>c.label);
    };
    optionsAll.forEach(o=>{
      const menuId=String(o.menu_id||'*');
      if(!byMenu[menuId])byMenu[menuId]=[];
      byMenu[menuId].push(o);
      optionById[String(o.id||'')]=o;
    });
    const menuHasTopics={};
    pickMenus.forEach(m=>{
      const mid=String(m&&m.id||'');
      const direct=(byMenu[mid]||[]).concat(byMenu['*']||[]);
      const linked=parseTopicIds(m&&m.topic_ids).map(id=>optionById[id]).filter(Boolean);
      menuHasTopics[mid]=(direct.length>0 || linked.length>0);
    });
    const menusWithTopics=pickMenus.filter(m=>menuHasTopics[String(m&&m.id||'')]);
    let createdIds=[];
    let orderRows=[];
    let itemRows=[];
    let payRows=[];
    for(let i=0;i<count;i++){
      const createdAt=new Date(nowMs-randInt(0,sevenDaysMs));
      const orderId=genId('ORD');
      const customer=pick(names,'ทดสอบลูกค้า '+(i+1));
      const department=(deliveryType==='company')?pick(depts,'Admin'):'';
      const villageGroup=pick(villageGroups,'โซน A');
      const status=pick(['paid','cooking','done'],'paid');
      const itemCount=randInt(1,3);
      let subtotal=0;
      let orderItems=[];
      for(let j=0;j<itemCount;j++){
        const m=(menusWithTopics.length&&Math.random()<0.75)?pick(menusWithTopics,menusWithTopics[0]):pick(pickMenus,pickMenus[0]);
        const qty=randInt(1,2);
        const basePrice=toNum(m.price||0)||50;
        const linkedTopics=parseTopicIds(m.topic_ids).map(id=>optionById[id]).filter(Boolean);
        const topicCandidates=(byMenu[String(m.id||'')]||[]).concat(byMenu['*']||[]).concat(linkedTopics)
          .filter((tp,idx,arr)=>arr.findIndex(x=>String(x&&x.id||'')===String(tp&&tp.id||''))===idx);
        let selectedOpts=[];
        topicCandidates.forEach(tp=>{
          const choices=normalizeChoices(tp&&tp.choices);
          if(!choices.length)return;
          const required=String(tp&&tp.is_required||'false')==='true';
          const isMulti=String(tp&&tp.type||'single')==='multi';
          const shouldPick=required || Math.random()<0.65;
          if(!shouldPick)return;
          if(isMulti){
            const pickCount=Math.min(choices.length,randInt(1,Math.min(2,choices.length)));
            const shuffled=[...choices].sort(()=>Math.random()-0.5).slice(0,pickCount);
            shuffled.forEach(c=>{
              selectedOpts.push({label:String(c.label||''),price:toNum(c.price||0)});
            });
          }else{
            const c=pick(choices,choices[0]);
            selectedOpts.push({label:String(c.label||''),price:toNum(c.price||0)});
          }
        });
        // บังคับให้มีตัวเลือกอย่างน้อย 1 รายการเมื่อเมนูนี้มีหัวข้อ
        if(!selectedOpts.length&&topicCandidates.length){
          const withChoices=topicCandidates.map(tp=>({tp:tp,choices:normalizeChoices(tp&&tp.choices)})).filter(x=>x.choices.length);
          if(withChoices.length){
            const one=pick(withChoices,withChoices[0]);
            const c=pick(one.choices,one.choices[0]);
            if(c&&c.label)selectedOpts.push({label:String(c.label),price:toNum(c.price||0)});
          }
        }
        const optAdd=selectedOpts.reduce((s,o)=>s+toNum(o.price||0),0);
        const unitPrice=basePrice+optAdd;
        const lineTotal=unitPrice*qty;
        subtotal+=lineTotal;
        orderItems.push({
          id:genId('OI'),
          order_id:orderId,
          menu_id:sanitize(m.id||''),
          name:sanitize(m.name||'เมนูทดสอบ'),
          options:JSON.stringify(selectedOpts),
          qty:qty,
          price:unitPrice,
          total:lineTotal
        });
      }
      const discount=Math.random()<0.25?randInt(5,20):0;
      const total=Math.max(0,subtotal-discount);
      const note=(deliveryType==='village')?buildAddress(villageGroup):pick(['ห้องประชุมชั้น 3','ติดต่อฝ่ายจัดซื้อ','เร่งด่วนภายในวันนี้','',''],'');
      const customerNote=(deliveryType==='village')?pick(notes,''):pick(['แพ้อาหารทะเล','ขอช้อนเพิ่ม','โทรก่อนส่ง','',''],'');
      orderItems.forEach(it=>{
        itemRows.push({
          id:it.id,
          order_id:it.order_id,
          menu_id:it.menu_id,
          name:it.name,
          options:it.options,
          qty:it.qty,
          price:it.price,
          total:it.total
        });
      });
      orderRows.push({
        id:orderId,
        customer:sanitize(customer),
        department:sanitize(department),
        note:sanitize(note),
        customer_note:sanitize(customerNote),
        subtotal:subtotal,
        discount:discount,
        total:total,
        promo:discount>0?JSON.stringify({source:'test',description:'ส่วนลดจำลอง'}):'{}',
        status:status,
        created_at:createdAt,
        updated_at:createdAt
      });
      if(status==='paid' || status==='cooking' || status==='done'){
        payRows.push({
          id:genId('PAY'),
          order_id:orderId,
          ref_nbr:'TEST-'+Math.floor(100000+Math.random()*900000),
          amount:total,
          status:'paid',
          payment_method:'scan',
          ref1:'',
          ref2:'',
          ref3:'',
          created_at:createdAt
        });
      }
      createdIds.push(orderId);
    }
    if(orderRows.length){
      withRetry(()=>_appendRowsByHeaders(SHEETS.ORDERS,orderRows));
      try{SC().remove('crud_cache_'+SHEETS.ORDERS);}catch(_){}
    }
    if(itemRows.length){
      withRetry(()=>_appendRowsByHeaders(SHEETS.ORDER_ITEMS,itemRows));
      try{SC().remove('crud_cache_'+SHEETS.ORDER_ITEMS);}catch(_){}
    }
    if(payRows.length){
      withRetry(()=>_appendRowsByHeaders(SHEETS.PAYMENTS,payRows));
      try{SC().remove('crud_cache_'+SHEETS.PAYMENTS);}catch(_){}
    }
    _invalidateOrdersCaches();
    log('info','generateTestOrders','Generated test orders',{count:createdIds.length});
    auditLog(token,'admin_generate_test_orders','สร้างออเดอร์ทดสอบ',{count:createdIds.length,mode:deliveryType,sourceMode:requestedMode},'info');
    return respond({generated:createdIds.length,orderIds:createdIds,mode:deliveryType,sourceMode:requestedMode});
  }catch(e){
    log('error','generateTestOrders',e.message);
    return err(e.code||'ERROR',e.message);
  }
}

function cleanupOldTempOrders(){
  try{
    const sh=getSheet(SHEETS.TEMP_ORDERS);if(!sh||sh.getLastRow()<2)return;
    const cutoff=new Date(Date.now()-2*3600*1000);
    const rows=sh.getDataRange().getValues();const headers=rows[0];
    const dateCol=headers.indexOf('created_at'),statusCol=headers.indexOf('status');
    // PERF-FIX: Mark expired first (avoid row-by-row delete under load)
    const toExpire=[];
    for(let i=rows.length-1;i>=1;i--){
      const rowDate=new Date(rows[i][dateCol]),rowStatus=String(rows[i][statusCol]);
      if(rowDate<cutoff&&(rowStatus==='pending'||rowStatus==='cancelled'))toExpire.push(i+1);
    }
    if(toExpire.length){
      const sorted=toExpire.slice().sort((a,b)=>a-b);
      const blocks=[];
      let start=sorted[0],prev=sorted[0];
      for(let i=1;i<sorted.length;i++){
        const cur=sorted[i];
        if(cur===prev+1){prev=cur;continue;}
        blocks.push({start:start,count:prev-start+1});
        start=cur;prev=cur;
      }
      blocks.push({start:start,count:prev-start+1});
      blocks.forEach(b=>{
        const vals=Array.from({length:b.count},()=>['expired']);
        sh.getRange(b.start,statusCol+1,b.count,1).setValues(vals);
      });
    }
    ensureWeeklyExpiredPurgeTrigger();
    log('info','cleanupOldTempOrders','Cleanup done');
  }catch(e){log('error','cleanupOldTempOrders',e.message);}
}

// PERF-FIX: Weekly purge trigger for contiguous expired row deletion
function ensureWeeklyExpiredPurgeTrigger(){
  try{
    const fn='purgeExpiredTempOrders';
    const exists=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()===fn);
    if(!exists)ScriptApp.newTrigger(fn).timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).create();
  }catch(e){log('error','ensureWeeklyExpiredPurgeTrigger',e.message);}
}

// PERF-FIX: Weekly purge using contiguous deleteRows blocks
function purgeExpiredTempOrders(){
  try{
    const sh=getSheet(SHEETS.TEMP_ORDERS);if(!sh||sh.getLastRow()<2)return;
    const rows=sh.getDataRange().getValues();const headers=rows[0];
    const statusCol=headers.indexOf('status');if(statusCol===-1)return;
    const expiredRows=[];
    for(let i=1;i<rows.length;i++){if(String(rows[i][statusCol]||'').toLowerCase()==='expired')expiredRows.push(i+1);}
    if(!expiredRows.length)return;
    const blocks=[];
    let start=expiredRows[0],prev=expiredRows[0];
    for(let i=1;i<expiredRows.length;i++){
      const cur=expiredRows[i];
      if(cur===prev+1){prev=cur;continue;}
      blocks.push({start:start,count:prev-start+1});
      start=cur;prev=cur;
    }
    blocks.push({start:start,count:prev-start+1});
    blocks.sort((a,b)=>b.start-a.start).forEach(b=>{sh.deleteRows(b.start,b.count);});
  }catch(e){log('error','purgeExpiredTempOrders',e.message);}
}

// === INIT ===
function initSheets(){
  const defs={
    MENU:['id','name','price','image','category','description','status','topic_ids','stock'],
    OPTIONS:['id','menu_id','group_name','is_required','type','choices','status','stock'],
    ORDERS:['id','customer','department','note','customer_note','subtotal','discount','total','payment_amount','payment_suffix','promo','status','created_at','updated_at','printed_count','printed_at','last_print_mode'],
    ORDER_ITEMS:['id','order_id','menu_id','name','options','qty','price','total'],
    PAYMENTS:['id','order_id','ref_nbr','amount','status','payment_method','ref1','ref2','ref3','verified_at','slip_trans_ref','slip_sender','slip_amount','slip_verified_payload_json','created_at'],
    SETTINGS:['key','value'],
    PROMOTIONS:['id','type','threshold','discount','description','status'],
    USERS:['id','username','password','role','status','password_algo','password_updated_at','failed_login_count','last_failed_login_at','locked_until'],
    TEMP_ORDERS:['order_id','customer','department','note','customer_note','subtotal','discount','total','payment_amount','payment_suffix','payment_method','status','ref1','ref2','ref3','payload','created_at','expires_at','updated_at'],
    ACTIVITY_LOGS:['created_at','level','actor','role','action','message','payload'],
    SESSIONS:['id','user_id','role','token_hash','status','created_at','expires_at','last_seen_at'],
    LOGS:['type','order_id','channel','status','message','created_at']
    ,PRINT_JOBS:['job_id','type','order_ids','status','progress','created_at','updated_at','created_by','error_message','meta_json']
  };
  Object.entries(defs).forEach(([name,headers])=>{
    let sh=SS().getSheetByName(name);
    if(!sh){sh=SS().insertSheet(name);sh.appendRow(headers);sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');}
    else{
      const existingHeaders=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
      headers.forEach(h=>{if(!existingHeaders.includes(h)){const col=sh.getLastColumn()+1;sh.getRange(1,col).setValue(h).setFontWeight('bold').setBackground('#E53935').setFontColor('#fff');}});
    }
  });
  const sSh=getSheet('SETTINGS');
  const defaultSettings=[
    ['departments','ครัว,บัญชี,ขาย,IT,Admin'],
    ['delivery_category_type','village'],
    ['delivery_note_mode','note'],
    ['restaurant_name','FoodOrder'],['restaurant_logo',''],['promptpay',''],['promptpay_enabled','1'],
    ['payment_timeout','900'],['cash_payment_enabled','0'],['bank_payment_enabled','1'],['slipok_api_key',''],['slipok_branch_id',''],
    ['payee_name',''],['payment_banks','[]'],['drive_folder_id',''],
    ['webapp_url',''],
    ['notification_line_enabled','0'],['notification_line_channel_access_token',''],['notification_line_target_type','group'],['notification_line_target_id',''],
    ['notification_telegram_enabled','0'],['notification_telegram_bot_token',''],['notification_telegram_chat_id',''],['notification_include_admin_link','0'],
    ['notification_line_last_group_id',''],['notification_line_last_user_id',''],
    ['auto_print_enabled','0'],['auto_print_type','sticker'],['auto_print_delay','0'],
    ['print_method','browser'],['bluetooth_auto_connect','0'],
    ['theme','{}'],['customer_theme','{}'],['admin_theme','{}'],['shop_open','1'],['shop_open_range','{}'],['menu_sort','[]']
  ];
  if(sSh.getLastRow()<2){defaultSettings.forEach(r=>sSh.appendRow(r));}
  else{
    const settingRows=sSh.getDataRange().getValues();const keys=settingRows.map(r=>String(r[0]));
    defaultSettings.forEach(([k,v])=>{if(!keys.includes(k))sSh.appendRow([k,v]);});
  }
  const uSh=getSheet('USERS');
  if(uSh.getLastRow()<2){
    uSh.appendRow(['U001','admin','sha256$'+_sha256('1234'),'admin','active','sha256',new Date(),0,'','']);
    uSh.appendRow(['U002','guest','sha256$'+_sha256('guest'),'guest','active','sha256',new Date(),0,'','']);
  }else{
    const users=crud(SHEETS.USERS,'getAll',{});
    const hasGuest=users.some(u=>String(u.username||'').toLowerCase()==='guest');
    if(!hasGuest)uSh.appendRow([genId('U'),'guest','sha256$'+_sha256('guest'),'guest','active','sha256',new Date(),0,'','']);
  }
  const mSh=getSheet('MENU');
  if(mSh.getLastRow()<2){
    const wid=genId('M'),rid=genId('M');
    mSh.appendRow([wid,'น้ำเปล่า',20,'','เครื่องดื่ม','','active']);
    mSh.appendRow([rid,'ข้าวผัก',50,'','อาหาร','','active']);
    const oSh2=getSheet('OPTIONS');
    if(oSh2.getLastRow()<2)oSh2.appendRow([genId('O'),rid,'ผัก','true','single',JSON.stringify(['ใส่ผัก','ไม่ใส่ผัก']),'active']);
  }
  const pSh=getSheet('PROMOTIONS');
  if(pSh.getLastRow()<2){
    pSh.appendRow([genId('PR'),'qty','3','5','ซื้อ 3 รายการ ลด 5 บาท','active']);
    pSh.appendRow([genId('PR'),'spend','150','10','ยอด 150 บาท ลด 10 บาท','active']);
  }
  SC().remove('menu');SC().remove('cfg');SC().remove('depts');
  try{SC().remove('fo_settings_public_v2');SC().remove('fo_settings_full_v2');SC().remove('fo_settings_staff_v2');}catch(_){}
  ensureActivityLogSheet();
  ensureActivityLogPurgeTrigger();
  ensurePrintQueueWorkerTrigger();
  return 'Done! เริ่มต้นระบบเรียบร้อย เข้า Admin: ?page=admin';
}

function _deductStockFromOrderItems(items){
  perfStart('_deductStockFromOrderItems');
  try{
    items=Array.isArray(items)?items:[];
    if(!items.length)return;
    const menuSheet=getSheet(SHEETS.MENU);
    const optionSheet=getSheet(SHEETS.OPTIONS);
    if(!menuSheet||!optionSheet)return;

    const menuData=_sheetRows(SHEETS.MENU);
    const optionData=_sheetRows(SHEETS.OPTIONS);
    if(menuData.length<2)return;
    const mHeader=menuData[0]||[];
    const oHeader=optionData[0]||[];
    const mId=mHeader.indexOf('id');
    const mStock=mHeader.indexOf('stock');
    const oId=oHeader.indexOf('id');
    const oStock=oHeader.indexOf('stock');
    if(mId<0||mStock<0)return;
    const menuIdx={};
    for(let i=1;i<menuData.length;i++){
      const id=String(menuData[i][mId]||'').trim();
      if(id)menuIdx[id]=i;
    }
    const optionIdx={};
    if(oId>-1){
      for(let i=1;i<optionData.length;i++){
        const id=String(optionData[i][oId]||'').trim();
        if(id)optionIdx[id]=i;
      }
    }
    perfStep('_deductStockFromOrderItems','build_index');

    const changedMenuRows={};
    const changedOptionRows={};
    items.forEach(function(item){
      const menuId=String(item&&item.menuId||item&&item.menu_id||'').trim();
      const qty=normalizeQty(item&&item.qty||1);
      const mRow=menuIdx[menuId];
      if(mRow!=null){
        const stock=normalizeStock(menuData[mRow][mStock]);
        if(stock>=0){
          if(stock<qty)throw new Error('สินค้าไม่พอ: '+menuId);
          menuData[mRow][mStock]=stock-qty;
          changedMenuRows[mRow]=1;
        }
      }
      let opts=item&&item.options||[];
      if(typeof opts==='string'){
        try{opts=JSON.parse(opts);}catch(_){opts=[];}
      }
      const deductedGroups={};
      (Array.isArray(opts)?opts:[]).forEach(function(opt){
        const groupId=String((opt&&typeof opt==='object')?(opt.group_id||opt.id||''):opt||'').trim();
        if(!groupId||deductedGroups[groupId])return;
        deductedGroups[groupId]=1;
        const oRow=optionIdx[groupId];
        if(oRow==null||oStock<0)return;
        const stock=normalizeStock(optionData[oRow][oStock]);
        if(stock>=0){
          if(stock<qty)throw new Error('ตัวเลือกไม่พอ: '+groupId);
          optionData[oRow][oStock]=stock-qty;
          changedOptionRows[oRow]=1;
        }
      });
    });
    perfStep('_deductStockFromOrderItems','deduct_memory');

    const writeStockBlocks=function(sheet,rowMap,data,stockCol){
      const rows=Object.keys(rowMap).map(function(x){return parseInt(x,10);}).filter(function(x){return isFinite(x);}).sort(function(a,b){return a-b;});
      if(!rows.length)return;
      let start=rows[0],prev=rows[0];
      const blocks=[];
      for(let i=1;i<rows.length;i++){
        const cur=rows[i];
        if(cur===prev+1){prev=cur;continue;}
        blocks.push({start:start,end:prev});
        start=cur;prev=cur;
      }
      blocks.push({start:start,end:prev});
      blocks.forEach(function(b){
        const vals=[];
        for(let r=b.start;r<=b.end;r++)vals.push([data[r][stockCol]]);
        sheet.getRange(b.start+1,stockCol+1,vals.length,1).setValues(vals);
      });
    };
    writeStockBlocks(menuSheet,changedMenuRows,menuData,mStock);
    if(oId>-1&&oStock>-1)writeStockBlocks(optionSheet,changedOptionRows,optionData,oStock);
    perfStep('_deductStockFromOrderItems','write_changed_rows');

    // PERF: invalidate all related caches so admin/customer see stock changes immediately
    try{
      SC().remove('crud_cache_'+SHEETS.MENU);
      SC().remove('crud_cache_'+SHEETS.OPTIONS);
    }catch(_){}
    try{
      delete __reqDataCache.rows[String(SHEETS.MENU)];
      delete __reqDataCache.objs[String(SHEETS.MENU)];
      delete __reqDataCache.rows[String(SHEETS.OPTIONS)];
      delete __reqDataCache.objs[String(SHEETS.OPTIONS)];
      delete __reqDataCache.idx[String(SHEETS.MENU)+':id'];
      delete __reqDataCache.idx[String(SHEETS.OPTIONS)+':id'];
    }catch(_){}
    _invalidateMenuCaches();
  }finally{
    perfEnd('_deductStockFromOrderItems');
  }
}

