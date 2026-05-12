import SidebarButton from "@/components/sidebar/sidebar-views/SidebarButton"


import { useViews } from "@/context/ViewContext"
import useResponsive from "@/hooks/useResponsive"


import { VIEWS } from "@/types/view"

import cn from "classnames"

function Sidebar() {
    const {
        activeView,
        isSidebarOpen,
        viewComponents,
        viewIcons,
    } = useViews()
    const { minHeightReached } = useResponsive()

 


    return (
        <aside className="flex w-full md:h-full md:max-h-full md:min-h-full md:w-auto">
            <div
                className={cn(
                    "fixed bottom-0 left-0 z-50 flex h-[60px] w-full items-center justify-around overflow-hidden border-t border-white/5 bg-secondary/80 backdrop-blur-lg px-4 md:static md:h-full md:w-[70px] md:min-w-[70px] md:flex-col md:justify-start md:gap-4 md:border-r md:border-t-0 md:py-6",
                    {
                        hidden: minHeightReached,
                    },
                )}
            >
                <SidebarButton
                    viewName={VIEWS.FILES}
                    icon={viewIcons[VIEWS.FILES]}
                />
                <SidebarButton
                    viewName={VIEWS.CHATS}
                    icon={viewIcons[VIEWS.CHATS]}
                />
                <SidebarButton
                    viewName={VIEWS.RUN}
                    icon={viewIcons[VIEWS.RUN]}
                />
                <SidebarButton
                    viewName={VIEWS.CLIENTS}
                    icon={viewIcons[VIEWS.CLIENTS]}
                />
                <SidebarButton
                    viewName={VIEWS.SETTINGS}
                    icon={viewIcons[VIEWS.SETTINGS]}
                />
            </div>
            <div
                className="absolute left-0 top-0 z-20 w-full flex-col bg-dark/95 backdrop-blur-xl md:static md:min-w-[300px] md:border-r md:border-white/5"
                style={isSidebarOpen ? {} : { display: "none" }}
            >
                {/* Render the active view component */}
                <div className="flex h-full flex-col p-4 overflow-hidden">
                    {viewComponents[activeView]}
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
