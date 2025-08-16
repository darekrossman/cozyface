"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { XIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import ImageDetail from "@/components/image-detail";
import ImageDetailWrapper from "@/components/image-detail-wrapper";
import { useImageGen } from "@/components/image-gen-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export default function ImageModal() {
  const router = useRouter();
  const { id } = useParams();
  const { generationMap } = useImageGen();

  const generation = Object.values(generationMap).find((gen) =>
    gen.images.some((img) => img.id === id),
  );

  return (
    <ImageDetailWrapper>
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
          className="relative h-full"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>Image</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden>
            <DialogDescription>Image detail for {id}</DialogDescription>
          </VisuallyHidden>

          {generation && (
            <ImageDetail
              closeButton={
                <DialogClose asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-8 rounded-full mr-[-1rem]  bg-transparent"
                  >
                    <XIcon className="size-4" />
                  </Button>
                </DialogClose>
              }
            />
          )}
        </DialogPrimitive.Content>
      </Dialog>
    </ImageDetailWrapper>
  );
}
