import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions"; // Keep for config() if needed, or switch to params
import { google } from "googleapis";

admin.initializeApp();
const db = admin.firestore();

// -- types --
interface Interaction {
    id: string;
    type: 'email';
    date: string;
    summary: string;
    sentiment: 'neutral' | 'positive' | 'negative';
}
// -- end types --

/**
 * 1. Store Credentials
 * Client must request 'offline' access and pass the 'code' or tokens here.
 */
export const storeGmailTokens = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in');
    const { refreshToken, accessToken } = request.data; // Fixed typo 'refeshToken'

    // Save strictly to a private sub-collection or field
    await db.doc(`users/${request.auth.uid}/private/gmail_tokens`).set({
        refreshToken: refreshToken,
        accessToken: accessToken, // Optional, short lived
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { success: true };
});

/**
 * 2. Setup Watch (Call once or periodically)
 * Subscribes this URL/Topic to Gmail updates.
 */
export const setupGmailWatch = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in');

    // We need an Access Token to call watch()
    // Either passed from client OR retrieved from storage
    let token = request.data.accessToken;
    if (!token) {
        // Try fetch from DB
        const snap = await db.doc(`users/${request.auth.uid}/private/gmail_tokens`).get();
        token = snap.data()?.accessToken;
    }

    if (!token) throw new HttpsError('failed-precondition', 'No access token available');

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        const res = await gmail.users.watch({
            userId: 'me',
            requestBody: {
                labelIds: ['INBOX'],
                topicName: 'projects/solocrm-ee912/topics/gmail-updates' // Updated from .firebaserc
            }
        });

        // Save historyId to know where to start syncing
        await db.doc(`users/${request.auth.uid}/private/sync_state`).set({
            historyId: res.data.historyId,
            lastSync: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return res.data;
    } catch (error: any) {
        console.error("Watch setup failed", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 3. Pub/Sub Handler
 * Triggered by Google Cloud Pub/Sub when a new email arrives.
 */
export const onGmailPush = onMessagePublished("gmail-updates", async (event) => {
    const data = event.data.message.json;
    if (!data) {
        console.error("No data in PubSub message");
        return;
    }
    const emailAddress = data.emailAddress;
    const historyId = data.historyId;

    if (!emailAddress || !historyId) {
        console.error("Invalid PubSub message", data);
        return;
    }

    // Find user by email (Assuming 1:1 map for now, or query users collection)
    const userQuery = await db.collection('users').where('email', '==', emailAddress).limit(1).get();
    if (userQuery.empty) {
        console.warn(`No user found for email ${emailAddress}`);
        return;
    }
    const userDoc = userQuery.docs[0];
    const uid = userDoc.id;

    await processHistory(uid, historyId);
});

async function processHistory(uid: string, newHistoryId: string) {
    // 1. Get Tokens
    const tokenSnap = await db.doc(`users/${uid}/private/gmail_tokens`).get();
    const tokens = tokenSnap.data();
    if (!tokens || !tokens.refreshToken) {
        console.error(`No refresh token for user ${uid}`);
        return;
    }

    // 2. Auth with Refresh Token
    // Note: functions.config() is v1. For v2, consider strict params or defineSecret. 
    // Keeping functions.config() compatible for now but might need migration if env vars missing.
    const oauth2Client = new google.auth.OAuth2(
        functions.config().google.client_id,
        functions.config().google.client_secret
    );
    oauth2Client.setCredentials({
        refresh_token: tokens.refreshToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 3. Get Start History ID
    const syncStateRef = db.doc(`users/${uid}/private/sync_state`);
    const syncStateSnap = await syncStateRef.get();
    const startHistoryId = syncStateSnap.data()?.historyId;

    if (!startHistoryId) {
        // First run or lost state? Full sync or just update pointer?
        // Safe bet: just update pointer to avoid flooding
        await syncStateRef.set({ historyId: newHistoryId }, { merge: true });
        return;
    }

    // 4. List History
    try {
        const historyRes = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: startHistoryId,
            historyTypes: ['messageAdded']
        });

        const history = historyRes.data.history || [];

        for (const record of history) {
            if (record.messagesAdded) {
                for (const msg of record.messagesAdded) {
                    if (msg.message && msg.message.id) {
                        await processSingleMessage(uid, gmail, msg.message.id);
                    }
                }
            }
        }

        // Update History ID
        await syncStateRef.set({ historyId: newHistoryId, lastSync: new Date() }, { merge: true });

    } catch (e) {
        console.error("Sync failed", e);
    }
}

async function processSingleMessage(uid: string, gmail: any, messageId: string) {
    // Fetch full details
    const res = await gmail.users.messages.get({ userId: 'me', id: messageId });
    const msg = res.data;

    // Parse Headers
    const headers = msg.payload.headers;
    const fromHeader = headers.find((h: any) => h.name === 'From')?.value || '';
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';

    // Extract Email
    const emailMatch = fromHeader.match(/<([^>]+)>/);
    const email = emailMatch ? emailMatch[1] : fromHeader;
    const name = fromHeader.includes('<') ? fromHeader.split('<')[0].trim().replace(/^"|"$/g, '') : fromHeader;

    // Check Filter (Ignore sent messages? or specific labels?)
    // If 'SENT' label is present, maybe ignore or log as sent?
    const labelIds = msg.labelIds || [];
    if (labelIds.includes('SENT')) return; // Ignore own emails for now? User said "Incoming"

    // Search Contact
    const contactsRef = db.collection(`users/${uid}/contacts`);
    const q = await contactsRef.where('email', '==', email).limit(1).get();

    if (!q.empty) {
        // ASSOCIATE
        const contactDoc = q.docs[0];
        const newInteraction: Interaction = {
            id: `email-${messageId}`,
            type: 'email',
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            summary: `Received: ${subject}`,
            sentiment: 'neutral'
        };

        // Standard Firestore Array Union
        await contactDoc.ref.update({
            interactions: admin.firestore.FieldValue.arrayUnion(newInteraction),
            lastInteractionDate: new Date().toISOString().split('T')[0],
            // Maybe bump stage/score?
        });
        console.log(`Associated email ${messageId} to contact ${contactDoc.id}`);
    } else {
        // TRIAGE
        await db.collection(`users/${uid}/inbox_triage`).doc(messageId).set({
            id: messageId,
            from: name,
            email: email,
            subject: subject,
            snippet: msg.snippet,
            date: new Date().toISOString(), // Full date for sorting
            status: 'pending'
        });
        console.log(`Added email ${messageId} to triage`);
    }
}
