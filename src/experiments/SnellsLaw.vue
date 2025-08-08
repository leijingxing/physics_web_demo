<template>
  <div class="content-card">
    <el-row :gutter="30">
      <!-- Controls and Data -->
      <el-col :span="8">
        <h3>实验参数</h3>
        <div class="control-item">
          <span>入射角 (θ₁)</span>
          <el-slider v-model="angle1" :min="0" :max="89.9" :step="0.1" show-input></el-slider>
        </div>
        <div class="control-item">
          <span>介质 1 折射率 (n₁)</span>
          <el-input-number v-model="n1" :min="1" :max="3" :step="0.01"></el-input-number>
        </div>
        <div class="control-item">
          <span>介质 2 折射率 (n₂)</span>
          <el-input-number v-model="n2" :min="1" :max="3" :step="0.01"></el-input-number>
        </div>

        <el-divider />

        <h3>计算结果</h3>
        <div class="data-display">
          <p v-if="!isTotalInternalReflection">折射角 (θ₂): <strong>{{ angle2.toFixed(2) }}</strong> °</p>
          <p v-else class="tir-warning">
            发生全反射！
          </p>
          <p v-if="n1 > n2">临界角: <strong>{{ criticalAngle.toFixed(2) }}</strong> °</p>
        </div>
      </el-col>

      <!-- Visualization -->
      <el-col :span="16">
        <h3>光路图</h3>
        <div class="visualization-container">
          <svg viewBox="-250 -250 500 500">
            <!-- Medium 2 Background -->
            <rect x="-250" y="0" width="500" height="250" :fill="medium2Color" />
            
            <!-- Interface -->
            <line x1="-250" y1="0" x2="250" y2="0" stroke="white" stroke-width="2" />
            
            <!-- Normal -->
            <line x1="0" y1="-250" x2="0" y2="250" stroke="white" stroke-dasharray="5,5" stroke-width="1" />

            <!-- Incident Ray -->
            <g :transform="`rotate(${angle1})`">
              <line x1="0" y1="0" x2="0" y2="-200" stroke="yellow" stroke-width="3" />
              <text x="10" y="-100" fill="yellow" font-size="16">θ₁</text>
            </g>

            <!-- Refracted Ray -->
            <g v-if="!isTotalInternalReflection" :transform="`rotate(${angle2})`">
              <line x1="0" y1="0" x2="0" y2="200" stroke="orange" stroke-width="3" />
              <text x="10" y="100" fill="orange" font-size="16">θ₂</text>
            </g>

            <!-- Reflected Ray (for TIR) -->
            <g v-if="isTotalInternalReflection" :transform="`rotate(${-angle1})`">
              <line x1="0" y1="0" x2="0" y2="-200" stroke="red" stroke-width="3" />
              <text x="10" y="-100" fill="red" font-size="16">反射</text>
            </g>
          </svg>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Parameters
const angle1 = ref(30); // Angle of incidence in degrees
const n1 = ref(1.00);   // Refractive index of medium 1 (e.g., Air)
const n2 = ref(1.33);   // Refractive index of medium 2 (e.g., Water)

// Conversion
const toRadians = (deg) => deg * (Math.PI / 180);
const toDegrees = (rad) => rad * (180 / Math.PI);

// Calculations
const angle2 = computed(() => {
  const sinAngle2 = (n1.value / n2.value) * Math.sin(toRadians(angle1.value));
  if (Math.abs(sinAngle2) > 1) {
    return 0; // Should not happen if TIR is handled
  }
  return toDegrees(Math.asin(sinAngle2));
});

const criticalAngle = computed(() => {
  if (n1.value <= n2.value) return 0; // No critical angle
  return toDegrees(Math.asin(n2.value / n1.value));
});

const isTotalInternalReflection = computed(() => {
  if (n1.value > n2.value) {
    return angle1.value > criticalAngle.value;
  }
  return false;
});

const medium2Color = computed(() => {
  if (n2.value > 1.5) return 'rgba(180, 180, 200, 0.5)'; // Glass-like
  if (n2.value > 1.3) return 'rgba(100, 150, 255, 0.4)'; // Water-like
  return 'rgba(0, 0, 0, 0.2)';
});
</script>

<style scoped>
.control-item { margin-bottom: 20px; }
.control-item span { font-size: 14px; display: block; margin-bottom: 8px; }
.data-display p { font-size: 16px; margin: 8px 0; }
.data-display strong { color: var(--primary-color); }
.tir-warning {
  color: #f56c6c;
  font-weight: bold;
}
.visualization-container {
  width: 100%;
  background-color: rgba(0, 0, 50, 0.3);
  border-radius: 8px;
  padding: 10px;
}
svg {
  width: 100%;
  height: auto;
}
</style>
