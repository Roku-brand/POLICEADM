function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }

export function createPolicySystem({ policies }){
  const required = [];

  function tick({ nation }){
    const news = [];
    const notifications = [];

    // High crisis frequency already exists; policy proposals appear occasionally
    const baseChance = nation.phase === "dawn" ? 0.35 : nation.phase === "growth" ? 0.28 : 0.22;
    if(Math.random() < baseChance){
      const p = pick(policies.policies);
      const instId = uid();
      required.push({
        kind: "policy",
        id: instId,
        defId: p.id,
        title: p.title,
        kicker: `${p.department} / 政策判断`,
        body: p.body,
        choices: p.choices.map(c => ({ id: c.id, title: c.title, desc: c.desc, hint: c.hint }))
      });

      notifications.push({
        year: nation.year,
        from: p.department,
        title: `${p.department}より政策提案：${p.title}`,
        body: "決断が求められています。先送りは別の形でコスト化します。",
      });

      // also a small news ping
      news.push({
        kind: "policy",
        title: pick(p.newsPings),
        body: pick(p.newsBodies),
        tags: [p.tag, "政策"],
        source: pick(p.sources),
        severity: "info",
        year: nation.year
      });

      nation.historyDraft.push(`政策提案：${p.title}`);
    }

    return { news, notifications };
  }

  function popRequiredDecision(){
    return required.shift() ?? null;
  }

  function applyDecision(payload, { nation }, news, deptView){
    const p = policies.policies.find(x => x.id === payload.defId);
    if(!p) return;

    const choice = p.choices.find(c => c.id === payload.choiceId);
    if(!choice) return;

    // Apply hidden effects (no bar UI)
    const eff = choice.effect ?? {};
    const st = nation.hidden.structural;
    const sh = nation.hidden.shocks;
    const pr = nation.hidden.pressures;
    const cm = nation.hidden.comms;

    // structural
    for(const k of Object.keys(eff.structural ?? {})){
      st[k] = (st[k] ?? 0) + eff.structural[k];
    }
    // shocks
    for(const k of Object.keys(eff.shocks ?? {})){
      sh[k] = (sh[k] ?? 0) + eff.shocks[k];
    }
    // pressures
    for(const k of Object.keys(eff.pressures ?? {})){
      pr[k] = (pr[k] ?? 0) + eff.pressures[k];
    }
    // comms
    for(const k of Object.keys(eff.comms ?? {})){
      cm[k] = (cm[k] ?? 0) + eff.comms[k];
    }

    const consequence = {
      kind: "policy",
      title: choice.consequenceTitle ?? `${p.title}、波紋が広がる`,
      body: choice.consequenceBody ?? "政策の評価は割れた。短期の効能と長期の歪みが同時に積み上がる。",
      tags: [p.tag, "余波"],
      source: pick(p.sources),
      severity: choice.consequenceSeverity ?? "warn",
      year: nation.year
    };
    news.push(consequence, nation.year);

    deptView.addInboxItems([{
      year: nation.year,
      from: p.department,
      title: `決断の記録：${p.title}`,
      body: consequence.body
    }]);

    nation.historyDraft.push(`政策決断：${p.title}（選択：${payload.choiceId}）`);
  }

  return { tick, popRequiredDecision, applyDecision };
}
