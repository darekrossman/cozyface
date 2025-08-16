"use client";

import { ImagePlus, Plus, Send, SendHorizonal, Settings2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { aspectRatios } from "@/lib/constants";
import type { GenerationParams } from "@/lib/types";
import { useImageGen } from "./image-gen-provider";

export default function ImageGenerationForm() {
  const { genParams, setGenParams, generateImage, imageUrls, setImageUrls } = useImageGen();
  const [localGenParams, setLocalGenParams] = useState<GenerationParams>({ ...genParams, cfg: 4 });
  const [showMedia, setShowMedia] = useState(false);

  const handleSubmit = () => {
    setGenParams(localGenParams);
    generateImage(localGenParams);
  };

  useEffect(() => {
    setLocalGenParams(genParams);
  }, [genParams]);

  useEffect(() => {
    if (imageUrls && imageUrls.length > 0) {
      setShowMedia(true);
    } else {
      setShowMedia(false);
    }
  }, [imageUrls]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Only submit if there's prompt text
        if (localGenParams.prompt.trim()) {
          handleSubmit();
        }
      }
    },
    [localGenParams, handleSubmit],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Popover>
      <form
        className="w-full"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <PopoverAnchor asChild>
          <div className="bg-card rounded-md border border-border bg-neutral-800">
            <div className="flex items-start gap-2 p-2 ">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10"
                onClick={() => setShowMedia(!showMedia)}
              >
                <ImagePlus size={20} className={`${showMedia ? "text-accent-foreground" : ""}`} />
              </Button>

              <Textarea
                className="min-h-6 py-2.5 flex-1 resize-none w-full border-none dark:bg-transparent focus:outline-none"
                placeholder="Enter your prompt..."
                value={localGenParams.prompt}
                onChange={(e) => setLocalGenParams({ ...localGenParams, prompt: e.target.value })}
              />

              <div className="flex items-center gap-1">
                <Button type="submit" size="icon" variant="ghost" className="h-10 w-10">
                  <SendHorizonal size={20} />
                </Button>

                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 data-[state=open]:text-accent-foreground`}
                  >
                    <Settings2 size={20} />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  align="start"
                  sideOffset={8}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  style={{
                    width: "var(--radix-popover-trigger-width)",
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1">
                      <Label htmlFor="guidance" className="text-xs">
                        Guidance
                      </Label>
                      <Input
                        id="guidance"
                        type="number"
                        step="0.1"
                        value={localGenParams.guidance}
                        onChange={(e) =>
                          setLocalGenParams({
                            ...localGenParams,
                            guidance: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="grid w-full items-center gap-1">
                      <Label htmlFor="steps" className="text-xs">
                        Steps
                      </Label>
                      <Input
                        id="steps"
                        type="number"
                        min="1"
                        value={localGenParams.steps}
                        onChange={(e) =>
                          setLocalGenParams({
                            ...localGenParams,
                            steps: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>

                    <div className="grid w-full items-center gap-1 col-span-2">
                      <Label htmlFor="aspectRatio" className="text-xs">
                        Aspect Ratio
                      </Label>
                      <Select
                        value={localGenParams.aspectRatio}
                        onValueChange={(value) =>
                          setLocalGenParams({ ...localGenParams, aspectRatio: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatios.map((ratio) => (
                            <SelectItem key={ratio} value={ratio}>
                              {ratio}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </div>
            </div>

            {showMedia && (
              <div className="flex items-start gap-2 p-2 border-t border-border">
                {imageUrls?.map((imageUrl) => (
                  <div
                    key={imageUrl}
                    className="relative w-[72px] aspect-square rounded-sm overflow-hidden"
                  >
                    <Image src={imageUrl} alt="Generated image" fill className="object-cover" />
                  </div>
                ))}

                <button
                  type="button"
                  className="flex items-center justify-center relative w-[72px] aspect-square rounded-sm overflow-hidden bg-muted/20 border border-dashed border-border cursor-pointer"
                >
                  <Plus className="text-muted-foreground" size={13} />
                </button>
              </div>
            )}
          </div>
        </PopoverAnchor>
      </form>
    </Popover>
  );
}
