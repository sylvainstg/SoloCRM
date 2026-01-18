import { EmailThread } from '../types';

export const listEmails = async (accessToken: string, maxResults = 10): Promise<EmailThread[]> => {
    if (!accessToken) throw new Error("No access token provided");

    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error("Gmail API Error Details:", errorBody);
        throw new Error(`Gmail API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
    }

    const data = await response.json();
    if (!data.threads) return [];

    // Fetch details for each thread to get snippet and subject
    const threads: EmailThread[] = await Promise.all(
        data.threads.map(async (thread: any) => {
            const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const detail = await detailResponse.json();

            // Extract headers
            const headers = detail.messages[0].payload.headers;
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';

            // Simple date extraction from internalDate
            const date = new Date(parseInt(detail.messages[0].internalDate)).toLocaleDateString();

            return {
                id: thread.id,
                subject,
                from,
                date,
                snippet: detail.messages[0].snippet
            };
        })
    );

    return threads;
};
