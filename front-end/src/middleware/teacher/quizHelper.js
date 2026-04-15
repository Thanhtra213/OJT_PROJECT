// middleware/teacher/quizHelpers.js
import {
  createQuizGroup,
  updateQuizGroup,
  deleteQuizGroup,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createOption,
  updateOption,
  deleteOption,
  createGroupAsset,
  createQuestionAsset,
  deleteAsset,
} from "./quizTeacherAPI";

/* =====================
 * 🔄 HELPER: Tạo group với câu hỏi và options
 * ===================== */
export const createGroupWithQuestions = async (quizId, groupData) => {
  try {
    // 1. Tạo group
    const group = await createQuizGroup(quizId, {
      instruction: groupData.instruction,
      groupType: groupData.groupType || 1,
      groupOrder: groupData.groupOrder || 1,
    });

    console.log("✅ Group created:", group);
    const groupId = group.groupId ?? group.groupID ?? group.id;
if (!groupId) {
  console.error("❌ Không lấy được groupId:", group);
  throw new Error("groupId is undefined after createGroup");
}

    // 2. Thêm assets cho group (nếu có)
    if (groupData.assets && groupData.assets.length > 0) {
      for (const asset of groupData.assets) {
        await createGroupAsset(groupId, asset);
      }
    }

    // 3. Thêm câu hỏi vào group
    if (groupData.questions && groupData.questions.length > 0) {
      for (const questionData of groupData.questions) {
        console.log("📤 FINAL options:", questionData.options);
        const question = await createQuestion(groupId, {
          content: questionData.content,
          questionType: questionData.questionType || 1,
          questionOrder: questionData.questionOrder || 1,
          scoreWeight: questionData.scoreWeight || 1.0,
          metaJson:
  (questionData.questionType === 2 || questionData.questionType === 3) &&
  questionData.options?.length > 0
    ? JSON.stringify({
        answer:
          questionData.options[0]?.content ||
          questionData.options[0]?.Content ||
          ""
      })
    : null,
        });
        // Trong quizHelpers.js, trước khi gọi createQuestion
console.log("📤 Sending question payload:", {
  content: questionData.content,
  questionType: questionData.questionType,
  metaJson: questionData.metaJson,
  options: questionData.options,
});

        console.log("✅ Question created:", question);
        const questionId =
         question.questionID || question.questionId || question.id;
       if (!questionId) {
         console.error("❌ Không lấy được questionId từ response:", question);
         throw new Error("questionId is undefined");
       }

        // 4. Thêm assets cho câu hỏi (nếu có)
        if (questionData.assets && questionData.assets.length > 0) {
          for (const asset of questionData.assets) {
            await createQuestionAsset(questionId, asset);
          }
        }

        // 5. Thêm options cho câu hỏi
const questionType = questionData.questionType || 1;
// ✅ FIX CHUẨN
if (
  (questionType === 1 || questionType === 2 || questionType === 3) &&
  Array.isArray(questionData.options) &&
  questionData.options.length > 0
){  for (const optionData of questionData.options) {

    const content =
  typeof optionData === "string"
    ? optionData
    : optionData.content || optionData.Content || "";

const isCorrect =
  typeof optionData === "object"
    ? optionData.isCorrect ?? optionData.IsCorrect ?? false
    : false;

    if (!content.trim()) continue; // tránh gửi rỗng

    await createOption(questionId, {
      content,
      isCorrect,
    });
  }
}
      }
    }

    return group;
  } catch (error) {
    console.error("❌ Error creating group with questions:", error);
    throw error;
  }
};

/* =====================
 * 🔄 HELPER: Thêm câu hỏi vào group có sẵn
 * ===================== */
export const addQuestionsToGroup = async (groupId, questions) => {
  try {
    const createdQuestions = [];
    

    for (const questionData of questions) {
      console.log("📤 FINAL options:", questionData.options);
      console.log("📤 RAW questionData trước khi gửi:", JSON.stringify(questionData, null, 2));
      // Trong quizHelpers.js, trước khi gọi createQuestion
console.log("📤 Sending question payload:", {
  content: questionData.content,
  questionType: questionData.questionType,
  metaJson: questionData.metaJson,
  options: questionData.options,
});
      // 1. Tạo câu hỏi
      const question = await createQuestion(groupId, {
        content: questionData.content,
        questionType: questionData.questionType || 1,
        questionOrder: questionData.questionOrder || 1,
        scoreWeight: questionData.scoreWeight || 1.0,
        metaJson: questionData.metaJson || null,
      });

      console.log("✅ Question created:", question);

      const questionId =
       question.questionID || question.questionId || question.id;
     if (!questionId) {
       console.error("❌ Không lấy được questionId từ response:", question);
       throw new Error("questionId is undefined");
     }

      // 2. Thêm assets cho câu hỏi (nếu có)
      if (questionData.assets && questionData.assets.length > 0) {
        for (const asset of questionData.assets) {
          await createQuestionAsset(questionId, asset);
        }
      }

      // 3. Thêm options
if (questionData.options && questionData.options.length > 0) {
  // ✅ Chỉ tạo option cho MCQ (type 1), KHÔNG tạo cho Fill-blank (2) và Essay (3)
  const questionType = questionData.questionType || 1;
if (Array.isArray(questionData.options)) {
  for (const optionData of questionData.options || []) {

    const content =
      typeof optionData === "string"
        ? optionData
        : optionData.content || "";

    const isCorrect =
      typeof optionData === "object"
        ? optionData.isCorrect || false
        : false;

    if (!content.trim()) continue; // tránh gửi rỗng

    await createOption(questionId, {
      content,
      isCorrect,
    });
  }
}
}

      createdQuestions.push(question);
    }
    
    return createdQuestions;
  } catch (error) {
    console.error("❌ Error adding questions to group:", error);
    throw error;
  }
};

