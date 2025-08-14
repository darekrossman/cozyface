import { getGenerationByImageId } from "@/actions/generations";
import ImageDetail from "@/components/image-detail";

export default async function ImagePage({ params }: { params: Promise<{ id: string }> }) {
	return (
		<div className="relative z-45 mt-[calc(var(--header-height)*-1)]">
			<ImageDetail />
		</div>
	);
}
