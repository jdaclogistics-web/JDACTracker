/* ===== Performance marketing · Ads Manager (Meta first, Google next) — phone-first, also works on web.
   Company → campaigns → ad sets → ads → creatives, with funnel, spend trend, results, cost per result and next-step advice.
   Data: ADS snapshot (madsd.js) pulled by Claude from the Meta Ads connector; campaigns can be re-tagged to any company. ===== */
const AD_CO={log:['JDAC Logistics','#02496A'],gb:['GovaaBazaar','#7A4A26'],hr:['JDAC HR Consultancy','#6E0F7A'],jup:['Jupiter Equipment','#137A50'],bah:['Bahiram Thali','#B54708'],rb:['Retailer Bazaar','#2563C9'],studios:['JDAC Studios','#0796A6']};
const AD_RT={msg:['Chats started','chat'],lead:['Leads','lead'],otp:['Sign-ups (OTP)','sign-up'],pur:['Purchases','purchase']};
const AD_HIRE=/hiring|\bcse[_ |]|warehouse_|\bhr\b/i;
const adTag=(c,acc)=>(D.adTag||{})[c[0]]||(acc==='log'&&AD_HIRE.test(c[1])?'hr':acc);
const adNum=n=>n>=1e7?(n/1e7).toFixed(1)+'Cr':n>=1e5?(n/1e5).toFixed(1)+'L':n>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n));
const adInr=n=>'₹'+(n>=1e5?(n/1e5).toFixed(2)+'L':Math.round(n).toLocaleString('en-IN'));
const adPer=()=>S.adP||'m';
/* campaign row → object for the chosen period */
function adCamp(r,acc){const[id,n,st,obj,bud,sp,im,re,cl,lpv,res,rt,cpr,lead,msg,pur,atc,ic,pv,fq,p7,py]=r,p=adPer();
 const base={id,n,st,obj,bud,rt,acc,co:adTag(r,acc),fq,re,lpv,lead,msg,pur,atc,ic,pv};
 if(p==='w')return {...base,sp:p7[0],im:p7[1],cl:p7[2],res:p7[3]};if(p==='y')return {...base,sp:py[0],im:py[1],cl:py[2],res:py[3]};return {...base,sp,im,cl,res}}
function adCamps(co){const L=[];ADS.acc.forEach(a=>(ADS.C[a.k]||[]).forEach(r=>{const c=adCamp(r,a.k);if(!co||co==='all'||c.co===co)L.push(c)}));return L}
const adSets=cid=>Object.entries(ADS.S).flatMap(([k,L])=>L.filter(s=>s[1]===cid).map(s=>({id:s[0],c:s[1],n:s[2],st:s[3],opt:s[4],bud:s[5],sp:s[6],im:s[7],cl:s[8],res:s[9],cpr:s[10],fq:s[11],acc:k})));
const adAds=f=>Object.entries(ADS.A).flatMap(([k,L])=>L.map(a=>({id:a[0],c:a[1],s:a[2],n:a[3],st:a[4],cr:a[5],sp:a[6],im:a[7],cl:a[8],res:a[9],cpr:a[10],atc:a[11]||0,ic:a[12]||0,acc:k}))).filter(f);
const adCpr=x=>x.res?x.sp/x.res:0,adCtr=x=>x.im?x.cl/x.im*100:0,adCpm=x=>x.im?x.sp/x.im*1000:0;
const adStD=st=>st==='A'?['Active','#1F9D55']:st==='X'?['Rejected','#D92D20']:['Paused','#98A2B3'];
const adSum=L=>L.reduce((a,c)=>({sp:a.sp+c.sp,im:a.im+c.im,cl:a.cl+c.cl,res:a.res+c.res}),{sp:0,im:0,cl:0,res:0});
const adAccOf=co=>ADS.acc.find(a=>a.k===co);
const adLink=(acc,lvl,id)=>{const a=ADS.acc.find(x=>x.k===acc);return a?`https://adsmanager.facebook.com/adsmanager/manage/${lvl}?act=${a.id}&selected_${lvl==='campaigns'?'campaign':lvl==='adsets'?'adset':'ad'}_ids=${id}`:'#'};

