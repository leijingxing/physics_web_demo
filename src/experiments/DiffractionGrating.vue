<template>
  <div class="content-card neon-card">
    <el-row :gutter="28">
      <!-- Controls -->
      <el-col :span="9" class="panel">
        <h3>激光衍射光栅</h3>
        <p class="panel-intro">
          调节参数，观察多阶衍射谱线的炫彩变化以及入射角对谱线位置的影响。
        </p>

        <div class="control-item">
          <span>波长 (nm)</span>
          <el-slider v-model="wavelength" :min="400" :max="700" :step="5" show-input />
        </div>
        <div class="control-item">
          <span>光栅线密度 (条/mm)</span>
          <el-slider v-model="grooveDensity" :min="200" :max="1200" :step="10" show-input />
        </div>
        <div class="control-item">
          <span>入射角 (°)</span>
          <el-slider v-model="incidentAngle" :min="-35" :max="35" :step="1" show-input />
        </div>
        <div class="control-item">
          <span>照亮线数 (相干长度)</span>
          <el-slider v-model="illuminatedGrooves" :min="200" :max="1600" :step="50" show-input />
        </div>

        <el-divider />

        <ul class="metrics">
          <li>
            <strong>线距 d:</strong>
            {{ (lineSpacing * 1e6).toFixed(2) }} μm
          </li>
          <li>
            <strong>可见衍射级次:</strong>
            ±{{ maxOrder }}
          </li>
          <li>
            <strong>主峰宽度:</strong>
            {{ mainLobeWidth.toFixed(3) }} (sinθ 单位)
          </li>
        </ul>
      </el-col>

      <!-- Visualization -->
      <el-col :span="15" class="panel">
        <div class="canvas-container" ref="canvasWrapper">
          <canvas ref="diffractionCanvas"></canvas>
          <div class="legend">
            <span class="legend-chip">
              <i class="icon icon-laser" />
              激光束
            </span>
            <span class="legend-chip">
              <i class="icon icon-spectrum" />
              衍射谱线
            </span>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

const wavelength = ref(540);
const grooveDensity = ref(650);
const incidentAngle = ref(4);
const illuminatedGrooves = ref(900);

const diffractionCanvas = ref(null);
const canvasWrapper = ref(null);
let animationFrameId = null;

const toRadians = (deg) => (deg * Math.PI) / 180;

const wavelengthMeters = computed(() => wavelength.value * 1e-9);
const lineSpacing = computed(() => 1 / (grooveDensity.value * 1000)); // meters

const maxOrder = computed(() => {
  const order = Math.floor(lineSpacing.value / wavelengthMeters.value);
  return Math.max(1, Math.min(order, 8));
});

const mainLobeWidth = computed(() => {
  const coherenceFactor = illuminatedGrooves.value / 1200;
  return 1 / (coherenceFactor * 60);
});

const resizeCanvas = () => {
  const canvas = diffractionCanvas.value;
  const wrapper = canvasWrapper.value;
  if (!canvas || !wrapper) return;

  const width = Math.max(640, wrapper.clientWidth - 10);
  const height = Math.round(width * 0.48);
  canvas.width = width;
  canvas.height = height;
};

const wavelengthToRGB = (wl) => {
  let r = 0;
  let g = 0;
  let b = 0;

  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wl >= 440 && wl < 490) {
    r = 0;
    g = (wl - 440) / (490 - 440);
    b = 1;
  } else if (wl >= 490 && wl < 510) {
    r = 0;
    g = 1;
    b = -(wl - 510) / (510 - 490);
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wl >= 580 && wl < 645) {
    r = 1;
    g = -(wl - 645) / (645 - 580);
    b = 0;
  } else if (wl >= 645 && wl <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }

  // Intensity correction near extremes
  let factor = 0;
  if (wl >= 380 && wl < 420) {
    factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);
  } else if (wl >= 420 && wl <= 700) {
    factor = 1;
  } else if (wl > 700 && wl <= 780) {
    factor = 0.3 + 0.7 * (780 - wl) / (780 - 700);
  }

  return {
    r: Math.round(Math.pow(r * factor, 0.9) * 255),
    g: Math.round(Math.pow(g * factor, 0.9) * 255),
    b: Math.round(Math.pow(b * factor, 0.9) * 255),
  };
};

