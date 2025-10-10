<template>
  <div class="content-card">
    <el-row :gutter="20">
      <!-- Visualization -->
      <el-col :span="16">
        <h3>时空可视化 (3D)</h3>
        <div class="visualization-container" ref="canvasContainer">
          <!-- Three.js Canvas will be mounted here -->
        </div>
      </el-col>

      <!-- Controls and Data -->
      <el-col :span="8">
        <h3>控制与数据</h3>
        <div class="control-item">
          <span>黑洞质量 (M)</span>
          <el-slider v-model="blackHoleMass" :min="10" :max="100" :step="1" @input="updateBlackHoleProperties"></el-slider>
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
            <li><b>拖动鼠标</b>可以旋转、缩放和平移视角。</li>
            <li>黑色球体是<b>事件视界</b>，进入此区域的任何物体都无法逃脱。</li>
            <li>环绕的彩色圆盘是<b>吸积盘</b>，是物质在掉入黑洞前形成的结构。</li>
            <li>下方的网格代表<b>时空</b>，质量越大的黑洞对时空的扭曲越剧烈。</li>
          </ul>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Vue Refs and State ---
const canvasContainer = ref(null);
const blackHoleMass = ref(40);
let particles = [];
let particleId = 0;

// --- Three.js objects ---
let scene, camera, renderer, controls;
let blackHoleMesh, eventHorizonMesh, photonSphereMesh, gridMesh, accretionDiskMesh;
let animationFrameId = null;

// --- Constants ---
const G = 0.4; // Gravitational constant for simulation

// --- Computed Properties ---
const eventHorizonRadius = computed(() => (2 * G * blackHoleMass.value) / 9); // Simplified c=3
const photonSphereRadius = computed(() => 1.5 * eventHorizonRadius.value);

// --- Shaders for Accretion Disk ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float time;
  
  // Simplex noise function for turbulence
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    float r = length(vUv - 0.5) * 2.0; // 0 to 1 from center to edge
    if (r > 1.0) discard;

    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float noise = snoise(vUv * 5.0 + time * 0.1);

    float temp = 1.0 / (r + 0.1) - 0.1; // Hotter near center
    
    vec3 color = vec3(temp * 1.5, temp * 0.8, temp * 0.5); // Orange/Red hot
    color += vec3(0.8, 0.5, 0.2) * noise * 0.3; // Add some turbulence
    
    float edge_alpha = 1.0 - smoothstep(0.9, 1.0, r);
    
    gl_FragColor = vec4(color, edge_alpha);
  }
`;

// --- Methods ---
function init() {
  // Scene
  scene = new THREE.Scene();

  // Camera
  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 40, 80);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  canvasContainer.value.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Starfield
  const starVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Black Hole (Event Horizon)
  const bhGeometry = new THREE.SphereGeometry(eventHorizonRadius.value, 32, 32);
  const bhMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  blackHoleMesh = new THREE.Mesh(bhGeometry, bhMaterial);
  scene.add(blackHoleMesh);

  // Accretion Disk
  const diskGeometry = new THREE.RingGeometry(eventHorizonRadius.value * 1.2, photonSphereRadius.value * 2.5, 64);
  const diskMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { time: { value: 0.0 } },
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  accretionDiskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
  accretionDiskMesh.rotation.x = -Math.PI / 2;
  scene.add(accretionDiskMesh);

  // Spacetime Grid
  const gridGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
  const gridMaterial = new THREE.MeshBasicMaterial({ color: 0x0080ff, wireframe: true, transparent: true, opacity: 0.3 });
  gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
  gridMesh.rotation.x = -Math.PI / 2;
  gridMesh.position.y = -20;
  scene.add(gridMesh);
  
  updateGridWarp();
  updateBlackHoleProperties();
}

function updateGridWarp() {
    const ehRadius = eventHorizonRadius.value;
    const positions = gridMesh.geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++){
        vertex.fromBufferAttribute(positions, i);
        const dist = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
        
        if (dist > ehRadius) {
            const warp = -40 * blackHoleMass.value / (dist + ehRadius);
            positions.setY(i, warp);
        } else {
            positions.setY(i, -80); // Create a sharp drop inside event horizon
        }
    }
    positions.needsUpdate = true;
}

function updateBlackHoleProperties() {
  const ehRadius = eventHorizonRadius.value;
  const psRadius = photonSphereRadius.value;

  // Update Black Hole Size
  blackHoleMesh.geometry.dispose();
  blackHoleMesh.geometry = new THREE.SphereGeometry(ehRadius, 32, 32);

  // Update Accretion Disk Size
  accretionDiskMesh.geometry.dispose();
  accretionDiskMesh.geometry = new THREE.RingGeometry(ehRadius * 1.2, psRadius * 2.5, 64);

  // Update Grid
  updateGridWarp();
}

function launchParticle(isPhoton) {
  const speed = isPhoton ? 4.5 : 2.5 + Math.random();
  const angle = Math.random() * Math.PI - Math.PI / 2;
  
  const geometry = new THREE.SphereGeometry(isPhoton ? 0.4 : 0.6, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: isPhoton ? 0xffff00 : 0xffffff });
  const particleMesh = new THREE.Mesh(geometry, material);

  const particle = {
    id: particleId++,
    mesh: particleMesh,
    velocity: new THREE.Vector3(
      speed * Math.cos(angle),
      0,
      speed * Math.sin(angle)
    ),
    isPhoton,
  };

  particle.mesh.position.set(-90, 0, (Math.random() - 0.5) * 50);
  particles.push(particle);
  scene.add(particle.mesh);
}

function updateSimulation() {
  const dt = 0.1; // Time step
  const ehRadius = eventHorizonRadius.value;

  particles.forEach((p, index) => {
    const pos = p.mesh.position;
    const distSq = pos.x * pos.x + pos.z * pos.z;
    const dist = Math.sqrt(distSq);

    // Check for capture or out of bounds
    if (dist < ehRadius || dist > 250) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      particles.splice(index, 1);
      return;
    }

    const force = -G * blackHoleMass.value / distSq;
    const acceleration = new THREE.Vector3(pos.x, 0, pos.z).normalize().multiplyScalar(force);
    
    p.velocity.add(acceleration.multiplyScalar(dt));
    pos.add(p.velocity.clone().multiplyScalar(dt));
  });

  // Update accretion disk shader time
  accretionDiskMesh.material.uniforms.time.value += 0.01;
  accretionDiskMesh.rotation.z += 0.001;
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  controls.update();
  updateSimulation();
  renderer.render(scene, camera);
}

function onResize() {
    const width = canvasContainer.value.clientWidth;
    const height = canvasContainer.value.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// --- Lifecycle Hooks ---
onMounted(() => {
  init();
  animate();
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener('resize', onResize);
  // TODO: Proper Three.js resource cleanup
});
</script>

<style scoped>
.visualization-container {
  width: 100%;
  height: 600px; /* Or adjust as needed */
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;
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