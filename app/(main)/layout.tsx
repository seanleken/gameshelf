import { Navbar } from "@/components/layout/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <Navbar />
      <main className="mx-auto w-full max-w-content flex-1 px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-subtle py-6">
        <div className="mx-auto max-w-content px-6 text-center text-sm text-text-tertiary">
          © {new Date().getFullYear()} GameShelf
        </div>
      </footer>
    </div>
  );
}
