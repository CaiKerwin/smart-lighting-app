<template>
	<!-- 小程序：使用 uniapp-echarts 的 canvas 适配层 + ECharts simple 构建 -->
	<!-- #ifdef MP-WEIXIN -->
	<canvas
		:id="canvasId"
		:canvas-id="canvasId"
		class="echarts-canvas"
		type="2d"
		@touchend="handleTouchEnd"
		@touchstart="handleTouchStart"
		@touchmove.stop="handleTouchMove"
	></canvas>
	<!-- #endif -->

	<!-- App：在 renderjs 视图层使用 ECharts 绘制 -->
	<!-- #ifdef APP-PLUS -->
	<view
		:change:prop="chartRender.update"
		:prop="option"
		class="echarts-canvas"
	></view>
	<!-- #endif -->
</template>

<script>
// #ifdef MP-WEIXIN
import { UniCanvas } from 'uniapp-echarts/components/uni-chart/uni-canvas.js'

// 降低包体积
// 只引入折线 / 柱状 / 饼图所需的精简构建
const echarts = require('echarts/dist/echarts.simple.min.js')

// 小程序 canvas 场景关闭渐进渲染，避免 ECharts 创建额外的离屏画布
echarts.registerPreprocessor((option) => {
	if (option && option.series) {
		if (Array.isArray(option.series)) {
			option.series.forEach((series) => {
				series.progressive = 0
			})
		} else if (typeof option.series === 'object') {
			option.series.progressive = 0
		}
	}
})
// #endif

let canvasSeed = 0

export default {
	name: 'EchartsCanvas',
	props: {
		// 与 H5 端一致的 ECharts option
		option: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	data() {
		return {
			canvasId: 'echarts-canvas-' + (++canvasSeed),
			retryCount: 0
		}
	},
	watch: {
		option: {
			deep: true,
			handler(value) {
				// #ifdef MP-WEIXIN
				this.renderChart(value)
				// #endif
			}
		}
	},
	mounted() {
		// #ifdef MP-WEIXIN
		this.$nextTick(() => {
			this.initChart()
		})
		// #endif
	},
	beforeDestroy() {
		// #ifdef MP-WEIXIN
		this.disposeChart()
		// #endif
	},
	methods: {
		// #ifdef MP-WEIXIN
		initChart() {
			const query = uni.createSelectorQuery().in(this)
			query
				.select('#' + this.canvasId)
				.fields({ node: true, size: true })
				.exec((res) => {
					const info = res && res[0]
					if (!info || !info.node) {
						// 节点可能还没完成布局，短暂重试
						if (this.retryCount < 10) {
							this.retryCount += 1
							setTimeout(() => {
								this.initChart()
							}, 100)
						}
						return
					}

					const canvasNode = info.node
					const width = info.width || 300
					const height = info.height || 150
					const systemInfo = uni.getSystemInfoSync()
					const dpr = systemInfo.pixelRatio || 1
					const ctx = canvasNode.getContext('2d')

					// 复用 uniapp-echarts 的 canvas 适配层，把小程序 canvas 交给 ECharts
					const canvas = new UniCanvas(ctx, canvasNode)

					// 小程序环境没有 document，ECharts 创建画布时复用当前 canvas
					echarts.setPlatformAPI({
						createCanvas: () => canvasNode
					})

					this.chart = echarts.init(canvas, null, {
						width: width,
						height: height,
						devicePixelRatio: dpr
					})

					this.renderChart(this.option)
					this.$emit('inited', this.chart)
				})
		},
		renderChart(option) {
			if (!this.chart || !option) return
			// notMerge：切换主题或数据为空时完全重绘，避免残留上一次的图形
			this.chart.setOption(option, true)
		},
		disposeChart() {
			if (this.chart) {
				this.chart.dispose()
				this.chart = null
			}
		},
		getTouchPoint(e) {
			const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
			if (!touch) return null
			return {
				x: typeof touch.x === 'number' ? touch.x : touch.clientX,
				y: typeof touch.y === 'number' ? touch.y : touch.clientY
			}
		},
		dispatchTouch(e, type) {
			if (!this.chart) return
			const point = this.getTouchPoint(e)
			if (!point) return
			const handler = this.chart.getZr().handler
			if (!handler) return
			handler.dispatch(type, {
				zrX: point.x,
				zrY: point.y,
				preventDefault() {},
				stopPropagation() {},
				stopImmediatePropagation() {}
			})
		},
		handleTouchStart(e) {
			this.dispatchTouch(e, 'mousedown')
			this.dispatchTouch(e, 'mousemove')
		},
		handleTouchMove(e) {
			this.dispatchTouch(e, 'mousemove')
		},
		handleTouchEnd(e) {
			this.dispatchTouch(e, 'mouseup')
			this.dispatchTouch(e, 'click')
		}
		// #endif
	}
}
</script>

<!-- #ifdef APP-PLUS -->
<script lang="renderjs" module="chartRender">
import * as echarts from 'echarts'

export default {
	data() {
		return {
			pendingOption: null
		}
	},
	mounted() {
		this.$nextTick(() => {
			this.initChart()
		})
		window.addEventListener('resize', this.handleResize)
	},
	beforeDestroy() {
		window.removeEventListener('resize', this.handleResize)
		if (this.chart) {
			this.chart.dispose()
			this.chart = null
		}
	},
	methods: {
		initChart() {
			if (this.chart || !this.$el) return
			this.chart = echarts.init(this.$el)
			const initialOption = this.pendingOption || this.option || this.prop
			if (initialOption && typeof initialOption === 'object') {
				this.chart.setOption(initialOption, true)
				this.pendingOption = null
			}
		},
		update(newValue) {
			this.pendingOption = newValue
			if (!this.chart) {
				this.initChart()
			}
			if (this.chart && newValue && typeof newValue === 'object') {
				this.chart.setOption(newValue, true)
				this.pendingOption = null
			}
		},
		handleResize() {
			if (this.chart) {
				this.chart.resize()
			}
		}
	}
}
</script>
<!-- #endif -->

<style scoped>
.echarts-canvas {
	display: block;
	width: 100%;
	height: 100%;
}
</style>
