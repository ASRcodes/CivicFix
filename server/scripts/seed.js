/**
 * Demo data seeder (development only).
 *
 *   npm run seed          -> idempotent: upserts departments and demo users; inserts demo
 *                            complaints only if the demo citizens have no complaints yet.
 *   npm run seed:reset    -> DELETES ALL complaints, activity, counters, departments and users,
 *                            then seeds fresh demo data.
 *
 * Demo credentials (development only, change or remove before any real deployment):
 *   Admin:    admin@civicfix.local   / Admin@12345
 *   Citizens: priya@example.com, arjun@example.com, meera@example.com, rahul@example.com
 *             password for all citizens: Citizen@123
 */
import mongoose from 'mongoose';
import { getConfig } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { Complaint, ComplaintActivity, Counter, Department, User } from '../src/models/index.js';
import { nextComplaintReference } from '../src/services/referenceService.js';
import { ACTIVITY_ACTIONS, ROLES } from '../src/utils/constants.js';

const RESET = process.argv.includes('--reset');
const DAY = 864e5;

const DEPARTMENTS = [
  { name: 'Sanitation', description: 'Garbage collection, street sweeping and public toilets.' },
  { name: 'Roads and Infrastructure', description: 'Potholes, damaged roads, footpaths and road signage.' },
  { name: 'Electricity and Streetlights', description: 'Streetlight repairs and public electrical hazards.' },
  { name: 'Water Supply', description: 'Leaks, low pressure, contamination and supply interruptions.' },
  { name: 'Drainage', description: 'Blocked drains, sewage overflow and waterlogging.' },
  { name: 'Parks and Public Spaces', description: 'Public parks, benches and open spaces.' },
];

