<template>
	<view class="page-wrapper">
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
					<view v-for="(item, index) in appFeatures" :key="index" class="feature-item">
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
			<uni-link
				:text="$t('about.companyName')"
				color="#aaaaaa"
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
			appFeatures: [
				{ icon: 'videocam', titleKey: 'feature1Title', descKey: 'feature1Desc' },
				{ icon: 'notification', titleKey: 'feature2Title', descKey: 'feature2Desc' },
				{ icon: 'compose', titleKey: 'feature3Title', descKey: 'feature3Desc' },
				{ icon: 'bars', titleKey: 'feature4Title', descKey: 'feature4Desc' }
			]
		};
	}
}
</script>

<style lang="scss" scoped>
.page-wrapper {
	min-height: 100vh;
	background-color: #f8f8f8;
	box-sizing: border-box;
	padding-bottom: 40rpx;
}

/* --- 顶部品牌区 --- */
.header-section {
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 56rpx 0 108rpx;
	background: linear-gradient(180deg, #358cfb 0%, #5baaff 100%);
	border-radius: 0 0 48rpx 48rpx;
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
	background: rgba(255, 255, 255, 0.08);
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
	border: 6rpx solid rgba(255, 255, 255, 0.45);
	box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.2);
	background: #ffffff;
}

.logo-img {
	display: block;
	width: 100%;
	height: 100%;
}

.app-name {
	position: relative;
	z-index: 1;
	margin-top: 30rpx;
	font-size: 40rpx;
	font-weight: bold;
	color: #ffffff;
	letter-spacing: 2rpx;
}

.app-slogan {
	position: relative;
	z-index: 1;
	margin-top: 12rpx;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.85);
}

/* --- 内容主体 --- */
.content-body {
	position: relative;
	z-index: 1;
	margin-top: -52rpx;
	padding: 0 24rpx;
}

.card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 36rpx 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 20rpx rgba(53, 140, 251, 0.08);
}

/* 卡片标题：标题 + 分隔线 */
.section-header {
	display: flex;
	align-items: center;
	padding-bottom: 24rpx;
	margin-bottom: 26rpx;
	border-bottom: 2rpx solid #f2f4f7;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.section-desc {
	display: block;
	font-size: 26rpx;
	color: #666666;
	line-height: 1.8;
	text-align: justify;
}

/* --- 功能列表（浅色小卡片） --- */
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
	background: #f7faff;
	border: 2rpx solid #eef3fc;
	border-radius: 20rpx;
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
	color: #333333;
}

.feature-desc {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #999999;
	line-height: 1.5;
}

/* --- 版权信息 --- */
.footer {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16rpx 24rpx 0;
}

.copyright-text {
	font-size: 24rpx;
	color: #aaaaaa;
	line-height: 1.9;
	text-align: center;
}
</style>
