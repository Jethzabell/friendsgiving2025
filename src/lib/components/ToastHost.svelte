<script lang="ts">
	import { onDestroy } from 'svelte';
	import { toastStore, type ToastMessage } from '$stores/toast';

	let toasts: ToastMessage[] = [];

	const unsubscribe = toastStore.subscribe((value) => {
		toasts = value;
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

{#if toasts.length}
	<div class="toast toast-end z-40">
		{#each toasts as toast (toast.id)}
			<div
				class={`alert ${toast.variant === 'success' ? 'alert-success' : toast.variant === 'error' ? 'alert-error' : 'alert-info'} shadow-lg`}
				role="status"
			>
				<div>
					<span class="text-sm font-semibold">{toast.title ?? 'Notice'}</span>
					<div class="text-sm opacity-80">
						{toast.message}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

