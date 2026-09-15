<!-- 水浸站点详情界面 -->
<template>
	<view :class="themeClass" class="station-detail-container">
		<!-- 顶部区域 -->
		<view class="header">
			<label class="checkbox-label" @tap="toggleSelectAll">
				<checkbox :checked="isAllSelected" color="#007aff" style="transform: scale(0.7);" />
				<text class="title">总数 {{ deviceList.length }}</text>
			</label>
		</view>

		<!-- 水浸设备卡片列表 -->
		<view class="device-list">
			<view
				v-for="(item, index) in deviceList"
				:key="item.id"
				:class="['device-card', { 'card-selected': isSelected(item.id) }]"
				:style="isSelected(item.id) ? 'border-color:#007aff' : 'border-color:transparent'"
				@tap="toggleCardSelection(item.id)"
			>
				<!-- 卡片头部 -->
				<view class="card-header">
					<text class="device-name">{{ item.name }}</text>
					<text :class="{ online: item.online }" class="device-status">
						{{ item.online ? '在线' : '离线' }}
					</text>
				</view>

				<!-- 卡片主体 -->
				<view class="card-body">
					<!-- 左侧水柱特效 -->
					<view class="water-gauge-wrapper">
						<!-- 刻度数值 -->
						<view class="gauge-labels">
							<text
								v-for="(mark, idx) in scaleMarks"
								:key="idx"
								:style="{ top: (2 + (idx / 6) * 96) + '%' }"
								class="scale-text"
							>
								{{ mark }}
							</text>
						</view>

						<!-- 水柱容器 -->
						<view class="gauge-tube">
							<!-- 刻度线 -->
							<view
								v-for="(tick, idx) in tickMarks"
								:key="'tick' + idx"
								:class="{ 'tick-major': tick.major }"
								:style="{ top: tick.top + '%' }"
								class="tick"
							/>

							<!-- 水位填充 -->
							<view :style="{ height: calculateWaterHeight(item.level) }" class="water-fill">
								<view class="water-wave" />
							</view>
						</view>
					</view>

					<!-- 右侧数据展示 -->
					<view class="data-grid">
						<!-- 电压 -->
						<view class="grid-row">
							<text class="row-label title">电压</text>
							<text class="row-val" />
						</view>
						<view class="grid-row">
							<text class="row-label sub">外接</text>
							<text class="row-val">{{ item.voltageAc }} V</text>
						</view>
						<view class="grid-row">
							<text class="row-label sub">电池</text>
							<text class="row-val">{{ item.voltageBat }} V</text>
						</view>
						<!-- 水位 -->
						<view class="grid-row">
							<text class="row-label title">水位</text>
							<text class="row-val" />
						</view>
						<view class="grid-row">
							<text class="row-label sub">基础</text>
							<text class="row-val">{{ item.baseLevel }} cm</text>
						</view>
						<view class="grid-row">
							<text class="row-label sub">实际</text>
							<text class="row-val">{{ item.level }} cm</text>
						</view>
						<view class="grid-row">
							<text class="row-label sub">测量</text>
							<text class="row-val highlight">{{ item.result }} cm</text>
						</view>
						<view class="grid-row">
							<text class="row-label sub">速度</text>
							<text class="row-val">{{ item.speed }}</text>
						</view>
						<!-- 报警 -->
						<view class="grid-row">
							<text class="row-label title">报警</text>
							<text class="row-val">{{ item.alarm ? '是' : '否' }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部固定按钮操作区 -->
		<view class="footer-actions">
			<view v-for="(type, idx) in actionButtons"
				  :key="idx" class="action-btn"
				  @click="sendWaterCommands(type)"
			>
				{{ type }}
			</view>
		</view>

		<!-- 设置报警阈值弹窗 -->
		<SetAlarmValuePopup
			:visible="alarmPopupVisible"
			@close="alarmPopupVisible = false"
			@confirm="onAlarmPopupConfirm"
		/>

		<!-- 设置自动校时参数弹窗 -->
		<SetTimeParamsPopup
			:visible="timePopupVisible"
			@close="timePopupVisible = false"
			@confirm="onTimePopupConfirm"
		/>

		<!-- 指令发送结果弹窗（操作列表） -->
		<CommandResultPopup
			:list="commandResults"
			:visible="resultPopupVisible"
			@close="resultPopupVisible = false"
		/>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode, hasOperation} from "@/utils/common";
