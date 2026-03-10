import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  Input,
  Button,
  Icon,
  Container,
  Checkbox,
  Callout,
  Spinner,
} from "@shohojdhara/atomix";

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
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check if we have a redirect URL in localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = localStorage.getItem("redirect_after_login");
      if (redirectUrl) {
        localStorage.removeItem("redirect_after_login");
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
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
      toast.success("Login successful!");
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";

      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = "Invalid request. Please check your credentials.";
            break;
          case 401:
            errorMessage = "Invalid username or password.";
            break;
          case 429:
            errorMessage = "Too many login attempts. Please try again later.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }

      setLoginError(errorMessage);
      toast.error("Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // If already authenticated, redirect to home
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container
      type="sm"
      className="u-min-vh-100 u-flex u-items-center u-justify-center"
    >
      <div className="u-w-100 u-max-w-md u-px-4 u-py-8">
        <Card className="u-p-6 u-p-md-8 u-shadow-lg">
          {/* Logo and Title */}
          <div className="u-text-center u-mb-6">
            <div className="u-flex u-justify-center u-mb-4">
              <div className="u-bg-primary-subtle u-border u-border-primary u-rounded-circle u-p-3 u-flex u-items-center u-justify-center">
                <Icon name="Globe" size={48} className="u-text-primary" />
              </div>
            </div>
            <h1 className="u-fs-2xl u-font-bold u-mb-2">ISP Admin Panel</h1>
            <p className="u-text-secondary-emphasis">
              Sign in to manage your ISP operations
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={onSubmit}>
            {loginError && (
              <Callout variant="error" className="u-mb-4">
                {loginError}
              </Callout>
            )}

            <div className="u-mb-4">
              <label
                htmlFor="username"
                className="u-block u-mb-2 u-font-normal"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                name="username"
                disabled={isSubmitting}
              />
              {errors.username && (
                <div className="u-text-error u-fs-sm u-mt-1">
                  {errors.username}
                </div>
              )}
            </div>

            <div className="u-mb-4">
              <label
                htmlFor="password"
                className="u-block u-mb-2 u-font-normal"
              >
                Password
              </label>
              <div className="u-relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  name="password"
                  disabled={isSubmitting}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label="Toggle password visibility"
                  className="u-absolute u-right-2 u-top-50 u-transform-translate-y-50"
                  disabled={isSubmitting}
                  iconName={showPassword ? "EyeSlash" : "Eye"}
                  iconSize="sm"
                />
              </div>
              {errors.password && (
                <div className="u-text-error u-fs-sm u-mt-1">
                  {errors.password}
                </div>
              )}
            </div>

            <div className="u-flex u-items-center u-justify-between u-mb-4">
              <div className="u-flex u-items-center u-gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  label="Remember me"
                />
              </div>

              <Button
                variant="link"
                size="sm"
                type="button"
                className="u-p-0"
                onClick={() => navigate("/forgot-password")}
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
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <div className="u-text-center u-mt-6 u-fs-sm u-text-secondary-emphasis">
          <p>
            © {new Date().getFullYear()} ISP Admin Panel. All rights reserved.
          </p>
        </div>
      </div>
    </Container>
  );
};

export default Login;
