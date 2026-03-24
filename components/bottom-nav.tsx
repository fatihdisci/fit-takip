"use client";

import Link from "next/link";

type BottomNavProps = {
  pathname: string;
};

const items: Array<{
  href: "/" | "/history";
  label: string;
  helper: string;
  icon: JSX.Element;
}> = [
  {
    href: "/",
    label: "Today",
    helper: "Home",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 11.8 12 5l8 6.8v7.7a1.5 1.5 0 0 1-1.5 1.5h-3.2v-5.7H8.7V21H5.5A1.5 1.5 0 0 1 4 19.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  },
  {
    href: "/history",
    label: "History",
    helper: "Calendar",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 3v3M17 3v3M4.5 8.5h15M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M8.2 12h.1M12 12h.1M15.8 12h.1M8.2 15.8h.1M12 15.8h.1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    )
  }
];

export function BottomNav({ pathname }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-item nav-item-active" : "nav-item"}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-copy">
              <strong>{item.label}</strong>
              <small>{item.helper}</small>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
