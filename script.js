const SIZE = 5;
const TOTAL_TILES = SIZE * SIZE;
const TILE_VALUE_EMPTY = null;

const boardEl = document.getElementById('board');
const timerEl = document.getElementById('timer');
const movesEl = document.getElementById('moves');
const bestTimeEl = document.getElementById('bestTime');
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');

let board = [];
let moves = 0;
let timer = 0;
let timerInterval = null;
let started = false;
let draggingTileIndex = null;

const BEST_TIME_KEY = 'sliding-puzzle-best-time';

function createSolvedBoard() {
  const values = [];
  for (let i = 1; i < TOTAL_TILES; i++) {
    values.push(i);
  }
  values.push(TILE_VALUE_EMPTY);
  return values;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getEmptyIndex() {
  return board.indexOf(TILE_VALUE_EMPTY);
}

function isAdjacent(indexA, indexB) {
  const rowA = Math.floor(indexA / SIZE);
  const colA = indexA % SIZE;
  const rowB = Math.floor(indexB / SIZE);
  const colB = indexB % SIZE;

  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
}

function updateBestTimeDisplay() {
  const best = Number(localStorage.getItem(BEST_TIME_KEY));
  bestTimeEl.textContent = Number.isFinite(best) ? formatTime(best) : '--:--';
}

function updateMoves() {
  movesEl.textContent = String(moves);
}

function updateTimerDisplay() {
  timerEl.textContent = formatTime(timer);
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    timer += 1;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  timer = 0;
  started = false;
  updateTimerDisplay();
}

function isSolved() {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) {
      return false;
    }
  }
  return board[board.length - 1] === TILE_VALUE_EMPTY;
}

function handleSolved() {
  stopTimer();

  const best = Number(localStorage.getItem(BEST_TIME_KEY));
  if (!Number.isFinite(best) || timer < best) {
    localStorage.setItem(BEST_TIME_KEY, String(timer));
  }

  updateBestTimeDisplay();
  setTimeout(() => {
    alert(`You solved it in ${moves} moves and ${formatTime(timer)}!`);
  }, 150);
}

function swap(indexA, indexB) {
  [board[indexA], board[indexB]] = [board[indexB], board[indexA]];
}

function moveTile(index) {
  const emptyIndex = getEmptyIndex();
  if (!isAdjacent(index, emptyIndex)) {
    return;
  }

  if (!started) {
    started = true;
    startTimer();
  }

  swap(index, emptyIndex);
  moves += 1;
  updateMoves();
  renderBoard();

  if (isSolved()) {
    handleSolved();
  }
}

function renderBoard() {
  boardEl.innerHTML = '';

  board.forEach((value, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = value === TILE_VALUE_EMPTY ? 'cell empty' : 'cell';
    cell.dataset.index = String(index);
    cell.textContent = value === TILE_VALUE_EMPTY ? '' : String(value);
    cell.setAttribute('aria-label', value === TILE_VALUE_EMPTY ? 'Empty tile' : `Tile ${value}`);

    if (value !== TILE_VALUE_EMPTY) {
      cell.addEventListener('click', () => moveTile(index));
      cell.addEventListener('pointerdown', (event) => {
        draggingTileIndex = index;
        const tile = event.currentTarget;
        tile.classList.add('dragging');
      });

      cell.addEventListener('pointerup', (event) => {
        const target = document.elementFromPoint(event.clientX, event.clientY);
        const targetCell = target && target.closest('.cell');

        if (targetCell && targetCell.classList.contains('empty')) {
          const dropIndex = Number(targetCell.dataset.index);
          if (isAdjacent(index, dropIndex)) {
            moveTile(index);
          }
        }

        event.currentTarget.classList.remove('dragging');
        draggingTileIndex = null;
      });

      cell.addEventListener('pointerleave', (event) => {
        event.currentTarget.classList.remove('dragging');
      });
    }

    boardEl.appendChild(cell);
  });
}

function shuffleBoard() {
  board = createSolvedBoard();
  moves = 0;
  updateMoves();
  resetTimer();

  let previousEmptyIndex = getEmptyIndex();
  const shuffleSteps = 500;

  for (let i = 0; i < shuffleSteps; i++) {
    const emptyIndex = getEmptyIndex();
    const possibleMoves = [];

    const directions = [-1, 1, -SIZE, SIZE];

    for (const delta of directions) {
      const neighborIndex = emptyIndex + delta;
      if (neighborIndex < 0 || neighborIndex >= board.length) {
        continue;
      }

      const row = Math.floor(emptyIndex / SIZE);
      const col = emptyIndex % SIZE;
      const neighborRow = Math.floor(neighborIndex / SIZE);
      const neighborCol = neighborIndex % SIZE;

      const isSameRow = row === neighborRow;
      const isSameCol = col === neighborCol;

      const validHorizontal = isSameRow && Math.abs(col - neighborCol) === 1;
      const validVertical = isSameCol && Math.abs(row - neighborRow) === 1;

      if (validHorizontal || validVertical) {
        possibleMoves.push(neighborIndex);
      }
    }

    const validMoves = possibleMoves.filter((idx) => idx !== previousEmptyIndex);
    const randomIndex = validMoves[Math.floor(Math.random() * validMoves.length)] || emptyIndex;

    swap(emptyIndex, randomIndex);
    previousEmptyIndex = emptyIndex;
  }

  renderBoard();
}

function init() {
  updateBestTimeDisplay();
  board = createSolvedBoard();
  updateMoves();
  updateTimerDisplay();
  renderBoard();
}

shuffleBtn.addEventListener('click', shuffleBoard);
resetBtn.addEventListener('click', () => {
  board = createSolvedBoard();
  moves = 0;
  updateMoves();
  resetTimer();
  renderBoard();
});

window.addEventListener('pointerup', (event) => {
  if (draggingTileIndex === null) {
    return;
  }

  const target = document.elementFromPoint(event.clientX, event.clientY);
  const emptyCell = target && target.closest('.cell.empty');

  if (emptyCell) {
    const dropIndex = Number(emptyCell.dataset.index);
    if (isAdjacent(draggingTileIndex, dropIndex)) {
      moveTile(draggingTileIndex);
    }
  }

  const activeTile = document.querySelector('.cell.dragging');
  if (activeTile) {
    activeTile.classList.remove('dragging');
  }

  draggingTileIndex = null;
});

init();
