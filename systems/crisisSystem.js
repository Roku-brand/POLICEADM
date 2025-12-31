function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }

const STAGES = ["signal", "worsening", "breakout", "politicized"];

export function createCrisisSystem({ crisisDefs }){
  const active = []; // { id, defId, stageIndex, heat, createdYear, lastEscalatedYear, pendingDecision? }
  const requiredDecisions = []; // queue

  function ensureBaseline(nation){
    // Keep 2-4 latent crises always present
    while(active.length < 2){
      active.push(spawn(nation.year));
    }
    while(active.length > 4){
      active.pop();
    }
  }

  function spawn(currentYear){
    const def = pick(crisisDefs.crises);
    return {
      id: uid(),
      defId: def.id,
      stageIndex: 0,
      heat: def.baseHeat ?? 1,
      createdYear: currentYear,
      lastEscalatedYear: currentYear,
      pendingDecision: null,
    };
  }

  function getDef(defId){
    const d = crisisDefs.crises.find(x => x.id === defId);
    if(!d) throw new Error(`Missing crisis def: ${defId}`);
    return d;
  }

  function maybeEscalate(cr, nation){
    const def = getDef(cr.defId);
    const phase = nation.phase;

    // Escalation chance: high frequency by design
    let p = def.escalationChance ?? 0.55;
    if(phase === "dawn") p += 0.08;
    if(phase === "mature") p += 0.10;

    // Structural vulnerabilities amplify escalation
    const st = nation.hidden.structural;
    if(def.category === "disaster" && st.infraMaintenanceDebt > 10) p += 0.15;
    if(def.category === "pandemic" && st.publicHealthCapacity < 0) p += 0.12;
    if(def.category === "security" && st.defenseReadiness < 0) p += 0.12;
    if(def.category === "economy" && st.fiscalFlex < 0) p += 0.10;

    // Cooling: if recently escalated, still possible (no safety)
    p = clamp(p, 0.15, 0.92);

    const will = Math.random() < p;
    if(will && cr.stageIndex < STAGES.length - 1){
      cr.stageIndex += 1;
      cr.lastEscalatedYear = nation.year;
      cr.heat += 1;
      return true;
    }
    return false;
  }

  function tick({ nation, opinion, economy }){
    ensureBaseline(nation);

    const news = [];
    const notifications = [];

    // Keep 2-4 by adding new ones if resolved or if fewer
    while(active.length < 2) active.push(spawn(nation.year));
    while(active.length > 4) active.splice(Math.floor(Math.random()*active.length), 1);

    // Progress each crisis & sometimes demand a decision
    for(const cr of active){
      const def = getDef(cr.defId);
      const escalated = maybeEscalate(cr, nation);

      // Always emit some narrative signal occasionally even without escalation
      const stage = STAGES[cr.stageIndex];

      // Update hidden shocks/pressures based on stage
      applyPassiveImpact(def, stage, nation);

      // News creation: high frequency
      if(escalated || Math.random() < (def.newsPingChance ?? 0.55)){
        const item = buildNews(def, stage, nation.year, cr.heat);
        news.push(item);

        // Inbox: department notification at worsening+ or by chance
        if(cr.stageIndex >= 1 || Math.random() < 0.50){
          notifications.push({
            year: nation.year,
            from: def.department,
            title: `${def.department}より報告：${def.title}`,
            body: buildNotification(def, stage),
          });
        }
      }

      // Required decisions: breakout or politicized, often forced
      const forceAt = def.forceDecisionAtStage ?? "breakout";
      const forceIndex = STAGES.indexOf(forceAt);
      const shouldForce = cr.stageIndex >= forceIndex && (cr.pendingDecision == null);

      // Also allow earlier forced decisions
      const earlyForce = stage === "worsening" && Math.random() < 0.20 && cr.pendingDecision == null;

      if(shouldForce || earlyForce){
        cr.pendingDecision = buildDecision(def, stage, cr.id);
        requiredDecisions.push(cr.pendingDecision);
      }
    }

    // Maintain permanent pressure: always something simmering
    nation.hidden.pressures.fatigue += 0.25;
    nation.historyDraft.push(`危機の同時進行：${active.length}件`);

    return { news, notifications };
  }

  function applyPassiveImpact(def, stage, nation){
    const shocks = nation.hidden.shocks;
    const pressures = nation.hidden.pressures;

    const heat = (stage === "signal") ? 0.8 :
                 (stage === "worsening") ? 1.2 :
                 (stage === "breakout") ? 1.7 : 2.2;

    // category-specific
    if(def.category === "disaster"){
      shocks.disaster += 0.9 * heat;
      pressures.anxiety += 0.35 * heat;
      nation.hidden.structural.infraMaintenanceDebt += 0.4 * heat;
    }
    if(def.category === "pandemic"){
      shocks.pandemic += 1.0 * heat;
      pressures.anxiety += 0.45 * heat;
      nation.hidden.structural.publicHealthCapacity -= 0.25 * heat;
    }
    if(def.category === "security"){
      shocks.security += 0.95 * heat;
      pressures.anxiety += 0.40 * heat;
      nation.hidden.structural.defenseReadiness -= 0.25 * heat;
    }
    if(def.category === "economy"){
      shocks.market += 1.0 * heat;
      pressures.anxiety += 0.30 * heat;
      pressures.inequality += 0.18 * heat;
      nation.hidden.structural.fiscalFlex -= 0.18 * heat;
    }
  }

  function buildNews(def, stage, year, heat){
    const headline = pick(def.headlines[stage]);
    const body = pick(def.bodies[stage]);
    const severity =
      stage === "signal" ? "info" :
      stage === "worsening" ? "warn" :
      stage === "breakout" ? "bad" : "bad";

    return {
      kind: "crisis",
      title: headline,
      body,
      tags: [def.tag, stageLabel(stage)],
      source: pick(def.sources),
      severity,
      year
    };
  }

  function buildNotification(def, stage){
    const tone = stageLabel(stage);
    if(stage === "signal") return `兆候を確認。現時点では限定的だが、看過は危険。(${tone})`;
    if(stage === "worsening") return `状況が悪化。対応の遅れは政治問題化し得る。(${tone})`;
    if(stage === "breakout") return `現場が限界。緊急対応が必要。(${tone})`;
    return `政権責任を問う声が拡大。説明と対応の両面が必要。(${tone})`;
  }

  function stageLabel(stage){
    if(stage === "signal") return "兆候";
    if(stage === "worsening") return "悪化";
    if(stage === "breakout") return "爆発";
    return "政治問題化";
  }

  function buildDecision(def, stage, crisisInstanceId){
    const pool = def.decisions[stage] ?? def.decisions["breakout"];
    const d = pick(pool);

    return {
      kind: "crisis",
      id: crisisInstanceId,
      defId: def.id,
      title: d.title,
      kicker: `${def.title} / ${stageLabel(stage)}`,
      body: d.body,
      choices: d.choices.map(c => ({
        id: c.id,
        title: c.title,
        desc: c.desc,
        hint: c.hint
      }))
    };
  }

  function popRequiredDecision(){
    return requiredDecisions.shift() ?? null;
  }

  function applyDecision(payload, { nation, opinion, economy }, news, deptView){
    const cr = active.find(x => x.id === payload.id);
    const def = getDef(payload.defId);

    // clear pending decision
    if(cr) cr.pendingDecision = null;

    // Apply effects based on chosen option (hidden, narrative-forward)
    const effect = findChoiceEffect(def, payload.choiceId);
    if(effect){
      // shocks
      const s = nation.hidden.shocks;
      const p = nation.hidden.pressures;
      const st = nation.hidden.structural;
      const c = nation.hidden.comms;

      s.market += (effect.shocks?.market ?? 0);
      s.security += (effect.shocks?.security ?? 0);
      s.disaster += (effect.shocks?.disaster ?? 0);
      s.pandemic += (effect.shocks?.pandemic ?? 0);

      p.anxiety += (effect.pressures?.anxiety ?? 0);
      p.inequality += (effect.pressures?.inequality ?? 0);
      p.fatigue += (effect.pressures?.fatigue ?? 0);

      st.infraMaintenanceDebt += (effect.structural?.infraMaintenanceDebt ?? 0);
      st.publicHealthCapacity += (effect.structural?.publicHealthCapacity ?? 0);
      st.defenseReadiness += (effect.structural?.defenseReadiness ?? 0);
      st.educationBase += (effect.structural?.educationBase ?? 0);
      st.fiscalFlex += (effect.structural?.fiscalFlex ?? 0);

      c.transparency += (effect.comms?.transparency ?? 0);
      c.empathy += (effect.comms?.empathy ?? 0);
    }

    // Narrative consequences as delayed news
    const consequence = buildConsequenceNews(def, payload.choiceId, nation);
    news.push(consequence, nation.year);

    // Dept inbox note
    deptView.addInboxItems([{
      year: nation.year,
      from: def.department,
      title: `決断の記録：${def.title}`,
      body: consequence.body
    }]);

    nation.historyDraft.push(`危機対応：${def.title}（選択：${payload.choiceId}）`);

    // Optional: resolve crisis sometimes
    if(cr){
      // Not a guaranteed fix: can still worsen later
      const settleChance = (payload.choiceId.includes("full") ? 0.55 : payload.choiceId.includes("limited") ? 0.35 : 0.18);
      if(Math.random() < settleChance){
        // reduce stage a bit, but never fully safe
        cr.stageIndex = Math.max(0, cr.stageIndex - 1);
        cr.heat = Math.max(1, cr.heat - 1);
      } else {
        // partial: keep
      }
    }

    // keep baseline
    ensureBaseline(nation);
  }

  function buildConsequenceNews(def, choiceId, nation){
    const map = def.choiceConsequences?.[choiceId];
    const tag = def.tag;

    if(map){
      return {
        kind: "crisis",
        title: map.title,
        body: map.body,
        tags: [tag, "余波"],
        source: pick(def.sources),
        severity: map.severity ?? "warn",
        year: nation.year
      };
    }

    // fallback generic
    return {
      kind: "crisis",
      title: `${def.title}対応、評価は割れる`,
      body: "短期的な沈静化の気配がある一方で、後手に回ったとの批判も残った。次の一手が問われる。",
      tags: [tag, "余波"],
      source: "全国紙",
      severity: "warn",
      year: nation.year
    };
  }

  function findChoiceEffect(def, choiceId){
    // decisions contain effects per choice in definitions
    for(const stage of Object.keys(def.decisions)){
      for(const dec of def.decisions[stage]){
        for(const ch of dec.choices){
          if(ch.id === choiceId){
            return ch.effect ?? null;
          }
        }
      }
    }
    return null;
  }

  return {
    tick,
    ensureBaseline,
    popRequiredDecision,
    applyDecision,
  };
}
