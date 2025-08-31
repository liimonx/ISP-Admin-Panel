// Re-export all Atomix components organized by Atomic Design principles

// =============================================================================
// ATOMS - Basic building blocks
// =============================================================================

// Actions
export { Button } from "@shohojdhara/atomix";
export type { ButtonProps } from "@shohojdhara/atomix";

// Display
export { Badge, Icon, Avatar, Progress, Spinner } from "@shohojdhara/atomix";
export type {
  BadgeProps,
  IconProps,
  AvatarProps,
  ProgressProps,
  SpinnerProps,
} from "@shohojdhara/atomix";

// Form Elements
export {
  Input,
  Checkbox,
  Radio,
  Select,
  Textarea,
  Toggle,
} from "@shohojdhara/atomix";
export type {
  InputProps,
  CheckboxProps,
  RadioProps,
  SelectProps,
  TextareaProps,
  ToggleProps,
} from "@shohojdhara/atomix";

// Typography & Content
export { Rating } from "@shohojdhara/atomix";
export type { RatingProps } from "@shohojdhara/atomix";

// =============================================================================
// MOLECULES - Simple combinations of atoms
// =============================================================================

// Form Groups
export { FormGroup } from "@shohojdhara/atomix";
export type { FormGroupProps } from "@shohojdhara/atomix";

// Navigation Elements
export { Breadcrumb, NavItem, SideMenuItem } from "@shohojdhara/atomix";
export type {
  BreadcrumbProps,
  NavItemProps,
  SideMenuItemProps,
} from "@shohojdhara/atomix";

// Content Display
export { AvatarGroup, List, Steps } from "@shohojdhara/atomix";
export type {
  AvatarGroupProps,
  ListProps,
  StepsProps,
} from "@shohojdhara/atomix";

// Interactive Elements
export {
  Dropdown,
  Popover,
  Tooltip,
  ColorModeToggle,
} from "@shohojdhara/atomix";
export type {
  DropdownProps,
  PopoverProps,
  TooltipProps,
  ColorModeToggleProps,
} from "@shohojdhara/atomix";

// Media
export { Upload, DatePicker, Slider } from "@shohojdhara/atomix";
export type {
  UploadProps,
  DatePickerProps,
  SliderProps,
} from "@shohojdhara/atomix";

// =============================================================================
// ORGANISMS - Complex UI components
// =============================================================================

// Layout Components
export { Card, Block, Accordion, Modal, EdgePanel } from "@shohojdhara/atomix";
export type {
  CardProps,
  BlockProps,
  AccordionProps,
  ModalProps,
  EdgePanelProps,
} from "@shohojdhara/atomix";

// Navigation Organisms
export { Nav, Navbar, SideMenu, SideMenuList } from "@shohojdhara/atomix";
export type {
  NavProps,
  NavbarProps,
  SideMenuProps,
  SideMenuListProps,
} from "@shohojdhara/atomix";

// Form Organisms
export { Form } from "@shohojdhara/atomix";
export type { FormProps } from "@shohojdhara/atomix";

// Data Display
export { DataTable, Pagination, Tab } from "@shohojdhara/atomix";
export type {
  DataTableProps,
  PaginationProps,
  TabProps,
} from "@shohojdhara/atomix";

// Charts & Visualization
export {
  Chart,
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  DonutChart,
  GaugeChart,
  ScatterChart,
  RadarChart,
  BubbleChart,
  CandlestickChart,
  FunnelChart,
  HeatmapChart,
  TreemapChart,
  WaterfallChart,
  RealTimeChart,
  AdvancedChart,
  AnimatedChart,
  MultiAxisChart,
  ChartRenderer,
} from "@shohojdhara/atomix";
export type {
  ChartProps,
  AreaChartProps,
  BarChartProps,
  LineChartProps,
  PieChartProps,
  DonutChartProps,
  GaugeChartProps,
  ScatterChartProps,
  RadarChartProps,
  BubbleChartProps,
  CandlestickChartProps,
  FunnelChartProps,
  HeatmapChartProps,
  TreemapChartProps,
  WaterfallChartProps,
  RealTimeChartProps,
  AdvancedChartProps,
  AnimatedChartProps,
  MultiAxisChartProps,
} from "@shohojdhara/atomix";

// Feedback & Communication
export { Callout, Messages, Todo, Countdown } from "@shohojdhara/atomix";
export type {
  CalloutProps,
  MessagesProps,
  TodoProps,
  CountdownProps,
} from "@shohojdhara/atomix";

// Media & Rich Content
export {
  PhotoViewer,
  VideoPlayer,
  ProductReview,
  Testimonial,
} from "@shohojdhara/atomix";
export type {
  PhotoViewerProps,
  VideoPlayerProps,
  ProductReviewProps,
  TestimonialProps,
} from "@shohojdhara/atomix";

// =============================================================================
// TEMPLATES - Layout structures
// =============================================================================

// Layout Systems
export {
  Grid,
  GridCol,
  Container,
  Row,
  MasonryGrid,
  MasonryGridItem,
} from "@shohojdhara/atomix";
export type {
  GridProps,
  GridColProps,
  ContainerProps,
  RowProps,
  MasonryGridProps,
  MasonryGridItemProps,
} from "@shohojdhara/atomix";

// Page Templates
export { Hero, SectionIntro } from "@shohojdhara/atomix";
export type { HeroProps, SectionIntroProps } from "@shohojdhara/atomix";

// Special Components
export { AtomixLogo, River } from "@shohojdhara/atomix";
export type { AtomixLogoProps, RiverProps } from "@shohojdhara/atomix";

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

// Types for complex data structures
export type {
  BubbleDataPoint,
  CandlestickDataPoint,
  FunnelDataPoint,
  HeatmapDataPoint,
  ScatterDataPoint,
  TreemapDataPoint,
  TreemapNode,
  WaterfallDataPoint,
} from "@shohojdhara/atomix";
