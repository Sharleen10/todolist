document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const tasksContainer = document.getElementById('tasks-container');
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskModal = document.getElementById('task-modal');
  const closeModal = document.querySelector('.close-modal');
  const taskForm = document.getElementById('task-form');
  const deleteTaskBtn = document.getElementById('delete-task-btn');
  const addProjectBtn = document.getElementById('add-project-btn');
  const addLabelBtn = document.getElementById('add-label-btn');
  const projectsList = document.getElementById('projects-list');
  const labelsList = document.getElementById('labels-list');
  const sortSelect = document.getElementById('sort-select');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const currentViewTitle = document.getElementById('current-view-title');
  const navLinks = document.querySelectorAll('.sidebar nav ul li a');
  
  // Form elements
  const taskIdInput = document.getElementById('task-id');
  const taskTitleInput = document.getElementById('task-title');
  const taskDescriptionInput = document.getElementById('task-description');
  const taskDueDateInput = document.getElementById('task-due-date');
  const taskPrioritySelect = document.getElementById('task-priority');
  const taskProjectSelect = document.getElementById('task-project');
  const taskSectionInput = document.getElementById('task-section');
  const taskLabelsInput = document.getElementById('task-labels');
  const taskRecurringCheckbox = document.getElementById('task-recurring');
  const recurringOptions = document.getElementById('recurring-options');
  const recurringTypeSelect = document.getElementById('recurring-type');
  const customRecurringDiv = document.getElementById('custom-recurring');
  const customRecurringPattern = document.getElementById('custom-recurring-pattern');
  const remindersContainer = document.getElementById('reminders-container');
  const addReminderBtn = document.getElementById('add-reminder-btn');
  const subtasksContainer = document.getElementById('subtasks-container');
  const subtasksList = document.getElementById('subtasks-list');
  const subtaskInput = document.querySelector('.subtask-input');
  const addSubtaskBtn = document.querySelector('.add-subtask-btn');
  
  // State variables
  let tasks = [];
  let projects = ['Work', 'Personal', 'Shopping'];
  let labels = ['Important', 'Urgent', 'Home', 'Email', 'Meeting'];
  let currentView = 'all';
  let currentSort = 'dueDate';
  let subtasks = [];
  let reminders = [];
  
  // Initialize the app
  initApp();
  
  // Event Listeners
  addTaskBtn.addEventListener('click', openAddTaskModal);
  closeModal.addEventListener('click', closeTaskModal);
  taskForm.addEventListener('submit', handleTaskFormSubmit);
  deleteTaskBtn.addEventListener('click', handleDeleteTask);
  addProjectBtn.addEventListener('click', addNewProject);
  addLabelBtn.addEventListener('click', addNewLabel);
  sortSelect.addEventListener('change', handleSortChange);
  searchBtn.addEventListener('click', handleSearch);
  taskRecurringCheckbox.addEventListener('change', (e) => {
    recurringOptions.classList.toggle('hidden', !e.target.checked);
  });

  recurringTypeSelect.addEventListener('change', (e) => {
    customRecurringDiv.classList.toggle('hidden', e.target.value !== 'custom');
  });

  // Add Reminder Functionality
  addReminderBtn.addEventListener('click', addReminderInput);

  // Add Subtask Functionality
  addSubtaskBtn.addEventListener('click', addSubtaskInput);
  subtaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addSubtaskInput();
    }
  });

  // Navigation Event Listeners
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = e.target.getAttribute('data-view');
      updateCurrentView(view);
    });
  });

  // Initialize Application
  function initApp() {
    // Populate projects dropdown
    populateProjects();
    
    // Populate labels
    populateLabels();
    
    // Fetch and display tasks
    fetchTasks();
    
    // Set up initial view
    updateCurrentView('all');
  }

  // Populate Projects Dropdown and Sidebar
  function populateProjects() {
    taskProjectSelect.innerHTML = '';
    projectsList.innerHTML = '';

    projects.forEach(project => {
      // Project dropdown
      const option = document.createElement('option');
      option.value = project;
      option.textContent = project;
      taskProjectSelect.appendChild(option);

      // Sidebar projects list
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = project;
      a.setAttribute('data-view', `project-${project.toLowerCase()}`);
      li.appendChild(a);
      projectsList.appendChild(li);

      // Add click event to project sidebar links
      a.addEventListener('click', (e) => {
        e.preventDefault();
        updateCurrentView(`project-${project.toLowerCase()}`);
      });
    });
  }

  // Populate Labels List
  function populateLabels() {
    labelsList.innerHTML = '';

    labels.forEach(label => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = label;
      a.setAttribute('data-view', `label-${label.toLowerCase()}`);
      li.appendChild(a);
      labelsList.appendChild(li);

      // Add click event to label sidebar links
      a.addEventListener('click', (e) => {
        e.preventDefault();
        updateCurrentView(`label-${label.toLowerCase()}`);
      });
    });
  }

  // Add New Project
  function addNewProject() {
    const projectName = prompt('Enter new project name:');
    if (projectName && !projects.includes(projectName)) {
      projects.push(projectName);
      populateProjects();
    }
  }

  // Add New Label
  function addNewLabel() {
    const labelName = prompt('Enter new label name:');
    if (labelName && !labels.includes(labelName)) {
      labels.push(labelName);
      populateLabels();
    }
  }

  // Fetch Tasks from API
  async function fetchTasks() {
    try {
      const response = await fetch('http://localhost:3000/api/task'); // Use the backend server URL
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      tasks = await response.json();
      renderTasks();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Failed to load tasks. Please try again.');
    }
  }

  // Render Tasks Based on Current View
  function renderTasks() {
    tasksContainer.innerHTML = '';
    let filteredTasks = filterTasksByView(tasks);
    
    // Sort tasks
    filteredTasks = sortTasks(filteredTasks);

    filteredTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      tasksContainer.appendChild(taskElement);
    });
  }

  // Filter Tasks Based on Current View
  function filterTasksByView(taskList) {
    switch(currentView) {
      case 'all':
        return taskList;
      case 'today':
        return taskList.filter(task => isToday(new Date(task.dueDate)));
      case 'upcoming':
        return taskList.filter(task => isUpcoming(new Date(task.dueDate)));
      case 'important':
        return taskList.filter(task => task.priority === 'high' || task.priority === 'urgent');
      case 'completed':
        return taskList.filter(task => task.completed);
      default:
        // Handle project and label views
        if (currentView.startsWith('project-')) {
          const project = currentView.replace('project-', '');
          return taskList.filter(task => task.project.toLowerCase() === project);
        }
        if (currentView.startsWith('label-')) {
          const label = currentView.replace('label-', '');
          return taskList.filter(task => 
            task.labels && 
            task.labels.some(t => t.toLowerCase() === label)
          );
        }
        return taskList;
    }
  }

  // Sort Tasks
  function sortTasks(taskList) {
    return taskList.sort((a, b) => {
      switch(currentSort) {
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority':
          const priorityOrder = {
            'urgent': 4, 
            'high': 3, 
            'medium': 2, 
            'low': 1
          };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }

  // Create Task Element
  function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.classList.add('task-item', `priority-${task.priority}`);
    
    if (task.completed) {
      taskItem.classList.add('task-completed');
    }

    taskItem.innerHTML = `
      <div class="task-checkbox">
        <input 
          type="checkbox" 
          ${task.completed ? 'checked' : ''} 
          data-task-id="${task.id}"
        >
      </div>
      <div class="task-content">
        <div class="task-title">${task.title}</div>
        <div class="task-details">
          ${task.dueDate ? `
            <div class="task-date">
              <i class="fas fa-calendar"></i>
              ${formatDate(new Date(task.dueDate))}
            </div>
          ` : ''}
          ${task.project ? `
            <div class="task-project">
              <i class="fas fa-folder"></i>
              ${task.project}
            </div>
          ` : ''}
          <div class="task-priority">
            <i class="fas fa-flag"></i>
            ${task.priority}
          </div>
        </div>
        ${task.labels ? `
          <div class="task-labels">
            ${task.labels.map(label => `
              <span class="task-label">${label}</span>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="task-actions">
        <button class="edit-task" data-task-id="${task.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-task" data-task-id="${task.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // Add event listeners to task elements
    const checkbox = taskItem.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', handleTaskCompletion);

    const editBtn = taskItem.querySelector('.edit-task');
    editBtn.addEventListener('click', openEditTaskModal);

    const deleteBtn = taskItem.querySelector('.delete-task');
    deleteBtn.addEventListener('click', handleDeleteTask);

    return taskItem;
  }

  // Open Add Task Modal
  function openAddTaskModal() {
    // Reset form
    taskForm.reset();
    taskIdInput.value = '';
    deleteTaskBtn.classList.add('hidden');
    currentView = 'all';
    subtasks = [];
    reminders = [];
    subtasksList.innerHTML = '';
    
    // Open modal
    taskModal.style.display = 'block';
  }

  // Open Edit Task Modal
  function openEditTaskModal(e) {
    const taskId = parseInt(e.target.getAttribute('data-task-id'));
    const task = tasks.find(t => t.id === taskId);

    if (task) {
      // Populate form with task data
      taskIdInput.value = task.id;
      taskTitleInput.value = task.title;
      taskDescriptionInput.value = task.description || '';
      taskDueDateInput.value = task.dueDate ? 
        new Date(task.dueDate).toISOString().slice(0,16) : '';
      taskPrioritySelect.value = task.priority || 'medium';
      taskProjectSelect.value = task.project || 'default';
      taskSectionInput.value = task.section || '';
      taskLabelsInput.value = task.labels ? task.labels.join(', ') : '';
      
      // Handle recurring tasks
      taskRecurringCheckbox.checked = task.isRecurring || false;
      recurringOptions.classList.toggle('hidden', !task.isRecurring);
      
      if (task.isRecurring) {
        recurringTypeSelect.value = task.recurringPattern || 'daily';
        customRecurringDiv.classList.toggle('hidden', 
          recurringTypeSelect.value !== 'custom');
      }

      // Populate subtasks
      subtasksList.innerHTML = '';
      subtasks = task.subtasks || [];
      subtasks.forEach(renderSubtask);

      // Show delete button
      deleteTaskBtn.classList.remove('hidden');
      deleteTaskBtn.setAttribute('data-task-id', task.id);

      // Open modal
      taskModal.style.display = 'block';
    }
  }

  // Render Subtask
  function renderSubtask(subtask) {
    const li = document.createElement('li');
    li.classList.add('subtask-item');
    li.innerHTML = `
      <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
      <span>${subtask.title}</span>
      <button>&times;</button>
    `;
    subtasksList.appendChild(li);
  }

  // Add Subtask Input
  function addSubtaskInput() {
    const subtaskText = subtaskInput.value.trim();
    if (subtaskText) {
      const newSubtask = {
        id: Date.now(),
        title: subtaskText,
        completed: false
      };
      subtasks.push(newSubtask);
      renderSubtask(newSubtask);
      subtaskInput.value = '';
    }
  }

  // Add Reminder Input
  function addReminderInput() {
    const reminderInput = document.createElement('div');
    reminderInput.classList.add('reminder-input');
    reminderInput.innerHTML = `
      <input type="datetime-local" class="reminder-time">
      <select class="reminder-type">
        <option value="notification">Notification</option>
        <option value="email">Email</option>
      </select>
      <button type="button" class="remove-reminder">&times;</button>
    `;
    
    const removeBtn = reminderInput.querySelector('.remove-reminder');
    removeBtn.addEventListener('click', () => {
      reminderInput.remove();
    });

    remindersContainer.insertBefore(reminderInput, addReminderBtn);
  }

  // Handle Task Form Submit
  async function handleTaskFormSubmit(e) {
    e.preventDefault();

    // Collect form data
    const taskData = {
      title: taskTitleInput.value,
      description: taskDescriptionInput.value,
      dueDate: taskDueDateInput.value,
      priority: taskPrioritySelect.value,
      project: taskProjectSelect.value,
      section: taskSectionInput.value,
      labels: taskLabelsInput.value 
        ? taskLabelsInput.value.split(',').map(l => l.trim()) 
        : [],
      isRecurring: taskRecurringCheckbox.checked,
      recurringPattern: taskRecurringCheckbox.checked 
        ? recurringTypeSelect.value : null,
      subtasks: subtasks,
      reminders: Array.from(document.querySelectorAll('.reminder-input'))
        .map(reminderEl => ({
          time: reminderEl.querySelector('.reminder-time').value,
          type: reminderEl.querySelector('.reminder-type').value
        }))
    };

    try {
      let response;
      if (taskIdInput.value) {
        // Update existing task
        const taskId = parseInt(taskIdInput.value);
        response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
      } else {
        // Create new task
        response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
      }

      if (response.ok) {
        closeTaskModal();
        fetchTasks(); // Refresh tasks list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert(error.message);
    }
  }

  // Handle Task Completion
  async function handleTaskCompletion(e) {
    const taskId = parseInt(e.target.getAttribute('data-task-id'));
    const isCompleted = e.target.checked;

    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local task list
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          task.completed = isCompleted;
          renderTasks();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert(error.message);
      e.target.checked = !isCompleted; // Revert checkbox
    }
  }

  // Handle Task Deletion
  async function handleDeleteTask(e) {
    const taskId = parseInt(e.target.getAttribute('data-task-id') || 
      taskIdInput.value);

    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          closeTaskModal();
          fetchTasks(); // Refresh tasks list
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete task');
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        alert(error.message);
      }
    }
  }

  // Update Current View
  function updateCurrentView(view) {
    currentView = view;
    currentViewTitle.textContent = view.charAt(0).toUpperCase() + view.slice(1).replace(/[-_]/g, ' ');
    renderTasks();
  }

  // Handle Sort Change
  function handleSortChange(e) {
    currentSort = e.target.value;
    renderTasks();
  }

  // Handle Search
  function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      const searchResults = tasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm)) ||
        (task.labels && task.labels.some(label => 
          label.toLowerCase().includes(searchTerm))) ||
        task.project.toLowerCase().includes(searchTerm)
      );
      
      tasksContainer.innerHTML = '';
      searchResults.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksContainer.appendChild(taskElement);
      });
      
      currentViewTitle.textContent = `Search Results for "${searchTerm}"`;
    } else {
      renderTasks();
    }
  }

  // Close Task Modal
  function closeTaskModal() {
    taskModal.style.display = 'none';
  }

  // Utility Functions
  function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  function isUpcoming(date) {
    const today = new Date();
    const upcoming = new Date(today);
    upcoming.setDate(today.getDate() + 7);
    return date > today && date <= upcoming;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  // Handle window click to close modal
  window.addEventListener('click', (e) => {
    if (e.target === taskModal) {
      closeTaskModal();
    }
  });
});
