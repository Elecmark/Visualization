<template>
  <div class="dashboard">
    <div class="left-panel">
      <Panel1 />
      <Panel2 />
      <Panel3 />
    </div>
    <div class="right-panel">
      <Panel4 />
      <Panel5 />
    </div>
  </div>
</template>

<script>
import Panel1 from '../../public/Sgb/Panel1.vue';
import Panel2 from '../../public/Sgb/Panel2.vue';
import Panel3 from '../../public/Sgb/Panel3.vue';
import Panel4 from '../../public/Sgb/Panel4.vue';
import Panel5 from '../../public/Sgb/Panel5.vue';

export default {
  components: {
    Panel1,
    Panel2,
    Panel3,
    Panel4,
    Panel5
  }
}
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: 1fr 2fr;
  height: 92vh;
}
.left-panel, .right-panel {
  display: grid;
  padding: 1vh;
  gap: 1vh;
}
.left-panel {
  grid-template-rows: repeat(3, 1fr);
}
.right-panel {
  grid-template-rows: 2fr 1fr;
}
.panel {
  background-color: #e2e2e2;
  color: #606060;
  padding: 0 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  font-size: 12px;
}
</style>
