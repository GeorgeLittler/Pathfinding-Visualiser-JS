# Pathfinding Visualiser

**Live demo:** https://georgelittler.github.io/Pathfinding-Visualiser-JS/

A browser-based pathfinding visualiser built with HTML5 Canvas and vanilla JavaScript.  
Implements **Breadth-First Search (BFS)**, **Depth-First Search (DFS)**, **Dijkstra’s Algorithm**, and **A\*** with animated exploration and shortest-path reconstruction.

## Features
- Interactive **30×50 grid** with click-and-drag editing
- Set **Start (S)** / **Goal (G)** positions
- Draw / erase walls with mouse or keyboard shortcuts
- **Random Walls** generator
- Optional **Weighted Cells** mode (for Dijkstra/A\*)
- Optional **Diagonal Movement**
- Adjustable animation speed (1–120 FPS)
- Search metrics: **Algorithm**, **Nodes Expanded**, **Path Length**, **Runtime**, **Status**
- Real-time frontier/visited/path animation

## Controls
### Mouse
- Click/drag in **Draw Walls** mode to toggle walls
- Click in **Set Start** or **Set Goal** mode to reposition start/goal

### Keyboard
- **S** → Set Start mode
- **G** → Set Goal mode
- **W** → Draw Walls mode
- **R** → Run selected algorithm
- **A** → Cycle algorithm
- **D** → Toggle diagonals
- **C** → Clear path (keep walls)

## Run Locally
```bash
# 1) Clone the repo
git clone https://github.com/<USER>/pathfinding-visualiser-js.git
cd pathfinding-visualiser-js

# 2) Open index.html in your browser 
#    (or use Live Server / local HTTP server)
```

## Technologies
- HTML5 Canvas
- Vanilla JavaScript
- SS3 with CSS variables
