import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePasted, parseIcs, parseClock, matchPlace } from '../src/features/classes/import.js';

test('reads pasted schedule lines', () => {
  const { classes, errors } = parsePasted('Intro Stats, Mon/Wed/Fri, 10:00-11:15, Hamilton Hall\nData Structures MWF 1:00 - 2:15 Mudd\nnot a class');
  assert.deepEqual(errors, [3]);
  assert.deepEqual(classes[0], { name: 'Intro Stats', days: ['Mon', 'Wed', 'Fri'], start: 600, end: 675, where: 'Hamilton Hall' });
  assert.equal(classes[1].name, 'Data Structures');
  assert.deepEqual(classes[1].days, ['Mon', 'Wed', 'Fri']);
  assert.equal(classes[1].start, 780);
});

test('afternoon times without am/pm and explicit suffixes', () => {
  assert.equal(parseClock('1:15'), 795);
  assert.equal(parseClock('11:40'), 700);
  assert.equal(parseClock('9am'), 540);
  assert.equal(parseClock('12:30pm'), 750);
  assert.ok(Number.isNaN(parseClock('25:00')));
});

test('reads weekly .ics events and merges them', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT', 'SUMMARY:Writing Seminar', 'LOCATION:Butler Library 203',
    'DTSTART;TZID=America/New_York:20260901T114000', 'DTEND;TZID=America/New_York:20260901T125500',
    'RRULE:FREQ=WEEKLY;BYDAY=TU,TH', 'END:VEVENT',
    'BEGIN:VEVENT', 'SUMMARY:Lab', 'DTSTART:20260902T150000', 'DTEND:20260902T160000', 'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const { classes } = parseIcs(ics);
  assert.deepEqual(classes[0], { name: 'Writing Seminar', days: ['Tue', 'Thu'], start: 700, end: 775, where: 'Butler Library 203' });
  assert.deepEqual(classes[1].days, ['Wed']);
  assert.equal(matchPlace(classes[0].where), 'butler');
  assert.equal(matchPlace('Somewhere else'), null);
});
