<template>
  <div class="sankey-container">
    <div class="years-container">
      <span>20121</span>
      <span>20122</span>
      <span>20130</span>
      <span>20131</span>
      <span>20132</span>
      <span>20140</span>
      <span>20141</span>
      <span>20142</span>
      <span>20150</span>
      <span>20151</span>
      <span>20152</span>
    </div>
    <svg ref="sankeySvg"></svg>
  </div>
</template>


<script>
import { mapState } from 'vuex';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

export default {
  computed: {
    ...mapState(['students', 'selectedMajor'])
  },
  data() {
    return {
      activeTooltip: null
    };
  },
  watch: {
    selectedMajor(newMajor, oldMajor) {
      if (newMajor !== oldMajor) {
        this.updateLinkStyles();
      }
    }
  },
  mounted() {
    if (this.students.length > 0) {
      this.prepareSankeyData();
    } else {
      this.$store.dispatch('fetchStudents').then(() => {
        this.prepareSankeyData();
      });
    }
  },
  methods: {
    updateLinkStyles() {
      const svg = d3.select(this.$refs.sankeySvg);
      svg.selectAll(".link")
          .style("stroke", d => {
            if (this.$store.state.selectedStudentId === d.studentId) {
              return "#ff0000"; // 选中学生
            } else if (this.$store.state.selectedMajor === d.studentMajor) {
              return "#15a909"; // 选中专业
            } else {
              return "#00b4d8"; // 默认颜色
            }
          })
          .style("opacity", d => {
            if (this.$store.state.selectedStudentId === d.studentId || this.$store.state.selectedMajor === d.studentMajor) {
              return 1; // 选中学生或专业完全不透明
            } else {
              return 0.05; // 其他线条不透明度
            }
          });
    },

    selectStudent(studentId, studentMajor) {
      const student = this.students.find(student => student['学号'] === studentId);

      // 获取学生详细信息
      const scores = Object.keys(student).filter(key => key.match(/^\d{5}$/)).map(term => ({
        term,
        score: parseFloat(student[term])
      }));
      const maxScoreEntry = scores.reduce((max, entry) => entry.score > max.score ? entry : max, scores[0]);
      const minScoreEntry = scores.reduce((min, entry) => entry.score < min.score ? entry : min, scores[0]);
      const avgScore = scores.reduce((total, entry) => total + entry.score, 0) / scores.length;

      this.$store.commit('setSelectedStudent', {
        studentId,
        studentMajor,
        studentGender: student['性别'],
        maxTerm: maxScoreEntry.term,
        maxScore: maxScoreEntry.score,
        minTerm: minScoreEntry.term,
        minScore: minScoreEntry.score,
        avgScore: parseFloat(avgScore.toFixed(2))
      });
    },

    prepareSankeyData() {
      const nodes = [];
      const links = [];
      const termMap = {};
      const terms = new Set();

      // 确保每个分数段在每个学期都有节点，即使没有学生数据
      this.students.forEach(student => {
        Object.keys(student).forEach(key => {
          if (key.match(/^\d{5}$/)) {
            terms.add(key);
            const score = student[key];
            let group;

            if (score < 60) {
              group = 'below60';
            } else {
              group = `${Math.floor(score)}-${Math.floor(score) + 1}`;
            }

            if (!termMap[`${key}-${group}`]) {
              termMap[`${key}-${group}`] = nodes.length;
              nodes.push({ name: `${key}-${group}`, term: key, group });
            }
          }
        });
      });

      // 为所有学期添加所有可能的分数段
      terms.forEach(term => {
        ["below60", ...Array.from({ length: 41 }, (_, i) => `${60 + i}-${61 + i}`)].forEach(group => {
          if (!termMap[`${term}-${group}`]) {
            termMap[`${term}-${group}`] = nodes.length;
            nodes.push({ name: `${term}-${group}`, term, group });
          }
        });
      });

      // 创建学生分数的连线
      this.students.forEach(student => {
        let lastTermGroup = null;
        Object.keys(student).sort().forEach(key => {
          if (key.match(/^\d{5}$/)) {
            const score = student[key];
            let group;

            if (score < 60) {
              group = 'below60';
            } else {
              group = `${Math.floor(score)}-${Math.floor(score) + 1}`;
            }

            const currentTermGroup = `${key}-${group}`;

            if (lastTermGroup !== null) {
              links.push({
                source: termMap[lastTermGroup],
                target: termMap[currentTermGroup],
                value: 1,
                studentId: student['学号'],
                studentMajor: student['专业'],
                sourceScore: parseFloat(student[lastTermGroup.split('-')[0]]),
                targetScore: parseFloat(student[key])
              });
            }
            lastTermGroup = currentTermGroup;
          }
        });
      });

      // 绘制Sankey图
      this.drawSankey({ nodes, links }, terms);

      console.log('Nodes:', nodes);
      console.log('Links:', links);
    },

    drawSankey(graph, terms) {
      const svg = d3.select(this.$refs.sankeySvg),
          width = parseInt(svg.style('width')),
          height = parseInt(svg.style('height')),
          nodeHeight = 9;  // 设置节点的高度

      svg.attr("width", width).attr("height", height);

      const sankeyGenerator = sankey()
          .nodeWidth(15)
          .nodePadding(0)  // 可能需要一些间距以便更好地区分节点
          .extent([[1, 1], [width - 1, height - 1]])
          .iterations(0);

      // 手动计算每个节点的 x0, x1, y0 和 y1
      const termOrder = Array.from(terms).sort();
      const termGroups = ["below60", ...Array.from({ length: 41 }, (_, i) => `${60 + i}-${61 + i}`)];

      graph.nodes.forEach(node => {
        const termIndex = termOrder.indexOf(node.term);
        const groupIndex = termGroups.indexOf(node.group);

        node.x0 = termIndex * (width / termOrder.length);
        node.x1 = node.x0 + sankeyGenerator.nodeWidth();
        // 从底部向上排列，分数低的在底部，高的在顶部
        node.y0 = height - (groupIndex + 1) * (nodeHeight + sankeyGenerator.nodePadding());
        node.y1 = node.y0 + nodeHeight;
      });

      sankeyGenerator(graph);  // 应用手动位置调整

      const node = svg.append("g")
          .selectAll(".node")
          .data(graph.nodes)
          .enter().append("g")
          .attr("class", "node");

      try {
        const vm = this;  // 保存 Vue 实例的引用

        const link = svg.append("g")
            .selectAll(".link")
            .data(graph.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", sankeyLinkHorizontal())
            .attr("stroke-width", d => Math.max(1, d.width))
            .style("stroke", d => {
              if (vm.$store.state.selectedStudentId === d.studentId) {
                return "#ff0000"; // 选中学生
              } else if (vm.$store.state.selectedMajor === d.studentMajor) {
                return "#15a909"; // 选中专业
              } else {
                return "#00b4d8"; // 默认颜色
              }
            })
            .style("fill", "none")
            .style("opacity", d => {
              if (vm.$store.state.selectedStudentId === d.studentId || vm.$store.state.selectedMajor === d.studentMajor) {
                return 1; // 选中学生或专业完全不透明
              } else {
                return 0.05; // 其他线条不透明度
              }
            })
            .on("mouseover", function (event, d) {
              svg.selectAll(".link")
                  .filter(link => link.studentId === d.studentId)
                  .style("opacity", 1)
                  .style("stroke", "#023e8a"); // 鼠标悬停时变黑色且完全不透明

              d3.select(this).append("title")
                  .text(`学号: ${d.studentId} (${d.studentMajor})\n分数变化: ${d.sourceScore.toFixed(2)} -> ${d.targetScore.toFixed(2)}`);
            })
            .on("mouseout", function (event, d) {
              vm.updateLinkStyles(); // 恢复所有线条的颜色和透明度
            })
            .on('click', (event, d) => {
              // 获取学生的详细成绩数据
              const student = this.students.find(student => student['学号'] === d.studentId);

              // 更新 Vuex store，包括学号、专业和成绩
              this.selectStudent(d.studentId, student['专业']);

              this.$store.commit('setSelectedStudentScores', student);

              // 更新所有线条的颜色和透明度
              vm.updateLinkStyles();

              // 更新 tooltip
              if (this.activeTooltip) {
                this.activeTooltip.remove();
                this.activeTooltip = null;
              }

              // 创建新的 tooltip
              this.activeTooltip = d3.select(event.currentTarget).append('title')
                  .text(`学号: ${d.studentId} (${d.studentMajor})\n分数变化: ${d.sourceScore.toFixed(2)} -> ${d.targetScore.toFixed(2)}`);
            });

        link.append("title")
            .text(d => `学号: ${d.studentId} (${d.studentMajor})\n分数变化: ${d.sourceScore.toFixed(2)} -> ${d.targetScore.toFixed(2)}`);

        vm.updateLinkStyles(); // 初始渲染时更新所有线条的颜色和透明度

        node.append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", sankeyGenerator.nodeWidth())
            .style("fill", "#007bff")
            .style("stroke", "rgba(34,140,243,0.39)");

        node.append("text")
            .attr("x", d => (d.x0 + d.x1) / 2)
            .attr("y", d => d.y0 - 5)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("fill", "black")

        // 在节点上添加分数文本
        node.append("title")
            .text(d => {
              if (d.group === 'below60') {
                return `分数: <60`;
              }
              const [lowerBound, upperBound] = d.group.split('-');
              return `分数: ${lowerBound}-${upperBound}`;
            });

        console.log('Sankey Diagram Drawn');
      } catch (error) {
        console.error('Error drawing Sankey diagram:', error);
      }
    }
  }
}
</script>

<style scoped>
.sankey-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh; /* 或其他合适的高度 */
}

.years-container {
  display: flex;
  justify-content: space-around; /* 使标签等距分布 */
  width: 100%; /* 撑满容器宽度 */
}

.years-container span {
  text-align: center; /* 文本居中显示 */
}


svg {
  width: 95%;
  height: 95%;
}

.node rect {
  cursor: pointer;
}

.node text {
  pointer-events: none;
}

.link {
  fill: none;
  stroke: #000;
  stroke-opacity: .2;
  transition: stroke-opacity .3s, stroke .3s;
}
</style>
