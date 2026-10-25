const form = document.getElementById("upload-form");
const fileInput = document.getElementById("image-input");
const uploadSection = document.querySelector(".upload-section");
const placeholder = document.getElementById("results-placeholder");
const resultIcon = placeholder.querySelector("i");
const resultImage = document.getElementById("result-image");
const resultTitle = placeholder.querySelector("h3");
const aiLikelihood = document.getElementById("ai-likelihood");
const realLikelihood = document.getElementById("real-likelihood");
const explanationText = document.getElementById("explanation-text");
let previewUrl;

function formatPercentage(value) {
    return `${Number(value).toFixed(2)}%`;
}

function showError(message) {
    placeholder.classList.remove("has-result");
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = undefined;
    }
    resultImage.hidden = true;
    resultIcon.hidden = false;
    resultTitle.className = "";
    resultTitle.textContent = "Analysis failed";
    resultTitle.hidden = false;
    const resultMessage = placeholder.querySelector("p");
    resultMessage.textContent = message;
    resultMessage.hidden = false;
    placeholder.hidden = false;
    if (explanationText) {
        explanationText.textContent = "Upload a valid image to see an explanation.";
    }
}

function showResult(result, file) {
    placeholder.classList.add("has-result");
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }
    previewUrl = URL.createObjectURL(file);
    resultImage.src = previewUrl;
    resultImage.hidden = false;
    resultIcon.hidden = true;
    resultTitle.className =
        result.result === "Real" ? "result-real" : "result-ai";
    resultTitle.textContent = result.result;
    resultTitle.hidden = false;
    const resultMessage = placeholder.querySelector("p");
    resultMessage.textContent =
        `Confidence: ${formatPercentage(result.confidence)}`;
    resultMessage.hidden = false;
    placeholder.hidden = false;
    aiLikelihood.textContent = formatPercentage(result.probabilities.ai_generated);
    realLikelihood.textContent = formatPercentage(result.probabilities.real);
    if (explanationText) {
        explanationText.textContent =
            result.explanation || "No explanation provided.";
    }
}

async function analyzeImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    uploadSection.classList.add("is-loading");
    if (explanationText) {
        explanationText.textContent = "Analyzing image and generating explanation with Gemini...";
    }

    try {
        const response = await fetch(form.action, {
            method: "POST",
            body: formData,
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
            throw new Error(payload.error?.message || "The image could not be analyzed.");
        }
        showResult(payload, file);
    } catch (error) {
        showError(error.message);
    } finally {
        uploadSection.classList.remove("is-loading");
    }
}

fileInput.addEventListener("change", () => {
    const [file] = fileInput.files;
    if (file) {
        analyzeImage(file);
    }
});

form.addEventListener("submit", (event) => event.preventDefault());

["dragenter", "dragover"].forEach((eventName) => {
    uploadSection.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadSection.classList.add("is-dragging");
    });
});

["dragleave", "drop"].forEach((eventName) => {
    uploadSection.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadSection.classList.remove("is-dragging");
    });
});

uploadSection.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer.files;
    if (file) {
        analyzeImage(file);
    }
});
