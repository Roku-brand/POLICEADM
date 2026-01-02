// Nation Simulation Game - Main Entry Point
// 都市国家運営シミュレーション（危機管理ドリブン）

import { createNationState } from './state/nationState.js';
import { createPublicOpinion } from './state/publicOpinion.js';
import { createEconomyState } from './state/economyState.js';
import { createCrisisSystem } from './systems/crisisSystem.js';
import { createElectionSystem } from './systems/electionSystem.js';
import { createNewsSystem } from './systems/newsSystem.js';
import { createPolicySystem } from './systems/policySystem.js';
import { mountDashboard } from './ui/dashboard.js';
import { mountMapView } from './ui/mapView.js';
import { mountNewsFeed } from './ui/newsFeed.js';
import { mountDepartmentView } from './ui/departmentView.js';
import { mountDecisionModal } from './ui/decisionModal.js';
import { mountCommandPanel } from './ui/commandPanel.js';
import { mountTaskStrip } from './ui/taskStrip.js';
import { mountLogPanel } from './ui/logPanel.js';
import { mountQuickMenu } from './ui/quickMenu.js';
import { mountTopBar } from './ui/topBar.js';

// ========== LOAD DATA ==========
async function loadData(){
  const [crises, newsTemplates, departments, policies] = await Promise.all([
    fetch('./data/crises.json').then(r => r.json()),
    fetch('./data/newsTemplates.json').then(r => r.json()),
    fetch('./data/departments.json').then(r => r.json()),
    fetch('./data/policies.json').then(r => r.json()),
  ]);
  return { crises, newsTemplates, departments, policies };
}

// ========== GAME STATE ==========
let gameState = {
  running: false,
  paused: false,
  gameOver: false,
};

let nation = null;
let opinion = null;
let economy = null;
let crisisSystem = null;
let electionSystem = null;
let newsSystem = null;
let policySystem = null;

// UI Controllers
let dashboard = null;
let mapView = null;
let newsFeed = null;
let deptView = null;
let decisionModal = null;
let commandPanel = null;
let taskStrip = null;
let logPanel = null;
let quickMenu = null;
let topBar = null;

let dataStore = null;

// ========== INITIALIZATION ==========
async function init(){
  try {
    dataStore = await loadData();
  } catch (error) {
    console.error('Failed to load game data:', error);
    showOverlay(
      '読み込みエラー',
      'ゲームデータの読み込みに失敗しました。ページを再読み込みしてください。',
      false
    );
    return;
  }

  // Mount UI
  dashboard = mountDashboard();
  topBar = mountTopBar({
    onAdvanceYear: handleAdvanceYear
  });
  
  mapView = mountMapView(document.getElementById('mapContainer'));
  
  logPanel = mountLogPanel(document.getElementById('logContent'));
  
  deptView = mountDepartmentView(
    document.getElementById('departmentViewContainer'),
    dataStore.departments
  );
  
  newsFeed = mountNewsFeed(document.getElementById('newsViewContainer'));
  
  decisionModal = mountDecisionModal({
    onChoice: handleDecisionChoice
  });
  
  commandPanel = mountCommandPanel({
    onAction: handleCommandAction
  });
  
  taskStrip = mountTaskStrip({
    onClick: handleTaskClick
  });
  
  quickMenu = mountQuickMenu({
    onViewChange: handleViewChange
  });

  // Event Listeners
  document.getElementById('startBtn').addEventListener('click', startGame);
  // Note: btnFastForward is handled in topBar.js

  // Show start overlay
  showOverlay(
    '🏛️ 都市国家運営シミュレーション',
    'あなたは都市国家の指導者です。<br>危機を乗り越え、国民の支持を維持し、選挙を勝ち抜いてください。<br><br>危機は常に同時多発します。すべてを完璧に対処することはできません。<br>優先順位を付け、最善の判断を下してください。',
    false
  );
}

