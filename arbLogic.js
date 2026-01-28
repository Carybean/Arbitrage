
// ===== DARK/LIGHT MODE FUNCTIONALITY =====
const themeSwitch = document.getElementById('theme-switch');
const body = document.body;
const lightLabel = document.getElementById('light-label');
const darkLabel = document.getElementById('dark-label');

// Check for saved theme preference or default to light
const savedTheme = localStorage.getItem('theme') || 'light';

// Apply saved theme
function applyTheme(theme) {
    if (theme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
        lightLabel.classList.remove('active');
        lightLabel.classList.add('inactive');
        darkLabel.classList.remove('inactive');
        darkLabel.classList.add('active');
    } else {
        body.removeAttribute('data-theme');
        themeSwitch.checked = false;
        lightLabel.classList.remove('inactive');
        lightLabel.classList.add('active');
        darkLabel.classList.remove('active');
        darkLabel.classList.add('inactive');
    }
}

// Apply saved theme on load
applyTheme(savedTheme);

// Theme toggle event
themeSwitch.addEventListener('change', function() {
    if (this.checked) {
        localStorage.setItem('theme', 'dark');
        applyTheme('dark');
    } else {
        localStorage.setItem('theme', 'light');
        applyTheme('light');
    }
});

function handleDetailsForScreen() {
    const detailsList = document.querySelectorAll("details.instruction-section");
    if (window.innerWidth >= 1200) {
        detailsList.forEach(detail => detail.setAttribute("open", ""));
    }
    else {
        detailsList.forEach(detail => detail.removeAttribute("open"));
    }
}

handleDetailsForScreen();
window.addEventListener("resize", handleDetailsForScreen);

// ===== ORIGINAL JAVASCRIPT CODE =====
const calcu = document.getElementById("calculate");
const section = document.getElementById("section");
const reset = document.getElementById("reset");
const inputOne = Number(document.getElementById("first-odd").value);
const inputTwo = Number(document.getElementById("second-odd").value);
const amount = Number(document.getElementById("amount").value);
const stake1 = document.getElementById("stake-one");
const payout1 = document.getElementById("payout-one");
const stake2 = document.getElementById("stake-two");
const payout2 = document.getElementById("payout-two");
const profitTotal = document.getElementById("profit");
const roiTotal = document.getElementById("roi");
const container = document.getElementById("container");
const addMore = document.getElementById("add-more");
const removeMore = document.getElementById("remove-more");
const template = document.getElementById("template");
const templateId = document.getElementById("template-id");
const addMessage = document.getElementById("add-message");
const removeMessage = document.getElementById("remove-message");
const alertDialog = document.getElementById("alertDialog");
const msg = document.getElementById("msg");
const okBtn = document.getElementById("okBtn");

const countArray = ["countOne", "countTwo"];

let inputValid = false;
let pointEnd = false;
window.allInputsValid = false;

function inputValidityCheck (){
    if(!inputValid){
        const groups = document.querySelectorAll(".bet-section");
        groups.forEach((group) => {
            const inputVar = group.querySelector("input");
            const erMsgg = group.querySelector(".error-message");

            const vall = inputVar.value;
            if (vall === ""){
                inputVar.classList.add("invalid");
                erMsgg.textContent = "Required";
                erMsgg.style.visibility = "visible";
            }
        });
    }
}

function pointValidityCheck (){
    if(pointEnd){
        const groups = document.querySelectorAll(".bet-section");
        groups.forEach((group) => {
            const inputVar = group.querySelector("input");
            const erMsgg = group.querySelector(".error-message");

            const vall = inputVar.value;
            const numberParts = vall.slice(1);

            if(vall.endsWith("/") || vall.endsWith(".") || vall.endsWith("+") || vall.endsWith("-")){
                inputVar.classList.add("invalid");
                erMsgg.textContent = "Complete it...";
                erMsgg.style.visibility = "visible";
            }
            else if(vall.startsWith("+") || vall.startsWith("-")){
                if(numberParts !== "" && parseFloat(numberParts) < 100){
                    inputVar.classList.add("invalid");
                    erMsgg.textContent = "Complete it...";
                    erMsgg.style.visibility = "visible";
                }
                else if(parseFloat(numberParts) > 100){
                    inputVar.classList.remove("invalid");
                    erMsgg.style.visibility = "hidden";
                }
            }
        });
    }     
}

