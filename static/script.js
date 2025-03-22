// Store theme preference in local storage
function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    document.body.className = themeName;
}

// Initialize theme from local storage or default to dark mode
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    setTheme(savedTheme);
}

// Set conversation mode and update UI
function setConversationMode(modeName) {
    // Store the selected mode in local storage
    localStorage.setItem('conversationMode', modeName);
    
    // Update UI buttons
    const modeButtons = document.querySelectorAll('.mode-button');
    modeButtons.forEach(button => {
        if (button.classList.contains(modeName)) {
            button.classList.add('active');
            button.setAttribute('data-mode', modeName);
        } else {
            button.classList.remove('active');
        }
    });
}

// Initialize chat UI elements
const chatLog = document.getElementById("chat-log");
const userInput = document.getElementById("user-input");

// Sample questions for the chatbot
const allQuestions = [
    "How do you work as a chatbot?🤖",
    "Tell me a joke.",
    "Give me a dare to do right now!😈",
    "How can I impress my crush?😍💘",
    "Explain quantum physics simply.⚛️",
    "Can you make me a funny meme idea?",
    "What is the capital of France?",
    "Recommend a good movie to watch.",
    "Can AI feel emotions?🤔❤️",
    "Tell me an interesting fact."
];

const alwaysIncludeQuestion = "Did Elon Musk secretly design you?";

// Get random questions from the question pool
function getRandomQuestions(numQuestions) {
    const availableQuestions = [...allQuestions];
    const randomQuestions = [];
    for (let i = 0; i < numQuestions; i++) {
        if (availableQuestions.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        randomQuestions.push(availableQuestions.splice(randomIndex, 1)[0]);
    }
    return randomQuestions;
}

// Set sample questions in the UI
function setTryOutQuestions() {
    const questionLinksContainer = document.getElementById("question-links-container");
    questionLinksContainer.innerHTML = '';

    const alwaysIncludeLink = document.createElement('a');
    alwaysIncludeLink.textContent = alwaysIncludeQuestion;
    alwaysIncludeLink.onclick = () => setQuestion(alwaysIncludeQuestion);
    questionLinksContainer.appendChild(alwaysIncludeLink);

    const randomTwoQuestions = getRandomQuestions(2);
    randomTwoQuestions.forEach(question => {
        const questionLink = document.createElement('a');
        questionLink.textContent = question;
        questionLink.onclick = () => setQuestion(question);
        questionLinksContainer.appendChild(questionLink);
    });
}

// Set a question in the input field
function setQuestion(question) {
    userInput.value = question;
    userInput.focus();
}

// Send a message to the chatbot
function sendMessage() {
    const userInputValue = userInput.value.trim();
    if (!userInputValue) return; // Prevent sending empty messages

    // Display user message
    chatLog.innerHTML += `<p><b>You:</b> ${userInputValue}</p>`;
    
    // Scroll to the bottom of the chat log
    chatLog.scrollTop = chatLog.scrollHeight;

    // Disable input and show loading indicator
    userInput.disabled = true;
    userInput.value = "";
    const loadingIndicator = document.createElement('p');
    loadingIndicator.innerHTML = '<b>SantuGPT:</b> <i>Thinking...</i>';
    loadingIndicator.id = 'loading-indicator';
    chatLog.appendChild(loadingIndicator);
    chatLog.scrollTop = chatLog.scrollHeight;
    
    // Make SantuGPT heading glow while thinking
    const heading = document.querySelector('h1');
    heading.classList.add('thinking');

    // Send the request to the server
    const formData = new FormData();
    formData.append('user_input', userInputValue);
    
    // Get the current conversation mode from active button
    const activeModeButton = document.querySelector('.mode-button.active');
    const mode = activeModeButton ? activeModeButton.classList[1] : 'normal';
    formData.append('mode', mode);

    fetch('/ask', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Remove loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            chatLog.removeChild(loadingIndicator);
        }

        // Display AI response
        let responseText = data.response || "Sorry, I couldn't generate a response.";
        
        // Format text - convert **text** to <strong>text</strong> for bold formatting
        responseText = responseText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        const responseElement = document.createElement('p');
        
        // Create the response text without the copy button
        responseElement.innerHTML = `<b>SantuGPT:</b> ${responseText}`;
        
        // Create copy button element separately
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', function() {
            // Copy the text without HTML tags for clean clipboard content
            const plainText = responseText.replace(/<\/?[^>]+(>|$)/g, "");
            copyToClipboard(plainText);
        });
        
        // Append the copy button to the response element
        responseElement.appendChild(copyButton);
        
        chatLog.appendChild(responseElement);
        chatLog.scrollTop = chatLog.scrollHeight;

        // Refresh the sample questions
        setTryOutQuestions();
    })
    .catch(error => {
        console.error('Error:', error);
        
        // Remove loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            chatLog.removeChild(loadingIndicator);
        }
        
        // Display error message
        chatLog.innerHTML += `<p class="error"><b>Error:</b> ${error.message || "Something went wrong. Please try again."}</p>`;
        chatLog.scrollTop = chatLog.scrollHeight;
    })
    .finally(() => {
        // Re-enable input
        userInput.disabled = false;
        userInput.focus();
        
        // Stop the glowing animation on the heading
        const heading = document.querySelector('h1');
        heading.classList.remove('thinking');
    });
}

