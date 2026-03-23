'use client';

import { useState, useEffect, useCallback } from 'react';

interface License {
  key: string;
  email: string;
  name: string;
  plan: 'pro' | 'business';
  createdAt: string;
  activatedAt: string | null;
  sessionId: string | null;
  revoked: boolean;
  note: string;
}

export default function AdminLicensesPage() {
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState<'pro' | 'business'>('business');
  const [newNote, setNewNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState('');

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }),
    [secret],
  );

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/licenses', { headers: authHeaders() });
      if (res.status === 401) {
        setAuthenticated(false);
        setError('Secret invalide');
        return;
      }
      const json = await res.json();
      setLicenses(json.data || []);
      setAuthenticated(true);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchLicenses();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreatedKey('');
    setError('');
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email: newEmail, name: newName, plan: newPlan, note: newNote }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Erreur');
        return;
      }
      setCreatedKey(json.data.key);
      setNewEmail('');
      setNewName('');
      setNewNote('');
      await fetchLicenses();
    } catch {
      setError('Erreur réseau');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (key: string) => {
    if (!confirm(`Révoquer la licence ${key} ?`)) return;
    try {
      await fetch('/api/licenses', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ key }),
      });
      await fetchLicenses();
    } catch {
      setError('Erreur lors de la révocation');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Auto-refresh when authenticated
  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(fetchLicenses, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, fetchLicenses]);

  // ── Login screen ──
  if (!authenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.loginCard}>
          <h1 style={styles.h1}>🔐 Admin — Licences GrabSpec</h1>
          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="password"
              placeholder="Mot de passe admin"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              style={styles.input}
              autoFocus
            />
            <button type="submit" style={styles.btnPrimary} disabled={loading}>
              {loading ? '...' : 'Accéder'}
            </button>
          </form>
          {error && <p style={styles.error}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── Admin dashboard ──
  const active = licenses.filter((l) => !l.revoked && l.activatedAt);
  const pending = licenses.filter((l) => !l.revoked && !l.activatedAt);
  const revoked = licenses.filter((l) => l.revoked);

  return (
    <div style={styles.container}>
      <div style={styles.dashboard}>
        <div style={styles.header}>
          <h1 style={styles.h1}>🔑 Gestion des licences</h1>
          <div style={styles.stats}>
            <span style={styles.statActive}>✅ {active.length} actives</span>
            <span style={styles.statPending}>⏳ {pending.length} en attente</span>
            <span style={styles.statRevoked}>🚫 {revoked.length} révoquées</span>
          </div>
        </div>

        {/* Create form */}
        <div style={styles.card}>
          <h2 style={styles.h2}>➕ Créer une licence</h2>
          <form onSubmit={handleCreate} style={styles.createForm}>
            <div style={styles.formRow}>
              <input
                type="text"
                placeholder="Nom complet"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formRow}>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as 'pro' | 'business')}
                style={styles.input}
              >
                <option value="business">Business (accès total)</option>
                <option value="pro">Pro</option>
              </select>
              <input
                type="text"
                placeholder="Note (optionnel)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.btnPrimary} disabled={creating}>
              {creating ? 'Création...' : 'Générer la licence'}
            </button>
          </form>

          {createdKey && (
            <div style={styles.createdKey}>
              <p style={{ margin: 0, fontWeight: 600 }}>✅ Licence créée !</p>
              <div style={styles.keyDisplay}>
                <code style={styles.keyCode}>{createdKey}</code>
                <button onClick={() => copyToClipboard(createdKey)} style={styles.btnCopy}>
                  📋 Copier
                </button>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                Envoyez cette clé à l&apos;utilisateur. Il pourra l&apos;activer sur la page Tarifs.
              </p>
            </div>
          )}
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {/* Licenses table */}
        <div style={styles.card}>
          <h2 style={styles.h2}>📋 Toutes les licences ({licenses.length})</h2>
          {loading && <p>Chargement...</p>}

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Clé</th>
                  <th style={styles.th}>Nom</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>Créée</th>
                  <th style={styles.th}>Note</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic) => (
                  <tr key={lic.key} style={lic.revoked ? styles.rowRevoked : undefined}>
                    <td style={styles.td}>
                      <code style={{ fontSize: 12 }}>{lic.key}</code>
                      <button onClick={() => copyToClipboard(lic.key)} style={styles.btnSmall}>
                        📋
                      </button>
                    </td>
                    <td style={styles.td}>{lic.name}</td>
                    <td style={styles.td}>{lic.email}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: lic.plan === 'business' ? '#dbeafe' : '#e0e7ff',
                          color: lic.plan === 'business' ? '#1d4ed8' : '#4338ca',
                        }}
                      >
                        {lic.plan}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {lic.revoked ? (
                        <span style={{ ...styles.badge, background: '#fee2e2', color: '#dc2626' }}>Révoquée</span>
                      ) : lic.activatedAt ? (
                        <span style={{ ...styles.badge, background: '#dcfce7', color: '#16a34a' }}>Active</span>
                      ) : (
                        <span style={{ ...styles.badge, background: '#fef3c7', color: '#d97706' }}>En attente</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {new Date(lic.createdAt).toLocaleDateString('fr-CH')}
                    </td>
                    <td style={styles.td}>{lic.note || '—'}</td>
                    <td style={styles.td}>
                      {!lic.revoked && (
                        <button onClick={() => handleRevoke(lic.key)} style={styles.btnDanger}>
                          Révoquer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && (
                  <tr>
                    <td style={styles.td} colSpan={8}>
                      Aucune licence. Créez-en une ci-dessus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline styles (no dependency on project's design system) ──

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: 24,
  },
  loginCard: {
    maxWidth: 400,
    margin: '120px auto',
    background: '#fff',
    borderRadius: 12,
    padding: 32,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  dashboard: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  h1: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  },
  h2: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 16px',
  },
  stats: {
    display: 'flex',
    gap: 16,
    fontSize: 14,
  },
  statActive: { color: '#16a34a' },
  statPending: { color: '#d97706' },
  statRevoked: { color: '#dc2626' },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: 20,
    border: '1px solid #e2e8f0',
  },
  form: {
    display: 'flex',
    gap: 12,
    marginTop: 16,
  },
  createForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  formRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: 180,
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
  },
  btnPrimary: {
    padding: '10px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnCopy: {
    padding: '6px 12px',
    background: '#f1f5f9',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  btnDanger: {
    padding: '4px 12px',
    background: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  },
  btnSmall: {
    padding: '2px 6px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
  },
  createdKey: {
    marginTop: 16,
    padding: 16,
    background: '#f0fdf4',
    borderRadius: 8,
    border: '1px solid #bbf7d0',
  },
  keyDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  keyCode: {
    fontSize: 18,
    fontWeight: 700,
    color: '#16a34a',
    letterSpacing: 1,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '2px solid #e2e8f0',
    fontWeight: 600,
    color: '#64748b',
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  },
  rowRevoked: {
    opacity: 0.5,
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
};
