<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { settingsStore, updateSettings, upsertShoppingList } from '$stores/settings';
	import { attendeesStore } from '$stores/attendees';
	import type { ChecklistItem, HubSettings } from '$lib/types';
	import GuardedActions from '$components/GuardedActions.svelte';
	import Icon from '$components/Icon.svelte';
	import { toastStore } from '$stores/toast';

	const DEFAULT_PLAYLIST = 'https://open.spotify.com/playlist/37i9dQZF1EVHGWrwldPRtj?si=da5df7818275413c';

	let settings: HubSettings = {
		id: 'friendsgiving',
		playlistUrl: DEFAULT_PLAYLIST,
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

	onMount(async () => {
		// Initialize playlist if not set
		if (!settings.playlistUrl) {
			try {
				await updateSettings({ playlistUrl: DEFAULT_PLAYLIST });
			} catch (error) {
				console.error('Failed to set default playlist:', error);
			}
		}
	});

	let newItemName = '';
	let newItemQuantity = 1;
	let newItemBroughtBy = '';
	let isUpdatingSettings = false;
	let isUpdatingList = false;
	let shoppingDialog: HTMLDialogElement | null = null;
	let playlistDraft = DEFAULT_PLAYLIST;
	let photosDraft = 'https://photos.app.goo.gl/3qFStzFAEfoxBUbk8';
	let locationDraft = "Location: Jessy's Home";

$: if (!isUpdatingSettings) {
	playlistDraft = settings.playlistUrl || DEFAULT_PLAYLIST;
	photosDraft = settings.photosUrl || 'https://photos.app.goo.gl/3qFStzFAEfoxBUbk8';
	locationDraft = settings.locationText || "Location: Jessy's Home";
}

	const spotifyRegex =
		/https?:\/\/(open\.)?spotify\.com\/(playlist|album|artist|episode|show|track)\/([a-zA-Z0-9]+).*/;

	function toSpotifyEmbed(url?: string) {
		if (!url || !spotifyRegex.test(url)) return null;
		const match = url.match(spotifyRegex);
		if (!match) return null;
		const [, , type, id] = match;
		return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
	}

	const spotifyEmbed = () => toSpotifyEmbed(settings.playlistUrl || playlistDraft);

	async function handleSettingsUpdate(partial: Partial<HubSettings>, successMessage: string) {
		try {
			isUpdatingSettings = true;
			await updateSettings(partial);
			toastStore.push({ title: 'Updated', message: successMessage, variant: 'success' });
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Update failed',
				message: 'We could not update that setting.',
				variant: 'error'
			});
		} finally {
			isUpdatingSettings = false;
		}
	}

	function openShoppingModal() {
		newItemName = '';
		newItemQuantity = 1;
		newItemBroughtBy = '';
		shoppingDialog?.showModal();
	}

	function closeShoppingModal() {
		shoppingDialog?.close();
	}

	async function addShoppingItem() {
		if (!newItemName.trim()) return;
		isUpdatingList = true;
		const updatedList: ChecklistItem[] = [
			...(settings.shoppingList ?? []),
			{
				id: crypto.randomUUID(),
				item: newItemName.trim(),
				quantity: newItemQuantity || 1,
				broughtBy: newItemBroughtBy.trim(),
				done: false
			}
		];
		try {
			await upsertShoppingList(updatedList);
			toastStore.push({
				title: 'Item added',
				message: `${newItemName} added to shopping list.`,
				variant: 'success'
			});
			closeShoppingModal();
			newItemName = '';
			newItemQuantity = 1;
			newItemBroughtBy = '';
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Add failed',
				message: 'Unable to add that item right now.',
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

<section class="space-y-5">
		<div class="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
			<div class="space-y-5">
				<header class="flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
						<Icon name="playlist_add" size={24} className="text-white" />
					</div>
					<div>
						<h3 class="text-xl font-bold text-neutral">Playlist & Memories</h3>
						<p class="text-sm text-neutral/60">
							Share the soundtrack and photos
						</p>
					</div>
				</header>

			<div class="space-y-4">
				{#if spotifyEmbed()}
					<div class="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5">
						<iframe
							src={spotifyEmbed()}
							width="100%"
							height="352"
							allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
							loading="lazy"
							title="Chill Mix - Friendsgiving Playlist"
							class="w-full"
							style="border-radius:12px"
						></iframe>
					</div>
				{:else if settings.playlistUrl}
					<p class="text-xs text-warning">
						Please paste a valid Spotify link so we can show the embed player.
					</p>
				{/if}
			</div>

			<div class="space-y-4">
				<div class="divider text-xs font-semibold uppercase tracking-wider text-neutral/40">Photo Memories</div>
				
				{#if photosDraft || settings.photosUrl}
					<a
						href={photosDraft || settings.photosUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="group flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 p-4 hover:from-pink-100 hover:to-purple-100 transition-all shadow-md hover:shadow-lg ring-1 ring-pink-200"
					>
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 shadow-sm">
								<Icon name="photo_library" size={24} className="text-white" />
							</div>
							<div>
								<p class="font-bold text-neutral">FriendsGiving25 Album</p>
								<p class="text-xs text-neutral/60">View shared photos</p>
							</div>
						</div>
						<Icon name="open_in_new" size={24} className="text-pink-600 group-hover:translate-x-1 transition-transform" />
					</a>
				{/if}
			</div>
		</div>
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
					<h3 class="text-3xl font-black text-white">Add Shopping Item</h3>
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
					Add Item
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop bg-black/60">
		<button type="submit" aria-label="Close modal">Close</button>
	</form>
</dialog>

