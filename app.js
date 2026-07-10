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


let partyData = [];
let productData = [];
let transportData = [];

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
/* ===========================================
   READ PARTY MASTER
=========================================== */

const partySheet =
workbook.Sheets["Party_Master"];

partyData =
XLSX.utils.sheet_to_json(
partySheet,
{
    range:4
}
);

/* ===========================================
   READ PRODUCT MASTER
=========================================== */

const productSheet =
workbook.Sheets["Product_Master"];

productData =
XLSX.utils.sheet_to_json(
productSheet,
{
    range:4
}
);

/* ===========================================
   READ TRANSPORT MASTER
=========================================== */

const transportSheet =
workbook.Sheets["Transport_Master"];

transportData =
XLSX.utils.sheet_to_json(
transportSheet,
{
    range:4
}
);

console.log(partyData);
console.log(productData);
console.log(transportData);
        console.log(
            "✅ Excel Loaded"
        );

        console.log(
            workbook.SheetNames
        );

        alert(
            "✅ Master Database Loaded Successfully"
      );     

loadPartyDropdown(option.textContent =
party["Party Name"] || party["Party"] || party["Name"];);

loadProductDropdown();

loadTransportDropdown();
        
   };

    reader.readAsArrayBuffer(file);

}
/* ==========================================================
   PARTY DROPDOWN
========================================================== */

function loadPartyDropdown(){

const select =
document.getElementById("partySelect");

if(!select) return;

select.innerHTML =
'<option value="">Select Party</option>';

partyData.forEach((party,index)=>{

const option =
document.createElement("option");

option.value=index;

option.textContent=
party["Party Name"] || party["Party"] || party["Name"];

select.appendChild(option);

});

}


/* ==========================================================
   PRODUCT DROPDOWN
========================================================== */

function loadProductDropdown(){

const select =
document.getElementById("productSelect");

if(!select) return;

select.innerHTML =
'<option value="">Select Product</option>';

productData.forEach((item,index)=>{

const option =
document.createElement("option");

option.value=index;

option.textContent=
item["Product Name"] || item["Product"];

select.appendChild(option);

});

}


/* ==========================================================
   TRANSPORT DROPDOWN
========================================================== */

function loadTransportDropdown(){

const select =
document.getElementById("transportSelect");

if(!select) return;

select.innerHTML =
'<option value="">Select Transport</option>';

transportData.forEach((item,index)=>{

const option =
document.createElement("option");

option.value=index;

option.textContent=
item["Transport Name"] || item["Transport"];

select.appendChild(option);

});

}
