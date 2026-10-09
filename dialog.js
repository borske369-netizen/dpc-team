/*! Copyright 2026 David Borske. All rights reserved. */
const a=l=>String(l??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o]);function u({text:l,ok:o="Yes",cancel:r="Cancel",input:n=null,value:p="",copy:c=null}){return new Promise(f=>{const e=document.createElement("div");e.className="dlg",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.innerHTML=`<div class="dlg-in card">
      <p class="dlg-text">${a(l)}</p>
      ${n!==null?`<input class="dlg-input" data-dlginput="1" placeholder="${a(n)}" value="${a(p)}" autocomplete="off">`:""}
      ${c!==null?`<textarea class="dlg-input dlg-copy" readonly rows="4">${a(c)}</textarea>`:""}
      <div class="rowbtns">
        <button class="primary" data-dlgok="1">${a(o)}</button>
        ${r?`<button class="ghost" data-dlgno="1">${a(r)}</button>`:""}
      </div></div>`,document.body.appendChild(e);const s=e.querySelector(".dlg-input"),d=t=>{e.remove(),document.removeEventListener("keydown",g,!0),f(t)},i=()=>n!==null?String(s.value||"").trim():!0,g=t=>{t.key==="Escape"&&(t.stopPropagation(),d(n!==null?null:!1)),t.key==="Enter"&&t.target===s&&n!==null&&(t.preventDefault(),d(i()))};document.addEventListener("keydown",g,!0),e.addEventListener("click",t=>{t.stopPropagation(),t.target.closest("[data-dlgok]")?d(i()):(t.target.closest("[data-dlgno]")||t.target===e)&&d(n!==null?null:!1)}),setTimeout(()=>{if(s)s.focus(),c!==null&&s.select();else{const t=e.querySelector("[data-dlgok]");t&&t.focus()}},30)})}const m=(l,o="Yes")=>u({text:l,ok:o}),v=(l,o="",r="",n="Save")=>u({text:l,ok:n,input:o,value:r}),k=(l,o)=>u({text:l,ok:"Done",cancel:"",copy:o});export{m as ask,v as askText,k as showCopy};
