<template>
	<!-- 语言切换入口 -->
	<view :class="themeClass" class="language-switch" @click="openLanguageSheet">
		<uni-icons :color="isDarkMode ? '#5a97ff' : '#3880FC'" size="16" type="font" />
		<text class="language-name">{{ currentLanguageName }}</text>
	</view>
</template>

<script>
	import { LANGUAGE_OPTIONS, LANGUAGE_ITEM_LIST, getCurrentLanguage, setLanguage } from '@/utils/locale';

	export default {
		name: 'LanguageSwitch',
		data() {
			return {
				// 当前语言标识：切换后立即更新，界面文案同步刷新
				currentLanguage: getCurrentLanguage()
			};
		},
		computed: {
			// 入口显示文案：语言自称（如「简体中文」），默认即为简体中文
			currentLanguageName() {
				const option = LANGUAGE_OPTIONS.find((item) => item.value === this.currentLanguage);
				return option ? option.label : this.$t('language.label');
			}
		},
		methods: {
			// 选择语言
			openLanguageSheet() {
				uni.showActionSheet({
					itemList: LANGUAGE_ITEM_LIST,
					itemColor: '#3880FC',
					success: (res) => {
						const option = LANGUAGE_OPTIONS[res.tapIndex];
						// 未选择或与当前语言相同时不做处理
						if (!option || option.value === this.currentLanguage) {
							return;
						}
						// 切换语言：i18n 文案、uni 内置文案、本地存储同步更新
						this.currentLanguage = setLanguage(option.value);
						this.$emit('change', this.currentLanguage);
					}
				});
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
