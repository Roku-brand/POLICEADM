import { escapeHtml } from './utils.js';

export function mountDecisionModal({ onChoice }){
  const backdrop = document.getElementById("modalBackdrop");
  const modal = document.getElementById("decisionModal");
  const titleEl = document.getElementById("modalTitle");
  const kickerEl = document.getElementById("modalKicker");
  const bodyEl = document.getElementById("modalBody");
  const btnClose = document.getElementById("modalClose");

  let current = null;

  btnClose.addEventListener("click", () => close());
  backdrop.addEventListener("click", () => close());

  function isOpen(){
    return !modal.classList.contains("hidden");
  }

  function open(payload){
    current = payload;

    kickerEl.textContent = payload.kicker ?? "決断";
    titleEl.textContent = payload.title ?? "決断が求められています";

    const bodyHtml = `
      <div class="card">
        <div class="card__title">状況</div>
        <div class="card__text">${escapeHtml(payload.body ?? "").replaceAll("\n","<br/>")}</div>
      </div>
      ${payload.choices.map(c => `
        <div class="choice" data-choice="${escapeHtml(c.id)}">
          <div class="choice__title">${escapeHtml(c.title)}</div>
          <div class="choice__desc">${escapeHtml(c.desc)}</div>
          <div class="choice__meta">${escapeHtml(c.hint ?? "")}</div>
        </div>
      `).join("")}
    `;
    bodyEl.innerHTML = bodyHtml;

    bodyEl.querySelectorAll("[data-choice]").forEach(el => {
      el.addEventListener("click", () => {
        const choiceId = el.getAttribute("data-choice");
        if(!current) return;
        onChoice({
          kind: current.kind,
          id: current.id,
          defId: current.defId,
          choiceId
        });
        close();
      });
    });

    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");
  }

  function close(){
    backdrop.classList.add("hidden");
    modal.classList.add("hidden");
    current = null;
    bodyEl.innerHTML = "";
  }

  return { open, close, isOpen };
}
