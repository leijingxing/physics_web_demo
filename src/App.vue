<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="logo-area">
        <img alt="logo" class="logo" src="@/assets/logo.svg" width="30" height="30" />
        <h3>物理实验模拟器</h3>
      </div>
    </el-header>
    <el-container>
      <el-aside width="260px" class="aside">
        <el-scrollbar>
          <el-menu router :default-active="$route.path">
            <el-menu-item-group title="力学">
              <el-menu-item 
                v-for="exp in mechanicsExperiments" 
                :key="exp.name" 
                :index="`/experiment/${exp.name}`">
                {{ exp.title }}
              </el-menu-item>
            </el-menu-item-group>
            <el-menu-item-group title="电学">
              <el-menu-item 
                v-for="exp in electricalExperiments" 
                :key="exp.name" 
                :index="`/experiment/${exp.name}`">
                {{ exp.title }}
              </el-menu-item>
            </el-menu-item-group>
            <el-menu-item-group title="光学">
              <el-menu-item 
                v-for="exp in opticsExperiments" 
                :key="exp.name" 
                :index="`/experiment/${exp.name}`">
                {{ exp.title }}
              </el-menu-item>
            </el-menu-item-group>
            <el-menu-item-group title="相对论">
              <el-menu-item 
                v-for="exp in relativityExperiments" 
                :key="exp.name" 
                :index="`/experiment/${exp.name}`">
                {{ exp.title }}
              </el-menu-item>
            </el-menu-item-group>
          </el-menu>
        </el-scrollbar>
      </el-aside>
      <el-main>
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue';
import { RouterView } from 'vue-router';

const mechanicsExperiments = ref([
  {
    name: 'FreeFall',
    title: '自由落体运动',
    description: '模拟一个物体在重力作用下，从静止开始下落的运动过程。'
  },
  {
    name: 'SimplePendulum',
    title: '单摆运动',
    description: '模拟一个单摆在重力作用下的往复运动。'
  },
  {
    name: 'ProjectileMotion',
    title: '抛体运动',
    description: '模拟一个物体以一定的初速度和角度被抛出后的运动轨迹。'
  },
]);

const electricalExperiments = ref([
  {
    name: 'SimpleDCCircuit',
    title: '简单直流电路',
    description: '一个包含电源、电阻和开关的简单直流电路。'
  },
  {
    name: 'RLCSeriesCircuit',
    title: 'RLC 串联电路',
    description: '分析 RLC 串联电路在交流电源下的特性。'
  },
  {
    name: 'RCCircuit',
    title: 'RC 电路充放电',
    description: '观察电容器在直流电路中的充电和放电过程。'
  }
]);

const opticsExperiments = ref([
  {
    name: 'SnellsLaw',
    title: '光的折射 (斯涅尔定律)',
    description: '模拟光在不同介质界面上的折射和反射现象。'
  },
  {
    name: 'LensImaging',
    title: '透镜成像',
    description: '通过光线追踪模拟凸透镜和凹透镜的成像原理。'
  },
  {
    name: 'DoubleSlitInterference',
    title: '双缝干涉',
    description: '演示光的波动性质，观察干涉条纹的形成和变化。'
  },
  {
    name: 'DiffractionGrating',
    title: '激光衍射光栅',
    description: '模拟激光入射光栅时多阶炫彩衍射谱线的形成。'
  }
]);

const relativityExperiments = ref([
  {
    name: 'SpecialRelativity',
    title: '时间膨胀与长度收缩',
    description: '观察当速度接近光速时发生的奇妙时空效应。'
  },
  {
    name: 'BlackHole',
    title: '黑洞与时空弯曲',
    description: '探索黑洞如何扭曲时空并捕获光线。'
  }
]);
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  background-color: var(--header-bg-color);
  /* border-bottom: 1px solid var(--border-color); */ /* 移除边框，使用阴影代替 */
  box-shadow: var(--header-shadow);
  height: var(--header-height);
  padding: 0 20px;
  z-index: 10; /* 确保阴影在内容之上 */
}

.logo-area {
  display: flex;
  align-items: center;
}

.logo-area h3 {
  margin-left: 12px;
  color: var(--primary-color);
  font-weight: 600;
}

.aside {
  background-color: var(--aside-bg-color);
  /* border-right: 1px solid var(--border-color); */ /* 移除边框，使用阴影代替 */
  box-shadow: var(--header-shadow);
  z-index: 5;
}

.aside .el-menu {
  border-right: none;
}

.el-menu-item.is-active {
  background-color: #ecf5ff;
  color: var(--primary-color);
  font-weight: bold;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
