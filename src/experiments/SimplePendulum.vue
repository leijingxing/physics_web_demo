<template>
  <div class="content-card">
    <div class="simple-pendulum-experiment">
      <div class="controls">
        <el-button @click="reset" type="primary">重置</el-button>
      </div>
      <div ref="canvasContainer" class="canvas-container"></div>
      <div class="data-display">
        <p>将摆球拖拽到一侧后松开即可开始</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Matter from 'matter-js';

const canvasContainer = ref(null);

let engine;
let render;
let world;
let mouseConstraint;
let bob;

const setupMatter = () => {
  const { Engine, Render, World, Bodies, Constraint, Runner, Mouse, MouseConstraint } = Matter;

  engine = Engine.create();
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

  // 摆锤
  const pivot = { x: containerWidth / 2, y: 60 };
  bob = Bodies.circle(containerWidth / 2, 250, 30, {
    restitution: 0.8, // 恢复系数
    friction: 0,      // 摩擦力
    frictionAir: 0.005, // 空气阻力
    slop: 0.05,
    density: 0.1
  });

  // 约束（绳子）
  const constraint = Constraint.create({
    pointA: pivot,
    bodyB: bob,
    stiffness: 0.08, // 刚度
    length: 190
  });

  World.add(world, [bob, constraint]);

  // 添加鼠标控制
  const mouse = Mouse.create(render.canvas);
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: false
      }
    }
  });

  World.add(world, mouseConstraint);

  Runner.run(Runner.create(), engine);
  Render.run(render);
};

const reset = () => {
  if (bob) {
    // 将摆锤重置到最低点并停止运动
    Matter.Body.setPosition(bob, { x: canvasContainer.value.clientWidth / 2, y: 250 });
    Matter.Body.setVelocity(bob, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(bob, 0);
  }
};

onMounted(() => {
  setupMatter();
});

onUnmounted(() => {
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
.simple-pendulum-experiment {
  text-align: center;
}
.controls {
  margin-bottom: 20px;
}
.canvas-container {
  width: 100%;
  height: 400px;
  border: 1px solid #eee;
  margin: 0 auto;
  cursor: grab;
}
.canvas-container:active {
  cursor: grabbing;
}
.data-display {
  margin-top: 20px;
  font-size: 14px;
  color: #888;
}
</style>
