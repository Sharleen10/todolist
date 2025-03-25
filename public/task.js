class Task {
    constructor() {
      this.tasks = [];
      this.lastId = 0;
    }
  
    getAllTasks() {
      return Promise.resolve(this.tasks);
    }
  
    getTaskById(id) {
      const task = this.tasks.find(task => task.id === id);
      return Promise.resolve(task || null);
    }
  
    getTasksByProject(project) {
      const filteredTasks = this.tasks.filter(task => task.project === project);
      return Promise.resolve(filteredTasks);
    }
  
    getTasksByLabel(label) {
      const filteredTasks = this.tasks.filter(task => 
        task.labels && task.labels.includes(label)
      );
      return Promise.resolve(filteredTasks);
    }
  
    getTasksByPriority(priority) {
      const filteredTasks = this.tasks.filter(task => task.priority === priority);
      return Promise.resolve(filteredTasks);
    }
  
    addTask(taskData) {
      this.lastId++;
      const newTask = {
        id: this.lastId,
        title: taskData.title,
        description: taskData.description || '',
        dueDate: taskData.dueDate || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: false,
        priority: taskData.priority || 'medium',
        project: taskData.project || 'default',
        section: taskData.section || null,
        labels: taskData.labels || [],
        subtasks: taskData.subtasks || [],
        isRecurring: taskData.isRecurring || false,
        recurringPattern: taskData.recurringPattern || null,
        reminders: taskData.reminders || []
      };
      
      this.tasks.push(newTask);
      return Promise.resolve(newTask);
    }
  
    updateTask(id, updates) {
      const index = this.tasks.findIndex(task => task.id === id);
      if (index === -1) {
        return Promise.reject(new Error('Task not found'));
      }
  
      const updatedTask = {
        ...this.tasks[index],
        ...updates,
        updatedAt: new Date()
      };
      
      this.tasks[index] = updatedTask;
      return Promise.resolve(updatedTask);
    }
  
    deleteTask(id) {
      const index = this.tasks.findIndex(task => task.id === id);
      if (index === -1) {
        return Promise.reject(new Error('Task not found'));
      }
      
      const deletedTask = this.tasks[index];
      this.tasks.splice(index, 1);
      return Promise.resolve(deletedTask);
    }
  
    completeTask(id) {
      return this.updateTask(id, { completed: true });
    }
  
    addSubtask(taskId, subtaskData) {
      const task = this.tasks.find(task => task.id === taskId);
      if (!task) {
        return Promise.reject(new Error('Task not found'));
      }
      
      const subtask = {
        id: Date.now(),
        title: subtaskData.title,
        completed: false,
        createdAt: new Date()
      };
      
      task.subtasks.push(subtask);
      return this.updateTask(taskId, { subtasks: task.subtasks });
    }
  }
  
  module.exports = new Task();