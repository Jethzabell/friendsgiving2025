import { browser } from '$app/environment';
import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'YOUR_FIREBASE_API_KEY',
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'YOUR_FIREBASE_AUTH_DOMAIN',
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'YOUR_FIREBASE_PROJECT_ID',
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'YOUR_FIREBASE_STORAGE_BUCKET',
	messagingSenderId:
		import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
	appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'YOUR_FIREBASE_APP_ID',
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let cachedApp: FirebaseApp | null = null;
let appCheckPromise: Promise<unknown> | null = null;

function initApp(): FirebaseApp {
	if (!browser) {
		throw new Error('Firebase can only be initialized in the browser.');
	}

	if (cachedApp) return cachedApp;

	const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
	cachedApp = app;
	return app;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
	prompt: 'select_account'
});

export function getFirebaseServices() {
	const app = initApp();
	const auth = getAuth(app);
	const db = getFirestore(app);
	const storage = getStorage(app);

	return {
		app,
		auth,
		db,
		storage
	};
}

export function ensureAppCheck() {
	if (!browser) return null;
	if (appCheckPromise) return appCheckPromise;

	const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY;
	if (!siteKey) return null;

	appCheckPromise = import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) =>
		initializeAppCheck(initApp(), {
			provider: new ReCaptchaV3Provider(siteKey),
			isTokenAutoRefreshEnabled: true
		})
	);

	return appCheckPromise;
}

export const SEED_ENABLED = (import.meta.env.VITE_SEED_ENABLED ?? 'false').toLowerCase() === 'true';

