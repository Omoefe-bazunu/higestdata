'use server';

import { z } from 'zod';
import { auth } from '@/lib/firebase/config';
import { adminDb } from '@/lib/firebase/server';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
});

export async function signUp(values: z.infer<typeof signUpSchema>) {
  const validatedFields = signUpSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' };
  }

  const { email, password } = validatedFields.data;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create session with default 'user' role. Pass email to session.
    await createSession(user.uid, user.email!, 'user');
    
  } catch (error: any) {
    console.error('SIGN UP ERROR:', error);
    if (error.code === 'auth/email-already-in-use') {
        return { error: 'An account with this email already exists.' };
    }
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  redirect('/');
}

export async function signIn(values: z.infer<typeof signInSchema>) {
    const validatedFields = signInSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" }
    }

    const { email, password } = validatedFields.data;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        let role = 'user'; // Default role

        // Check if user is an admin from Firestore
        if (adminDb) {
            try {
                // Check a document in the 'admin' collection with ID 'user'.
                // This document is expected to have an array field 'email'.
                const adminRef = adminDb.collection('admin').doc('user');
                const adminDoc = await adminRef.get();
                if (adminDoc.exists) {
                    const adminEmails = adminDoc.data()?.email || [];
                    if (Array.isArray(adminEmails) && adminEmails.includes(user.email!)) {
                        role = 'admin';
                    }
                } else {
                    console.log("Admin config document ('admin/user') not found. No users will be granted admin access.");
                }
            } catch (err) {
                console.error("Firestore admin check failed:", err);
                // Fail safe to user role if there's an error.
            }
        }
        
        await createSession(user.uid, user.email!, role);

    } catch (error: any) {
        console.error('SIGN IN ERROR:', error);
        if (error.code === 'auth/invalid-credential') {
             return { error: "Invalid email or password." }
        }
        return { error: "An unexpected error occurred. Please try again." };
    }
    
    revalidatePath('/', 'layout');
    redirect('/');
}

export async function signOut() {
    await deleteSession();
    redirect('/auth/signin');
}
