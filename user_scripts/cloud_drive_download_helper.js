// ==UserScript==
// @name         CloudDriveDownloadHelper
// @author       Unknown
// @description  NOT SET
// @namespace    unknown.unknown@github.io
// @version      1.14
// @run-at       document-end
// @match        http://bluemediafiles.com/*
// @match        https://mega.nz/*
// @match        https://download.megaup.net/*
// @match        https://megaup.net/*
// @match        https://letsupload.io/*
// @match        https://igg-games.com/*
// @match        https://steamunlocked.net/*
// @grant        GM_log
// @grant        GM_setClipboard
// ==/UserScript==

// Useful:
//  - nextSibling

(function() {
    GM_log('Welcome to Cloud Drive Download Helper!');
    function runUntil(fn, intervalSec, untilSec) {
        const intervalId = setInterval(fn, intervalSec * 1000);
        setTimeout(function() {
            clearInterval(intervalId);
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

    function removeAllListeners() {
        // Remove all event listeners on the page.
        const newBody = document.body.cloneNode(true);
        document.body.parentNode.replaceChild(newBody, document.body);
        GM_log('removed all listeners');
    }

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    if (hostname === 'bluemediafiles.com') {
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
        }, 5, 30);
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
        // Remove ads and spam.
        // The two "notification" to the top-right.
        runUntil(function() {
            const elem = document.querySelector('.notranslate');
            if (elem) {
                elem.remove();
            }
            removeIframes();
        }, 5, 30);
        removeAllListeners();

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
        setTimeout(removeAllListeners, 5 * 1000);
    }
})();