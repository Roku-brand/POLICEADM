function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

export function createNewsSystem({ templates }){
  const items = []; // displayed
  const delayed = []; // { item, dueYear }

  function stampSeverity(sev){
    if(!sev) return "info";
    return sev;
  }

  function pushImmediate(item){
    items.push({
      ...item,
      severity: stampSeverity(item.severity),
      ts: Date.now() + Math.random()
    });
  }

  function push(item, currentYear){
    // Some news should be delayed
    const delayRule = templates.delayRules?.[item.kind] ?? { min: 0, max: 2, chance: 0.35 };
    const willDelay = Math.random() < (delayRule.chance ?? 0.35);
    const delay = willDelay ? (delayRule.min + Math.floor(Math.random()*(delayRule.max - delayRule.min + 1))) : 0;
    const due = currentYear + delay;

    const normalized = {
      ...item,
      year: item.year ?? currentYear,
      severity: stampSeverity(item.severity),
      ts: Date.now() + Math.random(),
    };

    if(delay === 0){
      items.push(normalized);
    } else {
      delayed.push({ item: normalized, dueYear: due });
    }
  }

  function flushDue(currentYear){
    const ready = delayed.filter(d => d.dueYear <= currentYear);
    for(const d of ready){
      items.push(d.item);
    }
    for(const d of ready){
      const idx = delayed.indexOf(d);
      if(idx >= 0) delayed.splice(idx, 1);
    }
  }

  function getRecent(n=30){
    // newest first
    return items.slice().sort((a,b)=> b.year - a.year || b.ts - a.ts).slice(0,n);
  }

  return {
    push,
    pushImmediate,
    flushDue,
    getRecent,
    templates
  };
}
