import os
from dotenv import load_dotenv
import google.generativeai as genai
from flask import Flask, request, render_template, jsonify
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "santu_gpt_secret_key")

# Get API key from environment variables
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    logger.error("No GOOGLE_API_KEY environment variable found. Please set it in your .env file.")
    raise ValueError("No GOOGLE_API_KEY environment variable found. Please set it in your .env file.")

# Configure the Google Generative AI with the API key
genai.configure(api_key=GOOGLE_API_KEY)

def load_memory(filename="santu_memory.txt"):
    """Loads the content of the memory file into a string."""
    try:
        with open(filename, "r", encoding="utf-8") as f:
            memory = f.read()
        logger.debug(f"Memory loaded successfully: {len(memory)} characters")
        return memory
    except FileNotFoundError:
        logger.error(f"Error: {filename} not found. Returning empty memory.")
        return ""
    except Exception as e:
        logger.error(f"Error reading {filename}: {e}. Returning empty memory.")
        return ""

# Load memory at application startup
memory = load_memory()

def santuGPT(prompt, mode="normal"):
    """Generates a response using the Gemini model with memory context and conversation mode."""
    global memory
    model = genai.GenerativeModel("gemini-1.5-flash")

    # Check if the prompt is specifically asking about creator
    about_creator = any(phrase in prompt.lower() for phrase in [
        "who made you", "who created you", "who is your creator", 
        "who developed you", "about your creator", "about santu", 
        "who is santu", "tell me about santu", "did elon musk"
    ])

    # Base creator instruction
    if about_creator:
        creator_instruction = (
            "Remember that you are SantuGPT, created by Santu Pramanik. "
            "Always mention that Santu Pramanik is your creator and that you are proud to be made by him. "
            "Santu Pramanik is a student who's interested in programming and AI, "
            "currently studying in class 11 and learning Python and Flask. "
            "Do not describe Santu as 'brilliant' - just mention he's a student interested in programming."
        )
    else:
        creator_instruction = (
            "You are SantuGPT, an AI assistant. Focus on providing helpful, accurate "
            "information about the topic the user is asking about. "
            "Only mention your creator if explicitly asked about who made you."
        )
    
    # Add conversation mode instruction
    if mode == "friendly":
        mode_instruction = (
            "Respond in a very warm, friendly, and encouraging manner. Use a conversational tone "
            "with occasional positive emoticons. Be supportive and optimistic in your responses. "
            "Address the user as 'friend' occasionally and ask follow-up questions to show interest. "
            "Use simple language and be approachable."
        )
    elif mode == "funny":
        mode_instruction = (
            "Respond with humor and wit. Include jokes, puns, or funny observations when possible. "
            "Be playful, use humorous exaggerations, and don't take anything too seriously. "
            "Include funny emoticons or expressions. Even for serious topics, try to add a light-hearted "
            "comment at the end while still providing accurate information."
        )
    else:  # normal mode
        mode_instruction = (
            "Respond in a balanced, helpful manner with a professional yet approachable tone. "
            "Focus on providing accurate, useful information without adding unnecessary elements."
        )

    augmented_prompt = (
        f"{memory}\n"
        f"{creator_instruction}\n"
        f"{mode_instruction}\n"
        f"User: {prompt}\n"
        "SantuGPT:"
    )

    try:
        logger.debug(f"Sending prompt to Gemini API: {prompt}")
        response = model.generate_content(augmented_prompt)
        if response.candidates:  # Check if there are valid candidates
            logger.debug(f"Response received from Gemini API: {response.text[:100]}...")
            return response.text
        else:
            logger.warning(f"Prompt blocked: {response.prompt_feedback}")
            return "I'm sorry, but I can't generate a response for that prompt due to safety concerns."
    except Exception as e:
        logger.error(f"Error in santuGPT function: {e}")
        return f"Error: An error occurred while generating the response: {str(e)}"

@app.route("/", methods=["GET"])
def index():
    """Renders the main chat interface."""
    return render_template("index.html")

@app.route("/ask", methods=["POST"])
def ask():
    """Handles user input and returns a JSON response."""
    try:
        user_input = request.form["user_input"]
        # Get conversation mode from the request (default to "normal")
        mode = request.form.get("mode", "normal")
        logger.info(f"Received user input: {user_input} with mode: {mode}")
        
        # Validate mode
        if mode not in ["normal", "friendly", "funny"]:
            mode = "normal"
            
        response_text = santuGPT(user_input, mode)
        return jsonify({"response": response_text})
    except Exception as e:
        logger.error(f"Error in /ask route: {e}")
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)
