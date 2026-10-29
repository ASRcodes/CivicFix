import { Counter } from '../models/Counter.js';
import { formatReference } from '../utils/reference.js';

export { formatReference };

/**
 * Generates the next human-readable complaint reference.
 * Uses an atomic $inc on a per-year counter document, so two concurrent
 * submissions always get different numbers. A unique index on
 * Complaint.referenceNumber is a second line of defence.
 */
export async function nextComplaintReference(date = new Date()) {
  const year = date.getUTCFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `complaint-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return formatReference(year, counter.seq);
}
