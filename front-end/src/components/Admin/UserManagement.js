import { useState, useEffect } from "react";
import { Trash, UserPlus, Power, PowerOff, Search, X } from "lucide-react";
import {
  getAllUsers,
  searchUsers,
  lockUser,
  unlockUser,
  createUser,
} from "../../middleware/admin/userManagementAPI";
import "./admin-dashboard-styles.scss"; 

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    role: "STUDENT",
  });

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 📦 TẢI VÀ BÓC TÁCH DỮ LIỆU THÔNG MINH
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await getAllUsers();
      
      // 1. Xử lý linh hoạt mọi cấu trúc Backend trả về (Array, {data: []}, {content: []}, {users: []})
      let dataList = [];
      if (Array.isArray(response)) {
        dataList = response;
      } else if (response && Array.isArray(response.data)) {
        dataList = response.data;
      } else if (response && Array.isArray(response.content)) {
        dataList = response.content;
      } else if (response && Array.isArray(response.users)) {
        dataList = response.users;
      }

      console.log("Dữ liệu người dùng từ Backend:", dataList); // In ra F12 Console để kiểm tra

      // 2. Map dữ liệu dự phòng (Fallback) để không bị undefined
      const mapped = dataList.map((u) => ({
        ...u,
        // Ưu tiên lấy các trường ID phổ biến
        accountID: u.accountID || u.id || u.userId || u._id || u.name || Math.random().toString(),
        username: u.username || u.name || u.fullName || "Chưa có tên",
        email: u.email || "Không có email",
        role: u.role || "STUDENT",
        // Xử lý linh hoạt trạng thái
        isActive: u.status === "ACTIVE" || u.isActive === true || u.status === 1 || u.active === true,
        // Xử lý linh hoạt ngày tháng
        joinedDate: u.joinedDate || u.createdAt || u.createAt || new Date().toISOString(),
      }));

      setUsers(mapped);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      showPopup("Không thể tải danh sách người dùng", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    if (window.confirm(`Bạn có chắc muốn ${isActive ? "khóa" : "mở khóa"} tài khoản này?`)) {
      try {
        if (isActive) {
          await lockUser(userId);
        } else {
          await unlockUser(userId);
        }
        showPopup("Cập nhật trạng thái thành công!", "success");
        loadUsers();
      } catch (error) {
        showPopup(error.response?.data?.message || "Không thể cập nhật trạng thái", "error");
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers();
      return;
    }
    try {
      setIsLoading(true);
      const response = await searchUsers(searchQuery);
      
      let dataList = [];
      if (Array.isArray(response)) dataList = response;
      else if (response && Array.isArray(response.data)) dataList = response.data;
      else if (response && Array.isArray(response.content)) dataList = response.content;

      const mapped = dataList.map((u) => ({
        ...u,
        accountID: u.accountID || u.id || u.userId || u._id || u.name,
        username: u.username || u.name || u.fullName || "Chưa có tên",
        email: u.email || "Không có email",
        role: u.role || "STUDENT",
        isActive: u.status === "ACTIVE" || u.isActive === true || u.status === 1,
        joinedDate: u.joinedDate || u.createdAt || u.createAt || new Date().toISOString(),
      }));
      setUsers(mapped);
    } catch (error) {
      showPopup("Không thể tìm kiếm người dùng", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.username || !newUser.password) {
      showPopup("Vui lòng điền đầy đủ thông tin.", "error");
      return;
    }
    try {
      await createUser(newUser);
      showPopup("Tạo người dùng thành công!", "success");
      setShowCreateUser(false);
      setNewUser({ email: "", username: "", password: "", role: "STUDENT" });
      loadUsers();
    } catch (error) {
      showPopup(error.message || "Lỗi khi tạo người dùng", "error");
    }
  };

  // Lọc dữ liệu hiển thị (Bỏ phân biệt hoa thường)
  const filteredUsers = users.filter((user) => {
    const roleMatch = filterRole === "all" || (user.role && user.role.toLowerCase() === filterRole.toLowerCase());
    const statusMatch =
      filterStatus === "all" ||
      (user.isActive && filterStatus === "active") ||
      (!user.isActive && filterStatus === "inactive");
    return roleMatch && statusMatch;
  });

  if (isLoading && users.length === 0) {
    return (
      <div className="admin-loading-spinner">
        <div className="admin-spinner"></div>
        <p>Đang tải dữ liệu người dùng...</p>
      </div>
    );
  }

  return (
    <div className="management-card">
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? 'var(--mint)' : '#ec4899',
          color: '#fff', padding: '12px 24px', borderRadius: '99px',
          fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="management-card-header">
        <div>
          <h2 className="card-title">Quản lý người dùng</h2>
          <p className="card-description">
            Hiển thị {filteredUsers.length} trên tổng số {users.length} tài khoản
          </p>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Thêm mới */}
      <div className="management-header" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flexGrow: 1, minWidth: '280px', maxWidth: '400px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="form-input"
            style={{ width: 'auto', borderRadius: '99px', padding: '0.6rem 1rem', border: '1.5px solid var(--border)' }}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="teacher">Giảng viên</option>
            <option value="student">Học viên</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input"
            style={{ width: 'auto', borderRadius: '99px', padding: '0.6rem 1rem', border: '1.5px solid var(--border)' }}
          >
            <option value="all">Trạng thái (Tất cả)</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
          
          <button onClick={() => setShowCreateUser(true)} className="primary-button">
            <UserPlus size={18} />
            <span>Tạo mới</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="management-table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tham gia</th>
              <th style={{ textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.accountID}>
                  <td>
                    <p className="td-title fw-800 mb-0">{user.username}</p>
                    <p className="td-sub mb-0">{user.email}</p>
                  </td>
                  <td className="fw-800" style={{ color: 'var(--primary)' }}>{user.role}</td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ 
                        backgroundColor: user.isActive ? 'rgba(0,200,150,0.12)' : 'rgba(236,72,153,0.12)', 
                        color: user.isActive ? 'var(--primary)' : '#ec4899' 
                      }}
                    >
                      {user.isActive ? "Hoạt động" : "Khóa"}
                    </span>
                  </td>
                  <td className="fw-600">{new Date(user.joinedDate).toLocaleDateString('vi-VN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="action-button"
                      title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      onClick={() => handleToggleStatus(user.accountID, user.isActive)}
                      style={{ color: user.isActive ? '#ec4899' : 'var(--primary)' }}
                    >
                      {user.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                    </button>
                    <button 
                      className="action-button" 
                      title="Xóa người dùng"
                      style={{ color: '#ec4899', marginLeft: '8px' }}
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  <div className="admin-empty-data" style={{ padding: '3rem 0' }}>
                    Không tìm thấy người dùng nào.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ════════════════════════════════════════════
          MODAL: TẠO NGƯỜI DÙNG MỚI
      ════════════════════════════════════════════ */}
      {showCreateUser && (
        <div className="management-modal-overlay" onClick={() => setShowCreateUser(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Tạo người dùng mới</h3>
              {/* <button className="action-button" onClick={() => setShowCreateUser(false)}>
                <X size={20} />
              </button> */}
            </div>
            
            <div className="modal-body-custom">
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tên đăng nhập</label>
                <input
                  type="text"
                  placeholder="Nhập tên đăng nhập..."
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Địa chỉ Email</label>
                <input
                  type="email"
                  placeholder="Nhập email..."
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mật khẩu</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Phân quyền</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-input"
                >
                  <option value="STUDENT">Học viên (Student)</option>
                  <option value="TEACHER">Giảng viên (Teacher)</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select>
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={() => setShowCreateUser(false)} className="secondary-button" style={{ marginRight: '1rem' }}>
                Hủy
              </button>
              <button onClick={handleCreateUser} className="primary-button">
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;