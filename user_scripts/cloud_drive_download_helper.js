// ==UserScript==
// @name         CloudDriveDownloadHelper
// @author       Unknown
// @description  Easy download
// @namespace    unknown.unknown@github.io
// @version      1.36
// @run-at       document-end
// @match        http://bluemediafiles.com/*
// @match        https://bluemediafiles.com/*
// @match        http://bluemediafiles.eu/*
// @match        https://bluemediafiles.eu/*
// @match        http://bluemediafile.sbs/*
// @match        https://bluemediafile.sbs/*
// @match        http://bluemediafile.site/*
// @match        https://bluemediafile.site/*
// @match        https://mega.nz/*
// @match        https://download.megaup.net/*
// @match        https://game-2u.com/*
// @match        https://game-2u.net/*
// @match        https://megaup.net/*
// @match        https://nsw2u.com/*
// @match        https://nsw2u.net/*
// @match        https://letsupload.io/*
// @match        https://igg-games.com/*
// @match        https://steamunlocked.net/*
// @match        https://www.ziperto.com/*
// @grant        GM_log
// @grant        GM_setClipboard
// ==/UserScript==

// Useful:
//  - nextSibling

(function() {
    GM_log('Welcome to Cloud Drive Download Helper!');
    function runUntil(fn, intervalSec, untilSec) {
        const intervalId = setInterval(()=>{
            GM_log('Running periodic function...');
            fn();
            GM_log('Periodic function completed');
        }, intervalSec * 1000);
        setTimeout(function() {
            clearInterval(intervalId);
            GM_log('Periodic function removed');
        }, untilSec * 1000);
    }

    function contains(str, subStr) {
        return str.indexOf(subStr) >= 0;
    }

    function isRoot() {
        return window.location.pathname === '/';
    }

    function removeIframes() {
        for (const iframeElem of document.querySelectorAll('iframe')) {
            iframeElem.remove();
        }
    }

    function removeBodyListeners() {
        // Remove all event listeners on the page.
        const newBody = document.body.cloneNode(true);
        document.body.parentNode.replaceChild(newBody, document.body);
        GM_log('removed all listeners');
    }

    function sanitize() {
      const bodyHtml = document.body.innerHTML;
      const styleElements = [];
      for (const nn of document.head.childNodes) {
        if (nn.type === 'text/css') {
          styleElements.push(nn);
        }
      }
      document.open();
      document.write('<head></head>');
      document.write('<body></body>');
      document.close();

      for (const styleElem of styleElements) {
        document.head.appendChild(styleElem);
      }
      document.body.innerHTML = bodyHtml;
    }

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    if (contains(hostname, 'bluemediafile')) {
        runUntil(function() {
            const button = document.querySelector('#nut');
            if (button) {
                GM_log('Goodbye redirect page!');
                button.click();
            }
        }, 15 /*Clicking too soon will go back*/, 60);
    } else if (hostname === 'mega.nz') {
        runUntil(function() {
            const button = document.querySelector('.js-megasync-download');
            // const button = document.querySelector('#nut');
            if (button) {
                GM_log('Start download!');
                button.click();
            }
        }, 5, 30);
    } else if (hostname === 'download.megaup.net' || hostname === 'megaup.net') {
        runUntil(function() {
            const form = document.querySelector('form');
            if (form) {
                GM_log('Start download!');
                form.submit();
            }
        // 35 sec to wait for the 5-sec count down, otherwise submit doesn't work.
        }, 30, 90);
    } else if (contains(hostname, 'nsw2u') || contains(hostname, 'game-2u')) {
        runUntil(function() {
            // Requires other ad blocker to trigger this element.
            const elements = document.querySelectorAll('body > div');
            if (elements[0].id === 'page' && elements.length > 1) {
                elements[1].remove();
            }
        }, 2, 10);
    } else if (hostname === 'letsupload.io') {
        runUntil(function() {
            for (const button of document.querySelectorAll('button')) {
                if (button.innerText.toLowerCase().indexOf('download') >= 0) {
                    GM_log('Start download!');
                    button.click();
                }
            }
        }, 5, 30);
    } else if (hostname === 'igg-games.com') {
        // (2023-06-25) Doesn't seem to be necessary anymore.
        return;
        // Remove ads and spam.
        // The two "notification" to the top-right.
        runUntil(function() {
            const elem = document.querySelector('.notranslate');
            if (elem) {
                elem.remove();
            }
            removeIframes();
            sanitize();
        }, 5, 30);

        // For downloading.
        if (isRoot() || contains(pathname, 'page')) {
            return;
        }
        // For igg games, copy links to clipboard (use jdownloader).
        const links = [];
        for (const link of document.querySelectorAll('a')) {
            links.push(link.href);
        }
        GM_setClipboard(links.join('\n'));
    } else if (hostname === 'steamunlocked.net') {
        if (isRoot()) {
            return;
        }
        GM_setClipboard(window.location.href);
    } else if (hostname === 'www.ziperto.com') {
        runUntil(function() {
            removeIframes();
        }, 5, 30);
    }
})();