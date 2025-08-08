<template>
  <div class="content-card">
    <el-row :gutter="20">
      <!-- Visualization -->
      <el-col :span="16">
        <h3>时空模拟器</h3>
        <div class="visualization-container">
          <div class="spaceship-container" :style="{ animationDuration: animationDuration + 's' }">
            <div class="spaceship" :style="{ width: contractedLength + 'px' }">
              <div class="clock">
                <div class="hand" :style="{ animation: `spin ${10 / lorentzFactor}s linear infinite` }"></div>
              </div>
              <span>{{ (velocity * 100).toFixed(1) }}% c</span>
            </div>
          </div>
          <div class="earth-clock">
            <p>地球时钟</p>
            <div class="clock">
              <div class="hand" style="animation: spin 10s linear infinite;"></div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- Controls and Data -->
      <el-col :span="8">
        <h3>控制参数</h3>
        <div class="control-item">
          <span>飞船速度 (v/c)</span>
          <el-slider v-model="velocity" :min="0" :max="0.999" :step="0.001" :format-tooltip="formatTooltip"></el-slider>
        </div>
        
        <el-divider />

        <h3>计算结果</h3>
        <div class="data-display">
          <p>洛伦兹因子 (γ): <strong>{{ lorentzFactor.toFixed(3) }}</strong></p>
          <p>飞船视长: <strong>{{ (100 / lorentzFactor).toFixed(1) }}%</strong> (原长: 100%)</p>
          <p>飞船时间流逝率: <strong>{{ (100 / lorentzFactor).toFixed(1) }}%</strong> (地球: 100%)</p>
        </div>
        <div class="explanation">
          当速度接近光速 (c) 时，静止观察者会看到飞船在运动方向上变短，且飞船内部的时间流逝变慢。
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Velocity as a fraction of c
const velocity = ref(0.5); 
const restLength = 200; // px

const formatTooltip = (val) => `${(val * 100).toFixed(1)}% c`;

const lorentzFactor = computed(() => {
  // To prevent division by zero or NaN if v >= 1
  if (velocity.value >= 1) return Infinity;
  return 1 / Math.sqrt(1 - velocity.value * velocity.value);
});

const contractedLength = computed(() => {
  if (lorentzFactor.value === Infinity) return 0;
  return restLength / lorentzFactor.value;
});

const animationDuration = computed(() => {
  // Faster animation for higher speeds to simulate the journey
  return 10 - velocity.value * 8;
});

</script>

<style scoped>
.visualization-container {
  position: relative;
  height: 300px;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path fill="%230a0a2a" d="M0 0h40v40H0z"/><g fill-opacity=".2"><path d="M39.5 20a.5.5 0 00-.5-.5h-38a.5.5 0 000 1h38a.5.5 0 00.5-.5zM20 39.5a.5.5 0 00.5-.5v-38a.5.5 0 00-1 0v38a.5.5 0 00.5.5z"/><path d="M33 20a.5.5 0 00-.5-.5h-25a.5.5 0 000 1h25a.5.5 0 00.5-.5zM20 33a.5.5 0 00.5-.5v-25a.5.5 0 00-1 0v25a.5.5 0 00.5.5z"/></g></svg>');
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

.spaceship-container {
  position: absolute;
  top: 40%;
  left: -250px; /* Start off-screen */
  animation: travel linear infinite;
}

.spaceship {
  height: 60px;
  background: linear-gradient(135deg, #c0c0c0, #808080);
  border: 2px solid #f0f0f0;
  border-radius: 30px 10px 10px 30px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  color: white;
  font-weight: bold;
  transition: width 0.2s ease-out;
}
.spaceship span {
  text-shadow: 1px 1px 2px black;
}

.earth-clock {
  position: absolute;
  bottom: 10px;
  right: 10px;
  color: white;
  text-align: center;
}
.earth-clock p {
  margin: 0 0 5px 0;
  font-size: 12px;
}

.clock {
  width: 40px;
  height: 40px;
  border: 2px solid white;
  border-radius: 50%;
  position: relative;
}
.hand {
  width: 2px;
  height: 18px;
  background: red;
  position: absolute;
  top: 2px;
  left: 19px;
  transform-origin: bottom;
}

.control-item { margin-bottom: 20px; }
.data-display p { font-size: 16px; margin: 8px 0; }
.data-display strong { color: var(--primary-color); }
.explanation {
  margin-top: 20px;
  font-size: 14px;
  color: #666;
  background-color: #f4f7f9;
  padding: 10px;
  border-radius: 4px;
}

@keyframes travel {
  from { transform: translateX(0); }
  to { transform: translateX(1200px); } /* Move across the screen */
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
