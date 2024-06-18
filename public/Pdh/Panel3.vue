<template>
  <div class="chart-container">
    <div class="title-info">{{ provinceTitle }}</div>
    <svg ref="chartSvg"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  props: {
    selectedProvince: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      provinceTitle: '请选择省份查看学生成绩变化情况',
      rawData: []  // 存储原始数据
    };
  },
  watch: {
    selectedProvince(newProvince) {
      if (newProvince) {
        this.provinceTitle = `${newProvince}省学生成绩变化情况`;
        this.drawChart(newProvince);
      } else {
        this.provinceTitle = '请选择省份查看学生成绩变化情况';
        this.clearChart();
      }
    }
  },
  methods: {
    async loadData() {
      try {
        const data = await d3.json('/json/省份成绩数据.json');
        this.rawData = data;
      } catch (error) {
        console.error('Error loading data:', error);
      }
    },
    drawChart(provinceName) {
      const provinceData = this.rawData.filter(d => d.省份 === provinceName);

      const years = [2008, 2009, 2010, 2011, 2012];
      const yearScores = years.map(year => {
        const yearData = provinceData.filter(d => d.年级 === year);
        const averageScore = yearData.length ? d3.mean(yearData, d => d.综合成绩) : 0;
        return { year, averageScore };
      });

      const svg = d3.select(this.$refs.chartSvg)
          .html("") // 清空之前的图表
          .attr("width", 600)
          .attr("height", 300); // 固定高度

      const margin = { top: 10, right: 30, bottom: 100, left: 50 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;

      const g = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
          .domain([d3.min(yearScores, d => d.year) - 1, d3.max(yearScores, d => d.year) + 1]) // 添加padding
          .range([0, width]);

      const y = d3.scaleLinear()
          .domain([60, 100]) // 固定 y 轴范围
          .range([height, 0]);

      const line = d3.line()
          .x(d => x(d.year))
          .y(d => y(d.averageScore));

      g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x).ticks(yearScores.length).tickFormat(d3.format("d"))); // 格式化x轴刻度为整数年份

      g.append("g")
          .attr("class", "axis axis--y")
          .call(d3.axisLeft(y));

      g.append("path")
          .datum(yearScores)
          .attr("class", "line")
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 2)
          .attr("d", line);

      g.selectAll(".dot")
          .data(yearScores)
          .enter().append("circle")
          .attr("class", "dot")
          .attr("cx", d => x(d.year))
          .attr("cy", d => y(d.averageScore))
          .attr("r", 3)
          .attr("fill", "steelblue")
          .append("title")  // 添加title元素显示均分
          .text(d => `Year: ${d.year}, Avg Score: ${d.averageScore.toFixed(2)}`);

      // 在数据点上显示对应的均分
      g.selectAll(".text")
          .data(yearScores)
          .enter().append("text")
          .attr("class", "text")
          .attr("x", d => x(d.year))
          .attr("y", d => y(d.averageScore) - 10)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("fill", "black")
          .text(d => d.averageScore.toFixed(2));
    },
    clearChart() {
      d3.select(this.$refs.chartSvg).html("");
    }
  },
  mounted() {
    this.loadData().then(() => {
      if (this.selectedProvince) {
        this.drawChart(this.selectedProvince);
      }
    });
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

.line {
  fill: none;
  stroke: steelblue;
  stroke-width: 2px;
}

.dot {
  fill: steelblue;
}

.text {
  font-size: 12px;
  fill: black;
  text-anchor: middle;
}
</style>
