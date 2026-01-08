
export const isValidEmail = (email: string): boolean => {
  // Basic regex for email validation: must contain @ and a dot after @
  const emailRegex = /^[\w!#$%&'*+/=?`{|}~^-]+(?:\.[\w!#$%&'*+/=?`{|}~^-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};
