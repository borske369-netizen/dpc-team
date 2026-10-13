/*! Copyright 2026 David Borske. All rights reserved. */
import{tipHtml as A}from"./guide.js";import{dayPlanHtml as F,habitsHtml as W}from"./playbook.js";import{repGoalsHtml as Y}from"./repgoals.js";import{goalHtml as H}from"./goal.js";import{today as h,weekStart as E,weekLabel as L,repEntries as N,repTotals as U,weekTotals as O,rates as w,flagState as j,fmtPct as D,fmtNum as y,fmt1 as _,num as d,uid as B,minText as P}from"./model.js";import{getFocus as G,recheckDue as K,RECHECK_AFTER_D as q,sinceFocus as z}from"./selfcheck.js";import{callbackHtml as J}from"./callbacks.js";import{timeOffHtml as Q,offTodayHtml as V}from"./timeoff.js";import{eventsHtml as X}from"./events.js";const C=[{key:"d",letter:"D",label:"Made contact",help:"You made contact at the door."},{key:"p",letter:"P",label:"Presentation",help:"You presented."},{key:"c",letter:"C",label:"Close (ask for business)",help:"You asked. This is not the sale."},{key:"sale",letter:"S",label:"Sale",help:"They said yes."}],i={editDate:null,editOpen:!1,remindOpen:!1,lastRep:null,undo:[]};function $(t,e,a){return(t.entries[e]||[]).find(n=>n.date===a)||null}function S(t,e){const a=h();return t.entries[e]||(t.entries[e]=[]),$(t,e,a)||t.entries[e].push({id:B(),date:a,d:0,p:0,c:0,sale:0,note:"",st:0,stMbps:""}),t}function fe(t,e,a,s){S(t,e);const n=$(t,e,h());i.lastRep!==e&&(i.lastRep=e,i.editDate=null);const o=i.editDate&&i.editDate<=h()?i.editDate:h(),l=$(t,e,o)||{d:0,p:0,c:0,sale:0},p=["d","p","c","sale"],b=p.indexOf(a);if(s>0){for(let r=0;r<=b;r++)n[p[r]]=d(n[p[r]])+s;i.undo.push({repId:e,date:n.date,key:a}),i.undo.length>50&&i.undo.shift()}else{const r=p[b+1];if(r&&d(n[r])>d(n[a])+s)return i.blocked={d:"P",p:"C",c:"S"}[a]||"",t;n[a]=Math.max(0,d(n[a])+s),i.undo=i.undo.filter(m=>!(m.repId===e&&m.date===n.date))}for(let r=1;r<p.length;r++){const m=p[r-1],g=p[r];d(n[g])>d(n[m])&&(n[g]=d(n[m]))}return t}function $e(t){const e=i.undo.pop();if(!e)return t;const a=$(t,e.repId,e.date);if(!a)return t;const s=["d","p","c","sale"],n=s.indexOf(e.key);for(let o=0;o<=n;o++)a[s[o]]=Math.max(0,d(a[s[o]])-1);for(let o=1;o<s.length;o++)d(a[s[o]])>d(a[s[o-1]])&&(a[s[o]]=d(a[s[o-1]]));return t}function ye(t,e,a){const s=e.activeRep,n=e.reps.find(c=>c.id===s);if(!n){t.innerHTML=`<div class="pad"><div class="empty">
      <h3>${e.cloud&&e.cloud.role==="manager"&&e.cloud.token?"Your reps":"Pick who you are"}</h3>
      <p>${e.cloud&&e.cloud.role==="manager"&&e.cloud.token?"Pick a rep to see their day.":"Choose your name so the day is logged against you."}</p>
      ${e.reps.length?`<div class="pickgrid">${e.reps.map(c=>`<button class="pick" data-pickrep="${u(c.id)}">${u(c.name||"Unnamed")}</button>`).join("")}</div>`:'<p class="fine">No one is on the roster yet. Add the team in the manager view first.</p>'}
    </div></div>`;return}S(e,s);const o=$(e,s,h());i.lastRep!==s&&(i.lastRep=s,i.editDate=null);const l=i.editDate&&i.editDate<=h()?i.editDate:h(),p=$(e,s,l)||{d:0,p:0,c:0,sale:0},b=U(e,s),r=w(b),m=j(e,s),g=O(e,s),R=E(h()),f=g[R]||{d:0,p:0,c:0,sale:0,days:0},T=w(f),k=w({...o,days:1});t.innerHTML=`
  <div class="repwrap">
    <div class="rephead">
      <div>
        <div class="rname">${u(n.name||"Unnamed")}</div>
        <div class="rsub">${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>
      </div>
      ${e.cloud&&e.cloud.token&&e.cloud.role==="rep"?'<button class="ghost sm" data-cl="leave">Sign out</button>':e.cloud&&e.cloud.role==="manager"?'<button class="ghost sm" data-view="manager">Back to team</button>':'<button class="ghost sm" data-switchrep="1">Not you</button>'}
    </div>

    ${e.cloud&&e.cloud.role==="manager"?`<div class="viewing">You are looking at ${u(n.name||"this rep")}'s day. Taps here change their numbers.</div>
    <details class="editrep" data-rep="${u(n.id)}"><summary>Rename or remove this rep</summary>
      <label class="fine">Name <input data-repf="name" value="${u(n.name||"")}" autocomplete="off"></label>
      <label class="fine">Market <input data-repf="market" value="${u(n.market||"")}" placeholder="Optional" autocomplete="off"></label>
      <div class="rowbtns"><button class="ghost danger" data-delrep="${u(n.id)}">Remove from team</button></div>
    </details>`:""}
    ${e.cloud&&e.cloud.role==="manager"?"":A("rep-day","After every conversation, tap the furthest step it reached. S fills in the rest.")}
    ${e.cloud&&e.cloud.role==="manager"?"":i.undo.length?A("rep-undo","Wrong tap? Press Undo last tap."):""}
    ${V(e,s)}
    ${ee(m,f,!!(e.cloud&&e.cloud.role==="manager"))}

    <div class="taps">
      ${C.map(c=>ae(c,o,k)).join("")}
    </div>
    ${se(o)}
    ${Y(e,s)}
    ${H(e,s,o)}
    ${i.undo.some(c=>c.repId===s&&c.date===h())?'<button class="ghost sm undotap" data-undotap="1">Undo last tap</button>':""}
    ${J(e,s)}

    ${I(e,s)}

    <div class="card">
      <h4>Where today is breaking down</h4>
      ${M("D to presentation",k.dToP,o.d,o.p)}
      ${M("Presentation to ask",k.pToC,o.p,o.c)}
      ${M("Ask to sale",k.cToSale,o.c,o.sale)}
      <p class="fine">Each bar is the share that made it from the step before, today only.
      Not yet means you have not reached that step, which is not the same as zero.</p>
    </div>

    <div class="card">
      <h4>This week so far</h4>
      <div class="wgrid">
        ${v("D",y(f.d))}
        ${v("Presentations",y(f.p))}
        ${v("Asked",y(f.c))}
        ${v("Sales",y(f.sale),!0)}
      </div>
      <div class="wgrid2">
        ${v("Ask rate",D(T.pToC))}
        ${v("Ask to sale",D(T.cToSale))}
        ${v("D per sale",_(T.doorsPerSale))}
        ${v("Days worked",y(f.days))}
      </div>
      <p class="fine">Week of ${L(R)}. Rates are totals over totals, not an average of your days.</p>
    </div>

    <div class="card">
      <h4>Note for today</h4>
      <textarea data-note="1" rows="2" maxlength="500" placeholder="Anything worth remembering about today">${u(o.note||"")}</textarea>
    </div>

    <details class="card" data-editbox="1" ${i.editOpen?"open":""}>
      <summary>Fix a number or log a past day</summary>
      <div class="editgrid">
        <label>Date<input type="date" data-editdate="1" value="${l}" max="${h()}"></label>
        ${C.map(c=>`<label>${c.label}<input type="text" inputmode="numeric" data-editk="${c.key}" value="${d(p[c.key])}"></label>`).join("")}
      </div>
      ${Z(p)}
      <p class="fine">${l===h()?"Pick a past date to load that day and correct it without touching today.":"Editing "+new Date(l+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})+". Today is untouched."}</p>
    </details>

    ${e.cloud&&e.cloud.token?"":`<div class="card">
      <h4>Send your numbers to your manager</h4>
      <p class="fine">Your numbers save on this phone only. Tap this at the end of the day and text the link to your manager so your day counts on the team board.</p>
      <div class="rowbtns"><button class="primary" data-sendmine="1">Send my numbers</button>
      <button class="ghost" data-backup="1">Back up this phone</button></div>
    </div>`}

    <details class="card" data-remindbox="1" ${i.remindOpen?"open":""}>
      <summary>Your reminders</summary>
      <div data-remindhost="1"></div>
    </details>

    <div class="card">
      <h4>Your last days</h4>
      ${ne(e,s)}
    </div>
    ${Q(e,s)}
    ${X(e,s)}
    ${W()}
    ${F()}
  </div>`}function Z(t){const e=d(t.d),a=d(t.p),s=d(t.c),n=d(t.sale),o=a>e?"More presentations than D":s>a?"More asks than presentations":n>s?"More sales than asks":"";return o?`<p class="fine warnline">${o}. Check the numbers for this day.</p>`:""}function I(t,e){const a=G(t,e);if(!a)return"";const s=z(t,e,a),n=K(t,e);return`<div class="sc-focus${n?" due":""}">
    <p class="sc-focus-l">Your focus right now</p>
    <p class="sc-focus-t">${u(a.text)}</p>
    ${a.how?`<p class="sc-focus-how">${u(a.how)}</p>`:""}
    ${n?`<p class="sc-focus-due">${s} D since you locked this in. Did you run it?</p>
         <div class="sc-row"><button class="btn-primary" data-repfocus="yes">Yes, I ran it</button><button class="btn-secondary" data-repfocus="no">Not yet</button></div>`:`<p class="sc-focus-meta">${s} of ${q} D until your check in.</p>`}
  </div>`}function ee(t,e,a){const s=a?String(t.reason||"").replace("against you","against them"):t.reason,n=e.sale+" sale"+(e.sale===1?"":"s")+" this week";if(t.unset)return`<div class="standing neutral">
    <div class="sthead">This week</div>
    <div class="stbody"><b>${e.sale}</b> sale${e.sale===1?"":"s"} this week.</div>
    <div class="fine">${a?"You have not set the team standards yet.":"Your manager has not set the team standards yet."}</div>
  </div>`;if(!t.flagged&&!t.atRisk&&t.targetThisWeek>0&&t.needThisWeek===0)return`<div class="standing good">
    <div class="sthead">This week</div>
    <div class="stbody"><b>${e.sale}</b> sale${e.sale===1?"":"s"} this week. Team minimum cleared.</div>
  </div>`;const l=t.flagged?"bad":t.atRisk?"warn":"good",p=t.flagged?"Flagged":t.atRisk?"At risk this week":"This week",b=t.needThisWeek;return`<div class="standing ${l}">
    <div class="sthead">${p}</div>
    <div class="stbody">${u(s)}</div>
    <div class="stbar">
      ${t.targetThisWeek>0&&t.targetThisWeek<=15?Array.from({length:t.targetThisWeek},(r,m)=>`<span class="pip ${m<e.sale?"on":""}"></span>`).join(""):""}
      <span class="stcount">${n}</span>
    </div>
    <div class="fine">${t.targetThisWeek===0?"Team minimum: "+P()+(a?". It counts once they log their first conversation.":". It counts once you log your first conversation."):b+" more "+(b===1?"sale":"sales")+" clears the team minimum of "+P()+"."}</div>
  </div>`}function te(t){return String(t.stMbps||"").split(",").map(e=>parseFloat(e)).filter(e=>e>0)}function se(t){const e=d(t.st),a=te(t),s=a.length?Math.round(a.reduce((o,l)=>o+l,0)/a.length):null,n=e===0?"Tap after every speed test you run. Ask first, show the real result. WiFi can affect it.":s!==null?"Average "+s+" Mbps. Last "+a[a.length-1]+" Mbps.":"No speeds entered.";return`<div class="tap speedtap">
    <div class="tapl">
      <span class="tletter">ST</span>
      <span class="tlabel">Speed tests today</span>
    </div>
    <div class="tapv">${e}</div>
    <div class="tapsub">${u(n)}</div>
    <div class="taprow">
      <button class="minus" data-speed="-1" aria-label="Remove one speed test">−</button>
      <button class="plus" data-speed="1" aria-label="Clock a speed test">+</button>
    </div>
  </div>`}function ge(t,e,a,s){S(t,e);const n=$(t,e,h());n.st=Math.max(0,d(n.st)+a);let o=String(n.stMbps||"").split(",").filter(l=>l!=="");if(a>0){const l=parseFloat(s);l>0&&l<1e5&&o.push(String(Math.round(l*10)/10))}for(;o.length>n.st;)o.pop();return n.stMbps=o.join(",").slice(0,2e3),t}function ae(t,e,a){const s=d(e[t.key]),n=t.key==="p"?x(a.dToP,"of D"):t.key==="c"?x(a.pToC,"of presentations"):t.key==="sale"?x(a.cToSale,"of asks"):t.key==="d"?"You got a conversation":"";return`<div class="tap ${t.key==="c"?"accentedge":""}">
    <div class="tapl">
      <span class="tletter">${t.letter}</span>
      <span class="tlabel">${t.label}</span>
    </div>
    <div class="tapv">${s}</div>
    <div class="tapsub">${n||t.help}</div>
    <div class="taprow">
      <button class="minus" data-bump="${t.key}" data-by="-1" aria-label="Remove one ${t.label}">−</button>
      <button class="plus" data-bump="${t.key}" data-by="1" aria-label="Add one ${t.label}">+</button>
    </div>
  </div>`}function x(t,e){return t===null?"":(t*100).toFixed(0)+"% "+e}function M(t,e,a,s){const n=e===null?0:Math.max(0,Math.min(1,e))*100;return`<div class="brow">
    <div class="blab">${t}</div>
    <div class="btrack"><div class="bfill" style="width:${n.toFixed(1)}%"></div></div>
    <div class="bval">${e===null?"not yet":(e*100).toFixed(0)+"%"}</div>
    <div class="bfrac">${s} of ${a}</div>
  </div>`}function v(t,e,a){return`<div class="wcell"><div class="wv ${a?"accent":""}">${e}</div><div class="wl">${t}</div></div>`}function ne(t,e){const a=N(t,e).slice(0,14);return a.length?`<div class="scroll"><table class="hist">
    <thead><tr><th>Date</th><th class="num">D</th><th class="num">P</th><th class="num">Tests</th><th class="num">Asked</th><th class="num">Sales</th><th class="num">Ask rate</th></tr></thead>
    <tbody>${a.map(s=>{const n=w({...s,days:1});return`<tr><td>${new Date(s.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
      <td class="num">${d(s.d)}</td><td class="num">${d(s.p)}</td><td class="num">${d(s.st)}</td>
      <td class="num">${d(s.c)}</td><td class="num accent">${d(s.sale)}</td>
      <td class="num">${D(n.pToC)}</td></tr>`}).join("")}</tbody></table></div>`:'<p class="fine">Nothing logged yet.</p>'}function u(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}export{fe as bump,S as ensureToday,u as esc,ye as renderRep,i as repUI,ge as speedBump,$e as undoTap};