const DEMO_ADMIN = { name: 'Demo Administrator', email: 'admin@civicfix.local', password: 'Admin@12345' };
const CITIZENS = [
  { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43210' },
  { name: 'Arjun Mehta', email: 'arjun@example.com', phone: '+91 98123 45678' },
  { name: 'Meera Nair', email: 'meera@example.com', phone: '' },
  { name: 'Rahul Verma', email: 'rahul@example.com', phone: '+91 99887 76655' },
];
const CITIZEN_PASSWORD = 'Citizen@123';

// [title, description, category, priority, address, city, finalStatus, daysAgo, department, staff, citizenIndex]
const COMPLAINTS = [
  ['Garbage pile near the bus stop', 'Uncollected garbage has been piling up next to the bus stop for over a week and stray dogs are scattering it across the road.', 'Garbage', 'High', 'Bus stop, Station Road', 'Old Market', 'Resolved', 40, 'Sanitation', 'R. Gill (Ward supervisor)', 0],
  ['Deep pothole on the main road', 'A deep pothole in the middle lane has already caused two scooter accidents. It fills with water when it rains and is hard to see at night.', 'Roads & Potholes', 'Urgent', 'Main Road near City Hospital gate', 'Civil Lines', 'In Progress', 12, 'Roads and Infrastructure', 'Road maintenance crew B', 1],
  ['Streetlight not working for two weeks', 'The streetlight outside house number 42 has been off for two weeks. The lane is completely dark and residents feel unsafe walking at night.', 'Streetlights', 'Medium', 'Lane 3, house 42', 'Lakeview Colony', 'Resolved', 30, 'Electricity and Streetlights', 'S. Kaur (Electrician)', 2],
  ['No water supply since yesterday morning', 'There has been no municipal water supply in our block since yesterday morning. About thirty families are affected and no notice was given.', 'Water Supply', 'Urgent', 'Block C, Sector 21', 'Sector 21', 'Under Review', 2, 'Water Supply', '', 3],
  ['Sewage overflowing onto the street', 'The manhole cover near the market is overflowing with sewage. The smell is very strong and shoppers have to walk through dirty water.', 'Drainage & Sewage', 'High', 'Vegetable market entrance', 'Old Market', 'In Progress', 6, 'Drainage', 'Drainage team 2', 0],
  ['Public toilet locked during the day', 'The public toilet near the park has been locked during daytime hours for the last few days, so visitors have no facility nearby.', 'Sanitation', 'Medium', 'Near Children\'s Park gate', 'Riverside', 'Pending', 1, null, '', 1],
  ['Broken footpath tiles near the school', 'Several footpath tiles outside the primary school are broken and loose. Children have tripped on them while walking to school.', 'Roads & Potholes', 'High', 'Outside Government Primary School', 'Sector 14', 'Pending', 0, null, '', 2],
  ['Overflowing community dustbin', 'The large community dustbin at the corner is full and overflowing. Collection seems to have stopped this week.', 'Garbage', 'Medium', 'Corner of 5th Cross and Park Street', 'Lakeview Colony', 'Resolved', 21, 'Sanitation', 'Collection van 7', 3],
  ['Low water pressure in the morning', 'Water pressure is so low between 6 and 9 a.m. that it does not reach the first floor. This has been going on for about ten days.', 'Water Supply', 'Low', 'Street 9, Sector 21', 'Sector 21', 'Rejected', 18, null, '', 0],
  ['Waterlogging after every rain', 'Even light rain causes knee-deep waterlogging at this junction because the storm drain is blocked with silt and plastic waste.', 'Drainage & Sewage', 'High', 'Junction of Canal Road and Ring Road', 'Riverside', 'Under Review', 4, 'Drainage', '', 1],
  ['Three streetlights flickering on the bridge', 'Three streetlights on the river bridge keep flickering and switch off completely after midnight. Heavy traffic uses this bridge at night.', 'Streetlights', 'High', 'River bridge, east side', 'Riverside', 'In Progress', 8, 'Electricity and Streetlights', 'S. Kaur (Electrician)', 2],
  ['Dead animal on the roadside', 'There is a dead animal lying on the roadside near the petrol pump since yesterday. It needs urgent removal for hygiene reasons.', 'Sanitation', 'Urgent', 'Near the petrol pump, Highway service lane', 'Sector 14', 'Resolved', 9, 'Sanitation', 'Sanitation response team', 3],
  ['Open electrical junction box', 'A streetlight junction box has its door broken and wires are exposed at child height. It is next to a busy footpath.', 'Streetlights', 'Urgent', 'Footpath outside the community hall', 'Civil Lines', 'Pending', 0, null, '', 0],
  ['Construction debris dumped on the road', 'Someone has dumped construction debris on half of the road. Vehicles are forced to use one lane, causing traffic jams in the evening.', 'Roads & Potholes', 'Medium', 'Service road behind the stadium', 'Sector 14', 'Under Review', 3, 'Roads and Infrastructure', '', 1],
  ['Contaminated tap water', 'The tap water has turned yellowish and smells unusual since the pipeline repair work last week. Residents are worried about drinking it.', 'Water Supply', 'High', 'Ward 6, Gali number 2', 'Old Market', 'In Progress', 5, 'Water Supply', 'Water quality inspector', 2],
  ['Garbage burning in the open plot', 'People are burning garbage in the open plot every evening. The smoke enters nearby homes and is causing breathing problems.', 'Garbage', 'Medium', 'Vacant plot behind Lakeview apartments', 'Lakeview Colony', 'Pending', 1, null, '', 3],
  ['Fallen tree branch blocking the lane', 'A large tree branch fell during the storm and is blocking most of the lane. Cars cannot pass and two-wheelers struggle.', 'Other', 'Medium', 'Lane 7, near the temple', 'Civil Lines', 'Resolved', 14, 'Parks and Public Spaces', 'Horticulture team', 0],
  ['Duplicate: pothole on main road', 'Reporting again the pothole near the hospital gate which is still dangerous for two-wheelers and has grown bigger.', 'Roads & Potholes', 'Low', 'Main Road near City Hospital gate', 'Civil Lines', 'Rejected', 10, null, '', 3],
];

const PATHS = {
  Pending: ['Pending'],
  'Under Review': ['Pending', 'Under Review'],
  'In Progress': ['Pending', 'Under Review', 'In Progress'],
  Resolved: ['Pending', 'Under Review', 'In Progress', 'Resolved'],
  Rejected: ['Pending', 'Rejected'],
};

async function upsertUser({ name, email, phone = '', password, role }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ name, email, phone, role, passwordHash: await User.hashPassword(password) });
}

async function insertRaw(Model, doc) {
  await doc.validate();
  await Model.collection.insertOne(doc.toObject({ depopulate: true }));
  return doc;
}

