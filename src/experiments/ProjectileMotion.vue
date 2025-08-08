<template>
  <div class="content-card">
    <div class="projectile-motion-experiment">
      <el-row :gutter="20" class="controls">
        <el-col :span="8">
          <div class="control-item">
            <span>发射角度 (°)</span>
            <el-slider v-model="angle" :min="0" :max="90" show-input></el-slider>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="control-item">
            <span>初始速度 (m/s)</span>
            <el-input-number v-model="initialVelocity" :min="5" :max="50"></el-input-number>
          </div>
        </el-col>
        <el-col :span="8" class="actions">
          <el-button @click="launch" type="primary">发射</el-button>
          <el-button @click="reset">重置</el-button>
        </el-col>
      </el-row>
      
      <div ref="canvasContainer" class="canvas-container"></div>

      <div class="data-display">
        <p>最大高度: {{ maxHeight.toFixed(2) }} m</p>
        <p>水平射程: {{ range.toFixed(2) }} m</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Matter from 'matter-js';

const canvasContainer = ref(null);
const angle = ref(45);
const initialVelocity = ref(25);
const maxHeight = ref(0);
const range = ref(0);

let engine, render, world, ball;
let isLaunched = false;
const PIXELS_PER_METER = 10; // 10像素代表1米

const setupMatter = () => {
  const { Engine, Render, World, Bodies, Runner, Events } = Matter;

  engine = Engine.create({ gravity: { y: 0.98 } }); // 使用更真实的重力值
  world = engine.world;

  const containerWidth = canvasContainer.value.clientWidth;
  const containerHeight = 400;

  render = Render.create({
    element: canvasContainer.value,
    engine: engine,
    options: {
      width: containerWidth,
      height: containerHeight,
      wireframes: false,
      background: '#f0f0f0'
    }
  });

  const ground = Bodies.rectangle(containerWidth / 2, containerHeight - 10, containerWidth, 20, { isStatic: true });
  ball = Bodies.circle(50, containerHeight - 30, 10, { restitution: 0.5, friction: 0.05 });

  World.add(world, [ground, ball]);
  
  Runner.run(Runner.create(), engine);
  Render.run(render);

  let peakY = ball.position.y;
  Events.on(engine, 'beforeUpdate', () => {
    if (isLaunched) {
      // 更新最大高度
      if (ball.position.y < peakY) {
        peakY = ball.position.y;
        maxHeight.value = (containerHeight - 30 - peakY) / PIXELS_PER_METER;
      }
      // 检查是否落地
      if (ball.position.y > containerHeight - 40 && ball.velocity.y > 0) {
        range.value = (ball.position.x - 50) / PIXELS_PER_METER;
        isLaunched = false; // 停止更新数据
      }
    }
  });
};

const launch = () => {
  reset();
  setTimeout(() => {
    isLaunched = true;
    const angleRad = angle.value * (Math.PI / 180);
    const velocity = initialVelocity.value / PIXELS_PER_METER;
    Matter.Body.setVelocity(ball, {
      x: velocity * Math.cos(angleRad),
      y: -velocity * Math.sin(angleRad)
    });
  }, 100);
};

const reset = () => {
  isLaunched = false;
  maxHeight.value = 0;
  range.value = 0;
  Matter.Body.setPosition(ball, { x: 50, y: canvasContainer.value.clientHeight - 30 });
  Matter.Body.setVelocity(ball, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(ball, 0);
};

onMounted(setupMatter);

onUnmounted(() => {
  if (render) {
    Matter.Render.stop(render);
    Matter.World.clear(world);
    Matter.Engine.clear(engine);
    render.canvas.remove();
  }
});
</script>

<style scoped>
.projectile-motion-experiment {
  text-align: center;
}
.controls {
  margin-bottom: 20px;
  padding: 0 20px;
}
.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.control-item span {
  font-size: 14px;
  margin-bottom: 10px;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.canvas-container {
  width: 100%;
  height: 400px;
  border: 1px solid #eee;
  margin: 0 auto;
}
.data-display {
  margin-top: 20px;
  display: flex;
  justify-content: space-around;
  font-size: 16px;
}
</style>
