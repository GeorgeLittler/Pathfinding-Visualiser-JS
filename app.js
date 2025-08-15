// Pathfinding Visualiser — BFS, DFS, Dijkstra, A*
const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");

const css = getComputedStyle(document.documentElement);
const COLORS = {
  wall:     css.getPropertyValue('--wall').trim()     || '#2b3440',
  weight:   '#324055',
  visited:  css.getPropertyValue('--visited').trim()  || '#284f7a',
  frontier: css.getPropertyValue('--frontier').trim() || '#2d6cdf',
  path:     css.getPropertyValue('--path').trim()     || '#f59e0b',
  start:    css.getPropertyValue('--start').trim()    || '#22c55e',
  goal:     css.getPropertyValue('--goal').trim()     || '#ff5d8f',
  empty:    '#0f1621',
  grid:     css.getPropertyValue('--grid').trim()     || '#1b2531',
};

// Grid
const ROWS = 30, COLS = 50;
const cellW = Math.floor(canvas.width / COLS);
const cellH = Math.floor(canvas.height / ROWS);

// States
const EMPTY=0, WALL=1, START=2, GOAL=3, VISITED=4, FRONTIER=5, PATH=6, WEIGHT=7;

let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
let weightsOn = false;
let diagonalsOn = false;

let start = { r: Math.floor(ROWS/2), c: 5 };
let goal  = { r: Math.floor(ROWS/2), c: COLS-6 };

// UI
const modeStartBtn = document.getElementById("modeStart");
const modeGoalBtn  = document.getElementById("modeGoal");
const modeWallBtn  = document.getElementById("modeWall");
const runBtn       = document.getElementById("run");
const resetBtn     = document.getElementById("reset");
const clearWallsBtn= document.getElementById("clearWalls");
const clearPathBtn = document.getElementById("clearPath");
const randomWallsBtn = document.getElementById("randomWalls");
const speedInput   = document.getElementById("speed");
const fpsLabel     = document.getElementById("fpsLabel");
const algoSelect   = document.getElementById("algo");
const diagonalsChk = document.getElementById("diagonals");
const weightsChk   = document.getElementById("weights");

// Metrics
const mAlgo = document.getElementById("m_algo");
const mExp  = document.getElementById("m_expanded");
const mPath = document.getElementById("m_path");
const mTime = document.getElementById("m_time");
const mStat = document.getElementById("m_status");

// Animation
let targetFPS = Number(speedInput.value);
let running = false;
let mode = "wall"; // "start" | "goal" | "wall"
let mouseDown = false;

// Helpers
function inBounds(r,c){ return r>=0 && c>=0 && r<ROWS && c<COLS; }
function isBlocked(r,c){ return grid[r][c]===WALL; }
function costAt(r,c){ return (grid[r][c]===WEIGHT ? 5 : 1); }

function neighboursOf(r,c) {
  const dirs4 = [[1,0],[-1,0],[0,1],[0,-1]];
  const dirs8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const dirs = diagonalsOn ? dirs8 : dirs4;
  const res=[];
  for (const [dr,dc] of dirs) {
    const nr=r+dr, nc=c+dc;
    if (!inBounds(nr,nc) || isBlocked(nr,nc)) continue;
    res.push([nr,nc, (dr&&dc)? Math.SQRT2 : 1]); // √2 for diagonals
  }
  return res;
}

function clearPathStates() {
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (grid[r][c]===VISITED || grid[r][c]===FRONTIER || grid[r][c]===PATH) grid[r][c]=EMPTY;
  }
  grid[start.r][start.c]=START;
  grid[goal.r][goal.c]=GOAL;
}

function resetAll() {
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) grid[r][c]=EMPTY;
  grid[start.r][start.c]=START;
  grid[goal.r][goal.c]=GOAL;
}

function randomWalls(p=0.25) {
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if ((r===start.r&&c===start.c) || (r===goal.r&&c===goal.c)) continue;
    grid[r][c] = Math.random()<p ? WALL : EMPTY;
  }
  if (weightsOn) addWeights();
}

function addWeights() {
  // sprinkle weights on empty cells
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (grid[r][c]===EMPTY && Math.random()<0.15) grid[r][c]=WEIGHT;
  }
}

function clearWalls() {
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (grid[r][c]===WALL || grid[r][c]===WEIGHT) grid[r][c]=EMPTY;
  }
  grid[start.r][start.c]=START;
  grid[goal.r][goal.c]=GOAL;
}

