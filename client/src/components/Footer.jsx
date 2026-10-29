import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="cf-footer pt-5 pb-4 mt-auto">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <Logo onDark />
            <p className="mt-3 mb-2">Your City. Your Voice. Our Responsibility.</p>
            <p className="small mb-0">A college full-stack project demonstrating a civic complaint management workflow.</p>
          </div>
          <div className="col-6 col-lg-2">
            <h6>Citizens</h6>
            <ul className="list-unstyled small d-grid gap-2">
              <li><Link to="/report">Report an issue</Link></li>
              <li><Link to="/track">Track a complaint</Link></li>
              <li><Link to="/register">Create an account</Link></li>
            </ul>
          </div>
          <div className="col-6 col-lg-2">
            <h6>Learn more</h6>
            <ul className="list-unstyled small d-grid gap-2">
              <li><Link to="/about">About CivicFix</Link></li>
              <li><Link to="/help">Help and FAQ</Link></li>
              <li><Link to="/login">Staff login</Link></li>
            </ul>
          </div>
          <div className="col-lg-4">
            <h6>Contact (demo)</h6>
            <ul className="list-unstyled small d-grid gap-2 mb-2">
              <li><i className="bi bi-envelope me-2" />support@civicfix.example</li>
              <li><i className="bi bi-telephone me-2" />+91 00000 00000 (demo number)</li>
            </ul>
            <p className="small mb-0">
              These are placeholder demo contacts, not real municipal services. In an emergency, call 112.
            </p>
          </div>
        </div>
        <hr className="border-secondary my-4" />
        <p className="small mb-0">© {new Date().getFullYear()} CivicFix. Built with React, Express and MongoDB.</p>
      </div>
    </footer>
  );
}
