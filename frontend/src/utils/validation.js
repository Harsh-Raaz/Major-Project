export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const validateAge = (age) => {
  const ageNum = Number(age);
  return ageNum >= 1 && ageNum <= 120;
};

export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

export const validateLoginForm = ({ email, password }) => {
  const errors = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Invalid email format';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

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

  if (!name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Invalid email format';
  }

  if (!phone) {
    errors.phone = 'Phone is required';
  } else if (!validatePhone(phone)) {
    errors.phone = 'Phone must be 10 digits';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else {
    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.password = passwordError;
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (!validatePasswordMatch(password, confirmPassword)) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};
