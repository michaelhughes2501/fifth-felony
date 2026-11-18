import { query, queryOne } from "@/lib/db";
import type { JobApplication } from "@/types";
type AppRow = JobApplication & { job_title: string | null; job_company: string | null; job_location: string | null; job_apply_url: string | null };
export const ApplicationModel = {
  async listForUser(userId: string): Promise<JobApplication[]> {
    const rows = await query<AppRow>(`SELECT a.*,j.title AS job_title,j.company AS job_company,j.location AS job_location,j.apply_url AS job_apply_url FROM job_applications a LEFT JOIN jobs j ON j.id=a.job_id WHERE a.user_id=$1 ORDER BY a.created_at DESC`,[userId]);
    return rows.map(({job_title,job_company,job_location,job_apply_url,...app})=>({...app,jobs:job_title===null?null:{title:job_title,company:job_company??"",location:job_location,apply_url:job_apply_url}}));
  },
  async countForUser(userId: string): Promise<number> {
    const row=await queryOne<{count:number}>("SELECT count(*)::int AS count FROM job_applications WHERE user_id=$1",[userId]);return row?.count??0;
  },
  async create(userId:string,jobId:string):Promise<JobApplication>{
    const row=await queryOne<JobApplication>("INSERT INTO job_applications(user_id,job_id) VALUES($1,$2) RETURNING *",[userId,jobId]);if(!row)throw new Error("Could not create application.");return row;
  },
  async updateStatus(id:string,status:JobApplication["status"],userId:string):Promise<JobApplication>{
    const row=await queryOne<JobApplication>("UPDATE job_applications SET status=$1 WHERE id=$2 AND user_id=$3 RETURNING *",[status,id,userId]);if(!row)throw new Error("Application not found.");return row;
  },
  async remove(id:string,userId:string):Promise<void>{await query("DELETE FROM job_applications WHERE id=$1 AND user_id=$2",[id,userId]);},
};
