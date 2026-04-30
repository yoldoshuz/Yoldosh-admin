import { UserDetail } from "@/components/pages/admin/UserDetail";

const Page = async ({ params }: { params: { userId: string } }) => {
  return (
    <section className="w-full p-4 sm:p-6 lg:p-8">
      <UserDetail userId={params.userId} />
    </section>
  );
};

export default Page;
