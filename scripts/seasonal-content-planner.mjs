#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

// Seasonal content themes and templates
const SEASONAL_THEMES = {
  Q1: {
    name: 'Q1 New Year & Goals',
    months: ['January', 'February', 'March'],
    focus: ['New year tech predictions', 'Goal setting', 'Learning roadmaps', 'Career planning'],
    contentTypes: ['tech-predictions', 'goal-setting', 'learning-roadmap', 'career-planning'],
    colors: ['#1e40af', '#3b82f6', '#60a5fa'],
    holidays: ['New Year', "Valentine's Day", "International Women's Day"],
  },
  Q2: {
    name: 'Q2 Mid-Year Growth',
    months: ['April', 'May', 'June'],
    focus: ['Mid-year reviews', 'Summer projects', 'Conference takeaways', 'Skill building'],
    contentTypes: ['mid-year-review', 'summer-projects', 'conference-recap', 'skill-building'],
    colors: ['#16a34a', '#22c55e', '#86efac'],
    holidays: ['Earth Day', 'Memorial Day', 'Pride Month'],
  },
  Q3: {
    name: 'Q3 Back to School & Innovation',
    months: ['July', 'August', 'September'],
    focus: ['Back to tech school', 'Fall preview', 'Innovation trends', 'Project showcases'],
    contentTypes: ['back-to-school', 'fall-preview', 'innovation-trends', 'project-showcase'],
    colors: ['#dc2626', '#f87171', '#fca5a5'],
    holidays: ['Independence Day', 'Labor Day', 'Back to School'],
  },
  Q4: {
    name: 'Q4 Year-End & Reflection',
    months: ['October', 'November', 'December'],
    focus: ['Year in review', 'Holiday projects', 'Tech predictions', 'Portfolio updates'],
    contentTypes: ['year-in-review', 'holiday-projects', 'tech-predictions', 'portfolio-update'],
    colors: ['#7c3aed', '#a78bfa', '#c4b5fd'],
    holidays: ['Halloween', 'Thanksgiving', 'Holiday Season'],
  },
};

// Content templates for seasonal themes
const CONTENT_TEMPLATES = {
  'tech-predictions': {
    title: 'Top {number} {year} {theme} Predictions',
    summary:
      'Expert predictions for {theme} trends in {year}. Based on industry analysis and emerging technologies.',
    tags: ['predictions', '{theme}', 'trends', 'forecast'],
    structure: {
      introduction: 'Brief overview of the current landscape',
      predictions: 'List of predictions with reasoning',
      timeline: 'Expected implementation timeline',
      resources: 'Learning resources and tools',
    },
  },
  'year-in-review': {
    title: '{year} Year in Review: {focus}',
    summary: 'Comprehensive review of {year} achievements, lessons learned, and growth in {focus}.',
    tags: ['year-review', '{focus}', 'achievements', 'learnings'],
    structure: {
      highlights: 'Top achievements and milestones',
      challenges: 'Challenges faced and overcome',
      learnings: 'Key lessons and insights',
      nextYear: 'Goals and plans for next year',
    },
  },
  'quarterly-learnings': {
    title: 'Q{quarter} {year} Learnings: {focus}',
    summary: 'Key insights and technical discoveries from Q{quarter} {year} in {focus}.',
    tags: ['learnings', 'quarterly', '{focus}', 'insights'],
    structure: {
      overview: 'Quarter overview and goals',
      technical: 'Technical discoveries and breakthroughs',
      projects: 'Project updates and outcomes',
      resources: 'Books, courses, and resources discovered',
    },
  },
  'goal-setting': {
    title: '{year} {theme} Goals: A Strategic Approach',
    summary: 'Strategic goal setting framework for {theme} with actionable plans and milestones.',
    tags: ['goals', 'planning', '{theme}', 'strategy'],
    structure: {
      vision: 'Long-term vision',
      objectives: 'SMART objectives',
      timeline: 'Quarterly breakdown',
      measurement: 'Success metrics and KPIs',
    },
  },
  'learning-roadmap': {
    title: '{year} {theme} Learning Roadmap',
    summary:
      'Comprehensive learning roadmap for {theme} with curated resources and skill progression.',
    tags: ['learning', 'roadmap', '{theme}', 'skills'],
    structure: {
      assessment: 'Current skill assessment',
      roadmap: 'Step-by-step learning path',
      resources: 'Curated learning resources',
      milestones: 'Skill milestones and validation',
    },
  },
  'project-showcase': {
    title: 'Project Showcase: {projectName}',
    summary:
      'Deep dive into {projectName}: challenges, solutions, and technical implementation details.',
    tags: ['project', 'showcase', '{technologies}', 'case-study'],
    structure: {
      overview: 'Project overview and objectives',
      implementation: 'Technical implementation details',
      challenges: 'Challenges and solutions',
      outcomes: 'Results and business impact',
    },
  },
};

