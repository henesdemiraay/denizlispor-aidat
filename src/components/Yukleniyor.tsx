/** Sayfa geçişlerinde anında görünen iskelet: dokunulduğu an ekran tepki verir. */
export default function Yukleniyor() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Yükleniyor</span>
      <header className="rounded-b-[28px] bg-siyah px-4 pb-6 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <span className="h-10 w-10 animate-pulse rounded-full bg-white/[0.08]" />
          <div className="flex-1 space-y-2">
            <span className="block h-6 w-44 animate-pulse rounded-md bg-white/[0.08]" />
            <span className="block h-3 w-24 animate-pulse rounded bg-yesil-500/30" />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl space-y-3 px-4 pt-5">
        <span className="block h-36 animate-pulse rounded-[22px] bg-yesil-500/15" />
        <span className="block h-20 animate-pulse rounded-[20px] bg-yuzey" />
        <span className="block h-20 animate-pulse rounded-[20px] bg-yuzey" />
      </div>
    </div>
  );
}
