import { redirect } from 'next/navigation';

// Entrar a /admin (pelado) manda directo al login. Evita el 404.
export default function AdminIndex() {
  redirect('/admin/login');
}
