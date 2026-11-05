-- =============================================================
-- Futciclar - Esquema de base de datos (PostgreSQL 13 o superior)
-- Basado en la seccion 3.4 (requisitos de datos) y 3.5 (reglas
-- de negocio) de la ERS, y en las columnas que ya usa el backend.
-- Ejecutar con:  psql "$DATABASE_URL" -f schema.sql
-- =============================================================

-- -------------------------------------------------------------
-- Datos maestros (los gestiona el administrador: RF-10, RF-11)
-- -------------------------------------------------------------

CREATE TABLE equipos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(80)  NOT NULL UNIQUE,
  ciudad      VARCHAR(60)  NOT NULL,
  escudo_url  TEXT
);

CREATE TABLE estadios (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(100) NOT NULL,
  ciudad  VARCHAR(60)  NOT NULL
);

CREATE TABLE partidos (
  id                   SERIAL PRIMARY KEY,
  estadio_id           INT NOT NULL REFERENCES estadios(id) ON DELETE RESTRICT,
  equipo_local_id      INT NOT NULL REFERENCES equipos(id)  ON DELETE RESTRICT,
  equipo_visitante_id  INT NOT NULL REFERENCES equipos(id)  ON DELETE RESTRICT,
  fecha                TIMESTAMPTZ NOT NULL,
  CONSTRAINT partido_equipos_distintos CHECK (equipo_local_id <> equipo_visitante_id)
);

CREATE TABLE tipos_residuo (
  id                 SERIAL PRIMARY KEY,
  nombre             VARCHAR(60) NOT NULL UNIQUE,
  puntos_por_unidad  INT NOT NULL CHECK (puntos_por_unidad > 0)
);

-- -------------------------------------------------------------
-- Usuarios (RF-01, RF-02, RF-04)
-- Un solo tipo de usuario con rol: hincha, funcionario o administrador.
-- -------------------------------------------------------------

CREATE TABLE usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  email          VARCHAR(120) NOT NULL UNIQUE,              -- RF-01: el correo no se repite
  password_hash  TEXT NOT NULL,                             -- RNF-02: solo el hash (bcrypt)
  rol            VARCHAR(15)  NOT NULL DEFAULT 'hincha'
                 CHECK (rol IN ('hincha', 'funcionario', 'administrador')),
  equipo_id      INT REFERENCES equipos(id) ON DELETE RESTRICT,
  qr_token       UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- RNF-02: unico y no deducible
  acepta_datos   BOOLEAN NOT NULL DEFAULT FALSE,            -- RNF-08: autorizacion Ley 1581
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hincha_con_equipo CHECK (rol <> 'hincha' OR equipo_id IS NOT NULL)
);

-- -------------------------------------------------------------
-- Verificaciones (RF-05, RF-06, RF-07)
-- -------------------------------------------------------------

