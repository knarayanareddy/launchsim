import { Helmet } from "react-helmet-async";
import { APP_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from "@/lib/config";

const DEFAULT_DESC = DEFAULT_DESCRIPTION;
const DEFAULT_OG = `${APP_URL}/og-default.jpg`;

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  path?: string;
  noIndex?: boolean;
}

const SEO = ({
  title,
  description = DEFAULT_DESC,
  ogImage = DEFAULT_OG,
  path = "",
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonical = `${APP_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
