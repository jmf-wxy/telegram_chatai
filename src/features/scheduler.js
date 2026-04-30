const nodeCron = require('node-cron');
const logger = require('../utils/logger');

class Scheduler {
  constructor(bot) {
    this.bot = bot;
    this.tasks = new Map();
  }

  scheduleMorningReminder(userId, time = '0 8 * * *') {
    const job = nodeCron.schedule(time, async () => {
      try {
        await this.bot.sendMessage(userId, '☀️ Good morning! Ready to start your day?');
      } catch (error) {
        logger.error(`Failed to send morning reminder to ${userId}:`, { error: error.message });
      }
    });

    const taskId = `morning_${userId}_${Date.now()}`;
    this.tasks.set(taskId, { job, userId, type: 'morning' });
    return taskId;
  }

  scheduleTask(userId, cronExpression, message, isOnce = false) {
    const taskId = `custom_${userId}_${Date.now()}`;
    let job;

    if (isOnce) {
      job = nodeCron.schedule(cronExpression, async () => {
        try {
          await this.bot.sendMessage(userId, message);
        } catch (error) {
          logger.error(`Failed to send scheduled task to ${userId}:`, { error: error.message });
        } finally {
          this.cancelTask(taskId);
        }
      });
      this.tasks.set(taskId, { job, userId, type: 'once', expression: cronExpression, message });
    } else {
      job = nodeCron.schedule(cronExpression, async () => {
        try {
          await this.bot.sendMessage(userId, message);
        } catch (error) {
          logger.error(`Failed to send scheduled task to ${userId}:`, { error: error.message });
        }
      });
      this.tasks.set(taskId, { job, userId, type: 'custom', expression: cronExpression, message });
    }

    return taskId;
  }

  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.job.stop();
      this.tasks.delete(taskId);
      return true;
    }
    return false;
  }

  getUserTasks(userId) {
    const userTasks = [];
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.userId === userId) {
        userTasks.push(taskId);
      }
    }
    return userTasks;
  }

  cancelAllUserTasks(userId) {
    const userTasks = this.getUserTasks(userId);
    userTasks.forEach(taskId => this.cancelTask(taskId));
    return userTasks.length;
  }
}

module.exports = Scheduler;
