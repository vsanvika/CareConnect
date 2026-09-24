import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, Printer, Receipt, ShieldCheck, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

export const InvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const loadInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${id}`);
      setInvoice(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load invoice.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const payNow = async () => {
    setPaying(true);
    setError('');
    try {
      const response = await api.post(`/invoices/${id}/pay`);
      setInvoice(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment could not be processed.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-400">Loading invoice...</div>;
  if (!invoice) return <div className="py-12 text-center text-rose-300">{error || 'Invoice not found.'}</div>;

  const paid = invoice.paymentStatus === 'PAID';
  const failed = invoice.paymentProcessingStatus === 'FAILED';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-5 print:py-0 print:text-black">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>Print Invoice</Button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm print:hidden">{error}</div>}

      <Card className="p-8 print:shadow-none print:border-0 print:bg-white print:text-black">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-slate-800 print:border-slate-300 pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 print:text-blue-700">
              <Receipt className="w-5 h-5" />
              <span className="font-bold tracking-wide">CareConnect</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-100 print:text-black mt-4">Invoice</h1>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-left sm:text-right">
            <Badge variant={paid ? 'success' : failed ? 'danger' : 'warning'}>{invoice.paymentStatus}</Badge>
            <p className="text-xs text-slate-500 print:text-slate-600 mt-2">Issued {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-6 border-b border-slate-800 print:border-slate-300 text-sm">
          <div><span className="text-[10px] uppercase font-bold text-slate-500 block">Billed to</span><strong>{invoice.customerId?.name}</strong><span className="text-xs text-slate-500 block">{invoice.customerId?.email}</span></div>
          <div><span className="text-[10px] uppercase font-bold text-slate-500 block">Provider</span><strong>{invoice.providerId?.name}</strong><span className="text-xs text-slate-500 block">{invoice.providerId?.email}</span></div>
        </div>

        <div className="py-6 space-y-3">
          {invoice.lineItems?.map((item, index) => (
            <div key={`${item.description}-${index}`} className="flex justify-between text-sm text-slate-300 print:text-slate-800">
              <span>{item.description}</span><span>{money(item.amount)}</span>
            </div>
          ))}
          <div className="border-t border-slate-800 print:border-slate-300 pt-3 flex justify-between text-sm text-slate-400 print:text-slate-700"><span>Subtotal</span><span>{money(invoice.subtotal)}</span></div>
          <div className="flex justify-between text-sm text-slate-400 print:text-slate-700"><span>Discount</span><span>-{money(invoice.discount)}</span></div>
          <div className="flex justify-between text-sm text-slate-400 print:text-slate-700"><span>Tax</span><span>{money(invoice.tax)}</span></div>
          <div className="border-t border-slate-800 print:border-slate-300 pt-4 flex justify-between text-xl font-bold text-slate-100 print:text-black"><span>Total</span><span className="text-emerald-400 print:text-emerald-700">{money(invoice.totalAmount)}</span></div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-800 print:border-slate-300 pt-5 print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Simulated secure payment</div>
          {!paid && (
            <Button onClick={payNow} disabled={paying} icon={paying ? undefined : CreditCard}>
              {paying ? 'Processing...' : failed ? 'Retry Payment' : 'Pay Now'}
            </Button>
          )}
          {paid && <span className="text-sm text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Payment successful</span>}
          {failed && <span className="text-sm text-rose-300 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Try again later</span>}
        </div>
        {invoice.transactionReference && <p className="text-[10px] text-slate-500 mt-4 print:text-slate-600">Transaction: {invoice.transactionReference}</p>}
      </Card>
    </div>
  );
};
