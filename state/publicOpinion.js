function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

export function createPublicOpinion({ initialApproval }){
  return {
    approval: initialApproval ?? 55,

    tick({ year, phase, pressures, shocks, comms }){
      // Baseline drift: harder later
      let drift = 0;
      if(phase === "dawn") drift += 0.1;
      if(phase === "growth") drift -= 0.1;
      if(phase === "mature") drift -= 0.35;

      // Shocks cause faster drops
      const shockImpact = (
        shocks.market * 0.9 +
        shocks.security * 1.0 +
        shocks.disaster * 0.85 +
        shocks.pandemic * 1.05
      ) * 0.12;

      // Pressures are slower but persistent
      const pressureImpact = (pressures.anxiety*0.7 + pressures.inequality*0.6 + pressures.fatigue*0.7) * 0.08;

      // Comms can soften drops but never provide "cheat"
      const commsBuffer = (comms.transparency*0.25 + comms.empathy*0.25);

      let delta = drift - shockImpact - pressureImpact + commsBuffer;

      // Noise: public opinion is not purely rational
      delta += (Math.random() - 0.5) * 0.9;

      // additional cliff: low approval is fragile
      if(this.approval < 30) delta -= 0.35;
      if(this.approval < 22) delta -= 0.55;

      this.approval = clamp(Math.round(this.approval + delta), 0, 100);

      // Communication posture decays
      comms.transparency *= 0.85;
      comms.empathy *= 0.85;
    }
  };
}