/* advice an experienced media buyer would give, from the numbers */
function adAdvice(L,ads){const T=[],byRt={};L.forEach(c=>{(byRt[c.rt]=byRt[c.rt]||[]).push(c)});
 Object.entries(byRt).forEach(([rt,C])=>{const s=adSum(C),avg=s.res?s.sp/s.res:0,lab=AD_RT[rt][0].toLowerCase();if(!avg)return;
  C.filter(c=>c.st==='A'&&c.res>=10&&adCpr(c)<avg*.75).slice(0,2).forEach(c=>T.push(['up',`Scale ${c.n}`,`${adInr(adCpr(c))} per ${AD_RT[rt][1]} vs ${adInr(avg)} average. Raise budget 20% every 3 days while cost holds.`,c.id]));
  C.filter(c=>c.st==='A'&&c.sp>avg*3&&adCpr(c)>avg*1.4).slice(0,2).forEach(c=>T.push(['down',`Fix or cut ${c.n}`,`${c.res?adInr(adCpr(c))+' per '+AD_RT[rt][1]:'No '+lab+' yet'} — ${c.res?Math.round(adCpr(c)/avg*100-100)+'% costlier than':'spent '+adInr(c.sp)+' vs'} the ${adInr(avg)} average. New hook or tighter audience.`,c.id]))});
 L.filter(c=>c.st==='A'&&c.fq>=2.3).slice(0,2).forEach(c=>T.push(['warn',`Ad fatigue · ${c.n}`,`Same people see it ${c.fq.toFixed(1)}× on average. Add 2–3 fresh creatives or widen the audience.`,c.id]));
 ads.filter(a=>a.st==='X').forEach(a=>T.push(['warn',`Ad rejected · ${a.n}`,'Meta disapproved this ad. Edit text/image to policy and resubmit, or switch it off.','']));
 const gb=L.filter(c=>c.rt==='pur');if(gb.length){const s=gb.reduce((a,c)=>({atc:a.atc+c.atc,ic:a.ic+c.ic,pur:a.pur+c.pur}),{atc:0,ic:0,pur:0});if(s.ic&&s.pur/s.ic<.25)T.push(['warn','People drop at payment',`${s.ic} checkouts → ${s.pur} purchases (${Math.round(s.pur/s.ic*100)}%). Normal is 35–50%. Check Razorpay/UPI step, COD option and a WhatsApp follow-up for abandoned carts.`,''])}
 return T.slice(0,6)}

