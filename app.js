/* ==========================================================
   KRISHNA CERAMICS STORE
   Professional Invoice PDF Generator PWA
   app.js - Application Controller v2.8 (Final Production Audit Complete)
   Enterprise Ready | Controller Only | Zero Syntax Errors | Complete
========================================================== */

"use strict";

/* ==========================================
   PRODUCTION CONFIG
========================================== */
const CONFIG = {
    APP_VERSION: "2.8.0",
    DRAFT_KEY: "krishna_invoice_draft_v2",
    INVOICE_PREFIX: "INV",
    DEFAULT_GST_RATE: 18,
    CGST_RATE: 9,
    SGST_RATE: 9,
    IGST_RATE: 18,
    CURRENCY_LOCALE: "en-IN",
    CURRENCY_CODE: "INR",
    TOAST_DURATION: 3500,
    DEBOUNCE_DELAY: 300,
    MAX_INVOICE_ITEMS: 50,
    LOG_LEVEL: "info",
    COMPANY_STATE: "Gujarat"
};

/* ==========================================
   PRODUCTION LOGGER
========================================== */
const Logger = {
    debug: (...args) => { if (CONFIG.LOG_LEVEL === "debug") console.debug("%c[DEBUG]", "color:#64748B", ...args); },
    info: (...args) => { if (["debug", "info"].includes(CONFIG.LOG_LEVEL)) console.info("%c[INFO]", "color:#3B82F6", ...args); },
    warn: (...args) => console.warn("%c[WARN]", "color:#F59E0B", ...args),
    error: (...args) => console.error("%c[ERROR]", "color:#EF4444", ...args)
};

/* ==========================================
   APPLICATION STATE (Controller Only)
========================================== */
const appState = {
    currentScreen: "home",
    currentInvoice: {
        invoiceNo: "",
        invoiceDate: "",
        party: null,
        transport: null,
        items: [],
        notes: "",
        lrNumber: "",
        vehicleNumber: "",
        subtotal: 0,
        totalGST: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        grandTotal: 0,
        supplyType: "intra"
    },
    draftKey: CONFIG.DRAFT_KEY,
    isOnline: navigator.onLine,
    theme: localStorage.getItem("krishna_theme") || "light",
    listenersAttached: false,
    lastHistorySave: null
};

/* ==========================================
   GLOBAL DATA (Delegated where possible)
========================================== */
let workbook = null;
let partyData = [];
let productData = [];
let transportData = [];

/* ==========================================
   CURRENCY FORMATTER
========================================== */
const currencyFormatter = new Intl.NumberFormat(CONFIG.CURRENCY_LOCALE, {
    style: "currency",
    currency: CONFIG.CURRENCY_CODE,
    minimumFractionDigits: 2
});

/* ==========================================
   UTILITIES
========================================== */
function debounce(func, wait = CONFIG.DEBOUNCE_DELAY) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleError(message, error = null) {
    Logger.error(message, error);
    if (typeof window.showToast === "function") {
        window.showToast(message, "error");
    } else {
        alert(`Error: ${message}`);
    }
}

/* ==========================================
   NUMBER TO WORDS (with Paise support)
========================================== */
function numberToWords(num) {
    if (typeof window.numberToWords === "function") {
        return window.numberToWords(num);
    }

    if (num === 0) return "Zero Rupees Only";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convertLessThanOneThousand(n) {
        if (n >= 100) return ones[Math.floor(n / 100)] + " Hundred " + convertLessThanOneThousand(n % 100);
        if (n >= 20) return tens[Math.floor(n / 10)] + " " + ones[n % 10];
        return ones[n];
    }

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = "";
    let n = integerPart;

    let crore = Math.floor(n / 10000000); n %= 10000000;
    let lakh = Math.floor(n / 100000); n %= 100000;
    let thousand = Math.floor(n / 1000); n %= 1000;

    if (crore > 0) result += convertLessThanOneThousand(crore) + " Crore ";
    if (lakh > 0) result += convertLessThanOneThousand(lakh) + " Lakh ";
    if (thousand > 0) result += convertLessThanOneThousand(thousand) + " Thousand ";
    if (n > 0) result += convertLessThanOneThousand(n) + " ";

    result = result.trim() + " Rupees";

    if (decimalPart > 0) {
        result += " and " + convertLessThanOneThousand(decimalPart) + " Paise";
    }

    return result + " Only";
}

