
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

export const getHijriMonthStart = (
  year: number, 
  month: number, 
  validatedMonths: Record<string, string>
): Date => {
  const key = `${year}-${month.toString().padStart(2, '0')}`;
  if (validatedMonths[key]) {
    return new Date(validatedMonths[key]);
  }
  
  // Fallback estimation if not validated
  // This is a very rough estimation for the sake of the UI
  // 1 Ramadan 1445 was 2024-03-11
  const baseDate = new Date('2024-03-11');
  const baseYear = 1445;
  const baseMonth = 9;
  
  const monthDiff = (year - baseYear) * 12 + (month - baseMonth);
  const estimatedDays = monthDiff * 29.53059;
  
  const result = new Date(baseDate);
  result.setDate(result.getDate() + Math.round(estimatedDays));
  return result;
};

export const getHijriMonthLength = (
  year: number, 
  month: number, 
  validatedMonths: Record<string, string>
): number => {
  const currentKey = `${year}-${month.toString().padStart(2, '0')}`;
  
  // Check next month's start in validatedMonths
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear = year + 1;
  }
  const nextKey = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
  
  if (validatedMonths[currentKey] && validatedMonths[nextKey]) {
    const start = new Date(validatedMonths[currentKey]);
    const nextStart = new Date(validatedMonths[nextKey]);
    return Math.round((nextStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Default to 30 if not fully validated forward
  return 30;
};
