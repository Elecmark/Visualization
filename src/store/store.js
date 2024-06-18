import { createStore } from 'vuex';
import * as d3 from 'd3';
import transfer from './transfer';

export default createStore({
    modules: {
        transfer,
        // 其他模块继续在这里添加...
    },
    state: {
        students: [],
        selectedStudentScores: {},
        averageScores: {},  // 存储每个学期的平均成绩
        majorScores: {},    // 存储各专业各学期的平均成绩
        selectedMajor: null, // 被选中的专业
        selectedStudentId: null,
        selectedStudentMajor: null,
        selectedStudentGender: null,
        selectedStudentMaxTerm: null,
        selectedStudentMaxScore: null,
        selectedStudentMinTerm: null,
        selectedStudentMinScore: null,
        selectedStudentAvgScore: null,

        selectedYear: 2008,  // 默认年份
        totalStudentsByYear: {}, // 存储每个学年的总生源数
        provinceStats: {},  // 存储省份统计数据
        provinceData: [],  // 新增：存储省份成绩数据
        provinceHeatData: {}, // 新增：存储省份每年的生源数热力图数据
        provinceYearlyAverage: {}, // 新增：存储每个省份每个年份的均分
        dataLoaded: false,
    },
    mutations: {
        SET_SELECTED_YEAR(state, year) {
            console.log('Store这里变了:', year);
            state.selectedYear = year;
        },
        SET_STUDENTS(state, payload) {
            state.students = payload;
        },
        SET_AVERAGE_SCORES(state, payload) {
            state.averageScores = payload;
        },
        setSelectedStudent(state, { studentId, studentMajor, studentGender, maxTerm, maxScore, minTerm, minScore, avgScore }) {
            state.selectedStudentId = studentId;
            state.selectedStudentMajor = studentMajor;
            state.selectedStudentGender = studentGender;
            state.selectedStudentMaxTerm = maxTerm;
            state.selectedStudentMaxScore = maxScore;
            state.selectedStudentMinTerm = minTerm;
            state.selectedStudentMinScore = minScore;
            state.selectedStudentAvgScore = avgScore;
        },
        setSelectedStudentScores(state, scores) {
            state.selectedStudentScores = scores;
        },
        SET_MAJOR_SCORES(state, payload) {
            state.majorScores = payload;
        },
        setSelectedMajor(state, major) {
            state.selectedMajor = major;
        },
        // 添加省份统计数据
        SET_PROVINCE_STATS(state, payload) {
            state.provinceStats = payload;
        },
        SET_PROVINCE_DATA(state, payload) {  // 设置省份数据
            state.provinceData = payload;
        },
        SET_PROVINCE_HEAT_DATA(state, data) {
            state.provinceHeatData = data;
        },

        SET_RANKINGS(state, payload) {
            state.rankings = payload;
        },
        SET_DATA_LOADED(state, payload) {
            state.dataLoaded = payload;
        },
        SET_TOTAL_STUDENTS_BY_YEAR(state, { year, count }) {
            state.totalStudentsByYear[year] = count;
        },
        SET_PROVINCE_YEARLY_AVERAGE(state, payload) {
            state.provinceYearlyAverage = payload;
        },

    },
    actions: {
        updateSelectedYear({ commit }, year) {
            commit('SET_SELECTED_YEAR', year);
        },

        fetchAndProcessData({ dispatch }) {
            return dispatch('fetchProvinceData')
                .then(() => dispatch('processProvinceData'))
                .then(() => dispatch('calculateHeatData'))
                .catch(error => {
                    console.error('Failed during fetching and processing data:', error);
                    throw error;  // 再次抛出错误，使得调用者能够捕捉
                });
        },

        fetchStudents({ commit }) {
            d3.json('/json/2012级各学期成绩.json').then(data => {
                commit('SET_STUDENTS', data);
                const termScores = {};
                const majorTermScores = {};

                // 构建每个学期的成绩数组
                data.forEach(student => {
                    Object.keys(student).forEach(key => {
                        if (key.match(/^\d{5}$/)) {
                            if (!termScores[key]) {
                                termScores[key] = [];
                            }
                            termScores[key].push(student[key]);

                            // 为每个专业的每个学期准备数据结构
                            const major = student['专业'];
                            if (!majorTermScores[major]) {
                                majorTermScores[major] = {};
                            }
                            if (!majorTermScores[major][key]) {
                                majorTermScores[major][key] = [];
                            }
                            majorTermScores[major][key].push(student[key]);
                        }
                    });
                });

                // 计算每个学期的平均成绩
                const averageScores = {};
                Object.keys(termScores).forEach(term => {
                    const total = termScores[term].reduce((acc, score) => acc + score, 0);
                    const average = total / termScores[term].length;
                    averageScores[term] = parseFloat(average.toFixed(2));
                });
                commit('SET_AVERAGE_SCORES', averageScores);

                // 计算每个专业每个学期的平均成绩
                const majorScores = {};
                Object.keys(majorTermScores).forEach(major => {
                    majorScores[major] = {};
                    Object.keys(majorTermScores[major]).forEach(term => {
                        const total = majorTermScores[major][term].reduce((acc, score) => acc + score, 0);
                        const average = total / majorTermScores[major][term].length;
                        majorScores[major][term] = parseFloat(average.toFixed(2));
                    });
                });
                commit('SET_MAJOR_SCORES', majorScores);
            }).catch(error => console.error('Error loading the data:', error));
        },
        fetchProvinceData({ commit }) {  // 新增：加载省份数据
            d3.json('/json/省份成绩数据.json').then(data => {
                commit('SET_PROVINCE_DATA', data);
            }).catch(error => console.error('Error loading province data:', error));
        },
        // 加载并处理省份统计数据
        processProvinceData({ commit, state }) {
            d3.json('/json/省份成绩数据.json').then(data => {
                const stats = {};
                const totalStudentsByYear = {};

                data.forEach(item => {
                    const year = item.年级;
                    const province = item.省份;

                    if (!stats[province]) {
                        stats[province] = {};
                    }
                    if (!stats[province][year]) {
                        stats[province][year] = { count: 0, maleCount: 0, totalScore: 0 };
                    }

                    stats[province][year].count++;
                    stats[province][year].totalScore += item.综合成绩;

                    if (!totalStudentsByYear[year]) {
                        totalStudentsByYear[year] = 0;
                    }
                    totalStudentsByYear[year] += 1;  // 计算每年的总生源数

                    if (item.性别 === '男') {
                        stats[province][year].maleCount++;
                    }
                });

                // 计算平均分和性别比例
                Object.keys(stats).forEach(province => {
                    Object.keys(stats[province]).forEach(year => {
                        const stat = stats[province][year];
                        stat.averageScore = stat.totalScore / stat.count;
                        stat.genderRatio = (stat.maleCount / stat.count * 100).toFixed(2) + '% : ' + (100 - (stat.maleCount / stat.count * 100).toFixed(2)) + '%';
                    });
                });

                commit('SET_PROVINCE_STATS', stats);

                Object.entries(totalStudentsByYear).forEach(([year, count]) => {
                    commit('SET_TOTAL_STUDENTS_BY_YEAR', { year, count });
                });

                // 在数据处理完毕后计算排名
                this.dispatch('calculateRankings');

                // 新增：计算省份每年的平均分数据
                const provinceYearlyAverage = {};
                Object.keys(state.provinceStats).forEach(province => {
                    provinceYearlyAverage[province] = {};
                    Object.keys(state.provinceStats[province]).forEach(year => {
                        provinceYearlyAverage[province][year] = state.provinceStats[province][year].averageScore;
                    });
                });

                commit('SET_PROVINCE_YEARLY_AVERAGE', provinceYearlyAverage);

            }).catch(error => console.error('Error processing province data:', error));
        },




        calculateRankings({ commit, state }) {
            const rankings = {};
            Object.keys(state.provinceStats).forEach(province => {
                Object.keys(state.provinceStats[province]).forEach(year => {
                    // 收集所有省份的该年份平均成绩，并确保这些成绩是有效的
                    const scores = Object.entries(state.provinceStats)
                        .map(([provKey, stats]) => {
                            return {
                                province: provKey,
                                score: stats[year] && stats[year].averageScore ? stats[year].averageScore : null
                            };
                        })
                        .filter(item => item.score !== null);  // 仅包括那些有有效平均成绩的省份

                    // 对这些成绩进行排序
                    scores.sort((a, b) => b.score - a.score);

                    // 找到当前省份的排名
                    const rank = scores.findIndex(item => item.province === province) + 1;
                    if (!rankings[province]) {
                        rankings[province] = {};
                    }
                    if (rank > 0) { // 仅当省份在排名中时才记录排名
                        rankings[province][year] = rank;
                    }
                });
            });
            commit('SET_RANKINGS', rankings);
        },

        calculateHeatData({ commit }) {
            d3.json('/json/省份成绩数据.json').then(data => {
                const stats = {};
                const totalStudentsByYear = {};

                data.forEach(item => {
                    const year = item.年级;
                    const province = item.省份;

                    if (!stats[province]) {
                        stats[province] = {};
                    }
                    if (!stats[province][year]) {
                        stats[province][year] = { count: 0, totalScore: 0 };
                    }

                    stats[province][year].count++;
                    stats[province][year].totalScore += item.综合成绩;

                    if (!totalStudentsByYear[year]) {
                        totalStudentsByYear[year] = 0;
                    }
                    totalStudentsByYear[year]++;
                });

                const provinceHeatData = {};
                Object.keys(stats).forEach(province => {
                    Object.keys(stats[province]).forEach(year => {
                        if (!provinceHeatData[year]) {
                            provinceHeatData[year] = {};
                        }

                        const count = stats[province][year].count;
                        const totalStudents = totalStudentsByYear[year];
                        const percentage = (count / totalStudents) * 100;

                        let color;
                        if (percentage > 6) {
                            color = 'rgba(255, 0, 0, 0.8)'; // 深红色
                        } else if (percentage > 5) {
                            color = 'rgba(255, 100, 0, 0.8)'; // 浅红色
                        } else if (percentage > 4) {
                            color = 'rgba(255, 140, 0, 0.8)'; // 橙色
                        } else if (percentage > 3) {
                            color = 'rgba(255, 215, 0, 0.8)'; // 深黄色
                        } else if (percentage > 2) {
                            color = 'rgba(255, 255, 0, 0.8)'; // 黄色
                        } else if (percentage > 1) {
                            color = 'rgba(0, 255, 0, 0.8)'; // 绿色
                        } else {
                            color = 'rgba(0, 191, 255, 0.8)'; // 浅蓝色
                        }

                        provinceHeatData[year][province] = color;
                    });
                });

                commit('SET_PROVINCE_HEAT_DATA', provinceHeatData);
                console.log("Finished calculating heat data", provinceHeatData);
                commit('SET_DATA_LOADED', true);
            }).catch(error => {
                console.error("Error loading or processing province data:", error);
            });
        }




    }
});
