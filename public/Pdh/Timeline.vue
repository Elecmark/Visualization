<template>
  <div class="timeline-container">
    <h2>{{ selectedYear }}级各省份生源信息</h2>
    <div class="legend">
      <div v-for="legend in legends" :key="legend.color" class="legend-item">
        <span :style="{ backgroundColor: legend.color }" class="legend-color"></span>
        <span>{{ legend.label }}</span>
      </div>
    </div>
    <input type="range" v-model="year" @input="updateYear" min="2008" max="2012" step="1" list="tickmarks" />
    <datalist id="tickmarks">
      <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
    </datalist>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  data() {
    return {
      year: 2008, // 默认年份
      years: [2008, 2009, 2010, 2011, 2012], // 刻度显示的年份
      legends: [
        { color: 'rgba(255, 0, 0, 0.8)', label: '> 6%' },
        { color: 'rgba(255, 100, 0, 0.8)', label: '> 5% - 6%' },
        { color: 'rgba(255, 140, 0, 0.8)', label: '> 4% - 5%' },
        { color: 'rgba(255, 215, 0, 0.8)', label: '> 3% - 4%' },
        { color: 'rgba(255, 255, 0, 0.8)', label: '> 2% - 3%' },
        { color: 'rgba(0, 255, 0, 0.8)', label: '> 1% - 2%' },
        { color: 'rgba(0, 191, 255, 0.8)', label: '≤ 1%' }
      ]
    };
  },
  computed: {
    ...mapState(['selectedYear']),
  },
  watch: {
    selectedYear(newYear) {
      this.year = newYear; // 更新滑块位置
    }
  },
  methods: {
    ...mapActions(['updateSelectedYear']),
    updateYear() {
      this.updateSelectedYear(this.year);
      console.log('Timeline这里变了:', this.year);
      this.$emit('yearChanged', this.year); // 触发年份变化事件
    }
  },
  created() {
    this.year = this.selectedYear; // 初始化年份
  }
};
</script>

<style scoped>
.timeline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;
  font-size: 16px;
}

h2 {
  margin-bottom: 10px;
}

.legend {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 0 10px;
}

.legend-color {
  width: 20px;
  height: 20px;
  display: inline-block;
  margin-right: 5px;
}

input[type="range"] {
  width: 80%;
  margin: 20px 0;
}

datalist {
  display: flex;
  justify-content: space-between;
  width: 80%;
}

option {
  text-align: center;
}
</style>
