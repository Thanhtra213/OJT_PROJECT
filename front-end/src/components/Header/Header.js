// src/components/Header/Header.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import {
  Modal,
  Button,
  Form,
  Dropdown,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  loginApi,
  registerApi,
  sendOtpApi,
  loginGoogle,
} from "../../middleware/auth";

import BookLogoModern from "../Footer/BookLogoModern";
import "./Header.scss";

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const decodeJWT = (token) => {
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
    console.error("❌ Lỗi decode JWT:", error);
    return null;
  }
};

const Header = () => {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("danger");

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginErrorMessage, setLoginErrorMessage] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerOtp, setRegisterOtp] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerErrorMessage, setRegisterErrorMessage] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser && savedUser !== "undefined" && savedUser !== "null"
      ? JSON.parse(savedUser)
      : null;
  });

  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.png");
  const [username, setUsername] = useState("");

  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

  const showToastNotification = (message, type = "danger") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const [detailRes, avatarRes] = await Promise.all([
        axios.get(`${API_BASE}/user/profile/detail`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/user/profile/avatar`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const profile = detailRes.data;
      const avatar =
        avatarRes.data?.avatarUrl ||
        avatarRes.data?.AvatarUrl ||
        avatarRes.data?.url;

      if (avatar) {
        console.log("✅ Avatar loaded:", avatar);
        setAvatarUrl(avatar);
        localStorage.setItem("avatarUrl", avatar);
      }

      const name =
        profile.fullName ||
        profile.username ||
        profile.Username ||
        profile.email?.split("@")[0] ||
        localStorage.getItem("userName") ||
        "";

      setUsername(name);
      localStorage.setItem("userName", name);
    } catch (error) {
      console.error("❌ Lỗi tải profile:", error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      const savedUser = localStorage.getItem("user");

      if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);

        const savedUserName = localStorage.getItem("userName");
        const savedAvatar = localStorage.getItem("avatarUrl");

        if (savedUserName) setUsername(savedUserName);
        if (savedAvatar) setAvatarUrl(savedAvatar);

        await fetchUserProfile();
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedAvatar = localStorage.getItem("avatarUrl");
      const savedUserName = localStorage.getItem("userName");
      if (savedAvatar) setAvatarUrl(savedAvatar);
      if (savedUserName) setUsername(savedUserName);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ FIX: Load Google Identity Services và render button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
      console.warn("⚠️ GOOGLE_CLIENT_ID chưa được cấu hình");
      return;
    }

    // Load script nếu chưa có
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, [GOOGLE_CLIENT_ID]);

  // ✅ FIX: Initialize Google Sign-In
  const initializeGoogleSignIn = () => {
    if (!window.google || !GOOGLE_CLIENT_ID) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: onGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render button nếu có ref
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "rectangular",
        });
      }
    } catch (error) {
      console.error("❌ Lỗi khởi tạo Google Sign-In:", error);
    }
  };

  // ✅ FIX: Render lại button khi modal mở
  useEffect(() => {
    if (showAuthModal && activeTab === "login" && googleButtonRef.current) {
      // Đợi modal render xong
      setTimeout(() => {
        initializeGoogleSignIn();
      }, 100);
    }
  }, [showAuthModal, activeTab]);

  // ✅ Callback khi Google trả về credential
  const onGoogleCredential = async (response) => {
  try {
    const idToken = response?.credential;
 console.log(idToken);

    if (!idToken) {
      showToastNotification("Không nhận được Google ID token.", "danger");
      return;
    }
 const res = await loginGoogle(idToken);
    // FE vẫn decode để hiển thị email user nếu thích (optional)
    const googlePayload = decodeJWT(idToken);

    // ✔ Gửi đúng token lên BE
   

    const { accountID, accessToken, expiresIn, role, redirectUrl } = res.data;

    const loggedUser = {
      accountID,
      accessToken,
      expiresIn,
      role,
      username: googlePayload?.email?.split("@")[0] ?? "google-user",
      email: googlePayload?.email
    };

    localStorage.setItem("user", JSON.stringify(loggedUser));
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("userName", loggedUser.username);

    setUser(loggedUser);
    setUsername(loggedUser.username);

    await fetchUserProfile();

    showToastNotification("🎉 Đăng nhập Google thành công!", "success");

    setTimeout(() => {
      setShowAuthModal(false);
      const targetUrl = redirectUrl || "/home";
      navigate(targetUrl);
      window.location.href = targetUrl;
    }, 800);

  } catch (err) {
    console.error("❌ Google login error:", err);
    const errorMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Đăng nhập Google thất bại!";
    showToastNotification(`❌ ${errorMsg}`, "danger");
  }
};

  const resetLoginForm = () => {
    setEmailOrUsername("");
    setPassword("");
    setLoginMessage("");
    setLoginErrorMessage("");
  };

  const resetRegisterForm = () => {
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterConfirmPassword("");
    setRegisterOtp("");
    setRegisterMessage("");
    setRegisterErrorMessage("");
    setOtpMessage("");
    setOtpError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginMessage("");
    setLoginErrorMessage("");

    try {
      const response = await loginApi(emailOrUsername, password);
      const { accountID, accessToken, expiresIn, role, redirectUrl } = response.data;

      const decodedToken = decodeJWT(accessToken);
      const usernameFromToken =
        decodedToken?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
      const roleFromToken =
        decodedToken?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      const loggedUser = {
        accountID,
        accessToken,
        expiresIn,
        role: role || roleFromToken,
        username: usernameFromToken || emailOrUsername,
        email: emailOrUsername.includes("@") ? emailOrUsername : "",
      };

      localStorage.setItem("user", JSON.stringify(loggedUser));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userName", usernameFromToken || emailOrUsername);

      setUser(loggedUser);
      setUsername(usernameFromToken || emailOrUsername);

      await fetchUserProfile();

      setLoginMessage("Đăng nhập thành công!");
      showToastNotification("🎉 Đăng nhập thành công!", "success");

      setTimeout(() => {
        setShowAuthModal(false);
        resetLoginForm();
        const targetUrl = redirectUrl || "/home";
        navigate(targetUrl);
        window.location.href = targetUrl;
      }, 1000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Đăng nhập thất bại!";
      setLoginErrorMessage(errorMsg);
      showToastNotification(`❌ ${errorMsg}`, "danger");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!registerOtp) {
      const msg = "Vui lòng nhập mã OTP";
      setRegisterErrorMessage(msg);
      showToastNotification(msg, "warning");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      const msg = "Mật khẩu xác nhận không khớp!";
      setRegisterErrorMessage(msg);
      showToastNotification(msg, "warning");
      return;
    }

    setRegisterMessage("");
    setRegisterErrorMessage("");

    try {
      const response = await registerApi({
        email: registerEmail,
        username: registerName,
        password: registerPassword,
        confirmPassword: registerConfirmPassword,
        otp: registerOtp,
      });

      const { accountID, accessToken, expiresIn } = response.data;
      const decodedToken = decodeJWT(accessToken);
      const usernameFromToken =
        decodedToken?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];

      const newUser = {
        accountID,
        accessToken,
        expiresIn,
        email: registerEmail,
        username: usernameFromToken || registerName,
      };

      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userName", usernameFromToken || registerName);

      setUser(newUser);
      setUsername(usernameFromToken || registerName);

      await fetchUserProfile();

      setRegisterMessage("Đăng ký thành công!");
      showToastNotification("🎉 Đăng ký thành công!", "success");

      setTimeout(() => {
        setShowAuthModal(false);
        resetRegisterForm();
        navigate("/home");
        window.location.reload();
      }, 1000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Đăng ký thất bại!";
      setRegisterErrorMessage(errorMsg);
      showToastNotification(`❌ ${errorMsg}`, "danger");
    }
  };

  const handleSendOtp = async () => {
    if (!registerEmail) {
      const msg = "Vui lòng nhập email trước khi gửi OTP!";
      setOtpError(msg);
      showToastNotification(msg, "warning");
      return;
    }

    try {
      setOtpMessage("Đang gửi OTP...");
      setOtpError("");
      await sendOtpApi(registerEmail);
      const successMsg = "✅ OTP đã được gửi đến email của bạn!";
      setOtpMessage(successMsg);
      showToastNotification(successMsg, "success");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Gửi OTP thất bại!";
      setOtpError(errorMsg);
      setOtpMessage("");
      showToastNotification(`❌ ${errorMsg}`, "danger");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("avatarUrl");
    localStorage.removeItem("userName");
    setUser(null);
    setAvatarUrl("/default-avatar.png");
    setUsername("");
    showToastNotification("👋 Đã đăng xuất thành công!", "success");
    setTimeout(() => {
      navigate("/");
      window.location.reload();
    }, 800);
  };

  return (
    <>
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={4000} autohide bg={toastType}>
          <Toast.Header>
            <strong className="me-auto">
              {toastType === "success" ? "Thành công" : toastType === "danger" ? "Lỗi" : toastType === "warning" ? "Cảnh báo" : "Thông báo"}
            </strong>
          </Toast.Header>
          <Toast.Body className={toastType === "danger" || toastType === "success" ? "text-white" : ""}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Navbar expand="lg" className="main-header">
        <Container>
          <Navbar.Brand href="/" className="logo">
            <span className="logo-icon"><BookLogoModern size={45} style={{verticalAlign: 'middle'}} /></span> <span>EnglishMaster</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <div className="search-bar ms-auto">
              <input type="text" placeholder="Tìm kiếm giảng viên, khóa ..." />
            </div>

            <Nav className="header-actions">
              {!user ? (
                <div className="auth-buttons">
                  <Button
                    className="login-btn"
                    onClick={() => {
                      setShowAuthModal(true);
                      setActiveTab("login");
                      resetLoginForm();
                    }}
                  >
                    Đăng nhập
                  </Button>

                  <Button
                    className="register-btn"
                    onClick={() => {
                      setShowAuthModal(true);
                      setActiveTab("register");
                      resetRegisterForm();
                    }}
                  >
                    Đăng ký
                  </Button>
                </div>
              ) : (
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" id="dropdown-user" className="user-dropdown-toggle d-flex align-items-center">
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="user-avatar"
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <span className="user-name ms-2">{username || user.username || "Người dùng"}</span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => navigate("/profile")}>Hồ sơ cá nhân</Dropdown.Item>
                    <Dropdown.Item onClick={() => navigate("/profile")}>Cài đặt</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item className="text-danger" onClick={handleLogout}>Đăng xuất</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Modal
        show={showAuthModal}
        onHide={() => {
          setShowAuthModal(false);
          resetLoginForm();
          resetRegisterForm();
        }}
        centered
        className="auth-modal"
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>English Master Hub</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-center mb-3 small">
            Đăng nhập hoặc tạo tài khoản để bắt đầu hành trình học tiếng Anh
          </p>

          <div className="auth-tabs-nav mb-3">
            <button
              className={`tab-nav-btn ${activeTab === "login" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                resetRegisterForm();
              }}
            >
              Đăng nhập
            </button>
            <button
              className={`tab-nav-btn ${activeTab === "register" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("register");
                resetLoginForm();
              }}
            >
              Đăng ký
            </button>
          </div>

          {activeTab === "login" ? (
            <Form onSubmit={handleLoginSubmit}>
              <Form.Group className="mb-2">
                <Form.Label>Email hoặc Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập email hoặc username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  size="sm"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  size="sm"
                />
              </Form.Group>

              <Button type="submit" className="w-100 mb-2" variant="dark">
                Đăng nhập
              </Button>

              {/* ✅ FIX: Google Sign-In Button */}
              <div
                ref={googleButtonRef}
                className="w-100 mb-2"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  minHeight: "40px"
                }}
              />

              <div className="text-center mt-2">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setShowAuthModal(false);
                    navigate("/forgotpassword");
                  }}
                >
                  Quên mật khẩu?
                </Button>
              </div>

              {loginMessage && (
                <div className="alert alert-success mt-2 mb-0 py-2">{loginMessage}</div>
              )}
              {loginErrorMessage && (
                <div className="alert alert-danger mt-2 mb-0 py-2">{loginErrorMessage}</div>
              )}
            </Form>
          ) : (
            <Form onSubmit={handleRegisterSubmit}>
              <Form.Group className="mb-2">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Nhập email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  size="sm"
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Mã Xác Nhận (OTP)</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={registerOtp}
                    onChange={(e) => setRegisterOtp(e.target.value)}
                    required
                    size="sm"
                  />
                  <Button variant="outline-dark" onClick={handleSendOtp} size="sm" style={{ whiteSpace: "nowrap" }}>
                    Gửi OTP
                  </Button>
                </div>
                {otpMessage && <div className="text-success small mt-1">{otpMessage}</div>}
                {otpError && <div className="text-danger small mt-1">{otpError}</div>}
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập username"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  size="sm"
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  size="sm"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                  size="sm"
                />
              </Form.Group>

              <Button type="submit" className="w-100" variant="dark">
                Đăng ký
              </Button>

              {registerMessage && (
                <div className="alert alert-success mt-2 mb-0 py-2">{registerMessage}</div>
              )}
              {registerErrorMessage && (
                <div className="alert alert-danger mt-2 mb-0 py-2">{registerErrorMessage}</div>
              )}
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Header;