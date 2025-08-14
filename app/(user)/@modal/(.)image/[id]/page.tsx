"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { XIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import ImageDetail from "@/components/image-detail";
import { useImageGen } from "@/components/image-gen-provider";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogOverlay,
	DialogTitle,
} from "@/components/ui/dialog";

export default function ImageModal() {
	const router = useRouter();
	const { id } = useParams();
	const { generationMap } = useImageGen();

	const generation = Object.values(generationMap).find((gen) =>
		gen.images.some((img) => img.id === id),
	);

	return (
		<Dialog
			defaultOpen={true}
			modal={false}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					router.back();
				}
			}}
		>
			<DialogPrimitive.Overlay
				data-slot="dialog-overlay"
				className="fixed inset-0 z-44 bg-transparent"
			/>
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className="fixed inset-0 left-[var(--sidebar-width)] z-45 overflow-hidden"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<VisuallyHidden>
					<DialogTitle>Image</DialogTitle>
				</VisuallyHidden>
				<VisuallyHidden>
					<DialogDescription>Image detail for {id}</DialogDescription>
				</VisuallyHidden>

				<div className="max-w-screen-2xl mx-auto">
					{generation && (
						<ImageDetail
							closeButton={
								<DialogClose asChild>
									<Button
										variant="secondary"
										size="icon"
										className="size-8 rounded-full mr-[-1rem] mt-[-1rem] bg-transparent"
									>
										<XIcon className="size-4" />
									</Button>
								</DialogClose>
							}
						/>
					)}
				</div>
			</DialogPrimitive.Content>
		</Dialog>
	);
}
