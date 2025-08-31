import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
  Textarea,
  Callout,
  Spinner,
  Select,
  Checkbox,
} from '@shohojdhara/atomix';
import { Plan } from '@/types';

interface PlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan | null;
  onSubmit: (data: Partial<Plan>) => void;
  isLoading?: boolean;
}

const PlanForm: React.FC<PlanFormProps> = ({
  isOpen,
  onClose,
  plan,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    download_speed: 0,
    upload_speed: 0,
    speed_unit: 'mbps' as 'mbps' | 'gbps',
    data_quota: 0,
    quota_unit: 'gb' as 'gb' | 'tb' | 'unlimited',
    price: 0,
    setup_fee: 0,
    billing_cycle: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    is_active: true,
    is_featured: false,
    is_popular: false,
    features: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        download_speed: plan.download_speed || 0,
        upload_speed: plan.upload_speed || 0,
        speed_unit: plan.speed_unit || 'mbps',
        data_quota: plan.data_quota || 0,
        quota_unit: plan.quota_unit || 'gb',
        price: plan.price || 0,
        setup_fee: plan.setup_fee || 0,
        billing_cycle: plan.billing_cycle || 'monthly',
        is_active: plan.is_active ?? true,
        is_featured: plan.is_featured ?? false,
        is_popular: plan.is_popular ?? false,
        features: plan.features || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        download_speed: 0,
        upload_speed: 0,
        speed_unit: 'mbps',
        data_quota: 0,
        quota_unit: 'gb',
        price: 0,
        setup_fee: 0,
        billing_cycle: 'monthly',
        is_active: true,
        is_featured: false,
        is_popular: false,
        features: [],
      });
    }
    setErrors({});
  }, [plan, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (formData.download_speed <= 0) {
      newErrors.download_speed = 'Download speed must be greater than 0';
    }

    if (formData.upload_speed <= 0) {
      newErrors.upload_speed = 'Upload speed must be greater than 0';
    }

    if (formData.quota_unit !== 'unlimited' && formData.data_quota <= 0) {
      newErrors.data_quota = 'Data quota must be greater than 0 or set to unlimited';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (formData.setup_fee < 0) {
      newErrors.setup_fee = 'Setup fee cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const planData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      data_quota: formData.quota_unit === 'unlimited' ? undefined : formData.data_quota,
    };

    onSubmit(planData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      download_speed: 0,
      upload_speed: 0,
      speed_unit: 'mbps',
      data_quota: 0,
      quota_unit: 'gb',
      price: 0,
      setup_fee: 0,
      billing_cycle: 'monthly',
      is_active: true,
      is_featured: false,
      is_popular: false,
      features: [],
    });
    setErrors({});
    setNewFeature('');
    onClose();
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={plan ? 'Edit Plan' : 'Create New Plan'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="u-space-y-6">
        {/* Basic Information */}
        <div className="u-space-y-4">
          <h3 className="u-text-lg u-font-weight-semibold">Basic Information</h3>
          
          <div>
            <label className="u-block u-mb-2 u-font-weight-medium">Plan Name *</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter plan name"
              error={errors.name}
            />
          </div>

          <div>
            <label className="u-block u-mb-2 u-font-weight-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter plan description"
              rows={3}
            />
          </div>
        </div>

        {/* Speed Configuration */}
        <div className="u-space-y-4">
          <h3 className="u-text-lg u-font-weight-semibold">Speed Configuration</h3>
          
          <div className="u-grid u-grid-cols-2 u-gap-4">
            <div>
              <label className="u-block u-mb-2 u-font-weight-medium">Download Speed *</label>
              <Input
                type="number"
                value={formData.download_speed}
                onChange={(e) => setFormData(prev => ({ ...prev, download_speed: Number(e.target.value) }))}
                placeholder="0"
                min="0"
                step="0.1"
                error={errors.download_speed}
              />
            </div>
            <div>
              <label className="u-block u-mb-2 u-font-weight-medium">Upload Speed *</label>
              <Input
                type="number"
                value={formData.upload_speed}
                onChange={(e) => setFormData(prev => ({ ...prev, upload_speed: Number(e.target.value) }))}
                placeholder="0"
                min="0"
                step="0.1"
                error={errors.upload_speed}
              />
            </div>
          </div>

          <div>
            <label className="u-block u-mb-2 u-font-weight-medium">Speed Unit</label>
            <Select
              value={formData.speed_unit}
              onChange={(value) => setFormData(prev => ({ ...prev, speed_unit: value as 'mbps' | 'gbps' }))}
              options={[
                { value: 'mbps', label: 'Mbps' },
                { value: 'gbps', label: 'Gbps' },
              ]}
            />
          </div>
        </div>

        {/* Data Configuration */}
        <div className="u-space-y-4">
          <h3 className="u-text-lg u-font-weight-semibold">Data Configuration</h3>
          
          <div className="u-grid u-grid-cols-2 u-gap-4">
            <div>
              <label className="u-block u-mb-2 u-font-weight-medium">Data Quota</label>
              <Input
                type="number"
                value={formData.data_quota}
                onChange={(e) => setFormData(prev => ({ ...prev, data_quota: Number(e.target.value) }))}
                placeholder="0"
                min="0"
                step="0.1"
                disabled={formData.quota_unit === 'unlimited'}
                error={errors.data_quota}
              />
            </div>
            <div>
              <label className="u-block u-mb-2 u-font-weight-medium">Quota Unit</label>
              <Select
                value={formData.quota_unit}
                onChange={(value) => setFormData(prev => ({ ...prev, quota_unit: value as 'gb' | 'tb' | 'unlimited' }))}
                options={[
                  { value: 'gb', label: 'GB' },
                  { value: 'tb', label: 'TB' },
                  { value: 'unlimited', label: 'Unlimited' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="u-space-y-4">
          <h3 className="u-text-lg u-font-weight-semibold">Pricing</h3>
          
          <div className="u-grid u-grid-cols-2 u-gap-4">
            <div>
              <label className="u-block u-mb-2 u-font-weight-medium">Monthly Price</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="0.00"
                min="0"
                step="0.01"
                error={errors.price}
              />
            </div>
            <div>
              <label className="u-block u-mb-2 u-font-weight-medium">Setup Fee</label>
              <Input
                type="number"
                value={formData.setup_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, setup_fee: Number(e.target.value) }))}
                placeholder="0.00"
                min="0"
                step="0.01"
                error={errors.setup_fee}
              />
            </div>
          </div>

          <div>
            <label className="u-block u-mb-2 u-font-weight-medium">Billing Cycle</label>
            <Select
              value={formData.billing_cycle}
              onChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value as 'monthly' | 'quarterly' | 'yearly' }))}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </div>
        </div>

        {/* Plan Status */}
        <div className="u-space-y-4">
          <h3 className="u-text-lg u-font-weight-semibold">Plan Status</h3>
          
          <div className="u-space-y-3">
            <Checkbox
              checked={formData.is_active}
              onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              label="Active Plan"
            />
            <Checkbox
              checked={formData.is_featured}
              onChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              label="Featured Plan"
            />
            <Checkbox
              checked={formData.is_popular}
              onChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
              label="Popular Plan"
            />
          </div>
        </div>

        {/* Features */}
        <div className="u-space-y-4">
          <h3 className="u-text-lg u-font-weight-semibold">Features</h3>
          
          <div className="u-space-y-3">
            <div className="u-d-flex u-gap-2">
              <Input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature..."
                onKeyPress={handleKeyPress}
                className="u-flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={addFeature}
                disabled={!newFeature.trim()}
              >
                Add
              </Button>
            </div>

            {formData.features.length > 0 && (
              <div className="u-d-flex u-flex-wrap u-gap-2">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="u-d-flex u-align-items-center u-gap-2 u-bg-primary u-text-white u-px-3 u-py-1 u-border-radius-full u-text-sm"
                  >
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="u-bg-transparent u-border-0 u-text-white u-cursor-pointer u-p-0 u-d-flex u-align-items-center u-justify-content-center u-width-4 u-height-4 hover:u-bg-white hover:u-text-primary u-border-radius-full"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="u-d-flex u-justify-content-end u-gap-3 u-pt-4 u-border-top">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                {plan ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              plan ? 'Update Plan' : 'Create Plan'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PlanForm;
