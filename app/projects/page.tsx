import { getAllProjects } from '@/lib/content';
import { ProjectsClient } from './projects-client';

export default function ProjectsPage() {
  const allProjects = getAllProjects();

  return <ProjectsClient projects={allProjects} />;
}
