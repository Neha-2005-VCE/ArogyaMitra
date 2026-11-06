import Sidebar from '../components/Sidebar';
import ProgressTracking from '../components/ProgressTracking';
import useSidebarStore from '../stores/sidebarStore';

export default function Progress() {
    const { isCollapsed } = useSidebarStore();
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0F19] text-[#F1F5F9] font-['Inter',sans-serif]">
            <Sidebar />
            <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-12 min-h-screen overflow-x-hidden flex flex-col items-center">
                <div className="w-full max-w-5xl space-y-8">
                    <ProgressTracking />
                </div>
            </main>
        </div>
    );
}
