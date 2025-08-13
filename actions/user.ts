"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Get the current authenticated user
 * @returns The authenticated user object
 * @throws Error if user is not authenticated
 */
export async function getUser() {
	const supabase = await createClient();

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error) {
		throw new Error(`Failed to get user: ${error.message}`);
	}

	return user;
}

/**
 * Get the current authenticated user ID
 * @returns The user ID string
 * @throws Error if user is not authenticated
 */
export async function getCurrentUserId() {
	const user = await getUser();
	return user?.id;
}

/**
 * Check if a user is currently authenticated
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated() {
	try {
		await getUser();
		return true;
	} catch {
		return false;
	}
}
