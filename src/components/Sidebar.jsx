import { Icon, Brand } from "./ui";
export const navigation = [
  ["home", "Home"],
  ["sensors", "Live Sensor Data"],
  ["health", "Health Score"],
  ["twin", "Digital Twin"],
  ["alerts", "Alert Feed"],
  ["maintenance", "Maintenance Log"],
  ["analytics", "Analytics"],
  ["settings", "Settings"],
];
export function Sidebar({ page, open, onClose, user, onLogout }) {
  return (
    <>
      <button
        className={`nav-backdrop ${open ? "visible" : ""}`}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <a className="brand" href="#home" onClick={onClose}>
          <Brand />
        </a>
        <button
          className="mobile-close icon-button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <Icon name="close" />
        </button>
        <div className="nav-caption">MONITORING WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(([key, label]) => (
            <a
              key={key}
              href={`#${key}`}
              className={page === key ? "active" : ""}
              aria-current={page === key ? "page" : undefined}
              onClick={onClose}
            >
              <Icon name={key} />
              <span>{label}</span>
              {page === key && <span className="nav-active-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="staff-profile">
            <span className="avatar">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{user.name}</strong>
              <p>Laboratory staff</p>
            </div>
          </div>
          <button className="logout-button" onClick={onLogout}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
