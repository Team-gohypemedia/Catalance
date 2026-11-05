import { ArrowLeft, Home } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

/** Rendered outside PublicLayout, so it brings its own minimal chrome. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="container-campus flex h-20 items-center">
        <Logo />
      </header>
      <main className="container-campus flex flex-1 flex-col items-center justify-center pt-8 pb-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm">
          <span className="font-medium tabular-nums">404</span>
          <span className="text-muted">Page not found</span>
        </span>
        <h1 className="mt-8 text-4xl leading-[1.1] font-medium tracking-tight text-balance sm:text-6xl">
          This page <em className="accent">bunked class</em>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-balance text-muted sm:text-lg">We looked everywhere: the canteen, the library, even the back bench. The page you want isn't here.</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button to="/" size="xl" leftIcon={Home}>
            Back to home
          </Button>
          <Button to="/tracks" size="xl" variant="brandOutline" leftIcon={ArrowLeft}>
            Browse tracks
          </Button>
        </div>
      </main>
    </div>
  );
}
