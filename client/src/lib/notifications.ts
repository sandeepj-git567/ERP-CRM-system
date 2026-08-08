import { SalesChallan } from '../types';
import { CompanyProfile } from './company-context';

export function formatWhatsAppMessage(challan: SalesChallan, company: CompanyProfile): string {
  const customerName = challan.customer?.customerName ?? 'Valued Customer';
  const businessName = challan.customer?.businessName ? ` (${challan.customer.businessName})` : '';
  const dateStr = new Date(challan.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const itemsList = (challan.items ?? [])
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.productNameSnapshot}* x ${item.quantity} = ₹${Number(item.subtotal).toLocaleString('en-IN')}`
    )
    .join('\n');

  const message = `🚚 *DELIVERY DISPATCH NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━━━━
Dear *${customerName}*${businessName},

Your order has been dispatched from *${company.companyName}*.

📄 *Challan No:* #${challan.challanNumber}
📅 *Date:* ${dateStr}
📦 *Total Quantity:* ${challan.totalQuantity} Units
💰 *Total Amount:* ₹${Number(challan.totalAmount).toLocaleString('en-IN')}

*Dispatched Items:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━
📍 *Dispatched From:* ${company.address}, ${company.city}, ${company.state}
📞 *Helpline / Dispatch Support:* ${company.phone}
🏦 *GSTIN:* ${company.gstin}

Thank you for your business!`;

  return message;
}

export function formatSmsMessage(challan: SalesChallan, company: CompanyProfile): string {
  const customerName = challan.customer?.customerName ?? 'Customer';
  return `Dear ${customerName}, your delivery challan #${challan.challanNumber} with ${challan.totalQuantity} items worth Rs.${Number(challan.totalAmount).toLocaleString('en-IN')} has been dispatched from ${company.tradeName}. Helpline: ${company.phone}`;
}

export function formatEmailBody(challan: SalesChallan, company: CompanyProfile): { subject: string; body: string } {
  const customerName = challan.customer?.customerName ?? 'Customer';
  const subject = `[Dispatch Alert] Delivery Challan #${challan.challanNumber} from ${company.companyName}`;

  const itemsList = (challan.items ?? [])
    .map(
      (item, idx) =>
        `  ${idx + 1}. ${item.productNameSnapshot} (${item.skuSnapshot}) - ${item.quantity} Qty @ Rs. ${Number(item.unitPriceSnapshot).toLocaleString('en-IN')} = Rs. ${Number(item.subtotal).toLocaleString('en-IN')}`
    )
    .join('\n');

  const body = `Dear ${customerName},

Greetings from ${company.companyName}!

Your order under Delivery Challan #${challan.challanNumber} has been verified and dispatched. Below is the summary of items included in this shipment:

Dispatched Items:
${itemsList}

Summary:
- Challan Number: #${challan.challanNumber}
- Date: ${new Date(challan.createdAt).toLocaleDateString('en-IN')}
- Total Quantity: ${challan.totalQuantity} Units
- Total Invoice Value: INR ${Number(challan.totalAmount).toLocaleString('en-IN')}

Bank Details for Settlement:
- Bank Name: ${company.bankName}
- Account No: ${company.accountNumber}
- IFSC Code: ${company.ifscCode}
- UPI ID: ${company.upiId}

Support / Inquiries:
- Phone: ${company.phone}
- Email: ${company.email}
- Registered Office: ${company.address}, ${company.city}, ${company.state} (${company.pincode})
- GSTIN: ${company.gstin}

Warm regards,
Dispatch & Operations Team
${company.companyName}`;

  return { subject, body };
}

export function openWhatsAppDirect(phone: string, text: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
  window.open(url, '_blank');
}

export function openEmailClient(email: string, subject: string, body: string) {
  const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}
