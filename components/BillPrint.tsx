"use client";

import { forwardRef } from 'react';

interface BillItem {
  description: string;
  qty: number;
  rate: number;
  total: number;
  storeName?: string;
}

interface BillData {
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  invoice: {
    number: string;
    date: string;
  };
  customer: {
    name: string;
    phone: string;
  };
  items: BillItem[];
  totals: {
    totalAmount: number;
    discount: number;
    shippingCost: number;
    grandTotal: number;
  };
  notes: {
    paymentMode: {
      payType: string;
    };
    remarks: string;
  };
}

interface BillPrintProps {
  data: BillData;
  format: 'thermal' | 'a4';
}

export const BillPrint = forwardRef<HTMLDivElement, BillPrintProps>(
  ({ data, format }, ref) => {
    const isA4 = format === 'a4';

    return (
      <div
        ref={ref}
        className={`bg-white text-black p-4 ${
          isA4 ? 'max-w-4xl mx-auto' : 'max-w-sm mx-auto text-xs'
        }`}
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header */}
        <div className={`text-center mb-4 ${isA4 ? 'mb-6' : ''}`}>
          <h1 className={`font-bold ${isA4 ? 'text-2xl mb-2' : 'text-sm mb-1'}`}>
            {data.company.name}
          </h1>
          <p className={isA4 ? 'text-sm' : 'text-xs'}>
            {data.company.address}
          </p>
          <p className={isA4 ? 'text-sm' : 'text-xs'}>
            Phone: {data.company.phone} | Email: {data.company.email}
          </p>
        </div>

        <div className="border-t border-b border-black py-2 mb-4">
          <div className={`flex justify-between ${isA4 ? 'text-sm' : 'text-xs'}`}>
            <span>Bill No: {data.invoice.number}</span>
            <span>Date: {new Date(data.invoice.date).toLocaleDateString('en-GB')}</span>
          </div>
          <div className={isA4 ? 'text-sm mt-1' : 'text-xs mt-1'}>
            <p>Customer: {data.customer.name}</p>
            <p>Contact: {data.customer.phone}</p>
          </div>
        </div>

        {/* Items */}
        <div className="mb-4">
          <div className={`border-b border-black pb-1 mb-2 ${isA4 ? 'text-sm' : 'text-xs'}`}>
            <div className="flex justify-between font-bold">
              <span className="flex-1">Item</span>
              <span className="w-12 text-center">Qty</span>
              <span className="w-16 text-right">Rate</span>
              <span className="w-16 text-right">Amount</span>
            </div>
          </div>
          {data.items.map((item, index) => (
            <div key={index} className={`flex justify-between py-1 ${isA4 ? 'text-sm' : 'text-xs'}`}>
              <span className="flex-1 truncate">{item.description}</span>
              <span className="w-12 text-center">{item.qty}</span>
              <span className="w-16 text-right">₹{item.rate.toFixed(2)}</span>
              <span className="w-16 text-right">₹{item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-black pt-2">
          <div className={`space-y-1 ${isA4 ? 'text-sm' : 'text-xs'}`}>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{data.totals.totalAmount.toFixed(2)}</span>
            </div>
            {data.totals.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{data.totals.discount.toFixed(2)}</span>
              </div>
            )}
            {data.totals.shippingCost > 0 && (
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{data.totals.shippingCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-black pt-1">
              <span>Grand Total:</span>
              <span>₹{data.totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className={`mt-4 ${isA4 ? 'text-sm' : 'text-xs'}`}>
          <p>Payment Mode: {data.notes.paymentMode.payType}</p>
          {data.notes.remarks && <p>Remarks: {data.notes.remarks}</p>}
        </div>

        <div className={`text-center mt-6 ${isA4 ? 'text-sm' : 'text-xs'}`}>
          <p>Thank you for visiting!</p>
          <p>Get well soon!</p>
        </div>
      </div>
    );
  }
);

BillPrint.displayName = 'BillPrint';