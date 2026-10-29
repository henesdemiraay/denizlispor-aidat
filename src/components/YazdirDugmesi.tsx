"use client";

export default function YazdirDugmesi({ etiket = "Yazdır / PDF olarak kaydet" }: { etiket?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-ikincil w-full print:hidden">
      {etiket}
    </button>
  );
}
