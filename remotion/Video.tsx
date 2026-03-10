import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  Sequence,
  Audio,
  Img,
  staticFile,
} from "remotion";

/* ── Helpers ─────────────────────────────────────────── */
const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (
  f: number,
  s: number,
  e: number,
  a: number,
  b: number
) => {
  if (f <= s) return a;
  if (f >= e) return b;
  return a + (b - a) * ease((f - s) / (e - s));
};

const FONT = "'Inter','SF Pro Display',-apple-system,system-ui,sans-serif";
const MONO = "'JetBrains Mono','Fira Code','SF Mono',monospace";

/* ── Product data ────────────────────────────────────── */
const PRODUCTS = [
  { name: "Eurosmart Mitigeur Lavabo S", maker: "GROHE", ref: "33265003", cat: "Plomberie", dim: "150×120mm", weight: "1.2 kg", img: "grohe.jpg", color: "#0ea5e9", hasPhoto: true, hasPdf: true },
  { name: "Plaque de commande Sigma50", maker: "GEBERIT", ref: "Sigma 50", cat: "Sanitaire", dim: "246×164mm", weight: "0.8 kg", img: "geberit.jpg", color: "#8b5cf6", hasPhoto: true, hasPdf: true },
  { name: "Acti9 iC60N Disjoncteur 2P 16A", maker: "SCHNEIDER", ref: "iC60N C16", cat: "Electricite", dim: "72×85mm", weight: "0.2 kg", img: "schneider.jpg", color: "#22c55e", hasPhoto: true, hasPdf: true },
  { name: "Talis S Mitigeur lavabo", maker: "HANSGROHE", ref: "72020000", cat: "Robinetterie", dim: "161×95mm", weight: "1.4 kg", img: "hansgrohe.svg", color: "#f59e0b", hasPhoto: true, hasPdf: true },
  { name: "Perfera Mural FTXM35R", maker: "DAIKIN", ref: "FTXM35R", cat: "CVC", dim: "798×295mm", weight: "10 kg", img: "daikin.svg", color: "#06b6d4", hasPhoto: true, hasPdf: false },
  { name: "Fenêtre de toit GGL", maker: "VELUX", ref: "GGL MK04", cat: "Menuiserie", dim: "780×980mm", weight: "25 kg", img: "velux.svg", color: "#ec4899", hasPhoto: true, hasPdf: true },
];

/* ═══════════════════════════════════════════════════════
   SCENE 1 — THE PAIN (0-4s · frames 0-119)
   ═══════════════════════════════════════════════════════ */
