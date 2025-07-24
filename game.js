const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let playerPower = 5;
let stage = 1;

const powerDisplay = document.getElementById('power-display');
const stageDisplay = document.getElementById('stage-display');
const choicesDiv = document.getElementById('choices');
const messageDiv = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');

const NODE_RADIUS = 18;
const PLAYER_RADIUS = 15;

let isMoving = false;

// דמות השחקן (פשוט עיגול צהוב)
class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.speed = 3; // פיקסלים להנעה פר פריים
    this.moving = false;
  }

  draw() {
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(this.x, this.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // עיניים פשוטות
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(this.x - 5, this.y - 3, 4, 0, Math.PI * 2);
    ctx.arc(this.x + 5, this.y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  moveTo(x, y, callback) {
    this.targetX = x;
    this.targetY = y;
    this.moving = true;
    this._callback = callback;
    requestAnimationFrame(this._animate.bind(this));
  }

  _animate() {
    if (!this.moving) return;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.moving = false;
      if (this._callback) this._callback();
      return;
    }
    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;

    draw(); // עדכון ציור
    requestAnimationFrame(this._animate.bind(this));
  }
}

const player = new Player();

// נקודות ומפת המשחק
class Node {
  constructor(id, x, y, type = 'normal', options = []) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type; // normal, enemyOnlyStage
    this.options = options; // אופציות בחירה
  }
}

class Option {
  constructor(text, nextNodeId, effect) {
    this.text = text;
    this.nextNodeId = nextNodeId;
    this.effect = effect;
  }
}

const nodes = {};

// פונקציות עזר
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEnemyEffect(enemyPower) {
  return () => {
    if (playerPower >= enemyPower) {
      playerPower += enemyPower;
      messageDiv.textContent = `ניצחת בקרב! עוצמתך עלתה ל-${playerPower}`;
      return true;
    } else {
      messageDiv.textContent = `הפסדת בקרב עם אויב עוצמה ${enemyPower}... המשחק נגמר.`;
      gameOver();
      return false;
    }
  };
}

function createTreasureEffect(treasurePower) {
  return () => {
    playerPower += treasurePower;
    messageDiv.textContent = `מצאת תיבת אוצר! עוצמתך עלתה ל-${playerPower}`;
    return true;
  };
}

function createMultiplierEffect(multiplier) {
  return () => {
    playerPower *= multiplier;
    messageDiv.textContent = `קסם מכפיל עוצמה x${multiplier}! עכשיו יש לך ${playerPower}`;
    return true;
  };
}

