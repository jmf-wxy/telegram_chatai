const nodeCron = require('node-cron');

class Scheduler {
  constructor(bot) {
    this.bot = bot;
    this.tasks = new Map(); // taskId -> { job, userId }
  }

  // 每天早上 8 点提醒 (根据用户时区? 这里简单使用服务器时间)
  scheduleMorningReminder(userId, time = '0 8 * * *') {
    const job = nodeCron.schedule(time, async () => {
      try {
        await this.bot.sendMessage(userId, '☀️ Good morning! Ready to start your day?');
      } catch (error) {
        console.error(`Failed to send morning reminder to ${userId}:`, error);
      }
    });

    const taskId = `morning_${userId}_${Date.now()}`;
    this.tasks.set(taskId, { job, userId, type: 'morning' });
    return taskId;
  }

  // 自定义定时任务
  scheduleTask(userId, cronExpression, message) {
    const job = nodeCron.schedule(cronExpression, async () => {
      try {
        await this.bot.sendMessage(userId, message);
      } catch (error) {
        console.error(`Failed to send scheduled task to ${userId}:`, error);
      }
    });

    const taskId = `custom_${userId}_${Date.now()}`;
    this.tasks.set(taskId, { job, userId, type: 'custom', expression: cronExpression, message });
    return taskId;
  }

  // 取消任务
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.job.stop();
      this.tasks.delete(taskId);
      return true;
    }
    return false;
  }

  // 获取用户的所有任务ID
  getUserTasks(userId) {
    const userTasks = [];
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.userId === userId) {
        userTasks.push(taskId);
      }
    }
    return userTasks;
  }

  // 取消用户的所有任务
  cancelAllUserTasks(userId) {
    const userTasks = this.getUserTasks(userId);
    userTasks.forEach(taskId => this.cancelTask(taskId));
    return userTasks.length;
  }
}

module.exports = Scheduler;