class SeasonalContentPlanner {
  constructor() {
    this.contentDir = path.join(ROOT_DIR, 'content');
    this.blogDir = path.join(this.contentDir, 'blog');
    this.projectsDir = path.join(this.contentDir, 'projects');
    this.planningDir = path.join(ROOT_DIR, 'content-planning');
    this.quarterlyPlansDir = path.join(this.planningDir, 'quarterly');
    this.templatesDir = path.join(this.planningDir, 'templates');

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.planningDir, this.quarterlyPlansDir, this.templatesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  getCurrentQuarter() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    const year = now.getFullYear();
    return { quarter, year };
  }

  getQuarterDateRange(quarter, year) {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;

    return {
      start: new Date(year, startMonth - 1, 1),
      end: new Date(year, endMonth, 0), // Last day of quarter
      startMonth,
      endMonth,
    };
  }

  generateQuarterlyPlan(quarter, year) {
    const theme = SEASONAL_THEMES[`Q${quarter}`];
    const dateRange = this.getQuarterDateRange(quarter, year);

    const plan = {
      metadata: {
        quarter,
        year,
        theme: theme.name,
        dateRange: {
          start: dateRange.start.toISOString().split('T')[0],
          end: dateRange.end.toISOString().split('T')[0],
        },
        generated: new Date().toISOString(),
        focus: theme.focus,
        contentTypes: theme.contentTypes,
      },
      contentPlan: {
        blogPosts: this.generateBlogPosts(theme, quarter, year),
        projects: this.generateProjects(theme, quarter, year),
        portfolioUpdates: this.generatePortfolioUpdates(theme, quarter, year),
      },
      milestones: this.generateMilestones(theme, quarter, year),
      holidays: theme.holidays.map(holiday => ({
        name: holiday,
        contentOpportunity: this.getHolidayContentOpportunity(holiday, theme),
      })),
      reminderSchedule: this.generateReminderSchedule(quarter, year),
    };

    return plan;
  }

  generateBlogPosts(theme, quarter, year) {
    const posts = [];
    const contentTypes = theme.contentTypes.slice(0, 3); // Focus on 3 main blog posts per quarter

    contentTypes.forEach((contentType, index) => {
      const template = CONTENT_TEMPLATES[contentType];
      if (!template) return;

      const postDate = this.getPostDate(quarter, year, index + 1);

      posts.push({
        type: contentType,
        title: this.interpolateTemplate(template.title, {
          number: 5,
          year,
          theme: theme.name,
          focus: theme.focus[index] || theme.focus[0],
        }),
        summary: this.interpolateTemplate(template.summary, {
          year,
          theme: theme.name,
          focus: theme.focus[index] || theme.focus[0],
        }),
        tags: template.tags.map(tag =>
          this.interpolateTemplate(tag, {
            theme: theme.name,
            focus: theme.focus[index] || theme.focus[0],
          })
        ),
        targetDate: postDate,
        status: 'planned',
        estimatedReadTime: this.estimateReadTime(contentType),
        structure: template.structure,
      });
    });

    return posts;
  }

