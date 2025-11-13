<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { settingsStore, updateSettings, upsertShoppingList } from '$stores/settings';
	import { attendeesStore } from '$stores/attendees';
	import type { ChecklistItem, HubSettings } from '$lib/types';
	import GuardedActions from '$components/GuardedActions.svelte';
	import Icon from '$components/Icon.svelte';
	import { toastStore } from '$stores/toast';

	let settings: HubSettings = {
		id: 'friendsgiving',
		playlistUrl: '',
		photosUrl: '',
		locationText: '',
		shoppingList: []
	};

	let attendees: any[] = [];

	const unsubscribe = settingsStore.subscribe((value) => {
		settings = value;
	});

	const unsubscribeAttendees = attendeesStore.subscribe((value) => {
		attendees = value;
	});

	onDestroy(() => {
		unsubscribe();
		unsubscribeAttendees();
	});

	let newItemName = '';
	let newItemQuantity = 1;
	let newItemBroughtBy = '';
	let editingItemId: string | null = null;
	let isUpdatingList = false;
	let shoppingDialog: HTMLDialogElement | null = null;

	function openShoppingModal(item?: ChecklistItem) {
		if (item) {
			editingItemId = item.id;
			newItemName = item.item;
			newItemQuantity = item.quantity;
			newItemBroughtBy = item.broughtBy;
		} else {
			editingItemId = null;
			newItemName = '';
			newItemQuantity = 1;
			newItemBroughtBy = '';
		}
		shoppingDialog?.showModal();
	}

	function closeShoppingModal() {
		shoppingDialog?.close();
	}

	async function addShoppingItem() {
		if (!newItemName.trim()) return;
		isUpdatingList = true;
		
		let updatedList: ChecklistItem[];
		
		if (editingItemId) {
			// Update existing item
			updatedList = (settings.shoppingList ?? []).map((item) =>
				item.id === editingItemId
					? { ...item, item: newItemName.trim(), quantity: newItemQuantity || 1, broughtBy: newItemBroughtBy.trim() }
					: item
			);
		} else {
			// Add new item
			updatedList = [
				...(settings.shoppingList ?? []),
				{
					id: crypto.randomUUID(),
					item: newItemName.trim(),
					quantity: newItemQuantity || 1,
					broughtBy: newItemBroughtBy.trim(),
					done: false
				}
			];
		}
		
		try {
			await upsertShoppingList(updatedList);
			toastStore.push({
				title: editingItemId ? 'Item updated' : 'Item added',
				message: `${newItemName} ${editingItemId ? 'updated' : 'added'}.`,
				variant: 'success'
			});
			closeShoppingModal();
			editingItemId = null;
			newItemName = '';
			newItemQuantity = 1;
			newItemBroughtBy = '';
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: editingItemId ? 'Update failed' : 'Add failed',
				message: 'Unable to save item.',
				variant: 'error'
			});
		} finally {
			isUpdatingList = false;
		}
	}

	async function toggleItem(item: ChecklistItem) {
		isUpdatingList = true;
		const updatedList = (settings.shoppingList ?? []).map((entry) =>
			entry.id === item.id ? { ...entry, done: !entry.done } : entry
		);
		try {
			await upsertShoppingList(updatedList);
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Update failed',
				message: 'Unable to update item.',
				variant: 'error'
			});
		} finally {
			isUpdatingList = false;
		}
	}

	async function removeItem(item: ChecklistItem) {
		isUpdatingList = true;
		const updatedList = (settings.shoppingList ?? []).filter((entry) => entry.id !== item.id);
		try {
			await upsertShoppingList(updatedList);
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Remove failed',
				message: 'Unable to remove that item.',
				variant: 'error'
			});
		} finally {
			isUpdatingList = false;
		}
	}
</script>