document.addEventListener("input", function(e) {
    if (!e.target.closest(".bet-section") || e.target.tagName !== "INPUT") return;

    const input = e.target;
    const errorMsg = input.parentNode.querySelector(".error-message");
    const val = input.value;
    let lastValidValue = input.dataset.lastValue || "";
    let isValid = true;
    let message = "";

    // --- VALIDATION LOGIC ---
    if (val === "") {
        isValid = true;
        inputValid = false;
        inputValidityCheck();
    }
    else if (!/^[0-9./+-]*$/.test(val)) {
        isValid = false;
        message = "Forbidden character";
    }
    else if (/^[0./]/.test(val)) {
        isValid =false;
        message = "Cannot start";
    }
    else if ((val.includes("+") && val.indexOf("+") !== 0) || (val.includes("-") && val.indexOf("-") !== 0)) {
        isValid = false;
        message = "Wrong position";
    }
    else if (/([./+-]).*?\1/.test(val)) {
        isValid  = false;
        message = "No duplicate";
    }
    else if (/^[+-]/.test(val) && /[./]/.test(val)) {
        isValid = false;
        message = "Not allowed";
    }
    else if (val.includes(".") && val.includes("/")) {
        isValid = false;
        message = "Not allowed";
    }
    else if (/\/0/.test(val)) {
        isValid = false;
        message = "Cannot follow";
    }
    else if (/^[0-9./+-]*$/.test(val)) {
        isValid = true;      

        if(/[./+-]$/.test(val)){
            pointEnd = true;
            inputValid = false;
        }
        else{
            pointEnd = false;
            inputValid = true;
            input.classList.remove("invalid");
        }
        if (/^[+-]/.test(val)){
            const numberPart = val.slice(1);
            if(numberPart !== "" && parseFloat(numberPart) < 100){
                pointEnd = true; 
                inputValid = false;
            }
            else if(parseFloat(numberPart) > 100){
                pointEnd = false;
                inputValid = true;
            }
        }    
    }

    // --- REACTION ----
    if (!isValid) {
        input.value = lastValidValue;
        input.classList.add("invalid");
        errorMsg.textContent = message;
        errorMsg.style.visibility = 'visible';
        if(!val === ""){
            setTimeout(() => {
                input.classList.remove("invalid");
                errorMsg.style.visibility = 'hidden';
            }, 2000);
        }   
        else if (inputValid){
            setTimeout(() => {
                input.classList.remove("invalid");
                errorMsg.style.visibility = 'hidden';
            }, 2000);
        }
    }
    else {
        input.dataset.lastValue = val;
        errorMsg.style.visibility = 'hidden';
    }
    inputValidityCheck();
    pointValidityCheck();
    updateGlobalStatus();
});

function updateGlobalStatus(){
    const allInputs = document.querySelectorAll(".bet-section input");

    let formIsReady = true;
    allInputs.forEach(inp  => {
        const val = inp.value.trim();
        if (val === "" || /[./+-]$/.test(val)){
            formIsReady = false;
        }
    });
    window.allInputsValid = formIsReady;
}

const selectElement = document.getElementById("items");
const selectValue = selectElement.value;

let choosenValue = "0.00";
selectElement.addEventListener("change", (event) => {
    const choice = event.target.value;

    if (choice === "0.0") {
        choosenValue = "0.0";
    }
    else if (choice === "1") {
        choosenValue = "1";
    }
    else if (choice === "10") {
        choosenValue = "10";
    }
    else if (choice === "100") {
        choosenValue = "100";
    }
    else if (choice === "1000") {
        choosenValue = "1000";
    }
    else if (choice === "10000") {
        choosenValue = "10000";
    }
    else if (choice === "100000") {
        choosenValue = "100000";
    }
    else{
        choosenValue = "0.00";
    }
    // Trigger calculation
    if (window.allInputsValid && amountValid) {
        calcu.click();
    }
});

const amounts = document.getElementById("amount");
const specialError = document.getElementById("special-error");

let lastNumericValue = "";
let amountValid = false;

function amountValidity (){
    if (!amountValid) {
        const amountVar = document.querySelector(".amount");
        const amountValue = amountVar.value;
        if (amountValue.endsWith(".") || lastNumericValue == "."){
            specialError.textContent = "Complete it...";
            specialError.style.visibility = "visible";
            amountVar.style.borderColor = "red";
        }
        else{
            specialError.textContent = "Required";
            specialError.style.visibility = "visible";
            amountVar.style.borderColor = "red";
        }
    }
}