// Drawing
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      const x = c * cellW;
      const y = r * cellH;
      const s = grid[r][c];
      switch (s) {
        case WALL:     ctx.fillStyle = COLORS.wall; break;
        case WEIGHT:   ctx.fillStyle = COLORS.weight; break;
        case VISITED:  ctx.fillStyle = COLORS.visited; break;
        case FRONTIER: ctx.fillStyle = COLORS.frontier; break;
        case PATH:     ctx.fillStyle = COLORS.path; break;
        case START:    ctx.fillStyle = COLORS.start; break;
        case GOAL:     ctx.fillStyle = COLORS.goal; break;
        default:       ctx.fillStyle = COLORS.empty; break;
      }
      if (s !== EMPTY) {
        ctx.fillRect(x+1, y+1, cellW-2, cellH-2);
      }
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);
    }
  }
}


// Mouse interaction
canvas.addEventListener("mousedown", e => { mouseDown=true; handleClickDrag(e); });
canvas.addEventListener("mousemove", e => { if (mouseDown) handleClickDrag(e); });
canvas.addEventListener("mouseup", ()=> mouseDown=false);
canvas.addEventListener("mouseleave", ()=> mouseDown=false);

function cellFromEvent(e){
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const c = Math.floor(cx / (rect.width / COLS));
  const r = Math.floor(cy / (rect.height / ROWS));
  return {r,c};
}

function handleClickDrag(e) {
  if (running) return;
  const {r,c} = cellFromEvent(e);
  if (!inBounds(r,c)) return;
  if (mode==="start") {
    grid[start.r][start.c]=EMPTY;
    start={r,c};
    if (grid[r][c]===GOAL) goal=start; // avoid overlap
    grid[r][c]=START;
  } else if (mode==="goal") {
    grid[goal.r][goal.c]=EMPTY;
    goal={r,c};
    if (grid[r][c]===START) start=goal;
    grid[r][c]=GOAL;
  } else if (mode==="wall") {
    if ((r===start.r&&c===start.c)||(r===goal.r&&c===goal.c)) return;
    grid[r][c]=(grid[r][c]===WALL? EMPTY : WALL);
  }
  draw();
}

// Modes
function setMode(m){
  mode=m;
  [modeStartBtn,modeGoalBtn,modeWallBtn].forEach(b=>b.classList.remove("active"));
  if (m==="start") modeStartBtn.classList.add("active");
  if (m==="goal")  modeGoalBtn.classList.add("active");
  if (m==="wall")  modeWallBtn.classList.add("active");
}

// Keyboard
document.addEventListener("keydown",(e)=>{
  const k=e.key.toLowerCase();
  if (k==="s") setMode("start");
  if (k==="g") setMode("goal");
  if (k==="w") setMode("wall");
  if (k==="r") startRun();
  if (k==="a") cycleAlgo();
  if (k==="d") diagonalsChk.checked=!diagonalsChk.checked, diagonalsOn=diagonalsChk.checked;
  if (k==="c") { clearPathStates(); draw(); }
});

function cycleAlgo(){
  const order=["bfs","dfs","dijkstra","astar"];
  const i=order.indexOf(algoSelect.value);
  const next=order[(i+1)%order.length];
  algoSelect.value=next;
  mAlgo.textContent=labelForAlgo(next);
}

function labelForAlgo(v){
  return {
    bfs:"BFS", dfs:"DFS", dijkstra:"Dijkstra", astar:"A*"
  }[v]||v;
}

// Speed
speedInput.oninput = () => { targetFPS=Number(speedInput.value); fpsLabel.textContent=`${targetFPS} fps`; };

// Options
diagonalsChk.onchange = ()=> { diagonalsOn=diagonalsChk.checked; };
weightsChk.onchange   = ()=> {
  weightsOn=weightsChk.checked;
  // toggle weights on/off (does not affect walls)
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (grid[r][c]===WEIGHT) grid[r][c]=EMPTY;
  }
  if (weightsOn) addWeights();
  draw();
};

// Buttons
modeStartBtn.onclick=()=> setMode("start");
modeGoalBtn.onclick =()=> setMode("goal");
modeWallBtn.onclick =()=> setMode("wall");
runBtn.onclick = ()=> startRun();
resetBtn.onclick = ()=> { running=false; resetAll(); draw(); updateMetrics({algo:algoSelect.value}); };
clearWallsBtn.onclick = ()=> { running=false; clearWalls(); draw(); };
clearPathBtn.onclick  = ()=> { running=false; clearPathStates(); draw(); };
randomWallsBtn.onclick= ()=> { running=false; randomWalls(); draw(); };

