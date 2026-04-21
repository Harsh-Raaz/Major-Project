import Navbar from "../components/Navbar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-emerald-50 text-blue-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}

