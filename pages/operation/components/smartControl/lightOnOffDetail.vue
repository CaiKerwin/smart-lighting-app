<template>
	<!-- 绑定 themeClass 以实现主题切换 -->
	<view :class="themeClass" class="container">
		<!-- 表格区域 -->
		<view class="table-section">
			<!-- 表头 -->
			<view class="table-header">
				<view class="th col-1">站点名称</view>
				<view class="th col-2">通道-时间表</view>
				<view class="th col-3">状态</view>
			</view>
			<!-- 表格内容 -->
			<view class="table-body">
				<view v-if="!tableData.length" class="table-tip">暂无数据</view>
				<view v-for="(item, index) in tableData" :key="index" class="tr">
					<view class="td col-1">{{ item.stationName }}</view>
					<view class="td col-2">
						<view class="channel-text">{{ item.channel }}</view>
						<view class="schedule-text">{{ item.timeTable }}</view>
					</view>
					<view class="td col-3">
						<text v-if="item.status" :class="['status-text', 'status-' + item.statusType]">{{ item.status }}</text>
						<text v-else class="status-text status-empty">-</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部操作区域 -->
		<view class="footer-section">
			<view class="time-row">
				<text class="label">保持开关灯至</text>
				<uni-datetime-picker
					v-model="selectedTime"
					hide-second
					type="datetime"
					@change="onTimeChange"
				>
					<view class="time-display">{{ selectedTime }}</view>
				</uni-datetime-picker>
			</view>

			<view class="btn-row">
				<!-- 开关灯按钮 -->
				<button
					:class="['action-btn btn-on', { 'btn-disabled': !isTimeConfirmed }]"
					@click="lightOnClick"
				>
					一键开灯
				</button>
				<button
					:class="['action-btn btn-off', { 'btn-disabled': !isTimeConfirmed }]"
					@click="lightOffClick"
				>
					一键关灯
				</button>
			</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode, hasOperation} from "@/utils/common";
import WebSocketManager from '@/utils/webSocket.js';

