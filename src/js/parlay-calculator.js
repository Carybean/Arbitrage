document.addEventListener('DOMContentLoaded', function() {
    // ===== THEME TOGGLE FUNCTIONALITY =====
    const themeSwitch = document.getElementById('theme-switch');
    const body = document.body;
    const lightLabel = document.getElementById('light-label');
    const darkLabel = document.getElementById('dark-label');

    // Check for saved theme preference
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
        if (!isMobile()) return; // Only on mobile
        
        activeInput = input;
        customKeyboard.classList.remove('hidden');
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';

        createSimulatedCursor(input);

        setTimeout(() => {
            if (activeInput) {
                activeInput.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 300);
    }

    // Function to close custom keyboard
    function closeCustomKeyboard() {
        customKeyboard.classList.add('hidden');
        document.body.style.overflow = '';

        removeSimulatedCursor();
    }

    // Prevent actual keyboard from opening (mobile only)
    document.addEventListener('click', function(e) {
        // Only apply on mobile
        if (!isMobile()) return;
        
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            const ignoredTypes = ['checkbox', 'radio', 'button', 'submit', 'color', 'file'];
            if (ignoredTypes.includes(e.target.type)) {
                return; 
            }
            // Don't interfere with our keyboard buttons
            if (e.target.closest('.custom-keyboard')) return;
            
            // For all other inputs, prevent default and open custom keyboard
            e.preventDefault();
            
            // Make input read-only to prevent actual keyboard
            e.target.setAttribute('readonly', true);
            
            // Open custom keyboard
            openCustomKeyboard(e.target);
        }
    });

    // Handle keyboard button clicks
    document.querySelectorAll('.key-btn[data-value]').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!isMobile() || !activeInput) return;
            
            const value = this.dataset.value;
            
            // Validate based on odds format
            const format = document.querySelector('.odds-type-btn.active')?.dataset.format || 'decimal';
            
            // Basic validation - prevent multiple operators
            const currentValue = activeInput.value;
            const lastChar = currentValue.slice(-1);
            const operators = ['+', '-', '/', '.'];
            
            if (operators.includes(value) && operators.includes(lastChar)) {
                return; // Don't allow two operators in a row
            }
            
            // For fractional odds, prevent multiple slashes
            if (format === 'fractional' && value === '/' && currentValue.includes('/')) {
                return;
            }
            
            // For decimal odds, prevent multiple decimals
            if (format === 'decimal' && value === '.' && currentValue.includes('.')) {
                return;
            }
            
            activeInput.value += value;
            
            // Trigger input event
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));

            updateSimulatedCursor(activeInput);
        });
    });

    // Delete button (backspace)
    keyDelete.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        
        activeInput.value = activeInput.value.slice(0, -1);
        
        // Trigger input event
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));

        updateSimulatedCursor(activeInput);
    });

    // Clear button
    keyClear.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        
        activeInput.value = '';
        
        // Trigger input event
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));

        updateSimulatedCursor(activeInput);
    });

    // Done button
    keyboardDone.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        
        // Remove readonly attribute
        activeInput.removeAttribute('readonly');
        activeInput.blur();
        closeCustomKeyboard();
    });

    // Close button
    keyboardClose.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        
        activeInput.removeAttribute('readonly');
        activeInput.blur();
        closeCustomKeyboard();
    });

    // Handle window resize (switch between mobile/desktop)
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            // If switching to desktop, close keyboard and remove readonly from all inputs
            customKeyboard.classList.add('hidden');
            document.body.style.overflow = '';
            
            // Remove readonly from all inputs
            document.querySelectorAll('input[readonly]').forEach(input => {
                input.removeAttribute('readonly');
            });

            removeSimulatedCursor();
            
            activeInput = null;
        }
    });

    // Close keyboard when clicking outside (mobile only)
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


    // ===== PARLAY CALCULATOR LOGIC =====
    
    // DOM Elements
    const stakeInput = document.getElementById('stake-input');
    const addLegBtn = document.getElementById('add-leg');
    const legsContainer = document.getElementById('legs-container');
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearLegsBtn = document.getElementById('clear-legs');
    
    // Error elements
    const stakeError = document.getElementById('stake-error');
    
    // Result elements
    const totalOdds = document.getElementById('total-odds');
    const oddsFormatLabel = document.getElementById('odds-format-label');
    const resultStake = document.getElementById('result-stake');
    const resultPayout = document.getElementById('result-payout');
    const resultProfit = document.getElementById('result-profit');
    const resultProbability = document.getElementById('result-probability');
    const resultEv = document.getElementById('result-ev');
    const resultRoi = document.getElementById('result-roi');
    const resultBreakeven = document.getElementById('result-breakeven');
    const resultLegs = document.getElementById('result-legs');
    const probabilityFill = document.getElementById('probability-fill');
    const probabilityBreakdown = document.getElementById('probability-breakdown');

    // Get elements
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.getElementById('calculators-dropdown');
    const dropdownIcon = dropdownBtn.querySelector('.fa-chevron-down');

    // Toggle dropdown on click
    dropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = dropdownContent.style.display === 'block';
        
        // Toggle dropdown
        dropdownContent.style.display = isOpen ? 'none' : 'block';
        
        // Rotate chevron icon
        dropdownIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.style.display = 'none';
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    });

    // ===== NEW: GLOBAL ODDS FORMAT =====
    let globalOddsFormat = 'decimal'; // Default format
    let legCounter = 0;
    let legs = [];

    // ===== NEW: Create global format selector =====
    function createGlobalFormatSelector() {
        const legsHeader = document.querySelector('.legs-header');
        
        // Create format selector container
        const formatSelectorContainer = document.createElement('div');
        formatSelectorContainer.className = 'global-format-selector';
        formatSelectorContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            padding: 10px;
            background-color: var(--card-bg);
            border-radius: 5px;
        `;
        
        formatSelectorContainer.innerHTML = `
            <label style="font-weight: 600; color: var(--text-color);">
                <i class="fas fa-globe"></i> Odds Format:
            </label>
            <select id="global-odds-format" style="
                padding: 8px 12px;
                border: 2px solid var(--border-color);
                border-radius: 5px;
                background-color: var(--card-bg);
                color: var(--text-color);
                font-size: 0.95rem;
                flex: 1;
                max-width: 150px;
            ">
                <option value="decimal" selected>Decimal</option>
                <option value="fractional">Fractional</option>
                <option value="american">American</option>
            </select>
        `;
        
        // Insert after legs header
        legsHeader.parentNode.insertBefore(formatSelectorContainer, legsHeader.nextSibling);
        
        // Add event listener to global format selector
        const globalFormatSelect = document.getElementById('global-odds-format');
        globalFormatSelect.addEventListener('change', function() {
            globalOddsFormat = this.value;
            updateAllLegsFormat();
        });
    }
    
    // ===== NEW: Update all legs to use global format =====
    function updateAllLegsFormat() {
        // Update all existing legs to use the new global format
        legs.forEach(leg => {
            leg.format = globalOddsFormat;
            
            // Update the leg row's placeholder
            const legRow = document.getElementById(leg.id);
            if (legRow) {
                const oddsInput = legRow.querySelector('.leg-odds');
                updatePlaceholder(legRow, globalOddsFormat);
                
                // Re-validate with new format if there's an odds value
                if (leg.odds && leg.odds.trim() !== '') {
                    const errorSpan = legRow.querySelector('.input-error-text');
                    updateLegOdds(leg.id, leg.odds, errorSpan);
                }
            }
        });
        
        // Auto-calculate after format change
        autoCalculate();
    }

    // ===== VALIDATION FUNCTIONS =====
    
    // Validate stake
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
    
    // Validate American odds
    function validateAmericanOdds(oddsStr) {
        const trimmed = oddsStr.trim();
        
        // Check if it starts with + or -
        if (!trimmed.startsWith('+') && !trimmed.startsWith('-')) {
            return {
                valid: false,
                message: 'American odds must start with + or -'
            };
        }
        else if ((!/^[0-9+-]*$/.test(trimmed)) || (trimmed.includes("+") && trimmed.indexOf("+") !== 0) || (trimmed.includes("-") && trimmed.indexOf("-") !== 0) || (/([+-]).*?\1/.test(trimmed))) {
            return {
                valid: false,
                message: 'American odds must be valid'
            };
        }
        
        // Get the number part
        const numberPart = trimmed.substring(1);
        const numberValue = parseInt(numberPart);
        
        if (isNaN(numberValue)) {
            return {
                valid: false,
                message: 'Invalid number after + or -'
            };
        }
        
        // Check absolute value >= 100
        if (Math.abs(numberValue) < 100) {
            return {
                valid: false,
                message: 'American odds must be ≥ 100 (e.g., +150 or -200)'
            };
        }
        
        return {
            valid: true,
            value: trimmed
        };
    }
    
    // Validate fractional odds
    function validateFractionalOdds(oddsStr) {
        const trimmed = oddsStr.trim();
        
        if (!trimmed.includes('/')) {
            return {
                valid: false,
                message: 'Fractional odds need a slash (e.g., 3/2)'
            };
        }

        else if ((!/^[0-9/]*$/.test(trimmed)) || (/([/]).*?\1/.test(trimmed))) {
            return {
                valid: false,
                message: 'Fractional odds must be valid (e.g., 3/2)'
            };
        }
        
        const parts = trimmed.split('/');
        if (parts.length !== 2) {
            return {
                valid: false,
                message: 'Invalid format (e.g., 3/2)'
            };
        }
        
        const numerator = parseInt(parts[0]);
        const denominator = parseInt(parts[1]);
        
        if (isNaN(numerator) || isNaN(denominator)) {
            return {
                valid: false,
                message: 'Both numbers must be valid'
            };
        }
        
        if (denominator === 0) {
            return {
                valid: false,
                message: 'Denominator cannot be zero'
            };
        }
        
        return {
            valid: true,
            value: trimmed
        };
    }
    
    // Validate decimal odds
    function validateDecimalOdds(oddsStr) {
        const trimmed = oddsStr.trim();
        const decimalValue = parseFloat(trimmed);
        
        if (isNaN(decimalValue)) {
            return {
                valid: false,
                message: 'Invalid decimal number'
            };
        }
        else if ((!/^[0-9.]*$/.test(trimmed)) || (/([.]).*?\1/.test(trimmed))) {
            return {
                valid: false,
                message: 'Invalid decimal number'
            };
        }
        
        if (decimalValue < 1) {
            return {
                valid: false,
                message: 'Decimal odds must be ≥ 1.00'
            };
        }
        
        return {
            valid: true,
            value: trimmed
        };
    }
    
    // Validate odds based on format (now uses global format)
    function validateOdds(oddsStr, format) {
        if (oddsStr === '') {
            return {
                valid: false,
                message: 'Please enter odds'
            };
        }
        
        let validationResult;
        
        switch(format) {
            case 'american':
                validationResult = validateAmericanOdds(oddsStr);
                break;
            case 'fractional':
                validationResult = validateFractionalOdds(oddsStr);
                break;
            case 'decimal':
                validationResult = validateDecimalOdds(oddsStr);
                break;
            default:
                validationResult = { valid: false, message: 'Invalid format' };
        }
        
        return validationResult;
    }
    
    // Clear all errors
    function clearErrors() {
        stakeInput.classList.remove('input-error');
        stakeError.classList.remove('show');
        
        // Clear leg errors
        const legInputs = legsContainer.querySelectorAll('.leg-inputs input');
        legInputs.forEach(input => {
            input.classList.remove('input-error');
            const errorSpan = input.parentElement.parentElement.querySelector('.input-error-text');
            if (errorSpan) {
                errorSpan.classList.remove('show');
            }
        });
    }
    
    // ===== ODDS CONVERSION FUNCTIONS =====
    
    // Convert any odds format to decimal
    function toDecimal(odds, format) {
        if (!odds || odds.trim() === '') return null;
        
        const str = odds.trim();
        
        switch(format) {
            case 'decimal':
                const decimal = parseFloat(str);
                return isNaN(decimal) || decimal < 1 ? null : decimal;
                
            case 'fractional':
                if (!str.includes('/')) return null;
                const [numerator, denominator] = str.split('/').map(Number);
                if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return null;
                return (numerator / denominator) + 1;
                
            case 'american':
                // Validate American odds format
                const americanRegex = /^[+-]\d+$/;
                if (!americanRegex.test(str)) return null;
                
                const value = parseInt(str.substring(1));
                if (isNaN(value) || Math.abs(value) < 100) return null;
                
                if (str.startsWith('+')) {
                    return (value / 100) + 1;
                } else if (str.startsWith('-')) {
                    if (value === 0) return null;
                    return (100 / Math.abs(value)) + 1;
                }
                return null;
                
            default:
                return null;
        }
    }
    
    // Calculate implied probability from decimal odds
    function calculateProbability(decimalOdds) {
        if (!decimalOdds || decimalOdds < 1) return 0;
        return (1 / decimalOdds) * 100;
    }
    
    // Decimal to fractional - FIXED VERSION
    function decimalToFractional(decimal) {
        if (!decimal || decimal < 1) return '-';
        
        const profit = decimal - 1;
        
        // Convert to fraction
        let numerator = profit * 100;
        let denominator = 100;
        
        // Find greatest common divisor
        const gcd = (a, b) => {
            if (b < 0.0001) return a;
            return gcd(b, Math.floor(a % b));
        };
        
        const divisor = gcd(numerator, denominator);
        numerator = Math.round(numerator / divisor);
        denominator = Math.round(denominator / divisor);
        
        // Simplify to common fractions
        if (denominator === 1) {
            return numerator + "/1";
        } else if (numerator === 1 && denominator === 2) {
            return "1/2";
        } else if (numerator === 1 && denominator === 4) {
            return "1/4";
        } else if (numerator === 3 && denominator === 4) {
            return "3/4";
        } else if (numerator === 1 && denominator === 5) {
            return "1/5";
        } else if (numerator === 2 && denominator === 5) {
            return "2/5";
        } else if (numerator === 3 && denominator === 5) {
            return "3/5";
        } else if (numerator === 4 && denominator === 5) {
            return "4/5";
        } else if (numerator === 1 && denominator === 10) {
            return "1/10";
        } else if (numerator === 3 && denominator === 10) {
            return "3/10";
        } else if (numerator === 7 && denominator === 10) {
            return "7/10";
        } else if (numerator === 9 && denominator === 10) {
            return "9/10";
        }
        
        // Return simplified fraction
        return numerator + "/" + denominator;
    }
    
    // Decimal to American - FIXED VERSION
    function decimalToAmerican(decimal) {
        if (!decimal || decimal < 1) return '-';
        
        if (decimal >= 2.00) {
            // Positive American odds
            return "+" + Math.round((decimal - 1) * 100);
        } else {
            // Negative American odds
            return "-" + Math.round(100 / (decimal - 1));
        }
    }
    
    // Format currency
    function formatCurrency(amount) {
        if (isNaN(amount) || amount === null) return '-';
        return '$' + parseFloat(amount).toFixed(2);
    }
    
    // Format percentage
    function formatPercentage(value) {
        if (isNaN(value) || value === null) return '-';
        return parseFloat(value).toFixed(2) + '%';
    }
    
    // Format odds
    function formatOdds(decimal, format) {
        if (!decimal) return '-';
        
        switch(format) {
            case 'decimal':
                return decimal.toFixed(2);
            case 'fractional':
                return decimalToFractional(decimal);
            case 'american':
                return decimalToAmerican(decimal);
            default:
                return decimal.toFixed(2);
        }
    }

    // ===== LEG MANAGEMENT =====
    
    // Add initial legs
    function initializeLegs() {
        // Add first two legs by default
        addLeg();
        addLeg();
    }
    
    // Add a leg - REMOVED INDIVIDUAL DROPDOWN
    function addLeg() {
        legCounter++;
        const legId = `leg-${legCounter}`;
        
        const legRow = document.createElement('div');
        legRow.className = 'leg-row';
        legRow.id = legId;
        
        // Create leg row WITHOUT individual format dropdown
        legRow.innerHTML = `
            <div class="leg-number">${legCounter}</div>
            <div class="leg-inputs">
                <input type="text" inputmode="none" maxlength="13" class="leg-odds" placeholder="${getPlaceholderForFormat(globalOddsFormat)}">
                <button type="button" class="leg-remove" data-id="${legId}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="input-error-text"></div>
        `;
        
        legsContainer.appendChild(legRow);
        
        // Add to legs array with global format
        legs.push({
            id: legId,
            format: globalOddsFormat, // Use global format
            odds: '',
            decimal: null,
            probability: 0,
            valid: false
        });
        
        // Add event listeners
        const legOddsInput = legRow.querySelector('.leg-odds');
        const errorSpan = legRow.querySelector('.input-error-text');
        const removeBtn = legRow.querySelector('.leg-remove');
        
        legOddsInput.addEventListener('input', function() {
            updateLegOdds(legId, this.value, errorSpan);
        });
        
        legOddsInput.addEventListener('blur', function() {
            validateLeg(legId, errorSpan);
        });
        
        removeBtn.addEventListener('click', function() {
            const id = this.dataset.id;
            removeLeg(id);
        });
    }
    
    // ===== NEW: Get placeholder text based on format =====
    function getPlaceholderForFormat(format) {
        switch(format) {
            case 'decimal':
                return 'e.g., 2.50';
            case 'fractional':
                return 'e.g., 3/2';
            case 'american':
                return 'e.g., +150 or -200';
            default:
                return 'e.g., 2.50';
        }
    }
    
    // ===== MODIFIED: Update placeholder (now takes legRow directly) =====
    function updatePlaceholder(legRow, format) {
        if (!legRow) return;
        
        const oddsInput = legRow.querySelector('.leg-odds');
        oddsInput.placeholder = getPlaceholderForFormat(format);
    }
    
    // Update leg odds
    function updateLegOdds(legId, odds, errorSpan) {
        const index = legs.findIndex(l => l.id === legId);
        if (index !== -1) {
            legs[index].odds = odds;
            legs[index].format = globalOddsFormat; // Ensure format is current global format
            
            // Validate the odds format
            const validationResult = validateOdds(odds, globalOddsFormat);
            legs[index].valid = validationResult.valid;
            
            const decimal = validationResult.valid ? toDecimal(odds, globalOddsFormat) : null;
            legs[index].decimal = decimal;
            legs[index].probability = decimal ? calculateProbability(decimal) : 0;
            
            // Update UI validation - with error message
            updateLegValidationUI(legId, validationResult, errorSpan);
            
            // Auto-calculate if we have at least 2 valid legs
            autoCalculate();
        }
    }
    
    // Validate a specific leg
    function validateLeg(legId, errorSpan) {
        const index = legs.findIndex(l => l.id === legId);
        if (index !== -1 && legs[index].odds !== '') {
            const validationResult = validateOdds(legs[index].odds, globalOddsFormat);
            legs[index].valid = validationResult.valid;
            updateLegValidationUI(legId, validationResult, errorSpan);
        }
    }
    
    // Update leg validation UI
    function updateLegValidationUI(legId, validationResult, errorSpan) {
        const legRow = document.getElementById(legId);
        if (!legRow) return;
        
        const legOddsInput = legRow.querySelector('.leg-odds');
        
        // Find the index
        const index = legs.findIndex(l => l.id === legId);
        if (index === -1) return;
        
        if (legs[index].odds === '') {
            // Empty input - remove validation classes
            legOddsInput.classList.remove('input-error');
            errorSpan.classList.remove('show');
        } else if (!validationResult.valid) {
            // Invalid odds - show red border with error message
            legOddsInput.classList.add('input-error');
            errorSpan.textContent = validationResult.message;
            errorSpan.classList.add('show');
        } else {
            // Valid odds - remove red border and error
            legOddsInput.classList.remove('input-error');
            errorSpan.classList.remove('show');
        }
    }
    
    // Remove leg
    function removeLeg(legId) {
        // Don't allow removal if we'd have less than 2 legs
        if (legs.length <= 2) {
            alert('Parlay must have at least 2 legs.');
            return;
        }
        
        // Remove from DOM
        const element = document.getElementById(legId);
        if (element) {
            element.remove();
        }
        
        // Remove from array
        const index = legs.findIndex(l => l.id === legId);
        if (index !== -1) {
            legs.splice(index, 1);
        }
        
        // Renumber remaining legs
        renumberLegs();
        
        // Auto-calculate
        autoCalculate();
    }
    
    // Renumber legs
    function renumberLegs() {
        const legRows = legsContainer.querySelectorAll('.leg-row');
        legCounter = legRows.length;
        
        legRows.forEach((row, index) => {
            const legNumber = row.querySelector('.leg-number');
            legNumber.textContent = index + 1;
            
            // Update leg ID in array
            const oldId = row.id;
            const newId = `leg-${index + 1}`;
            row.id = newId;
            
            // Update in array
            const legIndex = legs.findIndex(l => l.id === oldId);
            if (legIndex !== -1) {
                legs[legIndex].id = newId;
            }
            
            // Update remove button data-id
            const removeBtn = row.querySelector('.leg-remove');
            removeBtn.dataset.id = newId;
        });
    }
    
    // Clear all legs
    function clearLegs() {
        legsContainer.innerHTML = '';
        legs = [];
        legCounter = 0;
        initializeLegs(); // Add back minimum 2 legs
        hideResults();
    }
    
    // Reset all
    function resetAll() {
        stakeInput.value = '100';
        clearLegs();
        hideResults();
        clearErrors();
        
        // Reset global format to decimal
        const globalFormatSelect = document.getElementById('global-odds-format');
        if (globalFormatSelect) {
            globalFormatSelect.value = 'decimal';
            globalOddsFormat = 'decimal';
            updateAllLegsFormat();
        }
    }
    
    // Hide results
    function hideResults() {
        totalOdds.textContent = '-';
        oddsFormatLabel.textContent = 'Decimal';
        resultStake.textContent = '-';
        resultPayout.textContent = '-';
        resultProfit.textContent = '-';
        resultProbability.textContent = '-';
        resultEv.textContent = '-';
        resultRoi.textContent = '-';
        resultBreakeven.textContent = '-';
        resultLegs.textContent = '-';
        probabilityFill.style.width = '0%';
        probabilityFill.textContent = '0%';
        probabilityBreakdown.style.display = 'none';
    }
    
    // Show results
    function showResults() {
        probabilityBreakdown.style.display = 'block';
    }

    // ===== CALCULATION FUNCTIONS =====
    
    // Validate all inputs before calculation
    function validateAllInputsBeforeCalculation() {
        const stakeValid = validateStake();
        
        // Check if we have at least 2 legs with valid odds
        const validLegs = legs.filter(l => l.valid && l.decimal !== null);
        if (validLegs.length < 2) {
            alert('Parlay must have at least 2 valid legs with properly formatted odds.');
            return false;
        }
        
        return stakeValid;
    }
    
    // Auto-calculate
    function autoCalculate() {
        // Only calculate if we have at least 2 valid legs
        const validLegs = legs.filter(l => l.valid && l.decimal !== null);
        if (validLegs.length >= 2) {
            calculateParlay();
        }
    }
    
    // Calculate parlay
    function calculateParlay() {
        if (!validateAllInputsBeforeCalculation()) {
            return;
        }
        
        const stake = parseFloat(stakeInput.value);
        if (isNaN(stake) || stake <= 0) {
            return;
        }
        
        // Get valid legs
        const validLegs = legs.filter(l => l.valid && l.decimal !== null);
        if (validLegs.length < 2) {
            return;
        }
        
        // Calculate total odds and probability
        let totalDecimalOdds = 1;
        let totalProbability = 1;
        
        validLegs.forEach(leg => {
            totalDecimalOdds *= leg.decimal;
            totalProbability *= (leg.probability / 100);
        });
        
        const totalProbPercent = totalProbability * 100;
        const payout = stake * totalDecimalOdds;
        const profit = payout - stake;
        const expectedValue = (totalProbability * payout) - stake;
        const roi = (profit / stake) * 100;
        const breakEvenProb = (1 / totalDecimalOdds) * 100;
        
        // Update results
        totalOdds.textContent = totalDecimalOdds.toFixed(2);
        oddsFormatLabel.textContent = 'Decimal (' + decimalToFractional(totalDecimalOdds) + ' | ' + decimalToAmerican(totalDecimalOdds) + ')';
        resultStake.textContent = formatCurrency(stake);
        resultPayout.textContent = formatCurrency(payout);
        resultProfit.textContent = formatCurrency(profit);
        resultProbability.textContent = formatPercentage(totalProbPercent);
        resultEv.textContent = formatCurrency(expectedValue);
        if (expectedValue >= 0) {
            resultEv.classList.remove('negative');
        } else {
            resultEv.classList.add('negative');
        }
        resultRoi.textContent = formatPercentage(roi);
        resultBreakeven.textContent = formatPercentage(breakEvenProb);
        resultLegs.textContent = validLegs.length;
        
        // Update probability bar
        const barWidth = Math.min(Math.max(totalProbPercent, 0), 100);
        probabilityFill.style.width = barWidth + '%';
        probabilityFill.textContent = totalProbPercent.toFixed(1) + '%';
        
        // Color code based on probability
        if (totalProbPercent < 20) {
            probabilityFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        } else if (totalProbPercent < 50) {
            probabilityFill.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        } else if (totalProbPercent < 80) {
            probabilityFill.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
        } else {
            probabilityFill.style.background = 'linear-gradient(90deg, #27ae60, #219653)';
        }
        
        showResults();
    }

    // ===== EVENT LISTENERS =====
    
    addLegBtn.addEventListener('click', addLeg);
    
    calculateBtn.addEventListener('click', function() {
        calculateParlay();
    });
    
    resetBtn.addEventListener('click', resetAll);
    
    clearLegsBtn.addEventListener('click', clearLegs);
    
    stakeInput.addEventListener('input', function() {
        validateStake();
        autoCalculate();
    });

    // ===== INITIALIZATION =====
    
    // Create global format selector
    createGlobalFormatSelector();
    
    initializeLegs();
    stakeInput.focus();

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