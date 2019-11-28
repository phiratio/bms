import _ from 'underscore';

function setEmployees(employeesInQueue) {
  const listOfEnabledEmployees = [];
  const listOfDisabledEmployees = [];
  const listOfAllEmployees = [];
  let enabled = [];
  const disabled = employeesInQueue.disabled || [];

  if (Array.isArray(employeesInQueue.enabled)) {
    enabled = employeesInQueue.enabled;
    const sortedEmployees = _.sortBy(employeesInQueue.enabled, 'id');
    sortedEmployees.map(el => {
      listOfEnabledEmployees.push({ name: el.name, avatar: el.avatar, acceptAppointments: el.acceptAppointments });
    });
  }

  if (Array.isArray(employeesInQueue.disabled)) {
    employeesInQueue.disabled.map(el => {
      listOfDisabledEmployees.push({ name: el.name, avatar: el.avatar, acceptAppointments: el.acceptAppointments });
    });
  }

  listOfAllEmployees.push(...listOfEnabledEmployees, ...listOfDisabledEmployees );

  this.setState({
    listOfEnabledEmployees,
    listOfAllEmployees,
    employees: {
      enabled: enabled.filter(el => el.name !== 'Anyone'),
      disabled: disabled.filter(el => el.name !== 'Anyone'),
    },
  });
}

function flashEmployee(employeeId) {
  const element = document.getElementById(employeeId);
  const elementInQueue = this.state.employees.enabled.filter(
    el => el.id === employeeId,
  )[0];
  if (element && elementInQueue) {
    let className = 'Uninitialized';
    if (elementInQueue.status === 1 && elementInQueue.initialized)
      className = 'Unavailable';
    else if (elementInQueue.status === 0 && elementInQueue.initialized)
      className = 'Available';
    const elementsClassList = element.classList;
    elementsClassList.add(`queueFlash${className}`);
    setTimeout(() => {
      elementsClassList.remove(`queueFlash${className}`);
    }, 5000);
  }
}
const socketForcedDisconnect = data =>
  this.context.showNotification(
    data || 'Disconnected from socket server',
    'error',
  );
const socketConnectError = () => {
  // Disable button and all actions, set red background, set message
  console.log('Connection failed');
};

export {
  setEmployees,
  socketForcedDisconnect,
  socketConnectError,
  flashEmployee,
};
