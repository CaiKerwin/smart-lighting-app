<template>
	<transition name="menu">
		<view v-if="visible" :class="themeClass" class="menu-wrapper">
			<view class="menu-backdrop" @click="closeMenu"></view>
			<view :style="{ right: menuPos.right + 'px', top: menuPos.top + 'px' }"
				  class="menu-panel"
				  @click.stop
			>
				<!-- 菜单项 -->
				<!-- #ifndef H5 -->
				<view class="menu-item" @click="selectItem('qrCode')">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333'" size="20" type="scan"/>
					<text class="menu-label">{{ $t('menu.qrCode') }}</text>
				</view>
				<!-- #endif -->
				<view class="menu-item" @click="selectItem('account')">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333'" size="20" type="tune"/>
					<text class="menu-label">{{ $t('menu.switchAccount') }}</text>
				</view>
				<view class="menu-item" @click="selectItem('password')">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333'" size="20" type="auth"/>
					<text class="menu-label">{{ $t('menu.modifyPassword') }}</text>
				</view>
				<view class="menu-item" @click="selectItem('timeTable')">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333'" size="20" type="calendar"/>
					<text class="menu-label">{{ $t('menu.timeTable') }}</text>
				</view>
				<view class="menu-item" @click="selectItem('platform')">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333'" size="20" type="staff"/>
					<text class="menu-label">{{ $t('menu.switchPlatform') }}</text>
				</view>
				<view class="menu-item" @click="selectItem('logout')">
					<uni-icons color="red" size="20" type="close"/>
					<text class="menu-label" style="color: red">{{ $t('menu.logout') }}</text>
				</view>
				<view class="menu-item" @click="selectItem('about')">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333'" size="20" type="info"/>
					<text class="menu-label">{{ $t('menu.about') }}</text>
				</view>
				<view class="menu-item" @click="selectItem('language')">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333'" size="20" type="font"/>
					<text class="menu-label">{{ $t('menu.language') }}</text>
				</view>
				<view class="menu-item" @click="selectItem('device')">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333'" size="20" type="search"/>
					<text class="menu-label">{{ $t('menu.device') }}</text>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
export default {
	props: {
		visible: { type: Boolean, default: false },
		menuPos: {
			type: Object,
			default: () => ({ right: 0, top: 0 })
		}
	},
	methods: {
		selectItem(type) {
			this.$emit('select', type);
		},
		closeMenu() {
			this.$emit('close');
		}
	}
}
</script>

<style scoped>
/* 动画 */
.menu-enter-active,
.menu-leave-active {
	transition: opacity 0.25s ease, transform 0.25s ease;
}
.menu-enter,
.menu-leave-to {
	opacity: 0;
	transform: scale(0.92) translateY(-8px);
}

.menu-wrapper {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 999;
}
.menu-backdrop {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: transparent;
}
.menu-panel {
	position: absolute;
	min-width: 170rpx;
	background: var(--bg-card, #fff);
	border-radius: 10px;
	overflow: hidden;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 14px 16px;
	font-size: 12px;
	color: var(--text-primary, #333);
	gap: 8rpx;
}
.menu-item + .menu-item {
	border-top: 1px solid var(--border-color, #f1f1f1);
}
.menu-label {
	flex: 1;
}
</style>
