export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password = '') => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Min 8 characters';
  if (!/[A-Z]/.test(password)) return 'Need 1 uppercase letter';
  if (!/[0-9]/.test(password)) return 'Need 1 number';
  return null;
};

export const validatePhone = (phone = '') => /^\d{10}$/.test(phone);

export const validateAge = (age) => {
  const ageNum = Number(age);
  return ageNum >= 1 && ageNum <= 120;
};

export const validatePasswordMatch = (password, confirmPassword) =>
  password === confirmPassword;

export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  if (!email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email';
  }
  if (!password) errors.password = 'Password is required';
  return errors;
};

export const validateSignupForm = ({
  name,
  email,
  phone,
  password,
  confirmPassword,
}) => {
  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email';
  }
  if (!phone || !/^\d{10}$/.test(phone)) {
    errors.phone = 'Phone must be 10 digits';
  }
  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Min 8 characters';
  else if (!/[A-Z]/.test(password)) errors.password = 'Need 1 uppercase letter';
  else if (!/[0-9]/.test(password)) errors.password = 'Need 1 number';
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  return errors;
};
