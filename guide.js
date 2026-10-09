/*! Copyright 2026 David Borske. All rights reserved. */
const n="guide.seen";function s(){try{return JSON.parse(localStorage.getItem(n)||"{}")||{}}catch{return{}}}function c(t,e){return s()[t]?"":`<div class="guidetip" role="note" data-tip="${t}">
    <p>${e}</p>
    <button type="button" class="ghost sm" data-tipdone="${t}">Got it</button>
  </div>`}function a(t){const e=s();e[t]=1;try{localStorage.setItem(n,JSON.stringify(e))}catch{}}function r(){try{localStorage.removeItem(n)}catch{}}function p(t){document.addEventListener("click",e=>{const o=e.target.closest&&e.target.closest("[data-tipdone],[data-tipsreset]");if(o)if(o.dataset.tipdone){a(o.dataset.tipdone);const i=o.closest(".guidetip");i&&i.remove()}else r(),t&&t()})}export{p as initGuide,a as markTip,r as resetTips,c as tipHtml};
