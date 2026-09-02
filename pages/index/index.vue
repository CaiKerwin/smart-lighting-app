<template>
	<view :class="themeClass" class="page-wrapper">
		<Menu :menuPos="menuPos"
			  :visible="menuVisible"
			  @close="hideMenu"
			  @select="handleMenuSelect" />
		<!-- 扫码确认弹窗 -->
		<ScanConfirmPopup :visible="scanConfirmVisible" @cancel="handleScanCancel" @confirm="handleScanConfirm" />
		<!-- 顶部头部背景 -->
		<view class="header-section">
			<!-- 导航栏 -->
			<view class="nav-bar">
				<view class="nav-title">{{ $t('index.title') }}</view>
				<view class="nav-right">
					<!-- 夜间/白天模式切换 -->
					<view class="nav-mode" @click="toggleMode">
						<image
							:src="isDarkMode ? '/static/common/light-mode.png' : '/static/common/dark-mode.png'"
							class="mode-icon"
							mode="aspectFit"
						/>
					</view>
					<view class="nav-menu" @click="showMenu()">
						<view :class="{ 'toggle--active': menuVisible }" class="toggle">
							<view class="bar bar--top"></view>
							<view class="bar bar--middle"></view>
							<view class="bar bar--bottom"></view>
						</view>
					</view>
				</view>
			</view>
			<view class="time-text">{{ currentTime }}</view>
			<!-- 天气与温度区域 -->
			<view class="weather-row">
				<view class="weather-left">
					<view class="weather-desc">{{ weatherDesc }}</view>
					<view class="weather-temp">{{ weatherTemperature }}°C</view>
				</view>
				<view class="weather-right">
					<img src="/static/home/cloudy.png" alt="多云" />
				</view>
			</view>
			<!-- 小信息条 -->
			<view class="info-tags">
				<view class="tag-item">
					<img src="/static/home/temperature.png" alt="温度" style="width: 7px; height: 14px;" />
					{{ $t('index.temperature') }} {{ weatherTemperature }}°C
				</view>
				<view class="tag-item">
					<img src="/static/home/pm2.5.png" alt="PM2.5" />
					PM2.5 {{ weatherPm25 }}μg
				</view>
				<view class="tag-item">
					<img src="/static/home/wind-speed.png" alt="风速" />
					{{ $t('index.windSpeed') }} {{ weatherWind }}级
				</view>
			</view>
		</view>

		<!-- 内容主体 -->
		<view class="content-body">
			<!-- 光照信息条 -->
			<view class="sun-tags">
				<view class="sun-item">
					<img src="/static/home/sunrise.png" alt="日出时间" />
					{{ sunriseTime }}
				</view>
				<view class="sun-item">
					<img src="/static/home/sunset.png" alt="日落" />
					{{ sunsetTime }}
				</view>
				<view class="sun-item">
					<img src="/static/home/light-on.png" alt="开灯时间" />
					{{ lightOnTime }}
				</view>
				<view class="sun-item">
					<img src="/static/home/light-off.png" alt="关灯时间" />
					{{ lightOffTime }}
				</view>
			</view>

			<!-- 配电柜 & 单灯 统计 -->
			<view class="card stat-card">
				<view class="card-header">
					<text class="title">{{ $t('index.powerBox') }} {{ stats.pdg.total }}</text>
					<text class="sub-title">{{ $t('index.publicTransformer') }} {{ stats.gb.total }}</text>
					<text class="sub-title">{{ $t('index.specialTransformer') }} {{ stats.zb.total }}</text>
				</view>
				<view class="stat-grid">
					<view class="stat-item" @click="goToPowerboxAlarm">
						<img src="/static/home/normal.png" alt="在线数量" />
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.online') }}</view>
							<view class="stat-val">{{ stats.pdg.online }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToPowerboxAlarm">
						<img src="/static/home/alarm.png" alt="报警数量" />
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.alarm') }}</view>
							<view class="stat-val">{{ stats.pdg.alarm }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToOfflineAlarm">
						<img src="/static/home/offline.png" alt="离线数量" />
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.offline') }}</view>
							<view class="stat-val">{{ stats.pdg.offline }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToPowerboxAlarm">
						<img src="/static/home/repair.png" alt="维修数量" />
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.repair') }}</view>
							<view class="stat-val">{{ stats.pdg.repair }}</view>
						</view>
					</view>
				</view>
			</view>

			<view class="card stat-card">
				<view class="card-header">
					<text class="title">{{ $t('index.singleLight') }} {{ stats.light.total }}</text>
				</view>
				<view class="stat-grid">
					<view class="stat-item" @click="goToLightAlarm">
						<img src="/static/home/normal.png" alt="在线数量" />
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.online') }}</view>
							<view class="stat-val">{{ stats.light.online }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToLightAlarm">
						<img src="/static/home/repair.png" alt="维修数量" />
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.lightOn') }}</view>
							<view class="stat-val">{{ stats.light.lightOn }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToLightAlarm">
						<img src="/static/home/alarm.png" alt="报警数量" />
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.alarm') }}</view>
							<view class="stat-val">{{ stats.light.alarm }}</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 最近7天亮灯率 (折线图) -->
			<view class="card chart-card">
				<view class="chart-header">
					<text class="chart-title">{{ $t('index.lightRateTitle') }}</text>
					<text class="chart-unit">{{ $t('index.unitPercent') }}</text>
				</view>
				<!-- #ifdef H5 -->
				<view ref="lineChartContainer" class="chart-box"></view>
				<!-- #endif -->
				<!-- #ifndef H5 -->
				<view class="chart-box">{{ $t('index.notSupported') }}</view>
				<!-- #endif -->
			</view>

			<!-- 最近7天能耗趋势 (柱状图) -->
			<view class="card chart-card">
				<view class="chart-header">
					<text class="chart-title">{{ $t('index.energyTrendTitle') }}</text>
					<text class="chart-unit">{{ $t('index.unitKwh') }}</text>
				</view>
				<!-- #ifdef H5 -->
				<view ref="barChartContainer" class="chart-box"></view>
				<!-- #endif -->
				<!-- #ifndef H5 -->
				<view class="chart-box">{{ $t('index.notSupported') }}</view>
				<!-- #endif -->
			</view>

			<!-- 底部导航 -->
			<TabBar :current="0" />
		</view>
	</view>
</template>

<script>
import TabBar from "../../components/tabBar.vue";
import Menu from "@/pages/index/components/menu.vue";
import ScanConfirmPopup from "@/pages/index/components/scanConfirmPopup.vue";
import { base64Decode } from "@/utils/common";
import {request} from "@/utils/request";
// #ifdef H5
import * as echarts from "echarts";
// #endif

export default {
	name: 'Index',
	components: {Menu, TabBar, ScanConfirmPopup },
	data() {
		return {
			menuPos: { right: 0, top: 0 },// 菜单位置
			currentTime: '',
			weatherDesc: '',
			weatherTemperature: '',
			weatherPm25: '',
			weatherWind: '',
			//weatherRefreshTimer: null, // 天气刷新
			timer: null,
			sunriseTime: '',
			sunsetTime: '',
			lightOnTime: '',
			lightOffTime: '',
			stats: {
				pdg: { total: 0, online: 0, alarm: 0, offline: 0, repair: 0 },
				gb: { total: 0 },
				zb: { total: 0 },
				light: { total: 0, online: 0, alarm: 0, lightOn: 0 }
			},
			menuVisible: false,
			// 扫码进行中
			isScanning: false,
			// 扫码登录接口提交中
			isSubmitting: false,
			// 扫码确认弹窗
			scanConfirmVisible: false,
			// 待确认的二维码内容
			pendingQrCode: '',
			// #ifdef H5
			// 统计图表属性
			deviceType: '',
			startDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 当天前七天的日期
			endDate: new Date().toISOString().split('T')[0], // 当天的日期
			lineChart: null,
			barChart: null
			// #endif
		}
	},
	onShow() {
		this.updateTime();
		this.timer = setInterval(this.updateTime, 1000);
		this.fetchWeather();
		//this.weatherRefreshTimer = setInterval(this.fetchWeather, 600000);
		this.getSunAndLightTime();
		this.fetchDeviceNum();
	},
	onHide() {
		this.clearTimer();
	},
	onReady() {
		// #ifdef H5
		// 初始化echarts图表
		this.$nextTick(() => {
			this.initCharts();
		});
		// #endif
	},
	beforeDestroy() {
		this.clearTimer();

		// #ifdef H5
		// 销毁echarts图表
		if (this.lineChart) {
			this.lineChart.dispose();
		}
		if (this.barChart) {
			this.barChart.dispose();
		}
		// #endif
	},
	watch: {
		// 切换白天/夜间模式时重新渲染图表，保证图表配色与主题一致
		isDarkMode() {
			// #ifdef H5
			this.$nextTick(() => {
				if (this.lineChart) {
					this.lineChart.dispose();
					this.lineChart = null;
				}
				if (this.barChart) {
					this.barChart.dispose();
					this.barChart = null;
				}
				this.initCharts();
			});
			// #endif
		}
	},
	methods: {
		clearTimer() {
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = null;
			}

			// if (this.weatherRefreshTimer) {
			// 	clearInterval(this.weatherRefreshTimer);
			// 	this.weatherRefreshTimer = null;
			// }
		},
		updateTime() {
			const now = new Date();
			const y = now.getFullYear();
			const m = (now.getMonth() + 1).toString().padStart(2, '0');
			const d = now.getDate().toString().padStart(2, '0');
			const h = now.getHours().toString().padStart(2, '0');
			const min = now.getMinutes().toString().padStart(2, '0');
			const s = now.getSeconds().toString().padStart(2, '0');
			this.currentTime = `${y}年${m}月${d}日 ${h}:${min}:${s}`;
		},
		fetchWeather() {
			/**
			 * {
			 * "token":"4c1f4b0f44194bb1904baba5337dcff0",
			 * "isSuper":true,
			 * "isNewMode":false,
			 * "curApp":"road",
			 * "curCust":629,
			 * "isOwner":false,
			 * "modify":false,
			 * "id":619,
			 * "code":"admin",
			 * "name":"管理员",
			 * "mobile":null,
			 * "clientType":0
			 * }
			 */
			request({
				url: '/station/base/QueryWeather',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				/**
				 * {
				 * "city":"佛山市",
				 * "adcode":"440600",
				 * "weather":"晴",
				 * "temperature":"34",
				 * "winddirection":"北",
				 * "windpower":"≤3",
				 * "humidity":"50",
				 * "reporttime":"2026-07-24 15:00:16"
				 * }
				 */
				const payload = res.data;
				if (payload && payload.data) {
					// 将JSON字符串转换成对象
					const weatherData = JSON.parse(base64Decode(payload.data));
					this.weatherDesc = weatherData.weather;
					this.weatherTemperature = weatherData.temperature;
					this.weatherPm25 = weatherData.humidity;
					this.weatherWind = weatherData.windpower;
				} else {
					console.error('天气数据异常', payload);
				}
			}).catch(err =>{
				console.error('天气数据请求失败', err.message);
			});
		},
		getSunAndLightTime() {
			/**
			 * {"area":"深圳市","lat":22.63056743737606,"lng":114.05829921047837,"open":"-","close":"-","sunRise":"05:53","sunSet":"19:07"}
			 */
			request({
				url: '/station/home/QueryEnv',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.sunriseTime = data.sunRise;
					this.sunsetTime = data.sunSet;
					this.lightOnTime = data.open;
					this.lightOffTime = data.close;
				} else {
					uni.showToast({ title: '获取日出/日落时间和开灯/关灯时间异常', icon: 'none' });
				}
			}).catch(err =>{
				console.error('获取日出/日落时间和开灯/关灯时间错误', err.message);
			});
		},
		fetchDeviceNum() {
			/**
			 * {
			 *   "count": 2,
			 *   "line": 0,
			 *   "powerbox": {
			 *     "total": 2,
			 *     "online": 2,
			 *     "alarm": 0,
			 *     "running": 0,
			 *     "repair": 0,
			 *     "stop": 0,
			 *     "zhuanBian": 0,
			 *     "gongBian": 2
			 *   },
			 *   "light": {
			 *     "total": 122,
			 *     "online": 119,
			 *     "alarm": 0,
			 *     "running": 0,
			 *     "repair": 0,
			 *     "stop": 0,
			 *     "zhuanBian": 0,
			 *     "gongBian": 0
			 *   },
			 *   "pole": {
			 *     "total": 0,
			 *     "online": 0,
			 *     "alarm": 0,
			 *     "running": 0,
			 *     "repair": 0,
			 *     "stop": 0,
			 *     "zhuanBian": 0,
			 *     "gongBian": 0
			 *   },
			 *   "lamp": {
			 *     "total": 122,
			 *     "online": 119,
			 *     "alarm": 0,
			 *     "running": 0,
			 *     "repair": 0,
			 *     "stop": 0,
			 *     "zhuanBian": 0,
			 *     "gongBian": 0
			 *   },
			 *   "tunnel": {
			 *     "total": 0,
			 *     "online": 0,
			 *     "alarm": 0,
			 *     "running": 0,
			 *     "repair": 0,
			 *     "stop": 0,
			 *     "zhuanBian": 0,
			 *     "gongBian": 0
			 *   },
			 *   "channel": {
			 *     "total": 0,
			 *     "online": 0,
			 *     "alarm": 0,
			 *     "running": 0,
			 *     "repair": 0,
			 *     "stop": 0,
			 *     "zhuanBian": 0,
			 *     "gongBian": 0
			 *   }
			 * }
			 */
			request({
				url: '/station/analyse/DeviceTotal',
				method: 'POST',
				data: {}
			}).then(res =>{
				const payload = res.data;
				console.log(base64Decode(payload.data));
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.stats.pdg.total=data.powerbox.total;
					this.stats.pdg.online=data.powerbox.online;
					this.stats.pdg.alarm=data.powerbox.alarm;
					this.stats.pdg.offline=data.powerbox.stop;
					this.stats.pdg.repair=data.powerbox.repair;
					this.stats.gb.total = data.powerbox.gongBian;
					this.stats.zb.total = data.powerbox.zhuanBian;
					this.stats.light.total=data.light.total;
					this.stats.light.online=data.light.online;
					this.stats.light.alarm=data.light.alarm;
					this.stats.light.lightOn=data.light.running;
				} else {
					console.error('统计设备总数异常', payload);
				}
			}).catch(err =>{
				console.error('获取设备总数失败', err.message);
			});
		},
		// #ifdef H5
		getChartDom(refName) {
			const ref = this.$refs[refName];
			if (!ref) return null;
			return ref.$el || ref;
		},
		initCharts() {
			const lineChartContainer = this.getChartDom('lineChartContainer');
			if (!lineChartContainer || !lineChartContainer.nodeType) {
				setTimeout(() => {
					this.initCharts();
				}, 100);
				return;
			}

			// 根据当前主题选择图表配色
			const dark = this.isDarkMode;
			const axisLabelColor = dark ? '#6d7689' : '#999';
			const splitLineColor = dark ? 'rgba(255, 255, 255, 0.08)' : '#eee';
			const symbolColor = dark ? '#1c2130' : '#fff';
			const labelColor = dark ? '#e8ecf4' : '#333';

			//折线图
			if (!this.lineChart) {
				this.lineChart = echarts.init(lineChartContainer);
			}
			const lineChartOptions = {
				tooltip: { trigger: 'axis' },
				grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
				xAxis: {
					type: 'category',
					data: [],
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: { color: axisLabelColor }
				},
				yAxis: {
					type: 'value',
					//name: '%', // 单位
					min: 0,
					max: 100,
					splitLine: { lineStyle: { color: splitLineColor } },
					axisLabel: { color: axisLabelColor }
				},
				series: [{
					data: [],
					type: 'line',
					smooth: true,
					symbol: 'circle',
					symbolSize: 8,
					lineStyle: { color: '#2acf9e', width: 2 },
					itemStyle: { color: symbolColor, borderColor: '#2acf9e', borderWidth: 2 },
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: 'rgba(42, 207, 158, 0.5)' },
							{ offset: 1, color: 'rgba(42, 207, 158, 0.05)' }
						])
					},
					label: {
						show: true,
						position: 'top',
						formatter: (params) => {
							return params.value;
						},
						fontSize: 12,
						color: '#2acf9e'
					}
				}]
			};
			this.lineChart.setOption(lineChartOptions);

			//柱状图
			const barChartContainer = this.getChartDom('barChartContainer');
			if (!this.barChart) {
				this.barChart = echarts.init(barChartContainer);
			}
			const barChartOptions = {
				tooltip: { trigger: 'axis' },
				grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
				xAxis: {
					type: 'category',
					data: [],
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: { color: axisLabelColor }
				},
				yAxis: {
					type: 'value',
					//name: 'kWh', // 单位
					splitLine: { lineStyle: { color: splitLineColor } },
					axisLabel: { color: axisLabelColor }
				},
				series: [{
					data: [],
					type: 'bar',
					barWidth: '30%',
					itemStyle: {
						color: '#4388ff'
					},
					label: {
						show: true,
						position: 'top',
						formatter: (params) => {
							return params.value;
						},
						fontSize: 12,
						color: labelColor
					}
				}]
			};
			this.barChart.setOption(barChartOptions);

			// 获取数据
			this.getLightOnRate();
			this.getEnergyTrend();
		},
		// #endif
		getLightOnRate(){
			/**
			 * [
			 *   {
			 *     "time": "2026-05-17",
			 *     "value": 0
			 *   },
			 *   {
			 *     "time": "2026-05-18",
			 *     "value": 0
			 *   },
			 *   {
			 *     "time": "2026-05-19",
			 *     "value": 0
			 *   },
			 *   {
			 *     "time": "2026-05-20",
			 *     "value": 0
			 *   },
			 *   {
			 *     "time": "2026-05-21",
			 *     "value": 0
			 *   },
			 *   {
			 *     "time": "2026-05-22",
			 *     "value": 0
			 *   }
			 * ]
			 */
			request({
				url: '/station/analyse/LightOnTrend',
				method: 'POST',
				data: {
					start: this.startDate,
					end: this.endDate
				}
			}).then(res => {
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				try {
					if (payload && payload.data) {
						const data = JSON.parse(base64Decode(payload.data));
						if (Array.isArray(data) && data.length > 0) {
							// 提取对应的横坐标（日期号）和纵坐标（亮灯率）
							const xData = data.map(item => item.time.substring(8)); // 截取日期中的天数
							const yData = data.map(item => item.value); // 提取 value

							// 更新折线图
							this.lineChart.setOption({
								xAxis: {data: xData},
								series: [{data: yData}]
							});
						}
					}
				} catch (e) {
					console.error('解析亮灯率数据失败', e.message);
				}
			}).catch(err => {
				console.error('获取亮灯率数据失败', err.message);
			});
		},
		getEnergyTrend() {
			/**
			 * [
			 *   {
			 *     "date": "2025-08-01",
			 *     "pt": 0,
			 *     "pr": 0,
			 *     "energy": 0,
			 *     "rate": 0,
			 *     "money": 0,
			 *     "save": 0
			 *   },
			 *   {
			 *     "date": "2025-08-02",
			 *     "pt": 0,
			 *     "pr": 0,
			 *     "energy": 0,
			 *     "rate": 0,
			 *     "money": 0,
			 *     "save": 0
			 *   },
			 *   {
			 *     "date": "2025-08-03",
			 *     "pt": 0,
			 *     "pr": 0,
			 *     "energy": 0,
			 *     "rate": 0,
			 *     "money": 0,
			 *     "save": 0
			 *   },
			 *   {
			 *     "date": "2025-08-04",
			 *     "pt": 0,
			 *     "pr": 0,
			 *     "energy": 0,
			 *     "rate": 0,
			 *     "money": 0,
			 *     "save": 0
			 *   },
			 *   {
			 *     "date": "2025-08-05",
			 *     "pt": 0,
			 *     "pr": 0,
			 *     "energy": 0,
			 *     "rate": 0,
			 *     "money": 0,
			 *     "save": 0
			 *   }
			 * ]
			 */
			request({
				url: '/station/analyse/EnergyTrend',
				method: 'POST',
				data: {
					deviceType: 'light',
					start: this.startDate,
					end: this.endDate
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));

				const payload = res.data;
				try {
					if (payload && payload.data) {
						const data = JSON.parse(base64Decode(payload.data));
						if (Array.isArray(data) && data.length > 0) {
							// 提取对应的横坐标（日期号）和纵坐标（能耗 energy）
							const xData = data.map(item => item.date.substring(8)); // 截取日期中的天数
							const yData = data.map(item => (item.energy || item.val)); // 提取 energy 值

							// 更新柱状图
							this.barChart.setOption({
								xAxis: { data: xData },
								series: [{ data: yData }]
							});
						}
					}
				} catch (e) {
					console.error('解析能耗趋势数据失败', e.message);
				}
			}).catch(err =>{
				console.error('获取能耗趋势数据失败', err.message);
			});
		},
		showMenu() {
			if (this.menuVisible) {
				this.menuVisible = false;
				return;
			}

			// 获取菜单位置
			const query = uni.createSelectorQuery().in(this);
			query.select('.nav-menu').boundingClientRect(data => {
				if (data) {
					// 获取当前窗口宽度
					const { windowWidth } = uni.getSystemInfoSync();
					// 计算菜单右边缘距离屏幕右边缘的距离
					const rightOffset = windowWidth - data.right;
					// 纵坐标取图标底部 + 间距
					// 横坐标取图标右侧 + 间距
					// 单位px
					// #ifdef H5
					this.menuPos = {
						right: rightOffset + 10,
						top: data.bottom + 40
					};
					// #endif
					// #ifdef MP
					this.menuPos = {
						right: rightOffset + 10,
						top: data.bottom + 0
					};
					// #endif
				}
				this.menuVisible = true;
			}).exec();
		},
		hideMenu() {
			this.menuVisible = false;
		},
		handleMenuSelect(type) {
			this.hideMenu();

			switch (type) {
				case 'qrCode':
					// 扫码登录
					this.handleQrCodeLogin();
					break;
				case 'account':
					uni.navigateTo({ url: '/pages/login/login' });
					break;
				case 'password':
					uni.navigateTo({ url: '/pages/modifyPassword/modifyPassword' });
					break;
				case 'timeTable':
					uni.navigateTo({ url: '/pages/timeTable/timeTable' });
					break;
				case 'platform':
					uni.navigateTo({ url: '/pages/platform/platform' });
					break;
				case 'language':
					uni.showActionSheet({
						itemList: ['简体中文', 'English(United States)'],
						itemColor: '#3880FC',
						success: (res) => {
							const lang = res.tapIndex === 0 ? 'zh-Hans' : 'en';
							uni.setLocale(lang);
							this.$i18n.locale = lang;
							uni.setStorageSync('locale', lang);
						}
					});
					break;
				case 'about':
					uni.navigateTo({ url: '/pages/about/about' });
					break;
				case 'logout':
					uni.showModal({
						title: '提示',
						content: '确定要退出吗？',
						success: (res) => {
							if (res.confirm) {
								uni.reLaunch({ url: '/pages/login/login' });
							}
						}
					});
					break;
			}
		},
		/**
		 * 扫码登录
		 */
		handleQrCodeLogin() {
			// H5端不支持扫码登录
			// #ifndef H5
			if (this.isScanning || this.isSubmitting) {
				return;
			}
			this.isScanning = true;
			uni.scanCode({
				onlyFromCamera: false, // 允许从相册选择
				scanType: ['qrCode'], // 只识别二维码
				success: (res) => {
					const code = res.result || '';
					if (!code) {
						uni.showToast({ title: this.$t('scanLogin.emptyCode'), icon: 'none' });
						return;
					}
					// 扫到二维码后弹出确认弹窗
					this.pendingQrCode = code;
					this.scanConfirmVisible = true;
				},
				fail: (err) => {
					// 用户主动取消扫码时不提示
					const msg = (err && err.errMsg) || '';
					if (!msg.includes('cancel')) {
						uni.showToast({ title: this.$t('scanLogin.scanFail'), icon: 'none' });
					}
				},
				complete: () => {
					this.isScanning = false;
				}
			});
			// #endif
		},
		/**
		 * 确认登录到电脑端
		 */
		handleScanConfirm() {
			this.scanConfirmVisible = false;
			this.submitQrCodeLogin(this.pendingQrCode, true, '');
		},
		/**
		 * 取消登录到电脑端
		 */
		handleScanCancel() {
			this.scanConfirmVisible = false;
			this.submitQrCodeLogin(this.pendingQrCode, false, this.$t('scanLogin.cancelMessage'));
		},
		/**
		 * 提交扫码结果到 LoginQrcode 接口
		 * @param {string} code - 二维码内容
		 * @param {boolean} success - 是否允许网页登录
		 * @param {string} message - 不允许登录时的消息
		 */
		submitQrCodeLogin(code, success, message) {
			if (this.isSubmitting) {
				return;
			}
			this.isSubmitting = true;
			uni.showLoading({ title: this.$t('scanLogin.submitting'), mask: true });

			const finish = () => {
				this.isSubmitting = false;
				uni.hideLoading();
			};

			request({
				url: '/common/auth/LoginQrcode',
				method: 'POST',
				data: {
					code: code,
					success: success,
					message: message
				}
			}).then((res) => {
				finish();
				console.log(res);
				if (res.statusCode === 200) {
					uni.showToast({ title: this.$t('scanLogin.success'), icon: 'success' });
				} else {
					uni.showToast({ title: this.$t('scanLogin.fail'), icon: 'none' });
				}
			}).catch((err) => {
				finish();
				console.error('扫码登录接口调用失败', err);
				uni.showToast({ title: this.$t('scanLogin.networkError'), icon: 'none' });
			});
		},
		goToPowerboxAlarm() {
			uni.navigateTo({ url: '/pages/alarm/components/alarmTypes/alarmPowerbox' });
		},
		goToOfflineAlarm() {
			uni.navigateTo({ url: '/pages/alarm/components/alarmTypes/alarmOffline' });
		},
		goToLightAlarm() {
			uni.navigateTo({ url: '/pages/alarm/components/alarmTypes/alarmLight' });
		},
	}
}
</script>

