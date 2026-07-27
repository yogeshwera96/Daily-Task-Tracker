import OpenAI from 'openai';
import { config } from '../config';
import prisma from '../config/database';
import logger from '../config/logger';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export class AiService {
  static async generateEodReport(
    userId: string,
    tasks: any[],
    userName: string,
    date: string
  ): Promise<string> {
    const startTime = Date.now();

    const taskSummary = tasks
      .map(
        (t) =>
          `- [${t.status}] ${t.title} (Priority: ${t.priority}, Hours: ${t.actualHours || t.estimatedHours || 'N/A'}h)${t.remarks ? ` — ${t.remarks}` : ''}${t.project ? ` [Project: ${t.project.name}]` : ''}`
      )
      .join('\n');

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
    const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED');

    const prompt = `You are a professional report writer. Generate a concise, well-structured End of Day (EOD) report.

Employee: ${userName}
Date: ${date}

Today's Tasks:
${taskSummary}

Summary:
- Completed: ${completedTasks.length} tasks
- In Progress: ${inProgressTasks.length} tasks
- Blocked: ${blockedTasks.length} tasks

Generate the report with these sections in Markdown:
1. **Summary** — A 2-3 sentence professional overview of the day's work
2. **Completed Work** — Bullet points of completed tasks with key details
3. **In Progress** — Tasks still being worked on with progress notes
4. **Blockers & Challenges** — Any blocking issues (or "None" if clear)
5. **Time Spent** — Total hours and breakdown
6. **Key Achievements** — Notable accomplishments
7. **Tomorrow's Plan** — Suggested priorities for next day based on remaining tasks

Write in professional business language. Be concise but thorough. Do not add fictional tasks.`;

    try {
      const completion = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical writer who creates professional EOD reports. Output clean Markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content || 'Failed to generate report.';
      const duration = Date.now() - startTime;

      // Log AI usage
      await prisma.aiLog.create({
        data: {
          userId,
          action: 'GENERATE_EOD',
          prompt: prompt.substring(0, 5000),
          response: response.substring(0, 5000),
          tokens: completion.usage?.total_tokens,
          model: config.openai.model,
          duration,
        },
      });

      return response;
    } catch (error: any) {
      logger.error('AI EOD generation failed:', error);
      // Fallback to template-based report
      return this.generateFallbackReport(userName, date, tasks, completedTasks, inProgressTasks, blockedTasks);
    }
  }

  static async rewriteProfessionally(userId: string, text: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'Rewrite the following text in clear, professional business language. Keep the same meaning but improve clarity and tone.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || text;

      await prisma.aiLog.create({
        data: {
          userId,
          action: 'REWRITE',
          prompt: text.substring(0, 5000),
          response: response.substring(0, 5000),
          model: config.openai.model,
        },
      });

      return response;
    } catch (error) {
      logger.error('AI rewrite failed:', error);
      return text;
    }
  }

  static async generateWeeklySummary(userId: string, tasks: any[], userName: string, dateRange: string): Promise<string> {
    try {
      const prompt = `Generate a professional weekly summary report for ${userName} (${dateRange}).

Tasks (${tasks.length} total):
${tasks.map((t) => `- [${t.status}] ${t.title} (${t.priority})`).join('\n')}

Include: overview, accomplishments, areas of focus, metrics, and next week priorities.`;

      const completion = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: 'You are a professional report writer. Output clean Markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content || 'Failed to generate summary.';

      await prisma.aiLog.create({
        data: { userId, action: 'WEEKLY_SUMMARY', prompt: prompt.substring(0, 5000), response: response.substring(0, 5000), model: config.openai.model },
      });

      return response;
    } catch (error) {
      logger.error('AI weekly summary failed:', error);
      return 'Weekly summary generation failed. Please try again.';
    }
  }

  private static generateFallbackReport(
    userName: string,
    date: string,
    allTasks: any[],
    completed: any[],
    inProgress: any[],
    blocked: any[]
  ): string {
    const totalHours = allTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    return `# EOD Report — ${userName}
**Date:** ${date}

## Summary
Worked on ${allTasks.length} tasks today, completing ${completed.length} of them. Total hours logged: ${totalHours}h.

## Completed Work
${completed.length > 0 ? completed.map((t) => `- ✅ ${t.title}${t.project ? ` (${t.project.name})` : ''}`).join('\n') : '- No tasks completed today'}

## In Progress
${inProgress.length > 0 ? inProgress.map((t) => `- 🔄 ${t.title}${t.project ? ` (${t.project.name})` : ''}`).join('\n') : '- No tasks in progress'}

## Blockers
${blocked.length > 0 ? blocked.map((t) => `- 🚫 ${t.title}: ${t.remarks || 'No details'}`).join('\n') : '- No blockers'}

## Time Spent
Total: ${totalHours} hours

---
*Auto-generated report (AI unavailable)*`;
  }
}
