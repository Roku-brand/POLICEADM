// Log Panel UI Component
// Right side news log showing recent news items

import { escapeHtml } from './utils.js';

function badge(severity){
  if(severity === "bad") return "危機";
  if(severity === "warn") return "警戒";
  return "速報";
}

export function mountLogPanel(container){
  if(!container) return { render: () => {} };

  function render(items){
    if(!items || items.length === 0){
      container.innerHTML = `
        <div class="newsItem">
          <div class="newsItem__title">ニュースはまだありません。</div>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(it => {
      const severityClass = it.severity === 'bad' ? 'newsItem--bad' : 
                           it.severity === 'warn' ? 'newsItem--warn' : '';
      
      return `
        <div class="newsItem ${severityClass}">
          <div class="newsItem__top">
            <div class="newsItem__title">${escapeHtml(it.title)}</div>
          </div>
          <div class="newsItem__meta">建国${it.year}年 / ${escapeHtml(it.source)} / ${badge(it.severity)}</div>
          <div class="newsItem__body">${escapeHtml(it.body)}</div>
          <div class="tagRow">${(it.tags ?? []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
        </div>
      `;
    }).join('');
  }

  return { render };
}
