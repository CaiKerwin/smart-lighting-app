<template>
	<view class="page-wrapper">
		<Menu :visible="menuVisible" @close="hideMenu" @select="handleMenuSelect" />
		<!-- 顶部头部背景 -->
		<view class="header-section">
			<!-- 导航栏 -->
			<view class="nav-bar">
				<view class="nav-title">智慧照明</view>
				<view class="nav-menu" @click="showMenu()">
					<img src="/static/common/more.png" alt="更多" />
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
					温度 {{ weatherTemperature }}°C
				</view>
				<view class="tag-item">
					<img src="/static/home/pm2.5.png" alt="PM2.5" />
					PM2.5 {{ weatherPm25 }} μg
				</view>
				<view class="tag-item">
					<img src="/static/home/wind-speed.png" alt="风速" />
					风速 {{ weatherWind }} 级
				</view>
			</view>
		</view>

		<!-- 内容主体 -->
		<view class="content-body">
			<!-- 光照信息条 -->
			<view class="sun-tags">
				<view class="sun-item">
					<img src="/static/home/sunrise.png" alt="日出时间" />
					5:44
				</view>
				<view class="sun-item">
					<img src="/static/home/sunset.png" alt="日落" />
					19:04
				</view>
				<view class="sun-item">
					<img src="/static/home/light-on.png" alt="开灯时间" />
					19:12
				</view>
				<view class="sun-item">
					<img src="/static/home/light-off.png" alt="关灯时间" />
					05:44
				</view>
			</view>

			<!-- 配电柜 & 单灯 统计 (保持原样) -->
			<view class="card stat-card">
				<view class="card-header">
					<text class="title">配电柜 {{ stats.dg.total }}</text>
					<text class="sub-title">公变 {{ stats.gy.total }}</text>
					<text class="sub-title">专变 {{ stats.zy.total }}</text>
				</view>
				<view class="stat-grid">
					<view class="stat-item">
						<img src="/static/home/normal.png" alt="在线数量" />
						<view class="stat-info">
							<view class="stat-label">在线数量</view>
							<view class="stat-val">{{ stats.dg.online }}</view>
						</view>
					</view>
					<view class="stat-item">
						<img src="/static/home/alarm.png" alt="报警数量" />
						<view class="stat-info">
							<view class="stat-label">报警数量</view>
							<view class="stat-val">{{ stats.dg.alarm }}</view>
						</view>
					</view>
					<view class="stat-item">
						<img src="/static/home/offline.png" alt="离线数量" />
						<view class="stat-info">
							<view class="stat-label">离线数</view>
							<view class="stat-val">{{ stats.dg.offline }}</view>
						</view>
					</view>
					<view class="stat-item">
						<img src="/static/home/repair.png" alt="维修数量" />
						<view class="stat-info">
							<view class="stat-label">维修数量</view>
							<view class="stat-val">{{ stats.dg.repair }}</view>
						</view>
					</view>
				</view>
			</view>

			<view class="card stat-card">
				<view class="card-header">
					<text class="title">单灯 {{ stats.light.total }}</text>
				</view>
				<view class="stat-grid">
					<view class="stat-item">
						<img src="/static/home/normal.png" alt="在线数量" />
						<view class="stat-info">
							<view class="stat-label">在线数量</view>
							<view class="stat-val">{{ stats.light.online }}</view>
						</view>
					</view>
					<view class="stat-item">
						<img src="/static/home/repair.png" alt="维修数量" />
						<view class="stat-info">
							<view class="stat-label">亮灯数量</view>
							<view class="stat-val">{{ stats.light.lightOn }}</view>
						</view>
					</view>
					<view class="stat-item">
						<img src="/static/home/alarm.png" alt="报警数量" />
						<view class="stat-info">
							<view class="stat-label">报警数量</view>
							<view class="stat-val">{{ stats.light.alarm }}</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 最近7天亮灯率 (折线图) -->
			<view class="card chart-card">
				<view class="chart-header">
					<text class="chart-title">最近7天亮灯率</text>
					<text class="chart-unit">单位：%</text>
				</view>
				<view class="chart-box">

				</view>
			</view>

			<!-- 最近7天能耗趋势 (柱状图) -->
			<view class="card chart-card">
				<view class="chart-header">
					<text class="chart-title">最近7天能耗趋势</text>
					<text class="chart-unit">单位：kWh</text>
				</view>
				<view class="chart-box">

				</view>
			</view>

			<!-- 底部导航 -->
			<TabBar :current="0" />
		</view>
	</view>
