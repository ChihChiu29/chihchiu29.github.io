// ==UserScript==
// @name         InlineAppFiller
// @author       Unknown
// @description  Easy download
// @namespace    unknown.unknown@github.io
// @version      1.00
// @run-at       document-end
// @match        https://inline.app/booking/*
// @grant        GM_log
// @grant        GM_setClipboard
// ==/UserScript==

// Useful:
//  - nextSibling

let COMPANY_ID = '-MeNcbDasiIykiow2Hfb';

let BRANCH_ID_XY = "-NJv97D1S0vDwmdQR4lM";  // 信義店
let BRANCH_ID_ST = "-N3JQxh1vIZe9tECk0Pg";  // 台北三創店
let BRANCH_ID_XM = "-NLRXZWFIRJBhOSk1d_h"; // 西門店
let BRANCH_ID_GX = "-N04NZLqRzkSAM-EjB-5";  // 高雄店

let testInfo = {
  name: "羅言",
  phone: "+8860915123459",
  email: "4kmusicmake@gmail.com",
  gender: 1,
};

let hsuanInfo = {
  name: "Hsuan Pao",
  phone: "+8860916196678",
  email: "shelly98982002@yahoo.com.tw",
  gender: 1,
};

let chengguoInfo = {
  name: "Pao Ta",
  phone: "+8860958874478",
  email: "needmanyfood1@gmail.com",
  gender: 2,
};

let chengguoInfo2 = {
  name: "鮑埕果",
  phone: "+8860978941198",
  email: "helloworldab101@gmail.com",
  gender: 2,
};

let babaInfo = {
  name: "鲍傑",
  phone: "+8860916196678",
  email: "powordisland@gmail.com",
  gender: 2,
};
let userInfo = testInfo;

'https://inline.app/booking/-MeNcbDasiIykiow2Hfb:inline-live-2/-N3JQxh1vIZe9tECk0Pg/result'

class SequenceActionThrottler {
  queue = [];
  delayBetweenActionsMs = 0;
  previousActionTime = 0;
  sheduled = false;

  // Params:
  //  - delayMs: next action won't start until it's at least delayMs later than previous task's start time.
  //  - delayStartUntil: the queue won't run until this timestamp (in MS).
  constructor(delayMs, delayStartUntil = -1) {
    this.delayBetweenActionsMs = delayMs;
    if (delayStartUntil === -1) {
      this.previousActionTime = lib.now() - delayMs;
    } else {
      this.previousActionTime = delayStartUntil - delayMs;
    }
  }

  // Enqueues an action, also kicks off execution if not already.
  enqueue(action) {
    this.queue.push(action);
    this.maybeExecuteNext();
  }

  cancel() {
    this.queue = [];
  }

  maybeExecuteNext() {
    if (this.sheduled) {
      // No need to do anything, this function will be invoked in the future.
      return;
    }

    const saveThis = this;
    const delta = lib.now() - this.previousActionTime;
    if (delta > this.delayBetweenActionsMs) {
      const nextAction = this.queue.shift();
      if (nextAction) {
        // set first in case nextAction calls enqueue.
        saveThis.sheduled = true;
        nextAction();
        saveThis.previousActionTime = lib.now();
        // Check if we can execute the next action already.
        saveThis.sheduled = false;
        saveThis.maybeExecuteNext();
      }
    } else {
      setTimeout(() => {
        saveThis.sheduled = false;
        saveThis.maybeExecuteNext();
      }, this.delayBetweenActionsMs - delta);
    }
  }
}

let lib = {
  log: function (content) {
    if (typeof GM_log !== 'undefined') {
      GM_log(content);
    } else {
      console.log(content);
    }
  },

  contains: function (str, subStr) {
    return str.indexOf(subStr) >= 0;
  },

  isPathRoot: function () {
    return window.location.pathname === '/';
  },

  removeIframes: function () {
    for (const iframeElem of document.querySelectorAll('iframe')) {
      iframeElem.remove();
    }
  },

  getIntBetween: function (lowerBoundInclusive, upperBoundNonInclusive) {
    return Math.floor(Math.random() * (
      upperBoundNonInclusive - lowerBoundInclusive)) + lowerBoundInclusive;
  },

  now: function () {
    return new Date().getTime();
  },

  fetchIgnoreError: function (url, option) {
    return fetch(url, content).catch((err) => {
      lib.log(err);
    });
  },

  /* Runs a function periodically, until it returns true, or untilSec seconds passed. */
  runUntilSuccessful: function (fn, intervalSec, untilSec, successCallbackFn, timeoutCallbackFn) {
    const startTime = lib.now();
    const scheduler = new SequenceActionThrottler(intervalSec * 1000);

    function action() {
      lib.log(`Running periodic function ${fn}...`);
      runResult = fn();
      if (runResult) {
        lib.log('Run was successful');
        if (successCallbackFn) {
          successCallbackFn();
        }
      } else {
        if (lib.now() - startTime > untilSec * 1000) {
          lib.log('Time\'s up; stop.');
          if (timeoutCallbackFn) {
            timeoutCallbackFn();
          }
        } else {
          scheduler.enqueue(action);
        }
      }
    }
    scheduler.enqueue(action);
  },

  pickRandomInArray: function (dataArray) {
    return dataArray[Math.floor(Math.random() * dataArray.length)];
  },

  /* Returns the clicked element or undefined. */
  clickRandomElement: function (elementArray) {
    if (elementArray.length > 0) {
      let elem = lib.pickRandomInArray(elementArray);
      elem.click();
      return elem;
    }
    return undefined;
  },
};

