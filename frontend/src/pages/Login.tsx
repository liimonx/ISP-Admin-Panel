import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

type LoginFormData = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError(null);
      await login(data.username, data.password);
      toast.success('Login successful!');
    } catch (error) {
      setLoginError('Invalid username or password');
      toast.error('Login failed');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo and Title */}
        <div className="login-header">
          <div className="login-logo">🌐</div>
          <h1 className="login-title">ISP Admin Panel</h1>
          <p className="login-subtitle">Sign in to manage your ISP operations</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          {loginError && (
            <div className="login-error">
              {loginError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">👤</span>
              <input
                {...register('username')}
                type="text"
                id="username"
                className={`form-input ${errors.username ? 'form-input--error' : ''}`}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
            </div>
            {errors.username && (
              <div className="form-error">{errors.username.message}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">🔒</span>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={togglePasswordVisibility}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <div className="form-error">{errors.password.message}</div>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="login-demo">
          <h3>Demo Credentials:</h3>
          <div className="login-demo-credentials">
            <div className="login-demo-item">
              <strong>Admin:</strong> admin / admin123
            </div>
            <div className="login-demo-item">
              <strong>Support:</strong> support / support123
            </div>
            <div className="login-demo-item">
              <strong>Accountant:</strong> accountant / accountant123
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <p>© 2024 ISP Admin Panel. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
