<template>
	<uni-drawer
		ref="drawer"
		:mask="true"
		:mask-click="true"
		:width="drawerWidth"
		mode="right"
		@change="handleDrawerChange"
	>
		<view :class="themeClass" class="menu-panel">
			<!-- 抽屉头部 -->
			<view class="menu-header">
				<view class="menu-heading">
					<image
						:src="isDarkMode ? '/static/common/logo-night.png' : '/static/common/logo-day.png'"
						class="menu-logo"
						mode="aspectFit"
					/>
					<text class="menu-heading-text">{{ $t('company.appName') }}</text>
				</view>
				<view class="menu-close" hover-class="menu-close--hover" @click="closeMenu">
					<uni-icons :color="iconColor" size="24" type="closeempty"/>
				</view>
			</view>

			<!-- 菜单项 -->
			<scroll-view :show-scrollbar="false" class="menu-list" scroll-y @touchmove.stop>
				<view class="menu-list-inner">
					<view
						v-for="item in menuItems"
						:key="item.type"
						:class="{ 'menu-item--danger': item.danger }"
						class="menu-item"
						hover-class="menu-item--hover"
						@click="selectItem(item.type)"
					>
						<view :class="{ 'menu-icon--danger': item.danger }" class="menu-icon">
							<uni-icons
								:color="item.danger ? '#ff4d4f' : iconColor"
								:type="item.icon"
								size="19"
							/>
						</view>
						<text class="menu-label">{{ $t(item.label) }}</text>
					</view>
				</view>
			</scroll-view>
		</view>
	</uni-drawer>
</template>

<script>
export default {
	name: 'IndexMenu',
	props: {
		visible: {type: Boolean, default: false}
	},
	data() {
		// 抽屉宽度自适应：手机上约占屏幕宽度 65%，桌面端限制在 240~320px
		const {windowWidth = 375} = uni.getSystemInfoSync();
		return {
			drawerWidth: Math.min(320, Math.max(240, Math.round(windowWidth * 0.65)))
		};
	},
	computed: {
		// 图标颜色跟随白天/夜间主题
		iconColor() {
			return this.isDarkMode ? '#e8ecf4' : '#333333';
		},
		// 菜单项与原菜单保持一致；扫码登录仅在非 H5 端可用
		menuItems() {
			const items = [
				{type: 'account', icon: 'tune', label: 'menu.switchAccount'},
				{type: 'password', icon: 'auth', label: 'menu.modifyPassword'},
				{type: 'timeTable', icon: 'calendar', label: 'menu.timeTable'},
				{type: 'platform', icon: 'staff', label: 'menu.switchPlatform'},
				{type: 'logout', icon: 'closeempty', label: 'menu.logout', danger: true},
				{type: 'about', icon: 'info', label: 'menu.about'},
				{type: 'language', icon: 'font', label: 'menu.language'},
				{type: 'device', icon: 'search', label: 'menu.device'}
			];
			// #ifndef H5
			items.unshift({type: 'qrCode', icon: 'scan', label: 'menu.qrCode'});
			// #endif
			return items;
		}
	},
	watch: {
		// 用 visible 驱动 uni-drawer 的打开/关闭
		visible: {
			immediate: true,
			handler(val) {
				this.$nextTick(() => {
					const drawer = this.$refs.drawer;
					if (!drawer) {
						return;
					}
					if (val) {
						drawer.open();
					} else {
						drawer.close();
					}
				});
			}
		}
	},
	methods: {
		selectItem(type) {
			this.$emit('select', type);
		},
		closeMenu() {
			this.$emit('close');
		},
		// 点击遮罩关闭时同步父级的 menuVisible，避免菜单状态与抽屉显示不一致
		handleDrawerChange(visible) {
			if (!visible && this.visible) {
				this.$emit('close');
			}
		}
	}
}
</script>

<style scoped>
/* 抽屉面板 */
.menu-panel {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	overflow: hidden;
	background-color: var(--bg-card, #ffffff);
	border-left: 1px solid var(--border-color, #e5e5e5);
	box-shadow: -10px 0 30px rgba(0, 0, 0, 0.16);
	color: var(--text-primary, #333333);
}

/* 顶部标题栏 */
.menu-header {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18px 16px 12px;
	padding-top: calc(18px + env(safe-area-inset-top));
	border-bottom: 1px solid var(--border-color, #f0f0f0);
}

.menu-heading {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
}

.menu-logo {
	width: 64rpx;
	height: 64rpx;
}

.menu-heading-text {
	display: block;
	flex: 1;
	min-width: 0;
	font-size: 36rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.menu-close {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	margin-left: 8px;
	border-radius: 50%;
	flex-shrink: 0;
}

.menu-close--hover {
	background-color: var(--bg-soft, #f2f4f8);
}

/* 菜单列表 */
.menu-list {
	flex: 1;
	height: 0;
	min-height: 0;
}

.menu-list-inner {
	padding: 6px 10px 12px;
	padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 9px 10px;
	margin-bottom: 2px;
	border-radius: 12px;
	transition: background-color 0.2s ease;
}

.menu-item:last-child {
	margin-bottom: 0;
}

.menu-item--hover {
	background-color: var(--bg-soft, #f2f4f8);
}

.menu-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	margin-right: 12px;
	border-radius: 9px;
	background-color: var(--bg-soft, #f2f4f8);
	flex-shrink: 0;
}

.menu-icon--danger {
	background-color: rgba(255, 77, 79, 0.1);
}

.menu-label {
	flex: 1;
	min-width: 0;
	font-size: 15px;
	line-height: 1.4;
	color: var(--text-primary, #333333);
}

.menu-item--danger .menu-label {
	color: #ff4d4f;
}
</style>
