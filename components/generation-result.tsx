"use client";

import { AlertCircle, Loader2, RotateCcw, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteGeneration } from "@/actions/generations";
import { useImageGen } from "@/components/image-gen-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Generation } from "@/lib/types";

interface GenerationResultProps {
	generation: Generation;
}

export default function GenerationResult({ generation }: GenerationResultProps) {
	const { setGenParams, generateImage } = useImageGen();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const [x, y] = generation.aspectRatio.split(" ")[0].split(":").map(Number);
	const isLandscape = x / y > 1;

	const handleDelete = async () => {
		setDeleteDialogOpen(true);
	};

	const progress = Math.floor((generation.stepsCompleted / generation.steps) * 100);

	return (
		<div key={generation.id}>
			<div className="grid grid-cols-16 gap-6">
				<div
					className={`relative grid gap-2 ${isLandscape ? "grid-cols-2" : "grid-cols-4"} col-span-11`}
					style={
						{
							"--aspect-ratio": generation.aspectRatio.split(" ")[0].replace(":", "/"),
						} as React.CSSProperties
					}
				>
					{generation.error && (
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2 bg-black rounded-sm py-1 px-2 max-w-[80%] truncate">
							<AlertCircle className="size-[14px] text-red-500" />
							<p className="text-xs text-foreground/80">{generation.error}</p>
						</div>
					)}

					{generation.isLoading && generation.images.length === 0 && (
						<div className="absolute top-1 left-1 flex items-center justify-center gap-2 bg-black rounded-sm py-1 px-2 max-w-[80%] truncate z-1">
							<p className="text-xs text-foreground/60">Submitting...</p>
						</div>
					)}

					{generation.isLoading && generation.images.length > 0 && (
						<div className="absolute top-1 left-1 flex items-center justify-center gap-2 bg-black rounded-sm py-1 px-2 max-w-[80%] truncate z-1">
							<p className="text-xs text-foreground/60">{progress}%</p>
						</div>
					)}

					{(generation.isLoading || generation.error) && generation.images.length === 0
						? Array.from({ length: generation.batchSize }).map((_, index) =>
								generation.error ? (
									<div
										key={`${generation.id}-error-${index}`}
										className="w-full aspect-[var(--aspect-ratio)] rounded-sm bg-muted/50"
									/>
								) : (
									<Skeleton
										key={`${generation.id}-placeholder-${index}`}
										className={`w-full aspect-[var(--aspect-ratio)] rounded-sm`}
									/>
								),
							)
						: generation.images.map(({ id, url }, index) => (
								<Link
									key={id}
									href={`/image/${id}`}
									scroll={false}
									className="relative flex cursor-pointer border-0 p-0 bg-transparent aspect-[var(--aspect-ratio)] overflow-hidden rounded-sm"
									aria-label={`View generated image ${index + 1} in larger size`}
								>
									<Image
										src={url}
										alt={`Generated image ${index + 1} for: ${generation.prompt}`}
										fill
										sizes={`(max-width: 768px) 50vw, ${isLandscape ? "30vw" : "20vw"}`}
										quality={100}
										className={`w-full h-auto aspect-[var(--aspect-ratio)] object-cover  shadow-md hover:opacity-90 transition-opacity ${generation.isLoading ? "blur-[1px] scale-[1.01]" : ""}`}
									/>
								</Link>
							))}
				</div>

				<div className="flex flex-col justify-between gap-6 col-span-5 pr-8 group">
					<div className="flex flex-col gap-2">
						<button
							type="button"
							className="text-xs text-gray-300 leading-5 text-pretty text-left hover:opacity-70 cursor-pointer transition-opacity"
							onClick={() => setGenParams((prev) => ({ ...prev, prompt: generation.prompt }))}
						>
							{generation.prompt}
						</button>
						<div className="flex gap-1 flex-wrap">
							<Badge variant="secondary" className="opacity-40">
								Steps: {generation.steps}
							</Badge>
							<Badge variant="secondary" className="opacity-40">
								CFG: {generation.guidance}
							</Badge>
							<Badge variant="secondary" className="opacity-40">
								AR: {generation.aspectRatio}
							</Badge>
						</div>
					</div>

					<div className="ml-[-8px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
						<Button
							variant="ghost"
							size="xs"
							className="text-white/80"
							onClick={() => generateImage(generation)}
						>
							<RotateCcw className="size-[14px]" />
							Rerun
						</Button>

						<Button
							variant="ghost"
							size="xs"
							className="text-white/80"
							onClick={() => handleDelete()}
						>
							<Trash className="size-[14px]" />
							Delete
						</Button>
					</div>
				</div>
			</div>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							This action cannot be undone. All images associated with this generation will be
							deleted.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								startTransition(async () => {
									await deleteGeneration(generation.id);
									setDeleteDialogOpen(false);
								});
							}}
							disabled={isPending}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
