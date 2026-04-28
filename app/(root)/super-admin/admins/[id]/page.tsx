import { AdminProfile } from "@/components/pages/super-admin/AdminProfile";

interface Props {
  params: Promise<{ id: string }>;
}

const Page = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <section className="w-full p-8">
      <AdminProfile adminId={id} />
    </section>
  );
};

export default Page;