import WebSocketManager from '@/utils/webSocket.js';
// 指令弹窗组件
import SetAlarmValuePopup from "../popup/waterCommands/setAlarmValuePopup.vue";
import SetTimeParamsPopup from "../popup/waterCommands/setTimeParamsPopup.vue";
import CommandResultPopup from "@/pages/operation/components/popup/common/commandResultPopup.vue";

export default {
	name: 'stationThree',
	components: {
		SetAlarmValuePopup,
		SetTimeParamsPopup,
		CommandResultPopup
	},
	data() {
		return {
			stationId: 0, // 站点Id
			groupId: 0, // 所在分组Id
			selectedIds: [], // 存储选中的设备ID
			deviceList: [],
			maxLevel: 30, // 刻度最大值
			actionButtons: [
				'召测', '查询时钟', '查报警阈值', '查校时参数',
				'查设备信息', '校准时钟', '设报警阈值', '设校时参数'
			],

			// 指令弹窗
			alarmPopupVisible: false,    // 设置报警阈值弹窗
			timePopupVisible: false,     // 设置自动校时参数弹窗

			// 指令发送结果（操作列表弹窗）
			commandResults: [],          // [{ id, name, status }]
			resultPopupVisible: false,
			pendingCmdRows: {},          // cmdId -> commandResults 行下标

			// WebSocket
			wsManager: null              // WebSocket 管理器实例
		};
	},
	computed: {
		// 判断是否全选
		isAllSelected() {
			return this.deviceList.length > 0 && this.selectedIds.length === this.deviceList.length;
		},
		// 动态计算刻度值
		scaleMarks() {
			const marks = [];
			const step = this.maxLevel / 6;
			for (let i = 0; i < 7; i++) {
				let val = this.maxLevel - (step * i);
				if (val % 1 !== 0) {
					val = parseFloat(val.toFixed(1));
				}
				marks.push(val);
			}
			return marks;
		},
		// 刻度线
		tickMarks() {
			const ticks = [];
			const total = 30; // 30 段 = 31 条刻度线
			for (let i = 0; i <= total; i++) {
				ticks.push({
					major: i % 5 === 0,
					top: 2 + (i / total) * 96 // 2% ~ 98%，上下各留一点余量
				});
			}
			return ticks;
		}
	},
	onLoad(options) {
		this.stationId = Number(options.stationId);
		if (isNaN(this.stationId)) this.stationId = options.stationId;
		this.groupId = Number(options.groupId) || 0;

		this.boxName = options.boxName ? decodeURIComponent(options.boxName) : '';
		// 标题显示站点名
		if (this.boxName) {
			uni.setNavigationBarTitle({ title: this.boxName });
		}
		this.getWaterDeviceList();

		// 建立 WebSocket 连接（指令回执 + 水浸数据实时更新）
		this.connectSocket();
	},
	// 下拉刷新
	onPullDownRefresh(){
		this.getWaterDeviceList();
	},
	onUnload() {
		if (this.wsManager) {
			this.wsManager.close();
			this.wsManager = null;
		}
	},
	methods: {
		// 判断单个卡片是否被选中
		isSelected(id) {
			return this.selectedIds.some(item => String(item) === String(id));
		},

		// 切换单个卡片选中状态
		toggleCardSelection(id) {
			const idx = this.selectedIds.findIndex(item => String(item) === String(id));
			idx > -1 ? this.selectedIds.splice(idx, 1) : this.selectedIds.push(id);
		},

		// 切换全选
		toggleSelectAll() {
			if (this.isAllSelected) {
				this.selectedIds = [];
			} else {
				this.selectedIds = this.deviceList.map(item => item.id);
			}
		},

		// 动态计算水柱高度
		calculateWaterHeight(level) {
			let ratio = level / this.maxLevel;
			if (ratio > 1) ratio = 1;
			if (ratio < 0) ratio = 0;
			if (ratio === 0) return '4rpx';
			return `${ratio * 96}%`;
		},

		// 获取水浸设备列表
		getWaterDeviceList() {
			/**
			 * [
			 *   {
			 *     "id": "18ea35f883cc4aba864534c9eec145c4",
			 *     "stationId": 3687,
			 *     "stationName": "水位监测",
			 *     "poleId": "12d67322108348f49144908ca2bce653",
			 *     "poleName": null,
			 *     "name": "App测试水浸",
			 *     "code": "B0180F00",
			 *     "baseLevel": 0,
			 *     "iccid": null,
			 *     "imei": null,
			 *     "hardware": null,
			 *     "software": null,
			 *     "fireTime": "0001-01-01 00:00:00",
			 *     "voltageAc": 0,
			 *     "voltageBat": 0,
			 *     "level": 0,
			 *     "speed": 0,
			 *     "result": 0,
			 *     "online": false,
			 *     "alarm": false
			 *   },
			 *   {
			 *     "id": "0fe93d8d8d304582927c828170d8e2be",
			 *     "stationId": 3687,
			 *     "stationName": "水位监测",
			 *     "poleId": "70cd12f6e14d4b4a826c73f19b895bd8",
			 *     "poleName": null,
			 *     "name": "测试2",
			 *     "code": "B0180EF0",
			 *     "baseLevel": 0,
			 *     "iccid": null,
			 *     "imei": null,
			 *     "hardware": null,
			 *     "software": null,
			 *     "fireTime": "0001-01-01 00:00:00",
			 *     "voltageAc": 0,
			 *     "voltageBat": 0,
			 *     "level": 0,
			 *     "speed": 0,
			 *     "result": 0,
			 *     "online": false,
			 *     "alarm": false
			 *   }
			 * ]
			 */
			uni.showLoading({
				title: '加载中...',
				mask: true
			});
			request({
				url: '/station/water/QueryGaugeStateList',
				method: 'POST',
				data: {
					groupId: this.groupId,
					stationId: this.stationId
				}
			}).then(res => {
				const payload = res.data;
				if (payload && payload.data) {
					this.deviceList = JSON.parse(base64Decode(payload.data));
				}
			}).catch(err => {
				console.error('获取水浸设备列表失败', err.message);
				uni.showToast({title: '获取水浸设备列表失败', icon: 'none'})
			}).finally(() => {
				uni.hideLoading();
				uni.stopPullDownRefresh();
			});
		},
		/*  ==================== 底部指令操作 ====================  */
		// 已选中的水浸设备
		getSelectedDevices() {
			return this.deviceList.filter(item => this.selectedIds.includes(item.id));
		},
		// dco 权限校验
		checkDco() {
			if (!hasOperation('dco')) {
				uni.showToast({title: '你没有权限', icon: 'none'});
				return false;
			}
			return true;
		},
		// 统一前置校验：必须选中水浸设备
		preCheckCommand() {
			if (!this.getSelectedDevices().length) {
				uni.showToast({title: '请先选择关联设备', icon: 'none'});
				return false;
			}
			return true;
		},
		// 底部操作按钮统一入口
		sendWaterCommands(type) {
			// 校验：未选择设备时，无法执行
			if (!this.preCheckCommand()) return;
			switch (type) {
				case '召测':
					this.confirmAndSend('forceRead', '是否执行召测命令？');
					break;
				case '查询时钟':
					this.confirmAndSend('getclock', '是否执行查询时钟命令？');
					break;
				case '查报警阈值':
					this.confirmAndSend('getAlarmRange', '是否执行查报警阈值命令？');
					break;
				case '查校时参数':
					this.confirmAndSend('getClockArgs', '是否执行查校时参数命令？');
					break;
				case '查设备信息':
					this.confirmAndSend('getInfo', '是否执行查设备信息命令？');
					break;
				case '校准时钟':
					this.confirmAndSend('setclock', '是否执行校准时钟命令？');
					break;
				case '设报警阈值':
					// 设报警阈值需要 dco 设备操作权限
					if (!this.checkDco()) return;
					this.alarmPopupVisible = true;
					break;
				case '设校时参数':
					// 设校时参数需要 dco 设备操作权限
					if (!this.checkDco()) return;
					this.timePopupVisible = true;
					break;
			}
		},
		// 确认框 → 发送指令
		confirmAndSend(code, content) {
			uni.showModal({
				title: '提示',
				content: content,
				confirmText: '确定',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) this.sendWaterCommand(code, {});
				}
			});
		},
		// 设置报警阈值弹窗确认 → setAlarmRange
		onAlarmPopupConfirm(args) {
			this.alarmPopupVisible = false;
			this.sendWaterCommand('setAlarmRange', args);
		},
		// 设置自动校时参数弹窗确认 → setClockArgs
		onTimePopupConfirm(args) {
			this.timePopupVisible = false;
			this.sendWaterCommand('setClockArgs', args);
		},
		// 发送水浸指令
		sendWaterCommand(code, args) {
			const devices = this.getSelectedDevices();
			if (!devices.length) return;
			const ids = devices.map(device => device.id);
			this.pendingCmdRows = {};
			uni.showLoading({title: '发送中...', mask: true});

			request({
				url: '/station/water/SendCommand',
				method: 'POST',
				data: {
					code: code,          // 命令码
					list: ids,           // 水浸设备 id 列表
					checkUserId: 0,      // 固定为 0
					args: args || {}     // 指令参数
				}
			}).then(res => {
				uni.hideLoading();
				const rows = this.buildCommandRows(devices, res);
				if (!rows.length) {
					uni.showToast({title: '指令发送失败', icon: 'none'});
					return;
				}
				this.commandResults = rows;
				this.resultPopupVisible = true;
			}).catch(err => {
				uni.hideLoading();
				console.error('发送水浸指令失败', err.message);
				uni.showToast({title: '指令发送失败', icon: 'none'});
			});
		},
		// 发送结果 → 操作列表行（成功时记录 cmdId，等待 WebSocket 回执更新状态）
		buildCommandRows(devices, res) {
			const payload = res ? res.data : null;
			// 请求级失败（网络异常 / 业务错误码）→ 全部标记失败
			const failedMsg = (!payload || (payload.code !== undefined && payload.code !== null && payload.code !== 0))
				? (payload ? (this.decodeErrorMessage(payload) || '指令发送失败') : '指令发送失败')
				: '';
			const data = failedMsg ? null : this.parseResponseData(res);
			const list = data && Array.isArray(data.list) ? data.list : [];

			const rows = devices.map((device, index) => {
				const row = {
					id: device.id,
					name: device.name || '-',
					status: '正在执行...',
					cmdIds: [],
					failed: ''
				};
				if (failedMsg) {
					row.failed = failedMsg;
					return row;
				}
				const item = this.pickCommandItem(list, device.id, index);
				const success = item ? (item.success !== undefined ? item.success : item.isSuccess) : false;
				if (!success) {
					row.failed = (item && item.message) || '指令发送失败';
					return row;
				}
				// message 即 cmdId，用于匹配后续 WebSocket 回执
				if (item.message) row.cmdIds.push(item.message);
				return row;
			});

			rows.forEach((row, index) => {
				if (row.failed) {
					row.status = row.failed;
					row.cmdIds = [];
					return;
				}
				if (!row.cmdIds.length) {
					row.status = '指令发送失败';
					return;
				}
				// 登记 cmdId → 行下标，等待 WebSocket 回执更新状态
				row.cmdIds.forEach(cmdId => {
					this.pendingCmdRows[cmdId] = index;
				});
			});

			return rows;
		},
		// 从发送结果中取当前设备对应的条目：优先按 id 匹配，其次按顺序匹配
		pickCommandItem(list, deviceId, index) {
			if (!Array.isArray(list) || !list.length) return null;
			const matched = list.filter(item => item && String(item.id) === String(deviceId));
			if (matched.length) return matched[0];
			return list.length > index ? list[index] : null;
		},
		// 解析响应 payload.data
		parseResponseData(res) {
			const body = res && res.data;
			if (!body) return null;
			let data = body.data;
			if (typeof data === 'string') {
				try {
					data = JSON.parse(base64Decode(data));
				} catch (e) {
					console.error('解析接口数据失败', e);
					return null;
				}
			}
			return data;
		},
		// 解析接口业务错误信息
		decodeErrorMessage(payload) {
			let msg = payload.msg || payload.message || '';
			const data = payload.data;
			if (typeof data === 'string' && data) {
				// 形似 Base64 的字符串先尝试解码
				if (/^[A-Za-z0-9+/=]+$/.test(data)) {
					const decoded = base64Decode(data);
					if (decoded) msg = decoded;
				}
				if (!msg) msg = data;
			}
			// 解码结果本身是 JSON（形如 {"code":500,"msg":"..."}）时取出其中的提示信息
			if (typeof msg === 'string' && msg.charAt(0) === '{') {
				try {
					const parsed = JSON.parse(msg);
					if (parsed && typeof parsed === 'object') msg = parsed.msg || parsed.message || msg;
				} catch (e) {
					// 非 JSON 时按原文返回
				}
			}
			return String(msg || '');
		},
		// 解析 getclock 回执 content 中的设备当前时间
		extractNowTime(content) {
			const data = this.parseSocketContent(content);
			return (data && data.nowTime) || '';
		},

		/*  ==================== WebSocket 指令回执与实时更新 ====================  */
		// 建立 WebSocket 连接
		connectSocket() {
			if (this.wsManager) return;
			this.wsManager = new WebSocketManager({
				onOpen: () => {},
				onMessage: (data) => this.handleSocketMessage(data),
				onError: (err) => console.error('websocket错误', err),
				onClose: () => {}
			});
			this.wsManager.connect();
		},
		// 消息分发：cmd 指令回执 / water 水浸数据推送
		handleSocketMessage(data) {
			let msg = data;
			if (typeof msg === 'string') {
				try {
					msg = JSON.parse(msg);
				} catch (e) {
					return;
				}
			}
			if (!msg || !msg.type) return;
			if (msg.type === 'cmd') {
				this.handleCommandResult(msg);
			} else if (msg.type === 'water') {
				this.handleWaterPush(msg);
			}
		},
		// content 可能是对象，也可能是 JSON 字符串
		parseSocketContent(content) {
			if (!content) return null;
			if (typeof content === 'string') {
				try {
					return JSON.parse(content);
				} catch (e) {
					return null;
				}
			}
			return typeof content === 'object' ? content : null;
		},
		// 指令回执：按 cmdId 更新「操作列表」对应条目
		handleCommandResult(msg) {
			// 回执 content 带水浸实时数据时（如召测），先刷新对应设备卡片
			this.updateDeviceBySocket(this.parseSocketContent(msg.content));

			const rowIndex = this.pendingCmdRows[msg.commandId];
			if (rowIndex === undefined || rowIndex === null) return;
			const status = Number(msg.status);
			// 2 已发送 / 4 执行中 / 5 已重发：保持「正在执行...」
			if (status !== 7 && status !== 8 && status !== 9) return;
			const row = this.commandResults[rowIndex];
			if (!row) return;
			delete this.pendingCmdRows[msg.commandId];

			let text;
			if (status === 9) {
				text = '执行成功';
				// 查询时钟成功回执：显示设备当前时间
				if (msg.cmdCode === 'getclock') {
					const nowTime = this.extractNowTime(msg.content);
					if (nowTime) text = '设备当前时间：' + nowTime;
				}
			} else if (status === 7) {
				text = '指令超时';
			} else {
				text = '执行失败';
			}
			this.$set(this.commandResults, rowIndex, Object.assign({}, row, {status: text}));
		},
		// 水浸数据推送：命中本页设备 → 更新卡片实时数据
		handleWaterPush(msg) {
			const source = (msg.data && typeof msg.data === 'object') ? msg.data : msg;
			this.updateDeviceBySocket(source);
		},
		// 用水浸推送/回执数据刷新对应设备卡片（仅覆盖推送中携带的字段）
		updateDeviceBySocket(source) {
			if (!source || typeof source !== 'object' || Array.isArray(source)) return;
			const index = this.findDeviceIndex(source.id, source.code);
			if (index < 0) return;
			const row = this.deviceList[index];
			if (!row) return;
			const fields = ['fireTime', 'voltageAc', 'voltageBat', 'level', 'speed', 'baseLevel', 'result', 'online', 'alarm'];
			const merged = Object.assign({}, row);
			let changed = false;
			fields.forEach(key => {
				if (source[key] !== undefined && source[key] !== null) {
					merged[key] = source[key];
					changed = true;
				}
			});
			if (!changed) return;
			this.$set(this.deviceList, index, merged);
		},
		// 本页列表中查找水浸设备下标
		// 推送/回执中的 id 可能是设备 id，也可能是通信 id（code），两者都尝试匹配
		findDeviceIndex(...keys) {
			const values = keys.filter(key => key !== undefined && key !== null && key !== '');
			for (const value of values) {
				const index = this.deviceList.findIndex(item =>
					String(item.id) === String(value) || (item.code && String(item.code) === String(value))
				);
				if (index > -1) return index;
			}
			return -1;
		}
	}
}
</script>

