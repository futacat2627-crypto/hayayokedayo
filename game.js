const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* =====================
   画像・音
===================== */
const playerImg = new Image(); playerImg.src = "player.png";
const playerCheatImg = new Image(); playerCheatImg.src = "player_cheat.png";
const bgImg = new Image(); bgImg.src = "bg.png";
const bossImg = new Image(); bossImg.src = "enemy2.png";

const skillIcons = [1,2,3,4].map(i => {
  const img = new Image();
  img.src = `skill${i}.png`;
  return img;
});
// はやとモード用heavenアイコン（skill3の差し替え）
const heavenIcon = new Image(); heavenIcon.src = "heaven.png";

const bgm = document.getElementById("bgm");
bgm.volume = 0.4;
const bgm2 = new Audio("bgm2.mp3");
bgm2.loop = true;
bgm2.volume = 0.4;
const titleBgm = new Audio("title_bgm.mp3");
titleBgm.loop = true;
titleBgm.volume = 0.4;
const cheatSound = new Audio("cheat.mp3");
const clearBgm = new Audio("clear_bgm.mp3");
clearBgm.loop = true;
clearBgm.volume = 0.4;
const sakiClearBgm = new Audio("saki_clear_bgm.mp3");
sakiClearBgm.loop = true;
sakiClearBgm.volume = 0.4;

// さきモード用BGM
const sakiBgm1 = new Audio("saki_bgm1.mp3");  // 通常
const sakiBgm2 = new Audio("saki_bgm2.mp3");  // HP5555以下
const sakiBgm3 = new Audio("saki_bgm3.mp3");  // HP3333以下
const sakiBgm4 = new Audio("saki_bgm4.mp3");  // HP1111以下
[sakiBgm1, sakiBgm2, sakiBgm3, sakiBgm4].forEach(b => { b.loop = true; b.volume = 0.4; });
let sakiBgmPhase = 0; // 0=未開始, 1〜4
let bgmPhase2Started = false;

/* =====================
   チートコード
===================== */
const CHEAT_SEQUENCE = [
  "arrowleft","arrowleft","arrowup","arrowup",
  "arrowright","arrowright","arrowdown","arrowdown","arrowleft"," "
];
let cheatIndex = 0;
let cheatActivated = false;

// さきモード
const SAKI_SEQUENCE = ["s","a","k","i"];
let sakiIndex = 0;
let sakiMode = false;

// 真のはやとモード
let hayatoMode = false;
let titleEnterTime = Date.now();

// はやと弾幕配列
let hayatoPurpleBullets  = []; // 紫：ランダム移動+螺旋弾を撃つ
let hayatoOrbitBullets   = []; // 赤螺旋弾：飛びながら公転
let hayatoNavyBullets    = []; // 紺：枠沿い時計回り
let hayatoBlueBars       = []; // 青棒：左右どちらか落下（動いたら死）
let hayatoGreenBullets   = []; // 緑：上から落下
let hayatoYGBullets      = []; // 黄緑：3発照準
let hayatoYellowBullets  = []; // 黄：当たるとサイズ+50%
let hayatoOrangeBars     = []; // オレンジ棒：上下どちらか横移動（止まったら死）
let hayatoWhiteBullets2  = []; // 白：完全ランダム（はやと用）

// はやとフェーズフラグ
let hayatoPhase9000 = false;
let hayatoPhase8000 = false;
let hayatoPhase7000 = false;
let hayatoPhase6000 = false;
let hayatoPhase5000 = false;
let hayatoPhase2000 = false;
let hayatoPhase1000 = false;

// はやとスポーンタイマー
let hLastPurple = 0, hLastNavy = 0, hLastBlueBar = 0;
let hLastGreen  = 0, hLastYG   = 0, hLastYellow  = 0;
let hLastOrangeBar = 0, hLastWhite2 = 0;

// スキルリロード（はやとモードのみ：30秒で復活）
const skillReloadTime = [0, 0, 0, 0]; // 使用時刻を記録
const skillUseCount  = [0, 0, 0, 0]; // はやとモード：使用回数（5回で消滅）

// さきモード専用弾
let whiteBullets = [];    // 白：落下→凍結
let pinkBullets = [];     // ピンク：追跡→爆発
let crimsonBullets = [];  // 緋色：高速3発

let lastWhite = 0;
let lastCrimson = 0;
let sakiPhase5555 = false; // HP5555以下フラグ
let sakiPhase3333 = false;
let sakiPhase1111 = false;

// 凍結
let frozenUntil = 0;

// ボス用別画像（さきモード）
const sakiBossImg = new Image(); sakiBossImg.src = "saki.png";         // 通常
const sakiBossImg2 = new Image(); sakiBossImg2.src = "saki2.png";      // HP5555以下
const sakiBossImg3 = new Image(); sakiBossImg3.src = "saki3.png";      // HP3333以下
const sakiBossImg4 = new Image(); sakiBossImg4.src = "saki4.png";      // HP1111以下

// 真のはやとモード用
const hayatoBgImg   = new Image(); hayatoBgImg.src   = "hayato_bg.png";
const hayatoBossImg  = new Image(); hayatoBossImg.src  = "hayato.png";
const hayatoBossImg2 = new Image(); hayatoBossImg2.src = "hayato2.png"; // HP1000以下
const hayatoBgm1 = new Audio("hayato_bgm1.mp3");
const hayatoBgm2 = new Audio("hayato_bgm2.mp3"); // HP5000以下
const hayatoBgm3 = new Audio("hayato_bgm3.mp3"); // HP1000以下
[hayatoBgm1, hayatoBgm2, hayatoBgm3].forEach(b => { b.loop = true; b.volume = 0.4; });
let hayatoBgmPhase = 0;

const roarSound = new Audio("roar.mp3");
const evolveSound = new Audio("evolve.mp3");
const gameOverSound = new Audio("gameover.mp3");
const timestopSound = new Audio("timestop.mp3");
const teleportSound = new Audio("teleport.mp3");
const reverseSound = new Audio("reverse.mp3");
const heavenSound = new Audio("heaven.mp3");
const orangeCountdownSound = new Audio("orange_countdown.mp3");

// heaven状態（はやとモードのskill3）
let heavenActive = false;
let heavenEndTime = 0;

/* =====================
   定数
===================== */
const BASE_PLAYER_SIZE = Math.floor(32 * 0.65);
const PLAYER_HIT_RATIO = 0.25;

/* =====================
   状態
===================== */
let gameState = "title";
let inputMode = "pc"; // "pc" or "phone"

/* =====================
   ジョイスティック（phoneモード）
===================== */
const joystick = {
  active: false,
  baseX: 90, baseY: 0,
  touchX: 90, touchY: 0,
  radius: 65,
  knobRadius: 26
};

function initJoystickPos() {
  joystick.baseX = 90;
  joystick.baseY = canvas.height - 110;
  joystick.touchX = joystick.baseX;
  joystick.touchY = joystick.baseY;
}
// スキルアイコンのタッチ状態
const skillTouchIds = [null, null, null, null];
// リトライボタン
const retryBtn = { x: 0, y: 0, w: 200, h: 56 };

/* =====================
   プレイヤー
===================== */
const player = {
  x: 300,
  y: 200,
  size: BASE_PLAYER_SIZE,
  speed: 4,
  invincible: false
};

/* =====================
   敵
===================== */
const ENEMY_BASE_SIZE = 20;
const ENEMY_SPEED = 3;

function makeEnemy() {
  return {
    x: Math.random() * (canvas.width - ENEMY_BASE_SIZE),
    y: -ENEMY_BASE_SIZE,
    size: ENEMY_BASE_SIZE
  };
}

let enemies = [makeEnemy()];

const boss = {
  x: 320,
  y: 100,
  size: 64,
  phase: 0,
  hp: 3000,
  maxHp: 3000
};

/* =====================
   プレイヤー弾
===================== */
let playerBullets = [];
let lastPlayerShot = 0;
const PLAYER_SHOT_COOLDOWN = 200; // ms
let playerShotCooldown = PLAYER_SHOT_COOLDOWN;
let playerBulletDamage = 5;

/* =====================
   弾
===================== */
let bullets = [];
let blueBullets = [];
let yellowBullets = [];

