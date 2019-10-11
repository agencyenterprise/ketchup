import * as vscode from 'vscode';

const SECONDS_PER_MINUTE = 60;
const DEFAULT_BREAK_SECONDS = 5 * SECONDS_PER_MINUTE;
const DEFAULT_WORK_SECONDS = 25 * SECONDS_PER_MINUTE;
const DEFAULT_LONG_BREAK = 15 * SECONDS_PER_MINUTE;
const DEFAULT_LONG_BREAK_INTERVAL = 4;

enum TaskStatus {
  Break,
  Work,
}

enum TimerStatus {
  Paused,
  Stopped,
  Running,
}

const breakSeconds = DEFAULT_BREAK_SECONDS;
const workSeconds = DEFAULT_WORK_SECONDS;
const longBreak = DEFAULT_LONG_BREAK;
const longBreakIntervals = DEFAULT_LONG_BREAK_INTERVAL;

let statusBarItem: vscode.StatusBarItem;
let taskStatus: TaskStatus = TaskStatus.Work;
let timerStatus: TimerStatus = TimerStatus.Stopped;
let clock = 0;
let countWorkTimes = 0;

const runClock = () => {
  if (timerStatus !== TimerStatus.Running || clock < 1) {
    return;
  }
  clock--;
  changeTaskStatus();
  updateStatusBarItem();
  setTimeout(runClock, 1000);
};

const taskStatusName = () => {
  return clock === 0 && timerStatus === TimerStatus.Stopped
    ? 'ketchup'
    : taskStatus === TaskStatus.Work
    ? 'work'
    : 'break';
};

const changeTaskStatus = () => {
  if (clock > 0) {
    return;
  }
  if (taskStatus === TaskStatus.Work) {
    countWorkTimes++;
    return starBreak();
  }
  startWork();
};

const getRunningIcon = (): string => {
  if (taskStatus === TaskStatus.Work) {
    return '💻';
  }
  return '☕️';
};

const getIcon = (): string => {
  if (timerStatus === TimerStatus.Stopped) {
    return '🍅';
  }
  if (timerStatus === TimerStatus.Paused) {
    return '⏸';
  }

  return getRunningIcon();
};

const updateStatusBarItem = () => {
  statusBarItem.text = `${getIcon()} ${taskStatusName()} ${readableClock()}`;
  statusBarItem.show();
};

const startWork = () => {
  taskStatus = TaskStatus.Work;
  updateStatusBarItem();
  startTimer();
  vscode.window.showInformationMessage('startWork');
};

const starBreak = () => {
  taskStatus = TaskStatus.Break;
  updateStatusBarItem();
  startTimer();
  vscode.window.showInformationMessage('starBreak');
};

const resetClock = () => {
  if (taskStatus === TaskStatus.Work) {
    return (clock = workSeconds);
  }
  if (countWorkTimes === longBreakIntervals) {
    countWorkTimes = 0;
    return (clock = longBreak);
  }
  clock = breakSeconds;
};

const startTimer = () => {
  resetClock();
  updateStatusBarItem();
  if (timerStatus === TimerStatus.Running) {
    return;
  }
  timerStatus = TimerStatus.Running;
  runClock();
};

const pauseTimer = () => {
  timerStatus = TimerStatus.Paused;
  vscode.window.showInformationMessage('pauseTimer');
  updateStatusBarItem();
};

const stopTimer = () => {
  clock = 0;
  timerStatus = TimerStatus.Stopped;
  vscode.window.showInformationMessage('stopTimer');
  updateStatusBarItem();
};

const resumeTimer = () => {
  timerStatus = TimerStatus.Running;
  vscode.window.showInformationMessage('resumeTimer');
  runClock();
};

const readableClock = () => {
  if (!clock) {
    return '--:--';
  }

  const hours = ~~(clock / 3600);
  const minutes = ~~((clock % 3600) / 60);
  const seconds = ~~clock % 60;

  return `${hours > 0 ? `${hours < 10 ? `0` : ``}${hours}:` : ``}${
    minutes < 10 ? `0` : ``
  }${minutes}:${seconds < 10 ? `0` : ``}${seconds}`;
};

const statusBarClicked = () => {
  if (timerStatus === TimerStatus.Stopped) {
    return startWork();
  }
  if (timerStatus === TimerStatus.Paused) {
    return resumeTimer();
  }
  if (timerStatus === TimerStatus.Running) {
    return pauseTimer();
  }
};

export function activate(context: vscode.ExtensionContext) {
  const statusBarCommandId = 'ketchup.statusBar';

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1000,
  );
  statusBarItem.hide();

  vscode.commands.registerCommand(statusBarCommandId, () => {
    statusBarClicked();
  });

  const startTimerCommand = vscode.commands.registerCommand(
    'ketchup.startTimer',
    () => {
      startTimer();
    },
  );

  const pauseTimerCommand = vscode.commands.registerCommand(
    'ketchup.pauseTimer',
    () => {
      pauseTimer();
    },
  );

  const resumeTimerCommand = vscode.commands.registerCommand(
    'ketchup.resumeTimer',
    () => {
      resumeTimer();
    },
  );

  const stopTimerCommand = vscode.commands.registerCommand(
    'ketchup.stopTimer',
    () => {
      stopTimer();
    },
  );

  const startBreakCommand = vscode.commands.registerCommand(
    'ketchup.startBreak',
    () => {
      starBreak();
    },
  );

  const startWorkCommand = vscode.commands.registerCommand(
    'ketchup.startWork',
    () => {
      startWork();
    },
  );

  statusBarItem.command = statusBarCommandId;

  context.subscriptions.push(startTimerCommand);
  context.subscriptions.push(pauseTimerCommand);
  context.subscriptions.push(resumeTimerCommand);
  context.subscriptions.push(stopTimerCommand);
  context.subscriptions.push(startBreakCommand);
  context.subscriptions.push(startWorkCommand);

  updateStatusBarItem();
}

export function deactivate() {}
