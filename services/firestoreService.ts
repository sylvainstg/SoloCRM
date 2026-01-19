import {
    collection,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    query,
    arrayUnion
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Contact } from '../types';

export const subscribeToContacts = (userId: string, onUpdate: (contacts: Contact[]) => void) => {
    if (!userId) return () => { };

    const contactsRef = collection(db, 'users', userId, 'contacts');
    const q = query(contactsRef);

    return onSnapshot(q, (snapshot) => {
        const contacts: Contact[] = [];
        snapshot.forEach((doc) => {
            contacts.push(doc.data() as Contact);
        });
        onUpdate(contacts);
    });
};

export const updateContactStage = async (userId: string, contactId: string, stage: string) => {
    if (!userId) return;
    const contactRef = doc(db, 'users', userId, 'contacts', contactId);
    await updateDoc(contactRef, {
        stage,
        stageLastUpdated: new Date().toISOString()
    });
};

export const addContact = async (userId: string, contact: Contact) => {
    if (!userId) return;

    let contactRef;
    let contactId = contact.id;

    if (!contactId) {
        contactRef = doc(collection(db, 'users', userId, 'contacts'));
        contactId = contactRef.id;
    } else {
        contactRef = doc(db, 'users', userId, 'contacts', contactId);
    }

    const now = new Date().toISOString();

    await setDoc(contactRef, {
        ...contact,
        id: contactId,
        createdAt: contact.createdAt || now,
        stageLastUpdated: contact.stageLastUpdated || now
    });
};

export const seedInitialContacts = async (userId: string, initialContacts: Contact[]) => {
    if (!userId) return;
    for (const contact of initialContacts) {
        await addContact(userId, contact);
    }
};

export const updateContact = async (userId: string, contactId: string, data: Partial<Contact>) => {
    if (!userId) return;
    const contactRef = doc(db, 'users', userId, 'contacts', contactId);
    await updateDoc(contactRef, data);
};

export const addInteraction = async (userId: string, contactId: string, interaction: any) => {
    if (!userId) return;
    const contactRef = doc(db, 'users', userId, 'contacts', contactId);
    // Use arrayUnion to add to the list
    await updateDoc(contactRef, {
        interactions: arrayUnion(interaction),
        lastInteractionDate: interaction.date
    });
};

export const ignoreSender = async (userId: string, email: string) => {
    if (!userId || !email) return;
    // We use a subcollection 'ignored' where the doc ID is the email
    // This makes checking easy and ensures uniqueness
    const ignoredRef = doc(db, 'users', userId, 'ignored', email);
    await setDoc(ignoredRef, { email, date: new Date().toISOString() });
};

export const unignoreSender = async (userId: string, email: string) => {
    if (!userId || !email) return;
    const ignoredRef = doc(db, 'users', userId, 'ignored', email);
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(ignoredRef);
};

export const subscribeToIgnored = (userId: string, onUpdate: (emails: string[]) => void) => {
    if (!userId) return () => { };
    const ignoredRef = collection(db, 'users', userId, 'ignored');

    // Subscribe to the ignored collection
    return onSnapshot(ignoredRef, (snapshot) => {
        const emails: string[] = [];
        snapshot.forEach((doc) => {
            // Either use doc.id (which is the email) or doc.data().email
            emails.push(doc.id);
        });
        onUpdate(emails);
    });
};

export const updateUserSetting = async (userId: string, key: string, value: any) => {
    if (!userId) return;
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
    // Using setDoc with merge: true to effectively create or update
    await setDoc(settingsRef, { [key]: value }, { merge: true });
};

export const subscribeToSettings = (userId: string, onUpdate: (settings: any) => void) => {
    if (!userId) return () => { };
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
    return onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            onUpdate(doc.data());
        } else {
            onUpdate({});
        }
    });
};

export const subscribeToTriage = (userId: string, onUpdate: (items: any[]) => void) => {
    if (!userId) return () => { };
    const triageRef = collection(db, 'users', userId, 'inbox_triage');

    // Sort by date desc (if index exists) or client side sort
    return onSnapshot(triageRef, (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((doc) => {
            items.push(doc.data());
        });
        // Sort descending
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(items);
    });
};

export const deleteTriageItem = async (userId: string, itemId: string) => {
    if (!userId) return;
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', userId, 'inbox_triage', itemId));
};

export const createContactFromTriage = async (userId: string, contact: Contact, triageItemId: string) => {
    if (!userId) return;

    // 1. Create Contact
    await addContact(userId, contact);

    // 2. Delete from Triage
    await deleteTriageItem(userId, triageItemId);
};
