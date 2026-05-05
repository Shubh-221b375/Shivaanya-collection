import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-8xl font-bold text-black/10 mb-4">404</p>
        <h1 className="text-2xl font-bold text-black tracking-tight mb-3">Page Not Found</h1>
        <p className="text-black/40 text-sm mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/80 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
