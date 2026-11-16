import * as L from './functions/kais-cron/logic.ts';
let bad=0;const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b)){bad++;console.log('FAIL',m,JSON.stringify(a),JSON.stringify(b))}else console.log('ok',m)};
const now={date:'2026-11-15',min:16*60};
const ekip={RCFG:{k:{hrs:3}},TABLES:[{id:'t1',name:'Masa 1'}],RESV:[
 {id:'a',name:'Ayşe Yılmaz',email:'a@x.com',phone:'0532',n:4,date:'2026-11-15',time:'19:00',st:'onay',tids:['t1'],note:'Doğum günü'},
 {id:'b',name:'Mehmet',email:'bad',n:2,date:'2026-11-15',time:'19:00',st:'onay'},
 {id:'c',name:'Can',email:'c@x.com',n:2,date:'2026-11-16',time:'12:00',st:'onay'},
 {id:'d',name:'Dilek',email:'d@x.com',n:2,date:'2026-11-15',time:'21:00',st:'onay',cs:{t:1}},
 {id:'e',name:'Eda',email:'e@x.com',n:2,date:'2026-11-14',time:'21:00',st:'onay'},
 {id:'f',name:'Fer',email:'f@x.com',n:2,date:'2026-11-15',time:'18:00',st:'iptal'}]};
let j=L.planMails(ekip,'Çınar',now);
eq(j.map(x=>x.kind+x.id),['confa','rema','confc'],'conf+rem plan');
eq(L.planMails({...ekip,RCFG:{k:{auto:false}}},'Çınar',now),[],'auto kapalı');
eq(L.planMails({...ekip,RCFG:{k:{on:false}}},'Çınar',now),[],'kais kapalı');
console.log(j[0].text);
const vd={VD_T:[{id:'t1',s:'08:00',e:'16:00'},{id:'t3',s:'15:00',e:'00:00'}],VD_F:{'2026-11-15':{u4:'t1',u5:'t3',u6:'t3',u7:'off',u8:'t3'}}};
const ek2={CLOCK:[{uid:'u5',date:'2026-11-15'}],LEAVES:[{uid:'u8',txt:'14–16 Kas'}]};
eq(L.planLate(ek2,vd,{date:'2026-11-15',min:15*60+30}).map(x=>x.uid),['u4','u6'],'late: u5 giriş var, u8 izinde');
eq(L.planLate(ek2,vd,{date:'2026-11-15',min:15*60+5}).map(x=>x.uid),['u4'],'late: u6 5dk geç, henüz değil');
eq(L.nowIn('Europe/Istanbul',new Date('2026-11-15T13:30:00Z')),{date:'2026-11-15',min:16*60+30},'tz');

{const mk=(m,u,n)=>Array.from({length:n},(_,i)=>({msg:m,view:'muhasebe',ver:'v156',user_id:u||('u'+i)}));
 const t=new Date('2026-11-16T12:00:00Z');
 eq(L.planErrors([],t),[], 'alarm: hata yok');
 eq(L.planErrors(mk('x is not defined','a',3),t),[], 'alarm: tek kisi 3 hata esik alti');
 eq(L.planErrors(mk('x is not defined','a',5),t).length,1,'alarm: 5 hata alarm');
 eq(L.planErrors([...mk('Boom 12','a',1),...mk('Boom 99','b',1)],t).length,1,'alarm: 2 kisi ayni hata (sayilar ayni imza)');
 eq(L.planErrors([...mk('e1','a',4),...mk('e2','b',4),...mk('e3','c',4)],t).length,1,'alarm: tur basi esik alti ama toplam 12 -> tek genel alarm');
 eq(L.planErrors(mk('p','a',3).concat(mk('q','b',3),mk('r','c',3),mk('s','d',3)),t)[0].key.startsWith('errs:'),true,'alarm: toplam 12 -> genel alarm');
 eq(L.planErrors(mk('x','a',5),t)[0].key===L.planErrors(mk('x','a',5),new Date('2026-11-16T12:40:00Z'))[0].key,true,'alarm: ayni saatte ayni anahtar');
 eq(L.planErrors(mk('x','a',5),t)[0].key===L.planErrors(mk('x','a',5),new Date('2026-11-16T13:10:00Z'))[0].key,false,'alarm: yeni saat yeni anahtar');}
{const st={rec:[{id:'r1',desc:'Kira',day:5,total:1000,dir:'gider',acc:'Kira'},{id:'r2',desc:'Gelecek',day:20,total:50},{id:'r3',desc:'Kapali',day:1,total:9,off:true},{id:'r4',desc:'Sonra',day:1,total:9,from:'2026-12'},{id:'r5',desc:'Var',day:1,total:7}]};
 const a=L.planRec(st,[{id:'gr_r5_2026-11'}],now);
 eq(a.map(x=>x.id),['gr_r1_2026-11'],'rec: sadece gunu gelen, kapali/gelecek/var atlanir');
 eq(a[0].iso,'2026-11-05','rec: tarih');
 eq(L.planRec(st,[...a,{id:'gr_r5_2026-11'}],now),[],'rec: ikinci calisma cift yazmaz');
 eq(L.planRec({rec:[{id:'z',day:31,total:5}]},[],now),[],'rec: gunu gelmeyen atlanir');
 eq(L.planRec({rec:[{id:'z',day:31,total:5}]},[],{date:'2026-11-30',min:600}).map(x=>x.iso),['2026-11-30'],'rec: gun 31 ayin son gunu');
 eq(L.planRec(null,[],now),[],'rec: ayar yok');
 const inv=[{cust:'A',tot:1000,due:'2026-11-10',st:'bekliyor',pays:[{amt:400}]},{cust:'B',tot:300,due:'2026-11-20',st:'bekliyor'},{cust:'C',tot:50,due:'2026-11-01',st:'odendi'}];
 eq(L.invOpen(inv[0]),600,'inv: kismi kalan');
 const t10={date:'2026-11-15',min:10*60+5};
 const o=L.planOverdue(inv,t10); eq(o&&o.key,'overdue:2026-11-15','overdue: anahtar'); console.log(o&&o.body);
 eq(L.planOverdue(inv,{date:'2026-11-15',min:9*60}),null,'overdue: erken');
 eq(L.planOverdue([inv[1],inv[2]],t10),null,'overdue: vadesi gelmemis/odenmis');}
console.log(bad?'FAILED':'ALL OK');
{const d=L.planDaily({MAINT:[{st:'acik',pri:'acil'},{st:'bitti'}],REQS:[{st:'bekliyor'}],LVREQ:[{status:'bekliyor'}],MPLAN:[{every:30,last:'2026-10-01'}],RESV:[{date:'2026-11-15',st:'onay',n:4}]},{date:'2026-11-15',min:9*60+5});
console.log(d&&d.body, L.planDaily({}, {date:'2026-11-15',min:9*60+5}), L.planDaily({MAINT:[{st:'acik'}]},{date:'2026-11-15',min:12*60}));}
