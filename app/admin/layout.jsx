import './admin.css';

// Layout base de /admin: aplica el tema. El login lo usa "pelado";
// el panel agrega el sidebar en su propio layout (grupo "(panel)").
export const metadata = {
  title: 'Panel · La Chispa Gamer 1.8',
};

export default function AdminLayout({ children }) {
  return children;
}
