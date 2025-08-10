// Pathfinding Visualiser — Round 1 (BFS)
// Clean, dependency-free, single-canvas implementation.

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");

// Logical grid
const ROWS = 30;
const COLS = 50;
const cellW = Math.floor(canvas.width / COLS);
const cellH = Math.floor(canvas.height / ROWS);

// States
const EMPTY = 0, WALL = 1, START = 2, GOAL = 3, VISITED = 4, FRONTIER = 5, PATH = 6;

let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
let start = { r: Math.floor(ROWS/2), c: Math.floor(COLS/4) };
let goal  = { r: Math.floor(ROWS/2), c: Math.floor(3*COLS/4) };
grid[start.r][start.c] = START;
grid[goal.r][goal.c] = GOAL;

let mode = "wall"; // "start" | "goal" | "wall"
let drawing = false;

const modeStartBtn = document.getElementById("modeStart");
const modeGoalBtn  = document.getElementById("modeGoal");
const modeWallBtn  = document.getElementById("modeWall");
const runBtn       = document.getElementById("run");
const resetBtn     = document.getElementById("reset");
const clearBtn     = document.getElementById("clearWalls");
const speedInput   = document.getElementById("speed");
const fpsLabel     = document.getElementById("fpsLabel");

// Animation timing
let targetFPS = Number(speedInput.value);
let lastTick = 0;

function setMode(m) {
  mode = m;
  [modeStartBtn, modeGoalBtn, modeWallBtn].forEach(b => b.classList.remove("active"));
  if (m === "start") modeStartBtn.classList.add("active");
  if (m === "goal")  modeGoalBtn.classList.add("active");
  if (m === "wall")  modeWallBtn.classList.add("active");
}

modeStartBtn.onclick = () => setMode("start");
modeGoalBtn.onclick  = () => setMode("goal");
modeWallBtn.onclick  = () => setMode("wall");
speedInput.oninput   = () => { targetFPS = Number(speedInput.value); fpsLabel.textContent = `${targetFPS} fps`; };

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "s") setMode("start");
  if (e.key.toLowerCase() === "g") setMode("goal");
  if (e.key.toLowerCase() === "w") setMode("wall");
  if (e.key.toLowerCase() === "r") runBtn.click();
});

function cellFromMouse(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
  const y = (evt.clientY - rect.top)  * (canvas.height / rect.height);
  return { r: Math.floor(y / cellH), c: Math.floor(x / cellW) };
}

canvas.addEventListener("mousedown", (e) => { drawing = true; handleDraw(e); });
canvas.addEventListener("mousemove", (e) => { if (drawing) handleDraw(e); });
canvas.addEventListener("mouseup",   ()   => { drawing = false; });
canvas.addEventListener("mouseleave",()   => { drawing = false; });

function handleDraw(e) {
  const { r, c } = cellFromMouse(e);
  if (!inBounds(r, c)) return;

  if (mode === "start") {
    if (grid[r][c] === WALL || (r === goal.r && c === goal.c)) return;
    grid[start.r][start.c] = EMPTY;
    start = { r, c };
    grid[r][c] = START;
  } else if (mode === "goal") {
    if (grid[r][c] === WALL || (r === start.r && c === start.c)) return;
    grid[goal.r][goal.c] = EMPTY;
    goal = { r, c };
    grid[r][c] = GOAL;
  } else if (mode === "wall") {
    if ((r === start.r && c === start.c) || (r === goal.r && c === goal.c)) return;
    grid[r][c] = grid[r][c] === WALL ? EMPTY : WALL;
  }
  draw();
}

function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

// BFS structures
let running = false;
let queue = [];
let prev = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

function resetSearch(keepWalls = true) {
  running = false;
  queue = [];
  prev.forEach(row => row.fill(null));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === VISITED || grid[r][c] === FRONTIER || grid[r][c] === PATH) grid[r][c] = EMPTY;
      if (!keepWalls && grid[r][c] === WALL) grid[r][c] = EMPTY;
    }
  }
  grid[start.r][start.c] = START;
  grid[goal.r][goal.c] = GOAL;
  draw();
}

runBtn.onclick   = () => { if (!running) startBFS(); };
resetBtn.onclick = () => resetSearch(true);
clearBtn.onclick = () => resetSearch(false);

function startBFS() {
  resetSearch(true);
  running = true;
  queue.push({ r: start.r, c: start.c });
  stepBFS(0);
}

function stepBFS(timestamp) {
  if (!running) return;
  const minDt = 1000 / targetFPS;
  if (timestamp - lastTick < minDt) {
    requestAnimationFrame(stepBFS);
    return;
  }
  lastTick = timestamp;

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]]; // 4-neighbour
  let steps = Math.max(1, Math.floor(targetFPS / 30)); // speed-up at high FPS

  // Process a few queue pops per frame for smoother speed control
  while (steps-- > 0 && queue.length) {
    const cur = queue.shift();
    const { r, c } = cur;

    // Mark visited (skip start)
    if (!(r === start.r && c === start.c) && grid[r][c] !== GOAL) {
      grid[r][c] = VISITED;
    }

    // Reached goal → reconstruct path and stop
    if (r === goal.r && c === goal.c) {
      reconstructPath();
      running = false;
      draw();
      return;
    }

    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      if (grid[nr][nc] === WALL || grid[nr][nc] === VISITED || grid[nr][nc] === FRONTIER || grid[nr][nc] === START) continue;
      if (prev[nr][nc] !== null) continue; // already discovered

      prev[nr][nc] = { r, c };
      if (!(nr === goal.r && nc === goal.c)) grid[nr][nc] = FRONTIER;
      queue.push({ r: nr, c: nc });
    }
  }

  draw();
  requestAnimationFrame(stepBFS);
}

function reconstructPath() {
  let cur = { r: goal.r, c: goal.c };
  while (!(cur.r === start.r && cur.c === start.c)) {
    const p = prev[cur.r][cur.c];
    if (!p) break;
    if (!(cur.r === goal.r && cur.c === goal.c)) grid[cur.r][cur.c] = PATH;
    cur = p;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // grid background
  ctx.fillStyle = "#0f1621";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * cellW;
      const y = r * cellH;
      const state = grid[r][c];

      switch (state) {
        case WALL:     ctx.fillStyle = "var(--wall)"; break;
        case VISITED:  ctx.fillStyle = "var(--visited)"; break;
        case FRONTIER: ctx.fillStyle = "var(--frontier)"; break;
        case PATH:     ctx.fillStyle = "var(--path)"; break;
        case START:    ctx.fillStyle = "var(--start)"; break;
        case GOAL:     ctx.fillStyle = "var(--goal)"; break;
        default:       ctx.fillStyle = "#0f1621"; break;
      }
      if (state !== EMPTY) ctx.fillRect(x+1, y+1, cellW-2, cellH-2);

      // grid lines
      ctx.strokeStyle = "var(--grid)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);
    }
  }
}

draw();
