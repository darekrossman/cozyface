"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useParams, useRouter } from "next/navigation";
import ImageDetail from "@/components/image-detail";
import { useImageGen } from "@/components/image-gen-provider";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export default function ImageModal() {
	const router = useRouter();
	const { id } = useParams();
	const { generationMap } = useImageGen();

	const generation = Object.values(generationMap).find((gen) =>
		gen.images.some((img) => img.id === id),
	);

	console.log(generation);

	return (
		<Dialog
			defaultOpen={true}
			modal={true}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					router.back();
				}
			}}
		>
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className="fixed top-0 left-[var(--sidebar-width)] right-0 bottom-0 z-45 overflow-hidden"
				onInteractOutside={(e) => e.preventDefault()}
			>
				<VisuallyHidden>
					<DialogTitle>Image</DialogTitle>
				</VisuallyHidden>
				<VisuallyHidden>
					<DialogDescription>Image detail for {id}</DialogDescription>
				</VisuallyHidden>

				{generation && <ImageDetail />}
			</DialogPrimitive.Content>
		</Dialog>
	);
}
