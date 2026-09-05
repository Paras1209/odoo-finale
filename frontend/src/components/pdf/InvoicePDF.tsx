// ===========================================
// DealFlow360 - Invoice PDF Template
// ===========================================
// Server-side PDF generation using @react-pdf/renderer
// Note: This component is for server-side rendering only
// ===========================================

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ===========================================
// TYPES
// ===========================================

export interface InvoicePDFData {
  invoiceNumber: string;
  quotationNumber: string;
  status: string;
  invoiceType: string;
  customer: {
    name: string;
    email: string;
    tier: string;
    companyName?: string;
    address?: string;
    phone?: string;
  };
  lines: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    discountPct: number;
    lineTotal: number;
  }>;
  // Total amount should match quotation - no extra tax calculations
  totalAmount: number;
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ===========================================
// STYLES
// ===========================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 20,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  companyTagline: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    textAlign: 'right',
  },
  invoiceLabel: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 4,
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#64748b',
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  infoBoxFirst: {
    marginLeft: 0,
  },
  infoBoxLast: {
    marginRight: 0,
  },
  infoLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  customerSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 4,
    marginBottom: 20,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  tierBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  tierText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  colProduct: {
    flex: 3,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 1.5,
    textAlign: 'right',
  },
  colDiscount: {
    flex: 1,
    textAlign: 'center',
  },
  colTotal: {
    flex: 1.5,
    textAlign: 'right',
  },
  summarySection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  summaryBox: {
    width: 250,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#1e3a8a',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 3,
  },
  footerBold: {
    fontWeight: 'bold',
    color: '#64748b',
  },
  paymentInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
  },
  paymentText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  paidStamp: {
    position: 'absolute',
    top: 150,
    right: 50,
    transform: 'rotate(-15deg)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 4,
    borderColor: '#16a34a',
    borderRadius: 8,
    opacity: 0.7,
  },
  paidStampText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
    textTransform: 'uppercase',
  },
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusStyle(status: string): { backgroundColor: string; color: string } {
  switch (status) {
    case 'PAID':
      return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'SENT':
      return { backgroundColor: '#dbeafe', color: '#1e40af' };
    case 'OVERDUE':
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    case 'CANCELLED':
      return { backgroundColor: '#f1f5f9', color: '#475569' };
    default:
      return { backgroundColor: '#f1f5f9', color: '#475569' };
  }
}

function getTierStyle(tier: string): { backgroundColor: string; color: string } {
  switch (tier) {
    case 'GOLD':
      return { backgroundColor: '#fef3c7', color: '#92400e' };
    case 'SILVER':
      return { backgroundColor: '#e2e8f0', color: '#475569' };
    default:
      return { backgroundColor: '#fef3c7', color: '#b45309' };
  }
}

// ===========================================
// INVOICE PDF COMPONENT
// ===========================================

export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  const statusStyle = getStatusStyle(data.status);
  const tierStyle = getTierStyle(data.customer.tier);
  
  // Calculate subtotal from line items
  const subtotal = data.lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PAID Stamp for paid invoices */}
        {data.status === 'PAID' && (
          <View style={styles.paidStamp}>
            <Text style={styles.paidStampText}>PAID</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>DealFlow360</Text>
            <Text style={styles.companyTagline}>Intelligent Sales Operations Platform</Text>
            <Text style={styles.companyDetails}>
              123 Business Avenue, Suite 100{'\n'}
              San Francisco, CA 94102{'\n'}
              contact@dealflow360.com{'\n'}
              +1 (555) 123-4567
            </Text>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>
              {data.invoiceType === 'ONE_TIME' ? 'One-Time' : 'Recurring'} Invoice
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>{data.status}</Text>
            </View>
          </View>
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          <View style={[styles.infoBox, styles.infoBoxFirst]}>
            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>{formatDate(data.issuedAt || data.createdAt)}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{formatDate(data.dueDate)}</Text>
          </View>
          <View style={[styles.infoBox, styles.infoBoxLast]}>
            <Text style={styles.infoLabel}>Quote Reference</Text>
            <Text style={styles.infoValue}>{data.quotationNumber}</Text>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.customerSection}>
            <Text style={styles.customerName}>{data.customer.name}</Text>
            {data.customer.companyName && (
              <Text style={styles.customerDetail}>{data.customer.companyName}</Text>
            )}
            <Text style={styles.customerDetail}>{data.customer.email}</Text>
            {data.customer.phone && (
              <Text style={styles.customerDetail}>{data.customer.phone}</Text>
            )}
            {data.customer.address && (
              <Text style={styles.customerDetail}>{data.customer.address}</Text>
            )}
            <View style={[styles.tierBadge, { backgroundColor: tierStyle.backgroundColor }]}>
              <Text style={[styles.tierText, { color: tierStyle.color }]}>{data.customer.tier} Customer</Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product / Service</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
              <Text style={[styles.tableHeaderCell, styles.colDiscount]}>Discount</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            </View>

            {/* Table Rows */}
            {data.lines.map((line, index) => (
              <View 
                key={index} 
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colProduct]}>{line.productName}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{line.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(line.unitPrice)}</Text>
                <Text style={[styles.tableCell, styles.colDiscount]}>
                  {line.discountPct > 0 ? `${line.discountPct}%` : '-'}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(line.lineTotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info (for unpaid invoices) */}
        {['SENT', 'OVERDUE'].includes(data.status) && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Payment Instructions</Text>
            <Text style={styles.paymentText}>
              Please remit payment by the due date to:{'\n'}
              Bank: First National Bank{'\n'}
              Account Name: DealFlow360 Inc.{'\n'}
              Account Number: XXXX-XXXX-1234{'\n'}
              Routing Number: XXX-XXX-XXX{'\n'}
              Reference: {data.invoiceNumber}
            </Text>
          </View>
        )}

        {/* Paid Info */}
        {data.status === 'PAID' && data.paidAt && (
          <View style={[styles.paymentInfo, { backgroundColor: '#dcfce7', borderLeftColor: '#16a34a' }]}>
            <Text style={[styles.paymentTitle, { color: '#166534' }]}>Payment Received</Text>
            <Text style={[styles.paymentText, { color: '#166534' }]}>
              Thank you for your payment!{'\n'}
              Payment received on: {formatDate(data.paidAt)}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={styles.footerBold}>Thank you for your business!</Text>
          </Text>
          <Text style={styles.footerText}>
            If you have any questions about this invoice, please contact us at billing@dealflow360.com
          </Text>
          <Text style={styles.footerText}>
            DealFlow360 - Intelligent Sales Operations Platform | www.dealflow360.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePDF;
