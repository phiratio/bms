const { EMPLOYEES_CACHE_NAMESPACE, EMPLOYEES_DISABLED_LIST, EMPLOYEES_ENABLED_LIST } = require('../../constants');

const _ = require('lodash');

/**
 * QueueManager is a class to manager employees in queue
 * @constructor
 */
class Queue {
  constructor() {
    this.employees = [];
  }
  /**
   * Gets employees from cache store, as a fallback gets employees from database
   * @param {boolean} all returns employees as a single array of objects if true
   * @returns {Promise<*>}
   */
  async get(all) {
    // retrive employees from cache store
    let employees = await this.getCachedEmployees();
    // if we were unable to get employees from cache store then try to get them from db
    if (!employees) {
      let dbEmployees = await strapi.services.accounts.getEmployees(['username','firstName', 'lastName', 'acceptAppointments']);
      let anyone = [];
      let disabled = [];

      dbEmployees.map(el => {
        const avatar = _.get(el, 'avatar.url');
        if (el.username === 'Anyone') {
          anyone.push({
            id: el.id,
            avatar,
            acceptAppointments: el.acceptAppointments,
            fullName: `${el.firstName} ${el.lastName}`,
            name: el.username,
            status: 0,
            initialized: false,
          });
        } else {
          disabled.push({
            id: el.id,
            avatar,
            name: el.username,
            acceptAppointments: el.acceptAppointments,
            fullName: `${el.firstName} ${el.lastName}`,
            status: 0,
            initialized: false,
          });
        }
      });
      employees = { enabled: [...anyone], disabled };
      await this.set(employees);
    }
    if (all) {
      return [...employees.enabled, ...employees.disabled];
    }
    return employees;
  }

  /**
   * Get employee by id
   * @param id
   * @returns {Promise}
   */
  async getById(id) {
    const all = await this.getAll();
    if (Array.isArray(all)) {
      const filtered = all.filter(el => el.id.toString() === id);
      if (filtered.length > 0) return filtered[0];
    }
    return false;
  }

  /**
   * Retrieves all employees in queue as a list
   * @returns {Promise<*>}
   */
  getAll() {
    return this.get(true);
  }

  /**
   * Retrieves all existing employees
   * @returns {Promise<*>}
   */
  getList() {
    return this.get(true);
  }

  /**
   * Clears cache store
   */
  async clear() {
    // clear employees from cache store
    await strapi.connections.redis.del(EMPLOYEES_CACHE_NAMESPACE);
  }

  /**
   * Sets employees to cache store
   * @param {object} employees List of employees
   * @returns {Promise<QueeueManager>}
   */
  async set(employees) {
    // save changes to cache store
    await strapi.connections.redis.set(EMPLOYEES_CACHE_NAMESPACE, typeof employees === 'string' ? employees : JSON.stringify(employees));
    return this;
  }

  /**
   * Toggles status of specified employee
   * @param {number} id Employee identification number
   * @returns {Promise<QueeueManager>}
   */
  async toggleStatus(id) {
    // get list of employees
    const employees = await this.get();
    // look for a employee with id
    const index = employees.enabled.findIndex(el => el.id === id);
    if (index >= 0) {
      // toggle status
      employees.enabled[index].initialized = true;
      employees.enabled[index].status = employees.enabled[index].status ? 0 : 1;
      // save changes
      await this.set(employees);
      return this;
    }
    return false;
  }

  /**
   * Gets cached employees
   * @returns {Promise<any>}
   */
  async getCachedEmployees() {
    const cache = await strapi.connections.redis.get(EMPLOYEES_CACHE_NAMESPACE);
    return JSON.parse(cache);
  }

  /**
   * Add employee to cache
   * @param employee
   * @param list
   * @returns {Promise<*>}
   */
  async addToCache(employee, list = EMPLOYEES_DISABLED_LIST) {
    const cachedEmployees = await this.getCachedEmployees();
    if (cachedEmployees) {
      cachedEmployees[list] = cachedEmployees[list].concat({
        id: employee.id,
        name: employee.username,
        fullName: `${employee.firstName} ${employee.lastName}`,
        acceptAppointments: employee.acceptAppointments,
        status: 0,
        initialized: false,
      });
      return this.set(cachedEmployees);
    }
    return this;
  }

  /**
   * Removes employee from cache
   * @param employee
   * @returns {Promise<*>}
   */
  async removeFromCache(employee={}) {
    const cachedEmployees = await this.getCachedEmployees();
    if (cachedEmployees) {
      Object.keys(cachedEmployees).map(list => {
        cachedEmployees[list] = cachedEmployees[list].filter(
          el => el.id !== employee.id,
        );
      });
      return this.set(cachedEmployees);
    }
    return this;
  }

  /**
   * Update employee in cache
   * @param employee
   * @returns {Promise<*>}
   */
  async updateCache(employee={}) {
    const cachedEmployees = await this.getCachedEmployees();
    if (cachedEmployees) {
      let updated = false;
      Object.keys(cachedEmployees).map(list => {
        cachedEmployees[list] = cachedEmployees[list].map(el => {
          if (el.id === employee.id.toString()) {
            updated = true;
            return {
              ...el,
              name: employee.username,
              fullName: employee.fullName || ( `${employee.firstName} ${employee.lastName}`),
              acceptAppointments: employee.acceptAppointments,
              ...(_.get(employee, 'avatar.url')) ? { avatar: employee.avatar.url } : { avatar: null } ,
            };
          }
          return el;
        });
      });
      if (!updated) return this.addToCache(employee);
      return this.set(cachedEmployees);
    }
    return this;
  }

