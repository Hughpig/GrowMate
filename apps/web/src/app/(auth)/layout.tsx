import { AppHeader } from "@/components/AppHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container flex min-h-[calc(100vh-4rem)] items-center py-10">
        {children}
      </main>
    </div>
  );
}
