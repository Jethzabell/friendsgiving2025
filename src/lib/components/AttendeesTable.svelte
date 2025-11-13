<script lang="ts">
	import { onDestroy } from 'svelte';
	import { attendeesStore, addAttendee, updateAttendee, deleteAttendee } from '$stores/attendees';
	import { dishesStore } from '$stores/dishes';
	import { settingsStore } from '$stores/settings';
	import type { Attendee, AttendeeStatus, Dish, HubSettings } from '$lib/types';
	import { userStore } from '$stores/user';
	import GuardedActions from '$components/GuardedActions.svelte';
	import Icon from '$components/Icon.svelte';
	import { toastStore } from '$stores/toast';

	const statuses: AttendeeStatus[] = ['⏳ Unclaimed', '✅ Confirmed'];

	let attendees: Attendee[] = [];
	let dishes: Dish[] = [];
	let settings: HubSettings = {
		id: 'friendsgiving',
		playlistUrl: '',
		photosUrl: '',
		locationText: '',
		shoppingList: []
	};

	const unsubscribe = attendeesStore.subscribe((value) => {
		attendees = value;
	});

	const unsubDishes = dishesStore.subscribe((value) => {
		dishes = value;
	});

	const unsubSettings = settingsStore.subscribe((value) => {
		settings = value;
	});

	onDestroy(() => {
		unsubscribe();
		unsubDishes();
		unsubSettings();
	});

	$: getPersonItems = (attendeeName: string) => {
		const personDishes = dishes.filter((d) => d.broughtByName === attendeeName);
		const shoppingItems = (settings.shoppingList || []).filter((item) => item.broughtBy === attendeeName);
		return [
			...personDishes.map((d) => d.name),
			...shoppingItems.map((s) => s.item)
		];
	};

	type AttendeeForm = {
		name: string;
		plusOnes: number;
		status: AttendeeStatus;
	};

	const defaultForm: AttendeeForm = {
		name: '',
		plusOnes: 0,
		status: '✅ Confirmed'
	};

	let formState: AttendeeForm = { ...defaultForm };
	let isSubmitting = false;
	let editingId: string | null = null;
	let dialog: HTMLDialogElement | null = null;
	let formError = '';

	function openModal(attendee?: Attendee) {
		if (attendee) {
			editingId = attendee.id;
			formState = {
				name: attendee.name,
				plusOnes: attendee.plusOnes,
				status: attendee.status
			};
		} else {
			editingId = null;
			formState = { ...defaultForm };
		}
		formError = '';
		dialog?.showModal();
	}

	function closeModal() {
		dialog?.close();
	}

	function validateForm(): boolean {
		if (!formState.name.trim()) {
			formError = 'Name is required.';
			return false;
		}

		if (Number.isNaN(Number(formState.plusOnes)) || Number(formState.plusOnes) < 0) {
			formError = 'Plus ones must be 0 or greater.';
			return false;
		}

		formError = '';
		return true;
	}

	async function handleSubmit() {
		if (!validateForm()) return;
		isSubmitting = true;

		try {
			if (editingId) {
				await updateAttendee(editingId, {
					...formState,
					plusOnes: Number(formState.plusOnes)
				});
				toastStore.push({
					title: 'Attendee updated',
					message: `${formState.name} has been updated.`,
					variant: 'success'
				});
			} else {
				await addAttendee({
					...formState,
					plusOnes: Number(formState.plusOnes)
				});
				toastStore.push({
					title: 'Attendee added',
					message: `${formState.name} has been added to the list.`,
					variant: 'success'
				});
			}
			closeModal();
			formState = { ...defaultForm };
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Something went wrong',
				message: 'Unable to save attendee. Please try again.',
				variant: 'error'
			});
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete(attendee: Attendee) {
		try {
			await deleteAttendee(attendee.id);
			toastStore.push({
				title: 'Attendee removed',
				message: `${attendee.name} was removed.`,
				variant: 'info'
			});
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Delete failed',
				message: 'We could not delete that attendee.',
				variant: 'error'
			});
		}
	}
</script>