</template>

<script>
import TabBar from "../../components/tabBar.vue";
import Menu from "@/pages/index/components/menu.vue";
import { base64Decode } from "@/utils/common";

export default {
	name: 'Index',
	components: {Menu, TabBar },
	data() {
		return {
			currentTime: '',
			weatherDesc: '',
			weatherTemperature: '',
			weatherPm25: '',
			weatherWind: '',
			weatherRefreshTimer: null,
			timer: null,
			stats: {
				dg: { total: 236, online: 235, alarm: 1, offline: 1, repair: 0 },
				gy: { total: 151 },
				zy: { total: 85 },
				light: { total: 14574, online: 1, alarm: 88, lightOn: 0 }
			},
			menuVisible: false,
		}
	},
	onShow() {
		this.updateTime();
		this.timer = setInterval(this.updateTime, 1000);
		this.fetchWeather();
		this.weatherRefreshTimer = setInterval(this.fetchWeather, 600000);
	},
	onHide() {
		this.clearTimer();
	},
	beforeDestroy() {
		this.clearTimer();
	},
	methods: {
		clearTimer() {
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = null;
			}

			if (this.weatherRefreshTimer) {
				clearInterval(this.weatherRefreshTimer);
				this.weatherRefreshTimer = null;
			}
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
			uni.request({
				url: 'https://www.amdm.top/api/center/station/base/QueryWeather',
				method: 'POST',
				header: {
					'Content-Type': 'application/json',
					'auth': uni.getStorageSync('authToken'),
					'Custid': String(uni.getStorageSync('curCust')),
					'Lang': 'zh_cn',
					'Apptype': uni.getStorageSync('curApp') || 'road'
				},
				data: {},
				success: (res) => {
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
				},
				fail: (err) => {
					console.error('天气数据请求失败', err.message);
				}
			});
		},

		showMenu() {
			this.menuVisible = !this.menuVisible;
		},
		hideMenu() {
			this.menuVisible = false;
		},
		handleMenuSelect(type) {
			this.hideMenu();

			switch (type) {
				case 'account':
					uni.reLaunch({ url: '/pages/login/login' });
					break;
				case 'password':
					uni.redirectTo({ url: '/pages/modifyPassword/modifyPassword' });
					break;
				case 'platform':
					uni.redirectTo({ url: '/pages/platform/platform' });
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
		}
	}
}
</script>

<style scoped>
.page-wrapper {
	height: 100vh;
	background-color: #f8f8f8;
	overflow-y: auto;
	padding-bottom: 120rpx;
}

/* --- 顶部区域 --- */
.header-section {
	background: linear-gradient(180deg, #358cfb 0%, #5baaff 100%);
	padding: 10px 20px 20px;
	color: #fff;
}

.nav-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 36rpx;
	font-weight: 500;
}

.nav-menu img {
	width: 7rpx;
	height: 28rpx;
	display: block;
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
	background: #fff;
	border-radius: 12px;
	padding: 10px 14px;
	margin-bottom: 12px;
	font-size: 12px;
	color: #666;
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
	background: #fff;
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
	color: #333;
}

.sub-title {
	font-size: 14px;
	color: #666;
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
	color: #888;
}

.stat-val {
	font-size: 16px;
	font-weight: bold;
	color: #333;
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
	color: #333;
}

.chart-unit {
	font-size: 12px;
	color: #999;
}

.chart-box {
	position: relative;
	padding-top: 10px;
	width: 100%;
	height: 300rpx;
}
</style>
