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
    <div className="u-min-vh-100 u-flex u-flex-column">
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
        showSidebarToggle={true}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main className="u-flex-fill u-pt-16">
        <Container type="fluid" className="u-px-4">
          <Grid>
            <GridCol sm={!sidebarCollapsed ? 2 : 0} className="u-pos-relative">
              {/* Sidebar */}
              <div className={`${!sidebarCollapsed ? "u-pos-fixed u-top-16" : ""}`}>
                <Sidebar collapsed={sidebarCollapsed} />
              </div>
            </GridCol>
            <GridCol sm={!sidebarCollapsed ? 10 : 12}>
              <Outlet />
            </GridCol>
          </Grid>
        </Container>
      </main>
    </div>
  );
};

export default Layout;