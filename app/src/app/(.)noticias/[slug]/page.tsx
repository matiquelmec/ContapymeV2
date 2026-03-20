import { getRegionalNews } from "@/actions/news";
import { NewsDetailModalWrapper } from "../../../components/news-detail-modal-wrapper";
import { notFound } from "next/navigation";

export default async function NewsInterceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const newsRes = await getRegionalNews();
  const news = newsRes.success ? newsRes.data.find((n: any) => n.slug === slug) : null;

  if (!news) notFound();

  // Usamos un wrapper ligero que se encarga de mostrar el modal inmediatamente
  return <NewsDetailModalWrapper news={news} />;
}
