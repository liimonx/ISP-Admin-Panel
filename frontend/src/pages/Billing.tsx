import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Button,
  Icon,
  Grid,
  GridCol,
  Badge,
  Modal,
  Callout,
  Spinner,
  Input,
  Tab,
} from "@shohojdhara/atomix";
import { Invoice, Payment } from "../types";
import { apiService } from "../services/apiService";
import { formatCurrency, toNumber } from "../utils/formatters";
import { notificationManager } from "../utils/notifications";
import { downloadService } from "../services/downloadService";

// Import billing components
import InvoiceCard from "../components/billing/InvoiceCard";
import PaymentCard from "../components/billing/PaymentCard";
import PaymentForm from "../components/billing/PaymentForm";
import BillingStats from "../components/billing/BillingStats";
import GenerateInvoiceForm from "../components/billing/GenerateInvoiceForm";

const Billing: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] =
    useState(false);

  const itemsPerPage = 12;

  // Fetch invoices with enhanced filtering
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useQuery({
    queryKey: ["invoices", currentPage, searchQuery, statusFilter],
    queryFn: () =>
      apiService.getInvoices({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  // Fetch payments
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useQuery({
    queryKey: ["payments", currentPage, searchQuery],
    queryFn: () =>
      apiService.getPayments({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
      }),
  });

  // Fetch billing stats
  const { data: invoiceStats, error: statsError } = useQuery({
    queryKey: ["invoice-stats"],
    queryFn: () => apiService.getInvoiceStats(),
  });

  // Fetch payment stats
  const { data: paymentStats, error: paymentStatsError } = useQuery({
    queryKey: ["payment-stats"],
    queryFn: () => apiService.getPaymentStats(),
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (data: {
      invoice_id: number;
      amount: number;
      payment_method: string;
      transaction_id?: string;
      notes?: string;
    }) => apiService.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      setIsPaymentFormOpen(false);
      setSelectedInvoice(null);
      notificationManager.success("Payment recorded successfully");
    },
    onError: (error: any) => {
      notificationManager.error(
        "Failed to record payment: " + (error.message || "Unknown error")
      );
    },
  });

  // Send invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: (invoiceId: number) => apiService.sendInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      notificationManager.success("Invoice sent successfully");
    },
    onError: (error: any) => {
      notificationManager.error(
        "Failed to send invoice: " + (error.message || "Unknown error")
      );
    },
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiService.generateInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      setIsGenerateInvoiceModalOpen(false);
      notificationManager.success("Invoice generated successfully");
    },
    onError: (error: any) => {
      notificationManager.error(
        "Failed to generate invoice: " + (error.message || "Unknown error")
      );
    },
  });

  // Calculate derived stats
  const calculatedStats = useMemo(() => {
    if (!invoicesData?.results) {
      return {
        outstandingAmount: 0,
        overdueAmount: 0,
        pendingAmount: 0,
      };
    }

    const outstandingAmount = invoicesData.results
      .filter(
        (invoice) =>
          invoice.status === "pending" || invoice.status === "overdue"
      )
      .reduce(
        (sum, invoice) =>
          sum + (toNumber(invoice.total_amount) - toNumber(invoice.paid_amount)),
        0
      );

    const overdueAmount = invoicesData.results
      .filter((invoice) => invoice.status === "overdue")
      .reduce(
        (sum, invoice) =>
          sum + (toNumber(invoice.total_amount) - toNumber(invoice.paid_amount)),
        0
      );

    const pendingAmount = invoicesData.results
      .filter((invoice) => invoice.status === "pending")
      .reduce(
        (sum, invoice) =>
          sum + (toNumber(invoice.total_amount) - toNumber(invoice.paid_amount)),
        0
      );

    return {
      outstandingAmount,
      overdueAmount,
      pendingAmount,
    };
  }, [invoicesData]);

  // Event handlers
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentFormOpen(true);
  };

  const handleSendInvoice = (invoice: Invoice) => {
    sendInvoiceMutation.mutate(invoice.id);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      await downloadService.downloadInvoicePDF(invoice.id);
      notificationManager.success("Invoice downloaded successfully");
    } catch (error) {
      // Fallback to mock PDF if backend endpoint doesn't exist
      const content = `
INVOICE

Invoice Number: ${invoice.invoice_number}
Customer: ${invoice.customer?.name}
Date: ${new Date(invoice.issue_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Amount: ${formatCurrency(invoice.total_amount)}
Status: ${invoice.status}

Generated on: ${new Date().toLocaleString()}
      `;
      await downloadService.generateMockPDF(
        content,
        `invoice-${invoice.invoice_number}.txt`
      );
      notificationManager.info(
        "Invoice downloaded as text file (PDF generation coming soon)"
      );
    }
  };

  const handleDownloadPayment = async (payment: Payment) => {
    try {
      await downloadService.downloadPaymentReceipt(payment.id);
      notificationManager.success("Payment receipt downloaded successfully");
    } catch (error) {
      // Fallback to mock receipt if backend endpoint doesn't exist
      const content = `
PAYMENT RECEIPT

Receipt Number: ${payment.payment_number}
Customer: ${payment.customer?.name}
Date: ${
        payment.payment_date
          ? new Date(payment.payment_date).toLocaleDateString()
          : "Pending"
      }

Amount: ${formatCurrency(payment.amount)}
Method: ${payment.payment_method}
Status: ${payment.status}

Generated on: ${new Date().toLocaleString()}
      `;
      await downloadService.generateMockPDF(
        content,
        `payment-receipt-${payment.payment_number}.txt`
      );
      notificationManager.info(
        "Payment receipt downloaded as text file (PDF generation coming soon)"
      );
    }
  };

  const handleRefundPayment = (payment: Payment) => {
    // TODO: Implement payment refund
    notificationManager.info("Payment refund feature coming soon");
  };

  const handleGenerateInvoice = (data: any) => {
    generateInvoiceMutation.mutate(data);
  };

  const handleSubmitPayment = (data: {
    invoice_id: number;
    amount: number;
    payment_method: string;
    transaction_id?: string;
    notes?: string;
  }) => {
    recordPaymentMutation.mutate(data);
  };

  const handleExportReport = async () => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );

      await downloadService.downloadBillingReport(
        firstDayOfMonth.toISOString().split("T")[0],
        lastDayOfMonth.toISOString().split("T")[0],
        "csv"
      );
      notificationManager.success("Billing report exported successfully");
    } catch (error) {
      notificationManager.error("Failed to export billing report");
    }
  };

  // Error handling
  if (invoicesError || paymentsError || statsError || paymentStatsError) {
    const errorMessage =
      (invoicesError as Error)?.message ||
      (paymentsError as Error)?.message ||
      (statsError as Error)?.message ||
      (paymentStatsError as Error)?.message ||
      "Please try again.";
    return (
      <Callout variant="error" className="u-mb-4">
        Error loading billing data: {errorMessage}
      </Callout>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
        <div>
          <h1 className="u-mb-2">Billing & Payments</h1>
          <p className="">Manage invoices, payments, and financial records</p>
        </div>
        <div className="u-d-flex u-gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsGenerateInvoiceModalOpen(true)}
          >
            <Icon name="Receipt" size={16} />
            Generate Invoice
          </Button>
          <Button variant="outline" size="md" onClick={handleExportReport}>
            <Icon name="Download" size={16} />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="u-mb-6">
        <div className="u-d-flex u-gap-4 u-border-bottom u-pb-3">
          <Button
            variant={activeTab === "overview" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("overview")}
          >
            <Icon name="ChartBar" size={16} />
            Overview
          </Button>
          <Button
            variant={activeTab === "invoices" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("invoices")}
          >
            <Icon name="Receipt" size={16} />
            Invoices
          </Button>
          <Button
            variant={activeTab === "payments" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("payments")}
          >
            <Icon name="CurrencyDollar" size={16} />
            Payments
          </Button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          <BillingStats
            invoiceStats={invoiceStats || {}}
            paymentStats={paymentStats || {}}
            calculatedStats={calculatedStats}
          />

          {/* Quick Actions */}
          <Card className="u-mb-6">
            <h3 className="u-mb-4">Quick Actions</h3>
            <div className="u-d-flex u-gap-4 u-flex-wrap">
              <Button
                variant="primary"
                onClick={() => setIsGenerateInvoiceModalOpen(true)}
              >
                <Icon name="Plus" size={16} />
                Generate Invoice
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveTab("invoices")}
              >
                <Icon name="Receipt" size={16} />
                View All Invoices
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveTab("payments")}
              >
                <Icon name="CurrencyDollar" size={16} />
                View All Payments
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Grid>
            <GridCol xs={12} lg={6}>
              <Card>
                <h3 className="u-mb-4">Recent Invoices</h3>
                {invoicesLoading ? (
                  <div className="u-d-flex u-justify-content-center u-py-4">
                    <Spinner />
                  </div>
                ) : invoicesData?.results?.slice(0, 5).length ? (
                  <div className="u-space-y-3">
                    {invoicesData.results.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="u-d-flex u-justify-content-between u-align-items-center u-p-3 u-border u-rounded u-cursor-pointer u-hover-bg-gray-50"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <div>
                          <div className="u-fw-medium">
                            {invoice.invoice_number}
                          </div>
                          <div className="u-fs-sm ">
                            {invoice.customer?.name}
                          </div>
                        </div>
                        <div className="u-text-right">
                          <div className="u-fw-medium">
                            {formatCurrency(invoice.total_amount)}
                          </div>
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "success"
                                : invoice.status === "overdue"
                                ? "error"
                                : "warning"
                            }
                            size="sm"
                            label={invoice.status}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className=" u-text-center u-py-4">No recent invoices</p>
                )}
              </Card>
            </GridCol>

            <GridCol xs={12} lg={6}>
              <Card>
                <h3 className="u-mb-4">Recent Payments</h3>
                {paymentsLoading ? (
                  <div className="u-d-flex u-justify-content-center u-py-4">
                    <Spinner />
                  </div>
                ) : paymentsData?.results?.slice(0, 5).length ? (
                  <div className="u-space-y-3">
                    {paymentsData.results.slice(0, 5).map((payment) => (
                      <div
                        key={payment.id}
                        className="u-d-flex u-justify-content-between u-align-items-center u-p-3 u-border u-rounded u-cursor-pointer u-hover-bg-gray-50"
                        onClick={() => handleViewPayment(payment)}
                      >
                        <div>
                          <div className="u-fw-medium">
                            {payment.payment_number}
                          </div>
                          <div className="u-fs-sm ">
                            {payment.customer?.name}
                          </div>
                        </div>
                        <div className="u-text-right">
                          <div className="u-fw-medium">
                            {formatCurrency(payment.amount)}
                          </div>
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "success"
                                : payment.status === "failed"
                                ? "error"
                                : "warning"
                            }
                            size="sm"
                            label={payment.status}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className=" u-text-center u-py-4">No recent payments</p>
                )}
              </Card>
            </GridCol>
          </Grid>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div>
          <Card className="u-mb-6">
            <div className="u-d-flex u-gap-4 u-align-items-center u-mb-4">
              <div className="u-flex-fill">
                <Input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="u-p-3 u-border u-rounded"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </Card>

          {invoicesLoading ? (
            <div className="u-d-flex u-justify-content-center u-align-items-center u-py-8">
              <div className="u-text-center">
                <Spinner size="lg" />
                <p>Loading invoices...</p>
              </div>
            </div>
          ) : invoicesData?.results?.length ? (
            <Grid>
              {invoicesData.results.map((invoice) => (
                <GridCol key={invoice.id} xs={12} md={6} lg={4}>
                  <InvoiceCard
                    invoice={invoice}
                    onView={handleViewInvoice}
                    onPay={handleRecordPayment}
                    onDownload={handleDownloadInvoice}
                    onSend={handleSendInvoice}
                  />
                </GridCol>
              ))}
            </Grid>
          ) : (
            <Card>
              <div className="u-text-center u-py-8">
                <Icon name="Receipt" size={48} className=" u-mb-4" />
                <h3 className="u-mb-2">No invoices found</h3>
                <p className=" u-mb-4">
                  {searchQuery
                    ? "No invoices match your search criteria."
                    : "You haven't generated any invoices yet."}
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsGenerateInvoiceModalOpen(true)}
                >
                  <Icon name="Plus" size={16} />
                  Generate Invoice
                </Button>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {invoicesData?.count && invoicesData.count > itemsPerPage && (
            <div className="u-d-flex u-justify-content-center u-gap-2 u-mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <Icon name="CaretLeft" size={16} />
                Previous
              </Button>
              <span className="u-d-flex u-align-items-center u-px-3">
                Page {currentPage} of{" "}
                {Math.ceil(invoicesData.count / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage >= Math.ceil(invoicesData.count / itemsPerPage)
                }
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
                <Icon name="CaretRight" size={16} />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div>
          <Card className="u-mb-6">
            <div className="u-d-flex u-gap-4 u-align-items-center u-mb-4">
              <div className="u-flex-fill">
                <Input
                  type="text"
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {paymentsLoading ? (
            <div className="u-d-flex u-justify-content-center u-align-items-center u-py-8">
              <div className="u-text-center">
                <Spinner size="lg" />
                <p>Loading payments...</p>
              </div>
            </div>
          ) : paymentsData?.results?.length ? (
            <Grid>
              {paymentsData.results.map((payment) => (
                <GridCol key={payment.id} xs={12} md={6} lg={4}>
                  <PaymentCard
                    payment={payment}
                    onView={handleViewPayment}
                    onDownload={handleDownloadPayment}
                    onRefund={handleRefundPayment}
                  />
                </GridCol>
              ))}
            </Grid>
          ) : (
            <Card>
              <div className="u-text-center u-py-8">
                <Icon name="CurrencyDollar" size={48} className=" u-mb-4" />
                <h3 className="u-mb-2">No payments found</h3>
                <p className=" u-mb-4">
                  No payment records have been created yet.
                </p>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {paymentsData?.count && paymentsData.count > itemsPerPage && (
            <div className="u-d-flex u-justify-content-center u-gap-2 u-mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <Icon name="CaretLeft" size={16} />
                Previous
              </Button>
              <span className="u-d-flex u-align-items-center u-px-3">
                Page {currentPage} of{" "}
                {Math.ceil(paymentsData.count / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage >= Math.ceil(paymentsData.count / itemsPerPage)
                }
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
                <Icon name="CaretRight" size={16} />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Payment Form Modal */}
      <PaymentForm
        isOpen={isPaymentFormOpen}
        onClose={() => setIsPaymentFormOpen(false)}
        invoice={selectedInvoice}
        onSubmit={handleSubmitPayment}
        isLoading={recordPaymentMutation.isPending}
      />

      {/* Generate Invoice Form Modal */}
      <GenerateInvoiceForm
        isOpen={isGenerateInvoiceModalOpen}
        onClose={() => setIsGenerateInvoiceModalOpen(false)}
        onSubmit={handleGenerateInvoice}
        isLoading={generateInvoiceMutation.isPending}
      />

      {/* Invoice Details Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
        title="Invoice Details"
        size="lg"
      >
        {selectedInvoice && (
          <div>
            <div className="u-mb-4">
              <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-3">
                <div>
                  <h2 className="u-mb-1">{selectedInvoice.invoice_number}</h2>
                  <p className=" u-mb-2">{selectedInvoice.invoice_type}</p>
                </div>
                <Badge
                  variant={
                    selectedInvoice.status === "paid"
                      ? "success"
                      : selectedInvoice.status === "overdue"
                      ? "error"
                      : "warning"
                  }
                  size="md"
                  label={selectedInvoice.status}
                />
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Customer</label>
                  <p className="u-fw-medium">
                    {selectedInvoice.customer?.name}
                  </p>
                  <p className="u-fs-sm ">{selectedInvoice.customer?.email}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Subscription</label>
                  <p className="u-fw-medium">
                    {selectedInvoice.subscription?.plan?.name || "N/A"}
                  </p>
                </div>
              </GridCol>
            </Grid>

            <Grid>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Issue Date</label>
                  <p>
                    {new Date(selectedInvoice.issue_date).toLocaleDateString()}
                  </p>
                </div>
              </GridCol>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Due Date</label>
                  <p>
                    {new Date(selectedInvoice.due_date).toLocaleDateString()}
                  </p>
                </div>
              </GridCol>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Paid Date</label>
                  <p>
                    {selectedInvoice.paid_date
                      ? new Date(selectedInvoice.paid_date).toLocaleDateString()
                      : "Not paid"}
                  </p>
                </div>
              </GridCol>
            </Grid>

            <div className="u-mb-4">
              <h4 className="u-mb-3">Invoice Summary</h4>
              <div className="u-space-y-2">
                <div className="u-d-flex u-justify-content-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="u-d-flex u-justify-content-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                </div>
                <div className="u-d-flex u-justify-content-between">
                  <span>Discount:</span>
                  <span>
                    -{formatCurrency(selectedInvoice.discount_amount)}
                  </span>
                </div>
                <div className="u-d-flex u-justify-content-between u-fw-bold u-border-top u-pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                </div>
                <div className="u-d-flex u-justify-content-between u-text-success">
                  <span>Paid:</span>
                  <span>{formatCurrency(selectedInvoice.paid_amount)}</span>
                </div>
                {toNumber(selectedInvoice.paid_amount) <
                  toNumber(selectedInvoice.total_amount) && (
                  <div className="u-d-flex u-justify-content-between u-text-error">
                    <span>Remaining:</span>
                    <span>
                      {formatCurrency(
                        toNumber(selectedInvoice.total_amount) -
                          toNumber(selectedInvoice.paid_amount)
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="u-mb-4">
                <label className="u-fs-sm  u-mb-1">Notes</label>
                <p>{selectedInvoice.notes}</p>
              </div>
            )}

            <div className="u-d-flex u-justify-content-end u-gap-2 u-mt-6">
              {selectedInvoice.status === "pending" && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsInvoiceModalOpen(false);
                    handleRecordPayment(selectedInvoice);
                  }}
                >
                  <Icon name="CurrencyDollar" size={16} />
                  Record Payment
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => handleDownloadInvoice(selectedInvoice)}
              >
                <Icon name="Download" size={16} />
                Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsInvoiceModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Details Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }}
        title="Payment Details"
        size="lg"
      >
        {selectedPayment && (
          <div>
            <div className="u-mb-4">
              <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-3">
                <div>
                  <h2 className="u-mb-1">{selectedPayment.payment_number}</h2>
                  <p className=" u-mb-2">Payment Record</p>
                </div>
                <Badge
                  variant={
                    selectedPayment.status === "completed"
                      ? "success"
                      : selectedPayment.status === "failed"
                      ? "error"
                      : "warning"
                  }
                  size="md"
                  label={selectedPayment.status}
                />
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Customer</label>
                  <p className="u-fw-medium">
                    {selectedPayment.customer?.name}
                  </p>
                  <p className="u-fs-sm ">{selectedPayment.customer?.email}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Invoice</label>
                  <p className="u-fw-medium">
                    {selectedPayment.invoice?.invoice_number}
                  </p>
                  <p className="u-fs-sm ">
                    {formatCurrency(selectedPayment.invoice?.total_amount || 0)}
                  </p>
                </div>
              </GridCol>
            </Grid>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Amount</label>
                  <p className="u-fs-xl u-fw-bold u-text-primary">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Payment Method</label>
                  <Badge
                    variant="secondary"
                    size="md"
                    label={selectedPayment.payment_method
                      .replace("_", " ")
                      .toUpperCase()}
                  />
                </div>
              </GridCol>
            </Grid>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Payment Date</label>
                  <p>
                    {selectedPayment.payment_date
                      ? new Date(selectedPayment.payment_date).toLocaleString()
                      : "Pending"}
                  </p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Transaction ID</label>
                  <p>{selectedPayment.transaction_id || "N/A"}</p>
                </div>
              </GridCol>
            </Grid>

            {selectedPayment.notes && (
              <div className="u-mb-4">
                <label className="u-fs-sm  u-mb-1">Notes</label>
                <p>{selectedPayment.notes}</p>
              </div>
            )}

            <div className="u-d-flex u-justify-content-end u-gap-2 u-mt-6">
              <Button
                variant="outline"
                onClick={() => handleDownloadPayment(selectedPayment)}
              >
                <Icon name="Download" size={16} />
                Download Receipt
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;
