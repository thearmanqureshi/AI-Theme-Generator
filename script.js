document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("themeInput");
    const generateBtn = document.getElementById("generateTheme");
    const preview = document.getElementById("preview");
    const cssOutput = document.getElementById("cssOutput");

    generateBtn.addEventListener("click", async () => {
        const userInput = inputField.value;
        if (!userInput) {
            alert("Please enter a theme description!");
            return;
        }

        try {
            const themeCSS = await getThemeFromGroq(userInput);
            applyCSS(themeCSS);
            cssOutput.textContent = themeCSS;
        } catch (error) {
            console.error("Error generating theme:", error);
        }
    });
});

async function getThemeFromGroq(userInput) {
    const apiKey = window.ENV.API_KEY;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer ${window.ENV.API_KEY}"
        },
        body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [
                {
                    role: "system",
                    content: "You are a CSS expert. Generate only CSS code without explanations. Focus on styling for a card component with header, body, footer, and buttons. All selectors should be prefixed with '#preview' to ensure styles only apply to the preview section."
                },
                {
                    role: "user",
                    content: `Generate a CSS theme based on this description: ${userInput}. Include styles for #preview .preview-card, #preview .preview-card-header, #preview .preview-card-body, #preview .preview-card-footer, and #preview .preview-card-body button elements. Make sure all selectors are prefixed with '#preview' to scope the styling only to the preview area.`
                }
            ],
            max_tokens: 500
        })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    return data.choices && data.choices[0] && data.choices[0].message 
        ? data.choices[0].message.content.trim() 
        : "/* Error: No theme generated */";
}

function applyCSS(cssRules) {
    const styleTag = document.getElementById("themeStyle") || document.createElement("style");
    styleTag.id = "themeStyle";
    styleTag.textContent = cssRules;
    document.head.appendChild(styleTag);
}
