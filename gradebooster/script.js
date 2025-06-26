// Mode toggle functionality with enhanced animations
document.addEventListener('DOMContentLoaded', function() {
    const modeToggle = document.getElementById('modeToggle');

    if (modeToggle) {
        // Set initial state for generate page
        modeToggle.checked = false;

        // Add page load animation
        document.body.classList.add('page-transition-in');

        // Add click handler for mode switching
        modeToggle.addEventListener('change', function() {
            const toggleSwitch = document.querySelector('.mode-toggle-switch');
            const mainContent = document.querySelector('.main-content');

            // Add multiple animation classes
            document.body.classList.add('mode-transition');
            toggleSwitch.classList.add('mode-pulse');
            mainContent.classList.add('content-fade-out');

            // Navigate to appropriate page with enhanced transition
            if (this.checked) {
                // Switch to Check mode
                document.body.classList.add('page-transition-out');

                setTimeout(() => {
                    window.location.href = 'check.html';
                }, 400);
            } else {
                // Stay on Generate mode (shouldn't happen, but handle anyway)
                return;
            }
        });

        // Add hover effects
        const toggleSwitch = document.querySelector('.mode-toggle-switch');
        if (toggleSwitch) {
            toggleSwitch.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px) scale(1.02)';
            });

            toggleSwitch.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        }
    }
});


// Initialize Feather Icons
document.addEventListener("DOMContentLoaded", function() {
    feather.replace();

    // Form submission handler
    const examForm = document.getElementById("examForm");
    examForm.addEventListener("submit", handleFormSubmission);
});

// Global variables to store generated content
let generatedContent = {
    modelAnswer: "",
    markWinningWords: "",
    examStrategy: "",
};

// Handle form submission
async function handleFormSubmission(event) {
    event.preventDefault();

    // Get form data
    const formData = new FormData(event.target);
    const question = formData.get("question").trim();
    const gradeLevel = formData.get("gradeLevel");
    const markLevel = formData.get("markLevel");

    // Validate required fields
    if (!question || !gradeLevel) {
        showError("Please fill in all required fields.");
        return;
    }

    // Prepare user message with AI prompt
    const userMessage = `You are generating a school-level model answer for an NCERT-style exam question, focused on full marks potential.

Auto-detect subject and language.


- Generate MUST-USE WORDS + HOW TO CRACK in simple English.

For maths:
- Use × for multiplication (e.g. 3 × 5 = 15).
- Do not use * symbol.

Format strictly as:
**MODEL ANSWER**
[clean text, use "\\n" for line breaks, use ## to highlight main words in the answer and the final answer also, use × for multiplication, at last also give the approximate value which can acceptable by the examinar with highlighted]

**MUST-USE WORDS**
[comma-separated terms, formulas, no bullets. only give the high level words to impress the examiner]

**HOW TO CRACK**
[plain text tips]
(NOTE- if the subject is hindi then generate content in pure hindi especially the tips)
RULES:
- No extra headings, markdown, *, bullets, or lists. Only use specified ** markers, \\n for new line, ## for highlight.
- Keep appropriate to mark level: ${markLevel} marks
- Write for grade level: ${gradeLevel}

Question: ${question}`;

    // Show loading state
    showLoading(true);
    hideError();
    hideOutput();

    try {
        // Make request to Make.com webhook
        await generateAnswer(userMessage);
    } catch (error) {
        console.error("Error generating answer:", error);
        showError(
            "Failed to generate answer. Please check your connection and try again.",
        );
        showLoading(false);
    }
}

// Make.com webhook URL - Replace with your actual webhook URL
const WEBHOOK_URL =
    "https://hook.eu2.make.com/62ubza5bw3qs8q2li7ln8c2rkevo9u7q"; // Placeholder Make.com webhook URL