// יצירת המפה המפוצלת גרפית
function createMap() {
  // מיקום צמתים (X,Y) – מפה עם פיצולים ברורים
  //  id, x, y, type, options
  nodes['1'] = new Node('1', 100, 350, 'normal', []);
  nodes['2'] = new Node('2', 250, 350, 'enemyOnlyStage', []);
  nodes['3'] = new Node('3', 400, 300, 'normal', []);
  nodes['4'] = new Node('4', 400, 400, 'normal', []);
  nodes['5'] = new Node('5', 550, 250, 'normal', []);
  nodes['6'] = new Node('6', 550, 350, 'enemyOnlyStage', []);
  nodes['7'] = new Node('7', 550, 450, 'normal', []);
  nodes['8'] = new Node('8', 700, 300, 'normal', []);
  nodes['9'] = new Node('9', 700, 400, 'normal', []);
  nodes['10'] = new Node('10', 750, 350, 'normal', []);

  // הוספת אפשרויות (קישורים) לכל צומת
  // Node 1 -> Node 2 (Enemy only stage)
  nodes['1'].options.push(
    new Option('המשך לשלב 2', '2', () => { messageDiv.textContent = 'מתקדם לשלב הבא'; return true; })
  );

  // Node 2 (Enemy only stage) – 3 אויבים
  nodes['2'].options.push(
    new Option('👹 אויב עם עוצמה 6', '3', createEnemyEffect(6)),
    new Option('👹 אויב עם עוצמה 7', '3', createEnemyEffect(7)),
    new Option('👹 אויב עם עוצמה 8', '3', createEnemyEffect(8))
  );

  // Node 3 פיצול ל־4 ו־5
  nodes['3'].options.push(
    new Option('🛤️ פיצול לשביל למטה (4)', '4', () => { messageDiv.textContent = 'בחרת בדרך למטה'; return true; }),
    new Option('🛤️ פיצול לשביל למעלה (5)', '5', () => { messageDiv.textContent = 'בחרת בדרך למעלה'; return true; })
  );

  // Node 4 תיבה או אויב
  nodes['4'].options.push(
    new Option('🎁 תיבת אוצר +10 עוצמה', '6', createTreasureEffect(10)),
    new Option('👹 אויב עם עוצמה 12', '6', createEnemyEffect(12))
  );

  // Node 5 תיבה או מכפיל
  nodes['5'].options.push(
    new Option('🎁 תיבת אוצר +7 עוצמה', '6', createTreasureEffect(7)),
    new Option('✨ קסם מכפיל x2', '6', createMultiplierEffect(2))
  );

  // Node 6 (Enemy only stage)
  nodes['6'].options.push(
    new Option('👹 אויב עם עוצמה 15', '7', createEnemyEffect(15)),
    new Option('👹 אויב עם עוצמה 18', '7', createEnemyEffect(18))
  );

  // Node 7 תיבה או פיצול
  nodes['7'].options.push(
    new Option('🎁 תיבת אוצר +5 עוצמה', '8', createTreasureEffect(5)),
    new Option('🛤️ המשך לשלב 9', '9', () => { messageDiv.textContent = 'בחרת להמשיך בדרך'; return true; })
  );

  // Node 8 תיבה או אויב
  nodes['8'].options.push(
    new Option('🎁 תיבת אוצר +12 עוצמה', '10', createTreasureEffect(12)),
    new Option('👹 אויב עם עוצמה 22', '10', createEnemyEffect(22))
  );

  // Node 9 תיבה או אויב
  nodes['9'].options.push(
    new Option('🎁 תיבת אוצר +15 עוצמה', '10', createTreasureEffect(15)),
    new Option('👹 אויב עם עוצמה 25', '10', createEnemyEffect(25))
  );

  // Node 10 סיום
  nodes['10'].options.push();
}

createMap();

let currentNodeId = '1';

// ציור הקווים בין הצמתים
function drawPaths() {
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  function connectNodes(id1, id2) {
    const n1 = nodes[id1];
    const n2 = nodes[id2];
    if (!n1 || !n2) return;

    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.stroke();
  }

  // הגדר את הקשרים הידועים בין הצמתים
  connectNodes('1', '2');
  connectNodes('2', '3');
  connectNodes('3', '4');
  connectNodes('3', '5');
  connectNodes('4', '6');
  connectNodes('5', '6');
  connectNodes('6', '7');
  connectNodes('7', '8');
  connectNodes('7', '9');
  connectNodes('8', '10');
  connectNodes('9', '10');
}

// ציור הצמתים עצמם
function drawNodes() {
  for (const id in nodes) {
    const node = nodes[id];
    ctx.fillStyle = node.type === 'enemyOnlyStage' ? '#d84315' : '#4caf50';
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // מספר השלב במרכז העיגול
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(id, node.x, node.y);
  }
}

// ציור אויבים פשוטים (משולשים אדומים)
function drawEnemy(x, y) {
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x - 10, y + 10);
  ctx.lineTo(x + 10, y + 10);
  ctx.closePath();
  ctx.fill();
}

// ציור תיבת אוצר (מלבן עם כוכב)
function drawTreasure(x, y) {
  ctx.fillStyle = '#fbc02d';
  ctx.fillRect(x - 12, y - 12, 24, 24);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', x, y);
}

// ציור קסם (כוכב עם קרניים)
function drawMultiplier(x, y) {
  ctx.fillStyle = '#8e24aa';
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  for(let i=0; i<8; i++){
    ctx.lineTo(x + 12 * Math.cos(i * Math.PI / 4), y + 12 * Math.sin(i * Math.PI / 4));
  }
  ctx.closePath();
  ctx.fill();
}

