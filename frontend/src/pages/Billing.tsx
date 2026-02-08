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
  Select,
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
import BillingReports from "../components/billing/reports/BillingReports";
import BillingAuditTrail from "../components/billing/BillingAuditTrail";

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
    staleTime: 30000, // 30 seconds
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
    staleTime: 30000, // 30 seconds
  });

  // Fetch billing stats
  const { data: invoiceStats, error: statsError } = useQuery({
    queryKey: ["invoice-stats"],
    queryFn: () => apiService.getInvoiceStats(),
    staleTime: 60000, // 1 minute
  });

  // Fetch payment stats
  const { data: paymentStats, error: paymentStatsError } = useQuery({
    queryKey: ["payment-stats"],
    queryFn: () => apiService.getPaymentStats(),
    staleTime: 60000, // 1 minute
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
        "Failed to record payment: " + (error.message || "Unknown error"),
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
        "Failed to send invoice: " + (error.message || "Unknown error"),
      );
    },
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Generating invoice with data:", data);
      try {
        const result = await apiService.generateInvoice(data);
        console.log("Invoice generation successful:", result);
        return result;
      } catch (error) {
        console.error("Invoice generation failed:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("Invoice generated successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      setIsGenerateInvoiceModalOpen(false);
      notificationManager.success("Invoice generated successfully");
    },
    onError: (error: any) => {
      console.error("Generate invoice mutation error:", error);

      let errorMessage = "Failed to generate invoice";

      if (error?.response?.data?.message) {
        errorMessage += ": " + error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage += ": " + error.response.data.error;
      } else if (error?.message) {
        errorMessage += ": " + error.message;
      } else if (error?.response?.status === 400) {
        errorMessage += ": Invalid data provided";
      } else if (error?.response?.status === 401) {
        errorMessage += ": Authentication required";
      } else if (error?.response?.status === 403) {
        errorMessage += ": Permission denied";
      } else if (error?.response?.status === 404) {
        errorMessage += ": Endpoint not found";
      } else if (error?.response?.status >= 500) {
        errorMessage += ": Server error - please try again later";
      } else {
        errorMessage += " - please try again";
      }

      notificationManager.error(errorMessage);
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
          invoice.status === "pending" || invoice.status === "overdue",
      )
      .reduce(
        (sum, invoice) =>
          sum +
          (toNumber(invoice.total_amount) - toNumber(invoice.paid_amount)),
        0,
      );

    const overdueAmount = invoicesData.results
      .filter((invoice) => invoice.status === "overdue")
      .reduce(
        (sum, invoice) =>
          sum +
          (toNumber(invoice.total_amount) - toNumber(invoice.paid_amount)),
        0,
      );

    const pendingAmount = invoicesData.results
      .filter((invoice) => invoice.status === "pending")
      .reduce(
        (sum, invoice) =>
          sum +
          (toNumber(invoice.total_amount) - toNumber(invoice.paid_amount)),
        0,
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
      console.error("Error downloading invoice PDF:", error);
      notificationManager.error("Failed to download invoice PDF");
    }
  };

  const handleDownloadPaymentReceipt = async (payment: Payment) => {
    try {
      await downloadService.downloadPaymentReceipt(payment.id);
      notificationManager.success("Payment receipt downloaded successfully");
    } catch (error) {
      console.error("Error downloading payment receipt:", error);
      notificationManager.error("Failed to download payment receipt");
    }
  };

  const handleRefundPayment = (_payment: Payment) => {
    // TODO: Implement payment refund
    notificationManager.info("Payment refund feature coming soon");
  };

  const handleGenerateInvoice = (data: any) => {
    console.log("handleGenerateInvoice called with:", data);

    // Validate required fields
    if (!data.customer_id) {
      notificationManager.error("Customer is required to generate invoice");
      return;
    }

    if (!data.subtotal || data.subtotal <= 0) {
      notificationManager.error("Invoice subtotal must be greater than 0");
      return;
    }

    if (!data.billing_period_start || !data.billing_period_end) {
      notificationManager.error(
        "Billing period start and end dates are required",
      );
      return;
    }

    // Clean up data before sending
    const cleanData = {
      ...data,
      customer_id: parseInt(data.customer_id),
      subscription_id: data.subscription_id
        ? parseInt(data.subscription_id)
        : undefined,
      subtotal: parseFloat(data.subtotal),
      tax_amount: parseFloat(data.tax_amount || 0),
      discount_amount: parseFloat(data.discount_amount || 0),
      notes: data.notes?.trim() || undefined,
    };

    console.log("Cleaned data for invoice generation:", cleanData);
    generateInvoiceMutation.mutate(cleanData);
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
        1,
      );
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      );

      await downloadService.downloadBillingReport(
        firstDayOfMonth.toISOString().split("T")[0],
        lastDayOfMonth.toISOString().split("T")[0],
        "csv",
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
      {/* Page Header with Enhanced Stats */}
      <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
        <div>
          <h1 className="u-mb-2">Billing & Payments</h1>
          <p className="u-text-secondary">
            Manage invoices, payments, and financial records
          </p>
          {invoiceStats && (
            <div className="u-d-flex u-gap-4 u-mt-3">
              <div className="u-d-flex u-align-items-center u-gap-1">
                <Icon name="TrendUp" size={14} className="u-text-success" />
                <span className="u-fs-sm u-text-success">
                  {formatCurrency(invoiceStats.total_revenue || 0)} total
                  revenue
                </span>
              </div>
              <div className="u-d-flex u-align-items-center u-gap-1">
                <Icon name="Clock" size={14} className="u-text-warning" />
                <span className="u-fs-sm u-text-warning">
                  {calculatedStats.outstandingAmount > 0
                    ? `${formatCurrency(calculatedStats.outstandingAmount)} outstanding`
                    : "All invoices paid"}
                </span>
              </div>
            </div>
          )}
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
          <Button
            variant={activeTab === "reports" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("reports")}
          >
            <Icon name="ChartBar" size={16} />
            Reports
          </Button>
          <Button
            variant={activeTab === "audit" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("audit")}
          >
            <Icon name="FileText" size={16} />
            Audit Trail
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
            isLoading={
              !invoiceStats &&
              !paymentStats &&
              !statsError &&
              !paymentStatsError
            }
            error={
              (statsError as Error)?.message ||
              (paymentStatsError as Error)?.message
            }
          />

          {/* Revenue Analytics */}
          <Grid className="u-mb-6">
            <GridCol xs={12} md={4}>
              <Card className="u-text-center u-p-4">
                <Icon
                  name="TrendUp"
                  size={32}
                  className="u-text-success u-mb-2"
                />
                <h4 className="u-mb-1">Collection Rate</h4>
                <p className="u-fs-xl u-fw-bold u-text-success">
                  {((invoiceStats?.collection_rate || 0) * 100).toFixed(1)}%
                </p>
                <p className="u-fs-sm u-text-secondary">Payment success rate</p>
              </Card>
            </GridCol>
            <GridCol xs={12} md={4}>
              <Card className="u-text-center u-p-4">
                <Icon
                  name="Calendar"
                  size={32}
                  className="u-text-primary u-mb-2"
                />
                <h4 className="u-mb-1">Average Payment Time</h4>
                <p className="u-fs-xl u-fw-bold u-text-primary">
                  {Math.round(invoiceStats?.avg_payment_days || 0)} days
                </p>
                <p className="u-fs-sm u-text-secondary">
                  From invoice to payment
                </p>
              </Card>
            </GridCol>
            <GridCol xs={12} md={4}>
              <Card className="u-text-center u-p-4">
                <Icon
                  name="CurrencyDollar"
                  size={32}
                  className="u-text-warning u-mb-2"
                />
                <h4 className="u-mb-1">Monthly Recurring</h4>
                <p className="u-fs-xl u-fw-bold u-text-warning">
                  {formatCurrency(invoiceStats?.monthly_recurring_revenue || 0)}
                </p>
                <p className="u-fs-sm u-text-secondary">
                  Expected monthly income
                </p>
              </Card>
            </GridCol>
          </Grid>

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
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate to overdue invoices
                  setStatusFilter("overdue");
                  setActiveTab("invoices");
                }}
              >
                <Icon name="Warning" size={16} />
                View Overdue ({invoiceStats?.overdue_invoices || 0})
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
                ) : invoicesData?.results?.length ? (
                  <div className="u-d-flex u-flex-wrap u-gap-3">
                    {invoicesData.results?.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice.id}
                        className={`c-btn c-btn--outline-${
                          invoice.status === "paid"
                            ? "success"
                            : invoice.status === "overdue"
                              ? "error"
                              : "warning"
                        } u-justify-content-between u-align-items-start u-flex-1 u-max-w-100`}
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
                        <div className="u-text-end">
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
                            className="u-mt-1"
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
                ) : paymentsData?.results?.length ? (
                  <div className="u-space-y-3">
                    {paymentsData.results?.slice(0, 5).map((paymentRecord) => (
                      <div
                        key={paymentRecord.id}
                        className="u-d-flex u-justify-content-between u-align-items-center u-mb-2 u-p-3 u-border u-rounded u-cursor-pointer u-bg-brand-subtle"
                        onClick={() => handleViewPayment(paymentRecord)}
                      >
                        <div>
                          <div className="u-fw-medium">
                            {paymentRecord.payment_number}
                          </div>
                          <div className="u-fs-sm ">
                            {paymentRecord.customer?.name}
                          </div>
                        </div>
                        <div className="u-text-right">
                          <div className="u-fw-medium">
                            {formatCurrency(paymentRecord.amount)}
                          </div>
                          <Badge
                            variant={
                              paymentRecord.status === "completed"
                                ? "success"
                                : paymentRecord.status === "failed"
                                  ? "error"
                                  : "warning"
                            }
                            size="sm"
                            label={paymentRecord.status}
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
                  placeholder="Search invoices by number, customer name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="u-p-3"
                options={[
                  { value: "all", label: "All Status" },
                  { value: "draft", label: "Draft" },
                  { value: "pending", label: "Pending" },
                  { value: "paid", label: "Paid" },
                  { value: "overdue", label: "Overdue" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  // Bulk generate invoices for active subscriptions
                  notificationManager.info(
                    "Bulk invoice generation feature coming soon",
                  );
                }}
              >
                <Icon name="Stack" size={16} />
                Bulk Generate
              </Button>
            </div>

            {/* Invoice Summary Stats */}
            {invoicesData?.results && (
              <div className="u-d-flex u-gap-4 u-mb-4 u-p-3 u-bg-subtle u-rounded">
                <div className="u-text-center">
                  <div className="u-fs-lg u-fw-bold">
                    {invoicesData.count || 0}
                  </div>
                  <div className="u-fs-sm u-text-secondary">Total</div>
                </div>
                <div className="u-text-center">
                  <div className="u-fs-lg u-fw-bold u-text-success">
                    {
                      invoicesData.results.filter((i) => i.status === "paid")
                        .length
                    }
                  </div>
                  <div className="u-fs-sm u-text-secondary">Paid</div>
                </div>
                <div className="u-text-center">
                  <div className="u-fs-lg u-fw-bold u-text-warning">
                    {
                      invoicesData.results.filter((i) => i.status === "pending")
                        .length
                    }
                  </div>
                  <div className="u-fs-sm u-text-secondary">Pending</div>
                </div>
                <div className="u-text-center">
                  <div className="u-fs-lg u-fw-bold u-text-error">
                    {
                      invoicesData.results.filter((i) => i.status === "overdue")
                        .length
                    }
                  </div>
                  <div className="u-fs-sm u-text-secondary">Overdue</div>
                </div>
              </div>
            )}
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
              {invoicesData.results?.map((invoice) => (
                <GridCol
                  key={invoice.id}
                  xs={12}
                  md={6}
                  lg={4}
                  className="u-mb-4"
                >
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
                {Math.ceil((invoicesData?.count || 0) / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage >=
                  Math.ceil((invoicesData?.count || 0) / itemsPerPage)
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
                  placeholder="Search payments by number, customer, or transaction ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  // Export payment report
                  notificationManager.info(
                    "Payment report export feature coming soon",
                  );
                }}
              >
                <Icon name="FileText" size={16} />
                Export Payments
              </Button>
            </div>

            {/* Payment Method Statistics */}
            {paymentsData?.results && (
              <div className="u-mb-4">
                <h4 className="u-mb-3">Payment Methods Used</h4>
                <div className="u-d-flex u-gap-3 u-flex-wrap">
                  {["cash", "bank_transfer", "bkash", "nagad", "rocket"].map(
                    (method) => {
                      const count = paymentsData.results.filter(
                        (p) => p.payment_method === method,
                      ).length;
                      const total = paymentsData.results.reduce(
                        (sum, p) =>
                          p.payment_method === method
                            ? sum + parseFloat(String(p.amount))
                            : sum,
                        0,
                      );
                      return count > 0 ? (
                        <div
                          key={method}
                          className="u-text-center u-p-3 u-border u-rounded"
                        >
                          <div className="u-fs-sm u-fw-medium u-text-capitalize">
                            {method.replace("_", " ")}
                          </div>
                          <div className="u-fs-xs u-text-secondary">
                            {count} payments
                          </div>
                          <div className="u-fs-xs u-text-secondary">
                            {formatCurrency(total)}
                          </div>
                        </div>
                      ) : null;
                    },
                  )}
                </div>
              </div>
            )}
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
              {paymentsData.results?.map((payment) => (
                <GridCol
                  key={payment.id}
                  xs={12}
                  md={6}
                  lg={4}
                  className="u-mb-4"
                >
                  <PaymentCard
                    payment={payment}
                    onView={handleViewPayment}
                    onDownload={handleDownloadPaymentReceipt}
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
                {Math.ceil((paymentsData?.count || 0) / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage >=
                  Math.ceil((paymentsData?.count || 0) / itemsPerPage)
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

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div>
          <BillingReports />
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === "audit" && (
        <div>
          <BillingAuditTrail />
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
                  label={selectedInvoice.status || "unknown"}
                />
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Customer</label>
                  <p className="u-fw-medium">
                    {selectedInvoice.customer?.name || "N/A"}
                  </p>
                  <p className="u-fs-sm ">
                    {selectedInvoice.customer?.email || "N/A"}
                  </p>
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
                    {selectedInvoice.issue_date
                      ? new Date(
                          selectedInvoice.issue_date,
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </GridCol>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Created</label>
                  <p>
                    {selectedInvoice.created_at
                      ? new Date(
                          selectedInvoice.created_at,
                        ).toLocaleDateString()
                      : "N/A"}
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
                  <span>{formatCurrency(selectedInvoice.subtotal || 0)}</span>
                </div>
                <div className="u-d-flex u-justify-content-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(selectedInvoice.tax_amount || 0)}</span>
                </div>
                <div className="u-d-flex u-justify-content-between">
                  <span>Discount:</span>
                  <span>
                    -{formatCurrency(selectedInvoice.discount_amount || 0)}
                  </span>
                </div>
                <div className="u-d-flex u-justify-content-between u-fw-bold u-border-top u-pt-2">
                  <span>Total:</span>
                  <span>
                    {formatCurrency(selectedInvoice.total_amount || 0)}
                  </span>
                </div>
                <div className="u-d-flex u-justify-content-between u-text-success">
                  <span>Paid:</span>
                  <span>
                    {formatCurrency(selectedInvoice.paid_amount || 0)}
                  </span>
                </div>
                {toNumber(selectedInvoice.paid_amount || 0) <
                  toNumber(selectedInvoice.total_amount || 0) && (
                  <div className="u-d-flex u-justify-content-between u-text-error">
                    <span>Remaining:</span>
                    <span>
                      {formatCurrency(
                        toNumber(selectedInvoice.total_amount || 0) -
                          toNumber(selectedInvoice.paid_amount || 0),
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
              {selectedInvoice.status !== "paid" && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsInvoiceModalOpen(false);
                    setIsPaymentFormOpen(true);
                  }}
                >
                  Record Payment
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  selectedInvoice && handleDownloadInvoice(selectedInvoice)
                }
              >
                <Icon name="Download" size={16} />
                Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  selectedInvoice && handleSendInvoice(selectedInvoice)
                }
              >
                <Icon name="Share" size={16} />
                Send Invoice
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
                  <h2 className="u-mb-1">
                    {selectedPayment.payment_number || "N/A"}
                  </h2>
                  <p className=" u-mb-2">
                    {formatCurrency(selectedPayment.amount || 0)}
                  </p>
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
                  label={selectedPayment.status || "unknown"}
                />
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Customer</label>
                  <p className="u-fw-medium">
                    {selectedPayment.customer?.name || "N/A"}
                  </p>
                  <p className="u-fs-sm ">
                    {selectedPayment.customer?.email || "N/A"}
                  </p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Invoice</label>
                  <p className="u-fw-medium">
                    {selectedPayment.invoice?.invoice_number || "N/A"}
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
                    {formatCurrency(selectedPayment.amount || 0)}
                  </p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm  u-mb-1">Payment Method</label>
                  <Badge
                    variant="secondary"
                    size="md"
                    label={String(selectedPayment.payment_method || "")
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
                      ? new Date(
                          selectedPayment.payment_date,
                        ).toLocaleDateString()
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
                onClick={() =>
                  selectedPayment &&
                  handleDownloadPaymentReceipt(selectedPayment)
                }
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
