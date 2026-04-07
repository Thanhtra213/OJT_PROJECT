import { useState, useEffect } from "react";
import { UserPlus, Trash, Power, PowerOff, X, Search } from "lucide-react";
import { getTeachers, searchUsers, lockUser, unlockUser, createUser } from "../../middleware/admin/userManagementAPI";
import "./admin-dashboard-styles.scss"; // Đổi lại import CSS chuẩn

export function TeacherManagement() {
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const [newTeacher, setNewTeacher] = useState({
        email: "",
        username: "",
        password: "",
        role: "TEACHER",
        description: "",
    });

    const showPopup = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    useEffect(() => {
        loadTeachers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadTeachers = async () => {
        try {
            setIsLoading(true);
            const data = await getTeachers();
            const mapped = data.map(t => ({ ...t, isActive: t.status === 'ACTIVE' }));
            setTeachers(mapped);
        } catch (error) {
            showPopup("Không thể tải danh sách giảng viên", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTeacher = async (accountID, isActive) => {
        if (!window.confirm(`Bạn có chắc muốn ${isActive ? 'hủy kích hoạt' : 'kích hoạt'} giảng viên này?`)) return;
        try {
            if (isActive) {
                await lockUser(accountID);
            } else {
                await unlockUser(accountID);
            }
            showPopup("Cập nhật trạng thái thành công", "success");
            setTeachers(teachers.map(t => t.accountID === accountID ? { ...t, isActive: !isActive } : t));
        } catch (error) {
            showPopup("Không thể cập nhật trạng thái", "error");
        }
    };

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) {
            loadTeachers();
            return;
        }
        try {
            setIsLoading(true);
            const data = await searchUsers(searchQuery, 'TEACHER');
            const mapped = data.map(t => ({ ...t, isActive: t.status === 'ACTIVE' }));
            setTeachers(mapped);
        } catch (error) {
            showPopup("Không tìm thấy kết quả", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTeacher = async () => {
        if (!newTeacher.email || !newTeacher.username || !newTeacher.password) {
            showPopup("Vui lòng điền đầy đủ thông tin", "error");
            return;
        }
        try {
            await createUser(newTeacher);
            showPopup("Tạo giảng viên thành công!", "success");
            setShowCreateModal(false);
            loadTeachers();
            setNewTeacher({ email: "", username: "", password: "", role: "TEACHER", description: "" });
        } catch (error) {
            showPopup(error.response?.data?.message || "Không thể tạo giảng viên", "error");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTeacher(prev => ({ ...prev, [name]: value }));
    };

    const filteredTeachers = teachers.filter(teacher =>
        (teacher.username && teacher.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (teacher.email && teacher.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (isLoading && teachers.length === 0) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
                <p>Đang tải dữ liệu giảng viên...</p>
            </div>
        );
    }

    return (
        <div className="management-card">
            {/* Hiển thị Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    background: toast.type === 'success' ? 'var(--primary)' : '#ec4899',
                    color: '#fff', padding: '12px 24px', borderRadius: '99px',
                    fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}>
                    {toast.message}
                </div>
            )}

            {/* HEADER */}
            <div className="management-card-header">
                <div>
                    <h2 className="card-title">Quản lý giảng viên</h2>
                    <p className="card-description">Tổng số: {filteredTeachers.length} giảng viên</p>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="management-header">
                <div className="search-bar">
                    <Search size={18} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                        className="search-input"
                    />
                </div>
                <button onClick={() => setShowCreateModal(true)} className="primary-button">
                    <UserPlus size={18} />
                    <span>Thêm giảng viên</span>
                </button>
            </div>

            {/* TABLE */}
            <div className="management-table-wrapper">
                <table className="management-table">
                    <thead>
                        <tr>
                            <th>Giảng viên</th>
                            <th>Mô tả</th>
                            <th style={{ textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ textAlign: 'right' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => (
                            <tr key={teacher.accountID}>
                                <td>
                                    <div className="fw-800 td-title">{teacher.username}</div>
                                    <div className="td-sub">{teacher.email}</div>
                                </td>
                                <td>{teacher.description || "Chưa có mô tả"}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span 
                                        className="status-badge"
                                        style={{ 
                                            backgroundColor: teacher.isActive ? 'rgba(0,200,150,0.12)' : 'rgba(236,72,153,0.12)', 
                                            color: teacher.isActive ? 'var(--primary)' : '#ec4899' 
                                        }}
                                    >
                                        {teacher.isActive ? 'Hoạt động' : 'Đã khóa'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button 
                                        className="action-button" 
                                        title={teacher.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                        style={{ color: teacher.isActive ? 'var(--text-dark)' : '#ec4899' }}
                                        onClick={() => handleToggleTeacher(teacher.accountID, teacher.isActive)}
                                    >
                                        {teacher.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                                    </button>
                                    <button 
                                        className="action-button" 
                                        style={{ color: '#ec4899', marginLeft: '8px' }}
                                        title="Xóa"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4">
                                    <div className="admin-empty-data" style={{ padding: '3rem 0' }}>
                                        Không tìm thấy giảng viên nào.
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL THÊM GIẢNG VIÊN */}
            {showCreateModal && (
                <div className="management-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="management-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3 className="modal-title">Tạo giảng viên mới</h3>
                        </div>
                        
                        <div className="modal-body-custom">
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tên đăng nhập</label>
                                <input 
                                    type="text" 
                                    placeholder="Nhập tên đăng nhập..." 
                                    name="username" 
                                    value={newTeacher.username} 
                                    onChange={handleInputChange} 
                                    className="form-input" 
                                />
                            </div>
                            
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Email</label>
                                <input 
                                    type="email" 
                                    placeholder="Nhập địa chỉ email..." 
                                    name="email" 
                                    value={newTeacher.email} 
                                    onChange={handleInputChange} 
                                    className="form-input" 
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mật khẩu</label>
                                <input 
                                    type="password" 
                                    placeholder="Tạo mật khẩu..." 
                                    name="password" 
                                    value={newTeacher.password} 
                                    onChange={handleInputChange} 
                                    className="form-input" 
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mô tả ngắn</label>
                                <textarea 
                                    placeholder="Giới thiệu nhanh về giảng viên..." 
                                    name="description" 
                                    value={newTeacher.description} 
                                    onChange={handleInputChange} 
                                    className="form-textarea" 
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>

                        <div className="modal-foot">
                            <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowCreateModal(false)}>Hủy</button>
                            <button className="primary-button" onClick={handleCreateTeacher}>Tạo giảng viên</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherManagement;