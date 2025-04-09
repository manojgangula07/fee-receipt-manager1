import React, { useState } from 'react';
import { ReceiptForm } from '@/components/receipt/ReceiptForm';
import { ReceiptPreview } from '@/components/receipt/ReceiptPreview';
import { RecentReceipts } from '@/components/receipt/RecentReceipts';
import { useQuery } from '@tanstack/react-query';

export default function GenerateReceipt() {
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: recentReceipts, refetch: refetchReceipts } = useQuery({
    queryKey: ['/api/receipts?limit=5'],
  });

  const handleReceiptGenerated = (data: any) => {
    setReceiptData(data);
    setIsPreviewOpen(true);
    refetchReceipts();
  };

  return (
    <div className="space-y-8">
      <ReceiptForm onReceiptGenerated={handleReceiptGenerated} />
      
      {recentReceipts && (
        <RecentReceipts 
          receipts={recentReceipts} 
          title="Recent Fee Receipts" 
          description="View and manage recently generated receipts." 
        />
      )}
      
      <ReceiptPreview 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        receiptData={receiptData}
      />
    </div>
  );
}