/* =====================
   スキル
===================== */
const skillsUsed = [false, false, false, false];
let stopActive = false;
let stopEndTime = 0;

/* =====================
   オレンジ攻撃
===================== */
let orangeState = "idle"; 
// idle → countdown → active
let orangeTimer = 0;

/* =====================
   時間管理
===================== */
let startTime = 0;
let clearTime = 0;
let phase3Time = null;

let lastSpread = 0;
let lastBlue = 0;
let lastOrange = 0;
let lastYellow = 0;
let spreadCooldown = 800;

/* =====================
   入力
===================== */
const keys = {};
let playerMoving = false;

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  // ブラウザのスクロールや他のデフォルト動作を防ぐ
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }

  // チートコード判定（どの画面でも受け付ける）
  const key = e.key.toLowerCase();
  if (key === CHEAT_SEQUENCE[cheatIndex]) {
    cheatIndex++;
    if (cheatIndex >= CHEAT_SEQUENCE.length) {
      cheatActivated = true;
      cheatIndex = 0;
      cheatSound.currentTime = 0;
      cheatSound.play().catch(() => {}); // ファイルなくてもエラーで止まらない
    }
  } else {
    cheatIndex = (key === CHEAT_SEQUENCE[0]) ? 1 : 0;
  }

  // さきモード入力（タイトル画面のみ）
  if (gameState === "title") {
    if (key === SAKI_SEQUENCE[sakiIndex]) {
      sakiIndex++;
      if (sakiIndex >= SAKI_SEQUENCE.length) {
        sakiMode = true;
        titleEnterTime = Date.now(); // さきモード有効化時刻からカウント
        sakiIndex = 0;
        cheatSound.currentTime = 0;
        cheatSound.play().catch(() => {});
      }
    } else {
      sakiIndex = (key === SAKI_SEQUENCE[0]) ? 1 : 0;
    }

    // 真のはやとモード：PCモードでQ+E同時押し（さきモード解放済み時）
    if (inputMode === "pc" && sakiMode && !hayatoMode) {
      if (keys["q"] && keys["e"]) {
        hayatoMode = true;
        cheatSound.currentTime = 0;
        cheatSound.play().catch(() => {});
      }
    }
  }

  if (gameState === "gameover" && key === "r") resetGame();
  if ((gameState === "gameover" || gameState === "clear") && key === "p") goTitle();
  if (gameState === "clear" && key === "r") resetGame();
  if (bgm.paused && bgm2.paused && !sakiMode && gameState === "play") bgm.play();
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =====================
   初期化
===================== */
function resetGame() {
  gameState = "play";
  titleBgm.pause();
  titleBgm.currentTime = 0;
  clearBgm.pause();
  clearBgm.currentTime = 0;
  sakiClearBgm.pause();
  sakiClearBgm.currentTime = 0;
  playerShotCooldown = cheatActivated ? PLAYER_SHOT_COOLDOWN / 2 : PLAYER_SHOT_COOLDOWN;
  playerBulletDamage = cheatActivated ? 50 : 5;

  player.x = 300;
  player.y = 200;
  player.size = BASE_PLAYER_SIZE;
  player.invincible = false;
  player.teleportInvincible = false;

  enemies = [makeEnemy()];
  enemyPoweredUp = false;
  boss.phase = 0;

  bullets = [];
  blueBullets = [];
  yellowBullets = [];
  playerBullets = [];
  whiteBullets = [];
  pinkBullets = [];
  crimsonBullets = [];
  // はやとモード弾幕クリア
  hayatoPurpleBullets = []; hayatoOrbitBullets = []; hayatoNavyBullets = []; hayatoBlueBars = [];
  hayatoGreenBullets  = []; hayatoYGBullets   = []; hayatoYellowBullets = [];
  hayatoOrangeBars    = []; hayatoWhiteBullets2 = [];

  // HP設定（はやと優先）
  if (hayatoMode) {
    boss.hp = boss.maxHp = 9999;
  } else if (sakiMode) {
    boss.hp = boss.maxHp = 6666;
  } else {
    boss.hp = boss.maxHp = 3000;
  }

  // さきモード設定
  sakiPhase5555 = false;
  sakiPhase3333 = false;
  sakiPhase1111 = false;
  lastWhite = 0;
  lastCrimson = 0;
  frozenUntil = 0;
  sakiBgmPhase = 0;
  [sakiBgm1, sakiBgm2, sakiBgm3, sakiBgm4].forEach(b => { b.pause(); b.currentTime = 0; });

  // はやとモード設定
  hayatoPhase9000 = hayatoPhase8000 = hayatoPhase7000 = false;
  hayatoPhase6000 = hayatoPhase5000 = hayatoPhase2000 = hayatoPhase1000 = false;
  hLastPurple = hLastNavy = hLastBlueBar = 0;
  hLastGreen  = hLastYG   = hLastYellow  = 0;
  hLastOrangeBar = hLastWhite2 = 0;
  hayatoBgmPhase = 0;
  [hayatoBgm1, hayatoBgm2, hayatoBgm3].forEach(b => { b.pause(); b.currentTime = 0; });
  skillReloadTime.fill(0);
  skillUseCount.fill(0);

  skillsUsed.fill(false);
  stopActive = false;
  heavenActive = false;
  heavenEndTime = 0;
  orangeState = "idle";
  orangeTimer = 0;

  // チートモード発動時の即時効果
  if (cheatActivated) {
    skillsUsed.fill(false); // 全スキル復活（既にfillしてるが明示）
    player.invincible = true;
    player.teleportInvincible = true;
    setTimeout(() => {
      player.invincible = false;
      player.teleportInvincible = false;
    }, 5000);
    cheatActivated = "done";
  }

  spreadCooldown = 800;
  startTime = Date.now();
  phase3Time = null;

  lastSpread = lastBlue = lastOrange = lastYellow = 0;

  bgmPhase2Started = false;
  bgm2.pause();
  bgm2.currentTime = 0;
  if (hayatoMode) {
    hayatoBgm1.currentTime = 0;
    hayatoBgm1.play().catch(() => {});
    hayatoBgmPhase = 1;
  } else if (sakiMode) {
    sakiBgm1.currentTime = 0;
    sakiBgm1.play().catch(() => {});
    sakiBgmPhase = 1;
  } else {
    bgm.currentTime = 0;
    bgm.play();
  }
}

/* =====================
   弾生成
===================== */
function spawnSpread() {
  const n = 24;
  const base = Math.random() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = base + Math.PI * 2 / n * i;
    bullets.push({
      x: boss.x + boss.size / 2,
      y: boss.y + boss.size / 2,
      vx: Math.cos(a) * 3,
      vy: Math.sin(a) * 3,
      size: 6
    });
  }
}

function spawnBlue() {
  const dx = player.x - boss.x;
  const dy = player.y - boss.y;
  const len = Math.hypot(dx, dy);
  blueBullets.push({
    x: boss.x + boss.size / 2,
    y: boss.y + boss.size / 2,
    vx: dx / len * 2.5,
    vy: dy / len * 2.5,
    size: 14
  });
}

function spawnYellow() {
  const dx = player.x - boss.x;
  const dy = player.y - boss.y;
  const len = Math.hypot(dx, dy);
  yellowBullets.push({
    x: boss.x + boss.size / 2,
    y: boss.y + boss.size / 2,
    vx: dx / len * 1.2,
    vy: dy / len * 1.2,
    size: 12
  });
}

// さきモード：白弾（画面上から落下→凍結）
function spawnWhite() {
  const x = Math.random() * (canvas.width - 20);
  whiteBullets.push({
    x: x, y: -20,
    vx: 0, vy: 3,
    size: 14,
    frozen: false
  });
}

// さきモード：ピンク追跡弾
function spawnPink() {
  pinkBullets.push({
    x: boss.x + boss.size / 2,
    y: boss.y + boss.size / 2,
    vx: 0, vy: 0,
    size: 12,
    spawnTime: Date.now(),
    exploded: false
  });
}

// さきモード：緋色高速弾（3発）
function spawnCrimson() {
  const dx = player.x - boss.x;
  const dy = player.y - boss.y;
  const len = Math.hypot(dx, dy) || 1;
  const speed = 9;
  for (let i = -1; i <= 1; i++) {
    const angle = Math.atan2(dy, dx) + i * 0.15;
    crimsonBullets.push({
      x: boss.x + boss.size / 2,
      y: boss.y + boss.size / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 8
    });
  }
}

