import { getLatestIndicators } from "@/actions/indicators";
import { getRegionalNews } from "@/actions/news";
import { DiarioRegionalSection } from "@/components/diario-regional-section";

export const revalidate = 0;

export default async function HomePage() {
  const indicatorsRes = await getLatestIndicators();
  const indicators = indicatorsRes.success ? indicatorsRes.data : [];

  const newsRes = await getRegionalNews();
  const regionalNews = newsRes.success ? newsRes.data : [];

  return (
    <DiarioRegionalSection initialNews={regionalNews} indicators={indicators} />
  );
}
