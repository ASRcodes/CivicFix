import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <a href="#main" className="visually-hidden-focusable btn btn-light position-absolute m-2" style={{ zIndex: 2000 }}>Skip to content</a>
      <Navbar />
      <main id="main" className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