/* =====================
   はやとモード弾生成
===================== */
// 紫弾：ランダム方向にゆっくり移動、自ら拡散弾を撃つ
function spawnHayatoPurple() {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.8 + Math.random() * 0.6;
  hayatoPurpleBullets.push({
    x: boss.x + boss.size / 2,
    y: boss.y + boss.size / 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 10,
    lastSpread: Date.now(),
    spreadInterval: 900 + Math.random() * 400,
    rotDir: -1  // 公転方向（反時計回り固定）
  });
}

// 螺旋弾を発射（紫弾の位置から24発、飛びながら公転）
function spawnOrbitBurst(sx, sy, rotDir) {
  const n = 24;
  for (let i = 0; i < n; i++) {
    const baseAngle = Math.PI * 2 / n * i;
    hayatoOrbitBullets.push({
      spawnX: sx, spawnY: sy,   // 発射起点
      angle: baseAngle,          // 現在の公転角
      radius: 8,                 // 起点からの距離
      rotSpeed: rotDir * 0.004,  // 公転速度（ゆっくり）
      outSpeed: 1.8,             // 外に広がる速度
      size: 5
    });
  }
}

// 紺弾：枠沿い時計回り
function spawnHayatoNavy() {
  // ボス中心から上枠に向けて発射、その後時計回りに一周
  hayatoNavyBullets.push({
    x: boss.x + boss.size / 2,
    y: 0,
    side: 0,   // 0=上辺→右, 1=右辺→下, 2=下辺→左, 3=左辺→上
    progress: boss.x + boss.size / 2, // 上辺上の現在X
    speed: 3,
    size: 8,
    done: false
  });
}

// 青棒：左右どちらかに落下（動くと死）
function spawnHayatoBlueBar() {
  const leftHalf = Math.random() < 0.5;
  hayatoBlueBars.push({
    x: leftHalf ? 0 : canvas.width / 2,
    y: -40,
    w: canvas.width / 2,
    h: 28,
    vy: 1.2,
    done: false
  });
}

// 緑弾：上から落下
function spawnHayatoGreen() {
  hayatoGreenBullets.push({
    x: Math.random() * canvas.width,
    y: -10,
    vx: 0,
    vy: 3.5 + Math.random() * 2,
    size: 6
  });
}

// 黄緑弾：プレイヤーに向けて3発
function spawnHayatoYG() {
  const dx = player.x + player.size / 2 - (boss.x + boss.size / 2);
  const dy = player.y + player.size / 2 - (boss.y + boss.size / 2);
  const base = Math.atan2(dy, dx);
  const speed = 4;
  for (let i = -1; i <= 1; i++) {
    const a = base + i * 0.2;
    hayatoYGBullets.push({
      x: boss.x + boss.size / 2,
      y: boss.y + boss.size / 2,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      size: 8
    });
  }
}

// 黄弾：プレイヤーに向かって1発（当たるとサイズ+50%）
function spawnHayatoYellow() {
  const dx = player.x + player.size / 2 - (boss.x + boss.size / 2);
  const dy = player.y + player.size / 2 - (boss.y + boss.size / 2);
  const len = Math.hypot(dx, dy) || 1;
  hayatoYellowBullets.push({
    x: boss.x + boss.size / 2,
    y: boss.y + boss.size / 2,
    vx: dx / len * 3,
    vy: dy / len * 3,
    size: 12
  });
}

// オレンジ棒：上下どちらかに横移動（止まると死）
function spawnHayatoOrangeBar() {
  const topHalf = Math.random() < 0.5;
  const goRight = Math.random() < 0.5;
  hayatoOrangeBars.push({
    x: goRight ? -60 : canvas.width + 60,
    y: topHalf ? 0 : canvas.height / 2,
    w: 28,
    h: canvas.height / 2,
    vx: goRight ? 1.5 : -1.5,
    done: false
  });
}

// 白弾2（はやと用）：完全ランダム5発
function spawnHayatoWhite() {
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = 3 + Math.random() * 3;
    hayatoWhiteBullets2.push({
      x: boss.x + boss.size / 2,
      y: boss.y + boss.size / 2,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      size: 6
    });
  }
}
function useStop() {
  skillsUsed[0] = true;
  if (hayatoMode) { skillReloadTime[0] = Date.now(); skillUseCount[0]++; }
  stopActive = true;
  stopEndTime = Date.now() + 9000;
  player.invincible = true;
  timestopSound.currentTime = 0;
  timestopSound.play();
}

function useTeleport() {
  skillsUsed[1] = true;
  if (hayatoMode) { skillReloadTime[1] = Date.now(); skillUseCount[1]++; }
  player.x = Math.random() * (canvas.width - player.size);
  player.y = Math.random() * (canvas.height - player.size);
  player.invincible = true;
  player.teleportInvincible = true;
  teleportSound.currentTime = 0;
  teleportSound.play();
  setTimeout(() => {
    player.invincible = false;
    player.teleportInvincible = false;
  }, 5000);
}

function useReverse() {
  skillsUsed[2] = true;
  if (hayatoMode) {
    // heaven：弾幕速度1/4を18秒間
    skillReloadTime[2] = Date.now(); skillUseCount[2]++;
    heavenActive = true;
    heavenEndTime = Date.now() + 18000;
    heavenSound.currentTime = 0;
    heavenSound.play().catch(() => {});
  } else {
    bullets = [];
    blueBullets = [];
    yellowBullets = [];
    startTime = Date.now() - 10000;
    boss.phase = 1;
    spreadCooldown = 800;
    damageBoss(20);
    reverseSound.currentTime = 0;
    reverseSound.play();
  }
}

function useRoar() {
  skillsUsed[3] = true;
  if (hayatoMode) { skillReloadTime[3] = Date.now(); skillUseCount[3]++; }
  bullets = [];
  blueBullets = [];
  yellowBullets = [];
  whiteBullets = [];
  pinkBullets = [];
  crimsonBullets = [];
  // はやとモード弾幕もクリア
  hayatoPurpleBullets = []; hayatoOrbitBullets = []; hayatoNavyBullets = []; hayatoBlueBars = [];
  hayatoGreenBullets  = []; hayatoYGBullets   = []; hayatoYellowBullets = [];
  hayatoOrangeBars    = []; hayatoWhiteBullets2 = [];
  orangeState = "idle";
  orangeCountdownSound.pause();
  orangeCountdownSound.currentTime = 0;
  roarSound.play();
  damageBoss(30);
}

/* =====================
   ボスダメージ
===================== */
let enemyPoweredUp = false;

function switchSakiBgm(phase) {
  if (sakiBgmPhase === phase) return;
  [sakiBgm1, sakiBgm2, sakiBgm3, sakiBgm4].forEach(b => { b.pause(); b.currentTime = 0; });
  sakiBgmPhase = phase;
  const bgms = [null, sakiBgm1, sakiBgm2, sakiBgm3, sakiBgm4];
  bgms[phase].play().catch(() => {});
}

function switchHayatoBgm(phase) {
  if (hayatoBgmPhase === phase) return;
  [hayatoBgm1, hayatoBgm2, hayatoBgm3].forEach(b => { b.pause(); b.currentTime = 0; });
  hayatoBgmPhase = phase;
  [null, hayatoBgm1, hayatoBgm2, hayatoBgm3][phase].play().catch(() => {});
}

