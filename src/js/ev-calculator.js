document.addEventListener('DOMContentLoaded', function() {

    // ===== THEME TOGGLE =====
    const themeSwitch = document.getElementById('theme-switch');
    const body = document.body;
    const lightLabel = document.getElementById('light-label');
    const darkLabel = document.getElementById('dark-label');

    const savedTheme = localStorage.getItem('theme') || 'light';

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

    applyTheme(savedTheme);

    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            localStorage.setItem('theme', 'dark');
            applyTheme('dark');
        } else {
            localStorage.setItem('theme', 'light');
            applyTheme('light');
        }
    });
    
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Track active input
    let activeInput = null;

    // Get keyboard elements
    const customKeyboard = document.getElementById('custom-keyboard');
    const keyboardClose = document.getElementById('keyboard-close');
    const keyboardDone = document.getElementById('keyboard-done');
    const keyDelete = document.getElementById('key-delete');
    const keyClear = document.getElementById('key-clear');

    // ===== INJECT SCALABLE STYLES FOR KEYBOARD =====
    if (!document.getElementById('keyboard-scale-styles')) {
        const style = document.createElement('style');
        style.id = 'keyboard-scale-styles';
        style.textContent = `
            #custom-keyboard {
                --keyboard-scale: 1;
                --key-font-size: calc(1.3rem * var(--keyboard-scale));
                --key-padding: calc(0.5rem * var(--keyboard-scale));
                --grid-gap: calc(0.5rem * var(--keyboard-scale));
                scrollbar-width: none;
            }
            #custom-keyboard .keyboard-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: var(--grid-gap);
                
            }
            #custom-keyboard .key-btn {
                font-size: var(--key-font-size);
                padding: var(--key-padding);
                border-radius: calc(0.45rem * var(--keyboard-scale));
            }
            #custom-keyboard .keyboard-actions {
                display: flex;
                gap: var(--grid-gap);
                padding: 0 var(--grid-gap) var(--grid-gap) var(--grid-gap);
            }
            #custom-keyboard .keyboard-actions .key-btn {
                flex: 1;
            }
            #custom-keyboard .keyboard-drag-handle {
                height: 24px;
                font-size: initial;
            }
            /* Keyboard header – now holds lock and close */
            #custom-keyboard .keyboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0px 10px;
                background-color: var(--card-bg);
                margin-bottom: 0px;
                border-bottom: 1px solid var(--border-color);
            }
            /* Lock button – matches close button style */
            #custom-keyboard .keyboard-lock-btn {
                background: none;
                border: none;
                color: var(--text-color);
                font-size: 1.2rem;
                cursor: pointer;
                padding: 5px 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            #custom-keyboard .keyboard-lock-btn:hover {
                background-color: var(--light-color);
            }
        `;
        document.head.appendChild(style);
    }

    // ===== KEYBOARD DRAG RESIZE LOGIC (with lock/unlock) =====
    
    // 1. Create drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'keyboard-drag-handle';
    dragHandle.style.width = '100%';
    dragHandle.style.height = '24px';
    dragHandle.style.position = 'absolute';
    dragHandle.style.top = '0';
    dragHandle.style.left = '0';
    dragHandle.style.cursor = 'ns-resize';
    dragHandle.style.display = 'flex';
    dragHandle.style.justifyContent = 'center';
    dragHandle.style.alignItems = 'center';
    dragHandle.style.zIndex = '100';
    dragHandle.style.touchAction = 'none';

    // 2. Add visual pill indicator
    const dragIndicator = document.createElement('div');
    dragIndicator.style.width = '40px';
    dragIndicator.style.height = '4px';
    dragIndicator.style.backgroundColor = 'var(--text-muted, #ccc)';
    dragIndicator.style.borderRadius = '2px';
    dragHandle.appendChild(dragIndicator);
    
    // Insert handle into keyboard
    if (customKeyboard) {
        if (window.getComputedStyle(customKeyboard).position === 'static') {
            customKeyboard.style.position = 'relative';
        }
        customKeyboard.insertBefore(dragHandle, customKeyboard.firstChild);
        
        const currentPaddingTop = parseInt(window.getComputedStyle(customKeyboard).paddingTop, 10);
        if (currentPaddingTop < 24) {
            customKeyboard.style.paddingTop = '24px';
        }
    }

    // 3. Drag variables
    let isDraggingKeyboard = false;
    let startDragY, startKeyboardHeight;

    // ----- Function to adjust key sizes based on keyboard height -----
    function adjustKeySizes(height) {
        if (!customKeyboard) return;
        const baseHeight = 250;
        let scale = height / baseHeight;
        scale = Math.max(0.8, Math.min(2.0, scale));
        customKeyboard.style.setProperty('--keyboard-scale', scale);
    }

    // ----- Lock/unlock state and saved height -----
    const DEFAULT_KEYBOARD_HEIGHT = 320;
    let keyboardLocked = false;

    function setKeyboardHeight(height) {
        if (!customKeyboard) return;
        customKeyboard.style.height = `${height}px`;
        adjustKeySizes(height);
    }

    // Load saved height and lock state on page start
    (function initKeyboardHeight() {
        const savedHeight = localStorage.getItem('keyboardHeight');
        const locked = localStorage.getItem('keyboardHeightLocked') === 'true';
        
        if (savedHeight && locked) {
            setKeyboardHeight(parseFloat(savedHeight));
            keyboardLocked = true;
        } else {
            setKeyboardHeight(DEFAULT_KEYBOARD_HEIGHT);
            keyboardLocked = false;
            localStorage.removeItem('keyboardHeightLocked');
        }
    })();

    // ----- Create lock button (Font Awesome) -----
    const keyboardHeader = document.querySelector('.keyboard-header');
    const lockBtn = document.createElement('button');
    lockBtn.className = 'keyboard-lock-btn';
    lockBtn.setAttribute('aria-label', 'Toggle lock keyboard height');
    lockBtn.innerHTML = '<i class="fas fa-unlock-alt"></i>'; // will be updated

    function updateLockIcon() {
        const icon = lockBtn.querySelector('i');
        if (keyboardLocked) {
            icon.className = 'fas fa-lock';
        } else {
            icon.className = 'fas fa-unlock-alt';
        }
    }

    // Insert lock button at the beginning of the header (left side)
    if (keyboardHeader && keyboardClose) {
        keyboardHeader.insertBefore(lockBtn, keyboardHeader.firstChild);
        updateLockIcon();
    } else {
        console.warn('Keyboard header or close button not found; lock button not added.');
    }

    // Click handler for lock button
    lockBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (keyboardLocked) {
            // Unlock: remove lock flag
            localStorage.removeItem('keyboardHeightLocked');
            keyboardLocked = false;
        } else {
            // Lock current height
            const currentHeight = customKeyboard.getBoundingClientRect().height;
            localStorage.setItem('keyboardHeight', currentHeight);
            localStorage.setItem('keyboardHeightLocked', 'true');
            keyboardLocked = true;
        }
        updateLockIcon();
    });

    // 4. Drag move/end functions
    function onKeyboardDragMove(e) {
        if (!isDraggingKeyboard) return;
        e.preventDefault();
        
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const deltaY = clientY - startDragY;
        let newHeight = startKeyboardHeight - deltaY;
        
        const minHeight = 150;
        const maxHeight = window.innerHeight * 0.85;
        
        if (newHeight < minHeight) newHeight = minHeight;
        if (newHeight > maxHeight) newHeight = maxHeight;
        
        customKeyboard.style.height = `${newHeight}px`;
        adjustKeySizes(newHeight);
    }

    function onKeyboardDragEnd() {
        isDraggingKeyboard = false;
        document.removeEventListener('mousemove', onKeyboardDragMove);
        document.removeEventListener('touchmove', onKeyboardDragMove);
        document.removeEventListener('mouseup', onKeyboardDragEnd);
        document.removeEventListener('touchend', onKeyboardDragEnd);
    }

    // 5. Drag start – respect locked state (no dragging when locked)
    dragHandle.addEventListener('mousedown', function(e) {
        if (window.ignoreNextMouseDown) {
            window.ignoreNextMouseDown = false;
            return;
        }
        if (keyboardLocked) return;  // 🔒 cannot drag when locked
        
        isDraggingKeyboard = true;
        startDragY = e.clientY;
        startKeyboardHeight = customKeyboard.getBoundingClientRect().height;
        
        document.addEventListener('mousemove', onKeyboardDragMove);
        document.addEventListener('mouseup', onKeyboardDragEnd);
    });

    dragHandle.addEventListener('touchstart', function(e) {
        if (window.ignoreNextMouseDown) {
            window.ignoreNextMouseDown = false;
            return;
        }
        if (keyboardLocked) return;  // 🔒 cannot drag when locked
        
        isDraggingKeyboard = true;
        startDragY = e.touches[0].clientY;
        startKeyboardHeight = customKeyboard.getBoundingClientRect().height;
        
        document.addEventListener('touchmove', onKeyboardDragMove, { passive: false });
        document.addEventListener('touchend', onKeyboardDragEnd);
    }, { passive: false });

    // ===== END KEYBOARD DRAG RESIZE LOGIC =====

    // Function to open custom keyboard
    function openCustomKeyboard(input) {
        if (!isMobile()) return;
        
        activeInput = input;
        customKeyboard.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        createSimulatedCursor(input);

        const currentHeight = customKeyboard.getBoundingClientRect().height;
        adjustKeySizes(currentHeight);

        setTimeout(() => {
            if (activeInput && customKeyboard) {
                // 1. Get the keyboard's height and the total window height
                const keyboardHeight = customKeyboard.getBoundingClientRect().height;
                const windowHeight = window.innerHeight;
                
                // 2. Calculate the "Safe Area" height left above the keyboard
                const availableHeight = windowHeight - keyboardHeight;
                
                // 3. Get the input's current position relative to the document
                const inputRect = activeInput.getBoundingClientRect();
                const absoluteInputTop = inputRect.top + window.pageYOffset;
                
                // 4. Calculate the scroll target:
                // Centers the input at 50% from the top of the available space
                const scrollTarget = absoluteInputTop - (availableHeight * 0.5);

                window.scrollTo({
                    top: scrollTarget,
                    behavior: 'smooth'
                });
            }
        }, 300);
    }

    function closeCustomKeyboard() {
        customKeyboard.classList.add('hidden');
        document.body.style.overflow = '';
        removeSimulatedCursor();
    }

    // Prevent actual keyboard from opening (mobile only)
    document.addEventListener('click', function(e) {
        if (!isMobile()) return;
        
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            const ignoredTypes = ['checkbox', 'radio', 'button', 'submit', 'color', 'file'];
            if (ignoredTypes.includes(e.target.type)) return;
            if (e.target.closest('.custom-keyboard')) return;
            
            e.preventDefault();
            e.target.setAttribute('readonly', true);
            openCustomKeyboard(e.target);
        }
    });

    // Keyboard button clicks
    document.querySelectorAll('.key-btn[data-value]').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!isMobile() || !activeInput) return;
            
            const value = this.dataset.value;
            const format = document.querySelector('.odds-type-btn.active')?.dataset.format || 'decimal';
            
            const currentValue = activeInput.value;
            const lastChar = currentValue.slice(-1);
            const operators = ['+', '-', '/', '.'];
            
            if (operators.includes(value) && operators.includes(lastChar)) return;
            if (format === 'fractional' && value === '/' && currentValue.includes('/')) return;
            if (format === 'decimal' && value === '.' && currentValue.includes('.')) return;
            
            activeInput.value += value;
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            updateSimulatedCursor(activeInput);
        });
    });

    keyDelete.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        activeInput.value = activeInput.value.slice(0, -1);
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        updateSimulatedCursor(activeInput);
    });

    keyClear.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        activeInput.value = '';
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        updateSimulatedCursor(activeInput);
    });

    keyboardDone.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        activeInput.removeAttribute('readonly');
        activeInput.blur();
        closeCustomKeyboard();
    });

    keyboardClose.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        activeInput.removeAttribute('readonly');
        activeInput.blur();
        closeCustomKeyboard();
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            customKeyboard.classList.add('hidden');
            document.body.style.overflow = '';
            document.querySelectorAll('input[readonly]').forEach(input => {
                input.removeAttribute('readonly');
            });
            removeSimulatedCursor();
            activeInput = null;
        } else {
            if (!customKeyboard.classList.contains('hidden')) {
                const currentHeight = customKeyboard.getBoundingClientRect().height;
                adjustKeySizes(currentHeight);
            }
        }
    });

    // Close keyboard when clicking outside
    document.addEventListener('click', function(e) {
        if (!isMobile()) return;
        if (!customKeyboard.contains(e.target) && 
            !e.target.matches('input, textarea') && 
            !customKeyboard.classList.contains('hidden')) {
            if (activeInput) {
                activeInput.removeAttribute('readonly');
                activeInput.blur();
            }
            closeCustomKeyboard();
        }
    });

    // Details handling for larger screens
    let lastWidth = window.innerWidth;
    function handleDetailsForScreen() {
        const currentWidth = window.innerWidth;
        if (currentWidth !== lastWidth) {
            const detailsList = document.querySelectorAll("details.instruction-section");
            if (currentWidth >= 1200) {
                detailsList.forEach(detail => detail.setAttribute("open", ""));
            } else {
                detailsList.forEach(detail => detail.removeAttribute("open"));
            }
            lastWidth = currentWidth;
        }
    }
    window.addEventListener("resize", handleDetailsForScreen);

    // ===== CALCULATOR VARIABLES =====
    const stakeInput = document.getElementById('stake-input');
    const oddsFormatSelect = document.getElementById('odds-format');
    const oddsInput = document.getElementById('odds-input');
    const probabilitySlider = document.getElementById('probability-slider');
    const probabilityInput = document.getElementById('probability-input');
    const probabilityValue = document.getElementById('probability-value');
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    const stakeError = document.getElementById('stake-error');
    const oddsError = document.getElementById('odds-error');
    const probabilityError = document.getElementById('probability-error');
    
    const evValue = document.getElementById('ev-value');
    const evDescription = document.getElementById('ev-description');
    const resultStake = document.getElementById('result-stake');
    const resultProfit = document.getElementById('result-profit');
    const resultImplied = document.getElementById('result-implied');
    const resultYourProb = document.getElementById('result-your-prob');
    const resultReturn = document.getElementById('result-return');
    const resultRoi = document.getElementById('result-roi');
    const resultBreakeven = document.getElementById('result-breakeven');
    const resultEdge = document.getElementById('result-edge');
    
    const advancedAnalysis = document.getElementById('advanced-analysis');
    const longTermProfit = document.getElementById('long-term-profit');
    const avgProfit = document.getElementById('avg-profit');
    const stdDev = document.getElementById('std-dev');
    const riskLevel = document.getElementById('risk-level');
    const probProfit = document.getElementById('prob-profit');
    const kellyPercent = document.getElementById('kelly-percent');
    const riskRuin = document.getElementById('risk-ruin');
    const recommendation = document.getElementById('recommendation');

    // Dropdown elements
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.getElementById('calculators-dropdown');
    const dropdownIcon = dropdownBtn.querySelector('.fa-chevron-down');

    dropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = dropdownContent.style.display === 'block';
        dropdownContent.style.display = isOpen ? 'none' : 'block';
        dropdownIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    document.addEventListener('click', function(e) {
        if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.style.display = 'none';
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    });

    dropdownContent.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            dropdownContent.style.display = 'none';
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    });

    // ===== VALIDATION FUNCTIONS =====
    function validateStake() {
        const value = parseFloat(stakeInput.value);
        if (isNaN(value) || value <= 0) {
            stakeInput.classList.add('input-error');
            stakeError.textContent = 'Stake must be greater than 0';
            stakeError.classList.add('show');
            return false;
        }
        else if ((!/^[0-9.]*$/.test(stakeInput.value)) || (/([.]).*?\1/.test(stakeInput.value))) {
            stakeInput.classList.add('input-error');
            stakeError.textContent = 'Stake must be valid';
            stakeError.classList.add('show');
            return false;
        }
        stakeInput.classList.remove('input-error');
        stakeError.classList.remove('show');
        return true;
    }
    
    function validateAmericanOdds(oddsStr) {
        const trimmed = oddsStr.trim();
        if (!trimmed.startsWith('+') && !trimmed.startsWith('-')) {
            return { valid: false, message: 'American odds must start with + or -' };
        }
        else if ((!/^[0-9+-]*$/.test(trimmed)) || (trimmed.includes("+") && trimmed.indexOf("+") !== 0) || (trimmed.includes("-") && trimmed.indexOf("-") !== 0) || (/([+-]).*?\1/.test(trimmed))) {
            return { valid: false, message: 'American odds must be valid' };
        }
        const numberPart = trimmed.substring(1);
        const numberValue = parseInt(numberPart);
        if (isNaN(numberValue)) {
            return { valid: false, message: 'Invalid number after + or -' };
        }
        if (Math.abs(numberValue) < 100) {
            return { valid: false, message: 'American odds must be ≥ 100 (e.g., +150 or -200)' };
        }
        return { valid: true, value: trimmed };
    }
    
    function validateFractionalOdds(oddsStr) {
        const trimmed = oddsStr.trim();
        if (!trimmed.includes('/')) {
            return { valid: false, message: 'Fractional odds need a slash (e.g., 3/2)' };
        }
        else if ((!/^[0-9/]*$/.test(trimmed)) || (/([/]).*?\1/.test(trimmed))) {
            return { valid: false, message: 'Fractional odds must be valid (e.g., 3/2)' };
        }
        const parts = trimmed.split('/');
        if (parts.length !== 2) {
            return { valid: false, message: 'Invalid format (e.g., 3/2)' };
        }
        const numerator = parseInt(parts[0]);
        const denominator = parseInt(parts[1]);
        if (isNaN(numerator) || isNaN(denominator)) {
            return { valid: false, message: 'Both numbers must be valid' };
        }
        if (denominator === 0) {
            return { valid: false, message: 'Denominator cannot be zero' };
        }
        return { valid: true, value: trimmed };
    }
    
    function validateDecimalOdds(oddsStr) {
        const trimmed = oddsStr.trim();
        const decimalValue = parseFloat(trimmed);
        if ((!/^[0-9.]*$/.test(trimmed)) || (/([.]).*?\1/.test(trimmed))) {
            return { valid: false, message: 'Invalid decimal number' };
        }
        if (isNaN(decimalValue)) {
            return { valid: false, message: 'Invalid decimal number' };
        }
        if (decimalValue < 1) {
            return { valid: false, message: 'Decimal odds must be ≥ 1.00' };
        }
        return { valid: true, value: trimmed };
    }
    
    function validateOdds() {
        const oddsStr = oddsInput.value.trim();
        const format = oddsFormatSelect.value;
        if (oddsStr === '') {
            oddsInput.classList.add('input-error');
            oddsError.textContent = 'Please enter odds';
            oddsError.classList.add('show');
            return false;
        }
        let validationResult;
        switch(format) {
            case 'american': validationResult = validateAmericanOdds(oddsStr); break;
            case 'fractional': validationResult = validateFractionalOdds(oddsStr); break;
            case 'decimal': validationResult = validateDecimalOdds(oddsStr); break;
            default: validationResult = { valid: false, message: 'Invalid format' };
        }
        if (validationResult.valid) {
            oddsInput.classList.remove('input-error');
            oddsError.classList.remove('show');
            return true;
        } else {
            oddsInput.classList.add('input-error');
            oddsError.textContent = validationResult.message;
            oddsError.classList.add('show');
            return false;
        }
    }
    
    function validateProbability() {
        const value = parseFloat(probabilityInput.value);
        if (isNaN(value) || value < 0.1 || value > 99.9) {
            probabilityInput.classList.add('input-error');
            probabilityError.textContent = 'Probability must be between 0.1% and 99.9%';
            probabilityError.classList.add('show');
            return false;
        }
        probabilityInput.classList.remove('input-error');
        probabilityError.classList.remove('show');
        return true;
    }
    
    function validateAllInputs() {
        return validateStake() && validateOdds() && validateProbability();
    }
    
    function clearErrors() {
        stakeInput.classList.remove('input-error');
        oddsInput.classList.remove('input-error');
        probabilityInput.classList.remove('input-error');
        stakeError.classList.remove('show');
        oddsError.classList.remove('show');
        probabilityError.classList.remove('show');
    }
    
    // ===== CALCULATION FUNCTIONS =====
    function toDecimal(odds, format) {
        if (!odds || odds.trim() === '') return null;
        const str = odds.trim();
        switch(format) {
            case 'decimal': return parseFloat(str);
            case 'fractional': const [num, den] = str.split('/').map(Number); return (num / den) + 1;
            case 'american':
                if (str.startsWith('+')) { const value = parseInt(str.substring(1)); return (value / 100) + 1; }
                else if (str.startsWith('-')) { const value = parseInt(str.substring(1)); return (100 / value) + 1; }
                return null;
            default: return null;
        }
    }
    
    function calculateImpliedProbability(decimalOdds) { return (1 / decimalOdds) * 100; }
    
    function calculateEV(stake, decimalOdds, winProbability) {
        const winProb = winProbability / 100;
        const loseProb = 1 - winProb;
        const profit = stake * (decimalOdds - 1);
        return (winProb * profit) - (loseProb * stake);
    }
    
    function formatCurrency(amount, showSign = true) {
        if (isNaN(amount) || amount === null) return '-';
        const sign = showSign && amount > 0 ? '+' : '';
        return sign + '$' + Math.abs(amount).toFixed(2);
    }
    
    function formatPercentage(value, showSign = true) {
        if (isNaN(value) || value === null) return '-';
        const sign = showSign && value > 0 ? '+' : '';
        return sign + value.toFixed(2) + '%';
    }
    
    // ===== EVENT LISTENERS =====
    probabilitySlider.addEventListener('input', function() {
        const value = this.value;
        probabilityInput.value = value;
        probabilityValue.textContent = value + '%';
        validateProbability();
        autoCalculate();
    });
    
    probabilityInput.addEventListener('input', function() {
        let value = parseFloat(this.value);
        if (value < 0.1) value = 0.1;
        if (value > 99.9) value = 99.9;
        this.value = value;
        probabilitySlider.value = value;
        probabilityValue.textContent = value.toFixed(1) + '%';
        validateProbability();
        autoCalculate();
    });
    
    stakeInput.addEventListener('input', function() { validateStake(); autoCalculate(); });
    oddsInput.addEventListener('input', function() { validateOdds(); autoCalculate(); });
    
    oddsFormatSelect.addEventListener('change', function() {
        oddsInput.classList.remove('input-error');
        oddsError.classList.remove('show');
        const format = this.value;
        switch(format) {
            case 'decimal': oddsInput.placeholder = 'e.g., 2.50'; break;
            case 'fractional': oddsInput.placeholder = 'e.g., 3/2'; break;
            case 'american': oddsInput.placeholder = 'e.g., +150 or -200'; break;
        }
        autoCalculate();
    });
    
    calculateBtn.addEventListener('click', function() { if (validateAllInputs()) calculate(); });
    resetBtn.addEventListener('click', function() {
        stakeInput.value = '100';
        oddsFormatSelect.value = 'decimal';
        oddsInput.value = '';
        oddsInput.placeholder = 'e.g., 2.50';
        probabilitySlider.value = '50';
        probabilityInput.value = '50';
        probabilityValue.textContent = '50%';
        clearErrors();
        hideResults();
        advancedAnalysis.classList.add('hidden');
    });
    
    analyzeBtn.addEventListener('click', function() {
        if (validateAllInputs()) { calculate(); advancedAnalysis.classList.remove('hidden'); }
    });
    
    function autoCalculate() { if (validateAllInputs()) calculate(); }
    
    function calculate() {
        const stake = parseFloat(stakeInput.value);
        const format = oddsFormatSelect.value;
        const odds = oddsInput.value.trim();
        const probability = parseFloat(probabilityInput.value);
        
        const decimalOdds = toDecimal(odds, format);
        if (!decimalOdds || decimalOdds < 1) {
            oddsInput.classList.add('input-error');
            oddsError.textContent = 'Invalid odds value';
            oddsError.classList.add('show');
            return;
        }
        
        const impliedProb = calculateImpliedProbability(decimalOdds);
        const ev = calculateEV(stake, decimalOdds, probability);
        const profit = stake * (decimalOdds - 1);
        const expectedReturn = stake + ev;
        const roi = (ev / stake) * 100;
        const breakEvenProb = calculateImpliedProbability(decimalOdds);
        const edge = probability - impliedProb;
        
        resultStake.textContent = formatCurrency(stake, false);
        resultProfit.textContent = formatCurrency(profit, true);
        resultImplied.textContent = formatPercentage(impliedProb, false);
        resultYourProb.textContent = formatPercentage(probability, false);
        resultReturn.textContent = formatCurrency(expectedReturn, false);
        resultRoi.textContent = formatPercentage(roi, true);
        resultBreakeven.textContent = formatPercentage(breakEvenProb, false);
        resultEdge.textContent = formatPercentage(edge, true);
        
        evValue.textContent = formatCurrency(ev, true);
        evValue.className = 'ev-value';
        if (ev > 0) {
            evValue.classList.add('positive');
            evDescription.textContent = `This bet has positive expected value. You'll make an average of ${formatPercentage(roi, true)} per bet in the long run.`;
            evValue.parentElement.parentElement.classList.add('positive-bg');
            evValue.parentElement.parentElement.classList.remove('negative-bg');
        } else if (ev < 0) {
            evValue.classList.add('negative');
            evDescription.textContent = `This bet has negative expected value. You'll lose an average of ${formatPercentage(Math.abs(roi), false)} per bet in the long run.`;
            evValue.parentElement.parentElement.classList.add('negative-bg');
            evValue.parentElement.parentElement.classList.remove('positive-bg');
        } else {
            evValue.classList.add('neutral');
            evDescription.textContent = 'This bet has zero expected value (break-even in the long run).';
            evValue.parentElement.parentElement.classList.remove('positive-bg', 'negative-bg');
        }
        
        if (!advancedAnalysis.classList.contains('hidden')) {
            updateAdvancedAnalysis(stake, decimalOdds, probability, ev, edge);
        }
    }
    
    function updateAdvancedAnalysis(stake, decimalOdds, probability, ev, edge) {
        const numBets = 100;
        const longTermEv = ev * numBets;
        const stdDeviation = Math.sqrt(numBets * (probability/100) * (1 - probability/100)) * stake * (decimalOdds - 1);
        
        longTermProfit.textContent = formatCurrency(longTermEv, true);
        avgProfit.textContent = formatCurrency(ev, true);
        stdDev.textContent = formatCurrency(stdDeviation, false);
        
        const winProb = probability;
        const variance = winProb * (100 - winProb) / 100;
        let riskLevelText = 'Low';
        if (variance > 20) riskLevelText = 'High';
        else if (variance > 10) riskLevelText = 'Medium';
        
        const kelly = ((decimalOdds - 1) * (winProb/100) - (1 - winProb/100)) / (decimalOdds - 1);
        const kellyPercentValue = Math.max(0, Math.min(kelly * 100, 20));
        
        let riskRuinText = 'Low';
        if (winProb < 50) riskRuinText = 'High';
        else if (winProb < 70) riskRuinText = 'Medium';
        
        riskLevel.textContent = riskLevelText;
        probProfit.textContent = formatPercentage(winProb, false);
        kellyPercent.textContent = formatPercentage(kellyPercentValue, false);
        riskRuin.textContent = riskRuinText;
        
        let recText = 'NEUTRAL';
        if (ev > 0) {
            if (edge > 5) recText = 'STRONG VALUE BET';
            else if (edge > 2) recText = 'VALUE BET';
            else recText = 'WEAK VALUE';
        } else if (ev < 0) {
            if (edge < -5) recText = 'STRONG AVOID';
            else if (edge < -2) recText = 'AVOID';
            else recText = 'WEAK AVOID';
        }
        
        recommendation.textContent = recText;
        recommendation.style.backgroundColor = '';
        recommendation.style.color = '';
        recommendation.style.border = '';
        
        if (recText.includes('VALUE')) {
            recommendation.style.backgroundColor = 'rgba(39, 174, 96, 0.2)';
            recommendation.style.color = 'var(--success-color)';
            recommendation.style.border = '2px solid var(--success-color)';
        } else if (recText.includes('AVOID')) {
            recommendation.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
            recommendation.style.color = 'var(--accent-color)';
            recommendation.style.border = '2px solid var(--accent-color)';
        } else {
            recommendation.style.backgroundColor = 'rgba(149, 165, 166, 0.2)';
            recommendation.style.color = 'var(--gray-color)';
            recommendation.style.border = '2px solid var(--gray-color)';
        }
    }
    
    function hideResults() {
        evValue.textContent = '$0.00';
        evValue.className = 'ev-value neutral';
        evDescription.textContent = 'Enter values above to calculate Expected Value';
        evValue.parentElement.parentElement.classList.remove('positive-bg', 'negative-bg');
        
        resultStake.textContent = '-';
        resultProfit.textContent = '-';
        resultImplied.textContent = '-';
        resultYourProb.textContent = '-';
        resultReturn.textContent = '-';
        resultRoi.textContent = '-';
        resultBreakeven.textContent = '-';
        resultEdge.textContent = '-';
    }
    
    // Initialize calculator focus
    stakeInput.focus();
    setTimeout(() => {
        if (stakeInput.value && oddsInput.value) autoCalculate();
    }, 100);

    // ===== SIMULATED CURSOR FOR CUSTOM KEYBOARD =====
    let cursorInterval = null;
    let cursorElement = null;
    let measuringSpan = null;
    let originalInputParent = null;
    let originalInputNextSibling = null;

    function initMeasuringSpan() {
        if (!measuringSpan) {
            measuringSpan = document.createElement('span');
            measuringSpan.style.position = 'absolute';
            measuringSpan.style.visibility = 'hidden';
            measuringSpan.style.whiteSpace = 'pre';
            measuringSpan.style.pointerEvents = 'none';
            document.body.appendChild(measuringSpan);
        }
    }

    function createSimulatedCursor(input) {
        if (!isMobile() || !input) return;

        // Remove any existing cursor first
        removeSimulatedCursor();

        // Save original parent and next sibling for later restoration
        originalInputParent = input.parentNode;
        originalInputNextSibling = input.nextSibling;

        // Create a wrapper to enable absolute positioning of the cursor
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.margin = '0';
        wrapper.style.padding = '0';

        // Insert wrapper before the input, then move input inside it
        originalInputParent.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // Create the blinking cursor element
        cursorElement = document.createElement('div');
        cursorElement.className = 'simulated-cursor';
        cursorElement.style.position = 'absolute';
        cursorElement.style.top = '0';
        cursorElement.style.left = '0';
        cursorElement.style.width = '2px';
        cursorElement.style.backgroundColor = 'currentColor'; // matches input text color
        cursorElement.style.pointerEvents = 'none';
        cursorElement.style.display = 'none'; // hidden until positioned
        wrapper.appendChild(cursorElement);

        // Prepare measuring span
        initMeasuringSpan();

        // Position and show the cursor
        updateSimulatedCursor(input);
        cursorElement.style.display = 'block';
    }

    function updateSimulatedCursor(input) {
        if (!cursorElement || !input || !measuringSpan) return;

        // Get input's computed styles to match font metrics
        const style = window.getComputedStyle(input);
        measuringSpan.style.font = style.font;
        measuringSpan.style.fontSize = style.fontSize;
        measuringSpan.style.fontFamily = style.fontFamily;
        measuringSpan.style.fontWeight = style.fontWeight;
        measuringSpan.style.fontStyle = style.fontStyle;
        measuringSpan.style.letterSpacing = style.letterSpacing;
        measuringSpan.style.textTransform = style.textTransform;

        // Measure the current text width (use a space if empty so cursor stays visible)
        const text = input.value || ' ';
        measuringSpan.textContent = text;

        // Calculate horizontal offset: padding-left + border-left + text width
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const borderLeft = parseFloat(style.borderLeftWidth) || 0;
        const textWidth = measuringSpan.offsetWidth;
        const leftPos = paddingLeft + borderLeft + textWidth;

        // Calculate vertical position and height based on line-height / font-size
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const borderTop = parseFloat(style.borderTopWidth) || 0;
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
        const topPos = paddingTop + borderTop;

        cursorElement.style.left = leftPos + 'px';
        cursorElement.style.top = topPos + 'px';
        cursorElement.style.height = lineHeight + 'px';
    }

    
    function removeSimulatedCursor() {
        if (cursorElement) {
            const wrapper = cursorElement.parentNode;
            if (wrapper) {
                // Find the input inside the wrapper
                const oldInput = wrapper.querySelector('input, textarea');
                if (oldInput && originalInputParent) {
                    // Optional: remove readonly from the deactivated input
                    oldInput.removeAttribute('readonly');
                    // Move the old input back to its original position
                    wrapper.removeChild(oldInput);
                    if (originalInputNextSibling) {
                        originalInputParent.insertBefore(oldInput, originalInputNextSibling);
                    } else {
                        originalInputParent.appendChild(oldInput);
                    }
                    // Remove the empty wrapper
                    wrapper.remove();
                }
            }
            cursorElement = null;
        }
        if (cursorInterval) {
            clearInterval(cursorInterval);
            cursorInterval = null;
        }
    }
});