<template>
	<view :class="themeClass" class="config-container">
		<!-- 网格容器 -->
		<view class="grid-layout">
			<!-- 循环渲染配置项 -->
			<view
				v-for="(item, index) in configList"
				:key="index"
				class="config-card"
				@click="goToWorkOrderConfig(item.id)"
			>
				<text class="card-title">{{ item.name }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			configList: [
				{
					id: 1,
					name: '故障分类配置'
				}
			]
		};
	},
	methods: {
		goToWorkOrderConfig(id) {
			switch (id) {
				case 1:
					uni.navigateTo({
						url: '/pages/workOrder/components/woConfigComponents/faultTypeConfig'
					});
					break;
				default:
					break;
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.config-container {
	min-height: 100vh;
	background-color: var(--bg-page, #F0F5FC); // 对应图片淡蓝色背景
	padding: 40rpx;
	box-sizing: border-box;
}

.grid-layout {
	display: grid;
	// 固定为 3 列，每列宽度平均分配 1fr
	grid-template-columns: repeat(3, 1fr);
	gap: 40rpx; // 网格间距
}

.config-card {
	background-color: var(--bg-card, #FFFFFF);
	border-radius: 16rpx; // 卡片圆角
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06); // 轻微阴影
	padding: 40rpx;
	display: flex;
	align-items: center;
	justify-content: flex-start; // 对应图片中文本靠左排版
	transition: all 0.3s;

}

.card-title {
	font-size: 24rpx;
	font-weight: 500;
	color: var(--text-primary, #333333);
	line-height: 1.5;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}


</style>
