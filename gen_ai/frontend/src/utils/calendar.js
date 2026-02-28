export const generateCalendarUrl = ({ title, description, date, startTime = '06:00', durationMinutes = 45 }) => {
    if (!date) {
        date = new Date().toISOString().split('T')[0];
    }

    // Create Date objects (Assuming local timezone)
    const [year, month, day] = date.split('-');
    const [hours, minutes] = startTime.split(':');

    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const pad = (n) => n.toString().padStart(2, '0');
    const formatDateTime = (d) => {
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };

    const startStr = formatDateTime(startDate);
    const endStr = formatDateTime(endDate);

    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', title);
    url.searchParams.append('dates', `${startStr}/${endStr}`);
    if (description) {
        url.searchParams.append('details', description);
    }

    return url.toString();
};
