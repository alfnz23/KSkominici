import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SendPassportPackageProps {
  jobId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function SendPassportPackage({ jobId, onSuccess, onError }: SendPassportPackageProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendPackage = async () => {
    if (!jobId) {
      onError?.('Job ID is required');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/send_passport_package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send passport package');
      }

      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Passport Package</CardTitle>
        <CardDescription>
          Send the completed passport package to the customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleSendPackage}
          disabled={isLoading || !jobId}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Passport Package'}
        </Button>
      </CardContent>
    </Card>
  );
}