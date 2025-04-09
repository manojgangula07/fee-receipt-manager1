import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReceiptTemplate } from './ReceiptTemplate';
import { generateReceiptPDF } from '@/lib/pdf';

interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    receipt: any;
    items: any[];
    student: any;
  } | null;
}

export function ReceiptPreview({ isOpen, onClose, receiptData }: ReceiptPreviewProps) {
  if (!receiptData) return null;
  
  const { receipt, items, student } = receiptData;
  
  const handlePrint = () => {
    const doc = generateReceiptPDF(receipt, student, items);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };
  
  const handleDownload = () => {
    const doc = generateReceiptPDF(receipt, student, items);
    doc.save(`Receipt_${receipt.receiptNumber}.pdf`);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Fee Receipt Preview</DialogTitle>
          <DialogDescription>
            Review the fee receipt before printing or saving. When printed, the receipt will include both school and student copies on a single page with a perforation line for easy separation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <ReceiptTemplate
            receipt={receipt}
            student={student}
            items={items}
            onPrint={handlePrint}
            onDownload={handleDownload}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReceiptPreview;
