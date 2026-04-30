import { BookingDetailsView } from "@/components/shared/bookings/BookingDetailsView";

type Props = {
  params: Promise<{ bookingId: string }>;
};

const Page = async ({ params }: Props) => {
  const { bookingId } = await params;
  return (
    <section className="w-full p-4 sm:p-6 lg:p-8">
      <BookingDetailsView bookingId={bookingId} basePath="super-admin" />
    </section>
  );
};

export default Page;