amounts.addEventListener("input", function() {
    const amountVar = document.querySelector(".amount");
    const val = amountVar.value;
    let isValid = true;
    let message = "";

    if (val === "") {
        isValid = true;
        amountValid = false;
        amountValidity();
    }
    else if (!/^[0-9.]*$/.test(val)) {
        isValid = false;
        message = "Forbidden character";
    }
    else if (val.startsWith(".")) {
        isValid = false;
        message = "Cannot start";
    }
    else if ((val.match(/\./g) || []).length > 1) {
        isValid = false;
        message = "Not allow again";
    }
    else if (/^[0-9./+-]*$/.test(val)) {
        isValid = true;

        if(/[.]$/.test(val)){
            amountValid = false;
        }
        else{
            amountValid = true;
        }
    }

    if (!isValid) {
        amountVar.value = lastNumericValue;

        specialError.textContent = message;
        specialError.style.visibility = "visible";
        amountVar.style.borderColor = "red";
        if(amountValid) {
            setTimeout(() => {
                specialError.style.visibility = "hidden";
                amountVar.style.borderColor = "";
            }, 2000);
        }
    }
    else {
        lastNumericValue = val;
        if(!amountValid){
            specialError.style.visibility = "visible";
            amountVar.style.borderColor = "red";
        }
        else{
            specialError.style.visibility = "hidden";
            amountVar.style.borderColor = "";
        }
    }
    amountValidity();
});

okBtn.addEventListener("click", () => {
    alertDialog.close();
});

function showAlert(message) {
    msg.textContent = message;
    alertDialog.showModal();
    setTimeout(() => {
        alertDialog.close();
    }, 2000);
}

