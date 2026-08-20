<template>
	<view class="alarm-pagination">
		<!-- 每页条数选择 -->
		<view class="size-box">
			<picker :range="sizeOptionLabels" :value="sizeIndex" mode="selector" @change="onSizeChange">
				<view class="size-picker">
					<text class="size-text">每页 {{ pageSize }} 条</text>
					<uni-icons color="#999999" size="12" type="bottom" />
				</view>
			</picker>
		</view>

		<!-- 页码切换 -->
		<view class="page-box">
			<view :class="{ disabled: current <= 1 }" class="page-btn" @click="goPage(current - 1)">上一页</view>
			<text class="page-text">{{ current }} / {{ maxPage }} 页</text>
			<view :class="{ disabled: current >= maxPage }" class="page-btn" @click="goPage(current + 1)">下一页</view>
		</view>

		<!-- 总条数 -->
		<text class="total-text">共 {{ total }} 条</text>
	</view>
</template>

<script>
/**
 * 分页器
 * 属性：
 *   current         当前页码（从1开始）
 *   pageSize        每页条数
 *   total           总条数
 *   pageSizeOptions 每页条数可选项
 * 事件：
 *   change          页码变化，参数为新的页码
 *   pageSizeChange  每页条数变化，参数为新的每页条数
 */
export default {
	name: 'AlarmPagination',
	props: {
		current: {
			type: Number,
			default: 1
		},
		pageSize: {
			type: Number,
			default: 20
		},
		total: {
			type: Number,
			default: 0
		},
		pageSizeOptions: {
			type: Array,
			default: () => [10, 20, 50, 100]
		}
	},
	computed: {
		// 总页数
		maxPage() {
			return Math.max(1, Math.ceil(this.total / this.pageSize));
		},
		// picker 的 range 必须是字符串数组
		sizeOptionLabels() {
			return this.pageSizeOptions.map(String);
		},
		// 当前每页条数在选项中的下标
		sizeIndex() {
			const idx = this.pageSizeOptions.indexOf(this.pageSize);
			return idx > -1 ? idx : 0;
		}
	},
	methods: {
		// 每页条数变化
		onSizeChange(e) {
			const value = this.pageSizeOptions[Number(e.detail.value)];
			if (value && value !== this.pageSize) {
				this.$emit('pageSizeChange', value);
			}
		},
		// 切换页码
		goPage(page) {
			if (page < 1 || page > this.maxPage || page === this.current) {
				return;
			}
			this.$emit('change', page);
		}
	}
};
</script>

<style lang="scss" scoped>
.alarm-pagination {
	width: 100%;
	margin: 20rpx 0; /* 上 右 下 左 */
	padding: 20rpx; /* 上 右 下 左 */
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: nowrap;
	gap: 16rpx;
	box-sizing: border-box;
}

/* 每页条数 */
.size-box {
	flex-shrink: 0;
}

.size-picker {
	display: flex;
	align-items: center;
	gap: 6rpx;
	background-color: #f2f4f8;
	border-radius: 8rpx;
	padding: 10rpx 16rpx;
}

.size-text {
	font-size: 24rpx;
	color: #666666;
}

/* 页码切换 */
.page-box {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.page-btn {
	padding: 10rpx 20rpx;
	background-color: #eef3ff;
	color: #3a7bf7;
	font-size: 24rpx;
	border-radius: 8rpx;
	cursor: pointer;

	&.disabled {
		opacity: 0.4;
	}
}

.page-text {
	font-size: 24rpx;
	color: #333333;
}

/* 总条数 */
.total-text {
	font-size: 22rpx;
	color: #999999;
	flex-shrink: 0;
}
</style>
