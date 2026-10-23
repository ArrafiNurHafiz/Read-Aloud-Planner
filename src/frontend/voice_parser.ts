export interface ParsedVoiceSchedule {
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  duration_min: number;
  location: string;
}

export function parseVoiceSchedule(transcript: string, baseDate: Date = new Date(), lang: 'id' | 'en' = 'en'): ParsedVoiceSchedule {
  let text = transcript.trim();
  const lower = text.toLowerCase();

  // 1. Date Extraction (Indonesian & English)
  let targetDate = new Date(baseDate.getTime());

  if (/\b(?:besok|tomorrow)\b/i.test(lower)) {
    targetDate.setDate(targetDate.getDate() + 1);
    text = text.replace(/\b(?:besok|tomorrow)\b/gi, '');
  } else if (/\b(?:lusa|day after tomorrow)\b/i.test(lower)) {
    targetDate.setDate(targetDate.getDate() + 2);
    text = text.replace(/\b(?:lusa|day after tomorrow)\b/gi, '');
  } else if (/\b(?:hari\s+ini|today|tonight)\b/i.test(lower)) {
    text = text.replace(/\b(?:hari\s+ini|today|tonight)\b/gi, '');
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // 2. Duration Extraction (e.g., "for 2 hours 30 minutes", "selama 1 jam 30 menit", "for 45 minutes", "half an hour")
  let durationMin = 60; // default 1 hour
  const durMatchCombined = text.match(/(?:(?:selama|for)\s+)?(\d+)\s*(?:jam|hours?|hrs?)\s*(?:and\s+)?(\d+)\s*(?:menit|minutes?|mins?)/i);
  if (durMatchCombined) {
    const hours = parseInt(durMatchCombined[1], 10);
    const mins = parseInt(durMatchCombined[2], 10);
    durationMin = hours * 60 + mins;
    text = text.replace(durMatchCombined[0], '');
  } else {
    const durMatchHours = text.match(/(?:(?:selama|for)\s+)?(\d+)\s*(?:jam|hours?|hrs?)/i);
    if (durMatchHours) {
      durationMin = parseInt(durMatchHours[1], 10) * 60;
      text = text.replace(durMatchHours[0], '');
    } else {
      const durMatchMins = text.match(/(?:(?:selama|for)\s+)?(\d+)\s*(?:menit|minutes?|mins?)/i);
      if (durMatchMins) {
        durationMin = parseInt(durMatchMins[1], 10);
        text = text.replace(durMatchMins[0], '');
      } else if (/(?:(?:selama|for)\s+)?(?:setengah\s+jam|half\s+an\s+hour)/i.test(text)) {
        durationMin = 30;
        text = text.replace(/(?:(?:selama|for)\s+)?(?:setengah\s+jam|half\s+an\s+hour)/gi, '');
      }
    }
  }

  // 3. Time Extraction (Extracted BEFORE Location so "at 9 AM" isn't treated as a location)
  // English: "at 9 AM", "at 2 PM", "at 14:00", "at 8:30"
  // Indonesian: "jam 8 pagi", "jam 2 siang", "pukul 19.30"
  let startTime = '09:00';
  const timeRegex = /(?:jam|pukul|at)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|pagi|siang|sore|malam)?/i;
  const timeMatch = text.match(timeRegex);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = (timeMatch[3] || '').toLowerCase();

    if (period === 'pm' || period === 'siang' || period === 'sore' || period === 'malam') {
      if (hour < 12) hour += 12;
    } else if (period === 'am' || period === 'pagi') {
      if (hour === 12) hour = 0;
    }

    startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    text = text.replace(timeMatch[0], '');
  }

  // 4. Location Extraction (e.g., "in room 301", "at Zoom", "di aula lantai 2")
  let location = '';
  const locMatch = text.match(/\b(?:di|in|at)\s+([^,.]+?)(?=\s+(?:jam|pukul|at|for|selama|$))/i) || text.match(/\b(?:di|in|at)\s+([^,.]+?)$/i);
  if (locMatch) {
    location = locMatch[1].trim();
    text = text.replace(locMatch[0], '');
  }

  // 5. Clean Title
  let title = text
    .replace(/\b(?:tambah|buat|jadwalkan|jadwal|kegiatan|acara|tolong|dong|add|schedule|create|new|activity|event|meeting|please)\b/gi, '')
    .replace(/[,\.]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!title) {
    title = lang === 'id' ? 'Kegiatan Suara' : 'Voice Activity';
  }

  return {
    title,
    date: dateStr,
    start_time: startTime,
    duration_min: durationMin,
    location
  };
}