calcu.addEventListener("click", () => {
    if(window.allInputsValid && amountValid && !pointEnd){
        const inputOne = document.getElementById("first-odd").value;
        const inputTwo = document.getElementById("second-odd").value;
        const amountVal = document.getElementById("amount").value;
        const amountNum = Number(amountVal);
        
        let stakeArrayHtml =  [stake1, stake2];
        let payoutArrayHtml = [payout1, payout2];
        
        let inputArray = [inputOne, inputTwo];

        // Collect all inputs from dynamically added bets
        if(countArray.length >= 3){
            const inputTh = document.getElementById("three");
            const stake3 = document.getElementById("stake3");
            const payout3 = document.getElementById("payout3");
            
            if(inputTh && inputTh.value){
                inputArray.push(inputTh.value);
                stakeArrayHtml.push(stake3);
                payoutArrayHtml.push(payout3);
            }
        }
        if(countArray.length >= 4){
            const inputFr = document.getElementById("four");
            const stake4 = document.getElementById("stake4");
            const payout4 = document.getElementById("payout4");
            
            if(inputFr && inputFr.value){
                inputArray.push(inputFr.value);
                stakeArrayHtml.push(stake4);
                payoutArrayHtml.push(payout4);
            }
        }
        if(countArray.length >= 5){
            const inputFi = document.getElementById("five");
            const stake5 = document.getElementById("stake5");
            const payout5 = document.getElementById("payout5");
            
            if(inputFi && inputFi.value){
                inputArray.push(inputFi.value);
                stakeArrayHtml.push(stake5);
                payoutArrayHtml.push(payout5);
            }
        }
        if(countArray.length >= 6){
            const inputSi = document.getElementById("six");
            const stake6 = document.getElementById("stake6");
            const payout6 = document.getElementById("payout6");
            
            if(inputSi && inputSi.value){
                inputArray.push(inputSi.value);
                stakeArrayHtml.push(stake6);
                payoutArrayHtml.push(payout6);
            }
        }
        if(countArray.length >= 7){
            const inputSe = document.getElementById("seven");
            const stake7 = document.getElementById("stake7");
            const payout7 = document.getElementById("payout7");
            
            if(inputSe && inputSe.value){
                inputArray.push(inputSe.value);
                stakeArrayHtml.push(stake7);
                payoutArrayHtml.push(payout7);
            }
        }
        if(countArray.length >= 8){
            const inputEi = document.getElementById("eight");
            const stake8 = document.getElementById("stake8");
            const payout8 = document.getElementById("payout8");
            
            if(inputEi && inputEi.value){
                inputArray.push(inputEi.value);
                stakeArrayHtml.push(stake8);
                payoutArrayHtml.push(payout8);
            }
        }
        if(countArray.length >= 9){
            const inputNe = document.getElementById("nine");
            const stake9 = document.getElementById("stake9");
            const payout9 = document.getElementById("payout9");
            
            if(inputNe && inputNe.value){
                inputArray.push(inputNe.value);
                stakeArrayHtml.push(stake9);
                payoutArrayHtml.push(payout9);
            }
        }
        if(countArray.length >= 10){
            const inputTe = document.getElementById("ten");
            const stake10 = document.getElementById("stake10");
            const payout10 = document.getElementById("payout10");
            
            if(inputTe && inputTe.value){
                inputArray.push(inputTe.value);
                stakeArrayHtml.push(stake10);
                payoutArrayHtml.push(payout10);
            }
        }

        // Convert all odds to decimal format
        let decimalOdds = [];
        for (let i=0; i<inputArray.length; i++){
            if(inputArray[i].includes("/")) {
                const [a, b] = inputArray[i].split("/").map(Number);
                decimalOdds[i] = (a / b) + 1;
            }           
            else if(inputArray[i].startsWith("+")) { 
                const absNumPo = Math.abs(inputArray[i]);
                decimalOdds[i] = 1 + (absNumPo / 100);
            }
            else if (inputArray[i].startsWith("-")){
                const absNumNe = Math.abs(inputArray[i]);
                decimalOdds[i] = 1 + (100 / absNumNe);
            }
            else{
                decimalOdds[i] = Number(inputArray[i]);
            }
        }
            
        function calSum(inputs){
            let oddSum = 0;
            for ( let i=0; i<inputs.length; i++){
                oddSum += 1/inputs[i];
            }
            return oddSum;
        }
        const sumCal = calSum(decimalOdds);

        let stakeArray =  [];
        let payoutArray = [];
        
        // Store for history
        window.lastCalculation = {
            odds: inputArray,
            decimalOdds: decimalOdds,
            totalStake: amountVal,
            choosenValue: choosenValue,
            sumCal: sumCal
        };
        
        if (sumCal < 1){
            for (const odd of decimalOdds){
                const staker = (amountNum * (1/odd))/sumCal;
                let stake;
                if (choosenValue === "0.00"){
                    stake = Math.round(staker * 100) / 100;
                }
                else if (choosenValue === "0.0"){
                    stake = Math.round(staker * 10) / 10;
                }
                else if (choosenValue === "1"){
                    stake = Math.round(staker / 1) * 1;
                }
                else if (choosenValue === "10"){
                    stake = Math.round(staker / 10) * 10;
                }
                else if (choosenValue === "100"){
                    stake = Math.round(staker / 100) * 100;
                }
                else if (choosenValue === "1000"){
                    stake = Math.round(staker / 1000) * 1000;
                }
                else if (choosenValue === "10000"){
                    stake = Math.round(staker / 10000) * 10000;
                }
                else if (choosenValue === "100000"){
                    stake = Math.round(staker / 100000) * 100000;
                }

                let payout = (stake * odd);
                stakeArray.push(stake);
                payoutArray.push(Math.round(payout * 100) / 100);
            }
            const profit = ((1/sumCal) - 1) * 100;
            let roi =  `${Math.round(profit * 100) / 100}%`;
            let totalProfit = (profit/100) * amountNum;

            stakeArray.push(Math.round(totalProfit * 100) / 100);
            payoutArray.push(roi);
            
            let stakeFlag = 0;
            let payoutFlag = 0;
            for ( let i=0; i<stakeArray.length; i++){
                const stakeWord = stakeArray[i]; 
                if (stakeFlag < inputArray.length){
                    stakeArrayHtml[i].textContent = `Stake ${i + 1} : $${stakeWord}`;
                }
                else{
                    profitTotal.textContent = `Estimated Profit : $${stakeWord}`;
                }
                stakeFlag++;
                profitTotal.style.borderColor = "#2ecc71";

                const payoutWord = payoutArray[i];
                if (payoutFlag < inputArray.length){
                    payoutArrayHtml[i].textContent = `Payout ${i + 1} : $${payoutWord}`;
                }
                else{
                    roiTotal.textContent = `Estimated ROI : +${payoutWord}`;
                }
                payoutFlag++;
                roiTotal.style.borderColor = "#2ecc71";
            }
            
            // Store calculation results for history
            window.lastCalculationResult = {
                stakeArray: stakeArray.slice(0, -1), // Exclude profit/loss
                payoutArray: payoutArray.slice(0, -1), // Exclude ROI
                profit: stakeArray[stakeArray.length - 1],
                roi: parseFloat(roi)
            };
        }
        else {
            for (const odd of decimalOdds){
                const staker = (amountNum * (1/odd))/sumCal;
                let stake;
                if (choosenValue === "0.00"){
                    stake = Math.round(staker * 100) / 100;
                }
                else if (choosenValue === "0.0"){
                    stake = Math.round(staker * 10) / 10;
                }
                else if (choosenValue === "1"){
                    stake = Math.round(staker / 1) * 1;
                }
                else if (choosenValue === "10"){
                    stake = Math.round(staker / 10) * 10;
                }
                else if (choosenValue === "100"){
                    stake = Math.round(staker / 100) * 100;
                }
                else if (choosenValue === "1000"){
                    stake = Math.round(staker / 1000) * 1000;
                }
                else if (choosenValue === "10000"){
                    stake = Math.round(staker / 10000) * 10000;
                }
                else if (choosenValue === "100000"){
                    stake = Math.round(staker / 100000) * 100000;
                }

                let payout = (stake * odd);
                stakeArray.push(stake);
                payoutArray.push(Math.round(payout * 100) / 100);
            }
            const profit = ((1/sumCal) - 1) * 100;
            let roi =  `${Math.round(profit * 100) / 100}%`;
            let totalProfit = (profit/100) * amountNum;

            stakeArray.push(Math.round(totalProfit * 100) / 100);
            payoutArray.push(roi);

            let stakeFlag = 0;
            let payoutFlag = 0;
            for ( let i=0; i<stakeArray.length; i++){
                const stakeWord = stakeArray[i]; 
                if (stakeFlag < inputArray.length){
                    stakeArrayHtml[i].textContent = `Stake ${i + 1} : $${stakeWord}`;
                }
                else{
                    profitTotal.textContent = `Estimated Loss : $${stakeWord}`;
                }
                stakeFlag++;
                profitTotal.style.borderColor = "red";

                const payoutWord = payoutArray[i];
                if (payoutFlag < inputArray.length){
                    payoutArrayHtml[i].textContent = `Payout ${i + 1} : $${payoutWord}`;
                }
                else{
                    roiTotal.textContent = `Estimated ROI : ${payoutWord}`;
                }
                payoutFlag++;
                roiTotal.style.borderColor = "red";
            }
            
            // Store calculation results for history
            window.lastCalculationResult = {
                stakeArray: stakeArray.slice(0, -1), // Exclude profit/loss
                payoutArray: payoutArray.slice(0, -1), // Exclude ROI
                profit: stakeArray[stakeArray.length - 1],
                roi: parseFloat(roi)
            };
        }
        
        if (!inputOne) {
            stake1.textContent = "Stake 1 : $00.00";
            payout1.textContent = "Payout 1 : $00.00";
        }

        if (!inputTwo) {
            stake2.textContent = "Stake 2 : $00.00";
            payout2.textContent = "Payout 2 : $00.00";
        }
    }
    else{
        showAlert(`Please enter valid odds and stake amount.`);
    }
});

