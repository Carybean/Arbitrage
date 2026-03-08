document.addEventListener('DOMContentLoaded', function() {
    // ===== THEME TOGGLE FUNCTIONALITY =====
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
        if (!isMobile()) return; // Only on mobile
        
        activeInput = input;
        customKeyboard.classList.remove('hidden');
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';

        createSimulatedCursor(input);

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


    // ===== ODDS CONVERTER LOGIC =====
    
    const fromFormatSelect = document.getElementById('from-format');
    const toFormatSelect = document.getElementById('to-format');
    const oddsInput = document.getElementById('odds-input');
    const inputLabel = document.getElementById('input-label');
    const inputExample = document.getElementById('input-example');
    const convertBtn = document.getElementById('convert-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyBtn = document.getElementById('copy-results');
    
    const resultDecimal = document.getElementById('result-decimal');
    const resultFractional = document.getElementById('result-fractional');
    const resultAmerican = document.getElementById('result-american');
    const resultIndonesian = document.getElementById('result-indonesian');
    const resultHongkong = document.getElementById('result-hongkong');
    const resultMalay = document.getElementById('result-malay');
    const resultProbability = document.getElementById('result-probability');

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
    
    const formatExamples = {
        decimal: { label: "Enter Decimal Odds", example: "e.g., 2.50", placeholder: "2.50" },
        fractional: { label: "Enter Fractional Odds", example: "e.g., 3/2 or 5/4", placeholder: "3/2" },
        american: { label: "Enter American Odds", example: "e.g., +150 or -200", placeholder: "+150" },
        indonesian: { label: "Enter Indonesian Odds", example: "e.g., +1.50 or -4.00", placeholder: "+1.50" },
        hongkong: { label: "Enter Hong Kong Odds", example: "e.g., 0.50", placeholder: "0.50" },
        malay: { label: "Enter Malay Odds", example: "e.g., +0.67 or -0.25", placeholder: "+0.67" }
    };

    function updateInputDisplay() {
        const format = fromFormatSelect.value;
        const examples = formatExamples[format];
        inputLabel.textContent = examples.label;
        oddsInput.placeholder = examples.placeholder;
        inputExample.textContent = examples.example;
        oddsInput.classList.remove('valid', 'invalid');
    }

    // ===== ODDS CONVERSION FUNCTIONS =====
    
    function toDecimal(odds, format) {
        if (!odds || odds.trim() === '') return null;
        const str = odds.trim();
        
        switch(format) {
            case 'decimal':
                if ((!/^[0-9.]*$/.test(str)) || (/([.]).*?\1/.test(str))) return null;
                const decimal = parseFloat(str);
                return isNaN(decimal) || decimal < 1.01 ? null : decimal;
                
            case 'fractional':
                if (!str.includes('/') || (!/^[0-9/]*$/.test(str)) || (/([/]).*?\1/.test(str))) return null;
                const [numerator, denominator] = str.split('/').map(Number);
                if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return null;
                const fracValue = (numerator / denominator) + 1;
                return fracValue >= 1.01 ? fracValue : null;
                
            case 'american':
                if (str.includes('/') || (!/^[0-9+-]*$/.test(str)) || (str.includes("+") && str.indexOf("+") !== 0) || (str.includes("-") && str.indexOf("-") !== 0) || (/([+-]).*?\1/.test(str)) || (/^[+-]/.test(str) && /[./]/.test(str))) return null;
                if (str.startsWith('+')) {
                    const value = parseInt(str.substring(1));
                    if (isNaN(value) || value < 100) return null;
                    return (value / 100) + 1;
                } else if (str.startsWith('-')) {
                    const value = parseInt(str.substring(1));
                    if (isNaN(value) || value < 100) return null;
                    return (100 / Math.abs(value)) + 1;
                }
                return null;
                
            case 'indonesian':
                if (str.includes('/') || (!/^[0-9.+-]*$/.test(str)) || (str.includes("+") && str.indexOf("+") !== 0) || (str.includes("-") && str.indexOf("-") !== 0) || (/([+-]).*?\1/.test(str))) return null;
                const indoValue = parseFloat(str);
                if (isNaN(indoValue)) return null;
                if (str.startsWith('+') || (!str.startsWith('-') && indoValue > 0)) {
                    if (indoValue >= 1.01) return indoValue + 1;
                } else if (str.startsWith('-') || indoValue < 0) {
                    const absValue = Math.abs(indoValue);
                    if (absValue >= 1.01) return (1 / absValue) + 1;
                }
                return null;
                
            case 'hongkong':
                if (str.includes('/') || (!/^[0-9.]*$/.test(str)) || (/([.]).*?\1/.test(str))) return null;
                const hkValue = parseFloat(str);
                if (isNaN(hkValue) || hkValue < 0) return null;
                return hkValue + 1;
                
            case 'malay':
                // REGEX Check for Malay
                if (str.includes('/') || (!/^[0-9.+-]*$/.test(str)) || (str.includes("+") && str.indexOf("+") !== 0) || (str.includes("-") && str.indexOf("-") !== 0) || (/([+-]).*?\1/.test(str))) return null;
                const malayValue = parseFloat(str);
                if (isNaN(malayValue)) return null;
                
                // FIXED LOGIC: 
                // Positive (0 to 1) = Favorite
                if (malayValue > 0 && malayValue <= 1) {
                    return 1 + malayValue;
                } 
                // Negative (-1 to 0) = Underdog
                else if (malayValue < 0 && malayValue >= -1) {
                    return 1 + (1 / Math.abs(malayValue));
                }
                return null;
                
            default:
                return null;
        }
    }
    
    function calculateProbability(decimalOdds) {
        if (!decimalOdds || decimalOdds < 1) return 0;
        return (1 / decimalOdds) * 100;
    }
    
    function decimalToFractional(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        const profit = decimal - 1;
        const bettingFractions = {
            '0.10': '1/10', '0.20': '1/5', '0.25': '1/4', '0.33': '1/3', '0.40': '2/5', 
            '0.50': '1/2', '0.67': '2/3', '0.80': '4/5', '1.00': '1/1', '1.20': '6/5',
            '1.25': '5/4', '1.50': '3/2', '2.00': '2/1', '2.50': '5/2', '3.00': '3/1',
            '4.00': '4/1', '5.00': '5/1', '10.00': '10/1'
        };
        const profitStr = (Math.round(profit * 100) / 100).toFixed(2);
        if (bettingFractions[profitStr]) return bettingFractions[profitStr];

        let bestNumerator = 1, bestDenominator = 1;
        let bestError = Math.abs(profit - (bestNumerator / bestDenominator));
        const maxDenominator = profit < 0.5 ? 200 : 100;
        for (let denominator = 1; denominator <= maxDenominator; denominator++) {
            const numerator = Math.round(profit * denominator);
            if (numerator < 1) continue;
            const currentError = Math.abs(profit - (numerator / denominator));
            if (currentError < bestError) {
                bestError = currentError;
                bestNumerator = numerator;
                bestDenominator = denominator;
            }
            if (bestError < 0.001) break;
        }
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const divisor = gcd(bestNumerator, bestDenominator);
        return `${bestNumerator / divisor}/${bestDenominator / divisor}`;
    }
    
    function decimalToAmerican(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        if (decimal >= 2.00) return "+" + Math.round((decimal - 1) * 100);
        return "-" + Math.round(100 / (decimal - 1));
    }
    
    function decimalToIndonesian(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        if (decimal >= 2.00) return (decimal - 1).toFixed(2);
        return (-1 / (decimal - 1)).toFixed(2);
    }
    
    function decimalToHongKong(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        return (decimal - 1).toFixed(2);
    }
    
    function decimalToMalay(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        // FIXED LOGIC:
        // Decimal < 2.00 (Favorite) -> Positive Malay
        if (decimal <= 2.00) {
            return (decimal - 1).toFixed(2);
        } 
        // Decimal > 2.00 (Underdog) -> Negative Malay
        else {
            const malayValue = -1 / (decimal - 1);
            return malayValue.toFixed(2);
        }
    }
    
    function decimalToFormat(decimal, format) {
        switch(format) {
            case 'decimal': return decimal.toFixed(2);
            case 'fractional': return decimalToFractional(decimal);
            case 'american': return decimalToAmerican(decimal);
            case 'indonesian': 
                const indo = decimalToIndonesian(decimal);
                return indo.startsWith('-') ? indo : '+' + indo;
            case 'hongkong': return decimalToHongKong(decimal);
            case 'malay': 
                const malay = decimalToMalay(decimal);
                return malay.startsWith('-') ? malay : '+' + malay;
            default: return '-';
        }
    }

    // ===== UI LOGIC =====
    
    function validateInput() {
        const value = oddsInput.value.trim();
        if (!value) {
            oddsInput.classList.remove('invalid', 'valid');
            return false;
        }
        const format = fromFormatSelect.value;
        const decimal = toDecimal(value, format);
        const isValid = decimal !== null && decimal >= 1.01;
        oddsInput.classList.toggle('valid', isValid);
        oddsInput.classList.toggle('invalid', !isValid);
        return isValid;
    }

    function calculateConversion() {
        const value = oddsInput.value.trim();
        if (!value || !validateInput()) {
            clearResults();
            return false;
        }
        const fromFormat = fromFormatSelect.value;
        const decimalValue = toDecimal(value, fromFormat);
        if (decimalValue && decimalValue >= 1.01) {
            updateAllResults(decimalValue);
            return true;
        }
        clearResults();
        return false;
    }
    
    function updateAllResults(decimalValue) {
        resultDecimal.textContent = decimalValue.toFixed(2);
        resultFractional.textContent = decimalToFractional(decimalValue);
        resultAmerican.textContent = decimalToAmerican(decimalValue);
        
        const indonesian = decimalToIndonesian(decimalValue);
        resultIndonesian.textContent = indonesian.startsWith('-') ? indonesian : '+' + indonesian;
        
        resultHongkong.textContent = decimalToHongKong(decimalValue);
        
        const malay = decimalToMalay(decimalValue);
        resultMalay.textContent = malay.startsWith('-') ? malay : '+' + malay;
        
        resultProbability.textContent = calculateProbability(decimalValue).toFixed(2) + '%';
    }
    
    function clearResults() {
        [resultDecimal, resultFractional, resultAmerican, resultIndonesian, resultHongkong, resultMalay, resultProbability].forEach(el => el.textContent = '-');
    }
    
    function resetAll() {
        oddsInput.value = '';
        fromFormatSelect.value = 'decimal';
        updateInputDisplay();
        clearResults();
        oddsInput.focus();
    }
    
    function copyResults() {
        const results = [
            `Decimal: ${resultDecimal.textContent}`,
            `Fractional: ${resultFractional.textContent}`,
            `American: ${resultAmerican.textContent}`,
            `Indonesian: ${resultIndonesian.textContent}`,
            `Hong Kong: ${resultHongkong.textContent}`,
            `Malay: ${resultMalay.textContent}`,
            `Implied Probability: ${resultProbability.textContent}`
        ].join('\n');
        
        navigator.clipboard.writeText(results).then(() => alert('Results copied!'))
        .catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = results;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Results copied!');
        });
    }

    fromFormatSelect.addEventListener('change', updateInputDisplay);
    oddsInput.addEventListener('input', () => {
        if (oddsInput.value.trim()) calculateConversion();
        else clearResults();
    });
    convertBtn.addEventListener('click', calculateConversion);
    resetBtn.addEventListener('click', resetAll);
    copyBtn.addEventListener('click', copyResults);
    oddsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); calculateConversion(); }
    });

    updateInputDisplay();
    oddsInput.focus();

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