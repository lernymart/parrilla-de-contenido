import { AppHeader } from "@/components/AppHeader";
import { HomeClient } from "@/components/HomeClient";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <HomeClient />
      </main>
    </div>
  );
}
