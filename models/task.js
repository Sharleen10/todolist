const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const reminderSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  method: { type: String, enum: ['email', 'notification'], default: 'notification' }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  project: { type: String, default: 'default' },
  section: { type: String },
  labels: { type: [String], default: [] },
  subtasks: { type: [subtaskSchema], default: [] },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String },
  reminders: { type: [reminderSchema], default: [] }
});

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;