# Atomix Design System Integration

A comprehensive implementation of Atomic Design principles using the **@shohojdhara/atomix** library for building scalable, maintainable, and consistent user interfaces.

## Overview

This project implements a modern ISP Admin Panel using Atomix components organized according to Atomic Design principles. The structure promotes reusability, consistency, and maintainability across the entire application.

## Design System Architecture

### Atomic Design Hierarchy

```
src/components/
├── ui/                    # Re-exports all Atomix components
├── molecules/             # Simple combinations of atoms
├── organisms/             # Complex UI components
├── templates/             # Page-level layouts
└── pages/                # Specific instances with real content
```

## Available Atomix Components

### Atoms (Basic Building Blocks)

#### Actions
- `Button` - Flexible button with multiple variants
- `Toggle` - Switch/toggle component
- `ColorModeToggle` - Light/dark mode switcher

#### Display Elements
- `Badge` - Status/label indicators
- `Icon` - Icon component with extensive icon set
- `Avatar` - User profile pictures with fallbacks
- `Progress` - Progress bars and indicators
- `Spinner` - Loading indicators
- `Rating` - Star rating component

#### Form Elements
- `Input` - Text input fields
- `Checkbox` - Checkbox inputs
- `Radio` - Radio button inputs
- `Select` - Dropdown selectors
- `Textarea` - Multi-line text inputs
- `Upload` - File upload component
- `DatePicker` - Date selection component
- `Slider` - Range slider component

### Molecules (Simple Combinations)

#### Navigation Elements
- `Breadcrumb` - Navigation breadcrumbs
- `NavItem` - Individual navigation items
- `SideMenuItem` - Sidebar menu items

#### Content Display
- `AvatarGroup` - Multiple avatars grouped together
- `List` - Structured list component
- `Steps` - Step-by-step progress indicator
- `FormGroup` - Form field groupings

#### Interactive Elements
- `Dropdown` - Dropdown menus with content
- `Popover` - Floating content containers
- `Tooltip` - Hover information displays

### Organisms (Complex Components)

#### Layout Components
- `Card` - Content containers with styling
- `Block` - Generic content blocks
- `Accordion` - Collapsible content sections
- `Modal` - Dialog/popup windows
- `EdgePanel` - Side panels

#### Navigation Organisms
- `Nav` - Main navigation component
- `Navbar` - Top navigation bars
- `SideMenu` - Sidebar navigation
- `SideMenuList` - Sidebar menu containers

#### Form Organisms
- `Form` - Complete form components

#### Data Display
- `DataTable` - Advanced data tables
- `Pagination` - Page navigation controls
- `Tab` - Tabbed content interface

#### Charts & Visualization
- `Chart` - Base chart component
- `AreaChart` - Area/line charts
- `BarChart` - Bar and column charts
- `LineChart` - Line graphs
- `PieChart` - Pie charts
- `DonutChart` - Donut charts
- `GaugeChart` - Gauge/speedometer charts
- `ScatterChart` - Scatter plot charts
- `RadarChart` - Radar/spider charts
- `BubbleChart` - Bubble charts
- `CandlestickChart` - Financial candlestick charts
- `FunnelChart` - Funnel visualization
- `HeatmapChart` - Heatmap visualization
- `TreemapChart` - Treemap visualization
- `WaterfallChart` - Waterfall charts
- `RealTimeChart` - Live updating charts
- `AdvancedChart` - Advanced chart features
- `AnimatedChart` - Charts with animations
- `MultiAxisChart` - Multiple axis support

#### Communication & Feedback
- `Callout` - Highlighted information blocks
- `Messages` - Message/chat components
- `Todo` - Task list components
- `Countdown` - Countdown timers

#### Media & Rich Content
- `PhotoViewer` - Image gallery viewer
- `VideoPlayer` - Video playback component
- `ProductReview` - Product review display
- `Testimonial` - Customer testimonial component

### Templates (Layout Structures)

#### Grid System
- `Grid` - CSS Grid layout system
- `GridCol` - Grid column component
- `Container` - Content containers
- `Row` - Grid row component
- `MasonryGrid` - Masonry layout
- `MasonryGridItem` - Masonry grid items

#### Page Templates
- `Hero` - Hero section component
- `SectionIntro` - Section introduction component

#### Special Components
- `AtomixLogo` - Atomix branding component
- `River` - Flow layout component

## Custom Atomic Components

### Molecules

