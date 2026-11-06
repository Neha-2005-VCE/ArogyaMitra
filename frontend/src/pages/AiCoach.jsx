import Sidebar from '../components/Sidebar';
import AromiCoach from '../components/AromiCoach';
import useSidebarStore from '../stores/sidebarStore';

export default function AiCoach() {
    const { isCollapsed } = useSidebarStore();
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0F19] text-[#F1F5F9] font-['Inter',sans-serif]">
            <Sidebar />
            <main className="flex-1 min-w-0 min-h-screen">
                <AromiCoach />
            </main>
        </div>
    );
}
