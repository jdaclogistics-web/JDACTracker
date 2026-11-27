/* ===================== FORMS — shareable forms for anyone (Google-Forms style) =====================
   Tasks → Forms. Build a form (sections, short/long text, phone, email, number, date, dropdown,
   multiple choice, checkboxes, rating, yes/no), link it to a project, choose what each answer becomes
   (lead in CRM, task in the project, or just a response), share the link on WhatsApp, watch answers come in.
   Live: saved on the server and the link works for anyone. Prototype: kept on this device. */
const FM_T={text:['Short answer','T'],long:['Paragraph','¶'],phone:['Phone','☎'],email:['Email','@'],number:['Number','#'],date:['Date','📅'],choice:['Dropdown','▾'],radio:['Multiple choice','◉'],check:['Checkboxes','☑'],rating:['Rating 1–5','★'],yesno:['Yes / No','⇄'],section:['Section title','§']};
const FM_TPL={
 lead:{title:'Enquiry form',icon:'📦',becomes:'lead',desc:'Tell us what you want to send and we will call you back with the best rate.',fields:[['Your name','text',1],['Mobile number','phone',1],['City','text',1],['What do you want to send?','radio',1,'Documents\nParcel (up to 10 kg)\nHeavy cargo\nOffice / house shifting'],['Pickup date','date'],['Anything else?','long']]},
 join:{title:'New employee joining form',icon:'🧑‍💼',becomes:'entry',desc:'Welcome to JDAC! Please fill this before your first day.',fields:[['Personal details','section'],['Full name (as on Aadhaar)','text',1],['Mobile number','phone',1],['Email','email',1],['Date of birth','date',1],['Home address','long',1],['Work','section'],['Department','choice',1,'Operations\nCSE\nWarehouse\nMarketing\nAccounts\nHR'],['Joining date','date',1],['Bank & ID','section'],['Bank account holder name','text',1],['IFSC','text',1],['Emergency contact (name & number)','text',1]]},
 job:{title:'Job application',icon:'📝',becomes:'entry',desc:'Apply for open roles at JDAC.',fields:[['Full name','text',1],['Mobile number','phone',1],['Email','email'],['Role you are applying for','choice',1,'Customer Support Executive\nWarehouse Executive\nDelivery partner\nOperations\nGraphic designer'],['Years of experience','number'],['Current city','text',1],['Can you join within 15 days?','yesno',1],['Tell us about yourself','long']]},
 fb:{title:'Customer feedback',icon:'⭐',becomes:'entry',desc:'How did we do? It takes 30 seconds.',fields:[['Your name','text'],['How happy are you with JDAC?','rating',1],['What did you like?','check',0,'On-time pickup\nGood price\nPolite staff\nSafe delivery\nQuick replies'],['Would you recommend us?','yesno',1],['Anything we should improve?','long']]},
 blank:{title:'Untitled form',icon:'📝',becomes:'entry',desc:'',fields:[['Your name','text',1]]}};
const fmLive=()=>typeof LV!=='undefined'&&LV.ok&&typeof lapi==='function';
let FMS=null,FMA={};
async function fmLoad(force){if(!fmLive()){if(!D.formsX){D.formsX=[{id:'L1',slug:'enquiry',title:'Pune parcel enquiry',icon:'📦',becomes:'lead',status:'live',project_id:'',project_name:'',fields:fmMk(FM_TPL.lead.fields),meta:{desc:FM_TPL.lead.desc,color:'#24408E'},answers:3,last_at:TODAY+'T10:20'},{id:'L2',slug:'joining',title:'New employee joining form',icon:'🧑‍💼',becomes:'entry',status:'live',project_name:'HR',fields:fmMk(FM_TPL.join.fields),meta:{desc:FM_TPL.join.desc,color:'#7A2E8E'},answers:1,last_at:addD(TODAY,-2)+'T16:00'}];save()}FMS=D.formsX;return}
 if(FMS&&!force)return;try{FMS=(await lapi('GET','/api/forms')).forms||[]}catch(e){FMS=[];toast('Forms: '+e.message)}render()}
