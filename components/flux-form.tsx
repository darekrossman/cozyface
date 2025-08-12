"use client";

import { Send, Settings2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { aspectRatios, samplers, schedulers } from "@/lib/constants";
import { useImageGen } from "./image-gen-provider";

interface GenerationParams {
	prompt: string;
	guidance: number;
	steps: number;
	aspectRatio: string;
}

interface ImageGenerationFormProps {
	genParams: GenerationParams;
	setGenParams: (params: GenerationParams) => void;
	onSubmit: () => void;
}

export default function ImageGenerationForm() {
	const { genParams, setGenParams, generateImage } = useImageGen();

	// Auto-resize textarea hook
	const { textareaRef, autoResizeTextarea } = useAutoResizeTextarea();

	// Handle textarea change with auto-resize
	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setGenParams({ ...genParams, prompt: e.target.value });
	};

	useEffect(() => {
		autoResizeTextarea();
	}, [genParams.prompt]);

	return (
		<form
			className="w-full"
			onSubmit={(e) => {
				e.preventDefault();
				generateImage(genParams);
			}}
		>
			<div className="relative">
				<Textarea
					ref={textareaRef}
					className="min-h-14 resize-none pr-24 pl-4 py-4 w-full dark:bg-card"
					placeholder="Enter your prompt..."
					value={genParams.prompt}
					onChange={handleTextareaChange}
				/>

				<div className="absolute right-2 top-2 flex items-center gap-1">
					<Button type="submit" variant="ghost" className="h-10 w-10">
						<Send />
					</Button>

					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" className="h-10 w-10">
								<Settings2 />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="end"
							sideOffset={16}
							alignOffset={-8}
							onOpenAutoFocus={(e) => e.preventDefault()}
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
										value={genParams.guidance}
										onChange={(e) =>
											setGenParams({
												...genParams,
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
										value={genParams.steps}
										onChange={(e) =>
											setGenParams({
												...genParams,
												steps: parseInt(e.target.value) || 1,
											})
										}
									/>
								</div>

								{/* <div className="grid w-full items-center gap-1 col-span-2">
									<Label htmlFor="sampler" className="text-xs">
										Sampler
									</Label>
									<Select
										value={genParams.sampler}
										onValueChange={(value) =>
											setGenParams({ ...genParams, sampler: value })
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select sampler" />
										</SelectTrigger>
										<SelectContent>
											{samplers.map((sampler) => (
												<SelectItem key={sampler} value={sampler}>
													{sampler}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div> */}
								{/* <div className="grid w-full items-center gap-1 col-span-2">
									<Label htmlFor="scheduler" className="text-xs">
										Scheduler
									</Label>
									<Select
										value={genParams.scheduler}
										onValueChange={(value) =>
											setGenParams({ ...genParams, scheduler: value })
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select scheduler" />
										</SelectTrigger>
										<SelectContent>
											{schedulers.map((scheduler) => (
												<SelectItem key={scheduler} value={scheduler}>
													{scheduler}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div> */}
								<div className="grid w-full items-center gap-1 col-span-2">
									<Label htmlFor="aspectRatio" className="text-xs">
										Aspect Ratio
									</Label>
									<Select
										value={genParams.aspectRatio}
										onValueChange={(value) => setGenParams({ ...genParams, aspectRatio: value })}
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
					</Popover>
				</div>
			</div>
		</form>
	);
}
