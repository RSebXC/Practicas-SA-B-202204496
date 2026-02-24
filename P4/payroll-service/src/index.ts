import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import jwt from 'jsonwebtoken';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import Database from './config/database';
import { typeDefs, createResolvers } from './graphql/schema';

const app    = express();
const PORT   = process.env.PORT || 4001;
const db     = Database.getInstance();
const upload = multer({ storage: multer.memoryStorage() });

const initDB = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS payrolls (
      id               SERIAL PRIMARY KEY,
      name             VARCHAR(255)  NOT NULL,
      period           VARCHAR(50)   NOT NULL,
      status           VARCHAR(50)   DEFAULT 'PENDIENTE',
      total_employees  INT           DEFAULT 0,
      total_amount     NUMERIC(12,2) DEFAULT 0,
      created_by       INT           NOT NULL,
      created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    )`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS payroll_employees (
      id             SERIAL PRIMARY KEY,
      payroll_id     INT REFERENCES payrolls(id) ON DELETE CASCADE,
      codigo         VARCHAR(50),
      nombre         VARCHAR(255),
      email          VARCHAR(255),
      departamento   VARCHAR(100),
      salario_base   NUMERIC(10,2),
      bonificaciones NUMERIC(10,2),
      deducciones    NUMERIC(10,2)
    )`);
  console.log('[Payroll] Tablas listas');
};

const getUser = (req: Request) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number; role: string };
  } catch { return null; }
};

// CSV upload
app.post('/payroll/:id/upload-csv', upload.single('file'), async (req: Request, res: Response) => {
  if (!getUser(req)) { res.status(401).json({ error: 'Token requerido' }); return; }
  if (!req.file)     { res.status(400).json({ error: 'Archivo CSV requerido' }); return; }

  const payrollId = parseInt(req.params.id);
  try {
    const records = parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true, trim: true }) as any[];
    await db.query('DELETE FROM payroll_employees WHERE payroll_id=$1', [payrollId]);

    let total = 0;
    for (const emp of records) {
      const base = parseFloat(emp.salario_base) || 0;
      const bono = parseFloat(emp.bonificaciones) || 0;
      const ded  = parseFloat(emp.deducciones) || 0;
      total += base + bono - ded;
      await db.query(
        `INSERT INTO payroll_employees (payroll_id,codigo,nombre,email,departamento,salario_base,bonificaciones,deducciones)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [payrollId, emp.codigo, emp.nombre, emp.email, emp.departamento, base, bono, ded]
      );
    }
    await db.query(
      `UPDATE payrolls SET total_employees=$1, total_amount=$2, status='VALIDANDO' WHERE id=$3`,
      [records.length, total, payrollId]
    );
    res.json({ message: 'CSV cargado', total_employees: records.length, total_amount: total });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error al procesar CSV' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'Payroll Service', port: PORT }));

(async () => {
  await initDB();

  const server = new ApolloServer({ typeDefs, resolvers: createResolvers(db) });
  await server.start();

  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({ user: getUser(req) }),
  }));

  app.listen(PORT, () => {
    console.log(`[Payroll Service] http://localhost:${PORT}`);
    console.log(`[Payroll Service] GraphQL → http://localhost:${PORT}/graphql`);
  });
})();
