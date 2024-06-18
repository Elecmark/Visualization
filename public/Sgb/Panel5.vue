<template>
  <div class="student-info-container">
    <h2>选中学生信息</h2>
    <div v-if="selectedStudentId && selectedStudentMajor">
      <p>学号：{{ selectedStudentId }}</p>
      <p>专业：{{ selectedStudentMajor }}</p>
      <p>性别：{{ selectedStudentGender }}</p>
      <p>最高成绩学期：{{ selectedStudentMaxTerm }} 成绩：{{ selectedStudentMaxScore }}</p>
      <p>最低成绩学期：{{ selectedStudentMinTerm }} 成绩：{{ selectedStudentMinScore }}</p>
      <p>平均成绩：{{ selectedStudentAvgScore }}</p>
    </div>
    <div v-else>
      <p>请在右侧桑基图选择学生</p>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState({
      selectedStudentId: state => state.selectedStudentId,
      selectedStudentMajor: state => state.selectedStudentMajor,
      selectedStudentGender: state => state.selectedStudentGender,
      selectedStudentMaxTerm: state => state.selectedStudentMaxTerm,
      selectedStudentMaxScore: state => state.selectedStudentMaxScore,
      selectedStudentMinTerm: state => state.selectedStudentMinTerm,
      selectedStudentMinScore: state => state.selectedStudentMinScore,
      selectedStudentAvgScore: state => state.selectedStudentAvgScore
    })
  }
}
</script>

<style scoped>
.student-info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  font-size: 16px;
}

h2 {
  margin-bottom: 20px;
}

p {
  margin: 5px 0;
}
</style>