reset.addEventListener("click", () => {
    const inputs = document.querySelectorAll('#section input[type="text"]');
    inputs.forEach(input => {
        input.value = '';
        inputValid = false;
        pointEnd = false;
        window.allInputsValid = false;
        lastNumericValue = "";
        amountValid = false;
        inputValidityCheck();
        pointValidityCheck();
        amountValidity();
        updateGlobalStatus();
    });

    // Reset all stakes and payouts
    const stakeElements = document.querySelectorAll('[id^="stake"], [id^="payout"]');
    stakeElements.forEach(el => {
        if (el.id.includes('stake')) {
            const num = el.id.match(/\d+/)?.[0] || '1';
            el.textContent = `Stake ${num} : $00.00`;
        } else if (el.id.includes('payout')) {
            const num = el.id.match(/\d+/)?.[0] || '1';
            el.textContent = `Payout ${num} : $00.00`;
        }
    });

    profitTotal.textContent = "Estimated Profit : $00.00";
    roiTotal.textContent = "Estimated ROI : 00.00%";
    
    profitTotal.style.borderColor = "#2c3e50";
    roiTotal.style.borderColor = "#2c3e50";

    // Clear last calculation
    window.lastCalculation = null;
    window.lastCalculationResult = null;
});

addMore.addEventListener("click", () => {
    if (countArray.length < 10){
        const clone = template.content.cloneNode(true);
        clone.hidden = false;
        clone.getElementById("spanco1").textContent = countArray.length + 1;
        clone.getElementById("spanco2").textContent = countArray.length + 1;
        clone.getElementById("spanco3").textContent = countArray.length + 1;
        
        if (countArray.length == 2){
            const stakeClass = clone.querySelector(".third-stake");
            const payoutClass = clone.querySelector(".third-payout");
            const inputClass = clone.querySelector(".third");
            stakeClass.id = "stake3";
            payoutClass.id = "payout3";
            inputClass.id = "three";
        }
        else if (countArray.length == 3){
            const stakeClass = clone.querySelector(".third-stake");
            const payoutClass = clone.querySelector(".third-payout");
            const inputClass = clone.querySelector(".third");
            stakeClass.id = "stake4";
            payoutClass.id = "payout4";
            inputClass.id = "four";
        }
        else if (countArray.length == 4){
            const stakeClass = clone.querySelector(".third-stake");
            const payoutClass = clone.querySelector(".third-payout");
            const inputClass = clone.querySelector(".third");
            stakeClass.id = "stake5";
            payoutClass.id = "payout5";
            inputClass.id = "five";
        }
        else if (countArray.length == 5){
            const stakeClass = clone.querySelector(".third-stake");
            const payoutClass = clone.querySelector(".third-payout");
            const inputClass = clone.querySelector(".third");
            stakeClass.id = "stake6";
            payoutClass.id = "payout6";
            inputClass.id = "six";
        }
        else if (countArray.length == 6){
            const stakeClass = clone.querySelector(".third-stake");
            const payoutClass = clone.querySelector(".third-payout");
            const inputClass = clone.querySelector(".third");
            stakeClass.id = "stake7";
            payoutClass.id = "payout7";
            inputClass.id = "seven";
        }
        else if (countArray.length == 7){
            const stakeClass = clone.querySelector(".third-stake");
            const payoutClass = clone.querySelector(".third-payout");
            const inputClass = clone.querySelector(".third");
            stakeClass.id = "stake8";
            payoutClass.id = "payout8";
            inputClass.id = "eight";
        }
        else if (countArray.length == 8){
            const stakeClass = clone.querySelector(".third-stake");
            const payoutClass = clone.querySelector(".third-payout");
            const inputClass = clone.querySelector(".third");
            stakeClass.id = "stake9";
            payoutClass.id = "payout9";
            inputClass.id = "nine";
        }
        else if (countArray.length == 9){
            const stakeClass = clone.querySelector(".third-stake");
            const payoutClass = clone.querySelector(".third-payout");
            const inputClass = clone.querySelector(".third");
            stakeClass.id = "stake10";
            payoutClass.id = "payout10";
            inputClass.id = "ten";
        }
        else{
            console.log("Something is wrong with the ID of input Template");
        }
        container.appendChild(clone);
        countArray.push("countIncrease");
    }
    else{
        addMessage.style.display = "block";
        setTimeout(() => {
            addMessage.style.display ="none";
        }, 3000);
    }

    inputValid = false;
    inputValidityCheck();
    updateGlobalStatus();
});

