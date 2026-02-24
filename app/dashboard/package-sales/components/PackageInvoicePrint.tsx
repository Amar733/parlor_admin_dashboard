import { getAssetUrl } from "@/lib/asset-utils";

export const printPackageInvoice = async (
  saleId: string,
  printType: "a4" | "thermal" = "a4",
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
) => {
  try {
    const response = await authFetch(`/api/packages/subscriptions/${saleId}/invoice`);
    const result = await response.json();

    if (result.success) {
      const invoiceHtml = generatePackageInvoiceHtml(result.data, printType, getAssetUrl);
      
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
        
        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          } catch (cleanupError) {
            console.error('Iframe cleanup failed:', cleanupError);
          }
        }, 10000);
      }
    } else {
      throw new Error(result.message || "Failed to fetch package invoice data");
    }
  } catch (error) {
    throw error;
  }
};

const generatePackageInvoiceHtml = (
  data: any,
  printType: "a4" | "thermal",
  getAssetUrl: (url: string) => string
) => {
  const { company, invoice, customer, doctor, package: pkg, payment, installments, notes } = data;
  const isA4 = printType === "a4";
  const pageWidth = isA4 ? "210mm" : "80mm";
  const fontSize = isA4 ? "12px" : "10px";
  const headerSize = isA4 ? "18px" : "14px";

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Package Invoice - ${invoice.number}</title>
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
            margin-bottom: ${isA4 ? "8px" : "6px"};
            border-bottom: ${isA4 ? "2px" : "1px"} solid #333;
            padding: ${isA4 ? "4px 8px" : "3px 2px"};
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
            margin: ${isA4 ? "8px 0" : "4px 0"};
            text-transform: uppercase;
        }
        .invoice-info {
            display: ${isA4 ? "flex" : "block"};
            justify-content: space-between;
            margin-bottom: ${isA4 ? "12px" : "6px"};
            padding: ${isA4 ? "8px" : "3px 2px"};
            gap: ${isA4 ? "15px" : "0"};
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
        .package-details {
            margin-bottom: ${isA4 ? "15px" : "8px"};
            border: 1px solid #333;
            border-radius: 4px;
        }
        .package-header {
            background-color: #f0f0f0;
            padding: ${isA4 ? "10px" : "6px"};
            font-weight: bold;
            border-bottom: 1px solid #333;
        }
        .package-content {
            padding: ${isA4 ? "10px" : "6px"};
        }
        .payment-section {
            margin-top: ${isA4 ? "15px" : "8px"};
            border: 1px solid #333;
            border-radius: 4px;
        }
        .payment-header {
            background-color: #f0f0f0;
            padding: ${isA4 ? "10px" : "6px"};
            font-weight: bold;
            border-bottom: 1px solid #333;
        }
        .payment-content {
            padding: ${isA4 ? "10px" : "6px"};
        }
        .installment-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: ${isA4 ? "10px" : "6px"};
        }
        .installment-table th,
        .installment-table td {
            border: 1px solid #ddd;
            padding: ${isA4 ? "6px" : "3px"};
            text-align: left;
            font-size: ${isA4 ? "9px" : "7px"};
        }
        .installment-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals-section {
            margin-top: ${isA4 ? "15px" : "6px"};
            border-top: ${isA4 ? "2px" : "1px"} solid #333;
            padding: ${isA4 ? "12px 10px" : "5px 2px"};
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
        .footer {
            margin-top: ${isA4 ? "15px" : "10px"};
            text-align: center;
            font-size: ${isA4 ? "10px" : "8px"};
            padding: ${isA4 ? "8px" : "5px"};
            border-top: 1px solid #ddd;
        }
        .signature {
            margin-top: ${isA4 ? "15px" : "10px"};
            text-align: right;
        }
        .signature img {
            max-width: ${isA4 ? "100px" : "60px"};
            max-height: ${isA4 ? "50px" : "30px"};
        }
        .status-badge {
            display: inline-block;
            padding: ${isA4 ? "4px 8px" : "2px 4px"};
            border-radius: 4px;
            font-size: ${isA4 ? "10px" : "8px"};
            font-weight: bold;
        }
        .status-paid {
            background-color: #d4edda;
            color: #155724;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-overdue {
            background-color: #f8d7da;
            color: #721c24;
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

    <div class="invoice-title">Package Invoice</div>

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
                <span>Status:</span>
                <span class="status-badge status-${data.status?.subscriptionStatus || 'pending'}">${(data.status?.subscriptionStatus || 'pending').toUpperCase()}</span>
            </div>
            ${doctor ? `
            <div class="info-row">
                <span>Doctor:</span>
                <span><strong>${doctor.name}</strong></span>
            </div>` : ""}
        </div>
        
        <div class="info-section">
            <div class="info-title">Customer Details</div>
            <div class="info-row">
                <span>Name:</span>
                <span><strong>${customer.name}</strong></span>
            </div>
            <div class="info-row">
                <span>Phone:</span>
                <span>${customer.phone}</span>
            </div>
            ${customer.address ? `
            <div class="info-row">
                <span>Address:</span>
                <span>${customer.address}</span>
            </div>` : ""}
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
        </div>
    </div>

    <div class="package-details">
        <div class="package-header">Package Details</div>
        <div class="package-content">
            <div class="info-row">
                <span>Package Name:</span>
                <span><strong>${pkg.name}</strong></span>
            </div>
            ${pkg.description ? `
            <div style="margin-top: 10px;">
                <strong>Description:</strong><br>
                <div style="margin-top: 5px; font-size: ${isA4 ? '10px' : '8px'};">${pkg.description}</div>
            </div>` : ""}
            ${pkg.services && pkg.services.length > 0 ? `
            <div style="margin-top: 10px;">
                <strong>Included Services:</strong><br>
                ${pkg.services.map((service: any, index: number) => `
                <div style="margin-top: 3px; font-size: ${isA4 ? '10px' : '8px'};">• ${service.productName}</div>
                `).join("")}
            </div>` : ""}
        </div>
    </div>

    <div class="payment-section">
        <div class="payment-header">Payment Details</div>
        <div class="payment-content">

            
            ${payment.paymentModes && payment.paymentModes.length > 0 && !installments?.length ? `
            ${payment.paymentModes.map((pm: any) => `
            <div class="info-row">
                <span>${pm.type}:</span>
                <span><strong>₹${pm.amount.toFixed(2)}</strong></span>
            </div>
            `).join("")}
            ` : ""}
            
            ${installments && installments.length > 0 ? `
            <div style="margin-top: 8px;">
                <strong>Paid Amount:</strong> ${payment.paymentModes.map((pm: any) => `${pm.type}: ₹${pm.amount.toFixed(2)}`).join(', ')}
            </div>
            <table class="installment-table">
                <thead>
                    <tr>
                        <th>Installment</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${installments.map((inst: any, index: number) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>₹${inst.amount.toFixed(2)}</td>
                        <td>${new Date(inst.dueDate).toLocaleDateString()}</td>
                        <td>
                            <span class="status-badge status-${inst.status === 'paid' ? 'paid' : inst.status === 'overdue' ? 'overdue' : 'pending'}">
                                ${inst.status.toUpperCase()}
                            </span>
                        </td>
                    </tr>
                    `).join("")}
                </tbody>
            </table>` : ""}
        </div>
    </div>

    <div class="totals-section">
        <div class="total-row">
            <span>Package Price:</span>
            <span>₹${payment.grandTotal.toFixed(2)}</span>
        </div>
        
        <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹${payment.grandTotal.toFixed(2)}</span>
        </div>
        
        <div class="total-row">
            <span>Amount Paid:</span>
            <span>₹${payment.paymentModes.reduce((sum: number, pm: any) => sum + pm.amount, 0).toFixed(2)} (${payment.paymentModes.map((pm: any) => `${pm.type}: ₹${pm.amount.toFixed(2)}`).join(', ')})</span>
        </div>
        
        ${installments && installments.length > 0 ? `
        <div class="total-row">
            <span>Balance Amount:</span>
            <span><strong>₹${installments.filter((inst: any) => inst.status === 'pending').reduce((sum: number, inst: any) => sum + inst.amount, 0).toFixed(2)}</strong></span>
        </div>` : ""}
    </div>

    ${notes?.terms || notes?.remarks ? `
    <div style="margin-top: 25px; font-size: ${isA4 ? '10px' : '8px'}; padding: ${isA4 ? '15px' : '8px'}; background-color: ${isA4 ? '#f5f5f5' : 'transparent'}; border-radius: 4px;">
        ${notes.terms ? `<div><strong>Terms & Conditions:</strong><br>${notes.terms}</div>` : ""}
        ${notes.remarks ? `<div style="margin-top: 10px;"><strong>Remarks:</strong> ${notes.remarks}</div>` : ""}
        ${notes.reverseCharge ? `<div style="margin-top: 10px; font-size: 9px;">${notes.reverseCharge}</div>` : ""}
    </div>` : ""}

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

    <div class="footer">
        <div>Thank you for choosing ${company.name}!</div>
    </div>

</body>
</html>`;
};