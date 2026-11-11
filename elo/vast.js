/* vast.js - vastgezette pagina's: elke bezoeker zet zelf tot 8 pagina's vast (ook eigen links naar andere sites) (bewaard in zijn eigen browser).
   De startpagina opent meteen de eerste; met de knoppen links onderaan blader je naar de volgende.
   Volgorde: zoals de bezoeker ze zet, of de laatst bijgewerkte pagina eerst (volgens de gegevens zelf:
   SWAR-tijd van een reeks, laatste partij van een speler, FIDE-lijst, laatste interclubronde).
   Ook andere sites (lichess-studie, YouTube, website van de club) kunnen erbij: die openen in een nieuw tabblad.
   Staat op elke pagina van de site (in Elo-Torrewachters; de andere pagina's verwijzen ernaar). */
(function(){
'use strict';
if(window.__twVast)return;window.__twVast=1;
var KEY='tw-vast',MAX=8;
var me=document.currentScript;var isStart=!!(me&&me.hasAttribute('data-start'));var JS=me&&me.getAttribute('data-js')||'';
function lees(){try{var v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Array.isArray(v.p))return {p:v.p.filter(function(x){return x&&x.u}).slice(0,MAX),auto:v.auto!==false,volg:/^(nieuw|ongezien)$/.test(v.volg)?v.volg:'vast',d:v.d||{},g:v.g||{}}}catch(e){}return {p:[],auto:true,volg:'vast',d:{},g:{}}}
function bewaar(s){var k={};s.p.forEach(function(x){k[norm(x.u)]=1});['d','g'].forEach(function(f){for(var u in s[f])if(!k[u])delete s[f][u]});try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch(e){return false}}
var kan=(function(){try{localStorage.setItem(KEY+'-t','1');localStorage.removeItem(KEY+'-t');return true}catch(e){return false}})();
function hier(){return location.href.replace(/\?[^#]*/,'').replace(/#$/,'')}
function norm(u){return String(u).replace(/\?[^#]*/,'').replace(/\/index\.html(?=#|$)/,'/').replace(/#$/,'')}
function titel(){var t=(document.title||'').replace(/\s*·\s*Torrewachters$/,'').trim()||'Pagina';var h='';try{h=decodeURIComponent(location.hash.slice(1))}catch(e){}
  if(h&&h!=='start'){var w=h.replace(/^r(?=\d)/,'reeks ').split(/[~_\s]+/).filter(Boolean);var tl=t.toLowerCase();
    if(!w.every(function(x){return tl.indexOf(x.toLowerCase())>=0}))t+=' · '+h.replace(/^r(?=\d)/,'reeks ').replace(/~/g,' · ').replace(/_/g,' ')}
  return t}

/* ---------- wanneer werd de inhoud van een pagina het laatst bijgewerkt (uit de gegevens) ---------- */
function tok(n){return String(n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'')}
function vandaag(){var E=window.ELO,V=window.VERWERKT;return (E&&E.vandaag)||(V&&V.datum)||new Date().toISOString().slice(0,10)}
function mx(a){var m='',t=vandaag()+' 99';for(var i=0;i<a.length;i++)if(a[i]&&a[i]>m&&a[i]<=t)m=a[i];return m}/* toekomstige data (nog te spelen rondes) tellen niet */
function swarB(r){var m=String(r&&r.b||'').match(/(\d\d)\/(\d\d)\/(\d{4})\s*(\d\d:\d\d)?/);return m?m[3]+'-'+m[2]+'-'+m[1]+(m[4]?' '+m[4]:''):''}
function D(){var V=window.VERWERKT,E=window.ELO;return {V:V,E:E,raw:(V&&V.club&&V.club.ok&&V.club.raw)||null,ic:(V&&V.ic&&V.ic.ok)?V.ic:null}}
function clubD(k){var x=D();if(!x.raw)return null;if(k){var key=Object.keys(x.raw).filter(function(q){return q.toUpperCase()===k.toUpperCase()})[0];return key?swarB(x.raw[key]):null}return mx(Object.keys(x.raw).map(function(q){return swarB(x.raw[q])}))}
function icD(){var x=D();if(!x.ic)return null;var d=(x.ic.series&&x.ic.series.dates)||{};return mx((x.ic.gespeeld||[]).map(function(g){return d[g.r]||''}))}
function eloD(){var x=D();if(!x.E)return null;var a=[x.E.laatste?x.E.laatste+'-01':''];(x.E.leden||[]).forEach(function(m){(m.pend||[]).forEach(function(p){a.push(p.dt)})});return mx(a)}
function spelerD(t){var x=D();if(!x.E||!x.raw)return null;var a=[];
  for(var k in x.raw){var r=x.raw[k],per=r.per||5,R=r.rondes||{};r.r.forEach(function(row,i){var c=row.split('|');if(c[2]!=='-'&&(tok(c[0])===t||tok(c[3])===t))a.push(R[Math.floor(i/per)+1]||'')})}
  (x.E.leden||[]).forEach(function(m){if(tok(m.n)!==t)return;(m.pend||[]).forEach(function(p){a.push(p.dt)});(m.games||[]).forEach(function(G){if(G.length)a.push(G[G.length-1].ym+'-01')})});
  if(x.ic){var dd=(x.ic.series&&x.ic.series.dates)||{};(x.ic.ind||[]).forEach(function(g){if(tok(g.speler)===t)a.push(dd[g.ronde]||'')})}
  (x.E.toernooien||[]).forEach(function(T){if((T.spelers||[]).some(function(n){return tok(n)===t}))a.push(T.laatste||'')});return mx(a)}
function datumVan(u){if(/^https:\/\/lichess\.org\/study\//.test(u))return lichessD();var m=norm(u).match(/\/(club|Clubkampioenschap-Interclub|elo|Elo-Torrewachters)\/([\w-]*)(?:\.html)?\/?(?:#(.*))?$/);if(!m)return null;
  var h='';try{h=decodeURIComponent(m[3]||'')}catch(e){}var deel=/^c/i.test(m[1])?'club':'elo',p=m[2]||'index';
  var f=function(a){for(var i=0;i<a.length;i++)if(a[i]==null)return null;return mx(a)};
  if(deel==='club'){if(p==='stand'){var k=(h.match(/^r?([^~]+)/)||[])[1];return k&&!/_/.test(k)?clubD(k):f([clubD()])}
    if(p==='interclub')return f([icD()]);if(p==='seizoensverslag')return f([clubD(),icD(),eloD()]);return f([clubD(),icD()])}
  if((p==='speler'||p==='elo')&&h&&h!=='start')return spelerD(tok(h));
  if(p==='speler')return f([clubD(),icD(),eloD()]);return f([eloD()])}
/* andere sites: lichess-studie, YouTube-kanaal en website van de club (instellingen.txt van het clubkampioenschap) */
function extInst(){var I=null;try{I=(window.BRON_CLUB&&BRON_CLUB.instellingen)||(window.BRON_PARTIJEN&&BRON_PARTIJEN.instellingen)||null}catch(e){}
  var o=null;try{o=JSON.parse(localStorage.getItem(KEY+'-ext')||'null')}catch(e){}
  if(I){o={studie:I['lichess studie']||'GF8fIfKW',youtube:I.youtube||'',website:I['website club']||''};try{localStorage.setItem(KEY+'-ext',JSON.stringify(o))}catch(e){}}
  return o||{studie:'GF8fIfKW',youtube:'',website:'https://www.torrewachters.be/'}}
function externen(){var o=extInst();return [{id:'lichess',u:o.studie?'https://lichess.org/study/'+o.studie:'',t:'Partijen op lichess (studie KRST YouTube)'},{id:'youtube',u:o.youtube,t:'YouTube-kanaal KRST'},{id:'website',u:o.website,t:'Website De Torrewachters'}].filter(function(x){return /^https?:\/\//.test(x.u)})}
function lichessD(){var B=window.BRON_PARTIJEN;if(B&&B.gezien&&B.gezien.nieuwste)return B.gezien.nieuwste;return null}
function datums(s){var nu=false;s.p.forEach(function(x){var d=null;try{d=datumVan(x.u)}catch(e){}if(d&&s.d[norm(x.u)]!==d){s.d[norm(x.u)]=d;nu=true}});return nu}
function nieuw(s,x){var k=norm(x.u);return !!(s.d[k]&&s.d[k]>(s.g[k]||''))}
/* de volgorde blijft tijdens een bezoek dezelfde (anders schuift ze op zodra je een nieuwe pagina bekeken hebt) */
function volgorde(s){if(s.volg==='vast')return s.p.slice();var sig=s.volg+'|'+s.p.map(function(x){return norm(x.u)}).sort().join('|'),z=null;
  try{z=JSON.parse(sessionStorage.getItem('tw-volg')||'null')}catch(e){}
  if(z&&z.k===sig){var m={};s.p.forEach(function(x){m[norm(x.u)]=x});return z.L.map(function(u){return m[u]})}
  var L=sorteer(s);try{sessionStorage.setItem('tw-volg',JSON.stringify({k:sig,L:L.map(function(x){return norm(x.u)})}))}catch(e){}return L}
function sorteer(s){var o=s.p.map(function(x,i){return {x:x,i:i,d:(s.d[norm(x.u)]||'').slice(0,10),n:nieuw(s,x)?1:0}});   /* per dag: op dezelfde dag bijgewerkt = je eigen volgorde */
  o.sort(s.volg==='nieuw'?function(a,b){return a.d<b.d?1:a.d>b.d?-1:a.i-b.i}:function(a,b){return b.n-a.n||a.i-b.i});return o.map(function(q){return q.x})}

/* ---------- startpagina: meteen naar de eerste vastgezette pagina (één keer per bezoek) ---------- */
function laad(srcs,klaar){var i=0;(function volgende(){if(i>=srcs.length)return klaar();var x=document.createElement('script');x.src=srcs[i++];x.onload=volgende;x.onerror=volgende;document.head.appendChild(x)})()}
if(isStart&&kan){var s0=lees();var gezien=false;try{gezien=sessionStorage.getItem('tw-gestart')==='1';sessionStorage.setItem('tw-gestart','1')}catch(e){gezien=true}
  if(s0.auto&&s0.p.some(function(x){return !x.e})&&!gezien&&location.hash!=='#start'){
    var weg=function(){var s=lees();var v=volgorde(s).filter(function(x){return !x.e});if(v.length&&norm(v[0].u)!==norm(hier()))location.replace(v[0].u)};
    if(s0.volg!=='vast'&&s0.p.length>1&&JS){var klaar=false;var t=setTimeout(function(){if(!klaar){klaar=true;weg()}},8000);
      laad(JS.split('|').filter(Boolean),function(){if(klaar)return;klaar=true;clearTimeout(t);var s=lees();if(datums(s))bewaar(s);weg()})}
    else{weg();return}}}
else{try{sessionStorage.setItem('tw-gestart','1')}catch(e){}}
if(!kan)return;

/* ---------- knop en menu ---------- */
var css='.twv{position:fixed;left:16px;bottom:16px;z-index:60;display:flex;align-items:center;gap:2px;font:600 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif;background:#2f5d4b;color:#fff;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.22);padding:3px}'
+'.twv button{all:unset;cursor:pointer;padding:7px 10px;border-radius:999px;white-space:nowrap}.twv button:hover,.twv button:focus-visible{background:rgba(255,255,255,.18)}.twv button[disabled]{opacity:.4;cursor:default;background:none}'
+'.twv .nr{font-variant-numeric:tabular-nums}'
+'.twm{position:fixed;left:16px;bottom:64px;z-index:61;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 90px);overflow:auto;background:#fff;color:#1d2420;border:1px solid #d5dcd6;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.22);padding:14px;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}'
+'.twm[hidden]{display:none}.twm h2{font-size:16px;margin:0 0 2px}.twm p{margin:0 0 10px;color:#5d6862;font-size:13px}'
+'.twm ol{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:4px}.twm li{display:flex;align-items:center;gap:6px;background:#f2f5f2;border-radius:8px;padding:6px 8px}'
+'.twm li.nu{outline:2px solid #2f5d4b}.twm li b{font-variant-numeric:tabular-nums;color:#2f5d4b;min-width:1.2em}.twm li a{flex:1;min-width:0;color:#1d2420;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.twm li a:hover{text-decoration:underline}'
+'.twm li button{all:unset;cursor:pointer;color:#2f5d4b;padding:2px 5px;border-radius:5px;font-size:13px}.twm li button:hover,.twm li button:focus-visible{background:#dfe8e2}.twm li button[disabled]{color:#bcc5bf;cursor:default;background:none}'
+'.twm .hoofd{all:unset;cursor:pointer;display:block;text-align:center;background:#2f5d4b;color:#fff;font-weight:600;border-radius:8px;padding:8px 10px;margin-bottom:10px}.twm .hoofd:hover,.twm .hoofd:focus-visible{background:#244a3b}'
+'.twm label{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#1d2420}.twm .twl{color:#5d6862;font-size:13px;margin:0 0 10px}.twm .ft{display:flex;justify-content:space-between;gap:10px;margin-top:10px;font-size:13px}.twm .ft a{color:#2f5d4b}'
+'.twm .dt{font-size:12px;color:#5d6862;white-space:nowrap}.twm .nw{font-size:11px;font-weight:700;color:#fff;background:#c47a12;border-radius:99px;padding:1px 6px;white-space:nowrap}.twv .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#f0b45a;margin-left:5px;vertical-align:middle}'
+'.twm .exk{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.twm .exk button{all:unset;cursor:pointer;font-size:13px;color:#2f5d4b;border:1px solid #c9d6cd;border-radius:99px;padding:3px 10px}.twm .exk button:hover,.twm .exk button:focus-visible{background:#e8efea}'
+'.twv .sep{width:1px;align-self:stretch;margin:5px 3px;background:rgba(255,255,255,.35)}'
+'.twp textarea{box-sizing:border-box;width:100%;min-height:200px;resize:vertical;font:14px/1.45 ui-monospace,Consolas,monospace;padding:8px;border:1px solid #c9d6cd;border-radius:8px;background:#fff;color:#1d2420}'
+'.twp .rij{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.twp .rij button{all:unset;cursor:pointer;font-size:13px;color:#2f5d4b;border:1px solid #c9d6cd;border-radius:99px;padding:4px 11px}.twp .rij button:hover,.twp .rij button:focus-visible{background:#e8efea}.twp .rij button.warn{color:#c23b32;border-color:#e3b5b1}'
+'.twp .st{font-size:12px;color:#5d6862;margin-top:6px;min-height:1em}.twmed{font-size:14px;line-height:1.5}.twmed p{margin:0 0 8px;color:inherit;font-size:14px}.twmed ul{margin:0 0 8px;padding-left:20px}.twmed a{color:#2f5d4b}'
+'.twmedk{background:var(--kaart,#fff);border:1px solid var(--lijn,#dfe4e0);border-left:4px solid var(--accent,#2f5d4b);border-radius:12px;padding:14px 16px;margin:0 0 20px}.twmedk h2{margin:0 0 6px;font-size:17px;color:var(--accent,#2f5d4b)}.twmedk .twmed p{color:var(--fg,#1d2420)}.twmedk .twmed a{color:var(--accent,#2f5d4b)}'
+'.twm .eig{display:flex;flex-direction:column;gap:6px;margin:-4px 0 10px;padding:8px;border:1px solid #c9d6cd;border-radius:8px}.twm .eig label{flex-direction:column;gap:2px}.twm .eig input{font:inherit;font-size:13px;padding:5px 7px;border:1px solid #c9d6cd;border-radius:6px;background:#fff;color:#1d2420;width:100%;box-sizing:border-box}.twm .eig .rij2{display:flex;gap:6px}.twm .eig .rij2 button{all:unset;cursor:pointer;font-size:13px;padding:4px 11px;border-radius:99px;border:1px solid #c9d6cd;color:#2f5d4b}.twm .eig .rij2 button[type=submit]{background:#2f5d4b;color:#fff;border-color:#2f5d4b}.twm .eig .fout{font-size:12px;color:#c23b32;min-height:0}'
+'.twm fieldset{border:0;margin:0 0 8px;padding:0;display:flex;flex-direction:column;gap:3px}.twm legend{font-size:13px;font-weight:600;margin-bottom:3px;padding:0}'
+'@media (prefers-color-scheme:dark){.twv{background:#8fc5ad;color:#14201b}.twv button:hover,.twv button:focus-visible{background:rgba(0,0,0,.12)}.twm{background:#1b2220;color:#e7ece8;border-color:#2c3531}.twm p,.twm .twl{color:#97a39b}.twm li{background:#232c29}.twm li a,.twm label{color:#e7ece8}.twm li b,.twm li button,.twm .ft a{color:#8fc5ad}.twm li.nu{outline-color:#8fc5ad}.twm .dt{color:#97a39b}.twm li button:hover{background:#2c3a35}.twm .hoofd{background:#8fc5ad;color:#14201b}.twm .exk button{color:#8fc5ad;border-color:#36443e}.twm .exk button:hover{background:#22302a}.twm .eig{border-color:#36443e}.twm .eig input{background:#141917;color:#e7ece8;border-color:#36443e}.twm .eig .rij2 button{color:#8fc5ad;border-color:#36443e}.twm .eig .rij2 button[type=submit]{background:#8fc5ad;color:#14201b}.twm .eig .fout{color:#f07a70}.twv .sep{background:rgba(0,0,0,.25)}.twp textarea{background:#141917;color:#e7ece8;border-color:#36443e}.twp .rij button{color:#8fc5ad;border-color:#36443e}.twp .rij button:hover{background:#22302a}.twp .rij button.warn{color:#f07a70;border-color:#5a3431}.twp .st{color:#97a39b}.twmed a{color:#8fc5ad}}'
+'@media print{.twv,.twm{display:none!important}}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
var bar=document.createElement('div');bar.className='twv';bar.setAttribute('role','navigation');bar.setAttribute('aria-label','vastgezette pagina\'s');
var menu=document.createElement('div');menu.className='twm';menu.hidden=true;menu.id='twv-menu';
var pan=document.createElement('div');pan.className='twm twp';pan.hidden=true;pan.id='twv-paneel';
document.body.appendChild(menu);document.body.appendChild(pan);document.body.appendChild(bar);
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function posIn(L){var h=norm(hier());for(var i=0;i<L.length;i++)if(norm(L[i].u)===h)return i;return -1}
function posNav(L){var z=null;try{z=JSON.parse(sessionStorage.getItem('tw-ext')||'null')}catch(e){}if(z&&z.at===norm(hier())){for(var i=0;i<L.length;i++)if(L[i].u===z.u)return i}return posIn(L)}
function gezienExt(u){var s=lees(),k=norm(u);if(s.d[k]){s.g[k]=s.d[k];bewaar(s)}}
function ga(x){if(x.e){window.open(x.u,'_blank','noopener');try{sessionStorage.setItem('tw-ext',JSON.stringify({u:x.u,at:norm(hier())}))}catch(e){}gezienExt(x.u);teken();return}if(norm(x.u)===norm(hier())){try{sessionStorage.removeItem('tw-ext')}catch(e){}teken();return}location.href=x.u}
var MN=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
function dtxt(d){return d?(+d.slice(8,10))+' '+MN[+d.slice(5,7)-1]+(d.slice(0,4)!==String(new Date().getFullYear())?' '+d.slice(0,4):''):''}
/* ---------- mededelingen van de club (mededelingen.txt, via mededelingen.js naast vast.js) ---------- */
function medTekst(){var M=window.TW_MED;return M&&M.tekst?M.tekst:''}
function medNieuw(){var M=window.TW_MED;if(!M||!M.tekst)return false;var g='';try{g=localStorage.getItem(KEY+'-med')||''}catch(e){}return g!==M.id}
function medGelezen(){var M=window.TW_MED;if(M&&M.id){try{localStorage.setItem(KEY+'-med',M.id)}catch(e){}}}
function opmaak(t){/* lege regel = nieuwe alinea, "- " = opsomming, links worden klikbaar */
  /* links: [naam](https://...) toont de naam, een los adres (https://... of www....) wordt zelf de link */
  var a=function(u,t){if(/^www\./i.test(u))u='https://'+u;return '<a href="'+u+'" target="_blank" rel="noopener">'+t+'</a>'};
  var lk=function(x){var d=[];x=String(x).replace(/\[([^\]\n]+)\]\(\s*((?:https?:\/\/|www\.)[^\s)]+)\s*\)/gi,function(m,t,u){d.push(a(esc(u),esc(t)));return '\u0000'+(d.length-1)+'\u0000'});
    return esc(x).replace(/((?:https?:\/\/|www\.)[^\s<\u0000]+[^\s<\u0000.,;:!?)\]])/gi,function(m,u){return a(u,u.replace(/^https?:\/\//,''))}).replace(/\u0000(\d+)\u0000/g,function(m,i){return d[+i]})};
  return '<div class="twmed">'+t.split(/\n\s*\n/).map(function(bl){var r=bl.split('\n');if(r.every(function(x){return /^\s*[-*•]\s+/.test(x)}))return '<ul>'+r.map(function(x){return '<li>'+lk(x.replace(/^\s*[-*•]\s+/,''))+'</li>'}).join('')+'</ul>';return '<p>'+r.map(lk).join('<br>')+'</p>'}).join('')+'</div>'}
function tekenMed(){pan.innerHTML='<h2>Mededelingen</h2>'+opmaak(medTekst())+'<div class="ft"><span></span><button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Sluiten</button></div>';medGelezen()}
function medStart(){var d=document.getElementById('twmed');if(!d)return;var t=medTekst();d.innerHTML=t?'<div class="twmedk"><h2>Mededelingen</h2>'+opmaak(t)+'</div>':'';if(t)medGelezen()}
(function(){var src=me&&me.src||'';if(!src)return;var x=document.createElement('script');x.src=src.replace(/[^\/]*$/,'')+'mededelingen.js?u='+Math.floor(Date.now()/600000);
  x.onload=function(){medStart();teken();if(!pan.hidden&&pan.dataset.k==='med')tekenMed()};document.head.appendChild(x)})();

/* ---------- mijn notities: alleen voor deze bezoeker, in deze browser; als .txt te bewaren en in te laden (Kladblok) ---------- */
var NK=KEY+'-notities',vorigeNotes=null;
function notes(){try{return localStorage.getItem(NK)||''}catch(e){return ''}}
function notesBewaar(t){try{localStorage.setItem(NK,t);return true}catch(e){return false}}
function nst(t){var e=pan.querySelector('.st');if(e)e.textContent=t}
function tekenNotes(){pan.innerHTML='<h2>Mijn notities</h2><p>Alleen voor jou, in deze browser; wordt vanzelf bewaard. Bewaar ze als .txt om ze in Kladblok te openen of op een ander toestel in te laden.</p>'
  +'<textarea aria-label="mijn notities" spellcheck="true" placeholder="Bv. wanneer ik niet kan spelen, mijn openingen, wat ik nog wil nakijken…"></textarea>'
  +'<div class="rij"><button type="button" data-a="n-txt">Bewaren als .txt</button><button type="button" data-a="n-in">Inladen uit .txt</button><button type="button" data-a="n-wis" class="warn">Wissen</button></div>'
  +'<input type="file" accept=".txt,text/plain" hidden><div class="st" aria-live="polite"></div><div class="ft"><span></span><button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Sluiten</button></div>';
  var ta=pan.querySelector('textarea');ta.value=notes();
  ta.addEventListener('input',function(){if(notesBewaar(ta.value))nst('bewaard');else nst('kon niet bewaren in deze browser')});
  pan.querySelector('input[type=file]').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(!f)return;
    var lees2=function(enc,klaar){var r=new FileReader();r.onload=function(){klaar(String(r.result||''))};r.readAsText(f,enc)};
    lees2('utf-8',function(t){var ga2=function(t){t=t.replace(/^\ufeff/,'').replace(/\r\n?/g,'\n');vorigeNotes=ta.value;ta.value=t;notesBewaar(t);
        nst(f.name+' ingeladen.');if(vorigeNotes){var st=pan.querySelector('.st');st.innerHTML=esc(f.name)+' ingeladen. <button type="button" data-a="n-terug" style="all:unset;cursor:pointer;text-decoration:underline">Ongedaan maken</button>'}};
      if(t.indexOf('\ufffd')>=0)lees2('windows-1252',ga2);else ga2(t)});e.target.value=''})}
var wisKlaar=0;
function notesActie(a,b){var ta=pan.querySelector('textarea');if(!ta)return;
  if(a==='n-txt'){var t=ta.value.replace(/\r?\n/g,'\r\n');var bl=new Blob(['\ufeff'+t],{type:'text/plain;charset=utf-8'});var u=URL.createObjectURL(bl);var x=document.createElement('a');x.href=u;x.download='Mijn notities Torrewachters.txt';document.body.appendChild(x);x.click();setTimeout(function(){URL.revokeObjectURL(u);x.remove()},1000);nst('Bewaard als "Mijn notities Torrewachters.txt" (in je map Downloads).')}
  else if(a==='n-in'){pan.querySelector('input[type=file]').click()}
  else if(a==='n-terug'){if(vorigeNotes!=null){ta.value=vorigeNotes;notesBewaar(vorigeNotes);vorigeNotes=null;nst('Teruggezet.')}}
  else if(a==='n-wis'){if(!ta.value){nst('Er staat niets.');return}if(Date.now()<wisKlaar){vorigeNotes=ta.value;ta.value='';notesBewaar('');wisKlaar=0;b.textContent='Wissen';var st=pan.querySelector('.st');st.innerHTML='Gewist. <button type="button" data-a="n-terug" style="all:unset;cursor:pointer;text-decoration:underline">Ongedaan maken</button>'}
    else{wisKlaar=Date.now()+4000;b.textContent='Zeker? Klik nog eens';setTimeout(function(){if(b.isConnected)b.textContent='Wissen'},4000)}}}
var eigenOpen=false;
function teken(){var s=lees(),L=volgorde(s),i=posNav(L),n=L.length;var andereNieuw=L.some(function(x,k){return k!==i&&nieuw(s,x)});
  if(!n){bar.innerHTML='<button type="button" data-a="menu" aria-expanded="'+!menu.hidden+'" aria-controls="twv-menu" title="Zet deze pagina vast: de site opent dan meteen hier">📌 Vastzetten</button>'}
  else{bar.innerHTML='<button type="button" data-a="vorige" aria-label="vorige vastgezette pagina"'+(n<2&&i>=0?' disabled':'')+'>◀</button>'
    +'<button type="button" data-a="menu" class="nr" aria-expanded="'+!menu.hidden+'" aria-controls="twv-menu" title="Vastgezette pagina\'s: kiezen, vastzetten, volgorde'+(andereNieuw?' (er is iets nieuw)':'')+'">📌 '+(i>=0?(i+1)+'/'+n:'–/'+n)+(andereNieuw?'<span class="dot" aria-label="nieuw"></span>':'')+'</button>'
    +'<button type="button" data-a="volgende" aria-label="volgende vastgezette pagina"'+(n<2&&i>=0?' disabled':'')+'>▶</button>'}
  bar.insertAdjacentHTML('beforeend','<span class="sep" aria-hidden="true"></span>'+(medTekst()?'<button type="button" data-a="med" aria-expanded="'+(!pan.hidden&&pan.dataset.k==='med')+'" aria-controls="twv-paneel" title="Mededelingen van de club'+(medNieuw()?' (nieuw)':'')+'">📢'+(medNieuw()?'<span class="dot" aria-label="nieuw"></span>':'')+'</button>':'')
    +'<button type="button" data-a="notes" aria-expanded="'+(!pan.hidden&&pan.dataset.k==='notes')+'" aria-controls="twv-paneel" title="Mijn notities (alleen voor jou)">📝</button>');
  if(!menu.hidden&&!(document.activeElement&&menu.contains(document.activeElement)&&/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)))tekenMenu()}
function tekenMenu(){var s=lees(),L=volgorde(s),i=posIn(L),n=L.length,vast=s.volg!=='nieuw';
  var h='<h2>Vastgezette pagina\'s</h2><p>Alleen voor jou, in deze browser. Als je de site opent, kom je meteen op de eerste pagina van deze site; met ◀ ▶ links onderaan blader je verder. Andere sites openen in een nieuw tabblad.</p>';
  h+=i>=0?'<button type="button" class="hoofd" data-a="los" data-u="'+esc(L[i].u)+'">Deze pagina losmaken</button>'
     :n>=MAX?'<p class="twl">Er staan al '+MAX+' pagina\'s vast. Maak er eerst een los (✕).</p>'
     :'<button type="button" class="hoofd" data-a="vast">📌 Deze pagina vastzetten</button>';
  h+=n?'<ol>'+L.map(function(x,k){var d=s.d[norm(x.u)]||'';var j=s.p.indexOf(x);return '<li'+(k===i?' class="nu"':'')+'><b>'+(k+1)+'</b><a href="'+esc(x.u)+'" title="'+esc(x.t)+'"'+(x.e?' target="_blank" rel="noopener" data-e="1"':'')+'>'+esc(x.t)+(x.e?' ↗':'')+'</a>'+(nieuw(s,x)?'<span class="nw" title="bijgewerkt sinds je vorige bezoek">nieuw</span>':d?'<span class="dt" title="laatst bijgewerkt">'+dtxt(d)+'</span>':'')
      +(true?'<button type="button" data-a="op" data-i="'+j+'" aria-label="hoger"'+(j?'':' disabled')+'>▲</button><button type="button" data-a="neer" data-i="'+j+'" aria-label="lager"'+(j<n-1?'':' disabled')+'>▼</button>':'')
      +'<button type="button" data-a="los" data-u="'+esc(x.u)+'" aria-label="losmaken">✕</button></li>'}).join('')+'</ol>'
     :'<p class="twl">Nog niets vastgezet. Ga naar een pagina die je vaak bekijkt (bv. je eigen spelerspagina of de stand van je reeks) en klik op Vastzetten.</p>';
  var ex=externen().filter(function(x){return !s.p.some(function(q){return q.u===x.u})});
  if(n<MAX){h+='<p class="twl" style="margin-bottom:4px">Andere sites vastzetten (openen in een nieuw tabblad):</p><div class="exk">'+ex.map(function(x){return '<button type="button" data-a="ext" data-id="'+x.id+'">+ '+esc(x.t)+'</button>'}).join('')+'<button type="button" data-a="eigen">+ Eigen link …</button></div>';
    if(eigenOpen)h+='<form class="eig" data-f="eigen"><label>Adres <input type="text" inputmode="url" name="u" placeholder="bv. www.youtube.com/@... of facebook.com/..." autocomplete="url" spellcheck="false"></label><label>Naam <input type="text" name="t" maxlength="60" placeholder="bv. Mijn YouTube (mag leeg)"></label><div class="rij2"><button type="submit">Toevoegen</button><button type="button" data-a="eigen-weg">Annuleren</button></div><div class="fout" aria-live="polite"></div></form>'}
  var rb=function(v,t){return '<label><input type="radio" name="twvolg" data-a="volg" value="'+v+'"'+(s.volg===v?' checked':'')+'> '+t+'</label>'};
  if(n>1)h+='<fieldset><legend>Volgorde</legend>'+rb('vast','Vaste volgorde: zoals ik ze zet (▲ ▼)')+rb('nieuw','Laatst bijgewerkte pagina eerst (op dezelfde dag: mijn volgorde)')+rb('ongezien','Eerst wat nieuw is sinds mijn vorige bezoek, daarna mijn volgorde')+'</fieldset>';
  h+='<label><input type="checkbox" data-a="auto"'+(s.auto?' checked':'')+'> Bij het openen van de site meteen naar de eerste vastgezette pagina van deze site gaan</label>';
  var su=startUrl();h+='<div class="ft">'+(su?'<a href="'+su+'">Startpagina</a>':'<span></span>')+'<button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Sluiten</button></div>';
  menu.innerHTML=h}
function startUrl(){/* online: de startpagina staat in de hoofdmap, club/ en elo/ eronder; lokaal is er geen */
  if(!/^https?:$/.test(location.protocol))return '';return (isStart||!/\/(club|elo)\/[^\/]*$/.test(location.pathname)?'index.html':'../index.html')+'#start'}
function wijzig(f){var s=lees();f(s);bewaar(s);teken()}
function nr(s,u){for(var i=0;i<s.p.length;i++)if(s.p[i].u===u)return i;return -1}
document.addEventListener('click',function(e){var le=e.target.closest&&e.target.closest('.twm a[data-e]');if(le){gezienExt(le.getAttribute('href'));setTimeout(teken,50)}
  var b=e.target.closest&&e.target.closest('.twv button[data-a],.twm button[data-a]');
  if(!b){if((!menu.hidden||!pan.hidden)&&!e.target.closest('.twm,.twv')){menu.hidden=true;pan.hidden=true;teken()}return}
  var a=b.getAttribute('data-a'),k=+b.getAttribute('data-i'),u=b.getAttribute('data-u');var s=lees(),L=volgorde(s),i=posIn(L),n=L.length;
  if(a==='notes'||a==='med'){var open=pan.hidden||pan.dataset.k!==a;menu.hidden=true;pan.hidden=!open;if(open){pan.dataset.k=a;if(a==='notes')tekenNotes();else tekenMed()}teken();if(open){var f2=pan.querySelector('textarea,button,a');if(f2)f2.focus()}return}
  if(/^n-/.test(a)){notesActie(a,b);return}
  if(a==='menu'){menu.hidden=!menu.hidden;pan.hidden=true;teken();if(!menu.hidden){var f=menu.querySelector('button,a');if(f)f.focus()}}
  else if(a==='sluit'){menu.hidden=true;pan.hidden=true;teken()}
  else if(a==='vorige'&&n){var j=posNav(L);ga(L[j<0?n-1:(j-1+n)%n])}
  else if(a==='volgende'&&n){var j2=posNav(L);ga(L[j2<0?0:(j2+1)%n])}
  else if(a==='eigen'){eigenOpen=true;tekenMenu();var fi=menu.querySelector('.eig input');if(fi)fi.focus()}
  else if(a==='eigen-weg'){eigenOpen=false;tekenMenu()}
  else if(a==='ext')wijzig(function(s){var x=externen().filter(function(q){return q.id===b.getAttribute('data-id')})[0];if(x&&s.p.length<MAX&&!s.p.some(function(q){return q.u===x.u})){s.p.push({u:x.u,t:x.t,e:1});datums(s);var k2=norm(x.u);if(s.d[k2])s.g[k2]=s.d[k2]}})
  else if(a==='vast')wijzig(function(s){if(posIn(s.p)<0&&s.p.length<MAX){s.p.push({u:hier(),t:titel()});datums(s);var q=norm(hier());if(s.d[q])s.g[q]=s.d[q]}})
  else if(a==='los')wijzig(function(s){var j=nr(s,u);if(j>=0)s.p.splice(j,1)})
  else if(a==='op'&&k>0)wijzig(function(s){var x=s.p.splice(k,1)[0];s.p.splice(k-1,0,x)})
  else if(a==='neer')wijzig(function(s){if(k<s.p.length-1){var x=s.p.splice(k,1)[0];s.p.splice(k+1,0,x)}})});
document.addEventListener('submit',function(e){var f=e.target;if(!f.matches||!f.matches('.twm form[data-f="eigen"]'))return;e.preventDefault();
  var u=String(f.u.value||'').trim(),t=String(f.t.value||'').trim(),fo=f.querySelector('.fout');
  if(u&&!/^[a-z][a-z0-9+.-]*:/i.test(u))u='https://'+u;
  var ok=false;try{var x=new URL(u);ok=/^https?:$/.test(x.protocol)&&/\./.test(x.hostname);if(ok){u=x.href;if(!t)t=x.hostname.replace(/^www\./,'')+(x.pathname.length>1?x.pathname.replace(/\/$/,''):'')}}catch(er){}
  if(!ok){fo.textContent='Dat is geen geldig internetadres (bv. https://www.youtube.com/@kanaal).';return}
  var s=lees();if(s.p.some(function(q){return q.u===u})){fo.textContent='Die link staat al in je lijst.';return}if(s.p.length>=MAX){fo.textContent='Er staan al '+MAX+' pagina\'s vast.';return}
  s.p.push({u:u,t:t.slice(0,60),e:1});bewaar(s);eigenOpen=false;f.blur&&f.blur();if(document.activeElement)document.activeElement.blur();teken()});
document.addEventListener('change',function(e){var t=e.target;if(!t.matches)return;
  if(t.matches('.twm [data-a="auto"]')){var c=t.checked;wijzig(function(s){s.auto=c})}
  else if(t.matches('.twm [data-a="volg"]')){var v=t.value;try{sessionStorage.removeItem('tw-volg')}catch(e){}wijzig(function(s){s.volg=v;datums(s)})}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&(!menu.hidden||!pan.hidden)){menu.hidden=true;pan.hidden=true;teken()}});
/* na het laden: titel van deze pagina, datums van alle vastgezette pagina's (als de gegevens er zijn), en deze pagina als gezien */
function bij(){var s=lees();datums(s);var i=posIn(s.p);if(i>=0){var t=titel();if(t)s.p[i].t=t;var q=norm(hier());if(s.d[q])s.g[q]=s.d[q]}bewaar(s);teken()}
window.addEventListener('hashchange',function(){setTimeout(bij,50)});
window.addEventListener('storage',function(e){if(e.key===KEY)teken()});
teken();setTimeout(bij,800);
})();
