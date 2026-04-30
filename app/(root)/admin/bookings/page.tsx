import { BookingsList } from "@/components/shared/bookings/BookingsList";

const Page = () => {
  return (
    <section className="w-full p-4 sm:p-6 lg:p-8">
      <BookingsList basePath="admin" />
    </section>
  );
};

export default Page;
