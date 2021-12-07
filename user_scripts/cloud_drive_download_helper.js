// ==UserScript==
// @name         Cloud Drive Download Helper
// @author       Chih Chiu
// @description  NOT SET
// @namespace    ChihChiu29@github.io
// @version      1.0
// @match        http://bluemediafiles.com/*
// @match        https://mega.nz/*
// @match        https://download.megaup.net/*
// @match        https://megaup.net/*
// @match        https://letsupload.io/*
// @grant        GM_log
// ==/UserScript==

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
            // const adsRight = document.querySelector('#ads-right');
            // const button = adsRight.nextElementSibling;
            // if (button && button.tagName === 'DIV') {
            //    GM_log('Goodbye redirect page!');
            //    document.querySelector('form').submit();
            //}
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
            const button = document.querySelector('.btn--primary');
            if (button) {
                GM_log('Start download!');
                button.click();
            }
        }, 5, 30);
    }
})();