function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

export function mountDepartmentView(container, departments){
  let selected = departments.departments[0]?.id ?? "finance";
  const inbox = [];

  function addInboxItems(items){
    for(const it of items){
      inbox.push(it);
    }
    // keep last 80
    while(inbox.length > 80) inbox.shift();
  }

  function getInbox(){
    return inbox.slice();
  }

  function renderReport({ nation, opinion, economy, hidden, year }){
    container.innerHTML = "";

    // Buttons
    const btnRow = document.createElement("div");
    btnRow.className = "deptList";
    for(const d of departments.departments){
      const b = document.createElement("button");
      b.className = "deptBtn" + (d.id === selected ? " deptBtn--active" : "");
      b.textContent = d.name;
      b.addEventListener("click", () => {
        selected = d.id;
        renderReport({ nation, opinion, economy, hidden, year });
      });
      btnRow.appendChild(b);
    }
    container.appendChild(btnRow);

    const d = departments.departments.find(x => x.id === selected);
    if(!d) return;

    const body = buildDeptText(d, { nation, opinion, economy, hidden, year });

    const report = document.createElement("div");
    report.className = "deptReport";
    report.innerHTML = `
      <div class="deptReport__title">${escapeHtml(d.name)} 年次ブリーフ</div>
      <div class="deptReport__meta">建国${year}年 / 文体：${escapeHtml(d.tone)}</div>
      <div class="deptReport__body">${escapeHtml(body).replaceAll("\n","<br/>")}</div>
    `;
    container.appendChild(report);
  }

  function buildDeptText(dept, ctx){
    // Data-driven tone: optimistic / bureaucratic / alarmist
    const st = ctx.hidden.structural;
    const sh = ctx.hidden.shocks;
    const pr = ctx.hidden.pressures;

    // Create “report” from hidden state WITHOUT bars
    if(dept.id === "finance"){
      const lines = [];
      if(dept.tone === "保身・言い回し重視"){
        lines.push("概況：財政運営は、現時点では管理可能な範囲にあります。");
        lines.push("ただし、将来の柔軟性を損ねる要因が複合しています。");
      } else {
        lines.push("概況：財政の余裕は薄く、危機が続くと選択肢が急速に狭まります。");
      }
      lines.push("");
      lines.push("論点：");
      lines.push("・予備費の余力は、危機対応の頻度に比例して目減りしています。");
      lines.push("・先送りしたツケは『維持費』として静かに増え、ある日まとめて跳ねます。");
      lines.push("");
      lines.push("示唆：");
      if(st.fiscalFlex < -3) lines.push("・余力が枯れつつあります。派手な対応は政治的には効いても、次の危機で詰みます。");
      else lines.push("・余力はまだ残っていますが、安心材料ではありません。");
      return lines.join("\n");
    }

    if(dept.id === "infrastructure"){
      const lines = [];
      lines.push("概況：都市機能は一見回っています。しかし、見えない劣化が進んでいます。");
      lines.push("");
      lines.push("観測：");
      if(st.infraMaintenanceDebt > 18) lines.push("・老朽化の累積が危険域。小さな豪雨でも大事故になり得ます。");
      else if(st.infraMaintenanceDebt > 10) lines.push("・維持更新の遅れが目立ち始めました。");
      else lines.push("・当面は維持できますが、油断は禁物です。");
      lines.push("");
      lines.push("示唆：");
      lines.push("・インフラは『作る』より『維持する』方が政治的に地味で、だが国家を救います。");
      return lines.join("\n");
    }

    if(dept.id === "defense"){
      const lines = [];
      if(dept.tone === "危機煽り・最悪想定"){
        lines.push("概況：対外環境は悪化しています。油断は敗北に直結します。");
      } else {
        lines.push("概況：抑止は成り立っていますが、偶発が起きれば政治問題化は避けられません。");
      }
      lines.push("");
      lines.push("観測：");
      if(st.defenseReadiness < -3) lines.push("・抑止力の低下が疑われます。相手は踏み込む理由を探しています。");
      else lines.push("・緊張は高止まり。領海・サイバー領域の摩耗が続いています。");
      lines.push("");
      lines.push("示唆：");
      lines.push("・強硬は短期支持を得ますが、緊張を固定化します。弱腰は別の形でコスト化します。");
      return lines.join("\n");
    }

    if(dept.id === "education"){
      const lines = [];
      if(dept.tone === "楽観・成長志向"){
        lines.push("概況：投資の芽はあります。時間が味方になれば、国の体質は変わります。");
      } else {
        lines.push("概況：即効性は乏しいが、ここを削ると未来の選択肢が消えます。");
      }
      lines.push("");
      lines.push("観測：");
      if(st.educationBase > 8) lines.push("・人的資本の蓄積が見え始めました。10年単位で効いてきます。");
      else lines.push("・効果はまだ薄い。だが“始めたかどうか”が後で効きます。");
      lines.push("");
      lines.push("示唆：");
      lines.push("・危機対応に追われるほど、教育は削られます。削った年数は、そのまま国家の寿命になります。");
      return lines.join("\n");
    }

    if(dept.id === "welfare"){
      const lines = [];
      lines.push("概況：社会の不安は、目に見えない速度で蓄積します。");
      lines.push("");
      lines.push("観測：");
      if(pr.anxiety > 10) lines.push("・将来不安が強い。政策の中身より“信頼”が先に問われます。");
      else lines.push("・不安はあるが、まだ制御可能。");
      lines.push("");
      lines.push("示唆：");
      lines.push("・支援は即効性がある一方で、持続性を誤ると財政が詰みます。");
      return lines.join("\n");
    }

    return "現況：報告対象が定義されていません。";
  }

  return { renderReport, addInboxItems, getInbox };
}
