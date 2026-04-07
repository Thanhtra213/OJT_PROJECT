import React, { useEffect, useState } from "react";
import {
  getPublicSets,
  getFlashcardSet,
  createFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
  createFlashcardItem,
  updateFlashcardItem,
  deleteFlashcardItem,
} from "../../middleware/admin/adminFlashcardAPI";
import { Plus, Edit, Trash, Eye, X, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import "./admin-dashboard-styles.scss";

export function FlashcardManagement() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState(null);

  const [showSetModal, setShowSetModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  const [setForm, setSetForm] = useState({ title: "", description: "" });
  const [itemForm, setItemForm] = useState({
    frontText: "",
    ipa: "", 
    backText: "",
    example: "",
    setID: null,
  });

  const loadSets = async () => {
    try {
      setLoading(true);
      const data = await getPublicSets();
      if (data) setSets(data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSet = async (setId) => {
    try {
      const detail = await getFlashcardSet(setId);
      setSelectedSet(detail);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleOpenSetModal = (set = null) => {
    if (set) {
      setSetForm({
        setID: set.setID,
        title: set.title || "",
        description: set.description || ""
      });
    } else {
      setSetForm({ title: "", description: "" });
    }
    setShowSetModal(true);
  };

  const handleSaveSet = async () => {
    if (!setForm.title?.trim()) {
      Swal.fire("Thiếu dữ liệu", "Vui lòng nhập tiêu đề Flashcard Set", "warning");
      return;
    }

    try {
      if (setForm.setID) await updateFlashcardSet(setForm.setID, setForm);
      else await createFlashcardSet(setForm);

      Swal.fire("Thành công", "Đã lưu Flashcard Set!", "success");
      setShowSetModal(false);
      loadSets();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteSet = (setId) => {
    Swal.fire({
      title: "Xác nhận xóa?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ec4899",
      cancelButtonColor: "#9ca3af",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await deleteFlashcardSet(setId);
          Swal.fire("Đã xóa!", "Flashcard Set đã bị xóa.", "success");
          setSelectedSet(null);
          loadSets();
        } catch (err) {
          handleApiError(err);
        }
      }
    });
  };

  const handleOpenItemModal = (item = null, setID = null) => {
    if (item) {
      setItemForm({
        frontText: item.frontText || "",
        ipa: item.ipa || "",
        backText: item.backText || "",
        example: item.example || "",
        itemID: item.itemID,
        setID,
      });
    } else {
      setItemForm({
        frontText: "",
        ipa: "",
        backText: "",
        example: "",
        setID,
      });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.frontText?.trim() || !itemForm.backText?.trim()) {
      Swal.fire("Thiếu dữ liệu", "Vui lòng nhập Thuật ngữ và Nghĩa của nó", "warning");
      return;
    }

    try {
      // ÉP LƯU CHUỖI RỖNG ("") ĐỂ BÁO BACKEND XÓA DỮ LIỆU
      const payload = {
        setID: itemForm.setID,
        frontText: itemForm.frontText.trim(),
        ipa: itemForm.ipa.trim(), 
        backText: itemForm.backText.trim(),
        example: itemForm.example.trim(), 
      };

      if (itemForm.itemID) {
        await updateFlashcardItem(itemForm.itemID, payload);
      } else {
        await createFlashcardItem(payload);
      }

      Swal.fire("Thành công", "Đã lưu Flashcard Item!", "success");
      setShowItemModal(false);
      const detail = await getFlashcardSet(itemForm.setID);
      setSelectedSet(detail);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteItem = (itemId, setID) => {
    Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc chắn muốn xóa thẻ này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ec4899",
      cancelButtonColor: "#9ca3af",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await deleteFlashcardItem(itemId);
          Swal.fire("Đã xóa!", "Thẻ (Item) đã bị xóa.", "success");
          const detail = await getFlashcardSet(setID);
          setSelectedSet(detail);
        } catch (err) {
          handleApiError(err);
        }
      }
    });
  };

  const handleApiError = (err) => {
    const msg = err?.response?.data?.message || err?.message || "Đã xảy ra lỗi không xác định.";
    Swal.fire(`Lỗi ${err?.response?.status || ''}`, msg, "error");
  };

  const renderSetList = () => (
    <>
      <div className="management-card-header">
        <div>
          <h2 className="card-title">Quản lý Flashcard</h2>
          <p className="card-description">Tạo và quản lý các bộ flashcard công khai trên hệ thống.</p>
        </div>
      </div>

      <div className="management-header">
        <div style={{ flex: 1 }}></div>
        <button onClick={() => handleOpenSetModal()} className="primary-button">
          <Plus size={18} />
          <span>Thêm bộ mới</span>
        </button>
      </div>

      {loading ? (
        <div className="admin-loading-spinner">
          <div className="admin-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {sets.length > 0 ? (
            sets.map((set) => (
              <div key={set.setID} className="interactive-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                <h4 className="card-title" style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>{set.title}</h4>
                <p className="card-description" style={{ flexGrow: 1, marginBottom: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {set.description || "Chưa có mô tả"}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1.5px dashed var(--border)', paddingTop: '1.25rem' }}>
                  <button
                    className="action-button"
                    title="Xem chi tiết thẻ"
                    onClick={() => handleSelectSet(set.setID)}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="action-button"
                    title="Chỉnh sửa bộ thẻ"
                    onClick={() => handleOpenSetModal(set)}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="action-button"
                    title="Xóa bộ thẻ"
                    onClick={() => handleDeleteSet(set.setID)}
                    style={{ color: '#ec4899' }}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-empty-data" style={{ gridColumn: '1 / -1', padding: '4rem 0' }}>
              Hệ thống chưa có bộ Flashcard nào.
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderSetDetails = () => (
    <>
      <div className="management-header" style={{ marginBottom: '1rem' }}>
        <button onClick={() => setSelectedSet(null)} className="secondary-button">
            <ArrowLeft size={16} />
            <span>Quay lại</span>
        </button>
        <button onClick={() => handleOpenItemModal(null, selectedSet.setID)} className="primary-button">
            <Plus size={18} />
            <span>Thêm thẻ</span>
        </button>
      </div>

      <div className="management-card-header" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title">Chi tiết bộ: {selectedSet.title}</h3>
        <p className="card-description">{selectedSet.description || "Không có mô tả"}</p>
      </div>

      <div className="management-table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th>Thuật ngữ (Front)</th>
              <th>Định nghĩa (Back)</th>
              <th>Ví dụ</th>
              <th style={{ textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {selectedSet.items?.length > 0 ? (
              selectedSet.items.map((item) => (
                <tr key={item.itemID}>
                  <td>
                    <p className="fw-800 mb-0" style={{ color: 'var(--primary)' }}>{item.frontText}</p>
                    {item.ipa && <p className="td-sub mb-0" style={{ fontStyle: 'italic', marginTop: '2px' }}>/{item.ipa}/</p>}
                  </td>
                  <td className="fw-700">{item.backText}</td>
                  <td className="td-sub">{item.example || "N/A"}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="action-button"
                      title="Sửa thẻ"
                      onClick={() => handleOpenItemModal(item, selectedSet.setID)}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="action-button"
                      title="Xóa thẻ"
                      style={{ color: '#ec4899', marginLeft: '8px' }}
                      onClick={() => handleDeleteItem(item.itemID, selectedSet.setID)}
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">
                  <div className="admin-empty-data" style={{ padding: '3rem 0' }}>
                    Chưa có thẻ (Item) nào trong bộ này.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="management-card">
      {selectedSet ? renderSetDetails() : renderSetList()}

      {/* MODAL: BỘ FLASHCARD */}
      {showSetModal && (
        <div className="management-modal-overlay" onClick={() => setShowSetModal(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">
                {setForm.setID ? "Sửa Flashcard Set" : "Thêm Flashcard Set"}
              </h3>
            </div>
            <div className="modal-body-custom">
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tiêu đề</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tiêu đề bộ thẻ..."
                  value={setForm.title}
                  onChange={(e) => setSetForm({ ...setForm, title: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mô tả</label>
                <textarea
                  className="form-textarea"
                  placeholder="Nhập mô tả bộ thẻ (không bắt buộc)..."
                  rows="3"
                  value={setForm.description}
                  onChange={(e) => setSetForm({ ...setForm, description: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="modal-foot">
              <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowSetModal(false)}>
                Hủy
              </button>
              <button className="primary-button" onClick={handleSaveSet}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THẺ TỪ VỰNG (ITEM) */}
      {showItemModal && (
        <div className="management-modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">
                {itemForm.itemID ? "Sửa Flashcard Item" : "Thêm Flashcard Item"}
              </h3>
            </div>
            <div className="modal-body-custom">
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Thuật ngữ (Mặt trước)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Vd: Serendipity..."
                  value={itemForm.frontText}
                  onChange={(e) => setItemForm({ ...itemForm, frontText: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Phiên âm (IPA) - Tùy chọn</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Vd: /ˌserənˈdɪpəti/..."
                  value={itemForm.ipa}
                  onChange={(e) => setItemForm({ ...itemForm, ipa: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Định nghĩa (Mặt sau)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Vd: Sự tình cờ may mắn..."
                  value={itemForm.backText}
                  onChange={(e) => setItemForm({ ...itemForm, backText: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Ví dụ (Tùy chọn)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Nhập câu ví dụ minh họa..."
                  rows="2"
                  value={itemForm.example}
                  onChange={(e) => setItemForm({ ...itemForm, example: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="modal-foot">
              <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowItemModal(false)}>
                Hủy
              </button>
              <button className="primary-button" onClick={handleSaveItem}>
                Lưu thẻ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlashcardManagement;