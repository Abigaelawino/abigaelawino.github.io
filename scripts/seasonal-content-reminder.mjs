#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

class SeasonalContentReminder {
  constructor() {
    this.planningDir = path.join(ROOT_DIR, 'content-planning');
    this.quarterlyPlansDir = path.join(this.planningDir, 'quarterly');
    this.remindersFile = path.join(this.planningDir, 'reminders.json');
    this.issuesDir = path.join(ROOT_DIR, '.github', 'ISSUE_TEMPLATE');
    this.dataDir = path.join(this.planningDir, 'data');

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.planningDir, this.quarterlyPlansDir, this.issuesDir, this.dataDir].forEach(dir => {
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

  getUpcomingReminders(daysAhead = 30) {
    const reminders = [];
    const now = this.getCurrentDate();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Load quarterly plans to extract reminders
    const quarterlyFiles = fs
      .readdirSync(this.quarterlyPlansDir)
      .filter(file => file.endsWith('.json'));

    quarterlyFiles.forEach(file => {
      const planData = JSON.parse(fs.readFileSync(path.join(this.quarterlyPlansDir, file), 'utf8'));

      if (planData.reminderSchedule) {
        planData.reminderSchedule.forEach(reminder => {
          const reminderDate = new Date(reminder.date);

          if (reminderDate >= now && reminderDate <= endDate) {
            reminders.push({
              ...reminder,
              quarter: planData.metadata.quarter,
              year: planData.metadata.year,
              theme: planData.metadata.theme,
              daysUntil: Math.ceil((reminderDate - now) / (1000 * 60 * 60 * 24)),
            });
          }
        });
      }
    });

    return reminders.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getOverdueReminders() {
    const reminders = [];
    const now = this.getCurrentDate();

    // Load quarterly plans to extract overdue reminders
    const quarterlyFiles = fs
      .readdirSync(this.quarterlyPlansDir)
      .filter(file => file.endsWith('.json'));

    quarterlyFiles.forEach(file => {
      const planData = JSON.parse(fs.readFileSync(path.join(this.quarterlyPlansDir, file), 'utf8'));

      if (planData.reminderSchedule) {
        planData.reminderSchedule.forEach(reminder => {
          const reminderDate = new Date(reminder.date);

          if (reminderDate < now) {
            reminders.push({
              ...reminder,
              quarter: planData.metadata.quarter,
              year: planData.metadata.year,
              theme: planData.metadata.theme,
              daysOverdue: Math.ceil((now - reminderDate) / (1000 * 60 * 60 * 24)),
            });
          }
        });
      }
    });

    return reminders.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  generateReminderMessage(reminder) {
    const urgency =
      reminder.daysUntil <= 7 ? '🔴 URGENT' : reminder.daysUntil <= 14 ? '🟡 SOON' : '🟢 UPCOMING';

    const message = {
      title: `${urgency} Content Reminder: ${reminder.title}`,
      body:
        `**${reminder.title}**\n\n` +
        `📅 **Date:** ${reminder.date}\n` +
        `🎯 **Theme:** Q${reminder.quarter} ${reminder.year} - ${reminder.theme}\n` +
        `⏰ **Timeline:** ${reminder.daysUntil ? `${reminder.daysUntil} days away` : `${reminder.daysOverdue} days overdue`}\n\n` +
        `**Description:**\n${reminder.description}\n\n` +
        `**Type:** ${reminder.type}\n\n` +
        `---\n\n` +
        `📋 **Action Items:**\n` +
        `□ Review content calendar for ${reminder.date}\n` +
        `□ Prepare content outline and resources\n` +
        `□ Schedule time for content creation\n` +
        `□ Set up publishing timeline\n\n` +
        `🔗 **Related Resources:**\n` +
        `- Content planning dashboard\n` +
        `- Content templates library\n` +
        `- SEO and content guidelines`,
      labels: this.getReminderLabels(reminder),
      priority: reminder.daysUntil <= 7 ? 'high' : reminder.daysUntil <= 14 ? 'medium' : 'low',
    };

    return message;
  }

  getReminderLabels(reminder) {
    const labels = ['content-reminder', reminder.type];

    if (reminder.daysUntil <= 7 || reminder.daysOverdue) {
      labels.push('urgent');
    } else if (reminder.daysUntil <= 14) {
      labels.push('soon');
    }

    labels.push(`q${reminder.quarter}`);
    labels.push(reminder.year.toString());

    return labels;
  }

  createGitHubIssue(reminder) {
    const message = this.generateReminderMessage(reminder);
    const issueNumber = this.getNextIssueNumber();

    const issue = {
      number: issueNumber,
      title: message.title,
      body: message.body,
      labels: message.labels,
      priority: message.priority,
      created: new Date().toISOString(),
      reminder: reminder,
      status: 'open',
    };

    // Save issue to data directory
    const issueFile = path.join(this.dataDir, `issue-${issueNumber}.json`);
    fs.writeFileSync(issueFile, JSON.stringify(issue, null, 2));

    return issue;
  }

  getNextIssueNumber() {
    const existingIssues = fs
      .readdirSync(this.dataDir)
      .filter(file => file.startsWith('issue-') && file.endsWith('.json'))
      .map(file => {
        const match = file.match(/issue-(\d+)\.json/);
        return match ? parseInt(match[1]) : 0;
      });

    return existingIssues.length > 0 ? Math.max(...existingIssues) + 1 : 1;
  }

  getActiveIssues() {
    const issues = [];

    if (!fs.existsSync(this.dataDir)) {
      return issues;
    }

    const issueFiles = fs
      .readdirSync(this.dataDir)
      .filter(file => file.startsWith('issue-') && file.endsWith('.json'));

    issueFiles.forEach(file => {
      const issueData = JSON.parse(fs.readFileSync(path.join(this.dataDir, file), 'utf8'));
      if (issueData.status === 'open') {
        issues.push(issueData);
      }
    });

    return issues.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority] || 3;
      const bPriority = priorityOrder[b.priority] || 3;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return new Date(a.reminder.date) - new Date(b.reminder.date);
    });
  }

  generateWeeklyDigest() {
    const now = this.getCurrentDate();
    const upcoming = this.getUpcomingReminders(14);
    const overdue = this.getOverdueReminders();
    const activeIssues = this.getActiveIssues();

    const digest = {
      generated: now.toISOString(),
      summary: {
        upcomingReminders: upcoming.length,
        overdueReminders: overdue.length,
        activeIssues: activeIssues.length,
        highPriorityItems: activeIssues.filter(issue => issue.priority === 'high').length,
      },
      currentSeason: this.getCurrentQuarter(),
      upcomingReminders: upcoming.slice(0, 5), // Show next 5 reminders
      overdueReminders: overdue.slice(0, 3), // Show up to 3 overdue items
      activeIssues: activeIssues.slice(0, 10), // Show top 10 issues
      recommendations: this.generateRecommendations(upcoming, overdue, activeIssues),
    };

    return digest;
  }

  generateRecommendations(upcoming, overdue, activeIssues) {
    const recommendations = [];

    // Overdue items recommendations
    if (overdue.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Address Overdue Content',
        description: `${overdue.length} content reminders are overdue. Focus on completing these first.`,
        action: 'Review overdue items and reschedule or complete immediately.',
      });
    }

