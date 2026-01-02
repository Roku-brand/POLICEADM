// Command Panel UI Component
// Left side action commands for crisis response, policy decisions, diplomacy

export function mountCommandPanel({ onAction }){
  const commandPanel = document.getElementById('commandPanel');
  
  if(!commandPanel) return { updateAlertState: () => {} };

  const buttons = commandPanel.querySelectorAll('.command-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      onAction(action);
    });
  });

  function updateAlertState({ hasCrisis, hasPolicy }){
    buttons.forEach(btn => {
      const action = btn.dataset.action;
      
      if(action === 'crisis'){
        if(hasCrisis){
          btn.classList.add('command-btn--alert');
        } else {
          btn.classList.remove('command-btn--alert');
        }
      }
      
      if(action === 'policy'){
        if(hasPolicy){
          btn.classList.add('command-btn--alert');
        } else {
          btn.classList.remove('command-btn--alert');
        }
      }
    });
  }

  return { updateAlertState };
}
