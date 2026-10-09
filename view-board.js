/*! Copyright 2026 David Borske. All rights reserved. */
import{matchCoach as st}from"./coach-topics.js";const Ft=["commission_breath","listening","pushy","lost_confidence","decision_maker_away","rejection_streak"],D=t=>!!(t&&Ft.includes(t.id));import{tipHtml as Ht}from"./guide.js";const nt="dpc";import{matchObjection as Bt,FELT_NOTE as Nt}from"./objections.js";import{readControl as it,subjectLabel as rt,logRead as Pt,fixation as Dt}from"./control.js";import{RECHECK_AFTER_D as at,sinceFocus as Rt,isObjection as ct,isDetail as lt,recordSearch as Wt,coachFor as R,extraKeywords as _t,suggestColumn as qt,numbersRead as Mt,ensureSC as Gt,recordCheck as dt,missCounts as ut,todayStatus as Kt,getFocus as pt,setFocus as Ut,clearFocus as ht,todayD as ft,recheckDue as Yt}from"./selfcheck.js";const w=["d","p","c","a"],z={d:"Made contact",p:"Presentation",c:"Close",a:"Accounts"},J={d:["PACE","Work ethic. What you do, when you do it, and how you do it. Move with a sense of urgency, because when you respect your time they assume you will respect theirs."],p:["PITCH","What you say, when you say it, and how you say it."],c:["ATTITUDE (FOCUS)","Focus on what you can control, the items on this board, not on whether they say yes or no. Nobody is a mind reader or a fortune teller."]};function bt(){return{placeholder:!1,title:"Game board",source:"Owner's chart, transcribed 2026-09-18",grade:{note:"Grade scale pending confirmation.",scale:[]},columns:{d:{key:"d",title:"Made contact",theme:"PACE",purpose:"You got a conversation. Every one counts.",items:[{id:"d2",text:"Talk to Everyone, Knock Every Door (Law of Averages)",why:"",keywords:[]},{id:"d3",text:"S.E.E. Factors",why:"",keywords:[]},{id:"d4",text:"Smile, Eye Contact, Enthusiasm",why:"",keywords:[]},{id:"d5",text:"Step Back Two or Three Steps After You Knock",why:"Back off the door after you knock. It takes the pressure off whoever is inside, it puts you in their full view instead of on top of them, and it gives you the two seconds to reset your face before it opens.",keywords:["step","steps","back","backup","back up","porch","doorstep","crowding","space"]},{id:"d6",text:"Sense of Urgency",why:"",keywords:[]}]},p:{key:"p",title:"Presentation",theme:"PITCH",purpose:"Getting through the presentation counts as a presentation.",items:[{id:"p1",text:"KISS vs KILL",why:"",keywords:[]},{id:"p2",text:"Keep it Stupid Simple vs Keep it long and lengthy",why:"",keywords:[]},{id:"p3",text:"Follow Structure",why:"",keywords:[]},{id:"p4",text:"S.E.E. Factors",why:"",keywords:[]},{id:"p5",text:"Tone, Inflection, Conviction, Enthusiasm",why:"",keywords:[]},{id:"p6",text:"60/40 (Business/Personal) Control conversation and build rapport",why:"",keywords:[]},{id:"p7",text:"Gather and discover (Internet provider, use it for, decision maker, needs & wants, etc.)",why:"",keywords:[]}]},c:{key:"c",title:"Close",theme:"ATTITUDE (FOCUS)",purpose:"Asking for the business counts as a close. It is an attempted close, not a sale.",items:[{id:"c1",text:"Feel, Felt, Found",why:"",keywords:[]},{id:"c2",text:"A.I.R.",why:"The closing loop. Agree, Acknowledge or Address, whichever the moment calls for, and if it needs addressing, use Feel, Felt, Found. Then Immediately Return to right where you left off",keywords:["air","agree","address","acknowledge","ignore","return","loop","closing"]},{id:"c3",text:"Agree, Acknowledge or Address (FFF), Immediately Return",why:"",keywords:[]},{id:"c4",text:"Assume The Sale",why:"",keywords:[]},{id:"c5",text:"Confidence",why:"",keywords:[]},{id:"c6",text:"Ask for Business",why:"",keywords:[]},{id:"c7",text:"Close 2x to 3x (Conviction, Break Eye Contact)",why:"",keywords:[]},{id:"c8",text:"Indifference (hesitation? Take it away)",why:"",keywords:[]}]},a:{key:"a",title:"Accounts",theme:"",purpose:"Work after the sale. Nothing here is tallied against D, P or C.",items:[{id:"a1",text:"Track Installs",why:"",keywords:[]},{id:"a2",text:"Courtesy Follow ups",why:"",keywords:[]},{id:"a3",text:"Customer Wrap up (quiz customer to confirm comprehension)",why:"",keywords:[]},{id:"a4",text:"Submit tickets. Customer issues: toptiersolutionselite@gmail.com. App issues: borske369@gmail.com",why:"",keywords:[]}]}}}}function zt(t,e){const s=Object.assign({},t||{});return s.board=Jt(e),s}function V(t){const e=t&&t.board;return e&&e.columns&&w.every(s=>e.columns[s]&&Array.isArray(e.columns[s].items))?(w.forEach(s=>e.columns[s].items.forEach(n=>{n&&/retention@/i.test(String(n.text||""))&&(n.text="Submit tickets. Customer issues: toptiersolutionselite@gmail.com. App issues: borske369@gmail.com")})),e):bt()}function mt(t){const e=V(t);return!e.placeholder&&w.some(s=>e.columns[s].items.length>0)}function Jt(t){const e={placeholder:!!(t&&t.placeholder),title:t&&t.title||"Game board",columns:{}};return w.forEach(s=>{const n=t&&t.columns&&t.columns[s]||{},a=Array.isArray(n.items)?n.items:[];e.columns[s]={key:s,title:n.title||z[s],purpose:n.purpose||"",items:a.map((o,r)=>({id:o&&o.id||`${s}${r+1}`,text:String((o&&o.text)!=null?o.text:""),why:String((o&&o.why)!=null?o.why:""),keywords:Array.isArray(o&&o.keywords)?o.keywords.map(String):[]})).filter(o=>o.text.trim())}}),e}const Vt={a:/^(?:a|accounts?)$/i,d:/^(?:d|doors?|door\s*knock(?:s|ing)?|knock(?:s|ing)?)$/i,p:/^(?:p|presentations?|presents?|presenting|pitch(?:es)?)$/i,c:/^(?:c|close|closes|closing|closer|asks?|asking)$/i},Qt=/^(?:column|col|columns|stage|step|the|actions?|items?|list|board|\d+)$/i;function W(t){let e=String(t??"").trim();if(!e||(e=e.replace(/^#+\s*/,"").replace(/^\*+|\*+$/g,"").replace(/^_+|_+$/g,"").trim(),!e||e.length>60))return null;const s=e.split(/[\s:|,;/()\[\]\-–—.]+/).filter(Boolean);if(!s.length||s.length>5)return null;let n=null;for(const a of s){let o=null;for(const r of w)if(Vt[r].test(a)){o=r;break}if(o){if(n&&n!==o)return null;n=o}else if(!Qt.test(a))return null}return n}function yt(t,e){let s=String(t??"").trim().replace(/^#+\s*/,"").replace(/^\*+|\*+$/g,"").replace(/^_+|_+$/g,"").trim();const n=s.match(/^[dpc]\s*[:|,;/\-–—.)(]+\s*(.+)$/i);return n&&(s=n[1].trim()),s=s.replace(/[)(\[\]]/g,"").replace(/^[\s:|,;/\-–—.]+|[\s:|,;/\-–—.]+$/g,"").trim(),!s||/^[dpc]$/i.test(s)?z[e]:s}function Zt(t){return/^\s*(?:why|reason|reasons|because|control|coaching|note|notes)\b/i.test(String(t||""))}function gt(t){const e=[];let s="",n=!1;for(let a=0;a<t.length;a++){const o=t[a];o==='"'?n&&t[a+1]==='"'?(s+='"',a++):n=!n:o===","&&!n?(e.push(s.trim()),s=""):s+=o}return e.push(s.trim()),e}function Xt(t){return t.split("	").map(e=>e.trim())}function te(t){let e=t.trim();return e.startsWith("|")&&(e=e.slice(1)),e.endsWith("|")&&(e=e.slice(0,-1)),e.split("|").map(s=>s.trim())}function vt(t){return/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(t)}function Q(t){return String(t).replace(/^\s*(?:[-*•▪◦►·]|\d{1,3}[.)]|[a-zA-Z][.)])\s+/,"")}function wt(){const t={placeholder:!1,title:"Game board",columns:{}};return w.forEach(e=>{t.columns[e]={key:e,title:z[e],purpose:"",items:[]}}),t}function ee(t){const e=t.length,s=t.filter(o=>/^\s*\|.*\|\s*$/.test(o)||vt(o)).length;if(s>=2&&s>=e*.6)return"markdown";const n=t.filter(o=>o.includes("	")).length;if(n>=1&&n>=e*.5)return"tsv";const a=t.filter(o=>gt(o).length>=2).length;return a>=2&&a>=e*.6?"csv":"list"}function oe(t){const e=[],s=wt();try{const a=String(t??"").replace(/\r\n?/g,`
`).split(`
`).filter(h=>h.trim());if(!a.length)return{ok:!1,board:s,warnings:["Nothing to read. Paste the chart first."]};const o=ee(a);let r=!1;if(o==="markdown"||o==="tsv"||o==="csv"){const h=o==="markdown"?te:o==="tsv"?Xt:gt,u=a.filter(d=>!(o==="markdown"&&vt(d))).map(h);r=se(u,s,e,o),r||e.push(`Read this as ${o==="csv"?"CSV":o==="tsv"?"a spreadsheet paste":"a markdown table"} but could not find two or more D, P, C headers in the first rows. Trying it as a headed list instead.`)}r||(r=ne(a,s,e));const i=w.map(h=>s.columns[h].items.length);return i.reduce((h,u)=>h+u,0)?(w.forEach((h,u)=>{if(!i[u]&&h==="a"){s.columns.a=JSON.parse(JSON.stringify(bt().columns.a));return}i[u]||e.push(`${h.toUpperCase()} (${s.columns[h].title}) came through with no items.`)}),w.forEach(h=>{s.columns[h].items=s.columns[h].items.map((u,d)=>({id:`${h}${d+1}`,text:u.text,why:u.why||"",keywords:[]}))}),{ok:!0,board:s,warnings:e}):(e.push("No items found. Each column needs a header like D, P, C or Made contact, Presentation, Close, with one action per line or per cell under it."),{ok:!1,board:s,warnings:e})}catch{return e.push("The chart could not be read. Nothing was changed."),{ok:!1,board:wt(),warnings:e}}}function se(t,e,s,n){let a=-1,o=null;for(let i=0;i<Math.min(t.length,5);i++){const c=t[i].map(W);if(new Set(c.filter(Boolean)).size>=2){a=i,o=c;break}}if(o){const i=t[a],c={},h={};o.forEach((d,f)=>{d&&(h[d]&&s.push(`Two headers point at ${d.toUpperCase()}. Both were merged into that column.`),h[d]=!0,e.columns[d].title=yt(i[f],d),!o[f+1]&&Zt(i[f+1])&&(c[f]=f+1))});const u=i.filter((d,f)=>d&&!o[f]&&!Object.values(c).includes(f));u.length&&s.push(`Ignored columns: ${u.join(", ")}.`);for(let d=a+1;d<t.length;d++){const f=t[d];o.forEach((k,C)=>{if(!k)return;const g=f[C];if(g==null||!String(g).trim())return;const x=n==="markdown"?String(g):Q(g),F=c[C]!=null&&f[c[C]]?String(f[c[C]]):"";e.columns[k].items.push({text:x,why:F})})}return!0}const r=t.filter(i=>i.length>=2&&W(i[0])&&String(i[1]||"").trim());return r.length>=2&&r.length>=t.length*.5?(t.forEach(i=>{const c=W(i[0]);if(!c)return;const h=String(i[1]||"").trim();h&&e.columns[c].items.push({text:Q(h),why:i[2]?String(i[2]):""})}),!0):!1}function ne(t,e,s){let n=null,a=!1;const o=[];for(const r of t){const i=r.trim(),c=Q(i);let u=c!==i?null:W(i);if(u&&u===n&&!/^#/.test(i)&&!/:$/.test(i)&&(u=null),u&&i.length<=60){n=u,a=!0,e.columns[u].title=yt(i,u);continue}if(!n){o.push(i);continue}e.columns[n].items.push({text:c,why:""})}return o.length&&s.push(`${o.length} line${o.length===1?"":"s"} before the first column header ${o.length===1?"was":"were"} skipped: ${o.slice(0,2).join(" / ")}${o.length>2?" ...":""}`),a?!0:(s.push("No column headers found. Add a line with D, P or C (or Made contact, Presentation, Close) above each group of actions."),!1)}const ie=new Set("a an the and or but if of to in on at for with by from as is am are was were be been being i me my mine we our you your he she it its they their this that these those there here so too very just really about into out up down off over under again then than also not no yes do does did doing have has had having will would can could should shall may might must get got getting go going gonna want wanted keep keeps im ive dont cant wont didnt isnt arent thats whats what how when where why who which because feel feeling think thinking today right now still even like need needs felt door doors house houses more".split(/\s+/));function _(t){return String(t||"").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(e=>e&&!ie.has(e)).map(re)}function re(t){return t.length<=3?t:t.replace(/ies$/,"y").replace(/(ing|ers?|ed|es|ly|s)$/,"")}function kt(t,e){const s={input:String(e||"").trim(),loaded:!1,inBounds:!1,item:null,column:null,score:0,nearest:null},n=w.some(r=>t.columns[r].items.length);s.loaded=!t.placeholder&&n;const a=_(e);if(!s.loaded||!a.length)return s;let o=null;return w.forEach(r=>{t.columns[r].items.forEach(i=>{const c=new Set(_(i.text)),h=new Set(_(i.why).concat(_((i.keywords||[]).concat(_t(i)).join(" "))));let u=0;a.forEach(d=>{c.has(d)?u+=2:h.has(d)&&(u+=1)}),u>0&&(!o||u>o.score)&&(o={item:i,column:r,score:u})})}),o&&o.score>=2?(s.inBounds=!0,s.item=o.item,s.column=o.column,s.score=o.score):o&&(s.nearest=o.item,s.column=o.column),s}function $t(t,e){for(const s of w){const n=t.columns[s].items.find(a=>a.id===e);if(n)return n}return null}function xt(t){const e=t instanceof Date?t:new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function ae(t,e){const s=V(t),n=e||xt(),a=t&&t.boardWork&&t.boardWork[n]||{},o=t&&t.oobLog&&t.oobLog[n]||[],r={};return w.forEach(i=>{const c=s.columns[i].items,h=c.filter(u=>a[u.id]).map(u=>u.id);r[i]={title:s.columns[i].title,total:c.length,worked:h.length,workedIds:h}}),{date:n,placeholder:!!s.placeholder,loaded:mt(t),columns:r,workedTotal:w.reduce((i,c)=>i+r[c].worked,0),itemTotal:w.reduce((i,c)=>i+r[c].total,0),outOfBounds:o.map(i=>({text:i.text,nearestId:i.nearestId||null,nearestText:i.nearestId&&($t(s,i.nearestId)||{}).text||"",at:i.at})),outOfBoundsCount:o.length}}const l={pasteOpen:!1,pasteText:"",pending:null,preview:null,verdictInput:"",sc:null,filter:"all"};let St=null;const ce=["board","boardWork","oobLog","control","selfcheck"];function p(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function le(t,e){return typeof t=="function"?(t(e),!1):t&&typeof t.commit=="function"?(t.commit(s=>{ce.forEach(n=>{n in e?s[n]=e[n]:delete s[n]})}),!0):t&&typeof t.setState=="function"?(t.setState(e),!1):t&&typeof t.update=="function"?(t.update(e),!1):(St=e,!1)}function de(t){if(t&&typeof t.today=="function")try{const e=t.today();if(e)return e}catch{}return xt()}function q(t,e,s,n){const a=Object.assign({},t);a.boardWork=Object.assign({},t.boardWork||{});const o=Object.assign({},a.boardWork[e]||{});return n?o[s]=!0:delete o[s],a.boardWork[e]=o,a}function A(t,e,s,n){if(!t)return;(n||{}).paste&&(l.pasteOpen=!0);const o=e||St||{},r=V(o),i=mt(o),c=de(s),h=o.boardWork&&o.boardWork[c]||{},u=o.oobLog&&o.oobLog[c]||[],d=ae(o,c),f=b=>{le(s,b)||A(t,b,s)},k=o.activeRep||null,C=Kt(o,k),g=ut(o,k),x=b=>l.filter==="done"?!!h[b]||C[b]==="yes":l.filter==="notyet"?C[b]==="no"&&!h[b]:l.filter==="repeat"?(g[b]||0)>=2:!0;let F=0;const T=w.map(b=>{const y=r.columns[b];let m=null;const E=y.items.filter(v=>x(v.id)).map(v=>{F++;const I=!!h[v.id],O=(C[v.id]==="no"&&!I?'<span class="sc-badge no">Not yet today</span>':"")+((g[v.id]||0)>=2?`<span class="sc-badge rep">Not yet ${g[v.id]} times in 7 days</span>`:"");let j="";return(v.group||null)!==m&&(m=v.group||null,m&&(j=`<p class="board-group">${p(m)}</p>`)),j+`
        <button type="button" class="board-item${I?" worked":""}${r.placeholder?" stub":""}"
                data-item="${p(v.id)}" aria-pressed="${I?"true":"false"}">
          <span class="board-item-check" aria-hidden="true">${I?"✓":""}</span>
          <span class="board-item-body">
            <span class="board-item-text">${p(v.text)}</span>
            ${v.why?`<span class="board-item-why">${p(v.why)}</span>`:""}
            ${O?`<span class="sc-badges">${O}</span>`:""}
          </span>
        </button>`}).join("");return`
      <section class="board-col board-col-${b}" data-col="${b}">
        <header class="board-col-head">
          <div class="board-col-letter">${b.toUpperCase()}</div>
          <div class="board-col-titles">
            <h3 class="board-col-title">${p(/^doors?$/i.test(y.title)?"Made contact":y.title)}</h3>
            ${y.purpose?`<p class="board-col-purpose">${p(/counts as a door/i.test(y.purpose)?"You got a conversation. Every one counts.":y.purpose)}</p>`:""}
          </div>
          <div class="board-col-count" aria-label="${d.columns[b].worked} of ${d.columns[b].total} worked">
            <strong>${d.columns[b].worked}</strong><span> of ${d.columns[b].total} done today</span>
          </div>
        </header>
        ${J[b]?`<div class="board-theme-box"><p class="board-theme">${p(J[b][0])}</p><p class="board-theme-why">${p(J[b][1])}</p></div>`:""}
        <div class="board-items">${E||`<p class="board-empty">${l.filter==="all"?"No items in this column.":"Nothing here for this filter."}</p>`}</div>
      </section>`}).join(""),G=u.length?`<ul class="oob-log-list">${u.slice().reverse().map(b=>{const y=b.nearestId?$t(r,b.nearestId):null;return`<li class="oob-log-item">
          <span class="oob-log-text">${p(b.text)}</span>
          ${y?`<span class="oob-log-near">Nearest board item: ${p(y.text)}</span>`:""}
        </li>`}).join("")}</ul>`:'<p class="oob-log-empty">Nothing logged out of bounds today.</p>',It=`
    <section class="board-waiting" role="note">
      <h2 class="board-waiting-title">The game board is waiting on your chart.</h2>
      <p class="board-waiting-body">The columns are ready. Paste the chart and it fills in. The items shown below are stubs so you can see the shape, nothing more.</p>
      <button type="button" class="board-paste-open btn-primary">Paste the chart</button>
    </section>`,$=l.verdictInput?kt(r,l.verdictInput):null,N=l.verdictInput?it(l.verdictInput):null,L=l.verdictInput?st(l.verdictInput,nt):null,K=!!(l.unclear&&l.verdictInput),H=!!(L&&L.safety),P=!H&&!!(l.verdictInput&&ct(l.verdictInput)),U=!H&&!P&&!D(L)&&!!(N&&N.verdict==="nocontrol"&&N.confidence>=.55),Z=!H&&!P&&!U&&!!L&&!!$&&$.loaded&&(D(L)||!$.inBounds||$.score<=2),Ot=$?` show ${K?"out":H?"safety":Z?"coach":U?"nocontrol":$.loaded?$.inBounds||P?"in":"out":"unloaded"}`:"",jt=`
    <section class="oob" aria-labelledby="oob-title">
      ${ue(o)}
      ${i?ke(o,k):""}
${o.cloud&&o.cloud.role==="manager"?'<h2 id="oob-title" class="oob-title">The help box is for reps</h2><p class="oob-sub">When a rep keeps hitting the same problem, they type it here and the board coaches them. What they type shows on your Team tab.</p>':`      ${Ht("rep-board","Same problem keeps happening? Type it below and tap Check the board.")}
      <h2 id="oob-title" class="oob-title">What is on your mind right now?</h2>
      <p class="oob-sub">${i?"Type it. The board will tell you if it is on the board or out of bounds.":"Type it. Once the chart is loaded the board will tell you if it is in bounds."}</p>
      <form class="oob-form" autocomplete="off">
        <label class="visually-hidden" for="oob-input">What is on your mind</label>
        <input id="oob-input" class="oob-input" data-oob="input" type="text" inputmode="text" enterkeyhint="go" maxlength="200" />
        <button type="submit" class="oob-check btn-primary">Check the board</button>
      </form>
      <div class="oob-verdict${Ot}" aria-live="polite">${K?'<div class="oob-verdict-head">Say it another way</div><div class="oob-verdict-body"><p class="oob-verdict-line">The board did not catch that. Try plain words, like "I keep blanking on my pitch" or "they keep saying it costs too much".</p></div><div class="oob-verdict-actions"><button type="button" class="oob-dismiss btn-secondary">Got it</button></div>':$?H?fe(L):Z?he(L,r):U?pe(N):P&&$.loaded?we(l.verdictInput):be($,r):""}</div>
      ${i&&!H&&!K?$e(r,o,k):""}`}
      <details class="oob-log"${u.length?"":" hidden"}${u.length&&$&&!$.inBounds?" open":""}>
        <summary class="oob-log-summary">Not on the board today: <strong>${u.length}</strong></summary>
        ${G}
      </details>
    </section>`;t.innerHTML=`
    <div class="board${i?"":" board-unloaded"}">
      ${i?"":It}
      ${l.pasteOpen?me(l.pasteText):""}
      ${jt}
      
      <div class="board-cols">${T}</div>
      ${i?`
      <div class="board-footer">
        <button type="button" class="board-paste-open btn-secondary">Replace the chart</button>
      </div>`:""}
    </div>`,t.querySelectorAll(".board-item").forEach(b=>{b.addEventListener("click",()=>{const y=b.getAttribute("data-item");f(q(o,c,y,!h[y]))})}),t.querySelectorAll(".board-paste-open").forEach(b=>{b.addEventListener("click",()=>{l.pasteOpen=!0,A(t,o,s);const y=t.querySelector(".paste-text");y&&y.focus()})}),ye(t,o,s,f);const X=t.querySelector(".oob-form"),At=t.querySelector(".oob-input");X&&X.addEventListener("submit",b=>{b.preventDefault();const y=At.value.trim();if(!y)return;const m=kt(r,y);l.verdictInput=y;const E=st(y,nt),v=!!(E&&E.safety),I=it(y),O=!v&&ct(y),j=!v&&!O&&!D(E)&&I.verdict==="nocontrol"&&I.confidence>=.55,Y=!v&&!O&&!j&&!!E&&m.loaded&&(D(E)||!m.inBounds||m.score<=2);if(l.sc=null,m.loaded&&!m.inBounds&&!m.nearest&&!E&&!O&&!j){l.unclear=!0,A(t,o,s);return}if(l.unclear=!1,m.loaded&&!v){const S=Y?Ct(r,E):null;S?(Et(r,o,y,Object.assign({},m,{inBounds:!0,item:S.item,nearest:S.item,column:S.col}),null,!1),l.sc&&(l.sc.kind="coach")):Et(r,o,y,m,j?I:null,O)}const Lt=v?"safety":j?"nocontrol":O?"objection":m.loaded?Y?"coach":m.inBounds?"in":"out":"",B=m.loaded?M(o):o;if(m.loaded&&Wt(B,{rep:o.activeRep||null,day:c,text:y.slice(0,160),result:Lt,col:l.sc?l.sc.col:"",item:m.inBounds&&m.item?m.item.id:m.nearest?m.nearest.id:""}),(O||v||Y)&&m.loaded){f(B);return}if(j){const S=Object.assign({},B);S.control=Object.assign({},o.control||{}),S.control.log=(o.control&&o.control.log||[]).slice(),Pt({control:S.control},o.activeRep||null,I,c),f(S);return}if(m.loaded&&!m.inBounds){const S=Object.assign({},B);S.oobLog=Object.assign({},o.oobLog||{});const ot=(S.oobLog[c]||[]).slice();ot.push({text:y,nearestId:m.nearest?m.nearest.id:null,at:new Date().toISOString()}),S.oobLog[c]=ot,f(S);return}if(m.loaded){f(B);return}A(t,o,s)});const tt=t.querySelector(".oob-verdict .oob-mark");if(tt&&$){const b=$.inBounds?$.item.id:$.nearest?$.nearest.id:null;tt.addEventListener("click",()=>{l.verdictInput="",b?f(q(o,c,b,!0)):A(t,o,s)})}const et=t.querySelector(".oob-verdict .oob-dismiss");et&&et.addEventListener("click",()=>{l.verdictInput="",A(t,o,s)}),xe(t,o,s,f,r,c,k)}function ue(t){let e;try{e=Dt({control:t.control||{}},t.activeRep||null)}catch{return""}if(!e||!e.today)return"";const s=e.top,n=s?rt(s.subject):"Outside your control";return`
    <div class="ctl-fix${e.repeating?" ctl-fix-hot":""}" role="status">
      <span class="ctl-fix-n">${e.today}</span>
      <span class="ctl-fix-t">${t&&t.cloud&&t.cloud.role==="manager"?e.today===1?"thought outside their control today across your team":"thoughts outside their control today across your team":e.today===1?"thing outside your control today":"things outside your control today"}${s&&s.count>1?`. ${s.count} on one thing: ${p(n)}.`:"."}</span>
      ${e.repeating?'<span class="ctl-fix-flag">Same kind of thought, three times. That is the pattern, not the day.</span>':""}
    </div>`}function pe(t){let e=t;return/afford|money|broke|budget/i.test(String(t.input||l.verdictInput||""))&&(e=Object.assign({},t,{subject:"_afford",why:"You cannot see their bank account from the door, and judging it costs you the pitch.",redirect:"Gather and discover what they pay now and what they use it for. Then Feel, Felt, Found, and ask again."})),`
    <div class="oob-verdict-head ctl-head">${p(e.subject==="_afford"?"What they can afford is not yours to judge":rt(e.subject))}</div>
    <div class="oob-verdict-body">
      <p class="ctl-line">${p(e.why)}</p>
      
    <ol class="ctl-chain" aria-label="What this costs you">
      <li>Focus goes to something you cannot move</li>
      <li>Attitude drops</li>
      <li>Pace drops</li>
      <li>The door that does open gets the worst version of you</li>
    </ol>
      <p class="ctl-line">Attitude is focus. Are you in bounds or out of bounds? Get back to what is on the board: your pace, your pitch and your next contact.</p>
      <p class="ctl-redirect-l">Back on the board</p>
      <p class="ctl-redirect">${p(e.redirect)}</p>
    </div>
    <div class="oob-verdict-actions">
      <button type="button" class="oob-dismiss btn-secondary">Got it, back to work</button>
    </div>`}function Ct(t,e){const s=String(e.boardHint||"").toLowerCase();for(const o of w){const r=(t.columns[o]&&t.columns[o].items||[]).find(i=>String(i.text||"").toLowerCase()===s);if(r)return{item:r,col:o}}const n=e.boardCol&&t.columns[e.boardCol]?e.boardCol:null,a=n?(t.columns[n].items||[])[0]:null;return a?{item:a,col:n}:null}function he(t,e){const s=Ct(e,t);return`
    <div class="oob-verdict-head">Coaching</div>
    <div class="oob-verdict-body">
      <p class="oob-verdict-line coach-note">This is not on the board. Here is how to get back to it.</p>
      <p class="oob-verdict-line"><strong>${p(t.title)}.</strong> ${t.lines.map(p).join(" ")}</p>
      ${s?`<p class="oob-verdict-line">Back on the board:</p>
      <span class="oob-verdict-col">${p(e.columns[s.col].title)}</span>
      <span class="oob-verdict-item">${p(s.item.text)}</span>`:""}
    </div>
    <div class="oob-verdict-actions">
      <button type="button" class="oob-dismiss btn-secondary">Got it</button>
    </div>`}function fe(t){return`
    <div class="oob-verdict-head">Safety first</div>
    <div class="oob-verdict-body">
      <p class="oob-verdict-line"><strong>${p(t.title)}.</strong></p>
      ${t.lines.map(e=>`<p class="oob-verdict-line">${p(e)}</p>`).join("")}
    </div>
    <div class="oob-verdict-actions">
      <button type="button" class="oob-dismiss btn-secondary">Got it</button>
    </div>`}function be(t,e){if(!t.loaded)return`
      <div class="oob-verdict-head">The board has not been loaded yet.</div>
      <div class="oob-verdict-body">
        <p class="oob-verdict-line">Until the real chart is in, there is nothing to check this against. Paste the chart and try again.</p>
      </div>
      <div class="oob-verdict-actions">
        <button type="button" class="board-paste-open btn-secondary">Paste the chart</button>
        <button type="button" class="oob-dismiss btn-secondary">Hide</button>
      </div>`;if(t.inBounds)return`
      <div class="oob-verdict-head">On the board. That is in bounds.</div>
      <div class="oob-verdict-body">
        <span class="oob-verdict-col">${p(e.columns[t.column].title)}</span>
        <span class="oob-verdict-item">${p(t.item.text)}</span>
        ${(()=>{const n=t.item.why||R(t.item).how;return n?`<span class="oob-verdict-why">${p(n)}</span>`:""})()}
      </div>
      <div class="oob-verdict-actions">
        <button type="button" class="oob-mark btn-secondary">I did this</button>
        <button type="button" class="oob-dismiss btn-secondary">Hide</button>
      </div>`;const s=t.nearest;return`
    <div class="oob-verdict-head">Out of bounds.</div>
    <div class="oob-verdict-body">
      <p class="oob-verdict-line">That is not on the board, so it cannot score. Only board items put points up.</p>
      ${s?`
      <p class="oob-verdict-line">Nearest board item:</p>
      <span class="oob-verdict-col">${p(e.columns[t.column].title)}</span>
      <span class="oob-verdict-item">${p(s.text)}</span>
      ${s.why?`<span class="oob-verdict-why">${p(s.why)}</span>`:""}`:'<p class="oob-verdict-line">Pick the board item closest to it and work that.</p>'}
    </div>
    <div class="oob-verdict-actions">
      ${s?'<button type="button" class="oob-mark btn-secondary">Work that instead</button>':""}
      <button type="button" class="oob-dismiss btn-secondary">Hide</button>
    </div>`}function me(t){return`
    <section class="paste" aria-labelledby="paste-title">
      <div class="paste-head">
        <h2 id="paste-title" class="paste-title">Paste the chart</h2>
        <button type="button" class="paste-close btn-secondary" aria-label="Close">Close</button>
      </div>
      <p class="paste-help">Paste it straight from the spreadsheet, a CSV, a markdown table, or a plain list with a heading above each column. Headers can be D, P, C or Made contact, Presentation, Close. Your wording is kept exactly as written.</p>
      <textarea class="paste-text" data-oob="paste" rows="10" spellcheck="false">${p(t)}</textarea>
      <div class="paste-actions">
        <button type="button" class="paste-preview btn-primary">Preview</button>
      </div>
      <div class="paste-result">${l.preview?Tt(l.preview):""}</div>
    </section>`}function Tt(t){const{ok:e,board:s,warnings:n}=t,a=w.map(r=>{const i=s.columns[r];return`
      <div class="paste-col">
        <div class="paste-col-head">
          <span class="paste-col-letter">${r.toUpperCase()}</span>
          <span class="paste-col-title">${p(i.title)}</span>
          <span class="paste-col-count">${i.items.length} item${i.items.length===1?"":"s"}</span>
        </div>
        ${i.items.length?`<ol class="paste-col-items">${i.items.map(c=>`<li>${p(c.text)}${c.why?`<small>${p(c.why)}</small>`:""}</li>`).join("")}</ol>`:'<p class="paste-col-empty">Empty</p>'}
      </div>`}).join(""),o=w.reduce((r,i)=>r+s.columns[i].items.length,0);return`
    <div class="paste-preview-wrap">
      <h3 class="paste-preview-title">${e?`This is how it reads: ${o} item${o===1?"":"s"} on the board.`:"Could not read a board from that."}</h3>
      ${n.length?`<ul class="paste-warnings">${n.map(r=>`<li>${p(r)}</li>`).join("")}</ul>`:""}
      ${e?`<div class="paste-cols">${a}</div>`:""}
      ${e?`
      <div class="paste-confirm-actions">
        <button type="button" class="paste-confirm btn-primary">Use this board</button>
        <button type="button" class="paste-cancel btn-secondary">Go back and edit</button>
      </div>
      <p class="paste-confirm-note">Nothing changes until you confirm. Items worked today are kept by position in each column.</p>`:""}
    </div>`}function ye(t,e,s,n){const a=t.querySelector(".paste");if(!a)return;const o=a.querySelector(".paste-text"),r=a.querySelector(".paste-result");o.addEventListener("input",()=>{l.pasteText=o.value}),a.querySelector(".paste-close").addEventListener("click",()=>{l.pasteOpen=!1,l.pending=null,l.preview=null,A(t,e,s)});const i=()=>{const c=r.querySelector(".paste-confirm");c&&c.addEventListener("click",()=>{if(!l.pending)return;const u=zt(e,l.pending);l.pasteOpen=!1,l.pending=null,l.preview=null,l.pasteText="",l.verdictInput="",n(u)});const h=r.querySelector(".paste-cancel");h&&h.addEventListener("click",()=>{l.pending=null,l.preview=null,r.innerHTML="",o.focus()})};a.querySelector(".paste-preview").addEventListener("click",()=>{l.pasteText=o.value;const c=oe(o.value);l.pending=c.ok?c.board:null,l.preview=c,r.innerHTML=Tt(c),i(),typeof r.scrollIntoView=="function"&&r.scrollIntoView({behavior:"smooth",block:"start"})}),i()}const ge={d:"D (made contact)",p:"P (presentation)",c:"C (close, ask for business)"},je={d:"Contact",p:"Presentation",c:"Close"};function ve(t,e){return ge[e]||e.toUpperCase()}function we(t){const e=Bt(t);return`
    <div class="oob-verdict-head">That's an objection. It's in bounds, it's yours to handle.</div>
    <div class="oob-verdict-body">${e?`
      <p class="oob-verdict-line"><strong>${p(e.label)}.</strong> Next time you hear it, A.I.R. it out. Most of your answer is Feel and Felt, keep Found short, then return.</p>
      <p class="obj-step"><span class="obj-k">Feel</span> ${p(e.feel)}</p>
      <p class="obj-step"><span class="obj-k">Felt</span> ${p(e.felt)}</p>
      <p class="obj-note">${p(Nt)}</p>
      <p class="obj-step"><span class="obj-k">Found</span> ${p(e.found)}</p>
      <p class="obj-step"><span class="obj-k">Return</span> ${p(e.ret)}</p>`:`
      <p class="oob-verdict-line">They said it, but what happens next is on you. Next time you hear it, A.I.R. it out: Agree, Acknowledge or Address it with Feel, Felt, Found, then Immediately Return to where you left off and ask for the business again.</p>`}
    </div>
    <div class="oob-verdict-actions">
      <button type="button" class="oob-dismiss btn-secondary">Hide</button>
    </div>`}function Et(t,e,s,n,a,o){const r=e.activeRep||null,i=Mt(e,r);let c=qt({match:n,control:a,objection:o,text:s});!c&&i&&(c=i.col),c||(c="d");const h=t.columns[c].items,u=h.filter(g=>!lt(g)),d=ut(e,r);let f=n.inBounds&&n.item?n.item.id:n.nearest?n.nearest.id:null;const k=h.findIndex(g=>g.id===f);k>0&&lt(h[k])&&(f=h[k-1].id);const C=u.map((g,x)=>({id:g.id,n:x,w:(g.id===f?1e3:0)+(d[g.id]||0)*10})).sort((g,x)=>x.w-g.w||g.n-x.n).map(g=>g.id);l.sc={col:c,order:C,idx:0,answers:{},trigger:s,nrLine:i?i.line:"",kind:a?"nocontrol":o?"objection":n.inBounds?"in":"out",fix:null,clear:!1}}function Ae(){return`<div class="sc-filter" role="group" aria-label="Filter the board">${[["all","All"],["done","Done today"],["notyet","Not yet today"],["repeat","Keeps coming up"]].map(([e,s])=>`<button type="button" class="sc-chip${l.filter===e?" on":""}" data-sc-filter="${e}" aria-pressed="${l.filter===e}">${s}</button>`).join("")}</div>`}function ke(t,e){const s=pt(t,e);if(!s)return"";const n=Rt(t,e,s),a=Yt(t,e);return`
    <section class="sc-focus${a?" due":""}" aria-live="polite">
      <p class="sc-focus-l">Your focus right now</p>
      <p class="sc-focus-t">${p(s.text)}</p>
      ${s.how?`<p class="sc-focus-how">${p(s.how)}</p>`:""}
      ${a?`<p class="sc-focus-due">Did you run it on your last ${n} D?</p>
           <div class="sc-row"><button type="button" class="btn-primary" data-sc-fyes="1">Yes, I ran it</button>
           <button type="button" class="btn-secondary" data-sc-fno="1">Not yet</button></div>`:`<p class="sc-focus-meta">Check in after ${Math.max(0,at-n)} more D.</p>
`}
      <div class="sc-row"><button type="button" class="btn-secondary" data-sc-fclear="1">Pick a new focus</button></div>
    </section>`}function $e(t,e,s){const n=l.sc;if(!n)return"";const a=t.columns[n.col].items,o=i=>a.find(c=>c.id===i);if(n.fix){const i=o(n.fix);return`
      <section class="sc sc-fix" aria-live="polite">
        <p class="sc-l">Your fix</p>
        <p class="sc-fix-t">${p(i?i.text:"")}</p>
        <p class="sc-fix-how">${p(i?R(i).how:"")}</p>
        <p class="fine">Run it on your next ${at} D and the app will check back with you.</p>
        <div class="sc-row"><button type="button" class="btn-primary" data-sc-close="1">Got it</button></div>
      </section>`}if(n.clear)return`
      <section class="sc" aria-live="polite">
        <p class="sc-clear">You're doing everything in ${p(ve(t,n.col))}. Then it's just the numbers. Keep going.</p>
        <div class="sc-row"><button type="button" class="btn-primary" data-sc-close="1">Got it</button></div>
      </section>`;const r=o(n.order[n.idx]);return r?`
    <section class="sc" aria-live="polite">
      ${n.nrLine&&n.idx===0?`<p class="sc-nr">${p(n.nrLine)}</p>`:""}
      <p class="sc-l sc-l-q">Quick check on your last few conversations.</p>
      <p class="sc-q-t">${p(R(r).q)}</p>
      <div class="sc-row">
        <button type="button" class="sc-ans yes" data-sc-ans="yes">Yes</button>
        <button type="button" class="sc-ans no" data-sc-ans="no">Not yet</button>
      </div>
    </section>`:""}function M(t){const e=Object.assign({},t);return e.selfcheck=JSON.parse(JSON.stringify(t.selfcheck||{})),Gt(e),e}function xe(t,e,s,n,a,o,r){const i=(u,d)=>t.querySelectorAll(u).forEach(f=>f.addEventListener("click",()=>d(f))),c=()=>A(t,e,s);i("[data-sc-close]",()=>{l.sc=null,l.verdictInput="",c()}),i("[data-sc-ans]",u=>{const d=l.sc;if(!d)return;const f=d.order[d.idx],k=u.getAttribute("data-sc-ans")==="yes";if(d.answers[f]=k?"yes":"no",k&&d.idx+1<d.order.length){d.idx++,c();return}const C=Object.keys(d.answers).filter(T=>d.answers[T]==="yes"),g=k?[]:[f];let x=M(e);const F=k?null:a.columns[d.col].items.find(T=>T.id===f);if(dt(x,{rep:r,day:o,col:d.col,trigger:String(d.trigger||"").slice(0,160),kind:d.kind,confirmed:C,missing:g,fixText:F?String(F.text).slice(0,120):""}),C.forEach(T=>{x=q(x,o,T,!0)}),k)d.clear=!0;else{const T=a.columns[d.col].items.find(G=>G.id===f);T&&(Ut(x,r,T,d.col,ft(x,r)),x.selfcheck.focus[r||"_"].how=R(T).how),d.fix=f}l.verdictInput="",n(x)});const h=u=>{const d=pt(e,r);if(!d)return;let f=M(e);dt(f,{rep:r,day:o,col:d.col,trigger:"Focus check in",kind:"recheck",confirmed:u?[d.id]:[],missing:u?[]:[d.id],fixText:String(d.text||"").slice(0,120)}),u?(f=q(f,o,d.id,!0),ht(f,r)):f.selfcheck.focus[r||"_"].dAt=ft(f,r),n(f)};i("[data-sc-fyes]",()=>h(!0)),i("[data-sc-fno]",()=>h(!1)),i("[data-sc-fclear]",()=>{const u=M(e);ht(u,r),n(u)})}export{nt as COACH_EDITION,w as COLUMN_ORDER,oe as boardFromText,ae as boardStats,bt as defaultBoard,V as getBoard,mt as isLoaded,kt as matchBoard,A as renderBoard,zt as setBoard,xt as todayKey};
