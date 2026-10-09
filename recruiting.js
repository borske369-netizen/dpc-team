/*! Copyright 2026 David Borske. All rights reserved. */
function p(t){if(!t)return null;(!t.recruit||typeof t.recruit!="object")&&(t.recruit={live:!1,seatsTotal:0,seatsHeld:0,waiting:0,market:"",updated:null,events:[]});const e=t.recruit;return Array.isArray(e.events)||(e.events=[]),e.events=e.events.filter(a=>a&&(a.text||a.pub)).slice(-24),e.seatsTotal===void 0&&e.seats!==void 0&&(e.seatsTotal=e.seats,e.seatsHeld=0,e.waiting=e.bench||0),["seatsTotal","seatsHeld","waiting"].forEach(a=>{const n=parseInt(e[a],10);e[a]=isFinite(n)&&n>0?n:0}),e.live=!!e.live,e.market=String(e.market==null?"":e.market),e}let f="",w="applied";function b(t){const e=parseInt(t,10);return isFinite(e)&&e>0?e:0}function i(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function y(t){const e=t.seatsHeld>0?t.seatsHeld:0,a=t.seatsTotal>0?t.seatsTotal:0;if(a>0){const n=Math.max(0,a-e);return n===0?"Every seat on this team is filled.":n===1?"One seat is open.":n+" seats are open."}return"Seats on this team are limited."}function $(t){const e=t.waiting>0?t.waiting:0,a=t.seatsTotal>0?t.seatsTotal:0,n=a>0?Math.max(0,a-(t.seatsHeld>0?t.seatsHeld:0)):0;if(e===0)return"Production keeps yours.";const r=e===1?"Someone is waiting":e+" people are waiting";return a>0&&n===0?r+" on a seat that is already taken.":e>n&&n>0?r+" on "+n+".":r+" on one."}const v=[{k:"applied",stage:"Identified",dot:"new",pub:"Someone new wants a seat"},{k:"screened",stage:"Screened",dot:"warm",pub:"A candidate cleared screening"},{k:"interview",stage:"Interviewed",dot:"warm",pub:"A candidate interviewed for a seat"},{k:"ridealong",stage:"Ride along",dot:"hot",pub:"A candidate is out on the doors this week"},{k:"offer",stage:"Offered",dot:"hot",pub:"A seat was offered"},{k:"onboarded",stage:"Onboarded",dot:"live",pub:"A seat was filled"},{k:"firstsale",stage:"First sale",dot:"live",pub:"A new rep got on the board"},{k:"released",stage:"Released",dot:"cold",pub:"A seat opened back up"}];function S(t,e,a){const n=p(t);if(!n)return;const r=v.find(s=>s.k===e)||v[0],c=String(a||"").trim();c&&(n.events.push({id:"e"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),kind:r.k,dot:r.dot,who:c,stage:r.stage,pub:r.pub,text:r.stage+": "+c,at:new Date().toISOString()}),n.events=n.events.slice(-24),n.updated=new Date().toISOString())}function x(t){const e=Date.parse(t);if(!isFinite(e))return"";const a=Math.max(0,Math.round((Date.now()-e)/6e4));if(a<60)return"today";const n=Math.round(a/60);if(n<24)return"today";const r=Math.round(n/24);return r===1?"yesterday":r<7?"this week":"recently"}function T(t){const e=Date.parse(t);if(!isFinite(e))return"";const a=Math.max(0,Math.round((Date.now()-e)/6e4));if(a<1)return"just now";if(a<60)return a+"m ago";const n=Math.round(a/60);return n<24?n+"h ago":Math.round(n/24)+"d ago"}function M(t){const e=t.events.slice().reverse().slice(0,8);return e.length?`
   <div class="rec-tickwrap">
    <div class="rec-ticker" aria-label="Recent recruiting activity">
      <div class="rec-track" style="--n:${e.length}">
        ${e.concat(e).map(a=>`
          <span class="rec-ev">
            <i class="rec-ev-dot rec-${i(a.dot)}" aria-hidden="true"></i>
            <span class="rec-ev-t">${i(a.pub||"Movement in the pipeline")}</span>
            <span class="rec-ev-a">${i(x(a.at))}</span>
          </span>`).join("")}
      </div>
    </div>`:""}function H(t){const e=p(t);if(!e||!e.live)return"";const a=e.seatsTotal>0?e.seatsTotal:0,n=Math.min(e.seatsHeld>0?e.seatsHeld:0,a||1/0),r=[a?[n+" of "+a,"seats held"]:null,e.waiting?[e.waiting,"waiting on a seat"]:null].filter(Boolean);return`
  <section class="rec-banner" role="status">
    <div class="rec-top">
      <span class="rec-dot" aria-hidden="true"></span>
      <span class="rec-kicker">Recruiting cycle is live${e.market?" in "+i(e.market):""}</span>
    </div>
    <p class="rec-head">${i(y(e))}</p>
    ${r.length?`<div class="rec-chips">${r.map(([c,s])=>`<span class="rec-chip"><strong>${i(String(c))}</strong> ${i(s)}</span>`).join("")}</div>`:""}
    ${M(e)}
    <p class="rec-press">${i($(e))}</p>
  </section>`}function A(t,e,a){if(!t)return;const n=p(e),r=(s,o,l)=>`
    <label class="rec-f">
      <span>${i(o)}</span>
      <input type="text" inputmode="numeric" data-rec="${s}" value="${n[s]}" aria-label="${i(o)}">
      ${l?`<em>${i(l)}</em>`:""}
    </label>`;if(t.innerHTML=`
  <section class="rec-admin deal-card">
    <h3 class="rec-admin-h">Recruiting cycle, what the team sees</h3>
    <p class="rec-admin-p">The team sees three things and nothing more: how many seats exist, how many are
      held, and that people are waiting. No names, no stages, no pipeline detail.
      Keep the numbers true and current. A count that never moves stops being believed.</p>

    <label class="rec-toggle">
      <input type="checkbox" data-rec="live" ${n.live?"checked":""}>
      <span>Show the cycle banner to the team</span>
    </label>

    <label class="rec-f rec-f-wide">
      <span>Market</span>
      <input type="text" data-rec="market" value="${i(n.market)}" placeholder="North Charlotte" aria-label="Market">
    </label>

    <div class="rec-grid">
      ${r("seatsTotal","Total seats","Housing capacity")}
      ${r("seatsHeld","Seats held","Reps in them now")}
      ${r("waiting","Waiting on a seat","Shown as a count only")}
    </div>

    <div class="rec-ev-add">
      <p class="rec-prev-l">Log activity. The team sees it anonymously</p>
      <div class="rec-ev-row">
        <input type="text" data-recev="who" value="${i(f)}" placeholder="First name, stays private" aria-label="Who">
        <select data-recev="kind" aria-label="What happened">
          ${v.map(s=>`<option value="${s.k}" ${s.k===w?"selected":""}>${i(s.stage)}</option>`).join("")}
        </select>
        <button type="button" class="btn-primary" data-recev="add">Add</button>
      </div>
      ${n.events.length?`<ul class="rec-ev-list">${n.events.slice().reverse().slice(0,6).map(s=>`
        <li><span class="rec-ev-dot rec-${i(s.dot)}"></span> <b>${i(s.stage||"")}</b> ${i(s.who||"")}
        <em>${i(T(s.at))}</em>
        <button type="button" class="ghost xs" data-recdel="${i(s.id)}">Remove</button></li>`).join("")}</ul>`:'<p class="rec-off">Nothing logged yet. The strip stays hidden until something moves.</p>'}
    </div>

    <div class="rec-prev">
      <p class="rec-prev-l">Preview, exactly as the team sees it</p>
      ${n.live?H(e):'<p class="rec-off">Banner is off. The team sees nothing.</p>'}
    </div>
  </section>`,t.dataset.recBound)return;t.dataset.recBound="1";const c=s=>{a&&typeof a.commit=="function"?a.commit(s):(s(e),a&&typeof a.render=="function"&&a.render())};t.addEventListener("input",s=>{const o=s.target;if(o&&o.dataset&&o.dataset.recev==="who"){f=o.value;return}const l=o&&o.dataset&&o.dataset.rec;l&&c(u=>{const d=p(u);l==="live"?d.live=!!o.checked:l==="market"?d.market=o.value:d[l]=b(o.value),d.updated=new Date().toISOString()})}),t.addEventListener("click",s=>{const o=s.target.closest("[data-recdel]");if(o){c(h=>{const m=p(h);m.events=m.events.filter(k=>k.id!==o.dataset.recdel)});return}if(!s.target.closest('[data-recev="add"]'))return;const u=t.querySelector('[data-recev="who"]'),d=t.querySelector('[data-recev="kind"]'),g=u?u.value.trim():"";if(!g){u&&u.focus();return}f="",c(h=>S(h,d?d.value:"applied",g))}),t.addEventListener("change",s=>{if(s.target&&s.target.dataset&&s.target.dataset.recev==="kind"){w=s.target.value;return}s.target&&s.target.dataset&&s.target.dataset.rec==="live"&&c(o=>{const l=p(o);l.live=!!s.target.checked})})}export{v as EVENT_KINDS,S as addEvent,p as ensureRecruit,H as recruitBannerHtml,A as renderRecruitAdmin};