/* ---------- views ---------- */
function adsView(){const co=S.adCo||(S.stC&&AD_CO[S.stC]?S.stC:'all'),p=adPer(),L=adCamps(co).filter(c=>c.sp>0||adPer()==='m'),lvl=S.adL||'camp';
 const s=adSum(L),rts=[...new Set(L.map(c=>c.rt))],cur=AD_CO[co]||['All companies','#14213D'];
 const accs=co==='all'?ADS.acc:ADS.acc.filter(a=>adCamps(co).some(c=>c.acc===a.k));
 const day=ADS.dates.map((d,i)=>accs.reduce((a,x)=>a+((x.day[i]||[])[0]||0),0)),mx=Math.max(1,...day),last7=day.slice(-7).reduce((a,b)=>a+b,0),prev7=day.slice(-14,-7).reduce((a,b)=>a+b,0);
 const head=`<div class="ad-top"><button class="ad-acc" data-a="adCoPick"><span class="ad-av" style="background:${cur[1]}">${h(ini(cur[0]))}</span><span class="ad-an"><b>${h(cur[0])}</b><small>${co==='all'?ADS.acc.length+' ad accounts · Meta':accs.map(a=>a.sub).join(' · ')}</small></span><i>▾</i></button><div class="ad-plat">${[['meta','Meta'],['google','Google'],['plan','Plan']].map(([k,l])=>`<button class="${(S.adPl||'meta')===k?'on':''}" data-a="adPl" data-t="${k}">${l}</button>`).join('')}</div></div>`;
 if((S.adPl||'meta')==='google')return head+adGoogle();
 if(S.adPl==='plan')return head+(typeof _pmViewAD==='function'?_pmViewAD():'');
 const per=`<div class="ad-per">${[['y','Yesterday'],['w','7 days'],['m','30 days']].map(([k,l])=>`<button class="${p===k?'on':''}" data-a="adP" data-t="${k}">${l}</button>`).join('')}<span>Synced ${new Date(ADS.at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}</span></div>`;
 const one=rts.length===1,resTxt=one?AD_RT[rts[0]][0]:'Results (all types)',kpi=[[adInr(s.sp),'Amount spent',''],[adNum(s.res),resTxt,''],[s.res?adInr(s.sp/s.res):'—',one?'Cost per '+AD_RT[rts[0]][1]:'Avg cost / result',''],[adNum(s.im),'Impressions',''],[adCtr(s).toFixed(2)+'%','Link CTR',adCtr(s)>=1?'g':'r'],[adInr(adCpm(s)),'CPM','']];
 const trend=`<div class="ad-card"><div class="ad-ch"><b>Daily spend · 30 days</b><span class="${last7>=prev7?'up':'dn'}">${prev7?(last7>=prev7?'▲ ':'▼ ')+Math.abs(Math.round((last7/prev7-1)*100))+'% vs last week':''}</span></div><div class="ad-bars">${day.map((v,i)=>`<i style="height:${Math.max(2,v/mx*100)}%" title="${ADS.dates[i]} · ${adInr(v)}" class="${i>=day.length-7?'r7':''}"></i>`).join('')}</div><div class="ad-bx"><span>${fmt(ADS.dates[0])}</span><span>last 7 days ${adInr(last7)}</span><span>${fmt(ADS.dates[ADS.dates.length-1])}</span></div></div>`;
 const tips=adAdvice(L,adAds(a=>L.some(c=>c.id===a.c)));
 const adv=tips.length?`<div class="ad-sec">What to do next</div><div class="ad-tips">${tips.map(([k,t,d,id])=>`<button class="ad-tip ${k}" ${id?`data-a="adOpen" data-id="${id}"`:''}><i>${{up:'↑',down:'↓',warn:'!'}[k]}</i><span><b>${h(t)}</b><small>${h(d)}</small></span></button>`).join('')}</div>`:'';
 const tabs=`<div class="ad-lv">${[['camp','Campaigns',L.length],['set','Ad sets',L.reduce((a,c)=>a+adSets(c.id).length,0)],['ad','Ads',adAds(a=>L.some(c=>c.id===a.c)).length],['cr','Creatives','']].map(([k,l,n])=>`<button class="${lvl===k?'on':''}" data-a="adL" data-t="${k}">${l}${n!==''?` <span>${n}</span>`:''}</button>`).join('')}</div>`;
 const fl=S.adF||'all',sort=S.adS||'sp';
 const filt=`<div class="ad-fl">${[['all','All'],['A','Active'],['P','Paused']].map(([k,l])=>`<button class="${fl===k?'on':''}" data-a="adF" data-t="${k}">${l}</button>`).join('')}<select data-ch="adS" aria-label="Sort">${[['sp','Most spent'],['res','Most results'],['cpr','Cheapest result'],['ctr','Best CTR']].map(([k,l])=>`<option value="${k}" ${sort===k?'selected':''}>${l}</option>`).join('')}</select></div>`;
 const srt=(a,b)=>sort==='res'?b.res-a.res:sort==='cpr'?((adCpr(a)||1e9)-(adCpr(b)||1e9)):sort==='ctr'?adCtr(b)-adCtr(a):b.sp-a.sp,ok=x=>fl==='all'||x.st===fl||(fl==='P'&&x.st!=='A');
 let list='';
 if(lvl==='camp')list=L.filter(ok).sort(srt).map(c=>adRowC(c,L)).join('');
 if(lvl==='set')list=L.flatMap(c=>adSets(c.id).map(x=>({...x,rt:c.rt,cn:c.n}))).filter(ok).sort(srt).map(x=>adRowS(x)).join('');
 if(lvl==='ad')list=adAds(a=>L.some(c=>c.id===a.c)).map(a=>({...a,rt:(L.find(c=>c.id===a.c)||{}).rt})).filter(ok).sort(srt).map(adRowA).join('');
 if(lvl==='cr')list=`<div class="ad-grid">${adAds(a=>L.some(c=>c.id===a.c)).map(a=>({...a,rt:(L.find(c=>c.id===a.c)||{}).rt})).filter(ok).sort(srt).map(adTile).join('')}</div>`;
 const note=lvl!=='camp'&&p!=='m'?'<div class="ad-note">Ad sets, ads and creatives show the last 30 days.</div>':'';
 return head+per+`<div class="ad-kpi">${kpi.map(([v,l,c])=>`<div class="${c}"><b>${v}</b><span>${l}</span></div>`).join('')}</div>`+adFunnel(L,co)+trend+adv+`<div class="ad-sec">Ads Manager</div>`+tabs+filt+note+(list||'<div class="ad-empty">Nothing here for this period</div>')+adIdle(co)}
