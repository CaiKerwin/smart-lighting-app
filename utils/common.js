/**
 * Base64 解码，支持 UTF-8 字符
 * @param {string} input - Base64 编码的字符串
 * @returns {string} 解码后的字符串，失败返回空字符串
 */
export function base64Decode(input) {
	if (!input || typeof input !== 'string') {
		return '';
	}

	try {
		const decoded = atob(input);
		// 尝试将解码后的字节转为 UTF-8 字符串
		try {
			return decodeURIComponent(
				decoded
					.split('')
					.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
					.join('')
			);
		} catch (e) {
			// 如果转 UTF-8 失败，直接返回原解码结果
			return decoded;
		}
	} catch (e) {
		console.error('Base64 解码失败', e);
		return '';
	}
}

/**
 * 从响应 payload 中提取消息（msg / message 等）
 * @param {any} payload - 接口返回的数据对象
 * @returns {string} 提取到的消息，若未找到则返回空字符串
 */
export function extractMessage(payload) {
	if (typeof payload === 'string') {
		return payload;
	}
	if (!payload || typeof payload !== 'object') {
		return '';
	}

	const candidates = [
		payload.msg,
		payload.message,
		payload.errorMsg,
		payload.errorMessage,
		payload.data && payload.data.msg,
		payload.data && payload.data.message
	];
	for (const item of candidates) {
		if (typeof item === 'string' && item.trim()) {
			return item.trim();
		}
	}
	return '';
}

/**
 * 从响应 payload 中提取 token（支持多种字段名和 Base64 编码）
 * @param {any} payload - 接口返回的数据对象
 * @returns {string} 提取到的 token，若未找到则返回空字符串
 */
export function extractToken(payload) {
	const body = payload && payload.data && typeof payload.data === 'object' ? payload.data : payload;
	let data = body.data;

	if (typeof data === 'string') {
		const decoded = base64Decode(data); // 使用同文件的 base64Decode
		if (decoded) {
			try {
				data = JSON.parse(decoded);
			} catch (e) {
				console.error('data 解析为 JSON 失败', e);
			}
		}
	}

	const candidates = [
		data && data.token,
		data && data.accessToken,
		data && data.access_token,
		body && body.token,
		body && body.accessToken,
		body && body.access_token
	];

	for (const item of candidates) {
		if (typeof item === 'string' && item.trim()) {
			return item;
		}
	}
	return '';
}

export const paramType = {
	1: '配电柜总配电',
	2: '配电柜转换开关',
	3: '配电柜控制输出开关',
	4: '配电柜接触器',
	5: '配电柜支路配电',
	6: '配电柜柜门',
	7: '配电柜门锁',
	8: '配电柜烟雾监测',
	9: '配电柜水浸监测',
	10: '配电柜线缆',
	14: '灯杆',
	16: '电能表',
	199: '单灯'
};

/**
 * 格式化报警内容
 * 格式  fmt:p0:1:60:1.3:50
 * @param {string} raw - 原始报警字符串，可能包含多条，用分号分隔
 * @param {number} paramType - 参数类型（用于选择映射表）
 * @returns {string} 格式化后的中文描述
 */
export function formatAlarmContent(raw, paramType) {
	if (!raw) return '';
	// 按分号拆分，可能包含多个报警
	const parts = raw.split(';').filter(s => s.trim() !== '');
	const formattedParts = parts.map(part => {
		part = part.trim();
		// 如果不是以 fmt: 开头，则视为历史数据，直接保留
		if (!part.startsWith('fmt:')) {
			return part;
		}
		// 去掉 fmt: 前缀，按冒号分割
		const encoded = part.substring(4); // 去掉 "fmt:"
		const segments = encoded.split(':');
		const code = segments[0];
		const argsValues = segments.slice(1);

		// 根据 paramType 选择映射表，若为单灯(199)则用灯报警，否则默认用站内报警
		let alarmList = [];
		if (paramType === 199) {
			alarmList = this.lightAlarmTypes;
		} else {
			// 可根据实际 paramType 扩展选择逻辑（如 9 水浸，10 线缆等）
			// 这里简单合并站内、水浸、线路，按优先级查找
			alarmList = [...this.stationAlarmTypes, ...this.waterAlarmTypes, ...this.lineAlarmTypes];
		}
		// 查找匹配的报警类型
		let matched = null;
		for (let item of alarmList) {
			if (item.code === code) {
				// 检查参数个数是否一致（如果参数个数一致则匹配）
				if (item.args.length === argsValues.length) {
					matched = item;
					break;
				}
			}
		}
		// 如果未找到，尝试在所有表中查找（兜底）
		if (!matched) {
			const all = [...this.lightAlarmTypes, ...this.stationAlarmTypes, ...this.waterAlarmTypes, ...this.lineAlarmTypes];
			for (let item of all) {
				if (item.code === code && item.args.length === argsValues.length) {
					matched = item;
					break;
				}
			}
		}
		if (!matched) {
			// 若仍找不到，保留原始格式
			return part;
		}
		// 构建中文描述：报警名称 + 各参数描述
		const partsDesc = [];
		partsDesc.push(matched.name);
		matched.args.forEach((argName, index) => {
			const value = argsValues[index] || '';
			partsDesc.push(`${argName}${value}`);
		});
		return partsDesc.join('；');
	});
	return formattedParts.join('；');
}
