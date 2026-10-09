/*! Copyright 2026 David Borske. All rights reserved. */
import{tipHtml as L}from"./guide.js";import{teamTotals as j,weakestStage as O,flagState as B,weekTotals as w,weekSpan as W,weekLabel as U,isCurrentWeek as A,rates as I,repTotals as S,fmtPct as b,fmtNum as m,fmt1 as H,num as k,newRep as G,FLAG_RULE as g,today as $,weekStart as T,repFirstWeek as Y,MIN_DOORS_FOR_DIAGNOSIS as E,weekTarget as _,minText as z,offAllWeek as K,sumEntries as V,isOff as q}from"./model.js";import{offTodayTeamLine as J,rosterOffHtml as Q}from"./timeoff.js";import{rosterPatternHtml as X}from"./events.js";import{esc as p}from"./view-rep.js";import{subjectLabel as Z}from"./control.js";import{teamMisses as x,dayActivity as tt}from"./selfcheck.js";import{teamReport as et,dueReport as st}from"./reports.js";const F={report:null};function yt(t,s,n){const e=j(s),a=O(e.per),o=st(s),r=F.report?et(s,F.report):null;t.innerHTML=`
  <div class="mgr">
    ${r?at(r,s):""}
    ${!r&&o?`<button class="duebar" data-report="${p(o.kind)}" data-duekey="${p(o.key)}">
      <span class="duedot" aria-hidden="true"></span><span>${p(o.label)}</span><span class="duego">Open</span></button>`:""}
    ${e.flagged.length||e.atRisk.length?rt(e):""}

    <div class="kpis">
      ${v("Active reps",m(e.activeCount),s.reps.length+" on the roster")}
      ${v("D",m(e.t.d),"Made contact, all time")}
      ${v("P",m(e.t.p),"Presentations, "+b(e.r.dToP)+" of D")}
      ${v("C",m(e.t.c),"Asked for the business, "+b(e.r.pToC)+" of P",!0)}
      ${v("S",m(e.t.sale),"Sales, "+b(e.r.cToSale)+" of C")}
      ${v("D per sale",H(e.r.doorsPerSale),"Team wide")}
    </div>


    <div class="card">
      <h4>Your reps</h4>
      ${J(s)}
      <p class="fine">${lt(s)} Most sales this week on top.${M(s)?"":" Tap a name to see that rep's day."}</p>
      <div class="scroll">
        <table class="roster">
          <thead><tr>
            <th>Rep</th><th class="num">Today</th><th class="num">Week</th>
            <th class="num">D</th><th class="num">P</th><th class="num">C</th><th class="num">S</th>
          </tr></thead>
          <tbody>${dt(s).map(l=>ct(s,l,a)).join("")||`<tr><td colspan="7"><div class="empty"><h3>No reps yet</h3>
             <p>Add your reps at the top of this page.</p></div></td></tr>`}</tbody>
        </table>
      </div>
      <div class="rowbtns mgr-only">
        ${s.cloud&&s.cloud.token?"":`<button class="primary" data-addrep="1">Add a rep</button>
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
        <button class="ghost" data-report="month">This month so far</button>
        <button class="ghost" data-report="lastmonth">Last month</button>
      </div>
      <label class="rp-email">Email reports to
        <input type="email" data-reportemail="1" value="${p(s.reportEmail||"")}" placeholder="partner@example.com, you@example.com" autocomplete="email">
      </label>
    </div>

    ${ot(s)}
    ${nt(s,n)}

    ${s.cloud&&s.cloud.token?"":`<div class="card">
      <h4>Backup</h4>
      <p class="fine">Saves everything on this phone to one file, including the private Recruiting tab. Keep it somewhere safe.
      Restoring on a new or reset phone brings it all back.</p>
      <div class="rowbtns">
        <button class="ghost" data-backup="1">Back up this phone</button>
        <label class="ghost btnlike">Restore from backup<input type="file" accept=".json,application/json" data-restore="1" hidden></label>
      </div>
      ${s.lastBackup?`<p class="fine">Last backup ${new Date(s.lastBackup).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}.</p>`:'<p class="fine warnline">This phone has never been backed up.</p>'}
    </div>`}

    ${s.cloud&&s.cloud.token?"":`
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

    ${a?pt(e,a):""}

    <div class="card mgr-only">
      <h4>${g.set?"Weeks against the standard":"Sales by week"}</h4>
      ${ut(s)}
      <p class="fine">${g.set?`Sales per week. Team minimum: ${z()}. ${g.weeks} week${g.weeks===1?"":"s"} in a row under it flags the rep.`:"Sales per week. No team standards yet, so nobody is flagged."} Off means time off all week.</p>
    </div>
  </div>`}function at(t,s){return`<div class="card rp-wrap">
    <div class="rp-actions">
      <button class="primary" data-rpshare="1">Text or share</button>
      <button class="ghost" data-rpemail="1">Email</button>
      <button class="ghost" data-rpcopy="1">Copy</button>
      <button class="ghost" data-rpprint="1">Save as PDF</button>
      <button class="ghost" data-rpclose="1">Close</button>
    </div>
    ${t.html}
  </div>`}function nt(t,s){const n=s&&typeof s.getBoardModule=="function"?s.getBoardModule():null;if(!n||!n.getBoard)return"";const e=n.getBoard(t),a=c=>{for(const i of["d","p","c","a"]){const d=((e.columns[i]||{}).items||[]).find(u=>u.id===c);if(d)return d.text}return""},o=$(),r=(t.reps||[]).map(c=>({r:c,a:tt(t,c.id,o,a)})).filter(c=>c.a.lines.length),l=x(t,c=>a(c));return`<div class="card mgr-only">
    <h4>What reps asked the game board today</h4>
    ${r.length?r.map(({r:c,a:i})=>{const d=[];return i.by.safety&&d.push(`${i.by.safety} safety`),i.by.nocontrol&&d.push(`${i.by.nocontrol} outside their control`),i.by.coach&&d.push(`${i.by.coach} coaching`),i.by.objection&&d.push(`${i.by.objection} objection${i.by.objection===1?"":"s"}`),i.by.out&&d.push(`${i.by.out} out of bounds`),i.by.in&&d.push(`${i.by.in} on the board`),`<details class="gb-rep">
        <summary><b>${p(c.name||"Unnamed")}</b> looked for help ${i.searches} time${i.searches===1?"":"s"} today. <span class="fine">Tap to see what they typed.</span>${d.length?`<br><span class="fine">${d.join(", ")}</span>`:""}
        ${i.miss.length?`<br><span class="gb-fix">Working on: ${p(i.miss.join(", "))}</span>`:""}
        ${i.ranIt||i.notYet?`<br><span class="fine">Focus check ins: ${i.ranIt} ran it, ${i.notYet} not yet.</span>`:""}</summary>
        <ol class="gb-lines">${i.lines.map(u=>`<li>${p(u)}</li>`).join("")}</ol>
      </details>`}).join(""):'<p class="fine">No one has used the game board today. When a rep types what is going wrong, it shows here.</p>'}
    ${l.team.length?`<p class="fine">This week the team keeps missing: ${l.team.map(c=>`<b>${p(c.text)}</b> (${c.n})`).join(", ")}.</p>`:""}
  </div>`}function ot(t){const s=t.control&&Array.isArray(t.control.log)?t.control.log:[],n=new Date(Date.now()-7*864e5),e=n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0"),a=t.reps.map(o=>{const r=s.filter(d=>d.v==="nocontrol"&&d.rep===o.id&&d.day>=e);if(!r.length)return null;const l={};r.forEach(d=>{const u=d.subject||"other";l[u]=(l[u]||0)+1});const c=Object.keys(l).sort((d,u)=>l[u]-l[d])[0],i=r.slice().sort((d,u)=>d.at<u.at?1:-1)[0];return{name:o.name||"Unnamed",n:r.length,top:c,topN:l[c],last:i&&i.text}}).filter(Boolean).sort((o,r)=>r.n-o.n);return a.length?`<div class="card mgr-only">
    <h4>Stuck on things they cannot control, last 7 days</h4>
    ${L("mgr-coach","Same worry three times means it is time for a one on one.")}
    <div class="diag">${a.map(o=>`
      <div class="drow ${o.topN>=3?"attn":""}">
        <div class="dname">${p(o.name)}</div>
        <div class="dtext"><b>${o.n}</b> time${o.n===1?"":"s"} focused on something outside their control.
        Most often: <b>${p(Z(o.top))}</b> (${o.topN}).${o.last?` Latest: "${p(o.last)}"`:""}
        ${o.topN>=3?" Same subject three or more times. That is the coaching conversation.":""}</div>
      </div>`).join("")}</div>

  </div>`:""}function rt(t){const s=[];return t.flagged.length&&s.push(`<b>${t.flagged.length}</b> flagged`),t.atRisk.length&&s.push(`<b>${t.atRisk.length}</b> at risk this week`),`<div class="alert mgr-only">
    <div class="alerthead">${s.join(" and ")}</div>
    <div class="alertbody">${t.flagged.concat(t.atRisk).map(n=>`<span class="chip ${n.flag.flagged?"bad":"warn"}">${p(n.rep.name||"Unnamed")} <span class="chipsub">${p(n.flag.reason)}</span></span>`).join("")}</div>
  </div>`}function v(t,s,n,e){return`<div class="kpi ${e?"accent":""}">
    <div class="klab">${t}</div><div class="kval">${s}</div><div class="ksub">${n}</div></div>`}function wt(t){const s=Math.max(t.t.d,1);return`<div class="fun">${[["D",t.t.d,null],["Presentations",t.t.p,t.r.dToP],["Close (ask for business)",t.t.c,t.r.pToC],["Sales",t.t.sale,t.r.cToSale]].map(([e,a,o],r)=>`
    <div class="frow">
      <div class="flab">${e}</div>
      <div class="ftrack"><div class="ffill ${r===2?"ask":""} ${r===3?"sale":""}" style="width:${(a/s*100).toFixed(1)}%"></div></div>
      <div class="fval">${m(a)}</div>
      <div class="fconv">${o===null?"":b(o)+" of the step above"}</div>
    </div>`).join("")}</div>`}function y(t,s){const n=$();return(t.entries[s]||[]).filter(e=>e.date===n).reduce((e,a)=>e+(Number(a.sale)||0),0)}function it(t,s){if(new Date().getHours()<11)return!1;const n=$();return q(s,n)?!1:!(t.entries[s]||[]).some(e=>e.date===n&&(Number(e.d)||0)>0)}function lt(t){const s=(t.reps||[]).reduce((n,e)=>n+y(t,e.id),0);return"Team today: "+s+" sale"+(s===1?"":"s")+"."}function dt(t){const s=T($()),n=e=>{const a=w(t,e)[s];return a?a.sale:0};return t.reps.slice().sort((e,a)=>n(a.id)-n(e.id)||y(t,a.id)-y(t,e.id)||S(t,a.id).sale-S(t,e.id).sale)}function M(t){return t.cloud&&t.cloud.role?t.cloud.role==="rep":t.role==="rep"}function ct(t,s,n){const e=S(t,s.id),a=I(e),o=B(t,s.id),l=w(t,s.id)[T($())],c=l?l.sale:0,i=(u,h)=>!n||h===null?`<td class="num">${u}</td>`:`<td class="num ${h<n*.8?"low":""}">${u}</td>`,d=M(t)?`<span class="rname-plain">${p(s.name||"Unnamed")}</span>`:`<button class="linkbtn" data-openrep="${p(s.id)}">${p(s.name||"Unnamed")}</button>`;return`<tr data-rep="${p(s.id)}">
    <td>${d}${o.flagged?' <span class="pill bad mgr-only">Flagged</span>':o.atRisk?' <span class="pill warn mgr-only">At risk</span>':""}${Q(t,s.id)}${X(t,s.id)}</td>
    <td class="num">${m(y(t,s.id))}${it(t,s.id)?'<br><span class="fine mgr-only">not started</span>':""}</td>
    <td class="num accent">${c}</td>
    <td class="num">${m(e.d)}</td>
    <td class="num">${m(e.p)}</td>
    <td class="num">${m(e.c)}</td>
    <td class="num">${m(e.sale)}</td>
  </tr>`}function pt(t,s){return`<div class="card mgr-only">
    <h4>Where each person is leaking</h4>
    <div class="diag">${t.per.filter(e=>e.t.d>=E).map(e=>{const a=[{stage:"getting into presentations",val:e.r.dToP,med:s.dToP,fix:"the door approach"},{stage:"asking for the business",val:e.r.pToC,med:s.pToC,fix:"the ask itself"},{stage:"landing the sale after asking",val:e.r.cToSale,med:s.cToSale,fix:"handling what comes back after the ask"}].filter(l=>l.val!==null&&l.med!==null&&l.med>0);if(!a.length)return null;const o=a.reduce((l,c)=>c.val/c.med<l.val/l.med?c:l),r=o.val/o.med;return{name:e.rep.name||"Unnamed",worst:o,ratio:r,flagged:e.flag.flagged}}).filter(Boolean).sort((e,a)=>e.ratio-a.ratio).map(e=>`
      <div class="drow ${e.ratio<.8?"attn":""}">
        <div class="dname">${p(e.name)}</div>
        <div class="dtext">Weakest at <b>${e.worst.stage}</b> at ${b(e.worst.val)} against a team median of ${b(e.worst.med)}.
          ${e.ratio<.8?"Coach "+e.worst.fix+".":"Inside the normal spread for this team."}</div>
      </div>`).join("")}</div>
    <p class="fine">Compared against this team's own median across ${s.n} reps with ${E}+ D logged, not an outside benchmark. Reps under that are left out until the sample is real.
    With a small team the median moves easily, so treat this as where to look first, not as a verdict.</p>
  </div>`}function ut(t){const s=W(t).slice(-8);return t.reps.length?`<div class="scroll"><table class="wk">
    <thead><tr><th>Rep</th>${s.map(n=>`<th class="num">${U(n).split(" to ")[0]}${A(n)?'<span class="now">now</span>':""}</th>`).join("")}</tr></thead>
    <tbody>${t.reps.map(n=>{const e=w(t,n.id),a=Y(t,n.id),o=V(t.entries[n.id]).days>0;return`<tr><td>${p(n.name||"Unnamed")}</td>${s.map(r=>{const l=e[r]?e[r].sale:0,c=A(r);if(r<a)return'<td class="num pre" title="Before this rep started">·</td>';if(K(n.id,r))return'<td class="num off" title="Time off all week">off</td>';const i=!!e[r]&&k(e[r].d)>0,d=g.set&&!c&&r!==a&&o&&(!g.setAt||r>=T(g.setAt));return`<td class="num ${c?"cur":d?!i||l<_(t,n.id,r)?"miss":"hit":""}">${i?l:0}</td>`}).join("")}</tr>`}).join("")}</tbody></table></div>`:'<p class="fine">Nothing to show yet.</p>'}function St(t){const s=a=>`"${String(a??"").replace(/"/g,'""')}"`,n=j(t);let e=`DPC FIELD TRACKER
