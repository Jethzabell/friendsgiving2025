import { browser } from '$app/environment';
import { readable } from 'svelte/store';
import {
	doc,
	onSnapshot,
	serverTimestamp,
	setDoc,
	type Firestore
} from 'firebase/firestore';
import type { ChecklistItem, HubSettings } from '$lib/types';
import { getFirebaseServices } from '$lib/firebase.client';

const SETTINGS_DOC_ID = 'friendsgiving';

const defaultSettings: HubSettings = {
	id: SETTINGS_DOC_ID,
	playlistUrl: '',
	photosUrl: '',
	locationText: '',
	shoppingList: []
};

function getDocRef(db: Firestore) {
	return doc(db, 'settings', SETTINGS_DOC_ID);
}

export const settingsStore = readable<HubSettings>(defaultSettings, (set) => {
	if (!browser) {
		set(defaultSettings);
		return () => {};
	}

	const { db } = getFirebaseServices();
	const ref = getDocRef(db);

	const unsubscribe = onSnapshot(ref, (snapshot) => {
		if (!snapshot.exists()) {
			set(defaultSettings);
			return;
		}

		const data = snapshot.data() as HubSettings;
		set({
			...defaultSettings,
			...data,
			id: snapshot.id
		});
	});

	return () => unsubscribe();
});

export async function updateSettings(partial: Partial<HubSettings>) {
	const { db } = getFirebaseServices();
	await setDoc(
		getDocRef(db),
		{
			...partial,
			updatedAt: serverTimestamp()
		},
		{ merge: true }
	);
}

export async function upsertShoppingList(items: ChecklistItem[]) {
	await updateSettings({ shoppingList: items });
}

