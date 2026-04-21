export const fixedPatient = { lat: 12.9716, lng: 77.5946 };

export const scoreClass = (score = 0) => {
  if (score > 0.7) return "bg-green-100 text-green-700";
  if (score >= 0.5) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

export const starText = (rating = 0) => "★".repeat(Math.round(rating)).padEnd(5, "☆");

export const fallbackPriority = (symptoms = "") => {
  const s = symptoms.toLowerCase();
  if (s.includes("chest pain") || s.includes("unconscious")) return "emergency";
  if (s.includes("high fever child")) return "urgent";
  return "normal";
};

