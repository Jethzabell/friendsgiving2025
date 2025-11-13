import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import { getFirebaseServices, googleProvider } from '$lib/firebase.client';

const user = writable<User | null>(null);
const loading = writable<boolean>(true);

export async function startAuthListener() {
	if (!browser) return () => {};

	const { auth } = getFirebaseServices();
	const { onAuthStateChanged } = await import('firebase/auth');

	loading.set(true);

	const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
		user.set(firebaseUser);
		loading.set(false);
	});

	return () => {
		unsubscribe();
	};
}

export async function signInWithGoogle() {
	if (!browser) return;
	const { auth } = getFirebaseServices();
	const { signInWithPopup } = await import('firebase/auth');
	await signInWithPopup(auth, googleProvider);
}

export async function signOutOfHub() {
	if (!browser) return;
	const { auth } = getFirebaseServices();
	const { signOut } = await import('firebase/auth');
	await signOut(auth);
}

export const userStore = {
	subscribe: user.subscribe
};

export const authLoading = {
	subscribe: loading.subscribe
};

