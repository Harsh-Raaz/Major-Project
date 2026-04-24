import Navbar from "../components/Navbar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#f4f8fb_100%)] text-[#0A1628]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
