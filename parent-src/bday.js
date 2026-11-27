/* Birthday reminder — only for Nameera (HR): one day before, on HR Desk and as a pop-up once a day */
const bdayTom=()=>(D.emp||[]).filter(e=>e.st==='Active'&&e.dob&&empBdayIn(e.dob)===1);
const _peopleBD=V.people;V.people=()=>{let out=_peopleBD();if(S.me!=='nameera')return out;const L=bdayTom();if(!L.length)return out;
 const box=`<div class="bdnote" role="status"><span class="bdi">🎂</span><div><b>Birthday tomorrow</b><div>${L.map(e=>`${h(e.n)} turns ${empAge(e.dob)+1} on ${fmtL(addD(TODAY,1))}${e.ph&&e.ph!=='—'?` · ${h(e.ph)}`:''}`).join('<br>')}</div><small>Plan a wish or a small cake for the team.</small></div></div>`;
 const i=out.indexOf('</div>',out.indexOf('HR Desk'));return i>0?out.slice(0,i+6)+box+out.slice(i+6):box+out};
setTimeout(()=>{if(S.me!=='nameera'||D.bdayToast===TODAY)return;const L=bdayTom();if(!L.length)return;D.bdayToast=TODAY;save();toast('🎂 Birthday tomorrow: '+L.map(e=>e.n).join(', '))},3500);
document.head.insertAdjacentHTML('beforeend',`<style>.bdnote{display:flex;gap:12px;align-items:flex-start;background:linear-gradient(90deg,#FFF4E5,#FFF9F0);border:1px solid #F5C98B;border-radius:14px;padding:12px 16px;margin:10px 0 14px}.bdnote .bdi{font-size:26px;line-height:1}.bdnote b{color:#9A5B00;font-size:15px}.bdnote small{color:#8A6A3A;font-size:12px}</style>`);
