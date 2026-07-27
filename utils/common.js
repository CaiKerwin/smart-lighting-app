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