removeMore.addEventListener("click", () => {
    const lastItem = container.lastElementChild;
    if (countArray.length > 2){
        if (lastItem) {
            lastItem.remove();
            countArray.pop();
        }
    }
    else{
        removeMessage.style.display = "block";
        setTimeout(() => {
            removeMessage.style.display ="none";
        }, 3000);
    }
    updateGlobalStatus();
    if (window.allInputsValid && amountValid) {
        calcu.click();
    }
});

section.addEventListener("submit", (e) => {
    e.preventDefault();
});

inputValidityCheck();
pointValidityCheck();
amountValidity();

// ===== RESULTS HISTORY FUNCTIONALITY =====
const saveResultBtn = document.getElementById('save-result');
const clearHistoryBtn = document.getElementById('clear-history');
const historyContainer = document.getElementById('history-container');
const totalCalculations = document.getElementById('total-calculations');
const totalProfit = document.getElementById('total-profit');
const avgRoi = document.getElementById('avg-roi');

// Load history from localStorage
let calculationHistory = JSON.parse(localStorage.getItem('arbitrageHistory')) || [];

// Initialize history display
updateHistoryDisplay();

// Save result function - FIXED VERSION
saveResultBtn.addEventListener('click', function() {
    if (!window.lastCalculation || !window.lastCalculationResult) {
        showAlert('Please complete a calculation first before saving.');
        return;
    }
    
    // Get current calculation data
    const odds = window.lastCalculation.odds;
    const stakes = window.lastCalculationResult.stakeArray;
    const payouts = window.lastCalculationResult.payoutArray;
    const totalStake = window.lastCalculation.totalStake;
    const profit = window.lastCalculationResult.profit;
    const roi = window.lastCalculationResult.roi;
    
    // Create history item
    const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        odds: odds,
        stakes: stakes,
        payouts: payouts,
        totalStake: parseFloat(totalStake),
        profit: profit,
        roi: roi,
        rounded: window.lastCalculation.choosenValue,
        isProfit: profit > 0
    };
    
    // Add to history
    calculationHistory.unshift(historyItem);
    
    // Keep only last 50 calculations
    if (calculationHistory.length > 50) {
        calculationHistory = calculationHistory.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('arbitrageHistory', JSON.stringify(calculationHistory));
    
    // Update display
    updateHistoryDisplay();
    
    // Show confirmation
    showAlert(`Calculation saved to history!`);
});

