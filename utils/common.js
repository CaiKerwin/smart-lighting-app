import {request} from "@/utils/request";

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * 将 Base64 字符串解码为字节数组（纯 JS 实现，不依赖浏览器全局 atob）。
 * 手机端运行环境没有 atob，PC端有
 * @param {string} input - Base64 编码的字符串
 * @returns {number[]} 解码后的字节数组
 */
function base64ToBytes(input) {
	// 去掉换行、空格等非法字符
	const clean = String(input).replace(/[^A-Za-z0-9+/]/g, '');
	const bytes = [];
	let buffer = 0;
	let bits = 0;
	for (let i = 0; i < clean.length; i++) {
		const value = BASE64_CHARS.indexOf(clean.charAt(i));
		if (value === -1) {
			continue;
		}
		buffer = (buffer << 6) | value;
		bits += 6;
		if (bits >= 8) {
			bits -= 8;
			bytes.push((buffer >> bits) & 0xff);
		}
	}
	return bytes;
}

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
		// 先还原为二进制字符串（Latin-1），再按 UTF-8 恢复中文等字符
		const binary = base64ToBytes(input)
			.map((byte) => String.fromCharCode(byte))
			.join('');
		try {
			return decodeURIComponent(
				binary
					.split('')
					.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
					.join('')
			);
		} catch (e) {
			// 如果内容不是合法 UTF-8，直接返回原解码结果
			return binary;
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

/**
 * 格式化报警内容
 * 格式  fmt:p0:1:60:1.3:50
 * @param {string} raw - 原始报警字符串，可能包含多条，用分号分隔
 * @param {number} paramType - 参数类型（用于选择映射表）
 * @returns {string} 格式化后的中文描述
 */
export function formatAlarmContent(raw, paramType) {
	const lightAlarmTypes= [
		{ id: 23, name: '灭灯', code: 'p0', args: ['通道', '亮度', '电流', '功率'] },
		{ id: 25, name: '欠载', code: 'p1', args: ['通道', '亮度', '功率', '额定值', '阈值', '阈值百分比'] },
		{ id: 24, name: '过载', code: 'p2', args: ['通道', '亮度', '功率', '额定值', '阈值', '阈值百分比'] },
		{ id: 10, name: '掉电', code: 'v0', args: ['当前值'] },
		{ id: 13, name: '降功率欠压', code: 'v1', args: ['当前值', '阈值'] },
		{ id: 12, name: '欠压', code: 'v2', args: ['当前值', '最小值', '最大值'] },
		{ id: 14, name: '降功率过压', code: 'v3', args: ['当前值', '阈值'] },
		{ id: 11, name: '过压', code: 'v4', args: ['当前值', '最小值', '最大值'] },
		{ id: 22, name: '欠流', code: 'c1', args: ['通道', '亮度', '电流', '最小值', '最大值', '功率'] },
		{ id: 21, name: '过流', code: 'c2', args: ['通道', '亮度', '电流', '最小值', '最大值', '功率'] },
		{ id: 32, name: '降功率过温', code: 't1', args: ['当前值', '阈值'] },
		{ id: 31, name: '过温', code: 't2', args: ['当前值', '阈值'] },
		{ id: 51, name: '倾斜', code: 'g1', args: ['X当前值', 'X基准值', 'Y当前值', 'Y基准值', 'Z当前值', 'Z基准值', '阈值'] },
		{ id: 66, name: '线路供电异常', code: 'l1', args: [] }
	];
	const stationAlarmTypes= [
		{ id: 61, name: '一级水浸', code: 'w1', args: ['监测值', '报警值'] },
		{ id: 62, name: '二级水浸', code: 'w2', args: ['监测值', '报警值'] },
		{ id: 63, name: '三级水浸', code: 'w3', args: ['监测值', '报警值'] },
		{ id: 51, name: '烟雾报警', code: 's1', args: ['监测值', '报警值'] },
		{ id: 43, name: '锁开报警', code: 'l1', args: ['监测值', '报警值'] },
		{ id: 42, name: '门开报警', code: 'd1', args: ['监测值', '报警值'] },
		{ id: 92, name: '接触器断开', code: 'ct0', args: ['监测值', '关联输出值'] },
		{ id: 91, name: '接触器黏合', code: 'ct1', args: ['监测值', '关联输出值'] },
		{ id: 101, name: '控制输出异常', code: 'ot1', args: ['时间表值', '当前输出值'] },
		{ id: 83, name: '停止报警', code: 'sw0', args: ['手动状态', '遥控状态', '时控状态'] },
		{ id: 81, name: '手动报警', code: 'sw1', args: ['手动状态', '遥控状态', '时控状态'] },
		{ id: 82, name: '时控报警', code: 'sw2', args: ['手动状态', '遥控状态', '时控状态'] },
		{ id: 71, name: '一级漏电', code: 'lk1', args: ['漏电值', '一级阈值', '二级阈值', '三级阈值'] },
		{ id: 72, name: '二级漏电', code: 'lk2', args: ['漏电值', '一级阈值', '二级阈值', '三级阈值'] },
		{ id: 73, name: '三级漏电', code: 'lk3', args: ['漏电值', '一级阈值', '二级阈值', '三级阈值'] },
		{ id: 11, name: '失压', code: 'v0', args: ['当前值'] },
		{ id: 12, name: '缺相', code: 'v1', args: ['相位'] },
		{ id: 14, name: '欠压', code: 'v2', args: ['相位', '当前值', '最小值', '最大值'] },
		{ id: 13, name: '过压', code: 'v3', args: ['相位', '当前值', '最小值', '最大值'] },
		{ id: 33, name: '功率因数过低', code: 'f1', args: ['相位', '当前值', '额定值'] },
		{ id: 24, name: '灭灯', code: 'p0', args: ['A相电流', 'B相电流', 'C相电流'] },
		{ id: 31, name: '过载', code: 'p1', args: ['相位', '当前值', '额定值'] },
		{ id: 32, name: '功率异常', code: 'p2', args: ['当前值', '对比值列表', '均值', '电流差阈值'] },
		{ id: 25, name: '异常亮灯', code: 'p3', args: ['A相电流', 'B相电流', 'C相电流'] },
		{ id: 22, name: '欠流', code: 'c1', args: ['相位', '当前值', '最小值', '最大值'] },
		{ id: 21, name: '过流', code: 'c2', args: ['相位', '当前值', '最小值', '最大值'] },
		{ id: 23, name: '电流异常', code: 'c3', args: ['相位', '当前值', '对比值列表', '均值', '电流差阈值'] },
		{ id: 41, name: '被盗', code: 'st', args: ['当前值', '防盗阈值'] }
	];
	const lineAlarmTypes= [
		{ name: '线路报警', code: 'l0', args: ['站点单灯总数', '离线数量', '离线占比', '灭灯数量', '灭灯占比', '过压数量', '过压占比', '欠压数量', '欠压占比'] }
	];
	const waterAlarmTypes= [
		{ id: 99, name: '离线报警', code: '99', args: ['通信ID'] },
		{ id: 1, name: '一级报警', code: '1', args: ['当前水位', '一级阈值', '二级阈值', '三级阈值'] },
		{ id: 2, name: '二级报警', code: '2', args: ['当前水位', '一级阈值', '二级阈值', '三级阈值'] },
		{ id: 3, name: '三级报警', code: '3', args: ['当前水位', '一级阈值', '二级阈值', '三级阈值'] }
	];
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
		if (paramType === 199) alarmList = lightAlarmTypes;
		else if (paramType === 10) alarmList = lineAlarmTypes;
		else if (paramType === 9) alarmList = waterAlarmTypes;
		// 按优先级查找站内、水浸、线路、单灯报警
		else alarmList = [...stationAlarmTypes, ...waterAlarmTypes, ...lineAlarmTypes, ...lightAlarmTypes];

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
			const all = [...lightAlarmTypes, ...stationAlarmTypes, ...waterAlarmTypes, ...lineAlarmTypes];
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

// ==================== 坐标转换工具 ====================
const EARTH_RADIUS = 6378245.0;
const X_PI = Math.PI * 3000.0 / 180.0;

/**
 * 判断坐标是否在中国大陆之外
 */
function isOutOfChina(lat, lng) {
	if (lng < 72.004 || lng > 137.8347) return true;
	if (lat < 0.8293 || lat > 55.8271) return true;
	return false;
}

function transformLat(lng, lat) {
	let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
	ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
	ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
	ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320.0 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
	return ret;
}

function transformLng(lng, lat) {
	let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
	ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
	ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
	ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
	return ret;
}

/**
 * WGS-84 → GCJ-02（火星坐标系）
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {{ lat: number, lng: number }}
 */
export function wgs84ToGcj02(lng, lat) {
	if (isOutOfChina(lat, lng)) {
		return { lat, lng };
	}
	let dLat = transformLat(lng - 105.0, lat - 35.0);
	let dLng = transformLng(lng - 105.0, lat - 35.0);
	const radLat = lat / 180.0 * Math.PI;
	let magic = Math.sin(radLat);
	magic = 1 - 0.00669342162296594323 * magic * magic;
	const sqrtMagic = Math.sqrt(magic);
	dLat = (dLat * 180.0) / ((EARTH_RADIUS * (1 - 0.00669342162296594323)) / (magic * sqrtMagic) * Math.PI);
	dLng = (dLng * 180.0) / (EARTH_RADIUS / sqrtMagic * Math.cos(radLat) * Math.PI);
	const mgLat = lat + dLat;
	const mgLng = lng + dLng;
	return { lat: mgLat, lng: mgLng };
}

/**
 * GCJ-02 → WGS-84
 */
export function gcj02ToWgs84(lng, lat) {
	if (isOutOfChina(lat, lng)) {
		return { lat, lng };
	}
	const gcj = wgs84ToGcj02(lng, lat);
	const dLng = gcj.lng - lng;
	const dLat = gcj.lat - lat;
	return { lat: lat - dLat, lng: lng - dLng };
}

/**
 * GCJ-02 → BD-09（百度坐标系）
 */
export function gcj02ToBd09(lng, lat) {
	const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI);
	const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI);
	const bdLng = z * Math.cos(theta) + 0.0065;
	const bdLat = z * Math.sin(theta) + 0.006;
	return { lat: bdLat, lng: bdLng };
}
/**
 * BD-09 → GCJ-02（参数顺序为经度,纬度）
 */
