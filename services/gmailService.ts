import { EmailThread } from '../types';

export const listEmails = async (accessToken: string, maxResults = 50, pageToken?: string, queryStr?: string): Promise<{ threads: EmailThread[], nextPageToken?: string }> => {
    if (!accessToken) throw new Error("No access token provided");

    // 1. List Threads (Lightweight call)
    let q = 'label:INBOX';
    if (queryStr) {
        q += ` ${queryStr}`;
    }

    const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}&q=${encodeURIComponent(q)}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const response = await fetch(url, {
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
    if (!data.threads) return { threads: [], nextPageToken: undefined };

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

                    const messages = detail.messages;
                    const lastMsg = messages[messages.length - 1];

                    // Extract headers from the LAST message (reply)
                    const headers = lastMsg.payload.headers;
                    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
                    const fromRaw = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';

                    // Robust Parsing
                    const emailMatch = fromRaw.match(/<([^>]+)>/);
                    const email = emailMatch ? emailMatch[1] : fromRaw;
                    const name = fromRaw.includes('<') ? fromRaw.split('<')[0].trim().replace(/^"|"$/g, '') : fromRaw;

                    const date = new Date(parseInt(lastMsg.internalDate)).toLocaleDateString();

                    return {
                        id: thread.id,
                        subject,
                        from: name,
                        email: email,
                        date,
                        snippet: lastMsg.snippet
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

    return { threads, nextPageToken: data.nextPageToken };
};

export const sendReply = async (accessToken: string, threadId: string, to: string, subject: string, body: string) => {
    if (!accessToken) throw new Error("No access token");

    // Construct MIME message
    const emailLines = [
        `To: ${to}`,
        `Subject: Re: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        '',
        body
    ];

    const email = emailLines.join('\r\n');
    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            raw: base64EncodedEmail,
            threadId: threadId
        })
    });

    if (!response.ok) {
        throw new Error('Failed to send reply');
    }

    return await response.json();
};

const decodeBody = (payload: any): string => {
    if (!payload) return '';

    // Helper to decode Base64Url
    const decode = (data: string) => {
        return decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/'))));
    };

    // 1. Check if body data exists directly (e.g., plain text email)
    if (payload.body && payload.body.size > 0 && payload.body.data) {
        return decode(payload.body.data);
    }

    // 2. Check parts (multipart)
    if (payload.parts && payload.parts.length > 0) {
        // Try to find HTML part first
        let part = payload.parts.find((p: any) => p.mimeType === 'text/html');
        // Fallback to text/plain
        if (!part) part = payload.parts.find((p: any) => p.mimeType === 'text/plain');

        // If nested multipart (e.g. multipart/alternative inside multipart/mixed), recurse
        if (!part) {
            // Flatten one level if possible or find a multipart
            const multiPart = payload.parts.find((p: any) => p.mimeType.startsWith('multipart/'));
            if (multiPart) return decodeBody(multiPart);
        }

        if (part && part.body && part.body.data) {
            return decode(part.body.data);
        }
    }

    return '';
};

export const getThreadDetails = async (accessToken: string, threadId: string) => {
    if (!accessToken) throw new Error("No access token");

    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to fetch thread details');

    const detail = await response.json();
    const messages = detail.messages;
    const lastMsg = messages[messages.length - 1];

    const body = decodeBody(lastMsg.payload);

    return {
        id: detail.id,
        messages: detail.messages,
        lastMessageBody: body,
        snippet: lastMsg.snippet
    };
};
