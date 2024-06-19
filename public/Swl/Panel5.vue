<template>
  <div class="chart-container">
    <h2>{{ selectedMajor }} 专业历年转专业人数变化</h2>
    <div class="legend">
      <span class="legend-item">
        <svg width="10" height="10">
          <rect width="10" height="10" fill="green"></rect>
        </svg>
        转入人数
      </span>
      <span class="legend-item">
        <svg width="10" height="10">
          <rect width="10" height="10" fill="red"></rect>
        </svg>
        转出人数
      </span>
    </div>
    <svg ref="lineChartSvg"></svg>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import * as d3 from 'd3';

export default {
  computed: {
    ...mapState('transfer', ['selectedMajor']),
    ...mapGetters('transfer', ['getYearlyTransferData']),
    yearlyTransferData() {
      return this.getYearlyTransferData(this.selectedMajor);
    }
  },
  watch: {
    selectedMajor(newMajor, oldMajor) {
      if (newMajor !== oldMajor) {
        this.drawLineChart();
      }
    },
    yearlyTransferData() {
      this.drawLineChart();
    }
  },
  mounted() {
    this.fetchTransferData().then(() => {
      console.log("Transfer data loaded:", this.$store.state.transfer.transferData);
      this.drawLineChart();
    });
  },
  methods: {
    ...mapActions('transfer', ['fetchTransferData']),
    drawLineChart() {
      const data = this.yearlyTransferData;
      console.log("Drawing line chart with data:", data);

      if (!data || data.length === 0) {
        console.log("No data available for drawing the line chart.");
        return;
      }

      const svg = d3.select(this.$refs.lineChartSvg)
          .html("") // 清空之前的图表
          .attr("width", 1000)
          .attr("height", 220); // 固定高度

      const margin = { top: 40, right: 50, bottom: 40, left: 50 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;

      const g = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand().domain(data.map(d => d.year)).range([0, width]).padding(0.1);
      const y = d3.scaleLinear().domain([0, d3.max(data, d => Math.max(d.inCount, d.outCount))]).nice().range([height, 0]);

      const lineIn = d3.line()
          .x(d => x(d.year) + x.bandwidth() / 2)
          .y(d => y(d.inCount))
          .curve(d3.curveMonotoneX);

      const lineOut = d3.line()
          .x(d => x(d.year) + x.bandwidth() / 2)
          .y(d => y(d.outCount))
          .curve(d3.curveMonotoneX);

      g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x).tickFormat(d3.format("d")));

      g.append("g")
          .attr("class", "axis axis--y")
          .call(d3.axisLeft(y));

      g.append("path")
          .datum(data)
          .attr("class", "line line--in")
          .attr("d", lineIn)
          .attr("stroke", "green")
          .attr("fill", "none");

      g.append("path")
          .datum(data)
          .attr("class", "line line--out")
          .attr("d", lineOut)
          .attr("stroke", "red")
          .attr("fill", "none");

      g.selectAll(".dot--in")
          .data(data)
          .enter().append("circle")
          .attr("class", "dot dot--in")
          .attr("cx", d => x(d.year) + x.bandwidth() / 2)
          .attr("cy", d => y(d.inCount))
          .attr("r", 3)
          .attr("fill", "green");

      g.selectAll(".dot--out")
          .data(data)
          .enter().append("circle")
          .attr("class", "dot dot--out")
          .attr("cx", d => x(d.year) + x.bandwidth() / 2)
          .attr("cy", d => y(d.outCount))
          .attr("r", 3)
          .attr("fill", "red");

      g.selectAll(".label--in")
          .data(data)
          .enter().append("text")
          .attr("class", "label label--in")
          .attr("x", d => x(d.year) + x.bandwidth() / 2)
          .attr("y", d => y(d.inCount) - 5)
          .attr("text-anchor", "end") // 左对齐
          .attr("dx", "-0.5em") // 向左移动半个字符宽度
          .attr("fill", "green") // 设置颜色
          .text(d => d.inCount);

      g.selectAll(".label--out")
          .data(data)
          .enter().append("text")
          .attr("class", "label label--out")
          .attr("x", d => x(d.year) + x.bandwidth() / 2)
          .attr("y", d => y(d.outCount) - 5)
          .attr("text-anchor", "start") // 右对齐
          .attr("dx", "0.5em") // 向右移动半个字符宽度
          .attr("fill", "red") // 设置颜色
          .text(d => d.outCount);
    }
  }
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 30vh;
  position: relative;
}

h2 {
  font-size: 16px;
  text-align: center;
  font-weight: bold;
  margin: 0;
}

.legend {
  display: flex;
  justify-content: center;
  margin: 0 0 -2vh 0;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 0 10px;
}

svg {
  display: block;
  margin: 0 auto;
}

.line {
  fill: none;
  stroke-width: 2px;
}

.dot {
  stroke: #fff;
}

.label {
  font-size: 10px;
  fill: black;
}
</style>