import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

/* ─── Helpers ─── */
const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const fadeIn = (frame: number, start: number, dur = 15) =>
  clamp(interpolate(frame, [start, start + dur], [0, 1]), 0, 1);

const fadeOut = (frame: number, end: number, dur = 15) =>
  clamp(interpolate(frame, [end - dur, end], [1, 0]), 0, 1);

const slideUp = (frame: number, start: number, dur = 20) =>
  interpolate(frame, [start, start + dur], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/* ─── Shared Styles ─── */
const bgGradient: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e1b4b 100%)",
};

const glowText: React.CSSProperties = {
  textShadow: "0 0 40px rgba(59,130,246,0.6), 0 0 80px rgba(59,130,246,0.3)",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  backdropFilter: "blur(10px)",
};

/* ═══════════════════════════════════════════════════════ */
/* SCENE 1 — Title (frames 0-89, 0-3s)                   */
/* ═══════════════════════════════════════════════════════ */
const SceneTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = fadeIn(frame, 5);
  const titleY = slideUp(frame, 5);
  const subtitleOpacity = fadeIn(frame, 20);
  const subtitleY = slideUp(frame, 20);

  const logoScale = spring({ frame: frame - 0, fps, config: { damping: 12, mass: 0.5 } });

  const outOpacity = fadeOut(frame, 89);

  return (
    <AbsoluteFill
      style={{
        ...bgGradient,
        justifyContent: "center",
        alignItems: "center",
        opacity: outOpacity,
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          top: "10%",
          right: "15%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          bottom: "10%",
          left: "10%",
        }}
      />

      {/* Logo mark */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          width: 90,
          height: 90,
          borderRadius: 20,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 30,
          boxShadow: "0 0 60px rgba(59,130,246,0.4)",
        }}
      >
        <span style={{ fontSize: 48, fontWeight: 900, color: "#fff" }}>G</span>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 120,
          fontWeight: 900,
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: -3,
          ...glowText,
        }}
      >
        GrabSpec
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontSize: 36,
          color: "rgba(255,255,255,0.75)",
          fontFamily: "system-ui, sans-serif",
          marginTop: 16,
          fontWeight: 400,
          letterSpacing: 1,
        }}
      >
        Product photos &amp; technical datasheets in 10 seconds
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════ */
/* SCENE 2 — Product Search Demo (frames 90-209, 3-7s)   */
/* ═══════════════════════════════════════════════════════ */
const products = [
  { ref: "Grohe 33265003", brand: "GROHE", name: "Eurodisc Cosmopolitan", color: "#2563eb" },
  { ref: "Geberit Sigma30", brand: "GEBERIT", name: "Sigma30 Flush Plate", color: "#16a34a" },
  { ref: "Schneider iC60N", brand: "SCHNEIDER", name: "iC60N Circuit Breaker", color: "#dc2626" },
];

