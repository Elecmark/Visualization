<template>
  <div id="navbar">
    <button
        v-for="(item, index) in buttons"
        :key="index"
        @mouseenter="hover = index"
        @mouseleave="hover = null"
        @click="goToPage(item.path)"
        :style="{
        'transform': hover === index ? 'translateY(-5px)' : 'translateY(0)',
        'box-shadow': hover === index ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)'
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
        { text: '2008-2012级各省生源信息', hoverText: '普典衡（21020007074）', path: '/pdh' },
        { text: '2012级学生各学期成绩情况', hoverText: '苏恭彬（21020007083）', path: '/sgb' },
        { text: '2011-2015级转专业的情况', hoverText: '宋汶霖（21020007082）', path: '/swl' }
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
  background-color: transparent; /* 透明背景 */
  padding: 1vh 0; /* 上下内边距 */
  z-index: 100; /* 层级 */
  height: 3vh; /* 固定高度 */
  align-items: center; /* 垂直居中所有内容 */
}

button {
  flex: 1; /* 弹性布局，确保按钮均匀分布 */
  cursor: pointer; /* 鼠标手型指针 */
  font-size: 16px; /* 字号 */
  border: none; /* 无边框 */
  outline: none; /* 点击时无轮廓 */
  background-color: transparent; /* 透明背景 */
  transition: all 0.3s ease; /* 过渡效果平滑 */
  color: black; /* 文字颜色 */
  overflow: hidden; /* 防止内容溢出 */
  height: 5vh; /* 按钮高度充满父容器 */
  display: flex; /* 使用flex布局使文本居中 */
  align-items: center; /* 垂直居中文本 */
  justify-content: center; /* 水平居中文本 */
  box-shadow: 0 4px 8px rgba(0,0,0,0.1); /* 默认情况下只存在下方阴影 */
}

button:hover {
  box-shadow: 0 8px 16px rgba(0,0,0,0.2); /* 悬停时显示左右下方阴影 */
  transform: translateY(-5px); /* 悬停时向上移动 */
}

button:focus {
  outline: none; /* 去除焦点轮廓 */
}
</style>