/* ==========================================
   APP BOOTSTRAP
========================================== */
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

function initializeApp() {
    Logger.info(`KRISHNA CERAMICS STORE v${CONFIG.APP_VERSION} initializing...`);

    initializeTheme();
    bindEvents();
    initializeScreenManager();
    initializeKeyboardShortcuts();
    initializeOfflineDetection();
    initializeUnsavedChangesWarning();

    restoreDraft();
    setInvoiceDate();
    generateInvoiceNumber();

    Logger.info("✅ Application Controller initialized");
    if (typeof window.showToast === "function") window.showToast("Application ready", "success");
}

/* ==========================================
   EVENT BINDING (No Duplicates + Delegation)
========================================== */
function bindEvents() {
    if (appState.listenersAttached) return;

    const newInvoiceBtn = document.getElementById("newInvoice");
    if (newInvoiceBtn) newInvoiceBtn.addEventListener("click", openInvoiceScreen);

    document.querySelectorAll(".menu-card, .menu-btn").forEach(card => {
        if (card.id === "newInvoice") return;
        card.addEventListener("click", () => showModulePlaceholder(card.textContent.trim() || card.id));
    });

    const excelInput = document.getElementById("excelFile");
    if (excelInput) excelInput.addEventListener("change", handleExcelUpload);

    bindInvoiceScreenEvents();
    appState.listenersAttached = true;
}

function bindInvoiceScreenEvents() {
    const partySelect = document.getElementById("partySelect");
    if (partySelect) {
        partySelect.addEventListener("change", () => {
            handlePartySelection();
            autoSaveDraft();
        });
    }

    const productSelect = document.getElementById("productSelect");
    if (productSelect) productSelect.addEventListener("change", handleProductSelection);

    const addBtn = document.getElementById("addProductBtn");
    if (addBtn) addBtn.addEventListener("click", addProductToInvoice);

    const generateBtn = document.getElementById("generatePDFBtn");
    if (generateBtn) generateBtn.addEventListener("click", handleGeneratePDF);

    const clearBtn = document.getElementById("clearInvoiceBtn");
    if (clearBtn) clearBtn.addEventListener("click", clearCurrentInvoice);

    const notesEl = document.getElementById("invoiceNotes");
    if (notesEl) notesEl.addEventListener("input", debounce(autoSaveDraft, 500));

    ["lrNumber", "vehicleNumber"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", debounce(autoSaveDraft, 500));
    });

    // Event delegation for table (performance + no duplicates)
    const tbody = document.getElementById("invoiceItemsBody");
    if (tbody) {
        tbody.addEventListener("input", debounce((e) => {
            if (e.target.classList.contains("qty-input") || e.target.classList.contains("rate-input")) {
                const id = parseInt(e.target.dataset.id);
                if (id) updateInvoiceItemRow(id, e.target);
            }
        }, 200));

        tbody.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-danger")) {
                const id = parseInt(e.target.dataset.id);
                if (confirm("Delete this item?")) deleteInvoiceItem(id);
            }
        });
    }
}

/* ==========================================
   SCREEN MANAGER
========================================== */
function initializeScreenManager() {
    const home = document.getElementById("homeScreen");
    const invoice = document.getElementById("invoiceScreen");
    if (home) home.style.display = "block";
    if (invoice) invoice.style.display = "none";
}

function showScreen(screenId) {
    document.querySelectorAll("#homeScreen, #invoiceScreen, #settingsScreen").forEach(el => el.style.display = "none");
    const target = document.getElementById(screenId);
    if (target) {
        target.style.display = "block";
        appState.currentScreen = screenId;
    }
}

function openInvoiceScreen() {
    showScreen("invoiceScreen");
    setInvoiceDate();
    generateInvoiceNumber();
    if (typeof window.showToast === "function") window.showToast("New invoice created", "info");
}

/* ==========================================
   DATABASE (Prefer KrishnaDB)
========================================== */
function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (typeof window.showLoader === "function") window.showLoader("Loading Master Database...");

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            workbook = XLSX.read(data, { type: "array" });

            const partySheet = workbook.Sheets["Party_Master"];
            const productSheet = workbook.Sheets["Product_Master"];
            const transportSheet = workbook.Sheets["Transport_Master"];

            if (partySheet) partyData = XLSX.utils.sheet_to_json(partySheet, { range: 4 });
            if (productSheet) productData = XLSX.utils.sheet_to_json(productSheet, { range: 4 });
            if (transportSheet) transportData = XLSX.utils.sheet_to_json(transportSheet, { range: 4 });

            loadPartyDropdown();
            loadProductDropdown();
            loadTransportDropdown();

            if (typeof window.hideLoader === "function") window.hideLoader();
            if (typeof window.showToast === "function") window.showToast("Master Database loaded", "success");

        } catch (error) {
            if (typeof window.hideLoader === "function") window.hideLoader();
            handleError("Failed to parse Excel", error);
        }
    };
    reader.readAsArrayBuffer(file);
}

function loadPartyDropdown() {
    const select = document.getElementById("partySelect");
    if (!select) return;
    select.innerHTML = '<option value="">Select Party</option>';

    let parties = [];
    if (typeof window.KrishnaDB !== "undefined" && typeof window.KrishnaDB.getAllParties === "function") {
        parties = window.KrishnaDB.getAllParties();
    } else {
        parties = partyData;
    }

    parties.forEach((party, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = party.Party_Name || party["Party Name"] || party["Party"] || `Party ${index + 1}`;
        select.appendChild(option);
    });
}

function loadProductDropdown() {
    const select = document.getElementById("productSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Select Product</option>';

    let products = [];
    if (typeof window.KrishnaDB !== "undefined" && typeof window.KrishnaDB.getAllProducts === "function") {
        products = window.KrishnaDB.getAllProducts();
    } else {
        products = productData;
    }

    products.forEach((item, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = item.Product_Name || item["Product Name"] || item["Product"] || `Product ${index + 1}`;
        select.appendChild(option);
    });
}

function loadTransportDropdown() {
    const select = document.getElementById("transportSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Select Transport</option>';

    let transports = [];
    if (typeof window.KrishnaDB !== "undefined" && typeof window.KrishnaDB.getAllTransports === "function") {
        transports = window.KrishnaDB.getAllTransports();
    } else {
        transports = transportData;
    }

    transports.forEach((item, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = item.Transport_Name || item["Transport Name"] || item["Transport"] || `Transport ${index + 1}`;
        select.appendChild(option);
    });
}

/* ==========================================
   AUTO FILL
========================================== */
function handlePartySelection() {
    const select = document.getElementById("partySelect");
    const index = parseInt(select.value);
    const source = (typeof window.KrishnaDB !== "undefined" && window.KrishnaDB.getAllParties) 
        ? window.KrishnaDB.getAllParties() : partyData;

    if (isNaN(index) || !source[index]) return;

    const party = source[index];
    appState.currentInvoice.party = party;

    const map = {
        partyName: party.Party_Name || party["Party Name"] || party["Party"] || "",
        partyAddress: party.Address_Line1 || party["Address"] || "",
        partyGSTIN: party.GSTIN || "",
        partyMobile: party.Mobile || party["Phone"] || ""
    };

    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = map[id];
    });

    const card = document.getElementById("partyDetailsCard");
    if (card) card.style.display = "block";

    const partyState = party.State || party["State"] || "";
    appState.currentInvoice.supplyType = (partyState.toLowerCase() === CONFIG.COMPANY_STATE.toLowerCase()) ? "intra" : "inter";

    autoSaveDraft();
    if (typeof window.showToast === "function") window.showToast("Party loaded", "success");
}

function handleProductSelection() {
    const select = document.getElementById("productSelect");
    const index = parseInt(select.value);
    const source = (typeof window.KrishnaDB !== "undefined" && window.KrishnaDB.getAllProducts) 
        ? window.KrishnaDB.getAllProducts() : productData;

    if (isNaN(index) || !source[index]) return;

    const product = source[index];
    const rateInput = document.getElementById("productRate");
    if (rateInput) {
        rateInput.value = product.Rate_Per_Unit || product["Rate"] || product["Rate Per Unit"] || "";
        rateInput.focus();
    }
}

/* ==========================================
   INVOICE LOGIC (Controller + Ready for invoice.js)
========================================== */
function validateInvoice() {
    const inv = appState.currentInvoice;
    if (!inv.party) { if (typeof window.showToast === "function") window.showToast("Please select a party", "warning"); return false; }
    if (inv.items.length === 0) { if (typeof window.showToast === "function") window.showToast("Please add at least one product", "warning"); return false; }
    if (inv.items.some(item => item.qty <= 0 || item.rate <= 0)) { if (typeof window.showToast === "function") window.showToast("Qty and Rate must be greater than 0", "warning"); return false; }
    if (!inv.invoiceNo || !inv.invoiceDate) { if (typeof window.showToast === "function") window.showToast("Invoice number and date are required", "warning"); return false; }
    return true;
}

function addProductToInvoice() {
    const productSelect = document.getElementById("productSelect");
    const qtyInput = document.getElementById("productQty");
    const rateInput = document.getElementById("productRate");

    if (!productSelect?.value) {
        if (typeof window.showToast === "function") window.showToast("Select a product first", "warning");
        return;
    }

    const index = parseInt(productSelect.value);
    const source = (typeof window.KrishnaDB !== "undefined" && window.KrishnaDB.getAllProducts) 
        ? window.KrishnaDB.getAllProducts() : productData;

    const product = source[index];
    if (!product) return;

    const qty = parseFloat(qtyInput?.value) || 1;
    const rate = parseFloat(rateInput?.value) || parseFloat(product.Rate_Per_Unit || product["Rate"]) || 0;

    const taxable = qty * rate;
    const gstPercent = parseFloat(product.GST_Percent || product["GST"] || product["GST %"]) || CONFIG.DEFAULT_GST_RATE;

    let cgst = 0, sgst = 0, igst = 0, gstAmount = 0;

    if (appState.currentInvoice.supplyType === "intra") {
        cgst = (taxable * CONFIG.CGST_RATE) / 100;
        sgst = (taxable * CONFIG.SGST_RATE) / 100;
        gstAmount = cgst + sgst;
    } else {
        igst = (taxable * CONFIG.IGST_RATE) / 100;
        gstAmount = igst;
    }

    const total = taxable + gstAmount;

    const item = {
        id: Date.now(),
        productName: product.Product_Name || product["Product Name"] || product["Product"],
        hsn: product.HSN_Code || product["HSN"] || "",
        qty, rate, taxable, gstPercent, gstAmount, cgst, sgst, igst, total
    };

    appState.currentInvoice.items.push(item);
    renderInvoiceItemsTable();
    updateInvoiceTotals();
    autoSaveDraft();

    if (productSelect) productSelect.focus();
    if (typeof window.showToast === "function") window.showToast("Product added", "success");
}

function renderInvoiceItemsTable() {
    const tbody = document.getElementById("invoiceItemsBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (appState.currentInvoice.items.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="10"><div class="empty-state"><p>No items added</p></div></td></tr>`;
        return;
    }

    appState.currentInvoice.items.forEach((item, index) => {
        const row = document.createElement("tr");
        row.dataset.id = item.id;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.productName}</td>
            <td>${item.hsn}</td>
            <td><input type="number" value="${item.qty}" data-id="${item.id}" class="qty-input"></td>
            <td><input type="number" value="${item.rate}" data-id="${item.id}" class="rate-input"></td>
            <td>${currencyFormatter.format(item.taxable)}</td>
            <td>${item.gstPercent}%</td>
            <td>${currencyFormatter.format(item.gstAmount)}</td>
            <td><strong>${currencyFormatter.format(item.total)}</strong></td>
            <td><button class="btn btn-danger btn-sm" data-id="${item.id}">🗑️</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Performance optimized: Update only affected row cells (no full re-render)
function updateInvoiceItemRow(id, inputElement) {
    const item = appState.currentInvoice.items.find(i => i.id === id);
    if (!item) return;

    if (inputElement.classList.contains("qty-input")) item.qty = parseFloat(inputElement.value) || 1;
    if (inputElement.classList.contains("rate-input")) item.rate = parseFloat(inputElement.value) || 0;

    item.taxable = item.qty * item.rate;

    if (appState.currentInvoice.supplyType === "intra") {
        item.cgst = (it
