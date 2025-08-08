<template>
  <div class="content-card">
    <el-row :gutter="20">
      <!-- Controls -->
      <el-col :span="24" class="controls-container">
        <div class="control-item">
          <span>波长 (λ): {{ wavelength }} nm</span>
          <el-slider v-model="wavelength" :min="400" :max="700" :step="10"></el-slider>
        </div>
        <div class="control-item">
          <span>缝距 (d): {{ slitDistance }} μm</span>
          <el-slider v-model="slitDistance" :min="10" :max="100" :step="5"></el-slider>
        </div>
        <div class="control-item">
          <span>缝宽 (a): {{ slitWidth }} μm</span>
          <el-slider v-model="slitWidth" :min="1" :max="20" :step="1"></el-slider>
        </div>
        <div class="control-item">
          <span>屏幕距离 (L): {{ screenDistance }} m</span>
          <el-slider v-model="screenDistance" :min="1" :max="5" :step="0.1"></el-slider>
        </div>
        <div class="control-item info">
          <p>双缝干涉实验演示光的波动性质。调整参数观察干涉条纹的变化。</p>
          <p>主极大位置: y = nλL/d (n = 0, ±1, ±2, ...)</p>
          <p>当前波长颜色: <span :style="{ color: wavelengthColor }">{{ wavelengthColor }}</span></p>
        </div>
      </el-col>

      <!-- Canvas for Interference Pattern -->
      <el-col :span="24">
        <div class="canvas-container">
          <canvas ref="interferenceCanvas" width="800" height="400"></canvas>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

// --- Reactive State ---
const wavelength = ref(550); // nm
const slitDistance = ref(50); // μm
const slitWidth = ref(5); // μm
const screenDistance = ref(2); // m
const interferenceCanvas = ref(null);

// --- Computed Properties ---
const wavelengthColor = computed(() => {
  const wl = wavelength.value;
  if (wl < 450) return '#8B00FF'; // 紫色
  if (wl < 485) return '#0000FF'; // 蓝色
  if (wl < 500) return '#00FFFF'; // 青色
  if (wl < 565) return '#00FF00'; // 绿色
  if (wl < 590) return '#FFFF00'; // 黄色
  if (wl < 625) return '#FF8000'; // 橙色
  return '#FF0000'; // 红色
});

// --- Methods ---
const drawInterferencePattern = () => {
  const canvas = interferenceCanvas.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Convert units
  const lambda = wavelength.value * 1e-9; // m
  const d = slitDistance.value * 1e-6; // m
  const a = slitWidth.value * 1e-6; // m
  const L = screenDistance.value; // m
  
  // Draw coordinate system
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  
  // Draw slits
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, height / 2 - 20);
  ctx.lineTo(50, height / 2 + 20);
  ctx.moveTo(50, height / 2 - 10);
  ctx.lineTo(50, height / 2 + 10);
  ctx.stroke();
  
  // Calculate and draw interference pattern
  const maxY = height / 2 - 50;
  const step = 0.5; // pixels
  
  for (let y = -maxY; y <= maxY; y += step) {
    const y_m = y * 1e-3; // Convert to meters
    
    // Interference term (double slit)
    const beta = Math.PI * d * y_m / (lambda * L);
    const interference = Math.cos(beta) ** 2;
    
    // Diffraction term (single slit)
    const alpha = Math.PI * a * y_m / (lambda * L);
    const diffraction = alpha === 0 ? 1 : (Math.sin(alpha) / alpha) ** 2;
    
    // Combined intensity
    const intensity = interference * diffraction;
    
    // Draw intensity as line thickness and opacity
    const opacity = Math.max(0, Math.min(1, intensity));
    const thickness = Math.max(0.5, intensity * 3);
    
    ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(100, height / 2 + y);
    ctx.lineTo(150, height / 2 + y);
    ctx.stroke();
  }
  
  // Draw intensity profile
  ctx.strokeStyle = wavelengthColor.value;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let x = 200; x < width - 50; x++) {
    const y = (x - 200) * 2 - (width - 250);
    const y_m = y * 1e-3;
    
    const beta = Math.PI * d * y_m / (lambda * L);
    const interference = Math.cos(beta) ** 2;
    
    const alpha = Math.PI * a * y_m / (lambda * L);
    const diffraction = alpha === 0 ? 1 : (Math.sin(alpha) / alpha) ** 2;
    
    const intensity = interference * diffraction;
    const plotY = height / 2 - intensity * 100;
    
    if (x === 200) {
      ctx.moveTo(x, plotY);
    } else {
      ctx.lineTo(x, plotY);
    }
  }
  ctx.stroke();
  
  // Draw labels
  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.fillText('双缝', 30, height / 2 + 30);
  ctx.fillText('干涉条纹', 100, 30);
  ctx.fillText('强度分布', 200, 30);
  
  // Draw scale
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, height - 30);
  ctx.lineTo(width - 50, height - 30);
  ctx.stroke();
  
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.fillText('0', 200, height - 10);
  ctx.fillText('±1', 300, height - 10);
  ctx.fillText('±2', 400, height - 10);
  ctx.fillText('±3', 500, height - 10);
  ctx.fillText('±4', 600, height - 10);
  ctx.fillText('±5', 700, height - 10);
};

// --- Lifecycle ---
onMounted(() => {
  drawInterferencePattern();
});

// Watch for changes
watch([wavelength, slitDistance, slitWidth, screenDistance], () => {
  drawInterferencePattern();
});
</script>

<style scoped>
.controls-container {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.control-item {
  margin-bottom: 15px;
}

.control-item span {
  display: inline-block;
  width: 120px;
  font-weight: 500;
}

.control-item.info {
  margin-top: 20px;
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.control-item.info p {
  margin: 5px 0;
  color: #333;
  font-size: 14px;
}

.canvas-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

canvas {
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
}
</style>
