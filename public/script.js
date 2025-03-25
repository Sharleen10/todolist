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
    
    /**
     * Initialize the application
     */
    const initApp = async () => {
      try {
        // Load tasks from the server
        await fetchTasks();
        
        // Set up event listeners
        setupEventListeners();
        
        // Render projects and labels
        renderProjects();
        renderLabels();
        
        // Initial render of tasks
        renderTasks();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        showNotification('Failed to load application data', 'error');
      }
    };
    
     /**
   * Set up all event listeners
   */
  const setupEventListeners = () => {
    // Task modal events
    addTaskBtn.addEventListener('click', openAddTaskModal);
    closeModal.addEventListener('click', closeTaskModal);
    taskForm.addEventListener('submit', handleTaskFormSubmit);
    deleteTaskBtn.addEventListener('click', handleDeleteTask);
    
    // Project and label events
    addProjectBtn.addEventListener('click', addNewProject);
    addLabelBtn.addEventListener('click', addNewLabel);
    
    // Sort and search events
    sortSelect.addEventListener('change', handleSortChange);
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
    
    // Navigation events
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = e.currentTarget.getAttribute('data-view');
        changeView(view);
      });
    });
    
    // Recurring task options
    taskRecurringCheckbox.addEventListener('change', toggleRecurringOptions);
    recurringTypeSelect.addEventListener('change', toggleCustomRecurring);
    
    // Subtasks and reminders
    addSubtaskBtn.addEventListener('click', addSubtask);
    subtaskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSubtask();
      }
    });
    addReminderBtn.addEventListener('click', addReminderField);
    
    // Window events
    window.addEventListener('click', (e) => {
      if (e.target === taskModal) closeTaskModal();
    });
    
    // Enable drag and drop for tasks
    enableDragAndDrop();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
  };
  
  /**
   * Fetch tasks from the server
   */
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      tasks = await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showNotification('Failed to load tasks', 'error');
      tasks = [];
    }
  };
  
  /**
   * Render the list of tasks based on current view and sort order
   */
  const renderTasks = () => {
    const filteredTasks = filterTasksByView(tasks, currentView);
    const sortedTasks = sortTasks(filteredTasks, currentSort);
    
    tasksContainer.innerHTML = '';
    
    if (sortedTasks.length === 0) {
      tasksContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle"></i>
          <p>No tasks found. Add a new task to get started!</p>
        </div>
      `;
      return;
    }
    
    // Group tasks by date if viewing by date
    if (currentView === 'today' || currentView === 'upcoming') {
      renderTasksByDate(sortedTasks);
    } else if (currentView.startsWith('project:')) {
      // Group tasks by section if viewing a project
      renderTasksBySection(sortedTasks);
    } else {
      // Default rendering
      sortedTasks.forEach(task => {
        tasksContainer.appendChild(createTaskElement(task));
      });
    }
  };
  
  /**
   * Filter tasks based on the current view
   */
  const filterTasksByView = (taskList, view) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    switch (view) {
      case 'all':
        return taskList;
      case 'today':
        return taskList.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      case 'upcoming':
        return taskList.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today && dueDate < nextWeek;
        });
      case 'important':
        return taskList.filter(task => 
          task.priority === 'high' || task.priority === 'urgent'
        );
      case 'completed':
        return taskList.filter(task => task.completed);
      default:
        if (view.startsWith('project:')) {
          const projectName = view.split(':')[1];
          return taskList.filter(task => task.project === projectName);
        } else if (view.startsWith('label:')) {
          const labelName = view.split(':')[1];
          return taskList.filter(task => 
            task.labels && task.labels.includes(labelName)
          );
        }
        return taskList;
    }
  };

    
  /**
   * Sort tasks based on the current sort order
   */
  const sortTasks = (taskList, sortBy) => {
    const sorted = [...taskList];
    
    switch (sortBy) {
      case 'dueDate':
        return sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return sorted.sort((a, b) => 
          priorityOrder[a.priority] - priorityOrder[b.priority]
        );
      case 'createdAt':
        return sorted.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      case 'title':
        return sorted.sort((a, b) => 
          a.title.localeCompare(b.title)
        );
      default:
        return sorted;
    }
  };
  
  /**
   * Group and render tasks by date
   */
  const renderTasksByDate = (sortedTasks) => {
    // Group tasks by date
    const tasksByDate = {};
    
    sortedTasks.forEach(task => {
      if (!task.dueDate) {
        if (!tasksByDate['No Date']) {
          tasksByDate['No Date'] = [];
        }
        tasksByDate['No Date'].push(task);
        return;
      }
      
      const dueDate = new Date(task.dueDate);
      const dateKey = dueDate.toDateString();
      
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    });
    
    // Create a header and task list for each date
    Object.keys(tasksByDate).forEach(dateKey => {
      // Create date header
      const dateHeader = document.createElement('div');
      dateHeader.className = 'date-header';
      
      if (dateKey === 'No Date') {
        dateHeader.textContent = 'No Due Date';
      } else {
        const date = new Date(dateKey);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
          dateHeader.textContent = 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
          dateHeader.textContent = 'Tomorrow';
        } else {
          dateHeader.textContent = formatDate(date);
        }
      }
      
      tasksContainer.appendChild(dateHeader);
      
      // Add tasks for this date
      tasksByDate[dateKey].forEach(task => {
        tasksContainer.appendChild(createTaskElement(task));
      });
    });
  };
  
  /**
   * Group and render tasks by section within a project
   */
  const renderTasksBySection = (sortedTasks) => {
    // Group tasks by section
    const tasksBySection = {};
    
    // Add "No Section" as default
    tasksBySection['No Section'] = [];
    
    sortedTasks.forEach(task => {
      if (!task.section) {
        tasksBySection['No Section'].push(task);
      } else {
        if (!tasksBySection[task.section]) {
          tasksBySection[task.section] = [];
        }
        tasksBySection[task.section].push(task);
      }
    });
    
    // Create a header and task list for each section
    Object.keys(tasksBySection).forEach(section => {
      if (tasksBySection[section].length === 0 && section === 'No Section') {
        return; // Skip empty "No Section"
      }
      
      // Create section header
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'section-header';
      sectionHeader.textContent = section;
      
      tasksContainer.appendChild(sectionHeader);
      
      // Add tasks for this section
      tasksBySection[section].forEach(task => {
        tasksContainer.appendChild(createTaskElement(task));
      });
    });
  };
   /**
   * Create a task element
   */
   const createTaskElement = (task) => {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item priority-${task.priority}`;
    taskElement.dataset.id = task.id;
    taskElement.draggable = true;
    
    if (task.completed) {
      taskElement.classList.add('task-completed');
    }
    
    // Format due date
    let dueDateText = 'No due date';
    let dueDateClass = '';
    
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if overdue
      if (dueDate < today && !task.completed) {
        dueDateClass = 'overdue';
      }
      
      if (dueDate.toDateString() === today.toDateString()) {
        dueDateText = `Today ${formatTime(dueDate)}`;
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        dueDateText = `Tomorrow ${formatTime(dueDate)}`;
      } else if (dueDate.toDateString() === yesterday.toDateString()) {
        dueDateText = `Yesterday ${formatTime(dueDate)}`;
      } else {
        dueDateText = `${formatDate(dueDate)} ${formatTime(dueDate)}`;
      }
    }
    
    // Create task HTML
    taskElement.innerHTML = `
      <div class="task-checkbox">
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
      </div>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-details">
          <span class="task-date ${dueDateClass}">
            <i class="far fa-calendar-alt"></i> ${dueDateText}
          </span>
          <span class="task-project">
            <i class="fas fa-folder"></i> ${escapeHtml(task.project)}
          </span>
          <span class="task-priority">
            <i class="fas fa-flag"></i> ${capitalizeFirstLetter(task.priority)}
          </span>
          ${task.isRecurring ? '<span class="task-recurring"><i class="fas fa-sync-alt"></i> Recurring</span>' : ''}
        </div>
        ${task.subtasks.length > 0 ? `<div class="task-subtasks-count"><i class="fas fa-tasks"></i> ${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length} subtasks</div>` : ''}
        <div class="task-labels">
          ${task.labels.map(label => `<span class="task-label">${escapeHtml(label)}</span>`).join('')}
        </div>
      </div>
      <div class="task-actions">
        <button class="edit-task-btn" title="Edit Task"><i class="fas fa-edit"></i></button>
        <button class="delete-task-btn" title="Delete Task"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    
    // Add event listeners
    taskElement.querySelector('.task-checkbox input').addEventListener('change', (e) => {
      toggleTaskCompletion(task.id, e.target.checked);
    });
    
    taskElement.querySelector('.edit-task-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditTaskModal(task);
    });
    
    taskElement.querySelector('.delete-task-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDeleteTask(task);
    });
    
    taskElement.addEventListener('click', () => {
      openEditTaskModal(task);
    });
    
    // Add drag and drop event listeners
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);
    
    return taskElement;
  };
  
  /**
   * Open modal to add a new task
   */
  const openAddTaskModal = () => {
    taskIdInput.value = '';
    taskForm.reset();
    deleteTaskBtn.classList.add('hidden');
    
    // Set default values
    taskProjectSelect.innerHTML = '';
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project;
      option.textContent = project;
      taskProjectSelect.appendChild(option);
    });
    
    // Add default option for new project
    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = '+ Add New Project';
    taskProjectSelect.appendChild(newOption);
    
    // Clear subtasks and reminders
    subtasks = [];
    reminders = [];
    subtasksList.innerHTML = '';
    
    // Reset recurring options
    recurringOptions.classList.add('hidden');
    customRecurringDiv.classList.add('hidden');
    
    // Clear reminders
    const reminderFields = remindersContainer.querySelectorAll('.reminder-field');
    reminderFields.forEach(field => field.remove());
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    taskDueDateInput.value = formatDateForInput(tomorrow);
    
    document.querySelector('.modal-content').scrollTop = 0;
    taskModal.style.display = 'block';
    taskTitleInput.focus();
  };
  
  /**
   * Open modal to edit an existing task
   */
  const openEditTaskModal = (task) => {
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description || '';
    taskDueDateInput.value = task.dueDate ? formatDateForInput(new Date(task.dueDate)) : '';
    taskPrioritySelect.value = task.priority;
    taskSectionInput.value = task.section || '';
    
    // Set project
    taskProjectSelect.innerHTML = '';
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project;
      option.textContent = project;
      if (project === task.project) {
        option.selected = true;
      }
      taskProjectSelect.appendChild(option);
    });
    
    // Add default option for new project
    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = '+ Add New Project';
    taskProjectSelect.appendChild(newOption);
    
    // Set labels
    taskLabelsInput.value = task.labels.join(', ');
    
    // Set recurring options
    taskRecurringCheckbox.checked = task.isRecurring;
    if (task.isRecurring) {
      recurringOptions.classList.remove('hidden');
      
      // Parse recurring pattern
      if (task.recurringPattern) {
        const pattern = task.recurringPattern;
        if (pattern === 'daily') {
          recurringTypeSelect.value = 'daily';
        } else if (pattern === 'weekly') {
          recurringTypeSelect.value = 'weekly';
        } else if (pattern === 'monthly') {
          recurringTypeSelect.value = 'monthly';
        } else {
          recurringTypeSelect.value = 'custom';
          customRecurringDiv.classList.remove('hidden');
          customRecurringPattern.value = pattern;
        }
      }
    } else {
      recurringOptions.classList.add('hidden');
      customRecurringDiv.classList.add('hidden');
    }
    
    // Set subtasks
    subtasks = [...task.subtasks];
    renderSubtasks();
    
    // Set reminders
    reminders = [...(task.reminders || [])];
    renderReminders();
    
    // Show delete button
    deleteTaskBtn.classList.remove('hidden');
    
    document.querySelector('.modal-content').scrollTop = 0;
    taskModal.style.display = 'block';
    taskTitleInput.focus();
  };
  
  /**
   * Close the task modal
   */
  const closeTaskModal = () => {
    taskModal.style.display = 'none';
  };
  
  /**
   * Handle task form submission
   */
  const handleTaskFormSubmit = async (e) => {
    e.preventDefault();
    
    const taskId = taskIdInput.value;
    const isNewTask = !taskId;
    
    // Check if project is new
    if (taskProjectSelect.value === 'new') {
      const newProject = prompt('Enter new project name:');
      if (newProject && newProject.trim()) {
        addProject(newProject.trim());
        taskProjectSelect.value = newProject.trim();
      } else {
        taskProjectSelect.value = 'default';
      }
    }
    
    // Get labels
    const labelInput = taskLabelsInput.value;
    const labelList = labelInput ? labelInput.split(',').map(label => label.trim()) : [];
    
    // Add any new labels to our list
    labelList.forEach(label => {
      if (label && !labels.includes(label)) {
        addLabel(label);
      }
    });
    
    // Get recurring pattern
    let recurringPattern = null;
    if (taskRecurringCheckbox.checked) {
      if (recurringTypeSelect.value === 'custom') {
        recurringPattern = customRecurringPattern.value;
      } else {
        recurringPattern = recurringTypeSelect.value;
      }
    }
    
    const taskData = {
      title: taskTitleInput.value,
      description: taskDescriptionInput.value,
      dueDate: taskDueDateInput.value || null,
      priority: taskPrioritySelect.value,
      project: taskProjectSelect.value,
      section: taskSectionInput.value || null,
      labels: labelList,
      isRecurring: taskRecurringCheckbox.checked,
      recurringPattern,
      subtasks,
      reminders
    };
    
    try {
      let updatedTask;
      
      if (isNewTask) {
        // Add new task
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        updatedTask = await response.json();
        tasks.push(updatedTask);
        showNotification('Task added successfully', 'success');
      } else {
        // Update existing task
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        updatedTask = await response.json();
        
        // Update task in local array
        const index = tasks.findIndex(t => t.id === parseInt(taskId));
        if (index !== -1) {
          tasks[index] = updatedTask;
        }
        
        showNotification('Task updated successfully', 'success');
      }
      
      closeTaskModal();
      renderTasks();
      renderProjects();
      renderLabels();
      scheduleReminders(updatedTask);
      
    } catch (error) {
      console.error('Error saving task:', error);
      showNotification('Failed to save task', 'error');
    }
  };
  
  /**
   * Toggle task completion status
   */
  const toggleTaskCompletion = async (taskId, completed) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedTask = await response.json();
      
      // Update task in local array
      const index = tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks[index] = updatedTask;
      }
      
      renderTasks();
      
      if (completed) {
        showNotification('Task completed', 'success');
        
        // If recurring, create next occurrence
        if (updatedTask.isRecurring) {
          createNextRecurringTask(updatedTask);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showNotification('Failed to update task', 'error');
    }
  };
  
  /**
   * Create the next occurrence of a recurring task
   */
  const createNextRecurringTask = async (completedTask) => {
    try {
      // Calculate next due date based on recurring pattern
      const nextDueDate = calculateNextDueDate(completedTask.dueDate, completedTask.recurringPattern);
      
      if (!nextDueDate) return;
      
      // Create a new task based on the completed one
      const newTaskData = {
        title: completedTask.title,
        description: completedTask.description,
        dueDate: formatDateForInput(nextDueDate),
        priority: completedTask.priority,
        project: completedTask.project,
        section: completedTask.section,
        labels: completedTask.labels,
        isRecurring: true,
        recurringPattern: completedTask.recurringPattern,
        subtasks: completedTask.subtasks.map(st => ({
          title: st.title,
          completed: false
        })),
        reminders: completedTask.reminders
      };
      
      // Add new recurring task
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTaskData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newTask = await response.json();
      tasks.push(newTask);
      renderTasks();
      scheduleReminders(newTask);
      
      showNotification('Created next recurring task', 'info');
    } catch (error) {
      console.error('Error creating recurring task:', error);
      showNotification('Failed to create next recurring task', 'error');
    }
  };
  
  /**
   * Calculate next due date for recurring task
   */
  const calculateNextDueDate = (dueDateStr, pattern) => {
    if (!dueDateStr) return null;
    
    const dueDate = new Date(dueDateStr);
    let nextDate = new Date(dueDate);
    
    if (pattern === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (pattern === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (pattern === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (pattern.startsWith('Every')) {
      // Parse custom patterns like "Every 3 days" or "Every 2 weeks"
      const parts = pattern.split(' ');
      if (parts.length === 3) {
        const num = parseInt(parts[1]);
        const unit = parts[2].toLowerCase();
        
        if (!isNaN(num)) {
          if (unit.startsWith('day')) {
            nextDate.setDate(nextDate.getDate() + num);
          } else if (unit.startsWith('week')) {
            nextDate.setDate(nextDate.getDate() + (num * 7));
          } else if (unit.startsWith('month')) {
            nextDate.setMonth(nextDate.getMonth() + num);
          }
        }
      }
    }
    
    return nextDate;
  };
  
  /**
   * Schedule reminders for a task
   */
  const scheduleReminders = (task) => {
    if (!task.dueDate || !task.reminders || task.reminders.length === 0) {
      return;
    }
    
    // Clear any existing reminders for this task
    if (window.taskReminders) {
      const taskRemindersToKeep = window.taskReminders.filter(r => r.taskId !== task.id);
      window.taskReminders = taskRemindersToKeep;
    } else {
      window.taskReminders = [];
    }
    
    const dueDate = new Date(task.dueDate);
    
    // Schedule each reminder
    task.reminders.forEach(reminder => {
      const reminderTime = new Date(dueDate);
      
      // Calculate reminder time based on value and unit
      if (reminder.unit === 'minutes') {
        reminderTime.setMinutes(reminderTime.getMinutes() - reminder.value);
      } else if (reminder.unit === 'hours') {
        reminderTime.setHours(reminderTime.getHours() - reminder.value);
      } else if (reminder.unit === 'days') {
        reminderTime.setDate(reminderTime.getDate() - reminder.value);
      }
      
      // Only schedule if it's in the future
      const now = new Date();
      if (reminderTime > now) {
        const timeoutId = setTimeout(() => {
          if (!task.completed) {
            showTaskReminder(task, reminder);
          }
        }, reminderTime - now);
        
        // Store reminder info for cleanup
        window.taskReminders.push({
          taskId: task.id,
          timeoutId: timeoutId
        });
      }
    });
  };
   /**
   * Show a task reminder notification
   */
   const showTaskReminder = (task, reminder) => {
    // Create notification
    const notification = new Notification(`Reminder: ${task.title}`, {
      body: `Due ${reminder.value} ${reminder.unit} from now`,
      icon: '/path/to/notification-icon.png'
    });

    // Optional: Play a sound for the reminder
    const reminderSound = new Audio('/path/to/reminder-sound.mp3');
    reminderSound.play();

    // Add click event to notification to open task details
    notification.onclick = () => {
      openEditTaskModal(task);
      notification.close();
    };
  };

  /**
   * Handle task deletion with confirmation
   */
  const confirmDeleteTask = (task) => {
    const confirmDelete = confirm(`Are you sure you want to delete the task "${task.title}"?`);
    if (confirmDelete) {
      handleDeleteTask(task.id);
    }
  };

  /**
   * Delete a task
   */
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove task from local array
      tasks = tasks.filter(t => t.id !== taskId);

      // Re-render tasks
      renderTasks();
      renderProjects();
      renderLabels();

      showNotification('Task deleted successfully', 'info');
      closeTaskModal();
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification('Failed to delete task', 'error');
    }
  };

  /**
   * Add a new project
   */
  const addProject = (projectName) => {
    if (!projects.includes(projectName)) {
      projects.push(projectName);
      renderProjects();
      showNotification(`Project "${projectName}" added`, 'success');
    }
  };

  /**
   * Handle adding a new project
   */
  const addNewProject = () => {
    const newProject = prompt('Enter new project name:');
    if (newProject && newProject.trim()) {
      addProject(newProject.trim());
      // Update project select in task modal
      taskProjectSelect.innerHTML = '';
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        taskProjectSelect.appendChild(option);
      });
      
      // Add new project option
      const newOption = document.createElement('option');
      newOption.value = 'new';
      newOption.textContent = '+ Add New Project';
      taskProjectSelect.appendChild(newOption);
    }
  };

  /**
   * Add a new label
   */
  const addLabel = (labelName) => {
    if (!labels.includes(labelName)) {
      labels.push(labelName);
      renderLabels();
      showNotification(`Label "${labelName}" added`, 'success');
    }
  };

  /**
   * Handle adding a new label
   */
  const addNewLabel = () => {
    const newLabel = prompt('Enter new label name:');
    if (newLabel && newLabel.trim()) {
      addLabel(newLabel.trim());
    }
  };

  /**
   * Render projects in the sidebar
   */
  const renderProjects = () => {
    projectsList.innerHTML = '';
    projects.forEach(project => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = project;
      a.dataset.view = `project:${project}`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        changeView(`project:${project}`);
      });
      li.appendChild(a);
      projectsList.appendChild(li);
    });
  };

  /**
   * Render labels in the sidebar
   */
  const renderLabels = () => {
    labelsList.innerHTML = '';
    labels.forEach(label => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = label;
      a.dataset.view = `label:${label}`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        changeView(`label:${label}`);
      });
      li.appendChild(a);
      labelsList.appendChild(li);
    });
  };

  /**
   * Change the current view of tasks
   */
  const changeView = (view) => {
    currentView = view;
    
    // Update current view title
    if (view.startsWith('project:')) {
      currentViewTitle.textContent = view.split(':')[1];
    } else if (view.startsWith('label:')) {
      currentViewTitle.textContent = view.split(':')[1];
    } else {
      currentViewTitle.textContent = capitalizeFirstLetter(view);
    }
    
    renderTasks();
  };

  /**
   * Handle sort change
   */
  const handleSortChange = () => {
    currentSort = sortSelect.value;
    renderTasks();
  };

  /**
   * Handle search functionality
   */
  const handleSearch = () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Perform search on tasks
    const filteredTasks = tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm) ||
      (task.description && task.description.toLowerCase().includes(searchTerm)) ||
      task.project.toLowerCase().includes(searchTerm) ||
      task.labels.some(label => label.toLowerCase().includes(searchTerm))
    );
    
    // Temporarily replace tasks array with search results
    const originalTasks = tasks;
    tasks = filteredTasks;
    renderTasks();
    
    // Restore original tasks
    tasks = originalTasks;
  };

  /**
   * Add subtask to current task
   */
  const addSubtask = () => {
    const subtaskTitle = subtaskInput.value.trim();
    if (subtaskTitle) {
      subtasks.push({
        title: subtaskTitle,
        completed: false
      });
      subtaskInput.value = '';
      renderSubtasks();
    }
  };

  /**
   * Render subtasks list
   */
  const renderSubtasks = () => {
    subtasksList.innerHTML = '';
    subtasks.forEach((subtask, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
               onchange="this.closest('li').querySelector('.subtask-title').classList.toggle('completed')">
        <span class="subtask-title ${subtask.completed ? 'completed' : ''}">${escapeHtml(subtask.title)}</span>
        <button class="delete-subtask-btn" onclick="deleteSubtask(${index})">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      subtasksList.appendChild(li);
    });
  };

  /**
   * Delete a subtask
   */
  const deleteSubtask = (index) => {
    subtasks.splice(index, 1);
    renderSubtasks();
  };

  /**
   * Add reminder field to task
   */
  const addReminderField = () => {
    const reminderField = document.createElement('div');
    reminderField.className = 'reminder-field';
    reminderField.innerHTML = `
      <input type="number" class="reminder-value" placeholder="Value" min="1">
      <select class="reminder-unit">
        <option value="minutes">Minutes</option>
        <option value="hours">Hours</option>
        <option value="days">Days</option>
      </select>
      <button class="delete-reminder-btn" onclick="this.closest('.reminder-field').remove()">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;
    remindersContainer.appendChild(reminderField);
  };

  /**
   * Render reminders list from saved reminders
   */
  const renderReminders = () => {
    // Clear existing reminder fields
    const existingFields = remindersContainer.querySelectorAll('.reminder-field');
    existingFields.forEach(field => field.remove());

    // Add reminder fields for saved reminders
    reminders.forEach(reminder => {
      const reminderField = document.createElement('div');
      reminderField.className = 'reminder-field';
      reminderField.innerHTML = `
        <input type="number" class="reminder-value" placeholder="Value" 
               min="1" value="${reminder.value}">
        <select class="reminder-unit">
          <option value="minutes" ${reminder.unit === 'minutes' ? 'selected' : ''}>Minutes</option>
          <option value="hours" ${reminder.unit === 'hours' ? 'selected' : ''}>Hours</option>
          <option value="days" ${reminder.unit === 'days' ? 'selected' : ''}>Days</option>
        </select>
        <button class="delete-reminder-btn" onclick="this.closest('.reminder-field').remove()">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      remindersContainer.appendChild(reminderField);
    });
  };

  /**
   * Collect reminders from reminder fields
   */
  const collectReminders = () => {
    const reminderFields = remindersContainer.querySelectorAll('.reminder-field');
    reminders = Array.from(reminderFields).map(field => {
      const valueInput = field.querySelector('.reminder-value');
      const unitSelect = field.querySelector('.reminder-unit');
      return {
        value: parseInt(valueInput.value),
        unit: unitSelect.value
      };
    }).filter(reminder => reminder.value && reminder.unit);
  };

  /**
   * Toggle recurring options visibility
   */
  const toggleRecurringOptions = () => {
    if (taskRecurringCheckbox.checked) {
      recurringOptions.classList.remove('hidden');
    } else {
      recurringOptions.classList.add('hidden');
      customRecurringDiv.classList.add('hidden');
    }
  };

  /**
   * Toggle custom recurring option visibility
   */
  const toggleCustomRecurring = () => {
    if (recurringTypeSelect.value === 'custom') {
      customRecurringDiv.classList.remove('hidden');
    } else {
      customRecurringDiv.classList.add('hidden');
    }
  };

  /**
   * Enable drag and drop for tasks
   */
  const enableDragAndDrop = () => {
    const taskContainer = document.getElementById('tasks-container');

    // Drag start handler
    const handleDragStart = (e) => {
      e.dataTransfer.setData('text/plain', e.target.dataset.id);
      e.target.classList.add('dragging');
    };

    // Drag end handler
    const handleDragEnd = (e) => {
      e.target.classList.remove('dragging');
    };

    // Drag over handler
    const handleDragOver = (e) => {
      e.preventDefault();
      const draggingItem = document.querySelector('.dragging');
      const afterElement = getDragAfterElement(taskContainer, e.clientY);
      
      if (afterElement == null) {
        taskContainer.appendChild(draggingItem);
      } else {
        taskContainer.insertBefore(draggingItem, afterElement);
      }
    };

    // Helper function to determine where to insert dragged item
    const getDragAfterElement = (container, y) => {
      const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    taskContainer.addEventListener('dragover', handleDragOver);
  };

  /**
   * Setup keyboard shortcuts
   */
  const setupKeyboardShortcuts = () => {
    document.addEventListener('keydown', (e) => {
      // Keyboard shortcut to add new task (Ctrl + N)
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openAddTaskModal();
      }

      // Keyboard shortcut to search (Ctrl + F)
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
      }

      // Escape key to close modal
      if (e.key === 'Escape') {
        closeTaskModal();
      }
    });
  };

  /**
   * Show notification
   */
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };

  /**
   * Utility functions
   */
  const escapeHtml = (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Initialize the application when the DOM is fully loaded
  initApp();
});