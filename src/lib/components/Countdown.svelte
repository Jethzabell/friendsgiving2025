<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	export let targetDate: string;

	const countdownLabel = '⏳';
	const target = new Date(targetDate);

	let now = new Date();
	let daysRemaining = calculateDays(now, target);

	function calculateDays(current: Date, goal: Date) {
		const millisecondsPerDay = 1000 * 60 * 60 * 24;
		const diff = goal.getTime() - current.getTime();
		return Math.max(0, Math.ceil(diff / millisecondsPerDay));
	}

	function refresh() {
		now = new Date();
		daysRemaining = calculateDays(now, target);
	}

	let interval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		refresh();
		interval = setInterval(refresh, 60_000);
		return () => {
			if (interval) clearInterval(interval);
		};
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<div class="inline-flex items-center gap-3 rounded-2xl bg-white/30 px-6 py-3 backdrop-blur-md shadow-lg">
	<span class="text-3xl" aria-hidden="true">{countdownLabel}</span>
	<div class="flex flex-col">
		<span class="text-3xl font-black text-white tabular-nums">
			{daysRemaining}
		</span>
		<span class="text-sm font-semibold uppercase tracking-wide text-white/90">
			{#if daysRemaining > 0}
				{daysRemaining === 1 ? 'Day Left' : 'Days Until'}
			{:else}
				Today!
			{/if}
		</span>
	</div>
</div>

