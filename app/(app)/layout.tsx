import { MobileTabBar } from "@/components/shell/nav";
import { TopBar } from "@/components/shell/top-bar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      <TopBar />
      {/* Bottom padding clears the mobile tab bar, which is fixed. */}
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-24 md:px-6 md:pb-8 lg:px-8">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
