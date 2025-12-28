export class ValidationError extends Error {
  public field: string;
  public code?: string;

  constructor(fieldOrMessage: string, messageOrCode?: string) {
    // Support both old style (field, message) and new style (message, code)
    let message: string;
    let field: string;
    let code: string | undefined;

    if (messageOrCode?.includes('_') || messageOrCode?.toUpperCase() === messageOrCode) {
      // New style: (message, code)
      message = fieldOrMessage;
      field = 'validation';
      code = messageOrCode;
    } else {
      // Old style: (field, message)
      field = fieldOrMessage;
      message = messageOrCode || '';
    }

    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

export const validateSkillLevel = (level: number): { valid: boolean; message?: string } => {
  if (!Number.isInteger(level) || level < 1 || level > 10) {
    return { valid: false, message: 'Skill level must be an integer between 1 and 10' };
  }
  return { valid: true };
};

export const validateName = (name: string): { valid: boolean; message?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Name is required' };
  }
  if (name.length > 100) {
    return { valid: false, message: 'Name must be less than 100 characters' };
  }
  return { valid: true };
};

export const validatePhone = (phone?: string): { valid: boolean; message?: string } => {
  if (!phone) {
    return { valid: true }; // Phone is optional
  }
  if (phone.length > 20) {
    return { valid: false, message: 'Phone must be less than 20 characters' };
  }
  return { valid: true };
};
