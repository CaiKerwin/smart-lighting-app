<template>
	<view class="login-page">
		<view class="login-card">
			<view class="title">欢迎登录</view>
			<view class="subtitle">智慧城市管理平台</view>

			<view class="input-group">
				<view class="input-label">手机号</view>
				<input
					class="input-field"
					type="number"
					v-model="phone"
					placeholder="请输入手机号"
					placeholder-style="color: #cbd2dc;"
				/>
			</view>

			<view class="input-group">
				<view class="input-label">验证码</view>
				<view class="password-wrapper">
					<input
						class="input-field"
						type="text"
						v-model="verifyCode"
						placeholder="请输入验证码"
						placeholder-style="color: #cbd2dc;"
					/>
					<text class="code-button" @click="getCode">{{ codeText }}</text>
				</view>
			</view>

			<button class="login-button" type="primary" @click="handleLogin">登录</button>

			<view class="switch-login">
				<text class="switch-text" @click="goPasswordLogin">账号密码登录</text>
			</view>
		</view>
	</view>
</template>

<script>
import {base64Decode} from "@/utils/common";

export default {
	data() {
		return {
			phone: '',
			verifyCode: '',
			codeText: '获取验证码',
			counting: false
		};
	},
	methods: {
		validatePhone(phone) {
			const phoneRegex = /^1[3456789]\d{9}$/;
			return phoneRegex.test(phone);
		},
		getCode() {
			if (!this.phone) {
				uni.showToast({ title: '请输入手机号', icon: 'none' });
				return;
			}
			if (this.counting) return;

			if (!this.validatePhone(this.phone)) {
				uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' });
				return;
			}

			//先获取短信登录码
			uni.request({
				url: 'https://www.amdm.top/api/center/common/auth/GetSmsCode',
				method: 'POST',
				data: { mobile: this.phone },
				success: (res) => {
					console.log(base64Decode(res.data.data));
					uni.showToast({ title: '验证码已发送', icon: 'success' });
				},
				fail: (err) => {
					uni.showToast({ title: '发送失败，请重试', icon: 'none' });
					console.error(err);
				}
			});

			// 启动倒计时
			this.counting = true;
			this.codeText = '60s';
			let seconds = 60;
			const timer = setInterval(() => {
				seconds--;
				this.codeText = `${seconds}s`;
				if (seconds <= 0) {
					clearInterval(timer);
					this.counting = false;
					this.codeText = '重新获取';
				}
			}, 1000);
		},
		handleLogin() {
			if (!this.phone) {
				uni.showToast({ title: '请输入手机号', icon: 'none' });
				return;
			}
			if (!this.verifyCode) {
				uni.showToast({ title: '请输入验证码', icon: 'none' });
				return;
			}

			// 登录
			uni.request({
				url: 'https://www.amdm.top/api/center/common/auth/SMSLogin',
				method: 'POST',
				data: {
					mobile: this.phone,
					code: this.verifyCode
				},
				success: (res) => {
					console.log(base64Decode(res.data.data));
					const result = JSON.parse(base64Decode(res.data.data));
					if (result.token) {
						// 存储登录信息
						uni.setStorageSync('authToken', result.token);
						uni.setStorageSync('curCust', result.curCust);
						uni.setStorageSync('curApp', result.curApp);
						uni.setStorageSync('userId', result.id); // 用户ID
						uni.showToast({ title: '登录成功', icon: 'success' });
						setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1000);
					} else {
						const errMsg = result.message || result.msg || '登录失败';
						uni.showToast({ title: errMsg, icon: 'none' });
					}
				},
				fail: (err) => {
					uni.showToast({ title: '网络请求失败', icon: 'none' });
					console.error(err);
				}
			});
		},
		goPasswordLogin() {
			if (getCurrentPages().length > 1) {
				uni.navigateBack();
			} else {
				uni.redirectTo({ url: '/pages/login/login' });
			}
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

.code-button {
	margin-left: 12rpx;
	padding: 8rpx 16rpx;
	font-size: 24rpx;
	color: #3075ff;
	white-space: nowrap;
}

.switch-login {
	margin-top: 24rpx;
	text-align: center;
}

.switch-text {
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
