const MOCK_DELAY_MS = 700;
const sessionMessages = new Map();

const getDepartment = (message) => {
  const text = message.toLowerCase();
  if (/(tooth|teeth|gum|dental)/.test(text)) return "Dentistry";
  if (/(skin|rash|acne|itch)/.test(text)) return "Dermatology";
  if (/(chest|heart|palpitation)/.test(text)) return "Cardiology";
  if (/(eye|vision)/.test(text)) return "Ophthalmology";
  if (/(bone|joint|back pain|fracture)/.test(text)) return "Orthopedics";
  if (/(child|baby|infant|toddler)/.test(text)) return "Pediatrics";
  return "General Medicine";
};

const getUrgency = (message) =>
  /(severe|unbearable|faint|unconscious|trouble breathing|difficulty breathing)/i.test(message)
    ? "urgent"
    : "normal";

/**
 * Temporary local implementation of POST /api/chatbot/message.
 * Keep this contract-aligned so it can be swapped for Axios when the endpoint is ready.
 */
export const sendMockChatbotMessage = ({ message, session_id: sessionId }) =>
  new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (/\b(error|fail)\b/i.test(message)) {
        reject(new Error("Unable to send your message right now."));
        return;
      }

      const conversation = [...(sessionMessages.get(sessionId) || []), message];
      sessionMessages.set(sessionId, conversation);
      const summary = conversation.join(" ");
      const hasDuration = /\b\d+\s*(day|days|week|weeks|hour|hours)|since\b|yesterday|today/i.test(summary);
      const department = getDepartment(summary);

      resolve(
        hasDuration
          ? {
              reply: `Based on the information shared, I recommend ${department}.`,
              session_id: sessionId,
              is_complete: true,
              department,
              urgency: getUrgency(summary),
              summary,
            }
          : {
              reply: "How long have you been experiencing these symptoms?",
              session_id: sessionId,
              is_complete: false,
              department: null,
              urgency: null,
            }
      );
    }, MOCK_DELAY_MS);
  });
