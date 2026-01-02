// Top Bar UI Component
// Handles year display, approval, GDP, phase, election countdown

export function mountTopBar({ onAdvanceYear }){
  const btnFastForward = document.getElementById('btnFastForward');
  
  if(btnFastForward){
    btnFastForward.addEventListener('click', onAdvanceYear);
  }

  return {};
}