<section class="space-y-6">
	<div class="flex items-center justify-between gap-3">
		<div>
			<h2 class="text-2xl sm:text-3xl font-black text-neutral flex items-center gap-2">
				<Icon name="shopping_cart" size={32} className="text-orange-600" />
				Shopping List
			</h2>
			<p class="text-sm text-neutral/60 mt-1">Extra items to bring</p>
		</div>
		<GuardedActions>
			<button
				class="btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all w-10 h-10 sm:w-12 sm:h-12"
				type="button"
				on:click={() => openShoppingModal()}
				aria-label="Add shopping item"
			>
				<Icon name="add" size={24} />
			</button>
		</GuardedActions>
	</div>

	<div class="space-y-3">
		{#if (settings.shoppingList ?? []).length === 0}
			<div class="rounded-box border border-dashed border-base-content/10 bg-base-100 p-8 text-center shadow-sm">
				<Icon name="shopping_basket" size={40} className="text-base-content/20 mx-auto mb-2" />
				<p class="text-base-content/60 text-sm">No items yet—add the first one!</p>
			</div>
		{:else}
			{#each settings.shoppingList ?? [] as item (item.id)}
				<div class="flex items-center gap-4 rounded-box border border-base-content/5 bg-base-100 p-4 shadow-sm hover:shadow-md transition-all">
					<span class="badge badge-lg bg-orange-100 text-orange-700 font-bold border-0 shrink-0">
						{item.quantity}
					</span>
					<span class="font-semibold text-base flex-1">{item.item}</span>
					<div class="flex items-center gap-2 shrink-0">
						{#if item.broughtBy}
							<div class="flex items-center gap-1.5">
								<Icon name="person" size={16} className="text-green-600" />
								<span class="font-semibold text-sm">by {item.broughtBy}</span>
							</div>
						{:else}
							<span class="text-base-content/40 text-sm">Unassigned</span>
						{/if}
					</div>
					<GuardedActions>
						<div class="flex gap-1 shrink-0">
										<button
											class="btn btn-ghost btn-xs btn-circle hover:bg-orange-100 hover:text-orange-700"
											type="button"
											aria-label={`Edit ${item.item}`}
											on:click={() => openShoppingModal(item)}
										>
											<Icon name="edit" size={14} />
										</button>
							<button
								class="btn btn-ghost btn-xs btn-circle text-error hover:bg-red-100"
								type="button"
								aria-label={`Remove ${item.item}`}
								on:click={() => removeItem(item)}
								disabled={isUpdatingList}
							>
								<Icon name="delete" size={14} />
							</button>
						</div>
					</GuardedActions>
				</div>
			{/each}
		{/if}
	</div>
</section>

<!-- Shopping Modal -->
<dialog bind:this={shoppingDialog} class="modal modal-bottom sm:modal-middle">
	<div class="modal-box max-w-2xl p-0 bg-white shadow-2xl overflow-hidden">
		<div class="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
			<div class="flex items-center gap-4">
				<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
					<Icon name="add_shopping_cart" size={32} className="text-white" />
				</div>
				<div>
					<h3 class="text-3xl font-black text-white">{editingItemId ? 'Edit' : 'Add'} Shopping Item</h3>
					<p class="text-sm text-white/80 mt-1">Fill in the details below</p>
				</div>
			</div>
		</div>
		<form class="p-8 space-y-6" on:submit|preventDefault={addShoppingItem}>
			<div class="form-control">
				<label class="label pb-2">
					<span class="label-text text-base font-bold text-neutral flex items-center gap-2">
						<Icon name="shopping_basket" size={20} className="text-orange-600" />
						Item Name
					</span>
					<span class="label-text-alt text-error">Required</span>
				</label>
				<input type="text" class="input input-bordered input-lg w-full bg-stone-50 border-2 focus:bg-white focus:border-orange-500 transition-all" bind:value={newItemName} placeholder="e.g., Sprite, Paper plates..." required />
			</div>
			<div class="grid gap-6 sm:grid-cols-[1fr,2fr]">
				<div class="form-control">
					<label class="label pb-2">
						<span class="label-text text-base font-bold text-neutral flex items-center gap-2">
							<Icon name="numbers" size={20} className="text-orange-600" />
							Quantity
						</span>
						<span class="label-text-alt text-error">Required</span>
					</label>
					<input type="number" min="1" class="input input-bordered input-lg w-full bg-stone-50 border-2 focus:bg-white focus:border-orange-500 text-center transition-all" bind:value={newItemQuantity} required />
				</div>
				<div class="form-control">
					<label class="label pb-2">
						<span class="label-text text-base font-bold text-neutral flex items-center gap-2">
							<Icon name="person" size={20} className="text-orange-600" />
							Brought By
						</span>
						<span class="label-text-alt text-neutral/60">Optional</span>
					</label>
					<select class="select select-bordered select-lg w-full bg-stone-50 border-2 focus:bg-white focus:border-orange-500" bind:value={newItemBroughtBy}>
						<option value="">Select an attendee...</option>
						{#each attendees as attendee}
							{#if attendee?.name}
								<option value={attendee.name}>{attendee.name}</option>
							{/if}
						{/each}
					</select>
				</div>
			</div>
			<div class="flex justify-end gap-3 pt-6">
				<button type="button" class="btn btn-lg btn-ghost gap-2" on:click={closeShoppingModal}>
					<Icon name="close" size={20} />
					Cancel
				</button>
				<button type="submit" class="btn btn-primary btn-lg gap-2 shadow-xl hover:shadow-2xl transition-all" disabled={isUpdatingList}>
					{#if isUpdatingList}
						<span class="loading loading-spinner loading-md"></span>
					{:else}
						<Icon name="check_circle" size={22} />
					{/if}
					{editingItemId ? 'Update' : 'Add'} Item
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop bg-black/60">
		<button type="submit" aria-label="Close modal">Close</button>
	</form>
</dialog>

