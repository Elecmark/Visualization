<template>
  <div id="navbar">
    <button
        v-for="(item, index) in buttons"
        :key="index"
        @mouseenter="hover = index"
        @mouseleave="hover = null"
        @click="goToPage(item.path)"
        :style="{
          'flex-grow': hover === index ? '1' : (hover === null ? '1' : '0'),
          'flex-shrink': '1',
          'flex-basis': '0',
          opacity: hover === index || hover === null ? 1 : 0
        }"
    >
      {{ hover === index ? item.hoverText : item.text }}
    </button>
  </div>
</template>


<script>
export default {
  data() {
    return {
      hover: null,
      buttons: [
        { text: '首页', hoverText: '返回主页', path: '/' },
        { text: 'PDH', hoverText: '查看 PDH', path: '/pdh' },
        { text: 'SGB', hoverText: '查看 SGB', path: '/sgb' },
        { text: 'SWL', hoverText: '查看 SWL', path: '/swl' }
      ]
    };
  },
  methods: {
    goToPage(path) {
      this.$router.push(path);
    }
  }
}
</script>

<style scoped>
#navbar {
  display: flex;
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  justify-content: space-around; /* 按钮间隔均匀分布 */
  background-color: #f0f0f0; /* 背景颜色 */
  padding: 1vh 0; /* 上下内边距 */
  box-shadow: 0 4px 6px rgba(0,0,0,0.1); /* 导航栏下方的软阴影 */
  z-index: 100; /* 层级 */
  height: 3vh; /* 固定高度 */
  align-items: center; /* 垂直居中所有内容 */
}

button {
  flex: 1 1 auto; /* 弹性布局，确保按钮均匀分布，基本上占据相等空间 */
  cursor: pointer; /* 鼠标手型指针 */
  font-size: 16px; /* 字号 */
  background-color: transparent; /* 透明背景 */
  border: none; /* 无边框 */
  outline: none; /* 点击时无轮廓 */
  transition: all 0.3s ease; /* 过渡效果平滑 */
  color: black; /* 文字颜色 */
  overflow: hidden; /* 防止内容溢出 */
  height: 100%; /* 按钮高度充满父容器 */
  display: flex; /* 使用flex布局使文本居中 */
  align-items: center; /* 垂直居中文本 */
  justify-content: center; /* 水平居中文本 */
}

button:hover {
  opacity: 1; /* 悬停时保持不透明 */
}

button:not(:hover) {
  opacity: 0; /* 非悬停的按钮隐藏 */
}

button:focus {
  outline: none; /* 去除焦点轮廓 */
}
</style>
