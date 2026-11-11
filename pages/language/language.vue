<template>
	<view :class="themeClass" class="language-page">
		<view class="language-list">
			<!--
				语言列表：uni-indexed-list 自带分组标题与右侧索引
				show-select 用于展示当前语言的勾选状态（组件内部为多选逻辑，
				这里在点击后同步为单选，见 syncSelectedLanguage）
			-->
			<uni-indexed-list
				ref="indexedList"
				:options="indexedOptions"
				:show-select="true"
				@click="handleLanguageSelect"
			/>
		</view>
	</view>
</template>

<script>
	import {LANGUAGE_INDEX_OPTIONS, LANGUAGE_OPTIONS, getCurrentLanguage, getLanguageLabel, setLanguage} from '@/utils/locale';

	export default {
		name: 'LanguageSelect',
		data() {
			return {
				// uni-indexed-list 的分组数据（语言自称 + 首字母分组）
				indexedOptions: LANGUAGE_INDEX_OPTIONS,
				// 当前语言：点击后先更新，用于即时刷新列表中的勾选状态
				currentValue: getCurrentLanguage(),
				// uni-indexed-list 挂载后延迟生成内部 lists，未就绪时短暂重试
				checkTimer: null,
				// 防止连续点击重复切换语言
				isLeaving: false,
				navigateTimer: null
			};
		},
		onShow() {
			// 进入页面时按当前语言刷新原生导航栏标题
			uni.setNavigationBarTitle({ title: this.$t('language.title') });
		},
		mounted() {
			// 把当前语言标记为选中
			this.syncSelectedLanguage();
		},
		beforeDestroy() {
			clearTimeout(this.checkTimer);
			clearTimeout(this.navigateTimer);
		},
		methods: {
			/**
			 * 同步列表的单选状态
			 *
			 * uni-indexed-list 的 options.data 只接受字符串，无法通过 options 预置 checked；
			 * 这里在组件内部 lists 生成后，把当前语言这一项标记为选中。点击时组件默认
			 * 会保留旧选项（多选），所以需要再调用一次本方法覆盖为单选。
			 * @param {number} attempt - 内部重试次数（组件约 50ms 后才生成 lists）
			 */
			syncSelectedLanguage(attempt = 0) {
				clearTimeout(this.checkTimer);

				const list = this.$refs.indexedList;
				if (!list || !Array.isArray(list.lists) || list.lists.length === 0) {
					if (attempt < 20) {
						this.checkTimer = setTimeout(() => this.syncSelectedLanguage(attempt + 1), 50);
					}
					return;
				}

				const currentLabel = getLanguageLabel(this.currentValue);
				list.lists.forEach((group) => {
					group.items.forEach((item) => {
						item.checked = item.name === currentLabel;
					});
				});
			},
			/**
			 * 点击语言：立即生效并返回上一页
			 * @param {{item: {name: string}}} event - uni-indexed-list 的 click 事件
			 */
			handleLanguageSelect(event) {
				if (this.isLeaving) {
					return;
				}
				const option = LANGUAGE_OPTIONS.find((item) => item.label === (event && event.item && event.item.name));
				if (!option) {
					return;
				}
				this.isLeaving = true;

				this.currentValue = option.value;
				this.syncSelectedLanguage();
				if (option.value !== getCurrentLanguage()) {
					setLanguage(option.value);
				}

				// 短暂停留展示勾选结果再返回，上一页在 onShow 中刷新导航栏与界面文案
				this.navigateTimer = setTimeout(() => this.goBack(), 180);
			},
			// 返回上一页
			goBack() {
				if (getCurrentPages().length > 1) {
					uni.navigateBack({ delta: 1 });
					return;
				}
				uni.reLaunch({ url: '/pages/login/login' });
			}
		}
	};
</script>

<style lang="scss" scoped>
.language-page {
	position: relative;
	height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
	box-sizing: border-box;
	background: var(--bg-page, #f8f8f8);
	overflow: hidden;
}

/* uni-indexed-list 通过绝对定位铺满容器 */
.language-list {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
}

/* 覆盖 uni-indexed-list 内置的浅色样式，跟随应用白天/夜间主题 */
.language-list ::v-deep .uni-indexed-list__title-wrapper {
	background-color: var(--bg-page, #f8f8f8);
}

.language-list ::v-deep .uni-indexed-list__title {
	color: var(--text-tertiary, #888888);
	font-size: 28rpx;
	font-weight: 600;
}

.language-list ::v-deep .uni-indexed-list__list {
	background-color: var(--bg-card, #ffffff);
}

.language-list ::v-deep .uni-indexed-list__item-border {
	border-bottom-color: var(--border-color, #e5e5e5);
}

.language-list ::v-deep .uni-indexed-list__item-content {
	color: var(--text-primary, #333333);
	font-size: 30rpx;
}

.language-list ::v-deep .uni-indexed-list__menu-text {
	color: var(--text-tertiary, #888888);
}

.language-list ::v-deep .uni-indexed-list__menu-text--active {
	color: #ffffff;
	background-color: #3d80ff;
}

/*
	单选视觉：未选中项的空心圆隐藏但保留占位，避免文字左右跳动；
	仅当前语言显示勾选图标（更接近 Instagram 语言列表的选中态）
*/
.language-list ::v-deep .uniui-circle {
	visibility: hidden;
}

.language-list ::v-deep .uniui-checkbox-filled {
	color: #3d80ff !important;
}

.theme-dark .language-list ::v-deep .uniui-checkbox-filled {
	color: #5a97ff !important;
}
</style>
