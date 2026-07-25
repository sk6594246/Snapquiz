/**
 * SnapQuiz - Main Application Logic
 * Client-side AI quiz generator using Gemini Vision API
 */

// ===== STATE =====
let selectedAge = '5-7';
let stream = null;
let facingMode = 'environment';
let capturedImage = null;
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let hasAnswered = false;

// ===== NAVIGATION =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function goBack(screenId) {
  stopCamera();
  showScreen(screenId);
}

// ===== AGE SELECTOR =====
function selectAge(btn) {
  document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedAge = btn.dataset.age;
  btn.style.transform = 'scale(0.95)';
  setTimeout(() => btn.style.transform = '', 150);
}

// ===== CAMERA =====
async function goToCapture() {
  const key = document.getElementById('apiKey').value.trim();
  if (!key) {
    showToast('Please paste your Gemini API key first!', 'error');
    document.getElementById('apiKey').focus();
    return;
  }
  showScreen('screen-capture');
  startCamera();
}

function goToUpload() {
  const key = document.getElementById('apiKey').value.trim();
  if (!key) {
    showToast('Please paste your Gemini API key first!', 'error');
    document.getElementById('apiKey').focus();
    return;
  }
  showScreen('screen-capture');
  document.getElementById('camera-placeholder').style.display = 'flex';
  document.getElementById('camera-placeholder').innerHTML = `
    <span class="icon">📁</span>
    <p>Ready to upload</p>
    <span class="sub">Tap "Choose from Gallery" below</span>
  `;
  document.getElementById('video').style.display = 'none';
  document.getElementById('capture-hint').style.display = 'none';
  document.getElementById('snap-btn').classList.add('hidden');
  document.getElementById('flip-btn').classList.add('hidden');
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: facingMode }, 
      audio: false 
    });
    const video = document.getElementById('video');
    video.srcObject = stream;
    video.classList.add('active');
    document.getElementById('camera-placeholder').style.display = 'none';
    document.getElementById('capture-hint').style.display = 'block';
    document.getElementById('snap-btn').classList.remove('hidden');
    document.getElementById('flip-btn').classList.remove('hidden');
  } catch (err) {
    console.error('Camera error:', err);
    document.getElementById('camera-placeholder').innerHTML = `
      <span class="icon">⚠️</span>
      <p>Camera not available</p>
      <span class="sub">Use the gallery button below instead!</span>
    `;
    showToast('Camera access denied. You can still upload photos!', 'error');
    document.getElementById('snap-btn').classList.add('hidden');
    document.getElementById('flip-btn').classList.add('hidden');
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  document.getElementById('video').classList.remove('active');
  document.getElementById('preview-img').classList.remove('active');
  document.getElementById('retake-btn').classList.remove('show');
  document.getElementById('snap-btn').classList.remove('hidden');
  document.getElementById('generate-btn').classList.add('hidden');
  document.getElementById('capture-hint').style.display = 'none';
  capturedImage = null;
}

function flipCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  stopCamera();
  startCamera();
}

function takePhoto() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('capture-canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  if (facingMode === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0);

  capturedImage = canvas.toDataURL('image/jpeg', 0.9);

  document.getElementById('preview-img').src = capturedImage;
  document.getElementById('preview-img').classList.add('active');
  document.getElementById('video').classList.remove('active');
  document.getElementById('retake-btn').classList.add('show');
  document.getElementById('snap-btn').classList.add('hidden');
  document.getElementById('flip-btn').classList.add('hidden');
  document.getElementById('generate-btn').classList.remove('hidden');
  document.getElementById('capture-hint').style.display = 'none';
  document.getElementById('tip-box').innerHTML = `
    <span class="tip-icon">🎉</span>
    <span class="tip-text">Great shot! Tap "Generate Quiz" when you're ready</span>
  `;

  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

function retakePhoto() {
  document.getElementById('preview-img').classList.remove('active');
  document.getElementById('retake-btn').classList.remove('show');
  document.getElementById('snap-btn').classList.remove('hidden');
  document.getElementById('flip-btn').classList.remove('hidden');
  document.getElementById('generate-btn').classList.add('hidden');
  document.getElementById('tip-box').innerHTML = `
    <span class="tip-icon">💡</span>
    <span class="tip-text">For best results, hold steady and make sure text is well-lit and readable</span>
  `;
  capturedImage = null;
  startCamera();
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    capturedImage = event.target.result;
    document.getElementById('preview-img').src = capturedImage;
    document.getElementById('preview-img').classList.add('active');
    document.getElementById('video').classList.remove('active');
    document.getElementById('retake-btn').classList.add('show');
    document.getElementById('snap-btn').classList.add('hidden');
    document.getElementById('flip-btn').classList.add('hidden');
    document.getElementById('generate-btn').classList.remove('hidden');
    document.getElementById('camera-placeholder').style.display = 'none';
    document.getElementById('capture-hint').style.display = 'none';
    document.getElementById('tip-box').innerHTML = `
      <span class="tip-icon">🎉</span>
      <span class="tip-text">Photo loaded! Tap "Generate Quiz" to begin</span>
    `;
  };
  reader.readAsDataURL(file);
}

