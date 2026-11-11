<template>
	<!-- 语言切换入口：点击进入统一的语言选择页（uni-indexed-list） -->
	<view :class="themeClass" class="language-switch" @click="openLanguagePage">
		<uni-icons :color="isDarkMode ? '#5a97ff' : '#3880FC'" size="16" type="font" />
		<text class="language-name">{{ currentLanguageName }}</text>
	</view>
</template>

<script>
	import { getCurrentLanguage, getLanguageLabel, isSupportedLanguage } from '@/utils/locale';

	export default {
		name: 'LanguageSwitch',
		computed: {
			// 当前语言：读取 i18n.locale 建立响应式依赖，语言选择页切换后入口文案自动刷新
			currentLanguage() {
				const locale = this.$i18n && this.$i18n.locale;
				return isSupportedLanguage(locale) ? locale : getCurrentLanguage();
			},
			// 入口显示文案：语言自称（如「简体中文」），默认即为简体中文
			currentLanguageName() {
				return getLanguageLabel(this.currentLanguage) || this.$t('language.label');
			}
		},
		methods: {
			// 进入语言选择页，选择结果由该页写入并持久化
			openLanguagePage() {
				uni.navigateTo({ url: '/pages/language/language' });
			}
		}
	};
</script>

<style lang="scss" scoped>
.language-switch {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	height: 72rpx;
	padding: 0 24rpx;
	border-radius: 36rpx;
	background: var(--bg-card, #ffffff);
	border: 2rpx solid var(--border-color, #e5e5e5);
}

.language-name {
	margin: 0 8rpx;
	font-size: 24rpx;
	color: var(--text-secondary, #333333);
}
</style>
