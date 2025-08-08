<template>
  <div class="content-card">
    <div class="free-fall-experiment">
      <div class="controls">
        <el-button @click="reset" type="primary">重置</el-button>
      </div>
      <div ref="canvasContainer" class="canvas-container"></div>
      <div class="data-display">
        <p>小球速度: <strong>{{ velocity.toFixed(2) }}</strong> m/s</p>
        <p>下落高度: <strong>{{ height.toFixed(2) }}</strong> m</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Matter from 'matter-js';

const canvasContainer = ref(null);
const velocity = ref(0);
const height = ref(0);

let engine;
let render;
let ball;
let ground;
let world;

const setupMatter = () => {
  // --- 引擎和渲染器 ---
  const Engine = Matter.Engine;
  const Render = Matter.Render;
  const World = Matter.World;
  const Bodies = Matter.Bodies;
  const Runner = Matter.Runner;

  engine = Engine.create();
  world = engine.world;

  const containerWidth = canvasContainer.value.clientWidth;
  const containerHeight = 400; // Fixed height

  render = Render.create({
    element: canvasContainer.value,
    engine: engine,
    options: {
      width: containerWidth,
      height: containerHeight,
      wireframes: false, // Show solid shapes
      background: '#f0f0f0'
    }
  });

  // --- 创建物体 ---
  // 小球 (半径20, 初始位置在顶部中央)
  ball = Bodies.circle(containerWidth / 2, 30, 20, {
    restitution: 0.4, // 弹力
    friction: 0.01,   // 摩擦力
  });

  // 地面 (静态物体)
  ground = Bodies.rectangle(containerWidth / 2, containerHeight - 10, containerWidth, 20, {
    isStatic: true
  });

  // --- 添加到世界 ---
  World.add(world, [ball, ground]);

  // --- 运行引擎 ---
  Runner.run(Runner.create(), engine);
  Render.run(render);

  // --- 数据更新 ---
  Matter.Events.on(engine, 'beforeUpdate', () => {
    const currentVelocity = ball.velocity.y;
    const currentPosition = ball.position.y;
    
    velocity.value = currentVelocity > 0 ? currentVelocity : 0;
    // 高度计算: (地面y - 小球y - 地面厚度一半 - 小球半径) / 缩放因子
    // 假设100像素=1米
    const calculatedHeight = (ground.position.y - currentPosition - 10 - 20) / 100;
    height.value = calculatedHeight > 0 ? calculatedHeight : 0;
  });
};

const reset = () => {
  if (ball && world) {
    // 重置小球的位置和状态
    Matter.Body.setPosition(ball, { x: canvasContainer.value.clientWidth / 2, y: 30 });
    Matter.Body.setVelocity(ball, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(ball, 0);
  }
};

onMounted(() => {
  setupMatter();
});

onUnmounted(() => {
  // 清理工作，防止内存泄漏
  if (render) {
    Matter.Render.stop(render);
    Matter.World.clear(world);
    Matter.Engine.clear(engine);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};
  }
});
</script>

<style scoped>
.free-fall-experiment {
  /* 容器样式移到全局 .content-card */
}
.controls {
  text-align: center;
  margin-bottom: 20px;
}
.canvas-container {
  width: 100%; /* 宽度自适应父容器 */
  height: 400px; /* 保持固定高度 */
  border: 1px solid #eee;
  margin: 0 auto; /* 居中 */
}
.data-display {
  margin-top: 20px;
  text-align: center;
  font-size: 16px;
  font-family: 'Courier New', Courier, monospace;
  color: #555;
}
.data-display strong {
  color: var(--primary-color);
  font-size: 1.1em;
}
</style>
