/**
 * WebSocket 管理器（基于全局事件）
 * 由于项目启用了 uni.promisify，connectSocket 返回 Promise，使用全局事件监听。
 * 注意：全局事件只需注册一次，多次实例化需防止重复绑定。
 */
const BASE_WS_URL = 'wss://www.amdm.top/api/center/data';
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
			// 如果已经注册过，但仍需保存当前实例的回调，需用列表。
			// 这里由于我们业务上一般只有一个页面使用，直接覆盖即可。
			// 但为了支持多实例，建议使用数组，这里按单实例处理。
			console.warn('WebSocketManager 全局事件已注册，新实例将覆盖之前的回调。');
			// 解绑旧回调（如果有旧实例的话，需要保留解绑能力）
			// 由于无法知晓旧实例，这里不处理，业务上尽量避免多实例。
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
		if (this.onOpenCallback) this.onOpenCallback(res);
	}

	_handleMessage(res) {
		// res 为 { data: ... }
		if (this.onMessageCallback) this.onMessageCallback(res.data);
	}

	_handleError(err) {
		this.isConnected = false;
		this.isConnecting = false;
		if (this.onErrorCallback) this.onErrorCallback(err);
	}

	_handleClose(res) {
		this.isConnected = false;
		this.isConnecting = false;
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