#### `SearchBar`
Combines Input, Button, and Icon atoms for search functionality.
```tsx
<SearchBar
  placeholder="Search customers, plans, or network devices..."
  onSearch={handleSearch}
  onClear={handleClear}
  fullWidth
/>
```

#### `StatCard`
Combines Card, Icon, and text elements for displaying statistics.
```tsx
<StatCard
  title="Total Customers"
  value={1247}
  icon="Users"
  iconColor="#7AFFD7"
  trend={{ value: 12, isPositive: true }}
  description="vs last month"
/>
```

#### `UserAvatar`
Enhanced Avatar with status indicators and dropdown menu.
```tsx
<UserAvatar
  user={user}
  size="md"
  showStatus
  showDropdown
  dropdownItems={menuItems}
/>
```

### Organisms

#### `Header`
Complete navigation header with search, notifications, and user menu.
```tsx
<Header
  user={user}
  notifications={3}
  onSearch={handleSearch}
  onNotificationClick={handleNotifications}
  showSearch={true}
  showNotifications={true}
  showUserMenu={true}
/>
```

#### `Sidebar`
Collapsible navigation sidebar with nested menu items.
```tsx
<Sidebar
  collapsed={false}
  onToggle={handleToggle}
  user={user}
/>
```

## Usage Examples

### Basic Component Usage
```tsx
import {
  Button,
  Card,
  Grid,
  GridCol,
  AreaChart,
  Badge
} from '@shohojdhara/atomix';

// Basic button
<Button variant="primary" size="md">
  Click Me
</Button>

// Card with content
<Card>
  <h3>Dashboard Stats</h3>
  <p>Your performance metrics</p>
</Card>

// Grid layout
<Grid>
  <GridCol xs={12} md={6} lg={4}>
    <Card>Column 1</Card>
  </GridCol>
  <GridCol xs={12} md={6} lg={4}>
    <Card>Column 2</Card>
  </GridCol>
</Grid>

// Charts
<AreaChart datasets={chartData} size="lg" />

// Badge
<Badge variant="success" size="sm" label="Active" />
```

### Advanced Dashboard Implementation
```tsx
import React from 'react';
import {
  Grid,
  GridCol,
  Card,
  BarChart,
  LineChart,
  DonutChart,
  Button,
  Icon,
  Badge,
  Progress,
  Avatar
} from '@shohojdhara/atomix';
import { StatCard } from '../components/molecules/StatCard';

const Dashboard = () => {
  const stats = [
    {
      title: "Total Customers",
      value: 1247,
      icon: "Users",
      iconColor: "#7AFFD7",
      trend: { value: 12, isPositive: true }
    },
    {
      title: "Active Subscriptions", 
      value: 1089,
      icon: "Link",
      iconColor: "#1AFFD2",
      trend: { value: 8, isPositive: true }
    }
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Stats Grid */}
      <Grid className="u-mb-6">
        {stats.map((stat, index) => (
          <GridCol key={index} xs={12} md={6} lg={3}>
            <StatCard {...stat} />
          </GridCol>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid>
        <GridCol xs={12} lg={8}>
          <Card>
            <h3>Revenue Analytics</h3>
            <AreaChart datasets={revenueData} size="lg" />
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card>
            <h3>Distribution</h3>
            <DonutChart datasets={distributionData} size="md" />
          </Card>
        </GridCol>
      </Grid>
    </div>
  );
};
```

## Styling System

### Utility Classes
Atomix provides comprehensive utility classes following a consistent naming convention based on the ITCSS methodology. These classes enable quick styling without writing custom CSS.

#### Naming Convention
```
.u-{property}-{value}
.u-{property}-{breakpoint}-{value}
```

Examples:
- `.u-m-4` - Margin 1rem (4 * 0.25rem)
- `.u-p-8` - Padding 2rem (8 * 0.25rem)
- `.u-text-center` - Center text alignment
- `.u-flex` - Display flex
- `.u-justify-center` - Justify content center

#### Spacing Utilities

##### Margin Classes
```css
/* All sides - Numeric scale (0.25rem increments) */
.u-m-0      /* 0 */
.u-m-1      /* 0.25rem */
.u-m-2      /* 0.5rem */
.u-m-3      /* 0.75rem */
.u-m-4      /* 1rem */
.u-m-5      /* 1.25rem */
.u-m-6      /* 1.5rem */
.u-m-8      /* 2rem */
.u-m-10     /* 2.5rem */
.u-m-12     /* 3rem */
/* ... up to .u-m-90 (22.5rem) */

/* Specific sides */
.u-mt-4     /* margin-top */
.u-me-6     /* margin-end (right in LTR) */
.u-mb-2     /* margin-bottom */
.u-ms-8     /* margin-start (left in LTR) */

/* Horizontal/Vertical */
.u-mx-4     /* margin-left + margin-right */
.u-my-6     /* margin-top + margin-bottom */

/* Auto margins */
.u-m-auto
.u-mx-auto
.u-my-auto
```

