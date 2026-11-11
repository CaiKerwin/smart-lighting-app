<template>
	<view :class="themeClass" class="page-wrapper">
		<Menu :visible="menuVisible"
		      @close="hideMenu"
		      @select="handleMenuSelect"/>
		<!-- 扫码确认弹窗 -->
		<ScanConfirmPopup :visible="scanConfirmVisible"
		                  @cancel="handleScanCancel"
		                  @close="handleScanClose"
		                  @confirm="handleScanConfirm"/>
		<!-- 顶部头部背景 -->
		<view class="header-section">
			<!-- 导航栏 -->
			<view class="nav-bar">
				<view class="nav-title" @click="goToAboutPage">{{ $t('index.subtitle') }}</view>
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
						<uni-icons :color="isDarkMode ? '#e8ecf4' : '#ffffff'" size="30" type="bars"/>
					</view>
				</view>
			</view>
			<view class="time-text" @click="showTimeTip()">{{ currentTime }}</view>
			<!-- 天气与温度区域 -->
			<view class="weather-row">
				<view class="weather-left">
					<view class="weather-desc">{{ weatherDesc || '-' }}</view>
					<view class="weather-temp">{{ weatherTemperature || '-' }}°C</view>
				</view>
				<view class="weather-right">
					<img alt="多云" src="/static/home/cloudy.png"/>
				</view>
			</view>
			<!-- 小信息条 -->
			<view class="info-tags">
				<view class="tag-item">
					<img alt="city" src="/static/home/city.png"/>
					{{ city || city2 || '-' }}
				</view>
				<view class="tag-item">
					<img alt="PM2.5" src="/static/home/pm2.5.png"/>
					PM2.5 {{ weatherPm25 || '-' }}μg
				</view>
				<view class="tag-item">
					<img alt="wind speed" src="/static/home/wind-speed.png"/>
					{{ $t('index.windSpeed') }} {{ weatherWind || '-' }}级
				</view>
			</view>
		</view>

		<!-- 内容主体 -->
		<view class="content-body">
			<!-- 光照信息条 -->
			<view class="sun-tags">
				<view class="sun-item">
					<img alt="日出时间" src="/static/home/sunrise.png"/>
					{{ sunriseTime || '-' }}
				</view>
				<view class="sun-item">
					<img alt="日落" src="/static/home/sunset.png"/>
					{{ sunsetTime || '-' }}
				</view>
				<view class="sun-item">
					<img alt="开灯时间" src="/static/home/light-on.png"/>
					{{ lightOnTime || '-' }}
				</view>
				<view class="sun-item">
					<img alt="关灯时间" src="/static/home/light-off.png"/>
					{{ lightOffTime || '-' }}
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
						<img alt="在线数量" src="/static/home/normal.png"/>
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.online') }}</view>
							<view class="stat-val">{{ stats.pdg.online }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToPowerboxAlarm">
						<img alt="报警数量" src="/static/home/alarm.png"/>
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.alarm') }}</view>
							<view class="stat-val">{{ stats.pdg.alarm }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToOfflineAlarm">
						<img alt="离线数量" src="/static/home/offline.png"/>
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.offline') }}</view>
							<view class="stat-val">{{ stats.pdg.offline }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToPowerboxAlarm">
						<img alt="维修数量" src="/static/home/repair.png"/>
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
						<img alt="在线数量" src="/static/home/normal.png"/>
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.online') }}</view>
							<view class="stat-val">{{ stats.light.online }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToLightAlarm">
						<img alt="亮灯数量" src="/static/home/box.png"/>
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.lightOn') }}</view>
							<view class="stat-val">{{ stats.light.lightOn }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToLightAlarm">
						<img alt="报警数量" src="/static/home/alarm.png"/>
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.alarm') }}</view>
							<view class="stat-val">{{ stats.light.alarm }}</view>
						</view>
					</view>
					<view class="stat-item" @click="goToLightAlarm">
						<img alt="亮灯率" src="/static/home/light-on-rate.png"/>
						<view class="stat-info">
							<view class="stat-label">{{ $t('index.lightOnRate') }}</view>
							<view class="stat-val">{{ stats.light.lightOnRate }} %</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 最近7天亮灯率 (折线图)：无数据时不显示 -->
			<view v-if="hasLineData" class="card chart-card">
				<view class="chart-header">
					<text class="chart-title">{{ $t('index.lightRateTitle') }}</text>
					<text class="chart-unit">{{ $t('index.unitPercent') }}</text>
				</view>
				<!-- #ifdef H5 -->
				<view ref="lineChartContainer" class="chart-box"></view>
				<!-- #endif -->
				<!-- #ifndef H5 -->
				<view class="chart-box">
					<echarts-canvas :option="lineChartOption" style="width: 100%; height: 100%; display: block;"></echarts-canvas>
				</view>
				<!-- #endif -->
			</view>

			<!-- 最近7天能耗趋势 (柱状图)：无数据时不显示 -->
			<view v-if="hasBarData" class="card chart-card">
				<view class="chart-header">
					<text class="chart-title">{{ $t('index.energyTrendTitle') }}</text>
					<text class="chart-unit">{{ $t('index.unitKwh') }}</text>
				</view>
				<!-- #ifdef H5 -->
				<view ref="barChartContainer" class="chart-box"></view>
				<!-- #endif -->
				<!-- #ifndef H5 -->
				<view class="chart-box">
					<echarts-canvas :option="barChartOption" style="width: 100%; height: 100%; display: block;"></echarts-canvas>
				</view>
				<!-- #endif -->
			</view>

			<!-- 底部导航 -->
			<TabBar :current="0"/>
		</view>
	</view>
</template>

<script>
import TabBar from "../../components/tabBar.vue";
import Menu from "@/pages/index/components/menu.vue";
import ScanConfirmPopup from "@/pages/index/components/scanConfirmPopup.vue";
import {base64Decode, extractMessage} from "@/utils/common";
import {request} from "@/utils/request";
import {clearSessionCache} from "@/utils/platform";
// #ifndef H5
import EchartsCanvas from "@/components/echartsCanvas.vue";
// #endif
// #ifdef H5
import * as echarts from "echarts";
// #endif

export default {
	name: 'Index',
	components: {
		Menu,
		TabBar,
		ScanConfirmPopup,
		// #ifndef H5
		EchartsCanvas
		// #endif
	},
	data() {
		return {
			currentTime: '',
			city: '',
			city2: '', // city为空时的备选
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
				pdg: {total: 0, online: 0, alarm: 0, offline: 0, repair: 0},
				gb: {total: 0},
				zb: {total: 0},
				light: {total: 0, online: 0, alarm: 0, lightOn: 0, lightOnRate: 0}
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
			// 图表查询日期
			startDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 当天前七天的日期
			endDate: new Date().toISOString().split('T')[0], // 当天的日期
			// 图表数据是否存在：无数据时整块图表不渲染，也不显示空坐标系
			hasLineData: false,
			hasBarData: false,
			lineChartData: {x: [], y: []},
			barChartData: {x: [], y: []},
			// #ifdef H5
			// 统计图表属性
			deviceType: '',
			lineChart: null,
			barChart: null,
			// #endif
			// #ifndef H5
			// 小程序 / App 图表配置
			lineChartOption: {},
			barChartOption: {}
			// #endif
		}
	},
	// #ifndef H5
	created() {
		// 首屏不生成空图表，接口返回数据后再生成配置
		this.refreshMobileCharts();
	},
	// #endif
	onShow() {
		this.updateTime();
		this.timer = setInterval(this.updateTime, 1000);
		this.fetchWeather();
		//this.weatherRefreshTimer = setInterval(this.fetchWeather, 600000);
		this.getSunAndLightTime();
		this.fetchDeviceNum();
		// 进入页面时按当前语言刷新原生导航栏标题
		uni.setNavigationBarTitle({title: this.$t('index.title')})
	},
	onHide() {
		this.clearTimer();
	},
	// 下拉刷新：重新拉取首页数据（天气 / 日出日落 / 设备统计 / 图表）
	onPullDownRefresh() {
		const tasks = [
			this.fetchWeather(),
			this.getSunAndLightTime(),
			this.fetchDeviceNum()
		];
		// 图表数据每次都重新拉取；无数据时对应图表会自动隐藏
		tasks.push(this.getLightOnRate());
		tasks.push(this.getEnergyTrend());
		Promise.all(tasks).then(() => {
			uni.stopPullDownRefresh();
		});
	},
	onReady() {
		// #ifdef H5
		// 拿到图表数据后再初始化，避免先渲染空坐标系
		this.getLightOnRate();
		this.getEnergyTrend();
		// #endif
		// #ifndef H5
		// 页面节点挂载完成后刷新一次配置，确保 App renderjs 也能拿到初始 option
		this.$nextTick(() => {
			this.refreshMobileCharts();
		});
		this.getLightOnRate();
		this.getEnergyTrend();
		// #endif
	},
	beforeDestroy() {
		this.clearTimer();

		// #ifdef H5
		// 销毁echarts图表
		this.unbindBarChartTouch();
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
				this.unbindBarChartTouch();
				if (this.lineChart) {
					this.lineChart.dispose();
					this.lineChart = null;
				}
				if (this.barChart) {
					this.barChart.dispose();
					this.barChart = null;
				}
				if (this.hasLineData) this.initLineChart();
				if (this.hasBarData) this.initBarChart();
			});
			// #endif
			// #ifndef H5
			this.refreshMobileCharts();
			// #endif
		}
	},
	methods: {
		goToAboutPage(){
			uni.navigateTo({url: '/pages/about/about'});
		},
		showTimeTip() {
			uni.showModal({
				title: '温馨提示',
				content: '时间基于本机时区设置，显示的是该时区的本地时间',
				showCancel: false,
				confirmText: '知道了'
			})
		},
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
			return request({
				url: '/station/base/QueryWeather',
				method: 'POST',
				data: {}
			}).then(res => {
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
					this.city = weatherData.city;
				} else {
					console.error('天气数据异常', payload);
				}
			}).catch(err => {
				console.error('天气数据请求失败', err.message);
			});
		},
		getSunAndLightTime() {
			/**
			 * {"area":"深圳市","lat":22.63056743737606,"lng":114.05829921047837,"open":"-","close":"-","sunRise":"05:53","sunSet":"19:07"}
			 */
			return request({
				url: '/station/home/QueryEnv',
				method: 'POST',
				data: {}
			}).then(res => {
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.city2 = data.area;
					this.sunriseTime = data.sunRise;
					this.sunsetTime = data.sunSet;
					this.lightOnTime = data.open;
					this.lightOffTime = data.close;
				} else {
					uni.showToast({title: '获取日出/日落时间和开灯/关灯时间异常', icon: 'none'});
				}
			}).catch(err => {
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
			return request({
				url: '/station/analyse/DeviceTotal',
				method: 'POST',
				data: {
					// 所有分组下的所有站点
					groupId: 0,
					stationId: 0
				}
			}).then(res => {
				const payload = res.data;
				console.log(base64Decode(payload.data));
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.stats.pdg.total = data.powerbox.total;
					this.stats.pdg.online = data.powerbox.online;
					this.stats.pdg.alarm = data.powerbox.alarm;
					this.stats.pdg.offline = Number(data.powerbox.total) - Number(data.powerbox.online);
					this.stats.pdg.repair = data.powerbox.repair;
					this.stats.gb.total = data.powerbox.gongBian;
					this.stats.zb.total = data.powerbox.zhuanBian;
					this.stats.light.total = data.lamp.total;
					this.stats.light.online = data.lamp.online;
					this.stats.light.alarm = data.lamp.alarm;
					this.stats.light.lightOn = data.lamp.running;
					if (this.stats.light.total <= 0) this.stats.light.lightOnRate = 0;
					else this.stats.light.lightOnRate = (Number(data.lamp.running) / Number(data.lamp.total) * 100).toFixed(2);
				} else {
					console.error('统计设备总数异常', payload);
				}
			}).catch(err => {
				console.error('获取设备总数失败', err.message);
			});
		},
		// #ifdef H5
		getChartDom(refName) {
			const ref = this.$refs[refName];
			if (!ref) return null;
			return ref.$el || ref;
		},
		// 有数据时才创建折线图；无数据时模板不渲染图表卡片
		initLineChart() {
			if (!this.hasLineData) return;
			const lineChartContainer = this.getChartDom('lineChartContainer');
			if (!lineChartContainer || !lineChartContainer.nodeType) {
				setTimeout(() => {
					this.initLineChart();
				}, 100);
				return;
			}
			if (!this.lineChart) {
				this.lineChart = echarts.init(lineChartContainer);
			}
			this.lineChart.setOption(this.buildH5LineChartOption(this.lineChartData.x, this.lineChartData.y), true);
		},
		// 有数据时才创建柱状图；无数据时模板不渲染图表卡片
		initBarChart() {
			if (!this.hasBarData) return;
			const barChartContainer = this.getChartDom('barChartContainer');
			if (!barChartContainer || !barChartContainer.nodeType) {
				setTimeout(() => {
					this.initBarChart();
				}, 100);
				return;
			}
			if (!this.barChart) {
				this.barChart = echarts.init(barChartContainer);
			}
			this.barChart.setOption(this.buildH5BarChartOption(this.barChartData.x, this.barChartData.y), true);
			this.bindBarChartTouch();
		},
		// H5 折线图配置：保持原有配色与样式
		buildH5LineChartOption(xData, yData) {
			// 根据当前主题选择图表配色
			const dark = this.isDarkMode;
			const axisLabelColor = dark ? '#6d7689' : '#999';
			const splitLineColor = dark ? 'rgba(255, 255, 255, 0.08)' : '#eee';
			const symbolColor = dark ? '#1c2130' : '#fff';

			return {
				tooltip: {trigger: 'axis'},
				grid: {left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true},
				xAxis: {
					type: 'category',
					data: xData,
					axisLine: {show: false},
					axisTick: {show: false},
					axisLabel: {color: axisLabelColor}
				},
				yAxis: {
					type: 'value',
					//name: '%', // 单位
					min: 0,
					max: 100,
					splitLine: {lineStyle: {color: splitLineColor}},
					axisLabel: {color: axisLabelColor}
				},
				series: [{
					data: yData,
					type: 'line',
					smooth: true,
					symbol: 'circle',
					symbolSize: 8,
					lineStyle: {color: '#2acf9e', width: 2},
					itemStyle: {color: symbolColor, borderColor: '#2acf9e', borderWidth: 2},
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{offset: 0, color: 'rgba(42, 207, 158, 0.5)'},
							{offset: 1, color: 'rgba(42, 207, 158, 0.05)'}
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
		},
		// H5 柱状图配置：保持原有配色与样式
		buildH5BarChartOption(xData, yData) {
			// 根据当前主题选择图表配色
			const dark = this.isDarkMode;
			const axisLabelColor = dark ? '#6d7689' : '#999';
			const splitLineColor = dark ? 'rgba(255, 255, 255, 0.08)' : '#eee';
			const labelColor = dark ? '#e8ecf4' : '#333';

			return {
				tooltip: {trigger: 'axis'},
				grid: {left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true},
				xAxis: {
					type: 'category',
					data: xData,
					axisLine: {show: false},
					axisTick: {show: false},
					axisLabel: {color: axisLabelColor}
				},
				yAxis: {
					type: 'value',
					//name: 'kWh', // 单位
					splitLine: {lineStyle: {color: splitLineColor}},
					axisLabel: {color: axisLabelColor}
				},
				series: [{
					data: yData,
					type: 'bar',
					barWidth: '30%',
					// 默认隐藏数值，点击某根柱子时单选显示该柱子的数值
					selectedMode: 'single',
					itemStyle: {
						color: '#4388ff'
					},
					label: {
						show: false,
						position: 'top',
						formatter: (params) => {
							return params.value;
						},
						fontSize: 12,
						color: labelColor
					},
					select: {
						// 去掉 ECharts 默认的选中描边，仅通过数值标签体现选中状态
						itemStyle: {
							color: '#4388ff',
							borderWidth: 0
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
					}
				}]
			};
		},
		// H5 触摸端兜底
		bindBarChartTouch() {
			if (!this.barChart) return;
			const zr = this.barChart.getZr();
			const painter = zr && zr.painter;
			// 使用 ECharts 的绘制根节点，触摸点坐标与图表内部坐标系保持一致
			const target = painter && typeof painter.getViewportRoot === 'function'
				? painter.getViewportRoot()
				: this.getChartDom('barChartContainer');
			if (!target || this._barTouchTarget === target) return;
			this.unbindBarChartTouch();

			const onTouchStart = (event) => {
				if (!event.touches || event.touches.length !== 1) {
					this._barTouchStart = null;
					return;
				}
				const touch = event.touches[0];
				this._barTouchStart = {x: touch.clientX, y: touch.clientY};
			};
			const onTouchMove = (event) => {
				if (!this._barTouchStart || !event.touches || !event.touches.length) return;
				const touch = event.touches[0];
				// 手指移动超过阈值视为滚动页面，不触发柱子选中
				if (Math.abs(touch.clientX - this._barTouchStart.x) > 8 ||
					Math.abs(touch.clientY - this._barTouchStart.y) > 8) {
					this._barTouchStart = null;
				}
			};
			const onTouchEnd = (event) => {
				const start = this._barTouchStart;
				this._barTouchStart = null;
				if (!start || !event.changedTouches || !event.changedTouches.length) return;
				const touch = event.changedTouches[0];
				const dx = touch.clientX - start.x;
				const dy = touch.clientY - start.y;
				if (Math.sqrt(dx * dx + dy * dy) > 8) return;

				const chart = this.barChart;
				if (!chart || (typeof chart.isDisposed === 'function' && chart.isDisposed())) return;
				// 触摸点相对于绘制根节点的位置，就是 ECharts 内部使用的 zrX / zrY
				const rectTarget = target.querySelector && target.querySelector('canvas')
					? target.querySelector('canvas')
					: target;
				const rect = rectTarget.getBoundingClientRect();
				const eventBase = {
					zrX: touch.clientX - rect.left,
					zrY: touch.clientY - rect.top,
					preventDefault() {},
					stopPropagation() {},
					stopImmediatePropagation() {}
				};
				const handler = chart.getZr().handler;
				handler.dispatch('mousedown', eventBase);
				handler.dispatch('mouseup', eventBase);
				handler.dispatch('click', eventBase);
				// 阻止浏览器在触摸结束后补发 click，避免选中状态被重复切换
				if (event.cancelable) event.preventDefault();
			};
			const onTouchCancel = () => {
				this._barTouchStart = null;
			};

			target.addEventListener('touchstart', onTouchStart, {passive: true});
			target.addEventListener('touchmove', onTouchMove, {passive: true});
			target.addEventListener('touchend', onTouchEnd, {passive: false});
			target.addEventListener('touchcancel', onTouchCancel, {passive: true});
			this._barTouchTarget = target;
			this._barTouchHandlers = {onTouchStart, onTouchMove, onTouchEnd, onTouchCancel};
		},
		unbindBarChartTouch() {
			if (this._barTouchTarget && this._barTouchHandlers) {
				const handlers = this._barTouchHandlers;
				this._barTouchTarget.removeEventListener('touchstart', handlers.onTouchStart);
				this._barTouchTarget.removeEventListener('touchmove', handlers.onTouchMove);
				this._barTouchTarget.removeEventListener('touchend', handlers.onTouchEnd);
				this._barTouchTarget.removeEventListener('touchcancel', handlers.onTouchCancel);
			}
			this._barTouchTarget = null;
			this._barTouchHandlers = null;
			this._barTouchStart = null;
		},
		// #endif
		// #ifndef H5
		// 重新生成小程序 / App 端的图表配置（主题或数据变化时调用）
		refreshMobileCharts() {
			// 没有数据时保持空配置，模板不会渲染图表
			this.lineChartOption = this.hasLineData
				? this.buildLineChartOption(this.lineChartData.x, this.lineChartData.y)
				: {};
			this.barChartOption = this.hasBarData
				? this.buildBarChartOption(this.barChartData.x, this.barChartData.y)
				: {};
		},
		// 折线图配置：与 H5 端保持一致，渐变使用 ECharts 通用的 gradient 对象
		buildLineChartOption(xData, yData) {
			const dark = this.isDarkMode;
			const axisLabelColor = dark ? '#6d7689' : '#999';
			const splitLineColor = dark ? 'rgba(255, 255, 255, 0.08)' : '#eee';
			const symbolColor = dark ? '#1c2130' : '#fff';

			return {
				tooltip: {trigger: 'axis', renderMode: 'richText', confine: true},
				grid: {left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true},
				xAxis: {
					type: 'category',
					data: xData,
					axisLine: {show: false},
					axisTick: {show: false},
					axisLabel: {color: axisLabelColor}
				},
				yAxis: {
					type: 'value',
					min: 0,
					max: 100,
					splitLine: {lineStyle: {color: splitLineColor}},
					axisLabel: {color: axisLabelColor}
				},
				series: [{
					data: yData,
					type: 'line',
					smooth: true,
					symbol: 'circle',
					symbolSize: 8,
					lineStyle: {color: '#2acf9e', width: 2},
					itemStyle: {color: symbolColor, borderColor: '#2acf9e', borderWidth: 2},
					areaStyle: {
						color: {
							type: 'linear',
							x: 0,
							y: 0,
							x2: 0,
							y2: 1,
							colorStops: [
								{offset: 0, color: 'rgba(42, 207, 158, 0.5)'},
								{offset: 1, color: 'rgba(42, 207, 158, 0.05)'}
							]
						}
					},
					label: {
						show: true,
						position: 'top',
						formatter: '{c}',
						fontSize: 12,
						color: '#2acf9e'
					}
				}]
			};
		},
		// 柱状图配置：与 H5 端保持一致
		buildBarChartOption(xData, yData) {
			const dark = this.isDarkMode;
			const axisLabelColor = dark ? '#6d7689' : '#999';
			const splitLineColor = dark ? 'rgba(255, 255, 255, 0.08)' : '#eee';
			const labelColor = dark ? '#e8ecf4' : '#333';

			return {
				tooltip: {trigger: 'axis', renderMode: 'richText', confine: true},
				grid: {left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true},
				xAxis: {
					type: 'category',
					data: xData,
					axisLine: {show: false},
					axisTick: {show: false},
					axisLabel: {color: axisLabelColor}
				},
				yAxis: {
					type: 'value',
					splitLine: {lineStyle: {color: splitLineColor}},
					axisLabel: {color: axisLabelColor}
				},
				series: [{
					data: yData,
					type: 'bar',
					barWidth: '30%',
					// 默认隐藏数值，点击某根柱子时单选显示该柱子的数值
					selectedMode: 'single',
					itemStyle: {
						color: '#4388ff'
					},
					label: {
						show: false,
						position: 'top',
						formatter: '{c}',
						fontSize: 12,
						color: labelColor
					},
					select: {
						// 去掉 ECharts 默认的选中描边，仅通过数值标签体现选中状态
						itemStyle: {
							color: '#4388ff',
							borderWidth: 0
						},
						label: {
							show: true,
							position: 'top',
							formatter: '{c}',
							fontSize: 12,
							color: labelColor
						}
					}
				}]
			};
		},
		// #endif
		// 判断一组统计数据里是否有有效值（全为 0 / 空值时视为无统计数据）
		hasChartValue(values) {
			if (!Array.isArray(values)) return false;
			return values.some(value => {
				if (value === null || value === undefined || value === '') return false;
				const num = Number(value);
				return !isNaN(num) && num !== 0;
			});
		},
		// 清空折线图：无数据时整块图表隐藏
		clearLineChartData() {
			this.lineChartData = {x: [], y: []};
			this.hasLineData = false;
			// #ifdef H5
			if (this.lineChart) {
				this.lineChart.dispose();
				this.lineChart = null;
			}
			// #endif
			// #ifndef H5
			this.lineChartOption = {};
			// #endif
		},
		// 清空柱状图：无数据时整块图表隐藏
		clearBarChartData() {
			this.barChartData = {x: [], y: []};
			this.hasBarData = false;
			// #ifdef H5
			this.unbindBarChartTouch();
			if (this.barChart) {
				this.barChart.dispose();
				this.barChart = null;
			}
			// #endif
			// #ifndef H5
			this.barChartOption = {};
			// #endif
		},
		getLightOnRate() {
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
			return request({
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

							// 接口即使返回日期，但数值全为 0 也视为无统计数据
							if (this.hasChartValue(yData)) {
								this.lineChartData = {x: xData, y: yData};
								this.hasLineData = true;
								// #ifdef H5
								this.$nextTick(() => {
									this.initLineChart();
								});
								// #endif
								// #ifndef H5
								this.lineChartOption = this.buildLineChartOption(xData, yData);
								// #endif
							} else {
								this.clearLineChartData();
							}
						} else {
							// 接口返回空数组：隐藏折线图
							this.clearLineChartData();
						}
					} else {
						// 没有统计数据：隐藏折线图
						this.clearLineChartData();
					}
				} catch (e) {
					console.error('解析亮灯率数据失败', e.message);
					this.clearLineChartData();
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
			return request({
				url: '/station/analyse/EnergyTrend',
				method: 'POST',
				data: {
					deviceType: 'light',
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
							// 提取对应的横坐标（日期号）和纵坐标（能耗 energy）
							const xData = data.map(item => item.date.substring(8)); // 截取日期中的天数
							const yData = data.map(item => (item.energy || item.val)); // 提取 energy 值

							// 接口即使返回日期，但数值全为 0 也视为无统计数据
							if (this.hasChartValue(yData)) {
								this.barChartData = {x: xData, y: yData};
								this.hasBarData = true;
								// #ifdef H5
								this.$nextTick(() => {
									this.initBarChart();
								});
								// #endif
								// #ifndef H5
								this.barChartOption = this.buildBarChartOption(xData, yData);
								// #endif
							} else {
								this.clearBarChartData();
							}
						} else {
							// 接口返回空数组：隐藏柱状图
							this.clearBarChartData();
						}
					} else {
						// 没有统计数据：隐藏柱状图
						this.clearBarChartData();
					}
				} catch (e) {
					console.error('解析能耗趋势数据失败', e.message);
					this.clearBarChartData();
				}
			}).catch(err => {
				console.error('获取能耗趋势数据失败', err.message);
			});
		},
		showMenu() {
			// 抽屉展开时遮罩会覆盖导航栏，这里保留一次切换逻辑以兼容重复触发
			this.menuVisible = !this.menuVisible;
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
					// 清除记住密码留下的本地存储
					uni.removeStorageSync('rememberedLogin');
					uni.navigateTo({url: '/pages/login/login'});
					break;
				case 'password':
					uni.navigateTo({url: '/pages/modifyPassword/modifyPassword'});
					break;
				case 'timeTable':
					uni.navigateTo({url: '/pages/timeTable/timeTable'});
					break;
				case 'platform':
					uni.navigateTo({url: '/pages/platform/platform'});
					break;
				case 'language':
					// 语言切换：统一进入语言选择页（uni-indexed-list）
					uni.navigateTo({url: '/pages/language/language'});
					break;
				case 'about':
					uni.navigateTo({url: '/pages/about/about'});
					break;
				case 'device':
					uni.navigateTo({url: '/pages/operation/components/findDevice'});
					break;
				case 'logout':
					uni.showModal({
						title: '提示',
						content: '确定要退出吗？',
						success: (res) => {
							if (res.confirm) {
								request({
									url: '/common/auth/logout',
									method: 'POST',
									data: {
										token: uni.getStorageSync('authToken') || '' // 从本地存储获取token
									}
								}).then(res => {
									console.log(base64Decode(res.data.data))
									// 清除会话缓存（保留记住的账号密码）
									clearSessionCache();
									setTimeout(() => {
										// 退出后进入登录页
										uni.reLaunch({url: '/pages/login/login'});
									}, 800);
								}).catch(err => {
									console.error('退出登录失败', err.message);
									// 退出接口失败也清除本地会话，避免残留登录态
									clearSessionCache();
									setTimeout(() => {
										uni.reLaunch({url: '/pages/login/login'});
									}, 800);
								});
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
					const code = this.normalizeQrCode(res && res.result);
					if (!code) {
						uni.showToast({title: this.$t('scanLogin.emptyCode'), icon: 'none'});
						return;
					}
					// 电脑端登录二维码的内容是 32 位 GUID（后端 Guid.NewGuid().ToString("N")），
					// 设备码、网页链接等其他二维码直接拒绝，避免误弹登录确认
					if (!this.isLoginQrCode(code)) {
						uni.showToast({title: this.$t('scanLogin.invalidCode'), icon: 'none'});
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
						uni.showToast({title: this.$t('scanLogin.scanFail'), icon: 'none'});
					}
				},
				complete: () => {
					this.isScanning = false;
				}
			});
			// #endif
		},
		/**
		 * 去掉扫码结果中的空白字符（部分机型会带换行）
		 * @param {string} raw - 扫码原始内容
		 * @returns {string}
		 */
		normalizeQrCode(raw) {
			return typeof raw === 'string' ? raw.replace(/\s+/g, '') : '';
		},
		/**
		 * 是否为本平台电脑端登录二维码
		 * 后端 GetQrCode 使用 Guid.NewGuid().ToString("N") 生成 32 位十六进制内容，
		 * 这里同时兼容带连字符的 GUID 写法
		 * @param {string} code - 二维码内容
		 * @returns {boolean}
		 */
		isLoginQrCode(code) {
			return /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(code);
		},
		/**
		 * 确认登录到电脑端
		 */
		handleScanConfirm() {
			if (this.isSubmitting || !this.pendingQrCode) {
				return;
			}
			const code = this.pendingQrCode;
			this.scanConfirmVisible = false;
			this.pendingQrCode = '';
			this.submitQrCodeLogin(code, true, '');
		},
		/**
		 * 取消登录到电脑端：通知电脑端本次登录被拒绝，并提示“已取消”
		 */
		handleScanCancel() {
			if (this.isSubmitting) {
				return;
			}
			const code = this.pendingQrCode;
			this.scanConfirmVisible = false;
			this.pendingQrCode = '';
			if (!code) {
				return;
			}
			this.submitQrCodeLogin(code, false, this.$t('scanLogin.cancelMessage'));
		},
		/**
		 * 点击遮罩关闭弹窗：只关闭本地弹窗，不向电脑端发送取消，
		 * 避免误触导致电脑端正在等待的二维码被作废
		 */
		handleScanClose() {
			if (this.isSubmitting) {
				return;
			}
			this.scanConfirmVisible = false;
			this.pendingQrCode = '';
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
			// 取消是即时操作，先给出“已取消”的反馈；确认才需要“提交中”的 loading
			if (success) {
				uni.showLoading({title: this.$t('scanLogin.submitting'), mask: true});
			} else {
				uni.showToast({title: this.$t('scanLogin.cancelled'), icon: 'none'});
			}

			const finish = () => {
				this.isSubmitting = false;
				if (success) {
					uni.hideLoading();
				}
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
				// 取消登录只用于通知电脑端，无论接口返回什么都只能提示“已取消”
				if (!success) {
					return;
				}
				const payload = res && res.data;
				// HTTP 200 只表示请求到达服务器，业务是否成功必须看响应体 code（0 为成功）
				if (this.isBusinessSuccess(payload)) {
					uni.showToast({title: this.$t('scanLogin.success'), icon: 'success'});
				} else {
					const errMsg = this.getQrLoginErrorMessage(payload) || this.$t('scanLogin.fail');
					uni.showToast({title: errMsg, icon: 'none', duration: 2500});
				}
			}).catch((err) => {
				finish();
				console.error('扫码登录接口调用失败', err);
				// 取消已经提示过，网络异常不再重复提示
				if (success) {
					uni.showToast({title: this.$t('scanLogin.networkError'), icon: 'none'});
				}
			});
		},
		/**
		 * 接口业务是否成功（后端统一 code=0 表示成功）
		 * @param {Object} payload - 响应体
		 * @returns {boolean}
		 */
		isBusinessSuccess(payload) {
			if (!payload || typeof payload !== 'object') {
				return false;
			}
			if (payload.code === undefined || payload.code === null || payload.code === '') {
				return false;
			}
			const code = Number(payload.code);
			// 兼容部分历史接口使用 200 / 20000 作为成功码
			return code === 0 || code === 200 || code === 20000;
		},
		/**
		 * 提取扫码登录失败原因
		 * 后端 ResponseCode.Error 的结构为 { code: 990012, data: "错误原因" }
		 * @param {Object} payload - 响应体
		 * @returns {string}
		 */
		getQrLoginErrorMessage(payload) {
			if (!payload) {
				return '';
			}
			if (typeof payload.data === 'string' && payload.data.trim()) {
				return payload.data.trim();
			}
			return extractMessage(payload);
		},
		goToPowerboxAlarm() {
			uni.navigateTo({url: '/pages/alarm/components/alarmTypes/alarmPowerbox'});
		},
		goToOfflineAlarm() {
			uni.navigateTo({url: '/pages/alarm/components/alarmTypes/alarmOffline'});
		},
		goToLightAlarm() {
			uni.navigateTo({url: '/pages/alarm/components/alarmTypes/alarmLight'});
		},
	}
}
</script>

<style scoped>
.page-wrapper {
	min-height: 100vh;
	background-color: var(--bg-page, #f8f8f8);
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

/* 顶部菜单按钮 */
.nav-menu {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 88rpx;
	height: 88rpx;
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
	padding: 10rpx;
	margin-bottom: 0;
	font-size: 24rpx;
	backdrop-filter: blur(4px);
}

.info-tags .tag-item {
	display: flex;
	align-items: center;
}

.info-tags img {
	width: 32rpx;
	height: 32rpx;
	display: inline-block;
	margin-right: 4px;
}

/* --- 内容主体 --- */
.content-body {
	padding: 12px;
	margin-top: -30px;
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
	position: relative;
	padding-top: 10px;
	width: 100%;
	height: 300rpx;
	z-index: 1;
}

/* #endif */
</style>
