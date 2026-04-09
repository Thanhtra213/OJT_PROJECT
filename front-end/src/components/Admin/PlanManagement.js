import { useState, useEffect } from "react";
import { Plus, Trash, Edit } from "lucide-react";
import { getAllPlans, createPlan, updatePlan, deletePlan } from "../../middleware/admin/planAdminAPI";
import "./admin-dashboard-styles.scss";

export function PlanManagement() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [newPlan, setNewPlan] = useState({
    planCode: '',
    name: '',
    price: 0,
    durationDays: 30,
    isActive: true
  });

  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await getAllPlans();
      setPlans(data || []);
    } catch (error) {
      showPopup("Không thể tải danh sách gói hội viên", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.planCode || !newPlan.name) {
      showPopup("Vui lòng nhập mã và tên gói", "error");
      return;
    }
    try {
      await createPlan(newPlan);
      showPopup("Tạo gói hội viên thành công!", "success");
      setShowCreateModal(false);
      setNewPlan({ planCode: '', name: '', price: 0, durationDays: 30, isActive: true });
      loadPlans();
    } catch (error) {
      showPopup(error.response?.data?.message || error.message || "Lỗi khi tạo gói hội viên", "error");
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setNewPlan({
      planCode: plan.planCode,
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      isActive: plan.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdatePlan = async () => {
    if (!newPlan.planCode || !newPlan.name) {
      showPopup("Vui lòng nhập mã và tên gói", "error");
      return;
    }
    try {
      await updatePlan(editingPlan.planID, newPlan);
      showPopup("Cập nhật gói hội viên thành công!", "success");
      setShowEditModal(false);
      setEditingPlan(null);
      setNewPlan({ planCode: '', name: '', price: 0, durationDays: 30, isActive: true });
      loadPlans();
    } catch (error) {
      showPopup(error.response?.data?.message || error.message || "Lỗi khi cập nhật gói", "error");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Bạn có chắc muốn xóa gói hội viên này không?")) return;
    try {
      await deletePlan(planId, false);
      showPopup("Đã xóa gói hội viên thành công", "success");
      setPlans(plans.filter(p => p.planID !== planId));
    } catch (error) {
      showPopup("Không thể xóa gói hội viên", "error");
    }
  };

  const formatDuration = (days) => {
    if (days >= 9999) return "Trọn đời";
    if (days >= 365) return `${Math.floor(days / 365)} năm`;
    if (days >= 30) return `${Math.floor(days / 30)} tháng`;
    return `${days} ngày`;
  };

  if (isLoading) {
    return (
      <div className="admin-loading-spinner">
        <div className="admin-spinner"></div>
        <p>Đang tải dữ liệu gói hội viên...</p>
      </div>
    );
  }

  return (
    <div className="management-card">
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

      <div className="management-card-header">
        <div>
          <h2 className="card-title">Quản lý Gói Hội Viên</h2>
          <p className="card-description">Tổng số: {plans.length} gói hội viên trên hệ thống</p>
        </div>
      </div>

      <div className="management-header">
        <div style={{ flexGrow: 1 }}></div>
        <button onClick={() => setShowCreateModal(true)} className="primary-button">
          <Plus size={18} />
          <span>Tạo gói mới</span>
        </button>
      </div>

      <div className="management-table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã gói</th>
              <th>Tên gói</th>
              <th>Giá</th>
              <th>Thời hạn</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {plans.length > 0 ? (
              plans.map((plan) => (
                <tr key={plan.planID}>
                  <td className="fw-800" style={{ color: 'var(--primary)', letterSpacing: '0.5px' }}>{plan.planCode}</td>
                  <td className="fw-800 td-title">{plan.name}</td>
                  <td className="fw-800" style={{ color: '#f59e0b' }}>{plan.price.toLocaleString()} VNĐ</td>
                  <td className="td-sub fw-700">{formatDuration(plan.durationDays)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span 
                      className="status-badge" 
                      style={{ 
                        backgroundColor: plan.isActive ? 'rgba(0,200,150,0.12)' : 'rgba(107,114,128,0.12)', 
                        color: plan.isActive ? 'var(--primary)' : '#6b7280' 
                      }}
                    >
                      {plan.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="fw-600">{new Date(plan.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleEditPlan(plan)} 
                      className="action-button"
                      title="Chỉnh sửa"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeletePlan(plan.planID)} 
                      className="action-button"
                      style={{ color: '#ec4899', marginLeft: '8px' }}
                      title="Xóa"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <div className="admin-empty-data" style={{ padding: '3rem 0' }}>
                    Chưa có gói hội viên nào.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="management-modal-overlay" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <div className="management-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">{showEditModal ? "Chỉnh sửa gói" : "Tạo gói hội viên mới"}</h3>
            </div>
            
            <div className="modal-body-custom">
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mã gói (VD: MONTHLY)</label>
                  <input 
                    type="text" 
                    placeholder="Nhập mã gói..." 
                    value={newPlan.planCode} 
                    onChange={e => setNewPlan({ ...newPlan, planCode: e.target.value.toUpperCase() })} 
                    className="form-input"
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tên gói</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên gói..." 
                    value={newPlan.name} 
                    onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} 
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Giá (VNĐ)</label>
                  <input 
                    type="number" 
                    placeholder="Nhập giá tiền..." 
                    value={newPlan.price} 
                    onChange={e => setNewPlan({ ...newPlan, price: Number(e.target.value) })} 
                    className="form-input"
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Thời hạn (Ngày)</label>
                  <input 
                    type="number" 
                    placeholder="Số ngày..." 
                    value={newPlan.durationDays} 
                    onChange={e => setNewPlan({ ...newPlan, durationDays: Number(e.target.value) })} 
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  id="isActiveToggle" 
                  checked={newPlan.isActive} 
                  onChange={e => setNewPlan({ ...newPlan, isActive: e.target.checked })} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="isActiveToggle" style={{ fontWeight: 800, color: 'var(--text-dark)', cursor: 'pointer' }}>
                  Cho phép hoạt động
                </label>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                className="secondary-button" 
                style={{ marginRight: '1rem' }} 
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
              >
                Hủy
              </button>
              <button 
                className="primary-button" 
                onClick={showEditModal ? handleUpdatePlan : handleCreatePlan}
              >
                {showEditModal ? "Cập nhật gói" : "Tạo gói"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanManagement;