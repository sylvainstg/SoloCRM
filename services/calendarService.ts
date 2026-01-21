
export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    attendees?: { email: string; displayName?: string; responseStatus?: string }[];
    htmlLink: string;
}

export const listEvents = async (accessToken: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> => {
    const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50' // Reasonable limit for daily/weekly view
    });

    try {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Unauthorized: Invalid or expired token");
            }
            throw new Error(`Calendar API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        throw error;
    }
};
