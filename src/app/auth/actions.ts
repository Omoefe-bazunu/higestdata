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

/**
 * Checks if a user is an admin by verifying their email against a list in Firestore.
 * @param email The user's email to check.
 * @returns A promise that resolves to true if the user is an admin, false otherwise.
 */
async function isAdmin(email: string): Promise<boolean> {
  // If the admin database isn't configured, no one can be an admin.
  if (!adminDb) {
    return false;
  }

  try {
    // Your logic: Look in 'admin' collection for a document with ID 'user'.
    const adminDocRef = adminDb.collection('admin').doc('user');
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists) {
      console.warn("Admin definition document 'admin/user' not found in Firestore.");
      return false;
    }

    // Your logic: Check for an array field named 'email'.
    const adminData = adminDoc.data();
    const adminEmails = adminData?.email || [];
    
    // Your logic: Check if the user's email is in that array.
    return Array.isArray(adminEmails) && adminEmails.includes(email);

  } catch (error) {
    console.error("Error while checking admin status:", error);
    // For security, if anything goes wrong, default to not being an admin.
    return false;
  }
}


export async function signUp(values: z.infer<typeof signUpSchema>) {
  const validatedFields = signUpSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' };
  }

  const { email, password } = validatedFields.data;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create session with default 'user' role.
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
        
        // Use our simple, clear function to check if the user is an admin.
        const userIsAdmin = await isAdmin(user.email!);
        const role = userIsAdmin ? 'admin' : 'user';
        
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