const drawFrame = (timestamp = 0) => {
  const canvas = diffractionCanvas.value;
  if (!canvas) {
    animationFrameId = requestAnimationFrame(drawFrame);
    return;
  }

  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  // Background glow
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#050015');
  bgGradient.addColorStop(0.4, '#0b1f4f');
  bgGradient.addColorStop(0.75, '#1f053c');
  bgGradient.addColorStop(1, '#050015');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const incAngleRad = toRadians(incidentAngle.value);
  const lambda = wavelengthMeters.value;
  const spacing = lineSpacing.value;
  const orders = maxOrder.value;
  const coherence = illuminatedGrooves.value / 900;
  const peakTightness = Math.max(120, illuminatedGrooves.value / 2);
  const phaseDrift = timestamp * 0.002;
  const maxViewAngle = Math.PI * 0.48;

  let maxIntensity = 0;
  const scanResolution = width;
  const intensityArray = new Array(scanResolution);
  const colorArray = new Array(scanResolution);

  for (let x = 0; x < scanResolution; x += 1) {
    const normalizedX = (x / scanResolution) - 0.5;
    const theta = normalizedX * maxViewAngle;
    const sinTheta = Math.sin(theta);

    let localIntensity = 0;
    let colorR = 0;
    let colorG = 0;
    let colorB = 0;

    for (let m = -orders; m <= orders; m += 1) {
      const target = m * (lambda / spacing) - Math.sin(incAngleRad);
      const diff = sinTheta - target;
    const gaussian = Math.exp(-((diff * peakTightness) ** 2));
      const coherenceEnvelope = Math.exp(-Math.abs(diff) * coherence * 4);
      const phaseBeat = Math.sin((diff * illuminatedGrooves.value * 12) + phaseDrift + m * 1.2);
      const modulation = 0.6 + 0.4 * phaseBeat;
      const weight = gaussian * coherenceEnvelope * modulation;
      localIntensity += weight;

      const shiftedWavelength = Math.min(
        760,
      Math.max(390, wavelength.value + m * 18)
      );
      const spectral = wavelengthToRGB(shiftedWavelength);
      colorR += spectral.r * weight;
      colorG += spectral.g * weight;
      colorB += spectral.b * weight;
    }

    const bloom = Math.pow(localIntensity, 0.85);
    intensityArray[x] = bloom;
    colorArray[x] = {
      r: colorR,
      g: colorG,
      b: colorB,
    };
    maxIntensity = Math.max(maxIntensity, bloom);
  }

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.shadowColor = '#5ad0ff';
  ctx.shadowBlur = 0;

  for (let x = 0; x < scanResolution; x += 1) {
    const intensity = intensityArray[x];
    if (intensity <= 0) continue;

    const { r, g, b } = colorArray[x];
    const normalized = intensity / (maxIntensity || 1);
    const glow = Math.pow(normalized, 0.75);
    const alpha = Math.min(1, glow + 0.08);

    ctx.strokeStyle = `rgba(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)}, ${alpha})`;
    ctx.lineWidth = 2.2 + glow * 3.4;
    ctx.shadowBlur = 12 + glow * 28;

    ctx.beginPath();
    const xPos = x + 0.5;
    const top = height * 0.18;
    const bottom = height * 0.82;
    ctx.moveTo(xPos, top);
    ctx.lineTo(xPos, bottom);
    ctx.stroke();
  }
  ctx.restore();

  // Draw central beam guide
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const beamGradient = ctx.createLinearGradient(width / 2, 0, width / 2, height);
  beamGradient.addColorStop(0, 'rgba(255,255,255,0.05)');
  beamGradient.addColorStop(0.5, 'rgba(90, 208, 255, 0.18)');
  beamGradient.addColorStop(1, 'rgba(255,255,255,0.05)');
  ctx.fillStyle = beamGradient;
  ctx.fillRect(width / 2 - 6, height * 0.1, 12, height * 0.8);
  ctx.restore();

  // Overlay grid
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.moveTo(0, height * 0.18);
  ctx.lineTo(width, height * 0.18);
  ctx.moveTo(0, height * 0.82);
  ctx.lineTo(width, height * 0.82);
  ctx.stroke();
  ctx.restore();

  // Angle markers
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  for (let m = -orders; m <= orders; m += 1) {
    const sine = m * (lambda / spacing) - Math.sin(incAngleRad);
    if (Math.abs(sine) > 1) continue;
    const theta = Math.asin(sine);
    const normalized = theta / maxViewAngle;
    const xPos = (normalized + 0.5) * width;
    ctx.fillText(`m = ${m}`, xPos, height * 0.15);
  }
  ctx.fillText(`入射 θ₀ = ${incidentAngle.value.toFixed(1)}°`, width / 2, height * 0.94);
  ctx.restore();

  animationFrameId = requestAnimationFrame(drawFrame);
};

onMounted(() => {
  resizeCanvas();
  drawFrame();
  window.addEventListener('resize', resizeCanvas);
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener('resize', resizeCanvas);
});

watch([wavelength, grooveDensity, incidentAngle, illuminatedGrooves], () => {
  // Force an immediate redraw with fresh parameters
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = requestAnimationFrame(drawFrame);
});
</script>

<style scoped>
.panel {
  position: relative;
}

.panel-intro {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
}

.neon-card {
  background: linear-gradient(135deg, rgba(12, 18, 45, 0.95) 0%, rgba(30, 7, 56, 0.9) 100%);
  box-shadow: 0 20px 45px rgba(8, 10, 30, 0.6);
  border: 1px solid rgba(86, 96, 255, 0.15);
}

.control-item {
  margin-bottom: 18px;
  color: rgba(255, 255, 255, 0.85);
}

.control-item span {
  display: inline-block;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.metrics {
  list-style: none;
  padding: 0;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
}

.metrics li {
  margin-bottom: 6px;
}

.metrics strong {
  color: #6dd3ff;
  margin-right: 6px;
}

.canvas-container {
  position: relative;
  width: 100%;
  min-height: 320px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(120, 150, 255, 0.25);
  box-shadow: inset 0 0 40px rgba(9, 15, 45, 0.75);
}

canvas {
  display: block;
  width: 100%;
  height: auto;
}

.legend {
  position: absolute;
  right: 18px;
  bottom: 16px;
  display: flex;
  gap: 12px;
}

.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(12, 18, 45, 0.75);
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  border: 1px solid rgba(104, 132, 255, 0.25);
  backdrop-filter: blur(6px);
}

.icon {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}

.icon-laser {
  background: linear-gradient(135deg, #6dd3ff, #8f7bff);
  box-shadow: 0 0 8px rgba(146, 205, 255, 0.8);
}

.icon-spectrum {
  background: linear-gradient(90deg, #ff0066, #ffcc00, #39ff14, #00cfff, #8f7bff);
  box-shadow: 0 0 8px rgba(255, 158, 10, 0.7);
}
</style>
