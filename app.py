import os
from dotenv import load_dotenv
import google.generativeai as genai
from flask import Flask, request, render_template, jsonify

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)

# Get API key from environment variables
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("No GOOGLE_API_KEY environment variable found.")

genai.configure(api_key=GOOGLE_API_KEY)


def load_memory(filename="santu_memory.txt"):
    """Loads the content of the memory file into a string."""
    try:
        with open(filename, "r", encoding="utf-8") as f:
            memory = f.read()
        return memory
    except FileNotFoundError:
        print(f"Error: {filename} not found.  Returning empty memory.")
        return ""
    except Exception as e:
        print(f"Error reading {filename}: {e}. Returning empty memory.")
        return ""


memory = load_memory()  # Load memory at application startup


def santuGPT(prompt):
    global memory  # Access the global memory variable
    model = genai.GenerativeModel("gemini-pro")

    augmented_prompt = (
        f"{memory}\n"
        "Remember that you are SantuGPT, created by Santu Pramanik. "
        "If asked about your creator, always mention Santu Pramanik and that you are proud to be made by him. "
        "If the user asks 'Tell me something about me,' use the information about Santu Pramanik that you have been given.\n"
        f"User: {prompt}\n"
        "SantuGPT:"
    )

    try:
        print(f"Augmented Prompt: {augmented_prompt}")  # Debug: Print the prompt

        response = model.generate_content(augmented_prompt)

        # Check for API errors in the response (if the Gemini API provides a way to do so)
        if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
            print(f"Gemini API Prompt Feedback: {response.prompt_feedback}")
        return response.text
    except Exception as e:
        print(f"Error in santuGPT function: {e}")  # Log the error
        return f"Error: An error occurred in santuGPT: {e}"  # Return a more specific error


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")  # No response passed initially


@app.route("/ask", methods=["POST"])
def ask():
    try:
        user_input = request.form["user_input"]
        response_text = santuGPT(user_input)
        return jsonify({"response": response_text})  # Returning JSON format
    except Exception as e:
        print(f"Error in /ask: {e}")
        return jsonify({"error": str(e)}), 500  # Return error message and 500 status


if __name__ == "__main__":
    app.run(debug=True)
