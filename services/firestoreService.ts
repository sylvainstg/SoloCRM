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
    await updateDoc(contactRef, { stage });
};

export const addContact = async (userId: string, contact: Contact) => {
    if (!userId) return;
    const contactRef = doc(db, 'users', userId, 'contacts', contact.id);
    await setDoc(contactRef, contact);
};

export const seedInitialContacts = async (userId: string, initialContacts: Contact[]) => {
    if (!userId) return;
    for (const contact of initialContacts) {
        await addContact(userId, contact);
    }
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
