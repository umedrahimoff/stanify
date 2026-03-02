"use client";

interface TableSkeletonProps {
    columns: number;
    rows?: number;
}

export function TableSkeleton({ columns, rows = 10 }: TableSkeletonProps) {
    return (
        <div style={{ overflowX: "auto" }}>
            <table className="table-dashboard">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i}>
                                <span className="skeleton" style={{ display: "inline-block", width: "4rem", height: "0.75rem" }} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, rowIdx) => (
                        <tr key={rowIdx}>
                            {Array.from({ length: columns }).map((_, colIdx) => (
                                <td key={colIdx}>
                                    <span
                                        className="skeleton"
                                        style={{
                                            display: "inline-block",
                                            width: colIdx === 0 ? "8rem" : colIdx === columns - 1 ? "4rem" : "6rem",
                                            height: "0.9rem",
                                        }}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