##### Padding Classes
```css
/* All sides - Numeric scale (0.25rem increments) */
.u-p-0      /* 0 */
.u-p-1      /* 0.25rem */
.u-p-2      /* 0.5rem */
.u-p-3      /* 0.75rem */
.u-p-4      /* 1rem */
.u-p-5      /* 1.25rem */
.u-p-6      /* 1.5rem */
.u-p-8      /* 2rem */
.u-p-10     /* 2.5rem */
.u-p-12     /* 3rem */
/* ... up to .u-p-90 (22.5rem) */

/* Specific sides */
.u-pt-4     /* padding-top */
.u-pe-6     /* padding-end (right in LTR) */
.u-pb-2     /* padding-bottom */
.u-ps-8     /* padding-start (left in LTR) */

/* Horizontal/Vertical */
.u-px-4     /* padding-left + padding-right */
.u-py-6     /* padding-top + padding-bottom */
```

##### Usage Examples
```html
<!-- Card with consistent spacing -->
<div class="c-card u-p-6 u-mb-4">
  <h3 class="u-mb-2">Card Title</h3>
  <p class="u-mb-4">Card content with proper spacing.</p>
  <button class="c-button c-button--primary">Action</button>
</div>

<!-- Form with spacing -->
<form class="u-my-8">
  <div class="u-mb-4">
    <label class="u-mb-1">Email</label>
    <input class="c-input" type="email">
  </div>
  <button class="c-button u-mt-4">Submit</button>
</form>
```

#### Layout Utilities

##### Display Classes
```css
.u-block
.u-inline
.u-inline-block
.u-flex
.u-inline-flex
.u-grid
.u-none
.u-visually-hidden    /* visually hidden but accessible */
```

##### Flexbox Utilities
```css
/* Flex container */
.u-flex
.u-inline-flex

/* Direction */
.u-flex-row
.u-flex-row-reverse
.u-flex-column
.u-flex-column-reverse

/* Wrap */
.u-flex-wrap
.u-flex-nowrap
.u-flex-wrap-reverse

/* Justify content */
.u-justify-start
.u-justify-end
.u-justify-center
.u-justify-between
.u-justify-around
.u-justify-evenly

/* Align items */
.u-items-start
.u-items-end
.u-items-center
.u-items-baseline
.u-items-stretch

/* Align content */
.u-align-content-start
.u-align-content-end
.u-align-content-center
.u-align-content-between
.u-align-content-around
.u-align-content-stretch

/* Flex item */
.u-flex-fill
.u-flex-grow-0
.u-flex-grow-1
.u-flex-shrink-0
.u-flex-shrink-1
```

##### Grid Utilities
```css
.u-grid
.u-inline-grid

/* Grid template columns */
.u-grid-cols-1
.u-grid-cols-2
.u-grid-cols-3
.u-grid-cols-4
.u-grid-cols-5
.u-grid-cols-6
.u-grid-cols-12

/* Grid template rows */
.u-grid-rows-1
.u-grid-rows-2
.u-grid-rows-3
.u-grid-rows-4

/* Gap */
.u-gap-xs
.u-gap-sm
.u-gap-md
.u-gap-lg
.u-gap-xl

/* Column/Row gap */
.u-gap-x-md
.u-gap-y-lg

/* Grid item */
.u-col-span-1
.u-col-span-2
.u-col-span-3
.u-col-span-full

.u-row-span-1
.u-row-span-2
.u-row-span-full
```

##### Position Utilities
```css
.u-pos-static
.u-pos-relative
.u-pos-absolute
.u-pos-fixed
.u-pos-sticky

/* Positioning */
.u-top-0
.u-right-0
.u-bottom-0
.u-left-0

.u-inset-0       /* top, right, bottom, left: 0 */
.u-inset-x-0     /* left, right: 0 */
.u-inset-y-0     /* top, bottom: 0 */
```

