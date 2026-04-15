import { useState, useEffect } from "react";
import {
  Users, BookOpen, Star, Award, Ticket, BarChart3,
  GraduationCap, DollarSign, X, CreditCard, Search,
  Eye, CheckCircle, Clock, XCircle, Tag
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

import { UserManagement } from "./UserManagement";
import { TeacherManagement } from "./TeacherManagement";
import { CourseManagement } from "./CourseManagement";
import { ReviewManagement } from "./ReviewManagement";
import { ExamManagement } from "./ExamManagement";
import { FlashcardManagement } from "./FlashcardManagement";
import { PlanManagement } from "./PlanManagement";
import { VoucherManagement } from "./VoucherManagement"; // Đã thêm import Voucher

import { getDashboardOverview } from "../../middleware/admin/dashboardAdminAPI";
import { getAllUsers, getStudents, getTeachers } from "../../middleware/admin/userManagementAPI";
import {
  getAllTransactions, searchTransactions, getTransactionDetail,
  formatCurrency, formatDateTime, getStatusLabel
} from "../../middleware/admin/transactionAPI";

import { useTheme } from "../../context/ThemeContext"; 
import "./admin-dashboard-styles.scss";

const SYS_COLORS = {
  mint: "#00c896",       
  mintLight: "#e6faf4",
  blue: "#3b82f6",       
  blueLight: "#eff6ff",
  amber: "#f59e0b",      
  amberLight: "#fef3c7",
  pink: "#ec4899",       
  pinkLight: "#fdf2f8",
  muted: "#9ca3af"
};

export function AdminDashboard({ onClose }) {
  const { isDarkMode } = useTheme();

  const [activeMenu, setActiveMenu] = useState("analytics");
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [userStats, setUserStats] = useState({
    totalAdmins: 0, totalTeachers: 0, totalStudents: 0, activeUsers: 0, inactiveUsers: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [transactionStats, setTransactionStats] = useState({
    total: 0, paid: 0, pending: 0, totalRevenue: 0, monthlyRevenue: {},
  });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadAdminData();
    loadStats();
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [allUsersData, teachersData, studentsData] = await Promise.all([
        getAllUsers(), getTeachers(), getStudents(),
      ]);

      const mappedUsers = allUsersData.map((user) => ({
        id: user.name, role: user.role, isActive: user.status === "ACTIVE",
      }));

      const mappedTeachers = teachersData.map((t) => ({ isActive: t.status === "ACTIVE" }));
      const mappedStudents = studentsData.map((s) => ({ isActive: s.status === "ACTIVE" }));

      setUserStats({
        totalAdmins: mappedUsers.filter((u) => u.role === "ADMIN").length,
        totalTeachers: mappedTeachers.length,
        totalStudents: mappedStudents.length,
        activeUsers: mappedUsers.filter((u) => u.isActive).length,
        inactiveUsers: mappedUsers.filter((u) => !u.isActive).length,
      });
    } catch (error) {
      console.error("Không thể tải dữ liệu admin", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try { setStats(await getDashboardOverview()); } catch (error) { console.error(error); }
  };

  const loadTransactions = async () => {
    try {
      const data = await getAllTransactions();
      const safeData = Array.isArray(data) ? data : [];
      setTransactions(safeData); 
      calculateTransactionStats(safeData);
    } catch (error) { 
      console.error("Không thể tải giao dịch (Lỗi Backend 500)", error); 
      setTransactions([]);
      calculateTransactionStats([]);
    }
  };

  const calculateTransactionStats = (transactionsData) => {
    const monthlyRevenue = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyRevenue[`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    
    if (Array.isArray(transactionsData)) {
      transactionsData.filter((t) => t.status === "PAID" && t.paidAt).forEach((t) => {
        const paidDate = new Date(t.paidAt);
        const monthKey = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyRevenue.hasOwnProperty(monthKey)) monthlyRevenue[monthKey] += t.amount || 0;
      });
    }

    setTransactionStats({
      total: transactionsData?.length || 0,
      paid: transactionsData?.filter((t) => t.status === "PAID").length || 0,
      pending: transactionsData?.filter((t) => t.status === "PENDING").length || 0,
      totalRevenue: transactionsData?.filter((t) => t.status === "PAID").reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
      monthlyRevenue,
    });
  };

  const handleSearchTransactions = async () => {
    if (!searchKeyword.trim()) return loadTransactions();
    try {
      const data = await searchTransactions(searchKeyword);
      const safeData = Array.isArray(data) ? data : [];
      setTransactions(safeData); 
      calculateTransactionStats(safeData);
    } catch (error) { console.error("Lỗi tìm kiếm", error); }
  };

  const handleViewTransactionDetail = async (orderId) => {
    try {
      setSelectedTransaction(await getTransactionDetail(orderId));
      setShowDetailModal(true);
    } catch (error) { console.error("Lỗi chi tiết", error); }
  };

  const getStatusBadge = (status) => {
    const map = {
      PAID: { Icon: CheckCircle, bg: SYS_COLORS.mint },
      PENDING: { Icon: Clock, bg: SYS_COLORS.amber },
      FAILED: { Icon: XCircle, bg: SYS_COLORS.pink },
      CANCELLED: { Icon: XCircle, bg: SYS_COLORS.muted },
    };
    const picked = map[status] || map.PENDING;
    const IconCmp = picked.Icon;
    return (
      <span className="status-badge" style={{ backgroundColor: picked.bg, color: '#fff' }}>
        <IconCmp size={14} /> {getStatusLabel(status)}
      </span>
    );
  };

  const getRevenueChartData = () => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data.push({
        month: months[date.getMonth()],
        revenue: transactionStats.monthlyRevenue[`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`] || 0,
      });
    }
    return data;
  };

  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    borderColor: isDarkMode ? '#334155' : '#e8eaf0',
    color: isDarkMode ? '#f8fafc' : '#1a1a2e',
    borderRadius: '12px',
    boxShadow: isDarkMode ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(0,200,150,0.16)',
    fontFamily: "'Nunito', sans-serif",
    border: '1px solid',
    fontWeight: 700
  };

  const menuItems = [
    { id: "analytics", icon: BarChart3, label: "Thống kê" },
    { id: "transactions", icon: CreditCard, label: "Giao dịch" },
    { id: "users", icon: Users, label: "Người dùng" },
    { id: "teachers", icon: GraduationCap, label: "Giảng viên" },
    { id: "courses", icon: BookOpen, label: "Khóa học" },
    { id: "flashcard", icon: BookOpen, label: "Flashcard" },
    { id: "reviews", icon: Star, label: "Đánh giá" },
    { id: "exams", icon: Award, label: "Kiểm tra" },
    { id: "plans", icon: Ticket, label: "Gói hội viên" },
    { id: "vouchers", icon: Tag, label: "Mã giảm giá" }, // Đã thêm mục Mã giảm giá
  ];

  const renderContent = () => {
    if (activeMenu === "analytics") {
      if (isLoading) return <div className="admin-loading-spinner"><div className="admin-spinner"></div><p>Đang tải dữ liệu...</p></div>;

      return (
        <div className="admin-analytics-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <h3 className="admin-stat-title">Người dùng</h3>
                <div className="admin-stat-icon-wrapper" style={{ background: isDarkMode ? 'rgba(59,130,246,0.18)' : SYS_COLORS.blueLight, color: SYS_COLORS.blue }}>
                  <Users size={22} />
                </div>
              </div>
              <div className="admin-stat-value">{stats?.totalUsers || 0}</div>
              <p className="admin-stat-footer"><span style={{color: SYS_COLORS.mint, fontWeight: 800}}>{stats?.membershipRate ? `${stats.membershipRate.toFixed(1)}%` : "0%"}</span> hội viên VIP</p>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <h3 className="admin-stat-title">Thành viên VIP</h3>
                <div className="admin-stat-icon-wrapper" style={{ background: isDarkMode ? 'rgba(0,200,150,0.18)' : SYS_COLORS.mintLight, color: SYS_COLORS.mint }}>
                  <Award size={22} />
                </div>
              </div>
              <div className="admin-stat-value">{stats?.activeMembers || 0}</div>
              <p className="admin-stat-footer">Đang trong thời hạn</p>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <h3 className="admin-stat-title">Doanh thu</h3>
                <div className="admin-stat-icon-wrapper" style={{ background: isDarkMode ? 'rgba(245,158,11,0.18)' : SYS_COLORS.amberLight, color: SYS_COLORS.amber }}>
                  <DollarSign size={22} />
                </div>
              </div>
              <div className="admin-stat-value">{formatCurrency(transactionStats.totalRevenue)}</div>
              <p className="admin-stat-footer">{transactionStats.paid} GD thành công</p>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <h3 className="admin-stat-title">Khóa học</h3>
                <div className="admin-stat-icon-wrapper" style={{ background: isDarkMode ? 'rgba(236,72,153,0.18)' : SYS_COLORS.pinkLight, color: SYS_COLORS.pink }}>
                  <BookOpen size={22} />
                </div>
              </div>
              <div className="admin-stat-value">{stats?.activeCourses || 0}</div>
              <p className="admin-stat-footer">Đang hoạt động</p>
            </div>
          </div>

          <div className="admin-charts-grid">
            {/* AREA CHART - Doanh Thu */}
            <div className="admin-chart-card">
              <div className="chart-header-custom">
                <h3 className="card-title">Doanh thu theo tháng</h3>
                <p className="card-description">Thống kê biến động 6 tháng gần nhất</p>
              </div>
              <div style={{ width: '100%' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getRevenueChartData()} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={12} tick={{fill: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                    <YAxis tickFormatter={(val) => formatCurrency(val, true)} axisLine={false} tickLine={false} tickMargin={12} tick={{fill: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                    <RechartsTooltip contentStyle={tooltipStyle} formatter={(val) => formatCurrency(val)} />
                    <Area type="monotone" dataKey="revenue" stroke={SYS_COLORS.mint} strokeWidth={3} fill={`url(#colorRevenue)`} />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SYS_COLORS.mint} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={SYS_COLORS.mint} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BAR CHART - Giao dịch */}
            <div className="admin-chart-card">
              <div className="chart-header-custom">
                <h3 className="card-title">Thống kê giao dịch</h3>
                <p className="card-description">Phân bố trạng thái hóa đơn</p>
              </div>
              <div style={{ width: '100%' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: "Tổng GD", value: transactionStats.total, fill: SYS_COLORS.blue },
                      { name: "Thành công", value: transactionStats.paid, fill: SYS_COLORS.mint },
                      { name: "Đang chờ", value: transactionStats.pending, fill: SYS_COLORS.amber },
                    ]}
                    margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={12} tick={{fill: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                    <YAxis axisLine={false} tickLine={false} tickMargin={12} tick={{fill: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                    <RechartsTooltip cursor={{fill: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb'}} contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PIE CHART - Vai trò */}
            <div className="admin-chart-card">
              <div className="chart-header-custom">
                <h3 className="card-title">Phân bố vai trò</h3>
                <p className="card-description">Hệ thống phân loại người dùng</p>
              </div>
              <div style={{ width: '100%' }}>
                {userStats.totalStudents > 0 || userStats.totalTeachers > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Học viên", value: userStats.totalStudents, color: SYS_COLORS.blue },
                          { name: "Giảng viên", value: userStats.totalTeachers, color: SYS_COLORS.mint },
                          { name: "Admin", value: userStats.totalAdmins, color: SYS_COLORS.amber },
                        ]}
                        cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" paddingAngle={4} dataKey="value"
                        labelLine={false}
                      >
                        {([{}, {}, {}]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[SYS_COLORS.blue, SYS_COLORS.mint, SYS_COLORS.amber][index]} stroke="transparent" />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="admin-empty-data" style={{height: 280}}>Chưa có dữ liệu</div>}
              </div>
            </div>
            
            {/* PIE CHART - Trạng thái */}
            <div className="admin-chart-card">
              <div className="chart-header-custom">
                <h3 className="card-title">Trạng thái tài khoản</h3>
                <p className="card-description">Tỉ lệ hoạt động thực tế</p>
              </div>
              <div style={{ width: '100%' }}>
                {userStats.activeUsers > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Hoạt động", value: userStats.activeUsers, color: SYS_COLORS.mint },
                          { name: "Đã khóa", value: userStats.inactiveUsers, color: SYS_COLORS.pink },
                        ]}
                        cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" paddingAngle={4} dataKey="value"
                        labelLine={false}
                      >
                        <Cell fill={SYS_COLORS.mint} stroke="transparent" />
                        <Cell fill={SYS_COLORS.pink} stroke="transparent" />
                      </Pie>
                      <RechartsTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="admin-empty-data" style={{height: 280}}>Chưa có dữ liệu</div>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeMenu === "transactions") {
      return (
        <div className="management-card">
          <div className="management-card-header">
            <div>
              <h2 className="card-title">Quản lý giao dịch</h2>
              <p className="card-description">Tổng số: {transactionStats.total} giao dịch</p>
            </div>
          </div>

          <div className="management-header">
            <div className="search-bar">
              <Search size={18} style={{ color: SYS_COLORS.muted }} />
              <input
                type="text"
                placeholder="Tìm Order ID, email..."
                className="search-input"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchTransactions()}
              />
            </div>
            <button className="secondary-button" onClick={loadTransactions}>Làm mới</button>
          </div>

          <div className="management-table-wrapper">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Người mua</th>
                  <th>Gói</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th style={{textAlign: 'right'}}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? transactions.map((t) => (
                  <tr key={t.orderID}>
                    <td className="fw-800" style={{color: SYS_COLORS.mint}}>#{t.orderID}</td>
                    <td>
                      <p className="td-title fw-800 mb-0">{t.buyerUsername || 'N/A'}</p>
                      <p className="td-sub mb-0">{t.buyerEmail || 'N/A'}</p>
                    </td>
                    <td className="fw-700">{t.planName}</td>
                    <td className="fw-800">{formatCurrency(t.amount || 0)}</td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td className="fw-700">{formatDateTime(t.createdAt)}</td>
                    <td style={{textAlign: 'right'}}>
                      <button className="action-button" title="Xem chi tiết" onClick={() => handleViewTransactionDetail(t.orderID)}>
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7">
                      <div className="admin-empty-data" style={{ padding: '3rem 0' }}>
                        Chưa có giao dịch nào hoặc không thể kết nối tới máy chủ.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {showDetailModal && selectedTransaction && (
            <div className="management-modal-overlay" onClick={() => setShowDetailModal(false)}>
              <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                  <h3 className="modal-title">Chi tiết giao dịch #{selectedTransaction.orderID}</h3>
                </div>
                <div className="modal-body-custom">
                  <div className="info-row">
                    <span className="info-label">Người mua:</span>
                    <span className="info-val">{selectedTransaction.buyer?.username} ({selectedTransaction.buyer?.email})</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Gói hội viên:</span>
                    <span className="info-val">{selectedTransaction.plan?.name} - {formatCurrency(selectedTransaction.plan?.price || 0)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Trạng thái:</span>
                    <span>{getStatusBadge(selectedTransaction.status)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Thanh toán lúc:</span>
                    <span className="info-val">{selectedTransaction.paidAt ? formatDateTime(selectedTransaction.paidAt) : "Chưa thanh toán"}</span>
                  </div>
                </div>
                <div className="modal-foot">
                  <button className="secondary-button" onClick={() => setShowDetailModal(false)}>Đóng</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    switch (activeMenu) {
      case "users": return <UserManagement />;
      case "teachers": return <TeacherManagement />;
      case "courses": return <CourseManagement />;
      case "reviews": return <ReviewManagement />;
      case "flashcard": return <FlashcardManagement />;
      case "exams": return <ExamManagement />;
      case "plans": return <PlanManagement />;
      case "vouchers": return <VoucherManagement />; // Đã liên kết component Voucher
      default: return null;
    }
  };

  return (
    <div className={`admin-dashboard-layout ${isDarkMode ? "global-dark-mode" : ""}`}>
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h5 className="admin-sidebar-title">Admin Panel</h5>
          <p className="admin-sidebar-subtitle">Quản trị hệ thống</p>
        </div>
        <nav className="admin-sidebar-nav">
          <div className="admin-sidebar-menu-items">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`admin-sidebar-menu-item ${isActive ? "active" : ""}`}
                >
                  <Icon size={20} className="admin-sidebar-menu-icon" />
                  <span className="admin-sidebar-menu-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="admin-main-content">
        <div className="admin-content-area">{renderContent()}</div>
      </div>
    </div>
  );
}

export default AdminDashboard;