function startGame(){
  // Initialize game state
  nation = createNationState();
  opinion = createPublicOpinion({ initialApproval: 55 });
  economy = createEconomyState();
  
  crisisSystem = createCrisisSystem({ crisisDefs: dataStore.crises });
  electionSystem = createElectionSystem();
  newsSystem = createNewsSystem({ templates: dataStore.newsTemplates });
  policySystem = createPolicySystem({ policies: dataStore.policies });

  gameState.running = true;
  gameState.paused = false;
  gameState.gameOver = false;

  // Initialize crises
  crisisSystem.ensureBaseline(nation);

  // Initial news
  newsSystem.pushImmediate({
    kind: 'system',
    title: '新政権発足',
    body: '国民の期待を背負い、新たな政権が発足しました。これからの舵取りが試されます。',
    tags: ['政治', '発足'],
    source: '国営放送',
    severity: 'info',
    year: nation.year
  });

  hideOverlay();
  updateUI();
}

function handleAdvanceYear(){
  if(!gameState.running || gameState.paused || gameState.gameOver) return;
  if(decisionModal.isOpen()) return; // Don't advance while deciding

  // Check for pending decisions first
  const pendingCrisis = crisisSystem.popRequiredDecision();
  if(pendingCrisis){
    decisionModal.open(pendingCrisis);
    return;
  }
  const pendingPolicy = policySystem.popRequiredDecision();
  if(pendingPolicy){
    decisionModal.open(pendingPolicy);
    return;
  }

  // Advance year
  nation.advanceYear();
  nation.updatePhase();

  // Tick all systems
  const crisisResult = crisisSystem.tick({ nation, opinion, economy });
  const policyResult = policySystem.tick({ nation });

  // Push news
  for(const n of crisisResult.news){
    newsSystem.push(n, nation.year);
  }
  for(const n of policyResult.news){
    newsSystem.push(n, nation.year);
  }

  // Add department notifications
  deptView.addInboxItems(crisisResult.notifications);
  deptView.addInboxItems(policyResult.notifications);

  // Flush delayed news
  newsSystem.flushDue(nation.year);

  // Update economy
  economy.tick({
    year: nation.year,
    phase: nation.phase,
    structural: nation.hidden.structural,
    shocks: nation.hidden.shocks
  });

  // Update public opinion
  opinion.tick({
    year: nation.year,
    phase: nation.phase,
    pressures: nation.hidden.pressures,
    shocks: nation.hidden.shocks,
    comms: nation.hidden.comms
  });

  // Check for election
  if(electionSystem.isElectionYear(nation)){
    handleElection();
    return;
  }

  // Check for pending decisions after tick
  const newPendingCrisis = crisisSystem.popRequiredDecision();
  if(newPendingCrisis){
    decisionModal.open(newPendingCrisis);
  } else {
    const newPendingPolicy = policySystem.popRequiredDecision();
    if(newPendingPolicy){
      decisionModal.open(newPendingPolicy);
    }
  }

  updateUI();
}

function handleElection(){
  const result = electionSystem.resolve({ approval: opinion.approval, nation });
  
  if(result.lose){
    gameState.gameOver = true;
    gameState.running = false;
    const epilogue = electionSystem.buildEpilogue({ nation, opinion, economy });
    showOverlay('選挙敗北', epilogue, true);
  } else {
    // Won election
    newsSystem.pushImmediate({
      kind: 'election',
      title: '選挙勝利',
      body: '国民は現政権の継続を選択しました。新たな任期が始まります。',
      tags: ['選挙', '政治'],
      source: '国営放送',
      severity: 'info',
      year: nation.year
    });
    updateUI();
  }
}

function handleDecisionChoice(payload){
  if(payload.kind === 'crisis'){
    crisisSystem.applyDecision(
      payload,
      { nation, opinion, economy },
      newsSystem,
      deptView
    );
  } else if(payload.kind === 'policy'){
    policySystem.applyDecision(
      payload,
      { nation },
      newsSystem,
      deptView
    );
  }
  updateUI();
}

