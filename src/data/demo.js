import { todayIso, addDays } from '../lib/date.js';

// Initial data for new browsers and the Reset demo data button.
// Errand fields: dueDate/scheduled are "YYYY-MM-DD" or null; dueTime is minutes after midnight or null.
export const seed = () => {
  const today = todayIso();
  return {
    tasks: [
      { id: 1, name: 'Pick up package', loc: 'wien', duration: 10, dueDate: addDays(today, 4), dueTime: null, note: 'Bring ID', shared: '', scheduled: null },
      { id: 2, name: 'Return book', loc: 'butler', duration: 5, dueDate: today, dueTime: 1020, note: '', shared: '', scheduled: null },
      { id: 3, name: 'Buy groceries', loc: 'market', duration: 25, dueDate: null, dueTime: null, note: '', shared: '2 roommates', scheduled: null },
      { id: 7, name: 'Print syllabus', loc: 'lerner', duration: 5, dueDate: null, dueTime: null, note: '', shared: '', scheduled: addDays(today, 1) }
    ],
    classes: [
      { id: 4, name: 'Intro Stats', days: ['Mon', 'Wed', 'Fri'], start: 600, end: 675, loc: 'hamilton' },
      { id: 5, name: 'Data Structures', days: ['Mon', 'Wed', 'Fri'], start: 780, end: 855, loc: 'mudd' },
      { id: 6, name: 'Writing Seminar', days: ['Tue', 'Thu'], start: 700, end: 775, loc: 'butler' }
    ],
    // dayStart/dayEnd: task hours in minutes after midnight (errands are only planned inside them).
    settings: { pace: 'Average', buffer: 5, dayStart: 480, dayEnd: 1320 },
    walk: { visible: true, publicOnly: true, waved: [] },
    // Today's accepted plan: a frozen copy of one window's route (see planning/accept.js).
    accepted: null
  };
};

// Sample walking-buddy profiles. Matching is not live; the Walk tab labels these as samples.
export const sampleBuddies = [
  { id: 'alex', name: 'Alex', from: 'butler' },
  { id: 'priya', name: 'Priya', from: 'wien' }
];