  generateProjects(theme, quarter, year) {
    // For portfolios, we focus on showcasing existing projects with seasonal updates
    return {
      showcaseOpportunities: [
        {
          title: `${theme.name} Project Showcase`,
          description: 'Update and highlight 1-2 key projects relevant to current season',
          targetDate: this.getPostDate(quarter, year, 2),
          status: 'planned',
        },
      ],
      newProjects: {
        suggested: theme.focus.length > 1 ? 1 : 0,
        themes: theme.focus.slice(0, 1),
      },
    };
  }

  generatePortfolioUpdates(theme, quarter, year) {
    return {
      quarterly: {
        title: `Q${quarter} ${year} Portfolio Update`,
        description: `Quarterly portfolio refresh with ${theme.name} focus`,
        targetDate: this.getPostDate(quarter, year, 3),
        status: 'planned',
        updates: [
          'Update project descriptions with recent learnings',
          'Refresh skills and technologies section',
          'Add recent achievements or certifications',
          'Update availability and contact information',
        ],
      },
      seasonal: {
        title: `${theme.name} Highlights`,
        description: 'Seasonal highlights and achievements',
        status: 'planned',
      },
    };
  }

  generateMilestones(theme, quarter, year) {
    const dateRange = this.getQuarterDateRange(quarter, year);
    const milestones = [];

    // Add milestone for each month
    theme.months.forEach((month, index) => {
      const monthDate = new Date(year, dateRange.startMonth - 1 + index, 15);
      milestones.push({
        date: monthDate.toISOString().split('T')[0],
        title: `${month} Content Goal`,
        description: `Complete and publish ${month} content with ${theme.name} focus`,
        priority: 'medium',
      });
    });

    // Add quarterly milestone
    milestones.push({
      date: dateRange.end.toISOString().split('T')[0],
      title: `Q${quarter} ${year} Content Complete`,
      description: `Complete all ${theme.name} quarterly content goals`,
      priority: 'high',
    });

    return milestones;
  }

  generateReminderSchedule(quarter, year) {
    const dateRange = this.getQuarterDateRange(quarter, year);
    const reminders = [];

    // Early quarter planning reminder
    reminders.push({
      date: new Date(dateRange.start.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 1 week before quarter
      title: `Plan Q${quarter} ${year} Content`,
      description: 'Review and finalize quarterly content plan',
      type: 'planning',
    });

    // Monthly reminders
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(year, dateRange.startMonth - 1 + i, 1);
      reminders.push({
        date: monthDate.toISOString().split('T')[0],
        title: `${SEASONAL_THEMES[`Q${quarter}`].months[i]} Content Kickoff`,
        description: `Start ${SEASONAL_THEMES[`Q${quarter}`].months[i]} content creation`,
        type: 'monthly',
      });
    }

    // Mid-quarter review
    const midQuarter = new Date(dateRange.start.getTime() + (dateRange.end - dateRange.start) / 2);
    reminders.push({
      date: midQuarter.toISOString().split('T')[0],
      title: `Q${quarter} Mid-Quarter Review`,
      description: 'Review progress and adjust content strategy',
      type: 'review',
    });

    return reminders;
  }

  getHolidayContentOpportunity(holiday, theme) {
    const opportunities = {
      'New Year': 'Create "New Year, New Tech Stack" or "Year in Review" content',
      "Valentine's Day": 'Share "Tech Love Story" or "Favorite Tools" content',
      "International Women's Day": 'Highlight women in tech and female-led projects',
      'Earth Day': 'Focus on sustainable tech and green computing',
      'Memorial Day': 'Share "Tech Memorial" - remembering legacy technologies',
      'Pride Month': 'Highlight LGBTQ+ in tech and inclusive design',
      'Independence Day': 'Focus on "Tech Independence" - automation and self-hosting',
      'Labor Day': 'Share "Tech Labor Market" insights and career advice',
      'Back to School': 'Create learning roadmaps and educational content',
      Halloween: 'Share "Tech Horror Stories" or "Spooky Bugs"',
      Thanksgiving: 'Gratitude for tech tools and community support',
      'Holiday Season': 'Year-end reviews and gift guides for developers',
    };

    return opportunities[holiday] || `Create ${holiday}-themed content with ${theme.name} focus`;
  }

