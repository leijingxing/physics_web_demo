# Web 物理实验模拟器 (Physics Lab Simulator)

本项目是一个基于 Web 的交互式物理实验模拟器，旨在通过动画和交互的方式，帮助初高中学生更好地理解经典的物理实验。

# 在线预览地址

```
https://leijingxing.github.io/physics_web_demo/experiment/SimplePendulum
```

## ✨ 项目特色

- **交互式模拟**: 用户可以亲手调整实验参数，实时观察结果变化。
- **可视化学习**: 将抽象的物理公式和过程转化为直观的动画。
- **覆盖广泛**: 计划涵盖力学、电学、光学等多个分支的经典实验。
- **开源免费**: 完全开源，方便学习和二次开发。

## 🛠️ 技术栈

- **前端框架**: [Vue 3](https://vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **物理引擎**: [Matter.js](https://brm.io/matter-js/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **路由**: [Vue Router](https://router.vuejs.org/)

## 🚀 快速开始

1.  **克隆项目**
    ```bash
    git clone <your-repo-url>
    cd physics_web_demo
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **运行开发服务器**
    ```bash
    npm run dev
    ```

4.  在浏览器中打开 `http://localhost:5173` (端口号以终端输出为准)。

## 📁 项目结构

```
/physics_web_demo
|-- public/
|-- src/
|   |-- assets/         # 静态资源
|   |-- components/     # 通用UI组件
|   |-- experiments/    # 核心实验组件
|   |-- stores/         # Pinia 状态管理
|   |-- views/          # 页面级组件
|   |-- App.vue         # 根组件
|   |-- main.js         # 应用入口
|   |-- router.js       # 路由配置
|-- index.html
|-- package.json
```
