import LearnModuleClient from "@/components/LearnModuleClient";

export default function LearnModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  return <LearnModuleClient params={params} />;
}
