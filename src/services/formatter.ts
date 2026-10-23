export interface ActivityData {
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM or HH:MM:SS
  duration_min: number;
  location?: string;
  notes?: string;
  done: boolean;
}

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDuration(minutes: number, lang: 'id' | 'en'): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === 'id') {
    if (h > 0 && m > 0) return `${h} jam ${m} menit`;
    if (h > 0) return `${h} jam`;
    return `${m} menit`;
  } else {
    if (h > 0 && m > 0) return `${h} hour${h > 1 ? 's' : ''} ${m} min`;
    if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
    return `${m} minutes`;
  }
}

export function formatLinearSentence(act: ActivityData, lang: 'id' | 'en' = 'id'): string {
  const parts = act.date.split('-').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayName = lang === 'id' ? DAYS_ID[dt.getDay()] : DAYS_EN[dt.getDay()];

  const timeFormatted = act.start_time.substring(0, 5).replace(':', lang === 'id' ? '.' : ':');
  const durText = formatDuration(act.duration_min, lang);

  let sentence = `${dayName}, ${timeFormatted}, ${act.title}, ${durText}`;
  if (act.location && act.location.trim().length > 0) {
    sentence += `, ${act.location.trim()}`;
  }
  sentence += '.';

  if (act.done) {
    sentence += lang === 'id' ? ' Selesai.' : ' Completed.';
  }

  return sentence;
}