/* =====================
 * 🔄 HELPER: Cập nhật câu hỏi với options
 * ===================== */
export const updateQuestionWithOptions = async (questionId, questionData, existingOptions = []) => {
  try {
    // 1. Cập nhật câu hỏi
    await updateQuestion(questionId, {
      content: questionData.content,
      questionType: questionData.questionType || 1,
      questionOrder: questionData.questionOrder || 1,
      scoreWeight: questionData.scoreWeight || 1.0,
      metaJson: questionData.metaJson || null,
    });

    // 2. Xử lý options
    const newOptions = questionData.options || [];
    
    // Xóa options cũ không còn trong danh sách mới
    for (const existingOpt of existingOptions) {
      const stillExists = newOptions.some(
        (opt) => opt.optionID === existingOpt.optionID
      );
      if (!stillExists && existingOpt.optionID) {
        await deleteOption(existingOpt.optionID);
      }
    }

    // Cập nhật hoặc tạo mới options
    for (const opt of newOptions) {
      if (opt.optionID) {
        // Cập nhật option có sẵn
        await updateOption(opt.optionID, {
          content: opt.content,
          isCorrect: opt.isCorrect,
        });
      } else {
        // Tạo option mới
        await createOption(questionId, {
          content: opt.content,
          isCorrect: opt.isCorrect,
        });
      }
    }

    console.log("✅ Question and options updated successfully");
  } catch (error) {
    console.error("❌ Error updating question with options:", error);
    throw error;
  }
};

/* =====================
 * 🔄 HELPER: Xóa group và tất cả dữ liệu liên quan
 * ===================== */
export const deleteGroupCompletely = async (groupId, groupData) => {
  try {
    // Backend thường tự động xóa cascade, nhưng để chắc chắn:
    
    // 1. Xóa tất cả assets của group
    if (groupData.assets && groupData.assets.length > 0) {
      for (const asset of groupData.assets) {
        if (asset.assetID) {
          try {
            await deleteAsset(asset.assetID);
          } catch (err) {
            console.warn("⚠️ Could not delete asset:", asset.assetID);
          }
        }
      }
    }

    // 2. Xóa tất cả câu hỏi và assets của câu hỏi
    if (groupData.questions && groupData.questions.length > 0) {
      for (const question of groupData.questions) {
        if (question.questionID) {
          // Xóa assets của câu hỏi
          if (question.assets && question.assets.length > 0) {
            for (const asset of question.assets) {
              if (asset.assetID) {
                try {
                  await deleteAsset(asset.assetID);
                } catch (err) {
                  console.warn("⚠️ Could not delete question asset:", asset.assetID);
                }
              }
            }
          }

          // Xóa câu hỏi (sẽ tự động xóa options)
          try {
            await deleteQuestion(question.questionID);
          } catch (err) {
            console.warn("⚠️ Could not delete question:", question.questionID);
          }
        }
      }
    }

    // 3. Xóa group
    await deleteQuizGroup(groupId);
    console.log("✅ Group deleted completely");
  } catch (error) {
    console.error("❌ Error deleting group:", error);
    throw error;
  }
};

/* =====================
 * 🔄 HELPER: Xóa câu hỏi hoàn toàn
 * ===================== */
export const deleteQuestionCompletely = async (questionId, questionData) => {
  try {
    // 1. Xóa assets của câu hỏi
    if (questionData.assets && questionData.assets.length > 0) {
      for (const asset of questionData.assets) {
        if (asset.assetID) {
          try {
            await deleteAsset(asset.assetID);
          } catch (err) {
            console.warn("⚠️ Could not delete asset:", asset.assetID);
          }
        }
      }
    }

    // 2. Xóa câu hỏi (backend tự động xóa options)
    await deleteQuestion(questionId);
    console.log("✅ Question deleted completely");
  } catch (error) {
    console.error("❌ Error deleting question:", error);
    throw error;
  }
};