// Create an audio element for the copy sound
const copySound = new Audio();
copySound.src = "https://soundbible.com/mp3/Tick-DeepFrozenApps-397275646.mp3";

// Copy text to clipboard
function copyToClipboard(text) {
    // Properly escape any special characters in the text
    const cleanText = text.replace(/[\\'"]/g, "\\$&");
    
    // Create a temporary textarea to hold the text
    const textarea = document.createElement('textarea');
    textarea.value = cleanText;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        // Execute the copy command
        document.execCommand('copy');
        // Play sound
        copySound.play();
        // Show success message (without using alert)
        const successMessage = document.createElement('div');
        successMessage.textContent = 'Copied to clipboard!';
        successMessage.style.position = 'fixed';
        successMessage.style.bottom = '20px';
        successMessage.style.left = '50%';
        successMessage.style.transform = 'translateX(-50%)';
        successMessage.style.padding = '10px 20px';
        successMessage.style.backgroundColor = '#4CAF50';
        successMessage.style.color = 'white';
        successMessage.style.borderRadius = '5px';
        successMessage.style.zIndex = '1000';
        document.body.appendChild(successMessage);
        
        // Remove the message after 2 seconds
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 2000);
    } catch (err) {
        console.error('Could not copy text: ', err);
    } finally {
        // Remove the temporary textarea
        document.body.removeChild(textarea);
    }
}

// Clear the chat log
function clearChat() {
    chatLog.innerHTML = '';
    setTryOutQuestions();
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    
    // Force reset to normal mode for all users (temporary)
    localStorage.setItem('conversationMode', 'normal');
    
    // Initialize conversation mode from localStorage or set default to "normal"
    const savedMode = localStorage.getItem('conversationMode') || 'normal';
    setConversationMode(savedMode);
    
    // Add click event listeners to mode buttons
    document.querySelectorAll('.mode-button').forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.classList[1]; // Get second class which is the mode name
            setConversationMode(mode);
        });
    });
    
    setTryOutQuestions();
    
    // Add event listener for Enter key in the input field
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Welcome message
    setTimeout(() => {
        const welcomeMessage = "Hello! I'm SantuGPT, created by Santu Pramanik. Try different conversation modes using the buttons above. How can I help you today?";
        const welcomeElement = document.createElement('p');
        
        // Set the welcome text
        welcomeElement.innerHTML = `<b>SantuGPT:</b> ${welcomeMessage}`;
        
        // Create copy button element
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', function() {
            copyToClipboard(welcomeMessage);
        });
        
        // Append the copy button to the welcome element
        welcomeElement.appendChild(copyButton);
        
        // Add to chat log
        chatLog.appendChild(welcomeElement);
    }, 500);
});
