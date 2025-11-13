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
import type { Attendee, AttendeeStatus } from '$lib/types';
import { getFirebaseServices } from '$lib/firebase.client';

const STATUS_FALLBACK: AttendeeStatus = '⏳ Unclaimed';

function mapAttendee(docSnap: DocumentData, id: string): Attendee {
	return {
		id,
		name: docSnap.name ?? '',
		plusOnes: Number(docSnap.plusOnes ?? 0),
		dietary: docSnap.dietary ?? '',
		bringing: docSnap.bringing ?? '',
		status: (docSnap.status as AttendeeStatus) ?? STATUS_FALLBACK,
		createdAt: docSnap.createdAt,
		updatedAt: docSnap.updatedAt
	};
}

function getCollection(db: Firestore) {
	return collection(db, 'attendees');
}

export const attendeesStore = readable<Attendee[]>([], (set) => {
	if (!browser) {
		set([]);
		return () => {};
	}

	const { db } = getFirebaseServices();
	const attendeesQuery = query(getCollection(db), orderBy('name'));

	const unsubscribe = onSnapshot(
		attendeesQuery,
		(snapshot) => {
			set(snapshot.docs.map((document) => mapAttendee(document.data(), document.id)));
		},
		(error) => {
			console.error('Firestore attendees listener error:', error);
			set([]);
		}
	);

	return () => unsubscribe();
});

export async function addAttendee(payload: Omit<Attendee, 'id' | 'createdAt' | 'updatedAt'>) {
	const { db } = getFirebaseServices();
	await addDoc(getCollection(db), {
		...payload,
		plusOnes: Number(payload.plusOnes ?? 0),
		status: payload.status ?? STATUS_FALLBACK,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});
}

export async function updateAttendee(id: string, payload: Partial<Omit<Attendee, 'id'>>) {
	const { db } = getFirebaseServices();
	const attendeeRef = doc(db, 'attendees', id);
	await updateDoc(attendeeRef, {
		...payload,
		plusOnes:
			typeof payload.plusOnes === 'number'
				? payload.plusOnes
				: payload.plusOnes !== undefined
					? Number(payload.plusOnes)
					: undefined,
		updatedAt: serverTimestamp()
	});
}

export async function deleteAttendee(id: string) {
	const { db } = getFirebaseServices();
	const attendeeRef = doc(db, 'attendees', id);
	await deleteDoc(attendeeRef);
}

