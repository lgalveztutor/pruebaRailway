'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { hoyISO, money } from '@/lib/format';
import { LABEL_CATEGORIA } from '@/lib/categorias';

const MEDIOS = ['efectivo', 'transferencia', 'mercadopago', 'mixto'];

// products: [{ id, nombre, categoria, precio, stock_actual }]
export default function VentaForm({ products = [] }) {
  const router = useRouter();
  const [sel, setSel] = useState('');
  const [cant, setCant] = useState('1');
  const [cart, setCart] = useState([]);
  const [medio, setMedio] = useState('efectivo');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((a, r) => a + r.total, 0);

  function addToCart(e) {
    e.preventDefault();
    setMsg(null);
    const prod = products.find((p) => String(p.id) === String(sel));
    if (!prod) { setMsg({ t: 'err', m: 'Elegí un producto.' }); return; }
    const c = Number(cant || 0);
    if (c <= 0) { setMsg({ t: 'err', m: 'Cantidad inválida.' }); return; }
    setCart([...cart, {
      product_id: prod.id,
      nombre: prod.nombre,
      categoria: prod.categoria || 'otros',
      cantidad: c,
      precio_unit: Number(prod.precio || 0),
      total: c * Number(prod.precio || 0),
    }]);
    setSel(''); setCant('1');
  }

  const removeItem = (i) => setCart(cart.filter((_, idx) => idx !== i));

  async function registrar() {
    setMsg(null);
    if (cart.length === 0) { setMsg({ t: 'err', m: 'Agregá al menos un producto.' }); return; }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1) Cabecera de venta
    const { data: sale, error: e1 } = await supabase.from('sales').insert({
      fecha: hoyISO(), total, medio_pago: medio, empleado_id: user?.id ?? null,
    }).select('id').single();
    if (e1) { setLoading(false); setMsg({ t: 'err', m: 'Error: ' + e1.message }); return; }

    // 2) Detalle
    const items = cart.map((it) => ({
      sale_id: sale.id, categoria: it.categoria, descripcion: it.nombre,
      cantidad: it.cantidad, precio_unit: it.precio_unit, total: it.total, product_id: it.product_id,
    }));
    const { error: e2 } = await supabase.from('sale_items').insert(items);
    if (e2) { setLoading(false); setMsg({ t: 'err', m: 'Venta creada, falló el detalle: ' + e2.message }); return; }

    // 3) Descuento de stock automático + registro del movimiento
    const ids = cart.map((i) => i.product_id);
    const { data: prods } = await supabase.from('products').select('id, stock_actual').in('id', ids);
    const stockMap = Object.fromEntries((prods || []).map((p) => [p.id, Number(p.stock_actual)]));
    for (const it of cart) {
      const nuevo = (stockMap[it.product_id] ?? 0) - it.cantidad;
      await supabase.from('products').update({ stock_actual: nuevo }).eq('id', it.product_id);
    }
    await supabase.from('stock_movements').insert(
      cart.map((it) => ({ product_id: it.product_id, tipo: 'egreso', cantidad: it.cantidad, motivo: 'venta', usuario_id: user?.id ?? null }))
    );

    setLoading(false);
    setCart([]);
    setMsg({ t: 'ok', m: 'Venta registrada por ' + money(total) + '. Stock descontado.' });
    router.refresh();
  }

  return (
    <div className="card">
      <p className="section-title">Nueva venta</p>

      {products.length === 0 && (
        <div style={{ marginBottom: 14, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,209,102,.1)', border: '1px solid rgba(255,209,102,.35)', color: 'var(--yellow)', fontSize: 13.5 }}>
          No hay productos cargados. Agregalos primero en <b>Stock</b> para poder venderlos acá.
        </div>
      )}

      <form className="form-row" onSubmit={addToCart}>
        <div className="field">
          <label>Producto</label>
          <select value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">— elegir —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · {money(p.precio)} (stock: {p.stock_actual})
              </option>
            ))}
          </select>
        </div>
        <div className="field small">
          <label>Cantidad</label>
          <input type="number" value={cant} onChange={(e) => setCant(e.target.value)} />
        </div>
        <button className="btn-secondary" type="submit">+ Ítem</button>
      </form>

      {cart.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Producto</th><th>Categoría</th><th>Cant.</th><th>P. unit</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {cart.map((it, i) => (
                <tr key={i}>
                  <td>{it.nombre}</td>
                  <td>{LABEL_CATEGORIA[it.categoria] || it.categoria}</td>
                  <td>{it.cantidad}</td>
                  <td>{money(it.precio_unit)}</td>
                  <td>{money(it.total)}</td>
                  <td>
                    <button className="btn-secondary" style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }} onClick={() => removeItem(i)}>Quitar</button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Total venta</td>
                <td style={{ fontWeight: 800, color: 'var(--green)' }}>{money(total)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="form-row" style={{ marginTop: 14 }}>
        <div className="field">
          <label>Medio de pago</label>
          <select value={medio} onChange={(e) => setMedio(e.target.value)}>
            {MEDIOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '12px 22px' }} onClick={registrar} disabled={loading}>
          {loading ? 'Registrando…' : 'Registrar venta'}
        </button>
      </div>

      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </div>
  );
}