function adFunnel(L,co){if(adPer()!=='m')return '';const G=[['Website sales',L.filter(c=>c.obj==='SALES'&&c.rt==='pur')],['Website sign-ups',L.filter(c=>c.rt==='otp')],['Chats & lead forms',L.filter(c=>c.obj!=='SALES')]].filter(g=>g[1].length);return G.map(([t,C])=>adFun1(t,C)).join('')}
function adFun1(title,L){const m=L.reduce((a,c)=>{a.im+=c.im;a.cl+=c.cl;a.lpv+=c.lpv||0;a.atc+=c.atc||0;a.ic+=c.ic||0;a.pur+=c.pur||0;a.res+=c.res;a.msg+=c.msg||0;a.lead+=c.lead||0;a.otp+=c.rt==='otp'?c.res:0;return a},{im:0,cl:0,lpv:0,atc:0,ic:0,pur:0,res:0,msg:0,lead:0,otp:0});
 const sales=title!=='Chats & lead forms';let st;
 if(sales&&m.otp)st=[['Impressions',m.im],['Link clicks',m.cl,1.0],['Page opened',m.lpv,75],['Signed up (OTP)',m.otp,5],['Booked & paid',m.pur,25]];
 else if(sales)st=[['Impressions',m.im],['Link clicks',m.cl,1.0],['Page opened',m.lpv,75],['Added to cart',m.atc,10],['Checkout',m.ic,40],['Purchases',m.pur,35]];
 else st=[['Impressions',m.im],['Link clicks',m.cl,1.0],[m.msg&&!m.lead?'Chats started':m.lead&&!m.msg?'Leads (form)':'Chats + leads',m.msg+m.lead,30]];
 let leak=-1,worst=9;st.forEach((s,i)=>{if(i&&s[2]&&st[i-1][1]){const q=s[1]/st[i-1][1]*100/s[2];if(q<worst){worst=q;leak=i}}});if(worst>=1)leak=-1;
 return `<div class="ad-card"><div class="ad-ch"><b>Funnel · ${title}</b><span>30 days</span></div>${st.map((s,i)=>{const r=i?(st[i-1][1]?s[1]/st[i-1][1]*100:0):100,w=Math.max(4,st[0][1]?Math.pow(s[1]/st[0][1],.32)*100:0),good=!i||!s[2]||r>=s[2]*.95;
  return `<div class="ad-fs ${i===leak?'leak':''}"><div class="ad-fr"><span>${s[0]}</span><b>${adNum(s[1])}</b>${i?`<em class="${good?'g':'r'}">${r<10?r.toFixed(1):Math.round(r)}%</em>`:''}</div><div class="ad-fb"><i style="width:${w}%;background:${good?'#24408E':'#D92D20'}"></i></div>${i?`<small>${s[2]?'normal '+s[2]+'%':''}${i===leak?' · biggest leak':''}</small>`:''}</div>`}).join('')}</div>`}
const adBadge=(st)=>{const[l,c]=adStD(st);return `<span class="ad-st" style="--c:${c}"><i></i>${l}</span>`};
const adCprCls=(x,L)=>{const p=L.filter(c=>c.rt===x.rt&&c.res),s=adSum(p),avg=s.res?s.sp/s.res:0,v=adCpr(x);return !v||!avg?'':v<avg*.8?'g':v>avg*1.3?'r':''};
function adRowC(c,L){const co=AD_CO[c.co]||['','#999'];
 return `<button class="ad-row" data-a="adOpen" data-id="${c.id}"><div class="ad-r1"><span class="ad-dot" style="background:${co[1]}" title="${h(co[0])}"></span><b>${h(c.n)}</b>${adBadge(c.st)}</div>
 <div class="ad-r2"><span class="ad-obj">${c.obj==='SALES'?'Sales':'Leads'}</span><span>${c.bud?adInr(c.bud)+'/day':'Ad set budget'}</span><span>${h(co[0])}</span></div>
 <div class="ad-r3"><div><b>${adInr(c.sp)}</b><span>spent</span></div><div><b>${adNum(c.res)}</b><span>${AD_RT[c.rt][0]}</span></div><div class="${adCprCls(c,L)}"><b>${c.res?adInr(adCpr(c)):'—'}</b><span>per ${AD_RT[c.rt][1]}</span></div><div><b>${adCtr(c).toFixed(1)}%</b><span>CTR</span></div></div></button>`}
function adRowS(x){return `<button class="ad-row" data-a="adOpen" data-id="${x.c}"><div class="ad-r1"><b>${h(x.n)}</b>${adBadge(x.st)}</div><div class="ad-r2"><span class="ad-obj">${h(x.opt)}</span><span>${x.bud?adInr(x.bud)+'/day':'Campaign budget (CBO)'}</span><span>in ${h(x.cn)}</span></div>
 <div class="ad-r3"><div><b>${adInr(x.sp)}</b><span>spent</span></div><div><b>${adNum(x.res)}</b><span>${AD_RT[x.rt]?AD_RT[x.rt][0]:'results'}</span></div><div><b>${x.res?adInr(x.sp/x.res):'—'}</b><span>per result</span></div><div class="${x.fq>=2.3?'r':''}"><b>${x.fq.toFixed(1)}×</b><span>frequency</span></div></div></button>`}
function adRowA(a){const cr=ADS.CR[a.cr]||['I','Ad'];return `<button class="ad-row ad-arow" data-a="adAd" data-id="${a.id}">${adThumb(a,cr,'s')}<div style="flex:1;min-width:0"><div class="ad-r1"><b>${h(a.n)}</b>${adBadge(a.st)}</div><div class="ad-r2"><span>${h(cr[1])}</span></div>
 <div class="ad-r3 sm"><div><b>${adInr(a.sp)}</b><span>spent</span></div><div><b>${adNum(a.res)}</b><span>results</span></div><div><b>${a.res?adInr(a.sp/a.res):'—'}</b><span>each</span></div><div><b>${adCtr(a).toFixed(1)}%</b><span>CTR</span></div></div></div></button>`}