// Generate answer using Make.com webhook
async function generateAnswer(userMessage) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userMessage: userMessage,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        let aiResponse;

        // Robust JSON parsing as specified
        try {
            const parsedResponse = JSON.parse(responseText);
            aiResponse = parsedResponse.aiResponse || responseText;
        } catch (parseError) {
            // Fallback parsing method
            const match = responseText.match(/"aiResponse"\s*:\s*(.*)/s);
            if (!match) {
                throw new Error(
                    "Could not extract AI response from the response.",
                );
            }

            let extractedResponse = match[1].trim();

            // Clean up the extracted response
            if (extractedResponse.endsWith("}")) {
                extractedResponse = extractedResponse.slice(0, -1);
            }

            if (
                extractedResponse.startsWith('"') &&
                extractedResponse.endsWith('"')
            ) {
                extractedResponse = extractedResponse
                    .slice(1, -1)
                    .replace(/\\"/g, '"');
            }

            aiResponse = extractedResponse;
        }

        // Parse the response content
        parseAndDisplayResponse(aiResponse);
        showLoading(false);
        showOutput();
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
}

// Parse response and display in output sections
function parseAndDisplayResponse(responseText) {
    // Use regex to safely extract sections
    const modelMatch = responseText.match(/\*\*MODEL ANSWER\*\*(.*?)(?=\*\*MUST-USE WORDS\*\*|\*\*HOW TO CRACK\*\*|$)/si);
    const wordsMatch = responseText.match(/\*\*MUST-USE WORDS\*\*(.*?)(?=\*\*HOW TO CRACK\*\*|$)/si);
    const crackMatch = responseText.match(/\*\*HOW TO CRACK\*\*(.*)/si);

    const modelAnswer = modelMatch ? modelMatch[1].trim() : "";
    const markWinningWords = wordsMatch ? wordsMatch[1].trim() : "";
    const examStrategy = crackMatch ? crackMatch[1].trim() : "";

    // Fallback: if nothing parsed, show raw text
    if (!modelAnswer && !markWinningWords && !examStrategy) {
        generatedContent = {
            modelAnswer: responseText.trim() || "Unable to parse AI response. Please check the webhook configuration.",
            markWinningWords: "Unable to extract key words from response.",
            examStrategy: "Unable to extract strategy from response.",
        };
    } else {
        generatedContent = {
            modelAnswer: modelAnswer || "No model answer generated.",
            markWinningWords: markWinningWords || "No key words identified.",
            examStrategy: examStrategy || "No strategy provided.",
        };
    }

    // Display content
    displayContent("modelAnswer", generatedContent.modelAnswer);
    displayContent("markWinningWords", generatedContent.markWinningWords);
    displayContent("examStrategy", generatedContent.examStrategy);

    // Update word count
    updateWordCount("modelAnswer", generatedContent.modelAnswer);
}


