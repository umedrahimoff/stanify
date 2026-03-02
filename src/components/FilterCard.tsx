"use client";

import { Filter } from "lucide-react";

const filterHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
};

const filterRowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    alignItems: "flex-end",
};

const filterFieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
};

const filterLabelStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.4)",
};

const filterInputStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    height: "40px",
    fontSize: "0.9rem",
    minWidth: "150px",
};

const clearBtnStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    padding: "0.5rem 1rem",
    height: "40px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
};

export function FilterCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="card filter-card">
            <div style={filterHeaderStyle}>
                <Filter size={18} />
                Filters
            </div>
            <div style={filterRowStyle}>{children}</div>
        </div>
    );
}

export const filterStyles = {
    field: filterFieldStyle,
    label: filterLabelStyle,
    input: filterInputStyle,
    clearBtn: clearBtnStyle,
};
