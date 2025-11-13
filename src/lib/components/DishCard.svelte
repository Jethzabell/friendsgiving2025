<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Dish } from '$lib/types';
	import Icon from '$components/Icon.svelte';

	export let dish: Dish;
	export let showActions = false;

	const dispatch = createEventDispatcher<{
		edit: Dish;
		delete: Dish;
	}>();

	const typeIcons: Record<Dish['type'], string> = {
		Main: 'restaurant',
		Appetizer: 'ramen_dining',
		Side: 'set_meal',
		Dessert: 'icecream',
		Drink: 'local_bar'
	};

	const statusVariants: Record<Dish['status'], string> = {
		'⏳ Unclaimed': 'badge-warning gap-2',
		'✅ Confirmed': 'badge-success gap-2'
	};

	const statusIcons: Record<Dish['status'], string> = {
		'⏳ Unclaimed': 'schedule',
		'✅ Confirmed': 'check_circle'
	};

	const statusLabels: Record<Dish['status'], string> = {
		'⏳ Unclaimed': 'Unclaimed',
		'✅ Confirmed': 'Confirmed'
	};
</script>

<article class="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 ring-1 ring-black/5">
	<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-100 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
	<div class="relative p-6 space-y-4">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
				<Icon name={typeIcons[dish.type]} size={24} className="text-white" />
			</div>
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<h3 class="text-lg font-bold text-neutral truncate">{dish.name}</h3>
					{#if showActions}
						<div class="flex gap-0.5 ml-auto shrink-0">
							<button
								class="btn btn-ghost btn-xs btn-circle hover:bg-orange-100 hover:text-orange-700 w-6 h-6 min-h-0"
								type="button"
								aria-label={`Edit ${dish.name}`}
								on:click={() => dispatch('edit', dish)}
							>
								<Icon name="edit" size={12} />
							</button>
							<button
								class="btn btn-ghost btn-xs btn-circle text-error hover:bg-red-100 w-6 h-6 min-h-0"
								type="button"
								aria-label={`Delete ${dish.name}`}
								on:click={() => dispatch('delete', dish)}
							>
								<Icon name="delete" size={12} />
							</button>
						</div>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					<span class="inline-block px-2 py-0.5 text-xs font-semibold rounded-md bg-orange-100 text-orange-700">{dish.type}</span>
					{#if dish.status === '✅ Confirmed' && dish.broughtByName}
						<div class="flex items-center gap-1 text-xs">
							<Icon name="person" size={14} className="text-green-600" />
							<span class="font-semibold text-neutral">by {dish.broughtByName}</span>
						</div>
					{:else}
						<span class="badge badge-warning badge-xs gap-1">
							<Icon name="schedule" size={12} />
							Unclaimed
						</span>
					{/if}
				</div>
			</div>
		</div>
	</div>
</article>