// Clear history function
clearHistoryBtn.addEventListener('click', function() {
    if (calculationHistory.length === 0) {
        showAlert('History is already empty.');
        return;
    }
    
    if (confirm('Are you sure you want to clear all calculation history?')) {
        calculationHistory = [];
        localStorage.removeItem('arbitrageHistory');
        updateHistoryDisplay();
        showAlert('History cleared successfully.');
    }
});

// Update history display - FIXED VERSION
function updateHistoryDisplay() {
    if (calculationHistory.length === 0) {
        // Show empty message
        historyContainer.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-history"></i>
                <h3>No calculations saved yet</h3>
                <p>Use the calculator and click "Save Result" to add calculations to your history.</p>
            </div>
        `;
        
        // Update statistics
        totalCalculations.textContent = 'Total: 0';
        totalProfit.textContent = 'Profit: $0.00';
        avgRoi.textContent = 'Avg ROI: 0%';
        return;
    }
    
    // Clear container and add history items
    historyContainer.innerHTML = '';
    
    // Calculate statistics
    let totalProfitSum = 0;
    let totalRoiSum = 0;
    
    // Add history items
    calculationHistory.forEach(item => {
        totalProfitSum += item.profit;
        totalRoiSum += item.roi;
        
        const historyItem = createHistoryElement(item);
        historyContainer.appendChild(historyItem);
    });
    
    // Update statistics
    totalCalculations.textContent = `Total: ${calculationHistory.length}`;
    totalProfit.textContent = `Profit: $${totalProfitSum.toFixed(2)}`;
    avgRoi.textContent = `Avg ROI: ${(totalRoiSum / calculationHistory.length).toFixed(2)}%`;
}

// Create history element
function createHistoryElement(item) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const date = new Date(item.timestamp);
    const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const dateString = date.toLocaleDateString();
    
    const profitClass = item.profit >= 0 ? 'profit-positive' : 'profit-negative';
    const profitSign = item.profit >= 0 ? '+' : '';
    
    // Format odds display
    const oddsDisplay = item.odds.map((odd, index) => 
        `Bet ${index + 1}: ${odd}`
    ).join(', ');
    
    // Format stakes display
    const stakesDisplay = item.stakes.map((stake, index) => 
        `$${stake.toFixed(2)}`
    ).join(', ');
    
    div.innerHTML = `
        <div class="history-header">
            <div class="history-timestamp">
                <i class="far fa-clock"></i>
                ${dateString} at ${timeString}
            </div>
            <div class="history-profit ${profitClass}">
                ${profitSign}$${item.profit.toFixed(2)} (${profitSign}${item.roi.toFixed(2)}%)
            </div>
        </div>
        <div class="history-details">
            <div class="history-odd">
                <strong>Odds:</strong> ${oddsDisplay}
            </div>
            <div class="history-stake">
                <strong>Total Stake:</strong> $${item.totalStake.toFixed(2)}
            </div>
            <div class="history-stake">
                <strong>Individual Stakes:</strong> ${stakesDisplay}
            </div>
        </div>
    `;
    
    return div;
}
