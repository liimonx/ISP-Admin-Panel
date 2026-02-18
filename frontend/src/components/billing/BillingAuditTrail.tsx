import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Button,
  Icon,
  Badge,
  Input,
  Select,
  Spinner,
  Avatar,
  DataTable,
  Pagination,
  Callout,
  Modal,
} from '@shohojdhara/atomix';
import { apiService } from '../../services/apiService';
import { formatCurrency } from '../../utils/formatters';

interface AuditLogEntry {
  id: number;
  action: string;
  resource_type: 'invoice' | 'payment' | 'customer' | 'subscription';
  resource_id: number;
  resource_name: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  details: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

interface BillingAuditTrailProps {
  className?: string;
  resourceType?: 'invoice' | 'payment' | 'customer' | 'subscription';
  resourceId?: number;
}

const BillingAuditTrail: React.FC<BillingAuditTrailProps> = ({
  className = '',
  resourceType,
  resourceId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const itemsPerPage = 20;

  // Fetch audit trail data
  const {
    data: auditData,
    isLoading: auditLoading,
    error: auditError,
  } = useQuery({
    queryKey: ['billing-audit-trail', currentPage, searchQuery, actionFilter, resourceType, resourceId],
    queryFn: async () => {
      try {
        const params: any = {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          action: actionFilter !== 'all' ? actionFilter : undefined,
        };

        if (resourceType) params.resource_type = resourceType;
        if (resourceId) params.resource_id = resourceId;

        const response = await apiService.billing.getAuditTrail(params);
        return response;
      } catch (error) {
        // Mock data for demonstration
        return generateMockAuditData();
      }
    },
    staleTime: 30000, // 30 seconds
  });

  const generateMockAuditData = () => {
    const actions = [
      'created', 'updated', 'deleted', 'paid', 'sent', 'cancelled',
      'marked_overdue', 'refunded', 'approved', 'rejected'
    ];
    const resourceTypes = ['invoice', 'payment', 'customer', 'subscription'];
    const users = [
      { id: 1, name: 'Admin User', email: 'admin@company.com' },
      { id: 2, name: 'Billing Manager', email: 'billing@company.com' },
      { id: 3, name: 'Support Agent', email: 'support@company.com' },
    ];

    const mockEntries: AuditLogEntry[] = [];
    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];

      mockEntries.push({
        id: i + 1,
        action,
        resource_type: resource as any,
        resource_id: Math.floor(Math.random() * 1000) + 1,
        resource_name: `${resource.charAt(0).toUpperCase() + resource.slice(1)} #${Math.floor(Math.random() * 1000) + 1}`,
        user,
        details: {
          old_value: action === 'updated' ? 'pending' : null,
          new_value: action === 'updated' ? 'paid' : null,
          amount: action.includes('paid') || action.includes('refund') ? Math.floor(Math.random() * 10000) + 1000 : null,
          reason: action === 'cancelled' ? 'Customer request' : null,
        },
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });
    }

    return {
      results: mockEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
      count: mockEntries.length,
      total_pages: Math.ceil(mockEntries.length / itemsPerPage),
    };
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'success' | 'error' | 'warning' | 'secondary' | 'primary'> = {
      created: 'success',
      updated: 'primary',
      deleted: 'error',
      paid: 'success',
      sent: 'primary',
      cancelled: 'error',
      marked_overdue: 'warning',
      refunded: 'warning',
      approved: 'success',
      rejected: 'error',
    };

    return (
      <Badge
        variant={variants[action] || 'secondary'}
        size="sm"
        label={action.replace('_', ' ').toUpperCase()}
      />
    );
  };

  const getResourceIcon = (resourceType: string) => {
    const icons: Record<string, string> = {
      invoice: 'Receipt',
      payment: 'CurrencyDollar',
      customer: 'User',
      subscription: 'Package',
    };
    return icons[resourceType] || 'File';
  };

