import * as vscode from 'vscode';

const secondsPerMinute = 60;
const defaultBreakSeconds = 5 * secondsPerMinute;
const defaultWorkSeconds = 25 * secondsPerMinute;
const defaultLongBreakSeconds = 15 * secondsPerMinute;
const defaultLongBreakInterval = 4;

enum TaskStatus {
  Break,
  Work,
}

enum TimerStatus {
  Paused,
  Stopped,
  Running,
}

let breakSeconds = defaultBreakSeconds;
let workSeconds = defaultWorkSeconds;
let longBreakSeconds = defaultLongBreakSeconds;
let longBreakIntervals = defaultLongBreakInterval;
let notifications = true;

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
  showNotifications('💻 Work Time!');
};

const starBreak = () => {
  taskStatus = TaskStatus.Break;
  updateStatusBarItem();
  startTimer();
  showNotifications('☕️ Break Time!');
};

const resetClock = () => {
  if (taskStatus === TaskStatus.Work) {
    return (clock = workSeconds);
  }
  if (countWorkTimes === longBreakIntervals) {
    countWorkTimes = 0;
    return (clock = longBreakSeconds);
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
  showNotifications('🍅 Kechup Paused');
  updateStatusBarItem();
};

const stopTimer = () => {
  clock = 0;
  timerStatus = TimerStatus.Stopped;
  showNotifications('🍅 Kechup Stoped');
  updateStatusBarItem();
};

const resumeTimer = () => {
  timerStatus = TimerStatus.Running;
  showNotifications('🍅 Kechup Running');
  runClock();
};

const showNotifications = (message: string) => {
  getUserSettings();
  if (!notifications) {
    return;
  }
  vscode.window.showInformationMessage(message);
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

const getUserSettings = () => {
  try {
    const config = vscode.workspace.getConfiguration('ketchup');
    breakSeconds = config.breakMinutes * secondsPerMinute;
    workSeconds = config.workMinutes * secondsPerMinute;
    longBreakSeconds = config.longBreakMinutes * secondsPerMinute;
    longBreakSeconds = config.longBreakIntervals;
    notifications = config.notifications;
  } catch (error) {}
};

export function activate(context: vscode.ExtensionContext) {
  getUserSettings();
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
