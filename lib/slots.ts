export interface AvailabilitySlot {
  locationId: string;
  locationName: string;
  availability: number;
  bookableFrom: string;
  status: string;
  slotReferencesInCentre: string;
  dateTime: string;
}

export interface CombinedSlot extends AvailabilitySlot {
  venueId: string;
  venueName: string;
  venueType: 'padel' | 'tennis';
  bookingUrl?: string;
}

export function filterNonWorkingHours(slots: CombinedSlot[]): CombinedSlot[] {
  return slots.filter((slot) => {
    const date = new Date(slot.dateTime);
    const dayOfWeek = date.getDay();
    const timeInMinutes = date.getHours() * 60 + date.getMinutes();

    if (dayOfWeek === 0 || dayOfWeek === 6) return true;
    return timeInMinutes >= 1050 && timeInMinutes <= 1260;
  });
}

export function groupSlotsByDay(slots: CombinedSlot[]): Record<string, CombinedSlot[]> {
  const grouped: Record<string, CombinedSlot[]> = {};

  slots.forEach((slot) => {
    const dayKey = new Date(slot.dateTime).toLocaleDateString('en-GB', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!grouped[dayKey]) grouped[dayKey] = [];
    grouped[dayKey].push(slot);
  });

  Object.keys(grouped).forEach((day) => {
    grouped[day].sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
  });

  return grouped;
}
