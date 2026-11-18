import { query, queryOne, DATABASE_NOT_CONFIGURED, isDatabaseConfigured } from "@/lib/db";
import type { CommunityPost } from "@/types";
type PostRow = CommunityPost & { author_name: string | null };
const SELECT_POST = `SELECT p.id,p.title,p.body,p.created_at,p.author_id,pr.full_name AS author_name FROM community_posts p LEFT JOIN profiles pr ON pr.id=p.author_id`;
function post(row: PostRow): CommunityPost { const { author_name, ...data } = row; return { ...data, profiles: { full_name: author_name } }; }
export const CommunityModel = {
  async list(): Promise<CommunityPost[]> {
    if (!isDatabaseConfigured()) return [];
    return (await query<PostRow>(`${SELECT_POST} ORDER BY p.created_at DESC LIMIT 50`)).map(post);
  },
  async get(id: string): Promise<CommunityPost | null> {
    if (!isDatabaseConfigured()) return null;
    const row = await queryOne<PostRow>(`${SELECT_POST} WHERE p.id=$1`, [id]); return row ? post(row) : null;
  },
  async create(authorId: string, title: string, body: string): Promise<CommunityPost> {
    if (!isDatabaseConfigured()) throw new Error(DATABASE_NOT_CONFIGURED);
    const row = await queryOne<CommunityPost>("INSERT INTO community_posts(author_id,title,body) VALUES($1,$2,$3) RETURNING *", [authorId,title,body]);
    if (!row) throw new Error("Could not create community post."); return row;
  },
  async update(id: string, patch: {title?: string;body?: string}, authorId: string): Promise<CommunityPost> {
    if (!isDatabaseConfigured()) throw new Error(DATABASE_NOT_CONFIGURED);
    const fields = (["title","body"] as const).filter((key)=>patch[key]!==undefined);
    if (!fields.length) throw new Error("No fields to update.");
    const set = fields.map((key,i)=>`${key}=$${i+3}`).join(",");
    const row = await queryOne<CommunityPost>(`UPDATE community_posts SET ${set} WHERE id=$1 AND author_id=$2 RETURNING *`,[id,authorId,...fields.map(key=>patch[key])]);
    if (!row) throw new Error("Community post not found."); return row;
  },
  async remove(id: string, authorId: string): Promise<void> {
    if (!isDatabaseConfigured()) throw new Error(DATABASE_NOT_CONFIGURED);
    await query("DELETE FROM community_posts WHERE id=$1 AND author_id=$2",[id,authorId]);
  },
};
