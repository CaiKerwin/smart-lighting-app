<template>
	<view class="login-page">
		<view class="login-card">
			<view class="title">短信修改密码</view>
			<view class="input-group">
				<view class="input-label">手机号</view>
				<input
					class="input-field"
					type="number"
					v-model="phone"
					placeholder="请输入手机号"
					placeholder-style="color: #cbd2dc;"
				/>
				<text class="phone-hint">仅支持中国大陆地区手机号</text>
			</view>

			<view class="input-group">
				<view class="input-label">新密码</view>
				<view class="password-wrapper">
					<input
						class="input-field"
						:password="!newPasswordVisible"
						v-model="newPassword"
						placeholder="请输入新密码"
						placeholder-style="color: #cbd2dc;"
					/>
					<image
						class="eye-icon"
						:src="newPasswordVisible ? '/static/login/eye-open.png' : '/static/login/eye-close.png'"
						@click="toggleNewPasswordVisible"
					/>
				</view>
				<text class="hint-text">*由数字、字母、特殊符号三种组成的8~16位字符，字母区分大小写。</text>
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

			<button class="login-button" type="primary" @click="handleSubmit">修改密码</button>

			<view class="switch-login">
				<text class="switch-text" @click="goPasswordModify">原密码修改</text>
			</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	name: 'PhoneModifyPassword',
	data() {
		return {
			phone: '',
			newPassword: '',
			verifyCode: '',
			newPasswordVisible: false,
			codeText: '获取验证码',
			counting: false
		};
	},
	methods: {
		toggleNewPasswordVisible() {
			this.newPasswordVisible = !this.newPasswordVisible;
		},
		validatePhone(phone) {
			return /^1\d{10}$/.test(phone);
		},
		validatePassword(pwd) {
			const reg = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;
			return reg.test(pwd);
		},
		getCode() {
			if (!this.phone) {
				uni.showToast({ title: '请输入手机号', icon: 'none' });
				return;
			}
			if (!this.validatePhone(this.phone)) {
				uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' });
				return;
			}
			if (this.counting) {
				return;
			}

			// 发送验证码
			request({
				url: '/common/auth/GetModifySmsCode',
				method: 'POST',
				data: {
					mobile: this.phone
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				uni.showToast({ title: '验证码已发送', icon: 'success' });
			}).catch(err =>{
				console.error(err.message);
				uni.showToast({ title: '发送失败，请重试', icon: 'none' });
			});

			// 开始倒计时
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
		handleSubmit() {
			if (!this.phone) {
				uni.showToast({ title: '请输入手机号', icon: 'none' });
				return;
			}
			if (!this.validatePhone(this.phone)) {
				uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' });
				return;
			}
			if (!this.newPassword) {
				uni.showToast({ title: '请输入新密码', icon: 'none' });
				return;
			}
			if (!this.validatePassword(this.newPassword)) {
				uni.showToast({ title: '密码需包含数字、字母、特殊符号且长度8~16位', icon: 'none' });
				return;
			}
			if (!this.verifyCode) {
				uni.showToast({ title: '请输入验证码', icon: 'none' });
				return;
			}

			// 提交修改密码请求
			request({
				url: '/common/auth/ModifyBySms',
				method: 'POST',
				data: {
					mobile: this.phone,
					pswd: this.newPassword,
					code: this.verifyCode
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				if (res.data.code === 0 || res.statusCode === 200){
					uni.showModal({
						title: '提示',
						content: '修改成功，请重新登录',
						showCancel: false,
						success: (res) => {
							if (res.confirm) {
								uni.reLaunch({ url: '/pages/login/login' });
							}
						}
					});
				}
			}).catch(err =>{
				console.error(err.message);
				uni.showToast({ title: '修改失败，请重试', icon: 'none' });
			});
		},
		goPasswordModify() {
			uni.redirectTo({ url: '/pages/modifyPassword/modifyPassword' });
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
	position: relative;
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

.phone-hint {
	margin-top: 12rpx;
	font-size: 22rpx;
	color: #909ba6;
	line-height: 1.4;
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

.hint-text {
	margin-top: 16rpx;
	font-size: 22rpx;
	color: #909ba6;
	line-height: 34rpx;
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
