<template>
  <div class="line-chart-container">
    <div class="title-info">
      各专业各学期平均成绩
    </div>
    <div v-if="selectedMajor" class="major-info">
      选中专业: {{ selectedMajor }}
    </div>
    <div v-else class="major-info">
      请点击下方专业的折线
    </div>
    <svg ref="lineChartSvg"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState({
      majorScores: state => state.majorScores,
      selectedMajor: state => state.selectedMajor
    }),
  },
  watch: {
    selectedMajor(newMajor, oldMajor) {
      if (newMajor !== oldMajor) {
        this.drawChart(); // 根据新的数据重新绘制图表
      }
    }
  },
  mounted() {
    this.$store.dispatch('fetchStudents').then(() => {
      this.drawChart();
    }).catch(error => {
      console.error('Failed to fetch data:', error);
    });
  },
  methods: {
    drawChart() {
      const svg = d3.select(this.$refs.lineChartSvg);
      svg.selectAll("*").remove();  // 清空现有的 SVG 元素

      const width = +svg.style('width').replace('px', ''),
          height = +svg.style('height').replace('px', ''),
          margin = { top: 10, right: 0, bottom: 20, left: 40 },
          x = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.1),
          y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

      const terms = Object.keys(this.majorScores[Object.keys(this.majorScores)[0]]);
      x.domain(terms);

      // 计算所有数据的最小值和最大值
      const allScores = Object.values(this.majorScores).flatMap(major => Object.values(major));
      const yMin = d3.min(allScores);
      const yMax = d3.max(allScores);
      y.domain([yMin, yMax]);

      const lines = d3.line()
          .x(d => x(d.term) + x.bandwidth() / 2)
          .y(d => y(d.score));

      svg.attr('width', width)
          .attr('height', height);

      const g = svg.append('g');

      // 绘制各专业的折线
      Object.keys(this.majorScores).forEach(major => {
        const data = terms.map(term => ({
          term,
          score: this.majorScores[major][term]
        }));

        const path = g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', this.selectedMajor === major ? 'red' : 'grey')
            .attr('stroke-width', 1.5)
            .attr('d', lines)
            .style('opacity', this.selectedMajor === major ? 1 : 0.5)  // 设置不透明度
            .on('click', () => {
              this.$store.commit('setSelectedMajor', major);
            })
            .on('mouseover', () => {
              path.attr('stroke', 'orange').style('opacity', 1);  // Temporary highlight color on hover
            })
            .on('mouseout', () => {
              path.attr('stroke', this.selectedMajor === major ? 'red' : 'grey')
                  .style('opacity', this.selectedMajor === major ? 1 : 0.5); // 恢复颜色和不透明度
            });

        // 绘制点
        g.selectAll(`.point-${major.replace(/\s+/g, '-')}`)
            .data(data)
            .enter().append('circle')
            .attr('fill', this.selectedMajor === major ? 'red' : 'grey')
            .attr('r', 3)
            .attr('cx', d => x(d.term) + x.bandwidth() / 2)
            .attr('cy', d => y(d.score))
            .style('opacity', this.selectedMajor === major ? 1 : 0.5)  // 设置不透明度
            .append('title')
            .text(d => `专业: ${major}\n学期: ${d.term}\n平均成绩: ${d.score}`);
      });

      // 添加坐标轴
      g.append('g')
          .attr('transform', `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x));

      g.append('g')
          .attr('transform', `translate(${margin.left},0)`)
          .call(d3.axisLeft(y));
    }
  }

}
</script>

<style scoped>
.line-chart-container {
  width: 100%;
  height: 20vh;
  position: relative;
}

.title-info {
  font-size: 16px;
  text-align: center;
  font-weight: bold;
  margin: 0;
}

.major-info {
  font-size: 16px;
  text-align: center;
  font-weight: normal;
  margin: 0;
}

svg {
  display: block;
  width: 100%;
  height: 25vh;
}

.tooltip {
  position: absolute;
  text-align: center;
  padding: 2px;
  font: 12px sans-serif;
  background: lightsteelblue;
  border: 0px;
  border-radius: 8px;
  pointer-events: none;
  opacity: 0.9;
}
</style>