function damageBoss(amount) {
  if (boss.phase === 0) return;
  boss.hp = Math.max(0, boss.hp - amount);

  if (hayatoMode) {
    if (boss.hp <= 1000) { switchHayatoBgm(3); if (!hayatoPhase1000) hayatoPhase1000 = true; }
    else if (boss.hp <= 5000) { switchHayatoBgm(2); if (!hayatoPhase5000) hayatoPhase5000 = true; }
    if (boss.hp <= 2000 && !hayatoPhase2000) hayatoPhase2000 = true;
    if (boss.hp <= 6000 && !hayatoPhase6000) hayatoPhase6000 = true;
    if (boss.hp <= 7000 && !hayatoPhase7000) hayatoPhase7000 = true;
    if (boss.hp <= 8000 && !hayatoPhase8000) hayatoPhase8000 = true;
    if (boss.hp <= 9000 && !hayatoPhase9000) hayatoPhase9000 = true;
  } else if (sakiMode) {
    // さきモードBGM切り替え
    if (boss.hp <= 1111) switchSakiBgm(4);
    else if (boss.hp <= 3333) switchSakiBgm(3);
    else if (boss.hp <= 5555) switchSakiBgm(2);

    if (boss.hp <= 5555 && !sakiPhase5555) sakiPhase5555 = true;
    if (boss.hp <= 3333 && !sakiPhase3333) sakiPhase3333 = true;
    if (boss.hp <= 1111 && !sakiPhase1111) sakiPhase1111 = true;
  } else {
    if (boss.hp <= 1000 && !bgmPhase2Started) {
      bgmPhase2Started = true;
      bgm.pause();
      bgm2.currentTime = 0;
      bgm2.play();
    }
  }

  if (boss.hp <= 1000 && !enemyPoweredUp) {
    enemyPoweredUp = true;
    enemies = Array.from({length: 5}, () => {
      const e = makeEnemy();
      e.size = Math.floor(ENEMY_BASE_SIZE / 2);
      e.y = -ENEMY_BASE_SIZE * Math.random() * 10;
      return e;
    });
  }
  if (boss.hp <= 0) gameClear();
}

/* =====================
   GAME CLEAR
===================== */
function gameClear() {
  if (gameState !== "play") return;
  gameState = "clear";
  clearTime = (Date.now() - startTime) / 1000;
  bgm.pause(); bgm2.pause();
  [sakiBgm1, sakiBgm2, sakiBgm3, sakiBgm4].forEach(b => b.pause());
  [hayatoBgm1, hayatoBgm2, hayatoBgm3].forEach(b => b.pause());
  if (hayatoMode) {
    clearBgm.currentTime = 0; // はやとクリアBGMは同じでも別ファイルでも
    clearBgm.play().catch(() => {});
  } else if (sakiMode) {
    sakiClearBgm.currentTime = 0;
    sakiClearBgm.play().catch(() => {});
  } else {
    clearBgm.currentTime = 0;
    clearBgm.play().catch(() => {});
  }
}

/* =====================
   GAME OVER
===================== */
function gameOver() {
  if (gameState !== "play") return;
  if (player.invincible) return;
  gameState = "gameover";
  bgm.pause(); bgm2.pause();
  [sakiBgm1, sakiBgm2, sakiBgm3, sakiBgm4].forEach(b => b.pause());
  [hayatoBgm1, hayatoBgm2, hayatoBgm3].forEach(b => b.pause());
  gameOverSound.play();
}

function goTitle() {
  gameState = "title";
  bgm.pause(); bgm2.pause();
  clearBgm.pause(); sakiClearBgm.pause();
  [sakiBgm1, sakiBgm2, sakiBgm3, sakiBgm4].forEach(b => { b.pause(); b.currentTime = 0; });
  [hayatoBgm1, hayatoBgm2, hayatoBgm3].forEach(b => { b.pause(); b.currentTime = 0; });
  // モード解除
  cheatActivated = false; cheatIndex = 0;
  sakiMode = false; sakiIndex = 0;
  hayatoMode = false;
  titleEnterTime = Date.now();
  titleBgm.currentTime = 0;
  titleBgm.play();
}

