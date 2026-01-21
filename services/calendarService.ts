
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
            const errorBody = await response.text();
            console.error("Calendar API Error details:", errorBody);

            if (response.status === 401) {
                throw new Error("Unauthorized: Invalid or expired token");
            }

            // Try to parse JSON error for cleaner message
            try {
                const errorJson = JSON.parse(errorBody);
                throw new Error(errorJson.error?.message || `Calendar API Error (${response.status})`);
            } catch (e) {
                throw new Error(`Calendar API Error (${response.status}): ${errorBody}`);
            }
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        throw error;
    }
};
