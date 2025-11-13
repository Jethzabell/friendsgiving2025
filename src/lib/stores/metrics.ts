import { derived } from 'svelte/store';
import { attendeesStore } from '$stores/attendees';
import { dishesStore } from '$stores/dishes';

export const totalGuests = derived(attendeesStore, ($attendees) =>
	$attendees.reduce((total, attendee) => total + 1 + (Number(attendee.plusOnes) || 0), 0)
);

export const claimedDishes = derived(dishesStore, ($dishes) =>
	$dishes.filter((dish) => dish.broughtByName?.trim()).length
);

export const confirmedDishes = derived(dishesStore, ($dishes) =>
	$dishes.filter((dish) => dish.status === '✅ Confirmed').length
);

