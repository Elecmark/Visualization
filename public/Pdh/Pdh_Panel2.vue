<template>
  <div class="chart-container">
    <div class="title-info">{{ provinceTitle }}</div>
    <svg ref="chartSvg"></svg>
    <div id="tooltip" class="tooltip"></div>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  props: {
    selectedYear: {
      type: Number,
      required: true
    },
    selectedProvince: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      provinceTitle: '请选择省份查看各专业占比情况',
      rawData: [],  // 存储原始数据
      computedData: {}  // 存储计算后的数据
    };
  },
  watch: {
    selectedProvince(newProvince) {
      if (newProvince) {
        console.log('New province selected:', newProvince);
        this.provinceTitle = `${newProvince}省各专业占比`;
        this.computeAllData(newProvince);
      } else {
        this.provinceTitle = '请选择省份查看各专业占比情况';
        this.clearChart();
      }
    },
    selectedYear(newYear) {
      if (this.selectedProvince) {
        console.log('Selected year changed:', newYear);
        this.drawChart(this.computedData[this.selectedProvince][newYear]);
      }
    }
  },
  methods: {
    async loadData() {
      try {
        const data = await d3.json('/json/省份成绩数据.json');
        this.rawData = data;
        console.log('Loaded raw data:', this.rawData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    },
    computeAllData(provinceName) {
      const provinceData = this.rawData.filter(d => d.省份 === provinceName);
      const years = [2008, 2009, 2010, 2011, 2012];
      const computedData = {};

      years.forEach(year => {
        const yearData = provinceData.filter(d => d.年级 === year);
        const majorCounts = d3.rollup(
            yearData,
            v => v.length,
            d => d.专业
        );

        const data = Array.from(majorCounts, ([major, count]) => ({
          major,
          count,
          percentage: (count / yearData.length) * 100
        }));

        if (!computedData[provinceName]) {
          computedData[provinceName] = {};
        }
        computedData[provinceName][year] = data;
      });

      this.computedData = computedData;
      console.log('Computed data:', this.computedData);
      this.drawChart(this.computedData[provinceName][this.selectedYear]);
    },
    drawChart(data) {
      if (!data) return;

      const svg = d3.select(this.$refs.chartSvg)
          .html("") // 清空之前的图表
          .attr("width", 600)
          .attr("height", 300); // 固定高度

      const margin = { top: 20, right: 30, bottom: 20, left: 30 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      const radius = Math.min(width, height) / 2;

      const g = svg.append("g")
          .attr("transform", `translate(${width / 2},${height / 2})`);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const pie = d3.pie()
          .sort(null)
          .value(d => d.count);

      const path = d3.arc()
          .outerRadius(radius - 10)
          .innerRadius(0);

      const label = d3.arc()
          .outerRadius(radius - 40)
          .innerRadius(radius - 40);

      const arc = g.selectAll(".arc")
          .data(pie(data))
          .enter().append("g")
          .attr("class", "arc");

      arc.append("path")
          .attr("d", path)
          .attr("fill", d => color(d.data.major))
          .on("mouseover", function(event, d) {
            const [x, y] = [event.clientX, event.clientY];
            const tooltip = d3.select("#tooltip");
            const container = d3.select(".chart-container").node();
            const containerRect = container.getBoundingClientRect();

            tooltip
                .style("left", `${x - containerRect.left + 5}px`)
                .style("top", `${y - containerRect.top - 300}px`)
                .style("display", "inline-block")
                .html(`${d.data.major}<br>生源数量: ${d.data.count}<br>占比: ${d.data.percentage.toFixed(2)}%`);
          })
          .on("mouseout", function() {
            d3.select("#tooltip").style("display", "none");
          });

      arc.append("text")
          .attr("transform", d => {
            const [x, y] = label.centroid(d);
            const angle = (d.startAngle + d.endAngle) / 2 * 180 / Math.PI + 90; // 顺时针旋转90度
            return `translate(${x},${y}) rotate(${angle})`;
          })
          .attr("dy", "0.25em")
          .text(d => d.data.major)
          .style("font-size", "10px") // 统一字体大小
          .attr("text-anchor", "middle")
          .style("user-select", "none"); // 禁止选中文字
    },
    clearChart() {
      console.log('Clearing chart');
      d3.select(this.$refs.chartSvg).html("");
    }
  },
  mounted() {
    this.loadData().then(() => {
      if (this.selectedProvince) {
        console.log('Initial province selected:', this.selectedProvince);
        this.computeAllData(this.selectedProvince);
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

.arc path {
  stroke: #fff;
}

.arc text {
  font-size: 12px;
  fill: black;
  text-anchor: middle;
  user-select: none; /* 禁止选中文字 */
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