async function seedComplaints(admin, citizens, departmentsByName) {
  const now = Date.now();
  for (const row of COMPLAINTS) {
    const [title, description, category, priority, address, city, finalStatus, daysAgo, deptName, staff, ci] = row;
    const citizen = citizens[ci];
    const created = new Date(now - daysAgo * DAY - 3 * 36e5);
    const steps = PATHS[finalStatus];
    const stepGap = Math.max(1, Math.floor((daysAgo * DAY) / (steps.length + 1)));
    const lastStepAt = new Date(created.getTime() + stepGap * (steps.length - 1));
    const dept = deptName ? departmentsByName[deptName] : null;

    const complaint = new Complaint({
      referenceNumber: await nextComplaintReference(created),
      title, description, category, priority, address, city,
      status: finalStatus,
      citizenId: citizen._id,
      departmentId: dept?._id || null,
      assignedTo: staff,
      createdAt: created,
      updatedAt: lastStepAt,
      resolvedAt: finalStatus === 'Resolved' ? lastStepAt : null,
    });
    await insertRaw(Complaint, complaint);

    const activities = [{
      action: ACTIVITY_ACTIONS.CREATED, actor: citizen, newStatus: 'Pending', at: created, publicMessage: 'Complaint submitted',
    }];
    steps.slice(1).forEach((status, i) => {
      const at = new Date(created.getTime() + stepGap * (i + 1));
      const messages = {
        'Under Review': 'Your complaint is being reviewed by the municipal team.',
        'In Progress': 'Work has been scheduled and the field team has been informed.',
        Resolved: 'The issue has been fixed. Thank you for reporting it.',
        Rejected: 'Duplicate of an existing complaint that is already being handled.',
      };
      activities.push({
        action: ACTIVITY_ACTIONS.STATUS_CHANGED, actor: admin, previousStatus: steps[i], newStatus: status, at,
        publicMessage: messages[status],
        internalNote: status === 'Under Review' ? 'Verified location with ward office.' : '',
      });
      if (status === 'Under Review' && dept) {
        activities.push({
          action: ACTIVITY_ACTIONS.ASSIGNED, actor: admin, at: new Date(at.getTime() + 36e5),
          publicMessage: `Assigned to ${dept.name}${staff ? `; field staff: ${staff}` : ''}`,
        });
      }
    });
    if (finalStatus === 'In Progress') {
      activities.push({
        action: ACTIVITY_ACTIONS.INTERNAL_NOTE, actor: admin, at: new Date(lastStepAt.getTime() + 2 * 36e5),
        internalNote: 'Materials requisition raised; awaiting approval.', visibleToCitizen: false,
      });
    }

    for (const a of activities) {
      const activity = new ComplaintActivity({
        complaintId: complaint._id,
        actorId: a.actor._id,
        actorRole: a.actor.role,
        action: a.action,
        previousStatus: a.previousStatus || null,
        newStatus: a.newStatus || null,
        publicMessage: a.publicMessage || '',
        internalNote: a.internalNote || '',
        visibleToCitizen: a.visibleToCitizen ?? true,
        createdAt: a.at,
      });
      await insertRaw(ComplaintActivity, activity);
    }
  }
}

async function main() {
  const config = getConfig();
  if (config.isProduction) throw new Error('Refusing to seed demo data when NODE_ENV=production');

  await connectDB(config.mongoUri, { retries: 2, delayMs: 1500 });
  await Promise.all([User.init(), Complaint.init(), Department.init(), ComplaintActivity.init()]);

  if (RESET) {
    console.log('Reset requested: deleting all complaints, activity, counters, departments and users...');
    await Promise.all([
      Complaint.deleteMany({}), ComplaintActivity.deleteMany({}), Counter.deleteMany({}),
      Department.deleteMany({}), User.deleteMany({}),
    ]);
  }

  const departmentsByName = {};
  for (const d of DEPARTMENTS) {
    const dept = await Department.findOneAndUpdate(
      { name: d.name },
      { $setOnInsert: d },
      { upsert: true, new: true, collation: { locale: 'en', strength: 2 } },
    );
    departmentsByName[d.name] = dept;
  }
  console.log(`Departments ready: ${DEPARTMENTS.length}`);

  const admin = await upsertUser({ ...DEMO_ADMIN, role: ROLES.ADMIN });
  const citizens = [];
  for (const c of CITIZENS) citizens.push(await upsertUser({ ...c, password: CITIZEN_PASSWORD, role: ROLES.CITIZEN }));
  console.log(`Demo users ready: 1 admin, ${citizens.length} citizens`);

  const existing = await Complaint.countDocuments({ citizenId: { $in: citizens.map((c) => c._id) } });
  if (existing > 0) {
    console.log(`Demo citizens already have ${existing} complaints - skipping complaint seeding (use "npm run seed:reset" to start fresh).`);
  } else {
    await seedComplaints(admin, citizens, departmentsByName);
    console.log(`Demo complaints inserted: ${COMPLAINTS.length}`);
  }

  console.log('\nDemo credentials (development only):');
  console.log(`  Admin:   ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`);
  console.log(`  Citizen: ${CITIZENS[0].email} / ${CITIZEN_PASSWORD}  (and ${CITIZENS.slice(1).map((c) => c.email).join(', ')})`);
}

main()
  .catch((err) => {
    console.error(`Seeding failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
