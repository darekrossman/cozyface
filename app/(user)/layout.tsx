import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import "./globals.css";
import ImageGenerationForm from "@/components/flux-form";
import { ImageGenProvider } from "@/components/image-gen-provider";

export default function Layout({
	children,
	modal,
}: Readonly<{
	modal: React.ReactNode;
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<AppSidebar />

			<ImageGenProvider>
				<main className="w-full relative">
					{/* <SidebarTrigger /> */}

					<div className="grid grid-cols-12 gap-4 h-auto sticky px-4 py-4 top-0 z-50">
						<div className="col-span-9">
							<ImageGenerationForm />
						</div>
						<div className="col-span-3">
							<div className="bg-card h-14 p-4 rounded-sm">
								<h2 className="text-sm font-medium">Settings</h2>
							</div>
						</div>
					</div>

					{modal}
					{children}
				</main>
			</ImageGenProvider>
		</SidebarProvider>
	);
}
