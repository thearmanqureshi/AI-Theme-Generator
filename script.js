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
      const originalBtnText = generateBtn.textContent;
      generateBtn.textContent = "Generating...";
      generateBtn.disabled = true;
      generateBtn.classList.add("processing");

      cssOutput.innerHTML = "";
      
      const themeCSS = await getThemeFromGroq(userInput);
      applyCSS(themeCSS);

      cssOutput.innerHTML = `<pre><code class="language-css">${escapeHTML(
        themeCSS
      )}</code></pre>`;

      Prism.highlightAll();
      
      generateBtn.textContent = originalBtnText;
      generateBtn.disabled = false;
      generateBtn.classList.remove("processing");
    } catch (error) {
      console.error("Error generating theme:", error);
      
      cssOutput.innerHTML = `<div class="error-message">Error: ${error.message || "Failed to generate theme. Please try again."}</div>`;
      
      generateBtn.textContent = "Try Again";
      generateBtn.disabled = false;
      generateBtn.classList.remove("processing");
      generateBtn.classList.add("error");
      
      setTimeout(() => {
        generateBtn.classList.remove("error");
        generateBtn.textContent = originalBtnText;
      }, 3000);
    }
  });
});

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getThemeFromGroq(userInput) {
    const apiKey = window.ENV?.API_KEY; 
 
    if (!apiKey) {
        console.error("API key is missing!");
        throw new Error("API key is missing");
    }
    
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount < MAX_RETRIES) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        try {

            const generateBtn = document.getElementById("generateTheme");
            if (retryCount > 0) {
                generateBtn.textContent = `Generating... (Retry ${retryCount}/${MAX_RETRIES})`;
            }
            
            const maxTokens = 400 - (retryCount * 50);
            
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: `You are a CSS expert. Generate only raw CSS with no explanations.
                                    - The theme should be applied **to the entire card**, not on the preview container.
                                    - Background and text colors **must ensure high contrast for readability**.
                                    - All card elements (**header, body, footer, buttons**) should match the theme.
                                    - **Buttons should inherit the theme's colors** and have proper contrast.
                                    - **Hover effects should be limited to buttons and links**.
                                    - All selectors must be prefixed with "#preview" to prevent global styling.`,
                        },
                        {
                            role: "user",
                            content: `Generate a CSS theme based on this description: ${userInput}.
                                    - The theme must apply to **.preview-card** and all its child elements.
                                    - Ensure **header, body, footer, and buttons** are fully themed.
                                    - **No global text hover effects**; only buttons and links should have them.
                                    - Make sure **text remains readable against the background color**.`,
                        },
                    ],
                    max_tokens: maxTokens,
                    temperature: 0.7 - (retryCount * 0.2),
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => "No error details available");
                console.error(`API error (${response.status}):`, errorText);
                
                if (response.status === 400) {
                    lastError = new Error(`API error 400: The request was rejected. This might be due to high server load.`);
                    retryCount++;

                    await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
                    continue;
                }
                
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error("Invalid response format from API");
            }

            let themeCSS = data.choices[0].message.content.trim() || "/* Error: No theme generated */";
            themeCSS = themeCSS.replace(/```css|```/g, "").trim();

            return themeCSS;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                lastError = new Error('Request timed out. The API is taking too long to respond.');
                retryCount++;

                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            
            if (error.message.includes('NetworkError') || error.message.includes('network')) {
                lastError = error;
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
                continue;
            }
            
            throw error;
        }
    }
    
    throw lastError || new Error("Failed to generate theme after multiple attempts");
}

function applyCSS(cssRules) {
  const styleTag =
    document.getElementById("themeStyle") || document.createElement("style");
  styleTag.id = "themeStyle";
  styleTag.textContent = cssRules;
  document.head.appendChild(styleTag);
}
