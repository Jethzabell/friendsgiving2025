import type { Timestamp } from 'firebase/firestore';

export type AttendeeStatus = '⏳ Unclaimed' | '✅ Confirmed';

export interface Attendee {
	id: string;
	name: string;
	plusOnes: number;
	status: AttendeeStatus;
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
}

export type DishStatus = AttendeeStatus;
export type DishType = 'Main' | 'Appetizer' | 'Side' | 'Dessert' | 'Drink';

export interface Dish {
	id: string;
	name: string;
	type: DishType;
	broughtByName: string;
	status: DishStatus;
	notes?: string;
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
}

export interface HubSettings {
	id: string;
	playlistUrl?: string;
	photosUrl?: string;
	locationText?: string;
	shoppingList?: ChecklistItem[];
	updatedAt?: Timestamp;
}

export interface ChecklistItem {
	id: string;
	item: string;
	quantity: number;
	broughtBy: string;
	done: boolean;
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
}

