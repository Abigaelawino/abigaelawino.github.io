#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

class SeasonalContentDashboard {
  constructor() {
    this.planningDir = path.join(ROOT_DIR, 'content-planning');
    this.quarterlyPlansDir = path.join(this.planningDir, 'quarterly');
    this.dataDir = path.join(this.planningDir, 'data');

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.planningDir, this.quarterlyPlansDir, this.dataDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  getCurrentDate() {
    return new Date();
  }

  getCurrentQuarter() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    const year = now.getFullYear();
    return { quarter, year, month };
  }

  loadQuarterlyPlans() {
    const plans = {};

    if (!fs.existsSync(this.quarterlyPlansDir)) {
      return plans;
    }

    const quarterlyFiles = fs
      .readdirSync(this.quarterlyPlansDir)
      .filter(file => file.endsWith('.json'));

    quarterlyFiles.forEach(file => {
      const planData = JSON.parse(fs.readFileSync(path.join(this.quarterlyPlansDir, file), 'utf8'));
      const key = `Q${planData.metadata.quarter}-${planData.metadata.year}`;
      plans[key] = planData;
    });

    return plans;
  }

  generateCalendarView(year, quarter = null) {
    const calendar = [];
    const months = quarter
      ? this.getQuarterMonths(quarter)
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const plans = this.loadQuarterlyPlans();

    months.forEach(month => {
      const monthDate = new Date(year, month - 1, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'long' });
      const monthQuarter = Math.ceil(month / 3);

      const monthData = {
        month: monthName,
        monthNumber: month,
        quarter: monthQuarter,
        year: year,
        theme: plans[`Q${monthQuarter}-${year}`]?.metadata?.theme || 'No theme set',
        weeks: this.generateWeekView(year, month, plans[`Q${monthQuarter}-${year}`]),
        holidays: this.getMonthHolidays(month),
        focus: plans[`Q${monthQuarter}-${year}`]?.metadata?.focus || [],
        contentStats: this.getMonthContentStats(year, month, plans[`Q${monthQuarter}-${year}`]),
      };

      calendar.push(monthData);
    });

