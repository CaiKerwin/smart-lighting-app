<!-- 站点详情右下角悬浮按钮 -->
<template>
	<view class="station-fab">
		<!-- 向上展开的菜单 -->
		<view class="fab-menu">
			<view
				v-for="(item, index) in items"
				:key="index"
				:class="['fab-menu-item', { 'fab-menu-item-open': menuOpen }]"
				:style="menuItemDelay(index)"
				@click="onItemClick(item, index)"
			>
				<image v-if="item.img" :src="item.img" class="fab-img" mode="aspectFit" />
				<uni-icons v-else :type="item.icon" color="#666" size="26" />
			</view>
		</view>

		<!-- 主按钮 -->
		<view :class="['fab-main', { 'fab-main-open': menuOpen }]" @click="toggleMenu">
			<view :class="{ 'fab-gear-rotate': menuOpen }" class="fab-gear">
				<uni-icons color="#fff" size="28" type="gear" />
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'stationFab',
	props: {
		// 菜单项
		items: {
			type: Array,
			default: () => []
		}
	},
	data() {
		return {
			menuOpen: false // 菜单展开状态
		};
	},
	methods: {
		// 点击主按钮：展开/收起菜单
		toggleMenu() {
			this.menuOpen = !this.menuOpen;
		},
		// 菜单项点击：收起菜单并通知父级
		onItemClick(item, index) {
			this.menuOpen = false;
			this.$emit('item-click', { item, index });
		},
		// 各菜单项过渡延迟：离主按钮近的先展开、先收起
		menuItemDelay(index) {
			const base = this.menuOpen ? (this.items.length - 1 - index) : index;
			return { transitionDelay: (base * 0.04) + 's' };
		}
	}
};
</script>

<style lang="scss" scoped>
.station-fab {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 20rpx;

	/* 向上展开的菜单 */
	.fab-menu {
		position: absolute;
		bottom: calc(100% + 20rpx);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20rpx;
	}

	.fab-menu-item {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: var(--bg-card, #fff);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
		opacity: 0;
		transform: translateY(16rpx) scale(0.6);
		pointer-events: none;
		transition: opacity 0.25s ease, transform 0.25s ease;
	}

	.fab-menu-item-open {
		opacity: 1;
		transform: translateY(0) scale(1);
		pointer-events: auto;
	}

	.fab-img {
		width: 44rpx;
		height: 44rpx;
	}

	/* 主按钮 */
	.fab-main {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: var(--color-primary, #3a7bf7);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(58, 123, 247, 0.35);
		transition: transform 0.25s ease;
	}

	.fab-main-open {
		transform: scale(1.05);
	}

	.fab-gear {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.25s ease;
	}

	.fab-gear-rotate {
		transform: rotate(45deg);
	}
}
</style>
