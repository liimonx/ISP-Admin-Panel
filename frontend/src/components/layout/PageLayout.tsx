import React from "react";
import { Icon, Hero } from "@shohojdhara/atomix";

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
        <nav className="u-flex u-items-center u-gap-2 u-fs-sm u-text-secondary-emphasis">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <Icon
                  name="CaretRight"
                  size={12}
                  className="u-text-secondary-emphasis"
                />
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="u-text-secondary-emphasis hover:u-text-primary u-transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="u-text-foreground u-font-normal">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <Hero title={title} text={description} actions={actions} />

      {/* Quick Stats */}
      {stats && stats.length > 0 && (
        <div className="u-flex u-gap-6 u-fs-sm u-flex-wrap">
          {stats.map((stat, index) => (
            <div key={index} className="u-flex u-items-center u-gap-2">
              <div
                className={`u-w-3 u-h-3 u-rounded-circle ${
                  stat.color || "u-bg-primary"
                }`}
              ></div>
              <span className="u-text-secondary-emphasis">
                {stat.label}:{" "}
                <span className="u-font-normal">{stat.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageLayout;
