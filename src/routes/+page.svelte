<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Countdown from '$components/Countdown.svelte';
	import AttendeesTable from '$components/AttendeesTable.svelte';
	import DishCard from '$components/DishCard.svelte';
	import ShoppingList from '$components/ShoppingList.svelte';
	import Extras from '$components/Extras.svelte';
	import GuardedActions from '$components/GuardedActions.svelte';
	import ToastHost from '$components/ToastHost.svelte';
	import Footer from '$components/Footer.svelte';
	import { startAuthListener, userStore, signInWithGoogle, signOutOfHub, authLoading } from '$stores/user';
	import { dishesStore, addDish, updateDish, deleteDish } from '$stores/dishes';
	import { attendeesStore } from '$stores/attendees';
	import type { Dish, DishStatus, DishType } from '$lib/types';
	import Icon from '$components/Icon.svelte';
	import { toastStore } from '$stores/toast';
	import { ensureAppCheck, SEED_ENABLED, getFirebaseServices } from '$lib/firebase.client';
	import {
		collection,
		doc,
		getDocs,
		serverTimestamp,
		writeBatch,
		type Firestore
	} from 'firebase/firestore';

	const eventDate = '2025-11-23T00:00:00-05:00';

	let dishes: Dish[] = [];
	let attendees: any[] = [];
	
	const unsubscribeDishes = dishesStore.subscribe((value) => {
		dishes = value;
	});

	const unsubscribeAttendees = attendeesStore.subscribe((value) => {
		attendees = value;
	});

	onDestroy(() => {
		unsubscribeDishes();
		unsubscribeAttendees();
		stopAuth?.();
	});

	let stopAuth: (() => void) | null = null;

	onMount(() => {
		(async () => {
			try {
				await ensureAppCheck();
			} catch (error) {
				console.warn('App Check not enabled yet.', error);
			}

			stopAuth = await startAuthListener();
		})();

		return () => {
			stopAuth?.();
		};
	});

	const dishStatuses: DishStatus[] = ['⏳ Unclaimed', '✅ Confirmed'];
	const dishTypes: DishType[] = ['Appetizer', 'Main', 'Side', 'Dessert', 'Drink'];

	type DishForm = {
		name: string;
		type: DishType;
		broughtByName: string;
	};

	const defaultDishForm: DishForm = {
		name: '',
		type: 'Main',
		broughtByName: ''
	};

	let dishForm: DishForm = { ...defaultDishForm };
	let dishDialog: HTMLDialogElement | null = null;
	let dishEditingId: string | null = null;
	let dishFormError = '';
	let dishSubmitting = false;

	function openDishModal(dish?: Dish) {
		if (dish) {
			dishEditingId = dish.id;
			dishForm = {
				name: dish.name,
				type: dish.type,
				broughtByName: dish.broughtByName
			};
		} else {
			dishEditingId = null;
			dishForm = { ...defaultDishForm };
		}
		dishFormError = '';
		dishDialog?.showModal();
	}

	function closeDishModal() {
		dishDialog?.close();
	}

	function validateDishForm() {
		if (!dishForm.name.trim()) {
			dishFormError = 'Dish name is required.';
			return false;
		}
		if (!dishForm.type) {
			dishFormError = 'Dish type is required.';
			return false;
		}
		dishFormError = '';
		return true;
	}

	async function handleDishSubmit() {
		if (!validateDishForm()) return;
		dishSubmitting = true;
		try {
			const status: DishStatus = dishForm.broughtByName.trim() ? '✅ Confirmed' : '⏳ Unclaimed';
			if (dishEditingId) {
				await updateDish(dishEditingId, {
					...dishForm,
					status
				});
				toastStore.push({
					title: 'Dish updated',
					message: `${dishForm.name} has been updated.`,
					variant: 'success'
				});
			} else {
				await addDish({
					...dishForm,
					status
				});
				toastStore.push({
					title: 'Dish added',
					message: `${dishForm.name} has been added.`,
					variant: 'success'
				});
			}
			closeDishModal();
			dishForm = { ...defaultDishForm };
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Something went wrong',
				message: 'Unable to save dish. Please try again.',
				variant: 'error'
			});
		} finally {
			dishSubmitting = false;
		}
	}

	async function handleDishDelete(dish: Dish) {
		try {
			await deleteDish(dish.id);
			toastStore.push({
				title: 'Dish removed',
				message: `${dish.name} was removed.`,
				variant: 'info'
			});
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Delete failed',
				message: 'We could not delete that dish.',
				variant: 'error'
			});
		}
	}

	async function handleStatusChange(event: CustomEvent<{ dish: Dish; status: DishStatus }>) {
		const { dish, status } = event.detail;
		try {
			await updateDish(dish.id, { status });
			toastStore.push({
				title: 'Status updated',
				message: `${dish.name} is now ${status}.`,
				variant: 'success'
			});
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Update failed',
				message: 'Unable to change dish status.',
				variant: 'error'
			});
		}
	}

	const attendeeSeeds = [
		{ name: 'Ferdy', plusOnes: 0, status: '✅ Confirmed' },
		{ name: 'Monique', plusOnes: 1, status: '✅ Confirmed' },
		{ name: 'James', plusOnes: 0, status: '✅ Confirmed' },
		{ name: 'Frances', plusOnes: 0, status: '✅ Confirmed' },
		{ name: 'Ricky', plusOnes: 0, status: '✅ Confirmed' },
		{ name: 'Brit', plusOnes: 0, status: '✅ Confirmed' },
		{ name: 'Diego', plusOnes: 0, status: '✅ Confirmed' },
		{ name: 'Alexis', plusOnes: 0, status: '✅ Confirmed' },
		{ name: 'Saul', plusOnes: 0, status: '✅ Confirmed' },
		{ name: 'Yamil', plusOnes: 0, status: '✅ Confirmed' }
	];

	const dishSeeds = [
		// Assigned dishes
		{ name: 'Pastelón', type: 'Main', broughtByName: 'Ferdy', status: '✅ Confirmed' },
		{ name: 'Mashed Potatoes', type: 'Side', broughtByName: 'Ricky', status: '✅ Confirmed' },
		{ name: 'Salad', type: 'Side', broughtByName: 'Alexis', status: '✅ Confirmed' },
		{ name: 'Soup', type: 'Appetizer', broughtByName: 'Saul', status: '✅ Confirmed' },
		{ name: 'Coquito', type: 'Drink', broughtByName: 'Yamil', status: '✅ Confirmed' },
		{ name: 'Apple Pie', type: 'Dessert', broughtByName: 'James', status: '✅ Confirmed' },
		// Unclaimed dishes
		{ name: 'Rotisserie Chicken', type: 'Main', broughtByName: '', status: '⏳ Unclaimed' },
		{ name: 'Stuffing', type: 'Side', broughtByName: '', status: '⏳ Unclaimed' },
		{ name: 'Green Bean Casserole', type: 'Side', broughtByName: '', status: '⏳ Unclaimed' },
		{ name: 'Sweet Potatoes', type: 'Side', broughtByName: '', status: '⏳ Unclaimed' }
	];

	let isSeeding = false;

	function slugify(input: string) {
		return input
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	async function runSeed() {
		isSeeding = true;
		try {
			const { db } = getFirebaseServices();
			await seedCollection(db);
			toastStore.push({
				title: 'Seed complete',
				message: 'Sample attendees and dishes have been added.',
				variant: 'success'
			});
		} catch (error) {
			console.error(error);
			toastStore.push({
				title: 'Seed failed',
				message: 'Could not seed data. Check the console for details.',
				variant: 'error'
			});
		} finally {
			isSeeding = false;
		}
	}

	async function seedCollection(db: Firestore) {
		const attendeesRef = collection(db, 'attendees');
		const dishesRef = collection(db, 'dishes');

		const attendeesSnapshot = await getDocs(attendeesRef);
		const dishesSnapshot = await getDocs(dishesRef);

		if (!attendeesSnapshot.empty || !dishesSnapshot.empty) {
			console.info('Skipping seed: collections already have data.');
			return;
		}

		const batch = writeBatch(db);

		attendeeSeeds.forEach((attendee) => {
			const ref = doc(db, 'attendees', slugify(attendee.name));
			batch.set(
				ref,
				{
					...attendee,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				},
				{ merge: true }
			);
		});

		dishSeeds.forEach((dish) => {
			const ref = doc(db, 'dishes', slugify(dish.name));
			batch.set(
				ref,
				{
					...dish,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				},
				{ merge: true }
			);
		});

		await batch.commit();
	}
</script>

<ToastHost />

<main class="mx-auto flex max-w-7xl flex-col gap-8 sm:gap-12 px-3 sm:px-4 pb-16 sm:pb-24 pt-4 sm:pt-6 lg:px-8">
	<!-- Hero Section -->
	<section class="space-y-4 sm:space-y-0">
		<!-- Mobile Image -->
		<div class="lg:hidden overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
			<img
				src="/cover.jpg"
				alt="Friends sharing a cozy candlelit meal"
				class="w-full h-48 sm:h-64 object-cover"
				loading="eager"
			/>
		</div>

		<!-- Event Details -->
		<div class="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-6 sm:p-8 shadow-2xl lg:p-12">
			<div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
			<div class="relative z-10 grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
				<div class="flex flex-col justify-center space-y-4 sm:space-y-6 text-white">
					<div class="inline-flex items-center gap-2 sm:gap-3 self-start rounded-full bg-white/20 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-sm">
						<span class="text-2xl sm:text-3xl" aria-hidden="true">🦃</span>
						<span class="text-xs sm:text-sm font-bold uppercase tracking-wider">Friendsgiving 2025</span>
					</div>
					<h1 class="text-3xl sm:text-4xl font-black leading-tight lg:text-5xl">
						Sunday, November 23, 2025
					</h1>
					<div class="flex flex-wrap items-center gap-2 text-base sm:text-lg font-medium">
						<Icon name="schedule" size={24} className="text-white/90 sm:hidden" />
						<Icon name="schedule" size={28} className="text-white/90 hidden sm:block" />
						<span class="text-sm sm:text-base">3:30ish PM ET</span>
						<span class="text-white/60">•</span>
						<Icon name="location_on" size={24} className="text-white/90 sm:hidden" />
						<Icon name="location_on" size={28} className="text-white/90 hidden sm:block" />
						<span class="text-sm sm:text-base">Jessy's Home</span>
					</div>
					<p class="text-base sm:text-lg text-white/90 leading-relaxed">
						Bring your favorite dish and cozy vibes. Celebrate <span class="text-rotate font-bold text-white"><span>friendship</span><span>food</span><span>gratitude</span></span> together!
					</p>
					<div class="flex flex-wrap items-center gap-3 pt-2 sm:pt-4">
						<Countdown targetDate={eventDate} />
						<div class="ml-auto">
							{#if $authLoading}
								<div class="flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2">
									<span class="loading loading-spinner loading-sm text-white"></span>
									<span class="text-sm text-white/90">Loading...</span>
								</div>
							{:else if $userStore}
								<div class="flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-3 py-2 shadow-lg">
									{#if $userStore.photoURL}
										<img
											src={$userStore.photoURL}
											alt={$userStore.displayName ?? 'Signed in user'}
											class="h-7 w-7 rounded-full ring-2 ring-white/40"
											referrerpolicy="no-referrer"
										/>
									{/if}
									<span class="text-sm font-semibold text-white hidden sm:inline">{$userStore.displayName || 'User'}</span>
									<button
										class="btn btn-ghost btn-xs text-white hover:bg-white/20 gap-1 min-h-0 h-7"
										on:click|preventDefault={signOutOfHub}
										aria-label="Sign out"
									>
										<Icon name="logout" size={14} />
										<span class="hidden sm:inline text-xs">Sign out</span>
									</button>
								</div>
							{:else}
								<button
									class="btn btn-sm gap-2 shadow-xl hover:shadow-2xl transition-all bg-white text-orange-600 hover:bg-white/95 border-0 font-bold"
									on:click|preventDefault={signInWithGoogle}
									aria-label="Sign in with Google"
								>
									<Icon name="login" size={18} />
									Sign in with Google
								</button>
							{/if}
						</div>
					</div>
				</div>
				<div class="relative hidden lg:block">
					<div class="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-sm"></div>
					<img
						src="/cover.jpg"
						alt="Friends sharing a cozy candlelit meal"
						class="relative h-full w-full rounded-2xl object-cover shadow-2xl"
						loading="lazy"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- Attendees -->
	<div id="attendees">
		<AttendeesTable />
	</div>

	<section id="dishes" class="space-y-6">
		<div class="flex items-center justify-between gap-3">
			<div>
				<h2 class="text-2xl sm:text-3xl font-black text-neutral flex items-center gap-2">
					<Icon name="restaurant" size={32} className="text-orange-600" />
					Dishes
				</h2>
				<p class="text-sm text-neutral/60 mt-1">What everyone's bringing</p>
			</div>
			<GuardedActions>
				<button
					class="btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all w-10 h-10 sm:w-12 sm:h-12"
					type="button"
					on:click={() => openDishModal()}
					aria-label="Add dish"
				>
					<Icon name="add" size={24} />
				</button>
			</GuardedActions>
		</div>

		{#if dishes.length === 0}
			<div class="rounded-box border border-dashed border-base-content/10 bg-base-100 p-8 text-center shadow-sm">
				<Icon name="restaurant" size={48} className="text-base-content/20 mx-auto mb-2" />
				<p class="text-base-content/60 text-sm">No dishes yet. Start the feast!</p>
			</div>
		{:else}
			{@const dishTypes = ['Main', 'Appetizer', 'Side', 'Dessert', 'Drink']}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each dishTypes as type}
					{@const typeDishes = dishes.filter(d => d.type === type)}
					{#if typeDishes.length > 0}
						<div class="space-y-3">
							<h3 class="text-sm font-bold text-neutral uppercase tracking-wider flex items-center gap-2">
								<span class="w-1 h-4 bg-orange-500 rounded"></span>
								{type}s
							</h3>
							<div class="space-y-2">
								{#each typeDishes as dish (dish.id)}
									<DishCard
										{dish}
										showActions={$userStore !== null}
										on:edit={() => openDishModal(dish)}
										on:delete={() => handleDishDelete(dish)}
									/>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</section>

	<!-- Shopping and Extras Grid -->
	<div class="grid gap-6 lg:grid-cols-2">
		<ShoppingList />
		<Extras />
	</div>

</main>

<Footer />

<dialog bind:this={dishDialog} class="modal modal-bottom sm:modal-middle">
	<div class="modal-box max-w-3xl p-0 bg-white shadow-2xl overflow-hidden">
		<!-- Gradient Header -->
		<div class="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
			<div class="flex items-center gap-4">
				<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
					<Icon name={dishEditingId ? 'edit' : 'add_circle'} size={32} className="text-white" />
				</div>
				<div>
					<h3 class="text-3xl font-black text-white">
						{dishEditingId ? 'Edit Dish' : 'Add New Dish'}
					</h3>
					<p class="text-sm text-white/80 mt-1">Fill in the details below</p>
				</div>
			</div>
		</div>

		<form class="p-8 space-y-6" on:submit|preventDefault={handleDishSubmit}>
			<!-- Dish Name -->
			<div class="form-control">
				<label class="label pb-2">
					<span class="label-text text-base font-bold text-neutral flex items-center gap-2">
						<Icon name="restaurant" size={20} className="text-orange-600" />
						Dish Name
					</span>
					<span class="label-text-alt text-error">Required</span>
				</label>
				<input 
					type="text" 
					class="input input-bordered input-lg w-full bg-stone-50 border-2 focus:bg-white focus:border-orange-500 transition-all" 
					bind:value={dishForm.name} 
					placeholder="e.g., Pumpkin Pie, Turkey, Stuffing..."
					required 
				/>
			</div>

			<!-- Type -->
			<div class="form-control">
				<label class="label pb-2">
					<span class="label-text text-base font-bold text-neutral flex items-center gap-2">
						<Icon name="category" size={20} className="text-orange-600" />
						Dish Type
					</span>
					<span class="label-text-alt text-error">Required</span>
				</label>
				<select class="select select-bordered select-lg w-full bg-stone-50 border-2 focus:bg-white focus:border-orange-500" bind:value={dishForm.type} required>
					{#each dishTypes as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</div>

			<!-- Brought By -->
			<div class="form-control">
				<label class="label pb-2">
					<span class="label-text text-base font-bold text-neutral flex items-center gap-2">
						<Icon name="person" size={20} className="text-orange-600" />
						Brought By
					</span>
					<span class="label-text-alt text-neutral/60">Optional</span>
				</label>
				<select
					class="select select-bordered select-lg w-full bg-stone-50 border-2 focus:bg-white focus:border-orange-500 transition-all"
					bind:value={dishForm.broughtByName}
				>
					<option value="">Select an attendee...</option>
					{#each attendees as attendee}
						<option value={attendee.name}>{attendee.name}</option>
					{/each}
				</select>
			</div>

			{#if dishFormError}
				<div class="alert alert-error shadow-lg">
					<Icon name="error" size={24} />
					<span class="font-semibold">{dishFormError}</span>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex justify-end gap-3 pt-6">
				<button type="button" class="btn btn-lg btn-ghost gap-2" on:click={closeDishModal}>
					<Icon name="close" size={20} />
					Cancel
				</button>
				<button type="submit" class="btn btn-primary btn-lg gap-2 shadow-xl hover:shadow-2xl transition-all" disabled={dishSubmitting}>
					{#if dishSubmitting}
						<span class="loading loading-spinner loading-md"></span>
					{:else}
						<Icon name="check_circle" size={22} />
					{/if}
					{dishEditingId ? 'Update Dish' : 'Add Dish'}
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop bg-black/60">
		<button type="submit" aria-label="Close modal">Close</button>
	</form>
</dialog>