// Display content in output boxes with enhanced formatting
function displayContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        let formattedContent = '';

        if (elementId === 'markWinningWords') {
            // Format words and formulas as styled tags
            const items = content.split(/[,\n]/)
                .map(item => item.trim())
                .filter(item => item.length > 0);

            if (items.length > 1) {
                formattedContent = `<div class="word-list">`;
                items.forEach(item => {
                    // Check if item contains mathematical symbols or equals sign (likely a formula)
                    if (item.includes('=') || item.includes('²') || item.includes('π') || item.includes('+') || item.includes('-') || item.includes('×') || item.includes('÷') || /\d/.test(item)) {
                        formattedContent += `<span class="formula-tag">${item}</span>`;
                    } else {
                        formattedContent += `<span class="word-tag">${item}</span>`;
                    }
                });
                formattedContent += `</div>`;
            } else {
                formattedContent = `<p>${content}</p>`;
            }
        } else if (elementId === 'examStrategy') {
            // Format strategy with special styling
            let processedContent = content.replace(/\*/g, '×').replace(/\\n/g, '<br>').replace(/##(.*?)##/g, '<strong>$1</strong>');
            formattedContent = `<div class="strategy-content">${processedContent}</div>`;
        } else if (elementId === 'modelAnswer') {
            // Format model answer with enhanced styling and handle \n and ## markers
            let processedContent = content.replace(/\*/g, '×').replace(/\\n/g, '<br>').replace(/##(.*?)##/g, '<strong>$1</strong>');
            formattedContent = `<div class="model-answer-content">${processedContent}</div>`;
        } else {
            // Default formatting
            let processedContent = content.replace(/\*/g, '×').replace(/\\n/g, '<br>').replace(/##(.*?)##/g, '<strong>$1</strong>');
            formattedContent = `<p>${processedContent}</p>`;
        }

        element.innerHTML = formattedContent;
    }
}

// Update word count
function updateWordCount(section, content) {
    if (section === "modelAnswer") {
        const wordCount = content.trim().split(/\s+/).length;
        const wordCountElement = document.getElementById(
            "modelAnswerWordCount",
        );
        if (wordCountElement) {
            wordCountElement.textContent = `${wordCount} words`;
        }
    }
}

// Show/hide loading state
function showLoading(show) {
    const generateBtn = document.getElementById("generateBtn");
    const btnText = generateBtn.querySelector(".btn-text");
    const loadingSpinner = document.getElementById("loadingSpinner");

    if (show) {
        generateBtn.disabled = true;
        btnText.style.display = "none";
        loadingSpinner.style.display = "flex";
    } else {
        generateBtn.disabled = false;
        btnText.style.display = "inline";
        loadingSpinner.style.display = "none";
    }
}

// Show output section
function showOutput() {
    const outputSection = document.getElementById("outputSection");
    outputSection.style.display = "block";
    outputSection.classList.add("fade-in");

    // Scroll to output section
    outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Hide output section
function hideOutput() {
    const outputSection = document.getElementById("outputSection");
    outputSection.style.display = "none";
    outputSection.classList.remove("fade-in");
}

// Show error
function showError(message) {
    const errorSection = document.getElementById("errorSection");
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = message;
    errorSection.style.display = "block";
    errorSection.classList.add("fade-in");

    // Scroll to error section
    errorSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Hide error
function hideError() {
    const errorSection = document.getElementById("errorSection");
    errorSection.style.display = "none";
    errorSection.classList.remove("fade-in");
}

// Show copy notification
function showCopyNotification() {
    const notification = document.getElementById('copyNotification');
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Copy to clipboard function
async function copyToClipboard(sectionId) {
    const content = generatedContent[sectionId];
    if (!content) return;

    // Apply our comprehensive cleaning directly
    const cleanedText = cleanContent(content);

    // Find the button that was clicked
    const buttonElement = event.target.closest('.copy-btn');

    try {
        await navigator.clipboard.writeText(cleanedText);

        // Show success feedback
        if (buttonElement) {
            buttonElement.classList.add("copy-success");
            buttonElement.textContent = "Copied!";
        }

        // Show side notification
        showCopyNotification();

        setTimeout(() => {
            if (buttonElement) {
                buttonElement.classList.remove("copy-success");
                buttonElement.innerHTML = '<i data-feather="copy"></i> Copy';
                feather.replace();
            }
        }, 2000);
    } catch (error) {
        console.error("Failed to copy to clipboard:", error);

        // Fallback for older browsers
        try {
            const textArea = document.createElement("textarea");
            textArea.value = cleanedText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);

            // Show success feedback
            if (buttonElement) {
                buttonElement.classList.add("copy-success");
                buttonElement.textContent = "Copied!";
            }
            showCopyNotification();

            setTimeout(() => {
                if (buttonElement) {
                    buttonElement.classList.remove("copy-success");
                    buttonElement.innerHTML = '<i data-feather="copy"></i> Copy';
                    feather.replace();
                }
            }, 2000);
        } catch (fallbackError) {
            console.error("Fallback copy also failed:", fallbackError);
            if (buttonElement) {
                buttonElement.textContent = "Copy failed";
                setTimeout(() => {
                    buttonElement.innerHTML = '<i data-feather="copy"></i> Copy';
                    feather.replace();
                }, 2000);
            }
        }
    }
}

// Clean content function to remove formatting characters
function cleanContent(raw) {
    if (!raw || typeof raw !== 'string') {
        return '';
    }

    // First handle \\n conversion and basic cleaning
    let cleaned = raw
        .replace(/\\n/g, '\n')                  // Convert \\n to actual line breaks FIRST
        .replace(/\\\\/g, '')                   // Remove escaped backslashes
        .replace(/<[^>]*>/g, '')                // Remove HTML tags
        .replace(/&nbsp;/g, ' ')                // Convert HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    return cleaned
        .split('\n')
        .map(line =>
            line
                .replace(/^[*\-#=~`|+ ]+/, '')      // Remove leading formatting characters
                .replace(/[*_`~|]+/g, '')           // Remove inline formatting like *, _, `, ~, |
                .replace(/={2,}/g, '')              // Remove multiple equals signs
                .replace(/-{2,}/g, '')              // Remove multiple dashes
                .replace(/\*{2,}/g, '')             // Remove multiple asterisks
                .replace(/#{1,6}\s*/g, '')          // Remove markdown headers
                .replace(/^\s*[\-\*\+]\s+/, '')     // Remove bullet points
                .replace(/##(.*?)##/g, '$1')        // Remove ## highlighting but keep content
                .replace(/\*\*/g, '')               // Remove bold markdown
                .replace(/__/g, '')                 // Remove underline markdown
                .trim()                             // Remove extra spaces
        )
        .filter(line => {
            // Remove lines that are only formatting characters
            const cleanLine = line.replace(/[*\-=~`|#+ ]/g, '');
            return cleanLine.length > 0;
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');               // Replace multiple newlines with double newlines
}

// Download as text file
function downloadAsText() {
    const question = document.getElementById("question").value;
    const gradeLevel = document.getElementById("gradeLevel").value;

    const markLevel = document.querySelector(
        'input[name="markLevel"]:checked',
    ).value;

    // Clean the question text as well
    const cleanedQuestion = cleanContent(question);

    // Clean the generated content
    const cleanedModelAnswer = cleanContent(generatedContent.modelAnswer);
    const cleanedMarkWords = cleanContent(generatedContent.markWinningWords);
    const cleanedStrategy = cleanContent(generatedContent.examStrategy);

    // Prepare content for download
    const content = `VED GRADEBOOSTER - FULL MARKS POTENTIAL ANSWER GENERATOR
=====================================================

QUESTION:
${cleanedQuestion}

GRADE LEVEL: ${gradeLevel}

MARK LEVEL: ${markLevel}

GENERATED ON: ${new Date().toLocaleDateString()}

=====================================================

VED MODEL ANSWER:
${cleanedModelAnswer}

=====================================================

VED MARK-WINNING WORDS:
${cleanedMarkWords}

=====================================================

VED EXAM STRATEGY:
${cleanedStrategy}

=====================================================

Generated for full marks potential. Results depend on examiners and board guidelines.
Built by Anish Bairagi - VED Platform
`;

    // Create and download file
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `ved-gradebooster-answer-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Form validation
function validateForm() {
    const question = document.getElementById("question").value.trim();
    const gradeLevel = document.getElementById("gradeLevel").value;

    if (!question) {
        showError("Please enter a question.");
        return false;
    }

    if (!gradeLevel) {
        showError("Please select a grade level.");
        return false;
    }

    return true;
}

// Auto-resize textarea
document.getElementById("question").addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
});

// Clear form function (optional)
function clearForm() {
    document.getElementById("examForm").reset();
    hideOutput();
    hideError();
}

// Keyboard shortcuts
document.addEventListener("keydown", function(event) {
    // Ctrl+Enter to submit form
    if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        const generateBtn = document.getElementById("generateBtn");
        if (!generateBtn.disabled) {
            generateBtn.click();
        }
    }

    // Escape to clear form
    if (event.key === "Escape") {
        clearForm();
    }
});