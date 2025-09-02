import React from "react";
import { Button, Icon } from "@shohojdhara/atomix";

export interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  stats?: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  children,
  actions,
  stats,
  breadcrumbs,
  className = "",
}) => {
  return (
    <div className={`u-space-y-8 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="u-d-flex u-align-items-center u-gap-2 u-text-sm u-text-secondary">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <Icon name="CaretRight" size={12} className="u-text-secondary" />
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="u-text-secondary hover:u-text-primary u-transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="u-text-foreground u-font-weight-medium">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Page Header */}
      <div className="u-mb-8">
        <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-4">
          <div className="u-flex-1 u-min-width-0">
            <h1 className="u-text-3xl u-font-weight-bold u-mb-2 u-text-foreground u-truncate">
              {title}
            </h1>
            {description && (
              <p className="u-text-secondary u-text-lg u-max-width-2xl">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="u-d-flex u-gap-3 u-flex-shrink-0 u-ml-4">
              {actions}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {stats && stats.length > 0 && (
          <div className="u-d-flex u-gap-6 u-text-sm u-flex-wrap">
            {stats.map((stat, index) => (
              <div key={index} className="u-d-flex u-align-items-center u-gap-2">
                <div
                  className={`u-w-3 u-h-3 u-rounded-circle ${
                    stat.color || "u-bg-primary"
                  }`}
                ></div>
                <span className="u-text-secondary">
                  {stat.label}: <span className="u-font-weight-medium">{stat.value}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
};

export default PageLayout;