import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Container } from "@shohojdhara/atomix";
import { Header } from "../organisms";
import { Sidebar } from "../organisms/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { coreService, GlobalSearchResult, Notification } from "@/services/api";

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const [notifsResponse, countResponse] = await Promise.all([
          coreService.getNotifications(),
          coreService.getUnreadNotificationCount(),
        ]);
        setNotifications(notifsResponse.results || []);
        setUnreadCount(countResponse.count || 0);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await coreService.globalSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Global search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNotificationClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await coreService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
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
        notifications={unreadCount}
        onSearch={handleSearch}
        onNotificationClick={handleNotificationClick}
        onMenuToggle={handleSidebarToggle}
        searchResults={searchResults}
        isSearching={isSearching}
        notificationsList={notifications}
        isNotificationsOpen={isNotificationsOpen}
        onMarkNotificationRead={handleMarkNotificationRead}
        showSearch={true}
        showNotifications={true}
        showUserMenu={true}
        showSidebarToggle={true}
        sidebarCollapsed={sidebarCollapsed}
      />
      <Sidebar collapsed={isMobile ? true : sidebarCollapsed} />
      <main
        className={`u-flex-fill u-pt-24 u-transition-all ${
          isMobile ? "u-ms-16" : sidebarCollapsed ? "u-ms-16" : "u-ms-64"
        }`}
      >
        <Container type="fluid" className="u-px-4">
          <Outlet />
        </Container>
      </main>
    </div>
  );
};

export default Layout;
