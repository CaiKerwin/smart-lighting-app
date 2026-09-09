/**
 * WebSocket 管理器（基于全局事件）
 * 由于项目启用了 uni.promisify，connectSocket 返回 Promise，使用全局事件监听。
 * 注意：全局事件只需注册一次，多次实例化需防止重复绑定。
 * 服务器固定要求，不发心跳连接会被断开/停止推送
 * 心跳：连接成功后每隔2秒发送一次心跳消息，发送10次心跳指令后改为每隔20秒发送一次
 *
 */
const BASE_WS_URL = 'wss://www.amdm.top/api/center/data';
const HEARTBEAT_INTERVAL = 2000;         // 连接初期心跳发送间隔：2秒
const HEARTBEAT_STABLE_INTERVAL = 20000; // 发送10次心跳之后的发送间隔：20秒
const HEARTBEAT_FAST_COUNT = 10;         // 前10次心跳使用2秒间隔
class WebSocketManager {
	/**
	 * @param {Object} options
	 * @param {string} options.url - WebSocket 服务地址
	 * @param {Object} options.header - 连接请求头
	 * @param {Function} options.onOpen - 连接成功回调
	 * @param {Function} options.onMessage - 收到消息回调（参数为消息数据）
	 * @param {Function} options.onError - 错误回调
	 * @param {Function} options.onClose - 关闭回调
	 */
	constructor(options = {}) {
		this.url = options.url || BASE_WS_URL;
		this.header = {
			'auth': uni.getStorageSync('authToken'),
			'Custid': String(uni.getStorageSync('curCust')),
			'Lang': 'zh_cn',
			'Apptype': uni.getStorageSync('curApp') || 'road',
			...options.header
		};
		this.onOpenCallback = options.onOpen || null;
		this.onMessageCallback = options.onMessage || null;
		this.onErrorCallback = options.onError || null;
		this.onCloseCallback = options.onClose || null;

		this.isConnected = false;
		this.isConnecting = false;
		this.isRegistered = false; // 是否已注册全局事件

		// 心跳定时器、已发送次数与连续失败计数（连接断开后自动停止）
		this.heartbeatTimer = null;
		this.heartbeatCount = 0;
		this.heartbeatFailCount = 0;

		// 绑定事件处理函数（保证解绑时使用同一引用）
		this._boundOnOpen = this._handleOpen.bind(this);
		this._boundOnMessage = this._handleMessage.bind(this);
		this._boundOnError = this._handleError.bind(this);
		this._boundOnClose = this._handleClose.bind(this);

		// 注册全局事件（仅一次，但允许多个实例共享，因为回调会分别调用）
		this._registerGlobalEvents();
	}

	/**
	 * 注册全局事件（如果尚未注册）
	 * 注意：全局事件是全局唯一的，多次注册会导致回调叠加，但解绑时需一一移除。
	 * 这里我们使用一个静态标记，确保只注册一次，但每个实例的回调需要单独处理。
	 * 更稳健的方式：维护一个回调列表，这里简化为只支持单实例。
	 * 如果确需多实例，可改为数组存储回调并遍历调用。
	 */
	_registerGlobalEvents() {
		// 静态变量记录是否已绑定（简单防重复）
		if (WebSocketManager._globalRegistered) {
			console.warn('WebSocketManager 全局事件已注册，新实例将覆盖之前的回调。');
		}
		// 注册全局事件
		uni.onSocketOpen(this._boundOnOpen);
		uni.onSocketMessage(this._boundOnMessage);
		uni.onSocketError(this._boundOnError);
		uni.onSocketClose(this._boundOnClose);
		WebSocketManager._globalRegistered = true;
	}

	/**
	 * 解除全局事件绑定
	 */
	_unregisterGlobalEvents() {
		if (WebSocketManager._globalRegistered) {
			// uni.offSocketOpen(this._boundOnOpen);
			// uni.offSocketMessage(this._boundOnMessage);
			// uni.offSocketError(this._boundOnError);
			// uni.offSocketClose(this._boundOnClose);
			WebSocketManager._globalRegistered = false;
		}
	}

	// ---- 事件处理 ----
	_handleOpen(res) {
		this.isConnected = true;
		this.isConnecting = false;
		// 连接成功即开始心跳（立即发一次，前10次每5秒一次，之后每30秒一次）
		this._startHeartbeat();
		if (this.onOpenCallback) this.onOpenCallback(res);
	}