const AD_GR=['#24408E,#5B7FE0','#7A4A26,#C2410C','#0B6E4F,#1F9D55','#6E0F7A,#B455C9','#02496A,#0796A6','#B54708,#F79009'];
function adThumb(a,cr,sz){const g=AD_GR[(parseInt(String(a.cr).slice(-3))||0)%AD_GR.length];return `<span class="ad-th ${sz||''}" style="background:linear-gradient(140deg,${g})"><em>${cr[0]==='V'?'▶ VIDEO':'IMAGE'}</em>${sz==='s'?'':`<b>${h(cr[1])}</b>`}</span>`}
function adTile(a){const cr=ADS.CR[a.cr]||['I','Ad'],L=adAds(x=>x.rt===a.rt||true),fq=0;const win=a.res>=10&&a.sp/a.res<=(adSum(adAds(x=>x.c===a.c)).sp/Math.max(1,adSum(adAds(x=>x.c===a.c)).res));
 return `<button class="ad-tile" data-a="adAd" data-id="${a.id}">${adThumb(a,cr)}<div class="ad-tm">${win?'<span class="win">🏆 Winner</span>':a.sp>300&&!a.res?'<span class="lose">No results</span>':''}<b>${h(a.n)}</b><div><span>${adInr(a.sp)}</span><span>${a.res?adNum(a.res)+' · '+adInr(a.sp/a.res):'0 results'}</span></div></div></button>`}
function adIdle(co){const I=ADS.idle.filter(x=>co==='all'||x[2]===co);if(!I.length)return '';return `<div class="ad-sec">Other ad accounts</div><div class="ad-idle">${I.map(x=>`<div><b>${h(x[1])}</b><span>No spend in the last 30 days${x[2]&&AD_CO[x[2]]?' · '+AD_CO[x[2]][0]:''}</span></div>`).join('')}</div>`}

/* campaign detail: like opening a campaign in Ads Manager */
A.adOpen=e=>{const id=e.dataset.id;let c=null;ADS.acc.forEach(a=>(ADS.C[a.k]||[]).forEach(r=>{if(r[0]===id)c=adCamp(r,a.k)}));if(!c)return;const sets=adSets(id),ads=adAds(a=>a.c===id),co=AD_CO[c.co]||['','#999'];
 sheet(`<div class="ad-dh"><span class="ad-dot big" style="background:${co[1]}"></span><div style="flex:1;min-width:0"><h2>${h(c.n)}</h2><div class="xs mut">${c.obj==='SALES'?'Sales':'Leads'} campaign · ${c.bud?adInr(c.bud)+'/day':'budget on ad sets'} · ${h(co[0])}</div></div>${adBadge(c.st)}</div>
 <div class="ad-kpi in">${[[adInr(c.sp),'spent'],[adNum(c.res),AD_RT[c.rt][0]],[c.res?adInr(adCpr(c)):'—','per '+AD_RT[c.rt][1]],[adNum(c.im),'impressions'],[adCtr(c).toFixed(2)+'%','link CTR'],[c.fq.toFixed(2)+'×','frequency']].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
 ${adFunnel([c],c.co)}
 <div class="ad-sec">Ad sets · ${sets.length}</div>${sets.map(s=>`<div class="ad-mini"><b>${h(s.n)}</b>${adBadge(s.st)}<span>${h(s.opt)} · ${s.bud?adInr(s.bud)+'/day':'CBO'} · ${adInr(s.sp)} · ${s.res} results${s.res?' · '+adInr(s.sp/s.res)+' each':''}</span></div>`).join('')||'<div class="xs mut">No ad set data</div>'}
 <div class="ad-sec">Ads · ${ads.length}</div><div class="ad-grid">${ads.map(a=>({...a,rt:c.rt})).map(adTile).join('')}</div>
 <label for="adtg" style="margin-top:14px">Company tag</label><select id="adtg" data-ch="adTag" data-id="${c.id}">${Object.entries(AD_CO).map(([k,v])=>`<option value="${k}" ${c.co===k?'selected':''}>${h(v[0])}</option>`).join('')}</select>
 <a class="btn sec w" style="margin-top:10px" href="${adLink(c.acc,'campaigns',c.id)}" target="_blank" rel="noopener">Open in Meta Ads Manager ↗</a>`)};
