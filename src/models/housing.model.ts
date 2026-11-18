import { query, queryOne, DATABASE_NOT_CONFIGURED, isDatabaseConfigured } from "@/lib/db";
import type { Housing } from "@/types";
const KEYS=["name","type","location","description","contact"] as const;
export const HousingModel={
 async list(q?:string):Promise<Housing[]>{if(!isDatabaseConfigured())return[];if(!q)return query<Housing>("SELECT * FROM housing ORDER BY created_at DESC");const s=`%${q}%`;return query<Housing>("SELECT * FROM housing WHERE name ILIKE $1 OR location ILIKE $1 OR type ILIKE $1 ORDER BY created_at DESC",[s]);},
 async get(id:string):Promise<Housing|null>{if(!isDatabaseConfigured())return null;return queryOne<Housing>("SELECT * FROM housing WHERE id=$1",[id]);},
 async create(input:Partial<Housing>):Promise<Housing>{if(!isDatabaseConfigured())throw new Error(DATABASE_NOT_CONFIGURED);const r=await queryOne<Housing>("INSERT INTO housing(name,type,location,description,contact) VALUES($1,$2,$3,$4,$5) RETURNING *",[input.name,input.type??null,input.location??null,input.description??null,input.contact??null]);if(!r)throw new Error("Could not create housing resource.");return r;},
 async update(id:string,patch:Partial<Housing>):Promise<Housing>{if(!isDatabaseConfigured())throw new Error(DATABASE_NOT_CONFIGURED);const fields=KEYS.filter(k=>patch[k]!==undefined);if(!fields.length)throw new Error("No fields to update.");const set=fields.map((k,i)=>`${k}=$${i+2}`).join(",");const r=await queryOne<Housing>(`UPDATE housing SET ${set} WHERE id=$1 RETURNING *`,[id,...fields.map(k=>patch[k])]);if(!r)throw new Error("Housing resource not found.");return r;},
 async remove(id:string):Promise<void>{if(!isDatabaseConfigured())throw new Error(DATABASE_NOT_CONFIGURED);await query("DELETE FROM housing WHERE id=$1",[id]);},
};
