import React, { useEffect, useState } from "react";
import axios from "axios";
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
import { Plus, Edit, Trash, Eye, ArrowLeft, Upload, BookOpen, XCircle, Search } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import "./admin-dashboard-styles.scss";

export function FlashcardManagement() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSet, setSelectedSet] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // State tim kiem
  const [searchSet, setSearchSet] = useState("");
  const [searchItem, setSearchItem] = useState("");

  const [showSetModal, setShowSetModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  
  // Quan ly Modal Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1); 
  const [previewItems, setPreviewItems] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const [setForm, setSetForm] = useState({ setID: null, title: "", description: "" });
  const [itemForm, setItemForm] = useState({ itemID: null, frontText: "", ipa: "", backText: "", example: "" });

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const fetchSets = async () => {
    try {
      setLoading(true);
      const data = await getPublicSets();
      setSets(Array.isArray(data) ? data : []);
    } catch (err) {
      showPopup("Không thể tải danh sách Flashcard Set", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenSetModal = (set = null) => {
    if (set) {
      setSetForm({ setID: set.setID || set.setId, title: set.title, description: set.description || "" });
    } else {
      setSetForm({ setID: null, title: "", description: "" });
    }
    setShowSetModal(true);
  };

  const handleSaveSet = async () => {
    if (!setForm.title.trim()) return showPopup("Vui lòng nhập tên bộ thẻ!", "error");
    try {
      if (setForm.setID) {
        await updateFlashcardSet(setForm.setID, setForm);
        showPopup("Cập nhật bộ thẻ thành công!");
      } else {
        await createFlashcardSet(setForm);
        showPopup("Tạo bộ thẻ mới thành công!");
      }
      setShowSetModal(false);
      fetchSets();
    } catch (err) {
      showPopup("Lỗi khi lưu bộ thẻ", "error");
    }
  };

  const handleDeleteSet = async (set) => {
    const id = set.setID || set.setId;
    Swal.fire({
      title: "Xác nhận xóa?",
      text: `Bạn có chắc muốn xóa bộ thẻ "${set.title}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ec4899",
      cancelButtonText: "Hủy",
      confirmButtonText: "Xóa vĩnh viễn"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteFlashcardSet(id);
          showPopup("Đã xóa bộ thẻ thành công!");
          if (selectedSet && (selectedSet.setID || selectedSet.setId) === id) {
            setSelectedSet(null);
          }
          fetchSets();
        } catch (err) {
          showPopup("Lỗi khi xóa bộ thẻ", "error");
        }
      }
    });
  };

  const handleViewSet = async (set) => {
    const id = set.setID || set.setId;
    setSelectedSet(set);
    setSearchItem(""); // Reset search khi vao set moi
    try {
      setLoadingItems(true);
      const data = await getFlashcardSet(id);
      setItems(data.items || data.Items || []);
    } catch (err) {
      showPopup("Không thể tải danh sách thẻ", "error");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleOpenItemModal = (item = null) => {
    if (item) {
      setItemForm({ 
        itemID: item.itemID || item.itemId, 
        frontText: item.frontText, 
        ipa: item.ipa || "", 
        backText: item.backText, 
        example: item.example || "" 
      });
    } else {
      setItemForm({ itemID: null, frontText: "", ipa: "", backText: "", example: "" });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.frontText.trim() || !itemForm.backText.trim()) {
      return showPopup("Vui lòng nhập đủ Mặt trước và Mặt sau!", "error");
    }
    try {
      const setId = selectedSet.setID || selectedSet.setId;
      if (itemForm.itemID) {
        await updateFlashcardItem(itemForm.itemID, { ...itemForm, setID: setId });
        showPopup("Cập nhật thẻ thành công!");
      } else {
        await createFlashcardItem({ ...itemForm, setID: setId });
        showPopup("Thêm thẻ mới thành công!");
      }
      setShowItemModal(false);
      handleViewSet(selectedSet);
    } catch (err) {
      showPopup("Lỗi khi lưu thẻ", "error");
    }
  };

  const handleDeleteItem = async (item) => {
    const id = item.itemID || item.itemId;
    Swal.fire({
      title: "Xác nhận xóa thẻ?",
      text: `Thẻ "${item.frontText}" sẽ bị xóa khỏi bộ này.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ec4899",
      cancelButtonText: "Hủy",
      confirmButtonText: "Xóa"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteFlashcardItem(id);
          showPopup("Đã xóa thẻ!");
          handleViewSet(selectedSet);
        } catch (err) {
          showPopup("Lỗi khi xóa thẻ", "error");
        }
      }
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellText: false, cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
        
        const parsedItems = [];
        jsonData.forEach((row, index) => {
          if (index === 0) return;

          const frontText = row[0] !== undefined ? String(row[0]) : "";
          const backText = row[1] !== undefined ? String(row[1]) : "";
          const ipa = row[2] !== undefined ? String(row[2]) : "";
          const example = row[3] !== undefined ? String(row[3]) : "";

          if (frontText || backText || ipa || example) {
            parsedItems.push({
              id: Date.now() + index,
              frontText: frontText.trim(),
              backText: backText.trim(),
              ipa: ipa.trim(),
              example: example.trim()
            });
          }
        });

        setPreviewItems(parsedItems);
        setImportStep(2); 
      } catch (err) {
        console.error("Lỗi đọc file:", err);
        showPopup("Không thể đọc file. Định dạng không được hỗ trợ.", "error");
        setImportFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePreviewChange = (index, field, value) => {
    const newItems = [...previewItems];
    newItems[index][field] = value;
    setPreviewItems(newItems);
  };

  const handlePreviewDelete = (index) => {
    const newItems = previewItems.filter((_, i) => i !== index);
    setPreviewItems(newItems);
  };

  const isPreviewDataValid = () => {
    if (previewItems.length === 0) return false;
    
    const hasEmptyField = previewItems.some(item => 
      !item.frontText || item.frontText.trim() === "" || 
      !item.backText || item.backText.trim() === "" ||
      !item.ipa || item.ipa.trim() === "" ||
      !item.example || item.example.trim() === ""
    );

    return !hasEmptyField; 
  };

  const handleImportSubmit = async () => {
    if (!isPreviewDataValid()) {
      return showPopup("Có dữ liệu bị trống. Vui lòng điền ĐẦY ĐỦ tất cả các cột cho mọi thẻ!", "error");
    }

    let csvContent = "\uFEFFFrontText,BackText,IPA,Example\n";
    previewItems.forEach(item => {
      const escape = (str) => {
        let clean = str ? str.replace(/"/g, '""') : "";
        return clean.includes(',') || clean.includes('"') || clean.includes('\n') ? `"${clean}"` : clean;
      };
      csvContent += `${escape(item.frontText)},${escape(item.backText)},${escape(item.ipa)},${escape(item.example)}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const finalFile = new File([blob], "import_edited.csv", { type: "text/csv" });

    try {
      setIsImporting(true);
      const setId = selectedSet.setID || selectedSet.setId;
      const formData = new FormData();
      formData.append("file", finalFile);

      const token = localStorage.getItem("accessToken");
      const API_URL = process.env.REACT_APP_API_URL;

      const importUrl = `${API_URL}/api/admin/flashcard/set/${setId}/import`.replace(/([^:]\/)\/+/g, "$1");

      await axios.post(importUrl, formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          "ngrok-skip-browser-warning": "true"
        }
      });

      Swal.fire("Thành công!", "Import dữ liệu flashcard thành công!", "success");
      
      setShowImportModal(false);
      setImportStep(1);
      setImportFile(null);
      setPreviewItems([]);
      
      handleViewSet(selectedSet);
    } catch (err) {
      console.error("Loi import:", err);
      if (err.response && err.response.status === 404) {
           Swal.fire({
             icon: 'error',
             title: 'Lỗi 404 (Không tìm thấy API)',
             html: `Đường dẫn import không tồn tại trên Backend.<br/><br/>Hãy mở file Controller C# và đảm bảo bạn có:<br/><code>[HttpPost("set/{setId}/import")]</code>`
           });
      } else {
          let errorMsg = "Không thể import file. Vui lòng kiểm tra lại định dạng file chuẩn.";
          if (err.response && err.response.data) {
            errorMsg = err.response.data.message || errorMsg;
          }
          Swal.fire("Lỗi Import", errorMsg, "error");
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Tinh toan du lieu sau khi loc
  const filteredSets = sets.filter(s => 
    (s.title || "").toLowerCase().includes(searchSet.toLowerCase()) || 
    (s.description || "").toLowerCase().includes(searchSet.toLowerCase())
  );

  const filteredItems = items.filter(item => 
    (item.frontText || "").toLowerCase().includes(searchItem.toLowerCase()) || 
    (item.backText || "").toLowerCase().includes(searchItem.toLowerCase()) ||
    (item.ipa || "").toLowerCase().includes(searchItem.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-loading-spinner">
        <div className="admin-spinner"></div>
        <p>Đang tải danh sách Flashcard...</p>
      </div>
    );
  }

  return (
    <div className="management-card">
      <style>{`
        .swal2-container { z-index: 100000 !important; }
        .error-input { border: 2px solid #ef4444 !important; background-color: #fef2f2 !important; }
      `}</style>

      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 999999,
          background: toast.type === 'success' ? 'var(--primary)' : '#ec4899',
          color: '#fff', padding: '12px 24px', borderRadius: '99px',
          fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          {toast.message}
        </div>
      )}

      {selectedSet ? (
        <>
          <div className="management-card-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setSelectedSet(null)} className="secondary-button" style={{ padding: '8px' }}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="card-title">Chi tiết bộ thẻ: {selectedSet.title}</h2>
              <p className="card-description">Đang có tổng cộng {items.length} thẻ</p>
            </div>
          </div>

          <div className="management-header" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '350px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tìm kiếm thẻ (Từ vựng, Định nghĩa, IPA)..."
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px', marginBottom: 0, width: '100%' }}
              />
            </div>
            <div style={{ flexGrow: 1 }}></div>
            <button onClick={() => { setImportStep(1); setPreviewItems([]); setImportFile(null); setShowImportModal(true); }} className="secondary-button" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
              <Upload size={18} />
              <span>Import File</span>
            </button>
            <button onClick={() => handleOpenItemModal()} className="primary-button">
              <Plus size={18} />
              <span>Thêm thẻ mới</span>
            </button>
          </div>

          <div className="management-table-wrapper">
            {loadingItems ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải thẻ...</div>
            ) : (
              <table className="management-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>Mặt trước (Từ vựng)</th>
                    <th style={{ textAlign: 'center' }}>Phiên âm (IPA)</th>
                    <th style={{ textAlign: 'center' }}>Mặt sau (Định nghĩa)</th>
                    <th style={{ textAlign: 'center' }}>Ví dụ</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const itemId = item.itemID || item.itemId;
                      return (
                        <tr key={itemId}>
                          <td className="fw-800" style={{ color: 'var(--primary)', textAlign: 'center' }}>
                            {item.frontText}
                          </td>
                          <td style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                            {item.ipa || "—"}
                          </td>
                          <td className="fw-700" style={{ textAlign: 'center' }}>
                            {item.backText}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <p className="td-sub mb-0" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0 auto' }}>
                              {item.example || "—"}
                            </p>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button onClick={() => handleOpenItemModal(item)} className="action-button" title="Sửa thẻ">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => handleDeleteItem(item)} className="action-button" title="Xóa thẻ" style={{ color: '#ec4899' }}>
                                <Trash size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5">
                        <div className="admin-empty-data" style={{ padding: '3rem 0', flexDirection: 'column', gap: '1rem' }}>
                          <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
                          <span>Không tìm thấy thẻ nào phù hợp.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="management-card-header">
            <div>
              <h2 className="card-title">Quản lý Flashcard Set</h2>
              <p className="card-description">Hệ thống đang có {sets.length} bộ thẻ</p>
            </div>
          </div>

          <div className="management-header" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '350px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tìm kiếm bộ thẻ theo tên, mô tả..."
                value={searchSet}
                onChange={(e) => setSearchSet(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px', marginBottom: 0, width: '100%' }}
              />
            </div>
            <div style={{ flexGrow: 1 }}></div>
            <button onClick={() => handleOpenSetModal()} className="primary-button">
              <Plus size={18} />
              <span>Tạo bộ thẻ mới</span>
            </button>
          </div>

          <div className="management-table-wrapper">
            <table className="management-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Tên bộ thẻ</th>
                  <th style={{ textAlign: 'center' }}>Mô tả</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSets.length > 0 ? (
                  filteredSets.map((s) => {
                    const setId = s.setID || s.setId;
                    return (
                      <tr key={setId}>
                        <td className="fw-800 td-title" style={{ textAlign: 'center', color: 'var(--primary)' }}>{s.title}</td>
                        <td style={{ textAlign: 'center' }}>
                          <p className="td-sub mb-0" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0 auto' }}>
                            {s.description || "—"}
                          </p>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            <button onClick={() => handleViewSet(s)} className="action-button" title="Xem chi tiết thẻ">
                              <Eye size={18} />
                            </button>
                            <button onClick={() => handleOpenSetModal(s)} className="action-button" title="Sửa thông tin bộ">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleDeleteSet(s)} className="action-button" title="Xóa bộ thẻ" style={{ color: '#ec4899' }}>
                              <Trash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3">
                      <div className="admin-empty-data" style={{ padding: '3rem 0', flexDirection: 'column', gap: '1rem' }}>
                        <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
                        <span>Không tìm thấy bộ thẻ nào phù hợp.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showSetModal && (
        <div className="management-modal-overlay" onClick={() => setShowSetModal(false)}>
          <div className="management-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">{setForm.setID ? "Sửa bộ thẻ" : "Tạo bộ thẻ mới"}</h3>
            </div>
            <div className="modal-body-custom">
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tên bộ thẻ *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Vd: Tiếng Anh giao tiếp cơ bản..."
                  value={setForm.title}
                  onChange={(e) => setSetForm({ ...setForm, title: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mô tả chi tiết</label>
                <textarea
                  className="form-textarea"
                  placeholder="Nhập mô tả cho bộ thẻ này..."
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
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="management-modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="management-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">{itemForm.itemID ? "Sửa nội dung thẻ" : "Thêm thẻ mới"}</h3>
            </div>
            <div className="modal-body-custom">
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Từ vựng (Mặt trước) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Vd: Serendipity"
                    value={itemForm.frontText}
                    onChange={(e) => setItemForm({ ...itemForm, frontText: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Phiên âm (Tùy chọn)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Vd: /ˌser.ənˈdɪp.ə.ti/"
                    value={itemForm.ipa}
                    onChange={(e) => setItemForm({ ...itemForm, ipa: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Định nghĩa (Mặt sau) *</label>
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

      {showImportModal && (
        <div className="management-modal-overlay" onClick={() => !isImporting && setShowImportModal(false)}>
          <div className="management-modal-content" style={{ maxWidth: importStep === 2 ? '1000px' : '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ color: '#8b5cf6' }}>
                {importStep === 1 ? "Import Flashcard từ File" : "Kiểm tra và Sửa dữ liệu trước khi lưu"}
              </h3>
            </div>
            
            <div className="modal-body-custom" style={importStep === 2 ? { maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' } : {}}>
              {importStep === 1 && (
                <>
                  <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#6d28d9', fontSize: '0.9rem' }}>
                      Định dạng hỗ trợ: .CSV, .XLSX (Excel)
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                      Tất cả các file đều sẽ được trích xuất dữ liệu để bạn có thể xem trước và sửa lỗi trực tiếp trên màn hình trước khi đẩy vào bộ thẻ.
                    </p>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Chọn File</label>
                    <input
                      type="file"
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileSelect}
                      className="form-input"
                      style={{ padding: '0.5rem' }}
                    />
                  </div>
                </>
              )}

              {importStep === 2 && (
                <div className="management-table-wrapper" style={{ margin: 0, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                  <table className="management-table" style={{ minWidth: '800px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f9fafb' }}>
                      <tr>
                        <th style={{ textAlign: 'center', width: '20%' }}>Mặt trước *</th>
                        <th style={{ textAlign: 'center', width: '20%' }}>Phiên âm *</th>
                        <th style={{ textAlign: 'center', width: '25%' }}>Mặt sau *</th>
                        <th style={{ textAlign: 'center', width: '30%' }}>Ví dụ *</th>
                        <th style={{ textAlign: 'center', width: '5%' }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewItems.map((item, index) => (
                        <tr key={item.id}>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="text" 
                              className={`form-input ${!item.frontText.trim() ? 'error-input' : ''}`}
                              value={item.frontText} 
                              onChange={(e) => handlePreviewChange(index, 'frontText', e.target.value)} 
                              style={{ padding: '6px', fontSize: '0.85rem' }}
                              placeholder="Bắt buộc"
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="text" 
                              className={`form-input ${!item.ipa.trim() ? 'error-input' : ''}`}
                              value={item.ipa} 
                              onChange={(e) => handlePreviewChange(index, 'ipa', e.target.value)} 
                              style={{ padding: '6px', fontSize: '0.85rem' }}
                              placeholder="Bắt buộc"
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="text" 
                              className={`form-input ${!item.backText.trim() ? 'error-input' : ''}`}
                              value={item.backText} 
                              onChange={(e) => handlePreviewChange(index, 'backText', e.target.value)} 
                              style={{ padding: '6px', fontSize: '0.85rem' }}
                              placeholder="Bắt buộc"
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="text" 
                              className={`form-input ${!item.example.trim() ? 'error-input' : ''}`}
                              value={item.example} 
                              onChange={(e) => handlePreviewChange(index, 'example', e.target.value)} 
                              style={{ padding: '6px', fontSize: '0.85rem' }}
                              placeholder="Bắt buộc"
                            />
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>
                            <button onClick={() => handlePreviewDelete(index)} style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer' }}>
                              <XCircle size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewItems.length === 0 && (
                     <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>
                        Không có dữ liệu hợp lệ để hiển thị.
                     </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button onClick={() => { setShowImportModal(false); setImportStep(1); setImportFile(null); setPreviewItems([]); }} className="secondary-button" disabled={isImporting} style={{ marginRight: '1rem' }}>
                Hủy bỏ
              </button>
              <button 
                onClick={handleImportSubmit} 
                className="primary-button" 
                style={{ 
                  background: isPreviewDataValid() ? '#8b5cf6' : '#d1d5db', 
                  borderColor: isPreviewDataValid() ? '#8b5cf6' : '#d1d5db', 
                  boxShadow: isPreviewDataValid() ? '0 4px 15px rgba(139,92,246,0.3)' : 'none',
                  cursor: isPreviewDataValid() ? 'pointer' : 'not-allowed'
                }} 
                disabled={isImporting || !importFile || (importStep === 2 && !isPreviewDataValid())}
              >
                {isImporting ? "Đang lưu..." : "Lưu tất cả vào Bộ thẻ"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FlashcardManagement;