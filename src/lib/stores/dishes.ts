import { browser } from '$app/environment';
import { readable } from 'svelte/store';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
	type DocumentData,
	type Firestore
} from 'firebase/firestore';
import type { Dish, DishStatus, DishType } from '$lib/types';
import { getFirebaseServices } from '$lib/firebase.client';

const STATUS_FALLBACK: DishStatus = '⏳ Unclaimed';

function mapDish(docSnap: DocumentData, id: string): Dish {
	return {
		id,
		name: docSnap.name ?? '',
		type: (docSnap.type as DishType) ?? 'Main',
		broughtByName: docSnap.broughtByName ?? '',
		status: (docSnap.status as DishStatus) ?? STATUS_FALLBACK,
		notes: docSnap.notes ?? '',
		createdAt: docSnap.createdAt,
		updatedAt: docSnap.updatedAt
	};
}

function getCollection(db: Firestore) {
	return collection(db, 'dishes');
}

export const dishesStore = readable<Dish[]>([], (set) => {
	if (!browser) {
		set([]);
		return () => {};
	}

	const { db } = getFirebaseServices();
	const dishesQuery = query(getCollection(db), orderBy('name'));

	const unsubscribe = onSnapshot(
		dishesQuery,
		(snapshot) => {
			set(snapshot.docs.map((document) => mapDish(document.data(), document.id)));
		},
		(error) => {
			console.error('Firestore dishes listener error:', error);
			set([]);
		}
	);

	return () => unsubscribe();
});

export async function addDish(payload: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>) {
	const { db } = getFirebaseServices();
	await addDoc(getCollection(db), {
		...payload,
		status: payload.status ?? STATUS_FALLBACK,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});
}

export async function updateDish(id: string, payload: Partial<Omit<Dish, 'id'>>) {
	const { db } = getFirebaseServices();
	const dishRef = doc(db, 'dishes', id);
	await updateDoc(dishRef, {
		...payload,
		updatedAt: serverTimestamp()
	});
}

export async function deleteDish(id: string) {
	const { db } = getFirebaseServices();
	const dishRef = doc(db, 'dishes', id);
	await deleteDoc(dishRef);
}

