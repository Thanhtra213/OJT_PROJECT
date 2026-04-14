import axios from "axios";
import Swal from "sweetalert2";

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || "https://localhost:7131"}/api`,
});

// Thêm interceptor request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Thêm interceptor response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Refresh Token Logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL || "https://localhost:7131"}/api/auth/refresh`,
          { refreshToken }
        );

        const newToken = res.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Modal Error Handling (Global Modal cho mọi lỗi ngoài 401 được xử lý Auth)
    if (error.response?.status !== 401 && !error.config?.skipGlobalModal) {
      let title = "Đã xảy ra lỗi!";
      let text = "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";

      switch (error.response?.status) {
        case 400:
          text = error.response.data?.message || "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
          break;
        case 403:
          title = "Không có quyền truy cập";
          text = "Bạn không có quyền thực hiện thao tác này.";
          break;
        case 404:
          title = "Không tìm thấy";
          text = "Dữ liệu hoặc trang bạn yêu cầu không tồn tại.";
          break;
        case 500:
        case 502:
        case 503:
        case 504:
        case 505:
          title = "Lỗi máy chủ";
          text = "Hệ thống đang bảo trì hoặc gặp sự cố. Vui lòng quay lại sau.";
          break;
        default:
          if (!error.response) {
            title = "Lỗi kết nối máy chủ";
            text = "Không thể kết nối với máy chủ. Vui lòng kiểm tra lại đường truyền mạng.";
          } else {
            text = error.response.data?.message || error.message || text;
          }
          break;
      }

      // Ngăn chặn hiển thị trùng lặp Modal nếu có nhiều API lỗi cùng lúc bằng cách dùng queue của Swal hoặc just gọi thẳng
      Swal.fire({
        icon: "error",
        title: title,
        text: text,
        confirmButtonText: "Đóng",
        confirmButtonColor: "#10b981",
        backdrop: "rgba(0,0,0,0.5)"
      });
    }

    return Promise.reject(error);
  }
);

export default api;
