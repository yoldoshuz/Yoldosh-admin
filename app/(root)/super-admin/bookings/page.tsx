import { BookingsList } from "@/components/shared/bookings/BookingsList";
import { BookingsStatsBlock } from "@/components/shared/bookings/BookingsStatsBlock";

const Page = () => {
  return (
    <section className="flex w-full flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <BookingsStatsBlock />
      <BookingsList basePath="super-admin" />
    </section>
  );
};

export default Page;
