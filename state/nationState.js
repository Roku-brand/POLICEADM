export function createNationState(){
  return {
    year: 1,
    phase: "dawn", // dawn | growth | mature
    phaseLabel: "黎明期",
    hidden: {
      // Hidden structural state: do not show as bars
      structural: {
        infraMaintenanceDebt: 0,   // 老朽化のツケ
        publicHealthCapacity: 0,   // 医療対応力
        defenseReadiness: 0,       // 抑止力
        educationBase: 0,          // 人的資本
        fiscalFlex: 0,             // 予備費・余力（抽象）
      },
      // Pressures that affect approval indirectly
      pressures: {
        anxiety: 0,
        inequality: 0,
        fatigue: 0,
      },
      // shocks accumulate short-term turmoil
      shocks: {
        market: 0,
        security: 0,
        disaster: 0,
        pandemic: 0,
      },
      // communication posture
      comms: {
        transparency: 0, // 透明性
        empathy: 0,       // 共感姿勢
      }
    },
    history: [],
    historyDraft: [],

    advanceYear(){
      this.year += 1;

      // decay some shocks yearly (but never fully zero)
      const s = this.hidden.shocks;
      s.market *= 0.72;
      s.security *= 0.72;
      s.disaster *= 0.75;
      s.pandemic *= 0.70;

      // pressures persist more
      const p = this.hidden.pressures;
      p.anxiety *= 0.90;
      p.inequality *= 0.95;
      p.fatigue *= 0.92;

      // maintenance debt tends to creep up as time passes
      const st = this.hidden.structural;
      st.infraMaintenanceDebt += (this.phase === "mature" ? 1.4 : this.phase === "growth" ? 1.0 : 0.6);

      // fiscal flexibility degrades if debt grows
      st.fiscalFlex -= 0.15;
    },

    updatePhase(){
      if(this.year < 20){
        this.phase = "dawn";
        this.phaseLabel = "黎明期";
      } else if(this.year < 60){
        this.phase = "growth";
        this.phaseLabel = "成長期";
      } else {
        this.phase = "mature";
        this.phaseLabel = "成熟期";
      }
    }
  };
}