A.adAd=e=>{const a=adAds(x=>x.id===e.dataset.id)[0];if(!a)return;const cr=ADS.CR[a.cr]||['I','Ad'];let c=null;ADS.acc.forEach(x=>(ADS.C[x.k]||[]).forEach(r=>{if(r[0]===a.c)c=r}));
 sheet(`${adThumb(a,cr,'big')}<h2 style="margin-top:12px">${h(a.n)}</h2><div class="xs mut">${c?h(c[1]):''} · ${h((adSets(a.c).find(s=>s.id===a.s)||{}).n||'')}</div>
 <div class="ad-kpi in">${[[adInr(a.sp),'spent'],[adNum(a.res),'results'],[a.res?adInr(a.sp/a.res):'—','per result'],[adNum(a.im),'impressions'],[adCtr(a).toFixed(2)+'%','CTR'],[adNum(a.cl),'link clicks']].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
 ${a.atc||a.ic?`<div class="ad-mini"><b>Shop funnel</b><span>${a.cl} clicks → ${a.atc} add to cart → ${a.ic} checkout → ${a.res} purchases</span></div>`:''}
 <a class="btn sec w" style="margin-top:12px" href="${adLink(a.acc,'ads',a.id)}" target="_blank" rel="noopener">See the ad in Meta Ads Manager ↗</a>`)};
A.adCoPick=()=>{const T={};Object.keys(AD_CO).forEach(k=>{T[k]=adSum(adCamps(k).map(c=>({...c,sp:c.sp}))).sp});
 sheet(`<h2>Choose company</h2><div class="list">${[['all',['All companies','#14213D']],...Object.entries(AD_CO)].map(([k,v])=>{const n=k==='all'?adCamps('all').length:adCamps(k).length,sp=k==='all'?adSum(adCamps('all')).sp:T[k];return `<button class="li" data-a="adCoGo" data-t="${k}"><span class="ad-av" style="background:${v[1]}">${h(ini(v[0]))}</span><div class="tx"><b>${h(v[0])}</b><div class="m">${n?`${n} campaigns · ${adInr(sp)} ${({y:'yesterday',w:'7 days',m:'30 days'})[adPer()]}`:'No Meta campaigns yet'}</div></div>${(S.adCo||'all')===k?'<b style="color:#1F9D55">✓</b>':''}</button>`}).join('')}</div>`)};
A.adCoGo=e=>{S.adCo=e.dataset.t;closeM();render()};
A.adP=e=>{S.adP=e.dataset.t;render()};A.adL=e=>{S.adL=e.dataset.t;render()};A.adF=e=>{S.adF=e.dataset.t;render()};A.adPl=e=>{S.adPl=e.dataset.t;render()};
document.addEventListener('change',e=>{const d=e.target.dataset||{};if(d.ch==='adS'){S.adS=e.target.value;render()}if(d.ch==='adTag'){D.adTag=D.adTag||{};D.adTag[d.id]=e.target.value;save();render();toast('Tagged to '+AD_CO[e.target.value][0])}});

/* Google Ads: planner until the Google Ads connection is added */
function adGoogle(){const G=(D.gads=D.gads||[]),co=S.adCo||'all',L=G.filter(g=>co==='all'||g.co===co);
 return `<div class="ad-card g"><div class="ad-ch"><b>Google Ads</b><span>not connected yet</span></div><p class="xs mut" style="margin:6px 0 10px">Live Google numbers need the Google Ads account connected to Claude. Until then, plan and track Search, Performance Max, YouTube and Display campaigns here.</p>
 <div class="ad-gtypes">${[['Search','Keywords people type','🔍'],['Performance Max','All Google channels','⚡'],['YouTube','Video ads','▶'],['Display','Banners on sites','🖼']].map(([t,d,i])=>`<button data-a="gNew" data-t="${t}"><span>${i}</span><b>${t}</b><small>${d}</small></button>`).join('')}</div></div>
 <div class="ad-sec">Google campaigns · ${L.length}</div>${L.map(g=>`<div class="ad-row"><div class="ad-r1"><b>${h(g.n)}</b>${adBadge(g.st)}</div><div class="ad-r2"><span class="ad-obj">${h(g.t)}</span><span>${adInr(+g.bud||0)}/day</span><span>${h((AD_CO[g.co]||[''])[0])}</span></div>${g.kw?`<div class="xs mut" style="margin-top:6px">Keywords: ${h(g.kw)}</div>`:''}</div>`).join('')||'<div class="ad-empty">No Google campaigns planned yet</div>'}`}
A.gNew=e=>sheet(`<h2>New ${h(e.dataset.t)} campaign</h2><label for="gn">Name</label><input id="gn" placeholder="e.g. JDAC | Search | Pune freight"><label>Company</label>${opts('gco',Object.entries(AD_CO).map(([k,v])=>[k,v[0]]),S.adCo&&S.adCo!=='all'?S.adCo:'log')}<label for="gb2">Daily budget ₹</label><input id="gb2" type="number" inputmode="numeric" value="500">${e.dataset.t==='Search'?'<label for="gk">Keywords (comma separated)</label><textarea id="gk" rows="2" placeholder="truck booking pune, part load transport"></textarea>':''}<button class="btn w" style="margin-top:12px" data-a="gSave" data-t="${h(e.dataset.t)}">Save plan</button>`);
A.gSave=e=>{const n=val('gn').trim();if(!n)return toast('Give it a name');(D.gads=D.gads||[]).unshift({id:nid('g'),n,t:e.dataset.t,co:pick1('gco'),bud:+val('gb2')||0,kw:(document.getElementById('gk')||{}).value||'',st:'P',at:TODAY});save();closeM();render();toast('Google campaign planned')};

