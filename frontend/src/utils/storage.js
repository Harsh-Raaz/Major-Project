const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
const PATIENT_KEY = 'currentPatient';
const SEARCH_HISTORY_KEY = 'searchHistory';

const parseJson = (value, fallback = null) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getUser = () => parseJson(localStorage.getItem(USER_KEY));

export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

export const clearUser = () => localStorage.removeItem(USER_KEY);

export const getPatient = () => parseJson(localStorage.getItem(PATIENT_KEY));

export const setPatient = (patient) => {
  if (patient) {
    localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
  } else {
    localStorage.removeItem(PATIENT_KEY);
  }
};

export const clearPatient = () => localStorage.removeItem(PATIENT_KEY);

export const getSearchHistory = () =>
  parseJson(localStorage.getItem(SEARCH_HISTORY_KEY), []);

export const addToSearchHistory = (item) => {
  if (!item) return;

  const normalizedItem = {
    ...item,
    id: item.id || item._id,
    timestamp: item.timestamp || new Date().toISOString(),
  };
  const history = getSearchHistory().filter(
    (entry) =>
      (entry.id || entry._id) !== normalizedItem.id ||
      entry.type !== normalizedItem.type
  );

  history.unshift(normalizedItem);
  localStorage.setItem(
    SEARCH_HISTORY_KEY,
    JSON.stringify(history.slice(0, 20))
  );
};

export const clearSearchHistory = () =>
  localStorage.removeItem(SEARCH_HISTORY_KEY);

export const clearAllAuthData = () => {
  clearToken();
  clearUser();
  clearPatient();
};
