<template>
  <div class="content-card">
    <el-row :gutter="20">
      <!-- Controls -->
      <el-col :span="24" class="controls-container">
        <div class="control-item">
          <span>透镜类型:</span>
          <el-radio-group v-model="lensType">
            <el-radio-button label="convex">凸透镜</el-radio-button>
            <el-radio-button label="concave">凹透镜</el-radio-button>
          </el-radio-group>
        </div>
        <div class="control-item">
          <span>焦距 (f): {{ focalLength }} px</span>
          <el-slider v-model="focalLength" :min="50" :max="200" :step="5"></el-slider>
        </div>
        <div class="control-item info">
          <p>拖动<b>蓝色</b>箭头（物体）来观察成像变化。</p>
          <p v-if="imageInfo.type !== 'none'">
            像: {{ imageInfo.type }},
            {{ imageInfo.orientation }},
            {{ imageInfo.magnification }}
          </p>
          <p v-else>
            {{ imageInfo.magnification }}
          </p>
        </div>
      </el-col>

      <!-- Konva Stage -->
      <el-col :span="24">
        <v-stage :config="stageConfig">
          <v-layer>
            <!-- Principal Axis -->
            <v-line :config="axisConfig" />

            <!-- Lens -->
            <v-line :config="lensConfig" />
            <v-arrow :config="lensArrowConfigTop" />
            <v-arrow :config="lensArrowConfigBottom" />

            <!-- Focal Points -->
            <v-circle :config="focalPointConfigF1" />
            <v-text :config="focalPointTextConfigF1" />
            <v-circle :config="focalPointConfigF2" />
            <v-text :config="focalPointTextConfigF2" />

            <!-- Object (Draggable) -->
            <v-arrow :config="objectConfig" @dragmove="handleDragMove" />

            <!-- Ray Tracing Lines -->
            <v-line :config="ray1Config" />
            <v-line :config="ray2Config" />
            <v-line :config="ray3Config" />

            <!-- Image -->
            <v-arrow v-if="imageInfo.type !== 'none'" :config="imageConfig" />
          </v-layer>
        </v-stage>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// --- Configs ---
const W = 800;
const H = 400;
const centerX = W / 2;
const centerY = H / 2;

const stageConfig = ref({ width: W, height: H });
const axisConfig = ref({ points: [0, centerY, W, centerY], stroke: '#ccc', strokeWidth: 1 });

// --- Reactive State ---
const lensType = ref('convex');
const focalLength = ref(100);
const objectX = ref(-200);
const objectHeight = ref(50);

const handleDragMove = (e) => {
  const newX = e.target.x();
  // Prevent dragging object past the lens center
  if (newX < centerX) {
    objectX.value = newX - centerX;
  } else {
    e.target.x(centerX - 1);
  }
};

// --- Computed Properties for Drawing ---
const f = computed(() => (lensType.value === 'convex' ? focalLength.value : -focalLength.value));
const objectConfig = computed(() => ({
  x: centerX + objectX.value,
  y: centerY,
  points: [0, 0, 0, -objectHeight.value],
  pointerLength: 8,
  pointerWidth: 8,
  fill: 'blue',
  stroke: 'blue',
  strokeWidth: 4,
  draggable: true,
}));

// Lens Equation Calculation
const imageInfo = computed(() => {
  const do_ = -objectX.value; // object distance is positive
  if (Math.abs(do_ - f.value) < 1) {
    return { type: 'none', magnification: '物体位于焦点，不成像（或像在无穷远）' };
  }
  const di = 1 / (1 / f.value - 1 / do_); // image distance
  const M = -di / do_; // magnification
  const type = (lensType.value === 'convex' && di > 0) || (lensType.value === 'concave' && di < 0) ? '实像' : '虚像';
  
  return {
    x: di,
    y: M * objectHeight.value,
    type,
    orientation: M > 0 ? '正立' : '倒立',
    magnification: `放大率: ${Math.abs(M).toFixed(2)}x`,
  };
});

const imageConfig = computed(() => ({
  x: centerX + imageInfo.value.x,
  y: centerY,
  points: [0, 0, 0, -imageInfo.value.y],
  pointerLength: 8,
  pointerWidth: 8,
  fill: 'red',
  stroke: 'red',
  strokeWidth: 4,
  opacity: imageInfo.value.type === '实像' ? 1 : 0.5,
}));

// Ray Tracing Lines
const ray1Config = computed(() => {
  const isVirtual = imageInfo.value.type === '虚像';
  const di = imageInfo.value.x;
  const do_ = -objectX.value;
  const M = -di/do_;
  
  const points = [
    centerX + objectX.value, centerY - objectHeight.value, // start from object top
    centerX, centerY - objectHeight.value, // to lens center
    centerX + di, centerY - M * objectHeight.value, // to image top
  ];
  
  // Extend virtual ray backwards
  if (isVirtual) {
    points.push(centerX, centerY - objectHeight.value);
  }

  return {
    points,
    stroke: 'orange',
    strokeWidth: 2,
    dash: isVirtual ? [6, 2] : [],
  };
});

const ray2Config = computed(() => ({
  points: [
    centerX + objectX.value, centerY - objectHeight.value,
    centerX + imageInfo.value.x, centerY - imageInfo.value.y,
  ],
  stroke: 'green',
  strokeWidth: 2,
  dash: imageInfo.value.type === '虚像' ? [6, 2] : [],
}));

const ray3Config = computed(() => {
    // This ray is more complex to draw accurately, especially for virtual images.
    // For simplicity, we'll just show the two main rays which are sufficient.
    return { points: [], strokeWidth: 0 };
});


// --- Static Drawing Elements ---
const lensConfig = computed(() => ({
  points: [centerX, centerY - 80, centerX, centerY + 80],
  stroke: '#666',
  strokeWidth: 3,
}));
const lensArrowConfigTop = computed(() => ({
  points: lensType.value === 'convex'
    ? [centerX, centerY - 80, centerX, centerY - 82] // Convex: Outward pointing up
    : [centerX, centerY - 80, centerX, centerY - 78], // Concave: Inward pointing down
  stroke: '#666',
  fill: '#666',
  pointerLength: 8,
  pointerWidth: 12,
}));
const lensArrowConfigBottom = computed(() => ({
  points: lensType.value === 'convex'
    ? [centerX, centerY + 80, centerX, centerY + 82] // Convex: Outward pointing down
    : [centerX, centerY + 80, centerX, centerY + 78], // Concave: Inward pointing up
  stroke: '#666',
  fill: '#666',
  pointerLength: 8,
  pointerWidth: 12,
}));
const focalPointConfigF1 = computed(() => ({ x: centerX - f.value, y: centerY, radius: 4, fill: 'purple' }));
const focalPointTextConfigF1 = computed(() => ({ x: centerX - f.value - 10, y: centerY + 10, text: lensType.value === 'convex' ? 'F' : "F'", fill: 'purple' }));
const focalPointConfigF2 = computed(() => ({ x: centerX + f.value, y: centerY, radius: 4, fill: 'purple' }));
const focalPointTextConfigF2 = computed(() => ({ x: centerX + f.value - 10, y: centerY + 10, text: lensType.value === 'convex' ? "F'" : 'F', fill: 'purple' }));

</script>

<style scoped>
.controls-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}
.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.control-item.info {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-size: 14px;
}
.control-item.info p {
  margin: 0;
}
.el-slider {
  width: 200px;
}
</style>
