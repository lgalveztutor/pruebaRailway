// Clasificación única de categorías de venta: Servicios vs Productos.
// La usan Ventas, Bar, PoolFútbol, Consolas y Reportes para estar todos vinculados.

export const CATEGORIAS_SERVICIO = ['alquiler', 'cumpleanos', 'poolfutbol', 'consolas', 'otros'];
export const CATEGORIAS_PRODUCTO = ['snacks', 'bebidas', 'bar', 'combos'];

export function esProducto(categoria) {
  return CATEGORIAS_PRODUCTO.includes(categoria);
}

export function tipoVenta(categoria) {
  return esProducto(categoria) ? 'producto' : 'servicio';
}

// Etiquetas lindas para mostrar
export const LABEL_CATEGORIA = {
  alquiler: 'Alquiler por hora',
  cumpleanos: 'Cumpleaños',
  poolfutbol: 'PoolFútbol',
  consolas: 'Consolas',
  otros: 'Otros',
  bar: 'Comida',
  snacks: 'Snacks',
  bebidas: 'Bebidas',
  combos: 'Combos',
};