const ScenePain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#050810", fontFamily: FONT }}>
      {/* Subtle grid */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)",
        backgroundSize: "48px 48px" }} />

      {/* Timer */}
      <div style={{ position: "absolute", top: 50, right: 100, opacity: lerp(f,8,18,0,1), display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" opacity="0.2"/>
          <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={`${lerp(f,10,100,0,63)} 63`} transform="rotate(-90 12 12)"/>
        </svg>
        <span style={{ fontFamily: MONO, fontSize: 26, color: "#ef4444", fontWeight: 700 }}>
          {Math.floor(lerp(f,10,100,0,45))} min / jour perdues
        </span>
      </div>

      {/* Headline */}
      <div style={{ position: "absolute", top: 120, left: 100, right: 100, opacity: lerp(f,3,15,0,1), transform: `translateY(${lerp(f,3,15,25,0)}px)` }}>
        <div style={{ fontSize: 60, fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: -1.5 }}>
          Chercher des fiches techniques ?
        </div>
        <div style={{ fontSize: 60, fontWeight: 800, color: "#ef4444", lineHeight: 1.15, marginTop: 4 }}>
          Un cauchemar.
        </div>
      </div>

      {/* Spreadsheet */}
      <div style={{ position: "absolute", bottom: 40, left: 100, right: 100,
        opacity: lerp(f,22,38,0,1), transform: `translateY(${lerp(f,22,38,20,0)}px)`,
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", padding: "10px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
          {["Produit","Catégorie","Photo HD","Fiche PDF","Specs"].map(h => (
            <div key={h} style={{ flex: 1, color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, fontFamily: MONO }}>{h}</div>
          ))}
        </div>
        {PRODUCTS.map((p, i) => (
          <div key={i} style={{ display: "flex", padding: "9px 24px", alignItems: "center",
            opacity: lerp(f, 28+i*5, 35+i*5, 0, 1),
            borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.025)" : "none" }}>
            <div style={{ flex: 1, color: "rgba(255,255,255,0.65)", fontSize: 14, fontFamily: MONO }}>{p.maker} {p.ref}</div>
            <div style={{ flex: 1, color: "rgba(255,255,255,0.25)", fontSize: 13 }}>{p.cat}</div>
            <div style={{ flex: 1, fontSize: 20, color: "#ef4444" }}>✗</div>
            <div style={{ flex: 1, fontSize: 20, color: "#ef4444" }}>✗</div>
            <div style={{ flex: 1, fontSize: 20, color: "#ef4444" }}>✗</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════
   SCENE 2 — GRABSPEC REVEAL (4-7s · frames 120-209)
   ═══════════════════════════════════════════════════════ */
const SceneReveal: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#050810", fontFamily: FONT }}>
      {/* Glow */}
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%,rgba(37,99,235,0.25) 0%,transparent 65%)",
        opacity: lerp(f,0,30,0,1) }} />

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
        {/* Logo icon */}
        <div style={{ width: 110, height: 110, borderRadius: 26, background: "#2563EB",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 100px rgba(37,99,235,0.6)",
          opacity: lerp(f,5,25,0,1), transform: `scale(${lerp(f,5,25,0.6,1)})` }}>
          <svg width="60" height="60" viewBox="0 0 64 64" fill="none">
            <rect x="14" y="10" width="22" height="30" rx="2.5" fill="white" opacity="0.9"/>
            <rect x="19" y="17" width="12" height="2" rx="1" fill="#2563EB" opacity="0.5"/>
            <rect x="19" y="22" width="9" height="2" rx="1" fill="#2563EB" opacity="0.4"/>
            <circle cx="40" cy="38" r="12" fill="#1D4ED8" stroke="white" strokeWidth="2.5"/>
            <line x1="49" y1="47" x2="54" y2="52" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <path d="M36 38 L39 41 L45 35" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Brand */}
        <div style={{ fontSize: 86, fontWeight: 800, letterSpacing: -3, lineHeight: 1,
          opacity: lerp(f,12,30,0,1), transform: `translateY(${lerp(f,12,30,15,0)}px)` }}>
          <span style={{ color: "#fff" }}>Grab</span>
          <span style={{ color: "#3B82F6" }}>Spec</span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.55)", fontWeight: 400,
          opacity: lerp(f,28,45,0,1), transform: `translateY(${lerp(f,28,45,12,0)}px)` }}>
          Photos HD · Fiches techniques · Specs — en 1 clic
        </div>

        {/* 3 feature icons */}
        <div style={{ display: "flex", gap: 32, marginTop: 12 }}>
          {[
            { icon: "📷", label: "Photos HD" },
            { icon: "📄", label: "Fiches PDF" },
            { icon: "⚙️", label: "Spécifications" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8,
              opacity: lerp(f, 40+i*8, 52+i*8, 0, 1),
              transform: `translateY(${lerp(f, 40+i*8, 52+i*8, 10, 0)}px)`,
              background: "rgba(255,255,255,0.06)", padding: "8px 18px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════
   SCENE 3 — LIVE DEMO with real images (7-15s · frames 210-449)
   ═══════════════════════════════════════════════════════ */
const SceneDemo: React.FC = () => {
  const f = useCurrentFrame();
  const query = "Grohe 33265003\nGeberit Sigma 50\nSchneider iC60N C16";
  const typedLen = Math.min(Math.floor(lerp(f,12,70,0,query.length)), query.length);

  return (
    <AbsoluteFill style={{ background: "#f8fafc", fontFamily: FONT }}>
      {/* Browser chrome */}
      <div style={{ position: "absolute", top: 20, left: 40, right: 40, bottom: 20,
        background: "#fff", borderRadius: 16, overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0" }}>

        {/* Title bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ef4444","#eab308","#22c55e"].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }}/>
            ))}
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "5px 14px", fontSize: 13, color: "#64748b", fontFamily: MONO }}>
            grabspec.vercel.app/fr/finder
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", padding: "8px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 11 }}>G</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              <span style={{ color: "#1e293b" }}>Grab</span><span style={{ color: "#2563EB" }}>Spec</span>
            </span>
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ display: "flex", gap: 18, fontSize: 13 }}>
            {["Finder","Bibliothèque","Convertisseur","Tarifs"].map(n => (
              <span key={n} style={{ color: n === "Finder" ? "#2563EB" : "#94a3b8", fontWeight: n === "Finder" ? 600 : 400 }}>{n}</span>
            ))}
          </div>
        </div>

        {/* Search area */}
        <div style={{ padding: "16px 24px 8px" }}>
          <div style={{ background: "#f8fafc", border: "2px solid #2563EB", borderRadius: 12,
            padding: "12px 16px", fontSize: 14, color: "#1e293b", fontFamily: MONO,
            minHeight: 56, whiteSpace: "pre-wrap", lineHeight: 1.6, opacity: lerp(f,5,12,0,1) }}>
            {query.slice(0, typedLen)}
            <span style={{ opacity: f % 30 < 15 ? 1 : 0, color: "#2563EB" }}>|</span>
          </div>
          <div style={{ marginTop: 10, opacity: lerp(f,72,80,0,1), transform: `scale(${lerp(f,72,80,0.95,1)})` }}>
            <div style={{ display: "inline-flex", background: "#2563EB", color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, gap: 8, alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Rechercher 3 produits
            </div>
          </div>
        </div>

        {/* Loading */}
        {f >= 82 && f < 110 && (
          <div style={{ padding: "8px 24px" }}>
            <div style={{ height: 4, borderRadius: 2, background: "#e2e8f0", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#2563EB,#3B82F6)",
                width: `${lerp(f,82,108,0,100)}%`, transition: "width 0.1s" }}/>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: MONO, marginTop: 6 }}>
              Recherche en cours… {Math.floor(lerp(f,82,108,1,3))}/3 produits
            </div>
          </div>
        )}

        {/* Product cards with REAL images */}
        {f >= 110 && (
          <div style={{ padding: "8px 24px", display: "flex", gap: 14, opacity: lerp(f,110,125,0,1) }}>
            {PRODUCTS.slice(0, 3).map((p, i) => {
              const delay = 112 + i * 15;
              return (
                <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 14,
                  border: "1px solid #e2e8f0", overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  opacity: lerp(f, delay, delay+15, 0, 1),
                  transform: `translateY(${lerp(f, delay, delay+15, 18, 0)}px)` }}>

                  {/* Product image */}
                  <div style={{ height: 140, background: `linear-gradient(135deg,${p.color}08,${p.color}18)`,
                    display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                    <Img src={staticFile(`video/${p.img}`)} style={{ height: 110, objectFit: "contain", borderRadius: 6 }}/>
                    <div style={{ position: "absolute", top: 8, right: 8, background: "#22c55e", color: "#fff",
                      fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 }}>
                      PHOTO HD ✓
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: p.color, letterSpacing: 0.5 }}>{p.maker}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.25, marginTop: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: MONO, marginTop: 2 }}>Réf: {p.ref}</div>

                    {/* Tags */}
                    <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                      <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>PDF ✓</span>
                      <span style={{ background: "#dbeafe", color: "#2563EB", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>SPECS ✓</span>
                      <span style={{ background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>+ Biblio</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Specs popup overlay */}
        {f >= 175 && f < 230 && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "rgba(255,255,255,0.97)", borderRadius: 16, padding: "20px 28px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0",
            opacity: lerp(f,175,185,0,1) * lerp(f,220,230,1,0),
            minWidth: 420 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#0ea5e9", fontSize: 12, fontWeight: 800 }}>GROHE</span>
              Spécifications extraites
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 13 }}>
              {[
                ["Dimensions","150 × 120 mm"],
                ["Poids","1.2 kg"],
                ["Matériau","Laiton chromé"],
                ["Débit","5.7 L/min"],
                ["Pression","0.5 – 10 bar"],
                ["Garantie","5 ans"],
              ].map(([k,v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#94a3b8" }}>{k}</span>
                  <span style={{ color: "#1e293b", fontWeight: 600, fontFamily: MONO, fontSize: 12 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════
   SCENE 4 — LIBRARY + ZIP (15-20s · frames 450-599)
   ═══════════════════════════════════════════════════════ */
const SceneLibrary: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#f8fafc", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ position: "absolute", top: 40, left: 80, display: "flex", alignItems: "center", gap: 14,
        opacity: lerp(f,5,18,0,1), transform: `translateX(${lerp(f,5,18,-20,0)}px)` }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span style={{ fontSize: 32, fontWeight: 800, color: "#1e293b" }}>Bibliothèque</span>
        <div style={{ background: "#dbeafe", color: "#2563EB", padding: "4px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginLeft: 12 }}>
          Projet: Hôtel Marriott
        </div>
      </div>

      {/* Product grid with real images */}
      <div style={{ position: "absolute", top: 100, left: 80, right: 80,
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {PRODUCTS.map((p, i) => {
          const delay = 15 + i * 8;
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
              overflow: "hidden", opacity: lerp(f, delay, delay+12, 0, 1),
              transform: `translateY(${lerp(f, delay, delay+12, 12, 0)}px)`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div style={{ height: 100, background: `linear-gradient(135deg,${p.color}06,${p.color}15)`,
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <Img src={staticFile(`video/${p.img}`)} style={{ height: 75, objectFit: "contain" }}/>
                {/* Checkbox */}
                <div style={{ position: "absolute", top: 8, left: 8, width: 20, height: 20, borderRadius: 5,
                  background: i < 4 ? "#2563EB" : "#e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i < 4 && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: p.color }}>{p.maker}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", lineHeight: 1.2 }}>{p.name}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar — selection + ZIP */}
      <div style={{ position: "absolute", bottom: 30, left: 80, right: 80,
        opacity: lerp(f,65,80,0,1), transform: `translateY(${lerp(f,65,80,15,0)}px)` }}>

        {/* Selection bar */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 24px", border: "1px solid #e2e8f0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "#2563EB", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
            4 sélectionnés
          </div>
          <div style={{ flex: 1, fontFamily: MONO, fontSize: 12, color: "#64748b", background: "#f8fafc", padding: "6px 12px", borderRadius: 6 }}>
            {"MARRIOTT_{LOT}_{FABRICANT}_{REF}_{TYPE}"}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ background: "#2563EB", color: "#fff", padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              📦 Export ZIP
            </div>
            <div style={{ background: "#217346", color: "#fff", padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              📊 Export Excel
            </div>
          </div>
        </div>

        {/* ZIP folder tree */}
        {f >= 90 && (
          <div style={{ marginTop: 14, background: "#0f172a", borderRadius: 12, padding: "16px 22px",
            fontFamily: MONO, fontSize: 13, lineHeight: 1.9,
            opacity: lerp(f,90,105,0,1), transform: `scale(${lerp(f,90,105,0.96,1)})` }}>
            {[
              { t: "📁 HOTEL_MARRIOTT.zip", c: "#94a3b8", d: 92 },
              { t: "  📂 PHOTOS/", c: "#22c55e", d: 96 },
              { t: "    MARRIOTT_PLOMB_GROHE_33265003_PHOTO.jpg", c: "#e2e8f0", d: 100 },
              { t: "    MARRIOTT_ELEC_SCHNEIDER_iC60N_PHOTO.jpg", c: "#e2e8f0", d: 103 },
              { t: "  📂 FICHES_TECHNIQUES/", c: "#3B82F6", d: 107 },
              { t: "    MARRIOTT_PLOMB_GROHE_33265003_FT.pdf", c: "#e2e8f0", d: 110 },
              { t: "  📊 RECAPITULATIF.xlsx", c: "#22c55e", d: 114 },
            ].map((line, i) => (
              <div key={i} style={{ color: line.c, opacity: lerp(f, line.d, line.d+6, 0, 1) }}>{line.t}</div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════
   SCENE 5 — EXCEL EXPORT PRO (20-25s · frames 600-749)
   ═══════════════════════════════════════════════════════ */
const SceneExcel: React.FC = () => {
  const f = useCurrentFrame();
  const cols = ["N°","Produit","Fabricant","Réf","Catégorie","Dim.","Poids","Photo URL","Fiche PDF URL"];

  return (
    <AbsoluteFill style={{ background: "#050810", fontFamily: FONT }}>
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 30% 40%,rgba(33,115,70,0.12) 0%,transparent 50%),radial-gradient(ellipse at 70% 60%,rgba(37,99,235,0.08) 0%,transparent 50%)" }}/>

      {/* Title */}
      <div style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center",
        opacity: lerp(f,3,16,0,1) }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>
          Export Excel Professionnel
        </div>
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
          Logo, nomenclature, hyperliens cliquables
        </div>
      </div>

      {/* Excel mockup */}
      <div style={{ position: "absolute", top: 130, left: 70, right: 70,
        background: "#fff", borderRadius: 12, overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        opacity: lerp(f,16,30,0,1), transform: `translateY(${lerp(f,16,30,15,0)}px)` }}>

        {/* Excel toolbar */}
        <div style={{ display: "flex", alignItems: "center", padding: "6px 14px", background: "#217346", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 500 }}>
            ✕ GrabSpec_Export_Hotel_Marriott_2026-03-09.xlsx
          </span>
        </div>

        {/* Company header with logo */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 18px",
          background: "#f0f9ff", borderBottom: "3px solid #2563EB",
          opacity: lerp(f,28,38,0,1) }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#2563EB",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>G</span>
          </div>
          <div style={{ marginLeft: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              <span style={{ color: "#1e293b" }}>Grab</span><span style={{ color: "#2563EB" }}>Spec</span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>grabspec@proton.me | grabspec.vercel.app</div>
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#1e293b", fontWeight: 600 }}>Projet: Hôtel Marriott</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>09.03.2026 · 6 produits · CHF —</div>
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: "flex", padding: "7px 18px", background: "#2563EB" }}>
          {cols.map((h, i) => (
            <div key={h} style={{ flex: i === 1 ? 1.4 : i >= 7 ? 1.6 : 0.8,
              color: "#fff", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</div>
          ))}
        </div>

        {/* Table rows with REAL product thumbnails & hyperlinks */}
        {PRODUCTS.slice(0, 5).map((p, i) => {
          const rowDelay = 35 + i * 7;
          return (
            <div key={i} style={{ display: "flex", padding: "5px 18px", alignItems: "center",
              background: i % 2 === 0 ? "#fff" : "#f8fafc",
              borderBottom: "1px solid #f1f5f9",
              opacity: lerp(f, rowDelay, rowDelay+8, 0, 1) }}>
              <div style={{ flex: 0.8, fontSize: 11, color: "#94a3b8" }}>{i + 1}</div>
              <div style={{ flex: 1.4, fontSize: 11, color: "#1e293b", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                {/* Mini product thumbnail */}
                <Img src={staticFile(`video/${p.img}`)} style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 4 }}/>
                {p.name.slice(0, 22)}
              </div>
              <div style={{ flex: 0.8, fontSize: 11, color: p.color, fontWeight: 700 }}>{p.maker}</div>
              <div style={{ flex: 0.8, fontSize: 10, fontFamily: MONO, color: "#64748b" }}>{p.ref}</div>
              <div style={{ flex: 0.8, fontSize: 11, color: "#94a3b8" }}>{p.cat}</div>
              <div style={{ flex: 0.8, fontSize: 10, fontFamily: MONO, color: "#64748b" }}>{p.dim}</div>
              <div style={{ flex: 0.8, fontSize: 10, fontFamily: MONO, color: "#64748b" }}>{p.weight}</div>
              {/* Hyperlinks — blue underlined */}
              <div style={{ flex: 1.6, fontSize: 9, color: "#2563EB", textDecoration: "underline", fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                https://blob.vercel.../{p.ref}_photo.jpg
              </div>
              <div style={{ flex: 1.6, fontSize: 9, color: "#2563EB", textDecoration: "underline", fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.hasPdf ? `https://blob.vercel.../${p.ref}_ft.pdf` : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hyperlink callout */}
      <div style={{ position: "absolute", bottom: 60, left: "50%",
        opacity: lerp(f,80,95,0,1), transform: `translateX(-50%) translateY(${lerp(f,80,95,10,0)}px)`,
        display: "flex", alignItems: "center", gap: 10, background: "rgba(37,99,235,0.15)",
        padding: "10px 22px", borderRadius: 10, border: "1px solid rgba(37,99,235,0.2)" }}>
        <span style={{ fontSize: 20 }}>🔗</span>
        <span style={{ color: "#93c5fd", fontSize: 15, fontWeight: 600 }}>
          Liens cliquables vers chaque photo et PDF
        </span>
        <span style={{ background: "#2563EB", color: "#fff", padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700, marginLeft: 8 }}>
          PLAN BUSINESS
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════
   SCENE 6 — CONVERTER + STATS (25-29s · frames 750-869)
   ═══════════════════════════════════════════════════════ */
const SceneConverterStats: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#050810", fontFamily: FONT }}>
      {/* Left: Converter */}
      {f < 60 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40,
            opacity: lerp(f,5,18,0,1), transform: `scale(${lerp(f,5,18,0.92,1)})` }}>
            {/* Word */}
            <div style={{ width: 180, height: 230, background: "rgba(37,99,235,0.08)", borderRadius: 16,
              border: "2px solid rgba(37,99,235,0.2)", padding: 18, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6", marginBottom: 10 }}>.docx</div>
              {[85,65,75,55,80].map((w,i) => (
                <div key={i} style={{ background: "rgba(59,130,246,0.15)", height: 5, borderRadius: 3, marginBottom: 6, width: `${w}%` }}/>
              ))}
            </div>

            {/* Arrow */}
            <div>
              <svg width="80" height="40" viewBox="0 0 80 40">
                <path d="M5 20 L55 20" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${lerp(f,15,35,0,50)} 50`}/>
                <path d="M50 10 L63 20 L50 30" stroke="#3B82F6" strokeWidth="2.5" fill="none" strokeLinecap="round"
                  opacity={lerp(f,30,40,0,1)}/>
              </svg>
              <div style={{ textAlign: "center", fontFamily: MONO, fontSize: 14, color: "#3B82F6", fontWeight: 700, marginTop: 4 }}>3 sec</div>
            </div>

            {/* PDF */}
            <div style={{ width: 180, height: 230, background: "rgba(239,68,68,0.06)", borderRadius: 16,
              border: "2px solid rgba(239,68,68,0.15)", padding: 18,
              opacity: lerp(f,30,45,0,1), transform: `translateX(${lerp(f,30,45,15,0)}px)` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#ef4444", marginBottom: 10 }}>.pdf</div>
              {[85,65,75,55,80].map((w,i) => (
                <div key={i} style={{ background: "rgba(239,68,68,0.15)", height: 5, borderRadius: 3, marginBottom: 6, width: `${w}%` }}/>
              ))}
            </div>
          </div>

          {/* Free badge */}
          <div style={{ position: "absolute", top: 50, left: 0, right: 0, textAlign: "center",
            opacity: lerp(f,5,15,0,1) }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>Convertisseur PDF ↔ Word</div>
            <div style={{ marginTop: 10, display: "inline-block", background: "#22c55e", color: "#fff",
              padding: "6px 22px", borderRadius: 8, fontSize: 16, fontWeight: 700 }}>
              100% GRATUIT · Sans limite
            </div>
          </div>
        </div>
      )}

      {/* Right: Stats */}
      {f >= 55 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: lerp(f,55,70,0,1) }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 40, letterSpacing: -1 }}>
            Testé sur 20 produits réels
          </div>
          <div style={{ display: "flex", gap: 60 }}>
            {[
              { val: 20, max: 20, pct: "100%", label: "Produits trouvés", color: "#3B82F6" },
              { val: 19, max: 20, pct: "95%", label: "Photos HD", color: "#22c55e" },
              { val: 16, max: 20, pct: "80%", label: "Fiches PDF", color: "#f59e0b" },
            ].map((s, i) => {
              const d = 62 + i * 12;
              const count = Math.floor(lerp(f, d, d+25, 0, s.val));
              return (
                <div key={i} style={{ textAlign: "center", opacity: lerp(f, d-5, d+8, 0, 1),
                  transform: `translateY(${lerp(f, d-5, d+8, 25, 0)}px)` }}>
                  <svg width="150" height="150" viewBox="0 0 150 150">
                    <circle cx="75" cy="75" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7"/>
                    <circle cx="75" cy="75" r="65" fill="none" stroke={s.color} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${lerp(f, d, d+25, 0, (s.val / s.max) * 408)} 408`} transform="rotate(-90 75 75)"/>
                  </svg>
                  <div style={{ position: "relative", top: -100, fontSize: 36, fontWeight: 800, color: s.color }}>
                    {count}/{s.max}
                  </div>
                  <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: -50 }}>{s.label}</div>
                  <div style={{ marginTop: 8, background: `${s.color}20`, color: s.color,
                    padding: "3px 14px", borderRadius: 6, fontSize: 14, fontWeight: 700, display: "inline-block" }}>{s.pct}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════
   SCENE 7 — PRICING + CTA (29-35s · frames 870-1049)
   ═══════════════════════════════════════════════════════ */
const ScenePricing: React.FC = () => {
  const f = useCurrentFrame();
  const plans = [
    { name: "Gratuit", price: "CHF 0", sub: "", features: ["3 recherches/jour","Convertisseur illimité","Bibliothèque locale"], hl: false },
    { name: "Pro", price: "CHF 9.90", sub: "/mois", features: ["Recherches illimitées","Export Excel + ZIP","Bibliothèque projets","Nomenclature custom"], hl: true },
    { name: "Business", price: "CHF 29.90", sub: "/mois", features: ["Tout Pro inclus","Excel avec photos","Convertisseur prioritaire","Support dédié"], hl: false },
  ];

  return (
    <AbsoluteFill style={{ background: "#050810", fontFamily: FONT }}>
      {/* Title */}
      <div style={{ position: "absolute", top: 55, left: 0, right: 0, textAlign: "center",
        opacity: lerp(f,5,18,0,1) }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: "#fff" }}>Commencez gratuitement</div>
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>Pas de compte · Pas de carte bancaire</div>
      </div>

      {/* Pricing cards */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-48%)",
        display: "flex", gap: 24 }}>
        {plans.map((plan, i) => (
          <div key={i} style={{ width: 290, padding: "28px 24px", borderRadius: 20,
            background: plan.hl ? "linear-gradient(135deg,#2563EB,#1d4ed8)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${plan.hl ? "#3B82F6" : "rgba(255,255,255,0.06)"}`,
            opacity: lerp(f, 18+i*10, 30+i*10, 0, 1),
            transform: `translateY(${lerp(f, 18+i*10, 30+i*10, 18, 0)}px) ${plan.hl ? "scale(1.05)" : ""}`,
            boxShadow: plan.hl ? "0 0 50px rgba(37,99,235,0.4)" : "none" }}>
            {plan.hl && (
              <div style={{ background: "#86efac", color: "#166534", padding: "3px 12px", borderRadius: 6,
                fontSize: 10, fontWeight: 800, display: "inline-block", marginBottom: 10, letterSpacing: 0.5 }}>
                POPULAIRE
              </div>
            )}
            <div style={{ fontSize: 20, fontWeight: 700, color: plan.hl ? "#fff" : "rgba(255,255,255,0.75)" }}>{plan.name}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#fff", marginTop: 4 }}>
              {plan.price}
              {plan.sub && <span style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.45)" }}>{plan.sub}</span>}
            </div>
            <div style={{ marginTop: 18 }}>
              {plan.features.map((feat, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9,
                  fontSize: 14, color: plan.hl ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}>
                  <span style={{ color: plan.hl ? "#86efac" : "#3B82F6", fontSize: 12 }}>✓</span>
                  {feat}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ position: "absolute", bottom: 45, left: 0, right: 0, textAlign: "center",
        opacity: lerp(f,100,120,0,1) }}>
        <div style={{ display: "inline-block", background: "#2563EB", color: "#fff",
          padding: "14px 48px", borderRadius: 14, fontSize: 22, fontWeight: 700, letterSpacing: -0.3,
          boxShadow: "0 0 40px rgba(37,99,235,0.5)" }}>
          grabspec.vercel.app
        </div>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
          Essayez gratuitement · Aucune inscription
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════
   SUBTITLES — English scrolling at bottom
   ═══════════════════════════════════════════════════════ */
const SUBTITLES: { from: number; to: number; text: string }[] = [
  { from: 0, to: 80, text: "Searching for product datasheets? A nightmare." },
  { from: 80, to: 119, text: "45 minutes per day wasted — every single day." },
  { from: 120, to: 209, text: "GrabSpec: HD photos, datasheets & specs in one click." },
  { from: 210, to: 280, text: "Paste your product list. Click search." },
  { from: 280, to: 370, text: "Real product images, PDF datasheets, full specifications — instantly." },
  { from: 370, to: 449, text: "Detailed specs extracted automatically: dimensions, weight, materials..." },
  { from: 450, to: 530, text: "All products saved in your library, organized by project." },
  { from: 530, to: 599, text: "Custom naming convention. Download everything as a structured ZIP." },
  { from: 600, to: 680, text: "Professional Excel export with your logo and clickable hyperlinks." },
  { from: 680, to: 749, text: "Embedded thumbnails, blue clickable URLs to every photo and PDF." },
  { from: 750, to: 810, text: "Free PDF ↔ Word converter included. No limits. No signup." },
  { from: 810, to: 869, text: "Tested on 20 real products: 100% found, 95% photos, 80% datasheets." },
  { from: 870, to: 960, text: "Start free — 3 searches/day. Pro: unlimited for CHF 9.90/month." },
  { from: 960, to: 1049, text: "Try it now — no account needed → grabspec.vercel.app" },
];

const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const current = SUBTITLES.find((s) => f >= s.from && f < s.to);
  if (!current) return null;

  const fadeIn = lerp(f, current.from, current.from + 10, 0, 1);
  const fadeOut = lerp(f, current.to - 10, current.to, 1, 0);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        left: 0,
        right: 0,
        textAlign: "center",
        zIndex: 100,
        opacity: fadeIn * fadeOut,
        transform: `translateY(${lerp(f, current.from, current.from + 10, 6, 0)}px)`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          padding: "8px 28px",
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 500,
          color: "rgba(255,255,255,0.9)",
          fontFamily: FONT,
          letterSpacing: 0.2,
          maxWidth: "80%",
        }}
      >
        {current.text}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPOSITION — 35s (1050 frames @ 30fps)
   ═══════════════════════════════════════════════════════ */
export const GrabSpecPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("video/music.mp3")} volume={0.35} />

      <Sequence from={0} durationInFrames={120}>
        <ScenePain />
      </Sequence>
      <Sequence from={120} durationInFrames={90}>
        <SceneReveal />
      </Sequence>
      <Sequence from={210} durationInFrames={240}>
        <SceneDemo />
      </Sequence>
      <Sequence from={450} durationInFrames={150}>
        <SceneLibrary />
      </Sequence>
      <Sequence from={600} durationInFrames={150}>
        <SceneExcel />
      </Sequence>
      <Sequence from={750} durationInFrames={120}>
        <SceneConverterStats />
      </Sequence>
      <Sequence from={870} durationInFrames={180}>
        <ScenePricing />
      </Sequence>

      {/* English subtitles overlay */}
      <Subtitles />
    </AbsoluteFill>
  );
};
