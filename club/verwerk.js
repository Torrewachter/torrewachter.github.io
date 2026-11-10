// verwerk.js — zet de ruwe gegevens uit data.js (opgehaald door Bijwerken.bat) om
// naar wat de pagina's nodig hebben. Resultaat: window.VERWERKT (of null als data.js ontbreekt).
(function(){
'use strict';
// gegevens komen uit drie aparte bestanden (elk met een eigen Bijwerken-knop); data.js is de oude vorm
const BC=window.BRON_CLUB||null,BI=window.BRON_IC||null,BP=window.BRON_PARTIJEN||null,BL=window.BRON||null,BG=window.BRON_GEVONDEN||null;window.VERWERKT=null;
if(!BC&&!BI&&!BP&&!BL&&!BG)return;
const B={api:Object.assign({},BL&&BL.api,BI&&BI.api,BC&&BC.api),swar:(BC&&BC.swar)||(BL&&BL.swar)||{},instellingen:Object.assign({},BL&&BL.instellingen,BP&&BP.instellingen,BI&&BI.instellingen,BC&&BC.instellingen)};
const dec=b=>{try{const s=atob(b);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new TextDecoder('utf-8').decode(u)}catch(e){return ''}};
const J=k=>{const t=B.api&&B.api[k];if(!t)return null;try{return JSON.parse(dec(t))}catch(e){return null}};
const iso=dmy=>{const m=/(\d\d)\/(\d\d)\/(\d{4})/.exec(dmy||'');return m?m[3]+'-'+m[2]+'-'+m[1]:null};
const fouten=[];
const tijden={club:(BC||BL||{}).tijd||null,ic:(BI||BL||{}).tijd||null,partijen:(BP||{}).tijd||null};
const bronFouten=[].concat((BC||{}).fouten||[],(BI||{}).fouten||[],(BP||{}).fouten||[],(BL||{}).fouten||[]);
const laatste=Object.values(tijden).filter(Boolean).sort().pop()||'';
const V={tijd:laatste,tijden,datum:laatste.slice(0,10),fouten,bronFouten};
/* agenda.txt (komt mee in data-club.js): clublokaal, ligakampioenschap, andere toernooien en clubactiviteiten voor de startpagina */
V.agenda=null;try{const t=BC&&BC.agenda&&BC.agenda.tekst?dec(BC.agenda.tekst):'';if(t){const A={club:{},liga:{naam:'',plaats:'',spelers:[],rondes:[]},andere:{},events:[],inhaal:[]};
  for(const r0 of t.replace(/^\uFEFF/,'').split(/\r?\n/)){const r=r0.trim();if(!r||r[0]==='#')continue;const i=r.indexOf('=');if(i<1)continue;const k=r.slice(0,i).trim().toLowerCase().replace(/\s+/g,' '),v=r.slice(i+1).trim(),p=v.split('|').map(x=>x.trim());
    if(k==='clublokaal')A.club.plaats=v;else if(k==='cluburen')A.club.uur=v;else if(k==='liga')A.liga.naam=v;else if(k==='liga plaats')A.liga.plaats=v;else if(k==='liga spelers')A.liga.spelers=v.split(';').map(x=>x.trim()).filter(Boolean);
    else if(k==='liga ronde'&&p[0])A.liga.rondes.push([p[0],p[1]||'',p[2]||'']);else if(k==='toernooi'&&p.length>=4)(A.andere[p[0]]??=[]).push({t:p[1],van:p[2],tot:p[3],plaats:p[4]||'',link:p[5]||''});else if(k==='activiteit'&&p[0])A.events.push({d:p[0],t:p[1]||'',plaats:p[2]||''});
    else if(k==='inhaaldagen'){const m=/(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)[\s\S]*?tot\s+(\d{4}-\d\d-\d\d)/i.exec(v),m2=/vanaf\s+(\d{4}-\d\d-\d\d)/i.exec(v);
      if(m)A.inhaalRegel={dag:['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'].indexOf(m[1].toLowerCase()),tot:m[2],vanaf:m2?m2[1]:''};else fouten.push('agenda.txt: inhaaldagen niet begrepen (bv. elke zaterdag tot 2026-12-31)')}
    else if(k==='inhaaldag'&&p[0]){A.inhaal.push(p[0]);A.events.push({d:p[0],t:p[1]||'Inhaaldag clubkampioenschap (achterstallige partijen)',plaats:p[2]||A.club.plaats||''})}
    else fouten.push('agenda.txt: regel niet begrepen: '+r.slice(0,40))}
  V.agenda=A}}catch(e){fouten.push('agenda.txt onleesbaar')}
const vandaag=(tijden.club||laatste).slice(0,10)||new Date().toISOString().slice(0,10);
const seizoen=+(B.instellingen&&B.instellingen.seizoen)||(+vandaag.slice(0,4)-(+vandaag.slice(5,7)<7?1:0));
V.seizoen=seizoen;
// standaard-leeftijdslijn (zelfde als in de modellen)
const curve=a=>!a||a<12?0:a<=17?75:a<30?Math.round(75*(30-a)/13):a>50?Math.round(-2.75*(a-50)):0;

// ---------- leden (geboortejaar, FIDE-rating) ----------
const LEDEN={},NAAM={};
for(const k of Object.keys(B.api||{}))if(k.startsWith('clubmembers_')){const l=J(k);if(!Array.isArray(l)){fouten.push('ledenlijst '+k.slice(12)+' onleesbaar');continue}
  for(const m of l){const n=m.last_name+', '+m.first_name;LEDEN[m.idnumber]={n,by:m.birthyear||0,fr:m.fiderating||0,club:m.idclub,fide:m.idfide||0};if(!NAAM[n])NAAM[n]=m.idnumber}}
for(const k of Object.keys(B.api||{}))if(k.startsWith('member_')){const m=J(k);if(m&&m.idnumber&&!LEDEN[m.idnumber]){const n=m.last_name+', '+m.first_name;LEDEN[m.idnumber]={n,by:m.birthyear||0,fr:m.fiderating||0,club:m.idclub,fide:m.idfide||0};if(!NAAM[n])NAAM[n]=m.idnumber}}
const nrmN=t=>String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();const NAAMN={};for(const [id,m] of Object.entries(LEDEN))if(!NAAMN[nrmN(m.n)])NAAMN[nrmN(m.n)]=+id;const idOf=n=>NAAM[n]||NAAMN[nrmN(n)]||null;
const ICPL={};for(const k of Object.keys(B.api||{}))if(k.startsWith('icclub_')){const c=J(k);for(const p of (c&&c.players)||[])ICPL[p.idnumber]={n:p.last_name+', '+p.first_name,ar:p.assignedrating||0,fr:p.fiderating||0,tit:p.titular||'',club:+k.slice(7)}}
/* ledenlijst van de openbare spelerspagina (zonder ratings): rating uit de interclubgegevens */
for(const [id,p] of Object.entries(ICPL))if(LEDEN[id]&&!LEDEN[id].fr&&p.fr)LEDEN[id].fr=p.fr;
const pnaam=id=>(LEDEN[id]&&LEDEN[id].n)||(ICPL[id]&&ICPL[id].n)||('lid '+id);
const prating=id=>{if(!id)return null;const m=LEDEN[id];if(m&&m.fr)return m.fr;const p=ICPL[id];if(p&&p.fr)return p.fr;if(p&&p.ar)return p.ar;return null};
const pleeftijd=id=>{const m=LEDEN[id];return m&&m.by?seizoen-m.by:0};

// ---------- clubkampioenschap (SWAR) ----------
const nrmW=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const WEG=new Set(String((B.instellingen&&B.instellingen.weglaten)||'').split(';').map(nrmW).filter(Boolean));
function swar(html,key){const d=new DOMParser().parseFromString(html,'text/html');const rondes={},rows=[],echt={};let build='';
  const bm=/Build\s*:\s*(\d{4})\/(\d\d)\/(\d\d)\s+(\d\d:\d\d)/.exec(d.body?d.body.textContent:'');if(bm)build=bm[3]+'/'+bm[2]+'/'+bm[1]+' '+bm[4];
  const titel=(d.title||'').trim();
  for(const tr of d.querySelectorAll('tr[id^="Round"]')){const rn=+tr.id.slice(5);const head=tr.textContent;const dt=iso(head);if(dt)rondes[rn]=dt;
    const t=tr.closest('table');const out=[];
    for(const r of t.querySelectorAll('tr')){if(r===tr)continue;const c=[...r.children].map(x=>x.textContent.replace(/\s+/g,' ').trim());if(c.length<6||c[1]===''||/Naam/.test(c[1]))continue;
      const elo=s=>{const m=/\((\d+)\)/.exec(s||'');return m?+m[1]:0};
      /* weggelaten spelers (instellingen.txt: weglaten = Naam, Voornaam; ...): al hun partijen worden 0ff-0ff, zodat niemand er punten voor krijgt */
      if(WEG.has(nrmW(c[1]))||WEG.has(nrmW(c[5]))){out.push(`${c[1]}|${elo(c[3])}|0ff-0ff|${c[5]}|${elo(c[7])}`);continue}   /* zoals een opgave: wie alleen 0ff-0ff heeft, valt uit de stand */
      if(/^bye$/i.test(c[5])||(c[5]===''&&c[4]==='1')){out.push(`${c[1]}|${elo(c[3])}|1|Bye|`);continue}
      let res=(c[4]||'-').replace(/\s+/g,'');if(res==='')res='-';if(res!=='-'&&!/ff|\+|^-/i.test(res))echt[rn]=1;
      /* forfait: SWAR schrijft 1-0ff, 1ff-0, 0ff-1 of 0-1ff (of +-, -+); beide afwezig = 0ff-0ff */if(/^0ff-0ff$/i.test(res))res='0ff-0ff';else if(/^1(ff)?-0(ff)?$/i.test(res)&&/ff/i.test(res)||/^\+-?-$/.test(res))res='1-0';else if(/^0(ff)?-1(ff)?$/i.test(res)&&/ff/i.test(res)||/^-\+$/.test(res))res='0-1';else if(/^(½|0[.,]5)-(½|0[.,]5)$/.test(res))res='½-½';
      out.push(`${c[1]}|${elo(c[3])}|${res}|${c[5]}|${elo(c[7])}`)}
    rows[rn]=out}
  const n=Object.keys(rondes).length;const per=Math.max(...rows.filter(Boolean).map(r=>r.length));
  const flat=[];for(let r=1;r<=n;r++){const x=rows[r]||[];for(let i=0;i<per;i++)flat.push(x[i]||'Bye|0|-|Bye|0')}
  return {key,titel,build,rondes,rows:flat,per,n,echt}}
const CLUB={raw:{},rondes:{},labels:{},by:{},k40:[],rounds:0,played:0,per:5};
/* doel van een reeks (instellingen.txt: doel <reeks> = top 5 | titel | medailles | stijgen N | zakken N, met komma's); zonder regel: top 5 */
const DOEL=k=>{const v=String(B.instellingen['doel '+String(k).toLowerCase()]||'').toLowerCase();const out=[];
  for(const d of v.split(/[,;]/).map(x=>x.trim()).filter(Boolean)){let m;
    if(m=/^top\s*(\d+)$/.exec(d))out.push({t:'top',n:+m[1]});else if(/^(titel|kampioen)/.test(d))out.push({t:'titel',n:1});else if(/^medaille/.test(d))out.push({t:'med',n:3});
    else if(m=/^(stijgen|promotie)\s*(\d+)$/.exec(d))out.push({t:'stijgen',n:+m[2]});else if(m=/^(zakken|degradatie|dalen)\s*(\d+)$/.exec(d))out.push({t:'zakken',n:+m[2]});
    else fouten.push('doel '+k+': "'+d+'" niet begrepen (gebruik top 5, titel, medailles, stijgen 2 of zakken 2)')}
  return out.length?out:[{t:'top',n:5}]};
for(const [k,b64] of Object.entries(B.swar||{})){const h=dec(b64);if(!/tr id=.Round/.test(h)){fouten.push('SWAR-pagina '+k+' onleesbaar');continue}
  const s=swar(h,k);let pl=0;for(const r of Object.keys(s.echt))if(s.rondes[r]&&s.rondes[r]<=vandaag)pl=Math.max(pl,+r);CLUB.played=Math.max(CLUB.played||0,pl);CLUB.raw[k]={b:s.build,r:s.rows,per:s.per,n:s.n,played:pl,rondes:s.rondes,doel:DOEL(k),titel:s.titel};CLUB.labels[k]='Reeks '+k;CLUB.rounds=Math.max(CLUB.rounds,s.n);CLUB.per=s.per;
  for(const [r,d] of Object.entries(s.rondes))if(!CLUB.rondes[r]||d<CLUB.rondes[r])CLUB.rondes[r]=d}
// gespeeld = laatste ronde waarvan de datum voorbij is en waarin al een echte uitslag staat (geen forfait)
CLUB.played=CLUB.played||0;
/* inhaaldagen volgens een regel in agenda.txt ("inhaaldagen = elke zaterdag tot 2026-12-31"): elke zo'n dag die geen speeldag is */
if(V.agenda&&V.agenda.inhaalRegel&&V.agenda.inhaalRegel.dag>=0){const IR=V.agenda.inhaalRegel,speel=new Set(Object.values(CLUB.raw).flatMap(x=>Object.values(x.rondes||{})));
  const t=new Date(((IR.vanaf&&IR.vanaf>vandaag)?IR.vanaf:vandaag)+'T12:00:00Z');
  for(let i=0;i<400;i++){const d=t.toISOString().slice(0,10);if(d>IR.tot)break;if(t.getUTCDay()===IR.dag&&!speel.has(d)&&!V.agenda.inhaal.includes(d)){V.agenda.inhaal.push(d);V.agenda.events.push({d,t:'Inhaaldag clubkampioenschap (achterstallige partijen)',plaats:V.agenda.club.plaats||''})}t.setUTCDate(t.getUTCDate()+1)}
  V.agenda.inhaal.sort();V.agenda.events.sort((a,b)=>a.d.localeCompare(b.d))}
// geboortejaren van de spelers in de reeksen
for(const v of Object.values(CLUB.raw))for(const row of v.r){const [a,,,b]=row.split('|');for(const n of [a,b]){if(!n||n==='Bye')continue;const id=idOf(n);if(id&&LEDEN[id].by)CLUB.by[n]=LEDEN[id].by}}
CLUB.k40=Object.entries(CLUB.by).filter(([n,y])=>seizoen-y<18).map(([n])=>n);
CLUB.ok=Object.keys(CLUB.raw).length>0;
V.club=CLUB;

// ---------- interclub (KBSB) ----------
const R=J('icresults');const IC={ok:false};V.ic=IC;
if(!R||!R.teams){fouten.push('interclubgegevens onleesbaar')}else{
  const ploeg=(B.instellingen&&B.instellingen.ploeg)||'KRST 1';
  const teams=[...R.teams].sort((a,b)=>a.pairingnumber-b.pairingnumber);const n0=teams.length;
  const T=teams.map(t=>[t.pairingnumber,t.name]);const nameOf=nr=>(teams.find(t=>t.pairingnumber===nr)||{}).name;
  const me=teams.filter(t=>t.name===ploeg).map(t=>t.pairingnumber);
  const boards=Math.max(4,...R.rounds.flatMap(r=>r.encounters.map(e=>(e.games||[]).length)));
  const matches=[],ics=[],ind=[],gespeeld=[],dates={},opst=[];const played=new Set();let last=0;
  const score=(r,home)=>{const x=r.replace(/\s*FF$/i,'');const s=x==='1-0'?1:x==='0-1'?0:x==='½-½'||x==='1/2-1/2'?0.5:null;return s==null?null:home?s:1-s};
  for(const rd of R.rounds){dates[rd.round]=rd.rdate;
    for(const e of rd.encounters){const g=(e.games||[]);if(!g.length||!g.some(x=>x.result))continue;
      const h=e.pairingnr_home,v=e.pairingnr_visit;played.add(rd.round+'-'+h+'-'+v);last=Math.max(last,rd.round);
      const rh=g.map(x=>prating(x.idnumber_home)),rv=g.map(x=>prating(x.idnumber_visit));
      const ah=g.map(x=>pleeftijd(x.idnumber_home)),av=g.map(x=>pleeftijd(x.idnumber_visit));
      let fh=0,fv=0;for(const x of g){if(/FF/i.test(x.result)){if(score(x.result,true)===0)fh++;else fv++}}
      let mf=0;if(g.every(x=>!x.idnumber_home))mf|=1;if(g.every(x=>!x.idnumber_visit))mf|=2;
      const bh=e.boardpoint2_home,bv=e.boardpoint2_visit;opst.push({r:rd.round,nr:h,ids:g.map(x=>x.idnumber_home)},{r:rd.round,nr:v,ids:g.map(x=>x.idnumber_visit)});
      matches.push([rd.round,h,v,bh,bv,rh,rv,ah.map(curve),av.map(curve),fh,fv,mf]);ics.push([rd.round,h,v,bh,bv,rh,rv,ah,av,fh,fv,mf]);
      for(const side of [[h,true],[v,false]]){const [nr,home]=side;if(!me.includes(nr))continue;const opp=home?v:h;
        gespeeld.push({r:rd.round,opp:nameOf(opp),thuis:home,voor:(home?bh:bv)/2,tegen:(home?bv:bh)/2});
        g.forEach((x,i)=>{const id=home?x.idnumber_home:x.idnumber_visit,oid=home?x.idnumber_visit:x.idnumber_home;if(!id)return;const s=score(x.result,home);const ff=/FF/i.test(x.result);
          const ra=prating(id),by=(LEDEN[id]||{}).by||0;const K=(ra||0)>=2400?10:(by>=seizoen-18?40:20);
          ind.push([ploeg,rd.round,i+1,pnaam(id),ra,K,oid?pnaam(oid):'forfait',prating(oid),ff&&s===1?'ff':s])})}}}
  const berger=(n,r)=>{const m=n-1,h=n/2,sh=p=>((p-1+h*(r-1))%m)+1,out=[];for(let i=1;i<=h;i++){const a=i,b=n+1-i;if(b===n){const x=sh(a);out.push(r%2?[x,n]:[n,x])}else out.push([sh(a),sh(b)])}return out};
  const sched=[];for(let r=1;r<n0;r++)for(const [a,b] of berger(n0,r)){if(!played.has(r+'-'+a+'-'+b))sched.push([r,a,b])}
  const per=n0/2;const done=matches.filter(m=>m[0]===last).length;
  const status=done>=per?'na ronde '+last:'ronde '+last+': '+done+' van '+per+' uitslagen ingevoerd';
  const label='Afdeling '+R.division+R.index;const key=String(R.division)+R.index;
  IC.series={key,label,me,sched,dates,boards,rounds:n0-1,teams:T,matches,ind,status};
  IC.ics={key,label,boards,rounds:n0-1,teams:T,matches:ics};
  IC.ronde=last;IC.label=label;IC.team=ploeg;IC.gespeeld=gespeeld.sort((a,b)=>a.r-b.r);
  IC.kalender=sched.filter(([r,a,b])=>me.includes(a)||me.includes(b)).map(([r,a,b])=>({r,d:dates[r],opp:nameOf(me.includes(a)?b:a),thuis:me.includes(a)}));
  IC.spelers=[...new Set(ind.map(x=>x[3]))].sort((a,b)=>a.localeCompare(b,'nl'));
  IC.ind=ind.map(([t,r,bd,n,ra,K,o,ro,s])=>({ronde:r,bord:bd,speler:n,elo:ra||0,tegen:o,elo_t:ro||0,score:s}));
  // stand (matchpunten, bordpunten)
  const st=T.map(([nr,nm])=>({n:nm,mp:0,bp:0}));for(const m of matches){const H=st[m[1]-1],Vv=st[m[2]-1];const mh=m[3]>m[4]?2:m[3]===m[4]?1:0;H.mp+=mh;Vv.mp+=2-mh;H.bp+=m[3]/2;Vv.bp+=m[4]/2}
  IC.ploegen=st;IC.ok=true;
  // ---- volgende tegenstander: wie kan er spelen en welke opstellingen zijn waarschijnlijk ----
  // Rekenmodel (logistische regressie) getraind op alle ploegen van 2025-26 en de eerste rondes van 2026-27 (KBSB-archief).
  {const k0=IC.kalender[0];if(k0&&String((B.instellingen||{}).interclubbeheer||'').toLowerCase()!=='nee'){const opp=teams.find(t=>t.name===k0.opp);const oc=opp.idclub,vr=k0.r;const num=n=>(String(n).match(/(\d+)\s*$/)||[])[1]||'1';const tn=+num(opp.name);
    // opstellingen van alle ploegen van die club: dit seizoen (eigen reeks + andere reeksen) en vorig seizoen
    const cur=[];const nmOf=nr=>(teams.find(t=>t.pairingnumber===nr)||{}).name;
    for(const o of opst){const t=teams.find(x=>x.pairingnumber===o.nr);if(t&&t.idclub===oc)cur.push({r:o.r,t:+num(t.name),ids:o.ids.filter(Boolean),nb:o.ids.length})}
    for(const k of Object.keys(B.api))if(k.startsWith('icres_')){const S=J(k);if(!S||!S.teams)continue;const nrs={};for(const t of S.teams)if(t.idclub===oc)nrs[t.pairingnumber]=t.name;
      for(const rd of S.rounds||[])for(const e of rd.encounters)for(const side of ['home','visit']){const pn=e['pairingnr_'+side];if(!nrs[pn])continue;const ids=(e.games||[]).map(g=>g['idnumber_'+side]).filter(Boolean);if(ids.length&&(e.games||[]).some(g=>g.result))cur.push({r:rd.round,t:+num(nrs[pn]),ids,nb:e.games.length})}}
    let prev=[];try{prev=(J('archief_'+oc)||[]).map(x=>({r:x.r,t:+num(x.t),ids:x.ids.map(Number),nb:x.nb}))}catch(e){}
    const T=cur.filter(x=>x.t===tn&&x.r<vr).sort((a,b)=>a.r-b.r),PT=prev.filter(x=>x.t===tn),O=cur.filter(x=>x.t!==tn&&x.r<vr);
    const titT=id=>{const p=ICPL[id];return p&&p.club===oc&&p.tit?+num(p.tit):0};
    const pool=new Set();for(const L of [T,PT,O])for(const x of L)x.ids.forEach(i=>pool.add(+i));for(const id of Object.keys(ICPL))if(titT(id)===tn)pool.add(+id);
    // alleen spelers op de spelerslijst van de club mogen meedoen (wie vertrok, valt weg)
    const lijst=new Set(Object.entries(ICPL).filter(([i,p])=>p.club===oc).map(([i])=>+i));if(lijst.size)for(const id of [...pool])if(!lijst.has(id))pool.delete(id);
    const nT=T.length,nP=PT.length,nb=boards;const WF=[-1.1263,1.1221,0.8736,0.6182,0.2298,0.4329,1.1002,-0.3288,-0.7018,-0.4575,-0.3451,-0.1426,-0.1039,-0.1073,-1.7103,-1.1988,1.1102,0.262,0.961,-0.2552,0.2042];
    const C=[];for(const id of pool){const kT=T.filter(x=>x.ids.includes(id)).length;let dw=0,ds=0;T.forEach((x,j)=>{const w=Math.pow(.6,nT-1-j);ds+=w;if(x.ids.includes(id))dw+=w});
      const last=nT&&T[nT-1].ids.includes(id)?1:0,last2=nT>1&&T[nT-2].ids.includes(id)?1:0,kP=PT.filter(x=>x.ids.includes(id)).length,rP=nP?kP/nP:0,hasP=kP>0?1:0;
      const hi=O.filter(x=>x.t<tn&&x.ids.includes(id)).length/Math.max(1,vr-1),lo=O.filter(x=>x.t>tn&&x.ids.includes(id)).length/Math.max(1,vr-1);
      const lastHi=O.some(x=>x.r===vr-1&&x.t<tn&&x.ids.includes(id))?1:0,lastLo=O.some(x=>x.r===vr-1&&x.t>tn&&x.ids.includes(id))?1:0;
      const bs=T.flatMap(x=>{const b=x.ids.indexOf(id);return b>=0?[b/(x.nb||x.ids.length)]:[]});const bavg=bs.length?bs.reduce((a,b)=>a+b,0)/bs.length:.5;const rT=nT?kT/nT:0;const tt=titT(id);
      const f=[1,rT,nT===0?1:0,ds?dw/ds:0,last,last2,rP,hasP,kT===0&&hasP?1:0,hi,lo,lastHi,lastLo,bavg*(kT>0?1:0),kT===0&&!hasP?1:0,Math.log(pool.size)/4,rT*Math.min(nT,5)/5,nb/8,tt===tn?1:0,tt&&tt<tn?1:0,tt&&tt>tn?1:0];
      const z=f.reduce((a,v,j)=>a+v*WF[j],0);const m=LEDEN[id]||{},p=ICPL[id]||{};
      C.push({id,n:m.n||p.n||('lid '+id),ar:p.ar||m.fr||0,fr:m.fr||p.fr||0,fide:m.fide||0,tit:p.club===oc?p.tit||'':'',keer:kT,borden:T.flatMap(x=>{const b=x.ids.indexOf(id);return b>=0?[b+1]:[]}),vorig:kP,vorigN:nP,andere:O.filter(x=>x.ids.includes(id)).map(x=>x.t),q:1/(1+Math.exp(-z))})}
    // opstellingen: kans ∝ product van de odds van de gekozen spelers (vaste ploeggrootte), over de 14 waarschijnlijkste spelers
    C.sort((a,b)=>b.q-a.q);const L=C.slice(0,14);const combi=[];const rec=(st,acc)=>{if(acc.length===nb){combi.push(acc.slice());return}for(let i=st;i<L.length;i++){acc.push(i);rec(i+1,acc);acc.pop()}};if(L.length>=nb)rec(0,[]);
    let tot=0;const ods=L.map(x=>Math.min(x.q,.995)/(1-Math.min(x.q,.995)));const op=combi.map(c=>{const w=c.reduce((a,i)=>a*ods[i],1);tot+=w;const sp=c.map(i=>L[i]).sort((a,b)=>b.ar-a.ar);return {ids:sp.map(x=>x.id),w,gem:Math.round(sp.reduce((a,x)=>a+(x.fr||x.ar),0)/nb)}});
    const marg={};op.forEach(o=>{o.p=tot?o.w/tot:0;o.ids.forEach(i=>marg[i]=(marg[i]||0)+o.p)});op.sort((a,b)=>b.p-a.p);
    for(const x of C)x.kans=L.includes(x)?(marg[x.id]||0):x.q;
    const shown=C.filter(x=>x.kans>=.025||x.keer||x.tit===opp.name).sort((a,b)=>b.ar-a.ar);
    IC.volgende={ronde:vr,datum:k0.d,thuis:k0.thuis,opp:opp.name,club:oc,gespeeld:nT,vorigN:nP,spelers:shown,opstellingen:op.slice(0,8).map(({ids,p,gem})=>({ids,p,gem})),
      reserves:Object.values(ICPL).filter(p=>p.club===oc).length-shown.length,model:true,metVorig:prev.length>0}}}
  // leeftijden van interclubspelers voor de pagina-instellingen
  IC.ages={};for(const id of Object.keys(LEDEN))if(LEDEN[id].by)IC.ages[LEDEN[id].n]=seizoen-LEDEN[id].by}
V.ages={};for(const [n,y] of Object.entries(CLUB.by))V.ages[n]=seizoen-y;

// ---------- Elo Torrewachters: nog te verwerken partijen en huidige ratings ----------
{const club=+(B.instellingen.club||309);const tot=B.instellingen['elo verwerkt tot']||'';
  const eigen=Object.values(LEDEN).filter(m=>m.club===club);const nrm=t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const E=(a,b)=>1/(1+10**(Math.max(-400,Math.min(400,b-a))/400));const byOf=n=>{const id=idOf(n);return id?LEDEN[id].by:0};
  const K=(n,r)=>(r||0)>=2400?10:(byOf(n)>=seizoen-18?40:20);const ddmm=d=>d.slice(8,10)+'/'+d.slice(5,7);
  const pend={};const add=(n,x)=>(pend[nrm(n)]??=[]).push(x);
  if(CLUB.ok){for(const [k,v] of Object.entries(CLUB.raw)){const per=v.per||v.r.length/Math.max(1,CLUB.rounds);
    v.r.forEach((row,i)=>{const [a,ea,res,b,eb]=row.split('|');if(b==='Bye'||!(res in {'1-0':1,'0-1':1,'½-½':1}))return;const r=Math.floor(i/per)+1;const d=(v.rondes||CLUB.rondes)[r]||vandaag;
      if(tot&&d<=tot)return;const dt=d>vandaag?'vooraf (r'+r+')':ddmm(d);const sa={'1-0':1,'0-1':0,'½-½':.5}[res];const ra=+ea||0,rb=+eb||0;
      for(const [me,rm,op,ro,sc] of [[a,ra,b,rb,sa],[b,rb,a,ra,1-sa]]){const k2=K(me,rm);add(me,[dt,'Clubkampioenschap Roeselare '+seizoen+' '+k,op,ro||null,rm||null,sc,(rm&&ro)?Math.round(k2*(sc-E(rm,ro))*10)/10:null,k2])}})}}
  if(IC.ok){const S=IC.series;const nm=nr=>(S.teams.find(t=>t[0]===nr)||[])[1];
    for(const g of IC.ind){const d=S.dates[g.ronde]||vandaag;if(tot&&d<=tot)continue;if(g.score==='ff'||g.tegen==='forfait'||g.score==null)continue;
      const mt=S.matches.find(m=>m[0]===g.ronde&&(S.me.includes(m[1])||S.me.includes(m[2])));const titel='Interclub '+seizoen+'-'+String((seizoen+1)%100).padStart(2,'0')+' r'+g.ronde+(mt?' · '+nm(mt[1])+' – '+nm(mt[2]):'')+' ('+IC.label.replace('Afdeling','afd.')+')';
      const k2=K(g.speler,g.elo);add(g.speler,[ddmm(d),titel,g.tegen,g.elo_t||null,g.elo||null,g.score,(g.elo&&g.elo_t)?Math.round(k2*(g.score-E(g.elo,g.elo_t))*10)/10:null,k2])}}
  V.elo={ok:CLUB.ok||IC.ok,pend,tot,leden:eigen.map(m=>({n:m.n,by:m.by,fr:m.fr})),nrm:null}}

// ---------- PGN omzetten naar het formaat van de partijenviewer (met chess.js) ----------
const NAG={1:'!',2:'?',3:'!!',4:'??',5:'!?',6:'?!',10:' =',13:' ∞',14:' ⩲',15:' ⩱',16:' ±',17:' ∓',18:' +−',19:' −+'};
const SYM={'!':1,'?':2,'!!':3,'??':4,'!?':5,'?!':6};
const clean=c=>c.replace(/\[%[^\]]*\]/g,'').replace(/\s+/g,' ').trim();
function parse(txt){const head={};let body=txt.replace(/\r/g,'');body=body.replace(/^\s*\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/gm,(m,k,v)=>{head[k]=v.replace(/\\"/g,'"');return ''});
  const tok=body.match(/\{[^}]*\}|\(|\)|\$\d+|\d+\.(?:\.\.)?|1-0|0-1|1\/2-1\/2|\*|[^\s(){}$]+/g)||[];let i=0;
  function line(){const L={pre:'',moves:[]};while(i<tok.length){const t=tok[i++];if(t===')')return L;if(t==='('){const v=line();const last=L.moves[L.moves.length-1];if(last)last.vars.push(v);continue}
    if(t[0]==='{'){const c=t.slice(1,-1);if(L.moves.length)L.moves[L.moves.length-1].com+=(L.moves[L.moves.length-1].com?' ':'')+c;else L.pre+=(L.pre?' ':'')+c;continue}
    if(t[0]==='$'){if(L.moves.length)L.moves[L.moves.length-1].nags.push(+t.slice(1));continue}
    if(/^\d+\.(\.\.)?$/.test(t)||/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t))continue;
    const m=/^([^!?]+)([!?]{1,2})?$/.exec(t);if(!m)continue;L.moves.push({san:m[1],nags:m[2]?[SYM[m[2]]]:[],com:'',vars:[]})}return L}
  return {head,root:line()}}
const nagTxt=n=>n.slice().sort((a,b)=>a-b).map(x=>NAG[x]||'').join('');
function vartext(fen,L){const ch=new Chess(fen);const out=[];let first=true;
  for(const mv of L.moves){const turn=ch.turn(),num=+ch.fen().split(' ')[5];const before=ch.fen();const r=ch.move(mv.san,{sloppy:true});if(!r)break;
    if(turn==='w')out.push(num+'. ');else if(first)out.push(num+'… ');out.push(r.san+nagTxt(mv.nags)+' ');first=false;
    if(clean(mv.com))out.push(clean(mv.com)+' ');for(const v of mv.vars)out.push('('+vartext(before,v)+') ')}
  return out.join('').replace(/\s+/g,' ').trim()}
function convGame(txt){const {head:h,root}=parse(txt);const ch=h.FEN?new Chess(h.FEN):new Chess();const m=[],f=[ch.fen().split(' ')[0]],c={};
  if(clean(root.pre))c['0']=clean(root.pre);let ply=0;
  for(const mv of root.moves){const before=ch.fen();const r=ch.move(mv.san,{sloppy:true});if(!r)throw new Error('zet '+mv.san);ply++;
    m.push([r.san+nagTxt(mv.nags).replace(/ /g,''),r.from+r.to+(r.promotion||'')]);f.push(ch.fen().split(' ')[0]);
    const txt=[];if(clean(mv.com))txt.push(clean(mv.com));const alts=mv.vars.map(v=>vartext(before,v)).filter(Boolean);if(alts.length)txt.push(alts.map(a=>'Beter of anders: '+a).join(' · '));
    if(txt.length)c[String(ply)]=txt.join(' ')}
  const st=h.FEN?new Chess(h.FEN):new Chess();const g={w:h.White,b:h.Black,we:h.WhiteElo||'',be:h.BlackElo||'',r:h.Result,e:h.Event,d:h.Date,rd:h.Round||'?',eco:h.ECO&&h.ECO!=='?'?h.ECO:'',op:h.Opening&&h.Opening!=='?'?h.Opening:'',m,f};
  if(Object.keys(c).length)g.c=c;if(st.turn()==='b')g.sb=1;g.n0=+st.fen().split(' ')[5];return {g,h}}
const splitPgn=t=>t.replace(/\r/g,'').split(/\n\s*\n(?=\s*\[Event )/).map(x=>x.trim()).filter(x=>/^\[/.test(x));

// ---------- partijen uit de lichess-studie ----------
V.partijen={ok:false,games:[],urls:[]};
if(BP&&BP.hoofdstukken&&window.Chess){
  const evNaam=e=>e==='Clubkampioenschap'?'Clubkampioenschap Roeselare '+seizoen:e==='Interclub'?'Nationale interclub '+seizoen+'-'+String((seizoen+1)%100).padStart(2,'0'):e;
  for(const [id,b64] of Object.entries(BP.hoofdstukken)){try{const {g,h}=convGame(dec(b64));g.e=evNaam(h.Event);
      if(h.Annotator)g.a=h.Annotator;if(h.Video)g.v=h.Video;g.u=h.ChapterURL||('https://lichess.org/study/'+(B.instellingen['lichess studie']||'')+'/'+id);if(h.FEN)g.part=1;
      V.partijen.games.push(g);V.partijen.urls.push(g.u)}catch(e){fouten.push('studiehoofdstuk '+id+': '+e.message)}}
  V.partijen.ok=V.partijen.games.length>0}

// ---------- partijen van de mogelijke tegenstanders (chess-results) en hun lichess-uitzendingen ----------
V.tegen={ok:false,games:[],lichess:{},fide:{}};
if(IC.volgende){const vol=IC.volgende;const T=(BI&&BI.tegen)||{};const LI=(BI&&BI.lichess)||{};const seen=new Set();
  for(const p of vol.spelers)if(p.fide){V.tegen.fide[p.fide]={n:p.n,games:0,lichess:[]}}
  if(window.Chess)for(const [fid,b64] of Object.entries(T)){for(const txt of splitPgn(dec(b64))){try{const {g}=convGame(txt);const k=g.w+'|'+g.b+'|'+g.d+'|'+g.m.slice(0,12).map(x=>x[1]).join('');if(seen.has(k))continue;seen.add(k);g.tg=+fid;g.e=g.e||'?';V.tegen.games.push(g);if(V.tegen.fide[fid])V.tegen.fide[fid].games++}catch(e){}}}
  for(const [fid,b64] of Object.entries(LI)){try{const d=new DOMParser().parseFromString(dec(b64),'text/html');const L=[];const s2=new Set();
      for(const a of d.querySelectorAll('a[href^="/broadcast/"]')){const h=a.getAttribute('href');if(h.split('/').length!==5||s2.has(h))continue;s2.add(h);L.push({n:a.textContent.replace(/\s+/g,' ').trim().slice(0,90),u:'https://lichess.org'+h})}
      if(V.tegen.fide[fid])V.tegen.fide[fid].lichess=L}catch(e){}}
  V.tegen.games.sort((a,b)=>String(b.d).localeCompare(String(a.d)));V.tegen.ok=true;V.tegen.opp=vol.opp;V.tegen.ronde=vol.ronde}
// ---------- gevonden partijen (Partijen zoeken.bat): alleen de koppen, de zetten pas bij het openen ----------
V.gevonden=null;V.conv=convGame;
if(BG){const vb=s=>String(s==null?'':s).replace(/[<>&]/g,'');const lijst=Array.isArray(BG.lijst)?BG.lijst:(BG.pgn?[BG]:[]);
  V.gevonden=lijst.filter(z=>z&&z.pgn).map((z,k)=>{const L=[];
    for(const txt of splitPgn(dec(z.pgn))){const h={};for(const m of txt.matchAll(/\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]/g))h[m[1]]=m[2];
      L.push({w:vb(h.White||'?'),b:vb(h.Black||'?'),we:vb(h.WhiteElo&&h.WhiteElo!=='0'?h.WhiteElo:''),be:vb(h.BlackElo&&h.BlackElo!=='0'?h.BlackElo:''),r:vb(h.Result||'*'),e:vb(h.Event||'?'),d:vb(h.Date||'?'),rd:vb(h.Round||'?'),eco:h.ECO&&h.ECO!=='?'?vb(h.ECO):'',op:h.Opening&&h.Opening!=='?'?vb(h.Opening+(h.Variation?', '+h.Variation:'')):'',gv:1,bron:vb(h.Bron||''),raw:txt})}
    return {games:L,zoek:z.zoek||'',tijd:z.tijd||'',aantal:z.aantal||L.length,bestand:z.bestand||'',soort:z.soort||'',opp:z.opp||'',ronde:z.ronde||0,fides:z.fides||null}});
  if(!V.gevonden.length)V.gevonden=null}
window.VERWERKT=V;
})();
