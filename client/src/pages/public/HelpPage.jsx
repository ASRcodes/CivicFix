import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

const FAQS = [
  ['Do I need an account to report an issue?', 'Yes. An account lets staff contact you if they need more details and lets you follow updates on your dashboard. Tracking by reference number works without an account.'],
  ['Where do I find my reference number?', 'It is shown immediately after you submit a complaint and on every row of "My complaints" in your dashboard. It looks like CF-2026-000123.'],
  ['Can I edit or delete a complaint?', 'Yes, while it is still Pending. Once staff start reviewing it, the details are locked so the record stays reliable. You can still add comments.'],
  ['Who can see my complaint?', 'The public only sees the title, category, area and status. Your name, contact details, street address, description and photo are visible only to you and municipal staff.'],
  ['What photos can I attach?', 'One JPEG, PNG or WebP image up to 2 MB per complaint. A clear photo of the problem helps staff act faster.'],
  ['Why was my complaint rejected?', 'Common reasons are duplicates of an existing complaint or issues outside municipal responsibility. The reason is shown on your complaint timeline.'],
  ['What should I do in an emergency?', 'CivicFix is not an emergency service. For fires, accidents, gas leaks or anything dangerous, call the emergency number 112 immediately.'],
];

export default function HelpPage() {
  useDocumentTitle('Help and FAQ');
  const [open, setOpen] = useState(0);
  return (
    <div className="container py-5" style={{ maxWidth: 860 }}>
      <h1 className="h2">Help and frequently asked questions</h1>
      <p className="text-muted mb-4">Answers to the most common questions about reporting and tracking complaints.</p>

      <div className="accordion mb-5">
        {FAQS.map(([q, a], i) => (
          <div className="accordion-item" key={q}>
            <h2 className="accordion-header">
              <button type="button" className={`accordion-button ${open === i ? '' : 'collapsed'}`} aria-expanded={open === i}
                aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
                {q}
              </button>
            </h2>
            <div id={`faq-${i}`} className={`accordion-collapse collapse ${open === i ? 'show' : ''}`}>
              <div className="accordion-body text-muted">{a}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="cf-card p-4">
        <h2 className="h5">Contact and support</h2>
        <p className="mb-2"><i className="bi bi-envelope me-2" />support@civicfix.example</p>
        <p className="mb-3"><i className="bi bi-telephone me-2" />+91 00000 00000</p>
        <p className="small text-muted mb-3">
          These are demo contact details for this college project. They are not real municipal phone numbers or email addresses.
          Contact your local municipal corporation directly for official matters.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/report" className="btn btn-teal">Report an issue</Link>
          <Link to="/track" className="btn btn-outline-primary">Track a complaint</Link>
        </div>
      </div>
    </div>
  );
}
