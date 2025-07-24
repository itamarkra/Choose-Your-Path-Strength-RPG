let playerPower = 5;
let stage = 1;

const powerDisplay = document.getElementById('power-display');
const stageDisplay = document.getElementById('stage-display');
const choicesDiv = document.getElementById('choices');
const messageDiv = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');

function updateDisplay() {
  powerDisplay.textContent = `עוצמה שלך: ${playerPower}`;
  stageDisplay.textContent = `שלב: ${stage}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createChoices() {
  choicesDiv.innerHTML = '';
  messageDiv.textContent = '';

  // נגדיר אפשרויות לפי העוצמה של השחקן
  // אויבים עם עוצמה בין 50% ל-120% מהעוצמה שלך
  const enemyPower1 = randomInt(Math.floor(playerPower * 0.5), Math.floor(playerPower * 0.8));
  const enemyPower2 = randomInt(Math.floor(playerPower * 0.7), Math.floor(playerPower * 1.0));
  const enemyPower3 = randomInt(Math.floor(playerPower * 0.9), Math.floor(playerPower * 1.2));

  // אפשרות אוצר שמוסיף עוצמה רנדומלית (5-15)
  const treasurePower = randomInt(5, 15);

  // אפשרות כפל עוצמה (x2 או x3)
  const multiplier = [2, 3][randomInt(0,1)];

  // בוחרים 3 אופציות אקראיות מתוך 5 אפשרויות (3 אויבים, אוצר, כפל)
  const optionsPool = [
    {type: 'enemy', power: enemyPower1},
    {type: 'enemy', power: enemyPower2},
    {type: 'enemy', power: enemyPower3},
    {type: 'treasure', power: treasurePower},
    {type: 'multiplier', power: multiplier}
  ];

  // מערבבים ובוחרים 3
  const shuffled = optionsPool.sort(() => 0.5 - Math.random());
  const options = shuffled.slice(0,3);

  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    if(opt.type === 'enemy') {
      btn.textContent = `👹 אויב עם עוצמה ${opt.power}`;
      btn.onclick = () => fightEnemy(opt.power);
    } else if(opt.type === 'treasure') {
      btn.textContent = `🎁 תיבת אוצר +${opt.power} עוצמה`;
      btn.onclick = () => collectTreasure(opt.power);
    } else if(opt.type === 'multiplier') {
      btn.textContent = `✨ קסם מכפיל עוצמה x${opt.power}`;
      btn.onclick = () => multiplyPower(opt.power);
    }
    choicesDiv.appendChild(btn);
  });
}

function fightEnemy(enemyPower) {
  if(playerPower >= enemyPower) {
    playerPower += enemyPower;
    stage++;
    messageDiv.textContent = `ניצחת! העוצמה שלך עלתה ל-${playerPower}`;
    updateDisplay();
    createChoices();
  } else {
    messageDiv.textContent = `הפסדת בקרב... המשחק נגמר!`;
    choicesDiv.innerHTML = '';
    restartBtn.style.display = 'inline-block';
  }
}

function collectTreasure(treasurePower) {
  playerPower += treasurePower;
  stage++;
  messageDiv.textContent = `לקחת את האוצר! העוצמה שלך עכשיו ${playerPower}`;
  updateDisplay();
  createChoices();
}

function multiplyPower(multiplier) {
  playerPower *= multiplier;
  stage++;
  messageDiv.textContent = `העוצמה הוכפלה ל-${playerPower}`;
  updateDisplay();
  createChoices();
}

restartBtn.onclick = () => {
  playerPower = 5;
  stage = 1;
  restartBtn.style.display = 'none';
  messageDiv.textContent = '';
  updateDisplay();
  createChoices();
};

// התחלה
updateDisplay();
createChoices();
