import { createClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { ensureProfile } from "@/lib/db";
import { ResidentDashboardModel } from "@/models/resident-dashboard.model";
import type { CheckInStatus,DailyCheckIn,DashboardSummary,Result } from "@/types";
async function requireUser(){if(!isSupabaseConfigured())return null;const auth=createClient();const{data:{user}}=await auth.auth.getUser();if(user){try{await ensureProfile(user.id,user.user_metadata?.full_name??null);}catch{/* operation handles Neon error */}}return user;}
const VALID_STATUSES:CheckInStatus[]=["steady","needs_support","urgent"];
export const ResidentDashboardController={
 async summary():Promise<Result<DashboardSummary>>{const user=await requireUser();if(!user)return{ok:false,error:"Sign in required",status:401};try{return{ok:true,data:await ResidentDashboardModel.getSummary(user.id)};}catch(e:any){return{ok:false,error:e.message,status:500};}},
 async createCheckIn(input:any):Promise<Result<DailyCheckIn>>{const user=await requireUser();if(!user)return{ok:false,error:"Sign in required",status:401};const status=input?.status as CheckInStatus;const mood=Number(input?.mood_score);if(!VALID_STATUSES.includes(status))return{ok:false,error:"Status must be steady, needs_support, or urgent",status:400};if(!Number.isInteger(mood)||mood<1||mood>5)return{ok:false,error:"Mood score must be between 1 and 5",status:400};try{return{ok:true,data:await ResidentDashboardModel.createCheckIn(user.id,{status,mood_score:mood,support_needed:Boolean(input?.support_needed),notes:typeof input?.notes==="string"?input.notes.trim().slice(0,1200):null})};}catch(e:any){const duplicate=e.message?.includes("daily_check_ins_user_day_unique");return{ok:false,error:duplicate?"Roll Call is already complete for today":e.message,status:duplicate?409:500};}},
};
