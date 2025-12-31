function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

export function createElectionSystem(){
  const cycle = 5; // every 5 years

  function isElectionYear(nation){
    return nation.year % cycle === 0;
  }

  function nextElectionYear(nation){
    const r = nation.year % cycle;
    if(r === 0) return `建国${nation.year}年`;
    return `建国${nation.year + (cycle - r)}年`;
  }

  function resolve({ approval, nation }){
    // Support <20 is very dangerous; but still allow rare miracles above 15
    let loseProb = 0.0;

    if(approval <= 10) loseProb = 0.98;
    else if(approval <= 15) loseProb = 0.90;
    else if(approval <= 20) loseProb = 0.78;
    else if(approval <= 25) loseProb = 0.55;
    else if(approval <= 30) loseProb = 0.35;
    else if(approval <= 40) loseProb = 0.18;
    else loseProb = 0.08;

    // Mature phase: incumbents are judged harsher during stagnation
    if(nation.phase === "mature") loseProb += 0.06;

    loseProb = clamp(loseProb, 0.02, 0.98);

    const lose = Math.random() < loseProb;
    return { lose, loseProb };
  }

  function buildEpilogue({ nation, opinion, economy }){
    const lines = [];
    lines.push(`建国${nation.year}年、選挙はあなたに退場を命じた。`);
    lines.push(`支持率は${opinion.approval}%、GDPは「${economy.gdpTier}」。`);
    lines.push("");
    lines.push("あなたの政権は、危機の同時多発に追われ続けた。");
    lines.push("判断の一部は正しかった。だが、時間と信頼は足りなかった。");
    lines.push("");
    lines.push("歴史家の評：");
    if(opinion.approval <= 20){
      lines.push("「危機の連鎖が統治能力への疑念を決定づけた」");
    } else {
      lines.push("「国民は不安定な均衡の先送りに終止符を打った」");
    }
    if(nation.phase === "mature"){
      lines.push("「成熟国家の舵取りは、成功が見えにくい。失敗だけが目立つ」");
    }
    lines.push("");
    lines.push("再挑戦すれば、ニュースの兆候は違って見えるだろう。");
    return lines.join("\n");
  }

  return { isElectionYear, resolve, buildEpilogue, nextElectionYear };
}
