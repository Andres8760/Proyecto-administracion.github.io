-- =============================================================
-- Futciclar - Datos de prueba para desarrollo local
-- Ejecutar DESPUÉS de schema.sql. Se puede correr varias veces:
-- no duplica nada.
--
-- Cuentas de prueba (solo para desarrollo, nunca en producción):
--   administrador: admin@futciclar.test       / Admin12345
--   funcionario:   funcionario@futciclar.test / Funcionario123
-- =============================================================

INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
  ('Administrador de prueba', 'admin@futciclar.test',
   '$2b$10$Pt0sHTxRkJKecYfFjqfLXevBIauC4QqjC6BfBqXyeOMQLU5WXAz32', 'administrador'),
  ('Funcionario de prueba', 'funcionario@futciclar.test',
   '$2b$10$vpNKwxAloYD81xWXKNp8UeEKXSxsp.JlCpioz/gvf/TBsyKXhA1Ly', 'funcionario')
ON CONFLICT (email) DO NOTHING;

INSERT INTO estadios (nombre, ciudad)
SELECT v.nombre, v.ciudad
  FROM (VALUES
    ('Estadio Pascual Guerrero', 'Cali'),
    ('Estadio Atanasio Girardot', 'Medellin'),
    ('Estadio El Campin', 'Bogota'),
    ('Estadio Metropolitano', 'Barranquilla')
  ) AS v(nombre, ciudad)
 WHERE NOT EXISTS (SELECT 1 FROM estadios e WHERE e.nombre = v.nombre);

-- Partidos de ejemplo: uno pasado, uno hoy y dos próximos
INSERT INTO partidos (estadio_id, equipo_local_id, equipo_visitante_id, fecha)
SELECT es.id, el.id, ev.id, v.fecha
  FROM (VALUES
    ('Estadio Pascual Guerrero',  'Deportivo Cali',         'Atletico Nacional', NOW() - INTERVAL '7 days'),
    ('Estadio Pascual Guerrero',  'America de Cali',        'Millonarios',       NOW()),
    ('Estadio El Campin',         'Independiente Santa Fe', 'Junior',            NOW() + INTERVAL '3 days'),
    ('Estadio Atanasio Girardot', 'Atletico Nacional',      'America de Cali',   NOW() + INTERVAL '7 days')
  ) AS v(estadio, local, visitante, fecha)
  JOIN estadios es ON es.nombre = v.estadio
  JOIN equipos el ON el.nombre = v.local
  JOIN equipos ev ON ev.nombre = v.visitante
 WHERE NOT EXISTS (
   SELECT 1 FROM partidos p
    WHERE p.equipo_local_id = el.id AND p.equipo_visitante_id = ev.id
 );
