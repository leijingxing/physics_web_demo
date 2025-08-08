<template>
  <div class="content-card">
    <div class="dc-circuit-experiment">
      <el-row :gutter="20" class="controls">
        <el-col :span="8">
          <div class="control-item">
            <span>电压 (V)</span>
            <el-slider v-model="voltage" :min="1" :max="24" show-input :disabled="isSwitchClosed"></el-slider>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="control-item">
            <span>电阻 (Ω)</span>
            <el-slider v-model="resistance" :min="1" :max="100" show-input :disabled="isSwitchClosed"></el-slider>
          </div>
        </el-col>
        <el-col :span="8" class="actions">
          <el-switch
            v-model="isSwitchClosed"
            size="large"
            active-text="闭合开关"
            inactive-text="断开开关"
          />
        </el-col>
      </el-row>

      <div class="circuit-diagram">
        <div class="wire top-wire">
          <div v-if="isSwitchClosed" class="electron-flow"></div>
        </div>
        <div class="wire left-wire">
           <div v-if="isSwitchClosed" class="electron-flow"></div>
        </div>
        <div class="wire right-wire">
           <div v-if="isSwitchClosed" class="electron-flow"></div>
        </div>
        <div class="wire bottom-wire">
           <div v-if="isSwitchClosed" class="electron-flow"></div>
        </div>
        
        <div class="component battery">
          <div class="symbol">
            <div class="line long"></div>
            <div class="line short"></div>
            <div class="line long"></div>
            <div class="line short"></div>
          </div>
          <div class="label">{{ voltage }} V</div>
        </div>
        <div class="component resistor">
          <div class="symbol"></div>
          <div class="label">{{ resistance }} Ω</div>
        </div>
        <div :class="['component', 'switch', { 'is-closed': isSwitchClosed }]" @click="isSwitchClosed = !isSwitchClosed">
          <div class="dot"></div>
          <div class="arm"></div>
          <div class="dot"></div>
        </div>
      </div>

      <div class="data-display">
        <h3>电路数据</h3>
        <p>电流: <strong>{{ current.toFixed(3) }}</strong> A</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const voltage = ref(12);
const resistance = ref(10);
const isSwitchClosed = ref(false);

const current = computed(() => {
  if (isSwitchClosed.value) {
    return voltage.value / resistance.value;
  }
  return 0;
});
</script>

<style scoped>
.dc-circuit-experiment {
  text-align: center;
}
.controls {
  margin-bottom: 40px;
}
.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.circuit-diagram {
  position: relative;
  width: 500px;
  height: 300px;
  margin: 40px auto;
  border: 2px solid transparent;
}
.wire {
  position: absolute;
  background-color: #333;
  z-index: 1;
}
.top-wire { top: 50px; left: 50px; width: 400px; height: 4px; }
.left-wire { top: 50px; left: 50px; width: 4px; height: 200px; }
.right-wire { top: 50px; right: 46px; width: 4px; height: 200px; }
.bottom-wire { bottom: 50px; left: 50px; width: 400px; height: 4px; }

.component {
  position: absolute;
  background-color: #fff;
  z-index: 2;
  padding: 5px;
}
.component .label {
  font-size: 14px;
  margin-top: 5px;
  color: #555;
}
.battery {
  left: 50%;
  bottom: 25px;
  transform: translateX(-50%);
}
.battery .symbol { display: flex; align-items: center; }
.battery .line { width: 4px; background: #333; margin: 0 2px; }
.battery .long { height: 30px; }
.battery .short { height: 15px; }

.resistor {
  left: 50%;
  top: 20px;
  transform: translateX(-50%);
}
.resistor .symbol {
  width: 80px;
  height: 20px;
  border: 2px solid #333;
  border-top: none;
  border-bottom: none;
  background: repeating-linear-gradient(135deg, #333, #333 2px, #fff 2px, #fff 4px);
}

.switch {
  top: 20px;
  right: 80px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.switch .dot { width: 8px; height: 8px; background: #333; border-radius: 50%; }
.switch .arm {
  width: 40px;
  height: 4px;
  background: #333;
  transform-origin: left center;
  transition: transform 0.3s ease;
  transform: rotate(25deg);
}
.switch.is-closed .arm {
  transform: rotate(0deg);
}

.data-display {
  margin-top: 20px;
}
.data-display h3 {
  margin-bottom: 10px;
}
.data-display strong {
  color: var(--primary-color);
  font-size: 1.2em;
}

/* Electron Flow Animation */
.electron-flow {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.electron-flow::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
  left: -10px;
  top: -2px;
  animation: flow 2s linear infinite;
}
.left-wire .electron-flow::before { animation-name: flow-y; }
.right-wire .electron-flow::before { animation-name: flow-y-rev; }
.bottom-wire .electron-flow::before { animation-direction: reverse; }

@keyframes flow {
  from { transform: translateX(0); }
  to { transform: translateX(500px); }
}
@keyframes flow-y {
  from { transform: translateY(0); }
  to { transform: translateY(300px); }
}
@keyframes flow-y-rev {
  from { transform: translateY(300px); }
  to { transform: translateY(0); }
}
</style>