/* =====================
   更新
===================== */
function update() {
  if (gameState !== "play") return;

  playerMoving = false;
  let speed = player.speed;
  if (keys["shift"]) speed *= 0.5;

  // 凍結中は移動不可
  const isFrozen = sakiMode && Date.now() < frozenUntil;
  if (!isFrozen) {
    if (inputMode === "phone") {
      // phoneモード：スティックの倒し具合に比例した速度
      if (joystick.active) {
        const dx = joystick.touchX - joystick.baseX;
        const dy = joystick.touchY - joystick.baseY;
        const dist = Math.hypot(dx, dy);
        if (dist > 2) {
          // ratio: 0〜1（最大まで倒した時=1）
          const ratio = Math.min(dist / joystick.radius, 1);
          const s = player.speed * ratio; // ちょこっと触れ→超遅、最大→シフト無し速度
          player.x += (dx / dist) * s;
          player.y += (dy / dist) * s;
          playerMoving = true;
        }
      }
    } else {
      if (keys["arrowup"])    { player.y -= speed; playerMoving = true; }
      if (keys["arrowdown"])  { player.y += speed; playerMoving = true; }
      if (keys["arrowleft"])  { player.x -= speed; playerMoving = true; }
      if (keys["arrowright"]) { player.x += speed; playerMoving = true; }
    }
  }

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  if (keys["z"] && !skillsUsed[0]) useStop();
  if (keys["x"] && !skillsUsed[1]) useTeleport();
  if (keys["c"] && !skillsUsed[2]) useReverse();
  if (keys["v"] && !skillsUsed[3]) useRoar();

  // Aキー or phoneモード常時攻撃
  if ((keys["a"] || inputMode === "phone") && boss.phase > 0 && Date.now() - lastPlayerShot > playerShotCooldown) {
    const dx = boss.x + boss.size / 2 - (player.x + player.size / 2);
    const dy = boss.y + boss.size / 2 - (player.y + player.size / 2);
    const len = Math.hypot(dx, dy) || 1;
    playerBullets.push({
      x: player.x + player.size / 2,
      y: player.y + player.size / 2,
      vx: dx / len * 6,
      vy: dy / len * 6,
      size: 5
    });
    lastPlayerShot = Date.now();
  }

  if (stopActive && Date.now() > stopEndTime) {
    stopActive = false;
    player.invincible = false;
  }

  // heaven終了チェック
  if (heavenActive && Date.now() > heavenEndTime) {
    heavenActive = false;
  }
  // heaven中の速度係数（1/4）
  const bulletSpeedMult = heavenActive ? 0.25 : 1.0;

  if (!stopActive) {
    const eSize = enemyPoweredUp ? Math.floor(ENEMY_BASE_SIZE / 2) : ENEMY_BASE_SIZE;
    enemies.forEach(e => {
      e.y += ENEMY_SPEED;
      if (e.y > canvas.height) {
        e.y = -eSize;
        e.x = Math.random() * (canvas.width - eSize);
      }
    });
  }

  const elapsed = (Date.now() - startTime) / 1000;

  if (!hayatoMode) {
    if (elapsed >= 10 && boss.phase === 0) { boss.phase = 1; evolveSound.play(); }
    if (elapsed >= 20 && boss.phase === 1) { boss.phase = 2; evolveSound.play(); }
    if (elapsed >= 30 && boss.phase === 2) {
      boss.phase = 3;
      phase3Time = Date.now();
      evolveSound.play();
    }

    if (boss.phase === 3 && phase3Time) {
      const t = (Date.now() - phase3Time) / 1000;
      if (t >= 10) spreadCooldown = sakiMode ? 800 : 400; // さきは初速維持
      if (t >= 20 && Date.now() - lastYellow > 3000) {
        spawnYellow();
        lastYellow = Date.now();
      }
    }
  } else {
    // はやとモードはフェーズ1から即スタート
    if (boss.phase === 0) boss.phase = 1;
  }

  // さきモード：最初からspreadCooldown 1/3
  const effectiveSpreadCooldown = sakiMode ? Math.floor(spreadCooldown / 3) : spreadCooldown;

  if (!stopActive && boss.phase >= 1 && !hayatoMode && Date.now() - lastSpread > effectiveSpreadCooldown) {
    spawnSpread();
    lastSpread = Date.now();
  }

  // 青弾：さきモードは速度3倍（spawnBlue内で制御）
  if (!stopActive && !hayatoMode && boss.phase >= 2 && Date.now() - lastBlue > 5000) {
    if (sakiMode) {
      const dx = player.x - boss.x, dy = player.y - boss.y;
      const len = Math.hypot(dx, dy) || 1;
      blueBullets.push({
        x: boss.x + boss.size / 2, y: boss.y + boss.size / 2,
        vx: dx / len * 7.5, vy: dy / len * 7.5, size: 14
      });
    } else {
      spawnBlue();
    }
    lastBlue = Date.now();
  }

  // オレンジ攻撃（はやとモードは独自のオレンジ棒を使うのでスキップ）
  const orangeCooldown = 10000;
  const orangeCountdownDuration = sakiMode ? 1000 : 3000;
  if (!hayatoMode && boss.phase >= 3 && Date.now() - lastOrange > orangeCooldown && orangeState === "idle") {
    orangeState = "countdown";
    orangeTimer = Date.now();
    lastOrange = Date.now();
    orangeCountdownSound.currentTime = 0;
    orangeCountdownSound.play();
  }

  if (orangeState === "countdown" && Date.now() - orangeTimer >= orangeCountdownDuration) {
    orangeState = "active";
    orangeTimer = Date.now();
  }

  if (orangeState === "active" && Date.now() - orangeTimer >= 2000) {
    orangeState = "idle";
  }

  // さきモード専用攻撃
  if (sakiMode && !stopActive && boss.phase >= 1) {
    // 白弾（HP5555以下）
    if (sakiPhase5555 && Date.now() - lastWhite > 3000) {
      spawnWhite();
      lastWhite = Date.now();
    }
    // ピンク追跡弾（HP3333以下）：5秒に1発
    if (sakiPhase3333 && Date.now() - lastCrimson > 5000 && !sakiPhase1111) {
      spawnPink();
      lastCrimson = Date.now();
    }
    // 緋色弾（HP1111以下）：6秒に1回3発
    if (sakiPhase1111 && Date.now() - lastCrimson > 6000) {
      spawnCrimson();
      lastCrimson = Date.now();
    }
  }

  // ── 真のはやとモード攻撃 ──
  if (hayatoMode && !stopActive && boss.phase >= 1) {
    const hMult = heavenActive ? 16 : 1; // heaven中はクールダウン16倍
    if (Date.now() - hLastPurple > 3000 * hMult) {
      spawnHayatoPurple();
      hLastPurple = Date.now();
    }
    if (hayatoPhase9000 && Date.now() - hLastNavy > 5000 * hMult) {
      spawnHayatoNavy();
      hLastNavy = Date.now();
    }
    if (hayatoPhase8000 && Date.now() - hLastBlueBar > 10000 * hMult) {
      spawnHayatoBlueBar();
      hLastBlueBar = Date.now();
    }
    if (hayatoPhase7000 && Date.now() - hLastGreen > 333 * hMult) {
      spawnHayatoGreen();
      hLastGreen = Date.now();
    }
    if (hayatoPhase6000 && Date.now() - hLastYG > 3000 * hMult) {
      spawnHayatoYG();
      hLastYG = Date.now();
    }
    if (hayatoPhase5000 && Date.now() - hLastYellow > 5000 * hMult) {
      spawnHayatoYellow();
      hLastYellow = Date.now();
    }
    if (hayatoPhase2000 && Date.now() - hLastOrangeBar > 10000 * hMult) {
      spawnHayatoOrangeBar();
      hLastOrangeBar = Date.now();
    }
    if (hayatoPhase1000 && Date.now() - hLastWhite2 > 200 * hMult) {
      spawnHayatoWhite();
      hLastWhite2 = Date.now();
    }
  }

  // スキルリロード（はやとモード：30秒後に復活）
  if (hayatoMode) {
    for (let i = 0; i < 4; i++) {
      if (skillsUsed[i] && skillReloadTime[i] > 0 && Date.now() - skillReloadTime[i] >= 30000) {
        if (skillUseCount[i] < 5) {
          skillsUsed[i] = false; // 5回未満ならリロード
        }
        skillReloadTime[i] = 0;
      }
    }
  }

  if (!stopActive) {
    const m = bulletSpeedMult;
    bullets.forEach(b => { b.x += b.vx * m; b.y += b.vy * m; });
    blueBullets.forEach(b => { b.x += b.vx * m; b.y += b.vy * m; });
    // 黄色弾：さきモードはだんだん大きくなる
    yellowBullets.forEach(b => {
      b.x += b.vx * m; b.y += b.vy * m;
      if (sakiMode) b.size += 0.03;
    });
    // さきモード専用弾の移動
    whiteBullets.forEach(b => { b.x += b.vx * m; b.y += b.vy * m; });
    // ピンク：5秒追跡
    pinkBullets.forEach(b => {
      const age = (Date.now() - b.spawnTime) / 1000;
      if (age < 5) {
        const dx = player.x + player.size / 2 - b.x;
        const dy = player.y + player.size / 2 - b.y;
        const len = Math.hypot(dx, dy) || 1;
        b.vx += dx / len * 0.06;
        b.vy += dy / len * 0.06;
        const spd = Math.hypot(b.vx, b.vy);
        if (spd > 2) { b.vx = b.vx / spd * 2; b.vy = b.vy / spd * 2; }
      }
      b.x += b.vx * m; b.y += b.vy * m;
    });
    crimsonBullets.forEach(b => { b.x += b.vx * m; b.y += b.vy * m; });

    // ── はやとモード弾の移動 ──
    if (hayatoMode) {
      // 紫弾：移動しながら一定間隔で拡散弾を撃つ
      hayatoPurpleBullets.forEach(b => {
        b.x += b.vx * m; b.y += b.vy * m;
        if (Date.now() - b.lastSpread > b.spreadInterval) {
          b.lastSpread = Date.now();
          spawnOrbitBurst(b.x, b.y, b.rotDir);
        }
      });

      // 螺旋弾：公転しながら外に広がる
      hayatoOrbitBullets.forEach(b => {
        b.angle  += b.rotSpeed * m;
        b.radius += b.outSpeed * m;
      });

      // 紺弾：枠沿い時計回り
      hayatoNavyBullets.forEach(b => {
        if (b.done) return;
        const spd = b.speed * m;
        if (b.side === 0) {
          b.x += spd;
          if (b.x >= canvas.width) { b.x = canvas.width; b.y = 0; b.side = 1; }
        } else if (b.side === 1) {
          b.y += spd;
          if (b.y >= canvas.height) { b.y = canvas.height; b.side = 2; }
        } else if (b.side === 2) {
          b.x -= spd;
          if (b.x <= 0) { b.x = 0; b.side = 3; }
        } else if (b.side === 3) {
          b.y -= spd;
          if (b.y <= 0) b.done = true;
        }
      });

      // 青棒：落下
      hayatoBlueBars.forEach(b => { b.y += b.vy * m; if (b.y > canvas.height + 60) b.done = true; });

      // 緑弾・黄緑弾・黄弾・白弾2：単純移動
      hayatoGreenBullets.forEach(b => { b.y += b.vy * m; });
      hayatoYGBullets.forEach(b => { b.x += b.vx * m; b.y += b.vy * m; });
      hayatoYellowBullets.forEach(b => { b.x += b.vx * m; b.y += b.vy * m; });
      hayatoWhiteBullets2.forEach(b => { b.x += b.vx * m; b.y += b.vy * m; });

      // オレンジ棒：横移動
      hayatoOrangeBars.forEach(b => {
        b.x += b.vx * m;
        if (b.x > canvas.width + 80 || b.x < -80) b.done = true;
      });
    }
  }

  // プレイヤー弾の移動・ボスへの当たり判定
  playerBullets = playerBullets.filter(b => {
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) return false;
    if (boss.phase > 0 &&
        b.x > boss.x && b.x < boss.x + boss.size &&
        b.y > boss.y && b.y < boss.y + boss.size) {
      damageBoss(playerBulletDamage);
      return false;
    }
    return true;
  });

  const px = player.x + player.size / 2;
  const py = player.y + player.size / 2;
  const hitR = player.size * PLAYER_HIT_RATIO;

  enemies.forEach(e => {
    if (px > e.x && px < e.x + e.size &&
        py > e.y && py < e.y + e.size) gameOver();
  });

  bullets.forEach(b => {
    if (Math.hypot(px - b.x, py - b.y) < hitR + b.size * 0.8) gameOver();
  });

  if (playerMoving) {
    blueBullets.forEach(b => {
      if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) gameOver();
    });
  }

  // 「移動または射撃」しているかどうか（オレンジ判定用）
  const playerActing = playerMoving;

  if (orangeState === "active" && !playerActing) gameOver();

  yellowBullets = yellowBullets.filter(b => {
    if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) {
      player.size *= 1.1;
      return false;
    }
    return true;
  });

  // さきモード弾の当たり判定
  if (sakiMode) {
    const isFrozen = Date.now() < frozenUntil;

    // 白弾：当たると3秒凍結
    whiteBullets = whiteBullets.filter(b => {
      if (b.y > canvas.height + 20) return false;
      if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) {
        frozenUntil = Date.now() + 3000;
        return false;
      }
      return true;
    });

    // 凍結中は動けない
    if (isFrozen) {
      player.x -= 0; // 実際の動き抑制はupdate冒頭で処理
    }

    // ピンク弾：5秒後爆発 or 触れたら即死
    pinkBullets = pinkBullets.filter(b => {
      const age = (Date.now() - b.spawnTime) / 1000;
      if (age >= 5) {
        // 爆発：爆発半径内なら即死
        if (Math.hypot(px - b.x, py - b.y) < 50) gameOver();
        return false;
      }
      if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) { gameOver(); return false; }
      if (b.x < -50 || b.x > canvas.width + 50 || b.y < -50 || b.y > canvas.height + 50) return false;
      return true;
    });

    // 緋色弾：当たったら即死
    crimsonBullets = crimsonBullets.filter(b => {
      if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) { gameOver(); return false; }
      if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) return false;
      return true;
    });
  }

  // ── はやとモード当たり判定 ──
  if (hayatoMode) {
    // 紫弾
    hayatoPurpleBullets = hayatoPurpleBullets.filter(b => {
      if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) return false;
      if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) { gameOver(); return false; }
      return true;
    });

    // 螺旋弾
    hayatoOrbitBullets = hayatoOrbitBullets.filter(b => {
      const bx = b.spawnX + Math.cos(b.angle) * b.radius;
      const by = b.spawnY + Math.sin(b.angle) * b.radius;
      if (b.radius > canvas.width + 100) return false; // 画面外
      if (Math.hypot(px - bx, py - by) < hitR + b.size) { gameOver(); return false; }
      return true;
    });

    // 紺弾
    hayatoNavyBullets = hayatoNavyBullets.filter(b => {
      if (b.done) return false;
      const bx2 = b.side === 1 ? canvas.width : b.side === 3 ? 0 : b.x;
      const by2 = b.side === 0 ? 0 : b.side === 2 ? canvas.height : b.y;
      if (Math.hypot(px - bx2, py - by2) < hitR + b.size) { gameOver(); return false; }
      return true;
    });

    // 青棒：動いていたら死
    hayatoBlueBars = hayatoBlueBars.filter(b => {
      if (b.done) return false;
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        if (playerMoving) gameOver();
      }
      return true;
    });

    // 緑弾
    hayatoGreenBullets = hayatoGreenBullets.filter(b => {
      if (b.y > canvas.height + 20) return false;
      if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) { gameOver(); return false; }
      return true;
    });

    // 黄緑弾
    hayatoYGBullets = hayatoYGBullets.filter(b => {
      if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) return false;
      if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) { gameOver(); return false; }
      return true;
    });

    // 黄弾：当たるとサイズ+50%（死なない）
    hayatoYellowBullets = hayatoYellowBullets.filter(b => {
      if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) return false;
      if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) {
        player.size *= 1.5;
        return false;
      }
      return true;
    });

    // オレンジ棒：止まっていたら死
    hayatoOrangeBars = hayatoOrangeBars.filter(b => {
      if (b.done) return false;
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        if (!playerMoving) gameOver();
      }
      return true;
    });

    // 白弾2
    hayatoWhiteBullets2 = hayatoWhiteBullets2.filter(b => {
      if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) return false;
      if (Math.hypot(px - b.x, py - b.y) < hitR + b.size) { gameOver(); return false; }
      return true;
    });
  }
}

