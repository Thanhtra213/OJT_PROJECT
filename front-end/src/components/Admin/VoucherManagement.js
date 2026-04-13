import { useState, useEffect } from "react";
import { Plus, RefreshCw, Power, PowerOff } from "lucide-react";
import Swal from "sweetalert2"; 
import { getAllVouchers, createVoucher, toggleVoucher } from "../../middleware/admin/voucherManagementAPI";
import { getAllPlans } from "../../middleware/admin/planAdminAPI";
import "./admin-dashboard-styles.scss";

export function VoucherManagement() {
  const [vouchers, setVouchers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      showPopup("Không thể tải dữ liệu", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSafeId = (v) => {
    return v.voucherID || v.voucherId || v.VoucherId || v.VoucherID || v.id || v.Id || v.ID;
  };

  const handleOpenModal = () => {
    setFormData({ code: '', discountAmount: 0, expiresAt: '', applicablePlanID: '', isActive: true });
    setShowModal(true);
  };

  const handleSave = async () => {
    const todayDate = new Date().toISOString().split('T')[0];

    if (!formData.code || formData.discountAmount <= 0 || !formData.expiresAt) {
      showPopup("Vui lòng nhập đầy đủ Mã, Số tiền (lớn hơn 0) và Ngày hết hạn", "error");
      return;
    }

    if (formData.expiresAt < todayDate) {
      showPopup("Lỗi: Ngày hết hạn phải từ ngày hôm nay trở đi!", "error");
      return;
    }

    // ✅ FIX LỖI DATABASE NULL: Ép định dạng JSON chuẩn xác 100% để C# đọc được
    const payload = {
      code: formData.code.trim(),
      discountAmount: Number(formData.discountAmount),
      expiresAt: `${formData.expiresAt}T00:00:00.000Z`, 
      applicablePlanId: formData.applicablePlanID ? Number(formData.applicablePlanID) : null,
      isActive: formData.isActive
    };

    try {
      await createVoucher(payload);
      showPopup("Tạo mã giảm giá mới thành công");
      setShowModal(false);
      fetchData();
    } catch (error) {
      showPopup("Lỗi: Không thể lưu mã giảm giá", "error");
    }
  };

  // ✅ LOGIC BẬT/TẮT THEO ĐÚNG BACKEND C#
  const handleToggle = async (voucher) => {
    const vId = getSafeId(voucher);
    if (!vId) return;

    const actionText = voucher.isActive ? "vô hiệu hóa" : "kích hoạt";

    Swal.fire({
      title: `Xác nhận ${actionText}?`,
      text: `Bạn có chắc muốn ${actionText} mã "${voucher.code}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await toggleVoucher(vId);
          showPopup(`Đã ${actionText} thành công!`);
          fetchData();
        } catch (error) {
          showPopup(`Lỗi khi ${actionText}`, "error");
        }
      }
    });
  };

  const getPlanName = (planID) => {
    if (!planID) return "Tất cả các gói";
    const plan = plans.find(p => (p.planID || p.planId || p.id || p.Id) == planID);
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

  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div className="management-card">
      <style>{`
        .swal2-container { z-index: 10000 !important; }
      `}</style>

      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 99999,
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
        <button onClick={handleOpenModal} className="primary-button">
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
            {vouchers.length > 0 ? vouchers.map((v) => {
              const vId = getSafeId(v) || Math.random();
              const vCode = v.code || v.Code || "";
              const vDiscount = v.discountAmount || v.DiscountAmount || 0;
              const vExpiresAt = v.expiresAt || v.ExpiresAt;
              const vPlanId = v.applicablePlanID || v.ApplicablePlanID;
              const vActive = v.isActive !== undefined ? v.isActive : (v.IsActive !== undefined ? v.IsActive : true);

              return (
              <tr key={vId}>
                <td className="fw-800" style={{ color: 'var(--primary)', letterSpacing: '1px' }}>{vCode}</td>
                <td className="fw-800" style={{ color: '#f59e0b' }}>
                  {vDiscount ? vDiscount.toLocaleString('vi-VN') : 0} VNĐ
                </td>
                <td className="fw-600">
                  {vExpiresAt ? new Date(vExpiresAt).toLocaleDateString('vi-VN') : ""}
                </td>
                <td className="td-sub fw-700">{getPlanName(vPlanId)}</td>
                <td style={{ textAlign: 'center' }}>
                  <span 
                    className="status-badge" 
                    style={{ 
                      backgroundColor: vActive ? 'rgba(0,200,150,0.12)' : 'rgba(107,114,128,0.12)', 
                      color: vActive ? 'var(--primary)' : '#6b7280' 
                    }}
                  >
                    {vActive ? 'Kích hoạt' : 'Vô hiệu (Ẩn)'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {/* Thay thế nút Edit/Delete bằng nút Bật/Tắt theo đúng Backend */}
                  <button 
                    onClick={() => handleToggle(v)} 
                    className="action-button" 
                    style={{ color: vActive ? '#ec4899' : '#00c896' }} 
                    title={vActive ? "Vô hiệu hóa" : "Kích hoạt mã này"}
                  >
                    {vActive ? <PowerOff size={18} /> : <Power size={18} />}
                  </button>
                </td>
              </tr>
            )}) : (
              <tr>
                <td colSpan="6">
                  <div className="admin-empty-data" style={{ padding: '3rem 0' }}>Không có dữ liệu voucher.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="management-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="management-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Tạo Voucher mới</h3>
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
                    type="text" 
                    placeholder="Nhập số tiền giảm..." 
                    value={formData.discountAmount === 0 ? '' : formData.discountAmount.toLocaleString('vi-VN')} 
                    onChange={e => {
                      const rawValue = e.target.value.replace(/\D/g, ''); 
                      setFormData({ ...formData, discountAmount: rawValue ? Number(rawValue) : 0 });
                    }} 
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Ngày hết hạn</label>
                  <input 
                    type="date" 
                    min={todayDate}
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
                    {plans.map(p => {
                      const pId = p.planID || p.planId || p.id || p.Id;
                      return (
                      <option key={pId} value={pId}>{p.name || p.Name} ({(p.price || p.Price || 0).toLocaleString('vi-VN')}đ)</option>
                    )})}
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
              <button className="primary-button" onClick={handleSave}>Tạo Voucher</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoucherManagement;