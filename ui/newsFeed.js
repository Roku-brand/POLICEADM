import { escapeHtml } from './utils.js';

function badge(severity){
  if(severity === "bad") return "危機";
  if(severity === "warn") return "警戒";
  return "速報";
}

export function mountNewsFeed(container){
  function render(items){
    container.innerHTML = "";
    if(items.length === 0){
      container.innerHTML = `<div class="newsItem"><div class="newsItem__title">ニュースはまだありません。</div></div>`;
      return;
    }
    for(const it of items){
      const div = document.createElement("div");
      div.className = "newsItem";
      div.innerHTML = `
        <div class="newsItem__top">
          <div class="newsItem__title">${escapeHtml(it.title)}</div>
          <div class="newsItem__meta">建国${it.year}年 / ${escapeHtml(it.source)} / ${badge(it.severity)}</div>
        </div>
        <div class="newsItem__body">${escapeHtml(it.body)}</div>
        <div class="tagRow">${(it.tags ?? []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
      `;
      container.appendChild(div);
    }
  }
  return { render };
}
