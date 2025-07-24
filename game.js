const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let playerPower = 5;
let stage = 1;

const powerDisplay = document.getElementById('power-display');
const stageDisplay = document.getElementById('stage-display');
const choicesDiv = document.getElementById('choices');
const messageDiv = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');

const pathHeight = canvas.height / 2;
const pathStartX = 50;
const pathEndX = canvas.width - 50;

// The player's position on the path (x coordinate)
let playerX = pathStartX;

// State flags
let isMoving = false;
let moveTargetX = pathEndX; // where to move next

// Data structures for the map

// Each node is a junction or endpoint with possible options:
// Options can be 'enemy', 'treasure', 'multiplier', or 'path' (which leads to next node)
class Node {
  constructor(id, type = 'path', options = []) {
    this.id = id;
    this.type = type; // 'path' or 'enemyOnlyStage'
    this.options = options; // array of Option
  }
}

class Option {
  constructor(text, nextNodeId, effect) {
    this.text = text; // what to show the player
    this.nextNodeId = nextNodeId; // id of the node to go next if chosen
    this.effect = effect; // function to apply effect (like add power or fight)
  }
}

// Game map — a graph of nodes with options and effects
// For simplicity, nodes indexed by id (numbers as strings)
const nodes = {};

// Utility random int
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Effects for fight, treasure, multiply
function createEnemyEffect(enemyPower) {
  return () => {
    if (playerPower >= enemyPower) {
      playerPower += enemyPower;
      messageDiv.textContent = `ניצחת בקרב! עוצמתך עלתה ל-${playerPower}`;
      return true; // success
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

// Build the nodes graph with some randomization for infinite progression

function generateNode(id) {
  // For demo, nodes alternate between enemyOnlyStage and normal with options

  if (id % 5 === 0) {
    // Enemy only stage - 3 enemies to fight, no other options
    const enemies = [];
    for (let i = 0; i < 3; i++) {
      const enemyPower = randomInt(Math.floor(playerPower * 0.6), Math.floor(playerPower * 1.2));
      enemies.push(
        new Option(
          `👹 אויב עם עוצמה ${enemyPower}`,
          (id + 1).toString(),
          createEnemyEffect(enemyPower)
        )
      );
    }
    nodes[id] = new Node(id.toString(), 'enemyOnlyStage', enemies);
  } else {
    // Normal node: options include enemy, treasure, multiplier and paths (sometimes with multiple choices)
    const options = [];

    // Add 1-2 enemies
    const enemyCount = randomInt(1,2);
    for (let i = 0; i < enemyCount; i++) {
      const enemyPower = randomInt(Math.floor(playerPower * 0.5), Math.floor(playerPower * 1.1));
      options.push(
        new Option(
          `👹 אויב עם עוצמה ${enemyPower}`,
          (id + 1).toString(),
          createEnemyEffect(enemyPower)
        )
      );
    }

    // Possibly add treasure or multiplier
    if (Math.random() < 0.6) {
      const treasurePower = randomInt(5, 15);
      options.push(
        new Option(
          `🎁 תיבת אוצר +${treasurePower} עוצמה`,
          (id + 1).toString(),
          createTreasureEffect(treasurePower)
        )
      );
    }
    if (Math.random() < 0.4) {
      const multiplier = [2,3][randomInt(0,1)];
      options.push(
        new Option(
          `✨ קסם מכפיל עוצמה x${multiplier}`,
          (id + 1).toString(),
          createMultiplierEffect(multiplier)
        )
      );
    }

    // Possibly add path-only options (פיצולים) - 1 or 2 choices to nodes with different IDs (simulate פיצול שבילים)
    if (Math.random() < 0.5) {
      const branchCount = randomInt(1,2);
      for (let i = 0; i < branchCount; i++) {
        const nextNodeId = id + 2 + i; // skip ahead a bit
        options.push(
          new Option(
            `🛤️ המשך בדרך אחרת (פיצול ${i+1})`,
            nextNodeId.toString(),
            () => {
              messageDiv.textContent = `בחרת בדרך אחרת...`;
              return true;
            }
          )
        );
      }
    }

    // Pick up to 3 random options to show
    nodes[id] = new Node(id.toString(), 'path', options.slice(0,3));
  }
}

// Initialize nodes as player progresses
function ensureNode(id) {
  if (!nodes[id]) generateNode(id);
}

// Current node id
let currentNodeId = '1';

function updateDisplay() {
  powerDisplay.textContent = `עוצמה שלך: ${playerPower}`;
  stageDisplay.textContent = `שלב: ${stage}`;
}

// Draw path and player on canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw path as a simple horizontal line with dots for junctions

  ctx.strokeStyle = '#888';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(pathStartX, pathHeight);
  ctx.lineTo(pathEndX, pathHeight);
  ctx.stroke();

  // Draw junctions (nodes) as small circles evenly spaced for demo

  const totalNodesToShow = 10;
  for(let i = 0; i < totalNodesToShow; i++) {
    const x = pathStartX + (i * (pathEndX - pathStartX) / (totalNodesToShow - 1));
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(x, pathHeight, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw player as a yellow circle

  ctx.fillStyle = '#ff0';
  ctx.beginPath();
  ctx.arc(playerX, pathHeight, 15, 0, Math.PI * 2);
  ctx.fill();
}

// Animate player moving to next junction or choice point
function movePlayerTo(x, callback) {
  isMoving = true;
  moveTargetX = x;

  function animate() {
    if (playerX < moveTargetX) {
      playerX += 5;
      if (playerX > moveTargetX) playerX = moveTargetX;
      draw();
      requestAnimationFrame(animate);
    } else {
      isMoving = false;
      callback();
    }
  }
  animate();
}

// Show choices buttons for current node
function showChoices() {
  choicesDiv.innerHTML = '';
  messageDiv.textContent = '';

  ensureNode(parseInt(currentNodeId));

  const node = nodes[currentNodeId];

  // If node is enemyOnlyStage, all options are enemies
  // Otherwise, options can be enemies, treasures, multipliers, or paths (picks)

  node.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.onclick = () => {
      if(isMoving) return; // ignore clicks while moving

      // Run effect function
      const success = opt.effect();
      if (success === false) {
        // game over
        return;
      }
      // advance to next node
      currentNodeId = opt.nextNodeId;
      stage++;

      updateDisplay();

      // Move player visually to next junction
      const totalNodesToShow = 10;
      const nextNodeNum = parseInt(currentNodeId);
      // Clamp nextNodeNum to the path length shown
      let targetIndex = nextNodeNum - 1;
      if (targetIndex > totalNodesToShow -1) targetIndex = totalNodesToShow -1;
      const nextX = pathStartX + (targetIndex * (pathEndX - pathStartX) / (totalNodesToShow - 1));

      movePlayerTo(nextX, () => {
        // After moving, show choices again or auto-advance if enemyOnlyStage
        if (nodes[currentNodeId].type === 'enemyOnlyStage') {
          // If enemyOnlyStage, auto force player to fight first enemy automatically (simulate no choices)
          if(nodes[currentNodeId].options.length > 0) {
            const firstEnemy = nodes[currentNodeId].options[0];
            const win = firstEnemy.effect();
            if(win === false) return; // game over
            // Remove first enemy from options
            nodes[currentNodeId].options.shift();
            messageDiv.textContent = `ניצחת באויב באוטומט! עוצמה: ${playerPower}`;
            stage++;
            currentNodeId = (parseInt(currentNodeId) + 1).toString();
            updateDisplay();

            // Move player again to next junction after fighting enemy
            const nextIdx = parseInt(currentNodeId) - 1;
            const nextX2 = pathStartX + (nextIdx * (pathEndX - pathStartX) / (totalNodesToShow - 1));
            movePlayerTo(nextX2, () => {
              // If still enemyOnlyStage and still enemies left, repeat
              if (nodes[currentNodeId] && nodes[currentNodeId].type === 'enemyOnlyStage' && nodes[currentNodeId].options.length > 0) {
                showChoices(); // recursive - this handles automatic fights on enemyOnlyStage
              } else {
                showChoices();
              }
            });
            return;
          }
        } else {
          showChoices();
        }
      });
    };
    choicesDiv.appendChild(btn);
  });

  // If no options (dead end), show restart button
  if(node.options.length === 0) {
    messageDiv.textContent = "הגעת לסוף הדרך! להתחיל מחדש?";
    choicesDiv.innerHTML = '';
    restartBtn.style.display = 'inline-block';
  } else {
    restartBtn.style.display = 'none';
  }
}

function gameOver() {
  choicesDiv.innerHTML = '';
  restartBtn.style.display = 'inline-block';
}

restartBtn.onclick = () => {
  playerPower = 5;
  stage = 1;
  currentNodeId = '1';
  playerX = pathStartX;
  messageDiv.textContent = '';
  updateDisplay();
  draw();
  showChoices();
  restartBtn.style.display = 'none';
};

// התחלת המשחק
updateDisplay();
draw();
showChoices();