const TypingText: React.FC<{ text: string; startFrame: number; speed?: number }> = ({
  text,
  startFrame,
  speed = 2,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(Math.floor(elapsed / speed), text.length);
  const showCursor = elapsed > 0 && chars <= text.length;

  return (
    <span>
      {text.slice(0, chars)}
      {showCursor && (
        <span
          style={{
            opacity: Math.sin(elapsed * 0.3) > 0 ? 1 : 0,
            color: "#3b82f6",
          }}
        >
          |
        </span>
      )}
    </span>
  );
};

const ProductCard: React.FC<{
  product: (typeof products)[0];
  appearFrame: number;
}> = ({ product, appearFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - appearFrame,
    fps,
    config: { damping: 14, mass: 0.6 },
  });

  if (frame < appearFrame) return null;

  return (
    <div
      style={{
        ...cardStyle,
        padding: "24px 32px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        transform: `scale(${progress}) translateY(${(1 - progress) * 30}px)`,
        opacity: progress,
        width: 520,
      }}
    >
      {/* Photo placeholder */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${product.color}33, ${product.color}11)`,
          border: `2px solid ${product.color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 32 }}>📷</span>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {product.brand}
        </div>
        <div
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 16,
            fontFamily: "monospace",
            marginTop: 4,
          }}
        >
          {product.ref}
        </div>
      </div>
      {/* PDF icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: "rgba(220,38,38,0.2)",
          border: "1px solid rgba(220,38,38,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800,
          color: "#ef4444",
          fontFamily: "system-ui, sans-serif",
          flexShrink: 0,
        }}
      >
        PDF
      </div>
    </div>
  );
};

const SceneSearch: React.FC = () => {
  const frame = useCurrentFrame();
  const inOpacity = fadeIn(frame, 0, 10);
  const outOpacity = fadeOut(frame, 119);
  const titleOpacity = fadeIn(frame, 0);
  const titleY = slideUp(frame, 0);

  return (
    <AbsoluteFill
      style={{
        ...bgGradient,
        padding: 80,
        opacity: Math.min(inOpacity, outOpacity),
      }}
    >
      {/* Section title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 48,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          marginBottom: 40,
          textAlign: "center",
        }}
      >
        Paste your product list
      </div>

      <div
        style={{
          display: "flex",
          gap: 60,
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* Input area */}
        <div style={{ width: 700 }}>
          <div
            style={{
              ...cardStyle,
              padding: "28px 36px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 16,
                marginBottom: 12,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Product references
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#fff",
                fontFamily: "monospace",
                minHeight: 48,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <TypingText text={products[0].ref} startFrame={8} speed={2} />
              <TypingText text={products[1].ref} startFrame={35} speed={2} />
              <TypingText text={products[2].ref} startFrame={62} speed={2} />
            </div>
          </div>

          {/* Search button */}
          <div
            style={{
              opacity: fadeIn(frame, 30),
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              borderRadius: 12,
              padding: "18px 40px",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "system-ui, sans-serif",
              boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
            }}
          >
            🔍 Search all
          </div>
        </div>

        {/* Result cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {products.map((p, i) => (
            <ProductCard
              key={p.ref}
              product={p}
              appearFrame={40 + i * 20}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════ */
/* SCENE 3 — Export Features (frames 210-329, 7-11s)     */
/* ═══════════════════════════════════════════════════════ */
const SceneExport: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOpacity = fadeIn(frame, 0, 10);
  const outOpacity = fadeOut(frame, 119);
  const titleOpacity = fadeIn(frame, 0);
  const titleY = slideUp(frame, 0);

  const zipScale = spring({ frame: frame - 15, fps, config: { damping: 12 } });
  const excelScale = spring({ frame: frame - 25, fps, config: { damping: 12 } });

  const nomenclatureOpacity = fadeIn(frame, 40);
  const nomenclatureY = slideUp(frame, 40);

  const arrowOpacity = fadeIn(frame, 60);

  const resultOpacity = fadeIn(frame, 70);
  const resultY = slideUp(frame, 70);

  return (
    <AbsoluteFill
      style={{
        ...bgGradient,
        justifyContent: "center",
        alignItems: "center",
        opacity: Math.min(inOpacity, outOpacity),
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 48,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          marginBottom: 60,
          textAlign: "center",
        }}
      >
        Custom file naming &amp; ZIP export
      </div>

      {/* Icons row */}
      <div
        style={{
          display: "flex",
          gap: 60,
          marginBottom: 60,
          alignItems: "center",
        }}
      >
        <div
          style={{
            transform: `scale(${zipScale})`,
            ...cardStyle,
            padding: "30px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 64 }}>📦</div>
          <span
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            ZIP Export
          </span>
        </div>

        <div
          style={{
            transform: `scale(${excelScale})`,
            ...cardStyle,
            padding: "30px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 64 }}>📊</div>
          <span
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Excel Summary
          </span>
        </div>
      </div>

      {/* Nomenclature */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            opacity: nomenclatureOpacity,
            transform: `translateY(${nomenclatureY}px)`,
            ...cardStyle,
            padding: "20px 40px",
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          <span
            style={{
              color: "#3b82f6",
              fontSize: 22,
              fontFamily: "monospace",
              fontWeight: 600,
            }}
          >
            {"{PROJET}_{LOT}_{FABRICANT}_{REF}"}
          </span>
        </div>

        <div
          style={{
            opacity: arrowOpacity,
            fontSize: 36,
            color: "rgba(255,255,255,0.5)",
            margin: "10px 0",
          }}
        >
          ↓
        </div>

        <div
          style={{
            opacity: resultOpacity,
            transform: `translateY(${resultY}px)`,
            ...cardStyle,
            padding: "20px 40px",
            display: "inline-block",
          }}
        >
          <span
            style={{
              color: "#22c55e",
              fontSize: 20,
              fontFamily: "monospace",
              fontWeight: 600,
            }}
          >
            VILLA-DUPONT_PLOMBERIE_GROHE_33265003.pdf
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════ */
/* SCENE 4 — Multi-lang + Converter (frames 330-419)     */
/* ═══════════════════════════════════════════════════════ */
const flags = [
  { code: "FR", emoji: "🇫🇷", delay: 0 },
  { code: "EN", emoji: "🇬🇧", delay: 6 },
  { code: "ES", emoji: "🇪🇸", delay: 12 },
  { code: "DE", emoji: "🇩🇪", delay: 18 },
];

const SceneMultilang: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOpacity = fadeIn(frame, 0, 10);
  const outOpacity = fadeOut(frame, 89);
  const titleOpacity = fadeIn(frame, 0);
  const titleY = slideUp(frame, 0);

  const converterOpacity = fadeIn(frame, 45);
  const converterY = slideUp(frame, 45);

  return (
    <AbsoluteFill
      style={{
        ...bgGradient,
        justifyContent: "center",
        alignItems: "center",
        opacity: Math.min(inOpacity, outOpacity),
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 48,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          marginBottom: 60,
          textAlign: "center",
        }}
      >
        4 languages &bull; Free PDF/Word converter
      </div>

      {/* Flags */}
      <div
        style={{
          display: "flex",
          gap: 40,
          marginBottom: 60,
        }}
      >
        {flags.map((f) => {
          const s = spring({
            frame: frame - 10 - f.delay,
            fps,
            config: { damping: 8, mass: 0.4, stiffness: 200 },
          });
          return (
            <div
              key={f.code}
              style={{
                transform: `scale(${s})`,
                ...cardStyle,
                padding: "24px 36px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 64 }}>{f.emoji}</span>
              <span
                style={{
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: "system-ui, sans-serif",
                  letterSpacing: 2,
                }}
              >
                {f.code}
              </span>
            </div>
          );
        })}
      </div>

      {/* Converter icon */}
      <div
        style={{
          opacity: converterOpacity,
          transform: `translateY(${converterY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#ef4444",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            PDF
          </span>
          <span style={{ fontSize: 32, color: "rgba(255,255,255,0.6)" }}>
            ⇄
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#3b82f6",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Word
          </span>
        </div>
        <span
          style={{
            color: "#22c55e",
            fontSize: 20,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            ...cardStyle,
            padding: "12px 24px",
          }}
        >
          100% FREE
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════ */
/* SCENE 5 — CTA (frames 420-449, 14-15s)               */
/* ═══════════════════════════════════════════════════════ */
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOpacity = fadeIn(frame, 0, 8);
  const outOpacity = fadeOut(frame, 29, 10);

  const ctaScale = spring({
    frame: frame - 3,
    fps,
    config: { damping: 10, mass: 0.5 },
  });

  const urlOpacity = fadeIn(frame, 12);

  return (
    <AbsoluteFill
      style={{
        ...bgGradient,
        justifyContent: "center",
        alignItems: "center",
        opacity: Math.min(inOpacity, outOpacity),
      }}
    >
      <div
        style={{
          transform: `scale(${ctaScale})`,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          borderRadius: 20,
          padding: "32px 64px",
          fontSize: 48,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          boxShadow:
            "0 0 60px rgba(59,130,246,0.5), 0 20px 40px rgba(0,0,0,0.3)",
          marginBottom: 30,
        }}
      >
        Try GrabSpec for free
      </div>

      <div
        style={{
          opacity: urlOpacity,
          fontSize: 36,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 500,
          letterSpacing: 2,
        }}
      >
        grabspec.com
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════ */
/* MAIN COMPOSITION                                       */
/* ═══════════════════════════════════════════════════════ */
export const GrabSpecPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
      {/* Scene 1: Title — 0 to 3s (frames 0-89) */}
      <Sequence from={0} durationInFrames={90}>
        <SceneTitle />
      </Sequence>

      {/* Scene 2: Search demo — 3 to 7s (frames 90-209) */}
      <Sequence from={90} durationInFrames={120}>
        <SceneSearch />
      </Sequence>

      {/* Scene 3: Export — 7 to 11s (frames 210-329) */}
      <Sequence from={210} durationInFrames={120}>
        <SceneExport />
      </Sequence>

      {/* Scene 4: Multi-lang — 11 to 14s (frames 330-419) */}
      <Sequence from={330} durationInFrames={90}>
        <SceneMultilang />
      </Sequence>

      {/* Scene 5: CTA — 14 to 15s (frames 420-449) */}
      <Sequence from={420} durationInFrames={30}>
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
