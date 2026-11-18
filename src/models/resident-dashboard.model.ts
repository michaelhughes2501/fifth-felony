import { query, queryOne } from "@/lib/db";
import type { CheckInStatus, DailyCheckIn, DashboardSummary, PositiveBehaviorEvent, SupervisionAssignment } from "@/types";
const CHECK_IN_POINTS=10;
function tier(points:number){if(points>=600)return 5;if(points>=350)return 4;if(points>=175)return 3;if(points>=60)return 2;return 1;}
function today(){const d=new Date();d.setHours(0,0,0,0);return d.toISOString();}
function week(){const d=new Date(),day=d.getDay();d.setDate(d.getDate()-day+(day===0?-6:1));d.setHours(0,0,0,0);return d.toISOString();}
function streak(rows:DailyCheckIn[]){const days=new Set(rows.map(r=>r.created_at.slice(0,10)));let n=0;const d=new Date();d.setHours(0,0,0,0);for(let i=0;i<60;i++){if(!days.has(d.toISOString().slice(0,10)))break;n++;d.setDate(d.getDate()-1);}return n;}
export const ResidentDashboardModel={
 async getSummary(userId:string):Promise<DashboardSummary>{
  const [check,totalRow,weekRow,events,checks,assignment]=await Promise.all([
   queryOne<DailyCheckIn>("SELECT * FROM daily_check_ins WHERE user_id=$1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 1",[userId,today()]),
   queryOne<{total:number}>("SELECT COALESCE(sum(points),0)::int AS total FROM positive_behavior_events WHERE user_id=$1",[userId]),
   queryOne<{total:number}>("SELECT COALESCE(sum(points),0)::int AS total FROM positive_behavior_events WHERE user_id=$1 AND created_at >= $2",[userId,week()]),
   query<PositiveBehaviorEvent>("SELECT * FROM positive_behavior_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5",[userId]),
   query<DailyCheckIn>("SELECT * FROM daily_check_ins WHERE user_id=$1 ORDER BY created_at DESC LIMIT 60",[userId]),
   queryOne<SupervisionAssignment>("SELECT * FROM supervision_assignments WHERE participant_id=$1 AND active=true ORDER BY created_at DESC LIMIT 1",[userId]),
  ]);const total=totalRow?.total??0;return{todayCheckIn:check,goodTime:{total,thisWeek:weekRow?.total??0,streak:streak(checks),tier:tier(total)},supervision:assignment,recentEvents:events};
 },
 async createCheckIn(userId:string,input:{status:CheckInStatus;mood_score:number;support_needed:boolean;notes?:string|null}):Promise<DailyCheckIn>{
  const row=await queryOne<DailyCheckIn>("INSERT INTO daily_check_ins(user_id,status,mood_score,support_needed,notes,points_awarded) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",[userId,input.status,input.mood_score,input.support_needed,input.notes||null,CHECK_IN_POINTS]);if(!row)throw new Error("Could not create check-in.");
  await query("INSERT INTO positive_behavior_events(user_id,event_type,points,source_id,note) VALUES($1,$2,$3,$4,$5)",[userId,"daily_check_in",CHECK_IN_POINTS,row.id,"Completed daily status confirmation"]);return row;
 }
};
