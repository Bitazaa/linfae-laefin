console.log('[APP BUILD]', 'ct221b-label-20260517-clabel3');
const GasAPI = {
  async call(action,payload){
    if(!window.APP_CONFIG||!window.APP_CONFIG.API_BASE_URL||/PUT_APPS_SCRIPT_WEB_APP_URL_HERE/.test(String(window.APP_CONFIG.API_BASE_URL||''))){
      throw new Error('API_BASE_URL is not configured');
    }
    const res = await fetch(window.APP_CONFIG.API_BASE_URL,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:action,payload:payload==null?[]:payload})
    });
    let data=null;
    try{data=await res.json();}catch(_){data={success:false,message:'Invalid JSON response'};}
    if(!res.ok&&(!data||data.success!==false))data={success:false,message:'HTTP '+res.status};
    return data;
  }
};
// FoodOrder JS v6.0
var BANK_LIST=[
  {code:'002',name:'กรุงเทพ',short:'BBL',color:'#1e4d9b',logo:'https://play-lh.googleusercontent.com/hMMc2zVmhAXMy5SfTjXNvs9xHK8y8KVa3j1ruwELFYE_GnWnSWOJsGQP6YcAqpKsTQ=s48',emoji:'🏦'},
  {code:'004',name:'กสิกรไทย',short:'KBANK',color:'#138f2d',logo:'https://play-lh.googleusercontent.com/dQq2wMgB8sH3H4dYwHGc5AYJX6lfmkUyUVpqF-GLFBC2MqN9OVCQDdxFJ8-3eBaZg=s48',emoji:'💚'},
  {code:'006',name:'กรุงไทย',short:'KTB',color:'#00a0df',logo:'https://play-lh.googleusercontent.com/yt2dOLqv8f4aJVkQR1nPvZR34LnqfhvhRKXjRSFvTPOi5yY02q4cRBbFnP3xtLhG6w=s48',emoji:'❤️'},
  {code:'011',name:'ทหารไทยธนชาต',short:'TTB',color:'#ecb93a',logo:'https://play-lh.googleusercontent.com/JxMRvPEkJAIfyPWzPxMNGW3KZqwMNVbzP09HUFb7VrLMh0yf_LoWuNB2LJtV5v-8Gw=s48',emoji:'💜'},
  {code:'014',name:'ไทยพาณิชย์',short:'SCB',color:'#4e2882',logo:'https://play-lh.googleusercontent.com/IxBq6kVcUb0r5yPO9jjBSJevmWwjQ_hVz9_rp_3QXO55IYLN7BmfNJNHYK3iF9KZGQ=s48',emoji:'💛'},
  {code:'025',name:'กรุงศรี',short:'BAY',color:'#fec723',logo:'https://play-lh.googleusercontent.com/Kj6_kVhB0w9HOzqZoQwjRFZuSaGNE5u6v8m6Q6VcZkEVFiNNWKBjn_S0n5tgzV7W7A=s48',emoji:'🧡'},
  {code:'069',name:'เกียรตินาคินภัทร',short:'KKP',color:'#0a4f8a',logo:'',emoji:'🔵'},
  {code:'030',name:'ออมสิน',short:'GSB',color:'#eb198d',logo:'https://play-lh.googleusercontent.com/l-7M3y3YwQTH7P9gVPXIU1MiIeOhxvSIXCLG8mz6yCMBWvNLaqIVOD2kj1JBcvJSw=s48',emoji:'🟣'},
  {code:'033',name:'อาคารสงเคราะห์',short:'GHB',color:'#f7941e',logo:'https://play-lh.googleusercontent.com/QW7HxsKWDOZ3RhY0a2ZRCT_MZz8K4YC6cqH3qb7VVVB6m8yGS_QP4F2gBw4lbMZIA=s48',emoji:'🟠'},
  {code:'034',name:'ธ.ก.ส.',short:'BAAC',color:'#4baf4f',logo:'',emoji:'🟢'},
  {code:'022',name:'ซีไอเอ็มบีไทย',short:'CIMBT',color:'#c8102e',logo:'',emoji:'🔴'},
  {code:'067',name:'ทิสโก้',short:'TISCO',color:'#005b99',logo:'',emoji:'🔵'},
  {code:'024',name:'ยูโอบี',short:'UOBT',color:'#002e6d',logo:'',emoji:'🟦'}
];
var DEMO_MENU={items:[{id:'DEMO_M001',name:'น้ำเปล่า',price:20,category:'เครื่องดื่ม',image:'',status:'active',stock:-1},{id:'DEMO_M002',name:'ข้าวผัก',price:50,category:'อาหาร',image:'',status:'active',stock:-1}],options:[{id:'DEMO_O001',menu_id:'DEMO_M002',group_name:'ผัก',is_required:'true',type:'single',choices:JSON.stringify(['ใส่ผัก','ไม่ใส่ผัก']),status:'active',stock:-1}]};
var DEMO_DEPTS=['ครัว','บัญชี','ขาย','IT','Admin'];

var App={
  state:{
    page:'menu',menu:[],options:[],departments:[],cart:[],selectedMenu:null,
    promo:{discount:0,applied:[]},orderId:null,orderTotal:0,_paymentPayload:null,
    countdownTimer:null,countdownSec:900,_checkTimer:null,_checkCount:0,
    adminToken:null,adminRole:null,adminUser:'',adminMenuItems:[],adminPromos:[],adminUsers:[],adminTopics:[],
    _loaderDepth:0,_loaderPct:0,_loaderTick:null,_loaderMsg:'',_menuLoaded:false,_actionBusy:{},_navigating:false,
    _slipFile:null,_slipVerified:false,_topicChoices:[],_menuVersion:'0',_menuVersionTimer:null,
    _banks:[],_bankIdx:0,_payTab:'pp',_shopOpenNow:true,_shopAvailabilityTimer:null,_adminLight:false,
    _cropImg:null,_cropX:0,_cropY:0,_cropScale:1,_cropDragging:false,_cropStartX:0,_cropStartY:0,_finalImgB64:null,
    _customerMenuFilter:'all',_customerMenuSearch:'',_restaurantLogo:'',
    _storeLogoB64:null,_storeLogoSrcUrl:null,_cropSourceType:'url',_cropTarget:'menu',
    _adminCache:{},_settingsRaw:{},_settingsPublic:null,_settingsPublicAt:0,_settingsPublicLoading:false,_settingsPublicQueue:[],
    _deliveryCategoryType:'village',_deliveryNoteMode:'note',
    _cashPaymentEnabled:false,_promptpayEnabled:true,_bankPaymentEnabled:true,_paymentMethod:'scan',_payTimeoutSec:900,
    printing:{tab:'receipt',orders:[],queue:[],templates:{sticker:[],receipt:[]},selected:{sticker:{},receipt:{}},search:{sticker:'',receipt:''},page:{sticker:1,receipt:1},poller:null,method:'browser',btAutoConnect:false,lastOrdersFetchAt:0,ordersLoading:false}
  },

  u:{
    debounce(key,ms){ms=ms||800;if(App.state._actionBusy[key])return true;App.state._actionBusy[key]=true;setTimeout(function(){delete App.state._actionBusy[key];},ms);return false;},
    esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');},
    fmt(n){return '฿'+Math.round(toNum(n)).toLocaleString('th-TH');},
    digitsOnly(v){return String(v==null?'':v).replace(/[^0-9]/g,'');},
    isValidPromptPayId(v){
      var d=App.u.digitsOnly(v);
      return d.length===10||d.length===13;
    },
    formatPromptPay(v){
      var d=App.u.digitsOnly(v);
      if(d.length===10)return d.replace(/(\d{3})(\d{3})(\d{4})/,'$1-$2-$3');
      return d;
    },
    getPromptPayConfig(){
      var raw=(App.state&&App.state._settingsRaw)||{};
      var pub=(App.state&&App.state._settingsPublic)||{};
      var cfg=(typeof window!=='undefined'&&window._CFG)?window._CFG:{};
      var winPrompt=(typeof window!=='undefined'&&window._promptpay!=null)?window._promptpay:'';
      return{
        promptpay:App.u.digitsOnly(raw.promptpay||pub.promptpay||cfg.promptpay||winPrompt||''),
        payeeName:String(raw.payee_name||pub.payee_name||cfg.payee_name||'').trim()
      };
    },
    getPromptPayQrDataUrl(payload,size){
      var text=String(payload||'').trim();
      if(!text||typeof document==='undefined'||typeof QRCode==='undefined')return '';
      var px=Math.max(72,Math.min(256,parseInt(size,10)||160));
      var cacheRoot=App.state._adminCache||(App.state._adminCache={});
      var qrCache=cacheRoot.promptpayQrData||(cacheRoot.promptpayQrData={});
      var cacheKey=px+'|'+text;
      if(qrCache[cacheKey])return qrCache[cacheKey];
      var holder=null,dataUrl='';
      try{
        holder=document.createElement('div');
        holder.style.cssText='position:fixed;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;pointer-events:none;opacity:0';
        document.body.appendChild(holder);
        new QRCode(holder,{text:text,width:px,height:px,correctLevel:QRCode.CorrectLevel.M});
        var canvas=holder.querySelector('canvas');
        var img=holder.querySelector('img');
        if(canvas&&canvas.toDataURL)dataUrl=canvas.toDataURL('image/png');
        else if(img&&img.src)dataUrl=String(img.src||'');
      }catch(_){dataUrl='';}
      finally{try{if(holder&&holder.parentNode)holder.parentNode.removeChild(holder);}catch(_){}}
      if(dataUrl)qrCache[cacheKey]=dataUrl;
      return dataUrl;
    },
    buildReceiptPromptPayQrHtml(amount,opts){
      opts=opts||{};
      var cfg=App.u.getPromptPayConfig();
      var promptpay=App.u.digitsOnly(opts.promptpay||cfg.promptpay);
      if(!promptpay)return '';
      var payeeName=String(opts.payeeName!=null?opts.payeeName:(cfg.payeeName||'')).trim();
      var payload='';
      try{payload=App.customer._buildQR(promptpay,Math.round(toNum(amount)*100)/100,payeeName);}catch(_){return '';}
      var size=Math.max(72,Math.min(240,parseInt(opts.size,10)||140));
      var dataUrl=App.u.getPromptPayQrDataUrl(payload,size);
      if(!dataUrl)return '';
      var title=App.u.esc(opts.title||'สแกนจ่ายผ่าน PromptPay');
      var caption=App.u.esc(opts.caption||('PromptPay '+App.u.formatPromptPay(promptpay)));
      var payeeHtml=payeeName?'<div style="margin-top:4px;font-weight:600;color:#111">'+App.u.esc(payeeName)+'</div>':'';
      return '<div style="text-align:center;margin-top:'+(parseInt(opts.marginTopPx,10)||6)+'px"><div style="font-size:'+(parseInt(opts.titleFontPx,10)||12)+'px;font-weight:700;color:#111">'+title+'</div><img src="'+App.u.esc(dataUrl)+'" alt="PromptPay QR" style="width:'+size+'px;height:'+size+'px;display:block;margin:8px auto 0;background:#fff;border-radius:10px;padding:6px;border:1px solid #e5e7eb"><div style="margin-top:6px;font-size:'+(parseInt(opts.captionFontPx,10)||11)+'px;color:#444">'+caption+'</div>'+payeeHtml+'</div>';
    },
    optimizeDataImage:function(dataUrl,opts,done){
      opts=opts||{};
      var maxSide=Math.max(64,parseInt(opts.maxSide,10)||320);
      var quality=Math.min(0.92,Math.max(0.6,parseFloat(opts.quality)||0.82));
      var mime=String(opts.mimeType||'image/jpeg');
      var forceSquare=!!opts.forceSquare;
      if(!dataUrl||typeof done!=='function'){if(typeof done==='function')done(dataUrl||'');return;}
      try{
        var img=new Image();
        img.onload=function(){
          try{
            var w=img.naturalWidth||img.width||0,h=img.naturalHeight||img.height||0;
            if(!w||!h){done(dataUrl);return;}
            var scale=Math.min(1,maxSide/Math.max(w,h));
            var nw=Math.max(1,Math.round(w*scale)),nh=Math.max(1,Math.round(h*scale));
            var cv=document.createElement('canvas');
            if(forceSquare){
              cv.width=maxSide;cv.height=maxSide;
            }else{
              cv.width=nw;cv.height=nh;
            }
            var cx=cv.getContext('2d');
            if(forceSquare){
              cx.clearRect(0,0,cv.width,cv.height);
              var ox=Math.floor((cv.width-nw)/2);
              var oy=Math.floor((cv.height-nh)/2);
              cx.drawImage(img,ox,oy,nw,nh);
            }else{
              cx.drawImage(img,0,0,nw,nh);
            }
            var out=cv.toDataURL(mime,quality);
            done(out&&out.length?out:dataUrl);
          }catch(_){done(dataUrl);}
        };
        img.onerror=function(){done(dataUrl);};
        img.src=dataUrl;
      }catch(_){done(dataUrl);}
    },
    stockVal(v){
      var s=String(v==null?'':v).trim();
      if(!s)return -1;
      var n=parseInt(s,10);
      if(isNaN(n))return -1;
      if(n<0)return -1;
      if(n===0)return 0;
      return n;
    },
    isOutOfStock(v){return App.u.stockVal(v)===0;},
    stockText(v){
      var n=App.u.stockVal(v);
      if(n<0)return 'ไม่จำกัด';
      if(n===0)return 'หมด';
      return String(n);
    },
    localHistory(){try{return JSON.parse(localStorage.getItem('foh')||'[]');}catch(_){return[];}},
    saveHistory(orderId,data){try{var h=App.u.localHistory();var f=h.filter(function(x){return x.orderId!==orderId;});f.unshift({orderId:orderId,
        orderNo:orderNo,data:data,ts:Date.now()});localStorage.setItem('foh',JSON.stringify(f.slice(0,30)));}catch(_){}},
    btnAction:function(opts,fn){
      var dk=opts.debounceKey,dm=opts.debounceMs||1500;
      if(dk&&App.u.debounce(dk,dm))return;
      var btn=opts.btnId?document.getElementById(opts.btnId):null;
      if(btn)App.ui.setBtn(btn,true,opts.loadingText||'⏳ กำลังดำเนินการ...');
      fn(function(res){
        if(btn)App.ui.setBtn(btn,false,opts.successText||btn._orig||'บันทึก');
        if(!res||!res.success){
          App.ui.toast('✕ '+((res&&res.message)||opts.errorMsg||'เกิดข้อผิดพลาด'),'error');
          return;
        }
        if(!opts.noSuccessToast)App.ui.toast((opts.successMsg||'✅ ดำเนินการสำเร็จ'),'success');
        if(opts.modalId){
          var delay=opts.modalCloseDelay!=null?opts.modalCloseDelay:600;
          setTimeout(function(){var m=document.getElementById(opts.modalId);if(m)m.classList.remove('active');},delay);
        }
        if(opts.onSuccess)opts.onSuccess(res);
      });
    }
  },

  api:{
    call(fn,args,cb,opts){
      args=args||[];var key=opts&&opts.key;
      if(key&&App.state._actionBusy['api_'+key])return;
      if(key)App.state._actionBusy['api_'+key]=true;
      // FIX: silent:true suppresses both toasts AND the blocking loader overlay.
      // noLoader:true also suppresses the loader independently.
      var showLoader=!(opts&&(opts.silent||opts.noLoader));
      if(showLoader)App.ui.showLoader((opts&&opts.loaderText)||'กำลังประมวลผล...');
      GasAPI.call(fn,args).then(function(res){
          if(showLoader)App.ui.hideLoader();
          if(key)delete App.state._actionBusy['api_'+key];
          if(typeof res==='string'){
            var raw=String(res||'').trim();
            if(raw){
              try{
                var parsed=JSON.parse(raw);
                if(parsed&&typeof parsed==='object')res=parsed;
              }catch(_){
                if(/^<!doctype|^<html|^<head|^<body/i.test(raw)){
                  res={success:false,code:'BAD_RESPONSE',message:'เซิร์ฟเวอร์ตอบกลับเป็นหน้า HTML (กรุณาตรวจสอบการ Deploy Web App ล่าสุด)'};
                }else{
                  res={success:false,code:'BAD_RESPONSE',message:raw.substring(0,180)};
                }
              }
            }
          }
          if(typeof res!=='object'||res===null){
            res={success:false,code:'BAD_RESPONSE',message:'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง'};
          }
          if(res&&!res.success&&!(opts&&opts.silent))App.ui.toast((res.message||'เกิดข้อผิดพลาด')+(res.code?(' ['+res.code+']'):''),'error');
          if(cb)cb(res);
        }).catch(function(e){if(showLoader)App.ui.hideLoader();if(key)delete App.state._actionBusy['api_'+key];var msg=(e&&e.message)||'การเชื่อมต่อล้มเหลว';if(!(opts&&opts.silent))App.ui.toast(msg,'error');if(cb)cb({success:false,message:msg});});
    },
    callAsync:function(fn,args,opts){
      return new Promise(function(resolve){
        App.api.call(fn,args||[],function(res){resolve(res||{success:false,message:'empty response'});},opts||{});
      });
    },
    silent(fn,args,cb){GasAPI.call(fn,args||[]).then(cb||function(){}).catch(function(){if(cb)cb({success:false});});},
    _demo(fn,args){
      if(fn==='getMenu')return{success:true,data:DEMO_MENU};
      if(fn==='getInitialData')return{success:true,data:{menu:DEMO_MENU,departments:DEMO_DEPTS,settings:{restaurant_name:'FoodOrder',restaurant_logo:'',payment_banks:'[]',payment_timeout:'900',cash_payment_enabled:'0',bank_payment_enabled:'1',promptpay_enabled:'1',promptpay:'0812345678'},promotions:[],version:'0'}};
      if(fn==='adminCRUDMenu')return{success:true,data:args[0]==='getAll'?DEMO_MENU.items:args[1]||{}};
      if(fn==='getDepartments')return{success:true,data:DEMO_DEPTS};
      if(fn==='getPromotions')return{success:true,data:[]};
      if(fn==='getSettings')return{success:true,data:{restaurant_name:'FoodOrder',restaurant_logo:'',payment_banks:'[]',payment_timeout:'900',cash_payment_enabled:'0',bank_payment_enabled:'1',promptpay_enabled:'1',promptpay:'0812345678'}};
      if(fn==='createTempOrder'){var p=args[0],items=p.items||[],sub=items.reduce(function(s,i){return s+toNum(i.qty||1)*50;},0),oid='DEMO'+Date.now().toString(36).toUpperCase(),pay=Math.round(sub*100)/100;return{success:true,data:{orderId:oid,total:pay,payment_amount:pay,subtotal:sub,discount:0,paymentMethod:'scan',timeoutSec:900}};}
      if(fn==='createCashOrder'){var p2=args[0],items2=p2.items||[],sub2=items2.reduce(function(s,i){return s+toNum(i.qty||1)*50;},0),oid2='CASH'+Date.now().toString(36).toUpperCase();return{success:true,data:{orderId:oid2,total:Math.round(sub2*100)/100,subtotal:sub2,discount:0,paymentMethod:'cash',confirmed:true}};}
      if(fn==='getMenuVersion')return{success:true,data:{version:'0'}};
      if(fn==='checkPaymentStatus')return{success:true,data:{status:'pending',orderId:args[0]}};
      if(fn==='cancelTempOrder')return{success:true,data:{cancelled:true}};
      if(fn==='verifySlipOK')return{success:false,message:'SlipOK ใช้ได้เฉพาะบน Google Apps Script เท่านั้น'};
      if(fn==='adminLogin'){return{success:false,code:'NO_RUNTIME',message:'โหมดเดโมไม่รองรับการเข้าสู่ระบบผู้ดูแล'}}; 
      if(fn==='adminLoginV2'){return{success:false,code:'NO_RUNTIME',message:'โหมดเดโมไม่รองรับการเข้าสู่ระบบผู้ดูแล'}};
      if(fn==='adminGuestLogin')return{success:true,data:{token:'DEMO_TOKEN:guest',role:'guest'}};
      if(fn==='verifyAdminSession')return{success:true,data:{valid:true,role:'admin',username:'demo'}};
      if(fn==='adminLogout')return{success:true,data:{loggedOut:true}};
      if(fn==='dashboardSummary')return{success:true,data:{todayCount:0,revenue:0,cooking:0,done:0,topMenu:[],chart7:[],deptSummary:[],recentOrders:[]}};
      if(fn==='getOrderStats')return{success:true,data:{totalToday:0,menuRanking:[],deptStats:[]}};
      if(fn==='getOrders')return{success:true,data:{items:[],total:0,page:1,pageSize:50,lite:false}};
      if(fn==='getOrderDetailsBulk')return{success:true,data:{items:[]}};
      if(fn==='exportPrintPdfByOrderIds')return{success:false,message:'โหมด Demo ยังไม่รองรับการสร้าง PDF'};
      if(fn==='getPrintTemplates')return{success:true,data:{sticker:[{id:'sticker_default',name:'Sticker Default'}],receipt:[{id:'receipt_80',name:'Receipt 80mm'}]}};
      if(fn==='getPrintJobs')return{success:true,data:[{jobId:'JOB-DEMO-001',type:'sticker',total_items:3,created_at:new Date().toISOString(),status:'pending',progress:0,orderIds:['DEMO1','DEMO2','DEMO3']}]};
      if(fn==='createPrintJob')return{success:true,data:{jobId:'JOB-DEMO-'+Date.now(),status:'pending',type:(args[0]&&args[0].type)||'sticker',total_items:((args[0]&&args[0].orderIds)||[]).length}};
      if(fn==='processPrintJob')return{success:true,data:{jobId:args[0],status:'done',progress:100}};
      if(fn==='updatePrintJobStatus')return{success:true,data:{jobId:args[0],status:args[1],progress:(args[3]&&args[3].progress)||0}};
      if(fn==='adminCRUDMenu')return{success:true,data:args[1]||[]};
      if(fn==='adminCRUDOption')return{success:true,data:args[1]||[]};
      if(fn==='adminCRUDPromotion')return{success:true,data:args[1]||[]};
      if(fn==='getUsers')return{success:true,data:[{id:'U001',username:'admin',role:'admin',status:'active'},{id:'U002',username:'guest',role:'guest',status:'active'}]};
      if(fn==='updateAdminUser')return{success:true,data:{username:args[0]&&args[0].username}};
      if(fn==='deleteAdminUser')return{success:true,data:{deleted:true,id:args[0]}};
      if(fn==='saveSettings')return{success:true,data:{saved:true}};
      if(fn==='getNotificationSettings')return{success:true,data:{
        notification_line_enabled:'0',
        notification_line_channel_access_token_masked:'',
        notification_line_target_type:'group',
        notification_line_target_id:'',
        notification_telegram_enabled:'0',
        notification_telegram_bot_token_masked:'',
        notification_telegram_chat_id:''
      }};
      if(fn==='saveNotificationSettings')return{success:true,data:{saved:true}};
      if(fn==='testLineNotification')return{success:true,data:{ok:true,message:'โหมดเดโม: ส่ง LINE สำเร็จ'}};
      if(fn==='testTelegramNotification')return{success:true,data:{ok:true,message:'โหมดเดโม: ส่ง Telegram สำเร็จ'}};
      if(fn==='getLatestLineWebhookIds')return{success:true,data:{notification_line_last_group_id:'C_DEMO_GROUP_ID',notification_line_last_user_id:'U_DEMO_USER_ID'}};
      if(fn==='testSlipOKConnection')return{success:true,data:{ok:true,message:'โหมดเดโม: SlipOK พร้อมใช้งาน'}};
      if(fn==='testGoogleDriveConnection')return{success:true,data:{ok:true,message:'โหมดเดโม: Google Drive พร้อมใช้งาน'}};
      if(fn==='saveMenuOrder')return{success:true,data:{saved:true}};
      if(fn==='getGuestLoginState')return{success:true,data:{enabled:true}};
      if(fn==='updateOrderStatus')return{success:true,data:{orderId:args[0],status:args[1]}};
      if(fn==='resetOrdersPrinted'){var ids2=Array.isArray(args[0])?args[0]:[];return{success:true,data:{updated:ids2.length}};}
      if(fn==='bulkAcceptOrders'){var ids=Array.isArray(args[0])?args[0]:[];return{success:true,data:{accepted:ids.length,ids:ids,skipped:0}};}
      if(fn==='exportOrdersPdfByDepartment')return{success:false,message:'โหมด Demo ยังไม่รองรับการสร้าง PDF'};
      return null;
    }
  },

  ui:{
    _popupTimer:null,
    _confirmBusy:false,
    toast(msg,type){
      type=type||'info';
      var ov=document.getElementById('center-popup-overlay');
      var icon=document.getElementById('center-popup-icon');
      var txt=document.getElementById('center-popup-text');
      if(!ov||!icon||!txt)return;
      ov.classList.toggle('customer-mode',App.ui._isCustomerContext());
      var map={success:{i:'✓',c:'#22c55e'},error:{i:'✕',c:'#ef4444'},warn:{i:'⚠',c:'#f59e0b'},info:{i:'ℹ',c:'#38bdf8'}};
      var m=map[type]||map.info;
      icon.textContent=m.i;icon.style.color=m.c;
      txt.textContent=String(msg||'');
      ov.classList.add('active');
      if(App.ui._popupTimer)clearTimeout(App.ui._popupTimer);
      App.ui._popupTimer=setTimeout(function(){ov.classList.remove('active');ov.classList.remove('customer-mode');},1700);
    },
    confirm:function(msg,cb,opts){
      opts=opts||{};
      if(App.ui._confirmBusy)return;
      App.ui._confirmBusy=true;
      var ov=document.getElementById('confirm-popup-overlay');
      var txt=document.getElementById('confirm-popup-text');
      var ok=document.getElementById('confirm-popup-ok');
      var cancel=document.getElementById('confirm-popup-cancel');
      if(!ov||!txt||!ok||!cancel){App.ui._confirmBusy=false;cb&&cb(window.confirm(String(msg||'ยืนยันการทำรายการ?')));return;}
      txt.textContent=String(msg||'ยืนยันการทำรายการ?');
      ok.textContent=opts.okText||'ตกลง';
      cancel.textContent=opts.cancelText||'ยกเลิก';
      cancel.style.display=opts.hideCancel?'none':'';
      var done=function(v){
        ov.classList.remove('active');
        ok.onclick=null;cancel.onclick=null;
        ov.onclick=null;
        cancel.style.display='';
        App.ui._confirmBusy=false;
        if(cb)cb(!!v);
      };
      ok.onclick=function(){done(true);};
      cancel.onclick=function(){done(false);};
      ov.onclick=function(e){
        if(e.target!==ov)return;
        if(opts.disableBackdropClose)return;
        done(false);
      };
      ov.classList.toggle('customer-mode',App.ui._isCustomerContext());
      ov.classList.add('active');
    },
    _setLoaderUI:function(pct,msg){
      var n=Math.max(0,Math.min(100,parseInt(pct||0,10)||0));
      var bar=document.getElementById('action-lock-bar');
      var pe=document.getElementById('action-lock-percent');
      var tt=document.getElementById('action-lock-title');
      if(bar)bar.style.width=n+'%';
      if(pe)pe.textContent=n+'%';
      if(tt)tt.textContent=String(msg||App.state._loaderMsg||'กำลังประมวลผล...');
    },
    _isCustomerContext:function(){
      if(window._isAdmin===true)return false;
      var adminMain=document.getElementById('admin-main');
      if(adminMain&&!adminMain.classList.contains('hidden'))return false;
      return true;
    },
    showLoader:function(msg){
      App.state._loaderDepth=Math.max(0,App.state._loaderDepth)+1;
      if(msg)App.state._loaderMsg=String(msg);
      var gl=document.getElementById('global-loader');
      if(gl)gl.classList.add('active');
      if(App.state._loaderDepth>1){
        App.ui._setLoaderUI(Math.max(1,App.state._loaderPct||0),App.state._loaderMsg);
        return;
      }
      App.state._loaderPct=0;
      App.ui._setLoaderUI(0,App.state._loaderMsg||'กำลังประมวลผล...');
      var ov=document.getElementById('action-lock-overlay');
      if(ov){
        ov.classList.toggle('customer-mode',App.ui._isCustomerContext());
        ov.classList.add('active');
      }
      document.body.classList.add('ui-busy');
      if(App.state._loaderTick)clearInterval(App.state._loaderTick);
      App.state._loaderTick=setInterval(function(){
        var step=App.state._loaderPct<60?(Math.random()*7+2):(Math.random()*3+1);
        App.state._loaderPct=Math.min(95,App.state._loaderPct+step);
        App.ui._setLoaderUI(App.state._loaderPct,App.state._loaderMsg);
      },180);
    },
    hideLoader:function(){
      App.state._loaderDepth=Math.max(0,App.state._loaderDepth-1);
      if(App.state._loaderDepth>0)return;
      if(App.state._loaderTick){clearInterval(App.state._loaderTick);App.state._loaderTick=null;}
      App.state._loaderPct=100;
      App.ui._setLoaderUI(100,App.state._loaderMsg||'เสร็จสิ้น');
      var gl=document.getElementById('global-loader');
      var ov=document.getElementById('action-lock-overlay');
      setTimeout(function(){
        if(gl)gl.classList.remove('active');
        if(ov){ov.classList.remove('active');ov.classList.remove('customer-mode');}
        document.body.classList.remove('ui-busy');
        App.state._loaderPct=0;
        App.state._loaderMsg='';
        App.ui._setLoaderUI(0,'กำลังประมวลผล...');
      },220);
    },
    setBtn(el,loading,text){if(!el)return;if(loading){el.disabled=true;el.classList.add('loading');if(!el._orig)el._orig=el.textContent;}else{el.disabled=false;el.classList.remove('loading');el.textContent=text||el._orig||el.textContent;}},
    nav(page){
      if(App.state._navigating&&page!=='menu'&&page!=='admin')return;
      App.state._navigating=true;setTimeout(function(){App.state._navigating=false;},300);
      document.querySelectorAll('#customer-app .page').forEach(function(p){p.classList.remove('active');});
      var pg=document.getElementById('page-'+page);if(pg)pg.classList.add('active');
      App.state.page=page;window.scrollTo(0,0);
      if(page==='menu'){if(!App.state._menuLoaded)App.customer.loadMenu();App.customer.startMenuVersionPoll();}else{App.customer.stopMenuVersionPoll();}
      if(page==='cart')App.customer.renderCart();
      if(page==='info'){App.customer.fillDepts();App.customer.renderCart();App.customer.renderInfoPreview();App.customer.applyPaymentMethodUI();}
      if(page==='history')App.customer.renderHistory();
    },
    adminNav(page){
      if(page!=='printing'&&App.admin&&typeof App.admin.dockLegacyPrintToModal==='function'){
        App.admin.dockLegacyPrintToModal();
      }
      if(page!=='orders'&&App.admin&&typeof App.admin._stopOrdersAutoRefresh==='function'){
        App.admin._stopOrdersAutoRefresh();
      }
      if(page!=='menu'&&App.admin&&typeof App.admin._stopMenuLiveRefresh==='function'){
        App.admin._stopMenuLiveRefresh();
      }
      if(page!=='printing'&&App.admin&&typeof App.admin.stopPrintingPoll==='function'){
        App.admin.stopPrintingPoll();
      }
      document.querySelectorAll('.admin-page').forEach(function(p){p.classList.remove('active');});
      document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
      var pg=document.getElementById('apg-'+page);if(pg)pg.classList.add('active');
      var ni=document.querySelector('[data-page="'+page+'"]');if(ni)ni.classList.add('active');
      var titles={menu:'🍱 จัดการเมนู',topics:'🏷 ตัวเลือก',promotions:'🎉 โปรโมชัน',printing:'🖨 พิมพ์ใบเสร็จ/สติ๊กเกอร์',notifications:'🔔 แจ้งเตือน',settings:'⚙️ ตั้งค่า',orders:'📦 ออเดอร์'};
      var te=document.getElementById('admin-page-title');if(te)te.textContent=titles[page]||page;
      App.admin.loadPage(page);if(window.innerWidth<768)App.admin.closeSidebar();
    }
  },

  customer:{
    _ensureRuntimeSettings:function(cb,opts){
      opts=opts||{};
      var maxAgeMs=opts.maxAgeMs||60000;
      var force=!!opts.force;
      var now=Date.now();
      var cached=App.state._settingsPublic;
      if(!force&&cached&&App.state._settingsPublicAt&&(now-App.state._settingsPublicAt<maxAgeMs)){
        if(cb)cb(cached,true);
        return;
      }
      if(App.state._settingsPublicLoading){
        if(cb)App.state._settingsPublicQueue.push(cb);
        return;
      }
      App.state._settingsPublicLoading=true;
      if(cb)App.state._settingsPublicQueue.push(cb);
      App.api.silent('getSettings',[],function(res){
        var data=(res&&res.success&&res.data)?res.data:(cached||null);
        if(res&&res.success&&res.data){
          App.state._settingsPublic=res.data;
          App.state._settingsPublicAt=Date.now();
        }
        var queued=(App.state._settingsPublicQueue||[]).slice();
        App.state._settingsPublicQueue=[];
        App.state._settingsPublicLoading=false;
        queued.forEach(function(fn){
          try{fn(data,!(res&&res.success&&res.data));}catch(_){}
        });
      });
    },
    _normalizeTimeoutSec:function(v){
      var n=parseInt(v,10);
      if(isNaN(n))n=900;
      return n;
    },
    _setPaymentTimeout:function(v){
      var n=App.customer._normalizeTimeoutSec(v);
      App.state._payTimeoutSec=n;
      window._payTimeout=n;
      App.customer._updatePaymentCountdownUI();
    },
    _isPromptPayEnabled:function(){
      return !!App.state._promptpayEnabled;
    },
    _isBankPaymentEnabled:function(){
      return !!App.state._bankPaymentEnabled;
    },
    _hasBankAccounts:function(){
      return Array.isArray(App.state._banks)&&App.state._banks.length>0;
    },
    _isScanEnabled:function(){
      return App.customer._isPromptPayEnabled()||(App.customer._isBankPaymentEnabled()&&App.customer._hasBankAccounts());
    },
    _isCashEnabled:function(){
      return !!App.state._cashPaymentEnabled;
    },
    _getPaymentTimeoutSec:function(){
      return App.customer._normalizeTimeoutSec(App.state._payTimeoutSec);
    },
    _updatePaymentCountdownUI:function(){
      var timeout=App.customer._getPaymentTimeoutSec();
      var hint=document.querySelector('#page-payment .countdown-hint');
      var ring=document.querySelector('#page-payment .countdown-ring');
      var show=timeout>0;
      if(hint)hint.style.display=show?'':'none';
      if(ring)ring.style.display=show?'':'none';
    },
    loadMenu(){
      var grid=document.getElementById('menu-grid');if(!grid)return;
      grid.innerHTML=App.customer.skelHtml();
      var renderMenuNow=function(){if(App.state.page==='menu')App.customer.renderMenuVirtual(App.state.menu||[]);};
      try{
        var cachedRaw=localStorage.getItem('fo_initial_data_v1')||'';
        if(cachedRaw){
          var cachedObj=JSON.parse(cachedRaw);
          if(cachedObj&&cachedObj.ts&&Date.now()-cachedObj.ts<120000&&cachedObj.data){
            var d0=cachedObj.data||{};
            App.state.menu=(d0.menu&&d0.menu.items)||[];
            App.state.options=(d0.menu&&d0.menu.options)||[];
            App.state.departments=Array.isArray(d0.departments)?d0.departments:[];
            App.state._promotions=Array.isArray(d0.promotions)?d0.promotions:[];
            App.state._menuVersion=String(d0.version||(d0.menu&&d0.menu.version)||'0');
            App.state._menuLoaded=App.state.menu.length>0;
            App.customer.applyInitialSettings(d0.settings||{});
            App.customer.fillDepts();
            renderMenuNow();
          }
        }
      }catch(_){}
      App.api.call('getInitialData',[null],function(res){
        var fallback=function(){
          App.api.call('getMenu',[],function(menuRes){
            App.state.menu=(menuRes&&menuRes.success&&menuRes.data&&menuRes.data.items)?menuRes.data.items:[];
            App.state.options=(menuRes&&menuRes.success&&menuRes.data&&menuRes.data.options)?menuRes.data.options:[];
            App.state._menuLoaded=true;renderMenuNow();
          },{silent:true,noLoader:true});
          App.api.call('getDepartments',[],function(depRes){
            App.state.departments=(depRes&&depRes.success&&Array.isArray(depRes.data))?depRes.data:DEMO_DEPTS;
            App.customer.fillDepts();
          },{silent:true,noLoader:true});
          App.customer._ensureRuntimeSettings(function(s){if(s)App.customer.applyInitialSettings(s);});
          App.api.call('getPromotions',[],function(promoRes){
            App.state._promotions=(promoRes&&promoRes.success&&Array.isArray(promoRes.data))?promoRes.data:[];
            App.customer.renderPromoHero();
          },{silent:true,noLoader:true});
        };
        if(!res||!res.success||!res.data){fallback();return;}
        var d=res.data||{};
        App.state.menu=(d.menu&&d.menu.items)||[];
        App.state.options=(d.menu&&d.menu.options)||[];
        App.state.departments=Array.isArray(d.departments)?d.departments:[];
        App.state._promotions=Array.isArray(d.promotions)?d.promotions:[];
        App.state._menuVersion=String(d.version||(d.menu&&d.menu.version)||'0');
        App.state._menuLoaded=true;
        App.customer.applyInitialSettings(d.settings||{});
        App.customer.fillDepts();
        renderMenuNow();
        try{localStorage.setItem('fo_initial_data_v1',JSON.stringify({ts:Date.now(),data:d}));}catch(_){}
      },{key:'menu'});
    },
    applyInitialSettings:function(s){
      if(!s)return;
      App.state._settingsPublic=s;
      App.state._settingsPublicAt=Date.now();
      try{App.state._banks=JSON.parse(s.payment_banks||'[]');}catch(_){App.state._banks=[];}
      App.state._deliveryCategoryType=String(s.delivery_category_type||'village');
      App.state._deliveryNoteMode=(App.state._deliveryCategoryType==='village'?'address':'note');
      App.state._cashPaymentEnabled=String(s.cash_payment_enabled||'0')==='1';
      App.state._bankPaymentEnabled=String(s.bank_payment_enabled==null?'1':s.bank_payment_enabled)==='1';
      App.state._promptpayEnabled=String(s.promptpay_enabled ?? '1')==='1';
      App.customer._setPaymentTimeout(s.payment_timeout);
      App.customer.applyBrand(s.restaurant_name,s.restaurant_logo);
      App.customer.applyShopAvailability(s);
      App.customer.applyOrderInfoLabels();
      App.customer.applyPaymentMethodUI();
    },
    applyBrand:function(name,logo){
      var safeName=String(name||window._restaurantName||'FoodOrder');
      var safeLogo=String(logo||'').trim();
      App.state._restaurantLogo=safeLogo;
      document.querySelectorAll('.brand-name').forEach(function(el){el.textContent=safeName;});
      var w=document.getElementById('topbar-brand-logo');
      if(!w)return;
      if(!safeLogo){w.innerHTML='🍽';return;}
      w.innerHTML='<img src="'+App.u.esc(safeLogo)+'" alt="logo" onerror="this.parentNode.innerHTML=\'🍽\'">';
    },
    _isOpenBySettings:function(s){
      if(!s)return true;
      var openRaw=String(s.shop_open==null?'1':s.shop_open).trim().toLowerCase();
      if(openRaw==='0'||openRaw==='false'||openRaw==='off'||openRaw==='no')return false;
      var range={};try{range=JSON.parse(s.shop_open_range||'{}');}catch(_){range={};}
      var start=String(range.start||'').trim();
      var end=String(range.end||'').trim();
      if(!start||!end)return true;
      var now=new Date(),st=new Date(start),en=new Date(end);
      if(isNaN(st.getTime())||isNaN(en.getTime()))return true;
      return now>=st&&now<=en;
    },
    applyShopAvailability:function(s){
      var isOpen=App.customer._isOpenBySettings(s);
      App.state._shopOpenNow=isOpen;
      var app=document.getElementById('customer-app');
      var ov=document.getElementById('customer-closed-overlay');
      var msg=document.getElementById('shop-closed-message');
      if(!app||!ov)return;
      if(isOpen){
        app.classList.remove('shop-closed');
        ov.classList.add('hidden');
        return;
      }
      app.classList.add('shop-closed');
      ov.classList.remove('hidden');
      if(msg){
        var range={};try{range=JSON.parse((s&&s.shop_open_range)||'{}');}catch(_){range={};}
        if(range.start&&range.end){
          msg.textContent='เปิดให้สั่งอีกครั้งตามช่วงเวลาที่ผู้ดูแลกำหนด';
        }else{
          msg.textContent='ขณะนี้ร้านไม่เปิดให้สั่งอาหาร';
        }
      }
    },
    refreshShopAvailability:function(){
      App.customer._ensureRuntimeSettings(function(s){
        if(s){
          App.state._cashPaymentEnabled=String(s.cash_payment_enabled||'0')==='1';
          App.state._bankPaymentEnabled=String(s.bank_payment_enabled==null?'1':s.bank_payment_enabled)==='1';
          App.state._promptpayEnabled=String(s.promptpay_enabled ?? '1')==='1';
          App.customer._setPaymentTimeout(s.payment_timeout);
          App.customer.applyShopAvailability(s);
          App.customer.applyPaymentMethodUI();
        }
      },{maxAgeMs:15000});
    },
    startShopAvailabilityPoll:function(){
      App.customer.stopShopAvailabilityPoll();
      App.state._shopAvailabilityTimer=setInterval(function(){
        App.customer.refreshShopAvailability();
      },15000);
    },
    stopShopAvailabilityPoll:function(){
      if(App.state._shopAvailabilityTimer){clearInterval(App.state._shopAvailabilityTimer);App.state._shopAvailabilityTimer=null;}
    },
    startMenuVersionPoll(){
      App.customer.stopMenuVersionPoll();
      App.state._menuVersionTimer=setInterval(function(){
        if(App.state.page!=='menu')return;
        App.customer.checkMenuVersion();
      },60000);
    },
    stopMenuVersionPoll(){if(App.state._menuVersionTimer){clearInterval(App.state._menuVersionTimer);App.state._menuVersionTimer=null;}},
    checkMenuVersion:function(){
      App.api.silent('getMenuVersion',[],function(res){
        if(!res||!res.success)return;
        var newVer=String(res.data&&res.data.version?res.data.version:'0');
        if(newVer&&App.state._menuVersion!=='0'&&newVer!==App.state._menuVersion){
          App.state._menuVersion=newVer;
          App.customer.loadMenuIncremental();
        }else if(newVer){
          App.state._menuVersion=newVer;
        }
      });
    },
    loadMenuIncremental:function(){App.state._menuLoaded=false;App.customer.loadMenu();},
    skelHtml(){var s='<div class="menu-card"><div class="skeleton skel-sq"></div><div class="skeleton skel-text"></div><div class="skeleton skel-text short"></div></div>';return s+s+s+s;},
    setMenuFilter:function(filter){
      App.state._customerMenuFilter=filter||'all';
      App.customer.filterVisibleMenu();
    },
    renderMenuTabs:function(items){
      var tabs=document.getElementById('customer-menu-tabs');if(!tabs)return;
      var cats={};
      (items||[]).forEach(function(m){var c=String(m.category||'').trim();if(c)cats[c]=1;});
      var list=['all'].concat(Object.keys(cats).sort());
      var cur=App.state._customerMenuFilter||'all';
      if(list.indexOf(cur)<0)cur='all';
      App.state._customerMenuFilter=cur;
      tabs.innerHTML=list.map(function(k){
        var label=k==='all'?'ทั้งหมด':'🍽 '+k;
        var cls='customer-tab-btn'+(cur===k?' active':'');
        var enc=encodeURIComponent(k);
        return '<button class="'+cls+'" data-cat="'+App.u.esc(k)+'" onclick="App.customer.setMenuFilter(decodeURIComponent(\''+enc+'\'))">'+label+'</button>';
      }).join('');
    },
    _deptLabel:function(){
      return String(App.state._deliveryCategoryType||'village')==='company'?'แผนก':'หมู่บ้าน';
    },
    _noteLabel:function(){
      var cat=String(App.state._deliveryCategoryType||'village');
      return cat==='village'?'ที่อยู่จัดส่ง':'รายละเอียดการสั่ง';
    },
    _customerNoteLabel:function(){
      var cat=String(App.state._deliveryCategoryType||'village');
      return cat==='village'?'หมายเหตุ':'หมายเหตุเพิ่มเติม';
    },
    applyOrderInfoLabels:function(){
      var isVillage=String(App.state._deliveryCategoryType||'village')==='village';
      var deptLabel=App.customer._deptLabel();
      var noteLabel=App.customer._noteLabel();
      var customerNoteLabel=App.customer._customerNoteLabel();
      var deptEl=document.getElementById('cust-dept-label');
      if(deptEl)deptEl.textContent=deptLabel+' *';
      var ph=document.getElementById('dept-select-placeholder');
      if(ph)ph.textContent='-- เลือก'+deptLabel+' --';
      var deptGroup=document.getElementById('cust-dept-group');
      if(deptGroup)deptGroup.style.display=isVillage?'none':'';
      var deptSelect=document.getElementById('dept-select');
      if(isVillage&&deptSelect)deptSelect.value='';
      var noteEl=document.getElementById('cust-note-label');
      if(noteEl)noteEl.innerHTML=noteLabel+' <span class="text-xs text-muted"></span>';
      var noteGroup=document.getElementById('cust-note-group');
      if(noteGroup)noteGroup.style.display=isVillage?'':'none';
      var noteInput=document.getElementById('cust-note');
      if(noteInput){
        noteInput.placeholder=(noteLabel==='ที่อยู่จัดส่ง'?'กรอกที่อยู่จัดส่ง':'เช่น งานด่วน, แผนกที่ติดต่อ, จุดประสงค์การสั่ง');
        if(!isVillage)noteInput.value='';
      }
      var customerNoteEl=document.getElementById('cust-customer-note-label');
      if(customerNoteEl)customerNoteEl.textContent=customerNoteLabel;
      var customerNoteInput=document.getElementById('cust-customer-note');
      if(customerNoteInput)customerNoteInput.placeholder=(customerNoteLabel==='หมายเหตุ'?'เช่น ไม่เผ็ด, โทรก่อนส่ง':'รายละเอียดเพิ่มเติม');
    },
    setPaymentMethod:function(method){
      var m=(String(method||'')==='cash')?'cash':'scan';
      var scanEnabled=App.customer._isScanEnabled();
      var cashEnabled=App.customer._isCashEnabled();
      if(m==='cash'&&!cashEnabled)m=scanEnabled?'scan':'cash';
      if(m==='scan'&&!scanEnabled)m=cashEnabled?'cash':'scan';
      App.state._paymentMethod=m;
      var cashBtn=document.getElementById('pm-cash'),scanBtn=document.getElementById('pm-scan');
      if(cashBtn)cashBtn.classList.toggle('active',m==='cash');
      if(scanBtn)scanBtn.classList.toggle('active',m==='scan');
    },
    applyPaymentMethodUI:function(){
      var wrap=document.getElementById('payment-method-wrap');
      if(!wrap)return;
      var scanEnabled=App.customer._isScanEnabled();
      var cashEnabled=App.customer._isCashEnabled();
      var cashBtn=document.getElementById('pm-cash'),scanBtn=document.getElementById('pm-scan');
      if(cashBtn)cashBtn.style.display=cashEnabled?'':'none';
      if(scanBtn)scanBtn.style.display=scanEnabled?'':'none';
      if(!scanEnabled&&!cashEnabled){
        wrap.classList.add('hidden');
        return;
      }
      wrap.classList.remove('hidden');
      if(scanEnabled&&cashEnabled){
        if(App.state._paymentMethod!=='cash'&&App.state._paymentMethod!=='scan')App.state._paymentMethod='scan';
      }else if(scanEnabled){
        App.state._paymentMethod='scan';
      }else{
        App.state._paymentMethod='cash';
      }
      App.customer.setPaymentMethod(App.state._paymentMethod||'scan');
    },
    renderPromoHero:function(){
      var wrap=document.getElementById('customer-promo-hero');if(!wrap)return;
      var promos=App.state._promotions||[];
      if(!promos.length){wrap.classList.add('hidden');wrap.innerHTML='';return;}
      wrap.classList.remove('hidden');
      wrap.innerHTML='<div class="promo-hero-card"><div class="promo-hero-title">🔥 โปรโมชันพิเศษวันนี้</div><div class="promo-hero-list">'+promos.map(function(p){
        var d=String(p.description||'').trim();
        if(!d){
          d=(String(p.type)==='qty'?'ซื้อครบ '+Math.round(toNum(p.threshold))+' รายการ':'ครบ '+Math.round(toNum(p.threshold))+' บาท')+' ลด '+Math.round(toNum(p.discount))+' บาท';
        }
        return '<span class="promo-hero-chip">🎉 '+App.u.esc(d)+'</span>';
      }).join('')+'</div></div>';
    },
    renderMenu(items){
      return App.customer.renderMenuVirtual(items);
    },
    _isMenuSoldOut:function(m){
      return App.u.isOutOfStock(m&&m.stock);
    },
    _isOptionSoldOut:function(o){
      return App.u.isOutOfStock(o&&o.stock);
    },
    buildMenuCard:function(m){
      var card=document.createElement('div');
      var soldOut=App.customer._isMenuSoldOut(m);
      card.className='menu-card'+(soldOut?' sold-out':'');
      card.dataset.id=String(m.id||'');
      card.dataset.category=String(m.category||'').trim();
      card.dataset.name=String(m.name||'').toLowerCase();
      card.dataset.soldout=soldOut?'1':'0';
      card.onclick=function(){if(!soldOut)App.customer.openModal(String(m.id||''));};
      var imgWrap=document.createElement('div');
      imgWrap.className='menu-img-wrap';
      if(soldOut){
        var soldBadge=document.createElement('div');
        soldBadge.className='menu-soldout-badge';
        soldBadge.textContent='หมด';
        imgWrap.appendChild(soldBadge);
      }
      if(m.image){
        var img=document.createElement('img');
        img.loading='lazy';
        img.decoding='async';
        img.alt=String(m.name||'');
        img.dataset.src=String(m.image||'');
        img.onerror=function(){this.style.display='none';};
        imgWrap.appendChild(img);
        App.customer._observeMenuImage(img);
      }else{
        var ph=document.createElement('div');
        ph.className='menu-img-placeholder';
        ph.textContent=(m.category==='เครื่องดื่ม'?'🥤':m.category==='อาหาร'?'🍛':'🍱');
        imgWrap.appendChild(ph);
      }
      var info=document.createElement('div');
      info.className='menu-info';
      var name=document.createElement('div');
      name.className='menu-name';
      name.textContent=String(m.name||'');
      var price=document.createElement('div');
      price.className='menu-price';
      price.textContent=App.u.fmt(m.price);
      info.appendChild(name);
      if(m.description){
        var desc=document.createElement('div');
        desc.className='menu-desc';
        desc.textContent=String(m.description||'');
        info.appendChild(desc);
      }
      info.appendChild(price);
      card.appendChild(imgWrap);
      card.appendChild(info);
      return card;
    },
    _observeMenuImage:function(img){
      if(!App.customer._imgObserver&&window.IntersectionObserver){
        App.customer._imgObserver=new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if(!entry.isIntersecting)return;
            var node=entry.target;
            if(node&&node.dataset&&node.dataset.src&&!node.src)node.src=node.dataset.src;
            App.customer._imgObserver.unobserve(node);
          });
        },{rootMargin:'200px'});
      }
      if(App.customer._imgObserver)App.customer._imgObserver.observe(img);
      else img.src=img.dataset.src||'';
    },
    renderMenuVirtual:function(items){
      var grid=document.getElementById('menu-grid');if(!grid)return;
      var pg=document.getElementById('page-menu');if(pg&&!pg.classList.contains('active'))pg.classList.add('active');
      App.customer.renderMenuTabs(items||[]);
      App.customer.renderPromoHero();
      if(!items||!items.length){grid.innerHTML='<div style="grid-column:1/-1"><div class="empty-state"><div class="icon">🍽</div><h3>ยังไม่มีเมนู</h3></div></div>';return;}
      // PERF: batch DOM rendering keeps 500-item menu responsive on mobile
      App.customer._menuRenderToken=(App.customer._menuRenderToken||0)+1;
      var renderToken=App.customer._menuRenderToken;
      grid.innerHTML='';
      var BATCH=40,offset=0;
      function renderBatch(){
        if(renderToken!==App.customer._menuRenderToken)return;
        var frag=document.createDocumentFragment();
        var end=Math.min(offset+BATCH,items.length);
        for(var i=offset;i<end;i++)frag.appendChild(App.customer.buildMenuCard(items[i]));
        grid.appendChild(frag);
        offset=end;
        if(offset<items.length)requestAnimationFrame(renderBatch);
        else App.customer.filterVisibleMenu();
      }
      requestAnimationFrame(renderBatch);
    },
    filterVisibleMenu:function(){
      var grid=document.getElementById('menu-grid');if(!grid)return;
      var cat=App.state._customerMenuFilter||'all';
      var q=String(App.state._customerMenuSearch||'').trim().toLowerCase();
      var cards=grid.querySelectorAll('.menu-card');
      var shown=0;
      cards.forEach(function(card){
        var matchCat=(cat==='all'||String(card.dataset.category||'')===cat);
        var matchQ=!q||String(card.dataset.name||'').indexOf(q)>-1||String(card.dataset.category||'').toLowerCase().indexOf(q)>-1;
        var ok=matchCat&&matchQ;
        card.style.display=ok?'':'none';
        if(ok)shown++;
      });
      document.querySelectorAll('#customer-menu-tabs .customer-tab-btn').forEach(function(btn){
        btn.classList.toggle('active',btn.dataset.cat===cat);
      });
      var empty=document.getElementById('menu-grid-empty');
      if(!shown){
        if(!empty){
          empty=document.createElement('div');
          empty.id='menu-grid-empty';
          empty.style.gridColumn='1/-1';
          empty.innerHTML='<div class="empty-state"><div class="icon">📭</div><h3>ไม่พบเมนูที่ค้นหา</h3></div>';
          grid.appendChild(empty);
        }
      }else if(empty&&empty.parentNode)empty.parentNode.removeChild(empty);
    },
    searchMenu:function(query){
      App.state._customerMenuSearch=String(query||'');
      clearTimeout(App.customer._searchTimer);
      App.customer._searchTimer=setTimeout(function(){App.customer.filterVisibleMenu();},200);
    },
    fillDepts(){
      var el=document.getElementById('dept-select');if(!el)return;
      var cur=el.value,depts=App.state.departments.length?App.state.departments:DEMO_DEPTS;
      var deptLabel=App.customer._deptLabel();
      el.innerHTML='<option value="">-- เลือก'+deptLabel+' --</option>'+depts.map(function(d){return'<option value="'+App.u.esc(d)+'">'+App.u.esc(d)+'</option>';}).join('');
      if(cur)el.value=cur;
      App.customer.applyOrderInfoLabels();
    },
    renderInfoPreview(){
      var wrap=document.getElementById('info-cart-preview');if(!wrap)return;
      if(!App.state.cart.length){wrap.innerHTML='<p class="text-sm text-muted">ไม่มีรายการ</p>';return;}
      var e=App.u.esc,sub=App.customer.getSubtotal(),disc=App.state.promo.discount||0,total=Math.max(0,sub-disc);
      wrap.innerHTML=App.state.cart.map(function(ci){
        return'<div class="preview-item"><div><div>'+e(ci.name)+' ×'+ci.qty+'</div>'+(ci.options&&ci.options.length?'<div class="text-xs text-muted">'+ci.options.map(function(c){return e(c.label||c);}).join(', ')+'</div>':'')+(ci.comment?'<div class="text-xs text-muted">💬 '+e(ci.comment)+'</div>':'')+'</div><div class="preview-item-price">'+App.u.fmt(ci.price*ci.qty)+'</div></div>';
      }).join('')+(disc>0?'<div class="preview-item" style="color:var(--green)"><div>โปรโมชัน</div><div>-'+App.u.fmt(disc)+'</div></div>':'')
        +'<div class="preview-item" style="font-weight:700;border-top:2px solid var(--border);padding-top:10px;margin-top:4px"><div>รวม</div><div style="color:var(--primary)">'+App.u.fmt(total)+'</div></div>';
    },
    openModal(menuId){
      if(App.state._shopOpenNow===false){App.ui.toast('ร้านปิดอยู่ ไม่สามารถสั่งอาหารได้','warn');return;}
      var item=App.state.menu.find(function(m){return String(m.id)===String(menuId);});
      if(!item){App.ui.toast('ไม่พบเมนู','error');return;}
      if(App.customer._isMenuSoldOut(item)){App.ui.toast('เมนูนี้หมดแล้ว','warn');return;}
      App.state.selectedMenu={item:item,qty:1,selectedChoices:{},comment:''};
      var opts=App.state.options.filter(function(o){
        var mid=String(o&&o.menu_id||'');
        return mid===String(menuId)||mid==='*';
      });
      var e=App.u.esc,optHtml='';
      opts.forEach(function(o){
        var isReq=String(o.is_required)==='true',isSingle=String(o&&o.type||'single')==='single';
        var soldOut=App.customer._isOptionSoldOut(o);
        var choices=[];try{choices=JSON.parse(o.choices||'[]');}catch(_){}
        if(!choices.length)return;
        optHtml+='<div class="option-group" data-group="'+e(o.group_name)+'" data-soldout="'+(soldOut?'1':'0')+'"><div class="option-label">'+e(o.group_name)+(isReq?'<span class="required-badge">จำเป็น *</span>':'')+(soldOut?'<span class="stock-badge out">หมด</span>':'')+'</div>';
        choices.forEach(function(ch,ci){
          var pr=toNum(ch.price||0),label=typeof ch==='string'?ch:(ch.label||ch.name||String(ch));
          optHtml+='<label class="option-item'+(soldOut?' disabled':'')+'" onclick="App.customer.pickChoice(event,\''+e(o.group_name)+'\','+ci+','+isSingle+')"><span>'+e(label)+(pr>0?' <span class="text-muted">+'+App.u.fmt(pr)+'</span>':'')+'</span><input type="'+(isSingle?'radio':'checkbox')+'" name="og-'+e(o.group_name)+'" data-idx="'+ci+'" data-price="'+pr+'" data-label="'+e(label)+'"'+(soldOut?' disabled':'')+'></label>';
        });
        optHtml+='</div>';
      });
      var emoji=item.category==='เครื่องดื่ม'?'🥤':item.category==='อาหาร'?'🍛':'🍱';
      var body=document.getElementById('modal-body');if(!body)return;
      body.innerHTML=(item.image?'<div class="modal-img-wrap"><img src="'+e(item.image)+'" onerror="this.style.display=\'none\'"></div>':'<div style="font-size:64px;text-align:center;padding:24px;background:var(--surface);">'+emoji+'</div>')
        +optHtml
        +'<div class="mt-3"><label class="text-sm" style="display:block;margin-bottom:6px">💬 Comment</label><textarea id="modal-item-comment" class="input" rows="2" maxlength="160" placeholder="เช่น หวานน้อย, ไม่ใส่น้ำแข็ง, แยกน้ำเชื่อม" oninput="App.customer.setModalComment(this.value)"></textarea></div>'
        +'<div class="qty-control mt-3"><button class="qty-btn" onclick="App.customer.changeQty(-1)">−</button><span id="modal-qty" style="font-size:18px;font-weight:700;min-width:28px;text-align:center">1</span><button class="qty-btn" onclick="App.customer.changeQty(1)">+</button><span style="margin-left:auto;font-size:14px;color:var(--text2)">รวม: <strong id="modal-sub">'+App.u.fmt(item.price)+'</strong></span></div>';
      var tt=document.getElementById('modal-title'),tp=document.getElementById('modal-price');
      if(tt)tt.textContent=item.name;if(tp)tp.textContent=App.u.fmt(item.price);
      document.getElementById('item-modal').classList.add('active');
    },
    pickChoice(ev,group,idx,isSingle){
      var label=ev.currentTarget;if(ev.target===label.querySelector('input'))return;ev.preventDefault();
      var inp=label.querySelector('input');if(!inp||!App.state.selectedMenu)return;
      if(inp.disabled){App.ui.toast('ตัวเลือกนี้หมดแล้ว','warn');return;}
      if(isSingle){document.querySelectorAll('[name="og-'+group+'"]').forEach(function(i){i.checked=false;var p=i.closest('.option-item');if(p)p.classList.remove('selected');});inp.checked=true;label.classList.add('selected');App.state.selectedMenu.selectedChoices[group]=[{label:inp.dataset.label,price:toNum(inp.dataset.price||0)}];}
      else{inp.checked=!inp.checked;label.classList.toggle('selected',inp.checked);if(!App.state.selectedMenu.selectedChoices[group])App.state.selectedMenu.selectedChoices[group]=[];var arr=App.state.selectedMenu.selectedChoices[group];if(inp.checked)arr.push({label:inp.dataset.label,price:toNum(inp.dataset.price||0)});else App.state.selectedMenu.selectedChoices[group]=arr.filter(function(x){return !(String(x&&x.label||'')===String(inp.dataset.label||'')&&toNum(x&&x.price||0)===toNum(inp.dataset.price||0));});}
      App.customer.updateModalSub();
    },
    changeQty(d){if(!App.state.selectedMenu)return;App.state.selectedMenu.qty=Math.max(1,Math.min(99,App.state.selectedMenu.qty+d));var el=document.getElementById('modal-qty');if(el)el.textContent=App.state.selectedMenu.qty;App.customer.updateModalSub();},
    updateModalSub(){var s=App.state.selectedMenu;if(!s)return;var p=toNum(s.item.price);Object.values(s.selectedChoices).forEach(function(a){a.forEach(function(c){p+=c.price;});});var el=document.getElementById('modal-sub');if(el)el.textContent=App.u.fmt(p*s.qty);},
    setModalComment:function(v){if(!App.state.selectedMenu)return;App.state.selectedMenu.comment=String(v||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().substring(0,160);},
    addToCart(){
      if(App.state._shopOpenNow===false){App.ui.toast('ร้านปิดอยู่ ไม่สามารถเพิ่มรายการได้','warn');return;}
      if(App.u.debounce('addcart',600))return;if(!App.state.selectedMenu)return;
      var s=App.state.selectedMenu;
      if(App.customer._isMenuSoldOut(s.item)){App.ui.toast('เมนูนี้หมดแล้ว','warn');return;}
      var myOpts=App.state.options.filter(function(o){var mid=String(o&&o.menu_id||'');return mid===String(s.item.id)||mid==='*';});
      for(var oi=0;oi<myOpts.length;oi++){
        var o=myOpts[oi];
        if(App.customer._isOptionSoldOut(o)&&String(o&&o.is_required||'false')==='true'){App.ui.toast('ตัวเลือกจำเป็น "'+o.group_name+'" หมดแล้ว','error');return;}
        if(String(o&&o.is_required||'false')!=='true')continue;
        var choices=[];try{choices=JSON.parse(o.choices||'[]');}catch(_){}
        if(!choices.length)continue;
        var sel=s.selectedChoices[o.group_name];
        if(!sel||!sel.length){App.ui.toast('กรุณาเลือก '+o.group_name,'error');return;}
      }
      var price=toNum(s.item.price),flatChoices=[];
      Object.values(s.selectedChoices).forEach(function(a){a.forEach(function(c){price+=c.price;flatChoices.push(c);});});
      price=Math.round(price*100)/100;
      var itemComment=String(s.comment||'').trim();
      var optKey=flatChoices.map(function(c){return c.label;}).sort().join(',')+'|c:'+itemComment;
      var xi=App.state.cart.findIndex(function(ci){return String(ci.menuId)===String(s.item.id)&&ci._optKey===optKey;});
      if(xi>-1)App.state.cart[xi].qty=Math.min(99,App.state.cart[xi].qty+s.qty);
      else App.state.cart.push({menuId:s.item.id,name:s.item.name,image:s.item.image||'',price:price,options:flatChoices,comment:itemComment,qty:s.qty,_optKey:optKey});
      App.customer.calcPromo();App.customer.updateBadge();App.customer.saveCartLocal();App.customer.closeModal();
      App.ui.toast(s.item.name+' เพิ่มแล้ว','success');
    },
    closeModal(){document.getElementById('item-modal').classList.remove('active');App.state.selectedMenu=null;},
    updateBadge(){var total=App.state.cart.reduce(function(s,i){return s+i.qty;},0);['cart-badge','cart-badge-float'].forEach(function(id){var b=document.getElementById(id);if(b){b.textContent=total;b.style.display=total>0?'flex':'none';}});var fb=document.getElementById('cart-float-btn');if(fb)fb.style.display=total>0?'flex':'none';},
    saveCartLocal:function(){try{localStorage.setItem('fo_cart',JSON.stringify(App.state.cart||[]));}catch(_){}},
    restoreCartLocal:function(){try{var saved=JSON.parse(localStorage.getItem('fo_cart')||'[]');if(Array.isArray(saved)&&saved.length){App.state.cart=saved;App.customer.calcPromo();App.customer.updateBadge();}}catch(_){}},
    getSubtotal(){return App.state.cart.reduce(function(s,i){return s+i.price*i.qty;},0);},
    calcPromo(){
      if(!App.state._promotions||!App.state._promotions.length){App.state.promo={discount:0,applied:[]};return;}
      var totalQty=App.state.cart.reduce(function(s,i){return s+i.qty;},0),totalSpend=App.customer.getSubtotal(),discount=0,applied=[];
      App.state._promotions.forEach(function(p){var thresh=toNum(p.threshold),disc=toNum(p.discount);if(disc<=0||thresh<=0)return;if(p.type==='qty'&&totalQty>=thresh){discount+=disc;applied.push(p.description||('ซื้อ '+thresh+' รายการ ลด '+disc+' บาท'));}if(p.type==='spend'&&totalSpend>=thresh){discount+=disc;applied.push(p.description||('ยอด '+thresh+' ลด '+disc+' บาท'));}});
      App.state.promo={discount:Math.max(0,Math.min(discount,totalSpend)),applied:applied};
    },
    renderCart(){
      var wrap=document.getElementById('cart-items'),sw=document.getElementById('cart-summary-wrap');if(!wrap)return;
      if(!App.state.cart.length){wrap.innerHTML='<div class="empty-state"><div class="icon">🛒</div><h3>ตะกร้าว่าง</h3></div>';if(sw)sw.classList.add('hidden');App.state.promo={discount:0,applied:[]};App.customer.renderSummary();return;}
      if(sw)sw.classList.remove('hidden');var e=App.u.esc;
      wrap.innerHTML=App.state.cart.map(function(ci,idx){
        var imgHtml=ci.image?'<img src="'+e(ci.image)+'" onerror="this.style.display=\'none\'">':'🍱';
        return'<div class="cart-item"><div class="cart-item-img">'+imgHtml+'</div><div class="cart-item-info"><div class="cart-item-name">'+e(ci.name)+'</div>'+(ci.options&&ci.options.length?'<div class="cart-item-opts">'+ci.options.map(function(c){return e(c.label||c);}).join(', ')+'</div>':'')+(ci.comment?'<div class="cart-item-opts">💬 '+e(ci.comment)+'</div>':'')
          +'<div class="cart-item-footer"><div style="display:flex;align-items:center;gap:8px"><button class="qty-btn" style="width:28px;height:28px;font-size:14px" onclick="App.customer.cartQty('+idx+',-1)">−</button><span style="font-weight:600;min-width:20px;text-align:center">'+ci.qty+'</span><button class="qty-btn" style="width:28px;height:28px;font-size:14px" onclick="App.customer.cartQty('+idx+',1)">+</button></div><div style="display:flex;align-items:center;gap:4px"><div class="cart-item-price">'+App.u.fmt(ci.price*ci.qty)+'</div><button class="btn-icon" onclick="App.customer.removeItem('+idx+')" style="color:var(--primary)">🗑</button></div></div></div></div>';
      }).join('');App.customer.renderSummary();
    },
    cartQty(idx,d){if(App.state.cart[idx]){App.state.cart[idx].qty=Math.max(1,App.state.cart[idx].qty+d);App.customer.calcPromo();App.customer.renderCart();App.customer.updateBadge();App.customer.saveCartLocal();}},
    removeItem(idx){App.state.cart.splice(idx,1);App.customer.calcPromo();App.customer.renderCart();App.customer.updateBadge();App.customer.saveCartLocal();},
    renderSummary(){
      var sub=App.customer.getSubtotal(),disc=App.state.promo.discount||0,total=Math.max(0,sub-disc);
      var setEl=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
      setEl('cart-subtotal',App.u.fmt(sub));setEl('cart-discount','-'+App.u.fmt(disc));setEl('cart-total',App.u.fmt(total));
      var pb=document.getElementById('promo-tags');
      if(pb){var applied=App.state.promo.applied||[];pb.innerHTML=applied.map(function(a){return'<span class="promo-tag">🎉 '+App.u.esc(a)+'</span>';}).join('');pb.style.display=applied.length?'flex':'none';}
    },
    toCart(){if(App.state._shopOpenNow===false){App.ui.toast('ร้านปิดอยู่','warn');return;}if(!App.state.cart.length){App.ui.toast('ตะกร้าว่าง','error');return;}App.ui.nav('cart');},
    toInfo(){if(App.state._shopOpenNow===false){App.ui.toast('ร้านปิดอยู่','warn');return;}if(!App.state.cart.length){App.ui.toast('ตะกร้าว่าง','error');return;}App.ui.nav('info');},
    toPayment(){
      if(App.state._shopOpenNow===false){App.ui.toast('ร้านปิดอยู่ ไม่สามารถสั่งอาหารได้','warn');return;}
      if(App.u.debounce('checkout',4000))return;
      var nameEl=document.getElementById('cust-name'),deptEl=document.getElementById('dept-select'),noteEl=document.getElementById('cust-note'),customerNoteEl=document.getElementById('cust-customer-note');
      var name=nameEl?nameEl.value.trim():'',dept=deptEl?deptEl.value:'',note=noteEl?noteEl.value.trim():'',customerNote=customerNoteEl?customerNoteEl.value.trim():'';
      var isVillage=String(App.state._deliveryCategoryType||'village')==='village';
      if(isVillage)dept='';
      if(!name){App.ui.toast('กรุณากรอกชื่อ','error');if(nameEl)nameEl.focus();return;}
      if(!isVillage&&!dept){App.ui.toast('กรุณาเลือก'+App.customer._deptLabel(),'error');return;}
      if(!App.state.cart.length){App.ui.toast('ตะกร้าว่าง','error');return;}
      if(!App.customer._isScanEnabled()&&!App.customer._isCashEnabled()){App.ui.toast('ร้านยังไม่ได้เปิดใช้งานวิธีชำระเงิน','error');return;}
      var paymentMethod=App.customer._isCashEnabled()?(App.state._paymentMethod||'scan'):'scan';
      if(paymentMethod==='scan'&&!App.customer._isScanEnabled()){App.ui.toast('ร้านยังไม่ได้เปิดใช้งานวิธีชำระเงิน','error');return;}
      var payload={customer:name,department:dept,note:note,customerNote:customerNote,items:App.state.cart.map(function(i){return{menuId:i.menuId,qty:i.qty,selectedChoices:(i.options||[]).map(function(c){return (c&&c.label)?c.label:String(c||'');}).concat(i.comment?['💬 '+i.comment]:[])};}),paymentMethod:paymentMethod};
      App.state._paymentPayload={customer:name,department:dept,note:note,customerNote:customerNote,cart:JSON.parse(JSON.stringify(App.state.cart)),promo:JSON.parse(JSON.stringify(App.state.promo)),paymentMethod:paymentMethod};
      var btn=document.getElementById('to-payment-btn');App.ui.setBtn(btn,true);
      if(paymentMethod==='cash'){
        App.api.call('createCashOrder',[payload],function(res){
          App.ui.setBtn(btn,false,'ดำเนินการชำระเงิน');if(!res||!res.success)return;
          App.state.orderId=res.data.orderId;
          var payTotalCash=parseFloat(res.data.total)||0;
          App.state.orderTotal=payTotalCash;
          App.state._paymentPayload.serverSummary={subtotal:parseFloat(res.data.subtotal)||0,discount:parseFloat(res.data.discount)||0,total:payTotalCash,payment_amount:payTotalCash};
          App.customer.stopCountdown();App.customer.stopWebhookCheck();
          App.customer.onPaySuccess('cash');
        },{key:'checkout_cash'});
        return;
      }
      App.api.call('createTempOrder',[payload],function(res){
        App.ui.setBtn(btn,false,'ดำเนินการชำระเงิน');if(!res||!res.success)return;
        App.state.orderId=res.data.orderId;
        // ใช้ payment_amount จาก server สำหรับ scan
        var payTotal=parseFloat(res.data.payment_amount||res.data.total)||0;
        var foodTotal=parseFloat(res.data.total)||0;
        App.state.orderTotal=payTotal;
        App.state._paymentPayload.serverSummary={
          subtotal:parseFloat(res.data.subtotal)||0,
          discount:parseFloat(res.data.discount)||0,
          total:foodTotal,
          payment_amount:payTotal
        };
        var ae=document.getElementById('pay-amount'),ie=document.getElementById('pay-orderId');
        if(ae)ae.textContent='฿'+payTotal.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
        if(ie)ie.textContent='#'+App.u.esc(res.data.orderId);
        var cb=document.getElementById('pay-customer-info');if(cb){
          var detailBits=['👤 '+App.u.esc(name)];
          if(dept)detailBits.push('🏢 '+App.u.esc(dept));
          if(note)detailBits.push('📍 '+App.u.esc(note));
          if(customerNote)detailBits.push('📝 '+App.u.esc(customerNote));
          cb.classList.remove('hidden');
          cb.innerHTML=detailBits.join(' &nbsp;|&nbsp; ');
        }
        App.customer.genQR(payTotal,res.data.orderId);App.customer.renderBankSlides();
        App.customer.applyPaymentTabsUI();
        App.customer.resetPayUI();App.ui.nav('payment');App.customer.startCountdown();App.customer.startWebhookCheck();
      },{key:'checkout'});
    },

    // === PAY TABS ===
    applyPaymentTabsUI:function(){
      var tabPP=document.getElementById('tab-pp'),tabBank=document.getElementById('tab-bank');
      var panelPP=document.getElementById('panel-pp'),panelBank=document.getElementById('panel-bank');
      var hasPP=App.customer._isPromptPayEnabled();
      var hasBank=App.customer._isBankPaymentEnabled()&&App.customer._hasBankAccounts();
      if(tabPP)tabPP.style.display=hasPP?'':'none';
      if(tabBank)tabBank.style.display=hasBank?'':'none';
      var nextTab='pp';
      if(hasPP)nextTab='pp';
      else if(hasBank)nextTab='bank';
      else nextTab='';
      if(!nextTab){
        if(panelPP)panelPP.style.display='none';
        if(panelBank)panelBank.style.display='none';
        var wrap=document.getElementById('qr-wrap');
        if(wrap)wrap.innerHTML='<div style="padding:16px;color:#e53935;font-size:13px">⚠️ ร้านยังไม่ได้เปิดใช้งานวิธีชำระเงิน</div>';
        return;
      }
      App.customer.switchPayTab(nextTab);
    },
    switchPayTab(tab){
      var hasPP=App.customer._isPromptPayEnabled();
      var hasBank=App.customer._isBankPaymentEnabled()&&App.customer._hasBankAccounts();
      if(!hasPP&&!hasBank){
        App.state._payTab='';
        var p1=document.getElementById('panel-pp'),p2=document.getElementById('panel-bank');
        if(p1)p1.style.display='none';
        if(p2)p2.style.display='none';
        return;
      }
      if(tab==='bank'&&!hasBank)tab='pp';
      if(tab==='pp'&&!hasPP)tab='bank';
      App.state._payTab=tab;
      var elPP=document.getElementById('tab-pp'),elBank=document.getElementById('tab-bank'),panelPP=document.getElementById('panel-pp'),panelBank=document.getElementById('panel-bank');
      if(elPP)elPP.classList.toggle('active',tab==='pp');
      if(elBank)elBank.classList.toggle('active',tab==='bank');
      if(panelPP)panelPP.style.display=tab==='pp'?'':'none';
      if(panelBank)panelBank.style.display=tab==='bank'?'':'none';
    },

    // === BANK SLIDES ===
    renderBankSlides(){
      var banks=App.state._banks||[];var wrap=document.getElementById('bank-slides-wrap');if(!wrap)return;
      if(!banks.length){wrap.innerHTML='<p class="text-sm text-muted" style="padding:12px 0">ยังไม่มีบัญชีธนาคาร<br>ตั้งค่าได้ในหน้า Admin > ตั้งค่า</p>';return;}
      var e=App.u.esc;
      var slides=banks.map(function(b){
        var bInfo=BANK_LIST.find(function(x){return x.code===b.code;})||{emoji:'🏦',name:b.bankName||'ธนาคาร',short:'',color:'#1a237e',logo:''};
        var logoHtml=bInfo.logo?('<img src="'+e(bInfo.logo)+'" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'inline\'" style="width:34px;height:34px;border-radius:8px;object-fit:contain;background:#fff;padding:3px;display:block"><span style="display:none;font-size:28px">'+bInfo.emoji+'</span>'):('<span style="font-size:28px;display:block">'+bInfo.emoji+'</span>');
        return'<div class="bank-card" style="background:linear-gradient(135deg,'+e(bInfo.color)+' 0%,'+e(bInfo.color)+'bb 100%)"><div class="bank-card-header"><div class="bank-card-logo">'+logoHtml+'</div><div class="bank-card-badge">'+e(bInfo.short||'')+'</div></div><div class="bank-card-name">'+e(bInfo.name||b.bankName)+'</div><div class="bank-card-acct">'+e(b.acct)+'</div><div class="bank-card-owner">'+e(b.name)+'</div><button class="bank-card-copy" onclick="App.customer.copyBank(\''+e(b.acct)+'\')">📋 คัดลอก</button></div>';
      }).join('');
      var dots=banks.map(function(_,i2){return'<div class="bank-dot'+(i2===0?' active':'')+'" id="bdot-'+i2+'"></div>';}).join('');
      wrap.innerHTML='<div class="bank-slides" id="bank-slides-inner" onscroll="App.customer.onBankScroll(this)">'+slides+'</div><div class="bank-dots">'+dots+'</div>';
    },
    onBankScroll(el){
      var idx=Math.round(el.scrollLeft/(el.scrollWidth/Math.max(1,App.state._banks.length)));
      document.querySelectorAll('.bank-dot').forEach(function(d,i){d.classList.toggle('active',i===idx);});
    },
    copyBank(acct){navigator.clipboard&&navigator.clipboard.writeText(acct).then(function(){App.ui.toast('คัดลอกเลขบัญชีแล้ว','success');}).catch(function(){App.ui.toast(acct,'info');});},

    // === QR ===
    _ppf(id,val){var l=String(val.length);if(l.length<2)l='0'+l;return id+l+val;},
    _ppCRC(s){var c=0xFFFF;for(var i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(var j=0;j<8;j++)c=(c&0x8000)?((c<<1)^0x1021):(c<<1);}return('000'+(c&0xFFFF).toString(16).toUpperCase()).slice(-4);},
    _buildQR(phone,amount,name){
      var f=this._ppf.bind(this),num=phone.replace(/\D/g,'');
      var botTag='01';
      // PromptPay destination:
      // - Mobile number: tag 01, normalized to 0066XXXXXXXXX (13 digits)
      // - National/Tax ID: tag 02, raw 13 digits
      if(num.length===13){
        botTag='02';
      }else{
        if(num.length===10&&num[0]==='0')num='0066'+num.slice(1);
        else if(num.length===9)num='0066'+num;
        else if(num.length===12&&num.startsWith('66'))num='00'+num;
      }
      // EMVCo PromptPay: tag01=12 (dynamic QR with amount)
      var tag29=f('29',f('00','A000000677010111')+f(botTag,num));
      var mName=(name||'').replace(/[^\x20-\x7E]/g,'').trim().substr(0,25)||'PROMPTPAY';
      var amtStr=(Math.round(amount*100)/100).toFixed(2);
      var body=f('00','01')+f('01','12')+tag29+f('52','0000')+f('53','764')+f('54',amtStr)+f('58','TH')+f('59',mName)+f('60','Bangkok');
      return body+f('63',this._ppCRC(body+'6304'));
    },
    genQR(amount,orderId){
      var wrap=document.getElementById('qr-wrap');if(!wrap)return;
      if(!App.customer._isPromptPayEnabled()){wrap.innerHTML='<div style="padding:16px;color:#e53935;font-size:13px">⚠️ ปิดใช้งาน PromptPay อยู่</div>';return;}
      var ppCfg=App.u.getPromptPayConfig();
      var pp=App.u.digitsOnly(ppCfg&&ppCfg.promptpay||'');
      if(!pp){wrap.innerHTML='<div style="padding:16px;color:#e53935;font-size:13px">⚠️ ยังไม่ได้ตั้งค่าเลข PromptPay</div>';return;}
      if(!App.u.isValidPromptPayId(pp)){wrap.innerHTML='<div style="padding:16px;color:#e53935;font-size:13px">⚠️ รูปแบบ PromptPay ต้องเป็นมือถือ 10 หลัก หรือบัตรประชาชน 13 หลัก</div>';return;}
      App.customer._ensureRuntimeSettings(function(s){
        var payeeName=(s&&s.payee_name)||ppCfg.payeeName||'';
        var payload=App.customer._buildQR(pp,Math.round(amount*100)/100,payeeName);
        wrap.innerHTML='';var qrDiv=document.createElement('div');qrDiv.style.cssText='background:#fff;padding:8px;border-radius:8px;display:inline-block';wrap.appendChild(qrDiv);
        App.state._qrPayload=payload;App.state._qrCanvas=null;
        try{
          var qrObj=new QRCode(qrDiv,{text:payload,width:200,height:200,correctLevel:QRCode.CorrectLevel.M});
          setTimeout(function(){var c=qrDiv.querySelector('canvas');if(c)App.state._qrCanvas=c;},300);
        }catch(ex){var img=document.createElement('img');img.style.cssText='width:200px;height:200px;border-radius:8px';img.src='https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl='+encodeURIComponent(payload)+'&choe=UTF-8';img.alt='QR';wrap.innerHTML='';wrap.appendChild(img);}
        var pi=document.getElementById('payee-info'),pn=document.getElementById('payee-name');
        if(pi&&pn){pn.textContent=payeeName||'(ไม่ได้ตั้งค่าชื่อบัญชี)';pi.style.display='';}
      },{maxAgeMs:120000});
    },
    resetPayUI(){
      var sw=document.getElementById('payment-steps-wrap'),rb=document.getElementById('retry-btn'),cw=document.getElementById('cancel-order-wrap');
      var slipSect=document.getElementById('slip-upload-section'),qrWrap=document.getElementById('qr-wrap'),pi=document.getElementById('payee-info');
      if(sw)sw.classList.remove('hidden');if(rb)rb.classList.add('hidden');if(cw)cw.classList.remove('hidden');
      if(slipSect)slipSect.classList.remove('hidden');if(qrWrap)qrWrap.classList.remove('hidden');if(pi)pi.style.display='none';
      App.customer.setStep('waiting','waiting');App.customer.setStep('verify','waiting');
      App.state._slipFile=null;App.state._slipVerified=false;
      var preview=document.getElementById('slip-preview'),placeholder=document.getElementById('slip-placeholder');
      var statusEl=document.getElementById('slip-status'),verifyWrap=document.getElementById('slip-verify-wrap');
      if(preview){preview.classList.add('hidden');preview.src='';}if(placeholder)placeholder.style.display='';
      if(statusEl){statusEl.className='hidden';statusEl.innerHTML='';}if(verifyWrap)verifyWrap.classList.add('hidden');
      var fileInp=document.getElementById('slip-file-input');if(fileInp)fileInp.value='';
      // reset tab
      App.customer.applyPaymentTabsUI();
    },
    setStep(id,st){var el=document.getElementById('step-'+id);if(!el)return;el.className='step-icon '+st;el.textContent=st==='done'?'✓':'○';},

    // === SLIP ===
    onSlipSelected(event){
      var file=event.target.files&&event.target.files[0];if(!file)return;
      if(!file.type.match(/^image\//)){App.ui.toast('กรุณาเลือกไฟล์รูปภาพ','error');return;}
      if(file.size>10*1024*1024){App.ui.toast('ไฟล์ใหญ่เกินไป (สูงสุด 10MB)','error');return;}
      App.state._slipFile=file;App.state._slipVerified=false;
      var preview=document.getElementById('slip-preview'),placeholder=document.getElementById('slip-placeholder');
      var statusEl=document.getElementById('slip-status'),verifyWrap=document.getElementById('slip-verify-wrap');
      var reader=new FileReader();
      reader.onload=function(e){if(preview){preview.src=e.target.result;preview.classList.remove('hidden');}if(placeholder)placeholder.style.display='none';if(statusEl){statusEl.className='hidden';statusEl.innerHTML='';}if(verifyWrap)verifyWrap.classList.remove('hidden');};
      reader.readAsDataURL(file);
    },
    verifySlip(){
      if(!App.state._slipFile){App.ui.toast('กรุณาเลือกสลิปก่อน','error');return;}
      if(!App.state.orderId){App.ui.toast('ไม่พบออเดอร์','error');return;}
      if(App.u.debounce('slipverify',3000))return;
      var statusEl=document.getElementById('slip-status'),verifyBtn=document.getElementById('slip-verify-btn');
      if(statusEl){statusEl.className='slip-status checking';statusEl.innerHTML='⏳ กำลังตรวจสอบสลิป...';}
      if(verifyBtn){verifyBtn.disabled=true;if(!verifyBtn._orig)verifyBtn._orig=verifyBtn.textContent;verifyBtn.textContent='⏳ กำลังตรวจสอบ...';}
      App.ui.setBtn(verifyBtn,true);App.customer.setStep('waiting','active');
      var orderId=String(App.state.orderId);
      var reader=new FileReader();
      reader.onload=function(e){
        var dataUrl=e.target.result;
        if(!dataUrl||dataUrl.indexOf(',')<0){App.ui.toast('อ่านไฟล์ไม่ได้','error');App.ui.setBtn(verifyBtn,false,verifyBtn&&verifyBtn._orig||'✓ ยืนยันการชำระเงิน');return;}
        var b64=dataUrl.split(',')[1],mimeType=App.state._slipFile.type||'image/jpeg';
        App.api.call('verifySlipOK',[orderId,b64,mimeType],function(res){
          App.ui.setBtn(verifyBtn,false,verifyBtn&&verifyBtn._orig||'✓ ยืนยันการชำระเงิน');
          if(res&&res.success&&res.data&&res.data.verified){
            App.state._slipVerified=true;App.customer.setStep('waiting','done');App.customer.setStep('verify','active');
            if(statusEl){statusEl.className='slip-status ok';statusEl.innerHTML='✓ สลิปถูกต้อง! กำลังยืนยัน...';}
            setTimeout(function(){App.customer.stopWebhookCheck();App.customer.stopCountdown();App.customer.onPaySuccess();},1200);
          }else{
            App.customer.setStep('waiting','waiting');
            var errMsg=(res&&res.message)||'สลิปไม่ถูกต้อง';
            if(statusEl){statusEl.className='slip-status fail';statusEl.innerHTML='✕ '+errMsg;}
            App.ui.toast(errMsg,'error');
          }
        });
      };
      reader.readAsDataURL(App.state._slipFile);
    },

    startCountdown(){
      App.customer.stopCountdown();
      App.customer._updatePaymentCountdownUI();
      var raw=App.customer._getPaymentTimeoutSec();
      if(!raw||raw<=0){App.state.countdownSec=0;App.customer.renderCountdown(0,0);return;}
      var tot=Math.max(60,raw);
      App.state.countdownSec=tot;App.customer.renderCountdown(tot,tot);
      App.state.countdownTimer=setInterval(function(){App.state.countdownSec--;App.customer.renderCountdown(App.state.countdownSec,tot);if(App.state.countdownSec<=0){App.customer.stopCountdown();App.customer.onPayTimeout();}},1000);
    },
    stopCountdown(){if(App.state.countdownTimer){clearInterval(App.state.countdownTimer);App.state.countdownTimer=null;}},
    renderCountdown(sec,tot){
      var mEl=document.getElementById('countdown-m'),sEl=document.getElementById('countdown-s');
      var prog=document.getElementById('countdown-prog-bar');
      if(!mEl||!sEl)return;
      if(!tot||tot<=0){
        mEl.textContent='∞';sEl.textContent='∞';
        mEl.style.color='inherit';sEl.style.color='inherit';
        if(prog){prog.style.width='100%';prog.style.background='var(--primary)';}
        return;
      }
      sec=Math.max(0,sec);var m=Math.floor(sec/60),s=sec%60;
      mEl.textContent=m.toString().padStart(2,'0');
      sEl.textContent=s.toString().padStart(2,'0');
      var color=sec<60?'#FF5252':'var(--primary)';
      mEl.style.color=color;sEl.style.color=color;
      if(prog){
        var pct=Math.max(0,sec)/Math.max(1,tot)*100;
        prog.style.width=pct+'%';
        prog.style.background=sec<60?'#FF5252':'linear-gradient(90deg, #ef4444, #dc2626)';
      }
    },
    onPayTimeout(){
      App.customer.stopWebhookCheck();
      App.api.silent('cancelTempOrder',[App.state.orderId],function(res){
        if(res&&res.success===false&&(res.code==='ALREADY_PAID'||res.code==='ALREADY_SENT')){
          App.ui.toast('ออเดอร์ถูกส่งให้แอดมินแล้ว ไม่สามารถยกเลิกได้','info');
          App.customer.stopCountdown();
          App.customer.onPaySuccess();
          return;
        }
        App.customer._saveOrderHistoryByStatus('cancelled','timeout');
        App.ui.toast('หมดเวลาชำระเงิน ออเดอร์ถูกยกเลิก','warn');
        var cw=document.getElementById('cancel-order-wrap');if(cw)cw.classList.add('hidden');
        setTimeout(function(){App.state.cart=[];App.state.orderId=null;App.state.promo={discount:0,applied:[]};App.customer.updateBadge();App.customer.saveCartLocal();App.state._navigating=false;App.ui.nav('menu');},2500);
      });
    },
    startWebhookCheck(){
      App.customer.stopWebhookCheck();App.state._checkCount=0;App.customer.setStep('waiting','active');
      function doCheck(){
        if(!App.state.orderId||App.state._slipVerified||App.state.page!=='payment')return;
        App.state._checkCount++;
        var tRaw=App.customer._getPaymentTimeoutSec();
        var maxChecks=(!tRaw||tRaw<=0)?100000:200;
        if(App.state._checkCount>maxChecks)return;
        App.api.silent('checkPaymentStatus',[App.state.orderId],function(res){
          if(!res)return schedule();
          if(res.success&&res.data){
            var st=String(res.data.status||'').toLowerCase();
            if(st==='paid'||st==='cooking'||st==='done'){
              App.customer.stopWebhookCheck();App.customer.stopCountdown();App.customer.onPaySuccess();return;
            }
          }
          schedule();
        });
        function schedule(){
          if(!App.state.orderId||App.state.page!=='payment')return;
          var base;
          if(App.state._checkCount<=8)base=3500;
          else if(App.state._checkCount<=18)base=5500;
          else base=8000;
          if(document.hidden)base+=2500;
          App.state._checkTimer=setTimeout(doCheck,base+Math.random()*1200);
        }
      }
      App.state._checkTimer=setTimeout(doCheck,3000);
    },
    stopWebhookCheck(){if(App.state._checkTimer){clearTimeout(App.state._checkTimer);App.state._checkTimer=null;}},
    _saveOrderHistoryByStatus:function(status,reason){
      var st=String(status||'completed').toLowerCase();
      var pp=App.state._paymentPayload||{};
      var cart=pp.cart||App.state.cart||[];
      var total=toNum(App.state.orderTotal||0);
      if(!(total>0)){
        total=(Array.isArray(cart)?cart:[]).reduce(function(sum,it){
          return sum+(toNum(it&&it.price||0)*toNum(it&&it.qty||1));
        },0);
      }
      App.u.saveHistory(App.state.orderId,{
        customer:pp.customer||'',
        department:pp.department||'',
        note:pp.note||'',
        customerNote:pp.customerNote||'',
        cart:cart,
        total:total,
        promo:pp.promo||App.state.promo,
        status:st,
        reason:reason||''
      });
    },
    onPaySuccess(){
      var mode=String(arguments[0]||((App.state._paymentPayload&&App.state._paymentPayload.paymentMethod)||'scan'));
      App.customer.setStep('waiting','done');App.customer.setStep('verify','done');
      var sw=document.getElementById('payment-steps-wrap'),cw=document.getElementById('cancel-order-wrap'),rb=document.getElementById('retry-btn');
      var slipSect=document.getElementById('slip-upload-section'),qrWrap=document.getElementById('qr-wrap');
      if(sw)sw.classList.add('hidden');if(cw)cw.classList.add('hidden');if(rb)rb.classList.add('hidden');
      if(slipSect)slipSect.classList.add('hidden');if(qrWrap)qrWrap.classList.add('hidden');
      var sTitle=document.getElementById('receipt-page-title'),sSub=document.getElementById('receipt-page-subtitle');
      if(sTitle)sTitle.textContent=mode==='cash'?'ส่งคำสั่งซื้อสำเร็จ!':'ชำระเงินสำเร็จ!';
      if(sSub)sSub.textContent=mode==='cash'?'ระบบแจ้งออเดอร์ไปยังแอดมินแล้ว (ชำระเงินสดตอนรับสินค้า)':'ขอบคุณ! คำสั่งซื้อได้รับการยืนยันแล้ว';
      App.customer.renderReceipt();
      App.customer._saveOrderHistoryByStatus('completed','');
      App.state.cart=[];App.state.promo={discount:0,applied:[]};App.customer.updateBadge();App.customer.saveCartLocal();
      App.ui.nav('receipt');
    },
    renderReceipt(){
      var wrap=document.getElementById('receipt-wrap');if(!wrap)return;
      App.customer._ensureRuntimeSettings(function(){
        var pp=App.state._paymentPayload||{},cart=pp.cart||App.state.cart,e=App.u.esc;
        var isCash=String(pp.paymentMethod||'').toLowerCase()==='cash';
        var codBanner=isCash?'<div style="font-size:30px;font-weight:900;color:#b91c1c;text-align:center;letter-spacing:.2px;margin:6px 0 10px">เก็บเงินปลายทาง</div>':'';
        var customerMeta='';
        if(pp.customer){
          customerMeta='<div class="receipt-row text-sm" style="color:var(--text2)"><span>👤 '+e(pp.customer)+'</span>'+(pp.department?'<span>🏢 '+e(pp.department)+'</span>':'<span></span>')+'</div>'
            +(pp.note?'<div class="text-sm" style="color:var(--text2);margin:6px 0 0">📍 '+e(pp.note)+'</div>':'')
            +(pp.customerNote?'<div class="text-sm" style="color:var(--text2);margin:4px 0 0">📝 '+e(pp.customerNote)+'</div>':'')
            +'<hr class="receipt-divider">';
        }
        var summary=(App.state._paymentPayload&&App.state._paymentPayload.serverSummary)||{};
        var foodTotal=toNum(summary.total||App.state.orderTotal||0);
        var payAmount=toNum(summary.payment_amount||App.state.orderTotal||foodTotal);
        var qrHtml=isCash?App.u.buildReceiptPromptPayQrHtml(payAmount,{size:180,title:'สแกนจ่ายภายหลังผ่าน PromptPay',caption:'PromptPay '+App.u.formatPromptPay(App.u.getPromptPayConfig().promptpay),titleFontPx:13,captionFontPx:11,marginTopPx:8}):'';
        var payRows='';
        if(!isCash&&payAmount>0&&Math.abs(payAmount-foodTotal)>0.0001){
          payRows+='<div class="receipt-row"><span>ยอดอาหาร</span><span>'+App.u.fmt(foodTotal)+'</span></div>';
          payRows+='<div class="receipt-row" style="font-weight:700"><span>รวมทั้งหมด</span><span>'+App.u.fmt(payAmount)+'</span></div>';
        }else{
          payRows+='<div class="receipt-row" style="font-weight:700"><span>รวมทั้งหมด</span><span>'+App.u.fmt(payAmount)+'</span></div>';
        }
        wrap.innerHTML='<div class="receipt-box">'+codBanner+'<div class="receipt-title">🧾 ใบเสร็จ #'+e(App.state.orderId||'')+'</div>'+customerMeta+cart.map(function(i){return'<div class="receipt-row"><span>'+e(i.name)+(i.options&&i.options.length?'<br><span style="font-size:11px;color:var(--text2)">'+i.options.map(function(c){return e(c.label||c);}).join(', ')+'</span>':'')+' ×'+i.qty+'</span><span>'+App.u.fmt(i.price*i.qty)+'</span></div>';}).join('')+'<hr class="receipt-divider">'+((App.state.promo.discount||0)>0?'<div class="receipt-row" style="color:var(--green)"><span>โปรโมชัน</span><span>-'+App.u.fmt(App.state.promo.discount)+'</span></div>':'')+payRows+(qrHtml?'<hr class="receipt-divider">'+qrHtml:'')+'</div>';
      },{maxAgeMs:120000});
    },
    cancelOrder(){
      if(App.u.debounce('cancel',2000))return;
      App.ui.confirm('ยืนยันยกเลิกคำสั่งซื้อ?',function(ok){
        if(!ok)return;
        App.customer.stopCountdown();App.customer.stopWebhookCheck();
        var cw=document.getElementById('cancel-order-wrap');if(cw)cw.classList.add('hidden');
        App.ui.toast('กำลังยกเลิกออเดอร์...','info');
        App.api.silent('cancelTempOrder',[App.state.orderId],function(res){
          if(res&&res.success===false){
            if(res.code==='ALREADY_PAID'||res.code==='ALREADY_SENT'){
              App.ui.toast('ออเดอร์ถูกส่งให้แอดมินแล้ว ไม่สามารถยกเลิกได้','info');
              App.customer.onPaySuccess();
              return;
            }
        if(!res||!res.success){App.ui.toast((res&&res.message)||'ยืนยันรับเงินสดไม่สำเร็จ','warn');return;}
            if(cw)cw.classList.remove('hidden');
            return;
          }
          App.customer._saveOrderHistoryByStatus('cancelled','manual');
          App.state.cart=[];App.state.orderId=null;App.state.promo={discount:0,applied:[]};App.customer.updateBadge();App.customer.saveCartLocal();App.state._navigating=false;App.ui.nav('menu');
        });
      },{disableBackdropClose:true});
    },
    renderHistory(){
      var wrap=document.getElementById('history-list');if(!wrap)return;var hist=App.u.localHistory();
      if(!hist.length){wrap.innerHTML='<div class="empty-state"><div class="icon">📋</div><h3>ยังไม่มีประวัติ</h3></div>';return;}
      var e=App.u.esc;
      wrap.innerHTML=hist.map(function(h,idx){
        var d=h.data||{},cart=d.cart||[];
        var st=String(d.status||'completed').toLowerCase();
        var stLabel=(st==='cancelled')?'ยกเลิก':'สำเร็จ';
        var stBg=(st==='cancelled')?'#fee2e2':'#dcfce7';
        var stColor=(st==='cancelled')?'#b91c1c':'#166534';
        return '<div class="history-item"><div class="history-header"><div><div class="history-id">#'+e(h.orderId||'')+'</div><div class="history-date">'+new Date(h.ts).toLocaleString('th-TH')+'</div></div><div class="history-total">'+App.u.fmt(d.total||0)+'</div></div>'
          +'<div class="text-xs" style="display:inline-block;margin:4px 0 6px;padding:3px 9px;border-radius:999px;background:'+stBg+';color:'+stColor+';font-weight:700">'+stLabel+'</div>'
          +(d.customer?'<div class="text-xs text-muted" style="margin-bottom:6px">👤 '+e(d.customer)+' | 🏢 '+e(d.department||'')+'</div>':'')
          +(cart.length?'<div class="text-sm text-muted">'+cart.map(function(i){return e(i.name)+' ×'+i.qty;}).join(', ')+'</div>':'')
          +'<div class="history-actions"><button class="btn btn-secondary" style="width:auto;padding:8px 14px;font-size:13px" onclick="App.customer.repeatFromHistory('+idx+')">สั่งซ้ำ</button></div>'
          +'</div>';
      }).join('');
    },
    repeatFromHistory:function(idx){
      var hist=App.u.localHistory();
      var h=hist&&hist[idx]?hist[idx]:null;
      if(!h||!h.data){App.ui.toast('ไม่พบข้อมูลประวัติ','warn');return;}
      var d=h.data||{};
      var src=Array.isArray(d.cart)?d.cart:[];
      if(!src.length){App.ui.toast('รายการเดิมว่าง ไม่สามารถสั่งซ้ำได้','warn');return;}
      var normalizeOptions=function(opts){
        if(!Array.isArray(opts))return [];
        return opts.map(function(o){
          if(typeof o==='string')return{label:String(o),price:0};
          if(o&&typeof o==='object')return{label:String(o.label||o.name||''),price:toNum(o.price||0)};
          return{label:String(o||''),price:0};
        }).filter(function(x){return String(x.label||'').trim().length>0;});
      };
      var list=src.map(function(i){
        var opts=normalizeOptions(i&&i.options);
        var optKey=opts.map(function(c){return String(c.label||'');}).sort().join(',');
        return{
          menuId:String((i&&i.menuId)||''),
          name:String((i&&i.name)||''),
          image:String((i&&i.image)||''),
          price:toNum((i&&i.price)||0),
          options:opts,
          qty:Math.max(1,Math.min(99,parseInt((i&&i.qty)||1,10)||1)),
          _optKey:optKey
        };
      }).filter(function(i){return i.name&&i.price>=0&&i.qty>0;});
      if(!list.length){App.ui.toast('ข้อมูลประวัติไม่สมบูรณ์','warn');return;}
      var applyRepeat=function(){
        App.state.cart=list;
        var cust=document.getElementById('cust-name');if(cust&&d.customer)cust.value=String(d.customer||'');
        var dept=document.getElementById('dept-select');if(dept&&d.department)dept.value=String(d.department||'');
        App.customer.calcPromo();
        App.customer.updateBadge();
        App.customer.renderCart();
        App.ui.nav('cart');
        App.ui.toast('เพิ่มรายการเดิมลงตะกร้าแล้ว','success');
      };
      if((App.state.cart||[]).length){
        App.ui.confirm('มีรายการในตะกร้าอยู่แล้ว ต้องการแทนที่ด้วยรายการเดิมหรือไม่?',function(ok){if(ok)applyRepeat();});
        return;
      }
      applyRepeat();
    }
  },

  // ─── ADMIN ────────────────────────────────────────────────
  admin:{
    _sessionKey:'foodorder_admin_session_v1',
    _sessionTtlMs:8*60*60*1000,
    _notificationCacheKey:'fo_notification_settings_cache_v1',
    _lineGuideStateKey:'fo_line_setup_guide_state_v1',
    _lineGuideChecklistKey:'fo_line_setup_guide_checklist_v1',
    _getCache:function(key,maxAgeMs){
      try{
        var c=App.state._adminCache||{};
        var hit=c[key];
        if(!hit||!hit.ts)return null;
        if(maxAgeMs&&Date.now()-Number(hit.ts||0)>maxAgeMs)return null;
        return hit.data;
      }catch(_){return null;}
    },
    _setCache:function(key,data){
      if(!App.state._adminCache)App.state._adminCache={};
      App.state._adminCache[key]={ts:Date.now(),data:data};
      return data;
    },
    _invalidateCache:function(keys){
      if(!App.state._adminCache)App.state._adminCache={};
      (Array.isArray(keys)?keys:[keys]).forEach(function(k){
        if(!k)return;
        delete App.state._adminCache[k];
      });
    },
    _setNotificationLocalCache:function(data){
      try{
        localStorage.setItem(App.admin._notificationCacheKey,JSON.stringify({ts:Date.now(),data:data||{}}));
      }catch(_){}
    },
    _getNotificationLocalCache:function(maxAgeMs){
      try{
        var raw=localStorage.getItem(App.admin._notificationCacheKey);
        if(!raw)return null;
        var parsed=JSON.parse(raw||'{}');
        if(!parsed||!parsed.ts||!parsed.data)return null;
        if(maxAgeMs&&Date.now()-Number(parsed.ts||0)>maxAgeMs)return null;
        return parsed.data;
      }catch(_){return null;}
    },
    _clearNotificationLocalCache:function(){
      try{localStorage.removeItem(App.admin._notificationCacheKey);}catch(_){}
    },
    init:function(){
      App.admin._bindGoogleDriveFolderInput();
      if(App.admin.tryRestoreSession()){App.admin.showPanel();return;}
      App.admin.showLogin();
    },
    _extractGoogleDriveResourceId:function(raw){
      var s=String(raw||'').trim();
      if(!s)return '';
      var patterns=[
        /\/folders\/([a-zA-Z0-9_-]{10,})/i,
        /[?&]id=([a-zA-Z0-9_-]{10,})/i
      ];
      for(var i=0;i<patterns.length;i++){
        var m=s.match(patterns[i]);
        if(m&&m[1])return m[1];
      }
      if(/^[a-zA-Z0-9_-]{10,}$/.test(s))return s;
      return s;
    },
    _normalizeGoogleDriveFolderInput:function(el){
      if(!el)return '';
      var normalized=App.admin._extractGoogleDriveResourceId(el.value);
      el.value=normalized;
      return normalized;
    },
    _bindGoogleDriveFolderInput:function(){
      var el=document.getElementById('s-drive');
      if(!el||el._driveNormalizeBound)return;
      var sync=function(){App.admin._normalizeGoogleDriveFolderInput(el);};
      el.addEventListener('change',sync);
      el.addEventListener('blur',sync);
      el.addEventListener('paste',function(){setTimeout(sync,0);});
      el._driveNormalizeBound=true;
    },
    _completeLogin:function(data,fallbackUser){
      var payload=data||{};
      App.state.adminToken=String(payload.token||'');
      App.state.adminRole=String(payload.role||'guest');
      App.state.adminUser=payload.username?String(payload.username):String(fallbackUser||App.state.adminRole||'User');
      App.admin._saveSession();
      var pe=document.getElementById('admin-pass');if(pe)pe.value='';
      App.admin.showPanel();
      App.api.call('verifyAdminSession',[App.state.adminToken],function(vr){
        if(!vr||!vr.success||!(vr.data&&vr.data.valid)){
          var m=String((vr&&vr.message)||'');
          if(m.indexOf('not found')>-1||m.indexOf('Script function')>-1)return;
          App.ui.toast(m||'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่','warn');
          App.admin.logout();
        }
      },{silent:true});
    },
    _saveSession:function(){
      try{
        var payload={
          token:String(App.state.adminToken||''),
          role:String(App.state.adminRole||''),
          user:String(App.state.adminUser||''),
          expiresAt:Date.now()+App.admin._sessionTtlMs
        };
        localStorage.setItem(App.admin._sessionKey,JSON.stringify(payload));
      }catch(_){}
    },
    _clearSession:function(){
      try{localStorage.removeItem(App.admin._sessionKey);}catch(_){}
    },
    tryRestoreSession:function(){
      try{
        var raw=localStorage.getItem(App.admin._sessionKey);if(!raw)return false;
        var s=JSON.parse(raw||'{}');
        if(!s||!s.token||!s.role||!s.expiresAt||Date.now()>Number(s.expiresAt||0)){App.admin._clearSession();return false;}
        App.state.adminToken=String(s.token||'');
        App.state.adminRole=String(s.role||'guest');
        App.state.adminUser=String(s.user||App.state.adminRole||'User');
        return true;
      }catch(_){App.admin._clearSession();return false;}
    },
    showLogin(){App.state.adminToken=null;App.state.adminRole=null;App.state.adminUser='';App.admin._clearSession();App.admin._stopMenuLiveRefresh();App.admin._stopOrdersAutoRefresh();App.admin._stopDashboardAutoRefresh();var l=document.getElementById('admin-login'),m=document.getElementById('admin-main');if(l)l.classList.remove('hidden');if(m)m.classList.add('hidden');},
    showPanel(){
      var l=document.getElementById('admin-login'),m=document.getElementById('admin-main'),aa=document.getElementById('admin-app'),ca=document.getElementById('customer-app');
      if(aa)aa.style.display='';if(ca)ca.style.display='none';
      if(l)l.classList.add('hidden');if(m)m.classList.remove('hidden');
      if(App.state.adminToken)App.admin._saveSession();
      if(App.state.adminToken){
        App.api.silent('verifyAdminSession',[App.state.adminToken],function(res){
          if(!res||!res.success||!(res.data&&res.data.valid)){
            App.ui.toast('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่','warn');
            App.admin.logout();
            return;
          }
          if(res.data.role)App.state.adminRole=String(res.data.role||App.state.adminRole||'guest');
          if(res.data.username)App.state.adminUser=String(res.data.username||App.state.adminUser||'');
          App.admin._saveSession();
        });
      }
      App.admin.applyRolePermissions();
      App.admin.applyAdminBrand(window._restaurantName||'FoodOrder',window._restaurantLogo||'');
      App.admin.toggleAdminMode(false);
      App.api.silent('getSettings',[],function(res){
        if(res&&res.success&&res.data){
          App.state._settingsRaw=res.data||{};
          App.state._deliveryCategoryType=App.admin._normalizeDeliveryType(res.data.delivery_category_type||'village');
          App.state._deliveryNoteMode=(App.state._deliveryCategoryType==='village'?'address':'note');
          var typeSel=document.getElementById('s-delivery-type-select');
          var typeInp=document.getElementById('s-delivery-type');
          if(typeSel)typeSel.value=App.state._deliveryCategoryType;
          if(typeInp)typeInp.value=App.state._deliveryCategoryType;
          App.admin.updateOrderInfoConfigLabels();
        }
      });
      App.admin.renderPaperPresetOptions();
      App.ui.adminNav('orders');
    },
    applyAdminBrand:function(name,logo){
      var brandName=String(name||window._restaurantName||'FoodOrder');
      var brandLogo=String(logo||'').trim();
      var nameEl=document.getElementById('admin-sidebar-brand-name');
      var logoEl=document.getElementById('admin-sidebar-logo');
      if(nameEl)nameEl.textContent=brandName;
      if(logoEl){
        if(!brandLogo)logoEl.innerHTML='🍽';
        else logoEl.innerHTML='<img src="'+App.u.esc(brandLogo)+'" alt="logo" onerror="this.parentNode.innerHTML=\'🍽\'">';
      }
      window._restaurantName=brandName;
      window._restaurantLogo=brandLogo;
    },
    login(){
      if(App.u.debounce('login',2500))return;
      var ue=document.getElementById('admin-user'),pe=document.getElementById('admin-pass');
      var user=ue?ue.value.trim():'',pass=pe?pe.value:'';
      if(!user||!pass){App.ui.toast('กรุณากรอกข้อมูล','error');return;}
      var btn=document.getElementById('login-btn');App.ui.setBtn(btn,true);
      var afterLogin=function(res){
        App.ui.setBtn(btn,false,'เข้าสู่ระบบ');
        if(!res||!res.success){
          var em=(res&&res.message)?String(res.message):'เข้าสู่ระบบไม่สำเร็จ';
          var ec=(res&&res.code)?(' ['+String(res.code)+']'):'';
          if(!res||(!res.message&&!res.code)){
            try{em='เข้าสู่ระบบไม่สำเร็จ ('+JSON.stringify(res)+')';}catch(_){}
          }
          App.ui.toast(em+ec,'error');
          return;
        }
        App.admin._completeLogin(res.data||{},user);
      };
      App.api.call('adminLoginV2',[user,pass],function(res){
        if(res&&res.success){afterLogin(res);return;}
        var m=String((res&&res.message)||'');
        if(m.indexOf('Script function not found')>-1||m.indexOf('not found')>-1){
          App.api.call('adminLogin',[user,pass],afterLogin);
          return;
        }
        afterLogin(res);
      },{silent:true});
    },
    loginGuest(){
      if(App.u.debounce('loginguest',2500))return;
      var btn=document.getElementById('guest-login-btn');App.ui.setBtn(btn,true);
      App.api.call('adminGuestLogin',[],function(res){
        App.ui.setBtn(btn,false,'เข้าโหมด Guest (ดูอย่างเดียว)');
        if(!res||!res.success){App.ui.toast((res&&res.message)||'เข้าโหมด Guest ไม่สำเร็จ','error');return;}
        App.admin._completeLogin(res.data||{},'Guest');
      });
    },
    refreshGuestLoginButton:function(){
      var btn=document.getElementById('guest-login-btn');if(!btn)return;
      btn.classList.add('hidden');
    },
    logout(){App.admin._stopOrdersAutoRefresh();App.admin._stopMenuLiveRefresh();App.admin._stopDashboardAutoRefresh();if(App.state.adminToken)App.api.silent('adminLogout',[App.state.adminToken],function(){});App.state.adminToken=null;App.state.adminRole=null;App.state.adminUser='';App.admin._clearSession();App.admin.showLogin();},
    switchSettingsTab(btn,tabId){
      document.querySelectorAll('.stab').forEach(function(b){b.classList.remove('active');});
      document.querySelectorAll('.stab-panel').forEach(function(p){p.classList.remove('active');});
      if(btn)btn.classList.add('active');var p=document.getElementById(tabId);if(p)p.classList.add('active');
      // PERF-FIX: lazy-load heavy settings tabs only when opened
      if(tabId==='stab-users'){
        if(!App.admin.canManageUsersApi()){
          var tb=document.getElementById('users-table');
          if(tb)tb.innerHTML='<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text2)">บัญชีนี้ไม่มีสิทธิ์ดูรายการผู้ใช้งาน</td></tr>';
        }else{
          App.admin.loadUsers();
        }
      }
      if(tabId==='stab-logs')App.admin.loadActivityLogs();
    },
    _toggleCustomPaperField:function(selectId,inputWrapId){
      var selectEl=document.getElementById(selectId),wrap=document.getElementById(inputWrapId);
      if(!wrap)return;
      var show=selectEl&&selectEl.value==='custom';
      wrap.classList.toggle('hidden',!show);
    },
    _toggleCustomSizeField:function(selectId,inputWrapId){
      var selectEl=document.getElementById(selectId),wrap=document.getElementById(inputWrapId);
      if(!wrap)return;
      var show=selectEl&&selectEl.value==='custom';
      wrap.classList.toggle('hidden',!show);
    },
    _paperPresetKey:function(kind){
      return kind==='receipt'?'foodorder_receipt_paper_presets_v1':'foodorder_sticker_paper_presets_v1';
    },
    _paperSelectedKey:function(selectId){
      return 'foodorder_paper_selected_'+String(selectId||'');
    },
    _orientationSelectedKey:function(selectId){
      return 'foodorder_orientation_selected_'+String(selectId||'');
    },
    _normalizeStickerSizeInput:function(raw){
      var s=String(raw||'').trim();
      if(!s)return '';
      s=s.toLowerCase()
        .replace(/มม\./g,'mm')
        .replace(/มม/g,'mm')
        .replace(/\s+/g,'')
        .replace(/mm/g,'')
        .replace(/[×*]/g,'x')
        .replace(/,/g,'.');
      var m=s.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
      if(!m)return '';
      var w=parseFloat(m[1]),h=parseFloat(m[2]);
      if(!(w>0&&h>0))return '';
      var wTxt=(Math.round(w*100)%100===0)?String(Math.round(w)):String(Math.round(w*100)/100);
      var hTxt=(Math.round(h*100)%100===0)?String(Math.round(h)):String(Math.round(h*100)/100);
      return wTxt+'x'+hTxt;
    },
    _getDefaultPaperPresets:function(kind){
      if(kind==='receipt')return ['80mm','72mm','58mm','30mm'];
      return ['100x70','70x100','100x100','62x29'];
    },
    _getPaperPresetList:function(kind){
      var defs=App.admin._getDefaultPaperPresets(kind);
      var raw='[]';
      try{raw=localStorage.getItem(App.admin._paperPresetKey(kind))||'[]';}catch(_){}
      var arr=[];try{arr=JSON.parse(raw||'[]');}catch(_){arr=[];}
      var normFn=(kind==='receipt')
        ?function(v){return App.admin._normalizePaperSizeInput(v,'');}
        :function(v){return App.admin._normalizeStickerSizeInput(v);};
      var out=[],seen={};
      defs.concat(Array.isArray(arr)?arr:[]).forEach(function(v){
        var n=normFn(v);
        if(!n||seen[n])return;
        seen[n]=1;out.push(n);
      });
      var cleanedSaved=[],savedSeen={};
      (Array.isArray(arr)?arr:[]).forEach(function(v){
        var n=normFn(v);
        if(!n||savedSeen[n])return;
        savedSeen[n]=1;
        if(defs.indexOf(n)===-1)cleanedSaved.push(n);
      });
      try{
        if(JSON.stringify(Array.isArray(arr)?arr:[])!==JSON.stringify(cleanedSaved)){
          App.admin._savePaperPresetList(kind,cleanedSaved);
        }
      }catch(_){}
      return out;
    },
    _savePaperPresetList:function(kind,list){
      try{localStorage.setItem(App.admin._paperPresetKey(kind),JSON.stringify(list||[]));}catch(_){}
    },
    _paperPresetLabel:function(kind,val){
      var v=String(val||'').toLowerCase();
      if(kind==='receipt'){
        var m1=v.match(/^(\d+(?:\.\d+)?)mm$/);if(m1)return m1[1]+'mm';
        return String(val||'');
      }
      var m=v.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
      if(m)return m[1]+'×'+m[2]+'mm';
      return String(val||'');
    },
    _rememberPaperSelect:function(selectId){
      try{
        var el=document.getElementById(selectId);if(!el)return;
        localStorage.setItem(App.admin._paperSelectedKey(selectId),String(el.value||''));
      }catch(_){}
    },
    _getRememberedPaperSelect:function(selectId){
      try{return String(localStorage.getItem(App.admin._paperSelectedKey(selectId))||'');}catch(_){return '';}
    },
    _rememberOrientationSelect:function(selectId){
      try{
        var el=document.getElementById(selectId);if(!el)return;
        localStorage.setItem(App.admin._orientationSelectedKey(selectId),String(el.value||'portrait'));
      }catch(_){}
    },
    _getRememberedOrientationSelect:function(selectId){
      try{return String(localStorage.getItem(App.admin._orientationSelectedKey(selectId))||'');}catch(_){return '';}
    },
    _initOrientationSelect:function(selectId){
      var el=document.getElementById(selectId);if(!el)return;
      var remembered=App.admin._getRememberedOrientationSelect(selectId);
      var val=(remembered==='landscape'||remembered==='portrait')?remembered:String(el.value||'portrait');
      if(val!=='landscape'&&val!=='portrait')val='portrait';
      el.value=val;
      App.admin._rememberOrientationSelect(selectId);
    },
    onOrientationChanged:function(selectId,scope){
      App.admin._rememberOrientationSelect(selectId);
      if(scope==='batch')App.admin.updateBatchPreview();
      else App.admin.updatePrintPreview();
    },
    _getOrientationByContext:function(mode,tab){
      var id='';
      if(mode==='batch')id=(tab==='receipt')?'bp-orientation':'bs-orientation';
      else id=(tab==='receipt')?'ps-orientation':'ss-orientation';
      var el=document.getElementById(id);
      var v=String(el&&el.value||'portrait').toLowerCase();
      return (v==='landscape')?'landscape':'portrait';
    },
    _setPaperSelectOptions:function(kind,selectId,list){
      var el=document.getElementById(selectId);if(!el)return;
      var cur=String(el.value||'');
      var remembered=App.admin._getRememberedPaperSelect(selectId);
      el.innerHTML=(list||[]).map(function(v){
        return '<option value="'+App.u.esc(v)+'">'+App.u.esc(App.admin._paperPresetLabel(kind,v))+'</option>';
      }).join('');
      var pick=(list.indexOf(remembered)>-1)?remembered:((list.indexOf(cur)>-1)?cur:(list[0]||''));
      if(pick)el.value=pick;
      App.admin._rememberPaperSelect(selectId);
    },
    renderPaperPresetOptions:function(){
      var r=App.admin._getPaperPresetList('receipt');
      var s=App.admin._getPaperPresetList('sticker');
      App.admin._setPaperSelectOptions('receipt','ps-paper',r);
      App.admin._setPaperSelectOptions('receipt','bp-paper',r);
      App.admin._setPaperSelectOptions('sticker','ss-size',s);
      App.admin._setPaperSelectOptions('sticker','bs-size',s);
      App.admin._initOrientationSelect('ps-orientation');
      App.admin._initOrientationSelect('ss-orientation');
      App.admin._initOrientationSelect('bp-orientation');
      App.admin._initOrientationSelect('bs-orientation');
    },
    onPaperSelectChanged:function(selectId,scope){
      App.admin._rememberPaperSelect(selectId);
      if(scope==='batch')App.admin.updateBatchPreview();
      else App.admin.updatePrintPreview();
    },
    savePaperPreset:function(kind,scope){
      var idMap={
        'receipt_single':'ps-paper-preset-input',
        'receipt_batch':'bp-paper-preset-input',
        'sticker_single':'ss-size-preset-input',
        'sticker_batch':'bs-size-preset-input'
      };
      var selectMap={
        'receipt_single':'ps-paper',
        'receipt_batch':'bp-paper',
        'sticker_single':'ss-size',
        'sticker_batch':'bs-size'
      };
      var key=kind+'_'+scope;
      var inp=document.getElementById(idMap[key]);
      var raw=inp?String(inp.value||'').trim():'';
      var val=(kind==='receipt')?App.admin._normalizePaperSizeInput(raw,''):App.admin._normalizeStickerSizeInput(raw);
      if(!val){
        App.ui.toast('รูปแบบขนาดไม่ถูกต้อง','warn');
        if(inp)inp.focus();
        return;
      }
      var list=App.admin._getPaperPresetList(kind);
      if(list.indexOf(val)===-1)list.push(val);
      App.admin._savePaperPresetList(kind,list);
      App.admin.renderPaperPresetOptions();
      var sel=document.getElementById(selectMap[key]);
      if(sel)sel.value=val;
      App.admin._rememberPaperSelect(selectMap[key]);
      if(inp)inp.value='';
      if(scope==='batch')App.admin.updateBatchPreview();
      else App.admin.updatePrintPreview();
      App.ui.toast('บันทึกค่ากระดาษแล้ว','success');
    },
    deletePaperPreset:function(kind,scope){
      var selectMap={
        'receipt_single':'ps-paper',
        'receipt_batch':'bp-paper',
        'sticker_single':'ss-size',
        'sticker_batch':'bs-size'
      };
      var key=kind+'_'+scope;
      var sel=document.getElementById(selectMap[key]);
      var cur=sel?String(sel.value||''):'';
      if(!cur){App.ui.toast('ไม่พบค่าที่เลือก','warn');return;}
      var defs=App.admin._getDefaultPaperPresets(kind);
      if(defs.indexOf(cur)>-1){
        App.ui.toast('ลบค่ามาตรฐานไม่ได้','warn');
        return;
      }
      var list=App.admin._getPaperPresetList(kind).filter(function(v){return v!==cur;});
      App.admin._savePaperPresetList(kind,list);
      App.admin.renderPaperPresetOptions();
      if(scope==='batch')App.admin.updateBatchPreview();
      else App.admin.updatePrintPreview();
      App.ui.toast('ลบค่ากระดาษที่บันทึกแล้ว','success');
    },
    _resolvePaperSize:function(selectId,customId,fallback){
      var selectEl=document.getElementById(selectId);
      var val=selectEl?String(selectEl.value||'').trim():'';
      if(val&&val!=='custom')return App.admin._normalizePaperSizeInput(val,fallback);
      var customEl=document.getElementById(customId);
      var customVal=customEl?String(customEl.value||'').trim():'';
      if(customVal&&/^\d+(\.\d+)?$/.test(customVal))customVal+='mm';
      return App.admin._normalizePaperSizeInput(customVal,fallback);
    },
    _normalizePaperSizeInput:function(raw,fallback){
      var hasFallback=(typeof fallback==='string');
      var fb=hasFallback?String(fallback).trim().toLowerCase():'80mm';
      if(!fb&&!hasFallback)fb='80mm';
      var s=String(raw||'').trim().toLowerCase();
      if(!s)return fb;
      s=s
        .replace(/มม\./g,'mm')
        .replace(/มม/g,'mm')
        .replace(/\s+/g,'')
        .replace(/mm/g,'')
        .replace(/,/g,'.');
      var m1=s.match(/^(\d+(?:\.\d+)?)$/);
      if(m1)return String(m1[1])+'mm';
      return fb;
    },
    _paperSizeToPageSpec:function(sizeVal,scale,orientation){
      var s=String(sizeVal||'80mm').trim().toLowerCase();
      var sc=Math.max(0.5,Math.min(2,parseFloat(scale||1)||1));
      var m1=s.match(/^(\d+(?:\.\d+)?)mm$/);
      var w=(m1?parseFloat(m1[1]):80)*sc;
      w=Math.round(w*100)/100;
      return {pageSpec:w+'mm auto',previewWidth:w+'mm',isFixed:false,pageWidthMm:w,pageHeightMm:0};
    },
    _resolveStickerSize:function(selectId,customId,fallback){
      var selectEl=document.getElementById(selectId);
      var val=selectEl?String(selectEl.value||'').trim():'';
      if(val&&val!=='custom')return App.admin._normalizeStickerSize(val,fallback);
      var customEl=document.getElementById(customId);
      var customVal=customEl?String(customEl.value||'').trim():'';
      return App.admin._normalizeStickerSize(customVal,fallback);
    },
    _normalizeStickerSize:function(raw,fallback){
      var fb=String(fallback||'100x70').trim()||'100x70';
      var s=String(raw||'').trim();
      if(!s)return fb;
      // รองรับรูปแบบ: 40x30, 40*30, 40×30, 40 X 30, 40mm*30mm
      s=s.toLowerCase()
        .replace(/มม\./g,'mm')
        .replace(/มม/g,'mm')
        .replace(/\s+/g,'')
        .replace(/mm/g,'')
        .replace(/[×*]/g,'x')
        .replace(/,/g,'.');
      var m=s.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
      if(!m)return fb;
      var w=parseFloat(m[1]),h=parseFloat(m[2]);
      if(!(w>0&&h>0))return fb;
      var wTxt=(Math.round(w*100)%100===0)?String(Math.round(w)):String(Math.round(w*100)/100);
      var hTxt=(Math.round(h*100)%100===0)?String(Math.round(h)):String(Math.round(h*100)/100);
      return wTxt+'x'+hTxt;
    },
    _stickerSizeToPageSize:function(sizeVal,orientation){
      var s=String(sizeVal||'').trim().toLowerCase();
      var m=s.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
      if(!m)return '100mm 70mm';
      var w=String(m[1]),h=String(m[2]);
      var ori=String(orientation||'portrait').toLowerCase()==='landscape'?'landscape':'portrait';
      if(ori==='landscape')return h+'mm '+w+'mm';
      return w+'mm '+h+'mm';
    },
    _formatStickerOptions:function(value){
      if(value == null) return '';

      var extract = function(x){
        if(x == null) return '';
        if(typeof x === 'string') return x.trim();
        if(typeof x !== 'object') return String(x || '').trim();

        var name =
          x.label ||
          x.name ||
          x.title ||
          x.option_name ||
          x.optionName ||
          x.value ||
          x.text ||
          x.choice_name ||
          x.choiceName ||
          '';

        var qty = x.qty || x.quantity || '';

        var out = String(name || '').trim();
        if(!out && x.items && Array.isArray(x.items)){
          out = x.items.map(extract).filter(Boolean).join(', ');
        }

        if(qty && out){
          out = out + ' x' + qty;
        }

        return out;
      };

      var normalize = function(v){
        if(v == null) return [];
        if(Array.isArray(v)){
          return v.map(extract).filter(Boolean);
        }
        if(typeof v === 'object'){
          var one = extract(v);
          return one ? [one] : [];
        }

        var s = String(v || '').trim();
        if(!s) return [];

        if((s.charAt(0)==='[' && s.charAt(s.length-1)===']') || (s.charAt(0)==='{' && s.charAt(s.length-1)==='}')){
          try{
            var parsed = JSON.parse(s);
            return normalize(parsed);
          }catch(e){}
        }

        return [s];
      };

      var arr = normalize(value)
        .map(function(s){ return String(s || '').trim(); })
        .filter(Boolean);

      var seen = {};
      arr = arr.filter(function(s){
        var k = s.toLowerCase();
        if(seen[k]) return false;
        seen[k] = true;
        return true;
      });

      return arr.join(', ');
    },
    _formatStickerOrderId:function(id){
      var s=String(id||'').trim();
      if(!s) return '-';
      if(s.length<=18) return s;

      var m=s.match(/([A-Z0-9]{5,10})$/i);
      if(m&&m[1]){
        return m[1].toUpperCase();
      }

      return s.slice(0,4)+'…'+s.slice(-8);
    },
    _formatStickerOrderNo:function(no){
      var s=String(no||'').trim();
      if(!s) return '';
      if(s.length>8) s=s.slice(0,8);
      return 'No.'+s;
    },
    _truncateStickerText:function(text,max){
      var s=String(text||'').trim();
      max=parseInt(max,10)||24;
      if(s.length<=max) return s;
      return s.slice(0,Math.max(1,max-1))+'…';
    },
    _normalizeStickerLabel:function(label){
      label=label||{};
      var order=label.order||label.rawOrder||label||{};
      var item=label.item||label.rawItem||null;
      var pick=function(obj,keys,fallback){
        obj=obj||{};
        for(var i=0;i<keys.length;i++){
          var k=keys[i];
          if(obj[k]!==undefined&&obj[k]!==null&&String(obj[k]).trim()!==''){
            return obj[k];
          }
        }
        return fallback;
      };
      var qtyRaw=label.qty;
      if(qtyRaw===undefined||qtyRaw===null||qtyRaw===''){
        qtyRaw=item?pick(item,['qty','quantity','count'],1):1;
      }
      var qty=parseInt(qtyRaw,10);
      if(isNaN(qty)||qty<1)qty=1;
      var orderId=pick(order,['id','orderId','order_id','orderNo','order_no','code'],'');
      var orderNo=pick(order,['order_no','orderNo','no','queue_no','queueNo','running_no','runningNo','number','order_number','orderNumber','display_no','displayNo'],'');
      var customer=pick(order,['customer_name','customerName','customer','name','buyer_name'],'');
      var department=pick(order,['department','dept','company','village','address','delivery_address'],'');
      var note=pick(order,['customer_note','note','remark','remarks','comment'],'');
      var paymentMethod=pick(order,['payment_method','paymentMethod','payment','pay_method'],'');
      var total=pick(order,['total','total_amount','grand_total','amount','net_total'],0);
      var status=pick(order,['status','order_status'],'');
      var itemName=item?pick(item,['name','menu_name','menuName','title','item_name','product_name'],''):'';
      var rawOptions=item?pick(item,['options','selectedChoices','selected_choices','choices','toppings','option_text'],''):'';
      var options=App.admin._formatStickerOptions?App.admin._formatStickerOptions(rawOptions):String(rawOptions||'');
      var comment=item?pick(item,['item_comment','comment','note','remark','remarks'],''):'';
      var itemList=label.items||order.items||order.order_items||order.orderItems||[];
      return {
        type:label.type||(item?'item':'order'),
        orderId:orderId,
        orderNo:orderNo,
        customer:customer,
        department:department,
        note:note,
        paymentMethod:paymentMethod,
        total:total,
        status:status,
        itemName:itemName,
        qty:qty,
        options:options,
        comment:comment,
        copyIndex:parseInt(label.copyIndex,10)||1,
        copyTotal:parseInt(label.copyTotal,10)||1,
        originalQty:parseInt(label.originalQty,10)||qty,
        order:order,
        item:item,
        items:Array.isArray(itemList)?itemList:[]
      };
    },
    _buildStickerStandaloneHtml:function(labels,paper){
      var rows=Array.isArray(labels)?labels:[];
      var normalized=rows.map(function(row){
        return App.admin._normalizeStickerLabel?App.admin._normalizeStickerLabel(row):(row||{});
      });
      var width=Math.max(20,Math.min(120,parseFloat((paper&&paper.widthMm)||50)||50));
      var height=Math.max(20,Math.min(120,parseFloat((paper&&paper.heightMm)||30)||30));
      var margin=Math.max(0,Math.min(10,parseFloat((paper&&paper.marginMm)||2)||2));
      var fontScale=Math.max(0.6,Math.min(2,parseFloat((paper&&paper.fontScale)||1)||1));
      var css='@page{size:'+width+'mm '+height+'mm;margin:0;}'
        +'html,body{margin:0;padding:0;background:#fff;color:#000;font-family:Arial,Tahoma,sans-serif;}'
        +'*{box-sizing:border-box;}'
        +'.ct-label{width:'+width+'mm;height:'+height+'mm;padding:1.5mm 1.6mm;line-height:1.18;overflow:hidden;page-break-after:always;break-after:page;}'
        +'.ct-last{page-break-after:auto;break-after:auto;}'
        +'.ct-h{font-size:7.5px;font-weight:700;line-height:1.18;margin-bottom:.45mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
        +'.ct-row{font-size:7.2px;line-height:1.18;margin-bottom:.35mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
        +'.ct-menu{font-size:9px;font-weight:800;line-height:1.15;margin-top:.45mm;margin-bottom:.45mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
        +'.ct-note{font-size:7px;line-height:1.15;margin-bottom:.3mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
        +'.ct-sep{border-top:.6px solid #000;margin:.65mm 0 .55mm;}'
        +'.ct-cash{font-weight:700;}' +'.ct-footer{font-size:7.5px;line-height:1.15;margin-top:.45mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}';
      var body='';
      normalized.forEach(function(o,idx){
        o=o||{};
        var cls='ct-label'+(idx===normalized.length-1?' ct-last':'');
        var orderCode=App.admin._formatStickerOrderId?App.admin._formatStickerOrderId(o.orderId):String(o.orderId||'-');
        var orderId=App.u.esc(String(orderCode||'-'));
        var customerText=App.admin._truncateStickerText?App.admin._truncateStickerText(o.customer,18):String(o.customer||'-');
        var customer=App.u.esc(String(customerText||'-'));
        var deptText=App.admin._truncateStickerText?App.admin._truncateStickerText(o.department,18):String(o.department||'');
        var dept=App.u.esc(String(deptText||''));
        var noteText=App.admin._truncateStickerText?App.admin._truncateStickerText(o.note,32):String(o.note||'');
        var note=App.u.esc(String(noteText||''));
        var paymentRaw=String(o.paymentMethod||'').trim();
        var paymentKey=paymentRaw.toLowerCase();
        var isCash=(paymentKey==='cash'||paymentKey==='cod'||paymentKey.indexOf('เงินสด')>-1);
        var paymentShort=isCash?'COD':(App.admin._truncateStickerText?App.admin._truncateStickerText(paymentRaw||'scan',10):String(paymentRaw||'scan'));
        var status=App.u.esc(String(o.status||''));
        var totalRaw=parseFloat(o.total||0); if(!isFinite(totalRaw))totalRaw=0;
        var total='฿'+Math.round(totalRaw).toLocaleString('th-TH');
        var items=Array.isArray(o.items)?o.items:[];
        var itemNameText=App.admin._truncateStickerText?App.admin._truncateStickerText(o.itemName,28):String(o.itemName||'');
        var itemName=App.u.esc(String(itemNameText||''));
        var itemQty=Math.max(1,parseInt(o.qty||1,10)||1);
        var optionsText=String(o.options||'').replace(/[\x00-\x1F\x7F]/g,' ').trim();
        if(App.admin._truncateStickerText)optionsText=App.admin._truncateStickerText(optionsText,36);
        var options=App.u.esc(String(optionsText||''));
        var commentText=String(o.comment||'').replace(/[\x00-\x1F\x7F]/g,' ').trim();
        if(App.admin._truncateStickerText)commentText=App.admin._truncateStickerText(commentText,32);
        var comment=App.u.esc(String(commentText||''));
        var copyTotal=Math.max(1,parseInt(o.copyTotal||1,10)||1);
        var copyIndex=Math.max(1,parseInt(o.copyIndex||1,10)||1);

        body+='<section class="'+cls+'">';
        var orderNoText=App.admin._formatStickerOrderNo?App.admin._formatStickerOrderNo(o.orderNo):'';
        var headLeft=(orderNoText?orderNoText+' ':'')+'#'+orderId;
        body+='<div class="ct-h">'+App.u.esc(headLeft)+' | '+App.u.esc(String(paymentShort||'-'))+'</div>';
        var who=(customer&&customer!=='-'?customer:'')+(dept?(' / '+dept):'');
        if(who)body+='<div class="ct-row">'+who+'</div>';
        if(status && !isCash && String(o.type||'')!=='item' && String(status||'').toLowerCase()!=='cooking')body+='<div class="ct-note">สถานะ: '+status+'</div>';
        body+='<div class="ct-sep"></div>';

        if(String(o.type||'')==='item'){
          if(itemName)body+='<div class="ct-menu">'+itemName+(itemQty>1?(' x'+itemQty):'')+'</div>';
          if(copyTotal>1)body+='<div class="ct-note">ดวง '+copyIndex+'/'+copyTotal+'</div>';
          if(options)body+='<div class="ct-note">ตัวเลือก: '+options+'</div>';
          if(comment)body+='<div class="ct-note">หมายเหตุเมนู: '+comment+'</div>';
        }else if(items.length){
          items.slice(0,3).forEach(function(it){
            var name=App.u.esc(String(it&&((it.menu_name||it.name||it.menuName||it.item_name)||'')||''));
            var qty=Math.max(1,parseInt(it&&(it.qty||it.quantity||it.count)||1,10)||1);
            var itOptions=App.u.esc(String(it&&(it.options||it.selectedChoices||it.selected_choices||it.choices||it.toppings)||'').replace(/[\x00-\x1F\x7F]/g,' ').trim());
            var itComment=App.u.esc(String(it&&(it.item_comment||it.comment||it.note)||'').replace(/[\x00-\x1F\x7F]/g,' ').trim());
            if(name)body+='<div class="ct-menu">'+name+(qty>1?(' x'+qty):'')+'</div>';
            if(itOptions)body+='<div class="ct-note">ตัวเลือก: '+itOptions+'</div>';
            if(itComment)body+='<div class="ct-note">หมายเหตุเมนู: '+itComment+'</div>';
          });
          if(items.length>3){ body+='<div class="ct-note">+ อีก '+(items.length-3)+' รายการ</div>'; }
        }

        if(note)body+='<div class="ct-note">'+note+'</div>';
        body+='<div class="ct-sep"></div><div class="ct-footer '+(isCash?'ct-cash':'')+'">'+(isCash?'เก็บเงินปลายทาง • ':'รวม ')+App.u.esc(total)+'</div>';
        body+='</section>';
      });
      return '<!doctype html><html><head><meta charset="UTF-8"><title>Sticker</title><style>'+css+'</style></head><body>'+body+'</body></html>';
    },
    _openStickerPrintWindow:function(html,preopenedWindow){
      var out=String(html||'').trim();
      if(!out)return {ok:false,mode:'none',popupBlocked:false};
      var win=preopenedWindow||null;
      var blocked=false;
      if(!win){
        try{ win=window.open('','ct221b_sticker_print','width=560,height=760'); }
        catch(_e){ win=null; }
      }
      if(win&&win.document){
        try{
          console.log('[ct221b-print-window] mode=window');
          win.document.open();
          win.document.write(out);
          win.document.close();
          var closeLater=function(){
            try{win.removeEventListener('afterprint',closeLater);}catch(_x){}
            setTimeout(function(){try{win.close();}catch(_y){}},900);
          };
          try{win.addEventListener('afterprint',closeLater);}catch(_a){}
          setTimeout(function(){ try{win.focus();win.print();}catch(_b){} },520);
          return {ok:true,mode:'window',popupBlocked:false};
        }catch(_w){ blocked=true; }
      }else{ blocked=true; }

      try{
        console.log('[ct221b-print-window] mode=iframe-fallback');
        var iframe=document.createElement('iframe');
        iframe.style.cssText='position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:0;opacity:0;';
        document.body.appendChild(iframe);
        var doc=iframe.contentWindow&&iframe.contentWindow.document;
        if(!doc)throw new Error('iframe_document_unavailable');
        doc.open();
        doc.write(out);
        doc.close();
        setTimeout(function(){
          try{iframe.contentWindow.focus();iframe.contentWindow.print();}catch(_p){}
          setTimeout(function(){try{if(iframe&&iframe.parentNode)iframe.parentNode.removeChild(iframe);}catch(_r){}},2200);
        },560);
        return {ok:true,mode:'iframe',popupBlocked:blocked};
      }catch(_f){
        console.log('[ct221b-print-window] failed');
        App.ui.toast('Browser บล็อกหน้าต่างพิมพ์ กรุณาอนุญาต popup หรือใช้ดาวน์โหลดไฟล์สติ๊กเกอร์','warn');
        return {ok:false,mode:'none',popupBlocked:true};
      }
    },

    _isCancelledOrderStatus:function(status){
      var st=String(status||'').trim().toLowerCase();
      return ['cancelled','canceled','cancel','void','refunded','timeout'].indexOf(st)>-1;
    },

    _getStickerPaperCfg:function(scope){
      var isBatch=String(scope||'')==='batch';
      var prefix=isBatch?'bs':'ss';
      var readVal=function(id){
        var el=document.getElementById(id);
        return el?String(el.value||'').trim():'';
      };
      var toNumSafe=function(v,fb,min,max){
        var n=parseFloat(String(v||'').replace(',','.'));
        if(isNaN(n))n=fb;
        if(typeof min==='number')n=Math.max(min,n);
        if(typeof max==='number')n=Math.min(max,n);
        return n;
      };
      var parseSize=function(raw){
        var s=String(raw||'').trim().toLowerCase()
          .replace(/มม\./g,'mm')
          .replace(/มม/g,'mm')
          .replace(/mm/g,'')
          .replace(/[×*]/g,'x')
          .replace(/\s+/g,'')
          .replace(/,/g,'.');
        var m=s.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
        if(!m)return null;
        var w=parseFloat(m[1]),h=parseFloat(m[2]);
        if(!(w>0&&h>0))return null;
        return {widthMm:w,heightMm:h};
      };

      var size=parseSize(readVal(prefix+'-size'))||{widthMm:50,heightMm:30};

      var widthMm=toNumSafe(readVal(prefix+'-width-mm'),size.widthMm,10,200);
      var heightMm=toNumSafe(readVal(prefix+'-height-mm'),size.heightMm,10,200);
      var marginMm=toNumSafe(readVal(prefix+'-margin-mm'),2,0,20);
      var fontScale=toNumSafe(readVal(prefix+'-font-scale'),1,0.5,2);

      var templateMode=readVal(prefix+'-template-mode')||'sticker_per_item';
      if(['sticker_per_order','sticker_per_item'].indexOf(templateMode)<0)templateMode='sticker_per_item';

      var qtyMode=readVal(prefix+'-item-qty-mode')||'repeat_each';
      if(['repeat_each','show_qty'].indexOf(qtyMode)<0)qtyMode='repeat_each';

      return {
        widthMm:widthMm,
        heightMm:heightMm,
        marginMm:marginMm,
        fontScale:fontScale,
        templateMode:templateMode,
        qtyMode:qtyMode
      };
    },

    _expandOrdersForSticker:function(orders,scope){
      var list=Array.isArray(orders)?orders:[];
      var cfg=App.admin._getStickerPaperCfg?App.admin._getStickerPaperCfg(scope):{templateMode:'sticker_per_item',qtyMode:'repeat_each'};
      var templateMode=cfg.templateMode||'sticker_per_item';
      var qtyMode=cfg.qtyMode||'repeat_each';
      var labels=[];

      var getItems=function(o){
        if(!o)return [];
        if(Array.isArray(o.items))return o.items;
        if(Array.isArray(o.order_items))return o.order_items;
        if(Array.isArray(o.orderItems))return o.orderItems;
        return [];
      };

      var getQty=function(item){
        var n=parseInt(item&&((item.qty!=null?item.qty:item.quantity)),10);
        if(isNaN(n)||n<1)n=1;
        return Math.min(99,n);
      };

      list.forEach(function(order){
        if(!order)return;
        var status=String(order.status||'').trim();
        if(App.admin._isCancelledOrderStatus&&App.admin._isCancelledOrderStatus(status))return;

        var items=getItems(order);

        if(templateMode==='sticker_per_order'){
          labels.push({
            type:'order',
            order:order,
            items:items,
            scope:scope||'batch'
          });
          return;
        }

        items.forEach(function(item){
          if(!item)return;
          var qty=getQty(item);

          if(qtyMode==='repeat_each'){
            for(var i=1;i<=qty;i++){
              labels.push({
                type:'item',
                order:order,
                item:item,
                qty:1,
                originalQty:qty,
                copyIndex:i,
                copyTotal:qty,
                scope:scope||'batch'
              });
            }
          }else{
            labels.push({
              type:'item',
              order:order,
              item:item,
              qty:qty,
              originalQty:qty,
              copyIndex:1,
              copyTotal:1,
              scope:scope||'batch'
            });
          }
        });
      });

      return labels;
    },

    _groupStickerLabelsByOrder:function(labels){
      var list=Array.isArray(labels)?labels:[];
      var groups=[];
      var map={};

      var safeId=function(v){
        var s=String(v||'').trim();
        return s || '';
      };

      list.forEach(function(label,idx){
        var order=label&&label.order?label.order:{};
        var rawId=safeId(order.id||order.orderId||order.order_id||label.orderId||label.order_id);
        var key=rawId || ('NO_ORDER_ID_'+idx);

        if(!map[key]){
          map[key]={
            orderId:rawId || key,
            order:order,
            labels:[]
          };
          groups.push(map[key]);
        }

        map[key].labels.push(label);
      });

      return groups;
    },

    _resolveStickerExportOrders:function(options,done){
      options=options||{};
      var source=String(options.source||'dashboard');
      var scope=options.scope||(source==='single'?'single':'batch');
      var orders=[];

      try{
        if(source==='batch'){
          orders=App.admin._getBatchOrders?App.admin._getBatchOrders():[];
        }else if(source==='mobile'){
          if(App.admin._mobileStickerSource==='batch'&&Array.isArray(App.admin._mobileBatchStickerOrders)&&App.admin._mobileBatchStickerOrders.length){
            orders=App.admin._mobileBatchStickerOrders;
            source='batch';
          }else{
            orders=App.admin._getPrintingSelectedOrders?App.admin._getPrintingSelectedOrders('sticker'):[];
          }
        }else if(source==='single'){
          var idx=App.admin._printOrderIdx;
          var list=(App.state&&Array.isArray(App.state.adminOrders))?App.state.adminOrders:(Array.isArray(App.admin._ordersData)?App.admin._ordersData:[]);
          var one=(idx!=null&&idx>=0)?list[idx]:null;
          orders=one?[one]:[];
        }else{
          orders=App.admin._getPrintingSelectedOrders?App.admin._getPrintingSelectedOrders('sticker'):[];
        }
      }catch(e){
        console.warn('[clabel-export] resolve source failed',e);
        orders=[];
      }

      var finish=function(fullOrders){
        var list=Array.isArray(fullOrders)&&fullOrders.length?fullOrders:orders;

        var valid=list.filter(function(o){
          return o&&!App.admin._isCancelledOrderStatus(String(o.status||''));
        });

        var labels=App.admin._expandOrdersForSticker(valid,scope);
        var groups=App.admin._groupStickerLabelsByOrder(labels);

        console.log('[clabel-export]',{
          source:source,
          scope:scope,
          orders:valid.length,
          labels:labels.length,
          groups:groups.length
        });

        if(!valid.length||!labels.length||!groups.length){
          App.ui.toast('ไม่พบข้อมูลสติ๊กเกอร์สำหรับบันทึกไฟล์','warn');
          if(typeof done==='function')done(null);
          return;
        }

        if(typeof done==='function'){
          done({
            source:source,
            scope:scope,
            orders:valid,
            labels:labels,
            groups:groups,
            paper:App.admin._getStickerPaperCfg(scope)
          });
        }
      };

      if(orders.length&&App.admin._ensureOrdersItemsLoaded){
        App.admin._ensureOrdersItemsLoaded(orders,function(full){
          finish(Array.isArray(full)&&full.length?full:orders);
        });
      }else{
        finish(orders);
      }
    },

    exportStickerImagesForClabelTrade:function(options){
      options=options||{};
      options.splitByOrder = options.splitByOrder !== false;

      App.admin._resolveStickerExportOrders(options,function(result){
        if(!result){
          return;
        }

        var groups = options.splitByOrder ? result.groups : [{
          orderId:'ALL_ORDERS',
          order:null,
          labels:result.labels
        }];

        if(!groups.length){
          App.ui.toast('ไม่พบข้อมูลสติ๊กเกอร์สำหรับบันทึกไฟล์','warn');
          return;
        }

        console.log('[clabel-export-png]',{
          source:result.source,
          scope:result.scope,
          groups:groups.length,
          labels:result.labels.length,
          splitByOrder:options.splitByOrder
        });

        App.admin._exportStickerGroupsAsPng(groups,result.paper,options);
      });
    },

    _sanitizeClabelFilename:function(value){
      var s=String(value||'').trim();
      s=s.replace(/[\/\\:*?"<>|]/g,'_');
      s=s.replace(/\s+/g,'_');
      s=s.replace(/_+/g,'_');
      s=s.substring(0,80);
      return s || 'ORDER';
    },

    _exportStickerGroupsAsPng:function(groups,paper,options){
      options=options||{};
      paper=paper||App.admin._getStickerPaperCfg('batch');

      if(typeof html2canvas==='undefined'){
        App.ui.toast('ไม่พบ html2canvas สำหรับสร้าง PNG กรุณาลองดาวน์โหลด PDF แทน','warn');
        return;
      }

      var allTasks=[];
      groups.forEach(function(group){
        var orderId=App.admin._sanitizeClabelFilename(group.orderId||'ORDER');
        (group.labels||[]).forEach(function(label,idx){
          allTasks.push({
            group:group,
            label:label,
            orderId:orderId,
            index:idx+1,
            total:(group.labels||[]).length
          });
        });
      });

      if(!allTasks.length){
        App.ui.toast('ไม่พบ label สำหรับบันทึกไฟล์','warn');
        return;
      }

      var root=document.createElement('div');
      root.style.cssText='position:fixed;left:-99999px;top:0;background:#fff;z-index:-1;opacity:0;pointer-events:none;';
      document.body.appendChild(root);

      var scale=Math.max(2,Math.min(4,parseFloat(options.scale||3)||3));
      var widthMm=parseFloat(paper.widthMm||50)||50;
      var heightMm=parseFloat(paper.heightMm||30)||30;

      var mmToPx=function(mm){
        return Math.round((parseFloat(mm)||0)*96/25.4);
      };

      var renderOne=function(task,done){
        var iframe=null;
        var cleanup=function(){
          try{ if(iframe&&iframe.parentNode)iframe.parentNode.removeChild(iframe); }catch(_){ }
        };
        try{
          var html=App.admin._buildStickerStandaloneHtml([task.label],paper);
          iframe=document.createElement('iframe');
          iframe.style.cssText='position:fixed;left:-99999px;top:0;width:'+mmToPx(widthMm)+'px;height:'+mmToPx(heightMm)+'px;border:0;opacity:0;pointer-events:none;background:#fff;';
          document.body.appendChild(iframe);

          var doc=iframe.contentDocument||(iframe.contentWindow&&iframe.contentWindow.document);
          if(!doc){ cleanup(); done(null); return; }
          doc.open();
          doc.write(html);
          doc.close();

          setTimeout(function(){
            try{
              var labelNode=doc.querySelector('.ct-label') || (doc.body&&doc.body.firstElementChild);
              if(!labelNode){
                cleanup();
                done(null);
                return;
              }

              html2canvas(labelNode,{
                backgroundColor:'#ffffff',
                scale:scale,
                useCORS:true,
                logging:false,
                width:mmToPx(widthMm),
                height:mmToPx(heightMm),
                windowWidth:mmToPx(widthMm),
                windowHeight:mmToPx(heightMm)
              }).then(function(canvas){
                try{
                  canvas.toBlob(function(blob){
                    cleanup();
                    done(blob||null);
                  },'image/png');
                }catch(e){
                  cleanup();
                  console.warn('[clabel-export-png] toBlob failed',e);
                  done(null);
                }
              }).catch(function(e){
                cleanup();
                console.warn('[clabel-export-png] html2canvas failed',e);
                done(null);
              });
            }catch(e){
              cleanup();
              console.warn('[clabel-export-png] render failed',e);
              done(null);
            }
          },220);
        }catch(e){
          cleanup();
          console.warn('[clabel-export-png] render failed',e);
          done(null);
        }
      };

      var i=0,success=0;
      var next=function(){
        if(i>=allTasks.length){
          try{if(root&&root.parentNode)root.parentNode.removeChild(root);}catch(_){ }
          if(success>0){
            App.ui.toast('บันทึกไฟล์สติ๊กเกอร์แล้ว ให้นำไปเปิดในแอป CLabel trade','success');
          }else{
            App.ui.toast('ไม่สามารถบันทึก PNG ได้ กรุณาลองดาวน์โหลด PDF แทน','warn');
          }
          return;
        }

        var task=allTasks[i++];
        renderOne(task,function(blob){
          if(blob){
            success++;
            var filename='clabel_'+task.orderId+'_'+String(task.index).padStart(2,'0')+'.png';
            App.admin._shareOrDownloadClabelFile(blob,filename);
          }
          setTimeout(next,350);
        });
      };

      next();
    },

    _shareOrDownloadClabelFile:function(blob,filename){
      filename=filename||'clabel_sticker.png';
      try{
        var file=new File([blob],filename,{type:'image/png'});
        if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
          navigator.share({
            files:[file],
            title:'CLabel sticker',
            text:'เปิดไฟล์นี้ในแอป CLabel trade เพื่อพิมพ์ผ่าน Bluetooth'
          }).catch(function(){
            App.admin._downloadBlobFile(blob,filename);
          });
          return;
        }
      }catch(_){ }

      App.admin._downloadBlobFile(blob,filename);
    },

    _downloadBlobFile:function(blob,filename){
      try{
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a');
        a.href=url;
        a.download=filename||'clabel_sticker.png';
        document.body.appendChild(a);
        a.click();
        setTimeout(function(){
          try{document.body.removeChild(a);}catch(_){ }
          try{URL.revokeObjectURL(url);}catch(_){ }
        },1200);
      }catch(e){
        console.warn('[clabel-export-png] download failed',e);
        App.ui.toast('ไม่สามารถดาวน์โหลดไฟล์ได้ กรุณาลอง PDF แทน','warn');
      }
    },

    printStickerSelectionForCT221B:function(){
      var ids=[];
      try{
        ids=App.admin._getPrintingSelectedIds?App.admin._getPrintingSelectedIds('sticker'):[];
      }catch(_){ids=[];}

      if(!ids.length){
        App.ui.toast('กรุณาเลือกออเดอร์ก่อนพิมพ์','warn');
        return;
      }

      var preWin=null;
      try{
        preWin=window.open('', 'ct221b_sticker_print', 'width=560,height=760');
        if(preWin&&preWin.document){
          preWin.document.open();
          preWin.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Preparing Sticker...</title></head><body style="font-family:Arial,Tahoma,sans-serif;padding:16px">กำลังเตรียมสติ๊กเกอร์...</body></html>');
          preWin.document.close();
        }
      }catch(_){
        preWin=null;
      }

      var closePreWin=function(){
        try{if(preWin&&!preWin.closed)preWin.close();}catch(_){ }
      };

      var selected=[];
      try{
        selected=App.admin._getPrintingSelectedOrders?App.admin._getPrintingSelectedOrders('sticker'):[];
      }catch(_){selected=[];}

      if(!selected.length){
        closePreWin();
        App.ui.toast('ไม่พบออเดอร์ที่เลือก','warn');
        return;
      }

      var proceed=function(orders){
        orders=Array.isArray(orders)&&orders.length?orders:selected;

        var valid=orders.filter(function(o){
          return o&&!App.admin._isCancelledOrderStatus(String(o.status||''));
        });

        if(!valid.length){
          closePreWin();
          App.ui.toast('ไม่มีออเดอร์ที่พิมพ์ได้','warn');
          return;
        }

        var labels=App.admin._expandOrdersForSticker(valid,'batch');

        console.log('[ct221b-sticker-print]',{
          ids:ids.length,
          orders:valid.length,
          labels:labels.length
        });

        if(!labels.length){
          closePreWin();
          App.ui.toast('ไม่พบข้อมูลสำหรับพิมพ์สติ๊กเกอร์','warn');
          return;
        }

        var paper=App.admin._getStickerPaperCfg('batch');
        var html=App.admin._buildStickerStandaloneHtml(labels,paper);

        App.admin._openStickerPrintWindow(html,preWin);

        try{
          if(App.admin._markPrintedOrders){
            App.admin._markPrintedOrders(valid.map(function(o){return String(o.id||o.orderId||'');}).filter(Boolean),'sticker');
          }
        }catch(e){
          console.warn('[ct221b-sticker-print] mark printed failed',e);
        }
      };

      var needsLoad=selected.filter(function(o){
        return !o||!Array.isArray(o.items)||!o.items.length;
      });

      if(needsLoad.length&&App.admin._ensureOrdersItemsLoaded){
        App.admin._ensureOrdersItemsLoaded(selected,function(full){
          var merged=Array.isArray(full)&&full.length?full:selected;
          proceed(merged);
        });
      }else{
        proceed(selected);
      }
    },

    printBatchStickerForCT221B:function(){
      var orders=[];
      try{
        orders=App.admin._getBatchOrders?App.admin._getBatchOrders():[];
      }catch(_){
        orders=[];
      }

      if(!orders.length){
        App.ui.toast('ไม่มีออเดอร์ที่เลือก','warn');
        return;
      }

      var preWin=null;
      try{
        preWin=window.open('', 'ct221b_sticker_print', 'width=560,height=760');
        if(preWin&&preWin.document){
          preWin.document.open();
          preWin.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Preparing Sticker...</title></head><body style="font-family:Arial,Tahoma,sans-serif;padding:16px">กำลังเตรียมสติ๊กเกอร์...</body></html>');
          preWin.document.close();
        }
      }catch(_){
        preWin=null;
      }

      var closePreWin=function(){
        try{if(preWin&&!preWin.closed)preWin.close();}catch(_){}
      };

      var proceed=function(fullOrders){
        var list=Array.isArray(fullOrders)&&fullOrders.length?fullOrders:orders;

        var valid=list.filter(function(o){
          return o&&!App.admin._isCancelledOrderStatus(String(o.status||''));
        });

        if(!valid.length){
          closePreWin();
          App.ui.toast('ไม่มีออเดอร์ที่พิมพ์ได้','warn');
          return;
        }

        var labels=App.admin._expandOrdersForSticker(valid,'batch');

        console.log('[batch-sticker-print]',{
          orders:valid.length,
          labels:labels.length
        });

        if(!labels.length){
          closePreWin();
          App.ui.toast('ไม่พบข้อมูลสำหรับพิมพ์สติ๊กเกอร์','warn');
          return;
        }

        var paper=App.admin._getStickerPaperCfg('batch');
        var html=App.admin._buildStickerStandaloneHtml(labels,paper);

        App.admin._openStickerPrintWindow(html,preWin);

        try{
          if(App.admin._markPrintedOrders){
            App.admin._markPrintedOrders(valid.map(function(o){return String(o.id||o.orderId||'');}).filter(Boolean),'sticker');
          }
        }catch(e){
          console.warn('[batch-sticker-print] mark printed failed',e);
        }
      };

      if(App.admin._ensureOrdersItemsLoaded){
        App.admin._ensureOrdersItemsLoaded(orders,function(full){
          proceed(Array.isArray(full)&&full.length?full:orders);
        });
      }else{
        proceed(orders);
      }
    },


    _showMobileStickerGuide:function(){
      var m=document.getElementById('mobile-sticker-guide-modal');
      if(!m){
        App.ui.toast('ไม่พบหน้าต่างแนะนำสติ๊กเกอร์','warn');
        return;
      }
      m.classList.add('active');
      m.setAttribute('aria-hidden','false');
    },

    _hideMobileStickerGuide:function(){
      var m=document.getElementById('mobile-sticker-guide-modal');
      if(m){
        m.classList.remove('active');
        m.setAttribute('aria-hidden','true');
      }
    },    openMobileStickerPrintFallbackFromBatch:function(){
      var orders=[];
      try{
        orders=App.admin._getBatchOrders?App.admin._getBatchOrders():[];
      }catch(_){
        orders=[];
      }

      if(!orders.length){
        App.ui.toast('ไม่มีออเดอร์ที่เลือก','warn');
        return;
      }

      var ids=orders.map(function(o){
        return String((o&&(o.id||o.orderId))||'');
      }).filter(Boolean);

      if(!ids.length){
        App.ui.toast('ไม่พบเลขออเดอร์สำหรับพิมพ์','warn');
        return;
      }

      App.admin._mobileBatchStickerIds=ids;
      App.admin._mobileBatchStickerOrders=orders;

      console.log('[batch-sticker-mobile-fallback]',{
        orders:orders.length,
        ids:ids.length
      });

      if(App.admin.openMobileStickerPrintFallback){
        App.admin.openMobileStickerPrintFallback({source:'batch',ids:ids,orders:orders});
        return;
      }

      if(App.admin._showMobileStickerGuide){
        App.admin._showMobileStickerGuide();
        return;
      }

      App.ui.toast('บนมือถือให้ใช้ดาวน์โหลดไฟล์สติ๊กเกอร์','warn');
    },

    openMobileStickerPrintFallback:function(opts){
      var o=opts||{};
      if(String(o.source||'')==='batch'){
        App.admin._mobileStickerSource='batch';
        if(Array.isArray(o.ids)&&o.ids.length)App.admin._mobileBatchStickerIds=o.ids.slice();
        if(Array.isArray(o.orders)&&o.orders.length)App.admin._mobileBatchStickerOrders=o.orders.slice();
      }else{
        App.admin._mobileStickerSource='selection';
      }
      if(App.admin._showMobileStickerGuide){
        App.admin._showMobileStickerGuide();
        return;
      }
      App.ui.toast('บนมือถือให้ใช้ดาวน์โหลดไฟล์สติ๊กเกอร์','warn');
    },

    downloadStickerPdfForSelectedOrders:function(){
      var src=String(App.admin._mobileStickerSource||'selection');
      if(src==='batch'&&Array.isArray(App.admin._mobileBatchStickerOrders)&&App.admin._mobileBatchStickerOrders.length){
        console.log('[mobile-sticker-download]',{
          source:src,
          batchOrders:App.admin._mobileBatchStickerOrders.length,
          selectedIds:Array.isArray(App.admin._mobileBatchStickerIds)?App.admin._mobileBatchStickerIds.length:0
        });
        App.admin.downloadPrintingSelectionPdf('sticker',{mobileSource:'batch',mobileOrders:App.admin._mobileBatchStickerOrders,mobileIds:App.admin._mobileBatchStickerIds||[]});
        return;
      }
      var ids=App.admin._getPrintingSelectedIds?App.admin._getPrintingSelectedIds('sticker'):[];
      console.log('[mobile-sticker-download]',{source:src,batchOrders:0,selectedIds:ids.length});
      if(!ids.length){
        App.ui.toast('กรุณาเลือกออเดอร์ก่อนดาวน์โหลดไฟล์สติ๊กเกอร์','warn');
        return;
      }
      App.admin.downloadPrintingSelectionPdf('sticker');
    },

    tryDirectStickerPrintFromGuide:function(){
      var src=String(App.admin._mobileStickerSource||'selection');
      var isMobile=/iphone|ipad|ipod|android/i.test((navigator&&navigator.userAgent||''));
      if(src==='batch'&&isMobile){
        App.ui.toast('บนมือถือแนะนำให้ใช้ดาวน์โหลดไฟล์สติ๊กเกอร์','warn');
        return;
      }
      if(App.admin.printStickerSelectionForCT221B){
        App.admin.printStickerSelectionForCT221B();
        return;
      }
      App.ui.toast('ยังไม่พบระบบพิมพ์สติ๊กเกอร์ CT221B','error');
    },

    printSingleStickerForCT221B:function(){
      var order=null;
      try{ order=(App.state.adminOrders&&App.state.adminOrders[App.admin._printOrderIdx])||null; }catch(_){ order=null; }
      if(!order){
        try{ order=(App.admin._ordersData&&App.admin._ordersData[App.admin._printOrderIdx])||null; }catch(_2){ order=null; }
      }
      if(!order){ App.ui.toast('ไม่พบออเดอร์สำหรับพิมพ์สติ๊กเกอร์','warn'); return; }

      if(App.admin._isCancelledOrderStatus(String(order.status||''))){
        App.ui.toast('รายการที่ยกเลิกจะไม่ถูกพิมพ์','warn');
        return;
      }

      var proceed=function(fullOrder){
        var o=fullOrder||order;
        if(App.admin._isCancelledOrderStatus(String(o.status||''))){
          App.ui.toast('รายการที่ยกเลิกจะไม่ถูกพิมพ์','warn');
          return;
        }

        var labels=App.admin._expandOrdersForSticker([o],'single');
        console.log('[single-sticker-print]',{labels:labels.length,orderId:String(o.id||o.orderId||'')});
        if(!labels.length){ App.ui.toast('ไม่พบข้อมูลสำหรับพิมพ์สติ๊กเกอร์','warn'); return; }

        var paper=App.admin._getStickerPaperCfg('single');
        var html=App.admin._buildStickerStandaloneHtml(labels,paper);
        App.admin._openStickerPrintWindow(html);

        try{
          if(App.admin._markPrintedOrders){
            App.admin._markPrintedOrders([String(o.id||o.orderId||'')].filter(Boolean),'sticker');
          }
        }catch(e){
          console.warn('[single-sticker-print] mark printed failed',e);
        }
      };

      if(!(Array.isArray(order.items)&&order.items.length) && App.admin._ensureOrderItemsLoaded){
        App.admin._ensureOrderItemsLoaded(order,function(loaded){ proceed(loaded||order); });
        return;
      }
      proceed(order);
    },

    _pageSpecToFrameWidth:function(pageSpec,fallback){
      var spec=String(pageSpec||'').trim();
      if(!spec)return String(fallback||'80mm');
      var parts=spec.split(/\s+/).filter(Boolean);
      if(!parts.length)return String(fallback||'80mm');
      var first=String(parts[0]||'').trim();
      if(!first)return String(fallback||'80mm');
      return first;
    },
    _getReceiptCalibration:function(mode){
      var p=(mode==='batch')?'bp':'ps';
      var se=document.getElementById(p+'-r-scale');
      var xe=document.getElementById(p+'-r-offset-x');
      var ye=document.getElementById(p+'-r-offset-y');
      var sc=parseFloat(se&&se.value);
      var ox=parseFloat(xe&&xe.value);
      var oy=parseFloat(ye&&ye.value);
      if(!(sc>0))sc=100;
      sc=Math.max(80,Math.min(120,sc));
      if(!isFinite(ox))ox=0;
      if(!isFinite(oy))oy=0;
      ox=Math.max(-10,Math.min(10,ox));
      oy=Math.max(-10,Math.min(10,oy));
      return {scale:(sc/100),offsetX:ox,offsetY:oy};
    },
    _scalePaperWidth:function(sizeVal,scale){
      return App.admin._paperSizeToPageSpec(sizeVal,scale).previewWidth;
    },
    _getStickerCalibration:function(mode){
      var p=(mode==='batch')?'bs':'ss';
      var se=document.getElementById(p+'-scale');
      var xe=document.getElementById(p+'-offset-x');
      var ye=document.getElementById(p+'-offset-y');
      var sc=parseFloat(se&&se.value);
      var ox=parseFloat(xe&&xe.value);
      var oy=parseFloat(ye&&ye.value);
      if(!(sc>0))sc=100;
      sc=Math.max(80,Math.min(120,sc));
      if(!isFinite(ox))ox=0;
      if(!isFinite(oy))oy=0;
      ox=Math.max(-10,Math.min(10,ox));
      oy=Math.max(-10,Math.min(10,oy));
      return {scale:(sc/100),offsetX:ox,offsetY:oy};
    },
    _getPrintTextScale:function(mode,tab){
      var id='';
      if(mode==='batch')id=(tab==='receipt')?'bp-text-scale':'bs-text-scale';
      else id=(tab==='receipt')?'ps-text-scale':'ss-text-scale';
      var el=document.getElementById(id);
      var v=parseFloat(el&&el.value);
      if(!(v>0))v=100;
      v=Math.max(70,Math.min(160,v));
      return v/100;
    },
    _getPrintLineHeightScale:function(mode,tab){
      var id='';
      if(mode==='batch')id=(tab==='receipt')?'bp-line-height':'bs-line-height';
      else id=(tab==='receipt')?'ps-line-height':'ss-line-height';
      var el=document.getElementById(id);
      var v=parseFloat(el&&el.value);
      if(!(v>0))v=100;
      v=Math.max(70,Math.min(170,v));
      return v/100;
    },
    // PERF: estimate wrapped lines for auto-fit print scaling
    _estimateWrapLines:function(text,charsPerLine){
      var cpl=Math.max(8,parseInt(charsPerLine||24,10)||24);
      var s=String(text==null?'':text).trim();
      if(!s)return 0;
      var lines=0;
      s.split(/\r?\n/).forEach(function(part){
        var p=String(part||'').trim();
        if(!p){lines+=1;return;}
        lines+=Math.max(1,Math.ceil(p.length/cpl));
      });
      return lines;
    },
    _estimateReceiptAutoFit:function(ctx){
      try{
        if(!ctx||!(ctx.fixedH>0)||!(ctx.fixedW>0))return 1;
        var mmPerPx=0.264583;
        var usableW=Math.max(24,(ctx.fixedW||80)-2*((ctx.padHpx||10)*mmPerPx)-2);
        var charW=Math.max(0.9,(ctx.basePx||12)*mmPerPx*0.52);
        var cpl=Math.max(8,Math.floor(usableW/charW));
        var lines=0,sep=0;
        var show=ctx.show||{};
        if(show.payment)lines+=1.2;
        if(show.shopName)lines+=1.2;
        if(show.orderId)lines+=1;
        sep+=1;
        if(show.datetime)lines+=1;
        if(show.customer)lines+=1;
        if(show.dept&&ctx.order&&ctx.order.department)lines+=1;
        if(show.address&&ctx.customerAddress){lines+=1;lines+=App.admin._estimateWrapLines(ctx.customerAddress,cpl);}
        if(show.address&&ctx.orderDetail){lines+=1;lines+=App.admin._estimateWrapLines(ctx.orderDetail,cpl);}
        if(show.address&&ctx.orderDetailExtra){lines+=1;lines+=App.admin._estimateWrapLines(ctx.orderDetailExtra,cpl);}
        var items=(ctx.order&&ctx.order.items)||[];
        if(show.items&&items.length){
          sep+=1;
          items.forEach(function(it){
            var qty=parseInt(it&&it.qty||1,10)||1;
            var nm=String(it&&it.name||'')+(qty>1?(' ×'+qty):'');
            lines+=App.admin._estimateWrapLines(nm,cpl)+0.1;
            var labels=(ctx.parseItemOptions?ctx.parseItemOptions(it&&it.options):[]);
            if(labels&&labels.length){
              lines+=App.admin._estimateWrapLines('• '+labels.join(', '),Math.max(8,cpl-2))+0.2;
            }
          });
        }
        if(show.total){sep+=1;lines+=1.4;}
        if(show.thankyou){sep+=1;lines+=1.1;}
        lines+=sep*0.45;
        var estMm=(lines*Math.max(0.1,(ctx.basePx||12))*Math.max(1,ctx.lineHeight||1.25)*mmPerPx)+(2*(ctx.padVpx||12)*mmPerPx);
        var availMm=Math.max(8,(ctx.fixedH||0)-0.8);
        if(estMm<=availMm)return 1;
        var fit=availMm/Math.max(estMm,0.1);
        return Math.max(0.42,Math.min(1,fit));
      }catch(_){return 1;}
    },
    _estimateStickerAutoFit:function(ctx){
      try{
        if(!ctx||!(ctx.hMm>0)||!(ctx.wMm>0))return 1;
        var mmPerPx=0.264583;
        var usableW=Math.max(22,(ctx.wMm||80)-2*((ctx.padHpx||10)*mmPerPx)-2);
        var charW=Math.max(0.85,(ctx.basePx||11)*mmPerPx*0.52);
        var cpl=Math.max(8,Math.floor(usableW/charW));
        var lines=0;
        var show=ctx.show||{};
        if(show.payment)lines+=1.1;
        if(show.shopName)lines+=1.1;
        if(show.customer)lines+=1.8;
        if(show.dept&&ctx.order&&ctx.order.department)lines+=1;
        if(show.orderId)lines+=1;
        var items=(ctx.order&&ctx.order.items)||[];
        if(show.items&&items.length){
          lines+=0.45;
          items.slice(0,5).forEach(function(it){
            var qty=parseInt(it&&it.qty||1,10)||1;
            var nm=String(it&&it.name||'')+(qty>1?(' ×'+qty):'');
            lines+=App.admin._estimateWrapLines(nm,cpl)+0.05;
            var labels=(ctx.parseItemOptions?ctx.parseItemOptions(it&&it.options):[]);
            if(labels&&labels.length){
              lines+=App.admin._estimateWrapLines('• '+labels.join(', '),Math.max(8,cpl-2))+0.15;
            }
          });
          if(items.length>5)lines+=1;
        }
        if(show.address&&ctx.customerAddress){lines+=1+App.admin._estimateWrapLines('ที่อยู่ลูกค้า: '+ctx.customerAddress,Math.max(8,cpl-1));}
        if(show.address&&ctx.orderDetail){lines+=1+App.admin._estimateWrapLines('รายละเอียดการสั่ง: '+ctx.orderDetail,Math.max(8,cpl-1));}
        if(show.address&&ctx.orderDetailExtra){lines+=1+App.admin._estimateWrapLines('หมายเหตุเพิ่มเติม: '+ctx.orderDetailExtra,Math.max(8,cpl-1));}
        if(show.total)lines+=1.2;
        var estMm=(lines*Math.max(0.1,(ctx.basePx||11))*Math.max(1,ctx.lineHeight||1.2)*mmPerPx)+(2*(ctx.padVpx||10)*mmPerPx);
        var availMm=Math.max(7,(ctx.hMm||0)-0.8);
        if(estMm<=availMm)return 1;
        var fit=availMm/Math.max(estMm,0.1);
        return Math.max(0.38,Math.min(1,fit));
      }catch(_){return 1;}
    },
    isReadOnly:function(){return App.admin.isGuest();},
    isStaff:function(){return String(App.state.adminRole||'').toLowerCase()==='staff';},
    isGuest:function(){return String(App.state.adminRole||'').toLowerCase()==='guest';},
    isAdmin:function(){return String(App.state.adminRole||'').toLowerCase()==='admin';},
    canManageUsersApi:function(){return App.admin.isAdmin();},
    _auth:function(res){
      if(!res)return false;
      var ok=!(res&&res.success===false);
      if(ok)return false;
      var code=String(res.code||'').toUpperCase();
      var msg=String(res.message||'');
      var isAuthErr=(code==='UNAUTHORIZED'||code==='FORBIDDEN'||/unauthor|forbidden|token|login|permission|not allowed/i.test(msg));
      if(isAuthErr){
        App.ui.toast(msg||'สิทธิ์ไม่เพียงพอ หรือเซสชันหมดอายุ','warn');
        return true;
      }
      return false;
    },    ensureCanEdit:function(){
      if(!App.admin.isGuest())return true;
      App.ui.toast('บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูล','warn');
      return false;
    },
    ensureCanManageUsersApi:function(){
      if(App.admin.canManageUsersApi())return true;
      App.ui.toast('บัญชีนี้ไม่สามารถแก้ไข ผู้ใช้งาน/API ได้','warn');
      return false;
    },
    applyRolePermissions:function(){
      var role=String(App.state.adminRole||'guest').toLowerCase();
      var isGuest=role==='guest';
      var isStaff=role==='staff';
      App.admin.updateProfileChip();
      document.querySelectorAll('[data-admin-only="true"]').forEach(function(el){
        if('disabled' in el)el.disabled=isGuest;
        el.classList.toggle('hidden',isGuest);
      });
      var refreshBtn=document.getElementById('orders-refresh-btn');
      if(refreshBtn)refreshBtn.disabled=false;
      var addUserBtn=document.getElementById('add-user-btn');
      if(addUserBtn){
        addUserBtn.disabled=(isGuest||isStaff);
        addUserBtn.classList.toggle('hidden',(isGuest||isStaff));
      }
      ['s-slipok','s-branch','s-drive'].forEach(function(id){
        var el=document.getElementById(id);
        if(el)el.disabled=(isGuest||isStaff);
      });
    },
    updateProfileChip:function(){
      var role=String(App.state.adminRole||'guest').toLowerCase();
      var user=String(App.state.adminUser||'').trim();
      var roleLabel=role==='admin'?'Admin':role==='staff'?'Staff':'Guest';
      var displayName=user||roleLabel;
      var nameEl=document.querySelector('.admin-profile-name');
      var roleEl=document.getElementById('admin-date');
      var avatarEl=document.querySelector('.admin-profile-avatar');
      if(nameEl)nameEl.textContent=roleLabel;
      if(roleEl)roleEl.textContent=displayName;
      if(avatarEl)avatarEl.textContent=(roleLabel.charAt(0)||'U').toUpperCase();
    },
    _normalizeDeliveryType:function(v){
      var raw=String(v==null?'':v).trim().toLowerCase();
      if(!raw)return 'village';
      if(raw==='company'||raw==='บริษัท')return 'company';
      if(raw==='village'||raw==='หมู่บ้าน')return 'village';
      return 'village';
    },
    _getDeliveryCategoryType:function(){
      return App.admin._normalizeDeliveryType((App.state._settingsRaw&&App.state._settingsRaw.delivery_category_type)||App.state._deliveryCategoryType||'village');
    },
    _getDeliveryNoteMode:function(){
      return App.admin._getDeliveryCategoryType()==='village'?'address':'note';
    },
    _deptLabel:function(){
      return App.admin._getDeliveryCategoryType()==='company'?'บริษัท':'หมู่บ้าน';
    },
    _noteLabel:function(){
      return App.admin._getDeliveryCategoryType()==='village'?'ที่อยู่จัดส่ง':'รายละเอียดการสั่ง';
    },
    _customerNoteLabel:function(){
      return App.admin._getDeliveryCategoryType()==='village'?'หมายเหตุ':'หมายเหตุเพิ่มเติม';
    },
    switchDeliveryType:function(type){
      var v=App.admin._normalizeDeliveryType(type);
      var inp=document.getElementById('s-delivery-type');if(inp)inp.value=v;
      var sel=document.getElementById('s-delivery-type-select');if(sel)sel.value=v;
      var tv=document.getElementById('dt-tab-village'),tc=document.getElementById('dt-tab-company');
      if(tv)tv.classList.toggle('active',v==='village');
      if(tc)tc.classList.toggle('active',v==='company');
      App.admin.updateOrderInfoConfigLabels();
    },
    switchDeliveryNoteMode:function(mode){
      // kept for backward compatibility (legacy onclick hooks)
      App.admin.updateOrderInfoConfigLabels();
    },
    updateOrderInfoConfigLabels:function(){
      var typeEl=document.getElementById('s-delivery-type');
      var typeSel=document.getElementById('s-delivery-type-select');
      var type=typeEl?App.admin._normalizeDeliveryType(typeEl.value||'village'):App.admin._getDeliveryCategoryType();
      if((!typeEl||!String(typeEl.value||'').trim())&&typeSel&&String(typeSel.value||'').trim()){
        type=App.admin._normalizeDeliveryType(typeSel.value||type);
      }
      var isVillage=type==='village';
      var deptLabel=type==='company'?'บริษัท':'หมู่บ้าน';
      var noteLabel=(type==='village')?'ที่อยู่จัดส่ง':'รายละเอียดการสั่ง';
      var dLbl=document.getElementById('s-depts-label');
      if(dLbl)dLbl.textContent='รายการ'+deptLabel+' (คั่นด้วย , )';
      var dInp=document.getElementById('s-depts');
      if(dInp)dInp.placeholder='เช่น '+deptLabel+' A, '+deptLabel+' B, '+deptLabel+' C';
      var dGroup=document.getElementById('s-depts-group');
      if(dGroup)dGroup.style.display=isVillage?'none':'';
      ['bp-dept-label','bs-dept-label','ps-dept-label','ss-dept-label'].forEach(function(id){
        var el=document.getElementById(id);if(el)el.textContent=deptLabel;
      });
      ['bp-address-label','bs-address-label','ps-address-label','ss-address-label'].forEach(function(id){
        var el=document.getElementById(id);if(el)el.textContent=noteLabel;
      });
      var t=document.getElementById('batch-dept-title');if(t)t.textContent='🏢 เลือก'+deptLabel;
      var deptSec=document.getElementById('batch-dept-section');
      if(deptSec)deptSec.style.display=isVillage?'none':'';
      var fd=document.getElementById('orders-dept-filter-label');if(fd)fd.textContent='🏢 '+deptLabel+':';
      var exTitle=document.getElementById('export-pdf-title');if(exTitle)exTitle.textContent='📄 เลือก'+deptLabel+'สำหรับ Export PDF';
      var exAll=document.getElementById('epd-all-label');if(exAll)exAll.textContent='ทุก'+deptLabel;
      var deptFilterWrap=document.getElementById('orders-dept-filter-wrap');
      if(deptFilterWrap)deptFilterWrap.style.display=isVillage?'none':'flex';
      App.state._deliveryCategoryType=type;
      App.state._deliveryNoteMode=(type==='village'?'address':'note');
      if(isVillage)App.admin._ordersFilterDept='all';
      if(isVillage)App.admin._batchSelectedDepts=null;
      if(typeEl)typeEl.value=type;
      if(typeSel)typeSel.value=type;
      App.customer.applyOrderInfoLabels();
      App.customer.fillDepts();
      if(Array.isArray(App.admin._ordersData)&&App.admin._ordersData.length){
        App.admin._renderOrders(App.admin._ordersData);
      }
    },
    openTestOrdersModal:function(){
      if(!App.admin.ensureCanEdit())return;
      var m=document.getElementById('test-orders-modal');
      var mode=document.getElementById('to-mode');
      var simMode=document.getElementById('to-simulate-mode');
      var clear=document.getElementById('to-clear-first');
      var cnt=document.getElementById('to-count');
      var pw=document.getElementById('to-progress-wrap');
      var btn=document.getElementById('run-test-orders-btn');
      if(mode)mode.value='normal';
      if(simMode)simMode.value='auto';
      if(clear)clear.checked=false;
      if(cnt)cnt.value='30';
      if(pw)pw.classList.add('hidden');
      if(btn){
        btn.onclick=App.admin.runTestOrders;
        btn.textContent='เริ่มทดสอบ';
        btn.disabled=false;
        btn.classList.remove('loading');
      }
      App.admin._updateTestProgress(0,30,'พร้อมเริ่มทดสอบ');
      if(m)m.classList.add('active');
    },
    closeTestOrdersModal:function(){
      var m=document.getElementById('test-orders-modal');
      if(m)m.classList.remove('active');
    },
    onTestModeChanged:function(){
      var modeEl=document.getElementById('to-mode');
      var cnt=document.getElementById('to-count');
      if(!modeEl||!cnt)return;
      var m=String(modeEl.value||'normal');
      if(m==='normal')cnt.value='30';
      else if(m==='heavy')cnt.value='90';
      else if(m==='stress')cnt.value='150';
      cnt.disabled=(m!=='custom');
    },
    _updateTestProgress:function(done,total,text){
      var bar=document.getElementById('to-progress-bar');
      var pct=document.getElementById('to-progress-percent');
      var t=document.getElementById('to-progress-text');
      done=Math.max(0,parseInt(done||0));
      total=Math.max(1,parseInt(total||1));
      var p=Math.min(100,Math.round(done*100/total));
      if(bar)bar.style.width=p+'%';
      if(pct)pct.textContent=p+'%';
      if(t)t.textContent=text||('ดำเนินการ '+done+'/'+total);
    },
    // PERF: รองรับ backend หลายเวอร์ชัน (signature เก่า/ใหม่) ของ generateTestOrders
    _callGenerateTestOrdersCompat:function(chunk,simMode,cb){
      var token=App.state.adminToken;
      var attempts=[
        [token,chunk,simMode],   // new/compat (backend ใหม่รองรับ legacy แล้ว)
        [chunk,token,simMode]    // fallback สำหรับ backend เก่า
      ];
      var i=0;
      var runNext=function(lastRes){
        if(i>=attempts.length){
          if(cb)cb(lastRes||{success:false,message:'สร้างออเดอร์ทดสอบไม่สำเร็จ'});
          return;
        }
        var args=attempts[i++];
        App.api.call('generateTestOrders',args,function(res){
          if(res&&res.success){
            if(cb)cb(res);
            return;
          }
          // ถ้าเป็นข้อจำกัดที่ backend ตอบชัดเจน ไม่ต้องลอง signature ถัดไป
          var code=String(res&&res.code||'').toUpperCase();
          if(code==='RATE_LIMIT'||code==='LIMIT'||code==='FORBIDDEN'){
            if(cb)cb(res||{success:false});
            return;
          }
          runNext(res);
        },{silent:true,noLoader:true,key:'gen_test_compat'});
      };
      runNext(null);
    },
    generateTestOrders:function(){App.admin.openTestOrdersModal();},
    runTestOrders:function(){
      if(!App.admin.ensureCanEdit())return;
      var modeEl=document.getElementById('to-mode');
      var simModeEl=document.getElementById('to-simulate-mode');
      var clearEl=document.getElementById('to-clear-first');
      var cntEl=document.getElementById('to-count');
      var btn=document.getElementById('run-test-orders-btn');
      var pw=document.getElementById('to-progress-wrap');
      var mode=modeEl?String(modeEl.value||'normal'):'normal';
      var simMode=simModeEl?String(simModeEl.value||'auto'):'auto';
      if(['auto','company','village'].indexOf(simMode)<0)simMode='auto';
      var clearFirst=!!(clearEl&&clearEl.checked);
      var target=(mode==='stress')?150:(mode==='heavy')?90:(mode==='normal')?30:parseInt(cntEl&&cntEl.value||'30');
      target=parseInt(target||0);
      if(!target||target<1){App.ui.toast('กรุณาระบุจำนวนออเดอร์ให้ถูกต้อง','warn');if(cntEl)cntEl.focus();return;}
      target=Math.min(300,target);
      var delayMs=mode==='stress'?120:220;
      var batchSize=30;
      var startedAt=Date.now();
      var calls=0,total=0,failed=0;
      var lastErrMsg='';
      var maxCalls=Math.ceil(target/batchSize)+5;
      if(pw)pw.classList.remove('hidden');
      App.admin._updateTestProgress(0,target,'กำลังเริ่มทดสอบ...');
      var runOne=function(){
        if(total>=target||calls>=maxCalls){
          App.ui.setBtn(btn,false,'ปิดหน้าต่าง');
          if(btn)btn.onclick=App.admin.closeTestOrdersModal;
          App.admin._updateTestProgress(total,target,'ทดสอบเสร็จแล้ว');
          var sec=((Date.now()-startedAt)/1000).toFixed(1);
          if(failed>0)App.ui.toast('ทดสอบเสร็จ: สำเร็จ '+total+' / '+target+' ออเดอร์, ล้มเหลว '+failed+' รอบ, '+sec+' วินาที','warn');
          else App.ui.toast('ทดสอบเสร็จ: สร้าง '+total+' / '+target+' ออเดอร์ ใน '+sec+' วินาที','success');
          App.admin._refreshOrdersAfterMutation();
          return;
        }
        var remaining=target-total;
        var chunk=Math.min(batchSize,remaining);
        calls++;
        App.admin._updateTestProgress(total,target,'กำลังสร้างรอบที่ '+calls+' ('+chunk+' ออเดอร์)');
        App.admin._callGenerateTestOrdersCompat(chunk,simMode,function(res){
          if(App.admin._auth(res))return;
          if(!res||!res.success){
            failed++;
            lastErrMsg=String((res&&res.message)||'สร้างออเดอร์ทดสอบไม่สำเร็จ');
            if(total===0&&failed>=2){
              App.ui.setBtn(btn,false,'เริ่มทดสอบ');
              if(btn)btn.onclick=App.admin.runTestOrders;
              App.ui.toast(lastErrMsg,'warn');
              return;
            }
          }
          else{
            var g=parseInt((res.data&&res.data.generated)||chunk)||chunk;
            total+=g;
            if(total>target)total=target;
          }
          App.admin._updateTestProgress(total,target,'สำเร็จแล้ว '+total+' / '+target+' ออเดอร์');
          setTimeout(runOne,delayMs);
        });
      };
      App.ui.setBtn(btn,true,'กำลังสร้างข้อมูล...');
      if(clearFirst){
        App.admin._updateTestProgress(0,target,'กำลังล้างข้อมูลเดิม...');
        App.api.call('clearAllOrders',[App.state.adminToken],function(res){
          if(App.admin._auth(res)){App.ui.setBtn(btn,false,'เริ่มทดสอบ');if(btn)btn.onclick=App.admin.runTestOrders;return;}
          if(!res||!res.success){App.ui.setBtn(btn,false,'เริ่มทดสอบ');if(btn)btn.onclick=App.admin.runTestOrders;App.ui.toast((res&&res.message)||'ล้างข้อมูลก่อนทดสอบไม่สำเร็จ','warn');return;}
          runOne();
        });
      }else{
        runOne();
      }
    },
    clearAllOrders:function(){
      if(!App.admin.ensureCanEdit())return;
      App.ui.confirm('ยืนยันล้างข้อมูลรายการลูกค้าทั้งหมด?',function(ok){
        if(!ok)return;
        App.api.call('clearAllOrders',[App.state.adminToken],function(res){
          if(App.admin._auth(res))return;
        if(!res||!res.success){App.ui.toast((res&&res.message)||'ยืนยันรับเงินสดไม่สำเร็จ','warn');return;}
          App.ui.toast('ล้างข้อมูลเรียบร้อย','success');
          App.admin._refreshOrdersAfterMutation();
        });
      });
    },
    toggleAdminMode:function(forceLight){
      var m=document.getElementById('admin-main');if(!m)return;
      var app=document.getElementById('admin-app');
      if(typeof forceLight==='boolean')App.state._adminLight=forceLight;else App.state._adminLight=!App.state._adminLight;
      m.classList.toggle('light-mode',App.state._adminLight);
      if(app){
        app.classList.toggle('light-mode',App.state._adminLight);
        app.classList.toggle('dark-mode',!App.state._adminLight);
      }
      var btn=document.querySelector('.admin-mode-toggle');
      if(btn)btn.textContent=App.state._adminLight?'🌙 Dark':'☀️ Light';
    },
    loadPage(page){var map={menu:App.admin.loadMenu,topics:App.admin.loadTopics,promotions:App.admin.loadPromos,printing:App.admin.loadPrinting,notifications:App.admin.loadNotifications,settings:App.admin.loadSettings,orders:App.admin.loadOrders};if(map[page])map[page]();},
    loadPrinting:function(){
      App.admin._printingBusy=false;
      App.admin.printing.init();
      App.admin.switchPrintingTab(App.state.printing.tab||'receipt');
      App.admin._seedPrintingOrdersFromAdminCache();
      App.admin.refreshPrintingData();
    },
    _seedPrintingOrdersFromAdminCache:function(){
      try{
        var cached=Array.isArray(App.admin._ordersData)?App.admin._ordersData:[];
        if(!cached.length)return;
        var slim=cached.map(function(o){
          return {
            id:o&&o.id,
            created_at:o&&o.created_at,
            customer:o&&o.customer,
            department:o&&o.department,
            total:o&&o.total,
            status:o&&o.status,
            printed_count:o&&o.printed_count,
            payment_method:o&&o.payment_method
          };
        });
        if(!App.state.printing.orders.length){
          App.state.printing.orders=slim;
          App.admin.renderPrintingOrders('sticker');
          App.admin.renderPrintingOrders('receipt');
          App.admin.renderPrintingPreview(App.state.printing.tab);
        }
      }catch(_){}
    },
    stopPrintingPoll:function(){
      if(App.state.printing&&App.state.printing.poller){
        clearInterval(App.state.printing.poller);
        App.state.printing.poller=null;
      }
    },
    startPrintingPoll:function(){
      App.admin.stopPrintingPoll();
      App.state.printing.poller=setInterval(function(){
        var pg=document.getElementById('apg-printing');
        if(!pg||!pg.classList.contains('active'))return;
        App.admin.loadPrintQueue();
      },10000);
    },
    refreshPrintingData:function(){
      App.admin.loadPrintingOrders();
      App.admin.loadPrintTemplates();
      App.admin.printing.loadSettings();
    },
    switchPrintingTab:function(tab){
      var t=(tab==='receipt')?'receipt':'sticker';
      App.state.printing.tab=t;
      ['sticker','receipt'].forEach(function(k){
        var tb=document.getElementById('printdash-tab-'+k),pn=document.getElementById('printing-panel-'+k);
        if(tb)tb.classList.toggle('active',k===t);
        if(pn)pn.classList.toggle('active',k===t);
      });
      App.admin.mountLegacyPrintBlocks(t);
      App.admin.renderPrintingOrders(t);
    },
    loadPrintingOrders:function(opts){
      opts=opts||{};
      var force=!!opts.force;
      var ttlMs=15000;
      var now=Date.now();
      var hasLocal=Array.isArray(App.state.printing.orders)&&App.state.printing.orders.length>0;
      if(!force&&App.state.printing.ordersLoading)return;
      if(!force&&hasLocal&&(now-(parseInt(App.state.printing.lastOrdersFetchAt||0,10)||0)<ttlMs)){
        App.admin.renderPrintingOrders('sticker');
        App.admin.renderPrintingOrders('receipt');
        return;
      }
      if(!hasLocal){
        ['sticker','receipt'].forEach(function(tab){
          var body=document.getElementById('printing-orders-'+tab);
          if(body)body.innerHTML='<tr><td colspan="7"><div class="orders-skeleton-wrap"><div class="orders-skeleton-row"></div></div></td></tr>';
          var cards=document.getElementById('printing-orders-cards-'+tab);
          if(cards)cards.innerHTML='<div class="orders-skeleton-wrap" style="padding:10px"><div class="orders-skeleton-row"></div></div>';
        });
      }
      App.state.printing.ordersLoading=true;
      App.api.call('getOrders',[{lite:true,page:1,pageSize:40},App.state.adminToken],function(res){
        App.state.printing.ordersLoading=false;
        if(App.admin._auth(res))return;
        if(!res||!res.success)return;
        App.state.printing.orders=Array.isArray(res.data&&res.data.items)?res.data.items:[];
        App.state.printing.lastOrdersFetchAt=Date.now();
        App.admin.renderPrintingOrders('sticker');
        App.admin.renderPrintingOrders('receipt');
        App.admin.renderPrintingPreview(App.state.printing.tab);
      },{silent:true,noLoader:true,key:'printing_orders'});
    },
    onPrintingSearch:function(tab,val){
      App.state.printing.search[tab]=String(val||'');
      App.state.printing.page[tab]=1;
      if(App.admin._printingSearchTimer)clearTimeout(App.admin._printingSearchTimer);
      App.admin._printingSearchTimer=setTimeout(function(){App.admin.renderPrintingOrders(tab);},280);
    },
    _getFilteredPrintingOrders:function(tab){
      var rows=Array.isArray(App.state.printing.orders)?App.state.printing.orders:[];
      var q=String((App.state.printing.search&&App.state.printing.search[tab])||'').toLowerCase().trim();
      var stEl=document.getElementById('printing-status-'+tab);
      var st=String(stEl&&stEl.value||'all');
      var payEl=document.getElementById('printing-payment-'+tab);
      var pay=String(payEl&&payEl.value||'all').toLowerCase();
      return rows.filter(function(o){
        var printed=(parseInt(o&&o.printed_count||0,10)||0)>0;
        if(st==='printed'&&!printed)return false;
        if(st==='unprinted'&&printed)return false;
        if(pay!=='all'&&App.admin._getOrderPaymentType(o)!==pay)return false;
        if(!q)return true;
        return String(o&&o.id||'').toLowerCase().indexOf(q)>-1 || String(o&&o.customer||'').toLowerCase().indexOf(q)>-1;
      });
    },
    renderPrintingOrders:function(tab){
      var body=document.getElementById('printing-orders-'+tab); if(!body)return;
      var cards=document.getElementById('printing-orders-cards-'+tab);
      var rows=App.admin._getFilteredPrintingOrders(tab);
      var pageSize=20;
      var totalPages=Math.max(1,Math.ceil(rows.length/pageSize));
      var curPage=Math.max(1,Math.min(totalPages,parseInt(App.state.printing.page[tab]||1,10)||1));
      App.state.printing.page[tab]=curPage;
      var start=(curPage-1)*pageSize;
      var pageRows=rows.slice(start,start+pageSize);
      if(!rows.length){
        body.innerHTML='<tr><td colspan="7" class="text-sm text-muted" style="padding:22px;text-align:center">ไม่มีข้อมูลออเดอร์สำหรับเงื่อนไขนี้</td></tr>';
        if(cards)cards.innerHTML='<div class="text-sm text-muted" style="padding:14px;text-align:center">ไม่มีข้อมูลออเดอร์สำหรับเงื่อนไขนี้</div>';
        App.admin.renderPrintingPager(tab,0,1);return;
      }
      body.innerHTML=pageRows.map(function(o){
        var oid=String(o&&o.id||'');
        var checked=!!(App.state.printing.selected[tab]&&App.state.printing.selected[tab][oid]);
        var dt=o&&o.created_at?new Date(o.created_at):null;
        var t=(dt&&!isNaN(dt.getTime()))?dt.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}):'-';
        var isPrinted=(parseInt(o&&o.printed_count||0,10)||0)>0;
        var badge='<span class="printdash-status '+(isPrinted?'printed':'pending')+'">'+(isPrinted?'พิมพ์แล้ว':'ยังไม่พิมพ์')+'</span>';
        return '<tr class="'+(checked?'printdash-row-selected':'')+'" onclick="App.admin.togglePrintSelectRow(\''+tab+'\',\''+oid+'\',event)">'
          +'<td><input type="checkbox" data-print-tab="'+tab+'" data-order-id="'+oid+'" '+(checked?'checked':'')+' onclick="event.stopPropagation()" onchange="App.admin.togglePrintSelectOne(this)"></td>'
          +'<td>'+App.u.esc(oid)+'</td>'
          +'<td>'+App.u.esc(t)+'</td>'
          +'<td><span class="printdash-order-name '+(checked?'selected':'')+'">'+App.u.esc(o&&o.customer||'-')+'</span></td>'
          +'<td>'+App.u.esc(o&&o.department||'-')+'</td>'
          +'<td>'+App.u.fmt(o&&o.total||0)+'</td>'
          +'<td>'+badge+'</td>'
          +'</tr>';
      }).join('');
      if(cards){
        cards.innerHTML=pageRows.map(function(o){
          var oid=String(o&&o.id||'');
          var checked=!!(App.state.printing.selected[tab]&&App.state.printing.selected[tab][oid]);
          var dt=o&&o.created_at?new Date(o.created_at):null;
          var t=(dt&&!isNaN(dt.getTime()))?dt.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}):'-';
          var isPrinted=(parseInt(o&&o.printed_count||0,10)||0)>0;
          return '<div class="printdash-order-card '+(checked?'selected':'')+'" onclick="App.admin.togglePrintSelectRow(\''+tab+'\',\''+oid+'\',event)">'
            +'<div class="printdash-order-card-top"><label class="printdash-check"><input type="checkbox" data-print-tab="'+tab+'" data-order-id="'+oid+'" '+(checked?'checked':'')+' onclick="event.stopPropagation()" onchange="App.admin.togglePrintSelectOne(this)"> เลือก</label><span class="printdash-status '+(isPrinted?'printed':'pending')+'">'+(isPrinted?'พิมพ์แล้ว':'ยังไม่พิมพ์')+'</span></div>'
            +'<div class="printdash-order-card-id">'+App.u.esc(oid)+'</div>'
            +'<div class="printdash-order-card-name '+(checked?'selected':'')+'">'+App.u.esc(o&&o.customer||'-')+'</div>'
            +'<div class="printdash-order-card-meta"><span>เวลา: '+App.u.esc(t)+'</span><span>ยอด: '+App.u.fmt(o&&o.total||0)+'</span><span style="grid-column:1 / -1">หมู่บ้าน/แผนก: '+App.u.esc(o&&o.department||'-')+'</span></div>'
            +'</div>';
        }).join('');
      }
      App.admin.renderPrintingPager(tab,rows.length,totalPages);
    },
    renderPrintingPager:function(tab,totalRows,totalPages){
      var el=document.getElementById('printing-pager-'+tab);
      if(!el)return;
      var cur=Math.max(1,Math.min(totalPages||1,parseInt(App.state.printing.page[tab]||1,10)||1));
      if(!totalRows){el.innerHTML='';return;}
      el.innerHTML='<span class="text-sm text-muted">หน้า '+cur+' / '+totalPages+' ('+totalRows+' รายการ)</span>'
        +'<div style="display:flex;gap:8px">'
        +'<button class="printdash-btn printdash-btn-secondary" style="height:30px;padding:0 10px;font-size:12px" '+(cur<=1?'disabled':'')+' onclick="App.admin.changePrintingPage(\''+tab+'\','+(cur-1)+')">ก่อนหน้า</button>'
        +'<button class="printdash-btn printdash-btn-secondary" style="height:30px;padding:0 10px;font-size:12px" '+(cur>=totalPages?'disabled':'')+' onclick="App.admin.changePrintingPage(\''+tab+'\','+(cur+1)+')">ถัดไป</button>'
        +'</div>';
    },
    changePrintingPage:function(tab,page){
      App.state.printing.page[tab]=Math.max(1,parseInt(page||1,10)||1);
      App.admin.renderPrintingOrders(tab);
    },
    togglePrintSelectAll:function(tab,checked){
      var rows=App.admin._getFilteredPrintingOrders(tab);
      var map={};
      if(checked)rows.forEach(function(o){map[String(o&&o.id||'')]=1;});
      App.state.printing.selected[tab]=map;
      App.admin.renderPrintingOrders(tab);
      App.admin.renderPrintingPreview(tab);
    },
    togglePrintSelectByName:function(tab,orderId){
      var oid=String(orderId||'').trim();
      if(!oid)return;
      if(!App.state.printing.selected[tab])App.state.printing.selected[tab]={};
      if(App.state.printing.selected[tab][oid])delete App.state.printing.selected[tab][oid];
      else App.state.printing.selected[tab][oid]=1;
      App.admin.renderPrintingOrders(tab);
      App.admin.renderPrintingPreview(tab);
    },
    togglePrintSelectRow:function(tab,orderId,ev){
      if(ev&&ev.target){
        var tag=String(ev.target.tagName||'').toLowerCase();
        if(tag==='input'||tag==='button'||tag==='a'||tag==='select'||tag==='textarea'||tag==='label')return;
      }
      App.admin.togglePrintSelectByName(tab,orderId);
    },
    togglePrintSelectOne:function(el){
      if(!el)return;
      var tab=String(el.getAttribute('data-print-tab')||'sticker');
      var oid=String(el.getAttribute('data-order-id')||'');
      if(!oid)return;
      if(!App.state.printing.selected[tab])App.state.printing.selected[tab]={};
      if(el.checked)App.state.printing.selected[tab][oid]=1;
      else delete App.state.printing.selected[tab][oid];
      App.admin.renderPrintingOrders(tab);
      App.admin.renderPrintingPreview(tab);
    },
    _getPrintingSelectedIds:function(tab){
      var map=App.state.printing.selected[tab]||{};
      var ids=Object.keys(map).filter(function(k){return map[k];});
      return ids;
    },
    _getPrintingSelectedOrders:function(tab){
      var ids=App.admin._getPrintingSelectedIds(tab);
      var idx={};
      (App.state.printing.orders||[]).forEach(function(o){idx[String(o&&o.id||'')]=o||{};});
      return ids.map(function(id){return idx[String(id)]||{id:id};});
    },
    openPrintingActionPopup:function(type){ App.admin.directPrintSelection(type); },
    closePrintingActionPopup:function(){},
    _refreshPrintingActionBluetoothState:function(){},
    choosePrintingAction:function(action){
      var tab=(App.state.printing.tab==='sticker')?'sticker':'receipt';
      if(action==='pdf')App.admin.downloadPrintingSelectionPdf(tab);
      else App.admin.directPrintSelection(tab);
    },
    directPrintSelection:function(type){
      var tab=(type==='sticker')?'sticker':'receipt';
      var ids=App.admin._getPrintingSelectedIds(tab);
      if(!ids.length){App.ui.toast('กรุณาเลือกออเดอร์ก่อนพิมพ์','warn');return;}
      App.admin._batchForcedOrderIds=ids;
      App.admin._batchTab=tab;
      App.admin.mountLegacyPrintBlocks(tab);
      App.admin._prepareForcedBatchFilters();
      App.admin.doBatchPrint(false);
    },
    downloadPrintingSelectionPdf:function(type,opts){
      var tab=(type==='sticker')?'sticker':'receipt';
      var options=opts||{};

      if(tab==='sticker'){
        var source=(String(options.mobileSource||'')==='batch')?'batch':'dashboard';
        var selectedIds=App.admin._getPrintingSelectedIds('sticker');
        var sourceOrders=(source==='batch')?(Array.isArray(options.mobileOrders)?options.mobileOrders:[]):App.admin._getPrintingSelectedOrders('sticker');
        if(source==='batch'&&!sourceOrders.length){App.ui.toast('กรุณาเลือกออเดอร์ก่อนดาวน์โหลดไฟล์สติ๊กเกอร์','warn');return;}
        if(source!=='batch'&&!selectedIds.length){App.ui.toast('กรุณาเลือกออเดอร์ก่อนดาวน์โหลดไฟล์สติ๊กเกอร์','warn');return;}
        if(App.admin._printingPdfBusy)return;
        App.admin._beginPdfLock('กำลังสร้างไฟล์ PDF...');

        var exportStickerRows=function(rows){
          var src=Array.isArray(rows)?rows:[];
          var valid=src.filter(function(o){ return o&&!App.admin._isCancelledOrderStatus(String(o.status||'')); });
          var labels=App.admin._expandOrdersForSticker(valid,'batch');
          console.log('[dashboard-sticker-pdf]',{source:source,orders:valid.length,labels:labels.length});
          if(!labels.length){App.admin._endPdfLock();App.ui.toast('ไม่พบข้อมูลสำหรับดาวน์โหลดสติ๊กเกอร์','warn');return;}

          var cfg=App.admin._getStickerPaperCfg('batch');
          var w=Math.max(10,parseFloat(cfg.widthMm)||50);
          var h=Math.max(10,parseFloat(cfg.heightMm)||30);
          var stamp=(function(){var d=new Date();return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'_'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0');})();
          var fileName='sticker_orders_'+stamp+'.pdf';

          App.admin._ensurePdfRenderLibs(function(ok){
            if(!ok){App.admin._endPdfLock();App.ui.toast('โหลดเครื่องมือสร้าง PDF ไม่สำเร็จ','error');return;}
            var host=document.createElement('iframe');
            host.style.cssText='position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;border:0;opacity:0;';
            document.body.appendChild(host);
            var doc=host.contentWindow&&host.contentWindow.document;
            if(!doc){ try{if(host.parentNode)host.parentNode.removeChild(host);}catch(_d){} App.admin._endPdfLock(); App.ui.toast('ไม่สามารถสร้างเอกสารพิมพ์ได้','error'); return; }
            var html=App.admin._buildStickerStandaloneHtml(labels,cfg);
            doc.open(); doc.write(html); doc.close();
            setTimeout(async function(){
              try{
                if(host.contentWindow.document.fonts&&host.contentWindow.document.fonts.ready){ try{ await host.contentWindow.document.fonts.ready; }catch(_f){} }
                var jsPDF=window.jspdf.jsPDF;
                var pdf=new jsPDF({unit:'mm',format:[w,h],orientation:(w>h?'landscape':'portrait'),compress:true});
                var nodes=host.contentWindow.document.querySelectorAll('.ct-label');
                for(var i=0;i<nodes.length;i++){
                  if(i>0)pdf.addPage([w,h],(w>h?'landscape':'portrait'));
                  var canvas=await window.html2canvas(nodes[i],{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false});
                  pdf.addImage(canvas.toDataURL('image/jpeg',0.94),'JPEG',0,0,w,h);
                }
                pdf.save(fileName);
                App.ui.toast('ดาวน์โหลดไฟล์สติ๊กเกอร์สำเร็จ','success');
              }catch(e){
                App.ui.toast('สร้างไฟล์สติ๊กเกอร์ไม่สำเร็จ','error');
              }finally{
                App.admin._endPdfLock();
                try{if(host&&host.parentNode)host.parentNode.removeChild(host);}catch(_x){}
              }
            },320);
          });
        };

        var needLoad=sourceOrders.filter(function(o){ return !(Array.isArray(o&&o.items)&&o.items.length); });
        if(needLoad.length&&App.admin._ensureOrdersItemsLoaded){
          App.admin._ensureOrdersItemsLoaded(sourceOrders,function(full){
            var base=Array.isArray(sourceOrders)?sourceOrders:[];
            var loaded=Array.isArray(full)?full:[];
            var map={};
            loaded.forEach(function(o){ map[String(o&&o.id||o&&o.orderId||'')]=o; });
            var merged=base.map(function(o){ var id=String(o&&o.id||o&&o.orderId||''); return map[id]||o; });
            exportStickerRows(merged);
          });
          return;
        }

        exportStickerRows(sourceOrders);
        return;
      }

      var ids=App.admin._getPrintingSelectedIds(tab);
      if(!ids.length){App.ui.toast('กรุณาเลือกออเดอร์ก่อนโหลด PDF','warn');return;}
      if(App.admin._printingPdfBusy)return;
      App.admin._beginPdfLock('กำลังสร้างไฟล์ PDF...');
      var orders=App.admin._getPrintingSelectedOrders(tab);
      var needLoad=orders.filter(function(o){return !Array.isArray(o&&o.items);});
      if(needLoad.length){
        App.admin._ensureOrdersItemsLoaded(needLoad,function(){
          App.admin._endPdfLock();
          App.admin.downloadPrintingSelectionPdf(tab);
        });
        return;
      }
      App.admin._batchForcedOrderIds=ids;
      App.admin._batchTab=tab;
      App.admin.mountLegacyPrintBlocks(tab);
      App.admin._prepareForcedBatchFilters();
      App.admin._exportPreviewPdf(orders,tab,'batch',tab==='sticker'?'selected_sticker_preview.pdf':'selected_receipt_preview.pdf',function(){
        App.admin._endPdfLock();
      });
    },
    openLegacyOrderPrintFromPrinting:function(type){
      var tab=(type==='sticker')?'sticker':'receipt';
      var ids=App.admin._getPrintingSelectedIds(tab);
      if(!ids.length){App.ui.toast('ไม่พบออเดอร์สำหรับพิมพ์','warn');return;}
      App.admin._batchForcedOrderIds=ids;
      App.admin.dockLegacyPrintToModal();
      App.admin.openBatchPrintModal();
      App.admin.switchBatchTab(tab,document.getElementById(tab==='sticker'?'bptab-sticker':'bptab-receipt'));
      App.admin.mountLegacyPrintBlocks(tab);
      App.ui.toast('เปิดระบบพิมพ์เดิมพร้อมรายการที่เลือกแล้ว','success');
    },
    _ensureLegacyPrintAnchors:function(){
      if(App.admin._legacyPrintAnchors)return App.admin._legacyPrintAnchors;
      var ids=['batch-receipt-settings','batch-sticker-settings','batch-preview-content'];
      var map={};
      ids.forEach(function(id){
        var node=document.getElementById(id);
        if(!node||!node.parentNode)return;
        var anchor=document.createComment('legacy-anchor:'+id);
        node.parentNode.insertBefore(anchor,node);
        map[id]={anchor:anchor,homeParent:node.parentNode};
      });
      App.admin._legacyPrintAnchors=map;
      return map;
    },
    dockLegacyPrintToModal:function(){
      try{
        var anchors=App.admin._ensureLegacyPrintAnchors()||{};
        ['batch-receipt-settings','batch-sticker-settings','batch-preview-content'].forEach(function(id){
          var info=anchors[id],node=document.getElementById(id);
          if(!info||!node||!info.homeParent||!info.anchor)return;
          if(node.parentNode===info.homeParent)return;
          if(info.anchor.nextSibling)info.homeParent.insertBefore(node,info.anchor.nextSibling);
          else info.homeParent.appendChild(node);
        });
      }catch(_){}
    },
    mountLegacyPrintBlocks:function(tab){
      try{
        App.admin._ensureLegacyPrintAnchors();
        var t=(tab==='sticker')?'sticker':'receipt';
        var settingNode=document.getElementById(t==='sticker'?'batch-sticker-settings':'batch-receipt-settings');
        var settingHost=document.getElementById(t==='sticker'?'printing-legacy-settings-sticker':'printing-legacy-settings-receipt');
        if(settingNode&&settingHost&&settingNode.parentElement!==settingHost){
          settingHost.innerHTML='';
          settingHost.appendChild(settingNode);
          settingNode.style.display='';
        }
        var prevNode=document.getElementById('batch-preview-content');
        var prevHost=document.getElementById(t==='sticker'?'printing-legacy-preview-sticker':'printing-legacy-preview-receipt');
        if(prevNode&&prevHost&&prevNode.parentElement!==prevHost){
          prevHost.innerHTML='';
          prevHost.appendChild(prevNode);
          prevNode.style.display='flex';
          prevNode.style.flexDirection='column';
          prevNode.style.flexWrap='nowrap';
          prevNode.style.gap='10px';
        }
        var modalSettingsWrap=document.getElementById('batch-receipt-settings');
        var modalStickerWrap=document.getElementById('batch-sticker-settings');
        if(modalSettingsWrap&&modalSettingsWrap.parentElement&&modalSettingsWrap.parentElement.id==='printing-legacy-settings-receipt'){modalSettingsWrap.style.display=(t==='receipt')?'':'none';}
        if(modalStickerWrap&&modalStickerWrap.parentElement&&modalStickerWrap.parentElement.id==='printing-legacy-settings-sticker'){modalStickerWrap.style.display=(t==='sticker')?'':'none';}
        App.admin.updateBatchPreview();
      }catch(_){}
    },
    loadPrintTemplates:function(){
      App.api.call('getPrintTemplates',[App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(!res||!res.success)return;
        App.state.printing.templates=res.data||{sticker:[],receipt:[]};
        ['sticker','receipt'].forEach(function(type){
          var el=document.getElementById('printing-template-'+type); if(!el)return;
          var list=Array.isArray(App.state.printing.templates[type])?App.state.printing.templates[type]:[];
          el.innerHTML=list.map(function(t){return '<option value="'+App.u.esc(String(t.id||''))+'">'+App.u.esc(String(t.name||t.id||''))+'</option>';}).join('') || '<option value="">Default</option>';
        });
      },{silent:true,noLoader:true,key:'print_templates'});
    },
    createQueuedPrintJob:function(type){
      var map=App.state.printing.selected[type]||{};
      var ids=Object.keys(map).filter(function(k){return map[k];});
      if(!ids.length){App.ui.toast('กรุณาเลือกออเดอร์ก่อน','warn');return;}
      var payload={type:type,orderIds:ids,templateId:(document.getElementById('printing-template-'+type)||{}).value||'',settings:{paper:(document.getElementById('printing-paper-'+type)||{}).value||'',layout:(document.getElementById('printing-layout-'+type)||{}).value||'',size:'',method:App.state.printing.method}};
      if(App.admin._printingBusy)return;
      App.admin._printingBusy=true;
      App.api.call('createPrintJob',[payload,App.state.adminToken],function(res){
        App.admin._printingBusy=false;
        if(App.admin._auth(res))return;
        if(!res||!res.success){App.ui.toast((res&&res.message)||'สร้างงานพิมพ์ไม่สำเร็จ','error');return;}
        App.ui.toast('สร้างงานพิมพ์แล้ว','success');
        App.state.printing.selected[type]={};
        App.admin.renderPrintingOrders(type);
      });
    },
    markSelectedPrinted:function(type){
      var map=App.state.printing.selected[type]||{};
      var ids=Object.keys(map).filter(function(k){return map[k];});
      if(!ids.length){App.ui.toast('ยังไม่ได้เลือกออเดอร์','warn');return;}
      App.api.call('markOrdersPrinted',[ids,type,App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(!res||!res.success){App.ui.toast((res&&res.message)||'อัปเดตสถานะไม่สำเร็จ','error');return;}
        App.ui.toast('อัพเดทการรับเงินสดแล้ว','success');
        App.admin.loadPrintingOrders({force:true});
      });
    },
    resetPrintingStatus:function(type){
      var tab=(type==='sticker')?'sticker':'receipt';
      var ids=App.admin._getFilteredPrintingOrders(tab).map(function(o){return String(o&&o.id||'').trim();}).filter(Boolean);
      if(!ids.length){App.ui.toast('ไม่พบรายการสำหรับล้างสถานะพิมพ์','warn');return;}
      App.ui.confirm('ล้างสถานะพิมพ์แล้วของรายการที่กรองอยู่ทั้งหมดใช่หรือไม่?',function(ok){
        if(!ok)return;
        App.api.call('resetOrdersPrinted',[ids,App.state.adminToken],function(res){
          if(App.admin._auth(res))return;
          if(!res||!res.success){App.ui.toast((res&&res.message)||'ล้างสถานะพิมพ์ไม่สำเร็จ','error');return;}
          App.ui.toast('ล้างสถานะพิมพ์เรียบร้อย','success');
          App.admin.loadPrintingOrders({force:true});
        });
      });
    },
    _prepareForcedBatchFilters:function(){
      var st=document.getElementById('bp-print-status');
      if(st)st.value='all';
      var range=document.getElementById('bp-daterange');
      if(range)range.value='all';
      var from=document.getElementById('bp-date-from');
      if(from)from.value='';
      var to=document.getElementById('bp-date-to');
      if(to)to.value='';
      if(typeof App.admin.toggleBatchDateInputs==='function'){
        App.admin.toggleBatchDateInputs();
      }
    },
    renderPrintingPreview:function(tab){
      try{
        var currentTab=(tab==='receipt')?'receipt':'sticker';
        var ids=App.admin._getPrintingSelectedIds(currentTab);
        App.admin._batchForcedOrderIds=ids;
        App.admin._batchTab=currentTab;
        App.admin.mountLegacyPrintBlocks(currentTab);
        var prevHost=document.getElementById(currentTab==='sticker'?'printing-legacy-preview-sticker':'printing-legacy-preview-receipt');
        var prevNode=document.getElementById('batch-preview-content');
        var emptyId='printing-preview-empty-'+currentTab;
        var emptyNode=document.getElementById(emptyId);
        if(prevHost&&!emptyNode){
          emptyNode=document.createElement('div');
          emptyNode.id=emptyId;
          emptyNode.className='printdash-preview-empty';
          emptyNode.textContent='ยังไม่ได้เลือกออเดอร์สำหรับพรีวิว';
          prevHost.appendChild(emptyNode);
        }
        if(!ids.length){
          if(prevNode)prevNode.style.display='none';
          if(emptyNode)emptyNode.style.display='flex';
          return;
        }
        if(emptyNode)emptyNode.style.display='none';
        if(prevNode){
          prevNode.style.display='flex';
          prevNode.style.flexDirection='column';
          prevNode.style.flexWrap='nowrap';
          prevNode.style.gap='10px';
        }
        App.admin._prepareForcedBatchFilters();
        App.admin.updateBatchPreview();
      }catch(_){}
    },
    loadPrintQueue:function(){
      App.api.call('getPrintJobs',[App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(!res||!res.success)return;
        App.state.printing.queue=Array.isArray(res.data)?res.data:[];
        App.admin.renderPrintQueue();
      },{silent:true,noLoader:true,key:'print_queue'});
    },
    renderPrintQueue:function(){
      var body=document.getElementById('printing-queue-body'); if(!body)return;
      var rows=Array.isArray(App.state.printing.queue)?App.state.printing.queue:[];
      var busy=!!App.admin._printingHistoryBusy;
      if(!rows.length){body.innerHTML='<tr><td colspan="7" class="text-sm text-muted" style="padding:20px;text-align:center">ยังไม่มีรายการในคิวพิมพ์</td></tr>';return;}
      body.innerHTML=rows.map(function(j){
        var id=String(j&&j.jobId||'');
        var pg=Math.max(0,Math.min(100,parseInt(j&&j.progress||0,10)||0));
        var st=String(j&&j.status||'pending');
        var dis=busy?' disabled':'';
        return '<tr>'
          +'<td>'+App.u.esc(id)+'</td>'
          +'<td>'+App.u.esc(j&&j.type||'receipt')+'</td>'
          +'<td>'+App.u.esc(String(j&&j.total_items||0))+'</td>'
          +'<td>'+App.u.esc(String(j&&j.created_at||''))+'</td>'
          +'<td><span class="printdash-status '+App.u.esc(st)+'">'+App.u.esc(st)+'</span></td>'
          +'<td><div class="printdash-queue-progress"><div class="printdash-queue-track"><div class="printdash-queue-fill" style="width:'+pg+'%"></div></div><span>'+pg+'%</span></div></td>'
          +'<td style="white-space:nowrap"><button class="printdash-btn printdash-btn-secondary" style="height:30px;padding:0 10px;font-size:12px"'+dis+' onclick="App.admin.processPrintJobUI(\''+id+'\')">Process</button> <button class="printdash-btn printdash-btn-secondary" style="height:30px;padding:0 10px;font-size:12px"'+dis+' onclick="App.admin.retryPrintJobUI(\''+id+'\')">Retry</button> <button class="printdash-btn printdash-btn-secondary" style="height:30px;padding:0 10px;font-size:12px"'+dis+' onclick="App.admin.cancelPrintJobUI(\''+id+'\')">Cancel</button></td>'
          +'</tr>';
      }).join('');
    },
    _withPrintingHistoryLock:async function(loaderText,fn){
      if(App.admin._printingHistoryBusy){
        App.ui.toast('กำลังประมวลผลงานพิมพ์อยู่ กรุณารอสักครู่','warn');
        return false;
      }
      App.admin._printingHistoryBusy=true;
      App.admin.renderPrintQueue();
      App.ui.showLoader(loaderText||'กำลังประมวลผลงานพิมพ์...');
      try{
        await fn();
        return true;
      }finally{
        App.ui.hideLoader();
        App.admin._printingHistoryBusy=false;
        App.admin.renderPrintQueue();
      }
    },
    processPrintJobUI:function(jobId){
      App.admin._withPrintingHistoryLock('กำลังประมวลผลคิวพิมพ์...',async function(){
        var res=await App.api.callAsync('processPrintJob',[jobId,App.state.adminToken],{silent:true,noLoader:true});
        if(App.admin._auth(res))return;
        if(!res||!res.success){App.ui.toast((res&&res.message)||'Process ไม่สำเร็จ','error');return;}
        App.ui.toast('Process สำเร็จ','success');
        App.admin.loadPrintQueue();
      });
    },
    cancelPrintJobUI:function(jobId){
      App.admin._withPrintingHistoryLock('กำลังยกเลิกคิวพิมพ์...',async function(){
        var res=await App.api.callAsync('updatePrintJobStatus',[jobId,'cancelled',App.state.adminToken,{progress:0,error_message:''}],{silent:true,noLoader:true});
        if(App.admin._auth(res))return;
        if(!res||!res.success){
          App.ui.toast((res&&res.message)||'ยกเลิกไม่สำเร็จ','error');
          App.admin.loadPrintQueue();
          return;
        }
        App.ui.toast('ยกเลิกคิวพิมพ์แล้ว','success');
        App.admin.loadPrintQueue();
      });
    },
    retryPrintJobUI:function(jobId){
      App.admin._withPrintingHistoryLock('กำลังส่งคิวพิมพ์ใหม่...',async function(){
        var res=await App.api.callAsync('retryPrintJob',[jobId,App.state.adminToken],{silent:true,noLoader:true});
        if(App.admin._auth(res))return;
        if(!res||!res.success){App.ui.toast((res&&res.message)||'retry ไม่สำเร็จ','error');return;}
        App.ui.toast('ส่งงานเข้าประมวลผลอีกครั้งแล้ว','success');
        App.admin.loadPrintQueue();
      });
    },
    printing:{
      init:function(){
      },
      loadSettings:function(){
        App.api.call('getSettings',[App.state.adminToken],function(res){
          if(!res||!res.success||!res.data)return;
          App.state.printing.method='browser';
          App.state.printing.btAutoConnect=false;
          ['sticker','receipt'].forEach(function(tab){
            var m=document.getElementById('printing-method-'+tab);
            if(m)m.value=App.state.printing.method;
          });
        },{silent:true,noLoader:true,key:'printing_settings'});
      },
      saveSettings:function(){
        var methodEl=document.getElementById('printing-method-'+(App.state.printing.tab||'sticker'));
        var method=String(methodEl&&methodEl.value||'browser').toLowerCase();
        App.state.printing.method=(method==='browser')?'browser':'browser';
        App.state.printing.btAutoConnect=false;
        ['sticker','receipt'].forEach(function(tab){
          var m=document.getElementById('printing-method-'+tab);
          if(m)m.value=App.state.printing.method;
        });
        App.api.call('saveSettings',[{print_method:'browser',bluetooth_auto_connect:'0'},App.state.adminToken],function(res){
          if(!res||!res.success)return;
          App.ui.toast('บันทึกการตั้งค่าการพิมพ์แล้ว','success');
        },{silent:true,noLoader:true,key:'save_printing_settings'});
      },
      connectBluetooth:async function(silent){
        if(!silent)App.ui.toast('ฟังก์ชันนี้ถูกปิดการใช้งานแล้ว','warn');
      },
      updateBluetoothStatus:function(){
        App.admin._refreshPrintingActionBluetoothState();
      },
      _renderReceiptText:function(order){
        var lines=[];
        lines.push('FoodOrder');
        lines.push('------------------------------');
        lines.push('Order: '+String(order&&order.id||'-'));
        lines.push('Customer: '+String(order&&order.customer||'-'));
        lines.push('------------------------------');
        (order&&order.items||[]).forEach(function(it){
          var qty=parseInt(it&&it.qty||1,10)||1;
          var nm=String(it&&it.name||'');
          var pr=Math.round(parseFloat(it&&it.total||0)||0);
          lines.push(nm+' x'+qty+'   '+pr);
        });
        lines.push('------------------------------');
        lines.push('Total: '+Math.round(parseFloat(order&&order.total||0)||0));
        lines.push('\n\n');
        return lines.join('\n');
      },
      _renderStickerText:function(order){
        var lines=[];
        lines.push('ORDER '+String(order&&order.id||''));
        lines.push(String(order&&order.customer||'-'));
        lines.push(String(order&&order.department||'-'));
        lines.push('----------------');
        (order&&order.items||[]).forEach(function(it){
          lines.push(String(it&&it.name||'')+' x'+(parseInt(it&&it.qty||1,10)||1));
        });
        lines.push('\n');
        return lines.join('\n');
      },
      _browserFallbackPrint:function(job,detailsMap){
        var doc=window.open('','_blank','width=780,height=900');
        if(!doc)return;
        var html='<html><head><title>Print Job '+App.u.esc(job.jobId||'')+'</title></head><body style="font-family:Prompt,sans-serif;padding:16px">';
        (job.orderIds||[]).forEach(function(oid){
          var d=detailsMap[oid]||{};
          html+='<div style="border:1px dashed #999;padding:12px;margin-bottom:10px;page-break-inside:avoid"><div style="font-weight:700;margin-bottom:6px">#'+App.u.esc(oid)+'</div><div>'+App.u.esc(String(d.customer||'-'))+'</div></div>';
        });
        html+='</body></html>';
        doc.document.write(html);
        doc.document.close();
        setTimeout(function(){try{doc.print();}catch(_){ }},250);
      },
      printViaBluetoothById:async function(jobId){
        return App.admin._withPrintingHistoryLock('กำลังพิมพ์เอกสาร...',async function(){
          var list=Array.isArray(App.state.printing.queue)?App.state.printing.queue:[];
          var job=list.filter(function(x){return String(x&&x.jobId||'')===String(jobId||'');})[0];
          if(!job){App.ui.toast('ไม่พบ job ที่เลือก','warn');return;}
          await App.admin.printing.printViaBrowser(job);
        });
      },
      printViaBrowser:async function(job){
        if(!job||!Array.isArray(job.orderIds)||!job.orderIds.length){App.ui.toast('job ไม่มีออเดอร์','warn');return;}
        await App.api.callAsync('updatePrintJobStatus',[job.jobId,'processing',App.state.adminToken,{progress:1}]);
        var details={};
        var done=0,total=job.orderIds.length;
        try{
          var bulk=await App.api.callAsync('getOrderDetailsBulk',[job.orderIds,App.state.adminToken],{silent:true,noLoader:true});
          if(bulk&&bulk.success&&bulk.data&&Array.isArray(bulk.data.items)){
            bulk.data.items.forEach(function(d){details[String(d&&d.id||'')]=d||{};});
          }
          for(var i=0;i<job.orderIds.length;i++){
            var oid=job.orderIds[i];
            if(!details[oid]){
              var rs=await App.api.callAsync('getOrderDetail',[oid,App.state.adminToken],{silent:true,noLoader:true});
              if(!rs||!rs.success)throw new Error((rs&&rs.message)||('โหลดออเดอร์ไม่สำเร็จ '+oid));
              details[oid]=rs.data||{};
            }
            done++;
            var pct=Math.max(1,Math.floor((done/total)*100));
            if(done===total||done===1||(done%3===0)){
              await App.api.callAsync('updatePrintJobStatus',[job.jobId,'processing',App.state.adminToken,{progress:pct}],{silent:true,noLoader:true});
            }
          }
          App.admin.printing._browserFallbackPrint(job,details);
          await App.api.callAsync('markOrdersPrinted',[job.orderIds,job.type,App.state.adminToken],{silent:true,noLoader:true});
          await App.api.callAsync('completePrintJob',[job.jobId,App.state.adminToken],{silent:true,noLoader:true});
          App.ui.toast('พิมพ์สำเร็จ','success');
        }catch(e){
          await App.api.callAsync('updatePrintJobStatus',[job.jobId,'error',App.state.adminToken,{progress:Math.floor((done/total)*100),error_message:(e&&e.message)||'print failed'}],{silent:true,noLoader:true});
          App.ui.toast((e&&e.message)||'พิมพ์ไม่สำเร็จ','error');
        }finally{
          App.admin.loadPrintQueue();
        }
      }
    },
    _menuStockFp:'',
    _stopMenuLiveRefresh:function(){
      if(App.admin._menuLiveTimer){clearInterval(App.admin._menuLiveTimer);App.admin._menuLiveTimer=null;}
      App.admin._menuLiveBusy=false;
    },
    _menuFingerprint:function(list){
      var rows=Array.isArray(list)?list:[];
      return rows.map(function(m){
        return String(m&&m.id||'')+'|'+String(m&&m.status||'')+'|'+String(m&&m.stock||'');
      }).join('||');
    },
    _startMenuLiveRefresh:function(){
      App.admin._stopMenuLiveRefresh();
      App.admin._menuLiveTimer=setInterval(function(){
        if(document.hidden)return;
        var pg=document.getElementById('apg-menu');
        if(!pg||!pg.classList.contains('active')){
          App.admin._stopMenuLiveRefresh();
          return;
        }
        App.admin._silentRefreshMenuStock();
      },5000);
    },
    _silentRefreshMenuStock:function(){
      if(App.admin._menuLiveBusy)return;
      App.admin._menuLiveBusy=true;
      App.api.call('adminCRUDMenu',['getAll',{},App.state.adminToken],function(res){
        App.admin._menuLiveBusy=false;
        if(App.admin._auth(res))return;
        if(!res||!res.success)return;
        var list=Array.isArray(res.data)?res.data:(res.data&&res.data.items?res.data.items:[]);
        var fp=App.admin._menuFingerprint(list);
        if(fp===App.admin._menuStockFp)return;
        App.admin._menuStockFp=fp;
        App.state.adminMenuItems=list;
        App.admin._setCache('menu',list.slice());
        App.admin.renderCategorySuggestions();
        App.admin.renderMenuFilters();
        App.admin.renderMenuPaged(true);
      },{silent:true,noLoader:true,key:'menu_live'});
    },
    _dashboardAutoTimer:null,
    _dashboardBusy:false,
    _dashboardData:null,
    refreshDashboardManual:function(){
      App.ui.toast('กำลังรีเฟรชแดชบอร์ด...','info');
      App.admin.loadDashboard(true);
    },
    quickPrintDashboard:function(){
      try{window.print();}catch(_){}
    },
    _stopDashboardAutoRefresh:function(){
      if(App.admin._dashboardAutoTimer){clearInterval(App.admin._dashboardAutoTimer);App.admin._dashboardAutoTimer=null;}
      App.admin._dashboardBusy=false;
    },
    _startDashboardAutoRefresh:function(){
      App.admin._stopDashboardAutoRefresh();
      // PERF: รีเฟรชทุก 12 วินาที ให้รู้สึก real-time โดยไม่ถี่เกินไป
      App.admin._dashboardAutoTimer=setInterval(function(){
        if(document.hidden)return;
        var pg=document.getElementById('apg-dashboard');
        if(!pg||!pg.classList.contains('active')){App.admin._stopDashboardAutoRefresh();return;}
        App.admin.loadDashboard(false,true);
      },15000);
    },
    _isShopOpenForDashboard:function(){
      var raw=App.state._settingsRaw||{};
      var v=String(raw.shop_open||raw.shop_status||raw.is_open||'1').trim().toLowerCase();
      return !(v==='0'||v==='false'||v==='closed'||v==='ปิด');
    },
    _dashboardDateLabel:function(){
      try{
        return new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
      }catch(_){
        return new Date().toLocaleDateString('th-TH');
      }
    },
    loadDashboard:function(force,silent){
      if(App.admin._dashboardBusy&&!force)return;
      var loadingEl=document.getElementById('dashboard-loading');
      var contentEl=document.getElementById('dashboard-content');
      var emptyEl=document.getElementById('dashboard-empty');
      var dateEl=document.getElementById('dashboard-date-text');
      var shopEl=document.getElementById('dashboard-shop-status');
      if(dateEl)dateEl.textContent=App.admin._dashboardDateLabel();
      var isOpen=App.admin._isShopOpenForDashboard();
      if(shopEl){
        shopEl.textContent=isOpen?'เปิดร้าน':'ปิดร้าน';
        shopEl.classList.toggle('is-closed',!isOpen);
      }
      App.admin._dashboardBusy=true;
      if(loadingEl)loadingEl.classList.remove('hidden');
      if(contentEl)contentEl.classList.add('hidden');
      if(emptyEl)emptyEl.classList.add('hidden');
      var summary=null,stats=null,ordersPayload=null;
      var menuList=Array.isArray(App.state.adminMenuItems)?App.state.adminMenuItems.slice():[];
      var pending=3;
      if(!menuList.length)pending++;
      var doneOne=function(){
        pending--;
        if(pending>0)return;
        App.admin._dashboardBusy=false;
        var model=App.admin._buildDashboardModel({
          summary:summary||{},
          stats:stats||{},
          orders:ordersPayload||{},
          menu:menuList||[],
          shopOpen:isOpen
        });
        App.admin._dashboardData=model;
        if(loadingEl)loadingEl.classList.add('hidden');
        if(emptyEl)emptyEl.classList.add('hidden');
        if(contentEl)contentEl.classList.remove('hidden');
        App.admin._renderDashboardData(model);
        App.admin._startDashboardAutoRefresh();
      };
      var reqOpt={silent:true,noLoader:true,key:'dash_r'};
      App.api.call('dashboardSummary',[App.state.adminToken],function(res){
        if(!App.admin._auth(res)&&res&&res.success)summary=res.data||{};
        doneOne();
      },reqOpt);
      App.api.call('getOrderStats',[App.state.adminToken],function(res){
        if(!App.admin._auth(res)&&res&&res.success)stats=res.data||{};
        doneOne();
      },reqOpt);
      App.api.call('getOrders',[{page:1,pageSize:30,lite:true},App.state.adminToken],function(res){
        if(!App.admin._auth(res)&&res&&res.success)ordersPayload=res.data||{};
        doneOne();
      },reqOpt);
      if(menuList.length){
        doneOne();
      }else{
        App.api.call('adminCRUDMenu',['getAll',{},App.state.adminToken],function(res){
          if(!App.admin._auth(res)&&res&&res.success){
            var rows=Array.isArray(res.data)?res.data:(res.data&&res.data.items?res.data.items:[]);
            menuList=Array.isArray(rows)?rows:[];
          }
          doneOne();
        },reqOpt);
      }
    },
    _buildDashboardModel:function(raw){
      raw=raw||{};
      var sum=raw.summary||{},st=raw.stats||{},ord=raw.orders||{};
      var list=Array.isArray(ord.items)?ord.items:(Array.isArray(ord)?ord:[]);
      var toTs=function(v){
        if(typeof v==='number')return v||0;
        var t=Date.parse(String(v||''));
        return isNaN(t)?0:t;
      };
      var safeNum=function(v){var n=parseFloat(v||0);return isNaN(n)?0:n;};
      var safeInt=function(v){var n=parseInt(v,10);return isNaN(n)?0:n;};
      var byTs=list.slice().map(function(o){
        var x=o||{};
        x.__ts=x.__ts||toTs(x.created_at||x.date||x.timestamp||'');
        return x;
      }).sort(function(a,b){return (b.__ts||0)-(a.__ts||0);});
      var statusCount={newOrder:0,inProgress:0,success:0,cancelled:0};
      var todayStr=(new Date()).toDateString();
      var todayCount=0;
      var todayRevenue=0;
      byTs.forEach(function(o){
        var s=String(o&&o.status||'').toLowerCase();
        var isDone=(s==='done'||s==='completed'||s==='delivered');
        var isCancel=App.admin._isCancelledOrderStatus(s);
        var isNew=(App.admin._statusUi(s).accept||s==='pending'||s==='paid');
        if(isCancel)statusCount.cancelled++;
        else if(isNew)statusCount.newOrder++;
        else if(isDone)statusCount.success++;
        else statusCount.inProgress++;
        if(o.__ts&&new Date(o.__ts).toDateString()===todayStr){
          todayCount++;
          if(!isCancel)todayRevenue+=safeNum(o.total||0);
        }
      });
      var recent=(Array.isArray(sum.recentOrders)&&sum.recentOrders.length?sum.recentOrders:byTs).slice(0,8);
      var topRaw=(Array.isArray(st.menuRanking)&&st.menuRanking.length?st.menuRanking:(Array.isArray(sum.topMenu)?sum.topMenu:[])).slice(0,6);
      if(!topRaw.length){
        var menuCnt={};
        byTs.forEach(function(o){
          if(App.admin._isCancelledOrderStatus(o&&o.status))return;
          (o.items||[]).forEach(function(it){
            var k=String(it&&it.name||'').trim();if(!k)return;
            menuCnt[k]=(menuCnt[k]||0)+safeInt(it&&it.qty||1);
          });
        });
        topRaw=Object.keys(menuCnt).map(function(k){return{name:k,count:menuCnt[k]};}).sort(function(a,b){return b.count-a.count;}).slice(0,6);
      }
      var chart=(Array.isArray(sum.chart7)?sum.chart7:[]).slice(0,7);
      if(!chart.length){
        var bins={},labels=[];
        for(var d=6;d>=0;d--){
          var dt=new Date();dt.setHours(0,0,0,0);dt.setDate(dt.getDate()-d);
          var key=dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate();
          bins[key]={label:dt.getDate()+'/'+(dt.getMonth()+1),revenue:0};
          labels.push(key);
        }
        byTs.forEach(function(o){
          if(!o.__ts)return;
          var dtt=new Date(o.__ts);dtt.setHours(0,0,0,0);
          var key=dtt.getFullYear()+'-'+(dtt.getMonth()+1)+'-'+dtt.getDate();
          if(!bins[key])return;
          if(App.admin._isCancelledOrderStatus(o&&o.status))return;
          bins[key].revenue+=safeNum(o.total||0);
        });
        chart=labels.map(function(k){return bins[k];});
      }else{
        chart=chart.map(function(c){return{label:String(c.date||c.label||'-'),revenue:safeNum(c.revenue||c.total||0)};});
      }
      var dept=(Array.isArray(sum.deptSummary)&&sum.deptSummary.length?sum.deptSummary:(Array.isArray(st.deptStats)?st.deptStats:[])).slice(0,8);
      if(!dept.length){
        var dm={};
        byTs.forEach(function(o){
          var k=String(o&&o.department||'').trim()||'ยังไม่ระบุ';
          dm[k]=dm[k]||{department:k,count:0,total:0};
          dm[k].count++;
          dm[k].total+=safeNum(o.total||0);
        });
        dept=Object.keys(dm).map(function(k){return dm[k];}).sort(function(a,b){return b.total-a.total;}).slice(0,8);
      }
      var alerts=[];
      if(statusCount.newOrder>0)alerts.push('มีออเดอร์ใหม่ '+statusCount.newOrder+' รายการ');
      var lowStock=(raw.menu||[]).filter(function(m){
        var s=safeNum(m&&m.stock);
        var active=String(m&&m.status||'on').toLowerCase()!=='off';
        return active&&s>0&&s<=5;
      }).slice(0,5);
      if(lowStock.length)alerts.push('เมนูใกล้หมดสต๊อก '+lowStock.length+' รายการ');
      if(raw.shopOpen===false)alerts.push('ร้านกำลังปิดอยู่');
      var topBest=(topRaw[0]||null);
      return {
        hasAny:!!(todayCount||todayRevenue||byTs.length||topRaw.length||dept.length||alerts.length),
        kpi:{
          todayOrders:safeInt(sum.todayCount||todayCount),
          todayRevenue:safeNum(sum.revenue||todayRevenue),
          pending:safeInt(statusCount.newOrder),
          cooking:safeInt(sum.cooking||statusCount.inProgress),
          done:safeInt(sum.done||statusCount.success),
          topMenuName:topBest?String(topBest.name||'ยังไม่มีข้อมูล'):'ยังไม่มีข้อมูล',
          topMenuCount:topBest?safeInt(topBest.count||topBest.qty||0):0,
          cashPendingDailyCount:safeInt(sum.cashPendingDailyCount||0),
          cashPendingDailyAmount:safeNum(sum.cashPendingDailyAmount||0),
          cashPendingTotalCount:safeInt(sum.cashPendingTotalCount||0),
          cashPendingTotalAmount:safeNum(sum.cashPendingTotalAmount||0)
        },
        recent:recent,
        best:topRaw,
        chart7:chart,
        dept:dept,
        alerts:alerts
      };
    },
    _renderDashboardData:function(model){
      model=model||{};
      var e=App.u.esc;
      var k=model.kpi||{};
      var kpiEl=document.getElementById('dashboard-kpi-grid');
      if(kpiEl){
        var cards=[
          {icon:'🧾',label:'ออเดอร์วันนี้',value:k.todayOrders||0},
          {icon:'💰',label:'ยอดขายวันนี้',value:App.u.fmt(k.todayRevenue||0)},
          {icon:'💵',label:'เงินสดค้างรับ (วันนี้)',value:App.u.fmt(k.cashPendingDailyAmount||0),sub:(k.cashPendingDailyCount||0)+' รายการ'},
          {icon:'🧾',label:'เงินสดค้างรับ (ทั้งหมด)',value:App.u.fmt(k.cashPendingTotalAmount||0),sub:(k.cashPendingTotalCount||0)+' รายการ'},
          {icon:'🕒',label:'ออเดอร์รอดำเนินการ',value:k.pending||0},
          {icon:'👨‍🍳',label:'ออเดอร์กำลังทำ',value:k.cooking||0},
          {icon:'✅',label:'ออเดอร์สำเร็จ',value:k.done||0},
          {icon:'🏆',label:'เมนูขายดี',value:(k.topMenuCount||0),sub:k.topMenuName||'ยังไม่มีข้อมูล'}
        ];
        kpiEl.innerHTML=cards.map(function(c){
          return '<div class="dashboard-kpi-card">'
            +'<div class="dashboard-kpi-icon">'+e(c.icon)+'</div>'
            +'<div class="dashboard-kpi-label">'+e(c.label)+'</div>'
            +'<div class="dashboard-kpi-value">'+e(String(c.value))+'</div>'
            +(c.sub?'<div class="dashboard-item-sub">'+e(c.sub)+'</div>':'')
          +'</div>';
        }).join('');
      }
      var recList=document.getElementById('dashboard-recent-list');
      var recCount=document.getElementById('dashboard-recent-count');
      var recent=Array.isArray(model.recent)?model.recent:[];
      if(recCount)recCount.textContent=recent.length+' รายการ';
      if(recList){
        if(!recent.length){
          recList.innerHTML='<div class="dashboard-empty-list">ยังไม่มีข้อมูล</div>';
        }else{
          recList.innerHTML=recent.map(function(o){
            var statusUi=App.admin._statusUi(o&&o.status||'');
            var tm='-';
            try{
              var t=new Date(o&&o.created_at||o&&o.__ts||0);
              if(!isNaN(t.getTime()))tm=t.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
            }catch(_){}
            return '<div class="dashboard-item">'
              +'<div class="dashboard-item-row"><div class="dashboard-item-main">#'+e(String(o&&o.id||'-'))+' • '+e(String(o&&o.customer||'ไม่ระบุ'))+'</div><div class="dashboard-item-num">'+App.u.fmt(o&&o.total||0)+'</div></div>'
              +'<div class="dashboard-item-sub">'+e(tm)+' • '+e(statusUi.label||'-')+'</div>'
            +'</div>';
          }).join('');
        }
      }
      var bestList=document.getElementById('dashboard-best-list');
      var best=Array.isArray(model.best)?model.best:[];
      if(bestList){
        if(!best.length)bestList.innerHTML='<div class="dashboard-empty-list">ยังไม่มีข้อมูล</div>';
        else{
          bestList.innerHTML=best.map(function(x,i){
            return '<div class="dashboard-item"><div class="dashboard-item-row"><div class="dashboard-item-main">'+(i+1)+'. '+e(String(x&&x.name||'-'))+'</div><div class="dashboard-item-num">'+(parseInt(x&&x.count||x&&x.qty||0,10)||0)+'</div></div></div>';
          }).join('');
        }
      }
      var chartEl=document.getElementById('dashboard-revenue-chart');
      var chart=Array.isArray(model.chart7)?model.chart7:[];
      if(chartEl){
        if(!chart.length){
          chartEl.innerHTML='<div class="dashboard-empty-list">ยังไม่มีข้อมูล</div>';
        }else{
          var maxRev=Math.max.apply(null,chart.map(function(c){return parseFloat(c&&c.revenue||0)||0;}).concat([1]));
          chartEl.innerHTML=chart.map(function(c){
            var rev=parseFloat(c&&c.revenue||0)||0;
            var h=Math.max(8,Math.round((rev/maxRev)*110));
            return '<div class="dashboard-revenue-bar">'
              +'<div class="dashboard-revenue-value">'+(rev>0?Math.round(rev).toLocaleString('th-TH'):'0')+'</div>'
              +'<div class="dashboard-revenue-fill" style="height:'+h+'px"></div>'
              +'<div class="dashboard-revenue-label">'+e(String(c&&c.label||'-'))+'</div>'
            +'</div>';
          }).join('');
        }
      }
      var deptEl=document.getElementById('dashboard-dept-list');
      var dept=Array.isArray(model.dept)?model.dept:[];
      if(deptEl){
        if(!dept.length)deptEl.innerHTML='<div class="dashboard-empty-list">ยังไม่มีข้อมูล</div>';
        else{
          deptEl.innerHTML=dept.map(function(d){
            return '<div class="dashboard-item"><div class="dashboard-item-row"><div class="dashboard-item-main">'+e(String(d&&d.department||'ยังไม่ระบุ'))+'</div><div class="dashboard-item-num">'+App.u.fmt(d&&d.total||0)+'</div></div><div class="dashboard-item-sub">'+(parseInt(d&&d.count||0,10)||0)+' ออเดอร์</div></div>';
          }).join('');
        }
      }
      var alertEl=document.getElementById('dashboard-alert-list');
      var alerts=Array.isArray(model.alerts)?model.alerts:[];
      if(alertEl){
        if(!alerts.length){
          alertEl.innerHTML='<div class="dashboard-alert-ok">ตอนนี้ทุกอย่างปกติ</div>';
        }else{
          alertEl.innerHTML=alerts.map(function(t){return '<div class="dashboard-alert-item">• '+e(String(t||''))+'</div>';}).join('');
        }
      }
    },
    loadMenu(){
      var cachedMenu=App.admin._getCache('menu',30000);
      if(cachedMenu){
        App.state.adminMenuItems=Array.isArray(cachedMenu)?cachedMenu:[];
        App.admin._menuStockFp=App.admin._menuFingerprint(App.state.adminMenuItems);
        App.admin.renderCategorySuggestions();
        App.admin.renderMenuFilters();
        App.admin.renderMenuPaged(true);
      }else{
        App.api.call('adminCRUDMenu',['getAll',{},App.state.adminToken],function(res){
          if(App.admin._auth(res))return;if(!res||!res.success)return;
          App.state.adminMenuItems=Array.isArray(res.data)?res.data:(res.data&&res.data.items?res.data.items:[]);
          App.admin._menuStockFp=App.admin._menuFingerprint(App.state.adminMenuItems);
          App.admin._setCache('menu',App.state.adminMenuItems.slice());
          App.admin.renderCategorySuggestions();
          App.admin.renderMenuFilters();
          App.admin.renderMenuPaged(true);
        },{key:'amenu'});
      }
      var cachedTopics=App.admin._getCache('topics',30000);
      if(cachedTopics){
        App.state.adminTopics=Array.isArray(cachedTopics)?cachedTopics:[];
      }else{
        App.api.call('adminCRUDOption',['getAll',{},App.state.adminToken],function(res){
          App.state.adminTopics=Array.isArray(res&&res.data)?res.data:[];
          App.admin._setCache('topics',App.state.adminTopics.slice());
        },{silent:true});
      }
      App.admin._startMenuLiveRefresh();
    },
    renderCategorySuggestions:function(){
      var dl=document.getElementById('mf-category-list');if(!dl)return;
      var cats={};
      (App.state.adminMenuItems||[]).forEach(function(m){
        var c=String(m&&m.category||'').trim();
        if(c)cats[c]=1;
      });
      dl.innerHTML=Object.keys(cats).sort().map(function(c){return '<option value="'+App.u.esc(c)+'"></option>';}).join('');
    },
    MENU_PAGE_SIZE:50,
    menuPage:0,
    menuFilter:'',
    menuCategory:'all',
    renderMenuFilters:function(){
      var wrap=document.getElementById('admin-menu-tabs');if(!wrap)return;
      var cats={};
      var hasUncategorized=false;
      (App.state.adminMenuItems||[]).forEach(function(m){
        var c=String(m&&m.category||'').trim();
        if(c)cats[c]=1;
        else hasUncategorized=true;
      });
      var list=['all'].concat(Object.keys(cats).sort());
      if(hasUncategorized)list.push('__uncategorized__');
      var cur=App.admin.menuCategory||'all';
      wrap.innerHTML=list.map(function(cat){
        var label=cat==='all'?'ทั้งหมด':(cat==='__uncategorized__'?'ไม่มีหมวดหมู่':'🍽 '+App.u.esc(cat));
        return '<button class="customer-tab-btn'+(cat===cur?' active':'')+'" data-cat="'+App.u.esc(cat)+'" onclick="App.admin.setMenuCategory(\''+App.u.esc(cat)+'\')">'+label+'</button>';
      }).join('');
    },
    setMenuCategory:function(cat){App.admin.menuCategory=cat||'all';App.admin.menuPage=0;App.admin.renderMenuFilters();App.admin.renderMenuPaged(true);},
    setMenuSearch:function(q){App.admin.menuFilter=String(q||'').toLowerCase();App.admin.menuPage=0;App.admin.renderMenuPaged(true);},
    _filteredMenuItems:function(){
      var all=App.state.adminMenuItems||[];
      var q=String(App.admin.menuFilter||'').toLowerCase();
      var cat=App.admin.menuCategory||'all';
      return all.filter(function(m){
        var itemCat=String(m.category||'').trim();
        var okCat=(cat==='all'||(cat==='__uncategorized__'?!itemCat:itemCat===cat));
        if(!okCat)return false;
        if(!q)return true;
        return String(m.name||'').toLowerCase().indexOf(q)>-1||String(m.category||'').toLowerCase().indexOf(q)>-1;
      });
    },
    renderMenuPaged:function(reset){
      if(reset)App.admin.menuPage=0;
      var filtered=App.admin._filteredMenuItems();
      var start=0;
      var end=Math.min((App.admin.menuPage+1)*App.admin.MENU_PAGE_SIZE,filtered.length);
      App.admin.renderMenuTable(filtered.slice(start,end),filtered.length);
    },
    loadMoreMenu:function(){App.admin.menuPage++;App.admin.renderMenuPaged(false);},
    _saveMenuOrder:function(ids,done){
      App.api.call('saveMenuOrder',[ids,App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(res&&res.success)App.admin._invalidateCache('menu');
        if(done)done(res);
      },{silent:true});
    },
    moveMenuOrder:function(idx,delta){
      if(!App.admin.ensureCanEdit())return;
      var list=(App.state.adminMenuItems||[]).slice();
      var ni=idx+delta;
      if(idx<0||idx>=list.length||ni<0||ni>=list.length)return;
      var tmp=list[idx];list[idx]=list[ni];list[ni]=tmp;
      App.state.adminMenuItems=list;
      App.admin.renderMenuTable(list);
      App.admin._saveMenuOrder(list.map(function(x){return x.id;}),function(res){
        if(!res||!res.success)App.ui.toast((res&&res.message)||'บันทึกลำดับไม่สำเร็จ','warn');
      });
    },
    setMenuOrder:function(id,newPos){
      if(!App.admin.ensureCanEdit())return;
      var pos=parseInt(newPos,10);
      var list=(App.state.adminMenuItems||[]).slice();
      var curIdx=list.findIndex(function(x){return String(x.id)===String(id);});
      if(curIdx<0)return;
      if(isNaN(pos)||pos<1)pos=1;
      if(pos>list.length)pos=list.length;
      var target=pos-1;
      if(target===curIdx){App.admin.renderMenuTable(list);return;}
      var item=list.splice(curIdx,1)[0];
      list.splice(target,0,item);
      App.state.adminMenuItems=list;
      App.admin.renderMenuTable(list);
      App.admin._saveMenuOrder(list.map(function(x){return x.id;}),function(res){
        if(!res||!res.success)App.ui.toast((res&&res.message)||'บันทึกลำดับไม่สำเร็จ','warn');
      });
    },
    renderMenuTable(items,totalCount){
      var tb=document.getElementById('menu-table');if(!tb)return;
      var filtered=App.admin._filteredMenuItems();
      var total=typeof totalCount==='number'?totalCount:filtered.length;
      var info=document.getElementById('admin-menu-page-info');
      var more=document.getElementById('admin-menu-loadmore');
      if(info){
        var shown=items&&items.length?items.length:0;
        info.textContent=total?'แสดง 1-'+shown+' จาก '+total+' รายการ':'ยังไม่มีเมนู';
      }
      if(more)more.style.display=(items&&items.length<total)?'':'none';
      if(!items||!items.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text2)">ยังไม่มีเมนู</td></tr>';return;}
      var e=App.u.esc;
      tb.innerHTML=items.map(function(m,idx){
        var realIdx=(App.state.adminMenuItems||[]).findIndex(function(x){return String(x.id||'')===String(m.id||'');});
        var stock=App.u.stockVal(m&&m.stock);
        var stockText=App.u.stockText(stock);
        var stockCls=(stock===0?'out':(stock>0&&stock<=5?'low':'ok'));
        return'<tr>'
          +'<td><div class="menu-order-wrap">'
            +'<input class="menu-order-num" type="number" min="1" max="'+(App.state.adminMenuItems||[]).length+'" value="'+(realIdx+1)+'" onchange="App.admin.setMenuOrder(\''+e(m.id)+'\',this.value)">'
            +'<button class="btn btn-secondary menu-order-btn"'+(realIdx===0?' disabled':'')+' onclick="App.admin.moveMenuOrder('+realIdx+',-1)">↑</button>'
            +'<button class="btn btn-secondary menu-order-btn"'+(realIdx===(App.state.adminMenuItems||[]).length-1?' disabled':'')+' onclick="App.admin.moveMenuOrder('+realIdx+',1)">↓</button>'
          +'</div></td>'
          +'<td><div class="admin-menu-img">'+(m.image?'<img src="'+e(m.image)+'" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'">':'🍱')+'</div></td>'
          +'<td><div style="font-weight:600">'+e(m.name)+'</div><div class="text-sm text-muted">'+e(m.category||'')+'</div></td>'
          +'<td>'+App.u.fmt(m.price)+'</td>'
          +'<td><span class="stock-badge '+stockCls+'">'+e(stockText)+'</span></td>'
          +'<td><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
            +'<label class="toggle-switch" title="สลับเปิดขาย/ปิดขาย">'
              +'<input type="checkbox" '+(m.status==='active'?'checked':'')+' onchange="App.admin.toggleMenuQuickStatus(\''+e(m.id)+'\',this.checked,this)">'
              +'<span class="toggle-slider"></span>'
            +'</label>'
            +'<span class="badge '+(m.status==='active'?'badge-paid':'badge-pending')+'">'+(m.status==='active'?'เปิดขาย':'ปิดขาย')+'</span>'
          +'</div></td>'
          +'<td><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><button class="btn btn-secondary" style="padding:6px 12px;font-size:13px" onclick="App.admin.openMenuEditById(\''+e(m.id)+'\')">แก้ไข</button><button class="btn" style="padding:6px 12px;font-size:13px;background:var(--primary-light);color:var(--primary)" onclick="App.admin.delMenu(\''+e(m.id)+'\')">ลบ</button></div></td>'
        +'</tr>';
      }).join('');
    },
    openMenuEditById:function(id){
      var idx=(App.state.adminMenuItems||[]).findIndex(function(m){return String(m.id||'')===String(id||'');});
      App.admin.openMenuEdit(idx>-1?idx:null);
    },
    openMenuEdit(idx){
      var item=typeof idx==='number'?App.state.adminMenuItems[idx]||null:null;
      var setVal=function(id,v){var el=document.getElementById(id);if(el)el.value=(v==null)?'':String(v);};
      document.getElementById('menu-modal-title').textContent=item?'แก้ไขเมนู':'เพิ่มเมนู';
      var stockVal=(item&&App.u.stockVal(item.stock)>=0)?App.u.stockVal(item.stock):'';
      setVal('mf-id',item?item.id:'');setVal('mf-name',item?item.name:'');setVal('mf-price',item?item.price:'');setVal('mf-stock',stockVal);setVal('mf-category',item?item.category:'');setVal('mf-image',item?item.image:'');setVal('mf-status',item?item.status:'active');
      App.admin.renderCategorySuggestions();
      App.state._finalImgB64=null;App.state._cropSrcUrl=item?item.image:null;App.state._cropSourceType='url';App.state._cropTarget='menu';
      // reset tabs to URL
      App.admin.switchImgTab('url');
      var fi=document.getElementById('img-preview-final'),pi=document.getElementById('img-preview-img');
      if(item&&item.image){if(fi)fi.style.display='';if(pi)pi.src=item.image;}else{if(fi)fi.style.display='none';}
      // โหลด topics แล้ว render selector
      if(!App.state.adminTopics||!App.state.adminTopics.length){
        App.api.call('adminCRUDOption',['getAll',{},App.state.adminToken],function(res){
          App.state.adminTopics=Array.isArray(res&&res.data)?res.data:[];
          App.admin.renderMenuTopicsSelector(item?item.id:null, item?item.topic_ids:null);
        },{silent:true});
      }else{
        App.admin.renderMenuTopicsSelector(item?item.id:null, item?item.topic_ids:null);
      }
      document.getElementById('menu-modal').classList.add('active');
    },

    // ── IMAGE / CROP ────────────────────────────────────────────
    switchImgTab:function(tab){
      document.getElementById('img-tab-url').classList.toggle('active',tab==='url');
      document.getElementById('img-tab-file').classList.toggle('active',tab==='file');
      document.getElementById('img-panel-url').style.display=tab==='url'?'':'none';
      document.getElementById('img-panel-file').style.display=tab==='file'?'':'none';
      App.state._cropSourceType=(tab==='file'?'file':'url');
    },
    previewImgUrl:function(url){
      var fi=document.getElementById('img-preview-final'),pi=document.getElementById('img-preview-img');
      if(!url){if(fi)fi.style.display='none';return;}
      if(pi){
        pi.src=url;
        pi.onerror=function(){if(fi)fi.style.display='none';};
        pi.onload=function(){
          App.state._cropSrcUrl=url;App.state._finalImgB64=null;App.state._cropSourceType='url';App.state._cropTarget='menu';
          if(fi)fi.style.display='';
        };
      }
    },
    onImgFileSelected:function(ev){
      var file=ev.target.files&&ev.target.files[0];if(!file)return;
      var reader=new FileReader();
      reader.onload=function(e){
        App.state._cropSrcUrl=e.target.result;
        App.state._finalImgB64=null;App.state._cropSourceType='file';App.state._cropTarget='menu';
        // แสดง preview ทันที แล้วเปิด crop อัตโนมัติ
        var pi=document.getElementById('img-preview-img'),fi=document.getElementById('img-preview-final');
        if(pi){pi.src=e.target.result;}
        if(fi){fi.style.display='';}
        App.admin.openCrop('menu');
      };
      reader.readAsDataURL(file);
      ev.target.value=''; // reset input
    },
    clearMenuImg:function(){
      App.state._finalImgB64=null;App.state._cropSrcUrl=null;App.state._cropSourceType='url';App.state._cropTarget='menu';
      var fi=document.getElementById('img-preview-final'),pi=document.getElementById('img-preview-img');
      if(fi)fi.style.display='none';if(pi)pi.src='';
      var img=document.getElementById('mf-image');if(img)img.value='';
      var ff=document.getElementById('mf-image-file');if(ff)ff.value='';
    },

    // ── CROP ENGINE ─────────────────────────────────────────────
    _crop:{src:null,img:null,x:0,y:0,scale:1,dragging:false,startX:0,startY:0,startImgX:0,startImgY:0,lastPinchDist:0,SIZE:300},
    openCrop:function(target){
      App.state._cropTarget=target||App.state._cropTarget||'menu';
      var src=App.state._cropSrcUrl;if(!src)return;
      var modal=document.getElementById('crop-modal');if(!modal)return;
      modal.style.display='flex';
      var c=App.admin._crop;c.src=src;c.scale=1;c.x=0;c.y=0;
      // reset zoom slider
      var zs=document.getElementById('crop-zoom');if(zs)zs.value=100;
      var zv=document.getElementById('crop-zoom-val');if(zv)zv.textContent='100%';
      var img=new Image();
      try{img.crossOrigin='anonymous';}catch(_){}
      img.onload=function(){
        c.img=img;App.admin._cropDraw();
        // fit image to viewport initially
        var fit=Math.max(c.SIZE/img.width,c.SIZE/img.height);
        c.scale=fit;
        c.x=(c.SIZE-img.width*fit)/2;c.y=(c.SIZE-img.height*fit)/2;
        App.admin._cropDraw();
      };
      img.src=src;
      // bind events
      App.admin._cropBindEvents();
    },
    closeCrop:function(){
      var modal=document.getElementById('crop-modal');if(modal)modal.style.display='none';
      App.admin._cropUnbindEvents();
    },
    _cropDraw:function(){
      var c=App.admin._crop;
      var canvas=document.getElementById('crop-canvas');if(!canvas||!c.img)return;
      canvas.width=c.SIZE;canvas.height=c.SIZE;
      var ctx=canvas.getContext('2d');
      ctx.clearRect(0,0,c.SIZE,c.SIZE);
      ctx.drawImage(c.img,c.x,c.y,c.img.width*c.scale,c.img.height*c.scale);
    },
    onCropZoom:function(val){
      var c=App.admin._crop;if(!c.img)return;
      var zv=document.getElementById('crop-zoom-val');if(zv)zv.textContent=val+'%';
      var newScale=parseFloat(val)/100*Math.max(c.SIZE/c.img.width,c.SIZE/c.img.height);
      // zoom from center
      var cx=c.SIZE/2,cy=c.SIZE/2;
      var ratio=newScale/c.scale;
      c.x=cx+(c.x-cx)*ratio;c.y=cy+(c.y-cy)*ratio;
      c.scale=newScale;App.admin._cropDraw();
    },
    applyCrop:function(){
      var c=App.admin._crop;if(!c.img)return;
      try{
        var out=document.createElement('canvas');out.width=300;out.height=300;
        var ctx=out.getContext('2d');
        ctx.drawImage(c.img,c.x,c.y,c.img.width*c.scale,c.img.height*c.scale);
        var b64=out.toDataURL('image/jpeg',0.85);
        if((App.state._cropTarget||'menu')==='storelogo'){
          App.state._storeLogoB64=b64;App.state._storeLogoSrcUrl=b64;
          var spi=document.getElementById('sl-preview-img');if(spi)spi.src=b64;
          var spf=document.getElementById('sl-preview-final');if(spf)spf.style.display='';
          var sl=document.getElementById('s-logo');if(sl)sl.value='';
        }else{
          App.state._finalImgB64=b64;App.state._cropSrcUrl=b64;
          var pi=document.getElementById('img-preview-img');if(pi)pi.src=b64;
          var mi=document.getElementById('mf-image');if(mi)mi.value='';
        }
        App.admin.closeCrop();
        App.ui.toast('ครอบรูปเรียบร้อย','success');
      }catch(ex){
        App.ui.toast('ครอบรูปจาก URL นี้ไม่ได้ (ติดข้อจำกัด CORS) ลองใช้ไฟล์อัปโหลด','warn');
      }
    },
    _cropBindEvents:function(){
      var vp=document.getElementById('crop-viewport');if(!vp)return;
      var c=App.admin._crop;
      // mouse
      var onDown=function(e){
        c.dragging=true;vp.style.cursor='grabbing';
        c.startX=e.clientX;c.startY=e.clientY;c.startImgX=c.x;c.startImgY=c.y;
        e.preventDefault();
      };
      var onMove=function(e){
        if(!c.dragging)return;
        c.x=c.startImgX+(e.clientX-c.startX);c.y=c.startImgY+(e.clientY-c.startY);
        App.admin._cropDraw();e.preventDefault();
      };
      var onUp=function(){c.dragging=false;vp.style.cursor='grab';};
      // touch
      var onTouchStart=function(e){
        if(e.touches.length===1){
          c.dragging=true;c.startX=e.touches[0].clientX;c.startY=e.touches[0].clientY;c.startImgX=c.x;c.startImgY=c.y;
        }else if(e.touches.length===2){
          c.dragging=false;c.lastPinchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        }
        e.preventDefault();
      };
      var onTouchMove=function(e){
        if(e.touches.length===1&&c.dragging){
          c.x=c.startImgX+(e.touches[0].clientX-c.startX);c.y=c.startImgY+(e.touches[0].clientY-c.startY);
          App.admin._cropDraw();
        }else if(e.touches.length===2){
          var dist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
          if(c.lastPinchDist>0){
            var ratio=dist/c.lastPinchDist;
            var cx=c.SIZE/2,cy=c.SIZE/2;
            c.x=cx+(c.x-cx)*ratio;c.y=cy+(c.y-cy)*ratio;c.scale*=ratio;
            // sync slider
            var fit=Math.max(c.SIZE/(c.img&&c.img.width||300),c.SIZE/(c.img&&c.img.height||300));
            var sliderVal=Math.round(c.scale/fit*100);
            var zs=document.getElementById('crop-zoom');if(zs)zs.value=Math.min(400,Math.max(100,sliderVal));
            var zv=document.getElementById('crop-zoom-val');if(zv)zv.textContent=Math.min(400,Math.max(100,sliderVal))+'%';
            App.admin._cropDraw();
          }
          c.lastPinchDist=dist;
        }
        e.preventDefault();
      };
      var onTouchEnd=function(){c.dragging=false;c.lastPinchDist=0;};
      // scroll zoom
      var onWheel=function(e){
        var zs=document.getElementById('crop-zoom');if(!zs)return;
        var v=Math.min(400,Math.max(100,parseInt(zs.value)+(e.deltaY<0?10:-10)));
        zs.value=v;App.admin.onCropZoom(v);e.preventDefault();
      };
      vp.addEventListener('mousedown',onDown);
      window.addEventListener('mousemove',onMove);
      window.addEventListener('mouseup',onUp);
      vp.addEventListener('touchstart',onTouchStart,{passive:false});
      vp.addEventListener('touchmove',onTouchMove,{passive:false});
      vp.addEventListener('touchend',onTouchEnd);
      vp.addEventListener('wheel',onWheel,{passive:false});
      c._evDown=onDown;c._evMove=onMove;c._evUp=onUp;
      c._evTS=onTouchStart;c._evTM=onTouchMove;c._evTE=onTouchEnd;c._evW=onWheel;
      c._vp=vp;
    },
    _cropUnbindEvents:function(){
      var c=App.admin._crop;var vp=c._vp;if(!vp)return;
      if(c._evDown)vp.removeEventListener('mousedown',c._evDown);
      if(c._evMove)window.removeEventListener('mousemove',c._evMove);
      if(c._evUp)window.removeEventListener('mouseup',c._evUp);
      if(c._evTS)vp.removeEventListener('touchstart',c._evTS);
      if(c._evTM)vp.removeEventListener('touchmove',c._evTM);
      if(c._evTE)vp.removeEventListener('touchend',c._evTE);
      if(c._evW)vp.removeEventListener('wheel',c._evW);
    },
    saveMenu(){
      if(!App.admin.ensureCanEdit())return;
      var id=document.getElementById('mf-id').value,name=document.getElementById('mf-name').value.trim(),price=parseFloat(document.getElementById('mf-price').value);
      var stockRaw=document.getElementById('mf-stock').value;
      if(!name){App.ui.toast('กรุณากรอกชื่อเมนู','error');return;}
      if(!price||price<=0){App.ui.toast('กรุณากรอกราคา','error');return;}
      if(String(stockRaw||'').trim()!==''&&toNum(stockRaw)<0){App.ui.toast('สต๊อกต้องเป็น 0 หรือมากกว่า','error');return;}
      var selectedTopics=[];document.querySelectorAll('#mf-topics-list input[type=checkbox]:checked').forEach(function(cb){selectedTopics.push(cb.value);});
      var imgUrl=document.getElementById('mf-image').value||'';
      var b64=App.state._finalImgB64||null;
      App.u.btnAction({
        debounceKey:'savemenu',debounceMs:2000,
        btnId:'save-menu-btn',loadingText:'⏳ กำลังบันทึก...',successText:'บันทึก',
        successMsg:'✅ บันทึกเมนูแล้ว',modalId:'menu-modal',modalCloseDelay:600,
        onSuccess:function(){App.state._menuLoaded=false;App.admin._invalidateCache('menu');App.admin.loadMenu();}
      },function(done){
        var doSave=function(finalUrl){
          var data={id:id,name:name,price:price,stock:(String(stockRaw||'').trim()===''?'':parseInt(stockRaw,10)),category:document.getElementById('mf-category').value,image:finalUrl,status:document.getElementById('mf-status').value,topic_ids:JSON.stringify(selectedTopics)};
          App.api.call('adminCRUDMenu',[id?'update':'insert',data,App.state.adminToken],function(res){
            if(App.admin._auth(res))return;
            done(res);
          });
        };
        if(b64&&b64.startsWith('data:image')){
          App.api.silent('getSettings',[],function(cfgRes){
            var drv=cfgRes&&cfgRes.success&&cfgRes.data?String(cfgRes.data.drive_folder_id||'').trim():'';
            if(!drv){
              if(String(b64).length>49000){
                done({success:false,message:'รูปใหญ่เกินไป กรุณาตั้งค่า Google Drive Folder ID ก่อนอัปโหลดรูป'});
                return;
              }
              doSave(b64);
              return;
            }
            App.ui.toast('⏳ กำลังอัพโหลดรูป...','info');
            var mimeType=b64.split(';')[0].split(':')[1]||'image/jpeg';
            var rawB64=b64.split(',')[1]||'';
            App.api.call('uploadImageToDrive',[rawB64,'menu_'+Date.now()+'.jpg',mimeType,App.state.adminToken],function(res){
              if(res&&res.success&&res.data&&res.data.url){doSave(res.data.url);}
              else{done(res||{success:false,message:'อัพโหลดรูปไม่ได้'});}
            },{key:'imgupload'});
          });
        }else{doSave(imgUrl);}
      });
    },
    renderMenuTopicsSelector(menuId,topicIdsJson){
      var wrap=document.getElementById('mf-topics-list');if(!wrap)return;
      var topics=App.state.adminTopics||[];
      if(!topics.length){wrap.innerHTML='<p class="text-sm text-muted" style="padding:4px 0">ยังไม่มีหัวข้อตัวเลือก (ไปสร้างได้ที่เมนู ตัวเลือก)</p>';return;}
      var e=App.u.esc;
      var linked=[];
      if(topicIdsJson){try{var arr=JSON.parse(topicIdsJson);linked=arr.map(String);}catch(_){}}
      if(!linked.length&&menuId){topics.forEach(function(t){var mid=String(t.menu_id||'');if(mid!=='*'&&mid===String(menuId))linked.push(String(t.id));});}
      var html='';
      var menuNameMap={};
      (App.state.adminMenuItems||[]).forEach(function(m){menuNameMap[String(m.id||'')]=String(m.name||m.id||'');});
      topics.forEach(function(t){
        var choices=[];try{choices=JSON.parse(t.choices||'[]');}catch(_){}
        var choiceLabels=choices.slice(0,3).map(function(c){return typeof c==='string'?c:(c.label||'');}).join(', ')+(choices.length>3?'...':'');
        var checked=linked.indexOf(String(t.id))>-1;
        var chk=checked?' checked':'';
        var mid=String(t.menu_id||'');
        var ownerText=(mid==='*')?'ใช้ได้ทุกเมนู':(mid&&mid.indexOf('*_unlinked_')!==0?('ตั้งต้นจากเมนู: '+(menuNameMap[mid]||mid)):'');
        html+='<label class="topic-sel-row"><input type="checkbox" value="'+e(t.id)+'"'+chk+' style="accent-color:var(--primary);width:16px;height:16px;flex-shrink:0;margin-top:2px"><div><div style="font-weight:600;font-size:14px">'+e(t.group_name||'')+'</div><div class="text-xs text-muted">'+e(choiceLabels)+(ownerText?' • '+e(ownerText):'')+'</div></div></label>';
      });
      wrap.innerHTML=html;
    },
    toggleMenuQuickStatus:function(id,nextChecked,inputEl){
      if(!App.admin.ensureCanEdit()){
        if(inputEl)inputEl.checked=!nextChecked;
        return;
      }
      var targetStatus=nextChecked?'active':'inactive';
      var actionLabel=nextChecked?'เปิดขาย':'ปิดขาย';
      App.ui.confirm('ยืนยัน'+actionLabel+'เมนูนี้?',function(ok){
        if(!ok){
          if(inputEl)inputEl.checked=!nextChecked;
          return;
        }
        App.api.call('adminCRUDMenu',['update',{id:id,status:targetStatus},App.state.adminToken],function(res){
          if(App.admin._auth(res)){
            if(inputEl)inputEl.checked=!nextChecked;
            return;
          }
          if(!res||!res.success){
            if(inputEl)inputEl.checked=!nextChecked;
            App.ui.toast((res&&res.message)||('บันทึกสถานะ'+actionLabel+'ไม่สำเร็จ'),'warn');
            return;
          }
          var list=App.state.adminMenuItems||[];
          var found=list.find(function(x){return String(x&&x.id||'')===String(id||'');});
          if(found)found.status=targetStatus;
          App.state._menuLoaded=false;
          App.admin._invalidateCache('menu');
          App.ui.toast(actionLabel+'เมนูแล้ว','success');
          App.admin.renderMenuPaged(true);
        },{loaderText:'กำลังบันทึกสถานะเมนู...'});
      },{okText:'ยืนยัน',cancelText:'ยกเลิก',disableBackdropClose:true});
    },
    delMenu(id){if(!App.admin.ensureCanEdit())return;App.ui.confirm('ยืนยันลบเมนูนี้?',function(ok){if(!ok)return;App.api.call('adminCRUDMenu',['delete',{id:id},App.state.adminToken],function(res){if(App.admin._auth(res))return;if(res&&res.success){App.ui.toast('ลบเมนูแล้ว','success');App.state._menuLoaded=false;App.admin._invalidateCache('menu');App.admin.loadMenu();}});});},

    // TOPICS
    loadTopics(){
      var cached=App.admin._getCache('topics',30000);
      if(cached){
        App.state.adminTopics=Array.isArray(cached)?cached:[];
        App.admin.renderTopicsList(App.state.adminTopics);
        return;
      }
      App.api.call('adminCRUDOption',['getAll',{},App.state.adminToken],function(res){
        if(App.admin._auth(res))return;if(!res||!res.success)return;
        App.state.adminTopics=Array.isArray(res.data)?res.data:[];
        App.admin._setCache('topics',App.state.adminTopics.slice());
        App.admin.renderTopicsList(App.state.adminTopics);
      });
    },
    renderTopicsList(topics){
      var container=document.getElementById('topics-list');if(!container)return;
      if(!topics||!topics.length){container.innerHTML='<div class="empty-state"><div class="icon">🏷</div><h3>ยังไม่มีหัวข้อ</h3></div>';return;}
      var e=App.u.esc;
      container.innerHTML=topics.map(function(t,idx){var choices=[];try{choices=JSON.parse(t.choices||'[]');}catch(_){}var isReq=String(t.is_required)==='true',isSingle=String(t.type||'single')==='single';var st=App.u.stockVal(t&&t.stock);var stText=App.u.stockText(st);var stCls=(st===0?'out':(st>0&&st<=5?'low':'ok'));return'<div class="topic-card"><div class="topic-card-header"><div style="flex:1"><div class="topic-card-title">'+e(t.group_name||'ไม่มีชื่อ')+'</div><div class="text-xs text-muted mt-2">'+(isReq?'<span style="color:var(--primary)">บังคับ</span>':'ไม่บังคับ')+'</div></div><div style="display:flex;gap:6px;align-items:center"><span class="stock-badge '+stCls+'">'+e(stText)+'</span><span class="topic-badge '+(isSingle?'topic-badge-single':'topic-badge-multi')+'">'+(isSingle?'เดียว':'หลาย')+'</span><span class="badge '+(t.status==='active'?'badge-paid':'badge-pending')+'">'+(t.status==='active'?'เปิด':'ปิด')+'</span></div></div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">'+choices.map(function(c){var cl=typeof c==='string'?c:(c.label||c.name||'?');var cp=typeof c==='object'?toNum(c.price||0):0;return'<span class="choice-tag">'+e(cl)+(cp>0?' <small style="color:var(--primary)">+'+cp+'฿</small>':'')+'</span>';}).join('')+'</div><div style="display:flex;gap:8px"><button class="btn btn-secondary" style="flex:1;padding:8px;font-size:13px" onclick="App.admin.openTopicEdit('+idx+')">✏ แก้ไข</button><button class="btn" style="flex:1;padding:8px;font-size:13px;background:var(--primary-light);color:var(--primary)" onclick="App.admin.delTopic(\''+e(t.id)+'\')">🗑 ลบ</button></div></div>';}).join('');
    },
    openTopicEdit(idx){
      var t=typeof idx==='number'?App.state.adminTopics[idx]||null:null;
      var setVal=function(id,v){var el=document.getElementById(id);if(el)el.value=(v==null)?'':String(v);};
      document.getElementById('topic-modal-title').textContent=t?'แก้ไขหัวข้อ':'เพิ่มหัวข้อ';
      var topicStock=(t&&App.u.stockVal(t.stock)>=0)?App.u.stockVal(t.stock):'';
      setVal('tf-id',t?t.id:'');setVal('tf-name',t?t.group_name:'');setVal('tf-required',t?String(t.is_required||'false'):'false');setVal('tf-status',t?t.status:'active');setVal('tf-type',t?t.type:'single');setVal('tf-stock',topicStock);
      var menuSel=document.getElementById('tf-menu-id');
      if(menuSel){
        menuSel.innerHTML='<option value="*_unlinked_new">ยังไม่ผูกเมนู (ไม่แสดงฝั่งลูกค้า)</option><option value="*">ทุกเมนู</option>'+App.state.adminMenuItems.map(function(m){return'<option value="'+App.u.esc(m.id)+'">'+App.u.esc(m.name)+'</option>';}).join('');
        var mid=(t&&t.menu_id)?String(t.menu_id):'';
        if(!mid)mid='*_unlinked_new';
        if(String(mid).indexOf('*_unlinked_')===0)mid='*_unlinked_new';
        menuSel.value=mid;
      }
      var choices=[];if(t&&t.choices){try{choices=JSON.parse(t.choices);}catch(_){}}
      App.state._topicChoices=choices.map(function(c){
        if(typeof c==='string')return{label:c,price:0};
        return{label:String(c.label||c.name||c),price:toNum(c.price||0)};
      });
      App.admin.renderTopicChoices();document.getElementById('tf-choice-input').value='';document.getElementById('topic-modal').classList.add('active');
    },
    renderTopicChoices(){var list=document.getElementById('tf-choices-list');if(!list)return;var e=App.u.esc;list.innerHTML=App.state._topicChoices.map(function(c,i){var label=typeof c==='string'?c:c.label;var price=typeof c==='object'?toNum(c.price||0):0;return'<span class="choice-tag">'+e(label)+(price>0?' <small style="color:var(--primary)">+'+price+'฿</small>':'')+'<span class="remove-choice" onclick="App.admin.removeTopicChoice('+i+')" title="ลบ">×</span></span>';}).join('');},
    addTopicChoice(){var inp=document.getElementById('tf-choice-input'),priceInp=document.getElementById('tf-choice-price');if(!inp)return;var val=inp.value.trim();var price=toNum(priceInp?priceInp.value:0);if(!val){App.ui.toast('กรุณากรอกชื่อตัวเลือก','error');return;}var exists=App.state._topicChoices.some(function(c){return(typeof c==='string'?c:c.label)===val;});if(exists){App.ui.toast('มีตัวเลือกนี้แล้ว','warn');return;}App.state._topicChoices.push({label:val,price:price});inp.value='';if(priceInp)priceInp.value='';App.admin.renderTopicChoices();},
    removeTopicChoice(idx){App.state._topicChoices.splice(idx,1);App.admin.renderTopicChoices();},
    saveTopic(){
      if(!App.admin.ensureCanEdit())return;
      var id=document.getElementById('tf-id').value,name=document.getElementById('tf-name').value.trim();
      var stockRaw=document.getElementById('tf-stock').value;
      if(!name){App.ui.toast('กรุณากรอกชื่อหัวข้อ','error');return;}
      if(!App.state._topicChoices.length){App.ui.toast('กรุณาเพิ่มตัวเลือกอย่างน้อย 1 อย่าง','error');return;}
      if(String(stockRaw||'').trim()!==''&&toNum(stockRaw)<0){App.ui.toast('สต๊อกต้องเป็น 0 หรือมากกว่า','error');return;}
      var data={id:id,group_name:name,menu_id:document.getElementById('tf-menu-id').value||'*',type:document.getElementById('tf-type').value,is_required:document.getElementById('tf-required').value,stock:(String(stockRaw||'').trim()===''?'':parseInt(stockRaw,10)),choices:JSON.stringify(App.state._topicChoices.map(function(c){return typeof c==='string'?{label:c,price:0}:c;})),status:document.getElementById('tf-status').value};
      App.u.btnAction({
        debounceKey:'savetopic',debounceMs:2000,
        btnId:'save-topic-btn',loadingText:'⏳ กำลังบันทึก...',successText:'บันทึก',
        successMsg:'✅ บันทึกหัวข้อแล้ว',modalId:'topic-modal',modalCloseDelay:600,
        onSuccess:function(){App.state._menuLoaded=false;App.admin._invalidateCache(['topics','menu']);App.admin.loadTopics();}
      },function(done){
        App.api.call('adminCRUDOption',[id?'update':'insert',data,App.state.adminToken],function(res){
          if(App.admin._auth(res))return;
          done(res);
        });
      });
    },
    delTopic(id){if(!App.admin.ensureCanEdit())return;App.ui.confirm('ยืนยันลบหัวข้อ?',function(ok){if(!ok)return;App.api.call('adminCRUDOption',['delete',{id:id},App.state.adminToken],function(res){if(App.admin._auth(res))return;if(res&&res.success){App.ui.toast('ลบแล้ว','success');App.state._menuLoaded=false;App.admin._invalidateCache(['topics','menu']);App.admin.loadTopics();}});});},

    // PROMOS
    loadPromos(){
      var tb=document.getElementById('promo-table');
      if(tb)tb.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text2)">กำลังโหลดโปรโมชัน...</td></tr>';
      var cached=App.admin._getCache('promos',30000);
      if(cached){
        App.state.adminPromos=Array.isArray(cached)?cached:[];
        App.admin.renderPromoTable();
      }else{
        App.api.call('adminCRUDPromotion',['getAll',{},App.state.adminToken],function(res){
          if(App.admin._auth(res))return;if(!res||!res.success)return;
          App.state.adminPromos=Array.isArray(res.data)?res.data:[];
          App.admin._setCache('promos',App.state.adminPromos.slice());
          App.admin.renderPromoTable();
        });
        return;
      }
    },
    renderPromoTable:function(){
      var tb=document.getElementById('promo-table'),e=App.u.esc;
      if(!tb)return;
      if(!App.state.adminPromos.length){tb.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text2)">ไม่มีโปรโมชัน</td></tr>';return;}
      tb.innerHTML=App.state.adminPromos.map(function(p,idx){return'<tr><td><span class="badge badge-paid">'+(p.type==='qty'?'จำนวน':'ยอดใช้จ่าย')+'</span></td><td>'+e(p.threshold)+(p.type==='qty'?' รายการ':' บาท')+'</td><td>ลด '+e(p.discount)+' บาท</td><td>'+e(p.description||'-')+'</td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-secondary" style="padding:6px 12px;font-size:13px" onclick="App.admin.openPromoEdit('+idx+')">แก้ไข</button><button class="btn" style="padding:6px 12px;font-size:13px;background:var(--primary-light);color:var(--primary)" onclick="App.admin.delPromo(\''+e(p.id||'')+'\')">ลบ</button></div></td></tr>';}).join('');
    },
    openPromoEdit(idx){var p=typeof idx==='number'?App.state.adminPromos[idx]||null:null;var setVal=function(id,v){var el=document.getElementById(id);if(el)el.value=v||'';};setVal('pf-id',p?p.id:'');setVal('pf-type',p?p.type:'qty');setVal('pf-threshold',p?p.threshold:'');setVal('pf-discount',p?p.discount:'');setVal('pf-desc',p?p.description:'');setVal('pf-status',p?p.status:'active');document.getElementById('promo-modal').classList.add('active');},
    savePromo(){
      if(!App.admin.ensureCanEdit())return;
      var id=document.getElementById('pf-id').value,threshold=document.getElementById('pf-threshold').value,discount=document.getElementById('pf-discount').value;
      var type=document.getElementById('pf-type').value;
      var tNum=toNum(threshold),dNum=toNum(discount);
      if(!threshold||!discount){App.ui.toast('กรุณากรอกเงื่อนไขและส่วนลด','error');return;}
      if(type!=='qty'&&type!=='spend'){App.ui.toast('ประเภทโปรโมชันไม่ถูกต้อง','error');return;}
      if(tNum<=0||dNum<=0){App.ui.toast('เงื่อนไขและส่วนลดต้องมากกว่า 0','error');return;}
      var data={id:id,type:type,threshold:tNum,discount:dNum,description:document.getElementById('pf-desc').value,status:document.getElementById('pf-status').value};
      App.u.btnAction({
        debounceKey:'savepromo',debounceMs:2000,
        btnId:'save-promo-btn',loadingText:'⏳ กำลังบันทึก...',successText:'บันทึก',
        successMsg:'✅ บันทึกโปรโมชันแล้ว',modalId:'promo-modal',modalCloseDelay:600,
        onSuccess:function(){App.admin._invalidateCache('promos');App.admin.loadPromos();}
      },function(done){
        App.api.call('adminCRUDPromotion',[id?'update':'insert',data,App.state.adminToken],function(res){
          if(App.admin._auth(res))return;
          done(res);
        });
      });
    },
    delPromo:function(id){
      if(!App.admin.ensureCanEdit())return;
      App.ui.confirm('ยืนยันลบโปรโมชันนี้?',function(ok){
        if(!ok)return;
        App.api.call('adminCRUDPromotion',['delete',{id:id},App.state.adminToken],function(res){
          if(App.admin._auth(res))return;
          if(!res||!res.success){App.ui.toast((res&&res.message)||'ลบโปรโมชันไม่สำเร็จ','warn');return;}
          App.ui.toast('ลบโปรโมชันแล้ว','success');
          App.admin._invalidateCache('promos');
          App.admin.loadPromos();
        });
      });
    },

    // USERS
    loadUsers:function(force){
      var cached=!force?App.admin._getCache('users',30000):null;
      if(cached){
        App.state.adminUsers=Array.isArray(cached)?cached:[];
      }else{
        App.api.call('getUsers',[App.state.adminToken],function(res){
          if(App.admin._auth(res))return;if(!res||!res.success)return;
          App.state.adminUsers=res.data||[];
          App.admin._setCache('users',(App.state.adminUsers||[]).slice());
          App.admin._renderUsersTable();
        });
        return;
      }
      App.admin._renderUsersTable();
    },
    _renderUsersTable:function(){
      var tb=document.getElementById('users-table'),e=App.u.esc;
      if(!tb)return;
      var canManage=App.admin.canManageUsersApi();
      tb.innerHTML=App.state.adminUsers.map(function(u,idx){
        var canDel=canManage&&String(u.role||'').toLowerCase()!=='admin'&&String(u.username||'').toLowerCase()!=='admin';
        var canEdit=canManage;
        return'<tr><td>'+e(u.username)+'</td><td>'+e(u.role)+'</td><td><span class="badge '+(u.status==='active'?'badge-paid':'badge-pending')+'">'+e(u.status)+'</span></td><td><div style="display:flex;gap:6px;flex-wrap:wrap">'+(canEdit?'<button class="btn btn-secondary" style="padding:6px 12px;font-size:13px" onclick="App.admin.openUserEdit('+idx+')">แก้ไข</button>':'')+(canDel?'<button data-admin-only="true" class="btn btn-secondary" style="padding:6px 12px;font-size:13px" onclick="App.admin.delUser(\''+e(u.id||'')+'\',\''+e(u.username||'')+'\',\''+e(u.role||'')+'\')">ลบ</button>':'')+'</div></td></tr>';
      }).join('');
      
    },
    delUser:function(id,username,role){
      if(!App.admin.ensureCanManageUsersApi())return;
      if(!App.admin.ensureCanEdit())return;
      var r=String(role||'').toLowerCase(),u=String(username||'').toLowerCase();
      if(r==='admin'||u==='admin'){App.ui.toast('ไม่สามารถลบบัญชี admin ได้','warn');return;}
      App.ui.confirm('ยืนยันลบผู้ใช้ '+String(username||'')+' ?',function(ok){
        if(!ok)return;
        App.api.call('deleteAdminUser',[id,App.state.adminToken],function(res){
          if(App.admin._auth(res))return;
          if(!res||!res.success){App.ui.toast((res&&res.message)||'ลบผู้ใช้ไม่สำเร็จ','warn');return;}
          App.ui.toast('ลบผู้ใช้แล้ว','success');
          App.admin._invalidateCache('users');
          App.admin.loadUsers();
        });
      });
    },
    openUserEdit(idx){
      if(!App.admin.ensureCanManageUsersApi())return;
      var u=typeof idx==='number'?App.state.adminUsers[idx]||null:null;
      var setVal=function(id,v){var el=document.getElementById(id);if(el)el.value=v||'';};
      var title=document.querySelector('#user-modal .admin-modal-header h3');
      if(title)title.textContent=u?'แก้ไขผู้ใช้':'เพิ่มผู้ใช้';
      setVal('uf-id',u?u.id:'');
      setVal('uf-original-username',u?u.username:'');
      setVal('uf-username',u?u.username:'');
      setVal('uf-newpass','');
      setVal('uf-role',u?u.role:'staff');
      var roleEl=document.getElementById('uf-role');
      if(roleEl&&!u){
        var hasGuest=(App.state.adminUsers||[]).some(function(x){return String(x.username||'').toLowerCase()==='guest'||String(x.role||'')==='guest';});
        roleEl.querySelectorAll('option[value="guest"]').forEach(function(op){op.disabled=hasGuest;});
      }
      document.getElementById('user-modal').classList.add('active');
    },
    saveUser(){
      if(!App.admin.ensureCanManageUsersApi())return;
      if(!App.admin.ensureCanEdit())return;
      var id=document.getElementById('uf-id').value.trim(),originalUsername=document.getElementById('uf-original-username').value.trim(),username=document.getElementById('uf-username').value.trim(),newPassword=document.getElementById('uf-newpass').value,role=document.getElementById('uf-role').value;
      if(!username){App.ui.toast('กรุณากรอก username','error');return;}
      if(role==='guest'&&username.toLowerCase()!=='guest'){App.ui.toast('บัญชี guest ต้องใช้ username เป็น guest เท่านั้น','warn');return;}
      if(newPassword&&newPassword.length<4){App.ui.toast('รหัสผ่านต้องมีอย่างน้อย 4 ตัว','error');return;}
      var data={id:id,username:username,originalUsername:originalUsername,role:role};if(newPassword)data.newPassword=newPassword;
      App.u.btnAction({
        debounceKey:'saveuser',debounceMs:2000,
        btnId:'save-user-btn',loadingText:'⏳ กำลังบันทึก...',successText:'บันทึก',
        successMsg:'✅ บันทึกผู้ใช้แล้ว',modalId:'user-modal',modalCloseDelay:600,
        onSuccess:function(){App.admin._invalidateCache('users');App.admin.loadUsers();}
      },function(done){
        App.api.call('updateAdminUser',[data,App.state.adminToken],function(res){
          if(App.admin._auth(res))return;
          done(res);
        });
      });
    },

    // SETTINGS
    loadSettings:function(force){
      var applySettings=function(s){
        App.state._settingsRaw=s||{};
        App.state._deliveryCategoryType=App.admin._normalizeDeliveryType(s.delivery_category_type||'village');
        App.state._deliveryNoteMode=(App.state._deliveryCategoryType==='village'?'address':'note');
        App.state.departments=String(s.departments||'')
          .split(',')
          .map(function(x){return String(x||'').trim();})
          .filter(Boolean);
        var setVal=function(id,v){var el=document.getElementById(id);if(el&&v!==undefined&&v!==null)el.value=String(v);};
        setVal('s-name',s.restaurant_name);setVal('s-logo',s.restaurant_logo);setVal('s-depts',s.departments);
        setVal('s-delivery-type',App.state._deliveryCategoryType);
        setVal('s-delivery-type-select',App.state._deliveryCategoryType);
        setVal('s-pp',s.promptpay);setVal('s-payee',s.payee_name);setVal('s-timeout',s.payment_timeout);
        App.state._promptpayEnabled = String(s.promptpay_enabled ?? '1') === '1'
        App.state._cashPaymentEnabled = String(s.cash_payment_enabled ?? '0') === '1';
        App.state._bankPaymentEnabled = String(s.bank_payment_enabled==null?'1':s.bank_payment_enabled) === '1';
        var ppTog=document.getElementById('s-promptpay-enabled');if(ppTog)ppTog.checked=App.state._promptpayEnabled;
        var cashTog=document.getElementById('s-cash-enabled');if(cashTog)cashTog.checked=App.state._cashPaymentEnabled;
        var bankTog=document.getElementById('s-bank-enabled');if(bankTog)bankTog.checked=App.state._bankPaymentEnabled;
        setVal('s-slipok',s.slipok_api_key);setVal('s-branch',s.slipok_branch_id);setVal('s-drive',App.admin._extractGoogleDriveResourceId(s.drive_folder_id));
        App.customer.applyBrand(s.restaurant_name,s.restaurant_logo);
        App.admin.applyAdminBrand(s.restaurant_name,s.restaurant_logo);
        App.state._storeLogoB64=null;
        App.state._storeLogoSrcUrl=String(s.restaurant_logo||'');
        App.admin.switchStoreLogoTab('url');
        App.admin._renderStoreLogoPreview(String(s.restaurant_logo||''));
        try{App.state._banks=JSON.parse(s.payment_banks||'[]');}catch(_){App.state._banks=[];}
        App.admin.renderBankListAdmin();
        var openRaw=String(s.shop_open==null?'1':s.shop_open).trim().toLowerCase();
        var isOpen=!(openRaw==='0'||openRaw==='false'||openRaw==='off'||openRaw==='no');
        var tog=document.getElementById('shop-open-toggle');if(tog)tog.checked=isOpen;
        App.admin.renderShopStatus(isOpen);
        var range={};try{range=JSON.parse(s.shop_open_range||'{}');}catch(_){range={};}
        setVal('s-open-start',App.admin._toDateTimeLocal(range.start||''));
        setVal('s-open-end',App.admin._toDateTimeLocal(range.end||''));
        // PERF-FIX: users/logs are lazy-loaded on tab open
        App.admin._toggleCustomPaperField('ps-paper','ps-paper-custom-wrap');
        App.admin._toggleCustomPaperField('bp-paper','bp-paper-custom-wrap');
        App.admin._toggleCustomSizeField('ss-size','ss-size-custom-wrap');
        App.admin._toggleCustomSizeField('bs-size','bs-size-custom-wrap');
        App.admin.switchDeliveryType(App.state._deliveryCategoryType);
        App.admin.updateOrderInfoConfigLabels();
        App.customer.applyPaymentMethodUI();
        App.admin.applyRolePermissions();
      };
      var cached=!force?App.admin._getCache('settings',45000):null;
      if(cached){applySettings(cached);return;}
      App.api.call('getSettings',[App.state.adminToken],function(res){
        if(!res||!res.success)return;
        var s=res.data||{};
        App.admin._setCache('settings',s);
        applySettings(s);
      });
    },
    _applyNotificationUi:function(s){
      s=s||{};
      var setVal=function(id,v){var el=document.getElementById(id);if(el)el.value=String(v==null?'':v);};
      var setChecked=function(id,v){var el=document.getElementById(id);if(el)el.checked=String(v||'0')==='1';};
      setChecked('n-line-enabled',s.notification_line_enabled);
      setChecked('n-telegram-enabled',s.notification_telegram_enabled);
      setVal('n-line-token',s.notification_line_channel_access_token_masked||'');
      setVal('n-line-target-type',s.notification_line_target_type||'group');
      setVal('n-line-target-id',s.notification_line_target_id||'');
      setVal('n-telegram-token',s.notification_telegram_bot_token_masked||'');
      setVal('n-telegram-chat-id',s.notification_telegram_chat_id||'');
      App.admin.toggleNotificationChannel('line');
      App.admin.toggleNotificationChannel('telegram');
      App.admin.updateNotificationStatusBadges();
      var ls=document.getElementById('line-test-status');if(ls){ls.textContent='';ls.style.color='';}
      var ts=document.getElementById('telegram-test-status');if(ts){ts.textContent='';ts.style.color='';}
    },
    loadNotifications:function(force){
      var cached=!force?App.admin._getCache('notification_settings',45000):null;
      if(cached){App.admin._applyNotificationUi(cached);return;}
      var localCached=!force?App.admin._getNotificationLocalCache(6*60*1000):null;
      if(localCached){
        // PERF: paint notification form immediately from local cache while background refresh is running
        App.admin._setCache('notification_settings',localCached);
        App.admin._applyNotificationUi(localCached);
      }
      App.api.call('getNotificationSettings',[App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(!res||!res.success)return;
        var s=res.data||{};
        App.admin._setCache('notification_settings',s);
        App.admin._setNotificationLocalCache(s);
        App.admin._applyNotificationUi(s);
      },{silent:true,noLoader:true,key:'notif_settings'});
    },
    toggleNotificationChannel:function(kind){
      var isLine=String(kind||'')==='line';
      var tog=document.getElementById(isLine?'n-line-enabled':'n-telegram-enabled');
      var fields=document.getElementById(isLine?'n-line-fields':'n-telegram-fields');
      if(!tog||!fields)return;
      fields.classList.toggle('is-open',!!tog.checked);
      App.admin.updateNotificationStatusBadges();
    },
    toggleSecretField:function(inputId,btn){
      var el=document.getElementById(inputId);if(!el)return;
      var next=(el.type==='password')?'text':'password';
      el.type=next;
      if(btn)btn.textContent=(next==='password')?'แสดง':'ซ่อน';
    },
    toggleHelp:function(kind){
      var id=(String(kind||'')==='line')?'line-help-panel':'telegram-help-panel';
      var panel=document.getElementById(id);if(!panel)return;
      panel.classList.toggle('hidden');
    },
    openLineSetupGuide:function(){
      var m=document.getElementById('line-setup-modal');
      var intro=document.getElementById('line-guide-intro');
      var steps=document.getElementById('line-guide-steps');
      if(!m||!intro||!steps)return;
      intro.classList.remove('hidden');
      steps.classList.add('hidden');
      m.classList.add('active');
    },
    closeLineSetupGuide:function(){
      var m=document.getElementById('line-setup-modal');
      if(m)m.classList.remove('active');
    },
    lineGuideStartSetup:function(){
      var intro=document.getElementById('line-guide-intro');
      var steps=document.getElementById('line-guide-steps');
      if(intro)intro.classList.add('hidden');
      if(steps)steps.classList.remove('hidden');
      App.admin.lineGuideRestoreState();
      App.admin.lineGuideRestoreChecklist();
    },
    lineGuideToggleStep:function(id){
      var items=document.querySelectorAll('#line-guide-steps .line-guide-item');
      if(!items||!items.length)return;
      var target=document.getElementById(id);
      if(!target)return;
      var willOpen=!target.classList.contains('open');
      items.forEach(function(el){el.classList.remove('open');});
      if(willOpen){
        target.classList.add('open');
        try{localStorage.setItem(App.admin._lineGuideStateKey,JSON.stringify({lastOpen:id,ts:Date.now()}));}catch(_){}
      }else{
        try{localStorage.setItem(App.admin._lineGuideStateKey,JSON.stringify({lastOpen:'',ts:Date.now()}));}catch(_){}
      }
    },
    lineGuideRestoreState:function(){
      var fallback='lg-sec-overview';
      var id=fallback;
      try{
        var raw=localStorage.getItem(App.admin._lineGuideStateKey);
        var parsed=raw?JSON.parse(raw):null;
        if(parsed&&parsed.lastOpen)id=String(parsed.lastOpen);
      }catch(_){}
      var target=document.getElementById(id)||document.getElementById(fallback);
      if(!target)return;
      var items=document.querySelectorAll('#line-guide-steps .line-guide-item');
      items.forEach(function(el){el.classList.remove('open');});
      target.classList.add('open');
      try{target.scrollIntoView({block:'nearest',behavior:'smooth'});}catch(_){}
    },
    lineGuideToggleFaq:function(id){
      var el=document.getElementById(id);
      if(!el)return;
      el.classList.toggle('open');
    },
    lineGuideSaveChecklist:function(){
      try{
        var data={};
        for(var i=1;i<=12;i++){
          var cb=document.getElementById('lgc-'+i);
          data['lgc-'+i]=!!(cb&&cb.checked);
        }
        localStorage.setItem(App.admin._lineGuideChecklistKey,JSON.stringify(data));
      }catch(_){}
    },
    lineGuideRestoreChecklist:function(){
      try{
        var raw=localStorage.getItem(App.admin._lineGuideChecklistKey);
        var data=raw?JSON.parse(raw):{};
        for(var i=1;i<=12;i++){
          var id='lgc-'+i;
          var cb=document.getElementById(id);
          if(cb)cb.checked=!!data[id];
        }
      }catch(_){}
    },
    copyLineGuideWebhookExample:function(){
      var el=document.getElementById('line-webhook-example-url');
      var txt=String((el&&el.textContent)||'').trim();
      if(!txt)return;
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(function(){App.ui.toast('คัดลอก URL ตัวอย่างแล้ว','success');}).catch(function(){App.ui.toast('คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง','warn');});
        return;
      }
      App.ui.toast('คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง','warn');
    },
    _setNotifyStatus:function(id,msg,type){
      var el=document.getElementById(id);if(!el)return;
      var c={success:'#16a34a',error:'#dc2626',info:'var(--text2)'};
      el.textContent=String(msg||'');
      el.style.color=c[type]||c.info;
      el.style.fontWeight=(type==='success'||type==='error')?'700':'500';
    },
    _setChannelBadge:function(id,text,mode){
      var el=document.getElementById(id);if(!el)return;
      el.textContent=String(text||'');
      el.classList.remove('ok','warn','off');
      if(mode)el.classList.add(mode);
    },
    updateNotificationStatusBadges:function(){
      var lineEnabled=!!(document.getElementById('n-line-enabled')&&document.getElementById('n-line-enabled').checked);
      var tgEnabled=!!(document.getElementById('n-telegram-enabled')&&document.getElementById('n-telegram-enabled').checked);
      var lineToken=String((document.getElementById('n-line-token')&&document.getElementById('n-line-token').value)||'').trim();
      var lineTarget=String((document.getElementById('n-line-target-id')&&document.getElementById('n-line-target-id').value)||'').trim();
      var tgToken=String((document.getElementById('n-telegram-token')&&document.getElementById('n-telegram-token').value)||'').trim();
      var tgChat=String((document.getElementById('n-telegram-chat-id')&&document.getElementById('n-telegram-chat-id').value)||'').trim();
      if(!lineEnabled)App.admin._setChannelBadge('line-status-badge','Disabled','off');
      else if(!lineToken)App.admin._setChannelBadge('line-status-badge','Missing token','warn');
      else if(!lineTarget)App.admin._setChannelBadge('line-status-badge','Missing target','warn');
      else App.admin._setChannelBadge('line-status-badge','Ready','ok');
      if(!tgEnabled)App.admin._setChannelBadge('telegram-status-badge','Disabled','off');
      else if(!tgToken)App.admin._setChannelBadge('telegram-status-badge','Missing token','warn');
      else if(!tgChat)App.admin._setChannelBadge('telegram-status-badge','Missing chat','warn');
      else App.admin._setChannelBadge('telegram-status-badge','Ready','ok');
    },
    _validateNotificationData:function(data,opts){
      opts=opts||{};
      var only=String(opts.only||'').toLowerCase();
      var checkLine=(only!=='telegram');
      var checkTelegram=(only!=='line');
      var lineTargetType=String(data.notification_line_target_type||'group').toLowerCase();
      var lineTarget=String(data.notification_line_target_id||'').trim();
      var lineToken=String(data.notification_line_channel_access_token||'').trim();
      var tgToken=String(data.notification_telegram_bot_token||'').trim();
      var tgChat=String(data.notification_telegram_chat_id||'').trim();
      if(checkLine&&data.notification_line_enabled==='1'){
        if(!lineToken)return 'กรุณากรอก LINE Channel Access Token';
        if(!lineTarget)return 'กรุณากรอก LINE Target ID';
        if(lineTargetType==='user'&&lineTarget.charAt(0)!=='U')return 'LINE User ID ควรขึ้นต้นด้วย U';
        if(lineTargetType==='group'&&lineTarget.charAt(0)!=='C')return 'LINE Group ID ควรขึ้นต้นด้วย C';
      }
      if(checkTelegram&&data.notification_telegram_enabled==='1'){
        if(!tgToken)return 'กรุณากรอก Telegram Bot Token';
        if(!tgChat)return 'กรุณากรอก Telegram Chat ID';
        if(!/^-?\d+$/.test(tgChat))return 'Telegram Chat ID ต้องเป็นตัวเลข เช่น 123456 หรือ -1001234567890';
      }
      return '';
    },
    _collectNotificationData:function(){
      var gv=function(id){var el=document.getElementById(id);return el?String(el.value||'').trim():'';};
      var gc=function(id){var el=document.getElementById(id);return !!(el&&el.checked);};
      return{
        notification_line_enabled:gc('n-line-enabled')?'1':'0',
        notification_line_channel_access_token:gv('n-line-token'),
        notification_line_target_type:gv('n-line-target-type')||'group',
        notification_line_target_id:gv('n-line-target-id'),
        notification_telegram_enabled:gc('n-telegram-enabled')?'1':'0',
        notification_telegram_bot_token:gv('n-telegram-token'),
        notification_telegram_chat_id:gv('n-telegram-chat-id')
      };
    },
    saveNotificationSettings:function(){
      if(!App.admin.ensureCanEdit())return;
      var data=App.admin._collectNotificationData();
      var errMsg=App.admin._validateNotificationData(data,{forTest:false});
      if(errMsg){App.ui.toast(errMsg,'error');return;}
      App.u.btnAction({
        debounceKey:'save_notify_settings',debounceMs:1800,
        btnId:'save-notification-btn',loadingText:'⏳ กำลังบันทึก...',successText:'บันทึกการตั้งค่าแจ้งเตือน',
        successMsg:'✅ บันทึกการตั้งค่าแจ้งเตือนแล้ว',
        onSuccess:function(){App.admin._invalidateCache('notification_settings');App.admin._clearNotificationLocalCache();App.admin.loadNotifications(true);}
      },function(done){
        App.api.call('saveNotificationSettings',[data,App.state.adminToken],function(res){
          if(App.admin._auth(res))return;
          done(res);
        });
      });
    },
    testLineNotification:function(){
      if(!App.admin.ensureCanEdit())return;
      var data=App.admin._collectNotificationData();
      data.notification_line_enabled='1';
      var em=App.admin._validateNotificationData(data,{forTest:true,only:'line'});
      if(em){App.admin._setNotifyStatus('line-test-status','❌ '+em,'error');return;}
      App.admin._setNotifyStatus('line-test-status','กำลังทดสอบส่ง LINE...','info');
      var btn=document.getElementById('btn-test-line-notify');
      if(btn)App.ui.setBtn(btn,true,'⏳ กำลังส่ง...');
      App.api.call('testLineNotification',[data,App.state.adminToken],function(res){
        if(btn)App.ui.setBtn(btn,false,'ทดสอบส่ง LINE');
        if(App.admin._auth(res))return;
        if(res&&res.success){
          App.admin._setNotifyStatus('line-test-status','✅ '+String((res.data&&res.data.message)||'ส่งแจ้งเตือน LINE สำเร็จ'),'success');
          return;
        }
        App.admin._setNotifyStatus('line-test-status','❌ '+String((res&&res.message)||'ส่งแจ้งเตือนไม่สำเร็จ'),'error');
      },{silent:true});
    },
    testTelegramNotification:function(){
      if(!App.admin.ensureCanEdit())return;
      var data=App.admin._collectNotificationData();
      data.notification_telegram_enabled='1';
      var em=App.admin._validateNotificationData(data,{forTest:true,only:'telegram'});
      if(em){App.admin._setNotifyStatus('telegram-test-status','❌ '+em,'error');return;}
      App.admin._setNotifyStatus('telegram-test-status','กำลังทดสอบส่ง Telegram...','info');
      var btn=document.getElementById('btn-test-telegram-notify');
      if(btn)App.ui.setBtn(btn,true,'⏳ กำลังส่ง...');
      App.api.call('testTelegramNotification',[data,App.state.adminToken],function(res){
        if(btn)App.ui.setBtn(btn,false,'ทดสอบส่ง Telegram');
        if(App.admin._auth(res))return;
        if(res&&res.success){
          App.admin._setNotifyStatus('telegram-test-status','✅ '+String((res.data&&res.data.message)||'ส่งแจ้งเตือน Telegram สำเร็จ'),'success');
          return;
        }
        App.admin._setNotifyStatus('telegram-test-status','❌ '+String((res&&res.message)||'ส่งแจ้งเตือนไม่สำเร็จ'),'error');
      },{silent:true});
    },
    fetchLatestLineGroupId:function(){
      if(!App.admin.ensureCanEdit())return;
      var btn=document.getElementById('btn-fetch-line-group-id');
      if(btn)App.ui.setBtn(btn,true,'⏳ กำลังดึง...');
      App.api.call('getLatestLineWebhookIds',[App.state.adminToken],function(res){
        if(btn)App.ui.setBtn(btn,false,'ดึง Group ID ล่าสุด');
        if(App.admin._auth(res))return;
        if(!res||!res.success){
          App.admin._setNotifyStatus('line-test-status','❌ '+String((res&&res.message)||'ไม่พบ Group ID ล่าสุด'),'error');
          return;
        }
        var d=res.data||{};
        var gid=String(d.notification_line_last_group_id||'').trim();
        if(!gid){
          App.admin._setNotifyStatus('line-test-status','❌ ยังไม่พบ Group ID ล่าสุด กรุณาเพิ่ม LINE OA เข้ากลุ่มและพิมพ์ข้อความ 1 ครั้ง','error');
          return;
        }
        var tEl=document.getElementById('n-line-target-id');
        var ttEl=document.getElementById('n-line-target-type');
        if(tEl)tEl.value=gid;
        if(ttEl)ttEl.value='group';
        App.admin.updateNotificationStatusBadges();
        App.admin._setNotifyStatus('line-test-status','✅ ดึง Group ID ล่าสุดสำเร็จและเติม Target ID แล้ว','success');
      },{silent:true});
    },
    loadActivityLogs:function(force){
      var cached=!force?App.admin._getCache('logs',15000):null;
      if(cached){
        App.admin._renderActivityLogs(cached);
        return;
      }
      App.api.call('getActivityLogs',[App.state.adminToken,300],function(res){
        if(App.admin._auth(res))return;
        var logs=(res&&res.success&&Array.isArray(res.data))?res.data:[];
        App.admin._setCache('logs',logs);
        App.admin._renderActivityLogs(logs);
      },{key:'activity_logs',loaderText:'กำลังโหลด Activity Logs...',silent:true,noLoader:true});
    },
    _renderActivityLogs:function(logs){
      var tb=document.getElementById('activity-log-table');if(!tb)return;
      if(!logs||!logs.length){tb.innerHTML='<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--text2)">ยังไม่มีข้อมูล</td></tr>';return;}
      var e=App.u.esc;
      tb.innerHTML=logs.map(function(x){
        var dt=x&&x.created_at?new Date(x.created_at):null;
        var dtx=(dt&&!isNaN(dt.getTime()))?dt.toLocaleString('th-TH'):'-';
        var actor=String(x&&x.actor||'-');
        var msg=String(x&&x.message||'').replace(/\[[^\]]*\]\s*/g,'').trim();
        var detail=msg||'-';
        return '<tr>'
          +'<td>'+e(dtx)+'</td>'
          +'<td>'+e(actor)+'</td>'
          +'<td>'+e(detail)+'</td>'
        +'</tr>';
      }).join('');
    },
    _setApiCheckStatus:function(elId,msg,type){
      var el=document.getElementById(elId);if(!el)return;
      var colorMap={success:'#16a34a',error:'#dc2626',info:'var(--text2)'};
      el.textContent=String(msg||'');
      el.style.color=colorMap[type]||colorMap.info;
      el.style.fontWeight=(type==='success'||type==='error')?'700':'500';
    },
    _showDriveEditorReminder:function(){
      App.ui.confirm('กรุณาตั้งค่าการแชร์โฟลเดอร์ Google Drive เป็น "เอดิเตอร์"',function(){},{
        okText:'ตกลง',
        hideCancel:true,
        disableBackdropClose:true
      });
    },
    testSlipOKConnection:function(){
      if(!App.admin.ensureCanManageUsersApi())return;
      var keyEl=document.getElementById('s-slipok'),branchEl=document.getElementById('s-branch');
      var apiKey=keyEl?String(keyEl.value||'').trim():'';
      var branchId=branchEl?String(branchEl.value||'').trim():'';
      App.admin._setApiCheckStatus('api-slipok-status','กำลังตรวจสอบ SlipOK API...','info');
      var btn=document.getElementById('btn-test-slipok');
      if(btn)App.ui.setBtn(btn,true,'⏳ กำลังตรวจสอบ...');
      App.api.call('testSlipOKConnection',[{apiKey:apiKey,branchId:branchId},App.state.adminToken],function(res){
        if(btn)App.ui.setBtn(btn,false,'ตรวจสอบ SlipOK API');
        if(App.admin._auth(res))return;
        if(res&&res.success){
          var m=(res.data&&res.data.message)||'เชื่อมต่อ SlipOK API สำเร็จ';
          App.admin._setApiCheckStatus('api-slipok-status','✅ '+m,'success');
          return;
        }
        App.admin._setApiCheckStatus('api-slipok-status','❌ '+String((res&&res.message)||'ตรวจสอบไม่สำเร็จ'),'error');
      },{silent:true});
    },
    testGoogleDriveConnection:function(){
      if(!App.admin.ensureCanManageUsersApi())return;
      var driveEl=document.getElementById('s-drive');
      var folderId=driveEl?App.admin._normalizeGoogleDriveFolderInput(driveEl):'';
      App.admin._setApiCheckStatus('api-drive-status','กำลังตรวจสอบ Google Drive...','info');
      var btn=document.getElementById('btn-test-drive');
      if(btn)App.ui.setBtn(btn,true,'⏳ กำลังตรวจสอบ...');
      App.api.call('testGoogleDriveConnection',[{folderId:folderId},App.state.adminToken],function(res){
        if(btn)App.ui.setBtn(btn,false,'ตรวจสอบ Google Drive');
        if(App.admin._auth(res))return;
        if(res&&res.success){
          var data=res.data||{};
          var m=data.message||'เชื่อมต่อ Google Drive สำเร็จ';
          App.admin._setApiCheckStatus('api-drive-status','✅ '+m,'success');
          App.admin._showDriveEditorReminder();
          return;
        }
        App.admin._setApiCheckStatus('api-drive-status','❌ '+String((res&&res.message)||'ตรวจสอบไม่สำเร็จ'),'error');
        App.admin._showDriveEditorReminder();
      },{silent:true});
    },
    saveSettings(){
      if(!App.admin.ensureCanEdit())return;
      var getVal=function(id){var el=document.getElementById(id);return el?el.value:'';};
      var openStart=getVal('s-open-start'),openEnd=getVal('s-open-end');
      if((openStart&&!openEnd)||(!openStart&&openEnd)){App.ui.toast('กรุณาระบุช่วงเวลาเปิดให้ครบทั้งเริ่มและสิ้นสุด','error');return;}
      if(openStart&&openEnd&&new Date(openStart)>new Date(openEnd)){App.ui.toast('วันเวลาเริ่มต้องไม่มากกว่าวันเวลาสิ้นสุด','error');return;}
      var promptpayEnabled=!!(document.getElementById('s-promptpay-enabled')&&document.getElementById('s-promptpay-enabled').checked);
      var cashEnabled=!!(document.getElementById('s-cash-enabled')&&document.getElementById('s-cash-enabled').checked);
      var bankEnabled=!!(document.getElementById('s-bank-enabled')&&document.getElementById('s-bank-enabled').checked);
      var promptpayNumber=App.u.digitsOnly(getVal('s-pp')||'');
      if(!promptpayEnabled&&!cashEnabled&&!bankEnabled){App.ui.toast('ต้องเปิดใช้งานการชำระเงินอย่างน้อย 1 วิธี','error');return;}
      if(promptpayEnabled&&!promptpayNumber){App.ui.toast('หากเปิดใช้ PromptPay กรุณากรอกเลข PromptPay','error');return;}
      if(promptpayEnabled&&!App.u.isValidPromptPayId(promptpayNumber)){App.ui.toast('เลข PromptPay ต้องเป็นมือถือ 10 หลัก หรือบัตรประชาชน 13 หลัก','error');return;}
      var promptpayEl=document.getElementById('s-pp');if(promptpayEl)promptpayEl.value=promptpayNumber;
      var logoVal=App.state._storeLogoB64||getVal('s-logo');
      var deliveryType=getVal('s-delivery-type-select')||getVal('s-delivery-type')||'village';
      var deliveryNoteMode=(String(deliveryType)==='village'?'address':'note');
      var driveEl=document.getElementById('s-drive');
      var driveFolderId=driveEl?App.admin._normalizeGoogleDriveFolderInput(driveEl):'';
      var data={restaurant_name:getVal('s-name'),restaurant_logo:logoVal,departments:getVal('s-depts'),delivery_category_type:deliveryType,delivery_note_mode:deliveryNoteMode,promptpay:promptpayNumber,promptpay_enabled:promptpayEnabled?'1':'0',payee_name:getVal('s-payee'),payment_timeout:getVal('s-timeout'),cash_payment_enabled:cashEnabled?'1':'0',bank_payment_enabled:bankEnabled?'1':'0',slipok_api_key:getVal('s-slipok'),slipok_branch_id:getVal('s-branch'),drive_folder_id:driveFolderId,payment_banks:JSON.stringify(App.state._banks)};
      if(App.admin.isStaff()){
        var raw=App.state._settingsRaw||{};
        data.slipok_api_key=String(raw.slipok_api_key||'');
        data.slipok_branch_id=String(raw.slipok_branch_id||'');
        data.drive_folder_id=String(raw.drive_folder_id||'');
      }
      data.shop_open_range=JSON.stringify({start:openStart||'',end:openEnd||''});
      data.shop_open=document.getElementById('shop-open-toggle')&&document.getElementById('shop-open-toggle').checked?'1':'0';
      App.u.btnAction({
        debounceKey:'savesettings',debounceMs:2000,
        btnId:'save-settings-btn',loadingText:'⏳ กำลังบันทึก...',successText:'บันทึกการตั้งค่า',
        successMsg:'✅ บันทึกการตั้งค่าแล้ว',
        onSuccess:function(){App.state._menuLoaded=false;App.admin._invalidateCache(['settings','menu']);App.admin.loadSettings(true);}
      },function(done){
        var commitSave=function(finalLogo){
          data.restaurant_logo=finalLogo;
          App.api.call('saveSettings',[data,App.state.adminToken],function(res){
            if(App.admin._auth(res))return;
            if(res&&res.success){
              App.state._storeLogoB64=null;
              App.state._storeLogoSrcUrl=String(finalLogo||'');
            }
            done(res);
          });
        };
        var logoRaw=String(logoVal||'');
        var isDataLogo=(logoRaw.indexOf('data:image')===0);
        if(!isDataLogo){
          commitSave(logoRaw);
          return;
        }
        var mimeType=logoRaw.split(';')[0].split(':')[1]||'image/jpeg';
        var rawB64=logoRaw.split(',')[1]||'';
        if(!rawB64){
          done({success:false,message:'ข้อมูลโลโก้ไม่ถูกต้อง กรุณาเลือกไฟล์ใหม่'});
          return;
        }
        App.ui.toast('⏳ กำลังอัปโหลดโลโก้ร้าน...','info');
        App.api.call('uploadImageToDrive',[rawB64,'logo_'+Date.now()+'.jpg',mimeType,App.state.adminToken],function(upRes){
          if(upRes&&upRes.success&&upRes.data&&upRes.data.url){
            commitSave(String(upRes.data.url||''));
            return;
          }
          done(upRes||{success:false,message:'อัปโหลดโลโก้ไม่สำเร็จ'});
        },{key:'logo_upload'});
      });
    },
    saveShopAvailability:function(opts){
      opts=opts||{};
      if(App.admin.isReadOnly()){
        if(!res||!res.success){App.ui.toast((res&&res.message)||'ยืนยันรับเงินสดไม่สำเร็จ','warn');return;}
        return;
      }
      var getVal=function(id){var el=document.getElementById(id);return el?el.value:'';};
      var openStart=getVal('s-open-start'),openEnd=getVal('s-open-end');
      var hasPartialRange=(openStart&&!openEnd)||(!openStart&&openEnd);
      if(hasPartialRange){
        if(opts.allowPartialRange){
          openStart='';openEnd='';
          var st=document.getElementById('s-open-start'),en=document.getElementById('s-open-end');
          if(st)st.value='';if(en)en.value='';
        }else{
          if(!opts.silent)App.ui.toast('กรุณาระบุช่วงเวลาเปิดให้ครบทั้งเริ่มและสิ้นสุด','error');
          if(typeof opts.onFail==='function')opts.onFail();
          return;
        }
      }
      if(openStart&&openEnd&&new Date(openStart)>new Date(openEnd)){
        if(!opts.silent)App.ui.toast('วันเวลาเริ่มต้องไม่มากกว่าวันเวลาสิ้นสุด','error');
        if(typeof opts.onFail==='function')opts.onFail();
        return;
      }
      var data={
        shop_open_range:JSON.stringify({start:openStart||'',end:openEnd||''}),
        shop_open:document.getElementById('shop-open-toggle')&&document.getElementById('shop-open-toggle').checked?'1':'0'
      };
      App.api.call('saveSettings',[data,App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(!res||!res.success){
          if(typeof opts.onFail==='function')opts.onFail();
          if(!opts.silent)App.ui.toast((res&&res.message)||'อัปเดตสถานะร้านไม่สำเร็จ','error');
          return;
        }
        App.admin._invalidateCache('settings');
        if(!opts.silent)App.ui.toast('อัปเดตสถานะร้านแล้ว','success');
      },{silent:!!opts.silent});
    },
    onShopToggleChanged:function(checked){
      // เปลี่ยนเฉพาะสถานะในฟอร์มก่อน และจะบันทึกจริงเมื่อกดปุ่ม "บันทึกการตั้งค่า"
      App.admin.renderShopStatus(checked);
    },

    // BANK MANAGEMENT
    _toDateTimeLocal:function(v){
      if(!v)return'';
      var d=new Date(v);if(isNaN(d.getTime()))return'';
      var y=d.getFullYear();
      var m=String(d.getMonth()+1).padStart(2,'0');
      var dd=String(d.getDate()).padStart(2,'0');
      var hh=String(d.getHours()).padStart(2,'0');
      var mm=String(d.getMinutes()).padStart(2,'0');
      return y+'-'+m+'-'+dd+'T'+hh+':'+mm;
    },
    _updateBrandPreview(val){
      var logoEl=document.getElementById('s-logo');
      var logo=App.state._storeLogoB64||(logoEl?logoEl.value:'');
      App.customer.applyBrand(val||'FoodOrder',logo);
      App.admin.applyAdminBrand(val||'FoodOrder',logo);
    },
    _updateBrandLogoPreview:function(val){
      var nameEl=document.getElementById('s-name');
      App.customer.applyBrand(nameEl?nameEl.value:'FoodOrder',val||'');
      App.admin.applyAdminBrand(nameEl?nameEl.value:'FoodOrder',val||'');
    },
    switchStoreLogoTab:function(tab){
      var tu=document.getElementById('sl-tab-url'),tf=document.getElementById('sl-tab-file');
      var pu=document.getElementById('sl-panel-url'),pf=document.getElementById('sl-panel-file');
      if(tu)tu.classList.toggle('active',tab==='url');
      if(tf)tf.classList.toggle('active',tab==='file');
      if(pu)pu.style.display=tab==='url'?'':'none';
      if(pf)pf.style.display=tab==='file'?'':'none';
    },
    _renderStoreLogoPreview:function(src){
      var wrap=document.getElementById('sl-preview-final'),img=document.getElementById('sl-preview-img');
      if(!wrap||!img){return;}
      var s=String(src||'').trim();
      if(!s){wrap.style.display='none';img.src='';return;}
      img.src=s;
      img.onerror=function(){wrap.style.display='none';};
      img.onload=function(){wrap.style.display='';};
    },
    previewStoreLogoUrl:function(url){
      App.state._storeLogoB64=null;
      App.state._storeLogoSrcUrl=String(url||'').trim();
      App.admin._renderStoreLogoPreview(App.state._storeLogoSrcUrl);
      var nameEl=document.getElementById('s-name');
      App.customer.applyBrand(nameEl?nameEl.value:'FoodOrder',App.state._storeLogoSrcUrl);
      App.admin.applyAdminBrand(nameEl?nameEl.value:'FoodOrder',App.state._storeLogoSrcUrl);
    },
    onStoreLogoFileSelected:function(ev){
      var file=ev.target.files&&ev.target.files[0];if(!file)return;
      var reader=new FileReader();
      reader.onload=function(e){
        var src=e.target.result||'';
        App.u.optimizeDataImage(String(src),{maxSide:320,quality:0.82,mimeType:'image/jpeg',forceSquare:true},function(out){
          var finalSrc=String(out||src||'');
          App.state._storeLogoB64=finalSrc;
          App.state._storeLogoSrcUrl=finalSrc;
          App.admin._renderStoreLogoPreview(finalSrc);
          var nameEl=document.getElementById('s-name');
          App.customer.applyBrand(nameEl?nameEl.value:'FoodOrder',finalSrc);
          App.admin.applyAdminBrand(nameEl?nameEl.value:'FoodOrder',finalSrc);
        });
      };
      reader.readAsDataURL(file);
      ev.target.value='';
    },
    openStoreLogoCrop:function(){
      var src=App.state._storeLogoB64||App.state._storeLogoSrcUrl||String((document.getElementById('s-logo')&&document.getElementById('s-logo').value)||'');
      if(!src){App.ui.toast('ยังไม่มีรูปโลโก้ให้ครอบ','warn');return;}
      App.state._cropSrcUrl=src;App.state._cropTarget='storelogo';App.state._cropSourceType='file';
      App.admin.openCrop('storelogo');
    },
    clearStoreLogo:function(){
      App.state._storeLogoB64=null;App.state._storeLogoSrcUrl='';
      var el=document.getElementById('s-logo');if(el)el.value='';
      var fi=document.getElementById('s-logo-file');if(fi)fi.value='';
      App.admin._renderStoreLogoPreview('');
      var nameEl=document.getElementById('s-name');
      App.customer.applyBrand(nameEl?nameEl.value:'FoodOrder','');
      App.admin.applyAdminBrand(nameEl?nameEl.value:'FoodOrder','');
    },
    renderShopStatus(isOpen){var el=document.getElementById('shop-status-text');if(el)el.textContent=isOpen?'🟢 ร้านเปิดอยู่':'🔴 ร้านปิด';},
    _bankIconHtml:function(info,size){
      size=size||20;
      var e=App.u.esc;
      var short=String((info&&info.short)||'BK').slice(0,3).toUpperCase();
      var bg=String((info&&info.color)||'#334155');
      return '<span style="display:inline-flex;align-items:center;justify-content:center;width:'+size+'px;height:'+size+'px;border-radius:6px;background:'+e(bg)+';color:#fff;font-size:'+Math.max(9,Math.round(size*0.42))+'px;font-weight:700">'+e(short)+'</span>';
    },

    renderBankListAdmin(){
      var wrap=document.getElementById('bank-list-admin');if(!wrap)return;
      var banks=App.state._banks||[];
      if(!banks.length){wrap.innerHTML='<p class="text-sm text-muted">ยังไม่มีบัญชีธนาคาร</p>';return;}
      var e=App.u.esc;
      wrap.innerHTML=banks.map(function(b,i){
        var bInfo=BANK_LIST.find(function(x){return x.code===b.code;})||{short:'BK',name:b.bankName,logo:'',color:'#334155'};
        var logoHtml=App.admin._bankIconHtml(bInfo,20);
        return'<div class="bank-item-admin"><span style="margin-right:6px;display:inline-flex;align-items:center">'+logoHtml+'</span><span>'+e(bInfo.name)+' &nbsp;<strong>'+e(b.acct)+'</strong>&nbsp; ('+e(b.name)+')</span><div style="display:flex;gap:6px;margin-left:auto"><button class="btn btn-secondary" style="padding:5px 10px;font-size:12px;width:auto" onclick="App.admin.editBank('+i+')">แก้ไข</button><button class="btn" style="padding:5px 10px;font-size:12px;width:auto;background:var(--primary-light);color:var(--primary)" onclick="App.admin.delBank('+i+')">ลบ</button></div></div>';
      }).join('');
    },
    addBankSlide(){App.admin.openBankModal(-1,null);},
    editBank(idx){App.admin.openBankModal(idx,App.state._banks[idx]);},
    delBank(idx){if(!App.admin.ensureCanEdit())return;App.ui.confirm('ยืนยันลบบัญชีนี้?',function(ok){if(!ok)return;App.state._banks.splice(idx,1);App.admin.renderBankListAdmin();});},
    openBankModal(idx,bank){
      document.getElementById('bank-modal-title').textContent=idx<0?'เพิ่มบัญชีธนาคาร':'แก้ไขบัญชีธนาคาร';
      document.getElementById('bf-idx').value=idx;
      document.getElementById('bf-acct').value=bank?bank.acct:'';
      document.getElementById('bf-name').value=bank?bank.name:'';
      document.getElementById('bf-bank-code').value=bank?bank.code:'';
      document.getElementById('bf-bank-name').value=bank?bank.bankName:'';
      // render bank selector
      var sel=document.getElementById('bank-selector');
      sel.innerHTML=BANK_LIST.map(function(b){
        var logoHtml2=App.admin._bankIconHtml(b,26);
        return'<button class="bank-btn'+(bank&&bank.code===b.code?' selected':'')+'\" onclick=\"App.admin.selectBank(\''+b.code+'\',\''+b.name+'\',this)\"><span style="display:block;margin:0 auto 4px;width:26px;height:26px">'+logoHtml2+'</span>'+b.short+'</button>';
      }).join('');
      document.getElementById('bank-modal').classList.add('active');
    },
    selectBank(code,name,btn){
      document.getElementById('bf-bank-code').value=code;document.getElementById('bf-bank-name').value=name;
      document.querySelectorAll('#bank-selector .bank-btn').forEach(function(b){b.classList.remove('selected');});btn.classList.add('selected');
    },
    saveBank(){
      if(!App.admin.ensureCanEdit())return;
      var idx=parseInt(document.getElementById('bf-idx').value);
      var code=document.getElementById('bf-bank-code').value,bankName=document.getElementById('bf-bank-name').value;
      var acct=document.getElementById('bf-acct').value.trim(),name=document.getElementById('bf-name').value.trim();
      if(!code){App.ui.toast('กรุณาเลือกธนาคาร','error');return;}if(!acct){App.ui.toast('กรุณากรอกเลขบัญชี','error');return;}if(!name){App.ui.toast('กรุณากรอกชื่อบัญชี','error');return;}
      var bank={code:code,bankName:bankName,acct:acct,name:name};
      if(idx<0)App.state._banks.push(bank);else App.state._banks[idx]=bank;
      document.getElementById('bank-modal').classList.remove('active');App.admin.renderBankListAdmin();
    },

    // ─── ORDERS PAGE ──────────────────────────────────────────
    _ordersData:[],_ordersFilter:'all',_ordersFilterDept:'all',_ordersFilterDate:'all',_ordersDateFrom:'',_ordersDateTo:'',_ordersAutoTimer:null,_ordersRetry:0,_ordersSearch:'',_ordersSearchTimer:null,_ordersFp:'',_ordersViewCache:{key:'',data:null},_ordersDeptSig:'',_ordersPollingBusy:false,_ordersRefreshBusy:false,_ordersSoundEnabled:true,_ordersNewFlashIds:{},_datePickerState:{context:'orders',target:'from',month:0,year:0,from:'',to:''},
    _syncOrdersSoundToggle:function(){
      try{
        var raw=localStorage.getItem('fo_admin_new_order_sound_v1');
        App.admin._ordersSoundEnabled=(raw===null)?true:(String(raw)==='1');
      }catch(_){
        App.admin._ordersSoundEnabled=true;
      }
      var tg=document.getElementById('orders-sound-toggle');
      if(tg)tg.checked=!!App.admin._ordersSoundEnabled;
    },
    toggleOrdersSound:function(enabled){
      App.admin._ordersSoundEnabled=!!enabled;
      try{localStorage.setItem('fo_admin_new_order_sound_v1',App.admin._ordersSoundEnabled?'1':'0');}catch(_){}
      App.ui.toast(App.admin._ordersSoundEnabled?'เปิดเสียงแจ้งเตือนแล้ว':'ปิดเสียงแจ้งเตือนแล้ว','info');
    },
    _playNewOrderSound:function(){
      if(!App.admin._ordersSoundEnabled)return;
      try{
        var Ctx=window.AudioContext||window.webkitAudioContext;
        if(!Ctx)return;
        if(!App.admin._audioCtx)App.admin._audioCtx=new Ctx();
        var ctx=App.admin._audioCtx;
        var now=ctx.currentTime;
        var o1=ctx.createOscillator(),g1=ctx.createGain();
        o1.type='sine';o1.frequency.value=880;
        g1.gain.setValueAtTime(0.0001,now);
        g1.gain.exponentialRampToValueAtTime(0.07,now+0.02);
        g1.gain.exponentialRampToValueAtTime(0.0001,now+0.18);
        o1.connect(g1);g1.connect(ctx.destination);o1.start(now);o1.stop(now+0.18);
      }catch(_){}
    },
    _ordersFingerprint:function(list){
      var arr=Array.isArray(list)?list:[];
      return arr.map(function(o){
        return [
          String(o&&o.id||''),
          String(o&&o.status||''),
          String(parseFloat(o&&o.total||0)),
          String(o&&o.created_at||''),
          String(parseInt(o&&o.printed_count||0,10)||0),
          String(o&&o.printed_at||'')
        ].join('|');
      }).join('||');
    },
    _inferItemCategory:function(it){
      var cat=String(it&&it.category||'');
      if(cat)return cat;
      var n=String(it&&it.name||'');
      return (n.indexOf('น้ำ')>-1||n.indexOf('ชา')>-1||n.indexOf('กาแฟ')>-1||n.indexOf('เครื่องดื่ม')>-1)?'เครื่องดื่ม':'อาหาร';
    },
    _prepareOrdersMeta:function(list){
      (Array.isArray(list)?list:[]).forEach(function(o){
        var created=String(o&&o.created_at||'');
        if(o.__createdRaw!==created){
          o.__createdRaw=created;
          o.__ts=Date.parse(created)||0;
          o.__timeLabel=o.__ts?new Date(o.__ts).toLocaleString('th-TH',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}):'?';
        }
        if(o.__searchRaw!==String(o&&o.id||'')+'|'+String(o&&o.customer||'')+'|'+String(o&&o.department||'')){
          var id=String(o&&o.id||'');
          var cust=String(o&&o.customer||'');
          var dept=String(o&&o.department||'');
          o.__searchRaw=id+'|'+cust+'|'+dept;
          o.__idlc=id.toLowerCase();
          o.__custlc=cust.toLowerCase();
          o.__deptlc=dept.toLowerCase();
          o.__idtail=o.__idlc.slice(-8);
          o.__idshort=id.slice(-6);
        }
      });
    },
    _getOrdersView:function(opts){
      opts=opts||{};
      var ignoreDept=!!opts.ignoreDept;
      var source=(Array.isArray(opts.source)?opts.source:App.admin._ordersData||[]);
      var dateRange=App.admin._ordersFilterDate||'all';
      var dateFrom=String(App.admin._ordersDateFrom||'');
      var dateTo=String(App.admin._ordersDateTo||'');
      var deptFilter=App.admin._ordersFilterDept||'all';
      var filter=App.admin._ordersFilter||'all';
      var sq=(App.admin._ordersSearch||'').trim().toLowerCase();
      var cacheKey=[
        App.admin._ordersFp||'',
        String(source.length),
        String(dateRange),
        dateFrom,
        dateTo,
        ignoreDept?'*':String(deptFilter),
        String(filter),
        sq
      ].join('::');
      if(App.admin._ordersViewCache&&App.admin._ordersViewCache.key===cacheKey&&App.admin._ordersViewCache.data){
        return App.admin._ordersViewCache.data;
      }
      App.admin._prepareOrdersMeta(source);
      var sorted=source.slice().sort(function(a,b){return (b.__ts||0)-(a.__ts||0);});
      var dateFiltered=sorted;
      if(dateRange!=='all'){
        if(dateRange==='custom'){
          var fromMs=0,toMs=0;
          if(dateFrom){
            var fd=new Date(dateFrom);
            fd.setHours(0,0,0,0);
            fromMs=fd.getTime();
          }
          if(dateTo){
            var td=new Date(dateTo);
            td.setHours(23,59,59,999);
            toMs=td.getTime();
          }
          dateFiltered=sorted.filter(function(o){
            var ts=(o.__ts||0);
            if(fromMs&&ts<fromMs)return false;
            if(toMs&&ts>toMs)return false;
            return true;
          });
        }else{
          var days=parseInt(dateRange,10)||1;
          var cutoff=new Date();
          cutoff.setHours(0,0,0,0);
          if(days>1)cutoff.setDate(cutoff.getDate()-(days-1));
          var cutoffMs=cutoff.getTime();
          dateFiltered=sorted.filter(function(o){return (o.__ts||0)>=cutoffMs;});
        }
      }
      var deptFiltered;
      if(ignoreDept||deptFilter==='all')deptFiltered=dateFiltered;
      else deptFiltered=dateFiltered.filter(function(o){return String(o.department||'').trim()===deptFilter;});
      var catFiltered;
      if(filter==='all')catFiltered=deptFiltered;
      else{
        catFiltered=deptFiltered.filter(function(o){
          return (o.items||[]).some(function(it){
            var cat=App.admin._inferItemCategory(it);
            return cat===filter;
          });
        });
      }
      var filtered;
      if(!sq)filtered=catFiltered;
      else{
        filtered=catFiltered.filter(function(o){
          return (o.__idlc||'').indexOf(sq)>-1||(o.__custlc||'').indexOf(sq)>-1||(o.__deptlc||'').indexOf(sq)>-1||(o.__idtail||'').indexOf(sq)>-1;
        });
      }
      var view={sorted:sorted,dateFiltered:dateFiltered,deptFiltered:deptFiltered,catFiltered:catFiltered,filtered:filtered};
      App.admin._ordersViewCache={key:cacheKey,data:view};
      return view;
    },
    refreshOrdersManual:function(){
      if(App.admin._ordersRefreshBusy){
        App.ui.toast('กำลังรีเฟรชออเดอร์อยู่...','info');
        return;
      }
      App.ui.toast('กำลังรีเฟรชออเดอร์...','info');
      App.admin._refreshOrdersAfterMutation({manual:true});
    },
    notifyOrdersChanged:function(reason){
      App.admin._refreshOrdersAfterMutation({manual:true,reason:reason||''});
    },    _refreshOrdersAfterMutation:function(opts){
      opts=opts||{};
      // force invalidate local cache view so next call always pulls latest from server
      App.admin._ordersViewCache={key:'',data:null};
      App.admin._ordersDeptSig='';
      App.admin._ordersFp='';
      App.admin._ordersVersion='';
      App.admin._ordersRefreshBusy=false;
      App.admin.loadOrders(true);
      // Apps Script/Sheet write latency can make first read stale; pull once more shortly after
      
      if(opts.manual){
        App.ui.toast('อัพเดทการรับเงินสดแล้ว','success');
      }
    },
    loadOrders:function(force){
      App.admin._syncOrdersSoundToggle();
      if(!force&&(!Array.isArray(App.admin._ordersData)||!App.admin._ordersData.length)){
        var cachedOrders=App.admin._getCache('orders_list',15000);
        if(Array.isArray(cachedOrders)&&cachedOrders.length){
          App.admin._ordersData=cachedOrders.slice();
        }
      }
      var hasLocalCache=!force&&Array.isArray(App.admin._ordersData)&&App.admin._ordersData.length>0;
      if(hasLocalCache){
        App.admin._renderOrders(App.admin._ordersData);
        App.admin._startOrdersAutoRefresh();
        App.admin._silentRefreshOrders();
        return;
      }
      App.admin._ordersRetry=App.admin._ordersRetry||0;
      var reqFilters=force?{_force:Date.now(),lite:true,page:1,pageSize:40}:{lite:true,page:1,pageSize:40};
      var lEl=document.getElementById('orders-loading'),eEl=document.getElementById('orders-error'),emEl=document.getElementById('orders-empty'),db=document.getElementById('orders-dashboard'),cc=document.getElementById('orders-cards');
      if(lEl)lEl.classList.remove('hidden');if(eEl)eEl.classList.add('hidden');if(emEl)emEl.classList.add('hidden');if(db)db.classList.add('hidden');if(cc)cc.innerHTML='';
      var tOut=setTimeout(function(){
        if(lEl&&!lEl.classList.contains('hidden')){
          if(App.admin._ordersRetry<2){App.admin._ordersRetry++;App.admin.loadOrders(force);}
          else{App.admin._ordersRetry=0;App.admin._showOrdersError('โหลดไม่สำเร็จ (timeout)');}
        }
      },8000);
      App.api.call('getOrders',[reqFilters,App.state.adminToken],function(res){
          clearTimeout(tOut);App.admin._ordersRetry=0;
          // res=null หมายถึง GAS function threw/returned undefined — retry
          if(res===null||res===undefined){
            if(App.admin._ordersRetry<2){App.admin._ordersRetry++;setTimeout(function(){App.admin.loadOrders(force);},1500);return;}
            App.admin._ordersRetry=0;App.admin._showOrdersError('โหลดข้อมูลไม่ได้ กรุณารีเฟรช');return;
          }
          if(!res.success){App.admin._showOrdersError(res.message||'เกิดข้อผิดพลาด');return;}
          var payload=res.data||[];
          App.admin._ordersData=Array.isArray(payload)?payload:(Array.isArray(payload.items)?payload.items:[]);
          App.admin._setCache('orders_list',App.admin._ordersData.slice());
          App.admin._prepareOrdersMeta(App.admin._ordersData);
          App.admin._ordersFp=App.admin._ordersFingerprint(App.admin._ordersData);
          App.admin._ordersViewCache={key:'',data:null};
          App.admin._ordersDeptSig='';
          // set version baseline จากจำนวน + created_at ล่าสุด
          var d0=App.admin._ordersData;
          App.admin._ordersVersion=String(d0.length)+'_'+(d0.length?String(d0[0].created_at||''):'');
          App.admin._renderOrders(App.admin._ordersData);App.admin._startOrdersAutoRefresh();
      },{silent:true,noLoader:true});
    },
    _showOrdersError:function(msg){
      var lEl=document.getElementById('orders-loading'),eEl=document.getElementById('orders-error'),em=document.getElementById('orders-error-msg');
      if(lEl)lEl.classList.add('hidden');if(eEl)eEl.classList.remove('hidden');if(em)em.textContent=msg;
    },
    _ordersVersion:'',
    _stopOrdersAutoRefresh:function(){
      if(App.admin._ordersAutoTimer){clearInterval(App.admin._ordersAutoTimer);App.admin._ordersAutoTimer=null;}
      App.admin._ordersPollingBusy=false;
      App.admin._ordersRefreshBusy=false;
      var b=document.getElementById('orders-auto-badge');if(b)b.classList.add('hidden');
    },
    _startOrdersAutoRefresh:function(){
      App.admin._stopOrdersAutoRefresh();
      var badge=document.getElementById('orders-auto-badge');if(badge)badge.classList.remove('hidden');
      // PERF: poll ทุก 12 วินาที เพื่อความลื่น + ลดโหลดระบบ
      App.admin._ordersAutoTimer=setInterval(function(){
        if(document.hidden)return;
        var pg=document.getElementById('apg-orders');
        if(!pg||!pg.classList.contains('active')){
          App.admin._stopOrdersAutoRefresh();return;
        }
        if(App.admin._ordersPollingBusy)return;
        App.admin._ordersPollingBusy=true;
        App.api.silent('getOrdersVersion',[App.state.adminToken],function(res){
            App.admin._ordersPollingBusy=false;
            if(!res||!res.success)return;
            var newV=String((res.data&&res.data.version)||'');
            if(newV&&newV!==App.admin._ordersVersion){
              App.admin._ordersVersion=newV;
              App.admin._silentRefreshOrders();
            }
          });
      },15000);
      // เมื่อ tab กลับมา focus ให้ poll ทันทีโดยไม่รอรอบถัดไป
      if(!App.admin._visibilityHandler){
        App.admin._visibilityHandler=function(){
          if(document.hidden)return;
          var pg=document.getElementById('apg-orders');
          if(!pg||!pg.classList.contains('active'))return;
          if(App.admin._ordersPollingBusy)return;
          App.admin._ordersPollingBusy=true;
          App.api.silent('getOrdersVersion',[App.state.adminToken],function(res){
              App.admin._ordersPollingBusy=false;
              if(!res||!res.success)return;
              var newV=String((res.data&&res.data.version)||'');
              if(newV&&newV!==App.admin._ordersVersion){App.admin._ordersVersion=newV;App.admin._silentRefreshOrders();}
            });
        };
        document.addEventListener('visibilitychange',App.admin._visibilityHandler);
      }
    },
    // fetch ข้อมูลใหม่โดยไม่ clear UI (ไม่กระพริบ)
    _silentRefreshOrders:function(opts){
      opts=opts||{};
      if(App.admin._ordersRefreshBusy)return;
      App.admin._ordersRefreshBusy=true;
      var reqFilters=opts.force?{_force:Date.now(),lite:true,page:1,pageSize:40}:{lite:true,page:1,pageSize:40};
      App.api.call('getOrders',[reqFilters,App.state.adminToken],function(res){
          App.admin._ordersRefreshBusy=false;
          if(!res||!res.success){
            if(opts.manual)App.ui.toast((res&&res.message)||'รีเฟรชข้อมูลไม่สำเร็จ','warn');
            return;
          }
          var payload=res.data||[];
          var newData=Array.isArray(payload)?payload:(Array.isArray(payload.items)?payload.items:[]);
          var newFp=App.admin._ordersFingerprint(newData);
          if(newFp!==App.admin._ordersFp){
            var oldIdsMap={};
            (App.admin._ordersData||[]).forEach(function(o){oldIdsMap[String(o.id||'')]=1;});
            var newIds=[];
            newData.forEach(function(o){
              var oid=String(o&&o.id||'');
              if(oid&&!oldIdsMap[oid])newIds.push(oid);
            });
            var hasNew=newIds.length>0;
            App.admin._prepareOrdersMeta(newData);
            App.admin._ordersData=newData;
            App.admin._setCache('orders_list',newData.slice());
            App.admin._ordersFp=newFp;
            App.admin._ordersViewCache={key:'',data:null};
            App.admin._ordersDeptSig='';
            if(hasNew){
              var nowTs=Date.now();
              newIds.forEach(function(id){App.admin._ordersNewFlashIds[id]=nowTs;});
            }
            App.admin._renderOrders(newData);
            if(hasNew){
        App.ui.toast('อัพเดทการรับเงินสดแล้ว','success');
              App.admin._playNewOrderSound();
            }
        App.ui.toast('อัพเดทการรับเงินสดแล้ว','success');
          }else if(opts.manual){
            App.ui.toast('ข้อมูลเป็นล่าสุดแล้ว','info');
          }
        },{silent:true,noLoader:true});
    },
    filterOrders:function(filter,btn){
      App.admin._ordersFilter=filter;
      App.admin._ordersPage=0;
      document.querySelectorAll('#orders-filter-row .filter-chip').forEach(function(c){c.classList.remove('active');});
      if(btn)btn.classList.add('active');
      App.admin._renderOrders(App.admin._ordersData);
    },
    filterDept:function(dept,btn){
      App.admin._ordersFilterDept=dept;
      App.admin._ordersPage=0;
      document.querySelectorAll('#orders-dept-row .filter-chip').forEach(function(c){c.classList.remove('active');});
      if(btn)btn.classList.add('active');
      App.admin._renderOrders(App.admin._ordersData);
    },
    _isYmd:function(v){
      return /^\d{4}-\d{2}-\d{2}$/.test(String(v||'').trim());
    },
    _ymdToDate:function(v){
      var s=String(v||'').trim();
      if(!App.admin._isYmd(s))return null;
      var p=s.split('-');
      var y=parseInt(p[0],10),m=parseInt(p[1],10)-1,d=parseInt(p[2],10);
      var dt=new Date(y,m,d);
      if(isNaN(dt.getTime()))return null;
      return dt;
    },
    _dateToYmd:function(dt){
      if(!(dt instanceof Date)||isNaN(dt.getTime()))return '';
      var y=dt.getFullYear();
      var m=String(dt.getMonth()+1).padStart(2,'0');
      var d=String(dt.getDate()).padStart(2,'0');
      return y+'-'+m+'-'+d;
    },
    _fmtYmdThai:function(v){
      var dt=App.admin._ymdToDate(v);
      if(!dt)return '-';
      return dt.toLocaleDateString('th-TH',{day:'2-digit',month:'short',year:'numeric'});
    },
    _syncDateInputs:function(context){
      if(context==='orders'){
        var of=document.getElementById('orders-date-from');
        var ot=document.getElementById('orders-date-to');
        if(of)of.value=String(App.admin._ordersDateFrom||'');
        if(ot)ot.value=String(App.admin._ordersDateTo||'');
      }else{
        var bf=document.getElementById('bp-date-from');
        var bt=document.getElementById('bp-date-to');
        if(bf&&bf.value==null)bf.value='';
        if(bt&&bt.value==null)bt.value='';
      }
    },
    openDatePickerPopup:function(context,target){
      var ctx=(context==='batch')?'batch':'orders';
      var tg=(target==='to')?'to':'from';
      var st=App.admin._datePickerState||{};
      st.context=ctx;
      st.target=tg;
      if(ctx==='orders'){
        st.from=String(App.admin._ordersDateFrom||'').trim();
        st.to=String(App.admin._ordersDateTo||'').trim();
      }else{
        var bf=document.getElementById('bp-date-from');
        var bt=document.getElementById('bp-date-to');
        st.from=String(bf&&bf.value||'').trim();
        st.to=String(bt&&bt.value||'').trim();
      }
      var base=App.admin._ymdToDate(st[tg])||App.admin._ymdToDate(st.from)||App.admin._ymdToDate(st.to)||new Date();
      st.month=base.getMonth();
      st.year=base.getFullYear();
      App.admin._datePickerState=st;
      var pop=document.getElementById('date-picker-popup');
      if(pop)pop.classList.add('active');
      App.admin.setDatePickerTarget(tg);
      App.admin._renderDatePickerPopup();
    },
    closeDatePickerPopup:function(){
      var pop=document.getElementById('date-picker-popup');
      if(pop)pop.classList.remove('active');
    },
    setDatePickerTarget:function(target){
      var st=App.admin._datePickerState||{};
      st.target=(target==='to')?'to':'from';
      App.admin._datePickerState=st;
      var f=document.getElementById('dp-tab-from');
      var t=document.getElementById('dp-tab-to');
      if(f)f.classList.toggle('active',st.target==='from');
      if(t)t.classList.toggle('active',st.target==='to');
      App.admin._renderDatePickerPopup();
    },
    shiftDatePickerMonth:function(delta){
      var st=App.admin._datePickerState||{};
      var y=parseInt(st.year||new Date().getFullYear(),10);
      var m=parseInt(st.month||new Date().getMonth(),10);
      var d=parseInt(delta||0,10)||0;
      m+=d;
      while(m<0){m+=12;y--;}
      while(m>11){m-=12;y++;}
      st.year=y;st.month=m;
      App.admin._datePickerState=st;
      App.admin._renderDatePickerPopup();
    },
    _pickDateFromPopup:function(ymd){
      var st=App.admin._datePickerState||{};
      if(!App.admin._isYmd(ymd))return;
      if(st.target==='to')st.to=ymd;
      else st.from=ymd;
      if(st.from&&st.to&&st.from>st.to){
        if(st.target==='from')st.to=st.from;
        else st.from=st.to;
      }
      App.admin._datePickerState=st;
      App.admin._renderDatePickerPopup();
    },
    quickPickDateRange:function(type){
      var st=App.admin._datePickerState||{};
      var now=new Date();
      now.setHours(0,0,0,0);
      if(type==='clear'){
        st.from='';st.to='';
      }else if(type==='today'){
        var t=App.admin._dateToYmd(now);
        st.from=t;st.to=t;
      }else{
        var d=parseInt(type,10)||7;
        var from=new Date(now.getTime());
        from.setDate(from.getDate()-(d-1));
        st.from=App.admin._dateToYmd(from);
        st.to=App.admin._dateToYmd(now);
      }
      App.admin._datePickerState=st;
      App.admin._renderDatePickerPopup();
    },
    _renderDatePickerPopup:function(){
      var st=App.admin._datePickerState||{};
      var month=parseInt(st.month||new Date().getMonth(),10);
      var year=parseInt(st.year||new Date().getFullYear(),10);
      var from=String(st.from||'');
      var to=String(st.to||'');
      var label=document.getElementById('dp-month-label');
      if(label){
        var md=new Date(year,month,1);
        label.textContent=md.toLocaleDateString('th-TH',{month:'long',year:'numeric'});
      }
      var fv=document.getElementById('dp-from-val');
      var tv=document.getElementById('dp-to-val');
      if(fv)fv.textContent=App.admin._fmtYmdThai(from);
      if(tv)tv.textContent=App.admin._fmtYmdThai(to);
      var grid=document.getElementById('dp-grid');
      if(!grid)return;
      var first=new Date(year,month,1);
      var firstDay=first.getDay();
      var daysInMonth=new Date(year,month+1,0).getDate();
      var prevDays=new Date(year,month,0).getDate();
      var html='';
      for(var i=0;i<42;i++){
        var dNum=i-firstDay+1;
        var inMonth=dNum>=1&&dNum<=daysInMonth;
        var dDate;
        if(inMonth)dDate=new Date(year,month,dNum);
        else if(dNum<1)dDate=new Date(year,month-1,prevDays+dNum);
        else dDate=new Date(year,month+1,dNum-daysInMonth);
        var ymd=App.admin._dateToYmd(dDate);
        var cls='date-day'+(inMonth?'':' muted');
        if((from&&ymd===from)||(to&&ymd===to))cls+=' selected';
        else if(from&&to&&ymd>from&&ymd<to)cls+=' in-range';
        html+='<button class="'+cls+'" onclick="App.admin._pickDateFromPopup(\''+ymd+'\')">'+dDate.getDate()+'</button>';
      }
      grid.innerHTML=html;
    },
    applyDatePickerPopup:function(){
      var st=App.admin._datePickerState||{};
      var ctx=st.context==='batch'?'batch':'orders';
      var from=String(st.from||'').trim();
      var to=String(st.to||'').trim();
      if(from&&to&&from>to){
        App.ui.toast('วันที่เริ่มต้องไม่มากกว่าวันที่สิ้นสุด','warn');
        return;
      }
      if(ctx==='orders'){
        App.admin._ordersDateFrom=from;
        App.admin._ordersDateTo=to;
        App.admin._syncDateInputs('orders');
        App.admin.applyOrdersDateRange();
      }else{
        var bf=document.getElementById('bp-date-from');
        var bt=document.getElementById('bp-date-to');
        if(bf)bf.value=from;
        if(bt)bt.value=to;
        App.admin.onBatchDateCalendarChange();
      }
      App.admin.closeDatePickerPopup();
    },
    filterDateRange:function(range,btn){
      App.admin._ordersFilterDate=range;
      if(range!=='custom'){
        App.admin._ordersDateFrom='';
        App.admin._ordersDateTo='';
        var fromEl=document.getElementById('orders-date-from');if(fromEl)fromEl.value='';
        var toEl=document.getElementById('orders-date-to');if(toEl)toEl.value='';
      }
      App.admin._ordersPage=0;
      document.querySelectorAll('#orders-date-row .filter-chip').forEach(function(c){c.classList.remove('active');});
      if(btn)btn.classList.add('active');
      App.admin._renderOrders(App.admin._ordersData);
    },
    onOrdersDateRangeChange:function(){
      var fromEl=document.getElementById('orders-date-from');
      var toEl=document.getElementById('orders-date-to');
      var fromVal=String(fromEl&&fromEl.value||'').trim();
      var toVal=String(toEl&&toEl.value||'').trim();
      App.admin._ordersDateFrom=fromVal;
      App.admin._ordersDateTo=toVal;
      if(fromVal||toVal){
        App.admin._ordersFilterDate='custom';
        document.querySelectorAll('#orders-date-row .filter-chip').forEach(function(c){c.classList.remove('active');});
      }
    },
    applyOrdersDateRange:function(){
      App.admin.onOrdersDateRangeChange();
      if(App.admin._ordersDateFrom&&App.admin._ordersDateTo&&App.admin._ordersDateFrom>App.admin._ordersDateTo){
        App.ui.toast('วันที่เริ่มต้องไม่มากกว่าวันที่สิ้นสุด','warn');
        return;
      }
      App.admin._ordersPage=0;
      App.admin._renderOrders(App.admin._ordersData);
    },
    clearOrdersDateRange:function(){
      App.admin._ordersDateFrom='';
      App.admin._ordersDateTo='';
      var fromEl=document.getElementById('orders-date-from');if(fromEl)fromEl.value='';
      var toEl=document.getElementById('orders-date-to');if(toEl)toEl.value='';
      var allBtn=document.querySelector('#orders-date-row .filter-chip[data-daterange=\"all\"]');
      App.admin.filterDateRange('all',allBtn||null);
    },
    _statusUi:function(status,order){
      var s=String(status||'').toLowerCase();
      var o=order||{};
      var payStatus=String(o.payment_status||'').toLowerCase();
      if(s==='cancelled')return{label:'ยกเลิก',cls:'badge-cancelled',accept:false};
      if(s==='paid'||s==='pending')return{label:'ออเดอร์ใหม่',cls:'badge-new-blink',accept:true};
      if(payStatus==='cash'||payStatus==='paid'||payStatus==='completed')return{label:'รับเงินแล้ว',cls:'badge-done',accept:false};
      return{label:'รับออเดอร์แล้ว',cls:'badge-cooking',accept:false};
    },    _countNewOrders:function(){
      return (App.admin._ordersData||[]).filter(function(o){
        var st=String(o&&o.status||'').trim().toLowerCase();
        return st==='paid'||st==='pending';
      }).length;
    },
    _updateAcceptAllBtnLabel:function(){
      var btn=document.getElementById('accept-all-new-btn');
      if(!btn)return;
      var n=App.admin._countNewOrders();
      btn.textContent='✅ รับออเดอร์ทั้งหมด ('+n+')';
    },
    _canConfirmCashOrder:function(o){
      if(!o)return false;
      var methodRaw=String(o.payment_method||'').trim();
      var method=methodRaw.toLowerCase();
      var payStatus=String(o.payment_status||'').toLowerCase();
      var st=String(o.status||'').toLowerCase();
      var isCash=(method==='cash'||method==='cod'||method==='ปลายทาง'||methodRaw.indexOf('เก็บเงินปลายทาง')>-1);
      var isPaidCash=(payStatus==='cash'||payStatus==='paid'||payStatus==='completed');
      return isCash&&!isPaidCash&&st!=='cancelled';
    },
    confirmCashPayment:function(orderId){
      if(!App.admin.ensureCanEdit())return;
      if(!orderId)return;
      App.api.call('confirmCashPayment',[orderId,App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(!res||!res.success){App.ui.toast((res&&res.message)||'ยืนยันรับเงินสดไม่สำเร็จ','warn');return;}
        var all=App.admin._ordersData||[];
        var it=all.find(function(x){return String(x.id)===String(orderId);});
        if(it){it.payment_method='cash';it.payment_status='cash';if(String(it.status||'').toLowerCase()==='paid')it.status='done';}
        App.admin._ordersFp=App.admin._ordersFingerprint(all);
        App.admin._ordersViewCache={key:'',data:null};
        App.admin._ordersDeptSig='';
        App.admin._renderOrders(all);
        App.admin._refreshOrdersAfterMutation({manual:true});
        App.ui.toast('อัพเดทการรับเงินสดแล้ว','success');
      },{key:'cash_confirm_'+orderId});
    },
    acceptOrder:function(orderId){
      if(!App.admin.ensureCanEdit())return;
      if(!orderId)return;
      App.api.call('updateOrderStatus',[orderId,'cooking',App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(!res||!res.success){App.ui.toast((res&&res.message)||'รับออเดอร์ไม่สำเร็จ','warn');return;}
        var all=App.admin._ordersData||[];
        var it=all.find(function(x){return String(x.id)===String(orderId);});
        if(it)it.status='cooking';
        App.admin._ordersFp=App.admin._ordersFingerprint(all);
        App.admin._ordersViewCache={key:'',data:null};
        App.admin._ordersDeptSig='';
        App.admin._renderOrders(all);
        App.admin._updateAcceptAllBtnLabel();
      },{key:'accept_'+orderId});
    },
    markOrderDone:function(orderId){
      if(!App.admin.ensureCanEdit())return;
      if(!orderId)return;
      App.api.call('updateOrderStatus',[orderId,'done',App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(!res||!res.success){App.ui.toast((res&&res.message)||'อัปเดตสถานะไม่สำเร็จ','warn');return;}
        var all=App.admin._ordersData||[];
        var it=all.find(function(x){return String(x.id)===String(orderId);});
        if(it)it.status='done';
        App.admin._ordersFp=App.admin._ordersFingerprint(all);
        App.admin._ordersViewCache={key:'',data:null};
        App.admin._ordersDeptSig='';
        App.admin._renderOrders(all);
        App.ui.toast('อัปเดตเป็นงานเสร็จแล้ว','success');
      },{key:'done_'+orderId});
    },
    cancelOrder:function(orderId){
      if(!App.admin.ensureCanEdit())return;
      if(!orderId)return;
      App.ui.confirm('ยืนยันยกเลิกออเดอร์นี้?',function(ok){
        if(!ok)return;
        App.api.call('updateOrderStatus',[orderId,'cancelled',App.state.adminToken],function(res){
          if(App.admin._auth(res))return;
          if(!res||!res.success){App.ui.toast((res&&res.message)||'ยกเลิกออเดอร์ไม่สำเร็จ','warn');return;}
          var all=App.admin._ordersData||[];
          var it=all.find(function(x){return String(x.id)===String(orderId);});
          if(it)it.status='cancelled';
          App.admin._ordersFp=App.admin._ordersFingerprint(all);
          App.admin._ordersViewCache={key:'',data:null};
          App.admin._ordersDeptSig='';
          App.admin._renderOrders(all);
          App.admin._updateAcceptAllBtnLabel();
          App.ui.toast('ยกเลิกออเดอร์แล้ว','success');
        },{key:'cancel_'+orderId});
      });
    },
    acceptAllNewOrders:function(){
      if(!App.admin.ensureCanEdit())return;
      if(App.u.debounce('accept_all_new',1200))return;
      var rows=(App.admin._ordersData||[]);
      var targets=rows.filter(function(o){var st=String(o.status||'').trim().toLowerCase();return st==='paid'||st==='pending';});
      var btn=document.getElementById('accept-all-new-btn');
      var ids=targets.map(function(o){return String(o.id||'');}).filter(Boolean);
      App.ui.setBtn(btn,true,'กำลังรับออเดอร์...');
      App.api.call('bulkAcceptOrders',[ids,App.state.adminToken],function(res){
        App.ui.setBtn(btn,false,'✅ รับออเดอร์ทั้งหมด');
        if(App.admin._auth(res))return;
        if(!res||!res.success){
          App.ui.toast((res&&res.message)||'รับออเดอร์ทั้งหมดไม่สำเร็จ','warn');
          App.admin._updateAcceptAllBtnLabel();
          return;
        }
        var acceptedIds=(res.data&&Array.isArray(res.data.ids))?res.data.ids:[];
        var map={};acceptedIds.forEach(function(id){map[String(id)]=1;});
        (App.admin._ordersData||[]).forEach(function(o){
          if(map[String(o.id||'')])o.status='cooking';
        });
        App.admin._ordersFp=App.admin._ordersFingerprint(App.admin._ordersData||[]);
        App.admin._ordersViewCache={key:'',data:null};
        App.admin._ordersDeptSig='';
        App.admin._renderOrders(App.admin._ordersData);
        App.admin._updateAcceptAllBtnLabel();
        var okCount=parseInt(res.data&&res.data.accepted||acceptedIds.length)||acceptedIds.length;
        var fail=parseInt(res.data&&res.data.skipped||0)||0;
        if(fail>0)App.ui.toast('รับออเดอร์แล้ว '+okCount+' รายการ, ข้าม '+fail+' รายการ','warn');
        else App.ui.toast('รับออเดอร์ทั้งหมดสำเร็จ '+okCount+' รายการ','success');
      },{key:'bulk_accept_all',loaderText:'กำลังรับออเดอร์ทั้งหมด...'});
    },
    _buildDeptChips:function(orders){
      var row=document.getElementById('orders-dept-row');if(!row)return;
      var depts={};
      (orders||[]).forEach(function(o){var d=String(o.department||'').trim();if(d)depts[d]=(depts[d]||0)+1;});
      var deptList=Object.keys(depts).sort();
      var cur=App.admin._ordersFilterDept||'all';
      var sig=cur+'|'+deptList.map(function(d){return d+':'+depts[d];}).join(',');
      if(sig===App.admin._ordersDeptSig)return;
      App.admin._ordersDeptSig=sig;
      // สร้าง button ด้วย createElement เพื่อหลีกเลี่ยง quote ซ้อน
      row.innerHTML='';
      var makeBtn=function(label,dept,count){
        var btn=document.createElement('button');
        btn.className='filter-chip'+(cur===dept?' active':'');
        btn.setAttribute('data-dept',dept);
        btn.innerHTML=label+(count!==undefined?' <span style="font-size:11px;opacity:.7">'+count+'</span>':'');
        btn.addEventListener('click',function(){App.admin.filterDept(dept,btn);});
        return btn;
      };
      row.appendChild(makeBtn('ทั้งหมด','all'));
      deptList.forEach(function(d){row.appendChild(makeBtn('🏢 '+d,d,depts[d]));});
    },
    _renderNewOrdersDashboard:function(sourceOrders){
      var wrap=document.getElementById('orders-new-dashboard');
      var listEl=document.getElementById('orders-new-list');
      var allBtn=document.getElementById('orders-new-accept-all');
      if(!wrap||!listEl)return;
      var rows=Array.isArray(sourceOrders)?sourceOrders:[];
      var newRows=rows.filter(function(o){return !!(App.admin._statusUi(o&&o.status).accept);});
      if(!newRows.length){
        wrap.classList.add('hidden');
        if(allBtn)allBtn.style.display='none';
        listEl.innerHTML='<div class="orders-new-empty">ตอนนี้ยังไม่มีออเดอร์ใหม่</div>';
        return;
      }
      wrap.classList.remove('hidden');
      if(allBtn){
        allBtn.style.display='';
        allBtn.textContent='✅ รับทั้งหมด ('+newRows.length+')';
      }
      var e=App.u.esc;
      var show=newRows.slice(0,8);
      listEl.innerHTML=show.map(function(o){
        var timeStr=o.__timeLabel||'?';
        var total='฿'+Math.round(parseFloat(o&&o.total||0)).toLocaleString('th-TH');
        return '<div class="orders-new-item">'
          +'<div class="orders-new-meta">'
            +'<strong>'+e(o&&o.customer||'-')+' <span style="color:var(--primary);font-weight:800">'+total+'</span></strong>'
            +'<div class="orders-new-sub">#'+e(String(o&&o.id||''))+' • '+e(timeStr)+'</div>'
          +'</div>'
          +'<button data-admin-only="true" class="btn btn-accept-order" style="width:auto;padding:7px 12px;font-size:12px" onclick="App.admin.acceptOrder(\''+e(String(o&&o.id||''))+'\')">รับออเดอร์</button>'
        +'</div>';
      }).join('');
    },

    _renderOrders:function(allData){
      var lEl=document.getElementById('orders-loading'),eEl=document.getElementById('orders-error');
      if(lEl)lEl.classList.add('hidden');if(eEl)eEl.classList.add('hidden');
      var e=App.u.esc,lu=document.getElementById('orders-last-update');
      if(lu)lu.textContent='อัปเดตล่าสุด: '+new Date().toLocaleTimeString('th-TH');
      var view=App.admin._getOrdersView({source:allData,ignoreDept:false});
      var orders=view.dateFiltered||[];
      var nonCancelledOrders=orders.filter(function(o){return !App.admin._isCancelledOrderStatus(o&&o.status);});
      App.admin._updateAcceptAllBtnLabel();

      // สร้าง dept chips จากข้อมูลจริง
      App.admin._buildDeptChips(orders);
      var filtered=view.filtered||[];
      var sq=(App.admin._ordersSearch||'').trim().toLowerCase();
      // อัปเดต search result badge
      var sInput=document.getElementById('orders-search-input');
      var sClear=document.getElementById('orders-search-clear');
      if(sInput&&sq){if(sClear)sClear.classList.remove('hidden');}
      else{if(sClear)sClear.classList.add('hidden');}
      App.admin._renderNewOrdersDashboard(filtered);

      // ─── Dashboard ───────────────────────────────────────────
      var sumWrap=document.getElementById('orders-summary');
      // คำนวณจาก orders ในช่วงที่เลือก (date filtered)
      var totalRevenue=nonCancelledOrders.reduce(function(s,o){return s+parseFloat(o.total||0);},0);
      var isCashPending=function(o){
        var mRaw=String(o&&o.payment_method||'').trim();
        var m=mRaw.toLowerCase();
        var st=String(o&&o.status||'').trim().toLowerCase();
        var ps=String(o&&o.payment_status||'').trim().toLowerCase();
        var isCash=(m==='cash'||m==='cod'||m==='ปลายทาง'||mRaw.indexOf('เก็บเงินปลายทาง')>-1);
        var isPaid=(ps==='cash'||ps==='paid'||ps==='completed');
        return isCash&&!isPaid&&!App.admin._isCancelledOrderStatus(st);
      };
      var pendingCashFiltered=nonCancelledOrders.filter(isCashPending);
      var pendingCashFilteredAmount=pendingCashFiltered.reduce(function(s,o){return s+parseFloat(o&&o.total||0);},0);
      var allRows=Array.isArray(allData)?allData:(Array.isArray(App.admin._ordersData)?App.admin._ordersData:[]);
      var pendingCashAll=allRows.filter(isCashPending);
      var pendingCashAllAmount=pendingCashAll.reduce(function(s,o){return s+parseFloat(o&&o.total||0);},0);
      var _drLabels={'1':'วันนี้','7':'7 วัน','30':'30 วัน','all':'ทั้งหมด'};
      var _drLabel=_drLabels[App.admin._ordersFilterDate||'all']||'';
      if((App.admin._ordersFilterDate||'all')==='custom'){
        var f=App.admin._ordersDateFrom||'';
        var t=App.admin._ordersDateTo||'';
        if(f&&t)_drLabel=f+' ถึง '+t;
        else if(f)_drLabel='ตั้งแต่ '+f;
        else if(t)_drLabel='ถึง '+t;
        else _drLabel='กำหนดช่วงเอง';
      }
      var kpiRow=document.getElementById('orders-kpi-row');
      if(kpiRow){
        kpiRow.innerHTML=[
          {icon:'📦',label:'ออเดอร์ ('+_drLabel+')',val:nonCancelledOrders.length,color:'var(--primary)',sub:'ไม่รวมรายการที่ยกเลิก'},
          {icon:'💰',label:'ยอดเงิน ('+_drLabel+')',val:'฿'+Math.round(totalRevenue).toLocaleString('th-TH'),color:'var(--green)',sub:'รวมยอดจากออเดอร์ที่ไม่ยกเลิก'},
          {icon:'💵',label:'เงินสดค้างชำระ ('+_drLabel+')',val:'฿'+Math.round(pendingCashFilteredAmount).toLocaleString('th-TH'),color:'#f59e0b',sub:(pendingCashFiltered.length||0)+' รายการ'},
          {icon:'🧾',label:'เงินสดค้างชำระ (ทั้งหมด)',val:'฿'+Math.round(pendingCashAllAmount).toLocaleString('th-TH'),color:'#fb7185',sub:(pendingCashAll.length||0)+' รายการ'}
        ].map(function(k){
          return '<div class="kpi-card orders-kpi-card">'
            +'<div class="orders-kpi-top"><span class="orders-kpi-icon">'+e(k.icon)+'</span><span class="orders-kpi-title">'+e(k.label)+'</span></div>'
            +'<div class="kpi-val orders-kpi-value" style="color:'+k.color+'">'+e(String(k.val))+'</div>'
            +'<div class="orders-kpi-sub">'+e(String(k.sub||''))+'</div>'
          +'</div>';
        }).join('');
      }
      var pendingNamesEl=document.getElementById('orders-cash-pending-names');
      if(!pendingNamesEl&&sumWrap){
        pendingNamesEl=document.createElement('div');
        pendingNamesEl.id='orders-cash-pending-names';
        pendingNamesEl.style.margin='10px 0 12px';
        sumWrap.appendChild(pendingNamesEl);
      }
      if(pendingNamesEl){
        if(!pendingCashAll.length){
          pendingNamesEl.innerHTML='';
        }else{
          var showList=pendingCashAll.slice().sort(function(a,b){
            var ta=Date.parse(String(a&&a.created_at||''))||0;
            var tb=Date.parse(String(b&&b.created_at||''))||0;
            return tb-ta;
          }).slice(0,12);
          pendingNamesEl.innerHTML='<div class="kpi-card orders-kpi-card" style="padding:12px">'
            +'<div class="orders-kpi-top"><span class="orders-kpi-icon">👥</span><span class="orders-kpi-title">รายชื่อค้างชำระเงินสด (ล่าสุด)</span></div>'
            +'<div class="orders-kpi-sub" style="margin-top:6px">แสดง '+showList.length+' จากทั้งหมด '+pendingCashAll.length+' รายการ</div>'
            +'<div style="margin-top:8px;display:grid;gap:6px">'
            +showList.map(function(o){
              var nm=String(o&&o.customer||'ไม่ระบุชื่อ');
              var oid=String(o&&o.id||'-');
              var dep=String(o&&o.department||'');
              var amt='฿'+Math.round(parseFloat(o&&o.total||0)).toLocaleString('th-TH');
              return '<div style="display:flex;justify-content:space-between;gap:8px;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:7px 10px">'
                +'<div style="min-width:0"><strong>'+e(nm)+'</strong> <span style="opacity:.75">#'+e(oid)+'</span>'+(dep?(' <span style="opacity:.75">('+e(dep)+')</span>'):'')+'</div>'
                +'<div style="color:#fb7185;font-weight:800">'+amt+'</div>'
              +'</div>';
            }).join('')
            +'</div>'
          +'</div>';
        }
      }
      var salesEl=document.getElementById('orders-sales-chart');
      if(salesEl){
        var src=(view.sorted||[]);
        var daily=[],maxRev=1;
        var dayIndexMap={};
        var starts=[];
        for(var d=6;d>=0;d--){
          var dayStart=new Date();dayStart.setHours(0,0,0,0);dayStart.setDate(dayStart.getDate()-d);
          var key=dayStart.getFullYear()+'-'+(dayStart.getMonth()+1)+'-'+dayStart.getDate();
          dayIndexMap[key]=starts.length;
          starts.push({dt:dayStart,key:key,label:dayStart.getDate()+'/'+(dayStart.getMonth()+1),rev:0});
        }
        src.forEach(function(o){
          if(String(o.status||'')==='pending')return;
          if(App.admin._isCancelledOrderStatus(o&&o.status))return;
          var ts=o.__ts||0;if(!ts)return;
          var t=new Date(ts);
          t.setHours(0,0,0,0);
          var key=t.getFullYear()+'-'+(t.getMonth()+1)+'-'+t.getDate();
          var idx=dayIndexMap[key];
          if(idx===undefined)return;
          starts[idx].rev+=parseFloat(o.total||0);
        });
        daily=starts.map(function(x){
          maxRev=Math.max(maxRev,x.rev||0);
          return {label:x.label,rev:x.rev||0};
        });
        var w=520,h=120,padX=14,padY=12;
        var stepX=(w-padX*2)/Math.max(1,daily.length-1);
        var points=daily.map(function(it,idx){
          var x=padX+idx*stepX;
          var y=h-padY-((it.rev/maxRev)*(h-padY*2));
          return {x:x,y:y,rev:it.rev,label:it.label};
        });
        var dAttr=points.map(function(p,idx){return(idx?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2);}).join(' ');
        var areaAttr=dAttr+' L '+(w-padX).toFixed(2)+' '+(h-padY).toFixed(2)+' L '+padX.toFixed(2)+' '+(h-padY).toFixed(2)+' Z';
        var grid='';
        var gy=[padY+8,Math.round(h*0.5),h-padY-2];
        gy.forEach(function(y){
          grid+='<line x1="'+padX+'" y1="'+y+'" x2="'+(w-padX)+'" y2="'+y+'" stroke="rgba(148,163,184,.24)" stroke-width="1" stroke-dasharray="3 4"></line>';
        });
        salesEl.innerHTML=''
          +'<svg viewBox="0 0 '+w+' '+h+'" class="orders-sales-svg" preserveAspectRatio="none">'
          +grid
          +'<defs><linearGradient id="salesGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#ef4444" stop-opacity=".42"/><stop offset="100%" stop-color="#ef4444" stop-opacity="0"/></linearGradient></defs>'
          +'<path d="'+areaAttr+'" fill="url(#salesGrad)"></path>'
          +'<path d="'+dAttr+'" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"></path>'
          +points.map(function(p){return'<circle cx="'+p.x.toFixed(2)+'" cy="'+p.y.toFixed(2)+'" r="3.2" fill="#ef4444"></circle>';}).join('')
          +'</svg>'
          +'<div class="orders-sales-labels">'+daily.map(function(it){return'<span>'+it.label+'</span>';}).join('')+'</div>';
      }
      // อันดับเมนู — นับจาก orders ทั้งหมด
      var menuCount={};
      orders.forEach(function(o){
        if(App.admin._isCancelledOrderStatus(o&&o.status))return;
        (o.items||[]).forEach(function(it){
          var n=String(it.name||'').trim();if(!n)return;
          menuCount[n]=(menuCount[n]||0)+parseInt(it.qty||1);
        });
      });
      var ranking=Object.keys(menuCount).map(function(k){return{name:k,count:menuCount[k]};})
        .sort(function(a,b){return b.count-a.count;});
      var rankList=document.getElementById('orders-rank-list');
      if(rankList){
        if(!ranking.length){rankList.innerHTML='<p class="text-sm text-muted" style="padding:8px 0">ยังไม่มีข้อมูล</p>';}
        else{
          var maxC=ranking[0].count||1;
          rankList.innerHTML=ranking.map(function(m,i){
            var pct=Math.round(m.count/maxC*100);
            var medals=['🥇','🥈','🥉'];
            var medal=i<3?medals[i]:'<span class="rank-num">'+(i+1)+'</span>';
            return'<div class="rank-row">'
              +'<div class="rank-medal">'+medal+'</div>'
              +'<div class="rank-name">'+e(m.name)+'</div>'
              +'<div class="rank-bar-wrap"><div class="rank-bar-fill" style="width:'+pct+'%"></div></div>'
              +'<div class="rank-count">'+m.count+' <span class="rank-count-unit">จาน</span></div>'
            +'</div>';
          }).join('');
        }
      }
      if(sumWrap)sumWrap.classList.remove('hidden');
      // ─── Cards + Pagination ───────────────────────────────────
      var cardsWrap=document.getElementById('orders-cards');if(!cardsWrap)return;
      var emEl=document.getElementById('orders-empty');
      if(!filtered.length){if(emEl)emEl.classList.remove('hidden');cardsWrap.innerHTML='';return;}
      if(emEl)emEl.classList.add('hidden');
      var PAGE_SIZE=20;
      var totalPages=Math.ceil(filtered.length/PAGE_SIZE);
      // reset page เมื่อ filter เปลี่ยน (ถ้า page เกิน)
      if(App.admin._ordersPage===undefined)App.admin._ordersPage=0;
      if(App.admin._ordersPage>=totalPages)App.admin._ordersPage=0;
      var page=App.admin._ordersPage;
      var pageItems=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
      var showDeptOnOrderCard=App.admin._getDeliveryCategoryType()==='company';
      var idxMap={};
      (App.admin._ordersData||[]).forEach(function(x,ii){idxMap[String(x&&x.id||'')]=ii;});
      var fmtExtras=function(list){
        if(!list)return [];
        var src=list;
        if(typeof src==='string'){
          var raw=String(src||'').trim();
          if(!raw)return [];
          if((raw.charAt(0)==='['&&raw.charAt(raw.length-1)===']')||(raw.charAt(0)==='{'&&raw.charAt(raw.length-1)==='}')){
            try{
              src=JSON.parse(raw);
            }catch(_){
              src=raw.split(',').map(function(s){return String(s||'').trim();}).filter(Boolean);
            }
          }else{
            src=raw.split(',').map(function(s){return String(s||'').trim();}).filter(Boolean);
          }
        }
        if(!Array.isArray(src)||!src.length)return [];
        var stripMain=function(v){
          var s=String(v||'').trim();
          s=s.replace(/^[^:：]+[:：]\s*/,'').trim();
          return s;
        };
        var arr=src.map(function(opt){
          if(!opt)return '';
          if(typeof opt==='string')return stripMain(opt);
          if(typeof opt==='object')return stripMain(String(opt.label||opt.name||opt.value||''));
          return stripMain(String(opt));
        }).filter(Boolean);
        var map={},out=[];
        arr.forEach(function(x){map[x]=(map[x]||0)+1;});
        Object.keys(map).forEach(function(k){out.push(k+(map[k]>1?' X'+map[k]:''));});
        return out;
      };
      // offset สำหรับหมายเลขลูกค้า
      var numOffset=page*PAGE_SIZE;
      cardsWrap.innerHTML=pageItems.map(function(o,idx){
        var seq=numOffset+idx+1;
        var oidForItems=String(o&&o.id||'').trim();
        var items=Array.isArray(o.items)?o.items:[];
        var pendingItems=!!(oidForItems&&Array.isArray(App.admin._orderItemsPending[oidForItems]));
        if(!items.length&&!o.__itemsFetchDone&&!pendingItems&&oidForItems){
          App.admin._ensureOrderItemsLoaded(o,function(){
            App.admin._ordersViewCache={key:'',data:null};
            if(App.admin._ordersItemsRerenderTimer)clearTimeout(App.admin._ordersItemsRerenderTimer);
            App.admin._ordersItemsRerenderTimer=setTimeout(function(){
              App.admin._ordersItemsRerenderTimer=null;
              App.admin._renderOrders(App.admin._ordersData);
            },60);
          });
          pendingItems=true;
        }
        var st=App.admin._statusUi(o.status,o);
        var isCancelled=String(o&&o.status||'').trim().toLowerCase()==='cancelled';
        var stRaw=String(o&&o.status||'').trim().toLowerCase();
        var canMarkDone=(!isCancelled && stRaw!=='done' && stRaw!=='cancelled' && stRaw!=='pending' && stRaw!=='paid');
        var timeStr=o.__timeLabel||'?';
        var itemsHtml='';
        if(items.length){
          itemsHtml=items.map(function(it){
            var pr=parseFloat(it.price||0),qty=parseInt(it.qty||1);
            var extras=fmtExtras(it.options);
            var extraHtml=extras.length?'<div class="order-row-extras"><span class="order-extra-label">ตัวเสริม</span><span class="order-extra-values">'+extras.map(e).join(', ')+'</span></div>':'';
            return'<div class="order-row-item"><span class="order-item-name">'+e(it.name||'?')+'</span> <strong class="order-item-qty">×'+qty+'</strong>'+(pr>0?' <span class="order-item-price">฿'+Math.round(pr*qty)+'</span>':'')+extraHtml+'</div>';
          }).join('');
        }else if(pendingItems||!o.__itemsFetchDone){
          itemsHtml='<div class="text-xs text-muted" style="padding:2px 0">กำลังโหลดรายการอาหาร...</div>';
        }else{
          itemsHtml='<div class="text-xs text-muted" style="padding:2px 0">ไม่มีรายการอาหาร</div>';
        }
        var oidx=idxMap[String(o&&o.id||'')];
        if(oidx===undefined||oidx===null)oidx=-1;
        var oid=String(o&&o.id||'');
        var isNewGlow=false;
        var glowAt=App.admin._ordersNewFlashIds[oid];
        if(glowAt&&((Date.now()-glowAt)<30000))isNewGlow=true;
        else if(glowAt)delete App.admin._ordersNewFlashIds[oid];
        return'<div class="order-row'+(isNewGlow?' order-row-new':'')+'">'
          +'<div class="order-row-meta">'
            +'<div class="order-seq">#'+seq+'</div>'
            +'<div class="order-row-time">'+timeStr+'</div>'
            +'<div class="order-row-id">'+e(String(o.__idshort||''))+'</div>'
          +'</div>'
          +'<div class="order-row-body">'
            +'<div class="order-row-customer">👤 '+e(o.customer||'?')+((showDeptOnOrderCard&&o.department)?' &nbsp;<span style="font-size:12px;color:var(--text2)">🏢 '+e(o.department)+'</span>':'')+'</div>'
            +'<div class="text-xs" style="margin:4px 0;color:'+(String(o.payment_method||'').toLowerCase()==='cash'?'#b91c1c':'var(--text2)')+';font-weight:'+(String(o.payment_method||'').toLowerCase()==='cash'?'700':'500')+'">💳 '+e(App.admin._payMethodLabel(o.payment_method||''))+'</div>'
            +'<div class="order-row-items">'+itemsHtml+'</div>'
            +(o.note?'<div class="text-xs text-muted" style="margin-top:4px">'+(App.admin._getDeliveryCategoryType()==='village'?'📍 ':'📝 ')+e(o.note)+'</div>':'')
            +(o.customer_note?'<div class="text-xs text-muted" style="margin-top:4px">💬 '+e(App.admin._customerNoteLabel())+': '+e(o.customer_note)+'</div>':'')
          +'</div>'
          +'<div class="order-row-right">'
            +'<span class="badge '+st.cls+'" style="margin-bottom:2px">'+e(st.label)+'</span>'
            +'<div class="order-row-total">฿'+Math.round(parseFloat(o.total||0)).toLocaleString('th-TH')+'</div>'
            +(st.accept?'<button data-admin-only="true" class="btn btn-accept-order" onclick="App.admin.acceptOrder(\''+e(String(o.id||''))+'\')">รับออเดอร์</button>':'')

            +(App.admin._canConfirmCashOrder(o)?'<button data-admin-only="true" class="btn btn-secondary" style="width:auto;padding:4px 10px;font-size:12px;background:#dcfce7;border-color:#22c55e;color:#166534" onclick="App.admin.confirmCashPayment(\''+e(String(o.id||''))+'\')">อัพเดทรับเงินสด</button>':'')
            +(!isCancelled?'<button data-admin-only="true" class="btn btn-secondary" style="width:auto;padding:4px 10px;font-size:12px;background:#fee2e2;border-color:#ef4444;color:#b91c1c" onclick="App.admin.cancelOrder(\''+e(String(o.id||''))+'\')">ยกเลิกออเดอร์</button>':'')
            +(!isCancelled?'<button class="btn-print-order" onclick="App.admin.openPrintModal('+oidx+')" title="พิมพ์ใบเสร็จ/สติ๊กเกอร์">🖨</button>':'')
          +'</div>'
        +'</div>';
      }).join('');
      // ─── Pagination controls ──────────────────────────────────
      var pgWrap=document.getElementById('orders-pagination');
      if(pgWrap){
        if(totalPages<=1){pgWrap.innerHTML='';pgWrap.classList.add('hidden');}
        else{
          pgWrap.classList.remove('hidden');
          var btns='';
          // ปุ่มย้อนกลับ
          btns+='<button class="pg-btn"'+(page===0?' disabled':'')+' onclick="App.admin.goOrdersPage('+(page-1)+')">‹ ก่อนหน้า</button>';
          // page buttons (แสดงสูงสุด 5 ปุ่ม)
          var startP=Math.max(0,page-2),endP=Math.min(totalPages-1,startP+4);
          if(endP-startP<4)startP=Math.max(0,endP-4);
          for(var pi=startP;pi<=endP;pi++){
            btns+='<button class="pg-btn'+(pi===page?' pg-active':'')+'" onclick="App.admin.goOrdersPage('+pi+')">'+(pi+1)+'</button>';
          }
          // ปุ่มหน้าถัดไป
          btns+='<button class="pg-btn"'+(page===totalPages-1?' disabled':'')+' onclick="App.admin.goOrdersPage('+(page+1)+')">ถัดไป ›</button>';
          // แสดงสถิติ
          var from=page*PAGE_SIZE+1,to=Math.min((page+1)*PAGE_SIZE,filtered.length);
          pgWrap.innerHTML='<div class="pg-info">แสดง '+from+'–'+to+' จาก '+filtered.length+' รายการ</div><div class="pg-btns">'+btns+'</div>';
        }
      }
    },
    _ordersPage:0,
    goOrdersPage:function(p){
      App.admin._ordersPage=p;
      window.scrollTo(0,document.getElementById('apg-orders').offsetTop-60);
      App.admin._renderOrders(App.admin._ordersData);
    },

    // ─── ORDER SEARCH ──────────────────────────────────────────
    onOrderSearch:function(val){
      if(App.admin._ordersSearchTimer)clearTimeout(App.admin._ordersSearchTimer);
      App.admin._ordersSearch=val||'';
      App.admin._ordersSearchTimer=setTimeout(function(){
        App.admin._ordersPage=0;
        App.admin._renderOrders(App.admin._ordersData);
      },320);
    },
    clearOrderSearch:function(){
      if(App.admin._ordersSearchTimer){clearTimeout(App.admin._ordersSearchTimer);App.admin._ordersSearchTimer=null;}
      App.admin._ordersSearch='';
      App.admin._ordersPage=0;
      var inp=document.getElementById('orders-search-input');
      if(inp)inp.value='';
      App.admin._renderOrders(App.admin._ordersData);
    },
    _getFilteredOrdersForExport:function(opts){
      opts=opts||{};
      return (App.admin._getOrdersView({ignoreDept:!!opts.ignoreDept}).filtered||[]).slice();
    },
    _csvCell:function(v){
      var s=String(v==null?'':v);
      if(/[",\n\r]/.test(s))return '"'+s.replace(/"/g,'""')+'"';
      return s;
    },
    _payMethodLabel:function(v){
      return String(v||'').toLowerCase()==='cash'?'เก็บเงินปลายทาง':'สแกนจ่าย';
    },
    exportOrdersExcel:function(){
      var rows=App.admin._getFilteredOrdersForExport();
        if(!res||!res.success){App.ui.toast((res&&res.message)||'ยืนยันรับเงินสดไม่สำเร็จ','warn');return;}
      var header=['ลำดับ','รหัสออเดอร์','วันที่เวลา','ชื่อลูกค้า',App.admin._deptLabel(),'รายการอาหาร','ยอดรวม','วิธีชำระเงิน','สถานะ',App.admin._noteLabel(),App.admin._customerNoteLabel()];
      var lines=[header.map(App.admin._csvCell).join(',')];
      rows.forEach(function(o,idx){
        var items=(o.items||[]).map(function(it){
          var qty=parseInt(it.qty||1);
          var nm=String(it.name||'');
          return nm+' x'+qty;
        }).join(' | ');
        var dt=o.created_at?new Date(o.created_at).toLocaleString('th-TH'):'';
        var line=[
          idx+1,
          o.id||'',
          dt,
          o.customer||'',
          o.department||'',
          items,
          Math.round(parseFloat(o.total||0)),
          App.admin._payMethodLabel(o.payment_method||''),
          o.status||'',
          o.note||'',
          o.customer_note||''
        ];
        lines.push(line.map(App.admin._csvCell).join(','));
      });
      var csv='\uFEFF'+lines.join('\n');
      var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
      var ts=new Date();
      var file='orders_export_'+ts.getFullYear()+String(ts.getMonth()+1).padStart(2,'0')+String(ts.getDate()).padStart(2,'0')+'_'+String(ts.getHours()).padStart(2,'0')+String(ts.getMinutes()).padStart(2,'0')+'.csv';
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=file;
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);if(a.parentNode)a.parentNode.removeChild(a);},200);
      App.ui.toast('Export Excel สำเร็จ','success');
    },
    exportOrdersPdf:function(){
      var rows=App.admin._getFilteredOrdersForExport({ignoreDept:true});
        if(!res||!res.success){App.ui.toast((res&&res.message)||'ยืนยันรับเงินสดไม่สำเร็จ','warn');return;}
      App.admin._exportPdfRows=rows;
      var deptWrap=document.getElementById('export-pdf-dept-list');
      var all=document.getElementById('epd-all');
      var deptLabel=App.admin._deptLabel();
      var none='ไม่ระบุ'+deptLabel;
      var set={};rows.forEach(function(o){var d=String(o.department||none).trim()||none;set[d]=1;});
      var depts=Object.keys(set).sort();
      if(deptWrap){
        deptWrap.innerHTML=depts.map(function(d){
          return '<label class="topic-sel-row"><input class="epd-dept" type="checkbox" value="'+App.u.esc(d)+'" checked style="accent-color:var(--primary);width:16px;height:16px;flex-shrink:0;margin-top:2px"><div><div style="font-weight:600;font-size:14px">'+App.u.esc(d)+'</div></div></label>';
        }).join('');
      }
      if(all)all.checked=true;
      var m=document.getElementById('export-pdf-modal');if(m)m.classList.add('active');
    },
    closeExportPdfModal:function(){var m=document.getElementById('export-pdf-modal');if(m)m.classList.remove('active');},
    toggleExportAllDepts:function(checked){
      document.querySelectorAll('#export-pdf-dept-list .epd-dept').forEach(function(cb){cb.checked=!!checked;});
    },
    confirmExportPdf:function(){
      var base=App.admin._exportPdfRows||[];
        if(!res||!res.success){App.ui.toast((res&&res.message)||'ยืนยันรับเงินสดไม่สำเร็จ','warn');return;}
      var selected=[];
      document.querySelectorAll('#export-pdf-dept-list .epd-dept:checked').forEach(function(cb){selected.push(String(cb.value||''));});
      var deptLabel=App.admin._deptLabel();
      var none='ไม่ระบุ'+deptLabel;
      if(!selected.length){App.ui.toast('กรุณาเลือกอย่างน้อย 1 '+deptLabel,'warn');return;}
      var rows=base.filter(function(o){var d=String(o.department||none).trim()||none;return selected.indexOf(d)>-1;});
      if(!rows.length){App.ui.toast('ไม่มีข้อมูลใน'+deptLabel+'ที่เลือก','warn');return;}
      App.admin.closeExportPdfModal();
      App.ui.toast('กำลังสร้างไฟล์ PDF...','info');
      App.api.call('exportOrdersPdfByDepartment',[rows,App.state.adminToken],function(res){
        if(App.admin._auth(res))return;
        if(!res||!res.success||!res.data||!res.data.base64){App.ui.toast((res&&res.message)||'สร้าง PDF ไม่สำเร็จ','warn');return;}
        App.admin._downloadPdfFromBase64(res.data,'orders_by_delivery_group.pdf','Export PDF สำเร็จ');
      });
    },
    _downloadPdfFromBase64:function(data,defaultName,successMsg){
      try{
        var b64=String(data&&data.base64||'');
        var bin=atob(b64),len=bin.length,arr=new Uint8Array(len);
        for(var i=0;i<len;i++)arr[i]=bin.charCodeAt(i);
        var blob=new Blob([arr],{type:'application/pdf'});
        var fileName=String(data&&data.fileName||defaultName||'download.pdf');
        var href=URL.createObjectURL(blob);
        var a=document.createElement('a');
        a.href=href;
        a.download=fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(function(){
          try{URL.revokeObjectURL(href);}catch(_){}
          if(a.parentNode)a.parentNode.removeChild(a);
        },600);
        // Mobile fallback: open PDF viewer directly
        setTimeout(function(){
          try{
            if(/iphone|ipad|android/i.test(navigator.userAgent||''))window.open(href,'_blank');
          }catch(_){}
        },150);
        App.ui.toast(successMsg||'ดาวน์โหลด PDF สำเร็จ','success');
      }catch(e){
        App.ui.toast('ดาวน์โหลด PDF ไม่สำเร็จ','error');
      }
    },

    // ─── SINGLE PRINT ─────────────────────────────────────────
    _printOrderIdx:-1,
    _printTab:'receipt',
    _printPdfNoFrame:false,
    _pdfLockTimer:null,
    _beginPdfLock:function(msg){
      if(App.admin._pdfLockTimer){clearTimeout(App.admin._pdfLockTimer);App.admin._pdfLockTimer=null;}
      App.admin._printingPdfBusy=true;
      App.ui.showLoader(msg||'กำลังสร้างไฟล์ PDF...');
      App.admin._pdfLockTimer=setTimeout(function(){
        App.admin._printingPdfBusy=false;
        App.ui.hideLoader();
        App.ui.toast('งานสร้าง PDF ใช้เวลานานเกินกำหนด ระบบปลดล็อคหน้าจออัตโนมัติ','warn');
      },45000);
    },
    _endPdfLock:function(){
      if(App.admin._pdfLockTimer){clearTimeout(App.admin._pdfLockTimer);App.admin._pdfLockTimer=null;}
      App.admin._printingPdfBusy=false;
      App.ui.hideLoader();
    },
    _orderItemsCache:{},
    _orderItemsPending:{},
    _ensureOrderItemsLoaded:function(order,done){
      if(!order){if(done)done(order);return;}
      var oid=String(order&&order.id||'').trim();
      if(!oid){if(done)done(order);return;}
      if(Array.isArray(order.items)&&order.items.length){
        order.__itemsFetchDone=true;
        if(done)done(order);
        return;
      }
      if(order.__itemsFetchDone&&Array.isArray(order.items)){
        if(done)done(order);
        return;
      }
      var cached=App.admin._orderItemsCache[oid];
      if(Array.isArray(cached)){
        order.items=cached.slice();
        order.__itemsFetchDone=true;
        if(done)done(order);
        return;
      }
      if(Array.isArray(App.admin._orderItemsPending[oid])){
        if(done)App.admin._orderItemsPending[oid].push(done);
        return;
      }
      App.admin._orderItemsPending[oid]=[];
      if(done)App.admin._orderItemsPending[oid].push(done);
      App.api.call('getOrderDetail',[oid,App.state.adminToken],function(res){
        var loadedItems=[];
        if(res&&res.success&&res.data&&Array.isArray(res.data.items)){
          loadedItems=(res.data.items||[]).map(function(it){
            return{
              name:String(it&&it.name||''),
              qty:parseInt(it&&it.qty||1,10)||1,
              price:parseFloat(it&&it.price||0)||0,
              total:parseFloat(it&&it.total||0)||0,
              options:String(it&&it.options||'')
            };
          });
          order.customer=String(res.data.customer||order.customer||'');
          order.department=String(res.data.department||order.department||'');
          order.note=String(res.data.note||order.note||'');
          order.customer_note=String(res.data.customer_note||order.customer_note||'');
          order.subtotal=(res.data.subtotal!=null)?res.data.subtotal:order.subtotal;
          order.discount=(res.data.discount!=null)?res.data.discount:order.discount;
          order.total=(res.data.total!=null)?res.data.total:order.total;
          order.payment_method=String(res.data.payment_method||order.payment_method||'');
          order.created_at=String(res.data.created_at||order.created_at||'');
          order.items=loadedItems.slice();
          App.admin._orderItemsCache[oid]=loadedItems.slice();
          (App.admin._ordersData||[]).forEach(function(orow){
            if(String(orow&&orow.id||'')===oid){
              orow.items=loadedItems.slice();
              orow.__itemsFetchDone=true;
            }
          });
        }
        order.__itemsFetchDone=true;
        var waiters=App.admin._orderItemsPending[oid]||[];
        delete App.admin._orderItemsPending[oid];
        waiters.forEach(function(fn){try{fn(order);}catch(_){}}); 
      },{silent:true,noLoader:true,key:'ord_items_'+oid});
    },
    _ensureOrdersItemsLoaded:function(list,done){
      var arr=Array.isArray(list)?list:[];
      if(!arr.length){if(done)done(arr);return;}
      var need=arr.filter(function(o){
        return !(o&&o.__itemsFetchDone&&Array.isArray(o.items));
      });
      if(!need.length){if(done)done(arr);return;}
      var ids=need.map(function(o){return String(o&&o.id||'').trim();}).filter(Boolean);
      if(!ids.length){if(done)done(arr);return;}
      App.api.call('getOrderDetailsBulk',[ids,App.state.adminToken],function(res){
        if(res&&res.success&&res.data&&Array.isArray(res.data.items)){
          var map={};
          (res.data.items||[]).forEach(function(d){map[String(d&&d.id||'')]=d||{};});
          need.forEach(function(order){
            var oid=String(order&&order.id||'');
            var d=map[oid];
            if(!d)return;
            order.customer=String(d.customer||order.customer||'');
            order.department=String(d.department||order.department||'');
            order.note=String(d.note||order.note||'');
            order.customer_note=String(d.customer_note||order.customer_note||'');
            order.subtotal=(d.subtotal!=null)?d.subtotal:order.subtotal;
            order.discount=(d.discount!=null)?d.discount:order.discount;
            order.total=(d.total!=null)?d.total:order.total;
            order.payment_method=String(d.payment_method||order.payment_method||'');
            order.created_at=String(d.created_at||order.created_at||'');
            order.items=Array.isArray(d.items)?d.items.slice():[];
            order.__itemsFetchDone=true;
            App.admin._orderItemsCache[oid]=(order.items||[]).slice();
          });
          if(done)done(arr);
          return;
        }
        // fallback old flow for compatibility
        var i=0;
        var run=function(){
          if(i>=arr.length){if(done)done(arr);return;}
          App.admin._ensureOrderItemsLoaded(arr[i],function(){i++;run();});
        };
        run();
      },{silent:true,noLoader:true,key:'ord_items_bulk_'+ids.length});
    },
    openPrintModal:function(idx){
      App.admin._printOrderIdx=idx;
      App.admin._printTab='receipt';
      var order=App.state.adminOrders&&App.state.adminOrders[idx];
      if(!order)order=App.admin._ordersData&&App.admin._ordersData[idx];
      if(order&&String(order.status||'').trim().toLowerCase()==='cancelled'){
        App.ui.toast('รายการที่ยกเลิกจะไม่ถูกพิมพ์','warn');
        return;
      }
      App.admin.renderPaperPresetOptions();
      document.querySelectorAll('.print-tab[id^="ptab"]').forEach(function(t){t.classList.remove('active');});
      var t=document.getElementById('ptab-receipt');if(t)t.classList.add('active');
      var rs=document.getElementById('receipt-settings'),ss=document.getElementById('sticker-settings');
      if(rs)rs.style.display='';if(ss)ss.style.display='none';
      App.admin._toggleCustomPaperField('ps-paper','ps-paper-custom-wrap');
      App.admin._toggleCustomSizeField('ss-size','ss-size-custom-wrap');
      var m=document.getElementById('print-modal');if(m)m.classList.add('active');
      App.admin.updatePrintPreview();
    },
    closePrintModal:function(){
      var m=document.getElementById('print-modal');if(m)m.classList.remove('active');
    },
    switchPrintTab:function(tab,btn){
      App.admin._printTab=tab;
      document.querySelectorAll('.print-tab[id^="ptab"]').forEach(function(t){t.classList.remove('active');});
      if(btn)btn.classList.add('active');
      var rs=document.getElementById('receipt-settings'),ss=document.getElementById('sticker-settings');
      if(tab==='receipt'){if(rs)rs.style.display='';if(ss)ss.style.display='none';}
      else{if(rs)rs.style.display='none';if(ss)ss.style.display='';}
      App.admin._toggleCustomPaperField('ps-paper','ps-paper-custom-wrap');
      App.admin._toggleCustomSizeField('ss-size','ss-size-custom-wrap');
      App.admin.updatePrintPreview();
    },
    updatePrintPreview:function(){
      App.admin._toggleCustomPaperField('ps-paper','ps-paper-custom-wrap');
      App.admin._toggleCustomSizeField('ss-size','ss-size-custom-wrap');
      var wrap=document.getElementById('print-preview-content');if(!wrap)return;
      var order=App.state.adminOrders&&App.state.adminOrders[App.admin._printOrderIdx];
      if(!order)order=App.admin._ordersData&&App.admin._ordersData[App.admin._printOrderIdx];
      if(!order){wrap.innerHTML='<div style="color:var(--text2);font-size:13px;padding:20px">ไม่พบข้อมูลออเดอร์</div>';return;}
      if(!(Array.isArray(order.items)&&order.items.length)){
        wrap.innerHTML='<div style="color:var(--text2);font-size:13px;padding:20px">กำลังโหลดรายการอาหาร...</div>';
        App.admin._ensureOrderItemsLoaded(order,function(){
          var html2=App.admin._buildSinglePrintHTML(order,App.admin._printTab,window._restaurantName||'FoodOrder',App.admin._gv,'single');
          wrap.innerHTML=html2||'<div style="color:var(--text2);font-size:13px;padding:20px">ไม่สามารถสร้างตัวอย่างได้</div>';
        });
        return;
      }
      var html=App.admin._buildSinglePrintHTML(order,App.admin._printTab,window._restaurantName||'FoodOrder',App.admin._gv,'single');
      wrap.innerHTML=html||'<div style="color:var(--text2);font-size:13px;padding:20px">ไม่สามารถสร้างตัวอย่างได้</div>';
    },
    doPrint:function(skipEnsure){
      var order=(App.state.adminOrders&&App.state.adminOrders[App.admin._printOrderIdx])||null;
      if(!order)order=App.admin._ordersData&&App.admin._ordersData[App.admin._printOrderIdx];
      var tab=App.admin._printTab||'receipt';
      if(tab==='sticker'){
        var isMobile=/iphone|ipad|ipod|android/i.test((navigator&&navigator.userAgent||''));
        if(isMobile){
          var oid=String(order&&order.id||order&&order.orderId||'');
          App.admin._mobileStickerSource='selection';
          App.admin._mobileBatchStickerIds=oid?[oid]:[];
          App.admin._mobileBatchStickerOrders=order?[order]:[];
          if(App.admin.openMobileStickerPrintFallback){
            App.admin.openMobileStickerPrintFallback({source:'selection',ids:App.admin._mobileBatchStickerIds,orders:App.admin._mobileBatchStickerOrders});
          }
          App.ui.toast('บนมือถือให้ใช้ดาวน์โหลดไฟล์สติ๊กเกอร์ หรือพิมพ์ผ่าน AirPrint จากหน้า label-only','warn');
          return;
        }
        if(App.admin.printSingleStickerForCT221B){
          App.admin.printSingleStickerForCT221B();
        }else{
          App.ui.toast('ยังไม่พบระบบพิมพ์สติ๊กเกอร์ CT221B','error');
        }
        return;
      }
      if(!order){App.ui.toast('ไม่พบออเดอร์ที่เลือก','error');return;}
      if(String(order.status||'').trim().toLowerCase()==='cancelled'){App.ui.toast('รายการที่ยกเลิกจะไม่ถูกพิมพ์','warn');return;}
      if(!skipEnsure&&!(Array.isArray(order.items)&&order.items.length)){
        App.ui.toast('กำลังโหลดรายการอาหารก่อนพิมพ์...','info');
        App.admin._ensureOrderItemsLoaded(order,function(){App.admin.doPrint(true);});
        return;
      }
      tab=tab||'receipt';
      var shopName=window._restaurantName||'FoodOrder';
      var orientation=App.admin._getOrientationByContext('single',tab);
      var size=App.admin._resolvePaperSize('ps-paper','ps-paper-custom','80mm');
      var stickerSize=App.admin._resolveStickerSize('ss-size','ss-size-custom','100x70');
      var rCal=App.admin._getReceiptCalibration('single');
      var recSpec=App.admin._paperSizeToPageSpec(size,rCal.scale,orientation);
      var receiptPageSize=recSpec.pageSpec;
      var stickerPageSize=App.admin._stickerSizeToPageSize(stickerSize,orientation);
      var pageSize=tab==='receipt'?receiptPageSize:stickerPageSize;
      var printWidth=tab==='receipt'
        ?App.admin._pageSpecToFrameWidth(receiptPageSize,recSpec.previewWidth)
        :App.admin._pageSpecToFrameWidth(stickerPageSize,'100mm');
      var pageMargin='0';
      var bodyPad='0';
      var iw=document.createElement('iframe');
      iw.style.cssText='position:fixed;top:-9999px;left:-9999px;width:'+printWidth+';height:auto;border:none';
      document.body.appendChild(iw);
      var doc=iw.contentWindow.document;
      doc.open();
      doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+shopName+' - พิมพ์</title>');
      doc.write('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap">');
      doc.write('<style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:'+printWidth+'}body{font-family:\'Prompt\',monospace;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:'+bodyPad+'}@media print{body{margin:0;padding:0}@page{margin:'+pageMargin+';size:'+pageSize+'}.rp-receipt,.rp-sticker{border:none!important;border-radius:0!important;page-break-inside:avoid!important;break-inside:avoid-page!important}.rp-receipt{width:100%!important;max-width:100%!important;padding:2mm 2.4mm!important;overflow:hidden}}.rp-sticker{display:block;margin:0}</style>');
      doc.write('</head><body>');
      doc.write(App.admin._buildSinglePrintHTML(order,tab,shopName,App.admin._gv,'single')||'');
      doc.write('</body></html>');
      doc.close();
      setTimeout(function(){
        iw.contentWindow.focus();
        iw.contentWindow.print();
        App.admin._markPrintedOrders([String(order&&order.id||'')],tab);
        setTimeout(function(){document.body.removeChild(iw);},1000);
      },400);
    },
    _createQueueAndRunPrint:function(type,orderIds,method,done){
      var ids=(Array.isArray(orderIds)?orderIds:[]).map(function(x){return String(x||'').trim();}).filter(Boolean);
      if(!ids.length){App.ui.toast('ไม่พบออเดอร์ที่เลือก','warn');if(done)done(false);return;}
      var payload={type:(type==='sticker'?'sticker':'receipt'),orderIds:ids,templateId:'order_modal',settings:{paper:'',layout:'',size:'',method:'browser'}};
      App.api.call('createPrintJob',[payload,App.state.adminToken],function(res){
        if(App.admin._auth(res)){if(done)done(false);return;}
        if(!res||!res.success){App.ui.toast((res&&res.message)||'สร้างคิวพิมพ์ไม่สำเร็จ','error');if(done)done(false);return;}
        var jobId=String(res.data&&res.data.jobId||'').trim();
        if(!jobId){App.ui.toast('ไม่พบ jobId จากระบบ','error');if(done)done(false);return;}
        App.admin.loadPrintQueue();
        var prevMethod=App.state.printing.method;
        App.state.printing.method='browser';
        setTimeout(function(){
          App.admin.printing.printViaBluetoothById(jobId).then(function(){
            App.state.printing.method=prevMethod;
            if(done)done(true);
          }).catch(function(){
            App.state.printing.method=prevMethod;
            if(done)done(false);
          });
        },220);
      });
    },
    _createQueueAndBluetoothPrint:function(type,orderIds,done){
      App.admin._createQueueAndRunPrint(type,orderIds,'browser',done);
    },
    doPrintBluetooth:function(skipEnsure){
      App.ui.toast('ฟังก์ชันนี้ถูกปิดการใช้งานแล้ว','warn');
    },
    _ensurePdfRenderLibs:function(done){
      var hasAll=!!(window.html2canvas&&window.jspdf&&window.jspdf.jsPDF);
      if(hasAll){done(true);return;}
      var loadScript=function(src,cb){
        var existing=document.querySelector('script[data-lib="'+src+'"]');
        if(existing){
          if(existing.dataset.ready==='1'){cb(true);return;}
          existing.addEventListener('load',function(){cb(true);},{once:true});
          existing.addEventListener('error',function(){cb(false);},{once:true});
          return;
        }
        var s=document.createElement('script');
        s.src=src;
        s.async=true;
        s.dataset.lib=src;
        s.onload=function(){s.dataset.ready='1';cb(true);};
        s.onerror=function(){cb(false);};
        document.head.appendChild(s);
      };
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',function(ok1){
        if(!ok1){done(false);return;}
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',function(ok2){
          done(!!ok2&&!!(window.html2canvas&&window.jspdf&&window.jspdf.jsPDF));
        });
      });
    },
    _parsePageSpecMm:function(pageSpec){
      var parts=String(pageSpec||'').trim().split(/\s+/).filter(Boolean);
      var w=parts.length?parseFloat(String(parts[0]).replace(/[^\d.]/g,'')):0;
      var h=parts.length>1?parseFloat(String(parts[1]).replace(/[^\d.]/g,'')):0;
      if(!isFinite(w)||w<=0)w=80;
      if(!isFinite(h)||h<=0)h=0;
      return {w:w,h:h};
    },
    _buildPrintPdfConfig:function(tab,mode){
      var shopName=window._restaurantName||'FoodOrder';
      var orientation=App.admin._getOrientationByContext(mode,tab);
      if(tab==='receipt'){
        var paper=(mode==='batch')
          ?App.admin._resolvePaperSize('bp-paper','bp-paper-custom','80mm')
          :App.admin._resolvePaperSize('ps-paper','ps-paper-custom','80mm');
        var cal=App.admin._getReceiptCalibration(mode);
        var recSpec=App.admin._paperSizeToPageSpec(paper,cal.scale,orientation);
        var mm=App.admin._parsePageSpecMm(recSpec.pageSpec);
        return{
          tab:tab,
          mode:mode,
          shopName:shopName,
          previewWidth:String(recSpec.previewWidth||'80mm'),
          pageWidthMm:recSpec.pageWidthMm||mm.w||80,
          pageHeightMm:recSpec.isFixed?(recSpec.pageHeightMm||mm.h||0):0,
          isFixed:!!recSpec.isFixed
        };
      }
      var sticker=(mode==='batch')
        ?App.admin._resolveStickerSize('bs-size','bs-size-custom','100x70')
        :App.admin._resolveStickerSize('ss-size','ss-size-custom','100x70');
      var cal2=App.admin._getStickerCalibration(mode);
      var sp2=String(sticker||'100x70').split('x');
      var w2=parseFloat(sp2[0]||100);
      var h2=parseFloat(sp2[1]||70);
      if(!(w2>0))w2=100;
      if(!(h2>0))h2=70;
      if(orientation==='landscape'){var t2=w2;w2=h2;h2=t2;}
      var outW=Math.round((w2*cal2.scale)*100)/100;
      var outH=Math.round((h2*cal2.scale)*100)/100;
      return{
        tab:tab,
        mode:mode,
        shopName:shopName,
        previewWidth:String(outW||100)+'mm',
        pageWidthMm:outW||100,
        pageHeightMm:outH||70,
        isFixed:true
      };
    },
    _exportPreviewPdf:function(orders,tab,mode,fileName,done){
      var list=Array.isArray(orders)?orders:[];
      if(!list.length){App.ui.toast('ไม่มีข้อมูลสำหรับสร้าง PDF','warn');if(done)done(false);return;}
      App.admin._ensurePdfRenderLibs(function(ok){
        if(!ok){App.ui.toast('โหลดเครื่องมือสร้าง PDF ไม่สำเร็จ','error');if(done)done(false);return;}
        App.ui.toast('กำลังสร้างไฟล์ PDF จากพรีวิว...','info');
        App.admin._printPdfNoFrame=true;
        var cfg=App.admin._buildPrintPdfConfig(tab,mode);
        var host=document.createElement('div');
        host.style.position='fixed';
        host.style.left='-100000px';
        host.style.top='0';
        host.style.background='#fff';
        host.style.padding='0';
        host.style.margin='0';
        host.style.zIndex='-1';
        document.body.appendChild(host);
        var wraps=[];
        list.forEach(function(order){
          var wrap=document.createElement('div');
          wrap.style.width=cfg.previewWidth;
          wrap.style.background='#fff';
          wrap.style.padding='0';
          wrap.style.margin='0 0 2mm 0';
          wrap.innerHTML=App.admin._buildSinglePrintHTML(order,tab,cfg.shopName,App.admin._gv,mode)||'';
          host.appendChild(wrap);
          wraps.push(wrap);
        });
        (async function(){
          try{
            if(document.fonts&&document.fonts.ready){try{await document.fonts.ready;}catch(_){}}            
            var jsPDF=window.jspdf.jsPDF;
            var pdf=null;
            var renderScale=2;
            for(var i=0;i<wraps.length;i++){
              var node=wraps[i].firstElementChild||wraps[i];
              var canvas;
              try{
                canvas=await window.html2canvas(node,{scale:renderScale,backgroundColor:'#ffffff',useCORS:true,logging:false});
              }catch(_){
                canvas=await window.html2canvas(node,{scale:1.2,backgroundColor:'#ffffff',useCORS:true,logging:false});
              }
              var wMm=cfg.pageWidthMm;
              var hMm=cfg.pageHeightMm;
              if(!cfg.isFixed||!(hMm>0))hMm=Math.max(20,(canvas.height*(wMm/canvas.width)));
              var pageOri=(wMm>hMm)?'landscape':'portrait';
              if(!pdf)pdf=new jsPDF({unit:'mm',format:[wMm,hMm],orientation:pageOri,compress:true});
              else pdf.addPage([wMm,hMm],pageOri);
              pdf.addImage(canvas.toDataURL('image/jpeg',0.94),'JPEG',0,0,wMm,hMm);
            }
            if(pdf)pdf.save(fileName||('print_'+Date.now()+'.pdf'));
            App.ui.toast('พิมพ์ PDF สำเร็จ (โหมดพรีวิว)','success');
            if(done)done(true);
          }catch(e){
            App.ui.toast('สร้าง PDF ไม่สำเร็จ (โหมดพรีวิว)','error');
            if(done)done(false);
          }finally{
            App.admin._printPdfNoFrame=false;
            if(host&&host.parentNode)host.parentNode.removeChild(host);
          }
        })();
      });
    },
    downloadSingleStickerPdfForCT221B:function(){
      var order=null;
      try{ order=(App.state.adminOrders&&App.state.adminOrders[App.admin._printOrderIdx])||null; }catch(_){ order=null; }
      if(!order){
        try{ order=(App.admin._ordersData&&App.admin._ordersData[App.admin._printOrderIdx])||null; }catch(_2){ order=null; }
      }
      if(!order){ App.ui.toast('ไม่พบออเดอร์สำหรับดาวน์โหลดสติ๊กเกอร์','warn'); return; }

      if(App.admin._printingPdfBusy)return;
      App.admin._beginPdfLock('กำลังสร้างไฟล์ PDF...');

      var exportOrder=function(o){
        if(!o||App.admin._isCancelledOrderStatus(String(o.status||''))){
          App.admin._endPdfLock();
          App.ui.toast('รายการที่ยกเลิกจะไม่ถูกพิมพ์','warn');
          return;
        }

        var labels=App.admin._expandOrdersForSticker([o],'single');
        console.log('[single-sticker-pdf]',{labels:labels.length,orderId:String(o.id||o.orderId||'')});
        if(!labels.length){ App.admin._endPdfLock(); App.ui.toast('ไม่พบข้อมูลสำหรับดาวน์โหลดสติ๊กเกอร์','warn'); return; }

        var cfg=App.admin._getStickerPaperCfg('single');
        var w=Math.max(10,parseFloat(cfg.widthMm)||50);
        var h=Math.max(10,parseFloat(cfg.heightMm)||30);
        var stamp=(function(){var d=new Date();return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'_'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0');})();
        var fileName='single_sticker_'+stamp+'.pdf';

        App.admin._ensurePdfRenderLibs(function(ok){
          if(!ok){App.admin._endPdfLock();App.ui.toast('โหลดเครื่องมือสร้าง PDF ไม่สำเร็จ','error');return;}
          var host=document.createElement('iframe');
          host.style.cssText='position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;border:0;opacity:0;';
          document.body.appendChild(host);
          var doc=host.contentWindow&&host.contentWindow.document;
          if(!doc){ try{if(host.parentNode)host.parentNode.removeChild(host);}catch(_d){} App.admin._endPdfLock(); App.ui.toast('ไม่สามารถสร้างเอกสารพิมพ์ได้','error'); return; }
          var html=App.admin._buildStickerStandaloneHtml(labels,cfg);
          doc.open(); doc.write(html); doc.close();
          setTimeout(async function(){
            try{
              if(host.contentWindow.document.fonts&&host.contentWindow.document.fonts.ready){ try{ await host.contentWindow.document.fonts.ready; }catch(_f){} }
              var jsPDF=window.jspdf.jsPDF;
              var pdf=new jsPDF({unit:'mm',format:[w,h],orientation:(w>h?'landscape':'portrait'),compress:true});
              var nodes=host.contentWindow.document.querySelectorAll('.ct-label');
              for(var i=0;i<nodes.length;i++){
                if(i>0)pdf.addPage([w,h],(w>h?'landscape':'portrait'));
                var canvas=await window.html2canvas(nodes[i],{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false});
                pdf.addImage(canvas.toDataURL('image/jpeg',0.94),'JPEG',0,0,w,h);
              }
              pdf.save(fileName);
              App.ui.toast('ดาวน์โหลดไฟล์สติ๊กเกอร์สำเร็จ','success');
              try{ if(App.admin._markPrintedOrders){ App.admin._markPrintedOrders([String(o.id||o.orderId||'')].filter(Boolean),'sticker'); } }catch(_m){}
            }catch(e){
              App.ui.toast('สร้างไฟล์สติ๊กเกอร์ไม่สำเร็จ','error');
            }finally{
              App.admin._endPdfLock();
              try{if(host&&host.parentNode)host.parentNode.removeChild(host);}catch(_x){}
            }
          },320);
        });
      };

      if(!(Array.isArray(order.items)&&order.items.length) && App.admin._ensureOrderItemsLoaded){
        App.admin._ensureOrderItemsLoaded(order,function(loaded){ exportOrder(loaded||order); });
        return;
      }
      exportOrder(order);
    },

    downloadSinglePrintPdf:function(skipEnsure){
      var order=App.admin._ordersData&&App.admin._ordersData[App.admin._printOrderIdx];
      var tab=App.admin._printTab||'receipt';
      if(tab==='sticker'){
        if(App.admin.downloadSingleStickerPdfForCT221B){
          App.admin.downloadSingleStickerPdfForCT221B();
        }else{
          App.ui.toast('ยังไม่พบระบบดาวน์โหลดสติ๊กเกอร์ CT221B','error');
        }
        return;
      }
      if(!order){App.ui.toast('ไม่พบออเดอร์ที่เลือก','error');return;}
      if(String(order.status||'').trim().toLowerCase()==='cancelled'){App.ui.toast('รายการที่ยกเลิกจะไม่ถูกพิมพ์','warn');return;}
      if(App.admin._printingPdfBusy)return;
      App.admin._beginPdfLock('กำลังสร้างไฟล์ PDF...');
      if(!skipEnsure&&!(Array.isArray(order.items)&&order.items.length)){
        App.admin._ensureOrderItemsLoaded(order,function(){
          App.admin._endPdfLock();
          App.admin.downloadSinglePrintPdf(true);
        });
        return;
      }
      var tab=App.admin._printTab||'receipt';
      App.admin._markPrintedOrders([String(order&&order.id||'')],tab);
      App.admin._exportPreviewPdf([order],tab,'single',tab==='sticker'?'single_sticker_preview.pdf':'single_receipt_preview.pdf',function(){
        App.admin._endPdfLock();
      });
    },

    // ─── BATCH PRINT ──────────────────────────────────────────
    _batchTab:'receipt',
    _batchSelectedDepts:null, // null = all
    _batchForcedOrderIds:null,
    _isOrderPrinted:function(order){
      var cnt=parseInt(order&&order.printed_count||0,10);
      if(!isNaN(cnt)&&cnt>0)return true;
      var at=String(order&&order.printed_at||'').trim();
      return !!at;
    },
    _getBatchPrintFilter:function(){
      var el=document.getElementById('bp-print-status');
      var v=String(el&&el.value||'unprinted').toLowerCase();
      if(v!=='printed'&&v!=='all')v='unprinted';
      return v;
    },
    _filterOrdersByPrintStatus:function(list){
      var rows=Array.isArray(list)?list:[];
      var f=App.admin._getBatchPrintFilter();
      if(f==='all')return rows.slice();
      if(f==='printed')return rows.filter(function(o){return App.admin._isOrderPrinted(o);});
      return rows.filter(function(o){return !App.admin._isOrderPrinted(o);});
    },
    _getOrderPaymentType:function(o){
      var pm=String(o&&o.payment_method||'').trim().toLowerCase();
      if(pm==='cash')return 'cash';
      if(pm==='scan')return 'scan';
      return 'scan';
    },
    _getBatchPaymentFilter:function(){
      var el=document.getElementById('bp-payment-filter');
      var v=String(el&&el.value||'all').toLowerCase();
      return (v==='cash'||v==='scan')?v:'all';
    },
    _filterOrdersByPaymentType:function(list,filterValue){
      var rows=Array.isArray(list)?list:[];
      var f=String(filterValue||'all').toLowerCase();
      if(f!=='cash'&&f!=='scan')return rows.slice();
      return rows.filter(function(o){return App.admin._getOrderPaymentType(o)===f;});
    },
    _markPrintedOrders:function(orderIds,mode){
      var ids=(Array.isArray(orderIds)?orderIds:[]).map(function(x){return String(x||'').trim();}).filter(Boolean);
      if(!ids.length||!App.state.adminToken)return;
      App.api.silent('markOrdersPrinted',[ids,mode||'receipt',App.state.adminToken],function(res){
        if(!res||!res.success)return;
        var nowIso=(new Date()).toISOString();
        var incMap={};
        ids.forEach(function(id){incMap[id]=(incMap[id]||0)+1;});
        (App.admin._ordersData||[]).forEach(function(o){
          var oid=String(o&&o.id||'');
          if(!incMap[oid])return;
          var prev=parseInt(o&&o.printed_count||0,10);
          if(isNaN(prev))prev=0;
          o.printed_count=prev+incMap[oid];
          o.printed_at=nowIso;
          o.last_print_mode=String(mode||'receipt');
        });
        App.admin._ordersFp=App.admin._ordersFingerprint(App.admin._ordersData||[]);
        App.admin._ordersViewCache={key:'',data:null};
      });
    },
    openBatchPrintModal:function(){
      App.admin.dockLegacyPrintToModal();
      App.admin._batchTab='receipt';
      App.admin._batchSelectedDepts=null;
      var psEl=document.getElementById('bp-print-status');
      if(psEl)psEl.value='all';
      var pmtEl=document.getElementById('bp-payment-filter');
      if(pmtEl)pmtEl.value='all';
      App.admin.renderPaperPresetOptions();
      // Reset tabs
      document.querySelectorAll('.print-tab[id^="bptab"]').forEach(function(t){t.classList.remove('active');});
      var t=document.getElementById('bptab-receipt');if(t)t.classList.add('active');
      var brs=document.getElementById('batch-receipt-settings'),bss=document.getElementById('batch-sticker-settings');
      if(brs)brs.style.display='';if(bss)bss.style.display='none';
      App.admin._toggleCustomPaperField('bp-paper','bp-paper-custom-wrap');
      App.admin._toggleCustomSizeField('bs-size','bs-size-custom-wrap');
      App.admin._buildBatchDeptList();
      App.admin.updateBatchPreview();
      var m=document.getElementById('batch-print-modal');if(m)m.classList.add('active');
    },
    closeBatchPrintModal:function(){
      var m=document.getElementById('batch-print-modal');if(m)m.classList.remove('active');
      App.admin._batchForcedOrderIds=null;
    },
    switchBatchTab:function(tab,btn){
      App.admin._batchTab=tab;
      document.querySelectorAll('.print-tab[id^="bptab"]').forEach(function(t){t.classList.remove('active');});
      if(btn)btn.classList.add('active');
      var brs=document.getElementById('batch-receipt-settings'),bss=document.getElementById('batch-sticker-settings');
      if(tab==='receipt'){if(brs)brs.style.display='';if(bss)bss.style.display='none';}
      else{if(brs)brs.style.display='none';if(bss)bss.style.display='';}
      App.admin._toggleCustomPaperField('bp-paper','bp-paper-custom-wrap');
      App.admin._toggleCustomSizeField('bs-size','bs-size-custom-wrap');
      App.admin.updateBatchPreview();
    },
    onBatchDateCalendarChange:function(){
      App.admin._buildBatchDeptList();
      App.admin.updateBatchPreview();
    },
    clearBatchDateCalendar:function(){
      var fromEl=document.getElementById('bp-date-from');if(fromEl)fromEl.value='';
      var toEl=document.getElementById('bp-date-to');if(toEl)toEl.value='';
      App.admin._buildBatchDeptList();
      App.admin.updateBatchPreview();
    },
    _buildBatchDeptList:function(){
      var wrap=document.getElementById('batch-dept-list');if(!wrap)return;
      var isVillage=App.admin._getDeliveryCategoryType()==='village';
      var forced=Array.isArray(App.admin._batchForcedOrderIds)?App.admin._batchForcedOrderIds:null;
      if(isVillage){
        wrap.innerHTML='';
        App.admin._batchSelectedDepts=null;
        return;
      }
      var data=App.admin._ordersData||[];
      if(forced&&forced.length){
        var fMap={};forced.forEach(function(id){fMap[String(id||'').trim()]=1;});
        data=data.filter(function(o){return !!fMap[String(o&&o.id||'').trim()];});
      }
      // Get date range
      var drEl=document.getElementById('bp-daterange');
      var dr=drEl?drEl.value:'1';
      var fromEl=document.getElementById('bp-date-from');
      var toEl=document.getElementById('bp-date-to');
      var fromVal=String(fromEl&&fromEl.value||'').trim();
      var toVal=String(toEl&&toEl.value||'').trim();
      var filtered=data;
      if(fromVal||toVal){
        var fromMs=0,toMs=0;
        if(fromVal){var f=new Date(fromVal);f.setHours(0,0,0,0);fromMs=f.getTime();}
        if(toVal){var t=new Date(toVal);t.setHours(23,59,59,999);toMs=t.getTime();}
        filtered=data.filter(function(o){
          var ts=o&&o.created_at?new Date(o.created_at).getTime():0;
          if(!ts)return false;
          if(fromMs&&ts<fromMs)return false;
          if(toMs&&ts>toMs)return false;
          return true;
        });
      }else if(dr!=='all'){
        var days=parseInt(dr)||1;var cutoff=new Date();cutoff.setHours(0,0,0,0);
        if(days>1)cutoff.setDate(cutoff.getDate()-(days-1));
        filtered=data.filter(function(o){return o.created_at&&new Date(o.created_at)>=cutoff;});
      }
      filtered=App.admin._filterOrdersByPrintStatus(filtered);
      filtered=App.admin._filterOrdersByPaymentType(filtered,App.admin._getBatchPaymentFilter());
      var deptMap={};
      var none='(ไม่ระบุ'+App.admin._deptLabel()+')';
      filtered.forEach(function(o){var d=String(o.department||'').trim()||none;deptMap[d]=(deptMap[d]||0)+1;});
      var depts=Object.keys(deptMap).sort();
      var sel=App.admin._batchSelectedDepts;
      var html='<label class="print-toggle-label" style="padding:5px 0;border-bottom:1px solid var(--border);margin-bottom:6px">'
        +'<input type="checkbox" id="bdept-all" style="accent-color:var(--primary);width:15px;height:15px" '+(sel===null?'checked':'')
        +' onchange="App.admin.onBatchDeptAll(this.checked)"><span style="font-weight:700">ทั้งหมด ('+(filtered.length)+' ออเดอร์)</span></label>';
      depts.forEach(function(d){
        var checked=sel===null||sel.indexOf(d)>-1;
        html+='<label class="print-toggle-label" style="padding:3px 0 3px 8px">'
          +'<input type="checkbox" class="bdept-cb" data-dept="'+App.u.esc(d)+'" style="accent-color:var(--primary);width:14px;height:14px" '+(checked?'checked':'')
          +' onchange="App.admin.onBatchDeptChange()"><span>🏢 '+App.u.esc(d)+' <span style="color:var(--text2);font-size:11px">('+deptMap[d]+')</span></span></label>';
      });
      wrap.innerHTML=html;
    },
    onBatchDeptAll:function(checked){
      App.admin._batchSelectedDepts=checked?null:[];
      // sync checkboxes
      document.querySelectorAll('.bdept-cb').forEach(function(cb){cb.checked=checked;});
      App.admin.updateBatchPreview();
    },
    onBatchDeptChange:function(){
      var cbs=document.querySelectorAll('.bdept-cb:checked');
      var allCbs=document.querySelectorAll('.bdept-cb');
      if(cbs.length===allCbs.length){
        App.admin._batchSelectedDepts=null;
        var allCb=document.getElementById('bdept-all');if(allCb)allCb.checked=true;
      } else {
        App.admin._batchSelectedDepts=Array.from(cbs).map(function(cb){return cb.dataset.dept;});
        var allCb2=document.getElementById('bdept-all');if(allCb2)allCb2.checked=false;
      }
      App.admin.updateBatchPreview();
    },
    _getBatchOrders:function(){
      var data=App.admin._ordersData||[];
      var forced=Array.isArray(App.admin._batchForcedOrderIds)?App.admin._batchForcedOrderIds:null;
      if(forced&&forced.length){
        var fMap={};forced.forEach(function(id){fMap[String(id||'').trim()]=1;});
        data=data.filter(function(o){return !!fMap[String(o&&o.id||'').trim()];});
      }
      var isVillage=App.admin._getDeliveryCategoryType()==='village';
      var drEl=document.getElementById('bp-daterange');
      var dr=drEl?drEl.value:'1';
      var fromEl=document.getElementById('bp-date-from');
      var toEl=document.getElementById('bp-date-to');
      var fromVal=String(fromEl&&fromEl.value||'').trim();
      var toVal=String(toEl&&toEl.value||'').trim();
      var filtered=data;
      if(fromVal||toVal){
        var fromMs=0,toMs=0;
        if(fromVal){var f2=new Date(fromVal);f2.setHours(0,0,0,0);fromMs=f2.getTime();}
        if(toVal){var t2=new Date(toVal);t2.setHours(23,59,59,999);toMs=t2.getTime();}
        filtered=data.filter(function(o){
          var ts=o&&o.created_at?new Date(o.created_at).getTime():0;
          if(!ts)return false;
          if(fromMs&&ts<fromMs)return false;
          if(toMs&&ts>toMs)return false;
          return true;
        });
      }else if(dr!=='all'){
        var days=parseInt(dr)||1;var cutoff=new Date();cutoff.setHours(0,0,0,0);
        if(days>1)cutoff.setDate(cutoff.getDate()-(days-1));
        filtered=data.filter(function(o){return o.created_at&&new Date(o.created_at)>=cutoff;});
      }
      filtered=App.admin._filterOrdersByPrintStatus(filtered);
      filtered=App.admin._filterOrdersByPaymentType(filtered,App.admin._getBatchPaymentFilter());
      var sel=App.admin._batchSelectedDepts;
      if(!isVillage&&sel!==null&&!(forced&&forced.length)){
        var none='(ไม่ระบุ'+App.admin._deptLabel()+')';
        filtered=filtered.filter(function(o){
          var d=String(o.department||'').trim()||none;
          return sel.indexOf(d)>-1;
        });
      }
      // PERF: ข้ามออเดอร์ที่ยกเลิกออกจากชุดพิมพ์
      filtered=filtered.filter(function(o){return String(o&&o.status||'').trim().toLowerCase()!=='cancelled';});
      return filtered;
    },
    updateBatchPreview:function(skipEnsure){
      App.admin._toggleCustomPaperField('bp-paper','bp-paper-custom-wrap');
      App.admin._toggleCustomSizeField('bs-size','bs-size-custom-wrap');
      App.admin._buildBatchDeptList();
      var orders=App.admin._getBatchOrders();
      var count=orders.length;
      var badge=document.getElementById('batch-count-badge');if(badge)badge.textContent=count+' ออเดอร์';
      var countEl=document.getElementById('batch-print-count');if(countEl)countEl.textContent=count;
      var wrap=document.getElementById('batch-preview-content');if(!wrap)return;
      var tab=App.admin._batchTab;
      wrap.style.display='flex';
      wrap.style.flexDirection='column';
      wrap.style.flexWrap='nowrap';
      wrap.style.justifyContent='flex-start';
      wrap.style.gap='10px';
      wrap.style.alignItems=(tab==='sticker')?'center':'flex-start';
      var shopName=window._restaurantName||'FoodOrder';
      var previewOrders=orders.slice(0,6); // แสดงตัวอย่างสูงสุด 6 ใบ
      if(!previewOrders.length){wrap.innerHTML='<div style="color:var(--text2);font-size:13px;padding:20px">ไม่มีออเดอร์ในเงื่อนไขที่เลือก</div>';return;}
      if(!skipEnsure){
        var needLoad=previewOrders.filter(function(o){return !(Array.isArray(o.items)&&o.items.length);});
        if(needLoad.length){
          wrap.innerHTML='<div style="color:var(--text2);font-size:13px;padding:20px">กำลังโหลดรายการอาหาร...</div>';
          App.admin._ensureOrdersItemsLoaded(needLoad,function(){App.admin.updateBatchPreview(true);});
          return;
        }
      }
      var html='';
      previewOrders.forEach(function(o){
        html+=App.admin._buildSinglePrintHTML(o,tab,shopName,App.admin._gv,'batch')||'';
      });
      if(orders.length>6)html+='<div style="font-size:12px;color:var(--text2);padding:8px;text-align:center;width:100%">...และอีก '+(orders.length-6)+' ออเดอร์</div>';
      wrap.innerHTML=html;
    },
    doBatchPrint:function(skipEnsure){
      var tab=String(App.admin._batchTab||(App.state.printing&&App.state.printing.tab)||'receipt');
      if(tab==='sticker'){
        var isMobile=App.admin._isMobilePrintContext?App.admin._isMobilePrintContext():(/iphone|ipad|ipod|android/i.test((navigator&&navigator.userAgent||'')));
        if(isMobile){
          if(App.admin.openMobileStickerPrintFallbackFromBatch){
            App.admin.openMobileStickerPrintFallbackFromBatch();
          }else if(App.admin.openMobileStickerPrintFallback){
            App.admin.openMobileStickerPrintFallback();
          }else{
            App.ui.toast('บนมือถือให้ใช้ดาวน์โหลดไฟล์สติ๊กเกอร์','warn');
          }
          return;
        }
        if(App.admin.printBatchStickerForCT221B){
          App.admin.printBatchStickerForCT221B();
        }else if(App.admin.printStickerSelectionForCT221B){
          App.admin.printStickerSelectionForCT221B();
        }else{
          App.ui.toast('ยังไม่พบระบบพิมพ์สติ๊กเกอร์ CT221B','error');
        }
        return;
      }
      var orders=App.admin._getBatchOrders();
      if(!orders.length){App.ui.toast('ไม่มีออเดอร์ที่เลือก','warn');return;}
      if(!skipEnsure){
        var needLoad=orders.filter(function(o){return !(Array.isArray(o.items)&&o.items.length);});
        if(needLoad.length){
          App.ui.toast('กำลังโหลดรายการอาหารก่อนพิมพ์...','info');
          App.admin._ensureOrdersItemsLoaded(needLoad,function(){App.admin.doBatchPrint(true);});
          return;
        }
      }
      var tab=App.admin._batchTab;
      var shopName=window._restaurantName||'FoodOrder';
      var orientation=App.admin._getOrientationByContext('batch',tab);
      var receiptSize=App.admin._resolvePaperSize('bp-paper','bp-paper-custom','80mm');
      var stickerSize=App.admin._resolveStickerSize('bs-size','bs-size-custom','100x70');
      var brCal=App.admin._getReceiptCalibration('batch');
      var bRecSpec=App.admin._paperSizeToPageSpec(receiptSize,brCal.scale,orientation);
      var bReceiptPageSize=bRecSpec.pageSpec;
      var bStickerPageSize=App.admin._stickerSizeToPageSize(stickerSize,orientation);
      var pageSize=tab==='receipt'?bReceiptPageSize:bStickerPageSize;
      var frameWidth=tab==='receipt'
        ?App.admin._pageSpecToFrameWidth(bReceiptPageSize,bRecSpec.previewWidth)
        :App.admin._pageSpecToFrameWidth(bStickerPageSize,'100mm');
      var pageMargin='0';
      var iw=document.createElement('iframe');
      iw.style.cssText='position:fixed;top:-9999px;left:-9999px;width:'+frameWidth+';height:auto;border:none';
      document.body.appendChild(iw);
      var doc=iw.contentWindow.document;
      doc.open();
      doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+shopName+' - พิมพ์ทั้งหมด</title>');
      doc.write('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap">');
      doc.write('<style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:'+frameWidth+'}body{font-family:\'Prompt\',monospace;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}@media print{body{margin:0}@page{margin:'+pageMargin+';size:'+pageSize+'}.rp-receipt,.rp-sticker{border:none!important;border-radius:0!important;page-break-after:always;page-break-inside:avoid!important;break-inside:avoid-page!important}.rp-receipt{width:100%!important;max-width:100%!important;padding:2mm 2.4mm!important;overflow:hidden}}.rp-sticker{display:block;margin:0}.batch-sticker-wrap{display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;gap:0;padding:0}</style>');
      doc.write('</head><body>');
      if(tab==='sticker'){doc.write('<div class="batch-sticker-wrap">');}
      orders.forEach(function(o){
        var html=App.admin._buildSinglePrintHTML(o,tab,shopName,App.admin._gv,'batch');
        if(html)doc.write(html);
      });
      if(tab==='sticker'){doc.write('</div>');}
      doc.write('</body></html>');
      doc.close();
      setTimeout(function(){
        iw.contentWindow.focus();
        iw.contentWindow.print();
        App.admin._markPrintedOrders(orders.map(function(o){return String(o&&o.id||'');}),tab);
        setTimeout(function(){document.body.removeChild(iw);},1000);
      },400);
    },
    doBatchPrintBluetooth:function(skipEnsure){
      App.ui.toast('ฟังก์ชันนี้ถูกปิดการใช้งานแล้ว','warn');
    },
    downloadBatchStickerPdfForCT221B:function(){
      var orders=[];
      try{ orders=App.admin._getBatchOrders?App.admin._getBatchOrders():[]; }catch(_){ orders=[]; }
      if(!orders.length){ App.ui.toast('ไม่มีออเดอร์ที่เลือก','warn'); return; }
      if(App.admin._printingPdfBusy)return;
      App.admin._beginPdfLock('กำลังสร้างไฟล์ PDF...');

      var exportLabels=function(rows){
        var valid=(Array.isArray(rows)?rows:[]).filter(function(o){
          return o&&!App.admin._isCancelledOrderStatus(String(o.status||''));
        });
        var labels=App.admin._expandOrdersForSticker(valid,'batch');
        console.log('[batch-sticker-pdf]',{orders:valid.length,labels:labels.length});
        if(!labels.length){ App.admin._endPdfLock(); App.ui.toast('ไม่พบข้อมูลสำหรับดาวน์โหลดสติ๊กเกอร์','warn'); return; }

        var cfg=App.admin._getStickerPaperCfg('batch');
        var w=Math.max(10,parseFloat(cfg.widthMm)||50);
        var h=Math.max(10,parseFloat(cfg.heightMm)||30);
        var stamp=(function(){var d=new Date();return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'_'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0');})();
        var fileName='sticker_orders_'+stamp+'.pdf';

        App.admin._ensurePdfRenderLibs(function(ok){
          if(!ok){App.admin._endPdfLock();App.ui.toast('โหลดเครื่องมือสร้าง PDF ไม่สำเร็จ','error');return;}
          var host=document.createElement('iframe');
          host.style.cssText='position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;border:0;opacity:0;';
          document.body.appendChild(host);
          var doc=host.contentWindow&&host.contentWindow.document;
          if(!doc){ try{if(host.parentNode)host.parentNode.removeChild(host);}catch(_d){} App.admin._endPdfLock(); App.ui.toast('ไม่สามารถสร้างเอกสารพิมพ์ได้','error'); return; }
          var html=App.admin._buildStickerStandaloneHtml(labels,cfg);
          doc.open(); doc.write(html); doc.close();
          setTimeout(async function(){
            try{
              if(host.contentWindow.document.fonts&&host.contentWindow.document.fonts.ready){ try{ await host.contentWindow.document.fonts.ready; }catch(_f){} }
              var jsPDF=window.jspdf.jsPDF;
              var pdf=new jsPDF({unit:'mm',format:[w,h],orientation:(w>h?'landscape':'portrait'),compress:true});
              var nodes=host.contentWindow.document.querySelectorAll('.ct-label');
              for(var i=0;i<nodes.length;i++){
                if(i>0)pdf.addPage([w,h],(w>h?'landscape':'portrait'));
                var canvas=await window.html2canvas(nodes[i],{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false});
                pdf.addImage(canvas.toDataURL('image/jpeg',0.94),'JPEG',0,0,w,h);
              }
              pdf.save(fileName);
              App.ui.toast('ดาวน์โหลดไฟล์สติ๊กเกอร์สำเร็จ','success');
            }catch(e){
              App.ui.toast('สร้างไฟล์สติ๊กเกอร์ไม่สำเร็จ','error');
            }finally{
              App.admin._endPdfLock();
              try{if(host&&host.parentNode)host.parentNode.removeChild(host);}catch(_x){}
            }
          },320);
        });
      };

      var needLoad=orders.filter(function(o){ return !(Array.isArray(o&&o.items)&&o.items.length); });
      if(needLoad.length&&App.admin._ensureOrdersItemsLoaded){
        App.admin._ensureOrdersItemsLoaded(orders,function(full){ exportLabels(Array.isArray(full)&&full.length?full:orders); });
        return;
      }
      exportLabels(orders);
    },

    downloadBatchPrintPdf:function(skipEnsure){
      var tab=String(App.admin._batchTab||(App.state.printing&&App.state.printing.tab)||'receipt');
      if(tab==='sticker'){
        if(App.admin.downloadBatchStickerPdfForCT221B){
          App.admin.downloadBatchStickerPdfForCT221B();
        }else{
          App.ui.toast('ยังไม่พบระบบดาวน์โหลดสติ๊กเกอร์ CT221B','error');
        }
        return;
      }
      var orders=App.admin._getBatchOrders();
      if(!orders.length){App.ui.toast('ไม่มีออเดอร์ที่เลือก','warn');return;}
      if(App.admin._printingPdfBusy)return;
      App.admin._beginPdfLock('กำลังสร้างไฟล์ PDF...');
      if(!skipEnsure){
        var needLoad=orders.filter(function(o){return !(Array.isArray(o.items)&&o.items.length);});
        if(needLoad.length){
          App.admin._ensureOrdersItemsLoaded(needLoad,function(){
            App.admin._endPdfLock();
            App.admin.downloadBatchPrintPdf(true);
          });
          return;
        }
      }
      var tab=App.admin._batchTab||'receipt';
      App.admin._markPrintedOrders(orders.map(function(o){return String(o&&o.id||'');}),tab);
      App.admin._exportPreviewPdf(orders,tab,'batch',tab==='sticker'?'batch_sticker_preview.pdf':'batch_receipt_preview.pdf',function(){
        App.admin._endPdfLock();
      });
    },
    _formatPrintDateTime:function(raw){
      if(!raw)return '';
      var dt=(raw instanceof Date)?raw:new Date(raw);
      if(!dt||isNaN(dt.getTime()))return String(raw||'');
      var d=dt.toLocaleDateString('th-TH',{year:'numeric',month:'short',day:'2-digit'});
      var t=dt.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',hour12:false});
      return d+' '+t;
    },
    _buildSinglePrintHTML:function(o,tab,shopName,gv,mode){
      // mode: 'single'(individual print modal) or 'batch'
      var pfx=mode==='batch'?'b':'p'; // prefix: bp- or pp- for single
      var sfx=mode==='batch'?'s':''; // sticker prefix
      // Helper to read right checkbox
      var g=function(key){
        // key examples: 'shop-name','order-id', etc.
        var id=tab==='receipt'?(pfx+'p-'+key):(pfx+(tab==='sticker'?sfx:'')+'s-'+key);
        // Normalise for batch sticker: bs-xxx
        if(mode==='batch'&&tab==='sticker')id='bs-'+key;
        else if(mode==='batch'&&tab==='receipt')id='bp-'+key;
        else if(mode==='single'&&tab==='receipt')id='ps-'+key;
        else if(mode==='single'&&tab==='sticker')id='ss-'+key;
        var el=document.getElementById(id);
        return el?(el.type==='checkbox'?el.checked:el.value):true;
      };
      var parseItemOptions=function(raw){
        if(raw==null)return [];
        if(Array.isArray(raw)){
          return raw.map(function(x){
            if(typeof x==='string')return String(x||'').replace(/^[^:：]+[:：]\s*/,'').trim();
            if(typeof x==='object'&&x)return String(x.label||x.name||x.value||'').replace(/^[^:：]+[:：]\s*/,'').trim();
            return String(x||'').replace(/^[^:：]+[:：]\s*/,'').trim();
          }).filter(Boolean);
        }
        var s=String(raw||'').trim();
        if(!s)return [];
        try{
          var j=JSON.parse(s);
          if(Array.isArray(j))return parseItemOptions(j);
        }catch(_){}
        return s.split(/\r?\n|,/).map(function(x){return String(x||'').replace(/^[^:：]+[:：]\s*/,'').trim();}).filter(Boolean);
      };
      var isVillage=App.admin._getDeliveryCategoryType()==='village';
      var customerAddress=isVillage?String(o&&o.note||'').trim():'';
      var orderDetail=isVillage?String(o&&o.customer_note||'').trim():String(o&&o.note||'').trim();
      var orderDetailExtra=isVillage?'':String(o&&o.customer_note||'').trim();
      var noFrame=!!App.admin._printPdfNoFrame;
      if(tab==='receipt'){
        var sizeVal=mode==='batch'?App.admin._resolvePaperSize('bp-paper','bp-paper-custom','80mm'):App.admin._resolvePaperSize('ps-paper','ps-paper-custom','80mm');
        var orientation=App.admin._getOrientationByContext(mode,tab);
        var textScale=App.admin._getPrintTextScale(mode,tab);
        var lineScale=App.admin._getPrintLineHeightScale(mode,tab);
        var rc=App.admin._getReceiptCalibration(mode);
        var recSpec=App.admin._paperSizeToPageSpec(sizeVal,rc.scale,orientation);
        var pw=recSpec.previewWidth;
        var hasFixedSize=!!recSpec.isFixed;
        var fixedH=hasFixedSize?Math.round(parseFloat(recSpec.pageHeightMm||0)*100)/100:0;
        var fixedW=hasFixedSize?Math.round(parseFloat(recSpec.pageWidthMm||0)*100)/100:(parseFloat(String(pw).replace('mm',''))||80);
        var areaScale=hasFixedSize?Math.sqrt(Math.max(1,(fixedW*fixedH))/(80*120)):1;
        areaScale=Math.max(0.42,Math.min(1,areaScale));
        var basePxRaw=13*areaScale*textScale;
        var padVRaw=hasFixedSize?(12*areaScale*textScale):18;
        var padHRaw=hasFixedSize?(10*areaScale*textScale):16;
        var lineHeightBase=Math.max(1,Math.min(2,1.25*lineScale));
        var dateStr=App.admin._formatPrintDateTime(o&&o.created_at);
        var items=o.items||[];
        var payTxt=String(o&&o.payment_method||'').toLowerCase()==='cash'?'เก็บเงินปลายทาง':'สแกนจ่าย';
        var isCash=payTxt==='เก็บเงินปลายทาง';
        var showReceipt={
          payment:!!g('payment'),
          shopName:!!g('shop-name'),
          orderId:!!g('order-id'),
          datetime:!!g('datetime'),
          customer:!!g('customer'),
          dept:!!g(mode==='batch'?'dept-field':'dept'),
          items:!!g('items'),
          total:!!g('total'),
          address:!!g('address'),
          thankyou:!!g('thankyou'),
          qr:!!g('qr')
        };
        var autoFit=hasFixedSize?App.admin._estimateReceiptAutoFit({
          fixedH:fixedH,
          fixedW:fixedW,
          basePx:basePxRaw,
          lineHeight:lineHeightBase,
          padHpx:padHRaw,
          padVpx:padVRaw,
          order:o,
          show:showReceipt,
          customerAddress:customerAddress,
          orderDetail:orderDetail,
          orderDetailExtra:orderDetailExtra,
          parseItemOptions:parseItemOptions
        }):1;
        // PERF: auto-fit ลงทั้ง font + line-height เพื่อให้เนื้อหาอยู่ในกระดาษ
        var fs=function(v,min){var x=v*areaScale*textScale*autoFit;return Math.max(min||8,Math.round(x*10)/10);};
        var lineHeight=Math.max(1,Math.min(2,lineHeightBase*Math.max(0.88,autoFit)));
        var rPadV=hasFixedSize?Math.max(3,Math.round(padVRaw*autoFit*10)/10):18;
        var rPadH=hasFixedSize?Math.max(3,Math.round(padHRaw*autoFit*10)/10):16;
        var tyKey=mode==='batch'?'bp-thankyou-text':'ps-thankyou-text';
        var tyEl=document.getElementById(tyKey);var tyTxt=tyEl?tyEl.value:'ขอบคุณที่ใช้บริการ 🙏';
        var qrPx=Math.max(92,Math.min(148,Math.round((fixedW||parseFloat(String(pw).replace('mm',''))||80)*1.6)));
        var qrHtml=(showReceipt.qr&&isCash)?App.u.buildReceiptPromptPayQrHtml(parseFloat(o.total||0),{size:qrPx,title:'สแกนจ่ายผ่าน PromptPay',titleFontPx:Math.round(fs(12,8)),captionFontPx:Math.round(fs(10,7)),marginTopPx:Math.round(fs(4,1))}):'';
        var hStyle=hasFixedSize?('height:'+fixedH+'mm;'):'';
        var hDisplay=hasFixedSize?'display:flex;flex-direction:column;':'';
        var receiptFrame=noFrame?'border:none;border-radius:0;':'border:1px solid #111;border-radius:'+fs(8,4)+'px;';
        var html='<div class="rp-receipt" style="width:'+pw+';'+hStyle+hDisplay+'margin-left:'+rc.offsetX+'mm;margin-top:'+rc.offsetY+'mm;font-family:\'Prompt\',monospace;font-size:'+fs(13,8)+'px;line-height:'+lineHeight+';background:#fff;padding:'+rPadV+'px '+rPadH+'px;'+receiptFrame+'color:#111;margin-bottom:'+fs(8,3)+'px;overflow:hidden">';
        if(showReceipt.payment)html+='<div style="text-align:center;font-size:'+(isCash?fs(20,11):fs(13,9))+'px;font-weight:'+(isCash?'800':'600')+';color:#111;margin-bottom:'+fs(2,1)+'px">'+payTxt+'</div>';
        if(showReceipt.shopName)html+='<div style="text-align:center;font-size:'+fs(17,10)+'px;font-weight:700;margin-bottom:'+fs(1,0.5)+'px">'+shopName+'</div>';
        if(showReceipt.orderId)html+='<div style="text-align:center;font-size:'+fs(11,8)+'px;color:#444;margin-bottom:'+fs(8,3)+'px">ออเดอร์: #'+String(o.id||'').slice(-8)+'</div>';
        html+='<div style="border-top:1.2px dashed #666;margin:'+fs(8,3)+'px 0"></div>';
        if(showReceipt.datetime)html+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:'+fs(6,2)+'px;margin-bottom:'+fs(3,1)+'px"><span style="color:#444;flex-shrink:0">วันที่</span><span style="white-space:nowrap;text-align:right;display:inline-block">'+dateStr+'</span></div>';
        if(showReceipt.customer)html+='<div style="display:flex;justify-content:space-between;margin-bottom:'+fs(3,1)+'px"><span style="color:#444">ชื่อ</span><span>'+String(o.customer||'-')+'</span></div>';
        var deptKey=mode==='batch'?'bp-dept-field':'ps-dept';
        if(showReceipt.dept&&o.department)html+='<div style="display:flex;justify-content:space-between;margin-bottom:'+fs(3,1)+'px"><span style="color:#444">'+App.admin._deptLabel()+'</span><span>'+String(o.department)+'</span></div>';
        if(showReceipt.address&&customerAddress)html+='<div style="margin-bottom:'+fs(3,1)+'px"><div style="color:#444;margin-bottom:'+fs(1,0.5)+'px">ที่อยู่ลูกค้า</div><div style="text-align:left;white-space:pre-wrap;word-break:break-word">'+customerAddress+'</div></div>';
        if(showReceipt.address&&orderDetail)html+='<div style="margin-bottom:'+fs(3,1)+'px"><div style="color:#444;margin-bottom:'+fs(1,0.5)+'px">รายละเอียดการสั่ง</div><div style="text-align:left;white-space:pre-wrap;word-break:break-word">'+orderDetail+'</div></div>';
        if(showReceipt.address&&orderDetailExtra)html+='<div style="margin-bottom:'+fs(3,1)+'px"><div style="color:#444;margin-bottom:'+fs(1,0.5)+'px">หมายเหตุเพิ่มเติม</div><div style="text-align:left;white-space:pre-wrap;word-break:break-word">'+orderDetailExtra+'</div></div>';
        if(showReceipt.items&&items.length){
          html+='<div style="border-top:1.2px dashed #666;margin:'+fs(8,3)+'px 0"></div>';
          items.forEach(function(it){
            var pr=parseFloat(it.price||0),qty=parseInt(it.qty||1);
            var labels=parseItemOptions(it&&it.options);
            html+='<div style="display:flex;justify-content:space-between;margin-bottom:'+fs(2,1)+'px"><span style="flex:1">'+String(it.name||'')+(qty>1?' ×'+qty:'')+'</span><span style="font-weight:600;margin-left:'+fs(8,3)+'px">฿'+Math.round(pr*qty).toLocaleString('th-TH')+'</span></div>';
            if(labels.length){
              html+='<div style="font-size:'+fs(11,7)+'px;color:#444;margin-bottom:'+fs(4,1)+'px;padding-left:'+fs(8,3)+'px">• '+labels.join(', ')+'</div>';
            }
          });
        }
        if(showReceipt.total){html+='<div style="border-top:1.2px dashed #666;margin:'+fs(8,3)+'px 0"></div>';html+='<div style="display:flex;justify-content:space-between;font-size:'+fs(16,10)+'px;font-weight:700"><span>รวมทั้งหมด</span><span style="color:#111">฿'+Math.round(parseFloat(o.total||0)).toLocaleString('th-TH')+'</span></div>';}
        if(showReceipt.thankyou){html+='<div style="border-top:1.2px dashed #666;margin:'+fs(8,3)+'px 0"></div>';html+='<div style="text-align:center;color:#444;font-size:'+fs(12,8)+'px;margin-top:'+fs(4,1)+'px">'+tyTxt+'</div>';}
        if(qrHtml){html+='<div style="border-top:1.2px dashed #666;margin:'+fs(8,3)+'px 0"></div>'+qrHtml;}
        html+='</div>';
        return html;
      } else {
        // sticker
        var sizeVal=mode==='batch'?App.admin._resolveStickerSize('bs-size','bs-size-custom','100x70'):App.admin._resolveStickerSize('ss-size','ss-size-custom','100x70');
        var orientation=App.admin._getOrientationByContext(mode,tab);
        var textScale2=App.admin._getPrintTextScale(mode,tab);
        var lineScale2=App.admin._getPrintLineHeightScale(mode,tab);
        var stEl=document.getElementById(mode==='batch'?'bs-style':'ss-style');
        var sStyle=stEl?stEl.value:'minimal';
        if(sStyle==='clean')sStyle='minimal';
        var cal=App.admin._getStickerCalibration(mode);
        var sp=sizeVal.split('x');
        var wMm=parseFloat(sp[0]||100);
        var hMm=parseFloat(sp[1]||70);
        if(orientation==='landscape'){var tmp=wMm;wMm=hMm;hMm=tmp;}
        var sw=(Math.round((wMm*cal.scale)*100)/100)+'mm';
        var sh2=(Math.round((hMm*cal.scale)*100)/100)+'mm';
        var scale=Math.sqrt((Math.max(1,wMm)*Math.max(1,hMm))/(100*70));
        scale=Math.max(0.55,Math.min(1.8,scale));
        var basePxRaw2=13*scale*textScale2;
        var padVRaw2=12*scale*textScale2;
        var padHRaw2=14*scale*textScale2;
        var showSticker={
          payment:!!g('payment'),
          shopName:!!g('shop-name'),
          customer:!!g('customer'),
          dept:!!g(mode==='batch'?'dept-field':'dept'),
          orderId:!!g('order-id'),
          items:!!g('items'),
          total:!!g('total'),
          address:!!g('address')
        };
        var lineHeightBase2=Math.max(1,Math.min(2,1.2*lineScale2));
        var autoFit2=App.admin._estimateStickerAutoFit({
          hMm:(hMm*cal.scale),
          wMm:(wMm*cal.scale),
          basePx:basePxRaw2,
          lineHeight:lineHeightBase2,
          padHpx:padHRaw2,
          padVpx:padVRaw2,
          order:o,
          show:showSticker,
          customerAddress:customerAddress,
          orderDetail:orderDetail,
          orderDetailExtra:orderDetailExtra,
          parseItemOptions:parseItemOptions
        });
        var fs=function(n,min){var v=n*scale*textScale2*autoFit2;return Math.max(min||8,Math.round(v*10)/10);};
        var lineHeight2=Math.max(1,Math.min(2,lineHeightBase2*Math.max(0.86,autoFit2)));
        var items2=o.items||[];
        var payTxt2=String(o&&o.payment_method||'').toLowerCase()==='cash'?'เก็บเงินปลายทาง':'สแกนจ่าย';
        var isCash2=payTxt2==='เก็บเงินปลายทาง';
        var isBold=sStyle==='bold';var isMinimal=sStyle==='minimal';
        var bgColor='#fff';
        var txColor='#111';
        var subColor='#333';
        var borderStyle=noFrame?'none':(isBold?'2px solid #111':'1.2px solid #111');
        var radiusStyle=noFrame?'0':(fs(10,6)+'px');
        var html2='<div class="rp-sticker" style="width:'+sw+';height:'+sh2+';margin-left:'+cal.offsetX+'mm;margin-top:'+cal.offsetY+'mm;font-family:\'Prompt\',sans-serif;line-height:'+lineHeight2+';background:'+bgColor+';border:'+borderStyle+';border-radius:'+radiusStyle+';padding:'+Math.max(5,Math.round(padVRaw2*autoFit2*10)/10)+'px '+Math.max(6,Math.round(padHRaw2*autoFit2*10)/10)+'px;color:'+txColor+';overflow:hidden;display:inline-block;vertical-align:top">';
        if(showSticker.payment)html2+='<div style="font-size:'+fs(isCash2?15:8,8)+'px;font-weight:'+(isCash2?'800':'600')+';color:'+txColor+';margin-bottom:'+fs(6,3)+'px">'+payTxt2+'</div>';
        if(showSticker.shopName)html2+='<div style="font-size:'+fs(isBold?13.5:11.5,8)+'px;font-weight:'+(isBold?'800':'700')+';'+(isMinimal?'border-bottom:1px solid '+txColor+';padding-bottom:'+fs(4,2)+'px;margin-bottom:'+fs(6,3)+'px':'margin-bottom:'+fs(4,2)+'px')+'">'+shopName+'</div>';
        if(showSticker.customer)html2+='<div style="font-size:'+fs(isBold?22:18,10)+'px;font-weight:'+(isBold?'900':'700')+';line-height:1.2;margin-bottom:'+fs(3,2)+'px">'+String(o.customer||'-')+'</div>';
        if(showSticker.dept&&o.department)html2+='<div style="font-size:'+fs(12,8)+'px;font-weight:500;color:'+subColor+';margin-bottom:'+fs(4,2)+'px">🏢 '+String(o.department)+'</div>';
        if(showSticker.orderId)html2+='<div style="font-size:'+fs(10,7)+'px;color:'+subColor+';margin-bottom:'+fs(6,3)+'px">#'+String(o.id||'').slice(-8)+'</div>';
        if(showSticker.items&&items2.length){
          html2+='<div style="border-top:1px dashed '+subColor+';margin:'+fs(4,2)+'px 0 '+fs(6,3)+'px"></div>';
          items2.slice(0,5).forEach(function(it){
            var q2=parseInt(it.qty||1);
            var labels2=parseItemOptions(it&&it.options);
            html2+='<div style="font-size:'+fs(isBold?14:13,8)+'px;margin-bottom:'+fs(2,1)+'px;display:flex;justify-content:space-between"><span>'+String(it.name||'')+'</span>'+(q2>1?'<span style="font-weight:700;color:'+txColor+'">×'+q2+'</span>':'')+'</div>';
            if(labels2.length){
              html2+='<div style="font-size:'+fs(11,7)+'px;color:'+subColor+';margin-bottom:'+fs(3,1)+'px;padding-left:'+fs(6,3)+'px">• '+labels2.join(', ')+'</div>';
            }
          });
          if(items2.length>5)html2+='<div style="font-size:'+fs(11,7)+'px;color:'+subColor+'">+อีก '+(items2.length-5)+' รายการ</div>';
        }
        if(showSticker.address&&customerAddress)html2+='<div style="font-size:'+fs(11,7)+'px;margin-top:'+fs(6,3)+'px;padding:'+fs(4,2)+'px '+fs(6,3)+'px;border:1px dashed #999;border-radius:'+fs(4,2)+'px;background:transparent">📍 ที่อยู่ลูกค้า: '+customerAddress+'</div>';
        if(showSticker.address&&orderDetail)html2+='<div style="font-size:'+fs(11,7)+'px;margin-top:'+fs(6,3)+'px;padding:'+fs(4,2)+'px '+fs(6,3)+'px;border:1px dashed #999;border-radius:'+fs(4,2)+'px;background:transparent">📝 รายละเอียดการสั่ง: '+orderDetail+'</div>';
        if(showSticker.address&&orderDetailExtra)html2+='<div style="font-size:'+fs(11,7)+'px;margin-top:'+fs(6,3)+'px;padding:'+fs(4,2)+'px '+fs(6,3)+'px;border:1px dashed #999;border-radius:'+fs(4,2)+'px;background:transparent">📝 หมายเหตุเพิ่มเติม: '+orderDetailExtra+'</div>';
        if(showSticker.total)html2+='<div style="margin-top:'+fs(8,4)+'px;font-size:'+fs(isBold?18:9,9)+'px;font-weight:700;color:'+txColor+'">฿'+Math.round(parseFloat(o.total||0)).toLocaleString('th-TH')+'</div>';
        html2+='</div>';
        return html2;
      }
    },

    openSidebar(){var s=document.getElementById('admin-sidebar'),o=document.getElementById('sidebar-overlay');if(s)s.classList.add('open');if(o)o.classList.add('active');},
    closeSidebar(){var s=document.getElementById('admin-sidebar'),o=document.getElementById('sidebar-overlay');if(s)s.classList.remove('open');if(o)o.classList.remove('active');}
  },

  init:function(){
    var isAdmin=(window._isAdmin===true);
    App.state._deliveryCategoryType=App.admin._normalizeDeliveryType(window._deliveryCategoryType||App.state._deliveryCategoryType||'village');
    App.state._deliveryNoteMode=(App.state._deliveryCategoryType==='village'?'address':'note');
    App.state._cashPaymentEnabled=(window._cashPaymentEnabled===true);
    App.state._promptpayEnabled=(window._promptpayEnabled!==false);
    App.customer._setPaymentTimeout(window._payTimeout);
    App.customer.applyOrderInfoLabels();
    App.customer.applyPaymentMethodUI();
    // show restaurant brand
    App.customer.applyBrand(window._restaurantName||'FoodOrder',window._restaurantLogo||'');
    App.admin.applyAdminBrand(window._restaurantName||'FoodOrder',window._restaurantLogo||'');
    
    var ae=document.getElementById('admin-app'),ce=document.getElementById('customer-app');
    App.state._navigating=false;
    if(isAdmin){if(ae)ae.style.display='';if(ce)ce.style.display='none';App.admin.init();}
    else{
      if(ae)ae.style.display='none';if(ce)ce.style.display='';
      App.customer.restoreCartLocal();
      App.customer.applyShopAvailability({shop_open:window._shopOpen?'1':'0',shop_open_range:'{}'});
      App.customer.refreshShopAvailability();
      App.customer.startShopAvailabilityPoll();
      App.ui.nav('menu');
    }
  }
};

App.print={};

function toNum(v){var n=parseFloat(v);return isNaN(n)?0:n;}
document.addEventListener('DOMContentLoaded',function(){App.init();});


try{
  if(typeof window!=='undefined'&&!window.__notifyOrdersChangedFallbackPatched){
    window.__notifyOrdersChangedFallbackPatched=true;
    setTimeout(function(){
      try{
        if(window.App&&App.admin&&typeof App.admin.notifyOrdersChanged!=='function'){
          App.admin.notifyOrdersChanged=function(reason){
            if(App.admin&&typeof App.admin._refreshOrdersAfterMutation==='function'){
              App.admin._refreshOrdersAfterMutation({manual:true,reason:reason||''});
            }
          };
        }
      }catch(_){ }
    },0);
  }
}catch(_){ }





