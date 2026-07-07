const form = document.getElementById('task-form');
const taskNameInput = document.getElementById('task-name');
const taskCategoryInput = document.getElementById('task-category');
const taskEstimateInput = document.getElementById('task-estimate');
const taskUnitInput = document.getElementById('task-unit');
const taskList = document.getElementById('task-list');
const prediction = document.getElementById('prediction');
const stats = document.getElementById('stats');

const UNIT_TO_MINUTES = {
  minutes: 1,
  hours: 60,
  days: 1440
};

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function formatTime(minutes) {
  const rounded = Math.round(minutes);

  if (rounded < 60) {
    return rounded + ' min';
  }

  if (rounded < 1440) {
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return mins > 0 ? hours + 'h ' + mins + 'm' : hours + 'h';
  }

  const days = Math.floor(rounded / 1440);
  const hours = Math.round((rounded % 1440) / 60);
  return hours > 0 ? days + 'd ' + hours + 'h' : days + 'd';
}

function calculateMultiplier(categoryFilter) {
  let completed = tasks.filter(function (t) {
    return t.actualMinutes !== undefined && t.estimateMinutes > 0;
  });

  if (categoryFilter) {
    completed = completed.filter(function (t) {
      return t.category === categoryFilter;
    });
  }

  completed = completed.slice(-8);

  if (completed.length === 0) {
    return null;
  }

  const totalRatio = completed.reduce(function (sum, t) {
    return sum + (t.actualMinutes / t.estimateMinutes);
  }, 0);

  return totalRatio / completed.length;
}

function renderStats() {
  const multiplier = calculateMultiplier(null);

  if (multiplier === null) {
    stats.innerHTML = '<p class="stats-empty">Complete a few tasks to see your estimation pattern.</p>';
    return;
  }

  const percent = Math.round(Math.abs(multiplier - 1) * 100);
  const headline = multiplier >= 1
    ? 'On average, your tasks take ' + percent + '% longer than you plan.'
    : 'On average, your tasks take ' + percent + '% less time than you plan.';

  const sampleEstimate = 30;
  const sampleActual = Math.round(sampleEstimate * multiplier);

  let html = '<p class="stats-headline">' + headline + '</p>';
  html += '<p class="stats-example">Example: you estimate ' + formatTime(sampleEstimate) + ', it usually becomes ' + formatTime(sampleActual) + '.</p>';

  const categories = ['Study', 'Coding', 'Chores', 'Other'];
  let categoryHtml = '';

  categories.forEach(function (cat) {
    const catMultiplier = calculateMultiplier(cat);
    if (catMultiplier !== null) {
      const catPercent = Math.round((catMultiplier - 1) * 100);
      const sign = catPercent >= 0 ? '+' : '';
      categoryHtml += '<p class="category-stat">' + cat + ': ' + sign + catPercent + '%</p>';
    }
  });

  if (categoryHtml) {
    html += '<div class="category-breakdown">' + categoryHtml + '</div>';
  }

  stats.innerHTML = html;
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

    if (task.actualMinutes === undefined) {
      taskDiv.innerHTML = `
        <p class="task-name">${task.name}</p>
        <p class="task-estimate">${task.category} · Estimated: ${formatTime(task.estimateMinutes)}</p>
        <button onclick="markDone(${task.id})">Done</button>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
      `;
    } else {
      const gap = task.actualMinutes - task.estimateMinutes;
      const gapText = gap >= 0
        ? formatTime(gap) + ' over'
        : formatTime(Math.abs(gap)) + ' under';

      taskDiv.innerHTML = `
        <p class="task-name">${task.name}</p>
        <p class="task-estimate">${task.category} · Estimated: ${formatTime(task.estimateMinutes)} &nbsp;|&nbsp; Actual: ${formatTime(task.actualMinutes)}</p>
        <p class="task-gap">${gapText}</p>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
      `;
    }

    taskList.appendChild(taskDiv);
  });
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const unit = taskUnitInput.value;
  const rawEstimate = Number(taskEstimateInput.value);
  const estimateMinutes = rawEstimate * UNIT_TO_MINUTES[unit];

  const newTask = {
    id: Date.now(),
    name: taskNameInput.value,
    category: taskCategoryInput.value,
    estimateMinutes: estimateMinutes,
    startTime: Date.now()
  };

  tasks.push(newTask);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  renderTasks();
  form.reset();
  prediction.textContent = '';
});

function markDone(id) {
  const task = tasks.find(function (t) {
    return t.id === id;
  });

  const elapsedMs = Date.now() - task.startTime;
  task.actualMinutes = Math.round(elapsedMs / 60000);

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
  const rawEstimate = Number(taskEstimateInput.value);
  const unit = taskUnitInput.value;
  const estimateMinutes = rawEstimate * UNIT_TO_MINUTES[unit];
  const multiplier = calculateMultiplier(null);

  if (multiplier === null || isNaN(rawEstimate) || rawEstimate <= 0) {
    prediction.textContent = '';
    return;
  }

  const predictedMinutes = Math.round(estimateMinutes * multiplier);
  prediction.textContent = 'Based on your history, expect around ' + formatTime(predictedMinutes);
});

taskUnitInput.addEventListener('change', function () {
  taskEstimateInput.dispatchEvent(new Event('input'));
});

renderTasks();
renderStats();
