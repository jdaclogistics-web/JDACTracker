
'use strict';
/* =================== helpers =================== */
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Math.round(+n||0).toLocaleString('en-IN');
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const TODAY=iso(new Date());
const addD=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)};
const dAgo=n=>addD(TODAY,-n);
const fmt=s=>s?new Date(s+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—';
const fmtY=s=>s?new Date(s+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—';
const daysTo=s=>Math.round((new Date(s+'T12:00:00')-new Date(TODAY+'T12:00:00'))/864e5);
const nid=p=>p+Math.random().toString(36).slice(2,8);
const pct=(a,b)=>b?Math.min(100,Math.round(a/b*100)):0;
const COLS=['#02496A','#0796A6','#6E0F7A','#137a50','#9a5f00','#1d62c4','#8e3b46','#3d5a80'];
const colr=s=>COLS[[...String(s)].reduce((a,c)=>a+c.charCodeAt(0),0)%COLS.length];
const ini=n=>String(n).replace(/\([^)]*\)/g,'').split(/\s+/).filter(w=>/[A-Za-z0-9]/.test(w[0]||'')).map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
const av=(n,c='')=>`<div class="av ${c}" style="background:${colr(n)}" aria-hidden="true">${h(ini(n))}</div>`;
const tag=(t,c='')=>`<span class="tag ${c}">${h(t)}</span>`;
const bar=(p,c='')=>`<div class="bar ${c}" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div>`;
const kpi=(n,l,s)=>`<div class="kpi"><div class="n">${n}</div><div class="l">${l}</div>${s?`<div class="s">${s}</div>`:''}</div>`;
const tbl=(heads,rows,empty)=>`<div class="tw"><table class="resp"><thead><tr>${heads.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${heads.length}" class="empty">${empty||'Nothing here yet.'}</td></tr>`}</tbody></table></div>`;
const tr=(cells,attrs='')=>`<tr ${attrs}>${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`;
const I={
 dash:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
 task:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
 chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
 box:'<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
 truck:'<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
 bed:'<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20"/><path d="M6 8v9"/>',
 users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 film:'<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 rupee:'<path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10"/>',
 lib:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M20 17v5H6.5A2.5 2.5 0 0 1 4 19.5"/>',
 star:'<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
 book:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
 home:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
 work:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
 user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
 menu:'<path d="M3 12h18M3 6h18M3 18h18"/>',
 mic:'<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>',
 out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 search:'<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
 pin:'<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
 mail:'<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M22 6l-10 7L2 6"/>',
 cam:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
};
const ic=(k,c='')=>`<svg class="ico ${c}" viewBox="0 0 24 24" aria-hidden="true">${I[k]||''}</svg>`;

/* =================== people & roles =================== */
const P={
 darshan:{n:'Darshan Soni',r:'Boss · Admin',team:'Admin',kind:'boss'},
 nameera:{n:'Nameera Shaikh',r:'HR Manager',team:'HR',kind:'hr'},
 snehalz:{n:'Snehal Z',r:'Accountant',team:'Accounts',kind:'acc'},
 snehalb:{n:'Snehal B',r:'HR · Recruitment',team:'HR',kind:'staff',work:['hr','hire']},
 neetu:{n:'Neetu',r:'Customer Success Executive',team:'CSE',kind:'staff',work:['log','crm']},
 balaji:{n:'Balaji',r:'Customer Success Executive',team:'CSE',kind:'staff',work:['log','crm']},
 imran:{n:'Imran',r:'Customer Success Executive',team:'CSE',kind:'staff',work:['log','crm']},
 mohin:{n:'Mohin',r:'Operations',team:'Ops',kind:'staff',work:['log','ops']},
 omadsul:{n:'Om Adsul',r:'Operations',team:'Ops',kind:'staff',work:['log','ops']},
 atmaram:{n:'Atmaram',r:'Sales & Warehouse · Goa',team:'GovaaBazaar',kind:'staff',work:['gb','orders'],field:1},
 zubair:{n:'Zubair',r:'Warehouse Manager · Pune',team:'Warehouse',kind:'staff',work:['jup','orders'],field:1},
 abrar:{n:'Abrar',r:'Warehouse Executive',team:'Warehouse',kind:'staff',work:['jup','orders'],field:1},
 mustafa:{n:'Mustafa',r:'Warehouse Executive',team:'Warehouse',kind:'staff',work:['jup','orders'],field:1},
 samadhan:{n:'Samadhan',r:'Warehouse Executive',team:'Warehouse',kind:'staff',work:['jup','orders'],field:1},
 swapnil:{n:'Swapnil',r:'Social Media',team:'Marketing',kind:'staff',work:['studios','calendar']},
 omparvate:{n:'Om Parvate',r:'Performance Marketing',team:'Marketing',kind:'staff',work:['studios','campaigns']},
 himanshu:{n:'Himanshu',r:'IT & Landing pages',team:'Marketing',kind:'staff',work:['content']},
 sameer:{n:'Sameer',r:'Prakash Foods · Nashik (partner)',team:'Partner',kind:'partner',work:['gb','nashik']}
};
const STAFF=Object.keys(P).filter(k=>!['sameer'].includes(k));
const nm=k=>(P[k]||{}).n||k;

/* =================== company definitions =================== */
const CO={
 gb:{n:'GovaaBazaar',s:'FMCG · Goa warehouse + Nashik',ic:'box',c:'#7a4a26',tabs:[['orders','Orders'],['retailers','Retailers'],['products','Products & rates'],['inventory','Inventory'],['purchases','Purchases & GRN'],['invoices','Invoices'],['payments','Payments'],['outstanding','Outstanding'],['returns','Returns'],['petty','Petty cash']]},
 log:{n:'JDAC Logistics',s:'Courier & cargo · jdac.in',ic:'truck',c:'#02496A',tabs:[['crm','CRM'],['bookings','Bookings'],['ops','Pickups · 3 days'],['ship','Shipments'],['weight','Weight discrepancy'],['payments','Payments'],['incent','Incentives']]},
 jup:{n:'Jupiter Equipment',s:'Medical rentals · Pune warehouse',ic:'bed',c:'#137a50',tabs:[['inventory','Inventory'],['orders','Orders & delivery'],['map','Rented map'],['renewals','Renewals'],['expenses','Delivery expenses'],['settle','Payments & settlement']]},
 hr:{n:'JDAC HR Consultancy',s:'Employers ↔ job-seekers',ic:'users',c:'#6E0F7A',tabs:[['overview','Overview'],['companies','Companies'],['hire','Hire Craft'],['billing','Billing plans'],['wallet','Wallets'],['internal','Internal hiring']]},
 studios:{n:'JDAC Studios',s:'Marketing · in-house + clients',ic:'film',c:'#0796A6',tabs:[['clients','Clients & billing'],['campaigns','Campaigns'],['calendar','Content calendar'],['social','Social media']]}
};
const COK=Object.keys(CO);

/* =================== data =================== */
const KEY='jdac-sales-panel-v1';
function seed(){
 const D={};
 D.targets=[
  {id:'t1',co:'log',l:'CSE orders from lead campaigns',goal:25,per:'day',unit:'orders',who:'neetu',v:14,note:'Neetu, Balaji, Imran'},
  {id:'t2',co:'log',l:'Orders on jdac.in / landing page',goal:25,per:'day',unit:'orders',who:'himanshu',v:9},
  {id:'t3',co:'log',l:'PTL transporter onboarded',goal:1,per:'week',unit:'onboarded',who:'balaji',v:0},
  {id:'t4',co:'gb',l:'Online orders · Pick any 6 @ ₹999',goal:10,per:'week',unit:'orders',who:'darshan',v:4},
  {id:'t5',co:'gb',l:'Goa offline orders (counted at punch)',goal:30000,per:'day',unit:'₹',who:'atmaram',v:18400},
  {id:'t6',co:'hr',l:'Company onboarded @ ₹999',goal:1,per:'week',unit:'company',who:'nameera',v:0},
  {id:'t7',co:'hr',l:'Employee placed',goal:1,per:'week',unit:'employee',who:'snehalb',v:1},
  {id:'t8',co:'jup',l:'Facebook ad orders, Pune',goal:5,per:'week',unit:'orders',who:'omparvate',v:2},
  {id:'t9',co:'studios',l:'Bahiram ₹3,000 package sold',goal:1,per:'week',unit:'order',who:'himanshu',v:0}];
 D.goals=[{id:'G1',t:'Christmas: 1,000 GovaaBazaar orders',co:'gb',by:'2026-12-25',target:1000,done:0,playbook:'Campaign launch',spend:0}];
 D.tasks=[
  {id:'k1',g:'G1',t:'Research Christmas gifting audience & offers',o:'omparvate',co:'gb',due:addD(TODAY,1),st:'Working',pri:'High',type:'One-time',tags:['Research','Meta'],dep:null,desc:'Competitor offers, best-selling gift boxes, target cities.'},
  {id:'k2',g:'G1',t:'3 creatives + 2 reels for Christmas boxes',o:'swapnil',co:'gb',due:addD(TODAY,4),st:'To do',pri:'High',type:'One-time',tags:['Video','Static'],dep:'k1',desc:'Expected: 3 statics, 2 reels of 20–30 sec.'},
  {id:'k3',g:'G1',t:'Christmas landing page on GovaaBazaar',o:'himanshu',co:'gb',due:addD(TODAY,5),st:'To do',pri:'High',type:'One-time',tags:['Landing page','WordPress'],dep:'k1',desc:''},
  {id:'k4',g:'G1',t:'Launch Meta campaign · ₹1,500/day',o:'omparvate',co:'gb',due:addD(TODAY,7),st:'Planning',pri:'High',type:'One-time',tags:['Meta','Paid'],dep:'k2',desc:''},
  {id:'k5',g:'G1',t:'Organic Christmas plan · 10 posts',o:'swapnil',co:'gb',due:addD(TODAY,6),st:'Planning',pri:'Normal',type:'One-time',tags:['Organic'],dep:'k2',desc:''},
  {id:'k6',t:'New Year offer call script for CSEs',o:'neetu',co:'log',due:addD(TODAY,2),st:'To do',pri:'Normal',type:'One-time',tags:['CSE'],desc:'',by:'darshan'},
  {id:'k7',t:'Verify GRN for Goa warehouse stock',o:'snehalz',co:'gb',due:TODAY,st:'To do',pri:'High',type:'One-time',tags:['Accounts'],desc:''},
  {id:'k8',t:'Daily: update Goa outstanding sheet',o:'atmaram',co:'gb',due:TODAY,st:'To do',pri:'Normal',type:'Daily',tags:['Accounts'],desc:''},
  {id:'k9',t:'Fix jdac.in rate calculator mobile bug',o:'himanshu',co:'log',due:dAgo(1),st:'Stuck',pri:'High',type:'One-time',tags:['IT','Genmak'],desc:'Raised in 12 o\'clock call with Genmak.'},
  {id:'k10',t:'Shoot D1 + N1 Parivaar videos',o:'swapnil',co:'studios',due:addD(TODAY,1),st:'Review',pri:'High',type:'One-time',tags:['Video','Parivaar'],desc:'',proof:'Drive link added'},
  {id:'k11',t:'Renewals list for next 7 days',o:'zubair',co:'jup',due:TODAY,st:'Done',pri:'Normal',type:'Daily',tags:['Jupiter'],desc:''}];
 D.groups=[
  {id:'ann',n:'Announcements',who:['darshan','nameera'],all:1},
  {id:'cse',n:'CSE team',m:['darshan','nameera','neetu','balaji','imran']},
  {id:'ops',n:'Operations',m:['darshan','nameera','mohin','omadsul']},
  {id:'wh',n:'Warehouse · Pune',m:['darshan','nameera','zubair','abrar','mustafa','samadhan']},
  {id:'goa',n:'GovaaBazaar · Goa',m:['darshan','nameera','atmaram','snehalz']},
  {id:'mkt',n:'Marketing',m:['darshan','nameera','swapnil','omparvate','himanshu']},
  {id:'hrt',n:'HR team',m:['darshan','nameera','snehalb']},
  {id:'acc',n:'Accounts',m:['darshan','nameera','snehalz']}];
 D.msgs=[
  {g:'ann',f:'nameera',t:'From 1 Dec, login is OTP-based on phone and desktop. Please keep your number active.',at:'09:05'},
  {g:'ann',f:'darshan',t:'Milestone 1 ends 30 Nov. Every owner updates their number by 7 pm.',at:'09:12'},
  {g:'cse',f:'neetu',t:'3 Meta leads converted before lunch 🎯',at:'12:41'},
  {g:'cse',f:'darshan',t:'Great. Push the quotation chases after 4.',at:'12:44'},
  {g:'ops',f:'mohin',t:'2 Delhivery pickups pending since yesterday. Ticket raised.',at:'11:20'},
  {g:'goa',f:'atmaram',t:'Panaji route done. 4 orders punched, 1 payment on credit.',at:'18:10'},
  {g:'mkt',f:'swapnil',t:'D1 + N1 edited, uploaded to Content Library.',at:'17:02'}];
 D.retail=[
  {id:'r1',n:'Fernandes General Store',o:'A. Fernandes',city:'Mapusa',gst:'30AAxxxx1Z5',fssai:'Yes',out:0,owner:'atmaram'},
  {id:'r2',n:'Coastal Mart',o:'R. Naik',city:'Panaji',gst:'',fssai:'',out:4380,owner:'atmaram',since:dAgo(12)},
  {id:'r3',n:'Sea View Supermarket',o:'S. D\'Souza',city:'Calangute',gst:'30BBxxxx2Z1',fssai:'Yes',out:0,owner:'atmaram'},
  {id:'r4',n:'Shree Ganesh Stores',o:'V. Kamat',city:'Margao',gst:'',fssai:'Yes',out:7650,owner:'atmaram',since:dAgo(34)},
  {id:'r5',n:'Beach Corner Kiosk',o:'J. Pereira',city:'Baga',gst:'',fssai:'',out:0,owner:'atmaram'}];
 D.prod=[
  {id:'p1',n:'Dark Choconut 50 g',cost:38,rate:60,gst:18,bom:'1 bar + 1 wrapper'},
  {id:'p2',n:'Pick any 6 · gift box',cost:520,rate:999,gst:18,bom:'6 bars + 1 box + 1 mono carton + 1 sticker'},
  {id:'p3',n:'Milk Choconut 50 g',cost:34,rate:55,gst:18,bom:'1 bar + 1 wrapper'},
  {id:'p4',n:'Choconut cookies 150 g',cost:62,rate:110,gst:18,bom:'1 pack + 1 sticker'}];
 D.inv={goa:{p1:420,p2:38,p3:300,p4:120},nashik:{p1:900,p2:120,p3:600,p4:260},pack:{'Gift boxes':180,'Mono cartons':210,'6-pc boxes':150,'Cookie stickers':900}};
 D.gbo=[
  {id:'GB-1041',r:'r1',src:'Atmaram',wh:'goa',items:{p1:24,p3:12},st:'Delivered',pay:'Cash',at:dAgo(1),proof:1},
  {id:'GB-1042',r:'r2',src:'Atmaram',wh:'goa',items:{p1:36},st:'Delivered',pay:'Credit',at:dAgo(1),proof:1},
  {id:'GB-1043',r:'r3',src:'Atmaram',wh:'goa',items:{p4:20,p1:18},st:'Processing',pay:'',at:TODAY},
  {id:'GB-1044',r:'r5',src:'Atmaram',wh:'goa',items:{p3:24},st:'Punched',pay:'',at:TODAY},
  {id:'GB-W210',r:null,cust:'Online customer · Pune',src:'GovaaBazaar.com',wh:'nashik',items:{p2:1},st:'Processing',pay:'Prepaid',at:TODAY},
  {id:'GB-W211',r:null,cust:'Online customer · Goa',src:'GovaaBazaar.com',wh:'goa',items:{p2:1},st:'Punched',pay:'COD ₹49 paid',at:TODAY},
  {id:'GB-RB07',r:'r4',src:'Retailer Bazaar',wh:'goa',items:{p1:48},st:'Punched',pay:'',at:TODAY}];
 D.grn=[{id:'GRN-118',from:'Prakash Foods · Nashik',items:'Dark Choconut ×300, Gift boxes ×40',by:'atmaram',at:dAgo(1),st:'Waiting for Snehal Z'},{id:'GRN-117',from:'Prakash Foods · Nashik',items:'Milk Choconut ×200',by:'atmaram',at:dAgo(6),st:'Verified'}];
 D.returns=[{id:'CN-21',r:'r2',items:'Dark Choconut ×6',kind:'Resale',at:dAgo(3)},{id:'CN-22',r:'r4',items:'Cookies ×4',kind:'Expired',at:dAgo(2)}];
 D.petty=[
  {id:'goa',n:'Goa · Atmaram',hold:6200,lines:[['Cash collected · GB-1041',+2580,dAgo(1)],['Deposited in bank (slip photo)',-5000,dAgo(2)],['Fuel · company Eeco',-900,dAgo(1)]]},
  {id:'pune-wh',n:'Pune warehouse · Zubair',hold:1800,lines:[['Given by office',+3000,dAgo(4)],['Rapido · bed delivery',-240,dAgo(2)],['Labour ×2 · 4th floor',-200,dAgo(1)]]},
  {id:'pune-off',n:'Pune office · Nameera',hold:8350,lines:[['Opening',+10000,dAgo(10)],['Office supplies',-650,dAgo(3)],['Spot incentive · Neetu',-200,dAgo(1)]]}];
 D.pays=[
  {id:'PY-1',co:'gb',what:'GB-1041 · Fernandes General Store',amt:2580,mode:'Cash',by:'atmaram',st:'To verify',proof:'Photo'},
  {id:'PY-2',co:'log',what:'Booking JL-55021 · freight',amt:3450,mode:'UPI',by:'neetu',st:'To verify',proof:'Screenshot'},
  {id:'PY-3',co:'log',what:'Booking JL-55018 · Razorpay',amt:1890,mode:'Razorpay',by:'System',st:'Auto-verified'},
  {id:'PY-4',co:'jup',what:'Transport · bed delivery Kothrud',amt:1800,mode:'UPI',by:'abrar',st:'To verify',proof:'Screenshot'},
  {id:'PY-5',co:'jup',what:'Rent + transport paid on Jupiter QR',amt:6300,mode:'Jupiter QR',by:'mustafa',st:'Split needed',proof:'Screenshot'}];
 D.leads=[
  {id:'L1',n:'Pune textile seller',city:'Pune → Delhi',st:'New',o:'neetu',src:'Meta'},
  {id:'L2',n:'Furniture shop',city:'Pune → Hyderabad',st:'Contacted',o:'balaji',src:'Meta'},
  {id:'L3',n:'Machine parts dealer',city:'Mumbai → Chennai',st:'Chase 2',o:'imran',src:'DM'},
  {id:'L4',n:'Ayurveda brand',city:'Pune → Kolkata',st:'Quotation',o:'neetu',src:'Meta'},
  {id:'L5',n:'Home shifting · 2BHK',city:'Pune → Bengaluru',st:'Quote chase 1',o:'balaji',src:'Meta'},
  {id:'L6',n:'Electronics retailer',city:'Pune → Jaipur',st:'Follow-up',o:'imran',src:'Meta'},
  {id:'L7',n:'Clothing D2C brand',city:'Pune → Pan-India',st:'Future follow-up',o:'neetu',src:'DM'},
  {id:'L8',n:'Bike parcel',city:'Nashik → Goa',st:'Booked',o:'balaji',src:'Meta'},
  {id:'L9',n:'Student luggage',city:'Pune → Patna',st:'Lost',o:'imran',src:'Meta',why:'Price'}];
 D.ship=[
  {id:'JL-55021',cse:'neetu',carrier:'Delhivery',awb:'DL8812…',bk:TODAY,st:'Booked',day:1,pay:'Pending'},
  {id:'JL-55020',cse:'balaji',carrier:'DP World',awb:'DP4410…',bk:dAgo(1),st:'Booked',day:2,pay:'Pending'},
  {id:'JL-55019',cse:'imran',carrier:'Delhivery',awb:'DL8790…',bk:dAgo(2),st:'Booked',day:3,pay:'Pending'},
  {id:'JL-55018',cse:'neetu',carrier:'ShipMozo',awb:'SM2201…',bk:dAgo(2),st:'In transit',pay:'Paid'},
  {id:'JL-55016',cse:'balaji',carrier:'Delhivery',awb:'DL8701…',bk:dAgo(4),st:'Payment pending',pay:'Weight +6 kg'},
  {id:'JL-55012',cse:'imran',carrier:'Routx',awb:'RX1182…',bk:dAgo(6),st:'NDR',pay:'Paid',ndr:'Wrong phone number'},
  {id:'JL-55009',cse:'neetu',carrier:'Delhivery',awb:'DL8640…',bk:dAgo(8),st:'Delivered',pay:'Paid'},
  {id:'JL-GB88',cse:'—',carrier:'Delhivery',awb:'DL8820…',bk:TODAY,st:'Booked',day:1,pay:'Internal · GovaaBazaar',internal:1}];
 D.weight=[{id:'JL-55016',cse:'balaji',booked:'18 kg',actual:'24 kg',extra:540,st:'CSE to call'},{id:'JL-55011',cse:'neetu',booked:'40 kg',actual:'46 kg',extra:690,st:'Collected'}];
 D.jinv=[
  {sn:'HB-0142',t:'Hospital bed · manual',st:'Rented',cust:'Kothrud',x:38,y:52,end:addD(TODAY,3)},
  {sn:'HB-0151',t:'Hospital bed · electric',st:'Rented',cust:'Baner',x:30,y:28,end:addD(TODAY,6)},
  {sn:'OC-0310',t:'Oxygen concentrator',st:'Rented',cust:'Hadapsar',x:70,y:58,end:addD(TODAY,12)},
  {sn:'WC-0077',t:'Wheelchair',st:'Rented',cust:'Wanowrie',x:60,y:66,end:addD(TODAY,2)},
  {sn:'WK-0040',t:'Walker',st:'Return pending',cust:'Aundh',x:34,y:22,end:dAgo(1)},
  {sn:'HB-0160',t:'Hospital bed · manual',st:'Available'},{sn:'HB-0161',t:'Hospital bed · manual',st:'Available'},
  {sn:'OC-0322',t:'Oxygen concentrator',st:'Available'},{sn:'WC-0080',t:'Wheelchair',st:'Available'},
  {sn:'OC-0299',t:'Oxygen concentrator',st:'Repair'},{sn:'WC-0031',t:'Wheelchair',st:'Expired'}];
 D.jord=[
  {id:'JE-881',item:'Hospital bed · manual',cust:'Kothrud',from:'Nadeem (Jupiter sales)',st:'Delivered',boy:'abrar',kyc:4,transport:1800},
  {id:'JE-882',item:'Oxygen concentrator',cust:'Viman Nagar',from:'WhatsApp · Zubair',st:'Out for delivery',boy:'mustafa',kyc:2,transport:500},
  {id:'JE-883',item:'Wheelchair (sale)',cust:'Kondhwa',from:'Nadeem (Jupiter sales)',st:'Assigned',boy:'samadhan',kyc:0,transport:500}];
 D.jexp=[{id:'X1',what:'Rapido · JE-882',amt:180,by:'mustafa',st:'Approved by Zubair'},{id:'X2',what:'Labour ×2 · 4th floor · JE-881',amt:200,by:'abrar',st:'Paid · Pune petty cash'},{id:'X3',what:'Porter · JE-883',amt:420,by:'samadhan',st:'Company Porter wallet'}];
 D.hrco=[{n:'Jupiter Equipment',st:'Active client',plan:{fee:50,a:1,b:30}},{n:'Sample client · Pune',st:'Onboarded',plan:{fee:100,a:7,b:45}},{n:'New lead · Nashik',st:'Lead',plan:{fee:100,a:7,b:45}}];
 D.hire=[{n:'Candidate A',job:'Delivery executive',co:'Jupiter Equipment',st:'Interview'},{n:'Candidate B',job:'Telecaller',co:'JDAC Logistics (internal)',st:'Shared'},{n:'Candidate C',job:'Field technician',co:'Jupiter Equipment',st:'Joined',day:9},{n:'Candidate D',job:'Packing staff',co:'Sample client · Pune',st:'Shortlisted'}];
 D.clients=[
  {n:'Jupiter Mumbai',what:'Marketing + Google spends',fee:'₹2,00,000 / month',auto:1,st:'Ready · waiting for Snehal Z'},
  {n:'Bahiram',what:'Social media + ads',fee:'₹30,000 / month',auto:1,st:'Ready · waiting for Snehal Z'},
  {n:'Jupiter Pune (warehouse)',what:'Warehouse management · our team',fee:'₹1,75,000 or 15% of revenue, whichever is higher',auto:1,st:'Draft · revenue needed'},
  {n:'JDAC Logistics',what:'Internal',fee:'₹0 · cost tracked',auto:0},{n:'GovaaBazaar',what:'Internal',fee:'₹0 · cost tracked',auto:0},{n:'JDAC HR Consultancy',what:'Internal',fee:'₹0 · cost tracked',auto:0}];
 D.lib=[
  {id:'C1',t:'Ye hai JDAC Parivaar · D1',type:'Video',co:'log',mode:'Organic',plat:'Instagram',by:'swapnil',tags:['darshan','neetu'],at:dAgo(1),link:'#'},
  {id:'C2',t:'Raat 11 baje ka call · N1',type:'Video',co:'log',mode:'Organic',plat:'Instagram',by:'swapnil',tags:['neetu'],at:dAgo(1),link:'#'},
  {id:'C3',t:'Pick any 6 @ ₹999 · static',type:'Static',co:'gb',mode:'Paid',plat:'Facebook',by:'omparvate',tags:[],at:dAgo(5),link:'#'},
  {id:'C4',t:'Compare transporters · landing page',type:'Landing page',co:'log',mode:'Paid',plat:'Website',by:'himanshu',tags:[],at:dAgo(9),link:'#'},
  {id:'C5',t:'Hospital bed on rent · Pune',type:'Ad creative',co:'jup',mode:'Paid',plat:'Facebook',by:'omparvate',tags:[],at:dAgo(7),link:'#'},
  {id:'C6',t:'Hire staff in 48 hours',type:'Static',co:'hr',mode:'Paid',plat:'Instagram',by:'swapnil',tags:['nameera'],at:dAgo(4),link:'#'},
  {id:'C7',t:'Volumetric weight explainer',type:'Video',co:'log',mode:'Organic',plat:'YouTube',by:'swapnil',tags:['darshan'],at:dAgo(20),link:'#'},
  {id:'C8',t:'Bahiram · November reel set',type:'Video',co:'studios',mode:'Organic',plat:'Instagram',by:'swapnil',tags:[],at:dAgo(2),link:'#'}];
 const PV=[['D1','Ye hai JDAC Parivaar (launch)','darshan'],['N1','Raat 11 baje ka call','neetu'],['D2','Logistics ka timetable','darshan'],['N2','Sirf 10 kilo hai','neetu'],['D3','Dimensions in 30 sec','darshan'],['N3','Gaadi kab aayegi?','neetu'],['D4','Pickup checklist','darshan'],['N4','Meri apni gaadi hai','neetu'],['D5','Part-load ya apni gaadi','darshan'],['N5','Hadtaal wala din','neetu'],['D6','Jab highway band ho','darshan'],['N6','Diwali ki chhutti','neetu'],['D7','Main ne JDAC kyun banaya','darshan'],['N7','Mahabaleshwar, Part 1','neetu'],['D8','Urgent delivery playbook','darshan'],['N8','Mahabaleshwar, Part 2','neetu'],['D9','Carrier 3 mahine baad','darshan'],['N9','5 types of customers','neetu'],['D10','JDAC ke 5 vaade','darshan'],['N10','Role swap with Darshan','neetu']];
 D.parivaar=PV.map((x,i)=>({code:x[0],t:x[1],face:x[2],day:i+1,date:addD(TODAY,i-1),st:i<2?'Posted':i<4?'Edit':i<6?'Shoot':'Script'}));
 D.att=[
  {k:'neetu',in:'09:52',st:'In',gps:'Office · 40 m'},{k:'balaji',in:'10:14',st:'Late',gps:'Office · 60 m'},{k:'imran',in:'09:58',st:'In',gps:'Office · 30 m'},
  {k:'mohin',in:'09:47',st:'In',gps:'Office · 20 m'},{k:'omadsul',in:'09:40',st:'In',gps:'Panvel · field'},{k:'nameera',in:'09:35',st:'In',gps:'Office · 10 m'},
  {k:'snehalz',in:'',st:'Leave',gps:''},{k:'snehalb',in:'10:02',st:'In',gps:'Office · 35 m'},{k:'atmaram',in:'09:30',st:'In',gps:'Goa · live'},
  {k:'zubair',in:'09:15',st:'In',gps:'Warehouse · live'},{k:'abrar',in:'09:20',st:'In',gps:'Live · Kothrud'},{k:'mustafa',in:'09:22',st:'In',gps:'Live · Viman Nagar'},
  {k:'samadhan',in:'',st:'Week off',gps:'Rotational'},{k:'swapnil',in:'10:20',st:'Late',gps:'Office · 50 m'},{k:'omparvate',in:'',st:'Not in',gps:''},{k:'himanshu',in:'10:05',st:'In',gps:'Office · 25 m'}];
 D.leave=[{k:'snehalz',from:TODAY,to:TODAY,why:'Family function',st:'Approved'},{k:'imran',from:addD(TODAY,5),to:addD(TODAY,5),why:'Exam',st:'Pending'},{k:'mustafa',from:addD(TODAY,2),to:addD(TODAY,2),why:'Personal',st:'Pending'}];
 D.assets=[{a:'Laptop · Dell #04',k:'himanshu'},{a:'SIM · CSE line 2',k:'neetu'},{a:'Bike · MH12 (company)',k:'abrar'},{a:'Eeco van · Goa',k:'atmaram'},{a:'Mobile · Redmi #07',k:'zubair'},{a:'Porter business login',k:'zubair'}];
 D.ledger=[{k:'neetu',what:'Spot incentive · 5 orders',amt:200,at:dAgo(1),st:'Approved · Nameera'},{k:'mohin',what:'Pickup 90% · team pot share',amt:90,at:dAgo(1),st:'Waiting for Nameera'},{k:'omadsul',what:'Pickup 90% · team pot share',amt:90,at:dAgo(1),st:'Waiting for Nameera'},{k:'abrar',what:'TA · 22 km × ₹3',amt:66,at:dAgo(1),st:'Approved · Zubair'}];
 D.training={today:{t:'New rule: OTP login from 1 Dec',must:1,q:'From 1 December, how do you log in on desktop?',opts:['Username + password','OTP on my phone','No login needed'],ans:1},done:{}};
 D.invoices=[
  {no:'GB/26-27/0412',co:'gb',to:'Fernandes General Store',amt:2580,st:'Paid',at:dAgo(1)},{no:'GB/26-27/0413',co:'gb',to:'Coastal Mart',amt:2160,st:'Outstanding',at:dAgo(1)},
  {no:'JL/26-27/1180',co:'log',to:'Booking JL-55018',amt:1890,st:'Paid',at:dAgo(2)},{no:'JDAC/HR/26-27/0007',co:'hr',to:'Jupiter Equipment',amt:9440,st:'Paid',at:dAgo(9)},
  {no:'JS/26-27/0031',co:'studios',to:'Bahiram',amt:35400,st:'Draft',at:addD(TODAY,8)},{no:'JE/26-27/0221',co:'jup',to:'Transport · JE-881',amt:1800,st:'To verify',at:dAgo(1)}];
 D.pl={gb:[184000,121000],log:[612000,498000],jup:[96000,61000],hr:[18000,9000],studios:[230000,142000]};
 return D;
}
let D;try{D=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!D||!D.targets)D=seed();
function save(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}

