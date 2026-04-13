// middleware/uploadAPI.js
import api from "../axiosInstance";

const UPLOAD_URL = "/upload/asset";

/**
 * ✅ Upload file lên server (Cloudflare R2)
 * @param {File} file - File cần upload (image, video, document)
 * @param {string} type - Loại file: "video", "image", "document", "avatar", "certificate"
 * @param {Function} onProgress - Callback để theo dõi progress (optional)
 * @returns {Promise<{url: string, fileName: string, fileSize: number}>}
 */
export const uploadAsset = async (file, type, onProgress = null) => {
  // ✅ Validate input
  if (!file) {
    throw new Error("File không được để trống");
  }

  if (!type) {
    throw new Error("Type không được để trống");
  }

  // ✅ Validate file size based on type
  const maxSizes = {
    video: 500 * 1024 * 1024,      // 500MB
    certificate: 10 * 1024 * 1024,  // 10MB
    image: 10 * 1024 * 1024,        // 10MB
    audio: 50 * 1024 * 1024,        // 50MB
    avatar: 5 * 1024 * 1024         // 5MB
  };

  const maxSize = maxSizes[type] || 10 * 1024 * 1024;
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
    throw new Error(`File quá lớn! Kích thước tối đa: ${maxSizeMB}MB`);
  }

  // ✅ Validate file type
  const allowedTypes = {
    certificate: ['.jpg', '.jpeg', '.png', '.pdf'],
    image: ['.jpg', '.jpeg', '.png', '.webp'],
    video: ['.mp4', '.mov', '.avi', '.mkv'],
    audio: ['.mp3', '.wav', '.m4a'],
    avatar: ['.jpg', '.jpeg', '.png']
  };

  const fileExt = '.' + file.name.split('.').pop().toLowerCase();
  const allowed = allowedTypes[type] || [];
  
  if (allowed.length > 0 && !allowed.includes(fileExt)) {
    throw new Error(`Định dạng file không hợp lệ! Cho phép: ${allowed.join(', ')}`);
  }

  const formData = new FormData();
  formData.append("File", file);
  formData.append("Type", type);

  console.log("📤 Starting upload:", {
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    fileType: file.type,
    uploadType: type,
  });

  try {
    // Sử dụng instance 'api' có interceptor xử lý token và refresh
    const res = await api.post(UPLOAD_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 10 * 60 * 1000, // 10 minutes for large files
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`📊 Upload progress: ${percentCompleted}%`);
        
        // Call progress callback if provided
        if (onProgress && typeof onProgress === 'function') {
          onProgress(percentCompleted);
        }
      },
    });

    console.log("✅ Upload response:", res.data);

    // ✅ Validate response
    if (!res.data) {
      throw new Error("Backend không trả về dữ liệu");
    }

    // ✅ Backend có thể trả về nhiều format khác nhau
    const result = {
      url: res.data.url || res.data.Url || res.data.URL || res.data.fileUrl,
      fileName: res.data.fileName || res.data.FileName || file.name,
      fileSize: res.data.fileSize || res.data.FileSize || file.size,
      message: res.data.message || "Upload thành công"
    };

    if (!result.url) {
      console.error("❌ Backend response thiếu URL:", res.data);
      throw new Error("Backend không trả về URL của file");
    }

    console.log("✅ Upload thành công:", result);
    return result;

  } catch (error) {
    console.error("❌ Upload failed:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // ✅ Parse error message từ backend
    if (error.response?.data) {
      const backendError =
        error.response.data.message ||
        error.response.data.Message ||
        error.response.data.error ||
        error.response.data.Error ||
        "Lỗi không xác định từ server";
      throw new Error(backendError);
    }

    // ✅ Network errors
    if (error.code === "ECONNABORTED") {
      throw new Error("Upload timeout - File quá lớn hoặc mạng chậm");
    }

    if (error.code === "ERR_NETWORK") {
      throw new Error("Không thể kết nối tới server");
    }

    throw error;
  }
};

/**
 * ✅ Upload certificate cho teacher
 * @param {File} file - Certificate file
 * @param {Function} onProgress - Progress callback
 */
export const uploadCertificate = async (file, onProgress = null) => {
  return await uploadAsset(file, "certificate", onProgress);
};

/**
 * ✅ Delete file từ server (optional)
 * @param {string} fileUrl - URL của file cần xóa
 */
export const deleteAsset = async (fileUrl) => {
  try {
    const res = await api.delete(UPLOAD_URL, {
      data: { url: fileUrl },
    });
    console.log("✅ File deleted:", fileUrl);
    return res.data;
  } catch (error) {
    console.error("❌ Delete failed:", error);
    throw error;
  }
};