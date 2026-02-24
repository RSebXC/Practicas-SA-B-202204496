import { Pool } from 'pg';

export const typeDefs = `#graphql
  type Payroll {
    id: Int!
    name: String!
    period: String!
    status: String!
    total_employees: Int!
    total_amount: Float!
    created_by: Int!
    created_at: String!
  }

  type Employee {
    codigo: String!
    nombre: String!
    email: String!
    departamento: String!
    salario_base: Float!
    bonificaciones: Float!
    deducciones: Float!
    salario_neto: Float!
  }

  type PayrollDetail {
    payroll: Payroll!
    employees: [Employee!]!
  }

  type Query {
    payrolls: [Payroll!]!
    payroll(id: Int!): PayrollDetail
    payrollsByStatus(status: String!): [Payroll!]!
  }

  type Mutation {
    createPayroll(name: String!, period: String!, created_by: Int!): Payroll!
    updatePayrollStatus(id: Int!, status: String!): Payroll!
    deletePayroll(id: Int!): Boolean!
  }
`;

export const createResolvers = (db: Pool) => ({
  Query: {
    payrolls: async () => (await db.query('SELECT * FROM payrolls ORDER BY created_at DESC')).rows,

    payroll: async (_: unknown, { id }: { id: number }) => {
      const p = await db.query('SELECT * FROM payrolls WHERE id = $1', [id]);
      if (!p.rows.length) throw new Error('Planilla no encontrada');
      const e = await db.query(
        `SELECT *, (salario_base + bonificaciones - deducciones) AS salario_neto
         FROM payroll_employees WHERE payroll_id = $1`, [id]
      );
      return { payroll: p.rows[0], employees: e.rows };
    },

    payrollsByStatus: async (_: unknown, { status }: { status: string }) =>
      (await db.query('SELECT * FROM payrolls WHERE status = $1 ORDER BY created_at DESC', [status])).rows,
  },

  Mutation: {
    createPayroll: async (_: unknown, args: { name: string; period: string; created_by: number }) => {
      const r = await db.query(
        `INSERT INTO payrolls (name, period, status, total_employees, total_amount, created_by)
         VALUES ($1,$2,'PENDIENTE',0,0,$3) RETURNING *`,
        [args.name, args.period, args.created_by]
      );
      return r.rows[0];
    },

    updatePayrollStatus: async (_: unknown, { id, status }: { id: number; status: string }) => {
      const valid = ['PENDIENTE','VALIDANDO','PENDIENTE_APROBACION','APROBADA','RECHAZADA','COMPLETADA'];
      if (!valid.includes(status)) throw new Error('Estado inválido');
      const r = await db.query('UPDATE payrolls SET status=$1 WHERE id=$2 RETURNING *', [status, id]);
      if (!r.rows.length) throw new Error('Planilla no encontrada');
      return r.rows[0];
    },

    deletePayroll: async (_: unknown, { id }: { id: number }) => {
      await db.query('DELETE FROM payroll_employees WHERE payroll_id=$1', [id]);
      const r = await db.query('DELETE FROM payrolls WHERE id=$1', [id]);
      return (r.rowCount ?? 0) > 0;
    },
  },
});