    // Upcoming urgent items
    const urgentUpcoming = upcoming.filter(r => r.daysUntil <= 7);
    if (urgentUpcoming.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Upcoming Urgent Deadlines',
        description: `${urgentUpcoming.length} content items are due within 7 days.`,
        action: 'Start working on urgent items to meet deadlines.',
      });
    }

    // High priority issues
    const highPriorityIssues = activeIssues.filter(issue => issue.priority === 'high');
    if (highPriorityIssues.length > 5) {
      recommendations.push({
        priority: 'medium',
        title: 'High Priority Issue Volume',
        description: `${highPriorityIssues.length} high priority issues may be overwhelming.`,
        action: 'Consider batching similar tasks or delegating if possible.',
      });
    }

    // Content planning recommendations
    if (upcoming.length > 10) {
      recommendations.push({
        priority: 'low',
        title: 'Content Pipeline Health',
        description: 'Content pipeline is well-stocked with upcoming items.',
        action: 'Maintain current pace and focus on quality over quantity.',
      });
    } else if (upcoming.length < 3) {
      recommendations.push({
        priority: 'medium',
        title: 'Content Pipeline Low',
        description: 'Only a few content items planned for the near future.',
        action: 'Generate new content ideas and update the content calendar.',
      });
    }

    return recommendations;
  }

  saveWeeklyDigest(digest) {
    const filename = `weekly-digest-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.planningDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(digest, null, 2));
    return filepath;
  }

  createReminderNotifications() {
    const upcoming = this.getUpcomingReminders(7); // Next 7 days
    const notifications = [];

    upcoming.forEach(reminder => {
      if (reminder.daysUntil <= 3) {
        // Only notify for items due within 3 days
        const notification = {
          type: 'content-reminder',
          urgency: reminder.daysUntil <= 1 ? 'critical' : 'urgent',
          reminder: reminder,
          message: this.generateReminderMessage(reminder),
          created: new Date().toISOString(),
        };

        notifications.push(notification);
      }
    });

    return notifications;
  }

  sendNotification(notification) {
    // In a real implementation, this would send to email, Slack, etc.
    // For now, we'll save to a notifications log
    const notificationsFile = path.join(this.planningDir, 'notifications.json');
    let notifications = [];

    if (fs.existsSync(notificationsFile)) {
      notifications = JSON.parse(fs.readFileSync(notificationsFile, 'utf8'));
    }

    notifications.push(notification);

    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications = notifications.slice(-100);
    }

    fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2));

    console.log(`🔔 Notification sent: ${notification.message.title}`);
  }

  async run(args) {
    const command = args[0];

    switch (command) {
      case 'check':
        console.log(`🔍 Checking for upcoming content reminders...`);

        const upcoming = this.getUpcomingReminders();
        const overdue = this.getOverdueReminders();

        console.log(`\n📅 Upcoming Reminders (next 30 days):`);
        if (upcoming.length === 0) {
          console.log('  ✅ No upcoming reminders');
        } else {
          upcoming.forEach(reminder => {
            const daysText = reminder.daysUntil === 1 ? '1 day' : `${reminder.daysUntil} days`;
            console.log(`  📋 ${reminder.date}: ${reminder.title} (${daysText} away)`);
          });
        }

        console.log(`\n⚠️  Overdue Reminders:`);
        if (overdue.length === 0) {
          console.log('  ✅ No overdue reminders');
        } else {
          overdue.forEach(reminder => {
            const daysText = reminder.daysOverdue === 1 ? '1 day' : `${reminder.daysOverdue} days`;
            console.log(`  🚨 ${reminder.date}: ${reminder.title} (${daysText} overdue)`);
          });
        }

        break;

      case 'notify':
        console.log(`📢 Sending reminder notifications...`);

        const notifications = this.createReminderNotifications();

        if (notifications.length === 0) {
          console.log('  ✅ No notifications to send');
        } else {
          notifications.forEach(notification => {
            this.sendNotification(notification);
          });
          console.log(`  ✅ Sent ${notifications.length} notifications`);
        }

        break;

      case 'issues':
        console.log(`🎯 Managing GitHub issues for reminders...`);

        const urgentReminders = this.getUpcomingReminders(7);
        let createdIssues = 0;

        urgentReminders.forEach(reminder => {
          if (reminder.daysUntil <= 7) {
            // Check if issue already exists
            const existingIssues = this.getActiveIssues();
            const exists = existingIssues.some(
              issue =>
                issue.reminder.title === reminder.title && issue.reminder.date === reminder.date
            );

            if (!exists) {
              const issue = this.createGitHubIssue(reminder);
              console.log(`  📝 Created issue #${issue.number}: ${issue.title}`);
              createdIssues++;
            }
          }
        });

        console.log(`  ✅ Created ${createdIssues} new issues`);
        console.log(`  📊 Total active issues: ${this.getActiveIssues().length}`);

        break;

      case 'digest':
        console.log(`📊 Generating weekly content digest...`);

        const digest = this.generateWeeklyDigest();
        const digestFile = this.saveWeeklyDigest(digest);

        console.log(`  ✅ Digest saved to: ${digestFile}`);
        console.log(`\n📈 Summary:`);
        console.log(`  📅 Upcoming reminders: ${digest.summary.upcomingReminders}`);
        console.log(`  ⚠️  Overdue reminders: ${digest.summary.overdueReminders}`);
        console.log(`  🎯 Active issues: ${digest.summary.activeIssues}`);
        console.log(`  🔴 High priority items: ${digest.summary.highPriorityItems}`);

        console.log(`\n💡 Recommendations:`);
        digest.recommendations.forEach(rec => {
          const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
          console.log(`  ${priority} ${rec.title}`);
          console.log(`     ${rec.description}`);
        });

        break;

      case 'dashboard':
        console.log(`📊 Content Reminder Dashboard`);
        console.log(`===============================`);

        const currentDigest = this.generateWeeklyDigest();
        const activeIssues = this.getActiveIssues();
        const upcomingAll = this.getUpcomingReminders(30);

        // Current Season
        const current = this.getCurrentQuarter();
        console.log(`\n🎯 Current Season: Q${current.quarter} ${current.year}`);

        // Issue Status
        console.log(`\n📋 Active Issues (${activeIssues.length}):`);
        const highIssues = activeIssues.filter(i => i.priority === 'high');
        const mediumIssues = activeIssues.filter(i => i.priority === 'medium');
        const lowIssues = activeIssues.filter(i => i.priority === 'low');

        console.log(`  🔴 High Priority: ${highIssues.length}`);
        console.log(`  🟡 Medium Priority: ${mediumIssues.length}`);
        console.log(`  🟢 Low Priority: ${lowIssues.length}`);

        // Upcoming Timeline
        console.log(`\n📅 Upcoming Timeline:`);
        const nextWeek = upcomingAll.filter(r => r.daysUntil <= 7);
        const nextMonth = upcomingAll.filter(r => r.daysUntil > 7 && r.daysUntil <= 30);

        if (nextWeek.length > 0) {
          console.log(`  🔥 Next 7 Days:`);
          nextWeek.forEach(reminder => {
            console.log(`    ${reminder.date}: ${reminder.title}`);
          });
        }

        if (nextMonth.length > 0) {
          console.log(`  📅 Next 30 Days:`);
          nextMonth.forEach(reminder => {
            console.log(`    ${reminder.date}: ${reminder.title}`);
          });
        }

        break;

      default:
        console.log(`📢 Seasonal Content Reminder System`);
        console.log(`\nUsage: node seasonal-content-reminder.mjs <command>`);
        console.log(`\nCommands:`);
        console.log(`  check     Check for upcoming and overdue reminders`);
        console.log(`  notify    Send notifications for urgent reminders`);
        console.log(`  issues    Create GitHub issues for upcoming reminders`);
        console.log(`  digest    Generate weekly digest with recommendations`);
        console.log(`  dashboard Show reminder dashboard with status overview`);
        console.log(`\nExamples:`);
        console.log(`  node seasonal-content-reminder.mjs check`);
        console.log(`  node seasonal-content-reminder.mjs notify`);
        console.log(`  node seasonal-content-reminder.mjs digest`);
        break;
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const reminder = new SeasonalContentReminder();
  reminder.run(process.argv.slice(2)).catch(console.error);
}

export default SeasonalContentReminder;