<section class="space-y-6">
	<div class="flex items-center justify-between gap-3">
		<div>
			<h2 class="text-2xl sm:text-3xl font-black text-neutral flex items-center gap-2">
				<Icon name="groups" size={32} className="text-orange-600" />
				Attendees
			</h2>
			<p class="text-sm text-neutral/60 mt-1">Track who's coming</p>
		</div>
		<GuardedActions>
			<button
				class="btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all w-10 h-10 sm:w-12 sm:h-12"
				type="button"
				on:click={() => openModal()}
				aria-label="Add attendee"
			>
				<Icon name="add" size={24} />
			</button>
		</GuardedActions>
	</div>
	<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
		{#if attendees.length === 0}
			<div class="col-span-full rounded-box border border-dashed border-base-content/10 bg-base-100 p-6 text-center shadow-sm">
				<Icon name="group" size={40} className="text-base-content/20 mx-auto mb-2" />
				<p class="text-base-content/60 text-sm">No attendees yet</p>
			</div>
		{:else}
			{#each attendees as attendee (attendee.id)}
				{@const items = getPersonItems(attendee.name)}
				<div class="group relative rounded-box border border-base-content/5 bg-base-100 p-2 sm:p-3 shadow-sm hover:shadow-md transition-all">
					<div class="flex flex-col items-center text-center gap-1.5 sm:gap-2">
						<div class="avatar placeholder">
							<div class="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
								<span class="text-base sm:text-lg font-bold">{attendee.name[0]}</span>
							</div>
						</div>
						<div class="min-w-0 w-full">
							<p class="font-bold text-base-content text-xs sm:text-sm truncate px-1">{attendee.name}</p>
							{#if attendee.plusOnes > 0}
								<p class="text-[10px] sm:text-xs text-base-content/60">+{attendee.plusOnes}</p>
							{/if}
						</div>
					</div>
					{#if items.length > 0}
						<div class="mt-2 pt-2 border-t border-base-content/10 text-left">
							<ul class="space-y-0.5">
								{#each items as item}
									<li class="flex items-start gap-1 text-[10px] sm:text-xs text-base-content/60">
										<Icon name="check_small" size={12} className="text-green-600 shrink-0" />
										<span class="truncate">{item}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
					<GuardedActions>
						<div class="absolute top-1 right-1 sm:top-2 sm:right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
							<button
								class="btn btn-ghost btn-xs btn-circle hover:bg-orange-100 hover:text-orange-700 w-6 h-6 min-h-0"
								type="button"
								aria-label="Edit attendee"
								on:click={() => openModal(attendee)}
							>
								<Icon name="edit" size={12} />
							</button>
							<button
								class="btn btn-ghost btn-xs btn-circle text-error hover:bg-red-100 w-6 h-6 min-h-0"
								type="button"
								aria-label={`Delete ${attendee.name}`}
								on:click={() => handleDelete(attendee)}
							>
								<Icon name="delete" size={12} />
							</button>
						</div>
					</GuardedActions>
				</div>
			{/each}
		{/if}
	</div>

	<dialog bind:this={dialog} class="modal modal-bottom sm:modal-middle">
		<div class="modal-box max-w-3xl p-0 bg-white shadow-2xl overflow-hidden">
			<!-- Gradient Header -->
			<div class="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
				<div class="flex items-center gap-4">
					<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
						<Icon name={editingId ? 'edit' : 'person_add'} size={32} className="text-white" />
					</div>
					<div>
						<h3 class="text-3xl font-black text-white">
							{editingId ? 'Edit Attendee' : 'Add New Attendee'}
						</h3>
						<p class="text-sm text-white/80 mt-1">Fill in the details below</p>
					</div>
				</div>
			</div>

			<form class="p-8 space-y-6" on:submit|preventDefault={handleSubmit}>
				<!-- Name -->
				<div class="form-control">
					<label class="label pb-2">
						<span class="label-text text-base font-bold text-neutral flex items-center gap-2">
							<Icon name="person" size={20} className="text-orange-600" />
							Name
						</span>
						<span class="label-text-alt text-error">Required</span>
					</label>
					<input
						type="text"
						class="input input-bordered input-lg w-full bg-stone-50 border-2 focus:bg-white focus:border-orange-500 transition-all"
						bind:value={formState.name}
						placeholder="e.g., John Doe"
						required
					/>
				</div>

				<!-- Plus Ones -->
				<div class="form-control">
					<label class="label pb-2">
						<span class="label-text text-base font-bold text-neutral flex items-center gap-2">
							<Icon name="group_add" size={20} className="text-orange-600" />
							Number of +1
						</span>
						<span class="label-text-alt text-neutral/60">Optional</span>
					</label>
					<input
						type="number"
						min="0"
						class="input input-bordered input-lg w-full bg-stone-50 border-2 focus:bg-white focus:border-orange-500 transition-all"
						bind:value={formState.plusOnes}
						placeholder="0"
					/>
				</div>

				{#if formError}
					<div class="alert alert-error shadow-lg">
						<Icon name="error" size={24} />
						<span class="font-semibold">{formError}</span>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex justify-end gap-3 pt-6">
					<button type="button" class="btn btn-lg btn-ghost gap-2" on:click={closeModal}>
						<Icon name="close" size={20} />
						Cancel
					</button>
					<button type="submit" class="btn btn-primary btn-lg gap-2 shadow-xl hover:shadow-2xl transition-all" disabled={isSubmitting}>
						{#if isSubmitting}
							<span class="loading loading-spinner loading-md"></span>
						{:else}
							<Icon name="check_circle" size={22} />
						{/if}
						{editingId ? 'Update Attendee' : 'Add Attendee'}
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop bg-black/60">
			<button type="submit" aria-label="Close modal">
				Close
			</button>
		</form>
	</dialog>
</section>

