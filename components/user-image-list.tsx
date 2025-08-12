"use client";

import GenerationResult from "@/components/generation-result";
import { useImageGen } from "@/components/image-gen-provider";

export default function UserImageList() {
	const { generationMap } = useImageGen();

	return (
		<div className="w-full relative">
			<div className="h-10" />

			<div className="pl-2 pr-8">
				{Object.keys(generationMap).length > 0 && (
					<div className="flex flex-col gap-6">
						{Object.keys(generationMap)
							.reverse()
							.map((generationId) => {
								const generation = generationMap[generationId];
								if (!generation) {
									return null;
								}
								return <GenerationResult key={generation.id} generation={generation} />;
							})}
					</div>
				)}
			</div>
		</div>
	);
}
