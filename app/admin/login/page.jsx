'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

// Diseño "1c — Franjas neón" (collage inclinado + líneas neón + tarjeta glass).
const ACCENT = '#ff2d8d';
const ACCENT_DIM = 'rgba(255,45,141,0.45)';
const ACCENT_GLOW = 'rgba(255,45,141,0.28)';

// Orden y proporción de las franjas del collage (igual al diseño 1c).
const STRIPS = [
  { src: '/site/galeria/vr.webp', flex: 1 },
  { src: '/site/galeria/poolfutbol.webp', flex: 1 },
  { src: '/site/galeria/sala-principal.webp', flex: 1.2 },
  { src: '/site/galeria/ps5.webp', flex: 1 },
  { src: '/site/galeria/sala-principal.webp', flex: 1 },
  { src: '/site/galeria/cumpleanos.webp', flex: 1 },
];

const inputStyle = {
  height: 46, padding: '0 14px', borderRadius: 9, width: '100%', boxSizing: 'border-box',
  border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.06)',
  color: '#fff', fontSize: 14, outline: 'none',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const configured =
    Boolean(process.env.NEXT_PUBLIC_DATABASE_URL);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!configured) {
      setError('Falta configurar DATABASE_URL en .env.local.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message || 'Email o contraseña incorrectos.');
        setLoading(false);
        return;
      }
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError('No se pudo conectar: ' + (err?.message || 'revisá la configuración.'));
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
      <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .lcg-login-input:focus{border-color:${ACCENT} !important;box-shadow:0 0 0 3px ${ACCENT_GLOW} !important;}
        .lcg-login-input::placeholder{color:rgba(255,255,255,.4);}
      `}</style>

      {/* Collage inclinado */}
      <div style={{ position: 'absolute', inset: '-60px -120px', display: 'flex', gap: 6, transform: 'skewX(-7deg)', opacity: 0.6 }}>
        {STRIPS.map((s, i) => (
          <img key={i} src={s.src} alt="" style={{ flex: s.flex, height: '100%', objectFit: 'cover', display: 'block', minWidth: 0 }} />
        ))}
      </div>

      {/* Líneas neón entre franjas */}
      <div style={{ position: 'absolute', inset: '-60px -120px', display: 'flex', gap: 6, transform: 'skewX(-7deg)', pointerEvents: 'none' }}>
        {STRIPS.map((s, i) => (
          <div key={i} style={{ flex: s.flex, borderRight: i < STRIPS.length - 1 ? `2px solid ${ACCENT_DIM}` : 'none' }} />
        ))}
      </div>

      {/* Oscurecido radial */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,.3) 0%, rgba(0,0,0,.68) 100%)' }} />

      {/* Tarjeta */}
      <form onSubmit={handleSubmit} style={{
        position: 'relative', width: '90%', maxWidth: 400, background: 'rgba(13,12,16,.9)',
        border: `1px solid ${ACCENT_DIM}`, borderRadius: 14, padding: '40px 36px',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        boxShadow: `0 0 44px ${ACCENT_GLOW}, 0 24px 60px rgba(0,0,0,.55)`,
        display: 'flex', flexDirection: 'column', gap: 22,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{ fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '.06em', color: '#fff', textAlign: 'center', textShadow: `0 0 18px ${ACCENT_GLOW}` }}>
            LA CHISPA <span style={{ color: ACCENT }}>GAMER</span>
          </div>
          <div style={{ width: 56, height: 3, background: ACCENT, borderRadius: 2, boxShadow: `0 0 10px ${ACCENT}` }} />
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>Panel de administración</div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,45,141,.12)', border: `1px solid ${ACCENT_DIM}`, color: '#ffd6ec', padding: '10px 12px', borderRadius: 9, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.7)', letterSpacing: '.02em' }}>Correo</label>
            <input className="lcg-login-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.7)', letterSpacing: '.02em' }}>Contraseña</label>
            <input className="lcg-login-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{
          height: 46, border: 'none', borderRadius: 9, background: ACCENT, color: '#0d0c10',
          fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '.04em',
          cursor: loading ? 'default' : 'pointer', boxShadow: `0 0 18px ${ACCENT_GLOW}`, opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'INGRESANDO…' : 'INICIAR SESIÓN'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12.5 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setError('Para resetear la contraseña, pedísela al dueño o cambiala directamente en la tabla profiles.'); }}
            style={{ color: '#67e8f9', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
        </div>

        {mounted && !configured && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', textAlign: 'center', margin: 0 }}>
            Modo desarrollo: PostgreSQL aún no configurado.
          </p>
        )}
      </form>
    </div>
  );
}
