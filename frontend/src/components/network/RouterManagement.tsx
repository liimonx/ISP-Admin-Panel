import React, { useState, useEffect } from 'react';
import { routerService } from '../../services/routerService';

interface Router {
  id: number;
  name: string;
  host: string;
  api_port: number;
  status: 'online' | 'offline' | 'maintenance';
  router_type: string;
  location?: string;
  use_tls: boolean;
  username: string;
}

const RouterManagement: React.FC = () => {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);

  useEffect(() => {
    loadRouters();
  }, []);

  const loadRouters = async () => {
    try {
      const response = await routerService.getRouters();
      setRouters(response.data || []);
    } catch (error) {
      console.error('Failed to load routers:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (router: Router) => {
    setTestingConnection(router.id);
    try {
      const result = await routerService.testRouterConnection(router.id);
      if (result.success) {
        setRouters(prev => prev.map(r => 
          r.id === router.id ? { ...r, status: 'online' as const } : r
        ));
        alert(`Connection successful to ${router.name}`);
      } else {
        alert(`Connection failed to ${router.name}`);
      }
    } catch (error) {
      alert(`Connection test failed: ${error}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': 
        return 'u-bg-success-subtle u-text-success u-inline-flex u-px-2 u-py-1 u-text-xs u-fw-semibold u-rounded'; 
      case 'offline': 
        return 'u-bg-error-subtle u-c-error u-inline-flex u-px-2 u-py-1 u-text-xs u-fw-semibold u-rounded'; 
      case 'maintenance': 
        return 'u-bg-warning-subtle u-c-warning u-inline-flex u-px-2 u-py-1 u-text-xs u-fw-semibold u-rounded'; 
      default: 
        return 'u-bg-secondary-subtle u-c-secondary u-inline-flex u-px-2 u-py-1 u-text-xs u-fw-semibold u-rounded';
    }
  };

  if (loading) {
    return <div className="u-p-6">Loading routers...</div>;
  }

  return (
    <div className="u-p-6">
      <h2 className="u-text-2xl u-fw-bold u-mb-6">Router Management</h2>
      
      <div className="u-bg-surface u-rounded u-shadow u-overflow-hidden">
        <table className="u-w-100 uivide-y uivide-gray-200">
          <thead className="u-bg-subtle">
            <tr>
              <th className="u-px-6 u-py-3 u-text-left u-text-xs u-fw-medium u-text-secondary-emphasis u-uppercase">
                Router
              </th>
              <th className="u-px-6 u-py-3 u-text-left u-text-xs u-fw-medium u-text-secondary-emphasis u-uppercase">
                Status
              </th>
              <th className="u-px-6 u-py-3 u-text-left u-text-xs u-fw-medium u-text-secondary-emphasis u-uppercase">
                Type
              </th>
              <th className="u-px-6 u-py-3 u-text-left u-text-xs u-fw-medium u-text-secondary-emphasis u-uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="u-bg-surface uivide-y uivide-gray-200">
            {routers.map((router) => (
              <tr key={router.id}>
                <td className="u-px-6 u-py-4 u-whitespace-nowrap">
                  <div>
                    <div className="u-text-sm u-fw-medium u-text-foreground">{router.name}</div>
                    <div className="u-text-sm u-text-secondary-emphasis">{router.host}:{router.api_port}</div>
                  </div>
                </td>
                <td className="u-px-6 u-py-4 u-whitespace-nowrap">
                  <span className={getStatusColor(router.status)}>
                    {router.status}
                  </span>
                </td>
                <td className="u-px-6 u-py-4 u-whitespace-nowrap u-text-sm u-text-foreground">
                  {router.router_type}
                </td>
                <td className="u-px-6 u-py-4 u-whitespace-nowrap u-text-sm u-fw-medium">
                  <button
                    onClick={() => testConnection(router)}
                    disabled={testingConnection === router.id}
                    className="u-text-primary hover:u-text-primary-focus u-opacity-60 hover:u-opacity-100 u-transition-opacity u-border-0 u-bg-transparent u-cursor-pointer"
                  >
                    {testingConnection === router.id ? 'Testing...' : 'Test Connection'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouterManagement;