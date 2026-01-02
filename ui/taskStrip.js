// Task Strip UI Component
// Bottom row showing ongoing crisis and policy cards

import { escapeHtml } from './utils.js';

export function mountTaskStrip({ onClick }){
  const taskCards = document.getElementById('taskCards');
  
  if(!taskCards) return { render: () => {} };

  // Use event delegation
  taskCards.addEventListener('click', (e) => {
    const card = e.target.closest('.task-card');
    if(card){
      const taskId = card.dataset.id;
      const taskKind = card.dataset.kind;
      onClick({ id: taskId, kind: taskKind });
    }
  });

  function render(tasks){
    if(!tasks || tasks.length === 0){
      taskCards.innerHTML = `
        <div class="task-card task-card--empty">
          <div class="task-card__header">
            <span class="task-card__icon">📋</span>
            <span class="task-card__title">進行中の案件はありません</span>
          </div>
          <div class="task-card__desc">年を進めると新たな危機や政策が発生します</div>
        </div>
      `;
      return;
    }

    taskCards.innerHTML = tasks.map(task => {
      const icon = task.kind === 'crisis' ? '🚨' : '📋';
      const cardClass = task.kind === 'crisis' ? 'task-card--crisis' : 'task-card--policy';
      
      return `
        <div class="task-card ${cardClass}" data-id="${escapeHtml(task.id)}" data-kind="${escapeHtml(task.kind)}">
          <div class="task-card__header">
            <span class="task-card__icon">${icon}</span>
            <span class="task-card__title">${escapeHtml(task.title)}</span>
          </div>
          <div class="task-card__stage">${escapeHtml(task.stage)}</div>
          <div class="task-card__desc">${escapeHtml(task.desc)}</div>
        </div>
      `;
    }).join('');
  }

  return { render };
}
