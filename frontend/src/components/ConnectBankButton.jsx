import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useApp } from '../store/AppContext';
import { Button } from './ui';
import { Building2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ConnectBankButton({ className = '', variant = 'primary', size = 'md' }) {
  const { API_URL, fetchBankConnections, fetchBankAccounts, addToast } = useApp();
  const [linkToken, setLinkToken] = useState(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [isFetchingToken, setIsFetchingToken] = useState(false);

  // 1. Fetch the temporary link_token from our backend
  const generateLinkToken = useCallback(async () => {
    setIsFetchingToken(true);
    try {
      const response = await fetch(`${API_URL}/bank/link/token`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setLinkToken(data.data.linkToken);
      } else {
        throw new Error(data.message || 'Failed to generate link token');
      }
    } catch (err) {
      addToast({ title: 'Connection Error', message: err.message, type: 'error' });
    } finally {
      setIsFetchingToken(false);
    }
  }, [API_URL, addToast]);

  // Fetch token automatically when component mounts so the button is ready
  useEffect(() => {
    generateLinkToken();
  }, [generateLinkToken]);

  // 2. Handle the successful bank login callback from Plaid
  const onSuccess = useCallback(async (publicToken, metadata) => {
    setIsExchanging(true);
    try {
      // 3. Send the public token to our backend to securely exchange and save it
      const response = await fetch(`${API_URL}/bank/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          publicToken,
          bankName: metadata?.institution?.name || 'Unknown Bank',
          institutionId: metadata?.institution?.institution_id || null
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        addToast({ 
          title: 'Bank Connected!', 
          message: `Successfully linked ${data.data.accountsConnected} accounts.`, 
          type: 'success' 
        });
        // 4. Refresh our app's global state to show the new data
        fetchBankConnections();
        fetchBankAccounts();
      } else {
        throw new Error(data.message || 'Failed to link bank');
      }
    } catch (err) {
      addToast({ title: 'Exchange Error', message: err.message, type: 'error' });
    } finally {
      setIsExchanging(false);
    }
  }, [API_URL, addToast, fetchBankConnections, fetchBankAccounts]);

  // Configure the Plaid Link React hook
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <Button 
      onClick={() => open()} 
      disabled={!ready || isExchanging || isFetchingToken || !linkToken}
      variant={variant}
      size={size}
      className={cn('gap-2 whitespace-nowrap flex-shrink-0 cursor-pointer font-bold', className)}
    >
      {(isExchanging || isFetchingToken) ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        <Building2 className="w-4 h-4 shrink-0" />
      )}
      Connect Bank
    </Button>
  );
}
