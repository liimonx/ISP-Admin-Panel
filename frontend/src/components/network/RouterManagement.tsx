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
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <div className="p-6">Loading routers...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Router Management</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Router
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routers.map((router) => (
              <tr key={router.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{router.name}</div>
                    <div className="text-sm text-gray-500">{router.host}:{router.api_port}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(router.status)}`}>
                    {router.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {router.router_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => testConnection(router)}
                    disabled={testingConnection === router.id}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
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