	_handleMessage(res) {
		// res 为 { data: ... }
		if (this.onMessageCallback) this.onMessageCallback(res.data);
	}

	_handleError(err) {
		this.isConnected = false;
		this.isConnecting = false;
		this._stopHeartbeat();
		if (this.onErrorCallback) this.onErrorCallback(err);
	}

	_handleClose(res) {
		this.isConnected = false;
		this.isConnecting = false;
		this._stopHeartbeat();
		if (this.onCloseCallback) this.onCloseCallback(res);
	}

	// ---- 公共方法 ----

	/**
	 * 建立 WebSocket 连接
	 * 如果已连接或正在连接，则不再重复发起
	 */
	connect() {
		if (this.isConnected || this.isConnecting) {
			return;
		}
		this.isConnecting = true;

		// 使用回调方式调用 connectSocket，避免被 promisify 影响
		uni.connectSocket({
			url: this.url,
			method: 'GET',
			header: this.header,
			success: () => {
				// 连接发起成功，等待 onOpen
			},
			fail: (err) => {
				this.isConnecting = false;
				if (this.onErrorCallback) this.onErrorCallback(err);
			}
		});
	}

	/**
	 * 关闭连接并解绑全局事件
	 */
	close() {
		// 停止心跳
		this._stopHeartbeat();
		// 关闭连接
		uni.closeSocket({
			success: () => {
				this.isConnected = false;
				this.isConnecting = false;
			}
		});
		// 解绑全局事件（注意：这可能影响其他实例，但单实例场景下没问题）
		this._unregisterGlobalEvents();
	}

	/**
	 * 发送数据
	 */
	send(data) {
		if (this.isConnected) {
			uni.sendSocketMessage({
				data: data,
				fail: (err) => {
					console.error('WebSocket send error', err);
				}
			});
		} else {
			console.warn('WebSocket 未连接，无法发送');
		}
	}

	// ---- 心跳 ----

	/**
	 * 构建心跳消息
	 * 格式：{"cmd":"heart","data":{"time":时间戳,"appType":"road","customerId":"4","token":"..."}}
	 */
	_buildHeartbeatMessage() {
		return JSON.stringify({
			cmd: 'heart',
			data: {
				time: Date.now(),
				appType: uni.getStorageSync('curApp') || 'road',
				customerId: String(uni.getStorageSync('curCust')),
				token: uni.getStorageSync('authToken')
			}
		});
	}

	/**
	 * 发送一次心跳
	 */
	_sendHeartbeat() {
		if (!this.isConnected) {
			this._stopHeartbeat();
			return;
		}
		this.heartbeatCount++;
		uni.sendSocketMessage({
			data: this._buildHeartbeatMessage(),
			success: () => {
				this.heartbeatFailCount = 0;
			},
			fail: (err) => {
				this.heartbeatFailCount++;
				console.error('WebSocket 心跳发送失败', err);
				// 连续3次心跳发送失败，说明连接已失效，重置状态并触发错误回调，
				// 页面侧可据此在下次发送指令时重连
				if (this.heartbeatFailCount >= 3) {
					console.warn('WebSocket 心跳连续失败，连接判定为失效');
					this._handleError(err);
				}
			}
		});
	}

	/**
	 * 开始心跳：立即发送一次，前10次每2秒发送一次，之后改为每20秒发送一次
	 */
	_startHeartbeat() {
		this._stopHeartbeat();
		this.heartbeatFailCount = 0;
		this.heartbeatCount = 0;
		this._sendHeartbeat();
		this._scheduleNextHeartbeat();
	}

	/**
	 * 计算下一次心跳的延迟并安排发送：
	 * 前10次（HEARTBEAT_FAST_COUNT）每2秒一次，之后每20秒一次
	 */
	_scheduleNextHeartbeat() {
		const interval = this.heartbeatCount < HEARTBEAT_FAST_COUNT ? HEARTBEAT_INTERVAL : HEARTBEAT_STABLE_INTERVAL;
		this.heartbeatTimer = setTimeout(() => {
			if (!this.isConnected) {
				this.heartbeatTimer = null;
				return;
			}
			this._sendHeartbeat();
			this._scheduleNextHeartbeat();
		}, interval);
	}

	/**
	 * 停止心跳
	 */
	_stopHeartbeat() {
		if (this.heartbeatTimer) {
			clearTimeout(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	/**
	 * 获取连接状态
	 */
	getConnected() {
		return this.isConnected;
	}
}

// 静态标记
WebSocketManager._globalRegistered = false;

export default WebSocketManager;
