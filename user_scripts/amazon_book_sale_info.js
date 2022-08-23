// ==UserScript==
// @name         Amazon Royalties Estimator Extraction Helper
// @namespace    unknown.unknown@github.io
// @description  Good luck Amazon
// @version      0.1
// @run-at       document-end
// @match        https://kdpreports.amazon.com/*
// @grant        GM_log
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    GM_log('Welcome to Amazon Royalties Estimator User Improvement Program!');

    function parseBookSalesTable() {
        let csvData = '';
        const bookElements = document.querySelectorAll(
            'div.ui.vertically > div.panel-title-new.header-height');
        const bookElementArray = [...bookElements];
        let processSuccessful = false;
        for (const bookElement of bookElementArray.slice(1)) {
            const saleInfo = bookElement.innerText.split('\n');
            if (saleInfo.length < 6) {
                continue;
            }
            csvData += saleInfo[5] + ',' + saleInfo.slice(0, 5).join(',') + '\n';
            processSuccessful = true;
        }
        GM_setClipboard(csvData);
        return processSuccessful;
    }

    setInterval(parseBookSalesTable, 2000);
})();
