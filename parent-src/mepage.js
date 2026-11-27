/* ===== Me page: salary slip opens as a pop-up · phone reset & attendance request under "More" · attendance marking last ===== */
/* Logistics company page: no logo in the header (the JDAC logo is already in the side menu) */
delete CO_LOGO.log;
const _meMP=V.me;V.me=()=>{const o=_meMP();if(!empOf(S.me))return o;
 const t=document.createElement('template');t.innerHTML=o;const C=t.content;
 const sal=C.querySelector('.mysal');let slip='';
 if(sal){sal.remove();const x=(D.emp||[]).find(e=>e.k===S.me),m=S.msm||monStart(TODAY),ml=new Date(m+'T12:00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  slip=`<button class="card meslip" data-a="msOpen"><i>${ic('rupee')}</i><span><b>My salary slip</b><small>${h(ml)} · present, absent, half days, late marks · days and ₹</small></span><em>View ${ic('right')}</em></button>`}
 const cards=[...C.querySelectorAll('.card')];
 const today=cards.find(c=>/^\s*TODAY/i.test(c.innerText||c.textContent||'')||c.querySelector('[data-a="clock"],[data-a="clockGo"]'));
 const more=cards.filter(c=>/Changed or lost your phone\?|Forgot to mark attendance\?/.test(c.textContent||''));
 const col=(today||more[0]||{}).parentElement;
 if(col){more.forEach(c=>c.remove());
  if(more.length){const d=document.createElement('details');d.className='card memore';d.innerHTML=`<summary><b>More</b><span class="xs mut">Phone changed or lost · forgot to mark attendance</span><i>${ic('right')}</i></summary>`;more.forEach(c=>{c.classList.add('meinner');d.appendChild(c)});col.appendChild(d)}
  if(today){today.remove();col.appendChild(today)}
  if(slip)col.insertAdjacentHTML('afterbegin',slip)}
 else if(slip)C.prepend(document.createRange().createContextualFragment(slip));
 return t.innerHTML};
A.msOpen=()=>{const s=mySalary();if(!s)return toast('Salary not set yet');sheet(`<div class="mspop">${s}</div>`)};
const _msMMP=A.msM;A.msM=e=>{const inPop=!!(e.closest&&e.closest('.mspop'));_msMMP(e);if(inPop)A.msOpen()};
document.head.insertAdjacentHTML('beforeend',`<style>
.meslip{display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;font:inherit;border:1px solid var(--line)}.meslip:hover{border-color:var(--navy)}
.meslip>i{width:44px;height:44px;border-radius:12px;background:#E8EEFB;color:var(--navy);display:grid;place-items:center;flex:none}.meslip>i svg{width:22px;height:22px}
.meslip span{flex:1;min-width:0}.meslip b{display:block;font-size:16px}.meslip small{display:block;font-size:12.5px;color:var(--mut)}
.meslip em{font-style:normal;font-weight:700;color:var(--navy);display:flex;align-items:center;gap:2px;font-size:14px}.meslip em svg{width:16px;height:16px}
.memore summary{display:flex;align-items:center;gap:10px;cursor:pointer;list-style:none}.memore summary::-webkit-details-marker{display:none}.memore summary b{font-size:16px}.memore summary span{flex:1}
.memore summary i svg{width:18px;height:18px;transition:transform .2s}.memore[open] summary i svg{transform:rotate(90deg)}
.memore .meinner{box-shadow:none;border:1px solid var(--line);margin:12px 0 0}
.sheet:has(.mspop){max-width:980px;width:min(980px,96vw)}.mspop .mysal{margin:0;box-shadow:none;border:0;padding:0}
</style>`);
