<template>
	<view class="page">
		<view class="header">
			<text class="title">{{ fieldName }}</text>
			<text class="subtitle">{{ userId }}</text>
		</view>
		
		<view class="chart-toolbar">
			<view class="date-selector">
				<picker mode="date" :value="pickerValue" @change="onDatePicked">
					<view class="date-button">
						<view class="calendar-icon"></view>
						<text class="date-button-text">{{ dateButtonLabel }}</text>
					</view>
				</picker>
				<view class="clear-date" v-if="isDateMode" @tap.stop="clearDateSelection">
					<text>清除</text>
				</view>
			</view>
			<view class="range-buttons">
				<view
					v-for="range in timeRanges"
					:key="range.value"
					:class="['range-button', (!isDateMode && currentTimeRange === range.value) ? 'active' : '']"
					@tap="selectTimeRange(range.value)"
				>
					{{ range.label }}
				</view>
			</view>
		</view>
		
		<view class="chart-container" v-if="dataList.length > 0">
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
				},
				timeRanges: [
					{ label: '最近3天', value: '-3d' },
					{ label: '最近7天', value: '-7d' },
					{ label: '最近15天', value: '-15d' },
					{ label: '最近30天', value: '-30d' }
				],
				currentTimeRange: '-30d',
				isDateMode: false,
				selectedDate: '',
				tags: {}
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
				},
				dateButtonLabel() {
					if (this.isDateMode && this.selectedDate) {
						return this.selectedDate
					}
					return '选择日期'
				},
				pickerValue() {
					if (this.selectedDate) return this.selectedDate
					return this.formatDateString(new Date())
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
				
				this.tags = { ...tags }
				this.loadData()
				uni.setNavigationBarTitle({ title: '健康监测系统' })
			},
			methods: {
			async loadData() {
				if (!this.userId || !this.field) {
					this.loading = false
					return
				}
				
				this.loading = true
				try {
					const rangeForQuery = this.getQueryRangeByMode()
					if (rangeForQuery === null) {
						this.dataList = []
						this.chartData = {}
						this.loading = false
						return
					}
					
					const data = await getUserHealthDataHistory(this.userId, this.field, rangeForQuery, this.tags)
					const normalized = this.normalizeData(data)
					const filtered = this.isDateMode && this.selectedDate
						? this.filterBySelectedDate(normalized)
						: normalized
					
					if (Array.isArray(filtered) && filtered.length > 0) {
						this.dataList = filtered
						const hasChart = this.updateChart(filtered)
						if (!hasChart) {
							this.dataList = []
						}
					} else {
						this.dataList = []
						this.chartData = {}
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
			selectTimeRange(range) {
				if (this.currentTimeRange === range && !this.isDateMode) return
				this.currentTimeRange = range
				this.isDateMode = false
				this.selectedDate = ''
				this.loadData()
			},
			onDatePicked(event) {
				const value = event?.detail?.value
				if (!value) return
				if (this.selectedDate === value && this.isDateMode) return
				this.selectedDate = value
				this.isDateMode = true
				this.loadData()
			},
			clearDateSelection() {
				if (!this.isDateMode) return
				this.selectedDate = ''
				this.isDateMode = false
				this.loadData()
			},
			getQueryRangeByMode() {
				if (!this.isDateMode || !this.selectedDate) {
					return this.currentTimeRange
				}
				const today = this.getDayStart(new Date())
				const selected = this.getDayStart(this.selectedDate)
				if (selected > today) {
					return null
				}
				if (selected.getTime() === today.getTime()) {
					return '-1d'
				}
				const diff = Math.ceil((today - selected) / (24 * 60 * 60 * 1000))
				return `-${diff}d`
			},
			normalizeData(data = []) {
				if (!Array.isArray(data)) return []
				return data
					.filter(item => item && item.value !== null && item.value !== undefined)
					.map(item => ({
						...item,
						time: item.time || item.timestamp || item.datetime || ''
					}))
					.sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0))
			},
			filterBySelectedDate(data = []) {
				if (!this.selectedDate) return data
				const start = this.getDayStart(this.selectedDate)
				const end = new Date(start)
				end.setHours(23, 59, 59, 999)
				return data.filter(item => {
					const itemTime = new Date(item.time || 0)
					return itemTime >= start && itemTime <= end
				})
			},
			updateChart(data = []) {
				const numericPoints = data
					.map(item => ({
						value: parseFloat(item.value),
						time: item.time || item.timestamp || item.datetime || ''
					}))
					.filter(item => !Number.isNaN(item.value))
				
				if (numericPoints.length === 0) {
					this.chartData = {}
					return false
				}
				
				if (this.isDateMode && this.selectedDate) {
					const categories = numericPoints.map((_, index) => `${index + 1}`)
					const values = numericPoints.map(point => point.value)
					this.chartData = {
						categories,
						series: [{
							name: this.fieldName,
							data: values
						}]
					}
					return true
				}
				
				const rangeDays = parseInt(this.currentTimeRange.replace(/[^0-9]/g, ''), 10) || 30
				const today = this.getDayStart(new Date())
				const msPerDay = 24 * 60 * 60 * 1000
				const buckets = Array.from({ length: rangeDays }, () => [])
				
				numericPoints.forEach(point => {
					const itemDay = this.getDayStart(point.time)
					const diff = Math.floor((today - itemDay) / msPerDay)
					if (diff >= 0 && diff < rangeDays) {
						const dayNumber = rangeDays - diff
						buckets[dayNumber - 1].push(point.value)
					}
				})
				
				const categories = []
				const values = []
				let hasData = false
				for (let dayNumber = 1; dayNumber <= rangeDays; dayNumber++) {
					const bucket = buckets[dayNumber - 1]
					let avg = null
					if (bucket.length > 0) {
						const sum = bucket.reduce((acc, val) => acc + val, 0)
						avg = sum / bucket.length
						hasData = true
					}
					categories.push(dayNumber.toString())
					values.push(avg)
				}
				
				if (!hasData) {
					this.chartData = {}
					return false
				}
				
				this.chartData = {
					categories,
					series: [{
						name: this.fieldName,
						data: values
					}]
				}
				return true
			},
			getDayStart(target) {
				const date = target instanceof Date ? new Date(target) : new Date(target)
				date.setHours(0, 0, 0, 0)
				return date
			},
			formatDateString(date) {
				const target = date instanceof Date ? date : new Date(date)
				const year = target.getFullYear()
				const month = String(target.getMonth() + 1).padStart(2, '0')
				const day = String(target.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
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
	
	.chart-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 24rpx;
	}
	
	.date-selector {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}
	
	.date-button {
		display: flex;
		align-items: center;
		padding: 12rpx 24rpx;
		border: 1rpx solid #d0d0d0;
		border-radius: 999rpx;
		background-color: #fff;
		box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.05);
	}
	
	.calendar-icon {
		width: 28rpx;
		height: 28rpx;
		border: 2rpx solid #3c3c3c;
		border-radius: 4rpx;
		margin-right: 12rpx;
		position: relative;
	}
	
	.calendar-icon::before,
	.calendar-icon::after {
		content: '';
		position: absolute;
		left: 4rpx;
		right: 4rpx;
		height: 2rpx;
		background-color: #3c3c3c;
	}
	
	.calendar-icon::before {
		top: 6rpx;
	}
	
	.calendar-icon::after {
		top: 14rpx;
	}
	
	.date-button-text {
		font-size: 26rpx;
		color: #3c3c3c;
	}
	
	.clear-date {
		font-size: 24rpx;
		color: #ff4d4f;
		padding: 6rpx 12rpx;
	}
	
	.range-buttons {
		display: flex;
		align-items: center;
		gap: 12rpx;
		flex-wrap: wrap;
	}
	
	.range-button {
		padding: 12rpx 24rpx;
		border-radius: 999rpx;
		border: 1rpx solid #d0d0d0;
		font-size: 24rpx;
		color: #555;
		background-color: #fff;
		box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.05);
	}
	
	.range-button.active {
		background-color: #3c3c3c;
		color: #fff;
		border-color: #3c3c3c;
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

