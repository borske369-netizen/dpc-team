/*! Copyright 2026 David Borske. All rights reserved. */
import{tipHtml as N}from"./guide.js";import{teamTotals as A,weakestStage as O,flagState as B,weekTotals as w,weekSpan as W,weekLabel as U,isCurrentWeek as E,rates as I,repTotals as S,fmtPct as b,fmtNum as m,fmt1 as H,num as k,newRep as G,FLAG_RULE as g,today as $,weekStart as T,repFirstWeek as Y,MIN_DOORS_FOR_DIAGNOSIS as F,weekTarget as _,minText as z,offAllWeek as K,sumEntries as V,isOff as q}from"./model.js";import{offTodayTeamLine as J,rosterOffHtml as Q}from"./timeoff.js";import{rosterPatternHtml as X}from"./events.js";import{esc as p}from"./view-rep.js";import{subjectLabel as Z}from"./control.js";import{teamMisses as x,dayActivity as tt}from"./selfcheck.js";import{teamReport as et,dueReport as st}from"./reports.js";const L={report:null};function yt(t,e,o){const s=A(e),a=O(s.per),n=st(e),r=L.report?et(e,L.report):null;t.innerHTML=`
  <div class="mgr">
    ${r?at(r,e):""}
    ${!r&&n?`<button class="duebar" data-report="${p(n.kind)}" data-duekey="${p(n.key)}">
      <span class="duedot" aria-hidden="true"></span><span>${p(n.label)}</span><span class="duego">Open</span></button>`:""}
    ${s.flagged.length||s.atRisk.length?rt(s):""}

    <div class="kpis">
      ${v("Active reps",m(s.activeCount),e.reps.length+" on the roster")}
      ${v("D",m(s.t.d),"Made contact, all time")}
      ${v("P",m(s.t.p),"Presentations, "+b(s.r.dToP)+" of D")}
      ${v("C",m(s.t.c),"Asked for the business, "+b(s.r.pToC)+" of P",!0)}
      ${v("S",m(s.t.sale),"Sales, "+b(s.r.cToSale)+" of C")}
      ${v("D per sale",H(s.r.doorsPerSale),"Team wide")}
    </div>


    <div class="card">
      <h4>${P(e)?"Team":"Your reps"}</h4>
      ${J(e)}
      <p class="fine">${lt(e)} Most sales this week on top.${P(e)?"":" Tap a name to see that rep's day."}</p>
      <div class="scroll">
        <table class="roster">
          <thead><tr>
            <th>Rep</th><th class="num">Today</th><th class="num">Week</th>
            <th class="num">D</th><th class="num">P</th><th class="num">C</th><th class="num">S</th>
          </tr></thead>
          <tbody>${dt(e).map(l=>ct(e,l,a)).join("")||`<tr><td colspan="7"><div class="empty"><h3>No reps yet</h3>
             <p>Add your reps at the top of this page.</p></div></td></tr>`}</tbody>
        </table>
      </div>
      <div class="rowbtns mgr-only">
        ${e.cloud&&e.cloud.token?"":`<button class="primary" data-addrep="1">Add a rep</button>
        <button class="ghost" data-seed="1">Load example team</button>`}
        <button class="ghost" data-exportcsv="1">Export CSV</button>
      </div>
    </div>

    <div class="card mgr-only">
      <h4>Reports</h4>
      <p class="fine">Pick one to text, email or save it.</p>
      <div class="rowbtns">
        <button class="primary" data-report="day">Today</button>
        <button class="ghost" data-report="week">This week so far</button>
        <button class="ghost" data-report="lastweek">Last week</button>
        <button class="ghost" data-report="twoweeks">This week and last</button>
        <button class="ghost" data-report="lasttwo">Last 2 full weeks</button>
        <button class="ghost" data-report="month">This month so far</button>
        <button class="ghost" data-report="lastmonth">Last month</button>
      </div>
      <label class="rp-email">Email reports to
        <input type="email" data-reportemail="1" value="${p(e.reportEmail||"")}" placeholder="partner@example.com, you@example.com" autocomplete="email">
      </label>
    </div>

    ${nt(e)}
    ${ot(e,o)}

    ${e.cloud&&e.cloud.token?"":`<div class="card">
      <h4>Backup</h4>
      <p class="fine">Saves everything on this phone to one file, including the private Recruiting tab. Keep it somewhere safe.
      Restoring on a new or reset phone brings it all back.</p>
      <div class="rowbtns">
        <button class="ghost" data-backup="1">Back up this phone</button>
        <label class="ghost btnlike">Restore from backup<input type="file" accept=".json,application/json" data-restore="1" hidden></label>
      </div>
      ${e.lastBackup?`<p class="fine">Last backup ${new Date(e.lastBackup).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}.</p>`:'<p class="fine warnline">This phone has never been backed up.</p>'}
    </div>`}

    ${e.cloud&&e.cloud.token?"":`
    <div class="card mgr-only">
      <h4>Share and collect</h4>
      <p class="fine">Each phone keeps its own numbers. Send the team link so reps can pick their name and start.
      When a rep texts you their numbers link, tap it, or paste it here if the tracker is saved to your home screen.</p>
      <div class="rowbtns"><button class="primary" data-shareteam="1">Send team link</button></div>
      <div class="importrow">
        <textarea data-importbox="1" rows="2" placeholder="Paste a rep's numbers link" aria-label="Paste a rep's numbers link"></textarea>
        <button class="ghost" data-importpaste="1">Add to team</button>
      </div>
    `}
    </div>

    ${a?pt(s,a):""}

    <div class="card mgr-only">
      <h4>${g.set?"Weeks against the standard":"Sales by week"}</h4>
      ${ut(e)}
      <p class="fine">${g.set?`Sales per week. Team minimum: ${z()}. ${g.weeks} week${g.weeks===1?"":"s"} in a row under it flags the rep.`:"Sales per week. No team standards yet, so nobody is flagged."} Off means time off all week.</p>
    </div>
  </div>`}function at(t,e){return`<div class="card rp-wrap">
    <div class="rp-actions">
      <button class="primary" data-rpshare="1">Text or share</button>
      <button class="ghost" data-rpemail="1">Email</button>
      <button class="ghost" data-rpcopy="1">Copy</button>
      <button class="ghost" data-rpprint="1">Save as PDF</button>
      <button class="ghost" data-rpclose="1">Close</button>
    </div>
    ${t.html}
  </div>`}function ot(t,e){const o=e&&typeof e.getBoardModule=="function"?e.getBoardModule():null;if(!o||!o.getBoard)return"";const s=o.getBoard(t),a=c=>{for(const i of["d","p","c","a"]){const d=((s.columns[i]||{}).items||[]).find(u=>u.id===c);if(d)return d.text}return""},n=$(),r=(t.reps||[]).map(c=>({r:c,a:tt(t,c.id,n,a)})).filter(c=>c.a.lines.length),l=x(t,c=>a(c));return`<div class="card mgr-only">
    <h4>What reps asked the game board today</h4>
    ${r.length?r.map(({r:c,a:i})=>{const d=[];return i.by.safety&&d.push(`${i.by.safety} safety`),i.by.nocontrol&&d.push(`${i.by.nocontrol} outside their control`),i.by.coach&&d.push(`${i.by.coach} coaching`),i.by.objection&&d.push(`${i.by.objection} objection${i.by.objection===1?"":"s"}`),i.by.out&&d.push(`${i.by.out} out of bounds`),i.by.in&&d.push(`${i.by.in} on the board`),`<details class="gb-rep">
        <summary><b>${p(c.name||"Unnamed")}</b> looked for help ${i.searches} time${i.searches===1?"":"s"} today. <span class="fine">Tap to see what they typed.</span>${d.length?`<br><span class="fine">${d.join(", ")}</span>`:""}
        ${i.miss.length?`<br><span class="gb-fix">Working on: ${p(i.miss.join(", "))}</span>`:""}
        ${i.ranIt||i.notYet?`<br><span class="fine">Focus check ins: ${i.ranIt} ran it, ${i.notYet} not yet.</span>`:""}</summary>
        <ol class="gb-lines">${i.lines.map(u=>`<li>${p(u)}</li>`).join("")}</ol>
      </details>`}).join(""):'<p class="fine">No one has used the game board today. When a rep types what is going wrong, it shows here.</p>'}
    ${l.team.length?`<p class="fine">This week the team keeps missing: ${l.team.map(c=>`<b>${p(c.text)}</b> (${c.n})`).join(", ")}.</p>`:""}
  </div>`}function nt(t){const e=t.control&&Array.isArray(t.control.log)?t.control.log:[],o=new Date(Date.now()-7*864e5),s=o.getFullYear()+"-"+String(o.getMonth()+1).padStart(2,"0")+"-"+String(o.getDate()).padStart(2,"0"),a=t.reps.map(n=>{const r=e.filter(d=>d.v==="nocontrol"&&d.rep===n.id&&d.day>=s);if(!r.length)return null;const l={};r.forEach(d=>{const u=d.subject||"other";l[u]=(l[u]||0)+1});const c=Object.keys(l).sort((d,u)=>l[u]-l[d])[0],i=r.slice().sort((d,u)=>d.at<u.at?1:-1)[0];return{name:n.name||"Unnamed",n:r.length,top:c,topN:l[c],last:i&&i.text}}).filter(Boolean).sort((n,r)=>r.n-n.n);return a.length?`<div class="card mgr-only">
    <h4>Stuck on things they cannot control, last 7 days</h4>
    ${N("mgr-coach","Same worry three times means it is time for a one on one.")}
    <div class="diag">${a.map(n=>`
      <div class="drow ${n.topN>=3?"attn":""}">
        <div class="dname">${p(n.name)}</div>
        <div class="dtext"><b>${n.n}</b> time${n.n===1?"":"s"} focused on something outside their control.
        Most often: <b>${p(Z(n.top))}</b> (${n.topN}).${n.last?` Latest: "${p(n.last)}"`:""}
        ${n.topN>=3?" Same subject three or more times. That is the coaching conversation.":""}</div>
      </div>`).join("")}</div>

  </div>`:""}function rt(t){const e=[];return t.flagged.length&&e.push(`<b>${t.flagged.length}</b> flagged`),t.atRisk.length&&e.push(`<b>${t.atRisk.length}</b> at risk this week`),`<div class="alert mgr-only">
    <div class="alerthead">${e.join(" and ")}</div>
    <div class="alertbody">${t.flagged.concat(t.atRisk).map(o=>`<span class="chip ${o.flag.flagged?"bad":"warn"}">${p(o.rep.name||"Unnamed")} <span class="chipsub">${p(o.flag.reason)}</span></span>`).join("")}</div>
  </div>`}function v(t,e,o,s){return`<div class="kpi ${s?"accent":""}">
    <div class="klab">${t}</div><div class="kval">${e}</div><div class="ksub">${o}</div></div>`}function wt(t){const e=Math.max(t.t.d,1);return`<div class="fun">${[["D",t.t.d,null],["Presentations",t.t.p,t.r.dToP],["Close (ask for business)",t.t.c,t.r.pToC],["Sales",t.t.sale,t.r.cToSale]].map(([s,a,n],r)=>`
    <div class="frow">
      <div class="flab">${s}</div>
      <div class="ftrack"><div class="ffill ${r===2?"ask":""} ${r===3?"sale":""}" style="width:${(a/e*100).toFixed(1)}%"></div></div>
      <div class="fval">${m(a)}</div>
      <div class="fconv">${n===null?"":b(n)+" of the step above"}</div>
    </div>`).join("")}</div>`}function y(t,e){const o=$();return(t.entries[e]||[]).filter(s=>s.date===o).reduce((s,a)=>s+(Number(a.sale)||0),0)}function it(t,e){if(new Date().getHours()<11)return!1;const o=$();return q(e,o)?!1:!(t.entries[e]||[]).some(s=>s.date===o&&(Number(s.d)||0)>0)}function lt(t){const e=(t.reps||[]).reduce((o,s)=>o+y(t,s.id),0);return"Team today: "+e+" sale"+(e===1?"":"s")+"."}function dt(t){const e=T($()),o=s=>{const a=w(t,s)[e];return a?a.sale:0};return t.reps.slice().sort((s,a)=>o(a.id)-o(s.id)||y(t,a.id)-y(t,s.id)||S(t,a.id).sale-S(t,s.id).sale)}function P(t){return t.cloud&&t.cloud.role?t.cloud.role==="rep":t.role==="rep"}function ct(t,e,o){const s=S(t,e.id),a=I(s),n=B(t,e.id),l=w(t,e.id)[T($())],c=l?l.sale:0,i=(u,h)=>!o||h===null?`<td class="num">${u}</td>`:`<td class="num ${h<o*.8?"low":""}">${u}</td>`,d=P(t)?`<span class="rname-plain">${p(e.name||"Unnamed")}</span>`:`<button class="linkbtn" data-openrep="${p(e.id)}">${p(e.name||"Unnamed")}</button>`;return`<tr data-rep="${p(e.id)}">
    <td>${d}${n.flagged?' <span class="pill bad mgr-only">Flagged</span>':n.atRisk?' <span class="pill warn mgr-only">At risk</span>':""}${Q(t,e.id)}${X(t,e.id)}</td>
    <td class="num">${m(y(t,e.id))}${it(t,e.id)?'<br><span class="fine mgr-only">not started</span>':""}</td>
    <td class="num accent">${c}</td>
    <td class="num">${m(s.d)}</td>
    <td class="num">${m(s.p)}</td>
    <td class="num">${m(s.c)}</td>
    <td class="num">${m(s.sale)}</td>
  </tr>`}function pt(t,e){return`<div class="card mgr-only">
    <h4>Where each person is leaking</h4>
    <div class="diag">${t.per.filter(s=>s.t.d>=F).map(s=>{const a=[{stage:"getting into presentations",val:s.r.dToP,med:e.dToP,fix:"the door approach"},{stage:"asking for the business",val:s.r.pToC,med:e.pToC,fix:"the ask itself"},{stage:"landing the sale after asking",val:s.r.cToSale,med:e.cToSale,fix:"handling what comes back after the ask"}].filter(l=>l.val!==null&&l.med!==null&&l.med>0);if(!a.length)return null;const n=a.reduce((l,c)=>c.val/c.med<l.val/l.med?c:l),r=n.val/n.med;return{name:s.rep.name||"Unnamed",worst:n,ratio:r,flagged:s.flag.flagged}}).filter(Boolean).sort((s,a)=>s.ratio-a.ratio).map(s=>`
      <div class="drow ${s.ratio<.8?"attn":""}">
        <div class="dname">${p(s.name)}</div>
        <div class="dtext">Weakest at <b>${s.worst.stage}</b> at ${b(s.worst.val)} against a team median of ${b(s.worst.med)}.
          ${s.ratio<.8?"Coach "+s.worst.fix+".":"Inside the normal spread for this team."}</div>
      </div>`).join("")}</div>
    <p class="fine">Compared against this team's own median across ${e.n} reps with ${F}+ D logged, not an outside benchmark. Reps under that are left out until the sample is real.
    With a small team the median moves easily, so treat this as where to look first, not as a verdict.</p>
  </div>`}function ut(t){const e=W(t).slice(-8);return t.reps.length?`<div class="scroll"><table class="wk">
    <thead><tr><th>Rep</th>${e.map(o=>`<th class="num">${U(o).split(" to ")[0]}${E(o)?'<span class="now">now</span>':""}</th>`).join("")}</tr></thead>
    <tbody>${t.reps.map(o=>{const s=w(t,o.id),a=Y(t,o.id),n=V(t.entries[o.id]).days>0;return`<tr><td>${p(o.name||"Unnamed")}</td>${e.map(r=>{const l=s[r]?s[r].sale:0,c=E(r);if(r<a)return'<td class="num pre" title="Before this rep started">·</td>';if(K(o.id,r))return'<td class="num off" title="Time off all week">off</td>';const i=!!s[r]&&k(s[r].d)>0,d=g.set&&!c&&r!==a&&n&&(!g.setAt||r>=T(g.setAt));return`<td class="num ${c?"cur":d?!i||l<_(t,o.id,r)?"miss":"hit":""}">${i?l:0}</td>`}).join("")}</tr>`}).join("")}</tbody></table></div>`:'<p class="fine">Nothing to show yet.</p>'}function St(t){const e=a=>`"${String(a??"").replace(/"/g,'""')}"`,o=A(t);let s=`DPC FIELD TRACKER
Exported,`+$()+`
`;return s+=`Note,"C means the rep asked for the business. It is not a sale. Sales are counted separately."

`,s+=`ROSTER
Rep,Market,Started,Active,Standing,D,Presentations,Asked,Sales,D to P,Ask rate,Ask to sale,D per sale
`,o.per.forEach(a=>{s+=[e(a.rep.name),e(a.rep.market),a.rep.started,a.rep.active,e(a.flag.unset?"No standards set":a.flag.flagged?"Flagged":a.flag.atRisk?"At risk":"Clear"),a.t.d,a.t.p,a.t.c,a.t.sale,a.r.dToP===null?"":(a.r.dToP*100).toFixed(1),a.r.pToC===null?"":(a.r.pToC*100).toFixed(1),a.r.cToSale===null?"":(a.r.cToSale*100).toFixed(1),a.r.doorsPerSale===null?"":a.r.doorsPerSale.toFixed(1)].join(",")+`
`}),s+=[e("TEAM TOTAL"),"","","","",o.t.d,o.t.p,o.t.c,o.t.sale,o.r.dToP===null?"":(o.r.dToP*100).toFixed(1),o.r.pToC===null?"":(o.r.pToC*100).toFixed(1),o.r.cToSale===null?"":(o.r.cToSale*100).toFixed(1),o.r.doorsPerSale===null?"":o.r.doorsPerSale.toFixed(1)].join(",")+`
`,s+=`
DAILY LOG
Rep,Date,D,Presentations,Asked,Sales,Note
`,t.reps.forEach(a=>{(t.entries[a.id]||[]).slice().sort((n,r)=>n.date<r.date?-1:1).forEach(n=>{s+=[e(a.name),n.date,k(n.d),k(n.p),k(n.c),k(n.sale),e(n.note)].join(",")+`
`})}),s+=`
© 2026 David Borske. All rights reserved.
`,s}function Tt(t){const e=[["Marcus Hill","North Charlotte",[12,9,7,6,8,5]],["Tyrell Banks","Concord",[4,3,5,4,3,4]],["Dana Ruiz","Gastonia",[7,6,6,7,9,8]],["Chris Okafor","North Charlotte",[3,2,4,3,2,3]],["Samir Patel","Rock Hill",[9,11,8,10,7,9]]],o=[{dp:.2,pc:.75},{dp:.18,pc:.3},{dp:.22,pc:.7},{dp:.09,pc:.65},{dp:.24,pc:.8}];return t.reps=[],t.entries={},e.forEach(([s,a,n],r)=>{const l=G(s);l.market=a,t.reps.push(l),t.entries[l.id]=[];const c=o[r];n.forEach((i,d)=>{const u=n.length-d;for(let h=0;h<5;h++){const f=new Date;f.setDate(f.getDate()-u*7+h);const C=55+(r*7+h*3+d)%25,D=Math.round(C*c.dp),R=Math.round(D*c.pc),M=Math.min(R,Math.round(i/5)+(h===2&&i%5>2?1:0)),j=new Date(f.getTime()-f.getTimezoneOffset()*6e4).toISOString().slice(0,10);j<l.started&&(l.started=j),t.entries[l.id].push({id:"s"+r+d+h,date:new Date(f.getTime()-f.getTimezoneOffset()*6e4).toISOString().slice(0,10),d:C,p:D,c:R,sale:M,note:""})}})}),t}export{St as buildCSV,L as mgrUI,yt as renderManager,Tt as seedTeam};
