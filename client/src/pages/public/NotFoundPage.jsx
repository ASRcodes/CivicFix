import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="container py-5">
      <EmptyState
        icon="bi-signpost-split"
        title="This page does not exist"
        message="The link may be broken or the page may have moved."
        action={<Link to="/" className="btn btn-primary">Go to the home page</Link>}
      />
    </div>
  );
}
