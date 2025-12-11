import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Building2,
  Cpu,
  Shield,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  GraduationCap,
  FileText,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

interface NavItem {
  title: string;
  url?: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { title: "首页", url: "/", icon: Home },
  {
    title: "投保人（药企/CRO）",
    icon: Building2,
    children: [
      { title: "智能询价", url: "/quote", icon: Building2 },
      { title: "报价管理", url: "/quote/management", icon: FileText },
    ],
  },
  { title: "平台（药保科技）", url: "/underwriting", icon: Cpu },
  { title: "保险公司", url: "/claims", icon: Shield },
  { title: "报表管理", url: "/dashboard", icon: BarChart3 },
  {
    title: "知识库管理",
    icon: BookOpen,
    children: [
      { title: "专业知识管理", url: "/knowledge/professional", icon: GraduationCap },
      { title: "保险条款管理", url: "/knowledge/terms", icon: FileText },
      { title: "外部数据源管理", url: "/knowledge/datasources", icon: Database },
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["知识库管理", "投保人（药企/CRO）"]);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const userInitial = user?.user_metadata?.contact_name?.[0] || user?.email?.[0]?.toUpperCase() || "U";
  const userName = user?.user_metadata?.contact_name || "用户";
  const companyName = user?.user_metadata?.company_name || "未设置公司";

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (url?: string) => url && location.pathname === url;
  const isChildActive = (item: NavItem) =>
    item.children?.some((child) => location.pathname === child.url);

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.title);
    const active = isActive(item.url) || isChildActive(item);

    if (hasChildren) {
      return (
        <li key={item.title}>
          <button
            onClick={() => toggleMenu(item.title)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              "hover:bg-sidebar-accent text-sidebar-foreground/80",
              active && "bg-sidebar-accent/50"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sm">{item.title}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </>
            )}
          </button>
          {!collapsed && isExpanded && (
            <ul className="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-2">
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={item.title}>
        <NavLink
          to={item.url!}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
            "hover:bg-sidebar-accent",
            depth > 0 ? "py-2 text-sm" : "",
            isActive(item.url)
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
              : "text-sidebar-foreground/80"
          )}
        >
          <item.icon className={cn("w-5 h-5 flex-shrink-0", depth > 0 && "w-4 h-4")} />
          {!collapsed && <span className="animate-fade-in">{item.title}</span>}
        </NavLink>
      </li>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out relative",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <img src={logo} alt="智脑时代" className="w-10 h-10" />
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-lg text-sidebar-foreground">智脑时代</h1>
            <p className="text-xs text-sidebar-foreground/60">临床试验保险平台</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => renderNavItem(item))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-semibold">{userInitial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{companyName}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
