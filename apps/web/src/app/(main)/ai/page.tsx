import { AiChat } from "@/components/AiChat";
import { getSession } from "@/lib/auth";
import { buildUserProfile } from "@/lib/ai";

export default async function AiPage() {
  const session = await getSession();
  if (!session) return null;
  const profile = await buildUserProfile(session.id);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="mb-4">
          <h1 className="section-title">AI 专属陪伴</h1>
          <p className="muted mt-1 text-sm">
            基于你的真实记录进行个性化回应（可接入 OpenAI 兼容模型）
          </p>
        </div>
        <AiChat />
      </div>
      <div className="card h-fit space-y-3 p-5 lg:col-span-2">
        <h2 className="font-bold">当前理解你的方式</h2>
        <p className="text-sm leading-7 text-stone-600">{profile.summary}</p>
        <div className="flex flex-wrap gap-2">
          {profile.personalityTags.map((t) => (
            <span key={t} className="badge">
              {t}
            </span>
          ))}
        </div>
        <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-900">
          提示：多写日记、多打卡情绪，陪伴质量会显著提升。配置
          OPENAI_API_KEY 后可启用大模型对话。
        </div>
      </div>
    </div>
  );
}
