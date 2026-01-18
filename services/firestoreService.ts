import {
    collection,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    query
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
