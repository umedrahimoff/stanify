import { Sidebar } from "@/components/Sidebar";
import { SWRProvider } from "@/components/SWRProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SWRProvider>
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{
                marginLeft: '260px',
                padding: '2.5rem',
                flex: 1,
                minHeight: '100vh',
                background: 'rgba(0,0,0,0.3)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.5)'
            }}>
                {children}
            </main>
        </div>
        </SWRProvider>
    );
}
