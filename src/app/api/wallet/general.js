// pages/api/wallet/virtual-account.js or app/api/wallet/virtual-account/route.js

import { createVirtualAccount } from '@/lib/flutterwaveWalletService';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin (if not already initialized)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// For Next.js 12 and below (pages directory)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify the user's Firebase token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user data from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();
    
    if (!userData.bvn) {
      return res.status(400).json({ message: 'BVN is required' });
    }

    const virtualAccount = await createVirtualAccount(userId, {
      ...userData,
      uid: userId,
      firstName: userData.firstName || decodedToken.name?.split(' ')[0] || 'User',
      lastName: userData.lastName || decodedToken.name?.split(' ')[1] || 'Customer',
      email: decodedToken.email
    });

    res.status(200).json({ success: true, data: virtualAccount });
  } catch (error) {
    console.error('Virtual account creation error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// For Next.js 13+ (app directory)
export async function POST(request) {
  try {
    // Verify the user's Firebase token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];
    
    if (!token) {
      return Response.json({ message: 'No token provided' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user data from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    if (!userData.bvn) {
      return Response.json({ message: 'BVN is required' }, { status: 400 });
    }

    const virtualAccount = await createVirtualAccount(userId, {
      ...userData,
      uid: userId,
      firstName: userData.firstName || decodedToken.name?.split(' ')[0] || 'User',
      lastName: userData.lastName || decodedToken.name?.split(' ')[1] || 'Customer',
      email: decodedToken.email
    });

    return Response.json({ success: true, data: virtualAccount });
  } catch (error) {
    console.error('Virtual account creation error:', error);
    return Response.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// pages/api/wallet/withdraw.js or app/api/wallet/withdraw/route.js

import { initiateWithdrawal } from '@/lib/flutterwaveWalletService';
import { getAuth } from 'firebase-admin/auth';

// For Next.js 12 and below (pages directory)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify the user's Firebase token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { amount, bankDetails } = req.body;

    if (!amount || !bankDetails) {
      return res.status(400).json({ message: 'Amount and bank details are required' });
    }

    const result = await initiateWithdrawal(userId, parseFloat(amount), bankDetails);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// For Next.js 13+ (app directory)
export async function POST(request) {
  try {
    // Verify the user's Firebase token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];
    
    if (!token) {
      return Response.json({ message: 'No token provided' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { amount, bankDetails } = await request.json();

    if (!amount || !bankDetails) {
      return Response.json({ message: 'Amount and bank details are required' }, { status: 400 });
    }

    const result = await initiateWithdrawal(userId, parseFloat(amount), bankDetails);

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return Response.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// pages/api/wallet/banks.js or app/api/wallet/banks/route.js

import { getNigerianBanks } from '@/lib/flutterwaveWalletService';

// For Next.js 12 and below (pages directory)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const banks = await getNigerianBanks();
    res.status(200).json({ success: true, data: banks });
  } catch (error) {
    console.error('Banks fetch error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// For Next.js 13+ (app directory)
export async function GET() {
  try {
    const banks = await getNigerianBanks();
    return Response.json({ success: true, data: banks });
  } catch (error) {
    console.error('Banks fetch error:', error);
    return Response.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// pages/api/wallet/transactions.js or app/api/wallet/transactions/route.js

import { getWalletTransactions } from '@/lib/flutterwaveWalletService';
import { getAuth } from 'firebase-admin/auth';

// For Next.js 12 and below (pages directory)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify the user's Firebase token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const limit = parseInt(req.query.limit) || 50;
    const transactions = await getWalletTransactions(userId, limit);

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// For Next.js 13+ (app directory)
export async function GET(request) {
  try {
    // Verify the user's Firebase token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];
    
    if (!token) {
      return Response.json({ message: 'No token provided' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    
    const transactions = await getWalletTransactions(userId, limit);

    return Response.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return Response.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}