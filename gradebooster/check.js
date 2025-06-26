
// Mode toggle functionality for check page with enhanced animations
document.addEventListener('DOMContentLoaded', function() {
    const modeToggle = document.getElementById('modeToggle');

    if (modeToggle) {
        // Set initial state for check page
        modeToggle.checked = true;

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
                // Stay on Check mode (shouldn't happen, but handle anyway)
                return;
            } else {
                // Switch to Generate mode
                document.body.classList.add('page-transition-out');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 400);
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



// Initialize Feather Icons and form handler for Check My Answer tool
document.addEventListener("DOMContentLoaded", function() {
    feather.replace();

    // Form submission handler
    const checkForm = document.getElementById("checkForm");
    checkForm.addEventListener("submit", handleCheckFormSubmission);
});

// Global variables to store review content
let reviewContent = {
    originalReview: "",
    improvedAnswer: "",
    feedbackSummary: "",
};

// Handle check form submission
async function handleCheckFormSubmission(event) {
    event.preventDefault();

    // Get form data
    const formData = new FormData(event.target);
    const question = formData.get("question").trim();
    const userAnswer = formData.get("userAnswer").trim();
    const gradeLevel = formData.get("gradeLevel");

    // Validate required fields
    if (!question || !userAnswer || !gradeLevel) {
        showCheckError("Please fill in all required fields.");
        return;
    }

    // Prepare AI prompt for answer review
    const userMessage = `You are reviewing a student's answer for an NCERT-style exam question. Provide comprehensive feedback to help them improve.

Auto-detect subject and language from the question and answer.

For the review, you need to:
1. Analyze the student's answer thoroughly
2. Highlight good parts and identify errors/missing elements
3. Provide an improved version
4. Give constructive feedback

For maths:
- Use × for multiplication (e.g. 3 × 5 = 15)
- Do not use * symbol

Format strictly as:
**ORIGINAL REVIEW**
[Student's original answer with {{GOOD: good parts}} and {{ERROR: problematic parts}} and {{MISSING: what's missing}} markers. Use \\n for line breaks]

**IMPROVED VERSION**
[A well-structured, complete answer that would get full marks. Use ## to highlight key terms and final answers, use × for multiplication, include approximate values where applicable]

**FEEDBACK SUMMARY**
Strengths: [What the student did well]
Areas for Improvement: [Specific suggestions for better answers]
Key Missing Elements: [Important points not covered]
Estimated Score: [X/Y marks based on completeness and accuracy]
Tips: [Specific advice for exam success in this subject]

RULES:
- No extra headings, markdown, *, bullets, or lists except specified ** markers
- Use {{GOOD: text}}, {{ERROR: text}}, {{MISSING: text}} for highlighting in original review
- Use \\n for new lines, ## for emphasis in improved version
IMPORTANT- Write for grade level(remember about the level of user, don't provide too much details ): ${gradeLevel} 
- If subject is Hindi, provide feedback in Hindi

Question: ${question}

Student's Answer: ${userAnswer}`;

    // Show loading state
    showCheckLoading(true);
    hideCheckError();
    hideCheckOutput();

    try {
        // Make request to Make.com webhook (using same endpoint as generator)
        await generateReview(userMessage);
    } catch (error) {
        console.error("Error generating review:", error);
        showCheckError(
            "Failed to review your answer. Please check your connection and try again.",
        );
        showCheckLoading(false);
    }
}

// Make.com webhook URL - using same endpoint as main tool
const CHECK_WEBHOOK_URL = "https://hook.eu2.make.com/62ubza5bw3qs8q2li7ln8c2rkevo9u7q";

// Generate review using Make.com webhook
async function generateReview(userMessage) {
    try {
        const response = await fetch(CHECK_WEBHOOK_URL, {
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

        // Robust JSON parsing (same as main tool)
        try {
            const parsedResponse = JSON.parse(responseText);
            aiResponse = parsedResponse.aiResponse || responseText;
        } catch (parseError) {
            const match = responseText.match(/"aiResponse"\s*:\s*(.*)/s);
            if (!match) {
                throw new Error("Could not extract AI response from the response.");
            }

            let extractedResponse = match[1].trim();

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

        // Parse the review response
        parseAndDisplayReview(aiResponse);
        showCheckLoading(false);
        showCheckOutput();
    } catch (error) {
        console.error("Review fetch error:", error);
        throw error;
    }
}

// Parse review response and display in output sections
function parseAndDisplayReview(responseText) {
    // Use regex to extract sections
    const originalMatch = responseText.match(/\*\*ORIGINAL REVIEW\*\*(.*?)(?=\*\*IMPROVED VERSION\*\*|\*\*FEEDBACK SUMMARY\*\*|$)/si);
    const improvedMatch = responseText.match(/\*\*IMPROVED VERSION\*\*(.*?)(?=\*\*FEEDBACK SUMMARY\*\*|$)/si);
    const feedbackMatch = responseText.match(/\*\*FEEDBACK SUMMARY\*\*(.*)/si);

    const originalReview = originalMatch ? originalMatch[1].trim() : "";
    const improvedAnswer = improvedMatch ? improvedMatch[1].trim() : "";
    const feedbackSummary = feedbackMatch ? feedbackMatch[1].trim() : "";

    // Fallback: if nothing parsed, show raw text
    if (!originalReview && !improvedAnswer && !feedbackSummary) {
        reviewContent = {
            originalReview: responseText.trim() || "Unable to parse review response. Please check the webhook configuration.",
            improvedAnswer: "Unable to extract improved version from response.",
            feedbackSummary: "Unable to extract feedback from response.",
        };
    } else {
        reviewContent = {
            originalReview: originalReview || "No review highlights generated.",
            improvedAnswer: improvedAnswer || "No improved version generated.",
            feedbackSummary: feedbackSummary || "No feedback provided.",
        };
    }

    // Display review content
    displayReviewContent("originalReview", reviewContent.originalReview);
    displayReviewContent("improvedAnswer", reviewContent.improvedAnswer);
    displayReviewContent("feedbackSummary", reviewContent.feedbackSummary);

    // Update word count for improved answer
    updateCheckWordCount("improvedAnswer", reviewContent.improvedAnswer);
}

// Display review content with enhanced formatting
function displayReviewContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        let formattedContent = '';

        if (elementId === 'originalReview') {
            // Format original review with highlights
            let processedContent = content
                .replace(/\*/g, '×')
                .replace(/\\n/g, '<br>')
                .replace(/\{\{GOOD:(.*?)\}\}/g, '<span class="good-highlight">$1</span>')
                .replace(/\{\{ERROR:(.*?)\}\}/g, '<span class="error-highlight">$1</span>')
                .replace(/\{\{MISSING:(.*?)\}\}/g, '<span class="neutral-highlight">Missing: $1</span>');

            formattedContent = `<div class="review-content">${processedContent}</div>`;
        } else if (elementId === 'improvedAnswer') {
            // Format improved answer with enhanced styling
            let processedContent = content
                .replace(/\*/g, '×')
                .replace(/\\n/g, '<br>')
                .replace(/##(.*?)##/g, '<strong>$1</strong>');

            formattedContent = `<div class="improved-content">${processedContent}</div>`;
        } else if (elementId === 'feedbackSummary') {
            // Format feedback summary with sections
            let processedContent = content
                .replace(/\*/g, '×')
                .replace(/\\n/g, '<br>')
                .replace(/Strengths:(.*?)(?=Areas for Improvement:|Key Missing Elements:|Estimated Score:|Tips:|$)/si,
                    '<div class="feedback-section strengths-section"><strong>Strengths:</strong>$1</div>')
                .replace(/Areas for Improvement:(.*?)(?=Key Missing Elements:|Estimated Score:|Tips:|$)/si,
                    '<div class="feedback-section improvements-section"><strong>Areas for Improvement:</strong>$1</div>')
                .replace(/Key Missing Elements:(.*?)(?=Estimated Score:|Tips:|$)/si,
                    '<div class="feedback-section improvements-section"><strong>Key Missing Elements:</strong>$1</div>')
                .replace(/Estimated Score:(.*?)(?=Tips:|$)/si,
                    '<div class="feedback-section score-section"><strong>Estimated Score:</strong>$1</div>')
                .replace(/Tips:(.*)/si,
                    '<div class="feedback-section"><strong>Tips:</strong>$1</div>');

            formattedContent = `<div class="feedback-content">${processedContent}</div>`;
        } else {
            // Default formatting
            let processedContent = content.replace(/\*/g, '×').replace(/\\n/g, '<br>');
            formattedContent = `<p>${processedContent}</p>`;
        }

        element.innerHTML = formattedContent;
    }
}

// Update word count for improved answer
function updateCheckWordCount(section, content) {
    if (section === "improvedAnswer") {
        const wordCount = content.trim().split(/\s+/).length;
        const wordCountElement = document.getElementById("improvedAnswerWordCount");
        if (wordCountElement) {
            wordCountElement.textContent = `${wordCount} words`;
        }
    }
}

// Show/hide loading state for check tool
function showCheckLoading(show) {
    const checkBtn = document.getElementById("checkBtn");
    const btnText = checkBtn.querySelector(".btn-text");
    const loadingSpinner = document.getElementById("checkLoadingSpinner");

    if (show) {
        checkBtn.disabled = true;
        btnText.style.display = "none";
        loadingSpinner.style.display = "flex";
    } else {
        checkBtn.disabled = false;
        btnText.style.display = "inline";
        loadingSpinner.style.display = "none";
    }
}

// Show check output section
function showCheckOutput() {
    const outputSection = document.getElementById("checkOutputSection");
    outputSection.style.display = "block";
    outputSection.classList.add("fade-in");

    // Scroll to output section
    outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Hide check output section
function hideCheckOutput() {
    const outputSection = document.getElementById("checkOutputSection");
    outputSection.style.display = "none";
    outputSection.classList.remove("fade-in");
}

// Show check error
function showCheckError(message) {
    const errorSection = document.getElementById("checkErrorSection");
    const errorMessage = document.getElementById("checkErrorMessage");

    errorMessage.textContent = message;
    errorSection.style.display = "block";
    errorSection.classList.add("fade-in");

    // Scroll to error section
    errorSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Hide check error
function hideCheckError() {
    const errorSection = document.getElementById("checkErrorSection");
    errorSection.style.display = "none";
    errorSection.classList.remove("fade-in");
}

// Show copy notification for check tool
function showCheckCopyNotification() {
    const notification = document.getElementById('checkCopyNotification');
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Copy to clipboard function for review content
async function copyReviewContent(sectionId) {
    const content = reviewContent[sectionId];
    if (!content) return;

    // Clean content (reusing the function from main tool)
    const cleanedText = cleanReviewContent(content);

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
        showCheckCopyNotification();

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
            showCheckCopyNotification();

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

// Clean review content function
function cleanReviewContent(raw) {
    if (!raw || typeof raw !== 'string') {
        return '';
    }

    // Handle review-specific cleaning
    let cleaned = raw
        .replace(/\\n/g, '\n')                      // Convert \\n to actual line breaks
        .replace(/\{\{GOOD:(.*?)\}\}/g, '$1')       // Remove GOOD markers, keep content
        .replace(/\{\{ERROR:(.*?)\}\}/g, '$1')      // Remove ERROR markers, keep content
        .replace(/\{\{MISSING:(.*?)\}\}/g, '$1')    // Remove MISSING markers, keep content
        .replace(/<[^>]*>/g, '')                    // Remove HTML tags
        .replace(/&nbsp;/g, ' ')                    // Convert HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    return cleaned
        .split('\n')
        .map(line =>
            line
                .replace(/^[*\-#=~`|+ ]+/, '')
                .replace(/[*_`~|]+/g, '')
                .replace(/={2,}/g, '')
                .replace(/-{2,}/g, '')
                .replace(/\*{2,}/g, '')
                .replace(/#{1,6}\s*/g, '')
                .replace(/^\s*[\-\*\+]\s+/, '')
                .replace(/##(.*?)##/g, '$1')
                .replace(/\*\*/g, '')
                .replace(/__/g, '')
                .trim()
        )
        .filter(line => {
            const cleanLine = line.replace(/[*\-=~`|#+ ]/g, '');
            return cleanLine.length > 0;
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');
}

// Download review as text file
function downloadReviewAsText() {
    const question = document.getElementById("checkQuestion").value;
    const userAnswer = document.getElementById("userAnswer").value;
    const gradeLevel = document.getElementById("checkGradeLevel").value;

    // Clean the content
    const cleanedQuestion = cleanReviewContent(question);
    const cleanedUserAnswer = cleanReviewContent(userAnswer);
    const cleanedOriginalReview = cleanReviewContent(reviewContent.originalReview);
    const cleanedImprovedAnswer = cleanReviewContent(reviewContent.improvedAnswer);
    const cleanedFeedback = cleanReviewContent(reviewContent.feedbackSummary);

    // Prepare content for download
    const content = `VED GRADEBOOSTER - CHECK MY ANSWER REVIEW REPORT
================================================

QUESTION:
${cleanedQuestion}

STUDENT'S ORIGINAL ANSWER:
${cleanedUserAnswer}

GRADE LEVEL: ${gradeLevel}

REVIEWED ON: ${new Date().toLocaleDateString()}

================================================

ORIGINAL ANSWER REVIEW:
${cleanedOriginalReview}

================================================

IMPROVED VERSION:
${cleanedImprovedAnswer}

================================================

FEEDBACK SUMMARY:
${cleanedFeedback}

================================================

Review results are AI-generated and should be used as guidance.
Final evaluation depends on your teacher and exam criteria.
Built by Anish Bairagi - VED Platform
`;

    // Create and download file
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `ved-check-answer-review-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Auto-resize textareas for check tool
document.getElementById("checkQuestion").addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
});

document.getElementById("userAnswer").addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
});

// Clear check form function
function clearCheckForm() {
    document.getElementById("checkForm").reset();
    hideCheckOutput();
    hideCheckError();
}

// Keyboard shortcuts for check tool
document.addEventListener("keydown", function(event) {
    // Ctrl+Enter to submit check form
    if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        const checkBtn = document.getElementById("checkBtn");
        if (checkBtn && !checkBtn.disabled) {
            checkBtn.click();
        }
    }

    // Escape to clear check form
    if (event.key === "Escape") {
        clearCheckForm();
    }
});