const fmMk=L=>L.map(([label,type,req,ops],i)=>({key:'q'+(i+1),label,type,required:!!req,options:ops?ops.split('\n'):undefined}));
const fmUrl=f=>{const b=location.href.split(/[?#]/)[0].replace(/[^/]*$/,'').replace(/parent\/$/,'');return b+'f/?n='+encodeURIComponent(f.slug)};
const fmAgo=a=>{if(!a)return 'no answers yet';const d=String(a).slice(0,10);return 'last '+(d===TODAY?'today '+String(a).slice(11,16):fmt(d))};
const FMB={lead:['→ Lead in CRM','#2563C9'],task:['→ Task in project','#C2410C'],entry:['Responses only','#667085']};
function fmView(){if(FMS==null){fmLoad();if(FMS==null)return '<div class="mempty">Loading forms…</div>'}
 const L=FMS.filter(f=>f.status!=='closed'),live=L.filter(f=>f.status==='live').length,ans=L.reduce((a,f)=>a+(+f.answers||0),0);
 const card=f=>`<div class="fmc" style="--c:${(f.meta||{}).color||'#24408E'}"><div class="fmc1" data-a="fmAns" data-id="${f.id}" role="button" tabindex="0"><i>${h(f.icon||'📝')}</i><div><b>${h(f.title)}</b><small>${(f.fields||[]).filter(x=>x.type!=='section').length} questions${f.project_name?' · '+h(f.project_name):''} · <span style="color:${FMB[f.becomes||'entry'][1]}">${FMB[f.becomes||'entry'][0]}</span></small></div><span class="fmn"><b>${+f.answers||0}</b><small>answers</small></span></div>
  <div class="fmc2"><span class="fmst ${f.status}">${f.status==='live'?'● Live':'Paused'}</span><small>${fmAgo(f.last_at)}</small><span class="sp"></span><button data-a="fmShare" data-id="${f.id}" aria-label="Share">${ic('share')}</button><button data-a="fmCopy" data-id="${f.id}" aria-label="Copy link">${ic('clip')}</button><button data-a="fmEdit" data-id="${f.id}" aria-label="Edit">${ic('edit')}</button><button data-a="fmMore" data-id="${f.id}" aria-label="More">⋯</button></div></div>`;
 return `<div class="fmtop"><div><b>${L.length}</b><span>forms</span></div><div><b>${live}</b><span>live</span></div><div><b>${ans}</b><span>answers</span></div></div>
 ${isAdm()?`<div class="fmnew"><b>Start a new form</b><div class="fmtpl">${[['blank','Blank','＋'],['lead','Enquiry / leads','📦'],['join','Employee joining','🧑‍💼'],['job','Job application','📝'],['fb','Feedback','⭐']].map(([k,l,i])=>`<button data-a="fmNew" data-t="${k}"><i>${i}</i><span>${l}</span></button>`).join('')}</div></div>`:''}
 <div class="msec">Your forms</div><div class="fml">${L.map(card).join('')||'<div class="mempty"><b>No forms yet</b><small>Start from a template above</small></div>'}</div>
 ${fmLive()?'':'<div class="xs mut" style="margin-top:10px">Prototype: forms are kept on this device. Sign in (live) for links anyone can open.</div>'}`}
/* share / copy / more */
const fmOf=id=>(FMS||[]).find(f=>String(f.id)===String(id));
A.fmCopy=e=>{const f=fmOf(e.dataset.id);try{navigator.clipboard.writeText(fmUrl(f));toast('Link copied')}catch(x){prompt('Copy link',fmUrl(f))}};
A.fmShare=async e=>{const f=fmOf(e.dataset.id),u=fmUrl(f),t=`${f.icon||''} ${f.title}\n${(f.meta||{}).desc||''}\n${u}`.trim();try{if(navigator.share)return await navigator.share({title:f.title,text:t})}catch(x){if(x&&x.name==='AbortError')return}window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank','noopener')};
A.fmMore=e=>{const f=fmOf(e.dataset.id);sheet(`<h2>${h(f.title)}</h2><div class="xs mut" style="word-break:break-all;margin-bottom:10px">${h(fmUrl(f))}</div><div class="list">
 <a class="li" href="${h(fmUrl(f))}" target="_blank" rel="noopener">${ic('eye')}<div class="tx"><b>Open / preview the form</b></div></a>
 <button class="li" data-a="fmAns" data-id="${f.id}">${ic('doc')}<div class="tx"><b>See answers (${+f.answers||0})</b></div></button>
 <button class="li" data-a="fmTog" data-id="${f.id}">${ic(f.status==='live'?'clock':'check')}<div class="tx"><b>${f.status==='live'?'Pause — stop taking answers':'Make live again'}</b></div></button>
 <button class="li" data-a="fmDup" data-id="${f.id}">${ic('plus')}<div class="tx"><b>Duplicate</b></div></button>
 <button class="li" data-a="fmDel" data-id="${f.id}" style="color:#D92D20">${ic('trash')}<div class="tx"><b>Delete form</b></div></button></div>`)};
async function fmPatch(f,b){if(fmLive()){try{await lapi('PATCH','/api/forms/'+f.id,b)}catch(x){return toast(x.message)}await fmLoad(1)}else{Object.assign(f,b);save();render()}}
A.fmTog=e=>{const f=fmOf(e.dataset.id);closeM();fmPatch(f,{status:f.status==='live'?'draft':'live'});toast(f.status==='live'?'Paused':'Live again')};
A.fmDel=e=>{const f=fmOf(e.dataset.id);if(!confirm('Delete "'+f.title+'"? Its link stops working.'))return;closeM();fmPatch(f,{status:'closed'});toast('Form deleted')};
A.fmDup=e=>{const f=fmOf(e.dataset.id);closeM();fmOpenB({...JSON.parse(JSON.stringify(f)),id:null,slug:null,title:f.title+' (copy)'})};
/* builder: full screen */
let FB=null;
A.fmNew=e=>{const t=FM_TPL[e.dataset.t]||FM_TPL.blank;fmOpenB({id:null,title:t.title,icon:t.icon,becomes:t.becomes,project_id:'',project_name:'',fields:fmMk(t.fields),meta:{desc:t.desc,thanks:'',color:'#24408E'},status:'live'})};
A.fmEdit=e=>fmOpenB(JSON.parse(JSON.stringify(fmOf(e.dataset.id))));
const FM_COL=['#24408E','#0B57D0','#1F9D55','#C2410C','#D92D20','#7A2E8E','#0796A6','#1D2939'];
function fmOpenB(f){FB=f;FB.meta=FB.meta||{};fmDraw()}
function fmDraw(){const f=FB;document.getElementById('fmb')&&document.getElementById('fmb').remove();
 const prj=(D.projects||[]).map(p=>`<option value="${p.id}" ${f.project_id===p.id?'selected':''}>${h(p.n)}</option>`).join('');
 const q=(x,i)=>`<div class="fbq ${x.type==='section'?'sec':''}" data-i="${i}"><div class="fbq1"><input class="fbl" data-i="${i}" value="${h(x.label)}" placeholder="${x.type==='section'?'Section title':'Question'}"><select class="fbt" data-i="${i}">${Object.entries(FM_T).map(([k,[n]])=>`<option value="${k}" ${x.type===k?'selected':''}>${n}</option>`).join('')}</select></div>
  ${['choice','radio','check'].includes(x.type)?`<textarea class="fbo" data-i="${i}" placeholder="One option per line">${h((x.options||[]).join('\n'))}</textarea>`:''}
  <input class="fbh" data-i="${i}" value="${h(x.help||'')}" placeholder="Hint for the person filling (optional)">
  <div class="fbq2">${x.type!=='section'?`<label><input type="checkbox" class="fbr" data-i="${i}" ${x.required?'checked':''}>Required</label>`:''}<span class="sp"></span><button data-a="fbMv" data-i="${i}" data-n="-1" aria-label="Move up">↑</button><button data-a="fbMv" data-i="${i}" data-n="1" aria-label="Move down">↓</button><button data-a="fbCp" data-i="${i}" aria-label="Copy">⧉</button><button data-a="fbRm" data-i="${i}" aria-label="Delete">${ic('trash')}</button></div></div>`;
 document.body.insertAdjacentHTML('beforeend',`<div id="fmb" class="fmb"><div class="fmbar"><button data-a="fbX" aria-label="Close">${ic('back')}</button><b>${f.id?'Edit form':'New form'}</b><span class="sp"></span><button class="fbsave" data-a="fbSave">${f.id?'Save':'Publish'}</button></div>
 <div class="fmbody"><div class="fbhead" style="border-top-color:${f.meta.color||'#24408E'}"><div class="row nw" style="gap:8px"><input id="fbi" class="fbicon" value="${h(f.icon||'📝')}" maxlength="4" aria-label="Icon"><input id="fbtt" class="fbtitle" value="${h(f.title)}" placeholder="Form title"></div>
  <textarea id="fbd" placeholder="Description — what is this form for?">${h(f.meta.desc||'')}</textarea>
  <div class="fbcols">${FM_COL.map(c=>`<button data-a="fbCol" data-c="${c}" style="background:${c}" class="${(f.meta.color||'#24408E')===c?'on':''}" aria-label="Colour"></button>`).join('')}</div></div>
 <div class="fbset"><label>Project<select id="fbp"><option value="">— none —</option>${prj}</select></label><label>Each answer becomes<select id="fbbe">${Object.entries(FMB).map(([k,[n]])=>`<option value="${k}" ${f.becomes===k?'selected':''}>${n.replace('→ ','')}</option>`).join('')}</select></label><label class="full">Thank-you message<input id="fbth" value="${h(f.meta.thanks||'')}" placeholder="Thank you! We will contact you soon."></label></div>
 <div id="fbqs">${f.fields.map(q).join('')}</div>
 <div class="fbadd"><b>Add</b><div>${Object.entries(FM_T).map(([k,[n,i]])=>`<button data-a="fbAdd" data-t="${k}"><i>${i}</i>${n}</button>`).join('')}</div></div></div></div>`);
 const B=document.getElementById('fmb');B.addEventListener('input',fbSync);B.addEventListener('change',e=>{fbSync();if(e.target.classList.contains('fbt'))fmDraw()})}
function fbSync(){const B=document.getElementById('fmb');if(!B||!FB)return;const v=id=>(B.querySelector('#'+id)||{}).value;
 FB.icon=v('fbi')||'📝';FB.title=v('fbtt');FB.meta.desc=v('fbd');FB.meta.thanks=v('fbth');FB.becomes=v('fbbe');FB.project_id=v('fbp')||'';FB.project_name=((D.projects||[]).find(p=>p.id===FB.project_id)||{}).n||'';
 B.querySelectorAll('.fbl').forEach(x=>FB.fields[+x.dataset.i].label=x.value);B.querySelectorAll('.fbt').forEach(x=>FB.fields[+x.dataset.i].type=x.value);
 B.querySelectorAll('.fbo').forEach(x=>FB.fields[+x.dataset.i].options=x.value.split('\n').map(s=>s.trim()).filter(Boolean));B.querySelectorAll('.fbh').forEach(x=>FB.fields[+x.dataset.i].help=x.value);
 B.querySelectorAll('.fbr').forEach(x=>FB.fields[+x.dataset.i].required=x.checked)}
A.fbX=()=>{if(confirm('Close without saving?')){document.getElementById('fmb').remove();FB=null}};
A.fbCol=e=>{fbSync();FB.meta.color=e.dataset.c;fmDraw()};
A.fbAdd=e=>{fbSync();const t=e.dataset.t;FB.fields.push({key:'q'+Date.now().toString(36),label:'',type:t,required:false,options:['choice','radio','check'].includes(t)?['Option 1','Option 2']:undefined});fmDraw();const qs=document.querySelectorAll('.fbl');const l=qs[qs.length-1];if(l){l.scrollIntoView({block:'center'});l.focus()}};
A.fbRm=e=>{fbSync();FB.fields.splice(+e.dataset.i,1);fmDraw()};A.fbCp=e=>{fbSync();const i=+e.dataset.i;FB.fields.splice(i+1,0,{...JSON.parse(JSON.stringify(FB.fields[i])),key:'q'+Date.now().toString(36)});fmDraw()};
A.fbMv=e=>{fbSync();const i=+e.dataset.i,j=i+ +e.dataset.n;if(j<0||j>=FB.fields.length)return;[FB.fields[i],FB.fields[j]]=[FB.fields[j],FB.fields[i]];fmDraw()};
A.fbSave=async()=>{fbSync();const f=FB;if(!f.title)return toast('Give the form a title');f.fields=f.fields.filter(x=>x.label.trim());if(!f.fields.some(x=>x.type!=='section'))return toast('Add at least one question');
 const b={title:f.title,icon:f.icon,desc:f.meta.desc,thanks:f.meta.thanks,color:f.meta.color,becomes:f.becomes,project_id:f.project_id,project_name:f.project_name,fields:f.fields};
 if(fmLive()){try{if(f.id)await lapi('PATCH','/api/forms/'+f.id,b);else{const r=await lapi('POST','/api/forms',b);f.slug=r.slug}}catch(x){return toast(x.message)}document.getElementById('fmb').remove();FB=null;await fmLoad(1)}
 else{if(f.id){Object.assign(fmOf(f.id),f)}else{f.id='L'+Date.now().toString(36);f.slug=(f.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'form');f.answers=0;f.status='live';D.formsX.unshift(f)}save();document.getElementById('fmb').remove();FB=null;render()}
 toast(f.id?'Form saved':'Form published · tap share to send the link')};
/* answers */
A.fmAns=async e=>{const f=fmOf(e.dataset.id);closeM();let A0=FMA[f.id];if(!A0){if(fmLive()){try{A0=(await lapi('GET','/api/forms/'+f.id+'/answers')).answers}catch(x){return toast(x.message)}}else A0=[{id:1,created_at:TODAY+'T10:20',data:{'Your name':'Ramesh','Mobile number':'9876500011','City':'Pune','What do you want to send?':'Parcel (up to 10 kg)'}}].slice(0,+f.answers?1:0);FMA[f.id]=A0}
 const keys=[...new Set(A0.flatMap(a=>Object.keys(a.data||{})))];
 sheet(`<div class="fma"><h2>${h(f.icon||'')} ${h(f.title)}</h2><div class="row" style="gap:6px;margin:4px 0 10px"><span class="pill">${A0.length} answers</span><span class="pill">${FMB[f.becomes||'entry'][0]}</span><span class="sp"></span>${A0.length?`<button class="btn sm sec" data-a="fmCsv" data-id="${f.id}">${ic('dl')}CSV</button>`:''}<button class="btn sm sec" data-a="fmShare" data-id="${f.id}">${ic('share')}Share</button></div>
 ${A0.map(a=>{const d=a.data||{},nm0=Object.entries(d).find(([k])=>/name/i.test(k)),ph=Object.entries(d).find(([k,v])=>/phone|mobile/i.test(k)&&v);return `<div class="fmr"><div class="fmr1"><b>${h(nm0?nm0[1]:'Answer #'+a.id)}</b><small>${h(String(a.created_at||'').replace('T',' ').slice(0,16))}</small></div>${Object.entries(d).filter(([k,v])=>v&&(!nm0||k!==nm0[0])).map(([k,v])=>`<div class="fmr2"><span>${h(k)}</span><b>${h(v)}</b></div>`).join('')}
  <div class="fmr3">${ph?`<a class="btn sm sec" href="tel:${h(String(ph[1]).replace(/\D/g,''))}">${ic('phone')}Call</a><a class="btn sm sec" href="https://wa.me/91${h(String(ph[1]).replace(/\D/g,'').slice(-10))}" target="_blank" rel="noopener">${ic('chat')}WhatsApp</a>`:''}<button class="btn sm sec" data-a="fmTask" data-id="${f.id}" data-r="${a.id}">${ic('task')}Make task</button>${a.result?`<span class="xs mut">${h(a.result.split(':')[0])} created</span>`:''}</div></div>`}).join('')||'<div class="mempty"><b>No answers yet</b><small>Share the link to start collecting</small></div>'}</div>`)};
A.fmTask=e=>{const f=fmOf(e.dataset.id),a=(FMA[f.id]||[]).find(x=>String(x.id)===e.dataset.r);if(!a)return;const d=a.data||{},nm0=Object.entries(d).find(([k])=>/name/i.test(k));
 const t={id:nid('k'),t:`${f.title}: ${nm0?nm0[1]:'answer'}`,o:S.me,by:S.me,proj:f.project_id||((D.projects||[])[0]||{}).id,due:addD(TODAY,1),st:'To do',pri:'Normal',type:'One-time',tags:['Form'],desc:Object.entries(d).map(([k,v])=>k+': '+v).join('\n'),check:[]};D.tasks.unshift(t);save();toast('Task created in '+(((D.projects||[]).find(p=>p.id===t.proj)||{}).n||'tasks'))};
A.fmCsv=e=>{const f=fmOf(e.dataset.id),A0=FMA[f.id]||[],K=[...new Set(A0.flatMap(a=>Object.keys(a.data||{})))],q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
 const csv=[['Submitted',...K].map(q).join(','),...A0.map(a=>[a.created_at,...K.map(k=>(a.data||{})[k])].map(q).join(','))].join('\n'),u=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'})),l=document.createElement('a');l.href=u;l.download=f.title.replace(/[^\w ]+/g,'')+'.csv';l.click()};
/* Forms tab (web and phone) */
const _vTasksF2=V.tasks;V.tasks=()=>{if(S.ttab!=='forms')return _vTasksF2();if(isMob())return mtTabs()+fmView();return taskHead(P[S.me]||{n:nmF(S.me)})+fmView()};
const _rF2=render;render=function(){_rF2.apply(this,arguments);if(FB&&!document.getElementById('fmb'))fmDraw()};
document.head.insertAdjacentHTML('beforeend',`<style>
.fmtop{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px}.fmtop div{background:#fff;border-radius:14px;padding:10px;text-align:center;box-shadow:0 1px 2px rgba(16,24,40,.05)}.fmtop b{display:block;font-size:22px;color:var(--navy)}.fmtop span{font-size:11.5px;color:var(--mut);font-weight:700}
.fmnew{background:#fff;border-radius:16px;padding:12px;margin:0 0 12px;box-shadow:0 1px 2px rgba(16,24,40,.05)}.fmnew>b{font-size:14px}
.fmtpl{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin-top:10px;padding-bottom:2px}.fmtpl::-webkit-scrollbar{display:none}
.fmtpl button{flex:none;width:96px;border:1px solid var(--line);background:#fff;border-radius:14px;padding:12px 6px;font:inherit;font-size:12px;font-weight:700;color:#344054;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}.fmtpl i{font-style:normal;font-size:24px}.fmtpl button:first-child{border-style:dashed;color:var(--navy)}
.fml{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px}
.fmc{background:#fff;border-radius:16px;box-shadow:0 1px 2px rgba(16,24,40,.05);overflow:hidden;border-top:4px solid var(--c)}
.fmc1{display:flex;align-items:center;gap:12px;padding:12px 12px 8px;cursor:pointer}.fmc1>i{font-style:normal;font-size:24px;width:44px;height:44px;border-radius:12px;background:#F2F4F7;display:grid;place-items:center;flex:none}
.fmc1>div{flex:1;min-width:0}.fmc1 b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fmc1 small{font-size:12px;color:var(--mut)}.fmn{text-align:center}.fmn b{display:block;font-size:20px;color:var(--c)}.fmn small{font-size:10.5px;color:var(--mut)}
.fmc2{display:flex;align-items:center;gap:8px;padding:6px 8px 8px 12px;border-top:1px solid #F2F4F7}.fmc2 small{font-size:11.5px;color:var(--mut)}.fmc2 button{border:0;background:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#475467;cursor:pointer;font-size:18px}.fmc2 button svg{width:18px;height:18px}
.fmst{font-size:11.5px;font-weight:800;color:#667085}.fmst.live{color:#1F9D55}
.fmb{position:fixed;inset:0;z-index:95;background:#F0EBF8;display:flex;flex-direction:column}.fmbar{display:flex;align-items:center;gap:6px;background:#fff;padding:calc(6px + env(safe-area-inset-top)) 8px 6px;box-shadow:0 1px 3px rgba(16,24,40,.08)}
.fmbar>button{border:0;background:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;cursor:pointer}.fmbar svg{width:22px;height:22px}.fmbar .fbsave{width:auto;border-radius:999px;background:var(--navy);color:#fff;padding:0 18px;font:inherit;font-weight:800;height:38px}
.fmbody{flex:1;overflow-y:auto;padding:12px;max-width:760px;width:100%;margin:0 auto;box-sizing:border-box;padding-bottom:40px}
.fbhead,.fbq,.fbset,.fbadd{background:#fff;border-radius:14px;padding:14px;margin-bottom:10px}.fbhead{border-top:8px solid}
.fbicon{width:52px!important;text-align:center;font-size:22px;padding:6px!important}.fbtitle{flex:1;font-size:20px!important;font-weight:700;border:0!important;border-bottom:1.5px solid var(--line)!important;border-radius:0!important;padding:8px 2px!important}
.fbhead textarea{width:100%;margin-top:10px;min-height:60px;border:0;border-bottom:1.5px solid var(--line);border-radius:0;resize:vertical;font:inherit;padding:6px 2px}
.fbcols{display:flex;gap:8px;margin-top:10px}.fbcols button{width:26px;height:26px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--line);cursor:pointer}.fbcols button.on{box-shadow:0 0 0 2px #101828}
.fbset{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fbset label{font-size:12px;font-weight:700;color:#475467;display:flex;flex-direction:column;gap:4px}.fbset .full{grid-column:1/-1}
.fbq{border-left:4px solid var(--navy)}.fbq.sec{border-left-color:#C2410C;background:#FFF8F3}
.fbq1{display:flex;gap:8px}.fbl{flex:1;font-weight:600}.fbt{width:150px!important;flex:none}.fbo{width:100%;min-height:70px;margin-top:8px}.fbh{width:100%;margin-top:8px;font-size:13px!important}
.fbq2{display:flex;align-items:center;gap:4px;margin-top:8px}.fbq2 label{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600}.fbq2 button{border:0;background:#F2F4F7;width:34px;height:34px;border-radius:10px;cursor:pointer;display:grid;place-items:center}.fbq2 svg{width:16px;height:16px}
.fbadd div{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.fbadd button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 12px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;display:inline-flex;gap:6px;align-items:center}.fbadd i{font-style:normal;color:var(--navy);font-weight:800}
.fmr{border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:8px}.fmr1{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}.fmr1 small{color:var(--mut);font-size:12px}
.fmr2{display:flex;gap:10px;font-size:13px;padding:3px 0;border-top:1px dashed #F2F4F7}.fmr2 span{color:var(--mut);flex:0 0 42%}.fmr2 b{font-weight:600;word-break:break-word}.fmr3{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center}
@media(max-width:820px){.fml{grid-template-columns:1fr}.fbset{grid-template-columns:1fr}.fbt{width:118px!important}}
</style>`);