function handleCommandAction(action){
  if(!gameState.running) return;
  
  if(action === 'crisis'){
    const pending = crisisSystem.popRequiredDecision();
    if(pending){
      decisionModal.open(pending);
    } else {
      // No pending crisis decisions - show a message
      newsSystem.pushImmediate({
        kind: 'system',
        title: '緊急案件なし',
        body: '現在、即座の対応が必要な緊急案件はありません。年を進めると状況が変化します。',
        tags: ['システム'],
        source: 'システム',
        severity: 'info',
        year: nation.year
      });
      updateUI();
    }
  } else if(action === 'policy'){
    const pending = policySystem.popRequiredDecision();
    if(pending){
      decisionModal.open(pending);
    } else {
      newsSystem.pushImmediate({
        kind: 'system',
        title: '政策案件なし',
        body: '現在、決断が必要な政策案件はありません。年を進めると新たな提案が出されることがあります。',
        tags: ['システム'],
        source: 'システム',
        severity: 'info',
        year: nation.year
      });
      updateUI();
    }
  } else if(action === 'diplomacy'){
    newsSystem.pushImmediate({
      kind: 'system',
      title: '外交チャンネル',
      body: '外交姿勢の変更は、危機対応や政策決断を通じて行われます。安全保障関連の危機が発生した際に選択肢が提示されます。',
      tags: ['外交', 'システム'],
      source: 'システム',
      severity: 'info',
      year: nation.year
    });
    updateUI();
  }
}

function handleTaskClick(task){
  if(task.kind === 'crisis'){
    const pending = crisisSystem.popRequiredDecision();
    if(pending && pending.id === task.id){
      decisionModal.open(pending);
    }
  } else if(task.kind === 'policy'){
    const pending = policySystem.popRequiredDecision();
    if(pending && pending.id === task.id){
      decisionModal.open(pending);
    }
  }
}

function handleViewChange(view){
  const mapContainer = document.getElementById('mapContainer');
  const newsView = document.getElementById('newsViewContainer');
  const deptViewEl = document.getElementById('departmentViewContainer');
  const securityView = document.getElementById('securityViewContainer');
  const economyView = document.getElementById('economyViewContainer');
  const settingsView = document.getElementById('settingsViewContainer');

  // Hide all
  mapContainer.classList.add('hidden');
  newsView.classList.add('hidden');
  deptViewEl.classList.add('hidden');
  securityView.classList.add('hidden');
  economyView.classList.add('hidden');
  settingsView.classList.add('hidden');

  // Show selected
  switch(view){
    case 'map':
      mapContainer.classList.remove('hidden');
      break;
    case 'news':
      newsView.classList.remove('hidden');
      if(gameState.running){
        newsFeed.render(newsSystem.getRecent(20));
      }
      break;
    case 'department':
      deptViewEl.classList.remove('hidden');
      if(gameState.running){
        deptView.renderReport({
          nation,
          opinion,
          economy,
          hidden: nation.hidden,
          year: nation.year
        });
      }
      break;
    case 'security':
      securityView.classList.remove('hidden');
      securityView.innerHTML = `
        <div class="card">
          <div class="card__title">安全保障概況</div>
          <div class="card__text">
            安全保障の詳細は国防省の報告書をご確認ください。<br><br>
            緊急事態が発生した場合は、左パネルの「緊急対応」から対処してください。
          </div>
        </div>
      `;
      break;
    case 'economy':
      economyView.classList.remove('hidden');
      economyView.innerHTML = `
        <div class="card">
          <div class="card__title">経済概況</div>
          <div class="card__text">
            現在のGDP: ${economy?.gdpTier ?? '不明'}<br><br>
            経済の詳細は財政省の報告書をご確認ください。<br>
            株価暴落や金融不安が発生した場合は、緊急対応が求められます。
          </div>
        </div>
      `;
      break;
    case 'settings':
      settingsView.classList.remove('hidden');
      settingsView.innerHTML = `
        <div class="card">
          <div class="card__title">設定</div>
          <div class="card__text">
            このゲームでは、危機は常に同時多発します。<br>
            年を進めることで状況が変化し、新たな危機や政策判断が発生します。<br><br>
            <strong>ゲームのルール:</strong><br>
            • 支持率を維持して選挙を勝ち抜く<br>
            • 支持率20%以下で選挙は非常に厳しい<br>
            • 選挙は5年ごとに行われる<br>
            • 危機を完全に解決することはできない<br>
            • 決断には必ずトレードオフがある
          </div>
        </div>
      `;
      break;
  }
}