  getPostDate(quarter, year, weekInQuarter) {
    const dateRange = this.getQuarterDateRange(quarter, year);
    const weekOffset = (weekInQuarter - 1) * 4; // Space posts 4 weeks apart
    const postDate = new Date(dateRange.start.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000);

    // Prefer mid-week dates (Wednesday)
    const dayOfWeek = postDate.getDay();
    const wednesday = 3;
    let daysToAdd = wednesday - dayOfWeek;
    if (daysToAdd > 3) daysToAdd -= 7; // Don't push to next month

    postDate.setDate(postDate.getDate() + daysToAdd);
    return postDate.toISOString().split('T')[0];
  }

  estimateReadTime(contentType) {
    const readTimes = {
      'tech-predictions': 10,
      'year-in-review': 12,
      'quarterly-learnings': 8,
      'goal-setting': 7,
      'learning-roadmap': 15,
      'project-showcase': 10,
    };

    return readTimes[contentType] || 8;
  }

  interpolateTemplate(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }

  saveQuarterlyPlan(quarter, year, plan) {
    const filename = `Q${quarter}-${year}-content-plan.json`;
    const filepath = path.join(this.quarterlyPlansDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(plan, null, 2));
    return filepath;
  }

  generateContentTemplate(contentType) {
    const template = CONTENT_TEMPLATES[contentType];
    if (!template) return null;

    const templateContent = `---
title: "${template.title}"
date: {date}
tags: [{tags}]
summary: "${template.summary}"
readingTime: {readingTime}
---

# ${template.title}

${template.summary}

## ${template.structure.introduction}

${this.generateIntroductionPlaceholder(contentType)}

## ${template.structure.predictions || template.structure.highlights || template.structure.overview}

${this.generateMainContentPlaceholder(contentType)}

## ${template.structure.timeline || template.structure.challenges || template.structure.technical}

${this.generateDetailPlaceholder(contentType)}

## ${template.structure.resources || template.structure.outcomes || template.structure.resources}

${this.generateResourcesPlaceholder(contentType)}

---

*This content was generated as part of the seasonal content planning system.*
`;

    return templateContent;
  }

  generateIntroductionPlaceholder(contentType) {
    const intros = {
      'tech-predictions':
        'As we look ahead to the coming year, several key trends are emerging in the tech landscape. Based on industry analysis and emerging patterns, here are the most significant predictions.',
      'year-in-review':
        "Looking back at the past year, it's incredible to see how much has been accomplished. This comprehensive review highlights the key achievements, challenges overcome, and lessons learned.",
      'quarterly-learnings':
        "This quarter has been filled with valuable discoveries and technical insights. From new frameworks to improved processes, here's what has been learned.",
      'goal-setting':
        'Setting effective goals requires a clear vision and strategic approach. This framework provides a structured way to plan and execute on your objectives.',
      'learning-roadmap':
        'Continuous learning is essential in technology. This roadmap provides a structured path to mastering new skills and staying current with industry trends.',
      'project-showcase':
        'This project represents a significant achievement in solving a complex problem. The journey from concept to implementation provides valuable insights.',
    };

    return (
      intros[contentType] ||
      'Introduction to be developed based on the specific content requirements.'
    );
  }

  generateMainContentPlaceholder(contentType) {
    return 'This section will be developed with detailed content specific to the topic. Include relevant examples, data points, and insights that provide value to the reader.';
  }

  generateDetailPlaceholder(contentType) {
    return 'Add specific details, examples, and technical information here. Include code snippets, diagrams, or case studies where appropriate to support the main points.';
  }

