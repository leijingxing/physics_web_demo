<template>
  <div class="content-card">
    <el-row :gutter="20">
      <!-- Visualization -->
      <el-col :span="16">
        <h3>时空可视化</h3>
        <div class="visualization-container">
          <svg viewBox="-250 -250 500 500">
            <!-- Spacetime Grid -->
            <path v-for="(path, index) in gridPaths" :key="index" :d="path" fill="none" stroke="rgba(0, 128, 255, 0.3)" stroke-width="1"/>

            <!-- Photon Sphere -->
            <circle :r="photonSphereRadius" cx="0" cy="0" fill="rgba(255, 255, 0, 0.2)" stroke="yellow" stroke-dasharray="3,3" stroke-width="1"/>
            
            <!-- Event Horizon -->
            <circle :r="eventHorizonRadius" cx="0" cy="0" fill="black" />

            <!-- Particles -->
            <circle v-for="p in particles" :key="p.id" :cx="p.x" :cy="p.y" :r="p.isPhoton ? 2 : 3" :fill="p.isPhoton ? 'yellow' : 'white'"/>
          </svg>
        </div>
      </el-col>

      <!-- Controls and Data -->
      <el-col :span="8">
        <h3>控制与数据</h3>
        <div class="control-item">
          <span>黑洞质量 (M)</span>
          <el-slider v-model="blackHoleMass" :min="10" :max="100" :step="1"></el-slider>
        </div>
        <div class="actions">
          <el-button @click="launchParticle(false)">发射探测器</el-button>
          <el-button @click="launchParticle(true)">发射光子</el-button>
        </div>

        <el-divider />

        <h3>理论数据</h3>
        <div class="data-display">
          <p>事件视界半径: <strong>{{ eventHorizonRadius.toFixed(2) }}</strong> units</p>
          <p>光子球层半径: <strong>{{ photonSphereRadius.toFixed(2) }}</strong> units</p>
        </div>
        <div class="explanation">
          <ul>
            <li>黑色区域是<b>事件视界</b>，进入此区域的任何物体都无法逃脱。</li>
            <li>黄色虚线是<b>光子球层</b>，光可以在此轨道上短暂环绕黑洞。</li>
          </ul>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// --- State ---
const blackHoleMass = ref(40);
const particles = ref([]);
let particleId = 0;
let animationFrameId = null;

// --- Constants ---
const G = 0.1; // Gravitational constant for simulation
const GRID_SIZE = 20;
const WARP_FACTOR = 2.5;

// --- Computed Properties ---
const eventHorizonRadius = computed(() => 2 * G * blackHoleMass.value / 9); // Simplified c=3
const photonSphereRadius = computed(() => 1.5 * eventHorizonRadius.value);

const gridPaths = computed(() => {
  const paths = [];
  const step = 500 / GRID_SIZE;
  for (let i = 0; i <= GRID_SIZE; i++) {
    // Vertical lines
    let pathV = 'M';
    for (let j = 0; j <= GRID_SIZE; j++) {
      const x = -250 + i * step;
      const z = -250 + j * step;
      const { y } = getWarpedCoordinates(x, z);
      pathV += ` ${x},${y}`;
    }
    paths.push(pathV);

    // Horizontal lines
    let pathH = 'M';
    for (let j = 0; j <= GRID_SIZE; j++) {
      const x = -250 + j * step;
      const z = -250 + i * step;
      const { y } = getWarpedCoordinates(x, z);
      pathH += ` ${y},${z}`; // Swap x and y for horizontal perspective
    }
    // A small hack to make it look better, not physically accurate perspective
    // paths.push(pathH); 
  }
  return paths;
});

// --- Methods ---
function getWarpedCoordinates(x, z) {
  const dist = Math.sqrt(x * x + z * z);
  if (dist < 0.1) return { y: z }; // Avoid division by zero at center
  const warp = -WARP_FACTOR * blackHoleMass.value / dist;
  return { y: z + (z / dist) * warp };
}

function launchParticle(isPhoton) {
  const angle = Math.random() * Math.PI / 2 + Math.PI / 4;
  const speed = isPhoton ? 3 : 1.5 + Math.random();
  particles.value.push({
    id: particleId++,
    x: -240,
    y: (Math.random() - 0.5) * 200,
    vx: speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
    isPhoton,
  });
}

function updateSimulation() {
  const dt = 0.5; // Time step
  const ehRadius = eventHorizonRadius.value;

  particles.value = particles.value.filter(p => {
    const distSq = p.x * p.x + p.y * p.y;
    const dist = Math.sqrt(distSq);

    // Check for capture or out of bounds
    if (dist < ehRadius || dist > 300) return false;

    const force = -G * blackHoleMass.value / distSq;
    const ax = force * (p.x / dist);
    const ay = force * (p.y / dist);

    p.vx += ax * dt;
    p.vy += ay * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    
    return true;
  });

  animationFrameId = requestAnimationFrame(updateSimulation);
}

// --- Lifecycle Hooks ---
onMounted(() => {
  updateSimulation();
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.visualization-container {
  background-color: #0a0a2a;
  border-radius: 8px;
  overflow: hidden;
}
.actions { margin-top: 20px; }
.data-display p { font-size: 16px; margin: 8px 0; }
.data-display strong { color: var(--primary-color); }
.explanation {
  margin-top: 15px;
  font-size: 14px;
  color: #666;
  background-color: #f4f7f9;
  padding: 10px;
  border-radius: 4px;
}
</style>
