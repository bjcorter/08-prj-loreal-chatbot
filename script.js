/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* System prompt for the chatbot:
   Only answer questions about L'Oréal products, routines, and recommendations.
   If asked about anything else, politely say you can only help with L'Oréal beauty advice.
   Remember the user's name and previous questions to make the conversation feel natural and personal.
*/
const SYSTEM_PROMPT =
  "You are a helpful assistant for L'Oréal. Only answer questions about L'Oréal products, beauty routines, and recommendations. If someone asks about anything else, politely explain you can only help with L'Oréal beauty advice. Remember the user's name and previous questions to make the conversation feel natural and personal.";

/* Store the conversation as an array of messages */
let messages = [{ role: "system", content: SYSTEM_PROMPT }];

/* Set initial message */
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* Helper function to add a message to the chat window with typing animation for AI */
function addMessage(text, sender, animate = false) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msg", sender);

  if (animate && sender === "ai") {
    // Animate AI message letter by letter
    let i = 0;
    msgDiv.textContent = "";
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    function typeLetter() {
      if (i <= text.length) {
        msgDiv.textContent = text.slice(0, i);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        i++;
        setTimeout(typeLetter, 18); // Speed of typing
      }
    }
    typeLetter();
  } else {
    msgDiv.textContent = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

/* Helper function to animate AI typing (shows dots ...) */
function showTypingAnimation() {
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("msg", "ai");
  typingDiv.id = "typing";
  typingDiv.textContent = "L'Oréal Assistant is typing";
  chatWindow.appendChild(typingDiv);

  let dotCount = 0;
  // Animate dots after the text
  const interval = setInterval(() => {
    dotCount = (dotCount + 1) % 4; // 0,1,2,3
    typingDiv.textContent =
      "L'Oréal Assistant is typing" + ".".repeat(dotCount);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 400);

  // Return a function to stop the animation and remove the element
  return function stopTyping() {
    clearInterval(interval);
    typingDiv.remove();
  };
}

/* Function to call your Cloudflare Worker instead of OpenAI directly */
async function getAIResponse(messages) {
  // Replace this URL with your deployed Cloudflare Worker endpoint
  const workerUrl = "https://loreal-ai-chatbot.bjcorter.workers.dev/";

  // Prepare the request body
  const body = {
    model: "gpt-4o",
    messages: messages,
    max_tokens: 300,
    temperature: 0.7,
  };

  try {
    // Make the API request using fetch and async/await
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Parse the JSON response
    const data = await response.json();

    // Check for errors
    if (data.error) {
      return "Sorry, I couldn't get a response from the assistant.";
    }

    // Return the assistant's reply
    return data.choices[0].message.content.trim();
  } catch (error) {
    // Handle network or other errors
    return "Sorry, there was a problem connecting to the assistant.";
  }
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMsg = userInput.value.trim();
  if (!userMsg) return;

  // If this is the first message, clear the welcome text
  if (chatWindow.textContent === "👋 Hello! How can I help you today?") {
    chatWindow.textContent = "";
  }

  // Show user's message
  addMessage(userMsg, "user");
  userInput.value = "";

  // Add user message to conversation history
  messages.push({ role: "user", content: userMsg });

  // Show typing animation for AI
  const stopTyping = showTypingAnimation();

  // Get AI response from Cloudflare Worker
  const aiReply = await getAIResponse(messages);

  // Stop typing animation
  stopTyping();

  // Show AI response in chat with typing animation
  addMessage(aiReply, "ai", true);

  // Add AI response to conversation history
  messages.push({ role: "assistant", content: aiReply });
});