let page = {
  /* TODO: it's better to split this function and make waitUntilElemReactedToClick to take a function as condition. */
  /* bool */ hasReactedToClick: function (elem) {
    if (!elem) {
      return true;
    } else if (elem.disabled) {
      return true;
    } else if (elem.getAttribute('disabled') === '') {
      return true;
    } else if (elem.clientWidth < 1 && elem.clientHeight < 1) {
      return true;
    } else if (elem.getAttribute('aria-checked') === 'true') {
      return true;
    } else {
      for (cls of elem.classList) {
        if (cls === 'selected') {
          return true;
        }
      }
    }
    return false;
  },

  /* Promise that waits until the checker return true. */
  waitUntil: function (checker, waitSec = 3) {
    return new Promise((resolve, reject) => {
      lib.runUntilSuccessful(checker, 0.3, waitSec, resolve, reject);
    });
  },

  /* An element reacts to click by:
    (1) Having an attribute "disabled" (date).
    (2) Having a class "selected" (timeslot).
    (3) Disappear or having 0 dimension (move to second page button).
    (4) Having an attribute `aria-checked="true"`.
  Returns: Promise(success, failure) 
  */
  waitUntilElemReactedToClick: function (elem) {
    return page.waitUntil(() => {
      return page.hasReactedToClick(elem);
    });
  },

  /* It seems you can pick date without opening the date picker. */
  getDatePicker: function () {
    return document.querySelector('#date-picker');
  },
  openDatePicker: function () {
    const datePicker = page.getDatePicker();
    let expanded = datePicker.getAttribute('aria-expanded') === 'true';
    if (!expanded) {
      datePicker.click();
    }
  },
  waitForDatePicker: function () {
    return page.waitUntil(() => {
      let elem = page.getDatePicker();
      return elem;
    });
  },

  /*array*/ getAvailableDateElements: function () {
    return document.querySelectorAll('[data-cy="bt-cal-day"]:not([disabled])');
  },

  /* element or undefined */ pickRandomAvailableDate: function () {
    return lib.clickRandomElement(page.getAvailableDateElements());
  },

  /* Promise */ pickRandomAvailableDateAndWait: function () {
    return page.waitUntilElemReactedToClick(page.pickRandomAvailableDate());
  },

  getAvailableTimeslotElements: function /*array*/() {
    const TIMESLOT_CSS_APPENDIXES = [
      "11-00",
      "13-00",
      "17-00",
      "19-00",
    ];
    let elements = [];
    for (let appendix of TIMESLOT_CSS_APPENDIXES) {
      for (let elem of document.querySelectorAll(
        `[data-cy="book-now-time-slot-box-${appendix}"]:not([disabled])`)) {
        elements.push(elem);
      }
    }
    return elements;
  },

  /*bool*/ pickRandomAvailableTimeslot: function () {
    return lib.clickRandomElement(page.getAvailableTimeslotElements());
  },

  /* Promise */ pickRandomAvailableTimeslotAndWait: function () {
    return page.waitUntilElemReactedToClick(page.pickRandomAvailableTimeslot());
  },

  /* Promise to wait for next "page". */
  clickSelectDiningTimeButtonAndWait: function () {
    return page.waitUntilElemReactedToClick(lib.clickRandomElement(
      document.querySelectorAll('[data-cy="book-now-action-button"]:not([disabled])')));
  },

  /* Temp hack; should be done as part of clickSelectDiningTimeButtonAndWait */
  waitForBookingPage: function () {
    return page.waitUntil(() => {
      let elem = document.querySelector('#name');
      return elem && elem.value;
    });
  },

  /* Promise to wait for next "page". */
  pickDiningPurposeAndWait: function () {
    // Index 5 is the 6th checkbox (first one is the one about saving info).
    return page.waitUntilElemReactedToClick(lib.clickRandomElement(
      document.querySelectorAll('[role="checkbox"]:nth-child(5)')));
  },

  /* Promise to wait for next "page". */
  clickSubmitButtonAndWait: function () {
    return page.waitUntilElemReactedToClick(lib.clickRandomElement(
      document.querySelectorAll('[data-cy="submit"]')));
  },

  /* Promise to wait for the page to change. */
  waitForLeavingThePage: function () {
    /* Waits a bit longer as it can be quite slow. */
    return page.waitUntil(() => {
      return !lib.contains(window.location.pathname, COMPANY_ID);
    }, 10);
  },

  /* Execute actions that lead to the next page. */
  automate: async function () {
    try {
      lib.log('Wait for page to load');
      await page.waitForDatePicker();
      lib.log('Select random date');
      await page.pickRandomAvailableDateAndWait();
      lib.log('Select random time slot');
      await page.pickRandomAvailableTimeslotAndWait();
      lib.log('Book it / move to next page');
      await page.clickSelectDiningTimeButtonAndWait();
      lib.log('Wait for next page to fully appear');
      await page.waitForBookingPage();
      lib.log('Pick a dining purpose');
      await page.pickDiningPurposeAndWait();
      lib.log('Submit!');
      await page.clickSubmitButtonAndWait();
      lib.log('Wait for confirmation...');
      await page.waitForLeavingThePage();
    } catch (err) {
      location.reload();
    }
  }
};

// Testing
// lib.runUntilSuccessful(() => { console.log(1); return true; }, 5, 15);
// page.automate();

function main() {
  lib.log('Welcome to Kirabase fighter!');

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  if (lib.contains(pathname, BRANCH_ID_ST)) {
    let datetime = new Date();
    let hour = datetime.getHours();
    let minute = datetime.getMinutes();
    if (hour === 9 && minute < 4) {
      page.automate();
    }

    // Schedule for page reload at next whole hour.
    lib.log(`will reload after ${60 - minute} minutes`);
    setTimeout(() => {
      location.reload();
    }, (60 - minute) * 60 * 1000);
  } else if (lib.contains(pathname, BRANCH_ID_XM)) {
    // Testing.
    // page.automate();
  }
}

main();