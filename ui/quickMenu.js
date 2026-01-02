// Quick Menu UI Component
// Handles view switching between map, news, departments, etc.

export function mountQuickMenu({ onViewChange }){
  const quickMenu = document.getElementById('quickMenu');
  
  if(!quickMenu) return { setActiveView: () => {} };

  const buttons = quickMenu.querySelectorAll('.quick-menu__btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      
      // Update active state
      buttons.forEach(b => b.classList.remove('quick-menu__btn--active'));
      btn.classList.add('quick-menu__btn--active');
      
      // Notify parent
      onViewChange(view);
    });
  });

  function setActiveView(viewName){
    buttons.forEach(btn => {
      if(btn.dataset.view === viewName){
        btn.classList.add('quick-menu__btn--active');
      } else {
        btn.classList.remove('quick-menu__btn--active');
      }
    });
  }

  return { setActiveView };
}
