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

let babaInfo = {
  name: "鲍傑",
  phone: "+8860916196678",
  email: "powordisland@gmail.com",
  gender: 2,
};
let userInfo = testInfo;

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

  /* An element reacts to click by:
    (1) Having an attribute "disabled" (date).
    (2) Having a class "selected" (timeslot).
    (3) Disappear or having 0 dimension (move to second page button).
    (4) Having an attribute `aria-checked="true"`.
  Returns: Promise(success, failure) 
  */
  waitUntilElemReactedToClick: function (elem) {
    return new Promise((resolve, reject) => {
      lib.runUntilSuccessful(() => {
        return page.hasReactedToClick(elem);
      }, 0.3, 5, resolve, reject);
    });
  },

  /* It seems you can pick date without opening the date picker. */
  // getDatePicker: function () {
  //   return document.querySelector('#date-picker');
  // },
  // openDatePicker: function () {
  //   const datePicker = page.getDatePicker();
  //   let expanded = datePicker.getAttribute('aria-expanded') === 'true';
  //   if (!expanded) {
  //     datePicker.click();
  //   }
  // },

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

  /* Promise to wait for next "page". */
  pickDiningPurposeAndWait: function () {
    // Index 5 is the 6th checkbox (first one is the one about saving info).
    return page.waitUntilElemReactedToClick(lib.clickRandomElement(
      document.querySelectorAll('[role="checkbox"]:nth-child(5)')));
  },

  /* Execute actions that lead to the next page. */
  automate: async function () {
    lib.log('Select random date');
    await page.pickRandomAvailableDateAndWait();
    lib.log('Select random time slot');
    await page.pickRandomAvailableTimeslotAndWait();
    lib.log('Book it / move to next page');
    await page.clickSelectDiningTimeButtonAndWait();
    lib.log('Pick a dining purpose');
    await page.pickDiningPurposeAndWait();
    lib.log('yay!');
  }
};



// (function () {
//   GM_log('Welcome to InlineAppFiller!');




//   function removeBodyListeners() {
//     // Remove all event listeners on the page.
//     const newBody = document.body.cloneNode(true);
//     document.body.parentNode.replaceChild(newBody, document.body);
//     GM_log('removed all listeners');
//   }

//   function sanitize() {
//     const bodyHtml = document.body.innerHTML;
//     const styleElements = [];
//     for (const nn of document.head.childNodes) {
//       if (nn.type === 'text/css') {
//         styleElements.push(nn);
//       }
//     }
//     document.open();
//     document.write('<head></head>');
//     document.write('<body></body>');
//     document.close();

//     for (const styleElem of styleElements) {
//       document.head.appendChild(styleElem);
//     }
//     document.body.innerHTML = bodyHtml;
//   }

//   const hostname = window.location.hostname;
//   const pathname = window.location.pathname;
//   if (contains(hostname, 'bluemedia')) {
//     runUntil(function () {
//       const button = document.querySelector('#nut');
//       if (button) {
//         GM_log('Goodbye redirect page!');
//         button.click();
//       }
//     }, 15 /*Clicking too soon will go back*/, 60);
//   } else if (hostname === 'mega.nz') {
//     // runUntil(function() {
//     //     const button = document.querySelector('.js-megasync-download');
//     //     // const button = document.querySelector('#nut');
//     //     if (button) {
//     //         GM_log('Start download!');
//     //         button.click();
//     //     }
//     // }, 5, 30);
//   } else if (hostname === 'download.megaup.net' || hostname === 'megaup.net') {
//     runUntil(function () {
//       const form = document.querySelector('form');
//       if (form) {
//         GM_log('Start download!');
//         form.submit();
//       }
//       // 35 sec to wait for the 5-sec count down, otherwise submit doesn't work.
//     }, 30, 90);
//   } else if (contains(hostname, 'nsw2u') || contains(hostname, 'game-2u')) {
//     runUntil(function () {
//       // Requires other ad blocker to trigger this element.
//       const elements = document.querySelectorAll('body > div');
//       if (elements[0].id === 'page' && elements.length > 1) {
//         elements[1].remove();
//       }
//     }, 2, 10);
//   } else if (hostname === 'letsupload.io') {
//     runUntil(function () {
//       for (const button of document.querySelectorAll('button')) {
//         if (button.innerText.toLowerCase().indexOf('download') >= 0) {
//           GM_log('Start download!');
//           button.click();
//         }
//       }
//     }, 5, 30);
//   } else if (hostname === 'igg-games.com') {
//     // (2023-06-25) Doesn't seem to be necessary anymore.
//     return;
//     // Remove ads and spam.
//     // The two "notification" to the top-right.
//     runUntil(function () {
//       const elem = document.querySelector('.notranslate');
//       if (elem) {
//         elem.remove();
//       }
//       removeIframes();
//       sanitize();
//     }, 5, 30);

//     // For downloading.
//     if (isRoot() || contains(pathname, 'page')) {
//       return;
//     }
//     // For igg games, copy links to clipboard (use jdownloader).
//     const links = [];
//     for (const link of document.querySelectorAll('a')) {
//       links.push(link.href);
//     }
//     GM_setClipboard(links.join('\n'));
//   } else if (hostname === 'steamunlocked.net') {
//     if (isRoot()) {
//       return;
//     }
//     GM_setClipboard(window.location.href);
//   } else if (hostname === 'www.ziperto.com') {
//     runUntil(function () {
//       removeIframes();
//     }, 5, 30);
//   }
// })();

// lib.runUntilSuccessful(() => { console.log(1); return true; }, 5, 15);