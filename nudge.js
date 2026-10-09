/*! Copyright 2026 David Borske. All rights reserved. */
const h=[{id:"p1",text:"Are you having fun?"},{id:"p2",text:"Sales is the transfer of emotion."},{id:"p3",text:"Where focus goes, energy flows."},{id:"p4",text:"Attitude and work ethic. You control both."},{id:"p5",text:"Keep your focus on the board."},{id:"p6",text:"Smile. If you are not having fun, neither are they."},{id:"p7",text:"Leave every person better off than you found them."},{id:"p8",text:"Listen to understand, not to respond."}],b=5,I=15,L=15*60*1e3,S=16e4;function c(t){return t==null||t===""?"":String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function y(t){const a=String(t||"");return/^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(a)?a:""}function v(){const t=new Date(Date.now()-144e5);return`${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`}function T(t){t.commit(a=>{a.nudge||(a.nudge={enabled:!0,frequency:"normal",whyText:"",whyImage:null,prompts:h.map(i=>({...i,enabled:!0})),stats:{lastNudgeTime:0,nudgeCountToday:0,lastPromptId:null,doorsSincePresentation:0,lastTapTime:Date.now(),firstLogDone:!1,date:v()},activeNudge:null,errorText:""})})}function $(t,a,i){if(!t.nudge){T(a);return}if(Array.isArray(t.nudge.prompts)&&h.some(e=>!t.nudge.prompts.some(o=>o.id===e.id))){a.commit(e=>{h.forEach(o=>{e.nudge.prompts.some(u=>u.id===o.id)||e.nudge.prompts.push({...o,enabled:!0})})});return}const n=t.nudge;if(!n.enabled)return;try{const e=v(),o=localStorage.getItem("dpc.firstDay");if(!o){localStorage.setItem("dpc.firstDay",e);return}if(o===e)return}catch{}if(n.activeNudge)return;const l=v();let s=!1;n.stats.date!==l&&(s=!0),s&&(a.commit(e=>{e.nudge.stats.date=l,e.nudge.stats.nudgeCountToday=0,e.nudge.stats.firstLogDone=!1,e.nudge.stats.doorsSincePresentation=0}),n.stats.date=l,n.stats.nudgeCountToday=0,n.stats.firstLogDone=!1,n.stats.doorsSincePresentation=0);let d=null;const r=Date.now();if(i.type==="tap"){let e=n.stats.doorsSincePresentation,o=n.stats.firstLogDone;i.counter==="D"?e+=1:i.counter==="P"||i.counter==="C"?e=0:i.counter==="Sale"&&(d="sale",e=0),!o&&i.counter&&(d="first_log",o=!0),e>=I&&!d&&(d="run_of_doors",e=0),a.commit(u=>{u.nudge.stats.doorsSincePresentation=e,u.nudge.stats.firstLogDone=o,u.nudge.stats.lastTapTime=r})}else if(i.type==="idle_check"){const e=new Date().getHours(),o=t.view==="rep"&&t.activeRep&&n.stats.firstLogDone&&e>=8&&e<21}if(d){const e=t.nudge.stats,o=e.nudgeCountToday,u=t.nudge.frequency==="high"?8:t.nudge.frequency==="low"?2:b,w=d==="sale"||d==="first_log";if(!w&&o>=u)return;const f=n.prompts.filter(g=>g.enabled&&g.id!==e.lastPromptId);let p="",m=null,x=!1;if(d==="sale")p="That is a sale. Same energy on the next door.",m="sale";else if(f.length>0){const g=f[Math.floor(Math.random()*f.length)];p=g.text,m=g.id,(g.text.toLowerCase().includes("fun")||g.text.toLowerCase().includes("smile"))&&(x=!0)}else p="Keep going.",m="fallback";a.commit(g=>{g.nudge.activeNudge={id:Date.now().toString(),text:p,whyText:g.nudge.whyText||"",hasImage:!!g.nudge.whyImage,type:x?"face":"text"},g.nudge.stats.lastPromptId=m,g.nudge.stats.nudgeCountToday=w?o:o+1,g.nudge.stats.lastNudgeTime=r})}}function _(t,a,i){t.nudge&&t.nudge.activeNudge&&t.nudge.activeNudge.id===i&&a.commit(n=>{n.nudge.activeNudge=null})}function A(t){if(!t.nudge||!t.nudge.activeNudge)return"";const a=t.nudge.activeNudge;let i="";a.type==="face"?i=`
      <div class="nudge-face">
        <svg viewBox="0 0 100 100" class="nudge-svg-face" aria-hidden="true">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="5" />
          <circle cx="35" cy="40" r="5" fill="currentColor" />
          <circle cx="65" cy="40" r="5" fill="currentColor" />
          <path d="M 30 65 Q 50 85 70 65" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        </svg>
      </div>`:(a.hasImage||a.whyImage)&&(i=`<div class="nudge-media"><img src="${y(t.nudge.whyImage||a.whyImage)}" alt="Your reason why" class="nudge-why-img"></div>`);let n="";return a.whyText&&(n=`<div class="nudge-why-text">${c(a.whyText)}</div>`),`
    <div class="nudge-overlay" role="status" aria-live="polite">
      <div class="nudge-card">
        <button class="nudge-close" data-nudge-action="dismiss" data-nudge-id="${a.id}" aria-label="Dismiss message">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <div class="nudge-content">
          ${i}
          ${n}
          <div class="nudge-text">${c(a.text)}</div>
        </div>
      </div>
    </div>
  `}function D(t,a){const i=new FileReader;i.onload=n=>{const l=new Image;l.onload=()=>{const s=document.createElement("canvas"),d=640;let r=l.width,e=l.height;r>e?r>d&&(e=Math.floor(e*(d/r)),r=d):e>d&&(r=Math.floor(r*(d/e)),e=d),s.width=r,s.height=e,s.getContext("2d").drawImage(l,0,0,r,e);const u=s.toDataURL("image/jpeg",.8);u.length>S?a(null,"Image is too large after compression. Please try a smaller file."):a(u,null)},l.src=n.target.result},i.readAsDataURL(t)}function N(t,a,i){if(!a.nudge){T(i);return}const n=a.nudge;let l=n.prompts.map(s=>`
    <div class="nudge-prompt-item">
      <label class="nudge-toggle">
        <input type="checkbox" data-nudge-action="toggle-prompt" data-nudge-id="${c(s.id)}" ${s.enabled?"checked":""} aria-label="Turn this line on or off">
        <span class="nudge-toggle-slider"></span>
      </label>
      <div class="nudge-prompt-text">${c(s.text)}</div>
    </div>
  `).join("");t.innerHTML=`
    <div class="nudge-settings">
      <h2>Reminders</h2>
      
      <div class="nudge-setting-row">
        <span class="nudge-setting-label">Turn on reminders</span>
        <label class="nudge-toggle">
          <input type="checkbox" data-nudge-action="toggle-master" ${n.enabled?"checked":""} aria-label="Turn on reminders">
          <span class="nudge-toggle-slider"></span>
        </label>
      </div>

      <div class="nudge-setting-row">
        <span class="nudge-setting-label">Frequency</span>
        <select class="nudge-select" data-nudge-action="change-frequency" aria-label="How often">
          <option value="low" ${n.frequency==="low"?"selected":""}>Low</option>
          <option value="normal" ${n.frequency==="normal"||!n.frequency?"selected":""}>Normal</option>
          <option value="high" ${n.frequency==="high"?"selected":""}>High</option>
        </select>
      </div>

      <div class="nudge-setting-group">
        <div class="nudge-setting-label">Your reason why</div>
        <input type="text" class="nudge-input-text" data-nudge-action="update-why-text" value="${c(n.whyText)}" placeholder="Enter a short reminder">
      </div>

      <div class="nudge-setting-group">
        <div class="nudge-setting-label">Your picture</div>
        <input type="file" accept="image/*" class="nudge-input-file" data-nudge-action="update-why-image">
        ${n.errorText?`<span class="nudge-error">${c(n.errorText)}</span>`:""}
        ${y(n.whyImage)?`<img src="${y(n.whyImage)}" class="nudge-why-preview" alt="Your picture">`:""}
      </div>

      <div class="nudge-prompts-list">
        <div class="nudge-setting-label" style="margin-bottom: 12px;">Your lines</div>
        ${l}
        
        <div class="nudge-setting-group">
          <input type="text" class="nudge-input-text" id="nudge-new-prompt" placeholder="Type your own line">
          <button class="nudge-btn" data-nudge-action="add-prompt">Add a line</button>
        </div>
      </div>
    </div>
  `,t._nudgeAttached||(t.addEventListener("change",s=>{const d=s.target.getAttribute("data-nudge-action");if(d==="toggle-master")i.commit(r=>{r.nudge.enabled=s.target.checked});else if(d==="change-frequency")i.commit(r=>{r.nudge.frequency=s.target.value});else if(d==="toggle-prompt"){const r=s.target.getAttribute("data-nudge-id");i.commit(e=>{const o=e.nudge.prompts.find(u=>u.id===r);o&&(o.enabled=s.target.checked)})}else if(d==="update-why-image"){const r=s.target.files[0];if(!r)return;D(r,(e,o)=>{i.commit(u=>{o?u.nudge.errorText=o:(u.nudge.errorText="",u.nudge.whyImage=e)})})}}),t.addEventListener("input",s=>{s.target.getAttribute("data-nudge-action")==="update-why-text"&&i.commit(d=>{d.nudge.whyText=s.target.value})}),t.addEventListener("click",s=>{if(s.target.getAttribute("data-nudge-action")==="add-prompt"){const r=t.querySelector("#nudge-new-prompt"),e=r.value.trim();e&&(i.commit(o=>{o.nudge.prompts.push({id:Date.now().toString(),text:e,enabled:!0})}),r.value="")}}),t._nudgeAttached=!0)}export{h as DEFAULT_PROMPTS,_ as dismissNudge,$ as maybeNudge,A as nudgeHtml,N as renderNudgeSettings};
