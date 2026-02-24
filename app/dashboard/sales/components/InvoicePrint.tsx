import { getAssetUrl } from "@/lib/asset-utils";

export const printSalesInvoice = async (
  saleId: string,
  printType: "a4" | "thermal" = "a4",
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
) => {
  try {
    const response = await authFetch(`/api/sales/bills/${saleId}/invoice`);
    const result = await response.json();

    if (result.success) {
      const invoiceHtml = generateInvoiceHtml(result.data, printType, getAssetUrl);
      
      // Create hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(invoiceHtml);
        iframeDoc.close();
        
        // Wait for content to load then print
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (printError) {
              console.error('Print operation failed:', printError);
            }
          }
        }, 1000);
        
        // Cleanup iframe after print dialog closes
        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          } catch (cleanupError) {
            console.error('Iframe cleanup failed:', cleanupError);
          }
        }, 10000);
      } else {
        // Cleanup failed iframe
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }
    } else {
      throw new Error(result.message || "Failed to fetch invoice data");
    }
  } catch (error) {
    throw error;
  }
};

const generateInvoiceHtml = (
  data: any,
  printType: "a4" | "thermal",
  getAssetUrl: (url: string) => string
) => {
  const { company, invoice, customer, items, totals, notes } = data;
  const isA4 = printType === "a4";
  const pageWidth = isA4 ? "210mm" : "80mm";
  const fontSize = isA4 ? "12px" : "10px";
  const headerSize = isA4 ? "18px" : "14px";

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Invoice - ${invoice.number}</title>
    <style>
        @page {
            size: ${isA4 ? "A4" : "80mm auto"};
            margin: ${isA4 ? "8mm" : "3mm"};
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: ${fontSize};
            line-height: 1.4;
            color: #333;
            width: ${pageWidth};
            padding: ${isA4 ? "10px" : "10px"};
            margin-top: ${isA4 ? "0" : "auto"};
            ${!isA4 ? "margin: 0 auto;" : ""}
        }
        .invoice-header {
            display: ${isA4 ? "flex" : "block"};
            ${isA4 ? "justify-content: space-between; align-items: flex-start;" : "text-align: center;"}
            margin-bottom: ${isA4 ? "10px" : "8px"};
            border-bottom: ${isA4 ? "2px" : "1px"} solid #333;
            padding: ${isA4 ? "5px 10px" : "4px 2px"};
        }
        .company-logo {
            max-width: ${isA4 ? "100px" : "40px"};
            max-height: ${isA4 ? "60px" : "25px"};
            margin-bottom: ${isA4 ? "0" : "3px"};
            display: block;
            object-fit: contain;
            ${isA4 ? "flex-shrink: 0;" : ""}
        }
        .company-info {
            ${isA4 ? "flex: 1; text-align: left;" : "text-align: center;"}
        }
        .company-name {
            font-size: ${headerSize};
            font-weight: bold;
            margin-bottom: ${isA4 ? "4px" : "4px"};
        }
        .company-details {
            font-size: ${isA4 ? "10px" : "7px"};
            line-height: ${isA4 ? "1.2" : "1.1"};
        }
        .invoice-title {
            font-size: ${isA4 ? "16px" : "10px"};
            font-weight: bold;
            text-align: center;
            margin: ${isA4 ? "10px 0" : "5px 0"};
            text-transform: uppercase;
        }
        .invoice-info {
            display: ${isA4 ? "flex" : "block"};
            justify-content: space-between;
            margin-bottom: ${isA4 ? "15px" : "8px"};
            padding: ${isA4 ? "10px" : "4px 2px"};
            gap: ${isA4 ? "20px" : "0"};
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .info-section {
            ${isA4 ? "flex: 1;" : "margin-bottom: 5px;"}
        }
        .info-title {
            font-weight: bold;
            margin-bottom: ${isA4 ? "8px" : "2px"};
            text-decoration: underline;
            font-size: ${isA4 ? "inherit" : "8px"};
        }
        .info-row {
            display: ${isA4 ? "flex" : "block"};
            justify-content: space-between;
            margin-bottom: ${isA4 ? "4px" : "1px"};
            font-size: ${isA4 ? "inherit" : "7px"};
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: ${isA4 ? "20px" : "8px"};
        }
        .items-table th,
        .items-table td {
            border: 1px solid #333;
            padding: ${isA4 ? "6px 4px" : "3px 2px"};
            text-align: left;
            font-size: ${isA4 ? "10px" : "8px"};
            word-wrap: break-word;
            word-break: break-word;
            vertical-align: top;
        }
        .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals-section {
            margin-top: ${isA4 ? "25px" : "8px"};
            border-top: ${isA4 ? "2px" : "1px"} solid #333;
            padding: ${isA4 ? "20px 15px" : "6px 2px"};
            background-color: ${isA4 ? "#f9f9f9" : "transparent"};
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: ${isA4 ? "6px" : "2px"};
            font-size: ${isA4 ? "inherit" : "8px"};
        }
        .grand-total {
            font-weight: bold;
            font-size: ${isA4 ? "14px" : "11px"};
            border-top: 1px solid #333;
            padding-top: ${isA4 ? "8px" : "4px"};
            margin-top: ${isA4 ? "8px" : "4px"};
        }
        .amount-words {
            margin-top: ${isA4 ? "15px" : "6px"};
            font-style: italic;
            font-size: ${isA4 ? "11px" : "7px"};
        }
        .footer {
            margin-top: ${isA4 ? "35px" : "18px"};
            text-align: center;
            font-size: ${isA4 ? "10px" : "8px"};
            padding: ${isA4 ? "15px" : "8px"};
            border-top: 1px solid #ddd;
        }
        .signature {
            margin-top: ${isA4 ? "40px" : "20px"};
            text-align: right;
        }
        .signature img {
            max-width: ${isA4 ? "100px" : "60px"};
            max-height: ${isA4 ? "50px" : "30px"};
        }
        .notes {
            margin-top: ${isA4 ? "25px" : "8px"};
            font-size: ${isA4 ? "10px" : "7px"};
            padding: ${isA4 ? "15px" : "4px 2px"};
            background-color: ${isA4 ? "#f5f5f5" : "transparent"};
            border-radius: 4px;
        }
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="company-info">
            <div class="company-name">${company.name}</div>
            <div class="company-details">
                ${company.address}<br>
                Phone: ${company.phone} | Email: ${company.email}<br>
                ${company.gst ? `GST: ${company.gst}` : ""} ${company.pan ? `| PAN: ${company.pan}` : ""}
            </div>
        </div>
        ${company.logo ? `<img src="${getAssetUrl(company.logo)}" alt="Company Logo" class="company-logo" onerror="this.style.display='none'">` : ""}
    </div>

    <div class="invoice-title">Sales Invoice</div>

    <div class="invoice-info">
        <div class="info-section">
            <div class="info-title">Invoice Details</div>
            <div class="info-row">
                <span>Invoice No:</span>
                <span><strong>${invoice.number}</strong></span>
            </div>
            <div class="info-row">
                <span>Invoice Date & Time:</span>
                <span>${new Date(invoice.createdAt).toLocaleDateString()} ${new Date(invoice.createdAt).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="info-row">
                <span>Due Date:</span>
                <span>${new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
            ${data.doctor ? `
            <div class="info-row">
                <span>Doctor:</span>
                <span><strong>${data.doctor.name}</strong></span>
            </div>` : ""}
        </div>
        
        <div class="info-section">
            <div class="info-title">Customer Details</div>
            <div class="info-row">
                <span>Name:</span>
                <span><strong>${customer.name}</strong></span>
            </div>
            <div class="info-row">
                <span>Address:</span>
                <span>${customer.address}</span>
            </div>
            <div class="info-row">
                <span>Phone:</span>
                <span>${customer.phone}</span>
            </div>
            ${customer.age ? `
            <div class="info-row">
                <span>Age:</span>
                <span>${customer.age}</span>
            </div>` : ""}
            ${customer.email ? `
            <div class="info-row">
                <span>Email:</span>
                <span>${customer.email}</span>
            </div>` : ""}
            ${customer.gst ? `
            <div class="info-row">
                <span>GST:</span>
                <span>${customer.gst}</span>
            </div>` : ""}
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Sr.</th>
                <th style="min-width: ${isA4 ? "120px" : "30px"};">Description</th>
                ${isA4 ? "<th>HSN/SAC</th>" : ""}
                <th>Qty</th>
                <th>Rate</th>
                ${isA4 ? "<th>Amount</th>" : ""}
                ${isA4 ? `
                ${items.some((item: any) => !item.is_igst) ? "<th>CGST</th><th>SGST</th>" : ""}
                ${items.some((item: any) => item.is_igst) ? "<th>IGST</th>" : ""}
                ` : "<th>Tax</th>"}
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item: any) => `
            <tr>
                <td class="text-center">${item.srNo}</td>
                <td style="max-width: ${isA4 ? "120px" : "30px"}; word-wrap: break-word; white-space: normal;">${item.description}</td>
                ${isA4 ? `<td class="text-center">${item.hsnSac || '-'}</td>` : ""}
                <td class="text-center">${item.qty}</td>
                <td class="text-right">₹${(item.rate || 0).toFixed(2)}</td>
                ${isA4 ? `<td class="text-right">₹${(item.subtotal || 0).toFixed(2)}</td>` : ""}
                ${isA4 ? `
                ${!item.is_igst ? `
                <td class="text-right">₹${((item.subtotal || 0) * (item.cgstPercent || 0) / 100).toFixed(2)}${item.cgstPercent ? `(${item.cgstPercent}%)` : ''}</td>
                <td class="text-right">₹${((item.subtotal || 0) * (item.sgstPercent || 0) / 100).toFixed(2)}${item.sgstPercent ? `(${item.sgstPercent}%)` : ''}</td>
                ` : ""}
                ${item.is_igst ? `
                <td class="text-right">₹${((item.subtotal || 0) * (item.igstPercent || 0) / 100).toFixed(2)}${item.igstPercent ? `(${item.igstPercent}%)` : ''}</td>
                ` : ""}
                ` : `
                <td class="text-right">₹${item.is_igst ? ((item.subtotal || 0) * (item.igstPercent || 0) / 100).toFixed(2) : (((item.subtotal || 0) * (item.cgstPercent || 0) / 100) + ((item.subtotal || 0) * (item.sgstPercent || 0) / 100)).toFixed(2)}${item.is_igst ? (item.igstPercent ? `(${item.igstPercent}%)` : '') : ((item.cgstPercent || item.sgstPercent) ? `(${(item.cgstPercent || 0) + (item.sgstPercent || 0)}%)` : '')}</td>
                `}
                <td class="text-right"><strong>₹${(item.total || 0).toFixed(2)}</strong></td>
            </tr>
            `).join("")}
        </tbody>
    </table>

    <div class="totals-section">
        <div class="total-row">
            <span>Total Amount:</span>
            <span>₹${(totals.totalAmount || 0).toFixed(2)}</span>
        </div>

        ${(totals.cgst || 0) > 0 ? `
        <div class="total-row">
            <span>CGST:</span>
            <span>₹${(totals.cgst || 0).toFixed(2)}</span>
        </div>` : ""}
        ${(totals.sgst || 0) > 0 ? `
        <div class="total-row">
            <span>SGST:</span>
            <span>₹${(totals.sgst || 0).toFixed(2)}</span>
        </div>` : ""}
        ${(totals.igst || 0) > 0 ? `
        <div class="total-row">
            <span>IGST:</span>
            <span>₹${(totals.igst || 0).toFixed(2)}</span>
        </div>` : ""}
        ${(totals.shippingCost || 0) > 0 ? `
        <div class="total-row">
            <span>Shipping Cost:</span>
            <span>₹${(totals.shippingCost || 0).toFixed(2)}</span>
        </div>` : ""}
        ${(totals.tds || 0) > 0 ? `
        <div class="total-row">
            <span>TDS:</span>
            <span>₹${(totals.tds || 0).toFixed(2)}</span>
        </div>` : ""}
         ${(totals.payment_charge || 0) > 0 ? `
        <div class="total-row">
            <span>Convenience charge:</span>
            <span>₹${(totals.payment_charge || 0).toFixed(2)}</span>
        </div>` : ""}

         ${(totals.discount || 0) > 0 ? `
        <div class="total-row">
            <span>Discount:</span>
            <span>- ₹${(totals.discount || 0).toFixed(2)}</span>
        </div>` : ""}
        
        <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹${(totals.grandTotal || 0).toFixed(2)}</span>
        </div>
        
        <div class="amount-words">
            <strong>Amount in Words:</strong> ${totals.amountInWords}
        </div>
    </div>

    <div class="notes">
        <div><strong>Payment Mode:</strong> ${notes.paymentMode}</div>
        ${notes.terms ? `<div style="margin-top: 10px;"><strong>Terms & Conditions:</strong><br>${notes.terms}</div>` : ""}
        ${notes.remarks ? `<div style="margin-top: 5px;"><strong>Remarks:</strong> ${notes.remarks}</div>` : ""}
        <div style="margin-top: 10px; font-size: 9px;">${notes.reverseCharge}</div>
    </div>

    ${isA4 && company.bankName ? `
    <div class="footer">
        <div><strong>Bank Details:</strong></div>
        <div>Bank: ${company.bankName} | A/C: ${company.accountNo}</div>
        <div>IFSC: ${company.ifsc} | Beneficiary: ${company.beneficiaryName}</div>
    </div>` : ""}

    ${company.signature ? `
    <div class="signature">
        <div>Authorized Signature</div>
        <img src="${getAssetUrl(company.signature)}" alt="Signature" onerror="this.style.display='none'">
    </div>` : ""}

</body>
</html>`;
};