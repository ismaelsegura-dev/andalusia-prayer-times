/**
 * Utilidad de hashing para autenticación local.
 * Usa Web Crypto API (disponible en todos los navegadores modernos y Node 16+).
 */
export const sha256 = async (message: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Hashes pre-calculados (SHA-256 de las contraseñas reales)
// Estos hashes se comparan en runtime; la contraseña en texto plano NUNCA se almacena.
export const ADMIN_PASSWORD_HASH = '6fa88707d2f757f246e2bf7f71a17bf76e6fe2599b4ba1615e66fb410469e9b9';
export const WIDGET_SECRET_HASH = '555b53d1339f8b14d495d36ad0313fad97384b86b0aaf8fd1f46374161c1203f';
