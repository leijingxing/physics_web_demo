<template>
  <div class="content-card">
    <el-row :gutter="20">
      <!-- Controls Column -->
      <el-col :span="10">
        <h3>电路参数</h3>
        <div class="control-item">
          <span>电源电压 (V)</span>
          <el-slider v-model="voltage" :min="1" :max="240" show-input></el-slider>
        </div>
        <div class="control-item">
          <span>电源频率 (Hz)</span>
          <el-slider v-model="frequency" :min="1" :max="1000" show-input></el-slider>
        </div>
        <div class="control-item">
          <span>电阻 (R, Ω)</span>
          <el-slider v-model="resistance" :min="1" :max="1000" show-input></el-slider>
        </div>
        <div class="control-item">
          <span>电感 (L, mH)</span>
          <el-slider v-model="inductance" :min="1" :max="1000" show-input></el-slider>
        </div>
        <div class="control-item">
          <span>电容 (C, μF)</span>
          <el-slider v-model="capacitance" :min="1" :max="1000" show-input></el-slider>
        </div>
      </el-col>

      <!-- Data and Visualization Column -->
      <el-col :span="14">
        <el-tabs>
          <el-tab-pane label="计算结果">
            <div class="data-display">
              <p>感抗 (X<sub>L</sub>): <strong>{{ inductiveReactance.toFixed(2) }}</strong> Ω</p>
              <p>容抗 (X<sub>C</sub>): <strong>{{ capacitiveReactance.toFixed(2) }}</strong> Ω</p>
              <p>总阻抗 (Z): <strong>{{ impedance.toFixed(2) }}</strong> Ω</p>
              <p>电流 (I): <strong>{{ current.toFixed(3) }}</strong> A</p>
              <p>相位角 (θ): <strong>{{ phaseAngleDegrees.toFixed(2) }}</strong> °</p>
              <p>谐振频率 (f₀): <strong>{{ resonantFrequency.toFixed(2) }}</strong> Hz</p>
            </div>
          </el-tab-pane>
          <el-tab-pane label="相量图">
            <div class="phasor-diagram">
              <svg viewBox="-150 -150 300 300" width="300" height="300">
                <!-- Axes -->
                <line x1="-150" y1="0" x2="150" y2="0" stroke="#ccc" stroke-width="1"/>
                <line x1="0" y1="-150" x2="0" y2="150" stroke="#ccc" stroke-width="1"/>
                
                <!-- Voltage Phasor (Reference) -->
                <line x1="0" y1="0" :x2="phasorScale" y2="0" stroke="red" stroke-width="2"/>
                <text x="105" y="-5" fill="red" font-size="10">V</text>

                <!-- Current Phasor -->
                <g :transform="`rotate(${-phaseAngleDegrees})`">
                  <line x1="0" y1="0" :x2="phasorScale * 0.8" y2="0" stroke="blue" stroke-width="2"/>
                  <text :x="phasorScale * 0.8 + 5" y="5" fill="blue" font-size="10">I</text>
                </g>
              </svg>
              <div class="phasor-info">
                <p v-if="phaseAngleDegrees > 0.1">电流滞后电压 (感性)</p>
                <p v-else-if="phaseAngleDegrees < -0.1">电流超前电压 (容性)</p>
                <p v-else>电流与电压同相 (纯阻性)</p>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Input values
const voltage = ref(110);
const frequency = ref(60);
const resistance = ref(100);
const inductance = ref(150); // in mH
const capacitance = ref(15); // in μF

// Conversion constants
const mH_TO_H = 1e-3;
const uF_TO_F = 1e-6;

// Angular frequency
const omega = computed(() => 2 * Math.PI * frequency.value);

// Reactances
const inductiveReactance = computed(() => omega.value * inductance.value * mH_TO_H);
const capacitiveReactance = computed(() => {
  const cInFarads = capacitance.value * uF_TO_F;
  if (omega.value === 0 || cInFarads === 0) return Infinity;
  return 1 / (omega.value * cInFarads);
});

// Impedance
const impedance = computed(() => {
  const r = resistance.value;
  const x = inductiveReactance.value - capacitiveReactance.value;
  return Math.sqrt(r * r + x * x);
});

// Current
const current = computed(() => {
  const z = impedance.value;
  if (z === 0) return Infinity;
  return voltage.value / z;
});

// Phase Angle
const phaseAngleRadians = computed(() => {
  const r = resistance.value;
  if (r === 0) return (inductiveReactance.value > capacitiveReactance.value) ? Math.PI / 2 : -Math.PI / 2;
  return Math.atan((inductiveReactance.value - capacitiveReactance.value) / r);
});
const phaseAngleDegrees = computed(() => phaseAngleRadians.value * (180 / Math.PI));

// Resonant Frequency
const resonantFrequency = computed(() => {
  const lInHenrys = inductance.value * mH_TO_H;
  const cInFarads = capacitance.value * uF_TO_F;
  if (lInHenrys <= 0 || cInFarads <= 0) return 0;
  return 1 / (2 * Math.PI * Math.sqrt(lInHenrys * cInFarads));
});

// For SVG visualization
const phasorScale = ref(100);

</script>

<style scoped>
.control-item {
  margin-bottom: 15px;
}
.control-item span {
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
}
.data-display p {
  font-size: 16px;
  margin: 10px 0;
  color: #333;
}
.data-display strong {
  color: var(--primary-color);
}
.phasor-diagram {
  text-align: center;
  margin-top: 20px;
}
.phasor-diagram svg {
  border: 1px solid #eee;
  border-radius: 8px;
}
.phasor-info {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}
</style>
