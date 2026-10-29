import { Complaint } from '../models/Complaint.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { CATEGORIES, PRIORITIES, STATUSES } from '../utils/constants.js';
import { toPositiveInt } from '../utils/query.js';

export const stats = asyncHandler(async (_req, res) => {
  const [facet] = await Complaint.aggregate([
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
        cities: [{ $group: { _id: { $toLower: '$city' } } }, { $count: 'n' }],
        resolution: [
          { $match: { status: 'Resolved', resolvedAt: { $ne: null } } },
          { $group: { _id: null, avgMs: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } } } },
        ],
      },
    },
  ]);
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  facet.byStatus.forEach((s) => { byStatus[s._id] = s.count; });
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const closable = total - byStatus.Rejected;

  return sendSuccess(res, {
    data: {
      total,
      resolved: byStatus.Resolved,
      inProgress: byStatus['In Progress'] + byStatus['Under Review'],
      pending: byStatus.Pending,
      resolutionRate: closable > 0 ? Math.round((byStatus.Resolved / closable) * 1000) / 10 : 0,
      averageResolutionDays: facet.resolution[0] ? Math.round((facet.resolution[0].avgMs / 864e5) * 10) / 10 : null,
      areasCovered: facet.cities[0]?.n || 0,
      byCategory: CATEGORIES.map((c) => ({ category: c, count: facet.byCategory.find((x) => x._id === c)?.count || 0 })),
    },
  });
});

/** Recent complaints with privacy protection: no names, no street address, no description. */
export const recentComplaints = asyncHandler(async (req, res) => {
  const limit = toPositiveInt(req.query.limit, 6, 12);
  const complaints = await Complaint.find({ status: { $ne: 'Rejected' } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('referenceNumber title category status city createdAt -_id')
    .lean();
  return sendSuccess(res, { data: { complaints } });
});

/** Option lists for the client (single source of truth for categories/statuses). */
export const meta = (_req, res) =>
  sendSuccess(res, { data: { categories: CATEGORIES, priorities: PRIORITIES, statuses: STATUSES } });