export function bd09ToGcj02(bd_lon, bd_lat) {
	const x = bd_lon - 0.0065;
	const y = bd_lat - 0.006;
	const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
	const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
	const gcj_lon = z * Math.cos(theta);
	const gcj_lat = z * Math.sin(theta);
	return { lng: gcj_lon, lat: gcj_lat };
}

// ==================== 用户操作权限 ====================
// 本地缓存 key：登录成功后由 /common/auth/QueryMyOperations 写入的「用户操作码集合」
const USER_OPERATIONS_KEY = 'userOperations';

/**
 * 获取本地缓存的用户操作码集合
 * @returns {string[]} 操作码数组，无缓存或异常时返回空数组
 */
export function getUserOperations() {
	try {
		const ops = uni.getStorageSync(USER_OPERATIONS_KEY);
		return Array.isArray(ops) ? ops : [];
	} catch (e) {
		return [];
	}
}

/**
 * 保存用户操作码集合到本地缓存
 * @param {string[]} operations - 操作码数组
 */
export function setUserOperations(operations) {
	try {
		uni.setStorageSync(USER_OPERATIONS_KEY, Array.isArray(operations) ? operations : []);
	} catch (e) {
		console.error('保存用户权限失败', e);
	}
}

/**
 * 判断当前用户是否拥有某个操作权限
 * @param {string} code - 操作码
 * @returns {boolean}
 */
