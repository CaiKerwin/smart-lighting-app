<template>
	<view v-if="visible" class="menu-wrapper">
		<view class="menu-backdrop" @click="closeMenu"></view>
		<view class="menu-panel" @click.stop>
			<view class="menu-item" @click="selectItem('account')">
				<text class="menu-label">切换账号</text>
			</view>
			<view class="menu-item" @click="selectItem('password')">
				<text class="menu-label">修改密码</text>
			</view>
			<view class="menu-item" @click="selectItem('platform')">
				<text class="menu-label">切换组织与客户</text>
			</view>
			<view class="menu-item" @click="selectItem('logout')">
				<text class="menu-label" style="color: red">退出</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		visible: {
			type: Boolean,
			default: false
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
	top: 32px;
	right: 16px;
	min-width: 170rpx;
	background: #fff;
	border-radius: 10px;
	overflow: hidden;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 14px 16px;
	font-size: 12px;
	color: #333;
}

.menu-item + .menu-item {
	border-top: 1px solid #f1f1f1;
}

.menu-label {
	flex: 1;
}
</style>
