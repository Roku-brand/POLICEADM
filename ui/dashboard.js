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
    
    // Update color based on approval level
    if(approvalBar){
      if(approval <= 25){
        approvalBar.style.background = 'linear-gradient(90deg, #ff6b6b, #ff4757)';
      } else if(approval <= 40){
        approvalBar.style.background = 'linear-gradient(90deg, #ffcc33, #ffa502)';
      } else {
        approvalBar.style.background = 'linear-gradient(90deg, #5ce07a, #4ecdc4)';
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
