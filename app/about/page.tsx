import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Github,
  Linkedin,
  ExternalLink,
  Code,
  Database,
  Brain,
  BarChart3,
} from 'lucide-react';

export default function AboutPage() {
  const skills = [
    {
      category: 'Machine Learning',
      items: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'XGBoost'],
      icon: Brain,
    },
    {
      category: 'Data Engineering',
      items: ['SQL', 'PostgreSQL', 'MongoDB', 'Apache Spark', 'Airflow'],
      icon: Database,
    },
    {
      category: 'Programming',
      items: ['Python', 'JavaScript', 'TypeScript', 'R', 'Bash'],
      icon: Code,
    },
    {
      category: 'Analytics & Visualization',
      items: ['Tableau', 'Power BI', 'Matplotlib', 'Seaborn', 'Plotly'],
      icon: BarChart3,
    },
  ];

  const strengths = [
    'End-to-end project development from data collection to deployment',
    'Strong foundation in statistical methods and experimental design',
    'Experience with both structured and unstructured data',
    'Excellent communication of complex technical concepts',
    'Commitment to reproducible research and documentation',
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">About Me</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Data scientist passionate about transforming complex data into actionable insights and
          production-ready solutions.
        </p>
      </section>

      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle>Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            I'm a data scientist with expertise in machine learning, statistical analysis, and data
            engineering. My approach combines rigorous methodology with practical implementation,
            ensuring that insights aren't just theoretically sound but also deliver real business
            value.
          </p>
          <p className="text-muted-foreground">
            I specialize in developing end-to-end data solutions, from initial data collection and
            cleaning to model deployment and monitoring. My experience spans various industries,
            allowing me to bring diverse perspectives to each unique challenge.
          </p>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle>Core Strengths</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Technical Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Toolkit</CardTitle>
          <CardDescription>Technologies and tools I work with regularly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {skills.map(({ category, items, icon: Icon }) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{category}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card>
        <CardHeader>
          <CardTitle>Let's Connect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            I'm always interested in discussing data challenges, collaborations, or opportunities.
            Feel free to reach out through any of the channels below.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/contact">
                <Mail className="mr-2 h-4 w-4" />
                Get in Touch
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/projects">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Projects
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Back Navigation */}
      <div className="text-center">
        <Button variant="outline" asChild>
          <Link href="/">← Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
