# Pathfinding Visualiser (Round 1)

A browser-based pathfinding visualiser built with HTML5 Canvas and vanilla JavaScript.  
**Round 1** implements **Breadth-First Search (BFS)** with animated exploration and shortest-path reconstruction.

**Features:**
- Interactive 30×50 grid
- Set **Start (S)** / **Goal (G)** positions and draw walls by dragging
- Run BFS search (R) with animated frontier/visited cells
- Shortest-path reconstruction after reaching goal
- Reset board (keep walls) or clear all walls
- Adjustable animation speed (1–120 FPS)

**Planned for Round 2:**
- Dijkstra’s algorithm
- A* search
- Weighted cells
- Diagonal movement option
- Search metrics (steps, time, path length)

---

## Run Locally + Controls
```bash
# 1) Clone the repo
git clone https://github.com/<USER>/pathfinding-visualiser-js.git
cd pathfinding-visualiser-js

# 2) Open index.html in your browser

# Controls:
# Mouse:
#   - Click/drag to draw or erase walls
#
# Keyboard:
#   - S → Set start position
#   - G → Set goal position
#   - W → Draw walls
#   - R → Run BFS search
