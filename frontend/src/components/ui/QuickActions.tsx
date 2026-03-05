import React from "react";
import { Button, Card } from "@shohojdhara/atomix";

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
    <Card
      title={title}
      text="Common tasks and shortcuts"
      className={`${className}`}
    >
      <div className="u-flex u-gap-3 u-mt-3 u-flex-wrap">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || "outline"}
            onClick={action.onClick}
            disabled={action.disabled}
            iconName={action.icon as any}
            iconSize={16}
          >
            <span className="u-fs-sm u-font-normal">{action.label}</span>
            {action.badge && (
              <span className="u-absolute u-top-2 u-right-2 u-bg-primary u-fs-xs u-px-2 u-py-1 u-rounded-full">
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
