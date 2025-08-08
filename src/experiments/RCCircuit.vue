<template>
  <div class="content-card">
    <el-row :gutter="30">
      <!-- Controls and Data -->
      <el-col :span="8">
        <h3>电路参数</h3>
        <div class="control-item">
          <span>电源电压 (V)</span>
          <el-input-number v-model="voltage" :min="1" :max="100"></el-input-number>
        </div>
        <div class="control-item">
          <span>电阻 (R, kΩ)</span>
          <el-input-number v-model="resistance" :min="1" :max="100"></el-input-number>
        </div>
        <div class="control-item">
          <span>电容 (C, μF)</span>
          <el-input-number v-model="capacitance" :min="1" :max="1000"></el-input-number>
        </div>
        
        <el-divider />

        <h3>操作</h3>
        <div class="actions">
          <el-radio-group v-model="switchState" @change="handleSwitchChange">
            <el-radio-button label="charge">充电</el-radio-button>
            <el-radio-button label="discharge">放电</el-radio-button>
          </el-radio-group>
          <el-button @click="reset" style="margin-left: 10px;">重置</el-button>
        </div>

        <el-divider />

        <h3>实时数据</h3>
        <div class="data-display">
          <p>时间常数 (τ): <strong>{{ timeConstant.toFixed(2) }}</strong> ms</p>
          <p>电容电压: <strong>{{ capacitorVoltage.toFixed(2) }}</strong> V</p>
          <p>已用时间: <strong>{{ elapsedTime.toFixed(2) }}</strong> s</p>
        </div>
      </el-col>

      <!-- Graph -->
      <el-col :span="16">
        <h3>电压-时间曲线</h3>
        <div class="graph-container">
          <svg :viewBox="`0 0 ${graphWidth} ${graphHeight}`" preserveAspectRatio="xMidYMid meet">
            <!-- Axes -->
            <line :x1="padding" :y1="graphHeight - padding" :x2="graphWidth - padding" :y2="graphHeight - padding" stroke="#666"/>
            <line :x1="padding" :y1="padding" :x2="padding" :y2="graphHeight - padding" stroke="#666"/>
            
            <!-- Y-Axis Labels -->
            <text x="5" :y="padding + 10" font-size="10">{{ voltage }}V</text>
            <text x="5" :y="graphHeight - padding" font-size="10">0V</text>

            <!-- X-Axis Labels -->
            <text :x="graphWidth - padding - 10" :y="graphHeight - padding + 15" font-size="10">{{ (timeConstant * 5 / 1000).toFixed(1) }}s</text>

            <!-- Voltage Curve -->
            <polyline :points="graphPoints" fill="none" stroke="var(--primary-color)" stroke-width="2"/>
          </svg>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

// Parameters
const voltage = ref(12);
const resistance = ref(10); // kΩ
const capacitance = ref(100); // μF

// State
const switchState = ref(''); // 'charge', 'discharge'
const capacitorVoltage = ref(0);
const elapsedTime = ref(0);
const graphPoints = ref('');
let simulationTimer = null;

// Graph dimensions
const graphWidth = 500;
const graphHeight = 300;
const padding = 20;

// Calculated values
const timeConstant = computed(() => resistance.value * capacitance.value); // R(kΩ) * C(μF) = τ(ms)

const startSimulation = () => {
  stopSimulation();
  const startTime = Date.now();
  const initialVoltage = capacitorVoltage.value;
  const tau_ms = timeConstant.value;

  simulationTimer = setInterval(() => {
    const t_ms = Date.now() - startTime;
    elapsedTime.value = t_ms / 1000;

    if (switchState.value === 'charge') {
      capacitorVoltage.value = voltage.value * (1 - Math.exp(-t_ms / tau_ms));
    } else if (switchState.value === 'discharge') {
      capacitorVoltage.value = initialVoltage * Math.exp(-t_ms / tau_ms);
    }
    
    updateGraph();

    // Stop after 5 time constants
    if (t_ms >= tau_ms * 5) {
      stopSimulation();
      // Snap to final value
      capacitorVoltage.value = (switchState.value === 'charge') ? voltage.value : 0;
      updateGraph();
    }
  }, 16); // ~60 FPS
};

const stopSimulation = () => {
  if (simulationTimer) {
    clearInterval(simulationTimer);
    simulationTimer = null;
  }
};

const updateGraph = () => {
  const maxTime = timeConstant.value * 5; // Display 5τ on x-axis
  const x = padding + (elapsedTime.value * 1000 / maxTime) * (graphWidth - 2 * padding);
  const y = (graphHeight - padding) - (capacitorVoltage.value / voltage.value) * (graphHeight - 2 * padding);
  
  if (isFinite(x) && isFinite(y)) {
    graphPoints.value += ` ${x},${y}`;
  }
};

const reset = () => {
  stopSimulation();
  switchState.value = '';
  capacitorVoltage.value = 0;
  elapsedTime.value = 0;
  graphPoints.value = `${padding},${graphHeight - padding}`;
};

const handleSwitchChange = (state) => {
  reset();
  switchState.value = state;
  if (state === 'discharge') {
    capacitorVoltage.value = voltage.value; // Assume fully charged before discharge
  }
  graphPoints.value = `${padding},${(graphHeight - padding) - (capacitorVoltage.value / voltage.value) * (graphHeight - 2 * padding)}`;
  startSimulation();
};

onUnmounted(stopSimulation);

// Initial state
reset();
</script>

<style scoped>
.control-item { margin-bottom: 20px; }
.control-item span { font-size: 14px; display: block; margin-bottom: 8px; }
.actions { display: flex; align-items: center; }
.data-display p { font-size: 16px; margin: 8px 0; }
.data-display strong { color: var(--primary-color); }
.graph-container {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 10px;
}
svg text {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