<style scoped>
.page-wrapper {
	height: 100vh;
	background-color: var(--bg-page, #f8f8f8);
	overflow-y: auto;
	padding-bottom: 120rpx;
}

/* #ifdef H5 || MP-WEIXIN */
/* 悬浮玻璃 tabbar：高 120rpx + 距底 24rpx，底部空白避免遮挡内容 */
.page-wrapper {
	padding-bottom: calc(168rpx + env(safe-area-inset-bottom));
}
/* #endif */

/* --- 顶部区域 --- */
.header-section {
	background: linear-gradient(180deg, #358cfb 0%, #5baaff 100%);
	padding: 10rpx 20rpx 40rpx 20rpx;
	color: #fff;
}

/* 夜间模式：顶部渐变改为深蓝，与暗色界面统一（文字仍为白色） */
.theme-dark .header-section {
	background: linear-gradient(180deg, #1e2f52 0%, #2a3f6b 100%);
}

.nav-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 36rpx;
	font-weight: 500;
}

/* 右侧按钮组：模式切换按钮紧贴菜单按钮 */
.nav-right {
	display: flex;
	align-items: center;
}

/* 白天/夜间模式切换按钮 */
.nav-mode {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 88rpx;
	height: 88rpx;
}

.mode-icon {
	width: 44rpx;
	height: 44rpx;
}

.nav-menu {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 88rpx;
	height: 88rpx;
}

/* --- 汉堡菜单动画 --- */
.toggle {
	position: relative;
	width: 40rpx;
	cursor: pointer;
	display: block;
	height: 34px;
}

.bar {
	position: absolute;
	left: 0;
	right: 0;
	height: 4rpx;
	border-radius: 4rpx;
	background: #fff;
	opacity: 1;
	transition: bottom 0.35s cubic-bezier(.5, -0.35, .35, 1.5),
				top 0.35s cubic-bezier(.5, -0.35, .35, 1.5),
				opacity 0.35s cubic-bezier(.5, -0.35, .35, 1.5),
				transform 0.35s cubic-bezier(.5, -0.35, .35, 1.5);
}

.bar--top {
	bottom: calc(50% + 11rpx + 2rpx);
	/* 关闭菜单时 */
	transition-delay: 0.21s, 0.21s, 0.21s, 0.21s;
}

.bar--middle {
	top: calc(50% - 2rpx);
	transition-delay: 0.105s, 0.105s, 0.105s, 0.105s;
}

.bar--bottom {
	top: calc(50% + 11rpx + 2rpx);
	transition-delay: 0s, 0s, 0s, 0s;
}

/* 菜单展开 */
.toggle--active .bar--top {
	bottom: calc(50% - 2rpx);
	transform: rotate(-135deg);
	transition-delay: 0s, 0s, 0s, 0s;
}

.toggle--active .bar--middle {
	opacity: 0;
	transform: rotate(-135deg);
	transition-delay: 0.105s, 0.105s, 0.105s, 0.105s;
}

.toggle--active .bar--bottom {
	top: calc(50% - 2rpx);
	transform: rotate(-225deg);
	transition-delay: 0.21s, 0.21s, 0.21s, 0.21s;
}

.time-text {
	text-align: center;
	font-size: 14px;
	margin-top: 8px;
	opacity: 0.8;
}

/* --- 天气区域 --- */
.weather-row {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	margin-top: 6px;
	padding-bottom: 10px;
}

.weather-left {
	padding-bottom: 4px;
}

.weather-desc {
	font-size: 28rpx;
	opacity: 0.9;
	margin-bottom: -4px;
}

.weather-temp {
	font-size: 80rpx;
	font-weight: bold;
	line-height: 1.1;
}

.weather-right {
	display: flex;
	align-items: center;
	justify-content: center;
}

.weather-right img {
	width: 80px;
	height: 60px;
	object-fit: contain;
	margin-bottom: -5px;
}

/* --- 小信息标签行 --- */
.info-tags {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 5px 5px;
	margin-bottom: 0;
	font-size: 12px;
	backdrop-filter: blur(4px);
}

.info-tags .tag-item {
	display: flex;
	align-items: center;
}

.info-tags img {
	width: 14px;
	height: 14px;
	display: inline-block;
	margin-right: 4px;
}

/* --- 内容主体 --- */
.content-body {
	padding: 12px;
	margin-top: -20px;
	position: relative;
	z-index: 1;
}

/* --- 光照信息条 --- */
.sun-tags {
	background: var(--bg-card, #fff);
	border-radius: 12px;
	padding: 10px 14px;
	margin-bottom: 12px;
	font-size: 12px;
	color: var(--text-secondary, #666);
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.sun-tags .sun-item {
	display: flex;
	align-items: center;
}

.sun-tags img {
	width: 14px;
	height: 14px;
	display: inline-block;
	margin-right: 4px;
}

/* --- 卡片通用 --- */
.card {
	background: var(--bg-card, #fff);
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.card-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
}

.title {
	font-size: 16px;
	font-weight: bold;
	color: var(--text-primary, #333);
}

.sub-title {
	font-size: 14px;
	color: var(--text-secondary, #666);
}

.stat-grid {
	display: flex;
	flex-wrap: wrap;
}

.stat-item {
	width: 50%;
	display: flex;
	align-items: center;
	margin-bottom: 16px;
}

.stat-item img {
	width: 44px;
	height: 44px;
	flex-shrink: 0;
	display: block;
}

.stat-info {
	display: flex;
	flex-direction: column;
	margin-left: 10px;
}

.stat-label {
	font-size: 12px;
	color: var(--text-tertiary, #888);
}

.stat-val {
	font-size: 16px;
	font-weight: bold;
	color: var(--text-primary, #333);
	margin-top: 2px;
}

/* --- 图表区域 --- */
.chart-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	margin-bottom: 6px;
}

.chart-title {
	font-size: 15px;
	font-weight: bold;
	color: var(--text-primary, #333);
}

.chart-unit {
	font-size: 12px;
	color: var(--text-quaternary, #999);
}

/* #ifdef H5 */
.chart-box {
	position: relative;
	padding-top: 10px;
	width: 100%;
	min-height: 300rpx;
	z-index: 1;
}
/* #endif */

/* #ifndef H5 */
.chart-box {
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	padding-top: 10px;
	width: 100%;
	min-height: 300rpx;
}
/* #endif */
</style>