##### Usage Examples
```html
<!-- Flex layout -->
<div class="u-flex u-justify-between u-items-center u-p-4">
  <h2>Page Title</h2>
  <button class="c-button c-button--primary">Action</button>
</div>

<!-- Grid layout -->
<div class="u-grid u-grid-cols-3 u-gap-4">
  <div class="c-card">Card 1</div>
  <div class="c-card">Card 2</div>
  <div class="c-card u-col-span-2">Wide Card</div>
</div>

<!-- Centered content -->
<div class="u-flex u-justify-center u-items-center u-min-vh-100">
  <div class="c-card u-p-8">
    <h2 class="u-text-center">Centered Card</h2>
  </div>
</div>
```

#### Typography Utilities

##### Text Alignment
```css
.u-text-start    /* text-align: left */
.u-text-center   /* text-align: center */
.u-text-end      /* text-align: right */
```

##### Font Weight
```css
.u-font-light      /* 300 */
.u-font-normal     /* 400 */
.u-font-medium     /* 500 */
.u-font-semibold   /* 600 */
.u-font-bold       /* 700 */
.u-font-heavy      /* 800 */
.u-font-black      /* 900 */
```

##### Font Style
```css
.u-fst-normal    /* normal */
.u-fst-italic    /* italic */
```

##### Font Size
```css
/* Heading sizes */
.u-text-1         /* 2.5rem */
.u-text-2         /* 2rem */
.u-text-3         /* 1.5rem */
.u-text-4         /* 1.25rem */
.u-text-5         /* 1.125rem */
.u-text-6         /* 1rem */

/* Named sizes */
.u-text-xs        /* 0.75rem */
.u-text-sm        /* 0.875rem */
.u-text-base      /* 1rem */
.u-text-md        /* 1.125rem */
.u-text-lg        /* 1.25rem */
```

##### Line Height
```css
.u-lh-1        /* 1 */
.u-lh-sm       /* 1.43 */
.u-lh-base     /* 1.2 */
.u-lh-lg       /* 1.56 */
```

##### Text Transform
```css
.u-text-uppercase
.u-text-lowercase
.u-text-capitalize
```

##### Text Decoration
```css
.u-td-none
.u-td-underline
.u-td-line-through
```

##### White Space
```css
.u-text-wrap      /* normal */
.u-text-nowrap    /* nowrap */
.u-text-break     /* break-word */
```

##### Usage Examples
```html
<!-- Typography hierarchy -->
<article class="u-p-6">
  <h1 class="u-text-1 u-font-bold u-mb-4">Article Title</h1>
  <p class="u-text-lg u-text-secondary u-mb-6">Article subtitle</p>
  <p class="u-text-base u-lh-lg">Article content with good readability.</p>
</article>

<!-- Text utilities -->
<div class="u-text-center">
  <h2 class="u-text-2 u-font-semibold u-text-uppercase">Centered Title</h2>
  <p class="u-text-sm u-font-light u-text-secondary">Subtitle text</p>
</div>
```

#### Color Utilities

##### Text Colors
```css
/* Theme colors */
.u-text-primary    /* #7c3aed */
.u-text-secondary  /* #6b7280 */
.u-text-success    /* #22c55e */
.u-text-warning    /* #eab308 */
.u-text-error      /* #ef4444 */
.u-text-info       /* #3b82f6 */

/* Neutral colors */
.u-text-white      /* #fff */
.u-text-black      /* #000 */
.u-text-light      /* #f9fafb */
.u-text-dark       /* #4b5563 */

/* Semantic colors */
.u-text-body       /* #111827 */
```

##### Background Colors
```css
/* Theme colors */
.u-bg-primary      /* #7c3aed */
.u-bg-secondary    /* #6b7280 */
.u-bg-success      /* #22c55e */
.u-bg-warning      /* #eab308 */
.u-bg-error        /* #ef4444 */
.u-bg-info         /* #3b82f6 */

/* Neutral colors */
.u-bg-white        /* #fff */
.u-bg-black        /* #000 */
.u-bg-light        /* #f9fafb */
.u-bg-dark         /* #4b5563 */

/* Semantic colors */
.u-bg-body         /* var(--atomix-body-bg) */

/* Subtle variants */
.u-bg-primary-subtle
.u-bg-secondary-subtle
.u-bg-success-subtle
/* etc. */

/* Transparent */
.u-bg-transparent
```

