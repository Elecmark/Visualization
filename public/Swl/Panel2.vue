<template>
  <div class="chart-container">
    <h2>{{ selectedMajor }} 专业学生的去向</h2>
    <svg ref="pieChartSvg"></svg>
    <div id="tooltip" class="tooltip"></div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import * as d3 from 'd3';

export default {
  computed: {
    ...mapState('transfer', ['selectedMajor', 'selectedYearForChord']),
    ...mapGetters('transfer', ['getOutflowData']),
    outflowData() {
      return this.getOutflowData(this.selectedYearForChord, this.selectedMajor);
    }
  },
  watch: {
    selectedMajor(newMajor, oldMajor) {
      if (newMajor !== oldMajor) {
        this.drawPieChart();
      }
    },
    selectedYearForChord(newYear, oldYear) {
      if (newYear !== oldYear) {
        this.drawPieChart();
      }
    },
    outflowData() {
      this.drawPieChart();
    }
  },
  mounted() {
    this.drawPieChart();
  },
  methods: {
    drawPieChart() {
      const svg = d3.select(this.$refs.pieChartSvg)
          .html("") // 清空之前的图表
          .attr("width", 600)
          .attr("height", 300); // 固定高度

      const margin = { top: 20, right: 30, bottom: 40, left: 30 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      const radius = Math.min(width, height) / 2;

      if (!this.outflowData || this.outflowData.length === 0) {
        return;
      }

      const g = svg.append("g")
          .attr("transform", `translate(${width / 2},${height / 2})`);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const pie = d3.pie()
          .value(d => d.count)
          .sort(null);

      const arc = d3.arc()
          .innerRadius(0)
          .outerRadius(radius);

      const label = d3.arc()
          .outerRadius(radius - 40)
          .innerRadius(radius - 40);

      const arcs = g.selectAll(".arc")
          .data(pie(this.outflowData))
          .enter().append("g")
          .attr("class", "arc");

      arcs.append("path")
          .attr("d", arc)
          .attr("fill", d => color(d.data.name))
          .on("mouseover", (event, d) => {
            const [x, y] = [event.clientX, event.clientY];
            const tooltip = d3.select("#tooltip");
            const container = d3.select(".chart-container").node();
            const containerRect = container.getBoundingClientRect();
            const total = d3.sum(this.outflowData.map(d => d.count));

            tooltip
                .style("left", `${x - containerRect.left + 5}px`)
                .style("top", `${y - containerRect.top - 300}px`)
                .style("display", "inline-block")
                .html(`${d.data.name}<br>人数: ${d.data.count}<br>占比: ${((d.data.count / total) * 100).toFixed(2)}%`);
          })
          .on("mouseout", function() {
            d3.select("#tooltip").style("display", "none");
          });

      arcs.append("text")
          .attr("transform", d => {
            const [x, y] = label.centroid(d);
            const angle = (d.startAngle + d.endAngle) / 2 * 180 / Math.PI + 90; // 顺时针旋转90度
            return `translate(${x},${y}) rotate(${angle})`;
          })
          .attr("dy", "0.25em")
          .text(d => d.data.name)
          .style("font-size", "10px")
          .attr("text-anchor", "middle")
          .style("user-select", "none");
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

.arc path {
  stroke: #fff;
}

.arc text {
  font-size: 12px;
  fill: black;
  text-anchor: middle;
  user-select: none;
}

.tooltip {
  position: absolute;
  text-align: center;
  width: auto;
  height: auto;
  padding: 5px;
  background: lightsteelblue;
  border: 0px;
  border-radius: 8px;
  pointer-events: none;
  display: none;
}
</style>
