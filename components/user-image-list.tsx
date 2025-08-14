"use client";

import GenerationResult from "@/components/generation-result";
import { useImageGen } from "@/components/image-gen-provider";

export default function UserImageList() {
	const { generationMap } = useImageGen();

	const sortedGenerationIds = Object.keys(generationMap).sort((a, b) => {
		const generationA = generationMap[a];
		const generationB = generationMap[b];
		return new Date(generationB.createdAt).getTime() - new Date(generationA.createdAt).getTime();
	});

	return (
		<div className="w-full relative">
			<div className="">
				{Object.keys(generationMap).length > 0 && (
					<div className="flex flex-col gap-6">
						{sortedGenerationIds.map((generationId) => {
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
