import { useState, useEffect } from "react";
import { Plus, Edit, X, RefreshCw, Power, PowerOff } from "lucide-react";
import { getAllVouchers, createVoucher, updateVoucher } from "../../middleware/admin/voucherManagementAPI";
import { getAllPlans } from "../../middleware/admin/planAdminAPI";
import "./admin-dashboard-styles.scss";

export function VoucherManagement() {
  const [vouchers, setVouchers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [formData, setFormData] = useState({
    code: '',
    discountAmount: 0,
    expiresAt: '',
    applicablePlanID: '',
    isActive: true
  });

  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // --- TẢI DỮ LIỆU ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [vouchersData, plansData] = await Promise.all([
        getAllVouchers(),
        getAllPlans()
      ]);
      setVouchers(vouchersData || []);
      setPlans(plansData || []);
    } catch (error) {
      showPopup("Không thể tải dữ liệu từ máy chủ", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- LOGIC XỬ LÝ ---
  const handleOpenModal = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code || "",
        discountAmount: voucher.discountAmount || 0,
        expiresAt: voucher.expiresAt ? voucher.expiresAt.split('T')[0] : '',
        applicablePlanID: voucher.applicablePlanID || '',
        isActive: voucher.isActive
      });
    } else {
      setEditingVoucher(null);
      setFormData({ code: '', discountAmount: 0, expiresAt: '', applicablePlanID: '', isActive: true });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.code || formData.discountAmount <= 0 || !formData.expiresAt) {
      showPopup("Vui lòng nhập đầy đủ Mã, Số tiền và Ngày hết hạn", "error");
      return;
    }

    const payload = {
      ...formData,
      applicablePlanID: formData.applicablePlanID ? parseInt(formData.applicablePlanID) : null
    };

    try {
      if (editingVoucher) {
        await updateVoucher(editingVoucher.voucherID, payload);
        showPopup("Cập nhật mã giảm giá thành công");
      } else {
        await createVoucher(payload);
        showPopup("Tạo mã giảm giá mới thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      showPopup("Lỗi: Không thể lưu mã giảm giá", "error");
    }
  };

  // --- LOGIC ẨN/HIỆN (THAY CHO XÓA) ---
  const handleToggleStatus = async (voucher) => {
    const newStatus = !voucher.isActive;
    const actionName = newStatus ? "kích hoạt (hiện)" : "vô hiệu hóa (ẩn)";
    
    if (!window.confirm(`Bạn có chắc muốn ${actionName} mã giảm giá này không?`)) return;

    try {
      const payload = {
        ...voucher,
        isActive: newStatus
      };
      await updateVoucher(voucher.voucherID, payload);
      showPopup(`Đã ${actionName} mã giảm giá thành công!`);
      fetchData();
    } catch (error) {
      showPopup(`Lỗi: Không thể ${actionName} mã giảm giá`, "error");
    }
  };

  const getPlanName = (planID) => {
    if (!planID) return "Tất cả các gói";
    const plan = plans.find(p => p.planID === planID);
    return plan ? plan.name : "";
  };

  if (isLoading) {
    return (
      <div className="admin-loading-spinner">
        <div className="admin-spinner"></div>
        <p>Đang tải danh sách Voucher...</p>
      </div>
    );
  }

  return (
    <div className="management-card">
      {/* Toast thông báo */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? '#00c896' : '#ec4899',
          color: '#fff', padding: '12px 24px', borderRadius: '99px',
          fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          {toast.message}
        </div>
      )}

      <div className="management-card-header">
        <div>
          <h2 className="card-title">Quản lý Mã Giảm Giá</h2>
          <p className="card-description">Danh sách các mã khuyến mãi áp dụng khi mua gói hội viên</p>
        </div>
      </div>

      <div className="management-header">
        <div style={{ flexGrow: 1 }}></div>
        <button className="secondary-button" style={{ marginRight: '10px' }} onClick={fetchData}>
          <RefreshCw size={16} /> Làm mới
        </button>
        <button onClick={() => handleOpenModal()} className="primary-button">
          <Plus size={18} /> <span>Tạo mã mới</span>
        </button>
      </div>

      <div className="management-table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã Code</th>
              <th>Giảm giá</th>
              <th>Ngày hết hạn</th>
              <th>Áp dụng cho</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length > 0 ? vouchers.map((v) => (
              <tr key={v.voucherID}>
                <td className="fw-800" style={{ color: 'var(--primary)', letterSpacing: '1px' }}>{v.code || ""}</td>
                <td className="fw-800" style={{ color: '#f59e0b' }}>
                  {v.discountAmount ? v.discountAmount.toLocaleString() : 0} VNĐ
                </td>
                <td className="fw-600">
                  {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString('vi-VN') : ""}
                </td>
                <td className="td-sub fw-700">{getPlanName(v.applicablePlanID)}</td>
                <td style={{ textAlign: 'center' }}>
                  <span 
                    className="status-badge" 
                    style={{ 
                      backgroundColor: v.isActive ? 'rgba(0,200,150,0.12)' : 'rgba(107,114,128,0.12)', 
                      color: v.isActive ? 'var(--primary)' : '#6b7280' 
                    }}
                  >
                    {v.isActive ? 'Kích hoạt' : 'Vô hiệu (Ẩn)'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleOpenModal(v)} className="action-button" title="Sửa">
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(v)} 
                    className="action-button" 
                    style={{ color: v.isActive ? '#ec4899' : '#00c896', marginLeft: '8px' }} 
                    title={v.isActive ? "Vô hiệu hóa mã này" : "Kích hoạt mã này"}
                  >
                    {v.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6">
                  <div className="admin-empty-data" style={{ padding: '3rem 0' }}>Không có dữ liệu voucher.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL THÊM / SỬA --- */}
      {showModal && (
        <div className="management-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="management-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">{editingVoucher ? "Chỉnh sửa Voucher" : "Tạo Voucher mới"}</h3>
            </div>
            
            <div className="modal-body-custom">
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mã Code</label>
                  <input 
                    type="text" 
                    placeholder="VD: KHUYENMAI20..." 
                    value={formData.code} 
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                    className="form-input"
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Số tiền giảm (VNĐ)</label>
                  <input 
                    type="number" 
                    placeholder="Nhập số tiền giảm..." 
                    value={formData.discountAmount} 
                    onChange={e => setFormData({ ...formData, discountAmount: Number(e.target.value) })} 
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Ngày hết hạn</label>
                  <input 
                    type="date" 
                    value={formData.expiresAt} 
                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} 
                    className="form-input"
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Gói áp dụng</label>
                  <select 
                    className="form-input"
                    value={formData.applicablePlanID}
                    onChange={e => setFormData({ ...formData, applicablePlanID: e.target.value })}
                  >
                    <option value="">Tất cả các gói</option>
                    {plans.map(p => (
                      <option key={p.planID} value={p.planID}>{p.name} ({p.price.toLocaleString()}đ)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive} 
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="isActive" style={{ fontWeight: 800, color: 'var(--text-dark)', cursor: 'pointer' }}>Kích hoạt mã này</label>
              </div>
            </div>

            <div className="modal-foot">
              <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="primary-button" onClick={handleSave}>
                {editingVoucher ? "Lưu thay đổi" : "Tạo Voucher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoucherManagement;