/**
 * 请求拦截器配置
 * @param {Object} options - 请求接口的配置项
 */
const baseUrl = 'https://www.amdm.top/api/center';

export const request = (options) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: baseUrl + options.url,
			method: options.method,
			header: {
				'Content-Type': 'application/json',
				'auth': uni.getStorageSync('authToken'),
				'Custid': String(uni.getStorageSync('curCust')),
				'Lang': 'zh_cn',
				'Apptype': uni.getStorageSync('curApp') || 'road',
				...options.header
			},
			data: options.data || {},
			success: (res) => {
				// 出现错误时的返回结果
				// {
				// 	"code": xxx,
				// 	"data": "xxx",
				// 	"abab": false
				// }
				const payload = res.data;
				// code === 990008 表示 会话已过期
				if (payload && (payload.code === 990008)) {
					// 清空所有登录缓存
					uni.removeStorageSync('authToken');
					uni.removeStorageSync('curCust');
					uni.removeStorageSync('curApp');
					uni.removeStorageSync('userId');
					uni.showModal({
						title: '登录已过期',
						content: '请重新登录',
						showCancel: false,
						confirmText: '确定'
					});
					// 点击确定后跳转登录页（使用重定向，避免返回）
					uni.reLaunch({ url: '/pages/login/login' });
					reject(new Error('登录已过期，请重新登录'));
				} else {
					resolve(res);
				}
			},
			fail: (err) => {
				reject(err);
			}
		});
	});
};