/* hook into Performance marketing (Studios) */
CP['studios:pm']=()=>{stPullAll();return ((S.adPl||'meta')==='plan'?stBar():'')+pmView()};
const _pmViewAD=pmView;pmView=function(){return adsView()};
document.head.insertAdjacentHTML('beforeend',`<style>
.ad-top{display:flex;flex-direction:column;gap:8px;margin:4px 0 10px}
.ad-acc{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:#fff;border-radius:16px;padding:10px 12px;cursor:pointer;text-align:left;width:100%}.ad-acc i{font-style:normal;color:var(--mut)}
.ad-av{width:38px;height:38px;border-radius:11px;color:#fff;display:grid;place-items:center;font:800 13px Inter,sans-serif;flex:none}
.ad-an{flex:1;min-width:0;display:flex;flex-direction:column}.ad-an b{font-size:15.5px}.ad-an small{font-size:11.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ad-plat,.ad-per{display:flex;gap:4px;background:#E9EDF5;border-radius:12px;padding:3px}.ad-plat button,.ad-per button{flex:1;border:0;background:none;border-radius:9px;padding:8px 0;font:700 13px Inter,sans-serif;color:#475467;cursor:pointer}.ad-plat button.on,.ad-per button.on{background:#fff;color:#14213D;box-shadow:0 1px 3px rgba(16,24,40,.12)}
.ad-per{background:none;padding:0;align-items:center;margin-bottom:10px;gap:6px}.ad-per button{flex:none;border:1px solid var(--line);background:#fff;padding:7px 12px;border-radius:99px}.ad-per button.on{background:#14213D;color:#fff;border-color:#14213D}.ad-per span{margin-left:auto;font-size:11px;color:var(--mut)}
.ad-kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}.ad-kpi div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px 10px}.ad-kpi b{display:block;font-size:17px;color:#0B3D5C}.ad-kpi span{font-size:11px;color:var(--mut)}.ad-kpi .g b{color:#1F9D55}.ad-kpi .r b{color:#D92D20}
.ad-kpi.in{margin-top:12px}.ad-kpi.in div{background:#F7F8FA;border:0}
.ad-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin-bottom:10px}.ad-ch{display:flex;justify-content:space-between;align-items:baseline}.ad-ch b{font-size:14.5px}.ad-ch span{font-size:11.5px;color:var(--mut)}.ad-ch .up{color:#C2410C}.ad-ch .dn{color:#1F9D55}
.ad-bars{display:flex;align-items:flex-end;gap:2px;height:70px;margin-top:10px}.ad-bars i{flex:1;background:#C7D2FE;border-radius:3px 3px 0 0;min-width:0}.ad-bars i.r7{background:#24408E}.ad-bx{display:flex;justify-content:space-between;font-size:10.5px;color:var(--mut);margin-top:4px}
.ad-fs{margin-top:9px}.ad-fr{display:flex;align-items:baseline;gap:8px}.ad-fr span{font-size:12.5px;color:#475467;flex:1}.ad-fr b{font-size:14px}.ad-fr em{font-style:normal;font-weight:800;font-size:12px;min-width:44px;text-align:right}.ad-fr em.g{color:#1F9D55}.ad-fr em.r{color:#D92D20}
.ad-fb{height:7px;background:#EEF0F4;border-radius:4px;margin-top:4px;overflow:hidden}.ad-fb i{display:block;height:100%;border-radius:4px}.ad-fs small{font-size:10.5px;color:var(--mut)}.ad-fs.leak{background:#FEF3F2;border-radius:10px;padding:6px 8px;margin-left:-8px;margin-right:-8px}.ad-fs.leak small{color:#B42318;font-weight:700}
.ad-sec{font:800 11px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin:16px 2px 8px}
.ad-tips{display:flex;flex-direction:column;gap:6px}.ad-tip{display:flex;gap:10px;align-items:flex-start;text-align:left;border:1px solid var(--line);background:#fff;border-radius:14px;padding:10px 12px;cursor:pointer}.ad-tip i{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-style:normal;font-weight:800;flex:none}.ad-tip span{display:flex;flex-direction:column}.ad-tip b{font-size:13.5px}.ad-tip small{font-size:12px;color:#475467;margin-top:2px}
.ad-tip.up i{background:#ECFDF3;color:#1F9D55}.ad-tip.down i{background:#FEF3F2;color:#D92D20}.ad-tip.warn i{background:#FFF4E5;color:#B54708}
.ad-lv{display:flex;border-bottom:1px solid var(--line);margin-bottom:8px;overflow-x:auto;scrollbar-width:none}.ad-lv button{flex:none;border:0;background:none;padding:9px 12px;font:700 13.5px Inter,sans-serif;color:var(--mut);border-bottom:2.5px solid transparent;cursor:pointer}.ad-lv button.on{color:#14213D;border-color:#14213D}.ad-lv span{color:var(--mut);font-weight:600}
.ad-fl{display:flex;gap:6px;align-items:center;margin-bottom:8px}.ad-fl button{border:1px solid var(--line);background:#fff;border-radius:99px;padding:6px 12px;font:600 12.5px Inter,sans-serif;cursor:pointer}.ad-fl button.on{background:#14213D;color:#fff;border-color:#14213D}.ad-fl select{margin-left:auto;width:auto;min-height:34px;padding:4px 8px;font-size:12.5px;border-radius:10px}
.ad-row{display:block;width:100%;text-align:left;background:#fff;border:1px solid var(--line);border-radius:14px;padding:11px 12px;margin-bottom:7px;cursor:pointer;font:inherit;color:inherit}
.ad-r1{display:flex;align-items:center;gap:8px}.ad-r1 b{flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ad-dot{width:9px;height:9px;border-radius:50%;flex:none}.ad-dot.big{width:14px;height:14px}
.ad-st{display:inline-flex;align-items:center;gap:4px;font:700 11px Inter,sans-serif;color:var(--c);white-space:nowrap}.ad-st i{width:7px;height:7px;border-radius:50%;background:var(--c)}
.ad-r2{display:flex;gap:8px;flex-wrap:wrap;font-size:11.5px;color:var(--mut);margin-top:3px}.ad-obj{background:#EEF2FB;color:#24408E;border-radius:6px;padding:1px 6px;font-weight:700}
.ad-r3{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:9px;border-top:1px solid #F2F4F7;padding-top:8px}.ad-r3 b{display:block;font-size:13.5px}.ad-r3 span{font-size:10.5px;color:var(--mut)}.ad-r3 .g b{color:#1F9D55}.ad-r3 .r b{color:#D92D20}.ad-r3.sm b{font-size:12.5px}
.ad-arow{display:flex;gap:10px;align-items:flex-start}
.ad-th{position:relative;display:flex;flex-direction:column;justify-content:flex-end;border-radius:12px;color:#fff;padding:8px;aspect-ratio:4/5;overflow:hidden}.ad-th em{position:absolute;top:6px;left:6px;font:800 9px Inter,sans-serif;font-style:normal;background:rgba(0,0,0,.35);border-radius:5px;padding:2px 5px;letter-spacing:.04em}.ad-th b{font-size:12.5px;line-height:1.25;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.ad-th.s{width:52px;flex:none;aspect-ratio:4/5;padding:0}.ad-th.s em{font-size:7px;top:4px;left:4px}.ad-th.big{aspect-ratio:16/10}.ad-th.big b{font-size:18px}
.ad-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}@media(min-width:900px){.ad-grid{grid-template-columns:repeat(4,1fr)}}
.ad-tile{border:1px solid var(--line);background:#fff;border-radius:14px;padding:6px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:6px}.ad-tm{padding:0 4px 4px}.ad-tm b{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ad-tm div{display:flex;justify-content:space-between;font-size:11px;color:var(--mut)}
.ad-tm .win{font:700 10.5px Inter,sans-serif;color:#1F9D55}.ad-tm .lose{font:700 10.5px Inter,sans-serif;color:#D92D20}
.ad-note{font-size:11.5px;color:var(--mut);margin:0 2px 8px}.ad-empty{background:#fff;border:1px dashed var(--line);border-radius:14px;padding:16px;text-align:center;font-size:12.5px;color:var(--mut)}
.ad-idle{display:flex;flex-direction:column;gap:6px}.ad-idle div{background:#fff;border:1px solid var(--line);border-radius:12px;padding:9px 12px;display:flex;flex-direction:column}.ad-idle b{font-size:13px}.ad-idle span{font-size:11.5px;color:var(--mut)}
.ad-dh{display:flex;gap:10px;align-items:center}.ad-dh h2{margin:0;font-size:18px}
.ad-mini{background:#F7F8FA;border-radius:12px;padding:9px 11px;margin-bottom:6px;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}.ad-mini b{font-size:13px;flex:1}.ad-mini>span:last-child{width:100%;font-size:11.5px;color:#475467}
.ad-gtypes{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ad-gtypes button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px;cursor:pointer;text-align:left}.ad-gtypes span{font-size:18px}.ad-gtypes b{font-size:13.5px}.ad-gtypes small{font-size:11px;color:var(--mut)}
@media(min-width:900px){.ad-kpi{grid-template-columns:repeat(6,1fr)}.ad-top{flex-direction:row}.ad-acc{max-width:420px}.ad-plat{flex:1;max-width:320px;margin-left:auto}}
</style>`);