  generateResourcesPlaceholder(contentType) {
    return '## Further Reading\n\n- [Resource 1](link)\n- [Resource 2](link)\n- [Resource 3](link)\n\n## Tools and Technologies\n\n- Tool 1: Brief description\n- Tool 2: Brief description\n\n## Community and Support\n\n- Forum/Community links\n- Additional resources for continued learning';
  }

  saveContentTemplate(contentType) {
    const filename = `${contentType}-template.mdx`;
    const filepath = path.join(this.templatesDir, filename);

    const template = this.generateContentTemplate(contentType);
    fs.writeFileSync(filepath, template);
    return filepath;
  }

  generateAnnualPlan(year) {
    const annualPlan = {
      metadata: {
        year,
        generated: new Date().toISOString(),
        theme: 'Annual Content Strategy',
      },
      quarters: {},
      yearlyGoals: [
        'Publish 12-16 high-quality blog posts',
        'Showcase 4-6 significant projects',
        'Maintain regular portfolio updates',
        'Engage with seasonal trends and holidays',
        'Build consistent content creation habits',
      ],
      contentMix: {
        blogPosts: 12,
        projectUpdates: 4,
        seasonalContent: 8,
        technicalDeepDives: 6,
        careerDevelopment: 4,
      },
    };

    // Generate plans for all quarters
    for (let quarter = 1; quarter <= 4; quarter++) {
      annualPlan.quarters[`Q${quarter}`] = this.generateQuarterlyPlan(quarter, year);
    }

    return annualPlan;
  }

  saveAnnualPlan(year, plan) {
    const filename = `${year}-annual-content-plan.json`;
    const filepath = path.join(this.planningDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(plan, null, 2));
    return filepath;
  }

  createContentCalendar(year) {
    const calendar = [];
    const currentQuarter = this.getCurrentQuarter();

    // Generate content for the next 6 months
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + monthOffset);

      const quarter = Math.ceil((targetDate.getMonth() + 1) / 3);
      const theme = SEASONAL_THEMES[`Q${quarter}`];
      const monthName = targetDate.toLocaleString('default', { month: 'long' });

