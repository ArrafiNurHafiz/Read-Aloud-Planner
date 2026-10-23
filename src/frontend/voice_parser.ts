export interface ParsedVoiceSchedule {
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  duration_min: number;
  location: string;
}

export function parseVoiceSchedule(transcript: string, baseDate: Date = new Date()): ParsedVoiceSchedule {
  let text = transcript.trim();
  const lower = text.toLowerCase();

  // 1. Date Extraction
  let targetDate = new Date(baseDate.getTime());
  let dateFound = false;

  if (/\bbesok\b/i.test(lower)) {
    targetDate.setDate(targetDate.getDate() + 1);
    dateFound = true;
    text = text.replace(/\bbesok\b/gi, '');
  } else if (/\blusa\b/i.test(lower)) {
    targetDate.setDate(targetDate.getDate() + 2);
    dateFound = true;
    text = text.replace(/\blusa\b/gi, '');
  } else if (/\bhari\s+ini\b/i.test(lower)) {
    dateFound = true;
    text = text.replace(/\bhari\s+ini\b/gi, '');
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // 2. Duration Extraction (e.g., "1 jam 30 menit", "2 jam", "30 menit", "setengah jam")
  let durationMin = 60; // default 1 hour
  const durMatchCombined = text.match(/(?:selama\s+)?(\d+)\s*jam\s*(\d+)\s*menit/i);
  if (durMatchCombined) {
    const hours = parseInt(durMatchCombined[1], 10);
    const mins = parseInt(durMatchCombined[2], 10);
    durationMin = hours * 60 + mins;
    text = text.replace(durMatchCombined[0], '');
  } else {
    const durMatchHours = text.match(/(?:selama\s+)?(\d+)\s*jam/i);
    if (durMatchHours) {
      durationMin = parseInt(durMatchHours[1], 10) * 60;
      text = text.replace(durMatchHours[0], '');
    } else {
      const durMatchMins = text.match(/(?:selama\s+)?(\d+)\s*menit/i);
      if (durMatchMins) {
        durationMin = parseInt(durMatchMins[1], 10);
        text = text.replace(durMatchMins[0], '');
      } else if (/(?:selama\s+)?setengah\s+jam/i.test(text)) {
        durationMin = 30;
        text = text.replace(/(?:selama\s+)?setengah\s+jam/gi, '');
      }
    }
  }

  // 3. Location Extraction (e.g., "di ruang 301", "di aula lantai 2", "di zoom")
  let location = '';
  const locMatch = text.match(/\bdi\s+([^,.]+?)(?=\s+(?:jam|pukul|selama|$))/i) || text.match(/\bdi\s+([^,.]+?)$/i);
  if (locMatch) {
    location = locMatch[1].trim();
    text = text.replace(locMatch[0], '');
  }

  // 4. Time Extraction (e.g., "jam 8 pagi", "jam 2 siang", "jam 7 malam", "pukul 14.00", "jam 08:30")
  let startTime = '09:00';
  const timeRegex = /(?:jam|pukul)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?/i;
  const timeMatch = text.match(timeRegex);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = (timeMatch[3] || '').toLowerCase();

    if (period === 'siang' || period === 'sore') {
      if (hour < 12) hour += 12;
    } else if (period === 'malam') {
      if (hour < 12) hour += 12;
    } else if (period === 'pagi') {
      if (hour === 12) hour = 0;
    }

    startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    text = text.replace(timeMatch[0], '');
  }

  // 5. Clean Title
  let title = text
    .replace(/\b(?:tambah|buat|jadwalkan|jadwal|kegiatan|acara|tolong|dong)\b/gi, '')
    .replace(/[,\.]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!title) {
    title = 'Kegiatan Suara';
  }

  return {
    title,
    date: dateStr,
    start_time: startTime,
    duration_min: durationMin,
    location
  };
}
