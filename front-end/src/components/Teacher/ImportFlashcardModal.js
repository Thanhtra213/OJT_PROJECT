import React, { useState, useRef } from "react";
import { Modal, Button, Table, Form, Alert, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileUpload, faTrash, faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import "./ImportFlashcardModal.scss";

const ImportFlashcardModal = ({ show, onHide, onImportSuccess }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isParsed, setIsParsed] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    const extension = file.name.split(".").pop().toLowerCase();

    reader.onload = (event) => {
      try {
        let parsedData = [];
        if (extension === "xlsx" || extension === "xls") {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else if (extension === "csv") {
          const text = event.target.result;
          const result = Papa.parse(text, { header: false });
          parsedData = result.data;
        } else {
          throw new Error("Chỉ hỗ trợ file .xlsx, .xls hoặc .csv");
        }

        // Bỏ qua header row (giả sử dòng đầu là header)
        const itemsList = parsedData.slice(1)
          .filter(row => row.length >= 2 && row[0] && row[1]) // Yêu cầu ít nhất Front và Back
          .map((row, index) => ({
            tempId: Date.now() + index,
            frontText: row[0]?.toString().trim() || "",
            backText: row[1]?.toString().trim() || "",
            ipa: row[2]?.toString().trim() || "",
            example: row[3]?.toString().trim() || "",
          }));

        if (itemsList.length === 0) {
          throw new Error("Không tìm thấy dữ liệu hợp lệ. Đảm bảo file có ít nhất 2 cột: Mặt trước và Mặt sau.");
        }

        setItems(itemsList);
        setIsParsed(true);
      } catch (err) {
        setError(err.message || "Lỗi khi đọc file.");
      } finally {
        setLoading(false);
      }
    };

    if (extension === "xlsx" || extension === "xls") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleItemChange = (tempId, field, value) => {
    setItems(items.map(item => 
      item.tempId === tempId ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (tempId) => {
    setItems(items.filter(item => item.tempId !== tempId));
  };

  const handleAddItem = () => {
    const newItem = {
      tempId: Date.now(),
      frontText: "",
      backText: "",
      ipa: "",
      example: "",
    };
    setItems([...items, newItem]);
  };

  const handleConfirmImport = () => {
    onImportSuccess(items);
    resetAndClose();
  };

  const resetAndClose = () => {
    setItems([]);
    setIsParsed(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onHide();
  };

  return (
    <Modal show={show} onHide={resetAndClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Nhập Flashcard từ file</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {!isParsed ? (
          <div className="import-upload-zone text-center py-5 border rounded bg-light">
            <FontAwesomeIcon icon={faFileUpload} size="3x" className="text-primary mb-3" />
            <h5>Chọn file Excel (.xlsx) hoặc CSV (.csv)</h5>
            <p className="text-muted small">
              File nên có các cột theo thứ tự: Mặt trước, Mặt sau, Phiên âm, Ví dụ.
            </p>
            <Form.Group className="mt-4 d-flex justify-content-center">
              <Form.Control
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ maxWidth: "300px" }}
              />
            </Form.Group>
            {loading && <Spinner animation="border" className="mt-3" />}
          </div>
        ) : (
          <div className="import-preview-zone">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Xem trước và chỉnh sửa ({items.length} thẻ)</h6>
              <Button variant="outline-primary" size="sm" onClick={handleAddItem}>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Thêm dòng mới
              </Button>
            </div>
            <Table responsive striped bordered hover size="sm" className="mt-2">
              <thead>
                <tr>
                  <th>Mặt trước</th>
                  <th>Mặt sau</th>
                  <th>Phiên âm</th>
                  <th>Ví dụ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.tempId}>
                    <td>
                      <Form.Control
                        size="sm"
                        value={item.frontText}
                        onChange={(e) => handleItemChange(item.tempId, "frontText", e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        value={item.backText}
                        onChange={(e) => handleItemChange(item.tempId, "backText", e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        value={item.ipa}
                        onChange={(e) => handleItemChange(item.tempId, "ipa", e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        value={item.example}
                        onChange={(e) => handleItemChange(item.tempId, "example", e.target.value)}
                      />
                    </td>
                    <td className="text-center">
                      <Button 
                        variant="link" 
                        className="text-danger p-0"
                        onClick={() => handleRemoveItem(item.tempId)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={resetAndClose}>
          Hủy
        </Button>
        {isParsed && (
          <Button 
            variant="success" 
            onClick={handleConfirmImport}
            disabled={items.length === 0}
          >
            <FontAwesomeIcon icon={faCheck} className="me-2" />
            Xác nhận nhập
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ImportFlashcardModal;
