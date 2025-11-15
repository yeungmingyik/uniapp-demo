<template>
	<view class="page">
		<view class="header">
			<text class="title">{{ fieldName }}</text>
			<text class="subtitle">{{ userId }}</text>
		</view>
		
		<view class="chart-container">
			<qiun-data-charts 
				type="line"
				:chartData="chartData"
				:opts="chartOpts"
				:canvasId="canvasId"
			/>
		</view>
		
		<view class="data-stats" v-if="dataList.length > 0">
			<view class="stat-item">
				<text class="stat-label">数据点数</text>
				<text class="stat-value">{{ dataList.length }}</text>
			</view>
			<view class="stat-item">
				<text class="stat-label">平均值</text>
				<text class="stat-value">{{ formatNumber(averageValue) }} {{ unit }}</text>
			</view>
			<view class="stat-item">
				<text class="stat-label">最大值</text>
				<text class="stat-value">{{ formatNumber(maxValue) }} {{ unit }}</text>
			</view>
			<view class="stat-item">
				<text class="stat-label">最小值</text>
				<text class="stat-value">{{ formatNumber(minValue) }} {{ unit }}</text>
			</view>
		</view>
		
		<view class="empty-state" v-if="loading">
			<text>加载中...</text>
		</view>
		
		<view class="empty-state" v-if="!loading && dataList.length === 0">
			<text>暂无数据</text>
		</view>
	</view>
</template>

<script>
	import { getUserHealthDataHistory } from '../../utils/api.js'
	
	const fieldConfig = {
		heart_rate: { name: '心率', unit: 'bpm', color: '#FF6384' },
		temperature: { name: '体温', unit: '℃', color: '#36A2EB' },
		blood_oxygen: { name: '血氧饱和度', unit: '%', color: '#4BC0C0' }
	}
	
	export default {
		data() {
			return {
				userId: '',
				field: '',
				fieldName: '',
				unit: '',
				dataList: [],
				loading: true,
				canvasId: 'chart_' + Date.now(),
				chartData: {},
				chartOpts: {
					color: ['#36A2EB'],
					padding: [15, 15, 0, 15],
					enableScroll: false,
					legend: {
						show: false
					},
					xAxis: {
						disableGrid: true,
						labelCount: 5
					},
					yAxis: {
						gridType: 'dash',
						dashLength: 2
					}
				}
			}
		},
		computed: {
			averageValue() {
				if (this.dataList.length === 0) return 0
				const sum = this.dataList.reduce((acc, item) => acc + parseFloat(item.value), 0)
				return sum / this.dataList.length
			},
			maxValue() {
				if (this.dataList.length === 0) return 0
				return Math.max(...this.dataList.map(item => parseFloat(item.value)))
			},
			minValue() {
				if (this.dataList.length === 0) return 0
				return Math.min(...this.dataList.map(item => parseFloat(item.value)))
			}
		},
		onLoad(options) {
			this.userId = options.userId || ''
			this.field = options.field || ''
			
			if (fieldConfig[this.field]) {
				this.fieldName = fieldConfig[this.field].name
				this.unit = fieldConfig[this.field].unit
				this.chartOpts.color = [fieldConfig[this.field].color]
			}
			
			// 获取设备筛选参数
			const deviceId = options.deviceId || ''
			const deviceName = options.deviceName || ''
			const tags = {}
			if (deviceId) tags.device_id = deviceId
			if (deviceName) tags.device_name = deviceName
			
			this.loadData(tags)
		},
		methods: {
			async loadData(tags = {}) {
				if (!this.userId || !this.field) {
					this.loading = false
					return
				}
				
				this.loading = true
				try {
					const data = await getUserHealthDataHistory(this.userId, this.field, '-30d', tags)
					
					if (Array.isArray(data) && data.length > 0) {
						this.dataList = data
						this.updateChart()
					} else {
						this.dataList = []
					}
				} catch (error) {
					console.error('加载数据失败:', error)
					uni.showToast({
						title: '加载数据失败',
						icon: 'none'
					})
					this.dataList = []
				} finally {
					this.loading = false
				}
			},
			formatNumber(num) {
				if (num === null || num === undefined) {
					return '--'
				}
				const numValue = parseFloat(num)
				if (Number.isNaN(numValue)) {
					return '--'
				}
				const fixed = numValue.toFixed(2)
				const parsed = parseFloat(fixed)
				if (parsed % 1 === 0) {
					return parsed.toString()
				}
				return parsed.toString()
			},
			updateChart() {
				if (this.dataList.length === 0) return
				
				// 处理时间标签
				const labels = this.dataList.map(item => {
					const time = item.time || item.timestamp || item.datetime
					if (time) {
						const date = new Date(time)
						return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
					}
					return ''
				})
				
				// 处理数据值
				const values = this.dataList.map(item => parseFloat(item.value))
				
				this.chartData = {
					categories: labels,
					series: [{
						name: this.fieldName,
						data: values
					}]
				}
			}
		}
	}
</script>

<style>
	.page {
		padding: 32rpx;
		background-color: #F8F8F8;
		min-height: 100vh;
	}
	
	.header {
		margin-bottom: 32rpx;
	}
	
	.title {
		font-size: 36rpx;
		font-weight: 700;
		color: #111111;
		display: block;
		margin-bottom: 8rpx;
	}
	
	.subtitle {
		font-size: 26rpx;
		color: #666666;
		display: block;
	}
	
	.chart-container {
		background-color: #FFFFFF;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 32rpx;
		box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
		height: 400rpx;
		width: 100%;
	}
	
	.data-stats {
		background-color: #FFFFFF;
		border-radius: 16rpx;
		padding: 32rpx;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24rpx;
		box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
	}
	
	.stat-item {
		display: flex;
		flex-direction: column;
	}
	
	.stat-label {
		font-size: 24rpx;
		color: #999999;
		margin-bottom: 8rpx;
	}
	
	.stat-value {
		font-size: 32rpx;
		font-weight: 700;
		color: #111111;
	}
	
	.empty-state {
		text-align: center;
		padding: 100rpx 0;
		color: #999999;
		font-size: 28rpx;
	}
</style>

