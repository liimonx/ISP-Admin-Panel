import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  Spinner,
} from '@shohojdhara/atomix';

type LoginFormData = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check if we have a redirect URL in localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = localStorage.getItem('redirect_after_login');
      if (redirectUrl) {
        localStorage.removeItem('redirect_after_login');
        navigate(redirectUrl, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);

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
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your credentials.';
            break;
          case 401:
            errorMessage = 'Invalid username or password.';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setLoginError(errorMessage);
      toast.error('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDemoLogin = async (username: string, password: string) => {
    setFormData({ username, password });
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      await login(username, password);
      toast.success('Demo login successful!');
    } catch (error) {
      setLoginError('Demo login failed. Please try again.');
      toast.error('Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already authenticated, redirect to home
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container className="u-min-vh-100 u-flex u-items-center u-justify-center">
      <Grid>
        <GridCol xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="u-p-6">
            {/* Logo and Title */}
            <div className="u-text-center u-mb-6">
              <div className="u-mb-4">
                <Icon name="Globe" size={48} className="u-text-primary" />
              </div>
              <h1 className="u-mb-2">ISP Admin Panel</h1>
              <p className="u-text-secondary-emphasis">Sign in to manage your ISP operations</p>
            </div>

            {/* Login Form */}
            <form onSubmit={onSubmit}>
              {loginError && (
                <Callout variant="error" className="u-mb-4">
                  {loginError}
                </Callout>
              )}

              <div className="u-mb-4">
                <label htmlFor="username" className="u-block u-mb-2 u-fw-medium">Username</label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  name="username"
                  disabled={isSubmitting}
                />
                {errors.username && (
                  <div className="u-text-error u-text-sm u-mt-1">{errors.username}</div>
                )}
              </div>

              <div className="u-mb-4">
                <label htmlFor="password" className="u-block u-mb-2 u-fw-medium">Password</label>
                <div className="u-relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    name="password"
                    disabled={isSubmitting}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={togglePasswordVisibility}
                    aria-label="Toggle password visibility"
                    className="u-position-absolute u-right-2 u-top-50 u-transform-translate-y-50"
                    disabled={isSubmitting}
                  >
                    <Icon name={showPassword ? 'EyeSlash' : 'Eye'} size={16} />
                  </Button>
                </div>
                {errors.password && (
                  <div className="u-text-error u-text-sm u-mt-1">{errors.password}</div>
                )}
              </div>

              <div className="u-flex u-items-center u-justify-between u-mb-4">
                <div className="u-flex u-items-center u-gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    className="u-w-4 u-h-4 u-m-0 u-bg-white u-border u-border-solid u-border-gray-300 u-rounded u-text-primary u-shadow-sm focus:u-outline-none focus:u-border-blue-500"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="rememberMe" className="u-text-sm u-text-foreground">
                    Remember me
                  </label>
                </div>
                
                <Button 
                  variant="link" 
                  size="sm"
                  type="button"
                  className="u-p-0"
                  onClick={() => navigate('/forgot-password')}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="u-w-100 u-mb-4"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Spinner size="sm" className="u-me-2" />
                    Signing In...
                  </>
                ) : 'Sign In'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="u-mt-6 u-pt-6 u-border-top">
              <h3 className="u-mb-3">Demo Credentials:</h3>
              <div className="u-space-y-3">
                <div className="u-flex u-flex-wrap u-gap-2">
                  <Button 
                    size="sm" 
                    variant="outline-primary"
                    onClick={() => handleDemoLogin('admin', 'changeme123!')}
                    disabled={isSubmitting}
                  >
                    Admin Login
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline-secondary"
                    onClick={() => handleDemoLogin('support', 'changeme123!')}
                    disabled={isSubmitting}
                  >
                    Support Login
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline-success"
                    onClick={() => handleDemoLogin('accountant', 'changeme123!')}
                    disabled={isSubmitting}
                  >
                    Accountant Login
                  </Button>
                </div>
                
                <div className="u-text-sm u-text-secondary">
                  <p className="u-mb-1"><strong>Admin:</strong> admin / changeme123!</p>
                  <p className="u-mb-1"><strong>Support:</strong> support / changeme123!</p>
                  <p className="u-mb-0"><strong>Accountant:</strong> accountant / changeme123!</p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Footer */}
          <div className="u-text-center u-mt-4 u-text-sm u-text-secondary-emphasis">
            <p>© {new Date().getFullYear()} ISP Admin Panel. All rights reserved.</p>
          </div>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default Login;