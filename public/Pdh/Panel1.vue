<template>
  <div class="chart-container">
    <div class="title-info">
      各省份平均成绩
      <button @click="resetSelection">重置</button>
    </div>
    <svg ref="chartSvg"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  props: {
    provinceStats: {
      type: Object,
      required: true
    },
    selectedYear: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      sortedData: []
    };
  },
  watch: {
    sortedData() {
      this.drawChart();
    },
    selectedYear() {
      this.resetSelection(); // 当 selectedYear 发生变化时，重置选择
    }
  },
  methods: {
    updateProvinces(provinceData) {
      this.sortedData = provinceData.sort((a, b) => b.averageScore - a.averageScore); // 按平均成绩排序
      this.drawChart();
    },
    resetSelection() {
      this.sortedData = [];
      this.$emit('resetProvinces'); // 通知父组件重置已选省份
      this.drawChart();
    },
    drawChart() {
      const svg = d3.select(this.$refs.chartSvg)
          .html("") // 清空之前的图表
          .attr("width", 600)
          .attr("height", 300); // 固定高度

      const margin = { top: 10, right: 30, bottom: 100, left: 50 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;

      const g = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
          .rangeRound([0, width])
          .padding(0.1)
          .domain(this.sortedData.map(d => d.province));

      const y = d3.scaleLinear()
          .rangeRound([height, 0])
          .domain([0, 100]); // 固定 y 轴范围

      g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x).ticks(5))
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end");

      g.append("g")
          .attr("class", "axis axis--y")
          .call(d3.axisLeft(y));

      g.selectAll(".bar")
          .data(this.sortedData)
          .enter().append("rect")
          .attr("class", "bar")
          .attr("x", d => x(d.province))
          .attr("y", d => y(d.averageScore))
          .attr("width", x.bandwidth())
          .attr("height", d => height - y(d.averageScore));

      // 添加顶部的平均分显示，字体调小
      g.selectAll(".label")
          .data(this.sortedData)
          .enter().append("text")
          .attr("class", "label")
          .attr("x", d => x(d.province) + x.bandwidth() / 2)
          .attr("y", d => y(d.averageScore) - 5)
          .attr("text-anchor", "middle")
          .style("font-size", "10px") // 调小字体
          .text(d => d.averageScore.toFixed(2));
    }
  },
  mounted() {
    this.drawChart();
  }
};
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
