export function isValidPassword(password: string): boolean {
  const minLength = 6;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasLowercase &&
    hasUppercase &&
    hasNumber &&
    hasSpecialChar
  );
}
