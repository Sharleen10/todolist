const express = require('express');
const router = express.Router();
const TaskModel = require('../models/Task');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await TaskModel.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const task = await TaskModel.getTaskById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Filter tasks by project, label, or priority
router.get('/filter/:type/:value', async (req, res) => {
  try {
    const { type, value } = req.params;
    let tasks = [];
    
    switch (type) {
      case 'project':
        tasks = await TaskModel.getTasksByProject(value);
        break;
      case 'label':
        tasks = await TaskModel.getTasksByLabel(value);
        break;
      case 'priority':
        tasks = await TaskModel.getTasksByPriority(value);
        break;
      default:
        return res.status(400).json({ error: 'Invalid filter type' });
    }
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const newTask = await TaskModel.addTask(req.body);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedTask = await TaskModel.updateTask(id, req.body);
    res.json(updatedTask);
  } catch (error) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await TaskModel.deleteTask(id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Mark task as complete
router.patch('/:id/complete', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const completedTask = await TaskModel.completeTask(id);
    res.json(completedTask);
  } catch (error) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Add subtask to a task
router.post('/:id/subtasks', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedTask = await TaskModel.addSubtask(id, req.body);
    res.status(201).json(updatedTask);
  } catch (error) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;