// Metrics
function updateMetrics({algo, expanded=0, pathLen=0, ms=0, status="—"}){
  mAlgo.textContent = labelForAlgo(algo||algoSelect.value);
  mExp.textContent  = expanded;
  mPath.textContent = pathLen;
  mTime.textContent = `${ms|0} ms`;
  mStat.textContent = status;
}

// Algorithms as generators (yield {type, payload})
function* genBFS() {
  const q=[[start.r,start.c]];
  const seen=Array.from({length:ROWS},()=>Array(COLS).fill(false));
  const parent=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  seen[start.r][start.c]=true;
  let expanded=0;

  while(q.length){
    const [r,c]=q.shift();
    if (!(r===start.r&&c===start.c)) { grid[r][c]=VISITED; yield {type:"visit", r,c, expanded:++expanded}; }
    if (r===goal.r && c===goal.c) return yield* reconstruct(parent, expanded, "bfs");

    for (const [nr,nc] of neighboursOf(r,c).map(([nr,nc])=>[nr,nc])) {
      if (seen[nr][nc]) continue;
      if (grid[nr][nc]===WALL) continue;
      seen[nr][nc]=true; parent[nr][nc]=[r,c];
      if (!(nr===goal.r&&nc===goal.c)) { grid[nr][nc]=FRONTIER; }
      yield {type:"frontier", r:nr, c:nc, expanded};
      q.push([nr,nc]);
    }
  }
  yield {type:"done", expanded, pathLen:0, found:false, algo:"bfs"};
}

function* genDFS() {
  const st=[[start.r,start.c]];
  const seen=Array.from({length:ROWS},()=>Array(COLS).fill(false));
  const parent=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  let expanded=0;
  while(st.length){
    const [r,c]=st.pop();
    if (seen[r][c]) continue;
    seen[r][c]=true;
    if (!(r===start.r&&c===start.c)) { grid[r][c]=VISITED; yield {type:"visit", r,c, expanded:++expanded}; }
    if (r===goal.r && c===goal.c) return yield* reconstruct(parent, expanded, "dfs");
    const neigh = neighboursOf(r,c).map(([nr,nc])=>[nr,nc]).reverse();
    for (const [nr,nc] of neigh){
      if (seen[nr][nc] || grid[nr][nc]===WALL) continue;
      parent[nr][nc]=[r,c];
      if (!(nr===goal.r&&nc===goal.c)) grid[nr][nc]=FRONTIER;
      yield {type:"frontier", r:nr, c:nc, expanded};
      st.push([nr,nc]);
    }
  }
  yield {type:"done", expanded, pathLen:0, found:false, algo:"dfs"};
}

class MinPQ {
  constructor(){ this.a=[]; }
  push(x){ this.a.push(x); this._up(this.a.length-1); }
  pop(){ if(!this.a.length) return null; const t=this.a[0], e=this.a.pop(); if(this.a.length){ this.a[0]=e; this._down(0);} return t; }
  _up(i){ const a=this.a; while(i){ const p=(i-1>>1); if(a[p][0]<=a[i][0]) break; [a[p],a[i]]=[a[i],a[p]]; i=p; } }
  _down(i){ const a=this.a; for(;;){ const l=i*2+1, r=l+1; let m=i; if(l<a.length && a[l][0]<a[m][0]) m=l; if(r<a.length && a[r][0]<a[m][0]) m=r; if(m===i) break; [a[m],a[i]]=[a[i],a[m]]; i=m; } }
  get length(){ return this.a.length; }
}

function* genDijkstra() {
  const dist=Array.from({length:ROWS},()=>Array(COLS).fill(Infinity));
  const parent=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const pq=new MinPQ();
  dist[start.r][start.c]=0;
  pq.push([0,[start.r,start.c]]);
  let expanded=0;

  while(pq.length){
    const [d,[r,c]]=pq.pop();
    if (d!==dist[r][c]) continue;
    if (!(r===start.r&&c===start.c)) { grid[r][c]=VISITED; yield {type:"visit", r,c, expanded:++expanded}; }
    if (r===goal.r&&c===goal.c) return yield* reconstruct(parent, expanded, "dijkstra");

    for (const [nr,nc,stepCost] of neighboursOf(r,c)) {
      const w = stepCost * costAt(nr,nc);
      const nd = d + w;
      if (nd < dist[nr][nc]) {
        dist[nr][nc]=nd; parent[nr][nc]=[r,c];
        if (!(nr===goal.r&&nc===goal.c)) grid[nr][nc]=FRONTIER;
        yield {type:"frontier", r:nr,c:nc, expanded};
        pq.push([nd,[nr,nc]]);
      }
    }
  }
  yield {type:"done", expanded, pathLen:0, found:false, algo:"dijkstra"};
}

