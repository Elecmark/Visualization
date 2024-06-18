<template>
  <div class="chart-container">
    <div class="title-info">
      {{ selectedYearForChord }} 届热门转入专业
    </div>
    <svg ref="chartSvg"></svg>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import * as d3 from 'd3';

export default {
  computed: {
    ...mapState('transfer', ['selectedYearForChord']),
    ...mapGetters('transfer', ['getTop5MajorsByInCount']),
    top5Majors() {
      return this.getTop5MajorsByInCount(this.selectedYearForChord);
    }
  },
  watch: {
    selectedYearForChord(newYear, oldYear) {
      if (newYear !== oldYear) {
        this.drawChart();
      }
    }
  },
  mounted() {
    this.drawChart();
  },
  methods: {
    ...mapActions('transfer', ['fetchTransferData']),
    drawChart() {
      const svg = d3.select(this.$refs.chartSvg)
          .html("") // 清空之前的图表
          .attr("width", 600)
          .attr("height", 250); // 固定高度

      const margin = { top: 10, right: 50, bottom: 20, left: 100 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;

      const g = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
          .domain([0, d3.max(this.top5Majors, d => d.count)])
          .range([0, width]);

      const y = d3.scaleBand()
          .domain(this.top5Majors.map(d => d.name))
          .range([0, height])
          .padding(0.1);

      g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x).ticks(5));

      g.append("g")
          .attr("class", "axis axis--y")
          .call(d3.axisLeft(y));

      g.selectAll(".bar")
          .data(this.top5Majors)
          .enter().append("rect")
          .attr("class", "bar")
          .attr("x", 0)
          .attr("y", d => y(d.name))
          .attr("width", d => x(d.count))
          .attr("height", y.bandwidth())
          .attr("fill", "steelblue");

      g.selectAll(".label")
          .data(this.top5Majors)
          .enter().append("text")
          .attr("class", "label")
          .attr("x", d => x(d.count) + 5)
          .attr("y", d => y(d.name) + y.bandwidth() / 2)
          .attr("dy", ".35em")
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

.title-info {
  font-size: 16px;
  text-align: center;
  font-weight: bold;
  margin: 0;
}

.axis--x path {
  display: none;
}

.bar {
  fill: steelblue;
}

.label {
  font-size: 10px; /* 调小字体 */
  fill: black;
}
</style>