    return calendar;
  }

  getQuarterMonths(quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    return [startMonth, startMonth + 1, startMonth + 2];
  }

  generateWeekView(year, month, plan) {
    const weeks = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    const startDayOfWeek = firstDay.getDay();
    let currentWeek = [];

    // Add empty days for the first week
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateString = date.toISOString().split('T')[0];

      currentWeek.push({
        day: day,
        date: dateString,
        isToday: this.isToday(date),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        content: this.getDayContent(dateString, plan),
        reminders: this.getDayReminders(dateString, plan),
        milestones: this.getDayMilestones(dateString, plan),
      });

      // Start new week if Sunday
      if (date.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining days to last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }

  isToday(date) {
    const today = this.getCurrentDate();
    return date.toDateString() === today.toDateString();
  }

  getDayContent(dateString, plan) {
    if (!plan || !plan.contentPlan) return [];

    const content = [];

    // Check blog posts
    if (plan.contentPlan.blogPosts) {
      plan.contentPlan.blogPosts.forEach(post => {
        if (post.targetDate === dateString) {
          content.push({
            type: 'blog',
            title: post.title,
            status: post.status,
            tags: post.tags,
            priority: 'high',
          });
        }
      });
    }

    // Check portfolio updates
    if (plan.contentPlan.portfolioUpdates) {
      Object.values(plan.contentPlan.portfolioUpdates).forEach(update => {
        if (update.targetDate === dateString) {
          content.push({
            type: 'portfolio',
            title: update.title,
            status: update.status,
            priority: 'medium',
          });
        }
      });
    }

    return content;
  }

  getDayReminders(dateString, plan) {
    if (!plan || !plan.reminderSchedule) return [];

    return plan.reminderSchedule.filter(reminder => reminder.date === dateString);
  }

  getDayMilestones(dateString, plan) {
    if (!plan || !plan.milestones) return [];

    return plan.milestones.filter(milestone => milestone.date === dateString);
  }

  getMonthHolidays(month) {
    const holidays = {
      1: ["New Year's Day"],
      2: ["Valentine's Day"],
      3: ["International Women's Day"],
      4: ['Earth Day'],
      5: ['Memorial Day'],
      6: ['Pride Month'],
      7: ['Independence Day'],
      9: ['Labor Day'],
      10: ['Halloween'],
      11: ['Thanksgiving'],
      12: ['Holiday Season'],
    };

    return holidays[month] || [];
  }

  getMonthContentStats(year, month, plan) {
    if (!plan) {
      return {
        planned: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
      };
    }

    const monthDate = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const monthStartString = monthDate.toISOString().split('T')[0];
    const monthEndString = monthEnd.toISOString().split('T')[0];

    let planned = 0;
    let completed = 0;
    let inProgress = 0;
    let overdue = 0;

    // Count blog posts
    if (plan.contentPlan.blogPosts) {
      plan.contentPlan.blogPosts.forEach(post => {
        if (post.targetDate >= monthStartString && post.targetDate <= monthEndString) {
          planned++;
          if (post.status === 'completed') completed++;
          else if (post.status === 'in-progress') inProgress++;
          else if (new Date(post.targetDate) < this.getCurrentDate()) overdue++;
        }
      });
    }

    // Count portfolio updates
    if (plan.contentPlan.portfolioUpdates) {
      Object.values(plan.contentPlan.portfolioUpdates).forEach(update => {
        if (update.targetDate >= monthStartString && update.targetDate <= monthEndString) {
          planned++;
          if (update.status === 'completed') completed++;
          else if (update.status === 'in-progress') inProgress++;
          else if (new Date(update.targetDate) < this.getCurrentDate()) overdue++;
        }
      });
    }

    return { planned, completed, inProgress, overdue };
  }

  generateQuarterlyOverview(quarter, year) {
    const planKey = `Q${quarter}-${year}`;
    const plans = this.loadQuarterlyPlans();
    const plan = plans[planKey];

    if (!plan) {
      return {
        error: `No plan found for Q${quarter} ${year}`,
        suggestion: 'Generate a quarterly plan first using the seasonal content planner',
      };
    }

    const now = this.getCurrentDate();
    const startDate = new Date(plan.metadata.dateRange.start);
    const endDate = new Date(plan.metadata.dateRange.end);
    const daysElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
    const daysTotal = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const progressPercentage = Math.min(100, Math.round((daysElapsed / daysTotal) * 100));

    const contentProgress = this.calculateContentProgress(plan);
    const milestoneProgress = this.calculateMilestoneProgress(plan);

    return {
      metadata: plan.metadata,
      progress: {
        timeProgress: progressPercentage,
        daysElapsed,
        daysTotal,
        daysRemaining: Math.max(0, daysTotal - daysElapsed),
      },
      contentProgress,
      milestoneProgress,
      upcomingMilestones: this.getUpcomingMilestones(plan),
      atRiskItems: this.getAtRiskItems(plan),
    };
  }

  calculateContentProgress(plan) {
    const content = [];

    // Process blog posts
    if (plan.contentPlan.blogPosts) {
      plan.contentPlan.blogPosts.forEach(post => {
        content.push({
          title: post.title,
          type: 'blog',
          targetDate: post.targetDate,
          status: post.status || 'planned',
          priority: 'high',
        });
      });
    }

    // Process portfolio updates
    if (plan.contentPlan.portfolioUpdates) {
      Object.values(plan.contentPlan.portfolioUpdates).forEach(update => {
        content.push({
          title: update.title,
          type: 'portfolio',
          targetDate: update.targetDate,
          status: update.status || 'planned',
          priority: 'medium',
        });
      });
    }

    const total = content.length;
    const completed = content.filter(item => item.status === 'completed').length;
    const inProgress = content.filter(item => item.status === 'in-progress').length;
    const overdue = content.filter(
      item => new Date(item.targetDate) < this.getCurrentDate() && item.status !== 'completed'
    ).length;

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      items: content.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate)),
    };
  }

  calculateMilestoneProgress(plan) {
    if (!plan.milestones) return { total: 0, completed: 0, upcoming: 0, overdue: 0 };

    const total = plan.milestones.length;
    const now = this.getCurrentDate();

    const completed = plan.milestones.filter(milestone => {
      // Assume milestones are completed if they're in the past
      return new Date(milestone.date) < now;
    }).length;

    const upcoming = plan.milestones.filter(milestone => {
      const milestoneDate = new Date(milestone.date);
      return (
        milestoneDate >= now && milestoneDate <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      );
    }).length;

    const overdue = plan.milestones.filter(milestone => {
      return new Date(milestone.date) < now && !milestone.completed;
    }).length;

    return {
      total,
      completed,
      upcoming,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      items: plan.milestones.sort((a, b) => new Date(a.date) - new Date(b.date)),
    };
  }

  getUpcomingMilestones(plan) {
    if (!plan.milestones) return [];

    const now = this.getCurrentDate();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return plan.milestones
      .filter(milestone => {
        const milestoneDate = new Date(milestone.date);
        return milestoneDate >= now && milestoneDate <= next30Days;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getAtRiskItems(plan) {
    const atRisk = [];
    const now = this.getCurrentDate();

    // Check overdue content
    if (plan.contentPlan.blogPosts) {
      plan.contentPlan.blogPosts.forEach(post => {
        if (new Date(post.targetDate) < now && post.status !== 'completed') {
          atRisk.push({
            type: 'content',
            title: post.title,
            reason: 'Overdue',
            severity: 'high',
            daysOverdue: Math.floor((now - new Date(post.targetDate)) / (1000 * 60 * 60 * 24)),
          });
        }
      });
    }

    // Check upcoming high-priority items
    if (plan.contentPlan.blogPosts) {
      plan.contentPlan.blogPosts.forEach(post => {
        const daysUntil = Math.floor((new Date(post.targetDate) - now) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 7 && daysUntil > 0 && post.status === 'planned') {
          atRisk.push({
            type: 'content',
            title: post.title,
            reason: 'Due soon',
            severity: 'medium',
            daysUntil,
          });
        }
      });
    }

    return atRisk.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  generateContentHeatmap(year) {
    const months = [];
    const plans = this.loadQuarterlyPlans();

    for (let month = 1; month <= 12; month++) {
      const monthQuarter = Math.ceil(month / 3);
      const plan = plans[`Q${monthQuarter}-${year}`];
      const stats = this.getMonthContentStats(year, month, plan);

      const intensity = stats.planned > 0 ? stats.completed / stats.planned : 0;
      const color = this.getHeatmapColor(intensity, stats.planned);

      months.push({
        month: new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }),
        planned: stats.planned,
        completed: stats.completed,
        inProgress: stats.inProgress,
        overdue: stats.overdue,
        intensity,
        color,
      });
    }

    return months;
  }

  getHeatmapColor(intensity, planned) {
    if (planned === 0) return 'grey';
    if (intensity >= 0.9) return 'green';
    if (intensity >= 0.7) return 'yellow';
    if (intensity >= 0.5) return 'orange';
    return 'red';
  }

  renderCalendar(calendar, month = null) {
    const displayMonths = month
      ? [calendar.find(m => m.monthNumber === month)]
      : calendar.slice(0, 3);

    displayMonths.forEach(monthData => {
      if (!monthData) return;

      console.log(`\n📅 ${monthData.month} ${monthData.year} (${monthData.theme})`);
      console.log('   Su  Mo  Tu  We  Th  Fr  Sa');

      monthData.weeks.forEach(week => {
        const weekString = week
          .map(day => {
            if (!day) return '    ';

            const dayString = day.day.toString().padStart(2, ' ');
            const prefix = this.getDayPrefix(day);

            if (day.isToday) {
              return `${prefix}[${dayString}]`;
            } else if (day.content.length > 0 || day.reminders.length > 0) {
              return `${prefix}*${dayString}*`;
            } else if (day.isWeekend) {
              return `${prefix}(${dayString})`;
            } else {
              return `${prefix} ${dayString} `;
            }
          })
          .join('');

        console.log(weekString);
      });

      // Show stats
      const stats = monthData.contentStats;
      console.log(
        `   📊 Planned: ${stats.planned} | ✅ Completed: ${stats.completed} | 🔄 In Progress: ${stats.inProgress} | ⚠️ Overdue: ${stats.overdue}`
      );

      // Show holidays
      if (monthData.holidays.length > 0) {
        console.log(`   🎉 Holidays: ${monthData.holidays.join(', ')}`);
      }
    });
  }

  getDayPrefix(day) {
    if (day.content.length > 0 && day.reminders.length > 0) return '🔔';
    if (day.content.length > 0) return '📝';
    if (day.reminders.length > 0) return '⏰';
    if (day.milestones.length > 0) return '🎯';
    return '  ';
  }

  renderQuarterlyOverview(overview) {
    if (overview.error) {
      console.log(`❌ ${overview.error}`);
      console.log(`💡 ${overview.suggestion}`);
      return;
    }

    console.log(
      `\n📊 Q${overview.metadata.quarter} ${overview.metadata.year} - ${overview.metadata.theme}`
    );
    console.log(`   ${overview.metadata.dateRange.start} to ${overview.metadata.dateRange.end}`);

    // Time progress
    const progressBar = this.generateProgressBar(overview.progress.timeProgress);
    console.log(`\n⏱️  Time Progress: ${progressBar} ${overview.progress.timeProgress}%`);
    console.log(
      `   Days Elapsed: ${overview.progress.daysElapsed} / ${overview.progress.daysTotal}`
    );
    console.log(`   Days Remaining: ${overview.progress.daysRemaining}`);

    // Content progress
    console.log(`\n📝 Content Progress:`);
    const contentProgressBar = this.generateProgressBar(overview.contentProgress.completionRate);
    console.log(`   ${contentProgressBar} ${overview.contentProgress.completionRate}% complete`);
    console.log(
      `   Total: ${overview.contentProgress.total} | Completed: ${overview.contentProgress.completed} | In Progress: ${overview.contentProgress.inProgress} | Overdue: ${overview.contentProgress.overdue}`
    );

    // Milestones
    console.log(`\n🎯 Milestone Progress:`);
    const milestoneProgressBar = this.generateProgressBar(
      overview.milestoneProgress.completionRate
    );
    console.log(
      `   ${milestoneProgressBar} ${overview.milestoneProgress.completionRate}% complete`
    );

    if (overview.upcomingMilestones.length > 0) {
      console.log(`   Upcoming milestones:`);
      overview.upcomingMilestones.forEach(milestone => {
        console.log(`     📅 ${milestone.date}: ${milestone.title}`);
      });
    }

    // At-risk items
    if (overview.atRiskItems.length > 0) {
      console.log(`\n⚠️  At-Risk Items:`);
      overview.atRiskItems.forEach(item => {
        const severity = item.severity === 'high' ? '🔴' : item.severity === 'medium' ? '🟡' : '🟢';
        console.log(`   ${severity} ${item.title} (${item.reason})`);
      });
    }
  }

  generateProgressBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  renderHeatmap(heatmap) {
    console.log(`\n🔥 Content Completion Heatmap`);
    console.log(`   ${heatmap.map(m => m.month.padStart(3, ' ')).join(' ')}`);
    console.log(`   ${heatmap.map(m => m.color.padStart(3, ' ')).join(' ')}`);

    console.log(`\n🎨 Legend:`);
    console.log(`   🟩 90-100% completion`);
    console.log(`   🟨 70-89% completion`);
    console.log(`   🟧 50-69% completion`);
    console.log(`   🟥 <50% completion`);
    console.log(`   ⬜ No content planned`);

    console.log(`\n📊 Monthly Breakdown:`);
    heatmap.forEach(month => {
      const completion =
        month.planned > 0 ? Math.round((month.completed / month.planned) * 100) : 0;
      console.log(`   ${month.month}: ${month.completed}/${month.planned} (${completion}%)`);
    });
  }

  async run(args) {
    const command = args[0];
    const current = this.getCurrentQuarter();

    switch (command) {
      case 'calendar':
        const calYear = args[1] ? parseInt(args[1]) : current.year;
        const calMonth = args[2] ? parseInt(args[2]) : null;

        console.log(`📅 Content Calendar for ${calYear}`);
        const calendar = this.generateCalendarView(
          calYear,
          calMonth ? Math.ceil(calMonth / 3) : null
        );
        this.renderCalendar(calendar, calMonth);

        break;

      case 'quarter':
        const quarter = args[1] ? parseInt(args[1]) : current.quarter;
        const year = args[2] ? parseInt(args[2]) : current.year;

        const overview = this.generateQuarterlyOverview(quarter, year);
        this.renderQuarterlyOverview(overview);

        break;

      case 'heatmap':
        const heatmapYear = args[1] ? parseInt(args[1]) : current.year;

        const heatmap = this.generateContentHeatmap(heatmapYear);
        this.renderHeatmap(heatmap);

        break;

      case 'dashboard':
        console.log(`📊 Seasonal Content Dashboard`);
        console.log(`===============================`);

        // Current quarter overview
        const currentOverview = this.generateQuarterlyOverview(current.quarter, current.year);
        this.renderQuarterlyOverview(currentOverview);

        // Recent content heatmap
        const recentHeatmap = this.generateContentHeatmap(current.year);
        this.renderHeatmap(recentHeatmap);

        break;

      default:
        console.log(`📊 Seasonal Content Dashboard`);
        console.log(`\nUsage: node seasonal-content-dashboard.mjs <command> [options]`);
        console.log(`\nCommands:`);
        console.log(`  calendar [year] [month]    Show calendar view`);
        console.log(`  quarter [quarter] [year]   Show quarterly overview`);
        console.log(`  heatmap [year]             Show content completion heatmap`);
        console.log(`  dashboard                   Show full dashboard`);
        console.log(`\nExamples:`);
        console.log(`  node seasonal-content-dashboard.mjs calendar`);
        console.log(`  node seasonal-content-dashboard.mjs calendar 2026 2`);
        console.log(`  node seasonal-content-dashboard.mjs quarter 1 2026`);
        console.log(`  node seasonal-content-dashboard.mjs heatmap 2026`);
        console.log(`  node seasonal-content-dashboard.mjs dashboard`);
        break;
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const dashboard = new SeasonalContentDashboard();
  dashboard.run(process.argv.slice(2)).catch(console.error);
}

export default SeasonalContentDashboard;
