/* vast.js - het balkje links onderaan elke pagina (alles in de eigen browser van de bezoeker):
   📌 Mijn pagina: een bezoeker kiest een pagina (meestal zijn eigen spelerspagina); de startpagina opent daarna meteen die pagina
      (een keer per bezoek; via "Startpagina" in het menu kom je toch op de startpagina).
   📢 Mededelingen van de club (mededelingen.js, gemaakt uit mededelingen.txt) en 📝 Mijn notities.
   Staat op elke pagina van de site (in Elo-Torrewachters; de andere pagina's verwijzen ernaar). */
(function(){
'use strict';
if(window.__twVast)return;window.__twVast=1;
var KEY='tw-vast',MK='tw-mijn';
var me=document.currentScript;var isStart=!!(me&&me.hasAttribute('data-start'));
var kan=(function(){try{localStorage.setItem(KEY+'-t','1');localStorage.removeItem(KEY+'-t');return true}catch(e){return false}})();
function hier(){return location.href.replace(/\?[^#]*/,'').replace(/#$/,'')}
function norm(u){return String(u).replace(/\?[^#]*/,'').replace(/\/index\.html(?=#|$)/,'/').replace(/#$/,'')}
function titel(){var t=(document.title||'').replace(/\s*·\s*Torrewachters$/,'').trim()||'Pagina';var h='';try{h=decodeURIComponent(location.hash.slice(1))}catch(e){}
  if(h&&h!=='start'&&!/^\d+$/.test(h)){var n=h.replace(/[_~]+/g,' ').trim();if(n&&t.indexOf(n)<0)t=t+' · '+n}return t}
/* mijn pagina: {u,t,auto}; vroeger kon je meerdere pagina's vastzetten (tw-vast): dan wordt de eerste pagina van deze site "mijn pagina" */
function mijn(){var m=null;try{m=JSON.parse(localStorage.getItem(MK)||'null')}catch(e){}
  if(!m){try{var v=JSON.parse(localStorage.getItem(KEY)||'null');var x=v&&Array.isArray(v.p)&&v.p.filter(function(q){return q&&q.u&&!q.e})[0];
    if(x){m={u:x.u,t:x.t||'Mijn pagina',auto:v.auto!==false};localStorage.setItem(MK,JSON.stringify(m))}}catch(e){}}
  return m&&m.u?m:null}
function zetMijn(m){try{if(m)localStorage.setItem(MK,JSON.stringify(m));else localStorage.removeItem(MK)}catch(e){}}

/* ---------- startpagina: meteen naar mijn pagina (een keer per bezoek) ---------- */
/* de website als app: service worker (sw.js) en manifest in de hoofdmap van de website */
var twApp=null;
(function(){if(!/^https?:$/.test(location.protocol))return;var root=(isStart||!/\/(club|elo)\/[^\/]*$/.test(location.pathname))?'':'../';
  try{if('serviceWorker' in navigator)navigator.serviceWorker.register(root+'sw.js').catch(function(){})}catch(e){}
  if(!document.querySelector('link[rel="manifest"]')){var h=document.head;[['manifest',root+'manifest.webmanifest'],['apple-touch-icon',root+'app-180.png'],['icon',root+'app-32.png']].forEach(function(x){var l=document.createElement('link');l.rel=x[0];l.href=x[1];h.appendChild(l)});
    var mt=document.createElement('meta');mt.name='theme-color';mt.content='#2f5d4b';h.appendChild(mt)}
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();twApp=e})})();
function isApp(){try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}}
var meeH=/^#tw=/.test(location.hash);
if(isStart&&kan&&!meeH){var m0=mijn();var gezien=false;try{gezien=sessionStorage.getItem('tw-gestart')==='1';sessionStorage.setItem('tw-gestart','1')}catch(e){gezien=true}
  if(m0&&m0.auto!==false&&!gezien&&location.hash!=='#start'&&norm(m0.u)!==norm(hier())){location.replace(m0.u);return}}
else{try{sessionStorage.setItem('tw-gestart','1')}catch(e){}}
if(!kan)return;

/* ---------- balkje en menu ---------- */
var css='.twv{position:fixed;left:16px;bottom:16px;z-index:60;display:flex;align-items:center;gap:2px;font:600 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif;background:#2f5d4b;color:#fff;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.22);padding:3px}'
+'.twv button{all:unset;cursor:pointer;padding:7px 10px;border-radius:999px;white-space:nowrap}.twv button:hover,.twv button:focus-visible{background:rgba(255,255,255,.18)}.twv button[disabled]{opacity:.4;cursor:default;background:none}'
+'.twv .nr{font-variant-numeric:tabular-nums}'
+'.twm{position:fixed;left:16px;bottom:64px;z-index:61;width:min(380px,calc(100vw - 32px));box-sizing:border-box;max-height:calc(100vh - 90px);overflow:auto;background:#fff;color:#1d2420;border:1px solid #d5dcd6;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.22);padding:14px;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}'
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
+'.twp .st{font-size:12px;color:#5d6862;margin-top:6px;min-height:1em}.twmed{font-size:14px;line-height:1.5}.twmed p{margin:0 0 8px;color:inherit;font-size:14px}.twmed ul{margin:0 0 8px;padding-left:20px}.twmed a{color:#2f5d4b}.twmed .twk1{font-size:22px;line-height:1.2;font-weight:700;margin:2px 0 8px}.twmed .twk2{font-size:17px;font-weight:700;margin:2px 0 6px}.twmed .twgr{font-size:1.3em;font-weight:600}'
+'.twmedk{background:var(--kaart,#fff);border:1px solid var(--lijn,#dfe4e0);border-left:4px solid var(--accent,#2f5d4b);border-radius:12px;padding:14px 16px;margin:0 0 20px}.twmedk h2{margin:0 0 6px;font-size:17px;color:var(--accent,#2f5d4b)}.twmedk .twmed p{color:var(--fg,#1d2420)}.twmedk .twmed a{color:var(--accent,#2f5d4b)}'
+'.twm .eig{display:flex;flex-direction:column;gap:6px;margin:-4px 0 10px;padding:8px;border:1px solid #c9d6cd;border-radius:8px}.twm .eig label{flex-direction:column;gap:2px}.twm .eig input{font:inherit;font-size:13px;padding:5px 7px;border:1px solid #c9d6cd;border-radius:6px;background:#fff;color:#1d2420;width:100%;box-sizing:border-box}.twm .eig .rij2{display:flex;gap:6px}.twm .eig .rij2 button{all:unset;cursor:pointer;font-size:13px;padding:4px 11px;border-radius:99px;border:1px solid #c9d6cd;color:#2f5d4b}.twm .eig .rij2 button[type=submit]{background:#2f5d4b;color:#fff;border-color:#2f5d4b}.twm .eig .fout{font-size:12px;color:#c23b32;min-height:0}'
+'.twm fieldset{border:0;margin:0 0 8px;padding:0;display:flex;flex-direction:column;gap:3px}.twm legend{font-size:13px;font-weight:600;margin-bottom:3px;padding:0}'
+'@media (prefers-color-scheme:dark){.twv{background:#8fc5ad;color:#14201b}.twv button:hover,.twv button:focus-visible{background:rgba(0,0,0,.12)}.twm{background:#1b2220;color:#e7ece8;border-color:#2c3531}.twm p,.twm .twl{color:#97a39b}.twm li{background:#232c29}.twm li a,.twm label{color:#e7ece8}.twm li b,.twm li button,.twm .ft a{color:#8fc5ad}.twm li.nu{outline-color:#8fc5ad}.twm .dt{color:#97a39b}.twm li button:hover{background:#2c3a35}.twm .hoofd{background:#8fc5ad;color:#14201b}.twm .exk button{color:#8fc5ad;border-color:#36443e}.twm .exk button:hover{background:#22302a}.twm .eig{border-color:#36443e}.twm .eig input{background:#141917;color:#e7ece8;border-color:#36443e}.twm .eig .rij2 button{color:#8fc5ad;border-color:#36443e}.twm .eig .rij2 button[type=submit]{background:#8fc5ad;color:#14201b}.twm .eig .fout{color:#f07a70}.twv .sep{background:rgba(0,0,0,.25)}.twp textarea{background:#141917;color:#e7ece8;border-color:#36443e}.twp .rij button{color:#8fc5ad;border-color:#36443e}.twp .rij button:hover{background:#22302a}.twp .rij button.warn{color:#f07a70;border-color:#5a3431}.twp .st{color:#97a39b}.twmed a{color:#8fc5ad}}'
+'@media print{.twv,.twm{display:none!important}}.twp .lk{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;margin:6px 0 2px;font-size:14px}.twp .lk a{color:inherit;font-weight:600}.twp .lk>span{opacity:.7;font-size:13px}.twp .twqr{display:flex;justify-content:center;margin:6px 0}.twp .twqr svg{width:min(240px,70vw);height:auto;background:#fff;border-radius:6px}.twp .twk{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:6px 0}.twp .twk button,.twp .twk a{font:inherit;font-size:13px;padding:5px 12px;border:1px solid rgba(128,128,128,.45);border-radius:999px;background:none;color:inherit;cursor:pointer;text-decoration:none}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
var bar=document.createElement('div');bar.className='twv';bar.setAttribute('role','navigation');bar.setAttribute('aria-label','mijn pagina, mededelingen en notities');
var menu=document.createElement('div');menu.className='twm';menu.hidden=true;menu.id='twv-menu';
var pan=document.createElement('div');pan.className='twm twp';pan.hidden=true;pan.id='twv-paneel';
document.body.appendChild(menu);document.body.appendChild(pan);document.body.appendChild(bar);
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/* ---------- mededelingen van de club (mededelingen.txt, via mededelingen.js naast vast.js) ---------- */
function medTekst(){var M=window.TW_MED;return M&&M.tekst?M.tekst:''}
function medNieuw(){var M=window.TW_MED;if(!M||!M.tekst)return false;var g='';try{g=localStorage.getItem(KEY+'-med')||''}catch(e){}return g!==M.id}
function medGelezen(){var M=window.TW_MED;if(M&&M.id){try{localStorage.setItem(KEY+'-med',M.id)}catch(e){}}}
function opmaak(t){/* lege regel = nieuwe alinea, "- " = opsomming, links worden klikbaar */
  /* links: [naam](https://...) toont de naam, een los adres (https://... of www....) wordt zelf de link
     opmaak: **vet**, _schuin_, ++groter++; een regel die begint met "!! " is een grote titel, met "! " een kleine titel */
  var a=function(u,t){if(/^www\./i.test(u))u='https://'+u;return '<a href="'+u+'" target="_blank" rel="noopener">'+t+'</a>'};
  var lk=function(x){var d=[],bew=function(h){d.push(h);return '\u0000'+(d.length-1)+'\u0000'};
    x=String(x).replace(/\[([^\]\n]+)\]\(\s*((?:https?:\/\/|www\.)[^\s)]+)\s*\)/gi,function(m,t,u){return bew(a(esc(u),vorm(esc(t))))});
    x=x.replace(/((?:https?:\/\/|www\.)[^\s\u0000]+[^\s\u0000.,;:!?)\]])/gi,function(m,u){return bew(a(esc(u),esc(u.replace(/^https?:\/\//,''))))});
    return vorm(esc(x)).replace(/\u0000(\d+)\u0000/g,function(m,i){return d[+i]})};
  var vorm=function(h){return h.replace(/\*\*([^*\n]+?)\*\*/g,'<b>$1</b>').replace(/\+\+([^+\n]+?)\+\+/g,'<span class="twgr">$1</span>').replace(/(^|[\s(>])_([^_\n]+?)_(?=$|[\s.,;:!?)<])/g,'$1<i>$2</i>')};
  return '<div class="twmed">'+t.split(/\n\s*\n/).map(function(bl){var r=bl.split('\n'),uit='';
    // titels: een regel die begint met "!! " of "! "
    while(r.length&&/^\s*!{1,2}\s+/.test(r[0])){var m=/^\s*(!{1,2})\s+(.*)$/.exec(r.shift());uit+='<p class="'+(m[1].length===2?'twk1':'twk2')+'">'+lk(m[2])+'</p>'}
    if(!r.length)return uit;
    if(r.every(function(x){return /^\s*[-*•]\s+/.test(x)}))return uit+'<ul>'+r.map(function(x){return '<li>'+lk(x.replace(/^\s*[-*•]\s+/,''))+'</li>'}).join('')+'</ul>';
    return uit+'<p>'+r.map(lk).join('<br>')+'</p>'}).join('')+'</div>'}
function tekenMed(){pan.innerHTML='<h2>Mededelingen</h2>'+opmaak(medTekst())+'<div class="ft"><span></span><button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Sluiten</button></div>';medGelezen()}
function medStart(){var d=document.getElementById('twmed');if(!d)return;var t=medTekst();d.innerHTML=t?'<div class="twmedk"><h2>Mededelingen</h2>'+opmaak(t)+'</div>':'';if(t)medGelezen()}
(function(){var src=me&&me.src||'';if(!src)return;var x=document.createElement('script');x.src=src.replace(/[^\/]*$/,'')+'mededelingen.js?u='+Math.floor(Date.now()/600000);
  x.onload=function(){medStart();teken();if(!pan.hidden&&pan.dataset.k==='med')tekenMed()};document.head.appendChild(x)})();

/* ---------- mijn notities: alleen voor deze bezoeker, in deze browser; als .txt te bewaren en in te laden (Kladblok) ---------- */
var NK=KEY+'-notities',vorigeNotes=null;
function notes(){try{return localStorage.getItem(NK)||''}catch(e){return ''}}
function notesBewaar(t){tekenLinks(t);try{localStorage.setItem(NK,t);return true}catch(e){return false}}
/* adressen in de notities (https://..., www....) worden onder het kladblok klikbare links; de tekst ervoor op dezelfde regel is de naam */
function tekenLinks(t){var d=pan.querySelector('.lk');if(!d)return;var L=[],gez={};
  String(t||'').split('\n').forEach(function(r){var re=/(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi,m,voor=0;while((m=re.exec(r))){var u=m[1].replace(/[.,;:!?)\]]+$/,'');var h=/^https?:/i.test(u)?u:'https://'+u;
    var nm=r.slice(voor,m.index).replace(/[\s:=\-–>|·]+$/,'').replace(/^[\s\-–*•·]+/,'').trim();voor=m.index+m[1].length;
    if(!nm){try{nm=new URL(h).hostname.replace(/^www\./,'')}catch(e){nm=u}}if(!gez[h]){gez[h]=1;L.push([h,nm])}}});
  d.innerHTML=L.length?'<b>Links</b>'+L.map(function(x){return '<a href="'+esc(x[0])+'" target="_blank" rel="noopener">'+esc(x[1])+' ↗</a>'}).join(''):'<span>Tip: plak een adres (https://…) in je notities, dan kun je het hier aanklikken. Zet er een naam voor op dezelfde regel, bv. <i>Toernooi Gent: https://…</i></span>'}
function nst(t){var e=pan.querySelector('.st');if(e)e.textContent=t}
function tekenNotes(){pan.innerHTML='<h2>Mijn notities</h2><p>Alleen voor jou, in deze browser; wordt vanzelf bewaard. Bewaar ze als .txt om ze in Kladblok te openen of op een ander toestel in te laden.</p>'
  +'<textarea aria-label="mijn notities" spellcheck="true" placeholder="Bv. wanneer ik niet kan spelen, mijn openingen, wat ik nog wil nakijken…"></textarea>'+'<div class="lk"></div>'
  +'<div class="rij"><button type="button" data-a="n-txt">Bewaren als .txt</button><button type="button" data-a="n-in">Inladen uit .txt</button><button type="button" data-a="n-wis" class="warn">Wissen</button></div>'
  +'<input type="file" accept=".txt,text/plain" hidden><div class="st" aria-live="polite"></div><div class="ft"><span></span><button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Sluiten</button></div>';
  var ta=pan.querySelector('textarea');ta.value=notes();tekenLinks(ta.value);
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

function teken(){var m=mijn(),hierM=!!(m&&norm(m.u)===norm(hier()));
  bar.innerHTML='<button type="button" data-a="menu" aria-expanded="'+!menu.hidden+'" aria-controls="twv-menu" title="'+(m?(hierM?'Dit is je pagina: de site opent meteen hier':'Mijn pagina: '+esc(m.t)):'Kies een pagina waar de site meteen mee opent, bv. je eigen spelerspagina')+'">📌'+(m?(hierM?' ✓':''):' Mijn pagina')+'</button>'
    +'<span class="sep" aria-hidden="true"></span>'+(medTekst()?'<button type="button" data-a="med" aria-expanded="'+(!pan.hidden&&pan.dataset.k==='med')+'" aria-controls="twv-paneel" title="Mededelingen van de club'+(medNieuw()?' (nieuw)':'')+'">📢'+(medNieuw()?'<span class="dot" aria-label="nieuw"></span>':'')+'</button>':'')
    +'<button type="button" data-a="notes" aria-expanded="'+(!pan.hidden&&pan.dataset.k==='notes')+'" aria-controls="twv-paneel" title="Mijn notities (alleen voor jou)">📝</button>';
  if(!menu.hidden)tekenMenu()}
function tekenMenu(){var m=mijn(),hierM=!!(m&&norm(m.u)===norm(hier()));
  var h='<h2>Mijn pagina</h2><p>Kies de pagina die je het meest bekijkt, bv. je eigen spelerspagina. Open je de site, dan kom je meteen daar. Alleen voor jou, in deze browser.</p>';
  if(m&&!hierM)h+='<a class="hoofd" href="'+esc(m.u)+'" style="text-decoration:none">Naar mijn pagina: '+esc(m.t)+'</a>';
  if(hierM)h+='<p class="twl">✓ Dit is je pagina.</p>';
  else if(isStart)h+=m?'':'<p class="twl">Ga naar de pagina die je wilt (bv. je spelerspagina) en kies daar 📌.</p>';
  else if(m)h+='<p class="twl" style="margin-top:8px"><button type="button" data-a="zet" style="all:unset;cursor:pointer;text-decoration:underline">Deze pagina wordt mijn pagina</button></p>';
  else h+='<button type="button" class="hoofd" data-a="zet">📌 Deze pagina wordt mijn pagina</button>';
  if(m){h+='<label><input type="checkbox" data-a="auto"'+(m.auto!==false?' checked':'')+'> Bij het openen van de site meteen naar mijn pagina gaan</label>';
    h+='<p class="twl" style="margin-top:8px"><button type="button" data-a="wis" style="all:unset;cursor:pointer;text-decoration:underline">Geen pagina meer kiezen</button></p>'}
  if(/^https?:$/.test(location.protocol)&&!isApp()){var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    h+=twApp?'<p class="twl" style="margin-top:10px"><button type="button" data-a="app" style="all:unset;cursor:pointer;text-decoration:underline">📱 Installeren als app</button></p>':ios?'<p class="twl" style="margin-top:10px">📱 Als app: tik in Safari op <b>Delen</b> (vierkantje met pijl) en kies <b>Zet op beginscherm</b>.</p>':'<p class="twl" style="margin-top:10px">📱 Als app: kies in het menu van je browser <b>Toevoegen aan startscherm</b> of <b>App installeren</b>.</p>'}
  h+='<p class="twl" style="margin-top:10px;border-top:1px solid rgba(128,128,128,.3);padding-top:8px"><button type="button" data-a="mee" style="all:unset;cursor:pointer;text-decoration:underline">📲 Naar ander toestel (gsm, tablet, laptop)</button></p>';
  var su=startUrl();h+='<div class="ft">'+(su?'<a href="'+su+'">Startpagina</a>':'<span></span>')+'<button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Sluiten</button></div>';
  menu.innerHTML=h}
/* ---------- naar een ander toestel: mijn pagina, de indeling van de spelerspagina en de notities in een link / QR-code (niets gaat naar een server) ---------- */
var MEE=['tw-mijn','tw-indeling',NK];
function b64u(u8){var s='';for(var i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function ub64(t){var s=atob(t.replace(/-/g,'+').replace(/_/g,'/'));var u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
function meePak(){var o={};MEE.forEach(function(k){try{var v=localStorage.getItem(k);if(v!=null&&v!=='')o[k]=v}catch(e){}});
  var raw=new TextEncoder().encode(JSON.stringify(o));
  if(window.CompressionStream){return new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer().then(function(b){return 'z'+b64u(new Uint8Array(b))})}
  return Promise.resolve('j'+b64u(raw))}
function meeUit(t){return Promise.resolve().then(function(){return meeUit2(t)})}
function meeUit2(t){var u=ub64(t.slice(1));
  if(t[0]==='z')return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text().then(JSON.parse);
  return Promise.resolve(JSON.parse(new TextDecoder().decode(u)))}
function meeBasis(){var su=startUrl();return su?new URL(su.replace(/#.*$/,''),location.href).href:location.href.replace(/#.*$/,'')}
function tekenMee(){var m=mijn(),n='';try{n=localStorage.getItem(NK)||''}catch(e){}
  pan.innerHTML='<h2>Naar ander toestel</h2><p>Neem <b>mijn pagina</b>'+(m?' ('+esc(m.t)+')':'')+', je <b>indeling</b> van de spelerspagina en je <b>notities</b>'+(n?' ('+n.length+' tekens)':'')+' mee naar je gsm, tablet of laptop. Scan de code met de camera van het andere toestel, of stuur jezelf de link. Er gaat niets naar een server: alles zit in de code zelf. Het is een kopie: pas je later iets aan, doe het dan opnieuw.</p><div class="twqr" aria-live="polite">bezig…</div><div class="twk"></div><div class="ft"><span></span><button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Sluiten</button></div>';
  meePak().then(function(p){var url=meeBasis()+'#tw='+p;pan.dataset.url=url;var q=pan.querySelector('.twqr'),k=pan.querySelector('.twk');if(!q)return;
    k.innerHTML='<button type="button" data-a="mee-kop">Link kopiëren</button>'+(navigator.share?'<button type="button" data-a="mee-deel">Delen…</button>':'')+'<a href="mailto:?subject='+encodeURIComponent('Torrewachters: mijn instellingen')+'&body='+encodeURIComponent('Open deze link op je andere toestel:\n'+url)+'">Mailen</a>';
    if(url.length>2200){q.innerHTML='<p class="twl">Je notities zijn te lang voor een QR-code. Gebruik <i>Link kopiëren</i>, <i>Delen</i> of <i>Mailen</i> en open de link op je andere toestel.</p>';return}
    if(!/^https?:$/.test(location.protocol)){q.innerHTML='<p class="twl">De QR-code werkt alleen op de website zelf (niet lokaal op je pc).</p>';return}
    var maak=function(){try{var c=qrcode(0,'L');c.addData(url);c.make();q.innerHTML=c.createSvgTag({cellSize:3,margin:2,scalable:true})}catch(e){q.innerHTML='<p class="twl">Geen QR-code mogelijk; gebruik de link.</p>'}};
    if(window.qrcode)maak();else{var sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';sc.onload=maak;sc.onerror=function(){q.innerHTML='<p class="twl">De QR-code kon niet geladen worden; gebruik de link.</p>'};document.head.appendChild(sc)}})}
function meeKopie(b){var t=pan.dataset.url||'',ok=function(){var o=b.textContent;b.textContent='gekopieerd ✓';setTimeout(function(){b.textContent=o},2000)};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,function(){prompt('Kopieer deze link:',t)});else prompt('Kopieer deze link:',t)}
/* ontvangen: #tw=... in het adres */
function meeOntvang(){if(!meeH)return;var t=location.hash.slice(4);try{history.replaceState(null,'',location.href.replace(/#.*$/,''))}catch(e){}
  meeUit(t).then(function(o){if(!o||typeof o!=='object')throw 0;var m=null;try{m=JSON.parse(o['tw-mijn']||'null')}catch(e){}
    pan.dataset.k='mee-in';pan._mee=o;pan.hidden=false;
    pan.innerHTML='<h2>Instellingen overnemen?</h2><p>Van je andere toestel:</p><ul style="margin:0 0 8px;padding-left:20px">'+(m?'<li>mijn pagina: <b>'+esc(m.t||'')+'</b></li>':'')+(o['tw-indeling']?'<li>je indeling van de spelerspagina</li>':'')+(o[NK]?'<li>je notities ('+o[NK].length+' tekens)'+((function(){try{return localStorage.getItem(NK)}catch(e){return ''}})()?' — <b>die vervangen de notities op dit toestel</b>':'')+'</li>':'')+'</ul><button type="button" class="hoofd" data-a="mee-neem">Overnemen</button><div class="ft"><span></span><button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Niet overnemen</button></div>';teken()})
  .catch(function(){pan.hidden=false;pan.dataset.k='mee-in';pan.innerHTML='<h2>Instellingen overnemen</h2><p>Deze link is onvolledig of beschadigd. Maak op je andere toestel een nieuwe (📌 → Naar ander toestel).</p><div class="ft"><span></span><button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Sluiten</button></div>'})}
function meeNeem(){var o=pan._mee||{};MEE.forEach(function(k){try{if(o[k]!=null)localStorage.setItem(k,o[k])}catch(e){}});var m=mijn();
  pan.innerHTML='<h2>Overgenomen ✓</h2><p>'+(m?'De site opent voortaan op <b>'+esc(m.t)+'</b>.':'Je instellingen staan nu ook op dit toestel.')+'</p>'+(m?'<a class="hoofd" href="'+esc(m.u)+'" style="text-decoration:none">Naar mijn pagina</a>':'')+'<div class="ft"><span></span><button type="button" data-a="sluit" style="all:unset;cursor:pointer;color:inherit">Sluiten</button></div>';teken()}
function startUrl(){/* online: de startpagina staat in de hoofdmap, club/ en elo/ eronder; lokaal is er geen */
  if(!/^https?:$/.test(location.protocol))return '';return (isStart||!/\/(club|elo)\/[^\/]*$/.test(location.pathname)?'index.html':'../index.html')+'#start'}
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.twv button[data-a],.twm button[data-a]');
  if(!b){if((!menu.hidden||!pan.hidden)&&!e.target.closest('.twm,.twv')){menu.hidden=true;pan.hidden=true;teken()}return}
  var a=b.getAttribute('data-a');
  if(a==='notes'||a==='med'){var open=pan.hidden||pan.dataset.k!==a;menu.hidden=true;pan.hidden=!open;if(open){pan.dataset.k=a;if(a==='notes')tekenNotes();else tekenMed()}teken();if(open){var f2=pan.querySelector('textarea,button,a');if(f2)f2.focus()}return}
  if(/^n-/.test(a)){notesActie(a,b);return}
  if(a==='menu'){menu.hidden=!menu.hidden;pan.hidden=true;teken();if(!menu.hidden){var f=menu.querySelector('button,a');if(f)f.focus()}}
  else if(a==='sluit'){menu.hidden=true;pan.hidden=true;teken()}
  else if(a==='app'){if(twApp){twApp.prompt();twApp.userChoice.then(function(){twApp=null;menu.hidden=true;teken()}).catch(function(){})}}
  else if(a==='mee'){menu.hidden=true;pan.hidden=false;pan.dataset.k='mee';tekenMee();teken()}
  else if(a==='mee-neem'){meeNeem()}
  else if(a==='mee-kop'){meeKopie(b)}
  else if(a==='mee-deel'){try{navigator.share({title:'Torrewachters: mijn instellingen',url:pan.dataset.url}).catch(function(){})}catch(e){}}
  else if(a==='zet'){var m=mijn();zetMijn({u:hier(),t:titel(),auto:m?m.auto!==false:true});menu.hidden=true;teken()}
  else if(a==='wis'){zetMijn(null);try{localStorage.removeItem(KEY)}catch(e){}teken()}});
document.addEventListener('change',function(e){var t=e.target;if(t.matches&&t.matches('.twm [data-a="auto"]')){var m=mijn();if(m){m.auto=t.checked;zetMijn(m)}}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&(!menu.hidden||!pan.hidden)){menu.hidden=true;pan.hidden=true;teken()}});
/* staat de bezoeker op zijn pagina, dan de titel ervan bijwerken (bv. de naam van de speler) */
function bij(){var m=mijn();if(m&&norm(m.u)===norm(hier())){var t=titel();if(t&&t!==m.t){m.t=t;zetMijn(m)}}teken()}
window.addEventListener('hashchange',function(){setTimeout(bij,50)});
window.addEventListener('storage',function(e){if(e.key===MK)teken()});
teken();setTimeout(bij,800);meeOntvang();
})();
