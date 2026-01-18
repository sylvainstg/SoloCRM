import { EmailThread } from '../types';

export const listEmails = async (accessToken: string, maxResults = 50): Promise<EmailThread[]> => {
    if (!accessToken) throw new Error("No access token provided");

    // 1. List Threads (Lightweight call)
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}&q=label:INBOX`, {
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

    // 2. Fetch Details in Batches (to avoid 429 Too Many Requests)
    const BATCH_SIZE = 5;
    const DELAY_MS = 100;
    const threads: EmailThread[] = [];

    for (let i = 0; i < data.threads.length; i += BATCH_SIZE) {
        const chunk = data.threads.slice(i, i + BATCH_SIZE);

        // Process chunk in parallel
        const chunkResults = await Promise.all(
            chunk.map(async (thread: any) => {
                try {
                    const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });

                    if (!detailResponse.ok) {
                        if (detailResponse.status === 429) {
                            console.warn(`Rate limit hit for thread ${thread.id}, skipping.`);
                            return null;
                        }
                        return null;
                    }

                    const detail = await detailResponse.json();

                    // Extract headers
                    const headers = detail.messages[0].payload.headers;
                    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
                    const fromRaw = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';

                    // Robust Parsing
                    const emailMatch = fromRaw.match(/<([^>]+)>/);
                    const email = emailMatch ? emailMatch[1] : fromRaw;
                    const name = fromRaw.includes('<') ? fromRaw.split('<')[0].trim().replace(/^"|"$/g, '') : fromRaw;

                    const date = new Date(parseInt(detail.messages[0].internalDate)).toLocaleDateString();

                    return {
                        id: thread.id,
                        subject,
                        from: name,
                        email: email,
                        date,
                        snippet: detail.messages[0].snippet
                    };
                } catch (e) {
                    console.error(`Failed to fetch thread ${thread.id}`, e);
                    return null;
                }
            })
        );

        // Filter out failed requests (nulls)
        chunkResults.forEach(res => {
            if (res) threads.push(res);
        });

        // Small delay between batches
        if (i + BATCH_SIZE < data.threads.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    return threads;
};