function updateUI(){
  if(!gameState.running) return;

  // Update top bar / dashboard
  dashboard.setYear(nation.year);
  dashboard.setApproval(opinion.approval);
  dashboard.setGdpTier(economy.gdpTier);
  dashboard.setPhase(nation.phaseLabel);
  dashboard.setNextElection(electionSystem.nextElectionYear(nation));

  // Update approval color
  const approvalEl = document.getElementById('uiApproval');
  if(approvalEl){
    approvalEl.classList.remove('low', 'critical');
    if(opinion.approval <= 20){
      approvalEl.classList.add('critical');
    } else if(opinion.approval <= 35){
      approvalEl.classList.add('low');
    }
  }

  // Update map
  mapView.render({
    nation,
    opinion,
    economy
  });

  // Update log panel
  logPanel.render(newsSystem.getRecent(10));

  // Update task strip with active crises/policies
  const tasks = buildTaskList();
  taskStrip.render(tasks);

  // Update command panel alert state
  commandPanel.updateAlertState({
    hasCrisis: tasks.some(t => t.kind === 'crisis' && t.urgent),
    hasPolicy: tasks.some(t => t.kind === 'policy')
  });
}

function buildTaskList(){
  const tasks = [];
  
  // Get active crises from the crisis definitions
  // We'll use news items to indicate active crises
  const recentNews = newsSystem.getRecent(30);
  const crisisNews = recentNews.filter(n => n.kind === 'crisis');
  
  // Group by crisis type (deduplicate)
  const seenCrises = new Set();
  for(const n of crisisNews){
    const key = n.tags?.[0] ?? n.title;
    if(!seenCrises.has(key) && seenCrises.size < 4){
      seenCrises.add(key);
      tasks.push({
        id: key,
        kind: 'crisis',
        title: n.title,
        stage: n.tags?.[1] ?? '進行中',
        desc: n.body?.slice(0, 60) + '...',
        urgent: n.severity === 'bad'
      });
    }
  }

  // Add policy tasks
  const policyNews = recentNews.filter(n => n.kind === 'policy');
  const seenPolicies = new Set();
  for(const n of policyNews){
    const key = n.tags?.[0] ?? n.title;
    if(!seenPolicies.has(key) && seenPolicies.size < 2){
      seenPolicies.add(key);
      tasks.push({
        id: key,
        kind: 'policy',
        title: n.title,
        stage: '検討中',
        desc: n.body?.slice(0, 60) + '...',
        urgent: false
      });
    }
  }

  return tasks;
}

function showOverlay(title, message, showStats = false){
  const overlay = document.getElementById('gameOverlay');
  document.getElementById('overlayTitle').textContent = title;
  document.getElementById('overlayMessage').innerHTML = message.replace(/\n/g, '<br>');

  const finalStats = document.getElementById('finalStats');
  if(showStats){
    finalStats.classList.remove('hidden');
    document.getElementById('finalScore').textContent = message;
  } else {
    finalStats.classList.add('hidden');
  }

  const startBtn = document.getElementById('startBtn');
  startBtn.textContent = gameState.gameOver ? 'もう一度プレイ' : 'ゲームを開始';

  overlay.classList.remove('hidden');
}

function hideOverlay(){
  document.getElementById('gameOverlay').classList.add('hidden');
}

// ========== START ==========
init();