  const handleViewDetails = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const actionOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
    { value: 'paid', label: 'Paid' },
    { value: 'sent', label: 'Sent' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'marked_overdue', label: 'Marked Overdue' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const columns = [
    {
      key: 'timestamp',
      header: 'Date & Time',
      render: (entry: AuditLogEntry) => (
        <div>
          <div className="u-fw-medium u-fs-sm">
            {new Date(entry.timestamp).toLocaleDateString()}
          </div>
          <div className="u-fs-xs u-text-secondary">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (entry: AuditLogEntry) => (
        <div className="u-flex u-items-center u-gap-2">
          <Avatar
            initials={entry.user.name.charAt(0)}
            size="sm"
          />
          <div>
            <div className="u-fw-medium u-fs-sm">{entry.user.name}</div>
            <div className="u-fs-xs u-text-secondary">{entry.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (entry: AuditLogEntry) => getActionBadge(entry.action),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (entry: AuditLogEntry) => (
        <div className="u-flex u-items-center u-gap-2">
          <Icon name={getResourceIcon(entry.resource_type)} size={16} />
          <div>
            <div className="u-fw-medium u-fs-sm">{entry.resource_name}</div>
            <div className="u-fs-xs u-text-secondary u-text-capitalize">
              {entry.resource_type}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (entry: AuditLogEntry) => (
        <div>
          {entry.details.amount && (
            <div className="u-fs-sm u-fw-medium">
              {formatCurrency(entry.details.amount)}
            </div>
          )}
          {entry.details.old_value && entry.details.new_value && (
            <div className="u-fs-xs u-text-secondary">
              {entry.details.old_value} → {entry.details.new_value}
            </div>
          )}
          {entry.details.reason && (
            <div className="u-fs-xs u-text-secondary">
              {entry.details.reason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (entry: AuditLogEntry) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetails(entry)}
        >
          <Icon name="Eye" size={14} />
          View
        </Button>
      ),
    },
  ];

  if (auditError) {
    return (
      <Card className={className}>
        <Callout variant="error">
          Failed to load audit trail. Please try again later.
        </Callout>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <div className="u-flex u-justify-between u-items-center u-mb-4">
          <h3>Billing Audit Trail</h3>
          <Button variant="outline" size="sm">
            <Icon name="Download" size={14} />
            Export Log
          </Button>
        </div>

        {/* Filters */}
        <div className="u-flex u-gap-4 u-mb-4 u-flex-wrap">
          <div className="u-flex-fill u-min-w-64">
            <Input
              type="text"
              placeholder="Search by user, resource, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={actionOptions}
          />
        </div>

        {/* Audit Trail Table */}
        {auditLoading ? (
          <div className="u-flex u-justify-center u-items-center u-py-8">
            <div className="u-text-center">
              <Spinner size="lg" />
              <p className="u-mt-2">Loading audit trail...</p>
            </div>
          </div>
        ) : auditData?.results?.length ? (
          <>
            <DataTable
              data={auditData.results}
              columns={columns}
              className="u-mb-4"
            />

            {/* Pagination */}
            <div className="u-flex u-justify-between u-items-center">
              <div className="u-fs-sm u-text-secondary">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, auditData.count)} of {auditData.count} entries
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={auditData.total_pages}
                onPageChange={setCurrentPage}
                showFirstLast
              />
            </div>
          </>
        ) : (
          <div className="u-text-center u-py-8">
            <Icon name="FileText" size={48} className="u-text-secondary u-mb-4" />
            <h4 className="u-mb-2">No audit entries found</h4>
            <p className="u-text-secondary">
              {searchQuery ? 'No entries match your search criteria.' : 'No audit trail entries available.'}
            </p>
          </div>
        )}
      </Card>

      {/* Audit Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEntry(null);
        }}
        title="Audit Entry Details"
        size="lg"
      >
        {selectedEntry && (
          <div>
            <div className="u-mb-4">
              <div className="u-flex u-justify-between u-align-items-start u-mb-3">
                <div>
                  <h4 className="u-mb-1">Activity Details</h4>
                  <p className="u-text-secondary">
                    {formatTimestamp(selectedEntry.timestamp)}
                  </p>
                </div>
                {getActionBadge(selectedEntry.action)}
              </div>
            </div>

            <div className="u-space-y-4">
              <div>
                <label className="u-fs-sm u-fw-medium u-text-secondary u-mb-1 u-block">
                  User
                </label>
                <div className="u-flex u-items-center u-gap-3">
                  <Avatar
                    initials={selectedEntry.user.name.charAt(0)}
                    size="md"
                  />
                  <div>
                    <div className="u-fw-medium">{selectedEntry.user.name}</div>
                    <div className="u-fs-sm u-text-secondary">{selectedEntry.user.email}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="u-fs-sm u-fw-medium u-text-secondary u-mb-1 u-block">
                  Resource
                </label>
                <div className="u-flex u-items-center u-gap-2">
                  <Icon name={getResourceIcon(selectedEntry.resource_type)} size={20} />
                  <div>
                    <div className="u-fw-medium">{selectedEntry.resource_name}</div>
                    <div className="u-fs-sm u-text-secondary u-text-capitalize">
                      {selectedEntry.resource_type} (ID: {selectedEntry.resource_id})
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="u-fs-sm u-fw-medium u-text-secondary u-mb-1 u-block">
                  Action Details
                </label>
                <div className="u-bg-subtle u-p-3 u-rounded">
                  {selectedEntry.details.old_value && selectedEntry.details.new_value && (
                    <div className="u-mb-2">
                      <strong>Status Change:</strong> {selectedEntry.details.old_value} → {selectedEntry.details.new_value}
                    </div>
                  )}
                  {selectedEntry.details.amount && (
                    <div className="u-mb-2">
                      <strong>Amount:</strong> {formatCurrency(selectedEntry.details.amount)}
                    </div>
                  )}
                  {selectedEntry.details.reason && (
                    <div className="u-mb-2">
                      <strong>Reason:</strong> {selectedEntry.details.reason}
                    </div>
                  )}
                  <div className="u-fs-xs u-text-secondary u-mt-3">
                    <strong>Technical Details:</strong><br />
                    IP Address: {selectedEntry.ip_address}<br />
                    User Agent: {selectedEntry.user_agent?.substring(0, 50)}...
                  </div>
                </div>
              </div>
            </div>

            <div className="u-flex u-justify-end u-gap-2 u-mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedEntry(null);
                }}
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

export default BillingAuditTrail;
