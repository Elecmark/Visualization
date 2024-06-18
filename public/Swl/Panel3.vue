<template>
  <div class="chart-container">
    <h2>{{ selectedMajor }} 专业与其他专业的课程重叠情况</h2>
    <svg ref="barChartSvg"></svg>
    <div id="tooltip" class="tooltip"></div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import * as d3 from 'd3';

export default {
  computed: {
    ...mapState('transfer', ['selectedMajor', 'selectedYearForChord']),
    ...mapGetters('transfer', ['getCourseOverlapData']),
    courseOverlapData() {
      return this.getCourseOverlapData(this.selectedYearForChord, this.selectedMajor);
    }
  },
  watch: {
    selectedMajor(newMajor, oldMajor) {
      if (newMajor !== oldMajor) {
        this.drawBarChart();
      }
    },
    selectedYearForChord(newYear, oldYear) {
      if (newYear !== oldYear) {
        this.drawBarChart();
      }
    },
    courseOverlapData() {
      this.drawBarChart();
    }
  },
  mounted() {
    this.fetchCourseData().then(() => {
      this.drawBarChart();
    });
  },
  methods: {
    ...mapActions('transfer', ['fetchCourseData']),
    drawBarChart() {
      const svg = d3.select(this.$refs.barChartSvg)
          .html("") // 清空之前的图表
          .attr("width", 600)
          .attr("height", 300); // 固定高度

      const margin = { top: 10, right: 50, bottom: 120, left: 100 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;

      const g = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
          .domain([0, d3.max(this.courseOverlapData, d => d.count)])
          .range([0, width]);

      const y = d3.scaleBand()
          .domain(this.courseOverlapData.map(d => d.name))
          .range([0, height])
          .padding(0.1);

      g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x).ticks(5))
          .selectAll("text")
          .style("text-anchor", "end");

      g.append("g")
          .attr("class", "axis axis--y")
          .call(d3.axisLeft(y));

      g.selectAll(".bar")
          .data(this.courseOverlapData)
          .enter().append("rect")
          .attr("class", "bar")
          .attr("x", 0)
          .attr("y", d => y(d.name))
          .attr("width", d => x(d.count))
          .attr("height", y.bandwidth())
          .attr("fill", "steelblue");

      g.selectAll(".label")
          .data(this.courseOverlapData)
          .enter().append("text")
          .attr("class", "label")
          .attr("x", d => x(d.count) + 5)
          .attr("y", d => y(d.name) + y.bandwidth() / 2)
          .attr("dy", "0.35em")
          .text(d => d.count);
    }
  }
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 25vh;
  position: relative;
}

h2 {
  font-size: 16px;
  text-align: center;
  font-weight: bold;
  margin: 0;
}

svg {
  display: block;
  margin: 0 auto;
}

.bar {
  fill: steelblue;
}

.label {
  font-size: 10px;
  fill: black;
}
</style>
