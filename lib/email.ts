export const normalizarEmail = (email: string): string =>
  email.trim().toLowerCase();

export const emailsCoinciden = (
  emailA?: string | null,
  emailB?: string | null
): boolean => {
  if (!emailA || !emailB) {
    return false;
  }

  return normalizarEmail(emailA) === normalizarEmail(emailB);
};
