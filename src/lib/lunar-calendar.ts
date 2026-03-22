
export const getValidatedLunarDate = (
  date: Date, 
  validatedMonths: Record<string, string> // Format: "1445-09" -> "2024-03-12"
): { day: number, month: number, year: number, pendingValidation: boolean } => {
  let latestMonthKey = '';
  let latestStartGregorian = '';
  let latestStartMs = 0;

  for (const [key, startStr] of Object.entries(validatedMonths)) {
    const startMs = new Date(startStr).getTime();
    if (startMs <= date.getTime() && startMs >= latestStartMs) {
      latestStartMs = startMs;
      latestStartGregorian = startStr;
      latestMonthKey = key;
    }
  }

  if (latestMonthKey) {
    const [yearStr, monthStr] = latestMonthKey.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    
    // Reset time to midnight for accurate day diff
    const tTarget = new Date(date).setHours(0,0,0,0);
    const tStart = new Date(latestStartGregorian).setHours(0,0,0,0);
    const diff = Math.floor((tTarget - tStart) / (1000 * 60 * 60 * 24));
    
    if (diff > 29) {
      // The current date corresponds to the next month, which hasn't been validated yet.
      return { day: diff - 29 /* roughly */, month: month === 12 ? 1 : month + 1, year: month === 12 ? year + 1 : year, pendingValidation: true };
    }

    return { day: diff + 1, month, year, pendingValidation: false };
  }

  // Pre-seed an initial default if nothing exists. 
  // For the sake of this prototype, we'll assume 1st of Ramadan 1445 was March 11, 2024.
  // The Admin should set actual months.
  return { day: 1, month: 9, year: 1445, pendingValidation: true };
};

export const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];
