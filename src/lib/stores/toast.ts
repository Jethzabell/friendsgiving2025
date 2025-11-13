import { writable } from 'svelte/store';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
	id: string;
	title?: string;
	message: string;
	variant?: ToastVariant;
}

const toasts = writable<ToastMessage[]>([]);

export const toastStore = {
	subscribe: toasts.subscribe,
	push(message: Omit<ToastMessage, 'id'>, timeout = 3000) {
		const id = crypto.randomUUID();
		const toast = { id, ...message };
		toasts.update((current) => [...current, toast]);

		if (timeout > 0) {
			setTimeout(() => {
				toasts.update((current) => current.filter((item) => item.id !== id));
			}, timeout);
		}
	},
	dismiss(id: string) {
		toasts.update((current) => current.filter((item) => item.id !== id));
	},
	clear() {
		toasts.set([]);
	}
};