/* =====================
   描画
===================== */
function draw() {
  ctx.save();

  // 背景（はやとモードは専用背景）
  ctx.drawImage(hayatoMode ? hayatoBgImg : bgImg, 0, 0, canvas.width, canvas.height);

  // 時を止めている間は青白いオーバーレイ（filterより軽い）
  if (stopActive) {
    ctx.fillStyle = "rgba(100, 160, 255, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "blue";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));

  // ボス（モードごとに画像変化）
  if (boss.phase > 0) {
    let bImg = bossImg;
    if (hayatoMode) {
      bImg = hayatoPhase1000 ? hayatoBossImg2 : hayatoBossImg;
    } else if (sakiMode) {
      if (sakiPhase1111) bImg = sakiBossImg4;
      else if (sakiPhase3333) bImg = sakiBossImg3;
      else if (sakiPhase5555) bImg = sakiBossImg2;
      else bImg = sakiBossImg;
    }
    ctx.drawImage(bImg, boss.x, boss.y, boss.size, boss.size);
  }

  ctx.fillStyle = "red";
  bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });

  ctx.fillStyle = "cyan";
  blueBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });

  ctx.fillStyle = "yellow";
  yellowBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });

  // さきモード専用弾の描画
  if (sakiMode) {
    // 白弾
    ctx.fillStyle = "white";
    whiteBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });

    // ピンク追跡弾（爆発まで残り時間でサイズ変化）
    pinkBullets.forEach(b => {
      const age = (Date.now() - b.spawnTime) / 1000;
      const s = b.size + age * 2;
      const alpha = 0.6 + Math.sin(Date.now() / 150) * 0.3;
      ctx.fillStyle = `rgba(255,80,200,${alpha})`;
      ctx.beginPath(); ctx.arc(b.x, b.y, s, 0, Math.PI * 2); ctx.fill();
      // 爆発予告：残り1秒で円を表示
      if (age > 4) {
        ctx.strokeStyle = `rgba(255,0,150,${(age - 4) * 3})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(b.x, b.y, 50, 0, Math.PI * 2); ctx.stroke();
      }
    });

    // 緋色弾
    ctx.fillStyle = "#dc143c";
    crimsonBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });
  }

  ctx.fillStyle = cheatActivated ? "silver" : "lime";
  playerBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });

  // ── はやとモード弾描画 ──
  if (hayatoMode) {
    // 紫弾
    ctx.fillStyle = "#aa44ff";
    hayatoPurpleBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });

    // 螺旋弾（赤）
    ctx.fillStyle = "red";
    hayatoOrbitBullets.forEach(b => {
      const bx = b.spawnX + Math.cos(b.angle) * b.radius;
      const by = b.spawnY + Math.sin(b.angle) * b.radius;
      ctx.beginPath(); ctx.arc(bx, by, b.size, 0, Math.PI * 2); ctx.fill();
    });

    // 紺弾（枠沿い）
    ctx.fillStyle = "#1a237e";
    ctx.strokeStyle = "#7986cb";
    ctx.lineWidth = 2;
    hayatoNavyBullets.forEach(b => {
      if (b.done) return;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });

    // 青棒（左右どちらか）
    hayatoBlueBars.forEach(b => {
      if (b.done) return;
      ctx.fillStyle = "rgba(30,100,255,0.55)";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "#82b1ff"; ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    });

    // 緑弾
    ctx.fillStyle = "#66ff44";
    hayatoGreenBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });

    // 黄緑弾
    ctx.fillStyle = "#aaff00";
    hayatoYGBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });

    // 黄弾（サイズ変化系）
    ctx.fillStyle = "#ffee00";
    hayatoYellowBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });

    // オレンジ棒（上下どちらか）
    hayatoOrangeBars.forEach(b => {
      if (b.done) return;
      ctx.fillStyle = "rgba(255,140,0,0.55)";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "#ffcc80"; ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    });

    // 白弾2
    ctx.fillStyle = "white";
    hayatoWhiteBullets2.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); });
  }

  if (orangeState === "active") {
    ctx.fillStyle = "rgba(255,165,0,0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore();

  // さきモード凍結エフェクト
  if (sakiMode && Date.now() < frozenUntil) {
    ctx.fillStyle = "rgba(180,230,255,0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#aef";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❄ FROZEN ❄", canvas.width / 2, canvas.height / 2 - 80);
  }

  // オレンジカウントダウン（さきは1秒なので表示を調整）
  if (orangeState === "countdown") {
    const orangeCountdownDuration = sakiMode ? 1000 : 3000;
    const count = Math.max(1, Math.ceil((orangeCountdownDuration - (Date.now() - orangeTimer)) / 1000));
    ctx.fillStyle = "orange";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(count, canvas.width / 2, canvas.height / 2);
  }

  // プレイヤー描画（テレポート無敵中は点滅、チート中は画像変更）
  const currentPlayerImg = cheatActivated ? playerCheatImg : playerImg;
  if (!player.teleportInvincible || Math.floor(Date.now() / 100) % 2 === 0) {
    ctx.drawImage(currentPlayerImg, player.x, player.y, player.size, player.size);
  }

  for (let i = 0; i < 4; i++) {
    const icon = (hayatoMode && i === 2) ? heavenIcon : skillIcons[i];
    const depleted = hayatoMode && skillUseCount[i] >= 5 && skillsUsed[i];
    if (!skillsUsed[i]) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(icon, canvas.width - 60 * (4 - i), canvas.height - 60, 48, 48);
      ctx.globalAlpha = 1;
      // 残り使用回数（はやとモード）
      if (hayatoMode) {
        const left = 5 - skillUseCount[i];
        ctx.fillStyle = left <= 1 ? "#ff6666" : "#ffee88";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(`${left}`, canvas.width - 60 * (4 - i) + 46, canvas.height - 60 + 2);
      }
    } else if (hayatoMode && skillReloadTime[i] > 0 && !depleted) {
      // リロード中：残り秒数を表示
      const elapsed2 = (Date.now() - skillReloadTime[i]) / 1000;
      const remain = Math.ceil(30 - elapsed2);
      const ix = canvas.width - 60 * (4 - i);
      const iy = canvas.height - 60;
      ctx.globalAlpha = 0.25;
      ctx.drawImage(icon, ix, iy, 48, 48);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(ix, iy, 48, 48);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(remain, ix + 24, iy + 24);
    }
    // depletedの場合は何も描画しない（消える）
  }

  // heaven発動中オーバーレイ
  if (heavenActive) {
    const remaining = Math.ceil((heavenEndTime - Date.now()) / 1000);
    ctx.fillStyle = "rgba(200,230,255,0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(150,210,255,0.85)";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`✦ HEAVEN  ${remaining}s`, canvas.width - 10, 38);
    ctx.textAlign = "left";
  }

  // ボスHPバー
  if (boss.phase > 0) {
    const barW = canvas.width - 40;
    const barH = 18;
    const barX = 20;
    const barY = 12;
    const hpRatio = boss.hp / boss.maxHp;

    // 背景
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barW, barH);

    // HP本体（グラデーション）
    const grad = ctx.createLinearGradient(barX, barY, barX + barW * hpRatio, barY);
    grad.addColorStop(0, "#ff4444");
    grad.addColorStop(0.5, "#ff8800");
    grad.addColorStop(1, "#ffcc00");
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    // 枠線
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barW, barH);

    // テキスト
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`BOSS  HP  ${boss.hp} / ${boss.maxHp}`, barX + 6, barY + barH / 2);
  }

  if (gameState === "gameover") {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.font = "64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
    if (inputMode === "phone") {
      drawRetryButton();
      drawHomeButton();
    } else {
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText("Press R to Continue", canvas.width / 2, canvas.height / 2 + 50);
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#aaa";
      ctx.fillText("Press P to Title", canvas.width / 2, canvas.height / 2 + 82);
    }
  }

  if (gameState === "clear") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CLEAR!", canvas.width / 2, canvas.height / 2 - 40);

    // クリアタイム表示
    const m = Math.floor(clearTime / 60);
    const s = Math.floor(clearTime % 60);
    const ms = Math.floor((clearTime % 1) * 100);
    const timeStr = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(ms).padStart(2,"0")}`;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(`クリアタイム  ${timeStr}`, canvas.width / 2, canvas.height / 2 + 20);

    if (inputMode === "phone") {
      drawRetryButton();
      drawHomeButton();
    } else {
      ctx.font = "22px sans-serif";
      ctx.fillStyle = "#aaa";
      ctx.fillText("Press R to Play Again", canvas.width / 2, canvas.height / 2 + 68);
      ctx.font = "18px sans-serif";
      ctx.fillText("Press P to Title", canvas.width / 2, canvas.height / 2 + 98);
    }
  }

  // phoneモード：ジョイスティック描画
  if (inputMode === "phone" && gameState === "play") {
    drawJoystick();
  }
}

function drawRetryButton() {
  const r = getRetryBtnRect();
  const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  grad.addColorStop(0, "#ff8800");
  grad.addColorStop(1, "#cc4400");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("リトライ", r.x + r.w / 2, r.y + r.h / 2);
}

function getHomeBtnRect() {
  return { x: 14, y: 14, w: 80, h: 36 };
}

function drawHomeButton() {
  const r = getHomeBtnRect();
  ctx.fillStyle = "rgba(40,40,80,0.85)";
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 8); ctx.fill();
  ctx.strokeStyle = "#88aaff"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 8); ctx.stroke();
  ctx.fillStyle = "#cce"; ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("home", r.x + r.w / 2, r.y + r.h / 2);
}

