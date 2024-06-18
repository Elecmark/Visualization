<template>
  <div class="chord-container">
    <h3>{{ selectedYearForChord }} 届转专业情况</h3>
    <div class="years-container">
      <span v-for="year in years" :key="year" @click="changeYear(year)">{{ year }}</span>
    </div>
    <div class="timeline-container">
      <input type="range" v-model="year" @input="updateYear" min="2011" max="2015" step="1" list="tickmarks" />
      <datalist id="tickmarks">
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </datalist>
    </div>
    <svg ref="chordSvg"></svg>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import * as d3 from 'd3';

export default {
  computed: {
    ...mapState('transfer', ['selectedMajor']),
    ...mapGetters('transfer', ['getChordData', 'getSelectedYearForChord']),
    chordData() {
      return this.getChordData(this.selectedYearForChord);
    },
    selectedYearForChord() {
      return this.getSelectedYearForChord;
    }
  },
  data() {
    return {
      years: ['2011', '2012', '2013', '2014', '2015'],
      year: 2011 // 设置初始年份为 2011
    };
  },
  watch: {
    selectedYearForChord(newYear, oldYear) {
      if (newYear !== oldYear) {
        this.drawChord();
      }
    },
    year(newYear) {
      this.setSelectedYearForChord(newYear); // 当滑块更新时，同步更新 Vuex 状态
    }
  },
  mounted() {
    this.fetchTransferData().then(() => {
      this.setSelectedYearForChord(2011); // 切换到页面时将选中年份设为 2011
      this.drawChord();
    });
  },
  methods: {
    ...mapActions('transfer', ['fetchTransferData', 'setSelectedYearForChord', 'setSelectedMajor']),
    changeYear(year) {
      this.setSelectedYearForChord(year);
    },
    updateYear() {
      this.setSelectedYearForChord(this.year);
    },
    drawChord() {
      const svg = d3.select(this.$refs.chordSvg),
          width = 800,
          height = 600,
          radius = Math.min(width, height) / 2 - 80;

      svg.selectAll("*").remove(); // 清除之前的图形

      svg.attr("width", width).attr("height", height);

      const g = svg.append("g")
          .attr("transform", `translate(${width / 2},${height / 2})`);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      let { nodes, links, majorCount } = this.chordData;

      // 获取唯一的传入专业和目标专业
      const nodeNames = [...new Set([...links.map(link => nodes[link.source].name), ...links.map(link => nodes[link.target].name)])];
      const indexedNodes = nodeNames.map(name => nodes.find(node => node.name === name));

      // 过滤掉转出或转入为0的节点
      const filteredNodes = indexedNodes.filter(node => majorCount[node.name].in > 0 && majorCount[node.name].out > 0);

      // 创建弦图，每条弦对应一个KSH
      const matrix = filteredNodes.map((_, i) =>
          filteredNodes.map((_, j) => {
            return links.filter(link => link.source === filteredNodes[i].index && link.target === filteredNodes[j].index).length;
          })
      );

      const chord = d3.chord()
          .sortSubgroups(d3.descending)(matrix);

      const ribbon = d3.ribbon()
          .radius(radius - 30);

      g.append("g")
          .attr("class", "ribbons")
          .selectAll("path")
          .data(chord)
          .enter().append("path")
          .attr("class", "ribbon")
          .attr("d", ribbon)
          .attr("fill", d => color(d.source.index)) // 使用传入专业的颜色
          .attr("stroke", d => d3.rgb(color(d.source.index)).darker())
          .on("mouseover", function (event, d) {
            d3.select(this)
                .style("opacity", 1);

            const total = d3.sum(matrix.flat());
            const percentage = ((matrix[d.source.index][d.target.index] / total) * 100).toFixed(2);
            d3.select(this).append("title")
                .text(`从 ${filteredNodes[d.source.index].name} 转到 ${filteredNodes[d.target.index].name}: ${percentage}%`);
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("opacity", 0.3);
            d3.select(this).select("title").remove();
          });

      // 创建节点数据
      const pie = d3.pie()
          .value(d => majorCount[d.name].out)
          .sort(null);

      const arc = d3.arc()
          .innerRadius(radius - 30)
          .outerRadius(radius);

      const arcs = pie(filteredNodes);

      // 绘制节点（饼图部分）
      g.selectAll("path.node")
          .data(arcs)
          .enter().append("path")
          .attr("class", "node")
          .attr("d", arc)
          .attr("fill", d => color(d.index)) // 使用转出专业的颜色
          .attr("stroke", d => d3.rgb(color(d.index)).darker())
          .on("mouseover", function (event, d) {
            d3.select(this)
                .style("opacity", 0.67);

            // 显示节点名称和人数占比
            const inPercentage = ((majorCount[d.data.name].in / d3.sum(Object.values(majorCount).map(mc => mc.in))) * 100).toFixed(2);
            const outPercentage = ((majorCount[d.data.name].out / d3.sum(Object.values(majorCount).map(mc => mc.out))) * 100).toFixed(2);
            d3.select(this).append("title")
                .text(`${d.data.name}: 转出 ${majorCount[d.data.name].out} 人 (${outPercentage}%), 转入 ${majorCount[d.data.name].in} 人 (${inPercentage}%)`);
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("opacity", 1);
            d3.select(this).select("title").remove();
          })
          .on('click', (event, d) => {
            this.setSelectedMajor(d.data.name); // 选中专业
            this.updateChordStyles(filteredNodes, color);
          });

      this.updateChordStyles(filteredNodes, color);
    },

    updateChordStyles(filteredNodes, color) {
      const svg = d3.select(this.$refs.chordSvg);
      svg.selectAll("path.node")
          .style("fill", d => {
            if (this.selectedMajor === d.data.name) {
              return "#ff0000"; // 选中专业
            } else {
              return color(d.index); // 默认颜色
            }
          })
          .style("opacity", d => {
            if (this.selectedMajor === d.data.name) {
              return 1; // 选中专业完全不透明
            } else {
              return 1; // 其他弦不透明度
            }
          });
      svg.selectAll("path.ribbon")
          .style("fill", d => {
            if (this.selectedMajor === filteredNodes[d.source.index].name || this.selectedMajor === filteredNodes[d.target.index].name) {
              return "#ff0000"; // 选中专业
            }
          })
          .style("opacity", d => {
            if (this.selectedMajor === filteredNodes[d.source.index].name || this.selectedMajor === filteredNodes[d.target.index].name) {
              return 1;
            } else {
              return 0.3;
            }
          })
          .style("stroke", d => d3.rgb(color(d.source.index)).darker());
    }
  }
}
</script>

<style scoped>
.chord-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 65vh;
}

.years-container {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: -5vh;
}

.timeline-container {
  width: 80%;
  text-align: center;
}

input[type="range"] {
  width: 100%;
}

svg {
  display: block;
  margin: 0 auto;
}

path {
  cursor: pointer;
}

text {
  pointer-events: none;
}

path {
  fill-opacity: 0.67;
  transition: stroke-opacity .3s, stroke .3s;
}
</style>
