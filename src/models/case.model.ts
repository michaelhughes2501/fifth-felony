import { query, queryOne } from "@/lib/db";
import type { LegalCase } from "@/types";
import type { LegalCaseInput } from "@/lib/request-validation";

const params = (i: LegalCaseInput) => [
  i.case_number, i.court, i.case_type, i.status, i.next_hearing_at ?? null, i.attorney || null, i.notes || null,
];

// Every statement filters on user_id so one resident can never read or change another's cases.
export const CaseModel = {
  async listForUser(userId: string): Promise<LegalCase[]> {
    return query<LegalCase>(
      "SELECT * FROM legal_cases WHERE user_id=$1 ORDER BY next_hearing_at ASC NULLS LAST, created_at DESC",
      [userId],
    );
  },
  async create(userId: string, input: LegalCaseInput): Promise<LegalCase> {
    const row = await queryOne<LegalCase>(
      `INSERT INTO legal_cases(user_id,case_number,court,case_type,status,next_hearing_at,attorney,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [userId, ...params(input)],
    );
    if (!row) throw new Error("Could not create case.");
    return row;
  },
  async update(id: string, userId: string, input: LegalCaseInput): Promise<LegalCase | null> {
    return queryOne<LegalCase>(
      `UPDATE legal_cases SET case_number=$3,court=$4,case_type=$5,status=$6,next_hearing_at=$7,attorney=$8,notes=$9,updated_at=now()
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [id, userId, ...params(input)],
    );
  },
  async remove(id: string, userId: string): Promise<boolean> {
    const row = await queryOne<{ id: string }>("DELETE FROM legal_cases WHERE id=$1 AND user_id=$2 RETURNING id", [id, userId]);
    return Boolean(row);
  },
};
