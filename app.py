from flask import Flask, request, render_template
import google.generativeai as genai

app = Flask(__name__)

# Set up Gemini API key
genai.configure(api_key="AIzaSyCOYB-VsIC7giCUHd4uBV37mBXSd6isQK4")

def santuGPT(prompt):
    model = genai.GenerativeModel("gemini-pro")
    
    response = model.generate_content(f"You are SANTUGPT, an AI chatbot created by Santu. "
                                      "Always introduce yourself as 'I am Santu, an AI made by Santu.' "
                                      f"Now answer this: {prompt}")
    
    return response.text

@app.route("/", methods=["GET", "POST"])
def index():
    response = ""
    if request.method == "POST":
        user_input = request.form["user_input"]
        response = santuGPT(user_input)
    
    return render_template("index.html", response=response)

if __name__ == "__main__":
    app.run(debug=True)
