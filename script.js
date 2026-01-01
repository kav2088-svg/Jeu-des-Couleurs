// État de l'application
const gameState = {
    playerName: '',
    currentLevel: '',
    currentColor: '',
    score: 0,
    colors: ['ROUGE', 'BLEU', 'VERT', 'JAUNE', 'ORANGE', 'VIOLET', 'ROSE', 'CYAN', 'VERT LIME']
};

// Couleurs correspondantes
const colorMap = {
    'ROUGE': '#FF0000',
    'BLEU': '#0000FF',
    'VERT': '#008000',
    'JAUNE': '#FFD700',
    'ORANGE': '#FF8C00',
    'VIOLET': '#800080',
    'ROSE': '#FF1493',
    'CYAN': '#00FFFF',
    'VERT LIME': '#32CD32'
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadHistory();
    
    // Charger les voix disponibles (nécessaire pour certains navigateurs)
    if ('speechSynthesis' in window) {
        // Les voix peuvent ne pas être disponibles immédiatement
        window.speechSynthesis.getVoices();
        
        // Recharger les voix après un court délai (nécessaire pour Chrome)
        setTimeout(() => {
            window.speechSynthesis.getVoices();
        }, 100);
        
        // Écouter l'événement voiceschanged pour charger les voix quand elles sont disponibles
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
});

// Gestionnaires d'événements
function initializeEventListeners() {
    // Bouton de démarrage
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', handleStartGame);
    
    // Entrée dans le champ nom
    const nameInput = document.getElementById('player-name');
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleStartGame();
        }
    });
    
    // Boutons de retour
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        saveScore();
        showScreen('home-screen');
    });
    
    const backGameBtn = document.getElementById('back-game-btn');
    backGameBtn.addEventListener('click', () => {
        saveScore();
        showScreen('home-screen');
    });
    
    // Sélection de niveau
    const levelCards = document.querySelectorAll('.level-card');
    levelCards.forEach(card => {
        card.addEventListener('click', () => {
            const level = card.getAttribute('data-level');
            startLevel(level);
        });
    });
    
    // Bouton continuer
    const continueBtn = document.getElementById('continue-btn');
    continueBtn.addEventListener('click', () => {
        hidePopup();
        generateNewRound();
    });
    
    // Bouton OK pour l'erreur
    const errorOkBtn = document.getElementById('error-ok-btn');
    errorOkBtn.addEventListener('click', () => {
        hideErrorPopup();
    });
    
    // Sélecteur de niveau dans le jeu
    const levelSelect = document.getElementById('level-select');
    levelSelect.addEventListener('change', (e) => {
        const newLevel = e.target.value;
        if (newLevel !== gameState.currentLevel) {
            saveScore();
            startLevel(newLevel);
        }
    });
    
    // Bouton historique
    const historyBtn = document.getElementById('history-btn');
    historyBtn.addEventListener('click', () => {
        showHistory();
    });
    
    // Bouton retour depuis l'historique
    const backHistoryBtn = document.getElementById('back-history-btn');
    backHistoryBtn.addEventListener('click', () => {
        showScreen('home-screen');
    });
    
    // Bouton effacer l'historique
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
            clearHistory();
        }
    });
}

// Afficher un écran
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Démarrer le jeu
function handleStartGame() {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    
    if (name === '') {
        nameInput.style.borderColor = '#FF4444';
        nameInput.placeholder = 'Entre ton prénom !';
        setTimeout(() => {
            nameInput.style.borderColor = '#E0E0E0';
            nameInput.placeholder = 'Ton prénom ici...';
        }, 2000);
        return;
    }
    
    gameState.playerName = name;
    showScreen('level-screen');
}

// Démarrer un niveau
function startLevel(level) {
    gameState.currentLevel = level;
    gameState.score = 0;
    updateScoreDisplay();
    
    // Mettre à jour le sélecteur de niveau
    const levelSelect = document.getElementById('level-select');
    if (levelSelect) {
        levelSelect.value = level;
    }
    
    showScreen('game-screen');
    generateNewRound();
}