Exported,`+$()+`
`;return e+=`Note,"C means the rep asked for the business. It is not a sale. Sales are counted separately."

`,e+=`ROSTER
Rep,Market,Started,Active,Standing,D,Presentations,Asked,Sales,D to P,Ask rate,Ask to sale,D per sale
`,n.per.forEach(a=>{e+=[s(a.rep.name),s(a.rep.market),a.rep.started,a.rep.active,s(a.flag.unset?"No standards set":a.flag.flagged?"Flagged":a.flag.atRisk?"At risk":"Clear"),a.t.d,a.t.p,a.t.c,a.t.sale,a.r.dToP===null?"":(a.r.dToP*100).toFixed(1),a.r.pToC===null?"":(a.r.pToC*100).toFixed(1),a.r.cToSale===null?"":(a.r.cToSale*100).toFixed(1),a.r.doorsPerSale===null?"":a.r.doorsPerSale.toFixed(1)].join(",")+`
`}),e+=[s("TEAM TOTAL"),"","","","",n.t.d,n.t.p,n.t.c,n.t.sale,n.r.dToP===null?"":(n.r.dToP*100).toFixed(1),n.r.pToC===null?"":(n.r.pToC*100).toFixed(1),n.r.cToSale===null?"":(n.r.cToSale*100).toFixed(1),n.r.doorsPerSale===null?"":n.r.doorsPerSale.toFixed(1)].join(",")+`
`,e+=`
DAILY LOG
Rep,Date,D,Presentations,Asked,Sales,Note
`,t.reps.forEach(a=>{(t.entries[a.id]||[]).slice().sort((o,r)=>o.date<r.date?-1:1).forEach(o=>{e+=[s(a.name),o.date,k(o.d),k(o.p),k(o.c),k(o.sale),s(o.note)].join(",")+`
`})}),e+=`
© 2026 David Borske. All rights reserved.
`,e}function Tt(t){const s=[["Marcus Hill","North Charlotte",[12,9,7,6,8,5]],["Tyrell Banks","Concord",[4,3,5,4,3,4]],["Dana Ruiz","Gastonia",[7,6,6,7,9,8]],["Chris Okafor","North Charlotte",[3,2,4,3,2,3]],["Samir Patel","Rock Hill",[9,11,8,10,7,9]]],n=[{dp:.2,pc:.75},{dp:.18,pc:.3},{dp:.22,pc:.7},{dp:.09,pc:.65},{dp:.24,pc:.8}];return t.reps=[],t.entries={},s.forEach(([e,a,o],r)=>{const l=G(e);l.market=a,t.reps.push(l),t.entries[l.id]=[];const c=n[r];o.forEach((i,d)=>{const u=o.length-d;for(let h=0;h<5;h++){const f=new Date;f.setDate(f.getDate()-u*7+h);const P=55+(r*7+h*3+d)%25,C=Math.round(P*c.dp),D=Math.round(C*c.pc),N=Math.min(D,Math.round(i/5)+(h===2&&i%5>2?1:0)),R=new Date(f.getTime()-f.getTimezoneOffset()*6e4).toISOString().slice(0,10);R<l.started&&(l.started=R),t.entries[l.id].push({id:"s"+r+d+h,date:new Date(f.getTime()-f.getTimezoneOffset()*6e4).toISOString().slice(0,10),d:P,p:C,c:D,sale:N,note:""})}})}),t}export{St as buildCSV,F as mgrUI,yt as renderManager,Tt as seedTeam};