export function hasOperation(code) {
	return getUserOperations().indexOf(code) >= 0;
}

// 本地缓存 key：登录成功后由 /common/auth/QueryMyOperations 写入的「单灯显示列配置」
const USER_LIGHT_SHOW_COLUMNS_KEY = 'userLightShowColumns';

/**
 * 获取本地缓存的单灯显示列配置（QueryMyOperations 返回的 other.lightShowColumns）
 * @returns {string[]|null} 列配置数组；未配置时返回 null
 */
export function getLightShowColumns() {
	try {
		const columns = uni.getStorageSync(USER_LIGHT_SHOW_COLUMNS_KEY);
		return Array.isArray(columns) ? columns : null;
	} catch (e) {
		return null;
	}
}

/**
 * 保存单灯显示列配置（QueryMyOperations 返回的 other.lightShowColumns）
 * @param {string[]|null} columns - 列配置数组；传 null 表示未配置（清除缓存）
 */
export function setLightShowColumns(columns) {
	try {
		if (columns == null) {
			uni.removeStorageSync(USER_LIGHT_SHOW_COLUMNS_KEY);
		} else {
			uni.setStorageSync(USER_LIGHT_SHOW_COLUMNS_KEY, Array.isArray(columns) ? columns : []);
		}
	} catch (e) {
		console.error('保存单灯显示列配置失败', e);
	}
}

