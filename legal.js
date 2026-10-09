/*! Copyright 2026 David Borske. All rights reserved. */
const o="Copyright 2026 David Borske. All rights reserved.",n="dpc_terms_v1";function s(t){let e=2166136261;const r=String(t||"");for(let l=0;l<r.length;l++)e^=r.charCodeAt(l),e=Math.imul(e,16777619);return"t"+(e>>>0).toString(36)+r.length.toString(36)}function i(){try{const t=JSON.parse(localStorage.getItem(n)||"{}");return t&&typeof t=="object"?t:{}}catch{return{}}}function a(t){return t&&t.cloud&&t.cloud.token?t.cloud.token:""}function c(t){const e=a(t);return!!(e&&i()[s(e)])}function d(t){return!!a(t)&&!c(t)}function u(t){const e=a(t);if(!e)return!1;const r=i();r[s(e)]=new Date().toISOString();try{localStorage.setItem(n,JSON.stringify(r))}catch{return!1}return!0}function g(){return`<div class="gate">
    <div class="card gatecard termscard" role="dialog" aria-modal="true" aria-labelledby="termsh">
      <h2 class="gate-h" id="termsh">Before you start</h2>
      <ul class="termslist">
        <li>This app is licensed to your team only.</li>
        <li>Do not copy, share, sell or rebuild it, or help anyone else do so.</li>
        <li>Your team's numbers belong to your team.</li>
        <li>Questions about the app: borske369@gmail.com.</li>
      </ul>
      <button class="primary termsok" type="button" data-termsagree="1">I agree</button>
      <p class="legalline">${o}</p>
    </div>
  </div>`}function p(t){if(!(!t||!t.querySelectorAll))try{t.querySelectorAll(".gatecard").forEach(e=>{e.querySelector(".legalline")||e.insertAdjacentHTML("beforeend",`<p class="legalline">${o}</p>`)}),t.querySelectorAll("[data-tipsreset]").forEach(e=>{const r=e.closest("details")||e.closest(".card")||e.parentElement;if(!r)return;const l=r.lastElementChild;l&&l.classList&&l.classList.contains("legalline")||r.insertAdjacentHTML("beforeend",`<p class="legalline">${o}</p>`)})}catch{}}function f({S:t,render:e}){document.addEventListener("click",r=>{r.target&&r.target.closest&&r.target.closest("[data-termsagree]")&&(r.preventDefault(),u(t()),e())})}export{o as NOTICE,n as TERMS_KEY,u as agree,p as decorate,c as hasAgreed,f as initLegal,d as needsTerms,g as termsHtml};