      calendar.push({
        month: monthName,
        year: targetDate.getFullYear(),
        quarter,
        theme: theme.name,
        focus: theme.focus,
        suggestedContent: [
          {
            type: 'blog',
            title: `${monthName} ${theme.focus[0]} Insights`,
            targetWeek: 2,
            priority: 'high',
          },
          {
            type: 'social',
            title: `${monthName} Tech Spotlight`,
            targetWeek: 3,
            priority: 'medium',
          },
        ],
        holidays: theme.holidays.filter(holiday =>
          this.isHolidayInMonth(holiday, targetDate.getMonth() + 1)
        ),
      });
    }

    return calendar;
  }

  isHolidayInMonth(holiday, month) {
    const holidayMonths = {
      'New Year': 1,
      "Valentine's Day": 2,
      "International Women's Day": 3,
      'Earth Day': 4,
      'Memorial Day': 5,
      'Pride Month': 6,
      'Independence Day': 7,
      'Labor Day': 9,
      'Back to School': 9,
      Halloween: 10,
      Thanksgiving: 11,
      'Holiday Season': 12,
    };

    return holidayMonths[holiday] === month;
  }

  async run(args) {
    const command = args[0];
    const currentQuarter = this.getCurrentQuarter();

    switch (command) {
      case 'quarterly':
        const quarter = args[1] ? parseInt(args[1]) : currentQuarter.quarter;
        const year = args[2] ? parseInt(args[2]) : currentQuarter.year;

        console.log(`📅 Generating Q${quarter} ${year} seasonal content plan...`);
        const plan = this.generateQuarterlyPlan(quarter, year);
        const planFile = this.saveQuarterlyPlan(quarter, year, plan);

        console.log(`✅ Quarterly plan saved to: ${planFile}`);
        console.log(`📊 ${plan.contentPlan.blogPosts.length} blog posts planned`);
        console.log(`🎯 ${plan.milestones.length} milestones set`);
        console.log(`⏰ ${plan.reminderSchedule.length} reminders scheduled`);

        break;

      case 'annual':
        const planYear = args[1] ? parseInt(args[1]) : currentQuarter.year;

        console.log(`📅 Generating ${planYear} annual content plan...`);
        const annualPlan = this.generateAnnualPlan(planYear);
        const annualPlanFile = this.saveAnnualPlan(planYear, annualPlan);

        console.log(`✅ Annual plan saved to: ${annualPlanFile}`);
        console.log(`📊 ${annualPlan.yearlyGoals.length} yearly goals set`);
        console.log(`📝 Content mix: ${JSON.stringify(annualPlan.contentMix)}`);

        break;

      case 'templates':
        console.log(`📝 Generating content templates...`);

        Object.keys(CONTENT_TEMPLATES).forEach(contentType => {
          const templateFile = this.saveContentTemplate(contentType);
          console.log(`✅ ${contentType} template saved to: ${templateFile}`);
        });

        break;

      case 'calendar':
        const calYear = args[1] ? parseInt(args[1]) : currentQuarter.year;

        console.log(`📅 Generating ${calYear} content calendar...`);
        const calendar = this.createContentCalendar(calYear);
        const calendarFile = path.join(this.planningDir, `${calYear}-content-calendar.json`);
        fs.writeFileSync(calendarFile, JSON.stringify(calendar, null, 2));

        console.log(`✅ Content calendar saved to: ${calendarFile}`);
        console.log(`📊 ${calendar.length} months planned`);

        // Display calendar
        console.log('\n📆 Upcoming Content Calendar:');
        calendar.forEach(month => {
          console.log(`\n${month.month} ${month.year} (${month.theme})`);
          month.suggestedContent.forEach(content => {
            console.log(
              `  📝 Week ${content.targetWeek}: ${content.title} (${content.priority} priority)`
            );
          });
          if (month.holidays.length > 0) {
            console.log(`  🎉 Holidays: ${month.holidays.join(', ')}`);
          }
        });

        break;

      case 'current':
        console.log(`📅 Current Season: Q${currentQuarter.quarter} ${currentQuarter.year}`);
        console.log(`🎯 Theme: ${SEASONAL_THEMES[`Q${currentQuarter.quarter}`].name}`);
        console.log(
          `📋 Focus Areas: ${SEASONAL_THEMES[`Q${currentQuarter.quarter}`].focus.join(', ')}`
        );

        // Generate current quarter plan
        const currentPlan = this.generateQuarterlyPlan(currentQuarter.quarter, currentQuarter.year);
        console.log(`\n📊 Planned Content:`);
        currentPlan.contentPlan.blogPosts.forEach((post, index) => {
          console.log(`  ${index + 1}. ${post.title} (${post.targetDate})`);
        });

        console.log(`\n🎯 Upcoming Milestones:`);
        currentPlan.milestones.slice(0, 3).forEach(milestone => {
          console.log(`  📅 ${milestone.date}: ${milestone.title}`);
        });

        break;

      default:
        console.log(`🎯 Seasonal Content Planner`);
        console.log(`\nUsage: node seasonal-content-planner.mjs <command> [options]`);
        console.log(`\nCommands:`);
        console.log(`  quarterly [quarter] [year]  Generate quarterly content plan`);
        console.log(`  annual [year]              Generate annual content plan`);
        console.log(`  templates                   Generate content templates`);
        console.log(`  calendar [year]             Generate content calendar`);
        console.log(`  current                     Show current seasonal focus`);
        console.log(`\nExamples:`);
        console.log(`  node seasonal-content-planner.mjs quarterly`);
        console.log(`  node seasonal-content-planner.mjs quarterly 2 2026`);
        console.log(`  node seasonal-content-planner.mjs annual 2026`);
        console.log(`  node seasonal-content-planner.mjs calendar`);
        console.log(`  node seasonal-content-planner.mjs current`);
        break;
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const planner = new SeasonalContentPlanner();
  planner.run(process.argv.slice(2)).catch(console.error);
}

export default SeasonalContentPlanner;
