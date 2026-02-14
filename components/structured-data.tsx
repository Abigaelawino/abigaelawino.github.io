export function StructuredData() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Abigael Awino Portfolio',
    url: 'https://abigaelawino.github.io',
    description:
      'Data scientist specializing in machine learning, analytics, and production-ready data solutions.',
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://abigaelawino.github.io/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Abigael Awino',
    url: 'https://abigaelawino.github.io',
    jobTitle: 'Data Scientist',
    description:
      'Data scientist passionate about transforming complex data into actionable insights and production-ready solutions.',
    knowsAbout: [
      'Data Science',
      'Machine Learning',
      'Analytics',
      'Python',
      'TensorFlow',
      'PyTorch',
      'Scikit-learn',
      'Data Engineering',
      'Statistics',
      'SQL',
      'PostgreSQL',
      'MongoDB',
      'Apache Spark',
      'Airflow',
    ],
    sameAs: ['https://github.com', 'https://linkedin.com'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'professional',
      availableLanguage: ['English'],
      url: 'https://abigaelawino.github.io/contact',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Abigael Awino',
    url: 'https://abigaelawino.github.io',
    description: 'Data science consulting and solutions',
    founder: {
      '@type': 'Person',
      name: 'Abigael Awino',
    },
    areaServed: 'Worldwide',
    knowsLanguage: 'English',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'professional',
      availableLanguage: ['English'],
      url: 'https://abigaelawino.github.io/contact',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://abigaelawino.github.io',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema, null, 2),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema, null, 2),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema, null, 2),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema, null, 2),
        }}
      />
    </>
  );
}
