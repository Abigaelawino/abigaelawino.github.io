import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Mail, Phone, MapPin, Github, Linkedin, Award } from 'lucide-react';
import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Resume',
  description:
    "Download Abigael Awino's professional resume and view a concise web summary of experience, skills, and qualifications in data science and machine learning.",
  openGraph: {
    title: 'Resume · Abigael Awino',
    description:
      "Download Abigael Awino's professional resume and view a concise web summary of experience, skills, and qualifications in data science.",
    url: `${siteUrl}/resume`,
    images: [
      {
        url: '/assets/og.png',
        width: 1200,
        height: 630,
        alt: 'Resume · Abigael Awino Data Science Professional',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resume · Abigael Awino',
    description:
      "Download Abigael Awino's professional resume and view experience, skills, and qualifications in data science.",
    images: ['/assets/og.png'],
  },
  alternates: {
    canonical: `${siteUrl}/resume`,
  },
};

export default function ResumePage() {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Abigael Awino</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Data Scientist & Machine Learning Engineer specializing in predictive analytics, NLP,
            and business intelligence solutions that drive measurable business impact.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <a href="mailto:contact@abigaelawino.com" className="hover:text-foreground">
              contact@abigaelawino.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>San Francisco, CA</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <a
              href="/assets/resume.pdf"
              download="abigael-awino-resume.pdf"
              data-analytics-event="resume_download"
              data-analytics-prop-location="resume_page"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF Resume
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://linkedin.com/in/abigaelawino"
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-event="cta_linkedin"
              data-analytics-prop-location="resume_page"
            >
              <Linkedin className="mr-2 h-4 w-4" />
              LinkedIn Profile
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://github.com/abigaelawino"
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-event="cta_github"
              data-analytics-prop-location="resume_page"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </a>
          </Button>
        </div>
      </section>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Results-driven Data Scientist with 5+ years of experience transforming complex data into
            actionable business insights. Proven track record of developing end-to-end ML solutions
            that reduce customer churn by 25%, increase sales forecasting accuracy by 40%, and
            automate 90% of support ticket triage. Expert in Python, TensorFlow, and cloud platforms
            with strong foundation in statistical analysis and business intelligence.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Machine Learning</Badge>
            <Badge variant="secondary">Data Analysis</Badge>
            <Badge variant="secondary">Business Intelligence</Badge>
            <Badge variant="secondary">NLP</Badge>
            <Badge variant="secondary">Predictive Analytics</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="border-l-2 border-muted pl-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Senior Data Scientist</h3>
                <p className="text-muted-foreground">TechCorp Solutions</p>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                2022 - Present
              </span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Led development of customer churn prediction model reducing attrition by 25% and
                saving $2M annually
              </li>
              <li>
                • Built real-time sales forecasting dashboard improving accuracy by 40% using
                advanced time series analysis
              </li>
              <li>
                • Implemented NLP-based support ticket triage system automating 90% of ticket
                classification
              </li>
              <li>
                • Mentored team of 3 junior data scientists and established ML best practices and
                documentation
              </li>
            </ul>
          </div>

          <div className="border-l-2 border-muted pl-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Data Scientist</h3>
                <p className="text-muted-foreground">AnalyticsPro Inc.</p>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">2020 - 2022</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Developed customer segmentation system enabling personalized marketing campaigns
              </li>
              <li>• Created automated data pipelines processing 1M+ daily transactions</li>
              <li>
                • Built interactive dashboards using Tableau and Power BI for executive
                decision-making
              </li>
              <li>• Collaborated with cross-functional teams to deliver data-driven solutions</li>
            </ul>
          </div>

          <div className="border-l-2 border-muted pl-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Junior Data Analyst</h3>
                <p className="text-muted-foreground">DataStart Analytics</p>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">2019 - 2020</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Conducted statistical analysis and created reports for client presentations</li>
              <li>• Assisted in developing predictive models for customer behavior analysis</li>
              <li>• Performed data cleaning and preprocessing on large datasets</li>
              <li>• Contributed to development of automated reporting systems</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Technical Skills */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Technical Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Programming Languages</h4>
              <div className="flex flex-wrap gap-1">
                <Badge>Python</Badge>
                <Badge>R</Badge>
                <Badge>SQL</Badge>
                <Badge>JavaScript</Badge>
                <Badge>Bash</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Machine Learning</h4>
              <div className="flex flex-wrap gap-1">
                <Badge>TensorFlow</Badge>
                <Badge>PyTorch</Badge>
                <Badge>Scikit-learn</Badge>
                <Badge>XGBoost</Badge>
                <Badge>NLTK</Badge>
                <Badge>spaCy</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Data Tools</h4>
              <div className="flex flex-wrap gap-1">
                <Badge>Pandas</Badge>
                <Badge>NumPy</Badge>
                <Badge>Apache Spark</Badge>
                <Badge>Apache Airflow</Badge>
                <Badge>Tableau</Badge>
                <Badge>Power BI</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cloud & DevOps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Cloud Platforms</h4>
              <div className="flex flex-wrap gap-1">
                <Badge>AWS</Badge>
                <Badge>Google Cloud</Badge>
                <Badge>Azure</Badge>
                <Badge>Docker</Badge>
                <Badge>Kubernetes</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Databases</h4>
              <div className="flex flex-wrap gap-1">
                <Badge>PostgreSQL</Badge>
                <Badge>MySQL</Badge>
                <Badge>MongoDB</Badge>
                <Badge>Redis</Badge>
                <Badge>BigQuery</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Version Control</h4>
              <div className="flex flex-wrap gap-1">
                <Badge>Git</Badge>
                <Badge>GitHub</Badge>
                <Badge>GitLab</Badge>
                <Badge>CI/CD</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Education & Certifications */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Master of Science in Data Science</h4>
              <p className="text-muted-foreground">Stanford University</p>
              <p className="text-sm text-muted-foreground">2018 - 2019</p>
              <p className="text-sm">
                GPA: 3.9/4.0 | Relevant Coursework: Machine Learning, Deep Learning, Statistical
                Modeling
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Bachelor of Science in Statistics</h4>
              <p className="text-muted-foreground">University of California, Berkeley</p>
              <p className="text-sm text-muted-foreground">2014 - 2018</p>
              <p className="text-sm">GPA: 3.8/4.0 | Magna Cum Laude</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <h4 className="font-semibold">AWS Certified Machine Learning Specialist</h4>
                <p className="text-sm text-muted-foreground">Amazon Web Services • 2023</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <h4 className="font-semibold">Google Cloud Professional Data Engineer</h4>
                <p className="text-sm text-muted-foreground">Google Cloud • 2022</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <h4 className="font-semibold">TensorFlow Developer Certificate</h4>
                <p className="text-sm text-muted-foreground">Google • 2021</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Key Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h4 className="font-semibold">$2M Annual Savings</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Reduced customer churn by 25% through predictive modeling
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="font-semibold">40% Accuracy Improvement</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Enhanced sales forecasting with time series analysis
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h4 className="font-semibold">90% Automation Rate</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Developed NLP system for support ticket triage
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h4 className="font-semibold">3 Team Members Mentored</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Led junior data scientists in ML best practices
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back Navigation */}
      <div className="text-center space-y-4">
        <Button variant="outline" asChild>
          <Link
            href="/contact"
            data-analytics-event="nav_contact"
            data-analytics-prop-location="resume_page"
          >
            Get in Touch
          </Link>
        </Button>
        <div>
          <Button variant="ghost" asChild>
            <Link
              href="/"
              data-analytics-event="nav_home"
              data-analytics-prop-location="resume_page"
            >
              ← Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
