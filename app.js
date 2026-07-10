/* ==========================================================
   KRISHNA CERAMICS STORE
   Professional Invoice Generator
   Version 1.0
========================================================== */

"use strict";

/* ==========================================
   APP START
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeApp();

});

/* ==========================================
   INITIALIZE
========================================== */

function initializeApp() {

    console.log("✅ KRISHNA CERAMICS STORE Loaded");

    bindEvents();

}

/* ==========================================
   EVENTS
========================================== */

function bindEvents() {

    const newInvoice =
        document.getElementById("newInvoice");

    if (newInvoice) {

        newInvoice.addEventListener(
            "click",
            openInvoicePage
        );

    }

    const menuCards =
        document.querySelectorAll(".menu-card");

    menuCards.forEach(card => {

        if (card.id !== "newInvoice") {

            card.addEventListener("click", () => {

                alert(
                    "🚀 This module will be available in the next part."
                );

            });

        }

    });

}

/* ==========================================
   OPEN INVOICE
========================================== */

function openInvoicePage() {

    alert(
`📄 New Invoice

Invoice Generator Screen

Coming in PART 2 🚀`
    );

}
