import { getCurrentUser } from "@/lib/neon-auth";
import { queryOne, ensureProfile } from "@/lib/db";
export type Role="resident"|"moderator"|"admin"|"super_admin";
export const ROLE_LEVELS:Record<string,number>={member:1,resident:1,provider:2,moderator:2,admin:3,super_admin:4};
export function roleLevel(role:string|null|undefined):number{return role?ROLE_LEVELS[role]??0:0;}
export function roleAtLeast(role:string|null|undefined,min:Role):boolean{return roleLevel(role)>=roleLevel(min);}
export function normalizeRole(role:string|null|undefined):Role{if(role==="super_admin")return"super_admin";if(role==="admin")return"admin";if(role==="moderator"||role==="provider")return"moderator";return"resident";}
export async function getSessionRole():Promise<{userId:string|null;role:Role}>{try{const user=await getCurrentUser();if(!user)return{userId:null,role:"resident"};await ensureProfile(user.id,user.user_metadata?.full_name??null);const profile=await queryOne<{role:string}>("SELECT role FROM profiles WHERE id=$1",[user.id]);return{userId:user.id,role:normalizeRole(profile?.role)};}catch{return{userId:null,role:"resident"};}}
export async function requireRole(min:Role):Promise<{ok:true;userId:string;role:Role}|{ok:false;status:number;error:string}>{const{userId,role}=await getSessionRole();if(!userId)return{ok:false,status:401,error:"Authentication required."};if(!roleAtLeast(role,min))return{ok:false,status:403,error:"Insufficient permissions."};return{ok:true,userId,role};}
