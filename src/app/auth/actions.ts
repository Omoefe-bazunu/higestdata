'use server';

import { z } from 'zod';
import { auth } from '@/lib/firebase/config';
import { adminAuth } from '@/lib/firebase/server';
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

    // Here you can set a default role for new users if needed.
    // For now, we'll just create a session.
    await createSession(user.uid);
    
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
        
        // Check for admin role
        const token = await adminAuth.createCustomToken(user.uid);
        const decodedToken = await adminAuth.verifyIdToken(await user.getIdToken());
        const role = decodedToken.role || 'user';

        await createSession(user.uid, role as string);

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
