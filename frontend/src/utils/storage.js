// Token management
export const getToken = () => localStorage.getItem('authToken');
export const setToken = (token) => localStorage.setItem('authToken', token);
export const clearToken = () => localStorage.removeItem('authToken');

// User management
export const getUser = () => {
  const user = localStorage.getItem('authUser');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => localStorage.setItem('authUser', JSON.stringify(user));
export const clearUser = () => localStorage.removeItem('authUser');

// Patient management
export const getPatient = () => {
  const patient = localStorage.getItem('currentPatient');
  return patient ? JSON.parse(patient) : null;
};

export const setPatient = (patient) => {
  if (patient) localStorage.setItem('currentPatient', JSON.stringify(patient));
};

export const clearPatient = () => localStorage.removeItem('currentPatient');

// Search history
export const getSearchHistory = () => {
  const history = localStorage.getItem('searchHistory');
  return history ? JSON.parse(history) : [];
};

export const addToSearchHistory = (item) => {
  const history = getSearchHistory();
  const exists = history.some(h => h.id === item.id);
  if (!exists) {
    history.unshift(item);
    if (history.length > 20) history.pop();
  }
  localStorage.setItem('searchHistory', JSON.stringify(history));
};

export const clearSearchHistory = () => localStorage.removeItem('searchHistory');

// Clear all auth data on logout
export const clearAllAuthData = () => {
  clearToken();
  clearUser();
  clearPatient();
};
