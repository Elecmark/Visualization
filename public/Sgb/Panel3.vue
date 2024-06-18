<template>
  <div class="line-chart-container">
    <div class="title-info">
      同专业各学期平均成绩
    </div>
    <div v-if="selectedStudentId && selectedStudentMajor" class="student-info">
      学号: {{ selectedStudentId }}，专业: {{ selectedStudentMajor }}
    </div>
    <div v-else class="student-info">
      请在右侧桑基图选择学生
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
      selectedStudentScores: state => state.selectedStudentScores,
      selectedStudentId: state => state.selectedStudentId,
      selectedStudentMajor: state => state.selectedStudentMajor
    }),
  },
  watch: {
    selectedStudentScores(newScores, oldScores) {
      if (newScores !== oldScores) {
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
      const personalScores = this.selectedStudentScores ? Object.keys(this.selectedStudentScores).filter(key => key.match(/^\d{5}$/)).map(term => +this.selectedStudentScores[term]) : [];
      x.domain(terms);

      // 获取同专业的平均成绩
      const averageScores = terms.map(term => +this.majorScores[this.selectedStudentMajor][term]);

      // 计算所有数据的最小值和最大值
      const allScores = personalScores.concat(averageScores);
      const yMin = d3.min(allScores);
      const yMax = d3.max(allScores);
      y.domain([yMin, yMax]);

      const personalLine = d3.line()
          .x(d => x(d.term) + x.bandwidth() / 2)
          .y(d => y(d.score));

      const averageLine = d3.line()
          .x(d => x(d.term) + x.bandwidth() / 2)
          .y(d => y(d.score));

      svg.attr('width', width)
          .attr('height', height);

      const g = svg.append('g');

      // 绘制个人成绩折线及节点
      if (personalScores.length > 0) {
        const personalData = terms.map((term, index) => ({ term, score: personalScores[index] }));
        g.append('path')
            .datum(personalData)
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 1.5)
            .attr('d', personalLine);

        // 绘制个人成绩的点
        g.selectAll('.personal-point')
            .data(personalData)
            .enter().append('circle')
            .attr('fill', 'blue')
            .attr('r', 5)
            .attr('cx', d => x(d.term) + x.bandwidth() / 2)
            .attr('cy', d => y(d.score))
            .append('title')
            .text(d => `学期: ${d.term}\n个人成绩: ${d.score}`);
      }

      // 绘制同专业平均成绩的虚线及节点
      const averageData = terms.map((term, index) => ({ term, score: averageScores[index] }));
      g.append('path')
          .datum(averageData)
          .attr('fill', 'none')
          .attr('stroke', 'grey')
          .attr('stroke-dasharray', '5,5') // 设置为虚线
          .attr('stroke-width', 1.5)
          .attr('d', averageLine);

      // 绘制平均成绩的点
      g.selectAll('.average-point')
          .data(averageData)
          .enter().append('circle')
          .attr('fill', 'grey')
          .attr('r', 3)
          .attr('cx', d => x(d.term) + x.bandwidth() / 2)
          .attr('cy', d => y(d.score))
          .append('title')
          .text(d => `学期: ${d.term}\n平均成绩: ${d.score}`);

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
  height: 20vh; /* 增加容器的高度以包含学生信息 */
  position: relative;
}

.title-info {
  font-size: 16px;
  text-align: center;
  font-weight: bold;
  margin: 0;
}

.student-info {
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
