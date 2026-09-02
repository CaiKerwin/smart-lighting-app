<template>
	<view :class="themeClass" class="time-table-container">
		<TimeTableCenter :initialTab="currentTab" @change="onTabChange" />

		<!-- 时间表列表 -->
		<view class="time-table-list">
			<view
				v-for="(item, index) in timeTableList"
				:key="item.id"
				class="time-table-item"
			>
				<view class="item-name">{{ item.name }}</view>
				<view class="item-btn" @click="viewTimeTable(item)">查看</view>
			</view>
		</view>
	</view>
</template>

<script>
import TimeTableCenter from "@/pages/timeTable/components/timeTableCenter.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	components: {TimeTableCenter},
	data() {
		return {
			// 当前选中的标签，默认为 '全部'
			currentTab: "全部",
			// 存储各类时间表数据，键名需与 timeTableCenter 中的 allTabs 保持一致
			timeTableData: {
				'全部': [],
				'常规年表': [],
				'8051B时间表': [],
				'集中器年表': [],
				'单灯计时日表': [],
				'单灯准时日表': [],
				'115B准时日表': [],
				'照度日表': [],
				'智联信通': []
			}
		};
	},
	computed: {
		// 根据当前标签计算需要展示的列表
		timeTableList() {
			if (this.currentTab === '全部') {
				// 合并所有非 '全部' 的列表
				const all = [];
				for (const type in this.timeTableData) {
					if (type !== '全部') {
						all.push(...this.timeTableData[type]);
					}
				}
				return all;
			} else {
				return this.timeTableData[this.currentTab] || [];
			}
		}
	},
	onLoad() {
		// 页面加载时并行获取所有时间表列表
		this.getCommonYearTimeTableList();
		this.get8051BTimeTableList();
		this.getMonitorTimeTableList();
		this.getLightTimerTimeTableList();
		this.getLightAccurateTimeTableList();
		this.get115BAccurateTimeTableList();
		this.getLightIntensityTimeTableList();
		this.getZhiLianXinTongTimeTableList();
	},
	methods: {
		onTabChange(tab) {
			this.currentTab = tab;
		},
		// 获取常规年表列表
		getCommonYearTimeTableList() {

			/**
			 * [
			 *   {
			 *     "id": 2,
			 *     "name": "公司测试",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 8,
			 *     "name": "zhj测试",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 12,
			 *     "name": "白天亮灯",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 13,
			 *     "name": "xxx",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 15,
			 *     "name": "天水经纬",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 16,
			 *     "name": "演示",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 17,
			 *     "name": "常闭表",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 243,
			 *     "name": "App常规年表",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-19 16:27:28"
			 *   },
			 *   {
			 *     "id": 253,
			 *     "name": "汕头",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-30 14:23:44"
			 *   },
			 *   {
			 *     "id": 258,
			 *     "name": "xxxx",
			 *     "isDefault": false,
			 *     "createTime": "2023-01-05 08:53:34"
			 *   },
			 *   {
			 *     "id": 423,
			 *     "name": "6038老化",
			 *     "isDefault": false,
			 *     "createTime": "2023-05-23 10:15:05"
			 *   },
			 *   {
			 *     "id": 424,
			 *     "name": "6038-1",
			 *     "isDefault": false,
			 *     "createTime": "2023-05-23 17:59:01"
			 *   },
			 *   {
			 *     "id": 1035,
			 *     "name": "李-测试-全亮",
			 *     "isDefault": false,
			 *     "createTime": "2025-05-20 09:22:02"
			 *   },
			 *   {
			 *     "id": 1055,
			 *     "name": "李-测试-全灭",
			 *     "isDefault": false,
			 *     "createTime": "2025-06-19 15:51:50"
			 *   },
			 *   {
			 *     "id": 1384,
			 *     "name": "cheng",
			 *     "isDefault": false,
			 *     "createTime": "2026-05-30 14:09:42"
			 *   }
			 * ]
			 */
			request({
				url: '/station/plan/QueryCommonYearList',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.timeTableData['常规年表'] = data.map(item => ({
						id: item.id,
						name: item.name,
						type: '常规年表'
					}));
				} else {
					this.timeTableData['常规年表'] = [];
					uni.showToast({ title: '获取时间表列表异常', icon: 'none' });
				}
			}).catch(err =>{
				this.timeTableData['常规年表'] = [];
				console.error('获取常规年表列表错误', err.message);
			});

		},
		// 获取8051B时间表
		get8051BTimeTableList() {
			/**
			 * [
			 *   {
			 *     "id": 58,
			 *     "name": "李测试表",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 246,
			 *     "name": "App北京时间表",
			 *     "isDefault": false,
			 *     "createTime": "2022-12-20 15:29:57"
			 *   },
			 *   {
			 *     "id": 333,
			 *     "name": "测试0324",
			 *     "isDefault": false,
			 *     "createTime": "2023-03-24 11:43:28"
			 *   },
			 *   {
			 *     "id": 361,
			 *     "name": "全取用表",
			 *     "isDefault": false,
			 *     "createTime": "2023-04-12 15:38:23"
			 *   },
			 *   {
			 *     "id": 607,
			 *     "name": "常合表",
			 *     "isDefault": false,
			 *     "createTime": "2023-09-01 01:57:12"
			 *   },
			 *   {
			 *     "id": 891,
			 *     "name": "公司演示箱时间表",
			 *     "isDefault": false,
			 *     "createTime": "2024-12-20 14:29:08"
			 *   },
			 *   {
			 *     "id": 1049,
			 *     "name": "常灭时间表",
			 *     "isDefault": false,
			 *     "createTime": "2025-06-16 16:36:17"
			 *   },
			 *   {
			 *     "id": 1465,
			 *     "name": "演示",
			 *     "isDefault": false,
			 *     "createTime": "2026-08-15 11:14:50"
			 *   }
			 * ]
			 */
			request({
				url: '/station/plan/QueryBjYearList',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.timeTableData['8051B时间表'] = data.map(item => ({
						id: item.id,
						name: item.name,
						type: '8051B时间表'
					}));
				} else {
					this.timeTableData['8051B时间表'] = [];
					uni.showToast({ title: '获取8051B时间表异常', icon: 'none' });
				}
			}).catch(err =>{
				this.timeTableData['8051B时间表'] = [];
				console.error('获取8051B时间表错误', err.message);
			})
		},
		// 获取集中器年表列表
		getMonitorTimeTableList() {
			/**
			 * [
			 *   {
			 *     "id": 227,
			 *     "name": "集中器年表1",
			 *     "type": 5,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 248,
			 *     "name": "App集中器年表",
			 *     "type": 5,
			 *     "createTime": "2022-12-21 16:48:40"
			 *   },
			 *   {
			 *     "id": 1349,
			 *     "name": "1",
			 *     "type": 5,
			 *     "createTime": "2026-04-27 23:03:23"
			 *   }
			 * ]
			 */
			request({
				url: '/station/plan/QueryMonitorList',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.timeTableData['集中器年表'] = data.map(item => ({
						id: item.id,
						name: item.name,
						type: '集中器年表'
					}));
				} else {
					this.timeTableData['集中器年表'] = [];
					uni.showToast({ title: '获取集中器年表异常', icon: 'none' });
				}
			}).catch(err =>{
				this.timeTableData['集中器年表'] = [];
				console.error('获取集中器年表错误', err.message);
			});
		},
		// 获取单灯计时日表
		getLightTimerTimeTableList() {
			/**
			 * [
			 *   {
			 *     "id": 313,
			 *     "name": "TEST-2",
			 *     "type": 6,
			 *     "createTime": "2023-03-09 11:31:16"
			 *   },
			 *   {
			 *     "id": 460,
			 *     "name": "联动测试----现场表",
			 *     "type": 6,
			 *     "createTime": "2023-06-06 10:21:58"
			 *   },
			 *   {
			 *     "id": 701,
			 *     "name": "全亮",
			 *     "type": 6,
			 *     "createTime": "2023-12-18 16:17:30"
			 *   },
			 *   {
			 *     "id": 763,
			 *     "name": "N706测试计时表 白天亮 晚上灭",
			 *     "type": 6,
			 *     "createTime": "2024-05-13 14:58:16"
			 *   },
			 *   {
			 *     "id": 829,
			 *     "name": "印_计时日表0",
			 *     "type": 6,
			 *     "createTime": "2024-10-15 17:08:40"
			 *   },
			 *   {
			 *     "id": 911,
			 *     "name": "全灭",
			 *     "type": 6,
			 *     "createTime": "2025-01-03 14:56:59"
			 *   },
			 *   {
			 *     "id": 981,
			 *     "name": "周洪蛟_8011_计时时间表",
			 *     "type": 6,
			 *     "createTime": "2025-03-31 18:33:58"
			 *   },
			 *   {
			 *     "id": 1071,
			 *     "name": "色温计时_周洪蛟",
			 *     "type": 6,
			 *     "createTime": "2025-06-27 18:34:48"
			 *   },
			 *   {
			 *     "id": 1072,
			 *     "name": "115B_周洪蛟",
			 *     "type": 6,
			 *     "createTime": "2025-06-27 18:39:38"
			 *   },
			 *   {
			 *     "id": 1387,
			 *     "name": "循环调光",
			 *     "type": 6,
			 *     "createTime": "2026-06-03 10:23:58"
			 *   },
			 *   {
			 *     "id": 1388,
			 *     "name": "2",
			 *     "type": 6,
			 *     "createTime": "2026-06-03 15:42:38"
			 *   }
			 * ]
			 */
			request({
				url: '/station/plan/QueryLight6List',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.timeTableData['单灯计时日表'] = data.map(item => ({
						id: item.id,
						name: item.name,
						type: '单灯计时日表'
					}));
				} else {
					this.timeTableData['单灯计时日表'] = [];
					uni.showToast({ title: '获取单灯计时日表异常', icon: 'none' });
				}
			}).catch(err =>{
				this.timeTableData['单灯计时日表'] = [];
				console.error('获取单灯计时日表错误', err.message);
			});
		},
		// 获取单灯准时日表
		getLightAccurateTimeTableList() {
			/**
			 * [
			 *   {
			 *     "id": 101,
			 *     "name": "准时日表1",
			 *     "type": 7,
			 *     "createTime": "2022-12-08 10:28:23"
			 *   },
			 *   {
			 *     "id": 242,
			 *     "name": "准时日表App",
			 *     "type": 7,
			 *     "createTime": "2022-12-19 15:25:37"
			 *   },
			 *   {
			 *     "id": 312,
			 *     "name": "准时表-办公室测试",
			 *     "type": 7,
			 *     "createTime": "2023-03-09 11:16:01"
			 *   },
			 *   {
			 *     "id": 505,
			 *     "name": "临时准时表-1",
			 *     "type": 7,
			 *     "createTime": "2023-06-29 11:38:35"
			 *   },
			 *   {
			 *     "id": 566,
			 *     "name": "联动准时表---现场",
			 *     "type": 7,
			 *     "createTime": "2023-08-10 16:31:20"
			 *   },
			 *   {
			 *     "id": 721,
			 *     "name": "贺友清测试",
			 *     "type": 7,
			 *     "createTime": "2024-01-22 17:46:06"
			 *   },
			 *   {
			 *     "id": 756,
			 *     "name": "白天亮晚上暗",
			 *     "type": 7,
			 *     "createTime": "2024-05-06 17:21:10"
			 *   },
			 *   {
			 *     "id": 758,
			 *     "name": "N706 测试准时表 白天亮 晚上灭",
			 *     "type": 7,
			 *     "createTime": "2024-05-10 10:33:53"
			 *   },
			 *   {
			 *     "id": 772,
			 *     "name": "N706 试验",
			 *     "type": 7,
			 *     "createTime": "2024-05-25 11:27:35"
			 *   },
			 *   {
			 *     "id": 820,
			 *     "name": "全亮",
			 *     "type": 7,
			 *     "createTime": "2024-09-27 15:47:10"
			 *   },
			 *   {
			 *     "id": 830,
			 *     "name": "印_准时日表20241015",
			 *     "type": 7,
			 *     "createTime": "2024-10-15 17:08:56"
			 *   },
			 *   {
			 *     "id": 1027,
			 *     "name": "李-测试-全灭",
			 *     "type": 7,
			 *     "createTime": "2025-05-08 14:06:59"
			 *   },
			 *   {
			 *     "id": 1057,
			 *     "name": "李-测试-全亮",
			 *     "type": 7,
			 *     "createTime": "2025-06-19 15:54:56"
			 *   }
			 * ]
			 */
			request({
				url: '/station/plan/QueryLight7List',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.timeTableData['单灯准时日表'] = data.map(item => ({
						id: item.id,
						name: item.name,
						type: '单灯准时日表'
					}));
				} else {
					this.timeTableData['单灯准时日表'] = [];
					uni.showToast({ title: '获取单灯准时日表异常', icon: 'none' });
				}
			}).catch(err =>{
				this.timeTableData['单灯准时日表'] = [];
				console.error('获取单灯准时日表错误', err.message);
			});
		},
		// 获取115B准时日表
		get115BAccurateTimeTableList() {
			/**
			 * [
			 *   {
			 *     "id": 827,
			 *     "name": "测试11",
			 *     "type": 8,
			 *     "createTime": "2024-10-14 09:35:53"
			 *   },
			 *   {
			 *     "id": 969,
			 *     "name": "888",
			 *     "type": 8,
			 *     "createTime": "2025-03-18 14:49:06"
			 *   },
			 *   {
			 *     "id": 976,
			 *     "name": "App-115B-A",
			 *     "type": 8,
			 *     "createTime": "2025-03-25 17:05:15"
			 *   },
			 *   {
			 *     "id": 980,
			 *     "name": "周洪蛟_8011时间表",
			 *     "type": 8,
			 *     "createTime": "2025-03-31 18:30:15"
			 *   },
			 *   {
			 *     "id": 1000,
			 *     "name": "李测试-全灭",
			 *     "type": 8,
			 *     "createTime": "2025-04-17 09:58:15"
			 *   },
			 *   {
			 *     "id": 1056,
			 *     "name": "李测试-全亮",
			 *     "type": 8,
			 *     "createTime": "2025-06-19 15:53:54"
			 *   },
			 *   {
			 *     "id": 1063,
			 *     "name": "115B_周洪蛟",
			 *     "type": 8,
			 *     "createTime": "2025-06-20 18:42:56"
			 *   },
			 *   {
			 *     "id": 1070,
			 *     "name": "色温准时_周洪蛟",
			 *     "type": 8,
			 *     "createTime": "2025-06-27 18:34:04"
			 *   },
			 *   {
			 *     "id": 1326,
			 *     "name": "ly1025",
			 *     "type": 8,
			 *     "createTime": "2026-04-02 17:51:01"
			 *   }
			 * ]
			 */
			request({
				url: '/station/plan/QueryLight8List',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.timeTableData['115B准时日表'] = data.map(item => ({
						id: item.id,
						name: item.name,
						type: '115B准时日表'
					}));
				} else {
					this.timeTableData['115B准时日表'] = [];
					uni.showToast({ title: '获取115B准时日表异常', icon: 'none' });
				}
			}).catch(err =>{
				this.timeTableData['115B准时日表'] = [];
				console.error('获取115B准时日表错误', err.message);
			});
		},
		// 获取照度日表
		getLightIntensityTimeTableList() {
			/**
			 * [
			 *   {
			 *     "id": 1258,
			 *     "name": "照度测试",
			 *     "type": 9,
			 *     "createTime": "2026-01-12 11:36:29"
			 *   }
			 * ]
			 */
			request({
				url: '/station/plan/QueryLight9List',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.timeTableData['照度日表'] = data.map(item => ({
						id: item.id,
						name: item.name,
						type: '照度日表'
					}));
				} else {
					this.timeTableData['照度日表'] = [];
					uni.showToast({ title: '获取照度日表异常', icon: 'none' });
				}
			}).catch(err =>{
				this.timeTableData['照度日表'] = [];
				console.error('获取照度日表错误', err.message);
			});
		},
		// 获取智联信通时间表
		getZhiLianXinTongTimeTableList() {
			/**
			 * [
			 *   {
			 *     "id": 1259,
			 *     "name": "11122121",
			 *     "type": 10,
			 *     "createTime": "2026-01-12 11:36:48"
			 *   }
			 * ]
			 */
			request({
				url: '/station/plan/QueryLight10List',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.timeTableData['智联信通'] = data.map(item => ({
						id: item.id,
						name: item.name,
						type: '智联信通'
					}));
				} else {
					this.timeTableData['智联信通'] = [];
					uni.showToast({ title: '获取智联信通时间表异常', icon: 'none' });
				}
			}).catch(err =>{
				this.timeTableData['智联信通'] = [];
				console.error('获取智联信通时间表错误', err.message);
			});
		},
		// 根据时间表类型查看时间表详情
		viewTimeTable(item) {
			const type = item && item.type;
			switch (type) {
				// 根据时间表id和名称跳转详情页
				case '常规年表':
					uni.navigateTo({
						url: `/pages/timeTable/components/timeTableTypes/commonYearTimeTable?id=${item.id}&name=${encodeURIComponent(item.name || '')}`
					})
					break;
				case '8051B时间表':
					uni.navigateTo({ url: `/pages/timeTable/components/timeTableTypes/8051BTimeTable?id=${item.id}&name=${encodeURIComponent(item.name || '')}` })
					break;
				case '集中器年表':
					uni.navigateTo({ url: `/pages/timeTable/components/timeTableTypes/monitorTimeTable?id=${item.id}&name=${encodeURIComponent(item.name || '')}` })
					break;
				case '单灯计时日表':
					uni.navigateTo({ url: `/pages/timeTable/components/timeTableTypes/lightTimerTimeTable?id=${item.id}&name=${encodeURIComponent(item.name || '')}` })
					break;
				case '单灯准时日表':
					uni.navigateTo({ url: `/pages/timeTable/components/timeTableTypes/lightAccurateTimeTable?id=${item.id}&name=${encodeURIComponent(item.name || '')}` })
					break;
				case '115B准时日表':
					uni.navigateTo({ url: `/pages/timeTable/components/timeTableTypes/115BAccurateTimeTable?id=${item.id}&name=${encodeURIComponent(item.name || '')}` })
					break;
				case '照度日表':
					uni.navigateTo({ url: `/pages/timeTable/components/timeTableTypes/lightIntensityTimeTable?id=${item.id}&name=${encodeURIComponent(item.name || '')}` })
					break;
				case '智联信通':
					uni.navigateTo({ url: `/pages/timeTable/components/timeTableTypes/zhiLianXinTongTimeTable?id=${item.id}&name=${encodeURIComponent(item.name || '')}` })
					break;
				default:
					console.log('未知时间表类型：', type);
					uni.showToast({ title: '未知时间表类型', icon: 'none' });
					break;
			}
		}
	},
}
</script>

<style lang="scss" scoped>
.time-table-container {
	/* 使用全局 --bg-page 变量，昼夜自动切换 */
	background-color: var(--bg-page);
	min-height: 100vh;
}

/* 列表容器 */
.time-table-list {
	padding: 20rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

/* 单个列表项卡片 */
.time-table-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	background-color: var(--bg-card);
	border: 1rpx solid var(--border-color);
	padding: 30rpx 24rpx;
	border-radius: 16rpx;
}

/* 左侧时间表名称 */
.item-name {
	font-size: 30rpx;
	color: var(--text-primary);
	font-weight: 500;
}

/* 右侧查看按钮 */
.item-btn {
	background-color: #3A7BF7;
	color: #FFFFFF;
	padding: 10rpx 32rpx;
	border-radius: 8rpx;
	font-size: 26rpx;
}
</style>
