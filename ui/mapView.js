function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

export function mountMapView(container){
  // Region definitions for the nation
  const regions = [
    { id: "capital", name: "首都圏", x: 45, y: 40, size: "large" },
    { id: "industrial", name: "工業地帯", x: 25, y: 55, size: "medium" },
    { id: "port", name: "港湾地区", x: 70, y: 60, size: "medium" },
    { id: "agricultural", name: "農業地帯", x: 35, y: 75, size: "medium" },
    { id: "border", name: "国境地域", x: 15, y: 30, size: "small" },
    { id: "coast", name: "沿岸地域", x: 80, y: 35, size: "small" },
  ];

  let selectedRegion = null;
  let currentContext = null;

  function render(ctx){
    currentContext = ctx;
    const { nation, opinion, economy } = ctx;

    // Calculate region status based on hidden state
    const regionStatus = calculateRegionStatus(ctx);

    container.innerHTML = `
      <div class="map">
        <div class="map__header">
          <h3 class="map__title">国家マップ</h3>
          <div class="map__legend">
            <span class="map__legend-item map__legend-item--good">安定</span>
            <span class="map__legend-item map__legend-item--warn">注意</span>
            <span class="map__legend-item map__legend-item--bad">危機</span>
          </div>
        </div>
        <div class="map__canvas" id="mapCanvas">
          <svg viewBox="0 0 100 100" class="map__svg">
            <!-- Nation outline -->
            <path d="M10 20 Q5 50 15 80 Q40 95 60 90 Q85 85 90 60 Q95 35 80 20 Q55 5 30 10 Q15 15 10 20" 
                  fill="rgba(255,255,255,0.05)" 
                  stroke="rgba(255,255,255,0.2)" 
                  stroke-width="0.5"/>
            
            <!-- Connection lines between regions -->
            <line x1="45" y1="40" x2="25" y2="55" stroke="rgba(255,255,255,0.1)" stroke-width="0.3"/>
            <line x1="45" y1="40" x2="70" y2="60" stroke="rgba(255,255,255,0.1)" stroke-width="0.3"/>
            <line x1="25" y1="55" x2="35" y2="75" stroke="rgba(255,255,255,0.1)" stroke-width="0.3"/>
            <line x1="45" y1="40" x2="15" y2="30" stroke="rgba(255,255,255,0.1)" stroke-width="0.3"/>
            <line x1="45" y1="40" x2="80" y2="35" stroke="rgba(255,255,255,0.1)" stroke-width="0.3"/>
            
            ${regions.map(r => {
              const status = regionStatus[r.id] || "stable";
              const radius = r.size === "large" ? 8 : r.size === "medium" ? 6 : 4;
              const statusClass = status === "crisis" ? "map__region--bad" : 
                                  status === "warning" ? "map__region--warn" : "map__region--good";
              return `
                <circle cx="${r.x}" cy="${r.y}" r="${radius}" 
                        class="map__region ${statusClass}" 
                        data-region="${r.id}"/>
                <text x="${r.x}" y="${r.y + radius + 4}" 
                      class="map__region-label" 
                      text-anchor="middle">${escapeHtml(r.name)}</text>
              `;
            }).join("")}
          </svg>
        </div>
        <div class="map__info" id="mapInfo">
          <div class="map__info-title">地域を選択してください</div>
          <div class="map__info-body">マップ上の各地域をクリックすると詳細が表示されます。</div>
        </div>
      </div>
    `;

    // Add click handlers
    const canvas = container.querySelector("#mapCanvas");
    canvas.addEventListener("click", (e) => {
      const regionEl = e.target.closest("[data-region]");
      if(regionEl){
        const regionId = regionEl.dataset.region;
        showRegionInfo(regionId, regionStatus);
      }
    });
  }

  function calculateRegionStatus(ctx){
    const { nation } = ctx;
    const st = nation.hidden.structural;
    const sh = nation.hidden.shocks;
    const pr = nation.hidden.pressures;

    const status = {};

    // Capital: affected by general stability
    if(sh.security > 2 || sh.pandemic > 3){
      status.capital = "crisis";
    } else if(sh.security > 1 || sh.pandemic > 1.5 || pr.anxiety > 5){
      status.capital = "warning";
    } else {
      status.capital = "stable";
    }

    // Industrial zone: affected by market and infrastructure
    if(sh.market > 3 || st.infraMaintenanceDebt > 15){
      status.industrial = "crisis";
    } else if(sh.market > 1.5 || st.infraMaintenanceDebt > 8){
      status.industrial = "warning";
    } else {
      status.industrial = "stable";
    }

    // Port: affected by security and market
    if(sh.security > 2.5 || sh.market > 3){
      status.port = "crisis";
    } else if(sh.security > 1 || sh.market > 1.5){
      status.port = "warning";
    } else {
      status.port = "stable";
    }

    // Agricultural: affected by disaster
    if(sh.disaster > 3){
      status.agricultural = "crisis";
    } else if(sh.disaster > 1.5){
      status.agricultural = "warning";
    } else {
      status.agricultural = "stable";
    }

    // Border: affected by security
    if(sh.security > 2.5 || st.defenseReadiness < -5){
      status.border = "crisis";
    } else if(sh.security > 1 || st.defenseReadiness < -2){
      status.border = "warning";
    } else {
      status.border = "stable";
    }

    // Coastal: affected by disaster and security
    if(sh.disaster > 2.5 || sh.security > 2){
      status.coast = "crisis";
    } else if(sh.disaster > 1 || sh.security > 1){
      status.coast = "warning";
    } else {
      status.coast = "stable";
    }

    return status;
  }

  function showRegionInfo(regionId, regionStatus){
    const region = regions.find(r => r.id === regionId);
    if(!region || !currentContext) return;

    const { nation } = currentContext;
    const st = nation.hidden.structural;
    const sh = nation.hidden.shocks;
    const status = regionStatus[regionId] || "stable";

    const infoEl = container.querySelector("#mapInfo");
    if(!infoEl) return;

    const statusLabel = status === "crisis" ? "危機的状況" : 
                        status === "warning" ? "注意が必要" : "安定";
    const statusClass = status === "crisis" ? "bad" : 
                        status === "warning" ? "warn" : "good";

    let description = "";
    switch(regionId){
      case "capital":
        description = "政治・経済の中心地。治安と感染症の影響を受けやすい。";
        break;
      case "industrial":
        description = "製造業の拠点。市場の変動とインフラの老朽化に影響を受ける。";
        break;
      case "port":
        description = "貿易の要所。安全保障と経済の両面で重要。";
        break;
      case "agricultural":
        description = "食料生産地帯。自然災害の影響を受けやすい。";
        break;
      case "border":
        description = "国防の最前線。安全保障の状況が直結する。";
        break;
      case "coast":
        description = "沿岸部の防災と安全保障が課題。";
        break;
    }

    infoEl.innerHTML = `
      <div class="map__info-title">${escapeHtml(region.name)}</div>
      <div class="map__info-status map__info-status--${statusClass}">${statusLabel}</div>
      <div class="map__info-body">${escapeHtml(description)}</div>
    `;
  }

  return { render };
}
