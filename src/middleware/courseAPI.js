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

// ============= COURSE APIs =============

/**
 * Get all courses with teacher info
 */
export const getCourses = async () => {
  try {
    const response = await fetch(`${BASE_URL}/user/course`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📚 Raw courses data:", data);

    // Process courses to include teacher info
    const coursesWithTeachers = await Promise.all(
      (data.courses || data || []).map(async (course) => {
        // Nếu course đã có teacherName, return luôn
        if (course.teacherName) {
          return course;
        }

        // Nếu có teacherID nhưng chưa có teacherName, fetch thông tin teacher
        if (course.teacherID) {
          try {
            console.log(`Fetching teacher info for ID: ${course.teacherID}`);
            const teacherResponse = await fetch(
              `${BASE_URL}/teacher/info/${course.teacherID}`,
              { headers: getAuthHeaders() }
            );

            if (teacherResponse.ok) {
              const teacherData = await teacherResponse.json();
              console.log(`✅ Teacher data for ${course.teacherID}:`, teacherData);
              
              return {
                ...course,
                teacherName: teacherData.name || teacherData.fullName || "Giảng viên",
                teacherDescription: teacherData.description || "",
                teacherCertUrls: teacherData.certUrls || [],
              };
            }
          } catch (err) {
            console.error(`❌ Failed to fetch teacher ${course.teacherID}:`, err);
          }
        }

        return course;
      })
    );

    console.log("✅ Courses with teacher info:", coursesWithTeachers);

    return {
      courses: coursesWithTeachers,
      totalCount: coursesWithTeachers.length,
    };
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    throw error;
  }
};

/**
 * Get single course by ID with teacher info
 */
export const getCourseById = async (courseId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/course/${courseId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const course = await response.json();
    console.log("📚 Course data:", course);

    // Fetch teacher info if available
    if (course.teacherID && !course.teacherName) {
      try {
        const teacherResponse = await fetch(
          `${BASE_URL}/teacher/info/${course.teacherID}`,
          { headers: getAuthHeaders() }
        );

        if (teacherResponse.ok) {
          const teacherData = await teacherResponse.json();
          course.teacherName = teacherData.name || teacherData.fullName || "Giảng viên";
          course.teacherDescription = teacherData.description || "";
          course.teacherCertUrls = teacherData.certUrls || [];
        }
      } catch (err) {
        console.error("❌ Failed to fetch teacher info:", err);
      }
    }

    return course;
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    throw error;
  }
};

/**
 * Get all courses with full details
 */
export const getAllCoursesWithDetails = async () => {
  try {
    // 1. Lấy danh sách courses
    const response = await getCourses();
    const coursesList = response?.courses || [];
    
    // 2. Fetch chi tiết từng course song song
    const detailedCoursesPromises = coursesList.map(course => 
      getCourseById(course.courseID)
    );
    
    const detailedCourses = await Promise.all(detailedCoursesPromises);
    
    console.log("All courses with details:", detailedCourses);
    return detailedCourses;
  } catch (error) {
    console.error("Error in getAllCoursesWithDetails:", error);
    throw error;
  }
};

/**
 * Get course rating
 * GET /api/user/course/{courseId}/rating
 */
export const getCourseRating = async (courseId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/course/${courseId}/rating`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("⭐ Course rating:", data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching course rating:", error);
    throw error;
  }
};

/**
 * Get course feedbacks
 * GET /api/user/course/{courseId}/feedback
 */
export const getCourseFeedbacks = async (courseId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/course/${courseId}/feedback`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("💬 Course feedbacks:", data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching course feedbacks:", error);
    throw error;
  }
};

/**
 * Submit course feedback
 * POST /api/user/course/feedback
 * @param {Object} feedbackData - { courseID: number, rating: number, comment: string }
 */
export const submitCourseFeedback = async (feedbackData) => {
  try {
    const response = await fetch(`${BASE_URL}/user/course/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedbackData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Feedback submitted:", data);
    return data;
  } catch (error) {
    console.error("❌ Error submitting feedback:", error);
    throw error;
  }
};

// ============= VIDEO APIs =============

/**
 * Get video by ID (with authentication and membership check)
 */
export const getVideoById = async (videoId) => {
  try {
    const headers = getAuthHeaders();
    
    // Add authorization token if user is logged in
    const authToken = localStorage.getItem('accessToken');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const res = await fetch(`${BASE_URL}/public/video/${videoId}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (res.status === 403) {
        throw new Error('FORBIDDEN');
      }
      throw new Error("Failed to fetch video");
    }
    
    const data = await res.json();
    console.log("Video Detail:", data);
    
    return data;
  } catch (error) {
    console.error("Error in getVideoById:", error);
    throw error;
  }
};