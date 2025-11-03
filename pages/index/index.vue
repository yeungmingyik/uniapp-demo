<template>
	<view class="page">
		<view class="user-header">
			<image class="avatar" src="/static/avatar.png" mode="aspectFill"></image>
			<view class="user-texts">
				<text class="greeting">你好，张三👋</text>
				<text class="date">{{ formattedDate }}</text>
			</view>
		</view>

		<view class="section-title">健康数据</view>
		<view class="cards">
			<view class="card">
				<view class="card-header-row">
					<text class="card-title">体温</text>
					<image class="card-icon" src="/static/temperature.png" mode="heightFix"></image>
				</view>
				<view class="card-value">
					<text class="value-text">{{ temperature.toFixed(1) }}</text>
					<text class="unit-text">℃</text>
				</view>
			</view>

			<view class="card">
				<view class="card-header-row">
					<text class="card-title">心率</text>
					<image class="card-icon" src="/static/heart.png" mode="heightFix"></image>
				</view>
				<view class="card-value">
					<text class="value-text">{{ heartRate }}</text>
					<text class="unit-text">bpm</text>
				</view>
			</view>

			<view class="card">
				<view class="card-header-row">
					<text class="card-title">血氧饱和度</text>
					<image class="card-icon" src="/static/spo2.png" mode="heightFix"></image>
				</view>
				<view class="card-value">
					<text class="value-text">{{ spo2 }}</text>
					<text class="unit-text">%</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				formattedDate: '',
				temperature: 36.5,
				heartRate: 72,
				spo2: 98
			}
		},
		onLoad() {
			this.formattedDate = this.formatDate(new Date())
		},
		methods: {
			formatDate(date) {
				const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
				const w = weekMap[date.getDay()]
				const m = date.getMonth() + 1
				const d = date.getDate()
				return `${w}，${m}月${d}日`
			}
		}
	}
</script>

<style>
	.page {
		padding: 32rpx 48rpx;
		background-color: #FFFFFF;
	}

	.user-header {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 48rpx;
		background-color: #F0F0F0;
	}

	.user-texts {
		margin-left: 40rpx;
		display: flex;
		flex-direction: column;
	}

	.greeting {
		font-size: 28rpx; 
		color: #8F98A3;
		line-height: 40rpx;
	}

	.date {
		margin-top: 2rpx;
		font-size: 36rpx;
		font-weight: 700;
		color: #2E2E2E;
		line-height: 56rpx;
	}

	.section-title {
		margin-top: 50rpx;
		margin-bottom: 20rpx;
		font-size: 40rpx;
		font-weight: 700;
		color: #111111;
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.card {
		background-color: #FFFFFF;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
		position: relative;
		height: 200rpx;
	}

	.card-header-row { display: flex; align-items: center; justify-content: space-between; }
	.card-title { font-size: 26rpx; color: #333333; font-weight: 600; }
	.card-icon { height: 48rpx; width: 48rpx; }

	.card-value { position: absolute; left: 20rpx; bottom: 20rpx; display: flex; align-items: baseline; }
	.value-text { font-size: 65rpx; font-weight: 700; color: #111111; line-height: 1; }
	.unit-text { margin-left: 12rpx; font-size: 25rpx; color: #9AA1A9; line-height: 1; }
</style>
