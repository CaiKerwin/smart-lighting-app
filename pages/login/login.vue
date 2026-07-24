<template>
	<view class="login-page">
		<view class="login-card">
			<view class="title">欢迎登录</view>
			<view class="subtitle">智慧城市管理平台</view>

			<view class="input-group">
				<view class="input-label">用户名</view>
				<input
					class="input-field"
					type="text"
					v-model="username"
					placeholder="请输入用户名"
					placeholder-style="color: #cbd2dc;"
				/>
			</view>

			<view class="input-group">
				<view class="input-label">密码</view>
				<view class="password-wrapper">
					<input
						class="input-field"
						:password="!passwordVisible"
						v-model="password"
						placeholder="请输入密码"
						placeholder-style="color: #cbd2dc;"
					/>
					<image
						class="eye-icon"
						:src="passwordVisible ? '/static/login/eye-open.png' : '/static/login/eye-close.png'"
						@click="togglePasswordVisible"
					/>
				</view>
			</view>

			<view class="login-actions">
				<view class="remember-password">
					<checkbox class="custom-checkbox" v-model="rememberPassword" color="#3075ff" />
					<text class="remember-text">记住密码</text>
				</view>
				<text class="phone-login" @click="phoneLogin">手机号登录</text>
			</view>

			<button class="login-button" type="primary" :disabled="isLogining" @click="handleLogin">
				{{ isLogining ? '登录中...' : '登录' }}
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			username: '',
			password: '',
			passwordVisible: false,
			rememberPassword: false,
			isLogining: false
		};
	},
	onLoad() {
		this.loadSavedLogin();
	},
	onShow() {
		this.loadSavedLogin();
	},
	methods: {
		loadSavedLogin() {
			try {
				const savedLogin = uni.getStorageSync('rememberedLogin');
				if (savedLogin && typeof savedLogin === 'object') {
					this.username = savedLogin.username || '';
					this.password = savedLogin.password || '';
					this.rememberPassword = true;
					return;
				}
			} catch (e) {
				console.error('读取保存的登录信息失败', e);
			}

			this.rememberPassword = false;
		},
		togglePasswordVisible() {
			this.passwordVisible = !this.passwordVisible;
		},
		isLoginSuccess(payload) {
			if (typeof payload === 'string') {
				const text = payload.toLowerCase();
				return text.includes('success') || text.includes('ok') || text.includes('成功');
			}
			if (!payload || typeof payload !== 'object') {
				return false;
			}

			const body = payload.data && typeof payload.data === 'object' ? payload.data : payload;
			const code = body.code ?? payload.code ?? body.status ?? payload.status;
			const successFlag = body.success ?? payload.success ?? body.ok ?? payload.ok ?? body.isSuccess ?? payload.isSuccess ?? body.result ?? payload.result;
			const message = this.extractMessage(body) || this.extractMessage(payload);

			if (typeof successFlag === 'boolean') {
				return successFlag;
			}
			if (typeof code === 'number') {
				return code === 0 || code === 200 || code === 20000;
			}
			if (message) {
				return /成功|success|ok|登录成功/i.test(message);
			}
			return false;
		},
		extractMessage(payload) {
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
		},
		extractToken(payload) {
			const body = payload && payload.data && typeof payload.data === 'object' ? payload.data : payload;
			const candidates = [
				body.token,
				body.accessToken,
				body.access_token,
				payload && payload.token,
				payload && payload.accessToken,
				payload && payload.access_token
			];
			for (const item of candidates) {
				if (typeof item === 'string' && item.trim()) {
					return item;
				}
			}
			return '';
		},
		handleLogin() {
			if (!this.username.trim()) {
				uni.showToast({ title: '请输入用户名', icon: 'none' });
				return;
			}
			if (!this.password) {
				uni.showToast({ title: '请输入密码', icon: 'none' });
				return;
			}

			this.isLogining = true;
			uni.showLoading({ title: '登录中...' });

			uni.request({
				url: 'https://www.amdm.top/api/center/common/auth/AppLogin',
				method: 'POST',
				header: {
					'Content-Type': 'application/json'
				},
				data: {
					name: this.username.trim(),
					pswd: this.password
				},
				success: (res) => {
					const payload = res.data;
					if (this.isLoginSuccess(payload)) {
						const token = this.extractToken(payload);
						if (token) {
							uni.setStorageSync('authToken', token);
						}

						if (this.rememberPassword) {
							uni.setStorageSync('rememberedLogin', {
								username: this.username.trim(),
								password: this.password
							});
						} else {
							try {
								uni.removeStorageSync('rememberedLogin');
							} catch (e) {
								console.error('清除保存的登录信息失败', e);
							}
						}

						uni.showToast({ title: '登录成功', icon: 'success' });
						setTimeout(() => {
							uni.reLaunch({ url: '/pages/index/index' });
						}, 800);
					} else {
						const message = this.extractMessage(payload) || '用户名或密码错误';
						uni.showToast({ title: message, icon: 'none' });
					}
				},
				fail: () => {
					uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
				},
				complete: () => {
					this.isLogining = false;
					uni.hideLoading();
				}
			});
		},
		phoneLogin() {
			uni.redirectTo({
				url: '/pages/login/phoneLogin'
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.login-page {
	min-height: 100vh;
	background: #ffffff;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20rpx 40rpx;
}

.login-card {
	width: 100%;
	max-width: 680rpx;
	background: transparent;
}

.title {
	font-size: 32px;
	font-weight: 700;
	color: #1f2d3d;
	margin-bottom: 8rpx;
}

.subtitle {
	font-size: 16px;
	font-weight: bold;
	color: #64718a;
	margin-bottom: 64rpx;
}

.input-group {
	margin-bottom: 40rpx;
}

.input-label {
	font-size: 32rpx;
	font-weight: 600;
	color: #1f2d3d;
	margin-bottom: 16rpx;
}

.input-field {
	width: 100%;
	height: 40rpx;
	padding: 12rpx 0;
	border: none;
	border-bottom: 1px solid #e4e7ed;
	background: transparent;
	font-size: 28rpx;
	color: #1f2d3d;
	transition: border-color 0.3s;
}
.input-field:focus {
	border-bottom-color: #3075ff;
}

.password-wrapper {
	display: flex;
	align-items: center;
	width: 100%;
}

.password-wrapper .input-field {
	flex: 1;
	padding-right: 0;
}

.eye-icon {
	width: 24rpx;
	height: 12rpx;
	margin-left: 12rpx;
	opacity: 0.6;
	background-color: transparent;
}

.login-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 24rpx;
	margin-bottom: 60rpx;
}

.remember-password {
	display: flex;
	align-items: center;
}

.remember-text,
.phone-login {
	font-size: 24rpx;
	color: #6c7b92;
}

.custom-checkbox {
	transform: scale(0.8);
	margin-left: -8rpx;
}

.remember-text {
	margin-left: 12rpx;
	font-size: 24rpx;
	color: #6c7b92;
}

.login-button {
	width: 100%;
	height: 96rpx;
	line-height: 96rpx;
	border-radius: 24rpx;
	background: linear-gradient(90deg, #3d80ff 0%, #1ba6ff 100%);
	color: #ffffff;
	font-size: 32rpx;
	border: none;
}
.login-button::after {
	border: none;
}
</style>
