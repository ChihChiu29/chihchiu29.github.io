// ==UserScript==
// @name         CloudDriveDownloadHelper
// @author       Unknown
// @description  NOT SET
// @namespace    unknown.unknown@github.io
// @version      1.20
// @match        http://bluemediafiles.com/*
// @match        https://mega.nz/*
// @match        https://download.megaup.net/*
// @match        https://megaup.net/*
// @match        https://letsupload.io/*
// @match        https://igg-games.com/*
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

    const hostname = window.location.hostname;
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
        // For igg games, copy links to clipboard (use jdownloader).
        const links = [];
        for (const link of document.querySelectorAll('a')) {
            links.push(link.href);
        }
        GM_setClipboard(links.join('\n'));
    }
})();