import { csv } from 'd3-fetch';

const state = {
    transferData: [],
    selectedYearForChord: '2011',
    selectedMajor: '',
    courseData: {}
};

const getters = {
    getTransferDataByYear: (state) => (year) => {
        return state.transferData.filter(item => item.NJ === year);
    },
    getOutflowData: (state) => (year, major) => {
        if (!major) return [];

        const yearData = state.transferData.filter(d => d.NJ === year && d.OLD_ZYMC === major);
        const targetCounts = {};

        yearData.forEach(d => {
            if (!targetCounts[d.NEW_ZYMC]) {
                targetCounts[d.NEW_ZYMC] = 0;
            }
            targetCounts[d.NEW_ZYMC] += 1;
        });

        const sortedTargets = Object.keys(targetCounts)
            .map(key => ({ name: key, count: targetCounts[key] }))
            .sort((a, b) => b.count - a.count);

        const top5 = sortedTargets.slice(0, 5);
        const othersCount = sortedTargets.slice(5).reduce((sum, item) => sum + item.count, 0);

        if (othersCount > 0) {
            top5.push({ name: '其他专业', count: othersCount });
        }

        return top5;
    },
    getChordData: (state) => (year) => {
        const yearData = state.transferData.filter(d => d.NJ === year);
        const majorMap = {};
        let index = 0;

        // 计算转出和转入专业的数量
        const majorCount = {};

        yearData.forEach(d => {
            if (!majorMap[d.OLD_ZYMC]) {
                majorMap[d.OLD_ZYMC] = { name: d.OLD_ZYMC, index: index++ };
                majorCount[d.OLD_ZYMC] = { out: 0, in: 0 };
            }
            if (!majorMap[d.NEW_ZYMC]) {
                majorMap[d.NEW_ZYMC] = { name: d.NEW_ZYMC, index: index++ };
                majorCount[d.NEW_ZYMC] = { out: 0, in: 0 };
            }
            majorCount[d.OLD_ZYMC].out += 1;
            majorCount[d.NEW_ZYMC].in += 1;
        });

        const nodes = Object.values(majorMap);

        // 按照KSH来计算数据，每个KSH对应一条数据
        const links = yearData.map(d => ({
            source: majorMap[d.OLD_ZYMC].index,
            target: majorMap[d.NEW_ZYMC].index,
            value: 1,
            ksh: d.KSH  // 保留KSH用于后续处理
        }));

        return { nodes, links, majorCount };
    },
    getSelectedYearForChord: (state) => {
        return state.selectedYearForChord;
    },
    getTop5MajorsByInCount: (state) => (year) => {
        const yearData = state.transferData.filter(d => d.NJ === year);
        const majorInCount = {};

        yearData.forEach(d => {
            if (!majorInCount[d.NEW_ZYMC]) {
                majorInCount[d.NEW_ZYMC] = 0;
            }
            majorInCount[d.NEW_ZYMC] += 1;
        });

        return Object.entries(majorInCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    },
    getCourseOverlapData: (state) => (year, major) => {
        if (!state.courseData[year]) return [];
        const courseData = state.courseData[year];
        const majorCourses = courseData.filter(d => d.ZYMC === major).map(d => d.YHDM);
        const targetCounts = {};

        courseData.forEach(d => {
            if (d.ZYMC !== major && majorCourses.includes(d.YHDM)) {
                if (!targetCounts[d.ZYMC]) {
                    targetCounts[d.ZYMC] = 0;
                }
                targetCounts[d.ZYMC] += 1;
            }
        });

        const sortedTargets = Object.keys(targetCounts)
            .map(key => ({ name: key, count: targetCounts[key] }))
            .sort((a, b) => b.count - a.count);

        return sortedTargets.slice(0, 5);
    },
    getYearlyTransferData: (state) => (major) => {
        const result = [];
        const years = [2011, 2012, 2013, 2014, 2015];

        years.forEach(year => {
            const yearStr = year.toString();
            const yearData = state.transferData.filter(d => d.NJ === yearStr);

            const inCount = yearData.filter(d => d.NEW_ZYMC === major).length;
            const outCount = yearData.filter(d => d.OLD_ZYMC === major).length;


            result.push({ year, inCount, outCount });
        });

        return result;
    }

};


const actions = {
    async fetchTransferData({ commit }) {
        const data = await csv('/public/json/转专业数据.csv');
        commit('setTransferData', data);
    },
    async fetchCourseData({ commit }) {
        const promises = [2011, 2012, 2013, 2014, 2015].map(year =>
            csv(`/public/json/幅图/课程${year}.csv`).then(data => ({ year, data }))
        );
        const results = await Promise.all(promises);
        const courseData = {};
        results.forEach(result => {
            courseData[result.year] = result.data;
        });
        commit('setCourseData', courseData);
    },
    setSelectedYearForChord({ commit }, year) {
        commit('setSelectedYearForChord', year);
    },
    setSelectedMajor({ commit }, major) {
        commit('setSelectedMajor', major);
    },
};

const mutations = {
    setTransferData(state, data) {
        state.transferData = data;
    },
    setCourseData(state, data) {
        state.courseData = data;
    },
    setSelectedYearForChord(state, year) {
        state.selectedYearForChord = year;
    },
    setSelectedMajor(state, major) {
        state.selectedMajor = major;
    },
};


export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
