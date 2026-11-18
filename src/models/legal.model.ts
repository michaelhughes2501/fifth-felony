import { query, queryOne, DATABASE_NOT_CONFIGURED, isDatabaseConfigured } from "@/lib/db";
import type { LegalResource } from "@/types";
const KEYS=["name","category","location","description","contact"] as const;
export const LegalModel={
 async list(q?:string):Promise<LegalResource[]>{if(!isDatabaseConfigured())return[];if(!q)return query<LegalResource>("SELECT * FROM legal_resources ORDER BY created_at DESC");const s=`%${q}%`;return query<LegalResource>("SELECT * FROM legal_resources WHERE name ILIKE $1 OR category ILIKE $1 OR location ILIKE $1 ORDER BY created_at DESC",[s]);},
 async get(id:string):Promise<LegalResource|null>{if(!isDatabaseConfigured())return null;return queryOne<LegalResource>("SELECT * FROM legal_resources WHERE id=$1",[id]);},
 async create(input:Partial<LegalResource>):Promise<LegalResource>{if(!isDatabaseConfigured())throw new Error(DATABASE_NOT_CONFIGURED);const r=await queryOne<LegalResource>("INSERT INTO legal_resources(name,category,location,description,contact) VALUES($1,$2,$3,$4,$5) RETURNING *",[input.name,input.category??null,input.location??null,input.description??null,input.contact??null]);if(!r)throw new Error("Could not create legal resource.");return r;},
 async update(id:string,patch:Partial<LegalResource>):Promise<LegalResource>{if(!isDatabaseConfigured())throw new Error(DATABASE_NOT_CONFIGURED);const fields=KEYS.filter(k=>patch[k]!==undefined);if(!fields.length)throw new Error("No fields to update.");const set=fields.map((k,i)=>`${k}=$${i+2}`).join(",");const r=await queryOne<LegalResource>(`UPDATE legal_resources SET ${set} WHERE id=$1 RETURNING *`,[id,...fields.map(k=>patch[k])]);if(!r)throw new Error("Legal resource not found.");return r;},
 async remove(id:string):Promise<void>{if(!isDatabaseConfigured())throw new Error(DATABASE_NOT_CONFIGURED);await query("DELETE FROM legal_resources WHERE id=$1",[id]);},
};