// ===== QUIZ GENERATION =====
async function generateQuiz() {
  if (!capturedImage) {
    showToast('Please take or upload a photo first!', 'error');
    return;
  }

  const apiKey = document.getElementById('apiKey').value.trim();
  document.getElementById('loading-overlay').classList.add('active');

  try {
    const base64Data = capturedImage.split(',')[1];

    const ageTone = {
      '5-7': 'very playful, uses simple words, lots of encouragement and praise, like a warm kindergarten teacher. Keep questions simple and visual.',
      '8-10': 'friendly and encouraging, slightly challenging but fair, like a cool elementary teacher. Use fun examples.',
      '11-13': 'smart and engaging, respects their intelligence, slightly more sophisticated but still fun and supportive.'
    }[selectedAge];

    const promptText = `You are an expert educational content creator for children ages ${selectedAge}. 

Look at this image of a textbook page, storybook page, or handwritten note. Read and understand the content thoroughly.

Generate exactly 5 multiple-choice quiz questions based STRICTLY on the content visible in the image. 

Rules:
- Questions must be answerable ONLY from the image content
- Tone: ${ageTone}
- Each question has exactly 4 options (A, B, C, D)
- Include a fun, encouraging explanation for each answer
- Make questions engaging and appropriately challenging for the age group
- If the image is a story, ask comprehension questions about characters, plot, or vocabulary
- If the image is a textbook, ask about facts, concepts, or definitions shown
- If the image is handwritten notes, ask about the topics covered

Respond ONLY with valid JSON in this exact format (no markdown, no extra text, no code fences):
{
  "quiz": [
    {
      "question": "string",
      "options": ["A) string", "B) string", "C) string", "D) string"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [
            { text: promptText },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ] 
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API request failed');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const parsed = JSON.parse(jsonStr);
    quizData = parsed.quiz || parsed.questions || parsed;
    if (!Array.isArray(quizData)) quizData = [quizData];

    quizData = quizData.map(q => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex ?? q.correct_answer_index ?? 0,
      explanation: q.explanation
    }));

    if (quizData.length === 0) throw new Error('No questions generated');

    startQuiz();
  } catch (err) {
    console.error(err);
    showToast('Oops! ' + err.message, 'error');
  } finally {
    document.getElementById('loading-overlay').classList.remove('active');
  }
}

// ===== QUIZ LOGIC =====
function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  document.getElementById('score').textContent = '0';
  document.getElementById('total-q').textContent = quizData.length;
  showScreen('screen-quiz');
  renderQuestion();
}

function renderQuestion() {
  hasAnswered = false;
  const q = quizData[currentQuestionIndex];
  const container = document.getElementById('question-container');

  document.getElementById('current-q').textContent = currentQuestionIndex + 1;
  const progress = ((currentQuestionIndex) / quizData.length) * 100;
  document.getElementById('progress-fill').style.width = progress + '%';

  container.innerHTML = `
    <div class="question-card">
      <div class="question-badge">
        <span>📝</span>
        <span>Question ${currentQuestionIndex + 1} of ${quizData.length}</span>
      </div>
      <div class="question-text">${escapeHtml(q.question)}</div>
      <div class="options-list" id="options-list">
        ${q.options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const text = opt.replace(/^[A-D]\)\s*/, '');
          return `
            <button class="option-btn" onclick="selectOption(${idx}, this)" data-index="${idx}">
              <span class="option-letter">${letter}</span>
              <span>${escapeHtml(text)}</span>
              <span class="option-check" id="check-${idx}"></span>
            </button>
          `;
        }).join('')}
      </div>
      <div id="feedback" class="feedback-box"></div>
      <div class="next-btn-wrap" id="next-wrap">
        <button class="btn btn-primary" onclick="nextQuestion()">
          ${currentQuestionIndex < quizData.length - 1 ? 'Next Question →' : 'See Results 🎉'}
        </button>
      </div>
    </div>
  `;
}

function selectOption(index, btn) {
  if (hasAnswered) return;
  hasAnswered = true;

  const q = quizData[currentQuestionIndex];
  const isCorrect = index === q.correctIndex;
  const allBtns = document.querySelectorAll('.option-btn');

  allBtns.forEach(b => b.classList.add('disabled'));

  if (isCorrect) {
    btn.classList.add('correct');
    document.getElementById(`check-${index}`).textContent = '🎉';
    score++;
    document.getElementById('score').textContent = score;
    showFeedback(true, q.explanation);
  } else {
    btn.classList.add('wrong');
    document.getElementById(`check-${index}`).textContent = '❌';
    allBtns[q.correctIndex].classList.add('correct');
    document.getElementById(`check-${q.correctIndex}`).textContent = '✅';
    showFeedback(false, q.explanation);
  }

  document.getElementById('next-wrap').classList.add('show');
}

function showFeedback(isCorrect, text) {
  const fb = document.getElementById('feedback');
  fb.className = `feedback-box show ${isCorrect ? 'correct' : 'wrong'}`;
  fb.innerHTML = (isCorrect ? '🎉 ' : '💡 ') + escapeHtml(text);
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= quizData.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

function confirmQuit() {
  if (confirm('Are you sure you want to quit this quiz? Your progress will be lost.')) {
    goBack('screen-capture');
  }
}

function showResults() {
  showScreen('screen-results');
  const total = quizData.length;
  const percent = Math.round((score / total) * 100);

  document.getElementById('stat-correct').textContent = score;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-percent').textContent = percent + '%';

  let title, subtitle, emoji, message;
  if (percent === 100) {
    title = 'Perfect Score!';
    subtitle = 'You are a true superstar! 🌟';
    emoji = '🏆';
    message = 'Absolutely flawless! You understood every detail. Incredible work!';
    createConfetti();
  } else if (percent >= 80) {
    title = 'Amazing!';
    subtitle = 'You did a fantastic job!';
    emoji = '🌟';
    message = 'So close to perfect! You clearly paid great attention to the material.';
    createConfetti();
  } else if (percent >= 60) {
    title = 'Great Work!';
    subtitle = 'Keep learning and growing!';
    emoji = '👍';
    message = 'Solid effort! Reading the page again might help you get even better.';
  } else {
    title = 'Good Try!';
    subtitle = 'Practice makes perfect!';
    emoji = '📚';
    message = 'Every expert was once a beginner. Try reading the page once more and quiz again!';
  }

  document.getElementById('results-title').textContent = title;
  document.getElementById('results-subtitle').textContent = subtitle;
  document.getElementById('trophy-emoji').textContent = emoji;
  document.getElementById('result-message').innerHTML = `<p>${message}</p>`;
}

function restartApp() {
  capturedImage = null;
  quizData = [];
  currentQuestionIndex = 0;
  score = 0;
  document.getElementById('preview-img').classList.remove('active');
  document.getElementById('retake-btn').classList.remove('show');
  document.getElementById('snap-btn').classList.remove('hidden');
  document.getElementById('flip-btn').classList.remove('hidden');
  document.getElementById('generate-btn').classList.add('hidden');
  document.getElementById('file-input').value = '';
  document.getElementById('tip-box').innerHTML = `
    <span class="tip-icon">💡</span>
    <span class="tip-text">For best results, hold steady and make sure text is well-lit and readable</span>
  `;
  showScreen('screen-capture');
  startCamera();
}

// ===== UTILITIES =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(msg, type = 'error') {
  const toast = document.getElementById('toast');
  toast.textContent = (type === 'error' ? '⚠️ ' : '✅ ') + msg;
  toast.className = 'toast ' + (type === 'success' ? 'success' : '') + ' show';
  setTimeout(() => toast.classList.remove('show'), 4000);
}

function createConfetti() {
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#f97316'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    piece.style.animationDuration = (2 + Math.random() * 3) + 's';
    piece.style.animationDelay = Math.random() * 1.5 + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 6000);
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('snapquiz_api_key');
  if (saved) document.getElementById('apiKey').value = saved;
});

document.getElementById('apiKey').addEventListener('change', (e) => {
  localStorage.setItem('snapquiz_api_key', e.target.value);
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}