export default {
	data() {
		return {
			id: '',
			name: '',
			// 表格数据
			tableData: [],
			selectedTime: '', // 默认时间
			isTimeConfirmed: false, // 控制按钮是否可用
			wsManager: null, // WebSocket 管理器实例
			// 待回执指令映射：commandId -> paramId（通道参数id，用于定位表格行）
			pendingCommands: {}
		};
	},
	computed: {
		// 是否有 dco 设备操作权限
		hasDco() {
			return hasOperation('dco');
		}
	},
	created() {
		// 初始化默认时间为当前时间（格式：YYYY-MM-DD HH:mm）
		this.initDefaultTime();
	},
	onLoad(options) {
		// 获取页面传递的参数
		this.id = options.id || '';
		this.name = decodeURIComponent(options.name) || '';

		// 建立 WebSocket 连接，接收指令状态回执
		this.wsManager = new WebSocketManager({
			onOpen: () => {},
			onMessage: (data) => {
				this.handleSocketMessage(data);
			},
			onError: (err) => {
				console.error('websocket错误', err);
			},
			onClose: () => {}
		});
		this.wsManager.connect();

		// 页面加载时执行
		this.getLightOnOffDetailList();
	},
	// 下拉刷新
	onPullDownRefresh() {
		this.getLightOnOffDetailList();
	},
	onUnload() {
		if (this.wsManager) {
			this.wsManager.close(); // 关闭连接并解绑全局事件
			this.wsManager = null;
		}
	},
	methods: {
		getLightOnOffDetailList(){
			/**
			 * [
			 *   {
			 *     "channelName": "K1",
			 *     "stationName": "App6038",
			 *     "channel": 1,
			 *     "timeName": "公司测试",
			 *     "deviceId": 408678,
			 *     "paramId": 542724
			 *   }
			 * ]
			 */
			request({
				url: '/station/lux/QueryChannels',
				method: 'POST',
				data: {
					id: this.id
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data))
				const payload = res.data
				if (payload && payload.data){
					let data = [];
					try {
						data = JSON.parse(base64Decode(payload.data));
					} catch (e) {
						console.error('解析开关灯详情列表失败', e);
						data = [];
					}
					this.tableData = (Array.isArray(data) ? data : []).map(item => ({
						stationName: item.stationName,
						channel: `${item.channelName}-K${item.channel}`,
						timeTable: item.timeName,
						paramId: item.paramId,   // 通道参数id，发送指令时使用
						deviceId: item.deviceId,
						status: '',              // 状态列文案
						statusType: 'normal'     // 状态颜色类型：normal/warn/error/success
					}));
				}
				// 设置导航栏标题
				uni.setNavigationBarTitle({title: this.name})
			}).catch(err =>{
				console.error('获取开关灯详情列表失败:', err.message);
			}).finally(() => {
				uni.stopPullDownRefresh();
			})
		},
		// 初始化时间到分钟
		initDefaultTime() {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			const hours = String(now.getHours()).padStart(2, '0');
			const minutes = String(now.getMinutes()).padStart(2, '0');
			this.selectedTime = `${year}-${month}-${day} ${hours}:${minutes}`;
		},
		// 时间选择器改变事件
		onTimeChange(e) {
			this.selectedTime = e;
			this.isTimeConfirmed = true; // 用户确认选择时间后，按钮变为可用
		},
		// 一键开灯
		lightOnClick() {
			// 检查是否有dco权限
			if (!this.hasDco) {
				uni.showToast({
					title: '你没有权限',
					icon: 'none'
				});
				return;
			}
			// 未确认保持时间时提示先选择时间
			if (!this.isTimeConfirmed) {
				uni.showToast({
					title: '请先选择保持开关灯时间',
					icon: 'none'
				});
				return;
			}
			this.confirmOperation(true);
		},
		// 一键关灯
		lightOffClick() {
			// 检查是否有dco权限
			if (!this.hasDco) {
				uni.showToast({
					title: '你没有权限',
					icon: 'none'
				});
				return;
			}
			// 未确认保持时间时提示先选择时间
			if (!this.isTimeConfirmed) {
				uni.showToast({
					title: '请先选择保持开关灯时间',
					icon: 'none'
				});
				return;
			}
			this.confirmOperation(false);
		},
		/**
		 * 开关灯确认弹窗：一键开关灯直接对全部通道发送指令
		 * @param {boolean} isOpen 开灯 true / 关灯 false
		 */
		confirmOperation(isOpen) {
			if (this.tableData.length === 0) {
				uni.showToast({
					title: '暂无设备',
					icon: 'none'
				});
				return;
			}
			const actionText = isOpen ? '开灯' : '关灯';
			uni.showModal({
				title: '执行',
				content: `确定${actionText}至 ${this.selectedTime}？`,
				success: (res) => {
					if (res.confirm) {
						// 收集全部通道的 paramId 作为指令目标列表
						const paramIds = this.tableData.map(item => item.paramId);
						this.sendCommand(isOpen, paramIds);
					}
				}
			})
		},
		/**
		 * 发送开关灯指令（一键开关灯-通道命令）
		 * 接口返回的 message 即 commandId，用于匹配 WebSocket 回执
		 * 返回结果示例：
		 * {
		 *   "flag": "00000000000000000000000000000000",
		 *   "list": [
		 *     { "id": 542724, "success": true, "message": "ac21d86c9b7349839a3ca67237498f56" }
		 *   ]
		 * }
		 */
		sendCommand(isOpen, paramIds) {
			request({
				url: '/station/command/SendOutputOld',
				method: 'POST',
				data: {
					code: 'handControl', // 命令码 这里固定为通道开关handControl
					list: paramIds, // 要操作的通道参数id列表
					checkUserId: 0, // 当前用户id，这里固定为0，表示没有权限限制
					args: {
						open: isOpen, // 是否开灯
						enable: true, // 是否启用，默认true
						expire: this.selectedTime+':00', // 开灯/关灯时间，格式为yyyy-MM-dd HH:mm:ss
						point: false // 是否启用点控，默认false
					}
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data))
				this.handleCommandResponse(res);
			}).catch(err =>{
				console.error('发送开关灯指令错误:', err.message);
				uni.showToast({ title: '指令发送失败', icon: 'none' });
			})
		},
		// 处理指令发送返回：登记 commandId -> paramId 映射，先显示「正在执行...」或错误
		handleCommandResponse(res) {
			const decoded = base64Decode(res && res.data && res.data.data);
			let payload = null;
			if (decoded) {
				try {
					payload = JSON.parse(decoded);
				} catch (e) {
					payload = null;
				}
			}
			if (!payload || !Array.isArray(payload.list)) {
				console.error('解析指令返回结果失败', decoded);
				uni.showToast({ title: '指令发送失败', icon: 'none' });
				return;
			}
			// 保证 socket 可用，便于接收后续状态消息
			this.ensureSocket();
			payload.list.forEach(item => {
				if (!item || item.id == null) return;
				const paramId = Number(item.id);
				if (item.success && item.message) {
					// 记录 commandId -> paramId 的映射，等待 WebSocket 回执更新状态
					this.pendingCommands[item.message] = paramId;
					this.setRowStatus(paramId, '正在执行...', 'normal');
				} else {
					this.setRowStatus(paramId, item.message || '指令发送失败', 'error');
				}
			});
		},
		// 更新指定行的状态列
		setRowStatus(paramId, text, type) {
			const row = this.tableData.find(item => Number(item.paramId) === paramId);
			if (row) {
				this.$set(row, 'status', text);
				this.$set(row, 'statusType', type || 'normal');
			}
		},
		// 确保 websocket 已连接（连接断开后重新建立）
		ensureSocket() {
			if (this.wsManager) {
				this.wsManager.connect();
			}
		},
		// 处理 websocket 消息：仅处理一键开关灯指令（type=cmd 且 cmdCode=handControl）的回执
		handleSocketMessage(data) {
			let msg = data;
			if (typeof data === 'string') {
				try {
					msg = JSON.parse(data);
				} catch (e) {
					msg = null;
				}
			}
			/**
			 * 开关灯消息格式
			 * {
			 *   "type": "cmd",
			 *   "commandId": "df3e18a01d874eabaa4c52f49cf9fc43",
			 *   "cmdCode": "handControl",
			 *   "status": 9,
			 *   "cmdType": 12,
			 *   "message": "指令已完成",
			 *   "content": {}
			 * }
			 */
			if (!msg || msg.type !== 'cmd' || msg.cmdCode !== 'handControl') return;
			const commandId = msg.commandId;
			const paramId = this.pendingCommands[commandId];
			if (paramId == null) return;

			const statusNum = Number(msg.status);
			this.setRowStatus(paramId, this.statusText(statusNum), this.statusType(statusNum));

			// 终端状态（成功/失败/超时）后清理映射
			if (statusNum === 9 || statusNum === 8 || statusNum === 7) {
				delete this.pendingCommands[commandId];
			}
		},
		// 状态码对应的文案
		statusText(status) {
			const map = { 2: '指令已发送', 4: '执行中', 5: '已重发', 7: '指令超时', 8: '执行失败', 9: '执行成功' };
			return map[status] || `状态${status}`;
		},
		// 状态码对应的颜色类型（参考智能控制开发文档 §2.3：2/4正常色 5橙色 7/8红色 9强调色）
		statusType(status) {
			const map = { 2: 'normal', 4: 'normal', 5: 'warn', 7: 'error', 8: 'error', 9: 'success' };
			return map[status] || 'normal';
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: var(--bg-page, #f5f7fa);
	padding-bottom: 200rpx;
	box-sizing: border-box;
	transition: background-color 0.3s ease;
}

/* 表格区域样式 */
.table-section {
	background-color: var(--bg-card, #ffffff);
	margin: 20rpx;
	border-radius: 16rpx;
	overflow: hidden;
	transition: background-color 0.3s ease;
}

.table-header {
	display: flex;
	background-color: var(--bg-table-header, #f8f9fb);
	padding: 24rpx 0;
	border-bottom: 1rpx solid var(--border-color, #ebeef5);
	transition: background-color 0.3s ease, border-color 0.3s ease;
}

.th {
	font-size: 28rpx;
	font-weight: bold;
	color: var(--text-primary, #333333);
	text-align: center;
	transition: color 0.3s ease;
}

.table-body {
	display: flex;
	flex-direction: column;
}

.table-tip {
	padding: 40rpx 0;
	text-align: center;
	font-size: 28rpx;
	color: var(--text-quaternary, #999999);
}

.tr {
	display: flex;
	padding: 30rpx 0;
	border-bottom: 1rpx solid var(--border-color, #ebeef5);
	transition: border-color 0.3s ease;
	&:last-child {
		border-bottom: none;
	}
}

.td {
	font-size: 28rpx;
	color: var(--text-secondary, #666666);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	transition: color 0.3s ease;
}

/* 列宽分配 */
.col-1 {
	width: 28%;
}
.col-2 {
	width: 40%;
}
.col-3 {
	width: 32%;
}

/* 通道列内部样式 */
.channel-text {
	color: var(--text-primary, #333333);
	font-weight: 500;
	margin-bottom: 8rpx;
	transition: color 0.3s ease;
}
.schedule-text {
	font-size: 24rpx;
	color: var(--text-quaternary, #999999);
	transition: color 0.3s ease;
}

/* 状态列文案颜色 */
.status-text {
	font-size: 26rpx;
	transition: color 0.3s ease;

	&.status-empty {
		color: var(--text-quaternary, #999999);
	}
	&.status-normal {
		color: var(--text-secondary, #666666);
	}
	&.status-warn {
		color: #ff9800; /* 橙色 */
	}
	&.status-error {
		color: #ff4d4f; /* 红色 */
	}
	&.status-success {
		color: var(--color-primary, #007aff); /* 强调色 */
	}
}

/* 底部操作区域样式 */
.footer-section {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	background-color: var(--bg-card, #ffffff);
	padding: 30rpx 40rpx calc(30rpx + env(safe-area-inset-bottom));
	box-shadow: 0 -4rpx 16rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.05));
	box-sizing: border-box;
	transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.time-row {
	display: flex;
	align-items: center;
	justify-content: flex-start;
	margin-bottom: 30rpx;
}

.label {
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	margin-right: 16rpx;
	transition: color 0.3s ease;
}

.time-display {
	font-size: 28rpx;
	color: var(--color-primary, #007aff);
	font-weight: 500;
	padding: 4rpx 0;
	border-bottom: 2rpx dashed var(--color-primary, #007aff);
	transition: color 0.3s ease, border-color 0.3s ease;
}

.btn-row {
	display: flex;
	justify-content: space-between;
	gap: 30rpx;
}

.action-btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 12rpx;
	font-size: 30rpx;
	color: #ffffff;
	border: none;
	transition: background-color 0.3s ease, opacity 0.3s ease;

	&::after {
		border: none;
	}

	&[disabled],
	&.btn-disabled {
		/* 未确认时间/禁用状态适配深色模式 */
		background-color: var(--bg-soft, #c0c4cc) !important;
		color: var(--text-quaternary, #ffffff) !important;
		opacity: 0.7;
	}
}

.btn-on {
	background-color: var(--color-primary, #007aff);
}

.btn-off {
	/* 在 App.vue 的变量中没有专门定义红色，这里保留原色或使用标准警告红 */
	background-color: #ff4d4f;
}
</style>