function drawJoystick() {
  if (!joystick.active) return; // 触れていない時は非表示

  const bx = joystick.baseX;
  const by = joystick.baseY;
  const kx = joystick.touchX;
  const ky = joystick.touchY;

  ctx.save();
  // 外周（土台）
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(bx, by, joystick.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(bx, by, joystick.radius, 0, Math.PI * 2);
  ctx.stroke();

  // つまみ
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(kx, ky, joystick.knobRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* =====================
   タイトル画面
===================== */
const TITLE_TEXT = "Hayato's adventure";
const SUBTITLE_TEXT = "curse of sosuke";

// タイトル画面のプレイボタン領域
const playBtn = {
  x: 0, y: 0, w: 200, h: 56
};

function updatePlayBtnPos() {
  playBtn.x = canvas.width / 2 - playBtn.w / 2;
  playBtn.y = canvas.height / 2 + 80;
}
updatePlayBtnPos();

function drawTitle() {
  // 背景
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  // 暗幕
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // タイトル
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(TITLE_TEXT, canvas.width / 2, canvas.height / 2 - 60);

  ctx.fillStyle = "#ff9944";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(SUBTITLE_TEXT, canvas.width / 2, canvas.height / 2 - 14);

  // PC / Phone 選択ボタン
  const btnW = 90, btnH = 44, gap = 16;
  const totalW = btnW * 2 + gap;
  const pcX = canvas.width / 2 - totalW / 2;
  const phoneX = pcX + btnW + gap;
  const modeY = canvas.height / 2 + 28;

  // PC ボタン
  ctx.fillStyle = inputMode === "pc" ? "#4488ff" : "#334";
  ctx.beginPath(); ctx.roundRect(pcX, modeY, btnW, btnH, 10); ctx.fill();
  ctx.strokeStyle = inputMode === "pc" ? "#aaf" : "#556";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(pcX, modeY, btnW, btnH, 10); ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("PC", pcX + btnW / 2, modeY + btnH / 2);

  // Phone ボタン
  ctx.fillStyle = inputMode === "phone" ? "#44cc88" : "#334";
  ctx.beginPath(); ctx.roundRect(phoneX, modeY, btnW, btnH, 10); ctx.fill();
  ctx.strokeStyle = inputMode === "phone" ? "#afa" : "#556";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(phoneX, modeY, btnW, btnH, 10); ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("Phone", phoneX + btnW / 2, modeY + btnH / 2);

  // プレイボタン
  updatePlayBtnPos();
  const bx = playBtn.x, by = playBtn.y, bw = playBtn.w, bh = playBtn.h;
  const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
  grad.addColorStop(0, "#ff8800");
  grad.addColorStop(1, "#cc4400");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 12);
  ctx.fill();
  ctx.strokeStyle = "#ffe066";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 12);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("プレイ", canvas.width / 2, by + bh / 2);

  // チート発動表示
  if (cheatActivated) {
    ctx.fillStyle = "#aef";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("★ CHEAT MODE ACTIVATED ★", canvas.width / 2, by + bh + 36);
  }

  // さきモード表示
  if (sakiMode) {
    ctx.fillStyle = "#ff80d0";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("💀 さきモード 解放済み 💀", canvas.width / 2, by + bh + (cheatActivated ? 66 : 36));
  }

  // 真のはやとモード表示
  if (hayatoMode) {
    ctx.fillStyle = "#ff4400";
    ctx.font = "bold 20px sans-serif";
    const offsetY = by + bh + 36 + (cheatActivated ? 30 : 0) + (sakiMode ? 30 : 0);
    ctx.fillText("🔥 真のはやとモード 解放済み 🔥", canvas.width / 2, offsetY);
  }

  // phoneモード：20秒待機カウントダウン表示（さきモード時）
  if (inputMode === "phone" && sakiMode && !hayatoMode) {
    const remaining = Math.ceil((20000 - (Date.now() - titleEnterTime)) / 1000);
    if (remaining > 0) {
      ctx.fillStyle = "rgba(255,100,0,0.7)";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(`真のはやとモード解放まで… ${remaining}s`, canvas.width - 10, canvas.height - 10);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
  }

  // phoneモード時：右上にcheat/sakiボタン
  if (inputMode === "phone") {
    const tbW = 80, tbH = 36, tbGap = 10;
    const tbY = 14;
    const sakiTbX = canvas.width - tbW - 14;
    const cheatTbX = sakiTbX - tbW - tbGap;

    // cheatボタン（未発動の時だけ表示）
    if (!cheatActivated) {
      ctx.fillStyle = "rgba(60,100,200,0.75)";
      ctx.beginPath(); ctx.roundRect(cheatTbX, tbY, tbW, tbH, 8); ctx.fill();
      ctx.strokeStyle = "#aaf"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(cheatTbX, tbY, tbW, tbH, 8); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("cheat", cheatTbX + tbW / 2, tbY + tbH / 2);
    }

    // sakiボタン（未発動の時だけ表示）
    if (!sakiMode) {
      ctx.fillStyle = "rgba(180,40,140,0.75)";
      ctx.beginPath(); ctx.roundRect(sakiTbX, tbY, tbW, tbH, 8); ctx.fill();
      ctx.strokeStyle = "#f8c"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(sakiTbX, tbY, tbW, tbH, 8); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("saki", sakiTbX + tbW / 2, tbY + tbH / 2);
    }
  }
}

canvas.addEventListener("click", e => {
  if (gameState !== "title") return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  // phoneモード：右上のcheat/sakiボタン
  if (inputMode === "phone") {
    const tbW = 80, tbH = 36, tbGap = 10, tbY = 14;
    const sakiTbX = canvas.width - tbW - 14;
    const cheatTbX = sakiTbX - tbW - tbGap;
    if (!cheatActivated && mx >= cheatTbX && mx <= cheatTbX + tbW && my >= tbY && my <= tbY + tbH) {
      cheatActivated = true;
      cheatSound.currentTime = 0; cheatSound.play().catch(() => {});
      return;
    }
    if (!sakiMode && mx >= sakiTbX && mx <= sakiTbX + tbW && my >= tbY && my <= tbY + tbH) {
      sakiMode = true;
      titleEnterTime = Date.now(); // さきモード有効化時刻からカウント
      cheatSound.currentTime = 0; cheatSound.play().catch(() => {});
      return;
    }
  }

  // PC/Phone ボタン判定
  const btnW = 90, btnH = 44, gap = 16;
  const totalW = btnW * 2 + gap;
  const pcX = canvas.width / 2 - totalW / 2;
  const phoneX = pcX + btnW + gap;
  const modeY = canvas.height / 2 + 28;
  if (mx >= pcX && mx <= pcX + btnW && my >= modeY && my <= modeY + btnH) {
    inputMode = "pc"; return;
  }
  if (mx >= phoneX && mx <= phoneX + btnW && my >= modeY && my <= modeY + btnH) {
    inputMode = "phone"; return;
  }

  // プレイボタン
  const b = playBtn;
  if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
    titleBgm.pause();
    titleBgm.currentTime = 0;
    resetGame();
  }
});

/* =====================
   タッチ操作（phoneモード）
===================== */

// iOSでスクロールを防ぐ必須設定
canvas.style.touchAction = "none";
canvas.style.userSelect = "none";
canvas.style.webkitUserSelect = "none";

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width  / rect.width),
    y: (e.clientY - rect.top)  * (canvas.height / rect.height)
  };
}

