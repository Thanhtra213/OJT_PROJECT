import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  FaCog,
  FaLock,
  FaCamera,
  FaTrash,
  FaUpload,
  FaArrowLeft,
  FaChalkboardTeacher,
  FaCertificate,
  FaPlus,
  FaTimes,
  FaFileUpload,
  FaSpinner,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import {
  getUser,
  updateUser,
  updateAvatar,
  changePassword,
} from "../../middleware/userAPI";
import { uploadCertificate } from "../../middleware/teacher/uploadAPI";
import {
  getTeacherInfo,
  updateTeacherInfo,
} from "../../middleware/teacher/teacherAPI";
import "./Profile.scss";

// ========== JWT Helpers ==========
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const getUserRole = (token) => {
  const decoded = decodeToken(token);
  return (
    decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    decoded?.role ||
    decoded?.Role ||
    ""
  );
};

// teacherId trong JWT (nếu có)
const getTeacherIdFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return decoded.teacherId || decoded.TeacherId || decoded.teacher_id || null;
};

// userId (NameIdentifier) trong JWT – backend đang dùng cái này làm TeacherID
const getUserIdFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return (
    decoded[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ||
    decoded.userId ||
    decoded.UserId ||
    decoded.sub ||
    null
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const backPath = -1;

  // ---------- STATE ----------
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    bio: "",
    address: "",
    dob: "",
    gender: "",
    phone: "",
  });

  const [teacherInfo, setTeacherInfo] = useState({
    description: "",
    certUrls: [],
  });
  const [newCertUrl, setNewCertUrl] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherId, setTeacherId] = useState(null);

  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.png");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // ---------- TOAST ----------
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "" }),
      5000
    );
  };

  // ---------- UPLOAD CERTIFICATE ----------
  const handleUploadCertificateFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      showToast("Chỉ chấp nhận file JPG, PNG hoặc PDF!", "warning");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("File quá lớn! Vui lòng chọn file dưới 10MB.", "warning");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      showToast("Đang upload chứng chỉ...", "info");

      const result = await uploadCertificate(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result && result.url) {
        setTeacherInfo((prev) => ({
          ...prev,
          certUrls: [...prev.certUrls, result.url],
        }));
        showToast(`Upload thành công: ${file.name}`, "success");
        e.target.value = "";
      } else {
        showToast("Upload thất bại! Vui lòng thử lại.", "error");
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      showToast(error.message || "Lỗi khi upload chứng chỉ", "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ---------- FETCH USER DATA ----------
  useEffect(() => {
    if (!token) {
      setError("Vui lòng đăng nhập để xem trang này");
      setLoading(false);
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const decodedToken = decodeToken(token);
        const username =
          decodedToken?.[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
          ] || "";
        const userRole = getUserRole(token);
        const isTeacherRole = userRole.toUpperCase() === "TEACHER";

        const userIdFromToken = getUserIdFromToken(token);
        const teacherIdFromToken = getTeacherIdFromToken(token);

        console.log("👤 Username:", username);
        console.log("🎭 Role:", userRole);
        console.log("👨‍🏫 Is Teacher:", isTeacherRole);
        console.log("🆔 userId (NameIdentifier):", userIdFromToken);
        console.log("🆔 teacherId claim:", teacherIdFromToken);

        setIsTeacher(isTeacherRole);

        // Lấy chi tiết user
        const detailData = await getUser(token);

        let email = "";
        try {
          const storedUser = JSON.parse(
            localStorage.getItem("user") || "{}"
          );
          email = storedUser.email || storedUser.Email || "";
        } catch (e) {
          console.warn("Cannot get email from localStorage");
        }

        // Avatar
        let avatarURL = "";
        try {
          const API_BASE =
            process.env.REACT_APP_API_URL || "https://localhost:7010";
          const avatarRes = await fetch(
            `${API_BASE}/api/user/profile/avatar`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

          if (avatarRes.ok) {
            const avatarData = await avatarRes.json();
            avatarURL =
              avatarData.avatarUrl ||
              avatarData.avatarURL ||
              avatarData.AvatarUrl ||
              "";
          }
        } catch (avatarErr) {
          console.error("❌ Avatar fetch error:", avatarErr);
        }

        if (isMounted) {
          setUser({
            fullName: detailData?.fullName || username || "Chưa cập nhật",
            email: email || username || "Chưa có email",
            bio: detailData?.bio || "",
            address: detailData?.address || "",
            dob: detailData?.dob ? detailData.dob.split("T")[0] : "",
            gender: detailData?.gender || "",
            phone: detailData?.phone || "",
          });

          if (avatarURL) {
            setAvatarUrl(avatarURL);
          }
        }

        // ---------- TEACHER INFO ----------
        if (isTeacherRole) {
          // Ưu tiên teacherId claim, sau đó tới detailData, sau cùng là userId (NameIdentifier)
          let finalTeacherId =
            teacherIdFromToken ||
            detailData?.teacherId ||
            detailData?.TeacherId ||
            detailData?.teacherID ||
            userIdFromToken ||
            null;

          if (!finalTeacherId) {
            console.warn(
              "❌ Không tìm thấy teacherId ở token hoặc user detail – hãy kiểm tra backend hoặc thêm claim teacherId vào JWT."
            );
            showToast(
              "Không tìm thấy ID giáo viên. Vui lòng liên hệ admin.",
              "warning"
            );
          } else {
            console.log("✅ finalTeacherId dùng để gọi API:", finalTeacherId);
            setTeacherId(finalTeacherId);

            try {
              const teacherData = await getTeacherInfo(finalTeacherId);
              console.log(
                "👨‍🏫 Teacher API Response:",
                JSON.stringify(teacherData, null, 2)
              );

              if (isMounted && teacherData) {
                const description =
                  teacherData.description || teacherData.Description || "";
                const certs =
                  teacherData.certs ||
                  teacherData.Certs ||
                  teacherData.certUrls ||
                  [];

                setTeacherInfo({
                  description,
                  certUrls: Array.isArray(certs) ? certs : [],
                });

                console.log("✅ Teacher info loaded:", {
                  description,
                  certCount: Array.isArray(certs) ? certs.length : 0,
                });
              }
            } catch (teacherErr) {
              console.error("❌ Failed to fetch teacher info:", teacherErr);
              showToast("Không thể tải thông tin giáo viên", "warning");
            }
          }
        }

        if (isMounted) {
          showToast("Tải dữ liệu thành công!", "success");
        }
      } catch (err) {
        console.error("❌ Load user error:", err);

        if (err.message === "Token hết hạn") return;

        if (err.code === "ERR_NETWORK") {
          setError("Không thể kết nối tới server.");
        } else if (err.response?.status === 404) {
          setError("Không tìm thấy thông tin người dùng.");
        } else {
          setError(
            `Không thể tải dữ liệu: ${
              err.response?.data?.message || err.message
            }`
          );
        }

        showToast("Không thể tải dữ liệu người dùng", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [token, navigate]);

  // ---------- AVATAR HANDLERS ----------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("File quá lớn! Vui lòng chọn ảnh dưới 5MB.", "warning");
        return;
      }
      setSelectedFile(file);
      if (previewImage) URL.revokeObjectURL(previewImage);
      setPreviewImage(URL.createObjectURL(file));
      showToast("Đã chọn ảnh mới", "success");
    }
  };

  const handleRemoveAvatar = () => {
    if (previewImage) URL.revokeObjectURL(previewImage);
    setSelectedFile(null);
    setPreviewImage(null);
    showToast("Đã xóa ảnh đã chọn", "info");
  };

  const handleUpdateAvatar = async () => {
    if (!selectedFile) {
      showToast("Vui lòng chọn ảnh!", "warning");
      return;
    }

    try {
      showToast("Đang upload avatar...", "info");
      const response = await updateAvatar(selectedFile, token);

      if (response && response.avatarUrl) {
        setAvatarUrl(response.avatarUrl);
        setSelectedFile(null);
        if (previewImage) URL.revokeObjectURL(previewImage);
        setPreviewImage(null);
        setShowAvatarModal(false);
        showToast("Cập nhật avatar thành công!", "success");
      } else {
        showToast("API không trả về avatarUrl", "warning");
      }
    } catch (err) {
      console.error("❌ Update avatar error:", err);
    }
    window.dispatchEvent(new Event("avatarUpdated"));
  };

  // ---------- SAVE PROFILE ----------
  const handleSaveProfile = async () => {
    try {
      showToast("Đang lưu thông tin...", "info");
      await updateUser(
        {
          fullName: user.fullName,
          phone: user.phone,
          bio: user.bio,
          dob: user.dob,
          gender: user.gender,
          address: user.address,
        },
        token
      );
      showToast("Cập nhật thành công!", "success");
    } catch (err) {
      console.error("❌ Update profile error:", err);
    }
  };

  // ---------- TEACHER CERT HANDLERS ----------
  const handleAddCertUrl = () => {
    if (!newCertUrl.trim()) {
      showToast("Vui lòng nhập URL chứng chỉ!", "warning");
      return;
    }

    try {
      new URL(newCertUrl);
    } catch (e) {
      showToast("URL không hợp lệ!", "warning");
      return;
    }

    setTeacherInfo((prev) => ({
      ...prev,
      certUrls: [...prev.certUrls, newCertUrl.trim()],
    }));
    setNewCertUrl("");
    showToast("Đã thêm chứng chỉ", "success");
  };

  const handleRemoveCertUrl = (index) => {
    setTeacherInfo((prev) => ({
      ...prev,
      certUrls: prev.certUrls.filter((_, i) => i !== index),
    }));
    showToast("Đã xóa chứng chỉ", "info");
  };

  const handleSaveTeacherInfo = async () => {
    try {
      console.log("🔄 Saving teacher info...", teacherInfo);

      if (!teacherInfo.description && teacherInfo.certUrls.length === 0) {
        showToast("Vui lòng nhập mô tả hoặc thêm chứng chỉ!", "warning");
        return;
      }

      showToast("Đang lưu thông tin giáo viên...", "info");

      const result = await updateTeacherInfo(teacherInfo);
      console.log("✅ Save result:", result);
      showToast("✅ Cập nhật thông tin giáo viên thành công!", "success");

      // Reload lại để chắc chắn
      if (teacherId) {
        setTimeout(async () => {
          try {
            console.log("🔄 Reloading teacher info...");
            const updated = await getTeacherInfo(teacherId);
            const description =
              updated.description || updated.Description || "";
            const certs =
              updated.certs || updated.Certs || updated.certUrls || [];

            setTeacherInfo({
              description,
              certUrls: Array.isArray(certs) ? certs : [],
            });

            showToast("Đã làm mới dữ liệu!", "info");
          } catch (err) {
            console.error("⚠️ Reload failed:", err);
            showToast("Đã lưu nhưng không thể tải lại dữ liệu", "warning");
          }
        }, 800);
      }
    } catch (err) {
      console.error("❌ Save error:", err);

      if (String(err.message).includes("401")) {
        showToast("⚠️ Phiên hết hạn. Vui lòng đăng nhập lại!", "error");
        setTimeout(() => {
          localStorage.clear();
          navigate("/login");
        }, 2000);
      } else if (String(err.message).includes("403")) {
        showToast("❌ Bạn không có quyền thực hiện thao tác này!", "error");
      } else if (String(err.message).includes("404")) {
        showToast("❌ Không tìm thấy thông tin giáo viên!", "error");
      } else {
        showToast(
          err.message || "❌ Không thể cập nhật thông tin giáo viên",
          "error"
        );
      }
    }
  };

  // ---------- PASSWORD CHANGE ----------
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Vui lòng điền đầy đủ!", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp!", "warning");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "warning");
      return;
    }

    try {
      showToast("Đang đổi mật khẩu...", "info");
      await changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
        token
      );
      showToast("Đổi mật khẩu thành công!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("❌ Change password error:", err);
    }
  };

  // ---------- LOADING / ERROR ----------
  if (loading) {
    return (
      <div className="profile-page">
        <Container>
          <div className="loading-container">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Đang tải dữ liệu...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Container>
          <div className="error-container">
            <Alert variant="danger">
              <Alert.Heading>Có lỗi xảy ra</Alert.Heading>
              <p>{error}</p>
              <hr />
              <div className="d-flex justify-content-center gap-2">
                <Button
                  variant="outline-danger"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate(-1)}
                >
                  Về trang chủ
                </Button>
              </div>
            </Alert>
          </div>
        </Container>
      </div>
    );
  }

  // ---------- UI ----------
  return (
    <div className="profile-page">
      {toast.show && (
        <div className="toast-notification">
          <div className={`toast ${toast.type}`}>
            <div className="toast-header">
              <strong className="me-auto">
                {toast.type === "success"
                  ? "✅ Thành công"
                  : toast.type === "error"
                  ? "❌ Lỗi"
                  : toast.type === "warning"
                  ? "⚠️ Cảnh báo"
                  : "ℹ️ Thông báo"}
              </strong>
              <button
                className="btn-close"
                onClick={() =>
                  setToast({ show: false, message: "", type: "" })
                }
              >
                ×
              </button>
            </div>
            <div className="toast-body">{toast.message}</div>
          </div>
        </div>
      )}

      <Container className="profile-container py-4">
        <div className="mb-3">
          <Link to={backPath} className="back-link">
            <FaArrowLeft className="me-2" /> Quay lại
          </Link>
        </div>

        <Row>
          <Col md={4}>
            <Card className="profile-card mb-4">
              <Card.Body className="text-center">
                <div className="avatar-section mb-3">
                  <div
                    className="avatar-wrapper"
                    onClick={() => setShowAvatarModal(true)}
                  >
                    <img
                      src={previewImage || avatarUrl}
                      alt="Avatar"
                      className="profile-avatar"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                    <div className="avatar-overlay">
                      <FaCamera />
                    </div>
                  </div>
                </div>

                <h4 className="profile-name">{user.fullName}</h4>
                <p className="profile-email text-muted">{user.email}</p>

                {isTeacher && (
                  <Badge bg="success" className="mt-2">
                    <FaChalkboardTeacher className="me-1" /> Giáo viên
                  </Badge>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={8}>
            <Card className="settings-card mb-4">
              <Card.Body>
                <h4 className="mb-4 d-flex align-items-center">
                  <FaCog className="me-2" /> Cài đặt tài khoản
                </h4>

                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Họ và tên</strong>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={user.fullName}
                      onChange={(e) =>
                        setUser({ ...user, fullName: e.target.value })
                      }
                      placeholder="Nhập họ và tên"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Email</strong>
                    </Form.Label>
                    <Form.Control type="text" value={user.email} disabled />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Giới tính</strong>
                    </Form.Label>
                    <Form.Select
                      value={user.gender}
                      onChange={(e) =>
                        setUser({ ...user, gender: e.target.value })
                      }
                    >
                      <option value="">-- Chọn giới tính --</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Ngày sinh</strong>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={user.dob}
                      onChange={(e) =>
                        setUser({ ...user, dob: e.target.value })
                      }
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Số điện thoại</strong>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={user.phone}
                      onChange={(e) =>
                        setUser({ ...user, phone: e.target.value })
                      }
                      placeholder="Nhập số điện thoại"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Địa chỉ</strong>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={user.address}
                      onChange={(e) =>
                        setUser({ ...user, address: e.target.value })
                      }
                      placeholder="Nhập địa chỉ"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Giới thiệu</strong>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={user.bio}
                      onChange={(e) =>
                        setUser({ ...user, bio: e.target.value })
                      }
                      placeholder="Viết vài dòng về bản thân..."
                    />
                  </Form.Group>

                  <Button variant="dark" onClick={handleSaveProfile}>
                    Lưu thay đổi
                  </Button>
                </Form>

                <hr className="my-4" />

                <h5 className="mb-3 d-flex align-items-center">
                  <FaLock className="me-2" /> Đổi mật khẩu
                </h5>
                <Form onSubmit={handlePasswordChange}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu hiện tại</Form.Label>
                    <Form.Control
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu mới</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Xác nhận mật khẩu</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Form.Group>

                  <Button variant="dark" type="submit">
                    Đổi mật khẩu
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            {isTeacher && (
              <Card className="settings-card">
                <Card.Body>
                  <h4 className="mb-4 d-flex align-items-center">
                    <FaChalkboardTeacher className="me-2" /> Thông tin giáo viên
                  </h4>

                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <strong>Mô tả</strong>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={teacherInfo.description}
                        onChange={(e) =>
                          setTeacherInfo({
                            ...teacherInfo,
                            description: e.target.value,
                          })
                        }
                        placeholder="Kinh nghiệm, chuyên môn..."
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="d-flex align-items-center">
                        <FaCertificate className="me-2" />
                        <strong>Chứng chỉ</strong>
                      </Form.Label>

                      {/* Upload file */}
                      <div className="mb-3">
                        <div className="d-flex gap-2 align-items-center">
                          <Button
                            variant="success"
                            as="label"
                            htmlFor="cert-file-upload"
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <FaSpinner className="spinner-icon me-2" />
                                Đang upload... {uploadProgress}%
                              </>
                            ) : (
                              <>
                                <FaFileUpload className="me-2" />
                                Upload File
                              </>
                            )}
                          </Button>
                          <input
                            id="cert-file-upload"
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleUploadCertificateFile}
                            style={{ display: "none" }}
                            disabled={isUploading}
                          />
                          <small className="text-muted">
                            (JPG, PNG, PDF - Max 10MB)
                          </small>
                        </div>

                        {isUploading && (
                          <div className="mt-2">
                            <div className="progress" style={{ height: "8px" }}>
                              <div
                                className="progress-bar progress-bar-striped progress-bar-animated"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Manual URL */}
                      <div className="border-top pt-3 mb-3">
                        <Form.Label className="text-muted small">
                          Hoặc nhập URL:
                        </Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="url"
                            value={newCertUrl}
                            onChange={(e) => setNewCertUrl(e.target.value)}
                            placeholder="https://example.com/cert.pdf"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddCertUrl();
                              }
                            }}
                            disabled={isUploading}
                          />
                          <Button
                            variant="outline-success"
                            onClick={handleAddCertUrl}
                            disabled={isUploading}
                          >
                            <FaPlus className="me-1" /> Thêm
                          </Button>
                        </div>
                      </div>

                      {/* Certificate List */}
                      {teacherInfo.certUrls.length > 0 && (
                        <div className="cert-list">
                          <div className="mb-2">
                            <strong className="text-muted small">
                              Danh sách ({teacherInfo.certUrls.length})
                            </strong>
                          </div>
                          {teacherInfo.certUrls.map((url, index) => {
                            const isPdf = url
                              .toLowerCase()
                              .endsWith(".pdf");
                            const isImage =
                              /\.(jpg|jpeg|png|webp)$/i.test(url);

                            return (
                              <div
                                key={index}
                                className="cert-item d-flex align-items-center justify-content-between p-3 mb-2 border rounded bg-light"
                              >
                                <div className="d-flex align-items-center flex-grow-1 me-2">
                                  <FaCertificate
                                    className="me-2"
                                    style={{
                                      color: isPdf ? "#dc3545" : "#0d6efd",
                                      fontSize: "20px",
                                    }}
                                  />
                                  <div className="flex-grow-1">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-decoration-none d-block"
                                      style={{ wordBreak: "break-all" }}
                                    >
                                      {url.length > 60
                                        ? `${url.substring(0, 60)}...`
                                        : url}
                                    </a>
                                    <small className="text-muted">
                                      {isPdf
                                        ? "PDF"
                                        : isImage
                                        ? "Image"
                                        : "File"}
                                    </small>
                                  </div>
                                </div>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveCertUrl(index)}
                                  disabled={isUploading}
                                  title="Xóa"
                                >
                                  <FaTimes />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {teacherInfo.certUrls.length === 0 && (
                        <div className="text-center py-4 border rounded bg-light">
                          <FaCertificate
                            className="text-muted mb-2"
                            style={{ fontSize: "48px" }}
                          />
                          <p className="text-muted mb-0">Chưa có chứng chỉ</p>
                          <small className="text-muted">
                            Upload file hoặc thêm URL
                          </small>
                        </div>
                      )}
                    </Form.Group>

                    <Button
                      variant="dark"
                      className="w-100"
                      onClick={handleSaveTeacherInfo}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <FaSpinner className="spinner-icon me-2" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <FaChalkboardTeacher className="me-2" />
                          Lưu thông tin giáo viên
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Avatar Modal */}
      <Modal
        show={showAvatarModal}
        onHide={() => setShowAvatarModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thay đổi ảnh đại diện</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="current-avatar mb-4">
            <img
              src={previewImage || avatarUrl}
              alt="Avatar"
              className="modal-avatar"
              crossOrigin="anonymous"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
          </div>

          <p className="text-muted mb-4">
            Chọn ảnh mới để cập nhật. Ảnh sẽ được tự động cắt và lưu.
          </p>

          <div className="avatar-options">
            <div className="option-item">
              <label htmlFor="avatar-upload" className="upload-option">
                <FaUpload className="option-icon" />{" "}
                <span>Chọn ảnh từ thiết bị</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>

            {(selectedFile || previewImage) && (
              <div className="option-item">
                <button
                  className="remove-option"
                  onClick={handleRemoveAvatar}
                >
                  <FaTrash className="option-icon" />{" "}
                  <span>Xóa ảnh đã chọn</span>
                </button>
              </div>
            )}
          </div>

          <div className="upload-info mt-4">
            <small className="text-muted">
              • Định dạng: JPG, PNG, GIF
              <br />
              • Kích thước tối đa: 5MB
              <br />
              • Khuyến nghị: Ảnh vuông 200x200px
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAvatarModal(false);
              handleRemoveAvatar();
            }}
          >
            Hủy
          </Button>
          <Button
            variant="dark"
            onClick={handleUpdateAvatar}
            disabled={!selectedFile}
          >
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Profile;
