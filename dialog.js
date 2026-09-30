/* In app dialogs. Browser pop ups (confirm, prompt) are silently blocked in
   embedded previews and some in app browsers, which made buttons do nothing.
   These work everywhere and return promises. */

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function open({ text, ok = "Yes", cancel = "Cancel", input = null, value = "", copy = null }) {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.className = "dlg";
    host.setAttribute("role", "dialog");
    host.setAttribute("aria-modal", "true");
    host.innerHTML = `<div class="dlg-in card">
      <p class="dlg-text">${esc(text)}</p>
      ${input !== null ? `<input class="dlg-input" data-dlginput="1" placeholder="${esc(input)}" value="${esc(value)}" autocomplete="off">` : ""}
      ${copy !== null ? `<textarea class="dlg-input dlg-copy" readonly rows="4">${esc(copy)}</textarea>` : ""}
      <div class="rowbtns">
        <button class="primary" data-dlgok="1">${esc(ok)}</button>
        ${cancel ? `<button class="ghost" data-dlgno="1">${esc(cancel)}</button>` : ""}
      </div></div>`;
    document.body.appendChild(host);
    const field = host.querySelector(".dlg-input");
    const done = (v) => { host.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
    const okVal = () => (input !== null ? String(field.value || "").trim() : true);
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); done(input !== null ? null : false); }
      if (e.key === "Enter" && e.target === field && input !== null) { e.preventDefault(); done(okVal()); }
    };
    document.addEventListener("keydown", onKey, true);
    host.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.target.closest("[data-dlgok]")) done(okVal());
      else if (e.target.closest("[data-dlgno]") || e.target === host) done(input !== null ? null : false);
    });
    setTimeout(() => {
      if (field) { field.focus(); if (copy !== null) field.select(); }
      else { const b = host.querySelector("[data-dlgok]"); if (b) b.focus(); }
    }, 30);
  });
}

export const ask = (text, ok = "Yes") => open({ text, ok });
export const askText = (text, placeholder = "", value = "", ok = "Save") => open({ text, ok, input: placeholder, value });
export const showCopy = (text, content) => open({ text, ok: "Done", cancel: "", copy: content });
