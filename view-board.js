/*! Copyright 2026 David Borske. All rights reserved. */
import{matchCoach as st}from"./coach-topics.js";const Ft=["commission_breath","listening","pushy","lost_confidence","decision_maker_away","rejection_streak"],R=t=>!!(t&&Ft.includes(t.id));import{tipHtml as Ht}from"./guide.js";const nt="dpc";import{matchObjection as Bt,FELT_NOTE as Wt}from"./objections.js";import{readControl as at,subjectLabel as it,logRead as Pt,fixation as Rt}from"./control.js";import{RECHECK_AFTER_D as rt,sinceFocus as Nt,isObjection as ct,isDetail as lt,recordSearch as Dt,coachFor as N,extraKeywords as _t,suggestColumn as qt,numbersRead as Mt,ensureSC as Kt,recordCheck as dt,missCounts as ut,todayStatus as Gt,getFocus as ht,setFocus as Yt,clearFocus as pt,todayD as ft,recheckDue as Ut}from"./selfcheck.js";const v=["d","p","c","a"],z={d:"Made contact",p:"Presentation",c:"Close",a:"Accounts"},J={d:["PACE","Work ethic. What you do, when you do it, and how you do it. Move with a sense of urgency, because when you respect your time they assume you will respect theirs."],p:["PITCH","What you say, when you say it, and how you say it."],c:["ATTITUDE (FOCUS)","Focus on what you can control, the items on this board, not on whether they say yes or no. Nobody is a mind reader or a fortune teller. Where focus goes, energy flows. Energy spent on what you cannot control is energy your next door never gets."]};function yt(){return{placeholder:!1,title:"Game board",source:"Owner's chart, transcribed 2026-09-18",grade:{note:"Grade scale pending confirmation.",scale:[]},columns:{d:{key:"d",title:"Made contact",theme:"PACE",purpose:"You got a conversation. Every one counts.",items:[{id:"d2",text:"Talk to Everyone, Knock Every Door (Law of Averages)",why:"Sales is a numbers game. Out of every group of doors, a certain number will say yes, and you never know which ones. Don't prejudge a house because of no car, no lights or how it looks. Every no moves you closer to the next yes, so the more doors you knock, the more you sell.",keywords:[]},{id:"d3",text:"S.E.E. Factors",why:"Smile, Eye Contact, Enthusiasm. People decide whether they like you in the first few seconds, before you say a word. Smile like you're glad to meet them, look them in the eye and bring real energy. Sales is a transfer of emotion: if you look happy to be there, they relax and listen.",keywords:[]},{id:"d5",text:"Step Back Two or Three Steps After You Knock",why:"Knock, then back up two or three steps from the door. It takes the pressure off whoever is inside, it puts you in their full view instead of on top of them, and it gives you two seconds to reset your face before the door opens.",keywords:["step","steps","back","backup","back up","porch","doorstep","crowding","space"]},{id:"d6",text:"Sense of Urgency",why:"Move like you have somewhere to be, between doors and at the door. Walk with purpose and get to the point. When you respect your own time, people assume you will respect theirs, and you get more conversations in a day.",keywords:[]}]},p:{key:"p",title:"Presentation",theme:"PITCH",purpose:"Getting through the presentation counts as a presentation.",items:[{id:"p1",text:"KISS vs KILL",why:"Keep It Stupid Simple vs Keep It Long and Lengthy. Say only what they need to hear to say yes, in plain words, then move to the ask. Long explanations create confusion, and a confused mind says no. If you've been talking for minutes, you've already lost them.",keywords:[]},{id:"p3",text:"Follow Structure",why:"Run the presentation in the same order every time: intro, questions, value, then the ask. The structure is built so each step sets up the next one. When a pitch falls apart, it's usually right where a step got skipped.",keywords:[]},{id:"p4",text:"S.E.E. Factors",why:"Smile, Eye Contact, Enthusiasm, all the way through the presentation, not just at the door. Keep the same energy in minute three that you had in second one. If your energy drops, their interest drops with it.",keywords:[]},{id:"p5",text:"Tone, Inflection, Conviction, Enthusiasm",why:"How you say it matters more than what you say. Change your tone so you don't sound like a recording, lean on the important words, and speak like you know it's the best deal on the street. If you don't believe it, they won't either.",keywords:[]},{id:"p6",text:"60/40 (Business/Personal) Control conversation and build rapport",why:"Spend about 60 percent of the time on business and 40 percent getting to know them. Rapport makes them trust you, but you're there to help them get set up. Have the friendly conversation, then bring it back. You lead, they follow.",keywords:[]},{id:"p7",text:"Gather and discover (Internet provider, use it for, decision maker, needs & wants, etc.)",why:"Ask questions before you pitch: who their provider is, what they use it for, who makes the decision, and what they wish was better. Their answers become your reasons, in their own words. You close them with what they told you, not with a script.",keywords:[]}]},c:{key:"c",title:"Close",theme:"ATTITUDE (FOCUS)",purpose:"Asking for the business counts as a close. It is an attempted close, not a sale.",items:[{id:"c1",text:"Feel, Felt, Found",why:`A simple way to answer a concern without arguing. Feel: "I totally understand how you feel." Felt: "Other neighbors felt the same way." Found: "What they found was..." then the answer. Spend most of it on understanding and a little on the answer. People don't care what you know until they know you care.`,keywords:[]},{id:"c2",text:"A.I.R.",why:"Agree, Acknowledge or Address, then Immediately Return. When they raise a concern, agree with them or acknowledge it, and if it needs an answer, use Feel, Felt, Found. Then go straight back to where you left off. It keeps one concern from derailing the whole close.",keywords:["air","agree","address","acknowledge","ignore","return","loop","closing"]},{id:"c4",text:"Assume The Sale",why:`Talk like it's already happening. Say "when we get you set up," not "if you want it." Your belief that they're getting it makes saying yes feel natural, and asking "if" invites a no.`,keywords:[]},{id:"c5",text:"Confidence",why:"They feel what you feel. If you're unsure, they're unsure. Say it straight, keep steady eye contact and don't back down at the first pushback. Focus on doing the board right, not on guessing their answer.",keywords:[]},{id:"c6",text:"Ask for Business",why:"No ask, no sale. Every presentation ends with you clearly asking them to get started. Ask, then stop talking and let them answer. The silence after the ask is part of the close.",keywords:[]},{id:"c7",text:"Close 2x to 3x (Conviction, Break Eye Contact)",why:"The first no is often just a reflex. Use A.I.R. on the concern, then ask again with conviction. Break eye contact as you move to the next step, like filling in the paperwork, so it feels like it's already happening. Most sales come after the second or third ask.",keywords:[]},{id:"c8",text:"Indifference (hesitation? Take it away)",why:`If they're on the fence, don't chase or beg. Relax and gently take it away: "It may not be a fit, and that's okay." People lean in toward what's being taken away. You don't need the sale, they need the service.`,keywords:[]}]},a:{key:"a",title:"Accounts",theme:"",purpose:"Work after the sale. Nothing here is tallied against D, P or C.",items:[{id:"a1",text:"Track Installs",why:"Keep a list of every sale and its install date, and check that each one actually gets installed. A sale only pays when it installs, so catch problems early.",keywords:[]},{id:"a2",text:"Courtesy Follow ups",why:"Check in with new customers after the sale and after the install. It shows you care, cuts cancellations, and turns happy customers into referrals.",keywords:[]},{id:"a3",text:"Customer Wrap up (quiz customer to confirm comprehension)",why:"Before you leave, have the customer tell you back the key details: price, install date and what happens next. If they can explain it, they understood it, and customers who understand don't cancel.",keywords:[]},{id:"a4",text:"Submit tickets",why:"When something goes wrong, send it in right away so it gets fixed. Customer issues: toptiersolutionselite@gmail.com. App issues: borske369@gmail.com",keywords:[]}]}}}}function zt(t,e){const s=Object.assign({},t||{});return s.board=Jt(e),s}function V(t){const e=t&&t.board;return e&&e.columns&&v.every(s=>e.columns[s]&&Array.isArray(e.columns[s].items))?(v.forEach(s=>e.columns[s].items.forEach(n=>{n&&/retention@/i.test(String(n.text||""))&&(n.text="Submit tickets")})),e):yt()}function mt(t){const e=V(t);return!e.placeholder&&v.some(s=>e.columns[s].items.length>0)}function Jt(t){const e={placeholder:!!(t&&t.placeholder),title:t&&t.title||"Game board",columns:{}};return v.forEach(s=>{const n=t&&t.columns&&t.columns[s]||{},r=Array.isArray(n.items)?n.items:[];e.columns[s]={key:s,title:n.title||z[s],purpose:n.purpose||"",items:r.map((o,i)=>({id:o&&o.id||`${s}${i+1}`,text:String((o&&o.text)!=null?o.text:""),why:String((o&&o.why)!=null?o.why:""),keywords:Array.isArray(o&&o.keywords)?o.keywords.map(String):[]})).filter(o=>o.text.trim())}}),e}const Vt={a:/^(?:a|accounts?)$/i,d:/^(?:d|doors?|door\s*knock(?:s|ing)?|knock(?:s|ing)?)$/i,p:/^(?:p|presentations?|presents?|presenting|pitch(?:es)?)$/i,c:/^(?:c|close|closes|closing|closer|asks?|asking)$/i},Qt=/^(?:column|col|columns|stage|step|the|actions?|items?|list|board|\d+)$/i;function D(t){let e=String(t??"").trim();if(!e||(e=e.replace(/^#+\s*/,"").replace(/^\*+|\*+$/g,"").replace(/^_+|_+$/g,"").trim(),!e||e.length>60))return null;const s=e.split(/[\s:|,;/()\[\]\-–—.]+/).filter(Boolean);if(!s.length||s.length>5)return null;let n=null;for(const r of s){let o=null;for(const i of v)if(Vt[i].test(r)){o=i;break}if(o){if(n&&n!==o)return null;n=o}else if(!Qt.test(r))return null}return n}function bt(t,e){let s=String(t??"").trim().replace(/^#+\s*/,"").replace(/^\*+|\*+$/g,"").replace(/^_+|_+$/g,"").trim();const n=s.match(/^[dpc]\s*[:|,;/\-–—.)(]+\s*(.+)$/i);return n&&(s=n[1].trim()),s=s.replace(/[)(\[\]]/g,"").replace(/^[\s:|,;/\-–—.]+|[\s:|,;/\-–—.]+$/g,"").trim(),!s||/^[dpc]$/i.test(s)?z[e]:s}function Zt(t){return/^\s*(?:why|reason|reasons|because|control|coaching|note|notes)\b/i.test(String(t||""))}function gt(t){const e=[];let s="",n=!1;for(let r=0;r<t.length;r++){const o=t[r];o==='"'?n&&t[r+1]==='"'?(s+='"',r++):n=!n:o===","&&!n?(e.push(s.trim()),s=""):s+=o}return e.push(s.trim()),e}function Xt(t){return t.split("	").map(e=>e.trim())}function te(t){let e=t.trim();return e.startsWith("|")&&(e=e.slice(1)),e.endsWith("|")&&(e=e.slice(0,-1)),e.split("|").map(s=>s.trim())}function wt(t){return/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(t)}function Q(t){return String(t).replace(/^\s*(?:[-*•▪◦►·]|\d{1,3}[.)]|[a-zA-Z][.)])\s+/,"")}function vt(){const t={placeholder:!1,title:"Game board",columns:{}};return v.forEach(e=>{t.columns[e]={key:e,title:z[e],purpose:"",items:[]}}),t}function ee(t){const e=t.length,s=t.filter(o=>/^\s*\|.*\|\s*$/.test(o)||wt(o)).length;if(s>=2&&s>=e*.6)return"markdown";const n=t.filter(o=>o.includes("	")).length;if(n>=1&&n>=e*.5)return"tsv";const r=t.filter(o=>gt(o).length>=2).length;return r>=2&&r>=e*.6?"csv":"list"}function oe(t){const e=[],s=vt();try{const r=String(t??"").replace(/\r\n?/g,`
`).split(`
`).filter(p=>p.trim());if(!r.length)return{ok:!1,board:s,warnings:["Nothing to read. Paste the chart first."]};const o=ee(r);let i=!1;if(o==="markdown"||o==="tsv"||o==="csv"){const p=o==="markdown"?te:o==="tsv"?Xt:gt,u=r.filter(d=>!(o==="markdown"&&wt(d))).map(p);i=se(u,s,e,o),i||e.push(`Read this as ${o==="csv"?"CSV":o==="tsv"?"a spreadsheet paste":"a markdown table"} but could not find two or more D, P, C headers in the first rows. Trying it as a headed list instead.`)}i||(i=ne(r,s,e));const a=v.map(p=>s.columns[p].items.length);return a.reduce((p,u)=>p+u,0)?(v.forEach((p,u)=>{if(!a[u]&&p==="a"){s.columns.a=JSON.parse(JSON.stringify(yt().columns.a));return}a[u]||e.push(`${p.toUpperCase()} (${s.columns[p].title}) came through with no items.`)}),v.forEach(p=>{s.columns[p].items=s.columns[p].items.map((u,d)=>({id:`${p}${d+1}`,text:u.text,why:u.why||"",keywords:[]}))}),{ok:!0,board:s,warnings:e}):(e.push("No items found. Each column needs a header like D, P, C or Made contact, Presentation, Close, with one action per line or per cell under it."),{ok:!1,board:s,warnings:e})}catch{return e.push("The chart could not be read. Nothing was changed."),{ok:!1,board:vt(),warnings:e}}}function se(t,e,s,n){let r=-1,o=null;for(let a=0;a<Math.min(t.length,5);a++){const c=t[a].map(D);if(new Set(c.filter(Boolean)).size>=2){r=a,o=c;break}}if(o){const a=t[r],c={},p={};o.forEach((d,f)=>{d&&(p[d]&&s.push(`Two headers point at ${d.toUpperCase()}. Both were merged into that column.`),p[d]=!0,e.columns[d].title=bt(a[f],d),!o[f+1]&&Zt(a[f+1])&&(c[f]=f+1))});const u=a.filter((d,f)=>d&&!o[f]&&!Object.values(c).includes(f));u.length&&s.push(`Ignored columns: ${u.join(", ")}.`);for(let d=r+1;d<t.length;d++){const f=t[d];o.forEach((k,C)=>{if(!k)return;const g=f[C];if(g==null||!String(g).trim())return;const x=n==="markdown"?String(g):Q(g),F=c[C]!=null&&f[c[C]]?String(f[c[C]]):"";e.columns[k].items.push({text:x,why:F})})}return!0}const i=t.filter(a=>a.length>=2&&D(a[0])&&String(a[1]||"").trim());return i.length>=2&&i.length>=t.length*.5?(t.forEach(a=>{const c=D(a[0]);if(!c)return;const p=String(a[1]||"").trim();p&&e.columns[c].items.push({text:Q(p),why:a[2]?String(a[2]):""})}),!0):!1}function ne(t,e,s){let n=null,r=!1;const o=[];for(const i of t){const a=i.trim(),c=Q(a);let u=c!==a?null:D(a);if(u&&u===n&&!/^#/.test(a)&&!/:$/.test(a)&&(u=null),u&&a.length<=60){n=u,r=!0,e.columns[u].title=bt(a,u);continue}if(!n){o.push(a);continue}e.columns[n].items.push({text:c,why:""})}return o.length&&s.push(`${o.length} line${o.length===1?"":"s"} before the first column header ${o.length===1?"was":"were"} skipped: ${o.slice(0,2).join(" / ")}${o.length>2?" ...":""}`),r?!0:(s.push("No column headers found. Add a line with D, P or C (or Made contact, Presentation, Close) above each group of actions."),!1)}const ae=new Set("a an the and or but if of to in on at for with by from as is am are was were be been being i me my mine we our you your he she it its they their this that these those there here so too very just really about into out up down off over under again then than also not no yes do does did doing have has had having will would can could should shall may might must get got getting go going gonna want wanted keep keeps im ive dont cant wont didnt isnt arent thats whats what how when where why who which because feel feeling think thinking today right now still even like need needs felt door doors house houses more".split(/\s+/));function _(t){return String(t||"").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(e=>e&&!ae.has(e)).map(ie)}function ie(t){return t.length<=3?t:t.replace(/ies$/,"y").replace(/(ing|ers?|ed|es|ly|s)$/,"")}function kt(t,e){const s={input:String(e||"").trim(),loaded:!1,inBounds:!1,item:null,column:null,score:0,nearest:null},n=v.some(i=>t.columns[i].items.length);s.loaded=!t.placeholder&&n;const r=_(e);if(!s.loaded||!r.length)return s;let o=null;return v.forEach(i=>{t.columns[i].items.forEach(a=>{const c=new Set(_(a.text)),p=new Set(_(a.why).concat(_((a.keywords||[]).concat(_t(a)).join(" "))));let u=0;r.forEach(d=>{c.has(d)?u+=2:p.has(d)&&(u+=1)}),u>0&&(!o||u>o.score)&&(o={item:a,column:i,score:u})})}),o&&o.score>=2?(s.inBounds=!0,s.item=o.item,s.column=o.column,s.score=o.score):o&&(s.nearest=o.item,s.column=o.column),s}function $t(t,e){for(const s of v){const n=t.columns[s].items.find(r=>r.id===e);if(n)return n}return null}function xt(t){const e=t instanceof Date?t:new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function re(t,e){const s=V(t),n=e||xt(),r=t&&t.boardWork&&t.boardWork[n]||{},o=t&&t.oobLog&&t.oobLog[n]||[],i={};return v.forEach(a=>{const c=s.columns[a].items,p=c.filter(u=>r[u.id]).map(u=>u.id);i[a]={title:s.columns[a].title,total:c.length,worked:p.length,workedIds:p}}),{date:n,placeholder:!!s.placeholder,loaded:mt(t),columns:i,workedTotal:v.reduce((a,c)=>a+i[c].worked,0),itemTotal:v.reduce((a,c)=>a+i[c].total,0),outOfBounds:o.map(a=>({text:a.text,nearestId:a.nearestId||null,nearestText:a.nearestId&&($t(s,a.nearestId)||{}).text||"",at:a.at})),outOfBoundsCount:o.length}}const l={pasteOpen:!1,pasteText:"",pending:null,preview:null,verdictInput:"",sc:null,filter:"all"};let St=null;const ce=["board","boardWork","oobLog","control","selfcheck"];function h(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function le(t,e){return typeof t=="function"?(t(e),!1):t&&typeof t.commit=="function"?(t.commit(s=>{ce.forEach(n=>{n in e?s[n]=e[n]:delete s[n]})}),!0):t&&typeof t.setState=="function"?(t.setState(e),!1):t&&typeof t.update=="function"?(t.update(e),!1):(St=e,!1)}function de(t){if(t&&typeof t.today=="function")try{const e=t.today();if(e)return e}catch{}return xt()}function q(t,e,s,n){const r=Object.assign({},t);r.boardWork=Object.assign({},t.boardWork||{});const o=Object.assign({},r.boardWork[e]||{});return n?o[s]=!0:delete o[s],r.boardWork[e]=o,r}function A(t,e,s,n){if(!t)return;(n||{}).paste&&(l.pasteOpen=!0);const o=e||St||{},i=V(o),a=mt(o),c=de(s),p=o.boardWork&&o.boardWork[c]||{},u=o.oobLog&&o.oobLog[c]||[],d=re(o,c),f=y=>{le(s,y)||A(t,y,s)},k=o.activeRep||null,C=Gt(o,k),g=ut(o,k),x=y=>l.filter==="done"?!!p[y]||C[y]==="yes":l.filter==="notyet"?C[y]==="no"&&!p[y]:l.filter==="repeat"?(g[y]||0)>=2:!0;let F=0;const T=v.map(y=>{const b=i.columns[y];let m=null;const E=b.items.filter(w=>x(w.id)).map(w=>{F++;const I=!!p[w.id],j=(C[w.id]==="no"&&!I?'<span class="sc-badge no">Not yet today</span>':"")+((g[w.id]||0)>=2?`<span class="sc-badge rep">Not yet ${g[w.id]} times in 7 days</span>`:"");let O="";return(w.group||null)!==m&&(m=w.group||null,m&&(O=`<p class="board-group">${h(m)}</p>`)),O+`
        <button type="button" class="board-item${I?" worked":""}${i.placeholder?" stub":""}"
                data-item="${h(w.id)}" aria-pressed="${I?"true":"false"}">
          <span class="board-item-check" aria-hidden="true">${I?"✓":""}</span>
          <span class="board-item-body">
            <span class="board-item-text">${h(w.text)}</span>
            ${w.why?`<span class="board-item-why">${h(w.why)}</span>`:""}
            ${j?`<span class="sc-badges">${j}</span>`:""}
          </span>
        </button>`}).join("");return`
      <section class="board-col board-col-${y}" data-col="${y}">
        <header class="board-col-head">
          <div class="board-col-letter">${y.toUpperCase()}</div>
          <div class="board-col-titles">
            <h3 class="board-col-title">${h(/^doors?$/i.test(b.title)?"Made contact":b.title)}</h3>
            ${b.purpose?`<p class="board-col-purpose">${h(/counts as a door/i.test(b.purpose)?"You got a conversation. Every one counts.":b.purpose)}</p>`:""}
          </div>
          <div class="board-col-count" aria-label="${d.columns[y].worked} of ${d.columns[y].total} worked">
            <strong>${d.columns[y].worked}</strong><span> of ${d.columns[y].total} done today</span>
          </div>
        </header>
        ${J[y]?`<div class="board-theme-box"><p class="board-theme">${h(J[y][0])}</p><p class="board-theme-why">${h(J[y][1])}</p></div>`:""}
        <div class="board-items">${E||`<p class="board-empty">${l.filter==="all"?"No items in this column.":"Nothing here for this filter."}</p>`}</div>
      </section>`}).join(""),K=u.length?`<ul class="oob-log-list">${u.slice().reverse().map(y=>{const b=y.nearestId?$t(i,y.nearestId):null;return`<li class="oob-log-item">
          <span class="oob-log-text">${h(y.text)}</span>
          ${b?`<span class="oob-log-near">Nearest board item: ${h(b.text)}</span>`:""}
        </li>`}).join("")}</ul>`:'<p class="oob-log-empty">Nothing logged out of bounds today.</p>',It=`
    <section class="board-waiting" role="note">
      <h2 class="board-waiting-title">The game board is waiting on your chart.</h2>
      <p class="board-waiting-body">The columns are ready. Paste the chart and it fills in. The items shown below are stubs so you can see the shape, nothing more.</p>
      <button type="button" class="board-paste-open btn-primary">Paste the chart</button>
    </section>`,$=l.verdictInput?kt(i,l.verdictInput):null,W=l.verdictInput?at(l.verdictInput):null,L=l.verdictInput?st(l.verdictInput,nt):null,G=!!(l.unclear&&l.verdictInput),H=!!(L&&L.safety),P=!H&&!!(l.verdictInput&&ct(l.verdictInput)),Y=!H&&!P&&!R(L)&&!!(W&&W.verdict==="nocontrol"&&W.confidence>=.55),Z=!H&&!P&&!Y&&!!L&&!!$&&$.loaded&&(R(L)||!$.inBounds||$.score<=2),jt=$?` show ${G?"out":H?"safety":Z?"coach":Y?"nocontrol":$.loaded?$.inBounds||P?"in":"out":"unloaded"}`:"",Ot=`
    <section class="oob" aria-labelledby="oob-title">
      ${ue(o)}
      ${a?ke(o,k):""}
${o.cloud&&o.cloud.role==="manager"?'<h2 id="oob-title" class="oob-title">The help box is for reps</h2><p class="oob-sub">When a rep keeps hitting the same problem, they type it here and the board coaches them. What they type shows on your Team tab.</p>':`      ${Ht("rep-board","Same problem keeps happening? Type it below and tap Check the board.")}
      <h2 id="oob-title" class="oob-title">What is on your mind right now?</h2>
      <p class="oob-sub">${a?"Type it. The board will tell you if it is on the board or out of bounds.":"Type it. Once the chart is loaded the board will tell you if it is in bounds."}</p>
      <form class="oob-form" autocomplete="off">
        <label class="visually-hidden" for="oob-input">What is on your mind</label>
        <input id="oob-input" class="oob-input" data-oob="input" type="text" inputmode="text" enterkeyhint="go" maxlength="200" />
        <button type="submit" class="oob-check btn-primary">Check the board</button>
      </form>
      <div class="oob-verdict${jt}" aria-live="polite">${G?'<div class="oob-verdict-head">Say it another way</div><div class="oob-verdict-body"><p class="oob-verdict-line">The board did not catch that. Try plain words, like "I keep blanking on my pitch" or "they keep saying it costs too much".</p></div><div class="oob-verdict-actions"><button type="button" class="oob-dismiss btn-secondary">Got it</button></div>':$?H?fe(L):Z?pe(L,i):Y?he(W):P&&$.loaded?ve(l.verdictInput):ye($,i):""}</div>
      ${a&&!H&&!G?$e(i,o,k):""}`}
      <details class="oob-log"${u.length?"":" hidden"}${u.length&&$&&!$.inBounds?" open":""}>
        <summary class="oob-log-summary">Not on the board today: <strong>${u.length}</strong></summary>
        ${K}
      </details>
    </section>`;t.innerHTML=`
    <div class="board${a?"":" board-unloaded"}">
      ${a?"":It}
      ${l.pasteOpen?me(l.pasteText):""}
      ${Ot}
      
      <div class="board-cols">${T}</div>
      ${a?`
      <div class="board-footer">
        <button type="button" class="board-paste-open btn-secondary">Replace the chart</button>
      </div>`:""}
    </div>`,t.querySelectorAll(".board-item").forEach(y=>{y.addEventListener("click",()=>{const b=y.getAttribute("data-item");f(q(o,c,b,!p[b]))})}),t.querySelectorAll(".board-paste-open").forEach(y=>{y.addEventListener("click",()=>{l.pasteOpen=!0,A(t,o,s);const b=t.querySelector(".paste-text");b&&b.focus()})}),be(t,o,s,f);const X=t.querySelector(".oob-form"),At=t.querySelector(".oob-input");X&&X.addEventListener("submit",y=>{y.preventDefault();const b=At.value.trim();if(!b)return;const m=kt(i,b);l.verdictInput=b;const E=st(b,nt),w=!!(E&&E.safety),I=at(b),j=!w&&ct(b),O=!w&&!j&&!R(E)&&I.verdict==="nocontrol"&&I.confidence>=.55,U=!w&&!j&&!O&&!!E&&m.loaded&&(R(E)||!m.inBounds||m.score<=2);if(l.sc=null,m.loaded&&!m.inBounds&&!m.nearest&&!E&&!j&&!O){l.unclear=!0,A(t,o,s);return}if(l.unclear=!1,m.loaded&&!w){const S=U?Ct(i,E):null;S?(Et(i,o,b,Object.assign({},m,{inBounds:!0,item:S.item,nearest:S.item,column:S.col}),null,!1),l.sc&&(l.sc.kind="coach")):Et(i,o,b,m,O?I:null,j)}const Lt=w?"safety":O?"nocontrol":j?"objection":m.loaded?U?"coach":m.inBounds?"in":"out":"",B=m.loaded?M(o):o;if(m.loaded&&Dt(B,{rep:o.activeRep||null,day:c,text:b.slice(0,160),result:Lt,col:l.sc?l.sc.col:"",item:m.inBounds&&m.item?m.item.id:m.nearest?m.nearest.id:""}),(j||w||U)&&m.loaded){f(B);return}if(O){const S=Object.assign({},B);S.control=Object.assign({},o.control||{}),S.control.log=(o.control&&o.control.log||[]).slice(),Pt({control:S.control},o.activeRep||null,I,c),f(S);return}if(m.loaded&&!m.inBounds){const S=Object.assign({},B);S.oobLog=Object.assign({},o.oobLog||{});const ot=(S.oobLog[c]||[]).slice();ot.push({text:b,nearestId:m.nearest?m.nearest.id:null,at:new Date().toISOString()}),S.oobLog[c]=ot,f(S);return}if(m.loaded){f(B);return}A(t,o,s)});const tt=t.querySelector(".oob-verdict .oob-mark");if(tt&&$){const y=$.inBounds?$.item.id:$.nearest?$.nearest.id:null;tt.addEventListener("click",()=>{l.verdictInput="",y?f(q(o,c,y,!0)):A(t,o,s)})}const et=t.querySelector(".oob-verdict .oob-dismiss");et&&et.addEventListener("click",()=>{l.verdictInput="",A(t,o,s)}),xe(t,o,s,f,i,c,k)}function ue(t){let e;try{e=Rt({control:t.control||{}},t.activeRep||null)}catch{return""}if(!e||!e.today)return"";const s=e.top,n=s?it(s.subject):"Outside your control";return`
    <div class="ctl-fix${e.repeating?" ctl-fix-hot":""}" role="status">
      <span class="ctl-fix-n">${e.today}</span>
      <span class="ctl-fix-t">${t&&t.cloud&&t.cloud.role==="manager"?e.today===1?"thought outside their control today across your team":"thoughts outside their control today across your team":e.today===1?"thing outside your control today":"things outside your control today"}${s&&s.count>1?`. ${s.count} on one thing: ${h(n)}.`:"."}</span>
      ${e.repeating?'<span class="ctl-fix-flag">Same kind of thought, three times. That is the pattern, not the day.</span>':""}
    </div>`}function he(t){let e=t;return/afford|money|broke|budget/i.test(String(t.input||l.verdictInput||""))&&(e=Object.assign({},t,{subject:"_afford",why:"You cannot see their bank account from the door, and judging it costs you the pitch.",redirect:"Gather and discover what they pay now and what they use it for. Then Feel, Felt, Found, and ask again."})),`
    <div class="oob-verdict-head ctl-head">${h(e.subject==="_afford"?"What they can afford is not yours to judge":it(e.subject))}</div>
    <div class="oob-verdict-body">
      <p class="ctl-line">${h(e.why)}</p>
      
    <ol class="ctl-chain" aria-label="What this costs you">
      <li>Focus goes to something you cannot move</li>
      <li>Attitude drops</li>
      <li>Pace drops</li>
      <li>The door that does open gets the worst version of you</li>
    </ol>
      <p class="ctl-line">Attitude is focus. Are you in bounds or out of bounds? Get back to what is on the board: your pace, your pitch and your next contact.</p>
      <p class="ctl-redirect-l">Back on the board</p>
      <p class="ctl-redirect">${h(e.redirect)}</p>
    </div>
    <div class="oob-verdict-actions">
      <button type="button" class="oob-dismiss btn-secondary">Got it, back to work</button>
    </div>`}function Ct(t,e){const s=String(e.boardHint||"").toLowerCase();for(const o of v){const i=(t.columns[o]&&t.columns[o].items||[]).find(a=>String(a.text||"").toLowerCase()===s);if(i)return{item:i,col:o}}const n=e.boardCol&&t.columns[e.boardCol]?e.boardCol:null,r=n?(t.columns[n].items||[])[0]:null;return r?{item:r,col:n}:null}function pe(t,e){const s=Ct(e,t);return`
    <div class="oob-verdict-head">Coaching</div>
    <div class="oob-verdict-body">
      <p class="oob-verdict-line coach-note">This is not on the board. Here is how to get back to it.</p>
      <p class="oob-verdict-line"><strong>${h(t.title)}.</strong> ${t.lines.map(h).join(" ")}</p>
      ${s?`<p class="oob-verdict-line">Back on the board:</p>
      <span class="oob-verdict-col">${h(e.columns[s.col].title)}</span>
      <span class="oob-verdict-item">${h(s.item.text)}</span>`:""}
    </div>
    <div class="oob-verdict-actions">
      <button type="button" class="oob-dismiss btn-secondary">Got it</button>
    </div>`}function fe(t){return`
    <div class="oob-verdict-head">Safety first</div>
    <div class="oob-verdict-body">
      <p class="oob-verdict-line"><strong>${h(t.title)}.</strong></p>
      ${t.lines.map(e=>`<p class="oob-verdict-line">${h(e)}</p>`).join("")}
    </div>
    <div class="oob-verdict-actions">
      <button type="button" class="oob-dismiss btn-secondary">Got it</button>
    </div>`}function ye(t,e){if(!t.loaded)return`
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
        <span class="oob-verdict-col">${h(e.columns[t.column].title)}</span>
        <span class="oob-verdict-item">${h(t.item.text)}</span>
        ${(()=>{const n=t.item.why||N(t.item).how;return n?`<span class="oob-verdict-why">${h(n)}</span>`:""})()}
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
      <span class="oob-verdict-col">${h(e.columns[t.column].title)}</span>
      <span class="oob-verdict-item">${h(s.text)}</span>
      ${s.why?`<span class="oob-verdict-why">${h(s.why)}</span>`:""}`:'<p class="oob-verdict-line">Pick the board item closest to it and work that.</p>'}
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
      <textarea class="paste-text" data-oob="paste" rows="10" spellcheck="false">${h(t)}</textarea>
      <div class="paste-actions">
        <button type="button" class="paste-preview btn-primary">Preview</button>
      </div>
      <div class="paste-result">${l.preview?Tt(l.preview):""}</div>
    </section>`}function Tt(t){const{ok:e,board:s,warnings:n}=t,r=v.map(i=>{const a=s.columns[i];return`
      <div class="paste-col">
        <div class="paste-col-head">
          <span class="paste-col-letter">${i.toUpperCase()}</span>
          <span class="paste-col-title">${h(a.title)}</span>
          <span class="paste-col-count">${a.items.length} item${a.items.length===1?"":"s"}</span>
        </div>
        ${a.items.length?`<ol class="paste-col-items">${a.items.map(c=>`<li>${h(c.text)}${c.why?`<small>${h(c.why)}</small>`:""}</li>`).join("")}</ol>`:'<p class="paste-col-empty">Empty</p>'}
      </div>`}).join(""),o=v.reduce((i,a)=>i+s.columns[a].items.length,0);return`
    <div class="paste-preview-wrap">
      <h3 class="paste-preview-title">${e?`This is how it reads: ${o} item${o===1?"":"s"} on the board.`:"Could not read a board from that."}</h3>
      ${n.length?`<ul class="paste-warnings">${n.map(i=>`<li>${h(i)}</li>`).join("")}</ul>`:""}
      ${e?`<div class="paste-cols">${r}</div>`:""}
      ${e?`
      <div class="paste-confirm-actions">
        <button type="button" class="paste-confirm btn-primary">Use this board</button>
        <button type="button" class="paste-cancel btn-secondary">Go back and edit</button>
      </div>
      <p class="paste-confirm-note">Nothing changes until you confirm. Items worked today are kept by position in each column.</p>`:""}
    </div>`}function be(t,e,s,n){const r=t.querySelector(".paste");if(!r)return;const o=r.querySelector(".paste-text"),i=r.querySelector(".paste-result");o.addEventListener("input",()=>{l.pasteText=o.value}),r.querySelector(".paste-close").addEventListener("click",()=>{l.pasteOpen=!1,l.pending=null,l.preview=null,A(t,e,s)});const a=()=>{const c=i.querySelector(".paste-confirm");c&&c.addEventListener("click",()=>{if(!l.pending)return;const u=zt(e,l.pending);l.pasteOpen=!1,l.pending=null,l.preview=null,l.pasteText="",l.verdictInput="",n(u)});const p=i.querySelector(".paste-cancel");p&&p.addEventListener("click",()=>{l.pending=null,l.preview=null,i.innerHTML="",o.focus()})};r.querySelector(".paste-preview").addEventListener("click",()=>{l.pasteText=o.value;const c=oe(o.value);l.pending=c.ok?c.board:null,l.preview=c,i.innerHTML=Tt(c),a(),typeof i.scrollIntoView=="function"&&i.scrollIntoView({behavior:"smooth",block:"start"})}),a()}const ge={d:"D (made contact)",p:"P (presentation)",c:"C (close, ask for business)"},Oe={d:"Contact",p:"Presentation",c:"Close"};function we(t,e){return ge[e]||e.toUpperCase()}function ve(t){const e=Bt(t);return`
    <div class="oob-verdict-head">That's an objection. It's in bounds, it's yours to handle.</div>
    <div class="oob-verdict-body">${e?`
      <p class="oob-verdict-line"><strong>${h(e.label)}.</strong> Next time you hear it, A.I.R. it out. Most of your answer is Feel and Felt, keep Found short, then return.</p>
      <p class="obj-step"><span class="obj-k">Feel</span> ${h(e.feel)}</p>
      <p class="obj-step"><span class="obj-k">Felt</span> ${h(e.felt)}</p>
      <p class="obj-note">${h(Wt)}</p>
      <p class="obj-step"><span class="obj-k">Found</span> ${h(e.found)}</p>
      <p class="obj-step"><span class="obj-k">Return</span> ${h(e.ret)}</p>`:`
      <p class="oob-verdict-line">They said it, but what happens next is on you. Next time you hear it, A.I.R. it out: Agree, Acknowledge or Address it with Feel, Felt, Found, then Immediately Return to where you left off and ask for the business again.</p>`}
    </div>
    <div class="oob-verdict-actions">
      <button type="button" class="oob-dismiss btn-secondary">Hide</button>
    </div>`}function Et(t,e,s,n,r,o){const i=e.activeRep||null,a=Mt(e,i);let c=qt({match:n,control:r,objection:o,text:s});!c&&a&&(c=a.col),c||(c="d");const p=t.columns[c].items,u=p.filter(g=>!lt(g)),d=ut(e,i);let f=n.inBounds&&n.item?n.item.id:n.nearest?n.nearest.id:null;const k=p.findIndex(g=>g.id===f);k>0&&lt(p[k])&&(f=p[k-1].id);const C=u.map((g,x)=>({id:g.id,n:x,w:(g.id===f?1e3:0)+(d[g.id]||0)*10})).sort((g,x)=>x.w-g.w||g.n-x.n).map(g=>g.id);l.sc={col:c,order:C,idx:0,answers:{},trigger:s,nrLine:a?a.line:"",kind:r?"nocontrol":o?"objection":n.inBounds?"in":"out",fix:null,clear:!1}}function Ae(){return`<div class="sc-filter" role="group" aria-label="Filter the board">${[["all","All"],["done","Done today"],["notyet","Not yet today"],["repeat","Keeps coming up"]].map(([e,s])=>`<button type="button" class="sc-chip${l.filter===e?" on":""}" data-sc-filter="${e}" aria-pressed="${l.filter===e}">${s}</button>`).join("")}</div>`}function ke(t,e){const s=ht(t,e);if(!s)return"";const n=Nt(t,e,s),r=Ut(t,e);return`
    <section class="sc-focus${r?" due":""}" aria-live="polite">
      <p class="sc-focus-l">Your focus right now</p>
      <p class="sc-focus-t">${h(s.text)}</p>
      ${s.how?`<p class="sc-focus-how">${h(s.how)}</p>`:""}
      ${r?`<p class="sc-focus-due">Did you run it on your last ${n} D?</p>
           <div class="sc-row"><button type="button" class="btn-primary" data-sc-fyes="1">Yes, I ran it</button>
           <button type="button" class="btn-secondary" data-sc-fno="1">Not yet</button></div>`:`<p class="sc-focus-meta">Check in after ${Math.max(0,rt-n)} more D.</p>
`}
      <div class="sc-row"><button type="button" class="btn-secondary" data-sc-fclear="1">Pick a new focus</button></div>
    </section>`}function $e(t,e,s){const n=l.sc;if(!n)return"";const r=t.columns[n.col].items,o=a=>r.find(c=>c.id===a);if(n.fix){const a=o(n.fix);return`
      <section class="sc sc-fix" aria-live="polite">
        <p class="sc-l">Your fix</p>
        <p class="sc-fix-t">${h(a?a.text:"")}</p>
        <p class="sc-fix-how">${h(a?N(a).how:"")}</p>
        <p class="fine">Run it on your next ${rt} D and the app will check back with you.</p>
        <div class="sc-row"><button type="button" class="btn-primary" data-sc-close="1">Got it</button></div>
      </section>`}if(n.clear)return`
      <section class="sc" aria-live="polite">
        <p class="sc-clear">You're doing everything in ${h(we(t,n.col))}. Then it's just the numbers. Keep going.</p>
        <div class="sc-row"><button type="button" class="btn-primary" data-sc-close="1">Got it</button></div>
      </section>`;const i=o(n.order[n.idx]);return i?`
    <section class="sc" aria-live="polite">
      ${n.nrLine&&n.idx===0?`<p class="sc-nr">${h(n.nrLine)}</p>`:""}
      <p class="sc-l sc-l-q">Quick check on your last few conversations.</p>
      <p class="sc-q-t">${h(N(i).q)}</p>
      <div class="sc-row">
        <button type="button" class="sc-ans yes" data-sc-ans="yes">Yes</button>
        <button type="button" class="sc-ans no" data-sc-ans="no">Not yet</button>
      </div>
    </section>`:""}function M(t){const e=Object.assign({},t);return e.selfcheck=JSON.parse(JSON.stringify(t.selfcheck||{})),Kt(e),e}function xe(t,e,s,n,r,o,i){const a=(u,d)=>t.querySelectorAll(u).forEach(f=>f.addEventListener("click",()=>d(f))),c=()=>A(t,e,s);a("[data-sc-close]",()=>{l.sc=null,l.verdictInput="",c()}),a("[data-sc-ans]",u=>{const d=l.sc;if(!d)return;const f=d.order[d.idx],k=u.getAttribute("data-sc-ans")==="yes";if(d.answers[f]=k?"yes":"no",k&&d.idx+1<d.order.length){d.idx++,c();return}const C=Object.keys(d.answers).filter(T=>d.answers[T]==="yes"),g=k?[]:[f];let x=M(e);const F=k?null:r.columns[d.col].items.find(T=>T.id===f);if(dt(x,{rep:i,day:o,col:d.col,trigger:String(d.trigger||"").slice(0,160),kind:d.kind,confirmed:C,missing:g,fixText:F?String(F.text).slice(0,120):""}),C.forEach(T=>{x=q(x,o,T,!0)}),k)d.clear=!0;else{const T=r.columns[d.col].items.find(K=>K.id===f);T&&(Yt(x,i,T,d.col,ft(x,i)),x.selfcheck.focus[i||"_"].how=N(T).how),d.fix=f}l.verdictInput="",n(x)});const p=u=>{const d=ht(e,i);if(!d)return;let f=M(e);dt(f,{rep:i,day:o,col:d.col,trigger:"Focus check in",kind:"recheck",confirmed:u?[d.id]:[],missing:u?[]:[d.id],fixText:String(d.text||"").slice(0,120)}),u?(f=q(f,o,d.id,!0),pt(f,i)):f.selfcheck.focus[i||"_"].dAt=ft(f,i),n(f)};a("[data-sc-fyes]",()=>p(!0)),a("[data-sc-fno]",()=>p(!1)),a("[data-sc-fclear]",()=>{const u=M(e);pt(u,i),n(u)})}export{nt as COACH_EDITION,v as COLUMN_ORDER,oe as boardFromText,re as boardStats,yt as defaultBoard,V as getBoard,mt as isLoaded,kt as matchBoard,A as renderBoard,zt as setBoard,xt as todayKey};