/**
 * 单灯显示列配置
 * 获取用户权限接口/common/auth/QueryMyOperations返回结果中的lightShowColumns每一项的含义
 * POST /sys/setting/QueryLightColumns
 */
/**
 * {
 *   "cols": [
 *     "nm",
 *     "id",
 *     "ol",
 *     "u",
 *     "c",
 *     "p",
 *     "f",
 *     "q",
 *     "lo",
 *     "lux",
 *     "op",
 *     "oc",
 *     "cl",
 *     "tc",
 *     "gx",
 *     "gy",
 *     "gz",
 *     "hv",
 *     "sv"
 *   ],
 *   "all": {
 *     "nm": "名称",
 *     "pole": "所在灯杆",
 *     "id": "通信ID",
 *     "ch": "通道",
 *     "ol": "在线",
 *     "u": "电压",
 *     "c": "电流",
 *     "p": "功率",
 *     "f": "功率因数",
 *     "q": "电能",
 *     "lo": "亮灯时长",
 *     "rssi": "信号强度",
 *     "sun": "太阳能电池",
 *     "op": "亮度",
 *     "oc": "色温",
 *     "lux": "光照度",
 *     "dv": "直流电压",
 *     "dc": "直流电流",
 *     "lu": "漏电电压",
 *     "cl": "漏电电流",
 *     "tc": "温度",
 *     "lt": "类型",
 *     "an": "分组",
 *     "md": "调光控制类型",
 *     "gx": "X轴",
 *     "gy": "Y轴",
 *     "gz": "Z轴",
 *     "hv": "硬件版本",
 *     "sv": "软件版本",
 *     "iccid": "ICCID",
 *     "freq": "交流频率",
 *     "acv": "交流充电电压",
 *     "aci": "交流充电电流",
 *     "acp": "交流充电功率",
 *     "solv": "太阳能充电电压",
 *     "soli": "太阳能充电电流",
 *     "solp": "太阳能充电功率",
 *     "batv": "蓄电池电压",
 *     "bati": "蓄电池电流",
 *     "batp": "蓄电池功率",
 *     "loadv": "负载电压",
 *     "loadi": "负载电流",
 *     "loadp": "负载功率",
 *     "acls": "市电负载工作状态",
 *     "acs": "市电充电工作状态",
 *     "sols": "太阳能板工作状态",
 *     "bats": "蓄电池工作状态",
 *     "loads": "负载工作状态",
 *     "batlv": "蓄电池电量",
 *     "solbatpwm": "太阳能PWM",
 *     "batledpwm": "负载PWM",
 *     "acbatpwm": "市电充电PWM",
 *     "acledpwm": "市电负载PWM",
 *     "acquantity": "交流累计能耗",
 *     "loadquantity": "负载累计能耗",
 *     "solquantity": "太阳能累计充电",
 *     "batquantity": "蓄电池累计放电"
 *   }
 * }
 *
 */
export function fetchLightColumns() {
	return request({
		url: '/sys/setting/QueryLightColumns',
		method: 'POST',
		data: {}
	}).then(res =>{
		console.log(base64Decode(res.data.data))
	}).catch(err =>{
		console.error('获取单灯显示列配置失败',err.message)
	});
}
