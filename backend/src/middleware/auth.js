import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Falta el token' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, rol, iat, exp }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o vencido' });
  }
}

export const requireRol = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.rol)) {
    return res.status(403).json({ error: 'No tienes permiso para esto' });
  }
  next();
};