// Sauvegarder le score
function saveScore() {
    if (gameState.score > 0 && gameState.playerName && gameState.currentLevel) {
        const scoreData = {
            playerName: gameState.playerName,
            level: gameState.currentLevel,
            score: gameState.score,
            date: new Date().toISOString()
        };
        
        let history = getHistory();
        history.push(scoreData);
        
        // Trier par score décroissant, puis par date
        history.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return new Date(b.date) - new Date(a.date);
        });
        
        // Garder seulement les 50 meilleurs scores
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        localStorage.setItem('colorGameHistory', JSON.stringify(history));
        loadHistory();
    }
}

// Obtenir l'historique
function getHistory() {
    const historyJson = localStorage.getItem('colorGameHistory');
    return historyJson ? JSON.parse(historyJson) : [];
}

// Charger et afficher l'historique
function loadHistory() {
    const history = getHistory();
    const historyList = document.getElementById('history-list');
    
    if (!historyList) return;
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">Aucun score enregistré pour le moment.</div>';
        return;
    }
    
    historyList.innerHTML = '';
    
    history.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const levelNames = {
            'facile': 'Facile',
            'moyen': 'Moyen',
            'difficile': 'Difficile'
        };
        
        historyItem.innerHTML = `
            <div class="history-item-info">
                <div class="history-item-name">${item.playerName}</div>
                <div class="history-item-details">
                    <span>Niveau: ${levelNames[item.level] || item.level}</span>
                    <span>•</span>
                    <span>${dateStr}</span>
                </div>
            </div>
            <div class="history-item-score">${item.score}</div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Afficher l'écran d'historique
function showHistory() {
    loadHistory();
    showScreen('history-screen');
}

// Effacer l'historique
function clearHistory() {
    localStorage.removeItem('colorGameHistory');
    loadHistory();
}

// Générer un nouveau round
function generateNewRound() {
    // Sélectionner une couleur aléatoire
    const randomIndex = Math.floor(Math.random() * gameState.colors.length);
    gameState.currentColor = gameState.colors[randomIndex];
    
    // Mettre à jour l'instruction
    const instruction = document.getElementById('game-instruction');
    const targetColorSpan = instruction.querySelector('.target-color');
    targetColorSpan.textContent = gameState.currentColor;
    targetColorSpan.style.color = colorMap[gameState.currentColor];
    
    // Générer la grille de couleurs
    generateColorGrid();
}

// Générer la grille de couleurs
function generateColorGrid() {
    const grid = document.getElementById('color-grid');
    grid.innerHTML = '';
    
    // Créer un tableau de toutes les couleurs
    const allColors = Object.keys(colorMap);
    
    // Mélanger les couleurs
    const shuffledColors = shuffleArray([...allColors]);
    
    // S'assurer que la couleur cible est dans la grille
    const targetColorName = gameState.currentColor;
    const targetColorHex = colorMap[targetColorName];
    
    // Remplacer une couleur aléatoire par la couleur cible
    const randomPosition = Math.floor(Math.random() * 9);
    shuffledColors[randomPosition] = targetColorName;
    
    // Créer les carrés
    shuffledColors.slice(0, 9).forEach((colorName, index) => {
        const square = document.createElement('div');
        square.className = 'color-square';
        square.style.backgroundColor = colorMap[colorName];
        square.dataset.color = colorName;
        
        square.addEventListener('click', () => handleColorClick(colorName, square));
        
        grid.appendChild(square);
    });
}

// Jouer un son d'erreur
function playErrorSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Créer un son d'erreur (ton bas et désagréable)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        // Si l'API Web Audio n'est pas disponible, ignorer silencieusement
        console.log('Audio non disponible');
    }
}

// Parler avec la synthèse vocale
function speakText(text, lang = 'fr-FR') {
    if ('speechSynthesis' in window) {
        // Arrêter toute parole en cours
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0; // Vitesse normale
        utterance.pitch = 1.0; // Hauteur normale
        utterance.volume = 1.0; // Volume maximum
        
        // Essayer d'utiliser une voix française
        const voices = window.speechSynthesis.getVoices();
        const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
        if (frenchVoice) {
            utterance.voice = frenchVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    }
}

// Dire "Bravo !"
function sayBravo() {
    speakText('Bravo ! 🎉');
}

// Prononcer le nom d'une couleur
function sayColor(colorName) {
    // Mapper les noms de couleurs pour une meilleure prononciation
    const colorPronunciations = {
        'ROUGE': 'rouge',
        'BLEU': 'bleu',
        'VERT': 'vert',
        'JAUNE': 'jaune',
        'ORANGE': 'orange',
        'VIOLET': 'violet',
        'ROSE': 'rose',
        'CYAN': 'cyan',
        'VERT LIME': 'vert lime'
    };
    
    const pronunciation = colorPronunciations[colorName] || colorName.toLowerCase();
    speakText(pronunciation);
}

// Jouer un son d'acclamation
function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Créer une mélodie joyeuse (do-mi-sol-do)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do (octave supérieure)
        let currentTime = audioContext.currentTime;
        
        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, currentTime);
            
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.15);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.15);
            
            currentTime += 0.1;
        });
    } catch (error) {
        console.log('Audio non disponible');
    }
}

// Gérer le clic sur une couleur
function handleColorClick(clickedColor, squareElement) {
    // Prononcer le nom de la couleur cliquée
    sayColor(clickedColor);
    
    if (clickedColor === gameState.currentColor) {
        // Bonne réponse
        playSuccessSound(); // Jouer le son d'acclamation
        
        // Attendre un peu avant de dire "Bravo !" pour que la couleur soit prononcée
        setTimeout(() => {
            sayBravo(); // Dire "Bravo !" 🎉
        }, 500);
        
        gameState.score++;
        updateScoreDisplay();
        squareElement.style.transform = 'scale(1.1)';
        squareElement.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.8)';
        
        setTimeout(() => {
            showSuccessPopup();
        }, 300);
    } else {
        // Mauvaise réponse
        playErrorSound(); // Jouer le son d'erreur
        squareElement.style.transform = 'scale(0.9)';
        squareElement.style.border = '3px solid #FF0000';
        squareElement.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
        
        setTimeout(() => {
            squareElement.style.transform = '';
            squareElement.style.border = '';
            squareElement.style.boxShadow = '';
            showErrorPopup();
        }, 500);
    }
}

// Mettre à jour l'affichage du score
function updateScoreDisplay() {
    const scoreValue = document.getElementById('score-value');
    const popupScoreValue = document.getElementById('popup-score-value');
    
    if (scoreValue) {
        scoreValue.textContent = gameState.score;
    }
    
    if (popupScoreValue) {
        popupScoreValue.textContent = gameState.score;
    }
}

// Afficher la popup de succès
function showSuccessPopup() {
    const popup = document.getElementById('success-popup');
    const gameScreen = document.getElementById('game-screen');
    updateScoreDisplay();
    popup.classList.remove('hidden');
    
    // Ajouter l'effet de scintillement
    gameScreen.classList.add('sparkle-effect');
    
    // Retirer l'effet après l'animation
    setTimeout(() => {
        gameScreen.classList.remove('sparkle-effect');
    }, 1000);
}

// Cacher la popup
function hidePopup() {
    const popup = document.getElementById('success-popup');
    popup.classList.add('hidden');
}

// Afficher la popup d'erreur
function showErrorPopup() {
    const popup = document.getElementById('error-popup');
    popup.classList.remove('hidden');
}

// Cacher la popup d'erreur
function hideErrorPopup() {
    const popup = document.getElementById('error-popup');
    popup.classList.add('hidden');
}

// Mélanger un tableau (algorithme Fisher-Yates)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

