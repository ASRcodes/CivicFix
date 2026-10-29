import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | CivicFix` : 'CivicFix — Smart Complaint Management';
  }, [title]);
}
