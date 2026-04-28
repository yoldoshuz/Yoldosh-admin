import { UserDetail } from "@/components/pages/admin/UserDetail";

interface Props {
  params: Promise<{ userId: string }>;
}

const Page = async ({ params }: Props) => {
  const { userId } = await params;
  return (
    <section className="w-full p-8">
      <UserDetail userId={userId} />
    </section>
  );
};

export default Page;