function getSkillIconRect(i) {
  return {
    x: canvas.width - 60 * (4 - i),
    y: canvas.height - 60,
    w: 48, h: 48
  };
}

function getRetryBtnRect() {
  return {
    x: canvas.width / 2 - 100,
    y: canvas.height / 2 + 70,
    w: 200, h: 56
  };
}

// ポインター操作（タッチ・マウス統合）
let joystickPointerId = null;

canvas.addEventListener("pointerdown", e => {
  if (inputMode !== "phone") return;
  e.preventDefault();
  const pos = getCanvasPos(e);

  // ── gameover / clear：リトライ・homeボタン ──
  if (gameState === "gameover" || gameState === "clear") {
    const r = getRetryBtnRect();
    if (pos.x >= r.x && pos.x <= r.x + r.w &&
        pos.y >= r.y && pos.y <= r.y + r.h) {
      resetGame();
    }
    const h = getHomeBtnRect();
    if (pos.x >= h.x && pos.x <= h.x + h.w &&
        pos.y >= h.y && pos.y <= h.y + h.h) {
      goTitle();
    }
    return;
  }

  if (gameState !== "play") return;

  // ── スキルアイコン（右下、大きめ判定）──
  for (let i = 0; i < 4; i++) {
    const r = getSkillIconRect(i);
    const pad = 0;
    if (pos.x >= r.x - pad && pos.x <= r.x + r.w + pad &&
        pos.y >= r.y - pad && pos.y <= r.y + r.h + pad) {
      const depleted = hayatoMode && skillUseCount[i] >= 5 && skillsUsed[i];
      const reloading = hayatoMode && skillsUsed[i] && skillReloadTime[i] > 0 && !depleted;
      const visible = !skillsUsed[i] || reloading;
      if (!visible) continue; // 消えてるボタンはスティックに素通り
      if (!skillsUsed[i]) [useStop, useTeleport, useReverse, useRoar][i]();
      return;
    }
  }

  // ── ジョイスティック（スキル以外の場所ならどこでも）──
  if (joystickPointerId === null) {
    joystickPointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    joystick.active = true;
    // タッチした場所がスティックの中心
    joystick.baseX  = pos.x;
    joystick.baseY  = pos.y;
    joystick.touchX = pos.x;
    joystick.touchY = pos.y;
  }
});

canvas.addEventListener("pointermove", e => {
  if (inputMode !== "phone") return;
  if (e.pointerId !== joystickPointerId) return;
  e.preventDefault();
  const pos = getCanvasPos(e);
  const dx = pos.x - joystick.baseX;
  const dy = pos.y - joystick.baseY;
  const dist = Math.hypot(dx, dy);
  if (dist > joystick.radius) {
    joystick.touchX = joystick.baseX + (dx / dist) * joystick.radius;
    joystick.touchY = joystick.baseY + (dy / dist) * joystick.radius;
  } else {
    joystick.touchX = pos.x;
    joystick.touchY = pos.y;
  }
});

canvas.addEventListener("pointerup", e => {
  if (inputMode !== "phone") return;
  if (e.pointerId !== joystickPointerId) return;
  joystickPointerId = null;
  joystick.active  = false;
  joystick.touchX  = joystick.baseX;
  joystick.touchY  = joystick.baseY;
});

canvas.addEventListener("pointercancel", e => {
  if (e.pointerId === joystickPointerId) {
    joystickPointerId = null;
    joystick.active = false;
    joystick.touchX = joystick.baseX;
    joystick.touchY = joystick.baseY;
  }
});
function loop() {
  if (gameState === "title") {
    drawTitle();
    if (titleBgm.paused) titleBgm.play();
    // phoneモード：さきモード解放済みで20秒待つと真のはやとモード解放
    if (inputMode === "phone" && sakiMode && !hayatoMode) {
      if (Date.now() - titleEnterTime >= 20000) {
        hayatoMode = true;
        cheatSound.currentTime = 0;
        cheatSound.play().catch(() => {});
      }
    }
  } else {
    update();
    draw();
  }
  requestAnimationFrame(loop);
}

initJoystickPos();
loop();