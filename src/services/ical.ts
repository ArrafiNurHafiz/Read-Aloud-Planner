export interface CalendarEvent {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  duration_min: number;
  location?: string;
  notes?: string;
}

export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ReadAloudPlanner//NONSGML v1.0//ID'
  ];

  for (const ev of events) {
    const dateClean = ev.date.replace(/-/g, '');
    const timeParts = ev.start_time.split(':');
    const startHour = Number(timeParts[0]);
    const startMin = Number(timeParts[1]);

    const dtStart = `${dateClean}T${timeParts[0].padStart(2, '0')}${timeParts[1].padStart(2, '0')}00`;

    const totalMinutes = startHour * 60 + startMin + ev.duration_min;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = totalMinutes % 60;
    const dtEnd = `${dateClean}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id || 'uid-' + Math.random().toString(36).substring(2)}@readaloudplanner`);
    lines.push(`DTSTAMP:${dateClean}T000000Z`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${ev.title.replace(/[\r\n]/g, ' ')}`);
    if (ev.location) lines.push(`LOCATION:${ev.location.replace(/[\r\n]/g, ' ')}`);
    if (ev.notes) lines.push(`DESCRIPTION:${ev.notes.replace(/[\r\n]/g, ' ')}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function parseICS(icsContent: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const veventBlocks = icsContent.split('BEGIN:VEVENT');

  for (let i = 1; i < veventBlocks.length; i++) {
    const block = veventBlocks[i].split('END:VEVENT')[0];
    let title = '';
    let date = '';
    let startTime = '';
    let durationMin = 60;
    let location = '';
    let notes = '';

    const lines = block.split(/\r?\n/);
    let dtStartRaw = '';
    let dtEndRaw = '';

    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) title = line.substring(8).trim();
      if (line.startsWith('LOCATION:')) location = line.substring(9).trim();
      if (line.startsWith('DESCRIPTION:')) notes = line.substring(12).trim();
      if (line.startsWith('DTSTART:')) dtStartRaw = line.substring(8).trim();
      if (line.startsWith('DTEND:')) dtEndRaw = line.substring(6).trim();
    }

    if (dtStartRaw.includes('T')) {
      const parts = dtStartRaw.split('T');
      const d = parts[0];
      date = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
      startTime = `${parts[1].substring(0, 2)}:${parts[1].substring(2, 4)}`;

      if (dtEndRaw.includes('T')) {
        const endParts = dtEndRaw.split('T');
        const eH = Number(endParts[1].substring(0, 2));
        const eM = Number(endParts[1].substring(2, 4));
        const sH = Number(parts[1].substring(0, 2));
        const sM = Number(parts[1].substring(2, 4));
        durationMin = (eH * 60 + eM) - (sH * 60 + sM);
        if (durationMin <= 0) durationMin = 60;
      }
    }

    if (title && date && startTime) {
      events.push({ title, date, start_time: startTime, duration_min: durationMin, location, notes });
    }
  }

  return events;
}
