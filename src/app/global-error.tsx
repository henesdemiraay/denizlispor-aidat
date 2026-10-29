"use client";

/** Kök düzen (layout) bile açılamazsa: en sade, bağımsız hata ekranı. */
export default function KokHata({ reset }: { reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#1c1c1c", color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Uygulama açılamadı</h1>
          <p style={{ opacity: 0.7, fontSize: 14 }}>Birkaç saniye sonra yeniden deneyin.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "12px 20px", borderRadius: 12, border: 0, fontWeight: 700 }}>
            Yeniden dene
          </button>
        </div>
      </body>
    </html>
  );
}
