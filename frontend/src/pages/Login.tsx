import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  Input,
  Button,
  Icon,
  Container,
  Grid,
  GridCol,
  Callout,
} from '@shohojdhara/atomix';

type LoginFormData = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validateForm = () => {
    const newErrors: Partial<LoginFormData> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      await login(formData.username, formData.password);
      toast.success('Login successful!');
    } catch (error) {
      setLoginError('Invalid username or password');
      toast.error('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container className="u-h-100vh u-d-flex u-align-items-center u-justify-content-center">
      <Grid>
        <GridCol xs={12}>
          <Card className="u-p-6">
            {/* Logo and Title */}
            <div className="u-text-center u-mb-6">
              <div className="u-mb-4">
                <Icon name="Globe" size={48} className="u-text-primary" />
              </div>
              <h1 className="u-mb-2">ISP Admin Panel</h1>
              <p className="u-text-secondary">Sign in to manage your ISP operations</p>
            </div>

            {/* Login Form */}
            <form onSubmit={onSubmit}>
              {loginError && (
                <Callout variant="error" className="u-mb-4">
                  {loginError}
                </Callout>
              )}

              <div className="u-mb-4">
                <label htmlFor="username" className="u-block u-mb-2 u-font-weight-medium">Username</label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  name="username"
                />
                {errors.username && (
                  <div className="u-text-error u-text-sm u-mt-1">{errors.username}</div>
                )}
              </div>

              <div className="u-mb-6">
                <label htmlFor="password" className="u-block u-mb-2 u-font-weight-medium">Password</label>
                <div className="u-relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    name="password"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePasswordVisibility}
                    aria-label="Toggle password visibility"
                    className="u-position-absolute u-right-2 u-top-50 u-transform-translate-y-50"
                  >
                    <Icon name={showPassword ? 'EyeSlash' : 'Eye'} size={16} />
                  </Button>
                </div>
                {errors.password && (
                  <div className="u-text-error u-text-sm u-mt-1">{errors.password}</div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="u-width-100"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="u-mt-6 u-pt-6 u-border-top">
              <h3 className="u-mb-3">Demo Credentials:</h3>
              <div className="u-space-y-2">
                <div className="u-d-flex u-justify-content-between u-text-sm">
                  <span><strong>Admin:</strong></span>
                  <span>admin / admin123</span>
                </div>
                <div className="u-d-flex u-justify-content-between u-text-sm">
                  <span><strong>Support:</strong></span>
                  <span>support / support123</span>
                </div>
                <div className="u-d-flex u-justify-content-between u-text-sm">
                  <span><strong>Accountant:</strong></span>
                  <span>accountant / accountant123</span>
                </div>
              </div>
            </div>
          </Card>
        </GridCol>
      </Grid>

      {/* Footer */}
      <div className="u-position-absolute u-bottom-4 u-left-50 u-transform-translate-x-neg-50 u-text-center u-text-sm u-text-secondary">
        <p>© 2024 ISP Admin Panel. All rights reserved.</p>
      </div>
    </Container>
  );
};

export default Login;