// middleware/courseAPI.js
const BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

// ============= HELPER FUNCTIONS =============
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  };
};

// Hàm mới để xử lý an toàn lỗi trả về HTML thay vì JSON
const fetchAndParseJSON = async (url, options) => {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    // Xử lý các lỗi 401, 403, 404, 500...
    throw new Error(`HTTP error! status: ${response.status} at ${url}`);
  }

  const rawText = await response.text(); // Lấy text thô trước thay vì ép sang JSON ngay
  
  try {
    return JSON.parse(rawText);
  } catch (error) {
    console.error(`❌ CẢNH BÁO: API [${url}] trả về HTML thay vì JSON!`);
    console.error("Dữ liệu thô (200 ký tự đầu):", rawText.substring(0, 200));
    throw new Error("Lỗi định dạng dữ liệu: Server trả về HTML chứ không phải JSON.");
  }
};

// ============= COURSE APIs =============
console.log("🛠 ENV REACT_APP_API_URL đang trỏ tới:", process.env.REACT_APP_API_URL);

/**
 * Get all courses with teacher info
 */
export const getCourses = async () => {
  try {
    const url = `${BASE_URL}/user/course`;
    console.log("🚀 Gọi API lấy khóa học tại:", url);
    
    // Sử dụng hàm an toàn mới tạo
    const data = await fetchAndParseJSON(url, {
      headers: getAuthHeaders(),
    });

    console.log("📚 Raw courses data:", data);

    // Process courses to include teacher info
    const coursesWithTeachers = await Promise.all(
      (data.courses || data || []).map(async (course) => {
        if (course.teacherName) return course;

        if (course.teacherID) {
          try {
            const teacherUrl = `${BASE_URL}/teacher/info/${course.teacherID}`;
            const teacherData = await fetchAndParseJSON(teacherUrl, { 
              headers: getAuthHeaders() 
            });
            
            return {
              ...course,
              teacherName: teacherData.name || teacherData.fullName || "Giảng viên",
              teacherDescription: teacherData.description || "",
              teacherCertUrls: teacherData.certUrls || [],
            };
          } catch (err) {
            console.error(`❌ Lỗi khi lấy thông tin giảng viên ${course.teacherID}:`, err.message);
          }
        }
        return course;
      })
    );

    return {
      courses: coursesWithTeachers,
      totalCount: coursesWithTeachers.length,
    };
  } catch (error) {
    console.error("❌ Error fetching courses:", error.message);
    throw error;
  }
};

/**
 * Get single course by ID with teacher info
 */
export const getCourseById = async (courseId) => {
  try {
    const url = `${BASE_URL}/user/course/${courseId}`;
    const course = await fetchAndParseJSON(url, {
      headers: getAuthHeaders(),
    });

    // Fetch teacher info if available
    if (course.teacherID && !course.teacherName) {
      try {
        const teacherUrl = `${BASE_URL}/teacher/info/${course.teacherID}`;
        const teacherData = await fetchAndParseJSON(teacherUrl, { 
          headers: getAuthHeaders() 
        });

        course.teacherName = teacherData.name || teacherData.fullName || "Giảng viên";
        course.teacherDescription = teacherData.description || "";
        course.teacherCertUrls = teacherData.certUrls || [];
      } catch (err) {
        console.error("❌ Lỗi khi lấy thông tin giảng viên:", err.message);
      }
    }

    return course;
  } catch (error) {
    console.error("❌ Error fetching course:", error.message);
    throw error;
  }
};

/**
 * Get all courses with full details
 */
export const getAllCoursesWithDetails = async () => {
  try {
    const response = await getCourses();
    const coursesList = response?.courses || [];
    
    const detailedCoursesPromises = coursesList.map(course => 
      getCourseById(course.courseID)
    );
    
    const detailedCourses = await Promise.all(detailedCoursesPromises);
    return detailedCourses;
  } catch (error) {
    console.error("Error in getAllCoursesWithDetails:", error.message);
    throw error;
  }
};

/**
 * Get course rating
 */
export const getCourseRating = async (courseId) => {
  try {
    const data = await fetchAndParseJSON(`${BASE_URL}/user/course/${courseId}/rating`, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    console.error("❌ Error fetching course rating:", error.message);
    throw error;
  }
};

/**
 * Get course feedbacks
 */
export const getCourseFeedbacks = async (courseId) => {
  try {
    const data = await fetchAndParseJSON(`${BASE_URL}/user/course/${courseId}/feedback`, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    console.error("❌ Error fetching course feedbacks:", error.message);
    throw error;
  }
};

export const submitCourseFeedback = async (feedbackData) => {
  try {
    const response = await fetch(`${BASE_URL}/user/course/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedbackData)
    });

    if (!response.ok) {
      const rawText = await response.text();
      let errorData = {};
      try { errorData = JSON.parse(rawText); } catch(e) {}
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error submitting feedback:", error.message);
    throw error;
  }
};

// ============= VIDEO APIs =============
export const getVideoById = async (videoId) => {
  try {
    const headers = getAuthHeaders();
    
    const res = await fetch(`${BASE_URL}/public/video/${videoId}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!res.ok) {
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      if (res.status === 403) throw new Error('FORBIDDEN');
      throw new Error("Failed to fetch video");
    }
    
    const rawText = await res.text();
    try {
      return JSON.parse(rawText);
    } catch(e) {
      throw new Error("Dữ liệu video trả về không phải JSON");
    }
  } catch (error) {
    console.error("Error in getVideoById:", error.message);
    throw error;
  }
};