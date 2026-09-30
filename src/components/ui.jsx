import { useEffect, useRef } from "react";
import {
  Activity,
  LayoutDashboard,
  Cpu,
  Radio,
  Box,
  Bell,
  Wrench,
  Thermometer,
  Zap,
  ArrowUpRight,
  ArrowRight,
  Clock,
  ShieldCheck,
  Plug,
  Menu,
  X,
  Info,
  ChevronRight,
  Database,
  RotateCcw,
  Settings,
  ChartNoAxesCombined,
  LogOut,
  Plus,
  Download,
  Search,
  Check,
  Eye,
  Mail,
  LockKeyhole,
  User,
  Move3d,
  ZoomIn,
  ZoomOut,
  Flame,
} from "lucide-react";
const icons = {
  activity: Activity,
  home: LayoutDashboard,
  overview: LayoutDashboard,
  health: Activity,
  predictions: Cpu,
  sensors: Radio,
  twin: Box,
  equipment: Box,
  alerts: Bell,
  maintenance: Wrench,
  thermometer: Thermometer,
  zap: Zap,
  arrow: ArrowUpRight,
  right: ArrowRight,
  clock: Clock,
  shield: ShieldCheck,
  plug: Plug,
  menu: Menu,
  close: X,
  info: Info,
  chevron: ChevronRight,
  database: Database,
  refresh: RotateCcw,
  settings: Settings,
  analytics: ChartNoAxesCombined,
  logout: LogOut,
  plus: Plus,
  download: Download,
  search: Search,
  check: Check,
  eye: Eye,
  mail: Mail,
  lock: LockKeyhole,
  user: User,
  rotate: Move3d,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  flame: Flame,
};
export function Icon({ name, size = 18, ...props }) {
  const Component = icons[name] || Activity;
  return (
    <Component size={size} strokeWidth={1.7} aria-hidden="true" {...props} />
  );
}
export function Badge({ children, tone = "" }) {
  return (
    <span className={`badge ${tone}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
  id,
}) {
  return (
    <section id={id} className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function EmptyState({ icon = "database", title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={24} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function timeLabel(value) {
  return value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Not received";
}
export function dateLabel(value) {
  return value ? new Date(value).toLocaleString() : "Not available";
}
export function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Brand() {
  return (
    <>
      <span className="brand-mark">
        <Icon name="activity" size={25} />
      </span>
      <span>
        MechMedic<small>Keeping Machines One Step Ahead</small>
      </span>
    </>
  );
}