  /**
   * Moves specified employee from one position to another
   * @param {object} element Contains source, destination and employee id
   * @returns {Promise<QueeueManager>}
   */
  async moveEmployee(element) {
    try {
      const smartSort = await strapi.services.config.get('queue').key('smartSort');
      const id = element.draggableId;
      const from = element.source.droppableId;
      const to = element.destination.droppableId;
      const status = element.status; // optional
      // if `destinationIndex` is not specified it means that we moving element to the last position
      let destinationIndex = element.destination.index;
      // check if we have all needed data to move employee
      if (id && from && to) {
        let anyone;
        // get list of employees
        const employees = await this.get();
        // Employee with name `Anyone` should be in the list but we need to hide
        // it from the list in Queue, so we remove `Anyone` from list, move employee and the put
        // `Anyone` back to the list end. That way we can move employee to a correct position.
        const anyoneIndex = employees[to].findIndex(el => el.name === 'Anyone');
        if (anyoneIndex > -1) {
          anyone = employees[to].splice(anyoneIndex, 1)[0];
        }
        // look up for index
        const index = employees[from].findIndex(el => el.id === id);
        // return if nothing was found
        if (index < 0) return;
        // cut item from array
        const itemToMove = employees[from].splice(index, 1);
        const itemInitializedStatus = itemToMove[0].initialized;
        // set status if it was specified
        if (status >= 0) {
          itemToMove[0].status = status;
        }
        // if smartSort enabled in configuration file
        if (smartSort) {
          if (
            !itemInitializedStatus &&
            to === EMPLOYEES_ENABLED_LIST &&
            from === EMPLOYEES_ENABLED_LIST &&
            status
          ) {
            itemToMove[0].initialized = true;
          }
          // if item has negative initialization status
          if (
            !itemInitializedStatus &&
            to === EMPLOYEES_ENABLED_LIST &&
            from === EMPLOYEES_DISABLED_LIST
          ) {
            // itemToMove[0].initialized = true;
            const smartIndex = employees[EMPLOYEES_ENABLED_LIST].findIndex(
              el => el.initialized === true,
            );
            destinationIndex = smartIndex;
          }
        }
        if (destinationIndex >= 0) {
          // if destination index was specified - move it to that position
          employees[to].splice(destinationIndex, 0, itemToMove[0]);
        } else {
          // if no index was specified then addToCache item to the end of the array
          employees[to] = employees[to].concat(itemToMove);
        }
        // Add `Anyone` (if found in the list) to the end of the list
        if(anyoneIndex > -1) employees[to] = employees[to].concat(anyone);
        // save changes
        await this.set(employees);
      }
      return this;
    } catch (e) {
    }
    return this;
  }

  /**
   * Moves employee to the end of the list
   * @param {object} element Contains source, destination and employee id
   * @returns {Promise<void>}
   */
  async moveEmployeeToListEnd(element) {
    const changeStatusOnClick = await strapi.services.config.get('queue').key('changeStatusOnClick');
    // prepare element to move
    const configuredElement = {
      draggableId: element.id,
      source: {
        droppableId: EMPLOYEES_ENABLED_LIST,
      },
      destination: {
        droppableId: EMPLOYEES_ENABLED_LIST,
        index: -1, // set index to `-1` to move element to list`s end
      },
      ...(changeStatusOnClick && { status: 1 }),
    };
    // move item to list`s end
    return this.moveEmployee(configuredElement);
  }

  /**
   * Toggles employee list
   * @param {number} id Employee Identification number
   * @returns {Promise<QueeueManager>}
   */
  async toggleEmployeeList(id) {
    const employees = await this.get();
    // look for employee in enabled employees
    const enabledIndex = employees[EMPLOYEES_ENABLED_LIST].findIndex(
      el => el.id === id,
    );
    if (enabledIndex >= 0) {
      await this.disableEmployee(id);
    }
    // look for employees in disabled employees
    const disabledIndex = employees[EMPLOYEES_DISABLED_LIST].findIndex(
      el => el.id === id,
    );
    if (disabledIndex >= 0) {
      await this.enableEmployee(id);
    }
    return this;
  }

  /**
   * Toggles employee from the list of enabled to the list of disabled employees and vise versa
   * @param {number} id Employee identification number
   * @param {string} source Source list
   * @returns {Promise<void>}
   */
  async moveEmployeeBetweenLists(id, source, destination) {
    // prepare element to move
    const configuredElement = {
      draggableId: id,
      source: {
        droppableId: source,
      },
      destination: {
        droppableId: destination,
        index: -1, // set index to `-1` to move element to list`s end
      },
      status: 0,
    };

    return this.moveEmployee(configuredElement);
  }

  /**
   * Moves employee from list of enabled to list of disabled employees
   * @param {number} id Employee identification number
   */
  async disableEmployee(id) {
    await this.moveEmployeeBetweenLists(
      id,
      EMPLOYEES_ENABLED_LIST,
      EMPLOYEES_DISABLED_LIST,
    );
  }

  /**
   * Moves employee from list of disabled to list of enabled employees
   * @param {number} id Employee identification number
   */
  async enableEmployee(id) {
    await this.moveEmployeeBetweenLists(
      id,
      EMPLOYEES_DISABLED_LIST,
      EMPLOYEES_ENABLED_LIST,
    );
  }

}

module.exports = new Queue();
