const form = document.getElementById('task-form');
const taskNameInput = document.getElementById('task-name');
const taskEstimateInput = document.getElementById('task-estimate');
const taskList = document.getElementById('task-list');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach(function (task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task';

    if (task.actual === undefined) {
      taskDiv.innerHTML = `
        <p class="task-name">${task.name}</p>
        <p class="task-estimate">Estimated: ${task.estimate} min</p>
        <button onclick="markDone(${task.id})">Done</button>
      `;
    } else {
      const gap = task.actual - task.estimate;
      const gapText = gap >= 0 ? `+${gap} min over` : `${Math.abs(gap)} min under`;

      taskDiv.innerHTML = `
        <p class="task-name">${task.name}</p>
        <p class="task-estimate">Estimated: ${task.estimate} min &nbsp;|&nbsp; Actual: ${task.actual} min</p>
        <p class="task-gap">${gapText}</p>
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
});

function markDone(id) {
  const actualInput = prompt('Actually how much time did it take?');

  if (actualInput === null || actualInput.trim() === '') {
    return; // Why 
  }

  const actual = Number(actualInput);

  if (isNaN(actual)) {
    alert('Add only minutes, example: 45');
    return;
  }

  const task = tasks.find(function (t) {
    return t.id === id;
  });

  task.actual = actual;

  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}

renderTasks();