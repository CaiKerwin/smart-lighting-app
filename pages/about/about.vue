<template>
	<view :class="themeClass" class="page-wrapper">
		<!-- 顶部品牌区 -->
		<view class="header-section">
			<view class="app-logo">
				<img alt="logo" class="logo-img" src="/static/common/logo.png" />
			</view>
			<view class="app-name">{{ $t('about.appName') }}</view>
			<view class="app-slogan">{{ $t('about.appSlogan') }}</view>
		</view>

		<!-- 内容主体 -->
		<view class="content-body">
			<!-- 关于本应用 -->
			<view class="card">
				<view class="section-header">
					<text class="section-title">{{ $t('about.appSectionTitle') }}</text>
				</view>
				<text class="section-desc">{{ $t('about.appIntro') }}</text>
				<view class="feature-grid">
					<view
						v-for="(item, index) in appFeatures"
						:key="index"
						class="feature-item"
						hover-class="feature-item-hover"
						hover-stay-time="120"
					>
						<view :class="'feature-icon-' + index" class="feature-icon">
							<uni-icons :type="item.icon" color="#ffffff" size="20"></uni-icons>
						</view>
						<text class="feature-title">{{ $t('about.' + item.titleKey) }}</text>
						<text class="feature-desc">{{ $t('about.' + item.descKey) }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 版权信息 -->
		<view class="footer">
			<view class="footer-icons">
				<!-- #ifndef MP-WEIXIN -->
				<view class="footer-icon-wrap">
					<view
						class="wechat-icon"
						hover-class="wechat-icon-press"
						hover-stay-time="80"
						@click="toggleWechatQrcode"
					>
						<uni-icons :color="showWechatQrcode ? '#07c160' : (isDarkMode ? '#6d7689' : '#aaaaaa')" size="30" type="weixin" />
					</view>
					<view v-if="showWechatQrcode" class="qrcode-popup" @click.stop>
						<view class="qrcode-card">
							<image class="qrcode-img" mode="widthFix" src="/static/common/qrcode-wechat.jpg" />
							<text class="qrcode-hint">{{ $t('about.scanWechat') }}</text>
						</view>
						<view class="qrcode-arrow"></view>
					</view>
				</view>
				<!-- #endif -->
				<!-- #ifndef APP-ANDROID -->
				<view class="footer-icon-wrap">
					<view
						class="android-icon"
						hover-class="android-icon-press"
						hover-stay-time="80"
						@click="toggleAndroidQrcode"
					>
						<image
							:src="showAndroidQrcode ? '/static/common/android-active.png' : '/static/common/android.png'"
							class="android-icon-img"
							mode="aspectFit"
						/>
					</view>
					<view v-if="showAndroidQrcode" class="qrcode-popup" @click.stop>
						<view class="qrcode-card">
							<image class="qrcode-img" mode="widthFix" src="/static/common/qrcode-android.png" />
							<text class="qrcode-hint">{{ $t('about.scanAndroid') }}</text>
						</view>
						<view class="qrcode-arrow"></view>
					</view>
				</view>
				<!-- #endif -->
				<!-- #ifndef H5 -->
				<view class="footer-icon-wrap">
					<view
						class="web-icon"
						hover-class="web-icon-press"
						hover-stay-time="80"
						@click="toggleWebText"
					>
						<image
							:src="showWebText ? '/static/common/web-active.png' : '/static/common/web.png'"
							class="web-icon-img"
							mode="aspectFit"
						/>
					</view>
					<view v-if="showWebText" class="web-text" @click.stop>
						<text class="web-text-hint">{{ $t('about.webText') }}</text>
						<uni-link
							color="#358cfb"
							font-size="12"
							href="https://m.amdm.top"
							showUnderLine="false"
						>
							https://m.amdm.top
						</uni-link>
						<view class="qrcode-arrow"></view>
					</view>
				</view>
				<!-- #endif -->
			</view>
			<view class="footer-divider"></view>
			<uni-link
				:text="$t('about.companyName')"
				:color="isDarkMode ? '#6d7689' : '#aaaaaa'"
				font-size="12"
				href="https://www.amdm.top"
				showUnderLine="false"
			/>
			<text class="copyright-text">Copyright © {{ currentYear }} {{ $t('about.copyright') }}</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentYear: new Date().getFullYear(),
			showWechatQrcode: false, // 是否显示微信二维码
			showAndroidQrcode: false, // 是否显示安卓二维码
			showWebText: false, // 是否显示网站文本
			appFeatures: [
				{ icon: 'videocam', titleKey: 'feature1Title', descKey: 'feature1Desc' },
				{ icon: 'notification', titleKey: 'feature2Title', descKey: 'feature2Desc' },
				{ icon: 'compose', titleKey: 'feature3Title', descKey: 'feature3Desc' },
				{ icon: 'bars', titleKey: 'feature4Title', descKey: 'feature4Desc' }
			]
		};
	},
	methods: {
		toggleWechatQrcode() {
			this.showWechatQrcode = !this.showWechatQrcode;
			this.showAndroidQrcode = false;
			this.showWebText = false;
		},
		toggleAndroidQrcode() {
			this.showAndroidQrcode = !this.showAndroidQrcode;
			this.showWechatQrcode = false;
			this.showWebText = false;
		},
		toggleWebText() {
			this.showWebText = !this.showWebText;
			this.showWechatQrcode = false;
			this.showAndroidQrcode = false;
		}
	}
}
</script>

