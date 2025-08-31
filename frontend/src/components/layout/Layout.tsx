import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Container } from "@shohojdhara/atomix";
import { Header } from "../organisms";
import { Sidebar } from "../organisms/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Grid, GridCol } from "@shohojdhara/atomix";

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSearch = (query: string) => {
    // Implement global search functionality
    console.log("Global search:", query);
  };

  const handleNotificationClick = () => {
    // Implement notification functionality
    console.log("Notifications clicked");
  };

  const mockUser = user
    ? {
        name: user.first_name + " " + user.last_name,
        email: user.email,
        avatar: "",
        role: user.role,
        status: "online" as const,
      }
    : {
        name: "Admin User",
        email: "admin@isp.com",
        avatar: "",
        role: "Administrator",
        status: "online" as const,
      };

  return (
    <div className="u-min-height-100vh u-d-flex u-flex-column">
      {/* Header */}
      <Header
        user={mockUser}
        notifications={3}
        onSearch={handleSearch}
        onNotificationClick={handleNotificationClick}
        onMenuToggle={handleSidebarToggle}
        showSearch={true}
        showNotifications={true}
        showUserMenu={true}
      />
      <Container type="fluid" className="u-pt-24">
        <Grid>
          <GridCol sm={!sidebarCollapsed ? 2 : 0}>
            {/* Sidebar */}
            {!isMobile && (
              <div className={`${sidebarCollapsed  && 'u-position-fixed'}`}>
                <Sidebar
                  collapsed={sidebarCollapsed}
                  onToggle={handleSidebarToggle}
                  user={mockUser}
                />
              </div>
            )}

            {/* Mobile Sidebar Overlay */}
            {isMobile && !sidebarCollapsed && (
              <>
                <div
                  className="u-position-fixed u-top-0 u-start-0 u-w-100 u-h-100 u-body-bg u-z-4"
                  onClick={handleSidebarToggle}
                />
                <div className="u-position-fixed u-top-0 u-left-0 u-z-50">
                  <Sidebar
                    collapsed={false}
                    onToggle={handleSidebarToggle}
                    user={mockUser}
                  />
                </div>
              </>
            )}
          </GridCol>
          <GridCol sm={!sidebarCollapsed ? 10 : 11}>
            <main>
              <Outlet />
            </main>
          </GridCol>
        </Grid>
      </Container>
    </div>
  );
};

export default Layout;
