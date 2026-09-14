import { AnalyticsUserTimelinePage } from "@/components/pages/analytics/UserTimeline";

const Page = ({ params }: { params: { userId: string } }) => <AnalyticsUserTimelinePage userId={params.userId} />;

export default Page;
