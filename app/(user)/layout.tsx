import { redirect } from "next/navigation";
import { getUserGenerations } from "@/actions/generations";
import { getUser } from "@/actions/user";
import { AppSidebar } from "@/components/app-sidebar";
import ImageGenerationForm from "@/components/flux-form";
import { ImageGenProvider } from "@/components/image-gen-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function Layout({
	children,
	modal,
}: Readonly<{
	modal: React.ReactNode;
	children: React.ReactNode;
}>) {
	const user = await getUser();

	if (!user) {
		redirect("/auth/login");
	}

	const userGenerations = await getUserGenerations();

	return (
		<SidebarProvider>
			<AppSidebar />

			<ImageGenProvider user={user} userGenerations={userGenerations}>
				<main
					className="w-full max-w-screen-2xl mx-auto relative"
					style={{ "--header-height": "88px" } as React.CSSProperties}
				>
					{/* <SidebarTrigger /> */}

					<div
						className="sticky top-0 left-[var(--sidebar-width)] right-0 ease-out-quart h-20 mb-[-80px] pointer-events-none rotate-180 backdrop-blur-md bg-background/94 z-40"
						style={{
							mask: `linear-gradient(to top, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.99) 14%, rgba(0, 0, 0, 0.953) 26.2%, rgba(0, 0, 0, 0.894) 36.8%, rgba(0, 0, 0, 0.824) 45.9%, rgba(0, 0, 0, 0.74) 53.7%, rgba(0, 0, 0, 0.647) 60.4%, rgba(0, 0, 0, 0.55) 66.2%, rgba(0, 0, 0, 0.45) 71.2%, rgba(0, 0, 0, 0.353) 75.6%, rgba(0, 0, 0, 0.26) 79.6%, rgba(0, 0, 0, 0.176) 83.4%, rgba(0, 0, 0, 0.106) 87.2%, rgba(0, 0, 0, 0.047) 91.1%, rgba(0, 0, 0, 0.01) 95.3%, rgba(0, 0, 0, 0) 100%)`,
						}}
					/>

					<div className="sticky top-0 left-0 w-full z-50">
						<div className="grid grid-cols-12 gap-4 h-auto pl-2 pr-4 py-4">
							<div className="col-span-9">
								<ImageGenerationForm />
							</div>
							<div className="col-span-3">
								<div className="bg-card h-14 p-4 rounded-sm">
									<h2 className="text-sm font-medium">Settings</h2>
								</div>
							</div>
						</div>
					</div>

					{modal}

					<div className="relative z-1">{children}</div>
				</main>
			</ImageGenProvider>
		</SidebarProvider>
	);
}
