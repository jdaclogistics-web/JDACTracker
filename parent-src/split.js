/* ===================== SPLIT VIEW · two parts of the tracker side by side (desktop) ===================== */
Object.assign(I,{split:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>'});
const SPLIT_OPTS=[['home','','Dashboard'],['tasks','','Tasks'],['people','','HR Desk'],['chat','wa','WhatsApp'],['chat','email','Email'],['chat','team','Team chat'],['chat','call','Calls'],['chat','meet','Google Meet'],['chat','notes','JDAC Notetaker'],['money','','Accounts'],['camp','','Campaigns'],['contacts','','Contacts']];
const splitSrc=()=>{const o=SPLIT_OPTS[+(S.spI||0)]||SPLIT_OPTS[0];return location.pathname+'?pane=1#v='+o[0]+(o[1]?'&chm='+o[1]:'')};
if(PANE){document.documentElement.classList.add('panemode')}
const _rSplit=render;render=function(){_rSplit.apply(this,arguments);if(PANE)return;
 const app=document.getElementById('app');if(!app||!app.querySelector)return;
 const hdr=app.querySelector('.hd .hrow');if(hdr&&!hdr.querySelector('.spbtn')){const sp=hdr.querySelector('.sp');const b=document.createElement('button');b.className='hbtn spbtn hide-m'+(S.split?' on':'');b.dataset.a='splitT';b.title='Split view: open a second section next to this one';b.innerHTML=ic('split')+'<span>Split view</span>';if(sp&&sp.nextSibling)hdr.insertBefore(b,sp.nextSibling);else hdr.appendChild(b)}
 document.body.classList.toggle('splitmode',!!S.split);
 let pn=document.getElementById('spPane');const main=app.querySelector('.sb-main');
 if(S.split&&main){if(!pn){pn=document.createElement('aside');pn.id='spPane';pn.className='sppane';pn.innerHTML=`<div class="spbar"><b>${ic('split')}Second view</b><select id="spSel" aria-label="Second view">${SPLIT_OPTS.map((o,i)=>`<option value="${i}">${o[2]}</option>`).join('')}</select><button class="cb" data-a="splitSwap" title="Open this section on the left">⇆</button><button class="cb" data-a="splitT" title="Close split view" aria-label="Close split view">×</button></div><iframe id="spFrame" title="Second view" src="${splitSrc()}"></iframe>`;document.body.appendChild(pn);
   pn.querySelector('#spSel').value=String(S.spI||0);pn.querySelector('#spSel').addEventListener('change',e=>{S.spI=+e.target.value;saveS();pn.querySelector('#spFrame').src=splitSrc()})}}
 else if(pn)pn.remove()};
A.splitT=()=>{S.split=!S.split;if(S.split){let i=SPLIT_OPTS.findIndex(o=>o[0]===S.v&&(S.v!=='chat'||o[1]===S.chm));if(i<0){const t=(tabsFor().find(x=>x[0]===S.v)||[])[1]||({people:'HR Desk',chat:'Communication',contacts:'Contacts',kpi:'KPIs',training:'Training',settings:'Settings',blueprint:'App blueprint',me:'Me',co:'Companies',content:'Content'}[S.v])||S.v;SPLIT_OPTS.push([S.v,S.v==='chat'?S.chm||'':'',t]);i=SPLIT_OPTS.length-1}S.spI=i;const pn=document.getElementById('spPane');if(pn)pn.remove()}saveS();render()};
A.splitSwap=()=>{const o=SPLIT_OPTS[+(S.spI||0)];S.v=o[0];if(o[1])S.chm=o[1];render();scrollTo(0,0)};
/* keep both views in sync: when one side saves data, the other reloads it */
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){try{const nd=JSON.parse(e.newValue);for(const k in D)if(!(k in nd))delete D[k];Object.assign(D,nd);if(!document.querySelector('.sheet:not([hidden])'))render()}catch(x){}}});
