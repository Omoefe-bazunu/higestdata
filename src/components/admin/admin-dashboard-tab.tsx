'use client';

import { useState, useEffect } from 'react';
import { getFlaggedTransactions } from '@/lib/data';
import type { FlaggedTransaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'Pending Review': return 'destructive';
        case 'Resolved': return 'default';
        case 'Dismissed': return 'secondary';
        default: return 'outline';
    }
}

export default function AdminDashboardTab() {
  const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getFlaggedTransactions();
      setTransactions(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'Resolved' | 'Dismissed') => {
    setUpdatingId(id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, status } : tx));
    setUpdatingId(null);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Flagged Gift Card Transactions</CardTitle>
        <CardDescription>Transactions flagged by the AI for manual review.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Reason for Flag</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <div className="font-medium">{tx.user.name}</div>
                  <div className="text-sm text-muted-foreground">{tx.user.email}</div>
                </TableCell>
                <TableCell>{tx.details}</TableCell>
                <TableCell className="max-w-xs truncate">{tx.reason}</TableCell>
                <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(tx.status)}>{tx.status}</Badge>
                </TableCell>
                <TableCell>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost" disabled={updatingId === tx.id}>
                        {updatingId === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, 'Resolved')}>Approve & Resolve</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, 'Dismissed')}>Dismiss Flag</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
