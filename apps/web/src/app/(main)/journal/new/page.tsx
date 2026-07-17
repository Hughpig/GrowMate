import { JournalForm } from "@/components/JournalForm";

export default function NewJournalPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="section-title">新建成长记录</h1>
        <p className="muted mt-1 text-sm">默认私密，仅用于你的 AI 档案建模</p>
      </div>
      <JournalForm />
    </div>
  );
}