##### Border Colors
```css
.u-border-primary    /* #7c3aed */
.u-border-secondary  /* #6b7280 */
.u-border-success    /* #22c55e */
.u-border-warning    /* #eab308 */
.u-border-error      /* #ef4444 */
.u-border-info       /* #3b82f6 */
.u-border-white      /* #fff */
.u-border-black      /* #000 */
.u-border-light      /* #f9fafb */
.u-border-dark       /* #4b5563 */

/* Subtle variants */
.u-border-primary-subtle
.u-border-secondary-subtle
/* etc. */
```

##### Usage Examples
```html
<!-- Status indicators -->
<div class="u-bg-success-50 u-text-success u-p-md u-border u-border-success-200">
  <p class="u-font-medium">Success message</p>
</div>

<!-- Card with colored header -->
<div class="c-card">
  <div class="u-bg-primary u-text-white u-p-md">
    <h3 class="u-font-semibold">Card Header</h3>
  </div>
  <div class="u-p-md">
    <p class="u-text-gray-600">Card content</p>
  </div>
</div>
```

#### Border Utilities

##### Border Width
```css
.u-border      /* default border */
.u-border-0    /* no border */
.u-border-1    /* 1px */
.u-border-2    /* 2px */
.u-border-3    /* 3px */
.u-border-4    /* 4px */
.u-border-5    /* 5px */

/* Specific sides */
.u-border-t    /* border-top */
.u-border-e    /* border-end (right in LTR) */
.u-border-b    /* border-bottom */
.u-border-s    /* border-start (left in LTR) */

/* Remove specific sides */
.u-border-t-0
.u-border-e-0
.u-border-b-0
.u-border-s-0
```

##### Border Radius
```css
.u-rounded-0     /* 0 */
.u-rounded-sm    /* var(--atomix-border-radius-sm) */
.u-rounded       /* var(--atomix-border-radius) */
.u-rounded-md    /* var(--atomix-border-radius) */
.u-rounded-lg    /* var(--atomix-border-radius-lg) */
.u-rounded-xl    /* var(--atomix-border-radius-xl) */
.u-rounded-xxl   /* var(--atomix-border-radius-xxl) */
.u-rounded-circle /* 50% */
.u-rounded-pill  /* var(--atomix-border-radius-pill) */

/* Specific corners */
.u-rounded-top     /* top corners */
.u-rounded-end     /* end corners (right in LTR) */
.u-rounded-bottom  /* bottom corners */
.u-rounded-start   /* start corners (left in LTR) */

/* Individual corners */
.u-rounded-top-start     /* top-left */
.u-rounded-top-end       /* top-right */
.u-rounded-bottom-end    /* bottom-right */
.u-rounded-bottom-start  /* bottom-left */
```

### Color System
```css
/* Primary Colors */
#7AFFD7  /* Bright mint green */
#1AFFD2  /* Cyan */
#00E6C3  /* Teal */
#00D9FF  /* Sky blue */

/* Semantic Colors */
.u-text-success       /* Green for success */
.u-text-error         /* Red for errors */
.u-text-warning       /* Yellow for warnings */
.u-text-muted         /* Gray for secondary text */
```

## Component Props Reference

### Common Props Pattern
Most Atomix components follow these common patterns:

```tsx
interface CommonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}
```

### Grid System Props
```tsx
interface GridColProps {
  xs?: number;    // Extra small screens (0-576px)
  sm?: number;    // Small screens (576-768px) 
  md?: number;    // Medium screens (768-992px)
  lg?: number;    // Large screens (992-1200px)
  xl?: number;    // Extra large screens (1200px+)
}
```

### Chart Props
```tsx
interface ChartDataset {
  label: string;
  data: Array<{ label: string; value: number }>;
  color: string;
}

interface ChartProps {
  datasets: ChartDataset[];
  size?: 'sm' | 'md' | 'lg';
  showGrid?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
}
```

## Best Practices

### 1. Component Organization
```tsx
// ✅ Good - Import from organized locations
import { Button, Card, Icon } from '@shohojdhara/atomix';
import { StatCard } from '../molecules/StatCard';
import { Header } from '../organisms/Header';

// ❌ Avoid - Direct imports from deep paths
import Button from '@shohojdhara/atomix/dist/Button/Button';
```

### 2. Prop Usage
```tsx
// ✅ Good - Use semantic variants and sizes
<Button variant="primary" size="md">
  Save Changes
</Button>

<Badge variant="success" size="sm" label="Active" />

// ❌ Avoid - Hardcoded styles
<button style={{ backgroundColor: 'blue', padding: '10px' }}>
  Save Changes
</button>
```

