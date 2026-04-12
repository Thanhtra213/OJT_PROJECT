import { useState, useEffect } from "react";
import { UserPlus, Power, PowerOff, Search } from "lucide-react";
import Swal from "sweetalert2";
import { getTeachers, searchUsers, lockUser, unlockUser, createUser } from "../../middleware/admin/userManagementAPI";
import "./admin-dashboard-styles.scss"; 

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
        setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    };

    useEffect(() => {
        loadTeachers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    //TẢI VÀ BÓC TÁCH DỮ LIỆU
    const loadTeachers = async () => {
        try {
            setIsLoading(true);
            const response = await getTeachers();
            
            let dataList = [];
            if (Array.isArray(response)) dataList = response;
            else if (response && Array.isArray(response.data)) dataList = response.data;
            else if (response && Array.isArray(response.content)) dataList = response.content;

            // Xử lý quét tên ID để fix lỗi 400 Bad Request
            const mapped = dataList.map(t => ({
                ...t,
                accountID: t.accountId || t.accountID || t.id || t.Id || t.userId || t.UserId || Math.random().toString(),
                username: t.username || t.userName || t.name || t.fullName || "Chưa có tên",
                email: t.email || t.Email || "Không có email",
                isActive: t.status === 'ACTIVE' || t.isActive === true || t.status === 1 || t.active === true
            }));

            setTeachers(mapped);
        } catch (error) {
            console.error("Lỗi khi tải danh sách giảng viên:", error);
            showPopup("Không thể tải danh sách giảng viên", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // 🛡️ XỬ LÝ KHÓA/MỞ KHÓA BẰNG SWEETALERT2
    const handleToggleTeacher = (accountID, isActive) => {
        if (!accountID || (typeof accountID === 'number' && accountID < 1)) {
            Swal.fire('Lỗi Dữ Liệu!', 'Không tìm thấy ID của tài khoản này.', 'error');
            return;
        }

        Swal.fire({
            title: isActive ? "Xác nhận khóa tài khoản?" : "Mở khóa tài khoản?",
            text: isActive 
                ? "Giảng viên này sẽ không thể đăng nhập vào hệ thống nữa." 
                : "Giảng viên sẽ có thể truy cập hệ thống bình thường trở lại.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: isActive ? "#ec4899" : "#00c896",
            cancelButtonColor: "#9ca3af",
            confirmButtonText: isActive ? "Khóa tài khoản" : "Mở khóa",
            cancelButtonText: "Hủy bỏ",
            backdrop: `rgba(0,0,0,0.4)`
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (isActive) {
                        await lockUser(accountID);
                    } else {
                        await unlockUser(accountID);
                    }
                    Swal.fire(
                        'Thành công!',
                        `Đã ${isActive ? 'khóa' : 'mở khóa'} tài khoản giảng viên.`,
                        'success'
                    );
                    loadTeachers();
                } catch (error) {
                    Swal.fire(
                        'Lỗi!',
                        error.response?.data?.message || "Không thể cập nhật trạng thái",
                        'error'
                    );
                }
            }
        });
    };

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) {
            loadTeachers();
            return;
        }
        try {
            setIsLoading(true);
            const response = await searchUsers(searchQuery, 'TEACHER');
            
            let dataList = [];
            if (Array.isArray(response)) dataList = response;
            else if (response && Array.isArray(response.data)) dataList = response.data;
            else if (response && Array.isArray(response.content)) dataList = response.content;

            const mapped = dataList.map(t => ({
                ...t,
                accountID: t.accountId || t.accountID || t.id || t.Id || t.userId || t.UserId,
                username: t.username || t.userName || t.name || t.fullName || "Chưa có tên",
                email: t.email || t.Email || "Không có email",
                isActive: t.status === 'ACTIVE' || t.isActive === true || t.status === 1 || t.active === true
            }));
            
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
            Swal.fire('Thành công!', 'Tạo giảng viên thành công!', 'success');
            setShowCreateModal(false);
            loadTeachers();
            setNewTeacher({ email: "", username: "", password: "", role: "TEACHER", description: "" });
        } catch (error) {
            Swal.fire('Lỗi!', error.message || "Không thể tạo giảng viên", 'error');
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

            {/* HEADER */}
            <div className="management-card-header">
                <div>
                    <h2 className="card-title">Quản lý giảng viên</h2>
                    <p className="card-description">Tổng số: {filteredTeachers.length} giảng viên</p>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="management-header" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ flexGrow: 1, minWidth: '280px', maxWidth: '400px' }}>
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
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowCreateModal(true)} className="primary-button">
                        <UserPlus size={18} />
                        <span>Thêm giảng viên</span>
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="management-table-wrapper">
                <table className="management-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Giảng viên</th>
                            <th style={{ textAlign: 'left' }}>Mô tả</th>
                            <th style={{ textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ textAlign: 'center' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => (
                            <tr key={teacher.accountID}>
                                <td style={{ textAlign: 'left' }}>
                                    <div className="fw-800 td-title">{teacher.username}</div>
                                    <div className="td-sub">{teacher.email}</div>
                                </td>
                                <td style={{ textAlign: 'left', maxWidth: '250px' }}>
                                    <p className="td-sub mb-0" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {teacher.description || "Chưa có mô tả"}
                                    </p>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span 
                                        className="status-badge"
                                        style={{ 
                                            backgroundColor: teacher.isActive ? 'rgba(0,200,150,0.12)' : 'rgba(236,72,153,0.12)', 
                                            color: teacher.isActive ? 'var(--primary)' : '#ec4899',
                                            display: 'inline-block'
                                        }}
                                    >
                                        {teacher.isActive ? 'Hoạt động' : 'Đã khóa'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <button 
                                        className="action-button" 
                                        title={teacher.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                        style={{ color: teacher.isActive ? '#ec4899' : 'var(--primary)', margin: '0 auto' }}
                                        onClick={() => handleToggleTeacher(teacher.accountID, teacher.isActive)}
                                    >
                                        {teacher.isActive ? <PowerOff size={18} /> : <Power size={18} />}
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