function heuristic(r,c){ // Manhattan with diagonals awareness
  const dr=Math.abs(r-goal.r), dc=Math.abs(c-goal.c);
  return diagonalsOn ? Math.max(dr,dc) : (dr+dc);
}

function* genAStar() {
  const g=Array.from({length:ROWS},()=>Array(COLS).fill(Infinity));
  const f=Array.from({length:ROWS},()=>Array(COLS).fill(Infinity));
  const parent=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const pq=new MinPQ();
  g[start.r][start.c]=0; f[start.r][start.c]=heuristic(start.r,start.c);
  pq.push([f[start.r][start.c],[start.r,start.c]]);
  let expanded=0;

  while(pq.length){
    const [ff,[r,c]]=pq.pop();
    if (ff!==f[r][c]) continue;
    if (!(r===start.r&&c===start.c)) { grid[r][c]=VISITED; yield {type:"visit", r,c, expanded:++expanded}; }
    if (r===goal.r&&c===goal.c) return yield* reconstruct(parent, expanded, "astar");

    for (const [nr,nc,stepCost] of neighboursOf(r,c)) {
      const w = stepCost * costAt(nr,nc);
      const tentative = g[r][c] + w;
      if (tentative < g[nr][nc]) {
        g[nr][nc]=tentative;
        f[nr][nc]=tentative + heuristic(nr,nc);
        parent[nr][nc]=[r,c];
        if (!(nr===goal.r&&nc===goal.c)) grid[nr][nc]=FRONTIER;
        yield {type:"frontier", r:nr,c:nc, expanded};
        pq.push([f[nr][nc],[nr,nc]]);
      }
    }
  }
  yield {type:"done", expanded, pathLen:0, found:false, algo:"astar"};
}

function* reconstruct(parent, expanded, algo){
  // backtrack
  let r=goal.r, c=goal.c;
  let len=0;
  if (!parent[r][c] && !(r===start.r&&c===start.c)) { yield {type:"done", expanded, pathLen:0, found:false, algo}; return; }
  while(!(r===start.r && c===start.c)){
    const p=parent[r][c];
    if (!p) break;
    const [pr,pc]=p;
    if (!(pr===start.r&&pc===start.c) && !(pr===goal.r&&pc===goal.c)) grid[pr][pc]=PATH;
    r=pr; c=pc; len++;
    yield {type:"path", r, c, expanded, len};
  }
  yield {type:"done", expanded, pathLen:len, found:true, algo};
}

// Runner
async function startRun(){
  if (running) return;
  running=true;
  clearPathStates(); draw();
  const algo=algoSelect.value;
  updateMetrics({algo, expanded:0, pathLen:0, ms:0, status:"running"});
  const t0=performance.now();

  let gen;
  if (algo==="bfs") gen=genBFS();
  else if (algo==="dfs") gen=genDFS();
  else if (algo==="dijkstra") gen=genDijkstra();
  else gen=genAStar();

  const frameDelay = ()=> new Promise(res=> setTimeout(res, 1000/targetFPS));
  for(;;){
    const {value, done}=gen.next();
    if (done){ break; }
    if (value){
      if (value.type==="visit" || value.type==="frontier" || value.type==="path") {
        updateMetrics({algo, expanded:value.expanded, pathLen:value.len||0, ms:performance.now()-t0, status:"running"});
        draw();
      } else if (value.type==="done") {
        updateMetrics({algo, expanded:value.expanded, pathLen:value.pathLen, ms:performance.now()-t0, status: value.found?"found ✅":"no path ❌"});
        draw();
      }
    }
    await frameDelay();
  }
  running=false;
}

// Init
resetAll();
grid[start.r][start.c]=START;
grid[goal.r][goal.c]=GOAL;
draw();
updateMetrics({algo: algoSelect.value});

// Initial labels
algoSelect.onchange = ()=> { mAlgo.textContent=labelForAlgo(algoSelect.value); };