<style lang="scss" scoped>
.page-wrapper {
	min-height: 100vh;
	background-color: var(--bg-page, #f6f8fb);
	box-sizing: border-box;
	padding-bottom: 60rpx;
}

/* --- 顶部品牌区 --- */
.header-section {
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 64rpx 0 120rpx;
	background: linear-gradient(180deg, #358cfb 0%, #5baaff 100%);
	border-radius: 0 0 48rpx 48rpx;
}

/* 夜间模式：顶部渐变改为深蓝，与暗色界面统一（文字仍为白色） */
.theme-dark .header-section {
	background: linear-gradient(180deg, #1e2f52 0%, #2a3f6b 100%);
}

/* 背景装饰圆 */
.header-section::before {
	content: '';
	position: absolute;
	top: -140rpx;
	right: -90rpx;
	width: 340rpx;
	height: 340rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
}

.header-section::after {
	content: '';
	position: absolute;
	bottom: -140rpx;
	left: -80rpx;
	width: 300rpx;
	height: 300rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.06);
}

/* 应用 Logo */
.app-logo {
	position: relative;
	z-index: 1;
	width: 168rpx;
	height: 168rpx;
	border-radius: 40rpx;
	overflow: hidden;
	box-shadow: 0 20rpx 48rpx rgba(13, 68, 158, 0.35);
}

.logo-img {
	display: block;
	width: 100%;
	height: 100%;
}

.app-name {
	position: relative;
	z-index: 1;
	margin-top: 34rpx;
	font-size: 40rpx;
	font-weight: bold;
	color: #ffffff;
	letter-spacing: 4rpx;
	text-shadow: 0 4rpx 16rpx rgba(13, 68, 158, 0.3);
}

.app-slogan {
	position: relative;
	z-index: 1;
	margin-top: 14rpx;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.88);
	letter-spacing: 4rpx;
}

/* --- 内容主体 --- */
.content-body {
	position: relative;
	z-index: 1;
	margin-top: -52rpx;
	padding: 0 24rpx;
}

.card {
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	padding: 36rpx 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 8rpx 32rpx rgba(31, 92, 174, 0.1);
}

/* 卡片标题 */
.section-header {
	display: flex;
	align-items: center;
	padding-bottom: 24rpx;
	margin-bottom: 26rpx;
	border-bottom: 2rpx solid var(--border-color, #f2f4f7);
}

.section-title {
	position: relative;
	padding-left: 22rpx;
	font-size: 32rpx;
	font-weight: bold;
	color: var(--text-primary, #333333);
}

.section-title::before {
	content: '';
	position: absolute;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 8rpx;
	height: 28rpx;
	border-radius: 4rpx;
	background: linear-gradient(180deg, #358cfb 0%, #5baaff 100%);
}

.section-desc {
	display: block;
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
	line-height: 1.8;
	text-align: justify;
}

/* --- 功能列表 --- */
.feature-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin-top: 12rpx;
}

.feature-item {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	width: 48%;
	box-sizing: border-box;
	padding: 26rpx 24rpx;
	margin-bottom: 22rpx;
	background: var(--bg-accent, #f7faff);
	border: 2rpx solid var(--border-color, #eef3fc);
	border-radius: 20rpx;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-item-hover {
	transform: translateY(-6rpx);
	box-shadow: 0 12rpx 28rpx rgba(53, 140, 251, 0.14);
}

.feature-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 58rpx;
	height: 58rpx;
	border-radius: 16rpx;
	flex-shrink: 0;
}

.feature-icon-0 {
	background: linear-gradient(135deg, #358cfb 0%, #5baaff 100%);
	box-shadow: 0 6rpx 16rpx rgba(53, 140, 251, 0.3);
}

.feature-icon-1 {
	background: linear-gradient(135deg, #ff9d6c 0%, #ff5f4d 100%);
	box-shadow: 0 6rpx 16rpx rgba(255, 95, 77, 0.3);
}

.feature-icon-2 {
	background: linear-gradient(135deg, #3ecf8e 0%, #1fa963 100%);
	box-shadow: 0 6rpx 16rpx rgba(31, 169, 99, 0.3);
}

.feature-icon-3 {
	background: linear-gradient(135deg, #a88bff 0%, #6f5bff 100%);
	box-shadow: 0 6rpx 16rpx rgba(111, 91, 255, 0.3);
}

.feature-title {
	margin-top: 20rpx;
	font-size: 26rpx;
	font-weight: bold;
	color: var(--text-primary, #333333);
}

.feature-desc {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: var(--text-quaternary, #999999);
	line-height: 1.5;
}

/* --- 底部 --- */
.footer {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24rpx 24rpx 0;
}

/* 底部图标入口行 */
.footer-icons {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
}

/* 单个图标入口 */
.footer-icon-wrap {
	position: relative;
	display: flex;
	justify-content: center;
	margin: 0 16rpx;
}

.wechat-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s ease;
}

.wechat-icon .uni-icons {
	transition: color 0.25s ease;
}

.wechat-icon-press {
	transform: scale(0.85);
}

.android-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s ease;
}

.android-icon-img {
	display: block;
	width: 60rpx;
	height: 60rpx;
}

.android-icon-press {
	transform: scale(0.85);
}

.web-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s ease;
}

.web-icon-img {
	display: block;
	width: 50rpx;
	height: 50rpx;
}

.web-icon-press {
	transform: scale(0.85);
}

/* 二维码浮层 */
.qrcode-popup {
	position: absolute;
	bottom: calc(100% + 24rpx);
	left: 50%;
	transform: translateX(-50%);
	z-index: 10;
	padding: 16rpx;
	background: var(--bg-card, #ffffff);
	border: 2rpx solid var(--border-color, #eef0f3);
	border-radius: 20rpx;
	box-shadow: 0 16rpx 48rpx rgba(31, 92, 174, 0.16);
	animation: qrcode-pop 0.25s ease;
}

@keyframes qrcode-pop {
	from {
		opacity: 0;
		transform: translateX(-50%) translateY(12rpx);
	}

	to {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}
}

.qrcode-arrow {
	position: absolute;
	bottom: -13rpx;
	left: 50%;
	margin-left: -12rpx;
	width: 24rpx;
	height: 24rpx;
	background: var(--bg-card, #ffffff);
	border-right: 2rpx solid var(--border-color, #eef0f3);
	border-bottom: 2rpx solid var(--border-color, #eef0f3);
	transform: rotate(45deg);
}

.qrcode-card {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.qrcode-img {
	display: block;
	width: 300rpx;
	border-radius: 8rpx;
}

.qrcode-hint {
	margin-top: 14rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: var(--text-secondary, #666666);
	text-align: center;
}

/* 网页版说明浮层 */
.web-text {
	position: absolute;
	bottom: calc(100% + 24rpx);
	left: 50%;
	transform: translateX(-50%);
	z-index: 10;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 28rpx 36rpx;
	background: var(--bg-card, #ffffff);
	border: 2rpx solid var(--border-color, #eef0f3);
	border-radius: 20rpx;
	box-shadow: 0 16rpx 48rpx rgba(31, 92, 174, 0.16);
	animation: qrcode-pop 0.25s ease;
}

.web-text-hint {
	font-size: 24rpx;
	line-height: 1.5;
	color: var(--text-secondary, #666666);
	white-space: nowrap;
}

.web-text .uni-link {
	margin-top: 6rpx;
	white-space: nowrap;
}

.footer-divider {
	width: 64rpx;
	height: 2rpx;
	margin: 30rpx 0 22rpx;
	border-radius: 2rpx;
	background: var(--bg-soft, #d9d9d9);
}

.copyright-text {
	font-size: 24rpx;
	color: var(--text-quaternary, #aaaaaa);
	line-height: 1.9;
	text-align: center;
}
</style>
