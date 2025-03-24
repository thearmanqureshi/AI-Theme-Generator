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

      cssOutput.innerHTML = `<pre><code class="language-css">${escapeHTML(
        themeCSS
      )}</code></pre>`;

      Prism.highlightAll();
    } catch (error) {
      console.error("Error generating theme:", error);
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

async function getThemeFromGroq(userInput)  {
    const apiKey = window.ENV?.API_KEY; 
 
     if (!apiKey) {
         console.error("API key is missing!");
         return "/* Error: API key is missing */";
     }
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-saba-24b",
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
        max_tokens: 500,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  let themeCSS =
    data.choices?.[0]?.message?.content?.trim() ||
    "/* Error: No theme generated */";

  themeCSS = themeCSS.replace(/```css|```/g, "").trim();

  return themeCSS;
}

function applyCSS(cssRules) {
  const styleTag =
    document.getElementById("themeStyle") || document.createElement("style");
  styleTag.id = "themeStyle";
  styleTag.textContent = cssRules;
  document.head.appendChild(styleTag);
}
