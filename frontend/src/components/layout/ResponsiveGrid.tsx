import React from "react";
import { Grid, GridCol } from "@shohojdhara/atomix";

export interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = "u-gap-6",
  className = "",
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <Grid className={`${gap} ${className}`}>
      {childrenArray.map((child, index) => (
        <GridCol
          key={index}
          xs={columns.xs ? 12 / columns.xs : 12}
          sm={columns.sm ? 12 / columns.sm : undefined}
          md={columns.md ? 12 / columns.md : undefined}
          lg={columns.lg ? 12 / columns.lg : undefined}
          xl={columns.xl ? 12 / columns.xl : undefined}
        >
          {child}
        </GridCol>
      ))}
    </Grid>
  );
};

export default ResponsiveGrid;