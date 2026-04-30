import { TripDetails } from "@/components/pages/admin/TripDetails";

interface Props {
  params: Promise<{ tripId: string }>;
}

const Page = async ({ params }: Props) => {
  const { tripId } = await params;
  return (
    <section className="w-full p-4 sm:p-6 lg:p-8">
      <TripDetails tripId={tripId} />
    </section>
  );
};

export default Page;
