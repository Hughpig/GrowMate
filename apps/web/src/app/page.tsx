import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-12">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="badge badge-brand">AI 陪伴成长社区 · MVP</div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
              让每一段经历都被记录
              <br />
              <span className="bg-gradient-to-r from-teal-700 to-violet-600 bg-clip-text text-transparent">
                让每一次成长都有陪伴
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-stone-600">
              GrowMate 以「个人长期档案」为底座，以 AI 深度识人为内核，叠加体能、营养、心理、技术四大成长体系，
              并提供细分情绪交流社区 —— 不是短期娱乐社交，而是终身成长存档。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary">
                免费开启我的档案
              </Link>
              <Link href="/login" className="btn btn-secondary">
                使用演示账号登录
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-center">
              {[
                ["记录沉淀", "日记 / 情绪 / 打卡"],
                ["AI 识人", "千人千档动态画像"],
                ["同频陪伴", "五大垂直社区"],
              ].map(([t, d]) => (
                <div key={t} className="card p-3">
                  <div className="text-sm font-bold">{t}</div>
                  <div className="mt-1 text-xs text-stone-500">{d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold">五层产品闭环</h2>
            <ol className="mt-4 space-y-3">
              {[
                "用户记录：经历、情绪、学习、生活数据",
                "AI 建档：成长档案 + 人格心理档案",
                "精准赋能：匹配心理 / 运动 / 饮食 / 技术课程",
                "社区陪伴：同频交流、打卡互助",
                "心理监护：情绪监测 + 风险提示 + 复盘",
              ].map((item, i) => (
                <li key={item} className="flex gap-3 rounded-xl bg-white/80 p-3 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-stone-700">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-14 grid-3">
          {[
            {
              t: "区别娱乐社交",
              d: "主打长期自我沉淀，有存档、有成长、有痕迹",
            },
            {
              t: "专属懂你的 AI",
              d: "不是通用聊天，是基于你真实记录的私人陪伴",
            },
            {
              t: "全维度成长",
              d: "身心、技能、饮食、心理一站式覆盖",
            },
          ].map((x) => (
            <div key={x.t} className="card p-5">
              <h3 className="font-bold">{x.t}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{x.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
