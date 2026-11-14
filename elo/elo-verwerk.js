// elo-verwerk.js — zet data-elo.js (opgehaald door "Elo bijwerken.bat") om naar window.ELO voor elo.html.
(function(){
'use strict';
const B=window.BRON_ELO;window.ELO=null;if(!B)return;
const dec=b=>{try{const s=atob(b);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new TextDecoder('utf-8').decode(u).replace(/^﻿/,'')}catch(e){return ''}};
const J=b=>{try{return JSON.parse(dec(b))}catch(e){return null}};
const inst=B.instellingen||{};const club=+(inst.club||309);const vanaf=/^\d{4}-\d\d$/.test(inst.vanaf||'')?inst.vanaf:'2024-03';const tot=inst['elo verwerkt tot']||'';
const vandaag=(B.tijd||new Date().toISOString()).slice(0,10);
const seizoen=+inst.seizoen||(+vandaag.slice(0,4)-(+vandaag.slice(5,7)<7?1:0));
const fouten=[].concat(B.fouten||[]);
const MM={Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
const addM=(ym,k)=>{let y=+ym.slice(0,4),m=+ym.slice(5,7)+k;while(m>12){m-=12;y++}while(m<1){m+=12;y--}return y+'-'+String(m).padStart(2,'0')};
const nrm=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

// ---------- leden ----------
const API=B.api||{};const LED={},NAAM={};
for(const k of Object.keys(API))if(k.startsWith('clubmembers_')){const l=J(API[k]);if(!Array.isArray(l)){fouten.push('ledenlijst '+k.slice(12)+' onleesbaar');continue}
  for(const m of l){const n=m.last_name+', '+m.first_name;LED[m.idnumber]={id:m.idnumber,n,by:m.birthyear||0,fr:m.fiderating||0,fide:m.idfide||0,club:m.idclub,tit:m.fidetitle||'',g:m.gender||''};NAAM[nrm(n)]??=m.idnumber}}
for(const k of Object.keys(API))if(k.startsWith('member_')){const m=J(API[k]);if(m&&m.idnumber&&!LED[m.idnumber]){const n=m.last_name+', '+m.first_name;LED[m.idnumber]={id:m.idnumber,n,by:m.birthyear||0,fr:m.fiderating||0,fide:m.idfide||0,club:m.idclub};NAAM[nrm(n)]??=m.idnumber}}
/* spelers die geen clublid zijn maar gevolgd worden (instellingen.txt: "extern <FIDE-nummer> = Achternaam, Voornaam") */
{const FL=new Set(Object.values(LED).map(m=>String(m.fide||'')));for(const [k,v] of Object.entries(inst)){const x=/^extern\s+(\d{4,10})$/.exec(k);if(!x||FL.has(x[1]))continue;const n=String(v||'').trim()||('FIDE '+x[1]);LED['x'+x[1]]={id:'x'+x[1],n,by:0,fr:0,fide:+x[1],club:0,tit:'',g:'',ext:1};NAAM[nrm(n)]??='x'+x[1]}}
const eigen=Object.values(LED).filter(m=>m.club===club).sort((a,b)=>a.n.localeCompare(b.n,'nl'));
const idOf=n=>NAAM[nrm(n)]||null;

// ---------- FIDE: maandratings ----------
let laatste='';const CH={};
for(const [id,b] of Object.entries(B.chart||{})){const a=J(b);if(!Array.isArray(a))continue;const L={};
  for(const x of a){const p=(x.date_2||'').split('-');const ym=p[0]+'-'+MM[p[1]];if(!MM[p[1]])continue;L[ym]=[+x.rating||null,+x.period_games||0,+x.rapid_rtng||null,+x.rapid_games||0,+x.blitz_rtng||null,+x.blitz_games||0]/* 0 = geen rating */;if(ym>laatste)laatste=ym}
  CH[id]=L}
if(!laatste)laatste=vandaag.slice(0,7);
/* ledenlijst van de openbare spelerspagina (zonder ratings): rating van de laatste FIDE-lijst */
for(const m of Object.values(LED))if(!m.fr&&m.fide&&CH[m.fide]&&CH[m.fide][laatste])m.fr=CH[m.fide][laatste][0]||0;
const M=[];for(let ym=addM(vanaf,-1);ym<=laatste;ym=addM(ym,1))M.push(ym);

// ---------- FIDE: individuele berekeningen ----------
const num=s=>{s=String(s||'').replace(/&nbsp;| |\s/g,'');return s===''||isNaN(+s)?null:+s};
function parseCalc(t){const d=new DOMParser().parseFromString('<div>'+t+'</div>','text/html');const out=[];let cur=null;
  for(const el of d.body.querySelectorAll('div.rtng_line01 a.head1, div.rtng_line02, table.calc_table')){
    if(el.matches('a.head1')){cur={n:el.textContent.trim(),ev:+(((el.getAttribute('href')||'').match(/event=(\d+)/)||[0,0])[1]),pl:'',d:[],s:null,g:[]};out.push(cur)}
    else if(el.matches('div.rtng_line02')){if(cur&&!cur.pl){const s=el.querySelector('strong');if(s){cur.pl=s.textContent.trim();cur.d=[...el.querySelectorAll('.dates_span')].map(x=>x.textContent.trim())}}}
    else if(cur){for(const tr of el.querySelectorAll('tr')){const td=[...tr.querySelectorAll('td')];if(td.length<10)continue;
      if((tr.getAttribute('bgcolor')||'').toLowerCase()==='#e6e6e6'){cur.s={rc:num(td[0].textContent),ro:num(td[1].textContent),w:num(td[5].textContent),n:num(td[6].textContent),chg:num(td[7].textContent),K:num(td[8].textContent),kc:num(td[9].textContent)};continue}
      const sp=td[0].querySelector('span');if(!sp)continue;const col=/white/.test(sp.className)?'w':/black/.test(sp.className)?'b':'';
      cur.g.push({c:col,o:td[0].textContent.replace(/ /g,' ').trim(),ot:td[1].textContent.trim(),or:num(td[3].textContent),f:td[4].textContent.trim(),r:num(td[5].textContent),chg:num(td[7].textContent),K:num(td[8].textContent),kc:num(td[9].textContent)})}}}
  return out}
const CALC={};// fide -> t -> [games]
for(const [k,b] of Object.entries(B.calc||{})){const m=/^(\d+)_(\d{4}-\d\d)_(\d)$/.exec(k);if(!m)continue;const [,id,ym,t]=m;if(ym<vanaf)continue;
  let tours;try{tours=parseCalc(dec(b))}catch(e){fouten.push('FIDE-berekening '+k+' onleesbaar');continue}
  const P=(CALC[id]??=[[],[],[]]);
  for(const T of tours){const land=(T.pl.match(/\b([A-Z]{3})\s*$/)||[])[1]||'';for(const g of T.g)P[+t].push({ym,tour:T.n,ev:T.ev,pl:T.pl,land,d1:T.d[0]||'',d2:T.d[1]||'',ro:T.s?T.s.ro:null,K:g.K??(T.s&&T.s.K),...g})}}
for(const P of Object.values(CALC))for(const L of P)L.sort((a,b)=>(a.ym+a.d1).localeCompare(b.ym+b.d1));

// ---------- lichess-studie (KRST YouTube): partijen met zetten, voor de links ----------
const STUDIE=[];const sid=B.studieId||'';
for(const [ch,b] of Object.entries(B.studie||{})){const t=dec(b).replace(/\r/g,'');
  for(const part of t.split(/\n\n(?=\[Event )/)){const h={};part.replace(/^\[(\w+) "([^"]*)"\]/gm,(m,k,v)=>{h[k]=v;return m});
    let w=h.White||'',z=h.Black||'';
    if((!w||w==='?')&&(!z||z==='?')){let c=(h.Event||'').split(': ').slice(1).join(': ')||h.ChapterName||'';c=c.replace(/^\s*\d+\/\d+:\s*/,'').replace(/^(r(onde)?|round|partie)\s*\d+\s*[:.\-]?\s*/i,'').replace(/\s+(1-0|0-1|1\/2-1\/2|½-½).*$/,'');
      const m=c.split(/\s+(?:-|vs\.?|–)\s+/);if(m.length!==2)continue;w=m[0].replace(/\(.*?\)/g,'').trim();z=m[1].replace(/\(.*?\)/g,'').trim()}
    let d=(h.Date||'').replace(/\./g,'-');if(!/^\d{4}-\d\d-\d\d$/.test(d))d=(h.UTCDate||'').replace(/\./g,'-');if(!/^\d{4}-\d\d-\d\d$/.test(d))continue;
    let s=part.replace(/^\[.*\]\s*$/gm,'').replace(/\{[^}]*\}/g,'');while(/\([^()]*\)/.test(s))s=s.replace(/\([^()]*\)/g,'');
    const nums=[...s.matchAll(/(\d+)\.(?!\.)/g)].map(m=>+m[1]);
    STUDIE.push({w,b:z,d,r:h.Result||'*',n:nums.length?Math.max(...nums):0,u:h.ChapterURL||('https://lichess.org/study/'+sid+'/'+ch),e:(h.Event||'').split(': ')[0]||'KRST YouTube'})}}

// ---------- clubkampioenschap (SWAR) ----------
const iso=dmy=>{const m=/(\d\d)\/(\d\d)\/(\d{4})/.exec(dmy||'');return m?m[3]+'-'+m[2]+'-'+m[1]:null};
const elo=s=>{const m=/\((\d+)\)/.exec(s||'');return m?+m[1]:0};
/* SWAR (en OpenResults, chess-results, FFE) tonen de rating van bij de start van het toernooi, maar de FIDE-ratings veranderen elke maand.
   Nog niet verwerkte partijen worden verwerkt met de rating van de laatste FIDE-lijst: voor een clublid (of een andere speler met een
   gekende FIDE-geschiedenis) nemen we daarom die rating; anders die van het toernooi. */
const rNu=(n,dt,r0)=>{const id=idOf(n);const m=id&&LED[id];if(!m)return r0;const c=m.fide&&CH[m.fide];
  if(c&&c[laatste])return c[laatste][0]||0;   /* staat niet (meer) met een rating op de laatste lijst: geen rating */
  return m.fr||r0};
/* Al verwerkt? FIDE zet elke partij in de berekening van de maandlijst waarin ze verwerkt werd. Een partij telt als verwerkt
   als er bij de speler in een lijst na de maand van de partij een standaardpartij staat tegen dezelfde tegenstander
   (achternaam, en voorletter als die er is) met dezelfde uitslag. Zo wordt per toernooi en per partij nagegaan wat al
   op een FIDE-lijst staat, ook als een arbiter nog niet (alles) doorgestuurd heeft. */
const vNaam=x=>{x=nrm(x);const i=x.indexOf(',');return i>=0?[x.slice(0,i).trim(),x.slice(i+1).trim().charAt(0)]:[x,'']};
const verwerkt=(n,o,dt,r)=>{const id=idOf(n);const m=id&&LED[id];const P=m&&m.fide&&CALC[m.fide];if(!P||!dt||!o)return false;const ym=String(dt).slice(0,7);
  const [oa,ov]=vNaam(o);const geen=oa.indexOf(' ')>0&&o.indexOf(',')<0;   /* naam zonder komma (bv. "Bol Pierre"): achternaam zit erin */
  /* ook de lijst van de maand van de ronde zelf: een partij die vooraf gespeeld werd (bv. op een inhaaldag), staat al op die lijst */
  for(const g of P[0]){if(g.ym<ym)continue;const [ga,gv]=vNaam(g.o);
    if(geen?!(oa.startsWith(ga+' ')||oa.endsWith(' '+ga)||oa===ga):ga!==oa)continue;if(gv&&ov&&gv!==ov&&!geen)continue;
    if(r!=null&&g.r!=null&&Math.abs(g.r-r)>.01)continue;return true}return false};
const VWK={};   /* per toernooi: aantal partijen dat al op een FIDE-lijst staat */
const pend={},rest={};const add=(n,x)=>{if(x.r!=null&&verwerkt(n,x.o,x.dt,x.r)){const t=String(x.tour||'').replace(/ r\d+( ·.*)?$/,'');VWK[t]=(VWK[t]||0)+1;return}(pend[nrm(n)]??=[]).push(x)};const addR=(n,x)=>(rest[nrm(n)]??=[]).push(x);
/* volgende partij per lid en per gekoppeld toernooi: de laagste ronde die al gepaard is maar nog geen uitslag heeft (bezig of nog te spelen) */
const VOLG={};const addV=(n,x)=>{const L=(VOLG[n]??=[]);const j=L.findIndex(y=>y.tour===x.tour);if(j<0)L.push(x);else if(x.rn<L[j].rn)L[j]=x};
const urlT=naam=>(B.toernooien||{})[naam]||'';
const Ex=(a,b)=>1/(1+10**(Math.max(-400,Math.min(400,b-a))/400));
const lastK={};for(const m of eigen){const P=CALC[m.fide];if(P&&P[0].length){const g=P[0][P[0].length-1];lastK[nrm(m.n)]=g.K}}
const Kof=(n,r)=>{const id=idOf(n);const by=id&&LED[id]?LED[id].by:0;if((r||0)>=2400)return 10;if(by&&by>=seizoen-18&&(r||0)<2300)return 40;return lastK[nrm(n)]||20};
const ddmm=d=>d.slice(8,10)+'/'+d.slice(5,7);
let clubInfo=[];
/* gekoppelde toernooien (instellingen.txt: toernooi <naam> = <adres>), voor het overzicht op elo.html */
const TOERN={};const tInfo=(naam,soort)=>{const t=(TOERN[naam]??={naam,soort,url:(B.toernooien||{})[naam]||'',rondes:0,partijen:0,sp:new Set(),laatste:'',opm:[]});if(soort&&!t.soort)t.soort=soort;return t};
const isLid=n=>{const id=idOf(n);return !!(id&&LED[id]&&LED[id].club===club)};
/* clublid of gevolgde speler (extern): voor de volgende partij */
const isVolg=n=>{const id=idOf(n);return !!(id&&LED[id]&&(LED[id].club===club||LED[id].ext))};
const telT=(naam,rn,dt,leden)=>{const t=tInfo(naam);t.rondes=Math.max(t.rondes,rn);if(dt>t.laatste)t.laatste=dt;for(const n of leden){t.partijen++;t.sp.add(n)}};
for(const [k,b64] of Object.entries(B.swar||{})){if(/^[OCF]:/.test(k))continue;const html=dec(b64);const ander=k.startsWith('T:');const naamT=rn=>ander?k.slice(2)+' r'+rn:'Clubkampioenschap '+seizoen+' reeks '+k+' r'+rn;if(!/tr id=.Round/.test(html)){fouten.push('SWAR-pagina '+k+' onleesbaar');continue}
  const d=new DOMParser().parseFromString(html,'text/html');let laatsteR=0;
  for(const tr of d.querySelectorAll('tr[id^="Round"]')){const rn=+tr.id.slice(5);const dt=iso(tr.textContent)||vandaag;const t=tr.closest('table');
    for(const r of t.querySelectorAll('tr')){if(r===tr)continue;const c=[...r.children].map(x=>x.textContent.replace(/\s+/g,' ').trim());if(c.length<6||c[1]===''||/Naam/.test(c[1]))continue;
      if(/^bye$/i.test(c[5])||(c[5]===''&&c[4]==='1'))continue;let res=(c[4]||'').replace(/\s+/g,'');
      if((res===''||res==='-')&&ander&&c[5]){const a=c[1],b=c[5];for(const [me,op,ro,kl] of [[a,b,elo(c[7]),'w'],[b,a,elo(c[3]),'z']])if(isVolg(me))addV(me,{tour:k.slice(2),rn,dt,o:op,or:rNu(op,'',ro)||null,c:kl,bo:c[0]||'',url:urlT(k.slice(2))});continue}
      if(res===''||res==='-'){/* nog te spelen: voor de prognose (alleen het clubkampioenschap) */if(c[5]&&!ander){const a=c[1],b=c[5],ra=rNu(a,'',elo(c[3])),rb=rNu(b,'',elo(c[7]));for(const [me,rm,op,ro] of [[a,ra,b,rb],[b,rb,a,ra]])addR(me,{dt,tour:naamT(rn),o:op,or:ro||null,ro:rm||null,K:Kof(me,rm)})}continue}
      if(/ff|\+|^-/i.test(res))continue;const sa=/^1-0$/.test(res)?1:/^0-1$/.test(res)?0:/^(½|0[.,]5)-(½|0[.,]5)$/.test(res)?.5:null;if(sa==null)continue;
      if(tot&&dt<=tot)continue;laatsteR=Math.max(laatsteR,rn);
      const a=c[1],b=c[5],ra=rNu(a,dt,elo(c[3])),rb=rNu(b,dt,elo(c[7]));const when=dt>vandaag?'vooraf (r'+rn+')':ddmm(dt);
      if(ander){tInfo(k.slice(2),'SWAR');telT(k.slice(2),rn,dt,[a,b].filter(isLid))}
      for(const [me,rm,op,ro,sc] of [[a,ra,b,rb,sa],[b,rb,a,ra,1-sa]]){const K=Kof(me,rm);add(me,{d:when,dt,tour:naamT(rn),o:op,or:ro||null,ro:rm||null,r:sc,K,chg:(rm&&ro)?Math.round(K*(sc-Ex(rm,ro))*10)/10:null})}}}
  clubInfo.push((ander?k.slice(2):k)+(laatsteR?' (tot ronde '+laatsteR+')':''))}

// ---------- OpenResults (openresults.zerotwo.cloud): een pagina per ronde, tabel "pairings" ----------
{const OR={};
  for(const [k,b64] of Object.entries(B.swar||{})){if(!k.startsWith('O:'))continue;const i=k.lastIndexOf('#');const naam=k.slice(2,i),rn=+k.slice(i+1);
    let d;try{d=new DOMParser().parseFromString(dec(b64),'text/html')}catch(e){fouten.push('OpenResults '+naam+' ronde '+rn+' onleesbaar');continue}
    const h2=d.querySelector('main section h2')||d.querySelector('h2');const dm=/(\d{4}-\d\d-\d\d)/.exec(h2?h2.textContent:'');const dt=dm?dm[1]:vandaag;
    const T=d.querySelector('table.pairings');if(!T){fouten.push('OpenResults '+naam+' ronde '+rn+': geen paringen gevonden');continue}
    for(const tr of T.querySelectorAll('tbody tr')){const nm=q=>{const e=tr.querySelector(q);return e?e.textContent.replace(/\s+/g,' ').trim():''};
      const a=nm('.seat-white .name')||nm('.seat-white'),b=nm('.seat-black .name')||nm('.seat-black');if(!a||!b)continue;
      const R=[...tr.querySelectorAll('td.col-rating')].map(x=>parseInt(x.textContent,10)||0);const ra=rNu(a,dt,R[0]||0),rb=rNu(b,dt,R[1]||0);
      const res=(nm('.col-result .token')||nm('.col-result')).replace(/\s+/g,'').replace(/½/g,'1/2');
      const sa=res==='1-0'?1:res==='0-1'?0:res==='1/2-1/2'?.5:null;
      if(sa==null){if(res===''||res==='-'||res==='–'){const bo=nm('.col-board')||nm('td.col-table')||'';for(const [me,op,ro,kl] of [[a,b,R[1],'w'],[b,a,R[0],'z']])if(isVolg(me))addV(me,{tour:naam,rn,dt,o:op,or:ro||null,c:kl,bo,url:urlT(naam)})}continue}   /* nog te spelen (volgende partij), forfait of bye */
      if(tot&&dt<=tot)continue;(OR[naam]??={r:0}).r=Math.max(OR[naam].r,rn);const when=dt>vandaag?'vooraf (r'+rn+')':ddmm(dt);
      tInfo(naam,'OpenResults');telT(naam,rn,dt,[a,b].filter(isLid));
      for(const [me,rm,op,ro,sc] of [[a,ra,b,rb,sa],[b,rb,a,ra,1-sa]]){if(!idOf(me))continue;const K=Kof(me,rm);add(me,{d:when,dt,tour:naam+' r'+rn,o:op,or:ro||null,ro:rm||null,r:sc,K,chg:(rm&&ro)?Math.round(K*(sc-Ex(rm,ro))*10)/10:null})}}}
  for(const [n,o] of Object.entries(OR))clubInfo.push(n+(o.r?' (tot ronde '+o.r+')':''))}

// ---------- chess-results: "C:<naam>#0" = toernooi-info met spelerslijst (art=0), "C:<naam>#<n>" = paringen van ronde n (art=2) ----------
/* gedeeld door chess-results en FFE */
const FIDX={};for(const m of Object.values(LED))if(m.fide)FIDX[String(m.fide)]=m.id;
const nmCR=x=>String(x||'').replace(/,\s*-\s*$/,'').replace(/\s+/g,' ').trim();
/* "Achternaam, Voornaam", of zonder komma ("Dalschaert Didier", "ULENAERS Marc"): alle splitsingen proberen */
const idCR=(n,fid)=>{if(fid&&FIDX[fid])return FIDX[fid];let id=idOf(n);if(id)return id;if(!n.includes(',')){const w=n.split(' ');for(let i=1;i<w.length;i++){id=idOf(w.slice(0,i).join(' ')+', '+w.slice(i).join(' '))||idOf(w.slice(i).join(' ')+', '+w.slice(0,i).join(' '));if(id)return id}}return null};
const pars=b=>{try{return new DOMParser().parseFromString(dec(b),'text/html')}catch(e){return null}};
/* speeltempo uit een tekst als "90 min + 30 s / move", "1h30 + [30'']", "12' + [3'']", "Rapid: 15+10": FIDE-grenzen voor 60 zetten */
const tempoVan=x=>{x=String(x||'').toLowerCase();if(!x)return null;if(/blitz/.test(x))return 'blitz';if(/rapid|rapide/.test(x))return 'rapid';
  let base=null,m=/(\d+)\s*h\s*(\d+)?/.exec(x);if(m)base=+m[1]*60+(+m[2]||0);else{m=/(\d+)\s*(?:min|'|’|m\b|\+)/.exec(x);if(m)base=+m[1]}
  if(base==null)return null;const inc=/\+\s*\[?\s*(\d+)\s*(?:s\b|sec|''|"|’’)/.exec(x)||/^\D*\d+\s*\+\s*(\d+)\s*$/.exec(x);const tot=base+(inc?+inc[1]:0);return tot>=60?'standaard':tot>10?'rapid':'blitz'};
{
  const CR={};for(const [k,b64] of Object.entries(B.swar||{})){if(!k.startsWith('C:'))continue;const i=k.lastIndexOf('#');(CR[k.slice(2,i)]??={})[+k.slice(i+1)]=b64}
  for(const [naam,R] of Object.entries(CR)){const t=tInfo(naam,'chess-results');
    /* toernooi-info: FIDE-gerateerd? FIDE-id per startnummer en per naam */
    const FID={};let fideOk=null,datum1='',tmp=null;
    const d0=R[0]&&pars(R[0]);
    if(d0){const inf={};for(const td of d0.querySelectorAll('td')){const nx=td.nextElementSibling;if(nx)inf[td.textContent.trim()]??=nx.textContent.trim()}
      const tk=Object.keys(inf).find(k=>/^Time control/i.test(k));if(tk)tmp=tempoVan(tk+' '+inf[tk]);
      if(inf['Rating calculation'])fideOk=/international/i.test(inf['Rating calculation']);const dm=/(\d{4})\/(\d\d)\/(\d\d)/.exec(inf['Date']||'');if(dm)datum1=dm[1]+'-'+dm[2]+'-'+dm[3];
      for(const tr of d0.querySelectorAll('table.CRs1 tr')){const c=[...tr.cells].map(x=>x.textContent.trim());const h=[...(d0.querySelector('table.CRs1 tr')||{cells:[]}).cells].map(x=>x.textContent.trim());const iN=h.indexOf('Name'),iF=h.indexOf('FideID'),iS=h.indexOf('No.');if(iN<0||iF<0||c[iN]==='Name')continue;if(/^\d{3,}$/.test(c[iF])){FID[nmCR(c[iN])]=c[iF];if(iS>=0)FID['#'+c[iS]]=c[iF]}}}
    if(fideOk===false){t.opm.push('niet FIDE-gerateerd volgens chess-results: niet meegeteld');continue}
    if(tmp&&tmp!=='standaard'){t.opm.push(tmp+' ('+tmp+'-rating): niet meegeteld, alleen standaardpartijen tellen');continue}
    if(fideOk===null&&!Object.keys(FID).length)t.opm.push('niet zeker of dit toernooi FIDE-gerateerd is: kijk het na op chess-results');
    for(const [rs,b64] of Object.entries(R)){const rn=+rs;if(!rn)continue;const d=pars(b64);if(!d)continue;
      const kop=[...d.querySelectorAll('h3,td,th')].map(x=>x.textContent).find(x=>/Round\s+\d+\s+on\s+\d{4}\/\d\d\/\d\d/.test(x));const dm=kop&&/(\d{4})\/(\d\d)\/(\d\d)/.exec(kop);const dt=dm?dm[1]+'-'+dm[2]+'-'+dm[3]:(datum1||vandaag);
      for(const T of d.querySelectorAll('table.CRs1')){let iW=-1,iB=-1,iR=-1,rt=[],iNw=-1,iNb=-1,iBo=-1;
        for(const tr of T.querySelectorAll('tr')){const c=[...tr.cells].map(x=>x.textContent.replace(/ /g,' ').trim());
          if(c.includes('White')&&c.includes('Black')){iW=c.indexOf('White');iB=c.indexOf('Black');iR=c.indexOf('Result');iBo=c.findIndex(x=>/^(Bo\.?|Board)$/i.test(x));rt=c.map((x,j)=>/^(Rtg|Elo|FideRtg)$/i.test(x)?j:-1).filter(j=>j>=0);
            const nr=c.map((x,j)=>x==='No.'?j:-1).filter(j=>j>=0);iNw=nr.length?nr.reduce((a,j)=>Math.abs(j-iW)<Math.abs(a-iW)?j:a):-1;iNb=nr.length?nr.reduce((a,j)=>Math.abs(j-iB)<Math.abs(a-iB)?j:a):-1;continue}
          if(iW<0||iR<0||c.length<=iB)continue;
          const a=nmCR(c[iW]),b=nmCR(c[iB]);if(!a||!b||/^(bye|spielfrei|not paired|nicht gepaart)$/i.test(b))continue;
          const res=c[iR].replace(/\s+/g,'').replace(/½/g,'1/2');const sa=res==='1-0'?1:res==='0-1'?0:res==='1/2-1/2'?.5:null;
          if(sa==null){if(res===''||res==='-'||res==='-:-'){const rO=i=>{if(!rt.length)return 0;const j=rt.reduce((x,y)=>Math.abs(y-i)<Math.abs(x-i)?y:x);return parseInt(c[j],10)||0};
              const fa=FID[a]||(iNw>=0&&FID['#'+c[iNw]])||'',fb=FID[b]||(iNb>=0&&FID['#'+c[iNb]])||'';const ida=idCR(a,fa),idb=idCR(b,fb);
              for(const [id,op,ro,kl] of [[ida,b,rO(iB),'w'],[idb,a,rO(iW),'z']])if(id&&(LED[id].club===club||LED[id].ext))addV(LED[id].n,{tour:naam,rn,dt,o:op,or:ro||null,c:kl,bo:iBo>=0?c[iBo]:'',url:urlT(naam)})}
            continue}   /* nog te spelen (volgende partij), forfait (+ - -) of bye */
          const rOf=i=>{if(!rt.length)return 0;const j=rt.reduce((x,y)=>Math.abs(y-i)<Math.abs(x-i)?y:x);return parseInt(c[j],10)||0};const ra0=rOf(iW),rb0=rOf(iB);
          const fa=FID[a]||(iNw>=0&&FID['#'+c[iNw]])||'',fb=FID[b]||(iNb>=0&&FID['#'+c[iNb]])||'';
          const ida=idCR(a,fa),idb=idCR(b,fb);const leden=[ida,idb].filter(id=>id&&LED[id].club===club).map(id=>LED[id].n);const ra=ida?rNu(LED[ida].n,dt,ra0):ra0,rb=idb?rNu(LED[idb].n,dt,rb0):rb0;
          telT(naam,rn,dt,leden);if(tot&&dt<=tot)continue;const when=dt>vandaag?'vooraf (r'+rn+')':ddmm(dt);
          for(const [id,rm,op,ro,sc] of [[ida,ra,b,rb,sa],[idb,rb,a,ra,1-sa]]){if(!id)continue;const me=LED[id].n;const K=Kof(me,rm);add(me,{d:when,dt,tour:naam+' r'+rn,o:op,or:ro||null,ro:rm||null,r:sc,K,chg:(rm&&ro)?Math.round(K*(sc-Ex(rm,ro))*10)/10:null})}}}}
    if(t.rondes)clubInfo.push(naam+' (tot ronde '+t.rondes+')')}}

// ---------- FFE (echecs.asso.fr): "F:<naam>#0" = fiche van het toernooi, "F:<naam>#<n>" = ronde n ----------
{const MND={janvier:1,fevrier:2,mars:3,avril:4,mai:5,juin:6,juillet:7,aout:8,septembre:9,octobre:10,novembre:11,decembre:12};
  const frDat=x=>{const m=/(\d{1,2})\s+([a-zéèûô]+)\s+(\d{4})/i.exec(nrm(x));if(!m||!MND[m[2]])return null;return m[3]+'-'+String(MND[m[2]]).padStart(2,'0')+'-'+m[1].padStart(2,'0')};
  const FF={};for(const [k,b64] of Object.entries(B.swar||{})){if(!k.startsWith('F:'))continue;const i=k.lastIndexOf('#');(FF[k.slice(2,i)]??={})[+k.slice(i+1)]=b64}
  for(const [naam,R] of Object.entries(FF)){const t=tInfo(naam,'FFE');const d0=R[0]&&pars(R[0]);const sp=id=>{const e=d0&&d0.getElementById(id);return e?e.textContent.trim():''};
    const dats=sp('LabelDates').split(/\s+-\s+/);const van=frDat(dats[0]),tot2=frDat(dats[1]||dats[0])||van;const nR=+sp('LabelNbrRondes')||0;
    const efm=/([a-zéû]+)\s+(\d{4})/i.exec(nrm(sp('LabelEloFide')));const lijst=efm&&MND[efm[1]]?efm[2]+'-'+String(MND[efm[1]]).padStart(2,'0'):'';
    const tmp=sp('LabelEloRapide')?(tempoVan(sp('LabelCadence'))==='blitz'?'blitz':'rapid'):tempoVan(sp('LabelCadence'));
    if(d0&&!sp('LabelEloFide')){t.opm.push('niet FIDE-gerateerd volgens de FFE: niet meegeteld');continue}
    if(tmp&&tmp!=='standaard'){t.opm.push(tmp+': niet meegeteld, alleen standaardpartijen tellen');continue}
    if(lijst&&lijst<=laatste){t.opm.push('staat al op de FIDE-lijst van '+lijst.slice(5)+'/'+lijst.slice(0,4)+': niet meer meegeteld (haal het toernooi weg)');continue}
    if(lijst)t.opm.push('komt op de FIDE-lijst van '+lijst.slice(5)+'/'+lijst.slice(0,4));
    /* de rondepagina's hebben geen datum: verdelen over de speeldagen van het toernooi */
    const rdDat=rn=>{if(!van)return vandaag;if(!nR||nR<2||tot2===van)return van;const a=Date.parse(van+'T12:00:00Z'),b=Date.parse(tot2+'T12:00:00Z');return new Date(a+(b-a)*(rn-1)/(nR-1)).toISOString().slice(0,10)};
    for(const [rs,b64] of Object.entries(R)){const rn=+rs;if(!rn)continue;const d=pars(b64);if(!d)continue;const dt=rdDat(rn);
      let iW=2,iB=5,iR=4;
      for(const tr of d.querySelectorAll('tr')){const c=[...tr.cells].map(x=>x.textContent.replace(/ /g,' ').trim());
        if(/papi_liste_t/.test(tr.className)){iW=c.indexOf('Blancs');iB=c.indexOf('Noirs');iR=c.indexOf('Res.');continue}
        if(!/papi_liste_[cf]/.test(tr.className)||iW<0||iB<0||iR<0)continue;
        /* "DUPONT Jean" -> "Dupont, Jean" */
        const ffeN=x=>{const w=nmCR(x).split(' ');let i=0;while(i<w.length&&/[A-Z]/.test(w[i])&&w[i]===w[i].toUpperCase())i++;return i&&i<w.length?w.slice(0,i).map(v=>v.charAt(0)+v.slice(1).toLowerCase()).join(' ')+', '+w.slice(i).join(' '):nmCR(x)};
        const a=ffeN(c[iW]),b=ffeN(c[iB]);if(!a||!b||/^exempt/i.test(b))continue;
        const res=c[iR].replace(/\s+/g,'');const sa=res==='1-0'?1:res==='0-1'?0:(res==='X-X'||res==='½-½'||res==='1/2-1/2')?.5:null;
        if(sa==null){if(res===''||res==='-'){const rO=j=>{const m=/^(\d+)\s*[FNE]?$/.exec(c[j+1]||'');return m?+m[1]:0};const ida=idCR(a),idb=idCR(b);
            for(const [id,op,ro,kl] of [[ida,b,rO(iB),'w'],[idb,a,rO(iW),'z']])if(id&&(LED[id].club===club||LED[id].ext))addV(LED[id].n,{tour:naam,rn,dt,o:op,or:ro||null,c:kl,bo:c[0]||'',url:urlT(naam)})}
          continue}   /* nog te spelen (volgende partij), forfait (F) of vrij */
        const rOf=j=>{const m=/^(\d+)\s*F$/.exec(c[j+1]||'');return m?+m[1]:0};const ra0=rOf(iW),rb0=rOf(iB);   /* alleen FIDE-ratings (F), niet nationaal (N) of geschat (E) */
        const ida=idCR(a),idb=idCR(b);const ra=ida?rNu(LED[ida].n,dt,ra0):ra0,rb=idb?rNu(LED[idb].n,dt,rb0):rb0;const leden=[ida,idb].filter(id=>id&&LED[id].club===club).map(id=>LED[id].n);
        telT(naam,rn,dt,leden);if(tot&&dt<=tot)continue;const when=dt>vandaag?'vooraf (r'+rn+')':ddmm(dt);
        for(const [id,rm,op,ro,sc] of [[ida,ra,b,rb,sa],[idb,rb,a,ra,1-sa]]){if(!id)continue;const me=LED[id].n;const K=Kof(me,rm||LED[id].fr);add(me,{d:when,dt,tour:naam+' r'+rn,o:op,or:ro||null,ro:rm||LED[id].fr||null,r:sc,K,chg:((rm||LED[id].fr)&&ro)?Math.round(K*(sc-Ex(rm||LED[id].fr,ro))*10)/10:null})}}}
    if(t.rondes)clubInfo.push(naam+' (tot ronde '+t.rondes+')')}}

// ---------- zelf ingevulde partijen (extra-partijen.txt): datum; toernooi; speler; tegenstander; rating tegenstander; uitslag [; eigen rating] ----------
if(B.extra){const t=dec(B.extra);let n=0;
  t.split(/\r?\n/).forEach((l,i)=>{l=l.trim();if(!l||l.startsWith('#'))return;const f=l.split(';').map(x=>x.trim());
    if(f.length<6){fouten.push('extra-partijen.txt regel '+(i+1)+': te weinig velden');return}
    let [dd,tour,me,op,orr,res,eig]=f;let dt=null;let m=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(dd);if(m)dt=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');else if(/^\d{4}-\d\d-\d\d$/.test(dd))dt=dd;
    if(!dt){fouten.push('extra-partijen.txt regel '+(i+1)+': datum niet begrepen ('+dd+')');return}
    const sc={'1':1,'0':0,'½':.5,'0.5':.5,'0,5':.5,'=':.5,'r':.5,'remise':.5,'w':1,'winst':1,'v':0,'verlies':0}[res.toLowerCase()];
    if(sc==null){fouten.push('extra-partijen.txt regel '+(i+1)+': uitslag niet begrepen ('+res+')');return}
    const id=idOf(me);if(!id){fouten.push('extra-partijen.txt regel '+(i+1)+': '+me+' staat niet in de ledenlijst (schrijf Achternaam, Voornaam)');return}
    if(tot&&dt<=tot)return;const ro=+eig||LED[id].fr||null,or_=+orr||null;const K=Kof(LED[id].n,ro);n++;
    add(LED[id].n,{d:dt>vandaag?'vooraf':ddmm(dt),dt,tour:tour||'ander toernooi',o:op,or:or_,ro,r:sc,K,chg:(ro&&or_)?Math.round(K*(sc-Ex(ro,or_))*10)/10:null})});
  if(n)clubInfo.push('zelf ingevuld ('+n+' partijen)')}

// ---------- interclub (alle ploegen van de club) ----------
const prating=id=>{if(!id)return null;const m=LED[id];if(!m)return null;return rNu(m.n,'',m.fr)||null};
const score=(r,home)=>{const x=String(r||'').replace(/\s*FF$/i,'');const s=x==='1-0'?1:x==='0-1'?0:(x==='½-½'||x==='1/2-1/2')?.5:null;return s==null?null:home?s:1-s};
let icInfo=[];
for(const k of Object.keys(API))if(k.startsWith('icresults_')){const R=J(API[k]);if(!R||!R.rounds){fouten.push('interclub '+k.slice(10)+' onleesbaar');continue}
  const nm=nr=>((R.teams||[]).find(t=>t.pairingnumber===nr)||{}).name||'?';let lr=0;
  for(const rd of R.rounds){const d=(rd.rdate||vandaag).slice(0,10);if(tot&&d<=tot)continue;
    for(const e of rd.encounters){const thuis=e.icclub_home===club,uit=e.icclub_visit===club;if(!thuis&&!uit)continue;
      for(const g of (e.games||[])){if(!g.result||/FF/i.test(g.result))continue;
        for(const [home,ok] of [[true,thuis],[false,uit]]){if(!ok)continue;const id=home?g.idnumber_home:g.idnumber_visit,oid=home?g.idnumber_visit:g.idnumber_home;if(!id||!oid)continue;
          const s=score(g.result,home);if(s==null)continue;lr=Math.max(lr,rd.round);const me=LED[id];if(!me)continue;const ra=prating(id),ro=prating(oid);const K=Kof(me.n,ra);
          add(me.n,{d:d>vandaag?'vooraf':ddmm(d),dt:d,tour:'Interclub '+seizoen+'-'+String((seizoen+1)%100).padStart(2,'0')+' r'+rd.round+' · '+nm(e.pairingnr_home)+' – '+nm(e.pairingnr_visit)+' (afd. '+R.division+R.index+')',o:LED[oid]?LED[oid].n:'speler '+oid,or:ro,ro:ra,r:s,K,chg:(ra&&ro)?Math.round(K*(s-Ex(ra,ro))*10)/10:null})}}}}
  icInfo.push(R.division+R.index+(lr?' (tot ronde '+lr+')':''))}

// ---------- per lid ----------
const perSp=m=>{const L=CH[m.fide]||{};const s=[[],[],[]],g=[[],[],[]];
  for(const ym of M){const x=L[ym];for(let t=0;t<3;t++){s[t].push(x?x[2*t]:null);g[t].push(x?x[2*t+1]:0)}}
  // zonder lijst voor die maand: vorige waarde doortrekken (FIDE publiceert dan niets voor deze speler)
  for(let t=0;t<3;t++)for(let i=1;i<M.length;i++)if(s[t][i]==null&&s[t][i-1]!=null&&L[M[i]]===undefined)s[t][i]=s[t][i-1];
  const P=pend[nrm(m.n)]||[];P.sort((a,b)=>a.dt.localeCompare(b.dt));
  const RS=(rest[nrm(m.n)]||[]).sort((a,b)=>a.dt.localeCompare(b.dt));return {n:m.n,id:m.id,fide:m.fide,by:m.by,tit:m.tit,fr:m.fr,s,g,games:CALC[m.fide]||[[],[],[]],pend:P,rest:RS}};
const leden=eigen.map(perSp);
/* gevolgde spelers die geen clublid zijn */
const extern=Object.values(LED).filter(m=>m.ext).map(perSp);

// ---------- gevonden partijen met zetten per lid (partijen-elo.js + lichess-studie) ----------
const FP={};for(const g of (window.ELO_PARTIJEN||[]))(FP[g.f]??=[]).push(g);
const anm=n=>{const w=String(n||'').split(',')[0].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z]+/).filter(Boolean);const k=w.filter(x=>!/^(de|van|der|den|le|la|du|von|vande|ter|da|di|del|dos|el|al)$/.test(x));return (k[0]||w.join(''))};/* belangrijkste woord van de familienaam: 'Chacon Jaime' en 'Chacon' komen overeen */
/* partijen uit de lichess-studie (bijgewerkt door Elo bijwerken): koppelen aan leden op naam */
{const tk=n=>String(n||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z ,]/g,' ').replace(/,/g,' ').split(/\s+/).filter(Boolean);
  const VOL={},INI={};for(const p of leden){if(!p.fide)continue;const [a,b]=p.n.split(', ');const k=tk(p.n).sort().join(' ');(VOL[k]??=new Set()).add(p.fide);const ini=(tk(b)[0]||'').slice(0,1);(INI[tk(a).join('')+'|'+ini]??=new Set()).add(p.fide);(INI[(tk(a)[0]||'')+'|'+ini]??=new Set()).add(p.fide)}
  const lid=n=>{const t=tk(n);if(!t.length)return null;let s=VOL[t.slice().sort().join(' ')];if(s&&s.size===1)return [...s][0];
    for(let i=0;i<t.length;i++)if(t[i].length===1){const r=t.filter((x,j)=>j!==i).join('');s=INI[r+'|'+t[i]];if(s&&s.size===1)return [...s][0]}
    if(String(n).includes(',')){const [a,b]=String(n).split(',');s=INI[tk(a).join('')+'|'+(tk(b)[0]||'').slice(0,1)];if(s&&s.size===1)return [...s][0]}return null};
  for(const g of (STUDIE||[])){const sc={'1-0':1,'0-1':0,'1/2-1/2':.5}[g.r];if(sc==null)continue;
    for(const [me,o,c,r] of [[g.w,g.b,'w',sc],[g.b,g.w,'b',1-sc]]){const f=lid(me);if(!f)continue;const L=(FP[f]??=[]);const a=anm(o);
      const i=L.findIndex(x=>x.d===g.d&&anm(x.o)===a);const x={f,d:g.d,o,c,r,e:g.e,n:g.n,u:g.u,b:'studie'};if(i>=0)L[i]=x;else L.push(x)}}
  for(const L of Object.values(FP))L.sort((a,b)=>a.d.localeCompare(b.d))}

for(const f of fouten){const m=/^toernooi (.+?) : (.*)$/.exec(f);if(m)tInfo(m[1]).opm.push(m[2])}
for(const [n,u] of Object.entries(B.toernooien||{}))tInfo(n);
for(const t of Object.values(TOERN))if(!t.rondes&&!t.opm.length)t.opm.push('nog geen rondes met uitslagen');
const toernooien=Object.values(TOERN).map(t=>({verwerkt:VWK[t.naam]||0,naam:t.naam,soort:t.soort||(/chess-results/i.test(t.url)?'chess-results':/echecs\.asso\.fr/i.test(t.url)?'FFE':/openresults/i.test(t.url)?'OpenResults':t.url?'SWAR':''),url:t.url,rondes:t.rondes,partijen:t.partijen,spelers:[...t.sp],laatste:t.laatste,opm:t.opm})).sort((a,b)=>a.naam.localeCompare(b.naam,'nl'));
/* alleen wat nog moet komen of vandaag bezig is (een oude ronde zonder uitslag is een vergeten uitslag, geen volgende partij) */
const volgend={};for(const [n,L] of Object.entries(VOLG)){const M2=L.filter(x=>x.dt>=vandaag||(TOERN[x.tour]&&TOERN[x.tour].laatste<=x.dt));if(M2.length)volgend[n]=M2.sort((x,y)=>x.dt.localeCompare(y.dt))}
window.ELO={verwerkt,rNu,volgend,extern,verwerktPer:VWK,partijen:FP,toernooien,studie:STUDIE,tijd:B.tijd||'',vanaf,laatste,maanden:M,leden,club,seizoen,tot,fouten,clubInfo,icInfo,vandaag};
})();