<style lang="scss" scoped>
.station-detail-container {
	min-height: 100vh;
	background-color: var(--bg-page, #f4f5f9);
	padding: 24rpx;
	padding-bottom: 280rpx;
	box-sizing: border-box;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	transition: background-color 0.3s ease;
}

/* 顶部区域 */
.header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	padding: 10rpx 0;

	.checkbox-label {
		display: flex;
		align-items: center;
		background-color: var(--bg-accent, #eef4ff);
		padding: 8rpx 20rpx 8rpx 10rpx;
		border-radius: 12rpx;
		transition: background-color 0.3s ease;

		.title {
			font-size: 28rpx;
			color: var(--text-primary, #333);
			margin-left: 8rpx;
		}
	}
}

/* 设备列表：两列布局 */
.device-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
}

/* 设备卡片 */
.device-card {
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	padding: 24rpx;
	box-sizing: border-box;
	border: 4rpx solid transparent;
	transition: border-color 0.2s ease, background-color 0.3s ease;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.04));

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
		padding-bottom: 16rpx;
		border-bottom: 1px solid var(--border-color, #f0f0f0);

		.device-name {
			font-size: 30rpx;
			font-weight: bold;
			color: var(--text-primary, #333);
			white-space: nowrap;
			text-overflow: ellipsis;
			max-width: 160rpx;
		}

		.device-status {
			font-size: 26rpx;
			color: var(--text-quaternary, #999);

			&.online {
				color: var(--color-success, #07c160);
			}
		}
	}

	.card-body {
		display: flex;
		justify-content: space-between;
		align-items: stretch; /* 关键：让左右两侧等高 */

		/* ===== 水柱特效区域（刻度尺样式） ===== */
		.water-gauge-wrapper {
			display: flex;
			align-items: stretch;
			align-self: stretch; /* 关键：跟随右侧数据高度拉伸 */
			min-height: 240rpx; /* 右侧内容很少时的兜底高度 */
			margin-right: 16rpx;
			flex-shrink: 0;

			/* 左侧数值刻度 */
			.gauge-labels {
				position: relative;
				width: 36rpx;
				align-self: stretch; /* 高度由父级 flex 拉伸决定 */

				.scale-text {
					position: absolute;
					right: 0;
					transform: translateY(-50%);
					font-size: 18rpx;
					line-height: 1;
					color: var(--text-secondary, #666);
					white-space: nowrap;
				}
			}

			/* 水柱容器 */
			.gauge-tube {
				position: relative;
				width: 40rpx;
				align-self: stretch;
				margin-left: 8rpx;
				background-color: var(--bg-card, #ffffff);
				border-left: 1px solid var(--gauge-border, #ccd2dc);
				border-right: 1px solid var(--gauge-border, #ccd2dc);
				overflow: hidden;
				transition: background-color 0.3s ease, border-color 0.3s ease;

				/* 刻度线 */
				.tick {
					position: absolute;
					left: 0;
					width: 12rpx;
					height: 1px;
					background-color: var(--gauge-tick, #b4bbc7);
					transform: translateY(-50%);
					z-index: 2;

					&.tick-major {
						width: 22rpx;
						background-color: var(--gauge-tick-major, #8b93a1);
					}
				}

				/* 水位填充 */
				.water-fill {
					position: absolute;
					left: 0;
					bottom: 2%;
					width: 100%;
					background: linear-gradient(180deg, var(--water-from, #4da3ff) 0%, var(--water-to, #1a73e8) 100%);
					transition: height 0.3s ease;
					z-index: 1;

					.water-wave {
						position: absolute;
						top: -4rpx;
						left: 0;
						width: 200%;
						height: 8rpx;
						background-color: var(--water-wave, #6bb2ff);
						border-radius: 50%;
						animation: wave 2s infinite linear;
					}
				}
			}
		}

		/* 右侧数据网格区域 */
		.data-grid {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
			gap: 12rpx;

			.grid-row {
				display: flex;
				align-items: center;

				.row-label {
					width: 80rpx;
					flex-shrink: 0;
					font-size: 26rpx;

					&.title {
						font-weight: bold;
						color: var(--text-primary, #333);
					}

					&.sub {
						color: var(--text-secondary, #666);
					}
				}

				.row-val {
					flex: 1;
					font-size: 26rpx;
					color: var(--text-primary, #333);
					white-space: nowrap;

					&.highlight {
						color: var(--color-highlight, #1a73e8);
						font-weight: bold;
					}
				}
			}
		}
	}
}

/* 底部固定操作区 */
.footer-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	background-color: var(--bg-page, #f4f5f9);
	padding: 20rpx 24rpx 40rpx;
	box-sizing: border-box;
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16rpx;
	box-shadow: 0 -4rpx 16rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.03));
	z-index: 10;
	transition: background-color 0.3s ease;

	.action-btn {
		background-color: var(--color-primary, #4285f4);
		color: #ffffff;
		font-size: 24rpx;
		text-align: center;
		padding: 16rpx 0;
		border-radius: 8rpx;
		white-space: nowrap;
	}
}

/* 水波纹动画 */
@keyframes wave {
	0% { transform: translateX(0); }
	100% { transform: translateX(-50%); }
}
</style>