CREATE TABLE verificaciones (
  id               SERIAL PRIMARY KEY,
  codigo_escaneo   UUID NOT NULL UNIQUE,                    -- RN-05: un escaneo se confirma una sola vez
  usuario_id       INT NOT NULL REFERENCES usuarios(id)      ON DELETE RESTRICT, -- el hincha
  equipo_id        INT NOT NULL REFERENCES equipos(id)       ON DELETE RESTRICT, -- RN-03: equipo al confirmar
  funcionario_id   INT NOT NULL REFERENCES usuarios(id)      ON DELETE RESTRICT,
  partido_id       INT NOT NULL REFERENCES partidos(id)      ON DELETE RESTRICT,
  tipo_residuo_id  INT NOT NULL REFERENCES tipos_residuo(id) ON DELETE RESTRICT,
  cantidad         INT NOT NULL CHECK (cantidad > 0),       -- RN-01 / CA-05
  puntos           INT NOT NULL CHECK (puntos >= 0),        -- RN-02 / RN-06: se guarda el valor calculado
  fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verificaciones_usuario ON verificaciones(usuario_id);
CREATE INDEX idx_verificaciones_equipo  ON verificaciones(equipo_id);
CREATE INDEX idx_verificaciones_partido ON verificaciones(partido_id);

-- RN-06 / RNF-05: una verificacion confirmada no se borra ni se modifica
CREATE FUNCTION bloquear_cambios_verificacion() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Una verificacion confirmada no se puede modificar ni borrar (RN-06)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verificacion_permanente
  BEFORE UPDATE OR DELETE ON verificaciones
  FOR EACH ROW EXECUTE FUNCTION bloquear_cambios_verificacion();

-- -------------------------------------------------------------
-- Misiones (RF-13) - PROPUESTA, pendiente de validar con el grupo
-- (observacion 1 de la ERS)
-- -------------------------------------------------------------

CREATE TABLE misiones (
  id               SERIAL PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL,
  descripcion      TEXT,
  tipo_residuo_id  INT REFERENCES tipos_residuo(id) ON DELETE RESTRICT,
  partido_id       INT REFERENCES partidos(id)      ON DELETE RESTRICT,
  cantidad_minima  INT NOT NULL DEFAULT 1 CHECK (cantidad_minima > 0),
  puntos_extra     INT NOT NULL CHECK (puntos_extra > 0),
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL,
  CONSTRAINT mision_fechas CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE misiones_cumplidas (
  id               SERIAL PRIMARY KEY,
  mision_id        INT NOT NULL REFERENCES misiones(id)       ON DELETE RESTRICT,
  usuario_id       INT NOT NULL REFERENCES usuarios(id)       ON DELETE RESTRICT,
  equipo_id        INT NOT NULL REFERENCES equipos(id)        ON DELETE RESTRICT,
  verificacion_id  INT NOT NULL REFERENCES verificaciones(id) ON DELETE RESTRICT,
  puntos_extra     INT NOT NULL CHECK (puntos_extra > 0),
  fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mision_una_vez_por_hincha UNIQUE (mision_id, usuario_id)
);

-- -------------------------------------------------------------
-- Rankings (RF-08, RF-09)
-- Los puntos NO se guardan en equipos ni en usuarios: se calculan
-- sumando los movimientos. Asi se cumple RN-04 (el puntaje del
-- equipo siempre es igual a la suma de sus verificaciones).
-- -------------------------------------------------------------

CREATE VIEW movimientos_puntos AS
  SELECT usuario_id, equipo_id, puntos, fecha_hora FROM verificaciones
  UNION ALL
  SELECT usuario_id, equipo_id, puntos_extra, fecha_hora FROM misiones_cumplidas;

CREATE VIEW ranking_equipos AS
  SELECT e.id, e.nombre, e.escudo_url,
         COALESCE(SUM(m.puntos), 0)::INT AS puntos,
         RANK() OVER (ORDER BY COALESCE(SUM(m.puntos), 0) DESC) AS posicion
    FROM equipos e
    LEFT JOIN movimientos_puntos m ON m.equipo_id = e.id
   GROUP BY e.id;

CREATE VIEW ranking_hinchas AS
  SELECT u.id, u.nombre, u.equipo_id,
         COALESCE(SUM(m.puntos), 0)::INT AS puntos,
         RANK() OVER (ORDER BY COALESCE(SUM(m.puntos), 0) DESC) AS posicion_general,
         RANK() OVER (PARTITION BY u.equipo_id
                      ORDER BY COALESCE(SUM(m.puntos), 0) DESC) AS posicion_en_equipo
    FROM usuarios u
    LEFT JOIN movimientos_puntos m ON m.usuario_id = u.id
   WHERE u.rol = 'hincha'
   GROUP BY u.id;

-- -------------------------------------------------------------
-- Recompensas (RF-14) - FUTURO, no se crea en esta version
-- recompensas(id, nombre, puntos_requeridos)
-- -------------------------------------------------------------

-- -------------------------------------------------------------
-- Datos iniciales de ejemplo
-- Los puntos por unidad son de ejemplo (observacion 2 de la ERS).
-- -------------------------------------------------------------

INSERT INTO equipos (nombre, ciudad) VALUES
  ('America de Cali',        'Cali'),
  ('Atletico Nacional',      'Medellin'),
  ('Deportivo Cali',         'Cali'),
  ('Independiente Santa Fe', 'Bogota'),
  ('Junior',                 'Barranquilla'),
  ('Millonarios',            'Bogota');

INSERT INTO tipos_residuo (nombre, puntos_por_unidad) VALUES
  ('Plastico', 10),
  ('Vidrio',   15),
  ('Papel',     5);
