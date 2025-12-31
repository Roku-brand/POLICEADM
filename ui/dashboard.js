export function mountDashboard(){
  const uiYear = document.getElementById("uiYear");
  const uiApproval = document.getElementById("uiApproval");
  const uiGdpTier = document.getElementById("uiGdpTier");
  const uiPhase = document.getElementById("uiPhase");
  const uiElection = document.getElementById("uiElection");
  const approvalBar = document.getElementById("approvalBar");

  function setYear(year){
    if(uiYear) uiYear.textContent = `建国${year}年`;
  }

  function setApproval(approval){
    if(uiApproval) uiApproval.textContent = `${approval}%`;
    if(approvalBar) approvalBar.style.width = `${Math.max(0, Math.min(100, approval))}%`;
    
    // Update color class based on approval level using CSS variables
    if(approvalBar){
      approvalBar.classList.remove('status__bar-fill--bad', 'status__bar-fill--warn', 'status__bar-fill--good');
      if(approval <= 25){
        approvalBar.classList.add('status__bar-fill--bad');
      } else if(approval <= 40){
        approvalBar.classList.add('status__bar-fill--warn');
      } else {
        approvalBar.classList.add('status__bar-fill--good');
      }
    }
  }

  function setGdpTier(gdpTier){
    if(uiGdpTier) uiGdpTier.textContent = gdpTier;
  }

  function setPhase(phaseLabel){
    if(uiPhase) uiPhase.textContent = phaseLabel;
  }

  function setNextElection(nextElectionText){
    if(uiElection) uiElection.textContent = nextElectionText;
  }

  return {
    setYear,
    setApproval,
    setGdpTier,
    setPhase,
    setNextElection
  };
}
