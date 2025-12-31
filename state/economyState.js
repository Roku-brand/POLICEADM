function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

export function createEconomyState(){
  return {
    // internal economy index, but only expose tier
    econIndex: 50,
    gdpTier: "中成長", // 低成長/中成長/高成長/停滞

    tick({ year, phase, structural, shocks }){
      // base growth
      let base = 0;
      if(phase === "dawn") base = 1.2;
      if(phase === "growth") base = 0.6;
      if(phase === "mature") base = 0.2;

      // education & infra help (hidden)
      const boost = (structural.educationBase*0.15 + structural.fiscalFlex*0.10) - (structural.infraMaintenanceDebt*0.08);

      // shocks hurt
      const shock = (shocks.market*1.0 + shocks.pandemic*0.8 + shocks.security*0.6 + shocks.disaster*0.5) * 0.25;

      // update index
      this.econIndex = clamp(this.econIndex + base + boost - shock + (Math.random()-0.5)*0.9, 0, 100);

      // tier mapping (mature: high growth is rare)
      if(this.econIndex < 25) this.gdpTier = "停滞";
      else if(this.econIndex < 45) this.gdpTier = "低成長";
      else if(this.econIndex < 72) this.gdpTier = "中成長";
      else this.gdpTier = (phase === "mature" && Math.random() < 0.70) ? "中成長" : "高成長";
    }
  };
}
