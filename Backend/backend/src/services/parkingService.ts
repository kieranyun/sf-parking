import { pool } from '../db/connection';
import { QUERIES } from '../db/queries';
import { ParkingRestriction, CheckParkingRequest, SweepingSchedule } from '../types';
import { addWeeks, startOfMonth, nextDay, isAfter, isBefore, Day } from 'date-fns';


const GPS_ACCURACY_RADIUS_METERS = 10.00;

// TODO: Create a function to find parking restrictions near a coordinate
export async function findRestrictionsNearPoint(CheckParkingRequest: CheckParkingRequest): Promise<ParkingRestriction[] | []> { //update type
  const client = await pool.connect();
  const {longitude, latitude} = CheckParkingRequest
  try {
    const qResult = await client.query(QUERIES.getSweepingSchedulesByCoordinates,[longitude, latitude, GPS_ACCURACY_RADIUS_METERS])

    console.log(qResult.rows);

    const result: ParkingRestriction[] = qResult.rows.map(row => {
      return {
        parkingSpot: {
          street: row.corridor,
          crossStreets: row.limits, //cross streets
          blockside: row.blockside, //"East", "West", etc..
          cnn: row.cnn,
          sidewalkLine: JSON.parse(row.curbline)
        },
        sweepSchedule: {
          week1: row.week1,
          week2: row.week2,
          week3: row.week3,
          week4: row.week4,
          week5: row.week5,
          fromHour: row.fromhour,
          toHour: row.tohour,
          weekday: row.weekday
        }
      }
    })
    return result;
  } catch (error) {
    console.error('error querying by coordinates', error)
    return [];
  } finally {
    client.release();
  }
}

export function getNextSweeping(schedule: SweepingSchedule): Date | null {
  const now = new Date();
  const weekdayMap: Record<string, number> = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
  };

  const weekdayNum = weekdayMap[schedule.weekday];
  if (weekdayNum === undefined) return null;

  // Check which weeks this applies to
  const activeWeeks = [
    schedule.week1 ? 1 : null,
    schedule.week2 ? 2 : null,
    schedule.week3 ? 3 : null,
    schedule.week4 ? 4 : null,
    schedule.week5 ? 5 : null,
  ].filter(Boolean) as number[];

  // Find next occurrence
  const candidates: Date[] = [];

  // Check current month
  for (const weekNum of activeWeeks) {
    const sweepingDate = getNthWeekdayOfMonth(
      now.getFullYear(),
      now.getMonth(),
      weekdayNum,
      weekNum
    );
    sweepingDate.setHours(schedule.fromHour, 0, 0, 0);

    if (isAfter(sweepingDate, now)) {
      candidates.push(sweepingDate);
    }
  }

  // Check next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  for (const weekNum of activeWeeks) {
    const sweepingDate = getNthWeekdayOfMonth(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      weekdayNum,
      weekNum
    );
    sweepingDate.setHours(schedule.fromHour, 0, 0, 0);
    candidates.push(sweepingDate);
  }

  // Return the earliest future date
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] || null;
}

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date {
  const firstDay = startOfMonth(new Date(year, month, 1));
  const firstWeekday = nextDay(firstDay, weekday as Day);
  return addWeeks(firstWeekday, n - 1);
}

// // Usage
// const schedule = {
//   weekday: 'Tuesday',
//   fromHour: 5,
//   tohour: 6,
//   week1: true,
//   week2: true,
//   week3: true,
//   week4: true,
//   week5: true
// };

// const nextCleaning = getNextSweeping(schedule);
// console.log(nextCleaning); // Next Tuesday at 5am that falls on weeks 1-5