export function mountDashboard(){
  const uiYear = document.getElementById("uiYear");
  const uiApproval = document.getElementById("uiApproval");
  const uiGdpTier = document.getElementById("uiGdpTier");
  const uiPhase = document.getElementById("uiPhase");
  const uiElection = document.getElementById("uiElection");

  function setYear(year){
    if(uiYear) uiYear.textContent = `建国${year}年`;
  }

  function setApproval(approval){
    if(uiApproval) uiApproval.textContent = `${approval}%`;
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
