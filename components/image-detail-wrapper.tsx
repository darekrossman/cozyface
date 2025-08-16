export default function ImageDetailWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-49 flex-1 h-full min-h-0">
      <div className="fixed top-0 left-[var(--sidebar-width)] right-0 w-[calc(100%-var(--sidebar-width))] max-w-screen-2xl mx-auto h-dvh grid grid-cols-24  bg-background/94 backdrop-blur-lg overflow-y-hidden ">
        <div className="col-span-16 border-x">
          <div className="h-full"></div>
        </div>
        <div className="col-span-8">
          <div className="h-full bg-background"></div>
        </div>
      </div>

      <div className="relative h-full">{children}</div>
    </div>
  );
}
