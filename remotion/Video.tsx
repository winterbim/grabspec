import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
  staticFile,
} from "remotion";

/* ════════════════════════════════════════════════════════════════
   UTILS — smooth easing, no generic Remotion look
   ════════════════════════════════════════════════════════════════ */

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const anim = (frame: number, start: number, end: number, from: number, to: number) => {
  if (frame <= start) return from;
  if (frame >= end) return to;
  return from + (to - from) * ease((frame - start) / (end - start));
};

const FONT = "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";

/* ════════════════════════════════════════════════════════════════
   SCENE 1 — COLD OPEN: The Problem (0–4s, frames 0–119)
   "You manage hundreds of products. Finding photos & datasheets
   for each one takes forever."
   ════════════════════════════════════════════════════════════════ */
const SceneProblem: React.FC = () => {
  const f = useCurrentFrame();

  // Stagger lines of a spreadsheet appearing
  const lines = [
    "Grohe Eurosmart 33265003",
    "Geberit Sigma30 115.883",
    "Schneider iC60N C16A",
    "Legrand Mosaic 077071",
    "Hansgrohe Talis E 71710",
    "Roca Gap A801472004",
    "Villeroy & Boch Subway 2.0",
    "Duravit Starck 3 220009",
  ];

  return (
    <AbsoluteFill style={{ background: "#0a0a0a", fontFamily: FONT }}>
      {/* Subtle grid bg */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Pain point text */}
      <div style={{
        position: "absolute", top: 100, left: 120, right: 120,
        opacity: anim(f, 5, 25, 0, 1),
        transform: `translateY(${anim(f, 5, 25, 30, 0)}px)`,
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: -1.5 }}>
          Vous gérez des{" "}
          <span style={{ color: "#ef4444" }}>centaines de produits.</span>
        </div>
        <div style={{
          fontSize: 32, color: "rgba(255,255,255,0.5)", marginTop: 16, fontWeight: 400,
          opacity: anim(f, 20, 40, 0, 1),
        }}>
          Trouver les photos HD et fiches techniques de chacun prend des heures...
        </div>
      </div>

      {/* Fake spreadsheet — messy, red cross marks */}
      <div style={{
        position: "absolute", bottom: 60, left: 120, right: 120,
        opacity: anim(f, 30, 50, 0, 1),
        transform: `translateY(${anim(f, 30, 50, 40, 0)}px)`,
      }}>
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", padding: "14px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}>
            {["Produit", "Photo", "Fiche PDF", "Fabricant"].map((h) => (
              <div key={h} style={{ flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: MONO }}>{h}</div>
            ))}
          </div>
          {lines.map((line, i) => {
            const rowOpacity = anim(f, 35 + i * 5, 45 + i * 5, 0, 1);
            return (
              <div key={i} style={{
                display: "flex", padding: "12px 28px", alignItems: "center", opacity: rowOpacity,
                borderBottom: i < lines.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}>
                <div style={{ flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 18, fontFamily: MONO }}>{line}</div>
                <div style={{ flex: 1, color: "#ef4444", fontSize: 18, fontWeight: 700 }}>✕ Manquante</div>
                <div style={{ flex: 1, color: "#ef4444", fontSize: 18, fontWeight: 700 }}>✕ Manquante</div>
                <div style={{ flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 18 }}>—</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fade out */}
      <div style={{
        position: "absolute", inset: 0, background: "#0a0a0a",
        opacity: anim(f, 100, 119, 0, 1),
      }} />
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCENE 2 — REVEAL: GrabSpec (4–8s, frames 120–239)
   Logo + tagline + screenshot of the app
   ════════════════════════════════════════════════════════════════ */
const SceneReveal: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: f - 10, fps, config: { damping: 14, mass: 0.8, stiffness: 120 } });
  const titleOp = anim(f, 20, 40, 0, 1);
  const titleY = anim(f, 20, 40, 40, 0);
  const tagOp = anim(f, 35, 55, 0, 1);
  const screenshotOp = anim(f, 50, 70, 0, 1);
  const screenshotY = anim(f, 50, 70, 60, 0);
  const outOp = anim(f, 105, 119, 1, 0);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #050d1a 0%, #0c1929 40%, #111827 100%)",
      fontFamily: FONT, alignItems: "center", justifyContent: "center",
      opacity: outOp,
    }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", top: "5%", right: "10%" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", bottom: "10%", left: "5%" }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20, transform: `scale(${logoScale})` }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 50px rgba(37,99,235,0.35), 0 8px 32px rgba(0,0,0,0.4)",
        }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: "#fff" }}>G</span>
        </div>
        <span style={{ fontSize: 64, fontWeight: 900, color: "#fff", letterSpacing: -2 }}>GrabSpec</span>
      </div>

      {/* Tagline */}
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontSize: 44, fontWeight: 300, color: "rgba(255,255,255,0.9)", letterSpacing: -0.5, textAlign: "center" }}>
        Photos HD & fiches techniques en{" "}
        <span style={{ fontWeight: 800, background: "linear-gradient(135deg, #3b82f6, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>10 secondes</span>
      </div>

      <div style={{ opacity: tagOp, fontSize: 22, color: "rgba(255,255,255,0.45)", marginTop: 12, fontWeight: 400, letterSpacing: 0.5 }}>
        L'outil qui automatise la collecte documentaire produit
      </div>

      {/* App screenshot in laptop frame */}
      <div style={{
        opacity: screenshotOp, transform: `translateY(${screenshotY}px)`,
        marginTop: 50, position: "relative",
      }}>
        <div style={{
          width: 900, borderRadius: 12, overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(37,99,235,0.1)",
        }}>
          {/* Browser chrome */}
          <div style={{ height: 32, background: "rgba(30,30,30,0.95)", display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
            <div style={{ flex: 1, marginLeft: 20, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", paddingLeft: 12 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: MONO }}>grabspec.com</span>
            </div>
          </div>
          <Img src={staticFile("screenshots/hero.png")} style={{ width: 900, display: "block" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCENE 3 — STEP 1: Paste (8–14s, frames 240–419)
   Show the finder page with typing animation
   ════════════════════════════════════════════════════════════════ */
const ScenePaste: React.FC = () => {
  const f = useCurrentFrame();

  const stepOp = anim(f, 0, 15, 0, 1);
  const stepY = anim(f, 0, 15, 20, 0);
  const textareaOp = anim(f, 15, 30, 0, 1);

  const typingLines = [
    { text: "Grohe Eurosmart 33265003", start: 30 },
    { text: "Geberit Sigma30 115.883.KH.1", start: 55 },
    { text: "Schneider iC60N C16", start: 80 },
    { text: "Hansgrohe Talis E 71710000", start: 100 },
  ];

  // After typing → button click → results appear
  const buttonGlow = anim(f, 120, 130, 0, 1);
  const resultsOp = anim(f, 132, 150, 0, 1);
  const resultsY = anim(f, 132, 150, 30, 0);

  const resultItems = [
    { name: "Eurosmart Basin Mixer S", brand: "GROHE", ref: "33265003", status: "Trouvé", statusColor: "#22c55e" },
    { name: "Sigma30 Actuator Plate", brand: "GEBERIT", ref: "115.883.KH.1", status: "Trouvé", statusColor: "#22c55e" },
    { name: "iC60N Disjoncteur 16A", brand: "SCHNEIDER", ref: "A9F74216", status: "Partiel", statusColor: "#f59e0b" },
    { name: "Talis E Basin Mixer", brand: "HANSGROHE", ref: "71710000", status: "Trouvé", statusColor: "#22c55e" },
  ];

  const outOp = anim(f, 165, 179, 1, 0);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #050d1a 0%, #0c1929 40%, #111827 100%)",
      fontFamily: FONT, padding: 80, opacity: outOp,
    }}>
      {/* Step indicator */}
      <div style={{ opacity: stepOp, transform: `translateY(${stepY}px)`, display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 900, color: "#fff",
          boxShadow: "0 0 30px rgba(37,99,235,0.3)",
        }}>1</div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>Collez votre liste</div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>Références, noms, codes fabricant...</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 50, flex: 1 }}>
        {/* Left: textarea */}
        <div style={{ flex: 1, opacity: textareaOp }}>
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: 32, height: "100%",
          }}>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Produits</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {typingLines.map((line, i) => {
                const elapsed = Math.max(0, f - line.start);
                const chars = Math.min(Math.floor(elapsed / 1.5), line.text.length);
                const showCursor = f >= line.start && chars <= line.text.length;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 16, fontFamily: MONO, width: 30 }}>{i + 1}</span>
                    <span style={{ color: "#e2e8f0", fontSize: 22, fontFamily: MONO }}>
                      {line.text.slice(0, chars)}
                      {showCursor && <span style={{ color: "#3b82f6", opacity: Math.sin(elapsed * 0.25) > 0 ? 1 : 0 }}>▎</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Search button */}
            <div style={{
              marginTop: 36,
              background: buttonGlow > 0.5 ? "linear-gradient(135deg, #1d4ed8, #6d28d9)" : "linear-gradient(135deg, #2563eb, #7c3aed)",
              borderRadius: 12, padding: "16px 36px",
              display: "inline-flex", alignItems: "center", gap: 10,
              fontSize: 20, fontWeight: 700, color: "#fff",
              boxShadow: buttonGlow > 0.5 ? "0 0 40px rgba(37,99,235,0.5)" : "0 4px 20px rgba(37,99,235,0.3)",
              transform: `scale(${buttonGlow > 0.5 ? 0.97 : 1})`,
            }}>
              ⚡ Rechercher tout
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div style={{ flex: 1, opacity: resultsOp, transform: `translateY(${resultsY}px)` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {resultItems.map((item, i) => {
              const cardDelay = i * 8;
              const cardOp = anim(f, 135 + cardDelay, 145 + cardDelay, 0, 1);
              const cardX = anim(f, 135 + cardDelay, 145 + cardDelay, 30, 0);
              return (
                <div key={i} style={{
                  opacity: cardOp, transform: `translateX(${cardX}px)`,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14, padding: "20px 24px",
                  display: "flex", alignItems: "center", gap: 18,
                }}>
                  {/* Product icon */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.1))",
                    border: "1px solid rgba(37,99,235,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 24 }}>📷</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{item.brand}</div>
                    <div style={{ color: "#fff", fontSize: 19, fontWeight: 700, marginTop: 2 }}>{item.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontFamily: MONO, marginTop: 2 }}>{item.ref}</div>
                  </div>
                  {/* Status badge */}
                  <div style={{
                    padding: "6px 14px", borderRadius: 8,
                    background: `${item.statusColor}15`, border: `1px solid ${item.statusColor}30`,
                    color: item.statusColor, fontSize: 14, fontWeight: 700,
                  }}>{item.status}</div>
                  {/* PDF badge */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#ef4444", fontFamily: MONO, flexShrink: 0,
                  }}>PDF</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCENE 4 — STEP 2: Nomenclature (14–20s, frames 420–599)
   ════════════════════════════════════════════════════════════════ */
const SceneNomenclature: React.FC = () => {
  const f = useCurrentFrame();

  const stepOp = anim(f, 0, 15, 0, 1);
  const stepY = anim(f, 0, 15, 20, 0);

  const tags = [
    { label: "{PROJET}", color: "#3b82f6", delay: 15 },
    { label: "{LOT}", color: "#8b5cf6", delay: 22 },
    { label: "{FABRICANT}", color: "#06b6d4", delay: 29 },
    { label: "{REF}", color: "#22c55e", delay: 36 },
    { label: "{NOM}", color: "#f59e0b", delay: 43 },
    { label: "{TYPE}", color: "#ef4444", delay: 50 },
  ];

  const templateOp = anim(f, 60, 75, 0, 1);
  const arrowOp = anim(f, 80, 90, 0, 1);
  const resultOp = anim(f, 95, 110, 0, 1);
  const resultY = anim(f, 95, 110, 20, 0);

  // Second example
  const ex2Op = anim(f, 115, 130, 0, 1);
  const ex2Y = anim(f, 115, 130, 20, 0);

  const outOp = anim(f, 165, 179, 1, 0);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #050d1a 0%, #0c1929 40%, #111827 100%)",
      fontFamily: FONT, padding: 80, justifyContent: "center", opacity: outOp,
    }}>
      <div style={{ opacity: stepOp, transform: `translateY(${stepY}px)`, display: "flex", alignItems: "center", gap: 20, marginBottom: 50 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 900, color: "#fff",
        }}>2</div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>Nommez vos fichiers</div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>Template de nomenclature personnalisable</div>
        </div>
      </div>

      {/* Variable tags */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 40 }}>
        {tags.map((tag) => {
          const tagOp = anim(f, tag.delay, tag.delay + 10, 0, 1);
          const tagScale = anim(f, tag.delay, tag.delay + 10, 0.8, 1);
          return (
            <div key={tag.label} style={{
              opacity: tagOp, transform: `scale(${tagScale})`,
              padding: "10px 20px", borderRadius: 10,
              background: `${tag.color}15`, border: `1px solid ${tag.color}30`,
              color: tag.color, fontSize: 20, fontWeight: 700, fontFamily: MONO,
            }}>{tag.label}</div>
          );
        })}
      </div>

      {/* Template formula */}
      <div style={{ opacity: templateOp }}>
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "20px 32px", display: "inline-block", marginBottom: 8,
        }}>
          <span style={{ color: "#3b82f6", fontSize: 24, fontFamily: MONO, fontWeight: 600 }}>
            {"{"}<span style={{ color: "#3b82f6" }}>PROJET</span>{"}"}_{"{"}<span style={{ color: "#8b5cf6" }}>LOT</span>{"}"}_{"{"}<span style={{ color: "#06b6d4" }}>FABRICANT</span>{"}"}_{"{"}<span style={{ color: "#22c55e" }}>REF</span>{"}"}_{"{"}<span style={{ color: "#ef4444" }}>TYPE</span>{"}"}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div style={{ opacity: arrowOp, fontSize: 32, color: "rgba(255,255,255,0.25)", margin: "16px 0", paddingLeft: 60 }}>↓</div>

      {/* Result examples */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          opacity: resultOp, transform: `translateY(${resultY}px)`,
          background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)",
          borderRadius: 14, padding: "16px 32px", display: "inline-flex", alignItems: "center", gap: 16,
        }}>
          <span style={{ fontSize: 22 }}>📷</span>
          <span style={{ color: "#22c55e", fontSize: 20, fontFamily: MONO, fontWeight: 600 }}>VILLA-DUPONT_PLOMBERIE_GROHE_33265003_PHOTO.jpg</span>
        </div>
        <div style={{
          opacity: ex2Op, transform: `translateY(${ex2Y}px)`,
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 14, padding: "16px 32px", display: "inline-flex", alignItems: "center", gap: 16,
        }}>
          <span style={{ fontSize: 22 }}>📄</span>
          <span style={{ color: "#ef4444", fontSize: 20, fontFamily: MONO, fontWeight: 600 }}>VILLA-DUPONT_PLOMBERIE_GROHE_33265003_FT.pdf</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCENE 5 — STEP 3: Export (20–26s, frames 600–779)
   ════════════════════════════════════════════════════════════════ */
const SceneExport: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepOp = anim(f, 0, 15, 0, 1);
  const stepY = anim(f, 0, 15, 20, 0);

  // ZIP animation
  const zipScale = spring({ frame: f - 25, fps, config: { damping: 12, mass: 0.8 } });
  const excelScale = spring({ frame: f - 40, fps, config: { damping: 12, mass: 0.8 } });

  // File list animation
  const filesOp = anim(f, 55, 70, 0, 1);
  const filesY = anim(f, 55, 70, 30, 0);

  const files = [
    { name: "VILLA-DUPONT_PLOMBERIE_GROHE_33265003_PHOTO.jpg", icon: "🖼️", size: "245 KB" },
    { name: "VILLA-DUPONT_PLOMBERIE_GROHE_33265003_FT.pdf", icon: "📄", size: "1.2 MB" },
    { name: "VILLA-DUPONT_PLOMBERIE_GEBERIT_115883_PHOTO.jpg", icon: "🖼️", size: "189 KB" },
    { name: "VILLA-DUPONT_PLOMBERIE_GEBERIT_115883_FT.pdf", icon: "📄", size: "856 KB" },
    { name: "VILLA-DUPONT_recap.xlsx", icon: "📊", size: "34 KB" },
  ];

  // Progress bar
  const progress = anim(f, 80, 120, 0, 100);
  const checkOp = anim(f, 125, 135, 0, 1);

  const outOp = anim(f, 165, 179, 1, 0);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #050d1a 0%, #0c1929 40%, #111827 100%)",
      fontFamily: FONT, padding: 80, opacity: outOp,
    }}>
      <div style={{ opacity: stepOp, transform: `translateY(${stepY}px)`, display: "flex", alignItems: "center", gap: 20, marginBottom: 50 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 900, color: "#fff",
        }}>3</div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>Exportez tout en un clic</div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>ZIP complet + récapitulatif Excel</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 60, flex: 1 }}>
        {/* Left: ZIP + Excel cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{
            transform: `scale(${zipScale})`,
            background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)",
            borderRadius: 20, padding: "36px 48px",
            display: "flex", alignItems: "center", gap: 24,
          }}>
            <div style={{ fontSize: 56 }}>📦</div>
            <div>
              <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>Export ZIP</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, marginTop: 4 }}>Photos HD + Fiches PDF</div>
            </div>
          </div>
          <div style={{
            transform: `scale(${excelScale})`,
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: 20, padding: "36px 48px",
            display: "flex", alignItems: "center", gap: 24,
          }}>
            <div style={{ fontSize: 56 }}>📊</div>
            <div>
              <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>Récap Excel</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, marginTop: 4 }}>Toutes les specs produit</div>
            </div>
          </div>
        </div>

        {/* Right: file tree + progress */}
        <div style={{ flex: 1, opacity: filesOp, transform: `translateY(${filesY}px)` }}>
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, overflow: "hidden",
          }}>
            {files.map((file, i) => {
              const fileOp = anim(f, 60 + i * 6, 68 + i * 6, 0, 1);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 24px",
                  borderBottom: i < files.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  opacity: fileOp,
                }}>
                  <span style={{ fontSize: 20 }}>{file.icon}</span>
                  <span style={{ flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 15, fontFamily: MONO }}>{file.name}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{file.size}</span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, borderRadius: 4, background: "linear-gradient(90deg, #2563eb, #7c3aed)", transition: "none" }} />
            </div>
            <span style={{ color: progress >= 100 ? "#22c55e" : "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: 700, fontFamily: MONO }}>
              {progress >= 100 ? "✓" : `${Math.round(progress)}%`}
            </span>
          </div>

          {/* Success message */}
          {checkOp > 0 && (
            <div style={{
              opacity: checkOp, marginTop: 20,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)",
              borderRadius: 12, padding: "14px 24px",
              color: "#22c55e", fontSize: 18, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>✅</span> Téléchargement prêt — 2.4 MB
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCENE 6 — BONUS: Converter + i18n (26–32s, frames 780–959)
   ════════════════════════════════════════════════════════════════ */
const SceneBonus: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = anim(f, 0, 15, 0, 1);
  const titleY = anim(f, 0, 15, 20, 0);

  // Converter card
  const convOp = anim(f, 20, 35, 0, 1);
  const convY = anim(f, 20, 35, 30, 0);

  // Arrow animation
  const arrowPhase = anim(f, 40, 60, 0, 1);

  // Languages
  const langs = [
    { code: "FR", name: "Français", delay: 70 },
    { code: "EN", name: "English", delay: 78 },
    { code: "ES", name: "Español", delay: 86 },
    { code: "DE", name: "Deutsch", delay: 94 },
  ];

  // Free badge
  const freeOp = anim(f, 105, 115, 0, 1);
  const freeScale = spring({ frame: f - 105, fps, config: { damping: 10, mass: 0.5 } });

  // App screenshot
  const screenshotOp = anim(f, 50, 65, 0, 1);

  const outOp = anim(f, 165, 179, 1, 0);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #050d1a 0%, #0c1929 40%, #111827 100%)",
      fontFamily: FONT, padding: 80, opacity: outOp,
    }}>
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontSize: 44, fontWeight: 800, color: "#fff", letterSpacing: -1, marginBottom: 50 }}>
        Et en bonus...
      </div>

      <div style={{ display: "flex", gap: 50 }}>
        {/* Left column */}
        <div style={{ flex: 1 }}>
          {/* Converter card */}
          <div style={{
            opacity: convOp, transform: `translateY(${convY}px)`,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "40px 48px", marginBottom: 30,
          }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Convertisseur gratuit</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
              <div style={{
                padding: "20px 36px", borderRadius: 14,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              }}>
                <div style={{ fontSize: 40 }}>📄</div>
                <div style={{ color: "#ef4444", fontSize: 20, fontWeight: 800, textAlign: "center", marginTop: 8 }}>PDF</div>
              </div>
              <div style={{
                fontSize: 40, color: "rgba(255,255,255,0.4)",
                transform: `scaleX(${arrowPhase > 0.5 ? -1 : 1})`,
              }}>→</div>
              <div style={{
                padding: "20px 36px", borderRadius: 14,
                background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)",
              }}>
                <div style={{ fontSize: 40 }}>📝</div>
                <div style={{ color: "#3b82f6", fontSize: 20, fontWeight: 800, textAlign: "center", marginTop: 8 }}>Word</div>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div style={{ display: "flex", gap: 14 }}>
            {langs.map((lang) => {
              const langScale = spring({ frame: f - lang.delay, fps, config: { damping: 10, mass: 0.4, stiffness: 180 } });
              return (
                <div key={lang.code} style={{
                  transform: `scale(${langScale})`,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14, padding: "16px 24px", textAlign: "center", flex: 1,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>{lang.code}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{lang.name}</div>
                </div>
              );
            })}
          </div>

          {/* Free badge */}
          <div style={{
            opacity: freeOp, transform: `scale(${freeScale})`,
            marginTop: 30,
            background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 14, padding: "14px 28px",
            display: "inline-flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <span style={{ color: "#22c55e", fontSize: 22, fontWeight: 800 }}>100% Gratuit — Sans inscription</span>
          </div>
        </div>

        {/* Right: converter screenshot */}
        <div style={{ flex: 1, opacity: screenshotOp, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 700, borderRadius: 12, overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ height: 28, background: "rgba(30,30,30,0.95)", display: "flex", alignItems: "center", padding: "0 12px", gap: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
            </div>
            <Img src={staticFile("screenshots/converter.png")} style={{ width: 700, display: "block" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCENE 7 — BUSINESS EXCEL (32–38s, frames 960–1139)
   Shows the branded Excel export with company logo + project details
   ════════════════════════════════════════════════════════════════ */
const SceneBusinessExcel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = anim(f, 0, 15, 0, 1);
  const titleY = anim(f, 0, 15, 20, 0);

  // Excel mockup animation
  const excelOp = anim(f, 20, 35, 0, 1);
  const excelScale = anim(f, 20, 35, 0.95, 1);

  // Company header reveal
  const headerOp = anim(f, 35, 50, 0, 1);
  const headerY = anim(f, 35, 50, -20, 0);

  // Logo pop
  const logoScale = spring({ frame: f - 40, fps, config: { damping: 12, mass: 0.6 } });

  // Project details
  const projOp = anim(f, 55, 70, 0, 1);
  const projX = anim(f, 55, 70, 30, 0);

  // Data rows
  const dataOp = anim(f, 75, 90, 0, 1);

  // Highlight glow
  const glowOp = anim(f, 100, 115, 0, 0.6);
  const glowOp2 = anim(f, 115, 130, 0.6, 0);
  const totalGlow = Math.max(glowOp - (1 - glowOp2) + glowOp2, 0);

  // Badge
  const badgeOp = anim(f, 120, 135, 0, 1);
  const badgeScale = spring({ frame: f - 120, fps, config: { damping: 10, mass: 0.5 } });

  const outOp = anim(f, 165, 179, 1, 0);

  const excelRows = [
    ["Eurosmart Basin Mixer", "GROHE", "33265003", "Plomberie", "Robinetterie"],
    ["Sigma30 Actuator Plate", "GEBERIT", "115.883.KH.1", "Plomberie", "WC"],
    ["iC60N 16A", "SCHNEIDER", "A9F74216", "Electricité", "Disjoncteur"],
    ["Talis E Basin Mixer", "HANSGROHE", "71710000", "Plomberie", "Robinetterie"],
  ];

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #050d1a 0%, #0c1929 40%, #111827 100%)",
      fontFamily: FONT, padding: 80, opacity: outOp,
    }}>
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 900, color: "#fff",
        }}>B</div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>Excel personnalisé Business</div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>Votre entreprise sur chaque export</div>
        </div>
      </div>

      {/* Excel mockup */}
      <div style={{
        opacity: excelOp, transform: `scale(${excelScale})`,
        background: "#fff", borderRadius: 16, overflow: "hidden",
        boxShadow: `0 25px 80px rgba(0,0,0,0.5), 0 0 ${totalGlow * 60}px rgba(124,58,237,${totalGlow * 0.3})`,
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        {/* Company header section */}
        <div style={{
          opacity: headerOp, transform: `translateY(${headerY}px)`,
          padding: "24px 32px", background: "#fafbfc",
          borderBottom: "3px solid #2563eb",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          {/* Left: logo + company info */}
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{
              transform: `scale(${logoScale})`,
              width: 64, height: 64, borderRadius: 12,
              background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>AC</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1e3a5f" }}>ACME Construction SA</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Rue du Commerce 42, 1003 Lausanne</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>+41 21 555 00 00 — info@acme-construction.ch</div>
            </div>
          </div>

          {/* Right: project details */}
          <div style={{ opacity: projOp, transform: `translateX(${projX}px)`, textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1e3a5f" }}>Projet Villa Dupont</div>
            <div style={{ display: "flex", gap: 20, marginTop: 6 }}>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>N° PROJET</div>
                <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>P-2024-087</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>CLIENT</div>
                <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>M. Dupont</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>ARCHITECTE</div>
                <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Studio Arch SA</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>09.03.2026</div>
          </div>
        </div>

        {/* Data table */}
        <div style={{ opacity: dataOp }}>
          {/* Table header */}
          <div style={{ display: "flex", background: "#2563eb", padding: "10px 20px" }}>
            {["Nom", "Fabricant", "Référence", "Lot", "Catégorie"].map((h) => (
              <div key={h} style={{ flex: 1, color: "#fff", fontSize: 13, fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {/* Table rows */}
          {excelRows.map((row, i) => (
            <div key={i} style={{
              display: "flex", padding: "10px 20px",
              background: i % 2 === 1 ? "#f1f5f9" : "#fff",
            }}>
              {row.map((cell, j) => (
                <div key={j} style={{ flex: 1, fontSize: 13, color: "#334155", fontFamily: j >= 2 ? MONO : FONT }}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Business badge */}
      {badgeOp > 0 && (
        <div style={{
          opacity: badgeOp, transform: `scale(${badgeScale})`,
          marginTop: 30, display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.06))",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 14, padding: "16px 32px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <span style={{ color: "#a78bfa", fontSize: 20, fontWeight: 800 }}>Exclusif Business — Vos exports à votre image</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCENE 8 — PRICING (38–44s, frames 1140–1319)
   ════════════════════════════════════════════════════════════════ */
const ScenePricing: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = anim(f, 0, 15, 0, 1);
  const titleY = anim(f, 0, 15, 20, 0);

  const plans = [
    { name: "Gratuit", price: "0 CHF", features: ["3 recherches / jour", "Export ZIP", "Convertisseur PDF gratuit"], color: "#64748b", delay: 20 },
    { name: "Pro", price: "9.90 CHF", features: ["Recherches illimitées", "Bibliothèque + nomenclature", "Support prioritaire"], color: "#2563eb", featured: true, delay: 30 },
    { name: "Business", price: "29.90 CHF", features: ["Logo entreprise sur exports", "Détails projet complets", "Excel brandé + multi-projets"], color: "#7c3aed", delay: 40 },
  ];

  const outOp = anim(f, 165, 179, 1, 0);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #050d1a 0%, #0c1929 40%, #111827 100%)",
      fontFamily: FONT, padding: 80, justifyContent: "center", alignItems: "center",
      opacity: outOp,
    }}>
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontSize: 44, fontWeight: 800, color: "#fff", letterSpacing: -1, marginBottom: 60, textAlign: "center" }}>
        Un prix pour chaque besoin
      </div>

      <div style={{ display: "flex", gap: 28 }}>
        {plans.map((plan) => {
          const cardScale = spring({ frame: f - plan.delay, fps, config: { damping: 14, mass: 0.7 } });
          return (
            <div key={plan.name} style={{
              transform: `scale(${cardScale})`,
              width: 340,
              background: plan.featured ? "linear-gradient(160deg, rgba(37,99,235,0.12), rgba(124,58,237,0.08))" : "rgba(255,255,255,0.03)",
              border: plan.featured ? "2px solid rgba(37,99,235,0.3)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 24, padding: "44px 36px",
              position: "relative",
            }}>
              {plan.featured && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  borderRadius: 20, padding: "6px 20px",
                  color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
                }}>Populaire</div>
              )}
              <div style={{ color: plan.color, fontSize: 16, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{plan.name}</div>
              <div style={{ color: "#fff", fontSize: 48, fontWeight: 900, marginTop: 12, letterSpacing: -2 }}>{plan.price}</div>
              <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
                {plan.features.map((feat, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 17 }}>{feat}</span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 32,
                background: plan.featured ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "14px 0", textAlign: "center",
                color: "#fff", fontSize: 17, fontWeight: 700,
                border: plan.featured ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}>
                {plan.name === "Gratuit" ? "Commencer" : "Essayer"}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCENE 8 — CTA (38–45s, frames 1140–1349)
   ════════════════════════════════════════════════════════════════ */
const SceneCTA: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: f - 5, fps, config: { damping: 14, mass: 0.6 } });
  const tagOp = anim(f, 20, 35, 0, 1);
  const tagY = anim(f, 20, 35, 20, 0);

  const features = [
    { icon: "⚡", text: "10 secondes par produit", delay: 40 },
    { icon: "📦", text: "Export ZIP + Excel", delay: 50 },
    { icon: "🔄", text: "Convertisseur PDF gratuit", delay: 60 },
    { icon: "🌍", text: "4 langues", delay: 70 },
  ];

  const ctaOp = anim(f, 85, 100, 0, 1);
  const ctaScale = spring({ frame: f - 85, fps, config: { damping: 10, mass: 0.5 } });

  const urlOp = anim(f, 105, 115, 0, 1);

  // Final fade
  const fadeOut = anim(f, 190, 209, 1, 0);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #050d1a 0%, #0c1929 40%, #111827 100%)",
      fontFamily: FONT, justifyContent: "center", alignItems: "center",
      opacity: fadeOut,
    }}>
      {/* Large ambient glow */}
      <div style={{ position: "absolute", width: 1000, height: 1000, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)", top: "-20%", left: "25%" }} />

      {/* Logo + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16, transform: `scale(${logoScale})` }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 50px rgba(37,99,235,0.3)",
        }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>G</span>
        </div>
        <span style={{ fontSize: 56, fontWeight: 900, color: "#fff", letterSpacing: -2 }}>GrabSpec</span>
      </div>

      {/* Tagline */}
      <div style={{
        opacity: tagOp, transform: `translateY(${tagY}px)`,
        fontSize: 30, color: "rgba(255,255,255,0.6)", fontWeight: 400, marginBottom: 50, textAlign: "center",
      }}>
        Photos HD & fiches techniques, automatiquement.
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 16, marginBottom: 50, flexWrap: "wrap", justifyContent: "center" }}>
        {features.map((feat) => {
          const pillOp = anim(f, feat.delay, feat.delay + 12, 0, 1);
          const pillY = anim(f, feat.delay, feat.delay + 12, 15, 0);
          return (
            <div key={feat.text} style={{
              opacity: pillOp, transform: `translateY(${pillY}px)`,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 50, padding: "12px 28px",
              display: "flex", alignItems: "center", gap: 10,
              color: "rgba(255,255,255,0.7)", fontSize: 19, fontWeight: 500,
            }}>
              <span style={{ fontSize: 20 }}>{feat.icon}</span> {feat.text}
            </div>
          );
        })}
      </div>

      {/* CTA button */}
      <div style={{
        opacity: ctaOp, transform: `scale(${ctaScale})`,
        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
        borderRadius: 16, padding: "22px 60px",
        fontSize: 28, fontWeight: 800, color: "#fff",
        boxShadow: "0 0 60px rgba(37,99,235,0.4), 0 15px 40px rgba(0,0,0,0.3)",
      }}>
        Essayer gratuitement
      </div>

      {/* URL */}
      <div style={{
        opacity: urlOp, marginTop: 24,
        fontSize: 24, color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: 1,
      }}>
        grabspec.com
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN COMPOSITION — 51 seconds, 1530 frames @ 30fps
   ════════════════════════════════════════════════════════════════ */
export const GrabSpecPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <Sequence from={0} durationInFrames={120}><SceneProblem /></Sequence>
      <Sequence from={120} durationInFrames={120}><SceneReveal /></Sequence>
      <Sequence from={240} durationInFrames={180}><ScenePaste /></Sequence>
      <Sequence from={420} durationInFrames={180}><SceneNomenclature /></Sequence>
      <Sequence from={600} durationInFrames={180}><SceneExport /></Sequence>
      <Sequence from={780} durationInFrames={180}><SceneBonus /></Sequence>
      <Sequence from={960} durationInFrames={180}><SceneBusinessExcel /></Sequence>
      <Sequence from={1140} durationInFrames={180}><ScenePricing /></Sequence>
      <Sequence from={1320} durationInFrames={210}><SceneCTA /></Sequence>
    </AbsoluteFill>
  );
};
