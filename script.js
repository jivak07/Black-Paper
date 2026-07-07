const form = document.getElementById('task-form');
const taskNameInput = document.getElementById('task-name');
const taskEstimateInput = document.getElementById('task-estimate');
const taskList = document.getElementById('task-list');
const prediction = document.getElementById('prediction');
const stats = document.getElementById('stats');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function calculateMultiplier() {
  const completed = tasks.filter(function (t) {
    return t.actual !== undefined && t.estimate > 0;
  });

  if (completed.length === 0) {
    return null;
  }

  const totalRatio = completed.reduce(function (sum, t) {
    return sum + (t.actual / t.estimate);
  }, 0);

  return totalRatio / completed.length;
}

function renderStats() {
  const multiplier = calculateMultiplier();

  if (multiplier === null) {
    stats.innerHTML = '<p class="stats-empty">Complete a few tasks to see your bias multiplier.</p>';
  } else {
    stats.innerHTML = `<p class="stats-multiplier">Your Bias Multiplier: ${multiplier.toFixed(2)}x</p>`;
  }
}

function renderTasks() {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = '<p class="task-empty">No tasks yet. Add one above to get started.</p>';
    return;
  }

  tasks.forEach(function (task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task';

    if (task.actual === undefined) {
      taskDiv.innerHTML = `
        <p class="task-name">${task.name}</p>
        <p class="task-estimate">Estimated: ${task.estimate} min</p>
        <button onclick="markDone(${task.id})">Done</button>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
      `;
    } else {
      const gap = task.actual - task.estimate;
      const gapText = gap >= 0 ? `+${gap} min over` : `${Math.abs(gap)} min under`;

      taskDiv.innerHTML = `
        <p class="task-name">${task.name}</p>
        <p class="task-estimate">Estimated: ${task.estimate} min &nbsp;|&nbsp; Actual: ${task.actual} min</p>
        <p class="task-gap">${gapText}</p>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
      `;
    }

    taskList.appendChild(taskDiv);
  });
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const newTask = {
    id: Date.now(),
    name: taskNameInput.value,
    estimate: taskEstimateInput.value
  };

  tasks.push(newTask);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  renderTasks();
  form.reset();
  prediction.textContent = '';
});

function markDone(id) {
  const actualInput = prompt('How many minutes did it actually take?');

  if (actualInput === null || actualInput.trim() === '') {
    return;
  }

  const actual = Number(actualInput);

  if (isNaN(actual)) {
    alert('Please enter a number, like 45');
    return;
  }

  const task = tasks.find(function (t) {
    return t.id === id;
  });

  task.actual = actual;

  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
  renderStats();
}

function deleteTask(id) {
  tasks = tasks.filter(function (t) {
    return t.id !== id;
  });

  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
  renderStats();
}

taskEstimateInput.addEventListener('input', function () {
  const estimate = Number(taskEstimateInput.value);
  const multiplier = calculateMultiplier();

  if (multiplier === null || isNaN(estimate) || estimate <= 0) {
    prediction.textContent = '';
    return;
  }

  const predicted = Math.round(estimate * multiplier);
  prediction.textContent = `Based on your history, expect around ${predicted} min`;
});

renderTasks();
renderStats();