### 3. Grid Layout
```tsx
// ✅ Good - Responsive grid with proper breakpoints
<Grid>
  <GridCol xs={12} md={6} lg={4}>
    <StatCard />
  </GridCol>
  <GridCol xs={12} md={6} lg={4}>
    <StatCard />
  </GridCol>
</Grid>

// ❌ Avoid - Fixed layouts without responsiveness
<div style={{ display: 'flex' }}>
  <div style={{ width: '33%' }}>
    <StatCard />
  </div>
</div>
```

### 4. Accessibility
```tsx
// ✅ Good - Proper accessibility attributes
<Button 
  variant="ghost"
  aria-label="Toggle navigation menu"
  onClick={handleToggle}
>
  <Icon name="Menu" size={20} />
</Button>

// Include data-testid for testing
<Card data-testid="dashboard-stats">
  {/* content */}
</Card>
```

### 5. Color Consistency
```tsx
// ✅ Good - Use design system colors
<StatCard
  iconColor="#7AFFD7"  // Primary mint green
  trend={{ value: 12, isPositive: true }}
/>

// ✅ Good - Use utility classes
<div className="u-text-primary u-bg-light">
  Content
</div>
```

## Performance Tips

### 1. Tree Shaking
Atomix supports tree shaking. Import only what you need:
```tsx
// ✅ Good - Tree-shakeable imports
import { Button, Card } from '@shohojdhara/atomix';

// ❌ Avoid - Importing entire library
import * as Atomix from '@shohojdhara/atomix';
```

### 2. Chart Performance
```tsx
// ✅ Good - Memoize chart data
const chartData = useMemo(() => [
  {
    label: "Revenue",
    data: processedData,
    color: "#1AFFD2"
  }
], [processedData]);

<AreaChart datasets={chartData} size="lg" />
```

### 3. Component Memoization
```tsx
// ✅ Good - Memoize expensive components
const ExpensiveChart = React.memo(({ data }) => (
  <AreaChart datasets={data} size="lg" />
));
```

## Migration Guide

### From Custom Components to Atomix

1. **Replace Custom Buttons**
```tsx
// Before
<button className="btn btn-primary">Click Me</button>

// After
<Button variant="primary">Click Me</Button>
```

2. **Replace Custom Cards**
```tsx
// Before
<div className="card">
  <div className="card-body">
    <h3>Title</h3>
    <p>Content</p>
  </div>
</div>

// After
<Card>
  <h3>Title</h3>
  <p>Content</p>
</Card>
```

3. **Replace Custom Grids**
```tsx
// Before
<div className="row">
  <div className="col-md-6">Content 1</div>
  <div className="col-md-6">Content 2</div>
</div>

// After
<Grid>
  <GridCol xs={12} md={6}>Content 1</GridCol>
  <GridCol xs={12} md={6}>Content 2</GridCol>
</Grid>
```

## Troubleshooting

### Common Issues

1. **Component Not Found**
```bash
Error: Module '"@shohojdhara/atomix"' has no exported member 'ComponentName'
```
Solution: Check the component name in the Atomix documentation and ensure it's properly exported.

2. **Styling Not Applied**
```tsx
// Ensure you import the CSS
import '@shohojdhara/atomix/css';
```

3. **Grid Layout Issues**
```tsx
// ✅ Correct - Use xs, sm, md, lg, xl
<GridCol xs={12} md={6} lg={4}>

// ❌ Incorrect - Don't use 'cols'
<GridCol cols={4}>
```

4. **Chart Data Format**
```tsx
// ✅ Correct format
const datasets = [{
  label: "Revenue",
  data: [
    { label: "Jan", value: 100 },
    { label: "Feb", value: 150 }
  ],
  color: "#7AFFD7"
}];
```

## Resources

- [Atomix GitHub Repository](https://github.com/Shohojdhara/atomix)

## Contributing

When adding new components:

1. Follow the Atomic Design hierarchy
2. Use existing Atomix components as building blocks
3. Maintain consistent prop interfaces
4. Include proper TypeScript types
5. Add accessibility attributes
6. Document usage examples
7. Write tests for complex interactions

## Version Information

- **Atomix Version**: 0.3.14
- **React Version**: ^18.2.0
- **TypeScript**: ^4.9.3
- **Last Updated**: 2024

This implementation provides a solid foundation for building scalable, maintainable user interfaces using the Atomix design system with proper Atomic Design principles.