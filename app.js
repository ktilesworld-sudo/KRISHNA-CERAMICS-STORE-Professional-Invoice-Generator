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

    const home =
        document.querySelector(".home");

    const invoice =
        document.getElementById("invoiceScreen");

    if(home){

        home.style.display = "none";

    }

    if(invoice){

        invoice.style.display = "block";

    }

    setInvoiceDate();

} 
function setInvoiceDate(){

    const invoiceDate =
        document.getElementById("invoiceDate");

    if(!invoiceDate) return;

    const today =
        new Date();

    const yyyy =
        today.getFullYear();

    const mm =
        String(today.getMonth()+1)
        .padStart(2,"0");

    const dd =
        String(today.getDate())
        .padStart(2,"0");

    invoiceDate.value =
        `${yyyy}-${mm}-${dd}`;

}
/* ==========================================================
   EXCEL DATABASE
========================================================== */

let workbook = null;

const excelInput =
document.getElementById("excelFile");

if(excelInput){

    excelInput.addEventListener(
        "change",
        loadExcel
    );

}

function loadExcel(event){

    const file =
    event.target.files[0];

    if(!file){

        return;

    }

    const reader =
    new FileReader();

    reader.onload = function(e){

        const data =
        new Uint8Array(e.target.result);

        workbook =
        XLSX.read(data,{

            type:"array"

        });

        console.log(
            "✅ Excel Loaded"
        );

        console.log(
            workbook.SheetNames
        );

        alert(
            "✅ Master Database Loaded Successfully"
        );

    };

    reader.readAsArrayBuffer(file);

}
