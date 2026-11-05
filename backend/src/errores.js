// Traduce los errores de PostgreSQL a respuestas HTTP entendibles.
export function responderError(res, e) {
  switch (e.code) {
    case '23505': // valor repetido (UNIQUE)
      return res.status(409).json({ error: 'Ya existe un registro con ese valor' });
    case '23503': // llave foránea
      return res.status(409).json({
        error: 'No se puede completar: hay registros relacionados (equipo, partido o verificación)',
      });
    case '23514': // CHECK
      return res.status(400).json({ error: 'Los datos no cumplen las reglas del sistema' });
    case '22P02': // tipo de dato inválido
      return res.status(400).json({ error: 'Formato de dato inválido' });
    default:
      console.error(e);
      return res.status(500).json({ error: 'Error del servidor' });
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function enteroPositivo(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}
