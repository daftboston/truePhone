import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <p className="text-foreground text-sm font-semibold tracking-tight">
          TruePhone
        </p>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 pb-24">
        <div className="space-y-3">
          <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            TruePhone
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            El marketplace más confiable para comprar y vender iPhones usados en
            Colombia.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button>Explorar iPhones</Button>
          <Button variant="outline">Vender mi iPhone</Button>
        </div>

        <p className="text-trust text-sm">
          Cada iPhone es revisado manualmente antes de publicarse.
        </p>
      </main>
    </div>
  );
}
