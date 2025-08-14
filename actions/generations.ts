"use server";

import { getCurrentUserId } from "@/actions/user";
import { createClient } from "@/lib/supabase/server";
import type { Generation } from "@/lib/types";

/**
 * Create a new generation record
 * @param params - Generation parameters
 * @returns The created generation object
 * @throws Error if creation fails or user is not authenticated
 */
export async function createGeneration(generation: Generation): Promise<Generation> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("generations")
		.insert({
			id: generation.id,
			user_id: generation.userId,
			prompt: generation.prompt,
			guidance: generation.guidance,
			steps: generation.steps,
			aspect_ratio: generation.aspectRatio,
			output_format: generation.outputFormat,
			batch_size: generation.batchSize,
			images: generation.images,
			is_loading: generation.isLoading,
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create generation: ${error.message}`);
	}

	return data;
}

/**
 * Update an existing generation record
 * @param id - Generation ID
 * @param updates - Partial generation data to update
 * @returns The updated generation object
 * @throws Error if update fails, generation not found, or user not authorized
 */
export async function updateGeneration(
	id: string,
	updates: Partial<{
		images?: { id: string; url: string }[];
		stepsCompleted?: number;
		isLoading?: boolean;
		error?: string;
	}>,
): Promise<Generation> {
	const supabase = await createClient();
	const userId = await getCurrentUserId();

	if (!userId) {
		throw new Error("User must be authenticated to update generations");
	}

	// Convert camelCase to snake_case for database
	const dbUpdates: Record<string, any> = {};
	if (updates.images !== undefined) dbUpdates.images = updates.images;
	if (updates.stepsCompleted !== undefined) dbUpdates.steps_completed = updates.stepsCompleted;
	if (updates.isLoading !== undefined) dbUpdates.is_loading = updates.isLoading;
	if (updates.error !== undefined) dbUpdates.error = updates.error;

	const { data, error } = await supabase
		.from("generations")
		.update(dbUpdates)
		.eq("id", id)
		.eq("user_id", userId) // Ensure user can only update their own generations
		.select()
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			throw new Error("Generation not found or you don't have permission to update it");
		}
		throw new Error(`Failed to update generation: ${error.message}`);
	}

	return {
		id: data.id,
		userId: data.user_id,
		prompt: data.prompt,
		guidance: data.guidance,
		steps: data.steps,
		stepsCompleted: data.steps_completed,
		aspectRatio: data.aspect_ratio,
		outputFormat: data.output_format,
		batchSize: data.batch_size,
		images: data.images,
		isLoading: data.is_loading,
		error: data.error,
		createdAt: data.created_at,
		updatedAt: data.updated_at,
	};
}

/**
 * Get all generations for the current user
 * @returns Array of user's generations ordered by creation date (newest first)
 * @throws Error if user is not authenticated
 */
export async function getUserGenerations(): Promise<Generation[]> {
	const supabase = await createClient();
	const userId = await getCurrentUserId();

	if (!userId) {
		throw new Error("User must be authenticated to view generations");
	}

	const { data, error } = await supabase
		.from("generations")
		.select("*")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch generations: ${error.message}`);
	}

	return data.map((item) => ({
		id: item.id,
		userId: item.user_id,
		prompt: item.prompt,
		guidance: item.guidance,
		steps: item.steps,
		stepsCompleted: item.steps_completed,
		aspectRatio: item.aspect_ratio,
		outputFormat: item.output_format,
		batchSize: item.batch_size,
		images: item.images,
		isLoading: item.is_loading,
		error: item.error,
		createdAt: item.created_at,
		updatedAt: item.updated_at,
	}));
}

/**
 * Get a specific generation by ID (only if it belongs to the current user)
 * @param id - Generation ID
 * @returns The generation object
 * @throws Error if generation not found, user not authorized, or not authenticated
 */
export async function getGeneration(id: string): Promise<Generation> {
	const supabase = await createClient();
	const userId = await getCurrentUserId();

	if (!userId) {
		throw new Error("User must be authenticated to view generations");
	}

	const { data, error } = await supabase
		.from("generations")
		.select("*")
		.eq("id", id)
		.eq("user_id", userId)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			throw new Error("Generation not found or you don't have permission to view it");
		}
		throw new Error(`Failed to fetch generation: ${error.message}`);
	}

	return {
		id: data.id,
		userId: data.user_id,
		prompt: data.prompt,
		guidance: data.guidance,
		steps: data.steps,
		stepsCompleted: data.steps_completed,
		aspectRatio: data.aspect_ratio,
		outputFormat: data.output_format,
		batchSize: data.batch_size,
		images: data.images,
		isLoading: data.is_loading,
		error: data.error,
		createdAt: data.created_at,
		updatedAt: data.updated_at,
	};
}

/**
 * Delete a generation by ID (only if it belongs to the current user)
 * @param id - Generation ID
 * @throws Error if deletion fails, generation not found, or user not authorized
 */
export async function deleteGeneration(id: string): Promise<void> {
	const supabase = await createClient();
	const userId = await getCurrentUserId();

	if (!userId) {
		throw new Error("User must be authenticated to delete generations");
	}

	const { error } = await supabase.from("generations").delete().eq("id", id).eq("user_id", userId);

	if (error) {
		throw new Error(`Failed to delete generation: ${error.message}`);
	}
}

/**
 * Get a generation by image ID (only if it belongs to the current user)
 * @param imageId - The ID of the image to search for
 * @returns The generation object containing the image
 * @throws Error if generation not found, user not authorized, or not authenticated
 */
export async function getGenerationByImageId(imageId: string): Promise<Generation> {
	const supabase = await createClient();
	const userId = await getCurrentUserId();

	if (!userId) {
		throw new Error("User must be authenticated to view generations");
	}

	// Search for a generation that contains an image with the specified ID
	// Using PostgreSQL JSONB operators to search within the images array
	const { data, error } = await supabase
		.from("generations")
		.select("*")
		.eq("user_id", userId)
		.filter("images", "cs", `[{"id":"${imageId}"}]`)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			throw new Error("Generation not found or you don't have permission to view it");
		}
		throw new Error(`Failed to fetch generation by image ID: ${error.message}`);
	}

	return {
		id: data.id,
		userId: data.user_id,
		prompt: data.prompt,
		guidance: data.guidance,
		steps: data.steps,
		stepsCompleted: data.steps_completed,
		aspectRatio: data.aspect_ratio,
		outputFormat: data.output_format,
		batchSize: data.batch_size,
		images: data.images,
		isLoading: data.is_loading,
		error: data.error,
		createdAt: data.created_at,
		updatedAt: data.updated_at,
	};
}
