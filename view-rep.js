/*! Copyright 2026 David Borske. All rights reserved. */
import{tipHtml as P}from"./guide.js";import{dayPlanHtml as W}from"./playbook.js";import{goalHtml as M}from"./goal.js";import{today as p,weekStart as F,weekLabel as H,repEntries as E,repTotals as U,weekTotals as L,rates as w,flagState as N,fmtPct as D,fmtNum as $,fmt1 as O,num as i,uid as j,minText as A}from"./model.js";import{getFocus as _,recheckDue as B,RECHECK_AFTER_D as G,sinceFocus as K}from"./selfcheck.js";import{callbackHtml as q}from"./callbacks.js";import{timeOffHtml as z,offTodayHtml as J}from"./timeoff.js";import{eventsHtml as Q}from"./events.js";const C=[{key:"d",letter:"D",label:"Made contact",help:"You made contact at the door."},{key:"p",letter:"P",label:"Presentation",help:"You presented."},{key:"c",letter:"C",label:"Close (ask for business)",help:"You asked. This is not the sale."},{key:"sale",letter:"S",label:"Sale",help:"They said yes."}],d={editDate:null,editOpen:!1,remindOpen:!1,lastRep:null,undo:[]};function b(t,e,s){return(t.entries[e]||[]).find(o=>o.date===s)||null}function Y(t,e){const s=p();return t.entries[e]||(t.entries[e]=[]),b(t,e,s)||t.entries[e].push({id:j(),date:s,d:0,p:0,c:0,sale:0,note:""}),t}function pe(t,e,s,a){Y(t,e);const o=b(t,e,p());d.lastRep!==e&&(d.lastRep=e,d.editDate=null);const n=d.editDate&&d.editDate<=p()?d.editDate:p(),v=b(t,e,n)||{d:0,p:0,c:0,sale:0},c=["d","p","c","sale"],f=c.indexOf(s);if(a>0){for(let l=0;l<=f;l++)o[c[l]]=i(o[c[l]])+a;d.undo.push({repId:e,date:o.date,key:s}),d.undo.length>50&&d.undo.shift()}else{const l=c[f+1];if(l&&i(o[l])>i(o[s])+a)return d.blocked={d:"P",p:"C",c:"S"}[s]||"",t;o[s]=Math.max(0,i(o[s])+a),d.undo=d.undo.filter(m=>!(m.repId===e&&m.date===o.date))}for(let l=1;l<c.length;l++){const m=c[l-1],k=c[l];i(o[k])>i(o[m])&&(o[k]=i(o[m]))}return t}function me(t){const e=d.undo.pop();if(!e)return t;const s=b(t,e.repId,e.date);if(!s)return t;const a=["d","p","c","sale"],o=a.indexOf(e.key);for(let n=0;n<=o;n++)s[a[n]]=Math.max(0,i(s[a[n]])-1);for(let n=1;n<a.length;n++)i(s[a[n]])>i(s[a[n-1]])&&(s[a[n]]=i(s[a[n-1]]));return t}function he(t,e,s){const a=e.activeRep,o=e.reps.find(r=>r.id===a);if(!o){t.innerHTML=`<div class="pad"><div class="empty">
      <h3>${e.cloud&&e.cloud.role==="manager"&&e.cloud.token?"Your reps":"Pick who you are"}</h3>
      <p>${e.cloud&&e.cloud.role==="manager"&&e.cloud.token?"Pick a rep to see their day.":"Choose your name so the day is logged against you."}</p>
      ${e.reps.length?`<div class="pickgrid">${e.reps.map(r=>`<button class="pick" data-pickrep="${u(r.id)}">${u(r.name||"Unnamed")}</button>`).join("")}</div>`:'<p class="fine">No one is on the roster yet. Add the team in the manager view first.</p>'}
    </div></div>`;return}Y(e,a);const n=b(e,a,p());d.lastRep!==a&&(d.lastRep=a,d.editDate=null);const v=d.editDate&&d.editDate<=p()?d.editDate:p(),c=b(e,a,v)||{d:0,p:0,c:0,sale:0},f=U(e,a),l=w(f),m=N(e,a),k=L(e,a),R=F(p()),y=k[R]||{d:0,p:0,c:0,sale:0,days:0},T=w(y),g=w({...n,days:1});t.innerHTML=`
  <div class="repwrap">
    <div class="rephead">
      <div>
        <div class="rname">${u(o.name||"Unnamed")}</div>
        <div class="rsub">${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>
      </div>
      ${e.cloud&&e.cloud.token&&e.cloud.role==="rep"?'<button class="ghost sm" data-cl="leave">Sign out</button>':e.cloud&&e.cloud.role==="manager"?'<button class="ghost sm" data-view="manager">Back to team</button>':'<button class="ghost sm" data-switchrep="1">Not you</button>'}
    </div>

    ${e.cloud&&e.cloud.role==="manager"?`<div class="viewing">You are looking at ${u(o.name||"this rep")}'s day. Taps here change their numbers.</div>
    <details class="editrep" data-rep="${u(o.id)}"><summary>Rename or remove this rep</summary>
      <label class="fine">Name <input data-repf="name" value="${u(o.name||"")}" autocomplete="off"></label>
      <label class="fine">Market <input data-repf="market" value="${u(o.market||"")}" placeholder="Optional" autocomplete="off"></label>
      <div class="rowbtns"><button class="ghost danger" data-delrep="${u(o.id)}">Remove from team</button></div>
    </details>`:""}
    ${e.cloud&&e.cloud.role==="manager"?"":P("rep-day","After every conversation, tap the furthest step it reached. S fills in the rest.")}
    ${e.cloud&&e.cloud.role==="manager"?"":d.undo.length?P("rep-undo","Wrong tap? Press Undo last tap."):""}
    ${J(e,a)}
    ${Z(m,y,!!(e.cloud&&e.cloud.role==="manager"))}

    <div class="taps">
      ${C.map(r=>I(r,n,g)).join("")}
    </div>
    ${M(e,a,n)}
    ${d.undo.some(r=>r.repId===a&&r.date===p())?'<button class="ghost sm undotap" data-undotap="1">Undo last tap</button>':""}
    ${q(e,a)}

    ${X(e,a)}

    <div class="card">
      <h4>Where today is breaking down</h4>
      ${x("D to presentation",g.dToP,n.d,n.p)}
      ${x("Presentation to ask",g.pToC,n.p,n.c)}
      ${x("Ask to sale",g.cToSale,n.c,n.sale)}
      <p class="fine">Each bar is the share that made it from the step before, today only.
      Not yet means you have not reached that step, which is not the same as zero.</p>
    </div>

    <div class="card">
      <h4>This week so far</h4>
      <div class="wgrid">
        ${h("D",$(y.d))}
        ${h("Presentations",$(y.p))}
        ${h("Asked",$(y.c))}
        ${h("Sales",$(y.sale),!0)}
      </div>
      <div class="wgrid2">
        ${h("Ask rate",D(T.pToC))}
        ${h("Ask to sale",D(T.cToSale))}
        ${h("D per sale",O(T.doorsPerSale))}
        ${h("Days worked",$(y.days))}
      </div>
      <p class="fine">Week of ${H(R)}. Rates are totals over totals, not an average of your days.</p>
    </div>

    <div class="card">
      <h4>Note for today</h4>
      <textarea data-note="1" rows="2" maxlength="500" placeholder="Anything worth remembering about today">${u(n.note||"")}</textarea>
    </div>

    <details class="card" data-editbox="1" ${d.editOpen?"open":""}>
      <summary>Fix a number or log a past day</summary>
      <div class="editgrid">
        <label>Date<input type="date" data-editdate="1" value="${v}" max="${p()}"></label>
        ${C.map(r=>`<label>${r.label}<input type="text" inputmode="numeric" data-editk="${r.key}" value="${i(c[r.key])}"></label>`).join("")}
      </div>
      ${V(c)}
      <p class="fine">${v===p()?"Pick a past date to load that day and correct it without touching today.":"Editing "+new Date(v+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})+". Today is untouched."}</p>
    </details>

    ${e.cloud&&e.cloud.token?"":`<div class="card">
      <h4>Send your numbers to your manager</h4>
      <p class="fine">Your numbers save on this phone only. Tap this at the end of the day and text the link to your manager so your day counts on the team board.</p>
      <div class="rowbtns"><button class="primary" data-sendmine="1">Send my numbers</button>
      <button class="ghost" data-backup="1">Back up this phone</button></div>
    </div>`}

    <details class="card" data-remindbox="1" ${d.remindOpen?"open":""}>
      <summary>Your reminders</summary>
      <div data-remindhost="1"></div>
    </details>

    <div class="card">
      <h4>Your last days</h4>
      ${ee(e,a)}
    </div>
    ${z(e,a)}
    ${Q(e,a)}
    ${W()}
  </div>`}function V(t){const e=i(t.d),s=i(t.p),a=i(t.c),o=i(t.sale),n=s>e?"More presentations than D":a>s?"More asks than presentations":o>a?"More sales than asks":"";return n?`<p class="fine warnline">${n}. Check the numbers for this day.</p>`:""}function X(t,e){const s=_(t,e);if(!s)return"";const a=K(t,e,s),o=B(t,e);return`<div class="sc-focus${o?" due":""}">
    <p class="sc-focus-l">Your focus right now</p>
    <p class="sc-focus-t">${u(s.text)}</p>
    ${s.how?`<p class="sc-focus-how">${u(s.how)}</p>`:""}
    ${o?`<p class="sc-focus-due">${a} D since you locked this in. Did you run it?</p>
         <div class="sc-row"><button class="btn-primary" data-repfocus="yes">Yes, I ran it</button><button class="btn-secondary" data-repfocus="no">Not yet</button></div>`:`<p class="sc-focus-meta">${a} of ${G} D until your check in.</p>`}
  </div>`}function Z(t,e,s){const a=s?String(t.reason||"").replace("against you","against them"):t.reason,o=e.sale+" sale"+(e.sale===1?"":"s")+" this week";if(t.unset)return`<div class="standing neutral">
    <div class="sthead">This week</div>
    <div class="stbody"><b>${e.sale}</b> sale${e.sale===1?"":"s"} this week.</div>
    <div class="fine">${s?"You have not set the team standards yet.":"Your manager has not set the team standards yet."}</div>
  </div>`;if(!t.flagged&&!t.atRisk&&t.targetThisWeek>0&&t.needThisWeek===0)return`<div class="standing good">
    <div class="sthead">This week</div>
    <div class="stbody"><b>${e.sale}</b> sale${e.sale===1?"":"s"} this week. Team minimum cleared.</div>
  </div>`;const v=t.flagged?"bad":t.atRisk?"warn":"good",c=t.flagged?"Flagged":t.atRisk?"At risk this week":"This week",f=t.needThisWeek;return`<div class="standing ${v}">
    <div class="sthead">${c}</div>
    <div class="stbody">${u(a)}</div>
    <div class="stbar">
      ${t.targetThisWeek>0&&t.targetThisWeek<=15?Array.from({length:t.targetThisWeek},(l,m)=>`<span class="pip ${m<e.sale?"on":""}"></span>`).join(""):""}
      <span class="stcount">${o}</span>
    </div>
    <div class="fine">${t.targetThisWeek===0?"Team minimum: "+A()+(s?". It counts once they log their first conversation.":". It counts once you log your first conversation."):f+" more "+(f===1?"sale":"sales")+" clears the team minimum of "+A()+"."}</div>
  </div>`}function I(t,e,s){const a=i(e[t.key]),o=t.key==="p"?S(s.dToP,"of D"):t.key==="c"?S(s.pToC,"of presentations"):t.key==="sale"?S(s.cToSale,"of asks"):t.key==="d"?"You got a conversation":"";return`<div class="tap ${t.key==="c"?"accentedge":""}">
    <div class="tapl">
      <span class="tletter">${t.letter}</span>
      <span class="tlabel">${t.label}</span>
    </div>
    <div class="tapv">${a}</div>
    <div class="tapsub">${o||t.help}</div>
    <div class="taprow">
      <button class="minus" data-bump="${t.key}" data-by="-1" aria-label="Remove one ${t.label}">−</button>
      <button class="plus" data-bump="${t.key}" data-by="1" aria-label="Add one ${t.label}">+</button>
    </div>
  </div>`}function S(t,e){return t===null?"":(t*100).toFixed(0)+"% "+e}function x(t,e,s,a){const o=e===null?0:Math.max(0,Math.min(1,e))*100;return`<div class="brow">
    <div class="blab">${t}</div>
    <div class="btrack"><div class="bfill" style="width:${o.toFixed(1)}%"></div></div>
    <div class="bval">${e===null?"not yet":(e*100).toFixed(0)+"%"}</div>
    <div class="bfrac">${a} of ${s}</div>
  </div>`}function h(t,e,s){return`<div class="wcell"><div class="wv ${s?"accent":""}">${e}</div><div class="wl">${t}</div></div>`}function ee(t,e){const s=E(t,e).slice(0,14);return s.length?`<div class="scroll"><table class="hist">
    <thead><tr><th>Date</th><th class="num">D</th><th class="num">P</th><th class="num">Asked</th><th class="num">Sales</th><th class="num">Ask rate</th></tr></thead>
    <tbody>${s.map(a=>{const o=w({...a,days:1});return`<tr><td>${new Date(a.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
      <td class="num">${i(a.d)}</td><td class="num">${i(a.p)}</td>
      <td class="num">${i(a.c)}</td><td class="num accent">${i(a.sale)}</td>
      <td class="num">${D(o.pToC)}</td></tr>`}).join("")}</tbody></table></div>`:'<p class="fine">Nothing logged yet.</p>'}function u(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}export{pe as bump,Y as ensureToday,u as esc,he as renderRep,d as repUI,me as undoTap};
