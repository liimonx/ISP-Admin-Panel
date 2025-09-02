import React from "react";
import { Button, Icon, Card } from "@shohojdhara/atomix";

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  variant?: "primary" | "outline" | "ghost";
  disabled?: boolean;
  badge?: string;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  title = "Quick Actions",
  className = "",
}) => {
  return (
    <Card className={`${className}`}>
      <div className="u-mb-4">
        <h3 className="u-text-lg u-font-weight-semibold u-mb-1">{title}</h3>
        <p className="u-text-sm u-text-secondary">
          Common tasks and shortcuts
        </p>
      </div>
      
      <div className="u-d-grid u-grid-cols-2 u-gap-3">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || "outline"}
            size="md"
            onClick={action.onClick}
            disabled={action.disabled}
            className="u-d-flex u-flex-column u-align-items-center u-gap-2 u-p-4 u-h-auto u-position-relative"
          >
            <Icon name={action.icon as any} size={24} />
            <span className="u-text-sm u-font-weight-medium">{action.label}</span>
            {action.badge && (
              <span className="u-position-absolute u-top-2 u-right-2 u-bg-primary u-text-white u-text-xs u-px-2 u-py-1 u-rounded-full">
                {action.badge}
              </span>
            )}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;