// ציור האופציות על הקנבס ליד הצומת
function drawOptionIcon(option, node) {
  // נציב האייקון מעט מעל הצומת (y-40)
  const x = node.x;
  const y = node.y - 40;

  if (option.text.includes('אויב')) {
    drawEnemy(x, y);
  } else if (option.text.includes('תיבת אוצר')) {
    drawTreasure(x, y);
  } else if (option.text.includes('קסם מכפיל')) {
    drawMultiplier(x, y);
  } else if (option.text.includes('פיצול') || option.text.includes('דרך')) {
    // לצורך פיצולים, נצייר עיגול קטן בצבע תכלת
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ציור כל המסלול והדמות
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPaths();
  drawNodes();

  // ציור האייקונים של האופציות בצומת הנוכחי
  const node = nodes[currentNodeId];
  if(node) {
    node.options.forEach(opt => drawOptionIcon(opt, node));
  }

  player.draw();
}

// הצבת השחקן בצומת ההתחלתי
function placePlayerAtNode(id) {
  const node = nodes[id];
  if(!node) return;
  player.x = node.x;
  player.y = node.y;
}

// הצגת נתונים במסך
function updateDisplay() {
  powerDisplay.textContent = `עוצמה שלך: ${playerPower}`;
  stageDisplay.textContent = `שלב: ${stage}`;
}

// הצגת אפשרויות ככפתורים
function showChoices() {
  choicesDiv.innerHTML = '';
  messageDiv.textContent = '';

  const node = nodes[currentNodeId];
  if(!node) return;

  // אין אפשרויות — הצג סיום
  if(node.options.length === 0) {
    messageDiv.textContent = 'הגעת לסוף הדרך! רוצה להתחיל מחדש?';
    restartBtn.style.display = 'inline-block';
    return;
  }

  node.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.onclick = () => {
      if (player.moving) return; // לא ללחוץ בזמן תנועה

      const success = opt.effect();
      if(success === false) return;

      currentNodeId = opt.nextNodeId;
      stage++;
      updateDisplay();

      // הזזת השחקן עם אנימציה
      const nextNode = nodes[currentNodeId];
      if(nextNode) {
        player.moveTo(nextNode.x, nextNode.y, () => {
          // אחרי ההגעה, אם זה שלב אויב בלבד, נאבק אוטומטית באויבים אחד אחד
          if(nextNode.type === 'enemyOnlyStage') {
            autoFightEnemies(nextNode);
          } else {
            showChoices();
          }
        });
      }
    };
    choicesDiv.appendChild(btn);
  });

  restartBtn.style.display = 'none';
}

// אוטו-קרב בשלבי אויב בלבד
function autoFightEnemies(node) {
  if(node.options.length === 0) {
    showChoices();
    return;
  }

  const enemyOpt = node.options.shift();
  const win = enemyOpt.effect();
  if(win === false) return; // משחק נגמר

  stage++;
  updateDisplay();
  messageDiv.textContent = `ניצחת אויב אוטומטית! עוצמה: ${playerPower}`;

  // להמשיך לאויב הבא עם עיכוב קטן
  setTimeout(() => {
    if(node.options.length > 0) {
      autoFightEnemies(node);
    } else {
      // לאחר סיום כל האויבים, לעבור לצומת הבא אוטומטית
      // נניח הצומת הבא הוא +1 ב-id
      const nextId = (parseInt(node.id) + 1).toString();
      currentNodeId = nextId;

      const nextNode = nodes[nextId];
      if(nextNode) {
        player.moveTo(nextNode.x, nextNode.y, () => {
          showChoices();
        });
      } else {
        showChoices();
      }
    }
  }, 1000);
}

function gameOver() {
  choicesDiv.innerHTML = '';
  restartBtn.style.display = 'inline-block';
}

restartBtn.onclick = () => {
  playerPower = 5;
  stage = 1;
  currentNodeId = '1';
  placePlayerAtNode(currentNodeId);
  messageDiv.textContent = '';
  updateDisplay();
  draw();
  showChoices();
  restartBtn.style.display = 'none';
};

// התחלה
placePlayerAtNode(currentNodeId);
updateDisplay();
draw();
showChoices();
