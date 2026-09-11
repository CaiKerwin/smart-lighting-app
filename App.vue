<script>
	import { applyTheme } from './utils/theme.js'

	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 恢复持久化的白天/夜间模式，并同步窗口/导航栏颜色
			applyTheme()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	/* 隐藏所有滚动条 */
	::-webkit-scrollbar {
		display: none;
		width: 0;
		height: 0;
		color: transparent;
	}

	/* ==================== 主题 CSS 变量 ====================
	 * 白天模式默认值（page 上），与当前各界面样式一致；
	 * 夜间模式覆盖值定义在 .theme-dark 类上，页面根节点绑定 themeClass 后，
	 * 其下所有元素自动切换配色。
	 * 页面样式中使用方式：var(--bg-card, #ffffff) 等，fallback 为原值，
	 * 保证白天模式与之前完全一致。
	 */
	page {
		/* 背景色 */
		--bg-page: #f8f8f8; /* 页面背景 */
		--bg-card: #ffffff; /* 卡片/面板背景 */
		--bg-soft: #f2f4f8; /* 输入框/浅灰块背景 */
		--bg-accent: #eef3ff; /* 浅蓝选中态/标签背景 */
		--bg-box-shadow: rgba(0, 0, 0, 0.1); /* 卡片阴影 */
		/* 文字色 */
		--text-primary: #333333; /* 标题/主文字 */
		--text-secondary: #666666; /* 次要文字 */
		--text-tertiary: #888888; /* 辅助文字 */
		--text-quaternary: #999999; /* 说明/占位文字 */
		/* 边框/分隔线 */
		--border-color: #e5e5e5;
		/* 功能色 */
		--color-primary: #4285f4; /* 主按钮 */
		--color-highlight: #1a73e8; /* 数据高亮 */
		--color-success: #07c160; /* 在线状态 */
		--bg-row-selected: #f0f5ff;    /* 表格选中行 / 高亮底 */
		--bg-table-header: #f8f9fc;    /* 表格表头底 */
		--slider-track: #e4ebf7;       /* 实心滑条轨道底 */
		--slider-thumb-ring: rgba(58, 123, 247, 0.14); /* 滑块外发光 */
		/* 水浸水柱刻度与水位 */
		--gauge-border: #ccd2dc;
		--gauge-tick: #b4bbc7;
		--gauge-tick-major: #8b93a1;
		--water-from: #4da3ff;
		--water-to: #1a73e8;
		--water-wave: #6bb2ff;
		/* 悬浮 tabbar 降级背景（不支持 backdrop-filter 时） */
		--tabbar-bg: rgba(255, 255, 255, 0.92);
	}

	/* 夜间模式：颜色整体变暗 */
	.theme-dark {
		--bg-page: #12151c;
		--bg-card: #1c2130;
		--bg-soft: #252c3d;
		--bg-accent: #25324e;
		--bg-box-shadow: rgba(0, 0, 0, 1);
		--text-primary: #e8ecf4;
		--text-secondary: #aab3c6;
		--text-tertiary: #8b94a8;
		--text-quaternary: #6d7689;
		--border-color: #2c3447;
		--color-primary: #5a97ff;
		--color-highlight: #5aa3ff;
		--color-success: #34d07f;
		--bg-row-selected: #1e2b45;
		--bg-table-header: #232a3b;
		--slider-track: #2a3244;
		--slider-thumb-ring: rgba(90, 151, 255, 0.22);
		--gauge-border: #333c50;
		--gauge-tick: #3d4759;
		--gauge-tick-major: #55617a;
		--water-from: #3b8ce8;
		--water-to: #1f5fb8;
		--water-wave: #5aa6f0;
		--tabbar-bg: rgba(28, 33, 48, 0.92);
	}
</style>
