<template>
  <div class="dashboard">
    <div class="left-panel">
      <Panel1 ref="panel1" :provinceStats="provinceStats" :selectedYear="selectedYear" @resetProvinces="handleResetProvinces" />
      <Panel2 ref="panel2" :selectedYear="selectedYear" :selectedProvince="selectedProvince" />
      <Panel3 ref="panel3" :provinceStats="provinceStats" :selectedProvince="selectedProvince" />
    </div>
    <div class="right-panel">
      <iframe
          ref="chinaMapFrame"
          src="/Pdh/three-china-map/china.html"
          frameborder="0"
          style="width: 100%; height: calc(2 * 31vh); border-radius: 10px;"
      ></iframe>
      <Timeline @yearChanged="handleYearChange" />
    </div>
  </div>
</template>

<script>
import Panel1 from '../../public/Pdh/Panel1.vue';
import Panel2 from '../../public/Pdh/Panel2.vue';
import Panel3 from '../../public/Pdh/Panel3.vue';
import Timeline from '../../public/Pdh/Timeline.vue';
import { mapState, mapActions } from 'vuex';

export default {
  components: {
    Panel1,
    Panel2,
    Panel3,
    Timeline
  },
  data() {
    return {
      selectedProvinces: [],
      selectedProvince: null
    };
  },
  computed: {
    ...mapState(['provinceStats', 'selectedYear'])
  },
  methods: {
    ...mapActions(['updateSelectedYear']),
    handleYearChange(newYear) {
      this.updateSelectedYear(newYear);
      this.handleResetProvinces(); // 触发重置
      const iframe = this.$refs.chinaMapFrame;
      iframe.contentWindow.postMessage({ type: 'yearChanged', year: newYear }, '*');
    },
    handleProvinceSelected(event) {
      if (event.data.type === 'provinceSelected') {
        const province = event.data.province;
        this.selectedProvince = province;

        const provinceStats = JSON.parse(event.data.provinceStats);

        if (!this.selectedProvinces.find(p => p.province === province)) {
          const selectedYear = this.selectedYear;
          const rankings = this.$store.state.rankings;

          const ranking = rankings && rankings[province] && rankings[province][selectedYear] ? rankings[province][selectedYear] : 'N/A';
          const selectedProvinceData = {
            province: province,
            averageScore: provinceStats.averageScore || 0,
            ranking: ranking
          };

          this.selectedProvinces.push(selectedProvinceData);
          // 按平均成绩排序
          this.selectedProvinces.sort((a, b) => b.averageScore - a.averageScore);
          this.$refs.panel1.updateProvinces(this.selectedProvinces);
        }
      }
    },
    handleResetProvinces() {
      this.selectedProvinces = [];
      this.$refs.panel1.updateProvinces(this.selectedProvinces); // 清空面板1的数据
    }
  },
  mounted() {
    window.addEventListener('message', this.handleProvinceSelected);
  },
  beforeDestroy() {
    window.removeEventListener('message', this.handleProvinceSelected);
  }
};
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: 1fr 2fr;
  height: 92vh;
}
.left-panel, .right-panel {
  display: grid;
  padding: 1vh;
  gap: 1vh;
}
.left-panel {
  grid-template-rows: repeat(3, 1fr);
}
.right-panel {
  grid-template-rows: 2fr 1fr; /* Adjusted to accommodate the iframe */
}
.panel {
  background-color: #e2e2e2;
  color: #606060;
  padding: 0 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  font-size: 12px;
}
</style>
