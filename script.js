// Al-Quran Web Application
// Pure JavaScript implementation with complete Quran functionality

class QuranApp {
    constructor() {
        // API Configuration
        this.API_BASE = 'https://api.alquran.cloud/v1';
        
        // Application State
        this.currentSurah = null;
        this.currentAyah = null;
        this.isPlaying = false;
        this.currentAudio = null;
        this.surahs = [];
        this.ayahs = [];
        this.wordByWordData = {};
        
        // User Settings (default values)
        this.settings = {
            theme: 'light',
            reciter: '7', // Mishary Rashid Alafasy
            translation: 'en.sahih', // English - Saheeh International
            tafsir: '169', // Ibn Kathir
            loopMode: 'none', // none, ayah, surah
            autoScroll: true,
            wordByWord: false
        };
        
        // Audio State
        this.audioState = {
            currentIndex: 0,
            isLooping: false,
            continuousPlay: false
        };
        
        // Bookmarks
        this.bookmarks = [];
        
        // DOM Elements
        this.initializeElements();
        
        // Initialize Application
        this.init();
    }
    
    initializeElements() {
        // Main elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.sidebar = document.getElementById('sidebar');
        this.surahList = document.getElementById('surah-list');
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.surahContent = document.getElementById('surah-content');
        this.ayahContainer = document.getElementById('ayah-container');
        
        // Header elements
        this.menuToggle = document.getElementById('menu-toggle');
        this.searchInput = document.getElementById('search-input');
        this.clearSearch = document.getElementById('clear-search');
        this.themeToggle = document.getElementById('theme-toggle');
        this.settingsBtn = document.getElementById('settings-btn');
        this.bookmarksBtn = document.getElementById('bookmarks-btn');
        
        // Surah header elements
        this.surahTitle = document.getElementById('surah-title');
        this.surahMetaInfo = document.getElementById('surah-meta-info');
        this.wordByWordToggle = document.getElementById('word-by-word-toggle');
        this.playSurahBtn = document.getElementById('play-surah');
        
        // Audio player elements
        this.audioPlayer = document.getElementById('audio-player');
        this.audioElement = document.getElementById('audio-element');
        this.playPauseBtn = document.getElementById('play-pause');
        this.prevAyahBtn = document.getElementById('prev-ayah');
        this.nextAyahBtn = document.getElementById('next-ayah');
        this.loopToggleBtn = document.getElementById('loop-toggle');
        this.currentAyahText = document.getElementById('current-ayah-text');
        this.progressFill = document.getElementById('progress-fill');
        this.currentTime = document.getElementById('current-time');
        this.duration = document.getElementById('duration');
        this.reciterSelect = document.getElementById('reciter-select');
        this.closePlayerBtn = document.getElementById('close-player');
        
        // Modal elements
        this.settingsModal = document.getElementById('settings-modal');
        this.bookmarksModal = document.getElementById('bookmarks-modal');
        this.tafsirModal = document.getElementById('tafsir-modal');
        this.translationSelect = document.getElementById('translation-select');
        this.tafsirSelect = document.getElementById('tafsir-select');
        this.loopModeSelect = document.getElementById('loop-mode-select');
        this.autoScrollToggle = document.getElementById('auto-scroll-toggle');
        this.bookmarksList = document.getElementById('bookmarks-list');
        this.noBookmarks = document.getElementById('no-bookmarks');
        this.tafsirContent = document.getElementById('tafsir-content');
        
        // Toast container
        this.toastContainer = document.getElementById('toast-container');
    }
    
    async init() {
        try {
            // Load user settings
            this.loadSettings();
            
            // Apply theme
            this.applyTheme();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load Surahs
            await this.loadSurahs();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('Al-Quran App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to load application. Please refresh the page.', 'error');
            this.hideLoadingScreen();
        }
    }
    
    setupEventListeners() {
        // Mobile menu toggle
        this.menuToggle?.addEventListener('click', () => this.toggleSidebar());
        
        // Search functionality
        this.searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearch?.addEventListener('click', () => this.clearSearchInput());
        
        // Theme toggle
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Modal toggles
        this.settingsBtn?.addEventListener('click', () => this.openModal('settings'));
        this.bookmarksBtn?.addEventListener('click', () => this.openModal('bookmarks'));
        
        // Surah controls
        this.wordByWordToggle?.addEventListener('click', () => this.toggleWordByWord());
        this.playSurahBtn?.addEventListener('click', () => this.playSurah());
        
        // Audio player controls
        this.playPauseBtn?.addEventListener('click', () => this.togglePlayPause());
        this.prevAyahBtn?.addEventListener('click', () => this.playPreviousAyah());
        this.nextAyahBtn?.addEventListener('click', () => this.playNextAyah());
        this.loopToggleBtn?.addEventListener('click', () => this.toggleLoop());
        this.closePlayerBtn?.addEventListener('click', () => this.closeAudioPlayer());
        this.reciterSelect?.addEventListener('change', (e) => this.changeReciter(e.target.value));
        
        // Audio element events
        this.audioElement?.addEventListener('loadstart', () => this.showAudioLoading());
        this.audioElement?.addEventListener('canplay', () => this.hideAudioLoading());
        this.audioElement?.addEventListener('timeupdate', () => this.updateAudioProgress());
        this.audioElement?.addEventListener('ended', () => this.handleAudioEnded());
        this.audioElement?.addEventListener('error', () => this.handleAudioError());
        
        // Settings modal events
        this.translationSelect?.addEventListener('change', (e) => this.changeTranslation(e.target.value));
        this.tafsirSelect?.addEventListener('change', (e) => this.changeTafsir(e.target.value));
        this.loopModeSelect?.addEventListener('change', (e) => this.changeLoopMode(e.target.value));
        this.autoScrollToggle?.addEventListener('change', (e) => this.toggleAutoScroll(e.target.checked));
        
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-btn')) {
                this.closeAllModals();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Progress bar click
        document.querySelector('.progress-bar')?.addEventListener('click', (e) => this.seekAudio(e));
    }
    
    async loadSurahs() {
        try {
            const response = await fetch(`${this.API_BASE}/surah`);
            const data = await response.json();
            
            if (data.data) {
                this.surahs = data.data.map(surah => ({
                    id: surah.number,
                    name_arabic: surah.name,
                    name_simple: surah.englishName,
                    revelation_place: surah.revelationType,
                    verses_count: surah.numberOfAyahs
                }));
                this.renderSurahList();
            } else {
                throw new Error('Failed to load surahs');
            }
        } catch (error) {
            console.error('Error loading surahs:', error);
            this.showToast('Failed to load Surahs. Please check your connection.', 'error');
        }
    }
    
    renderSurahList() {
        if (!this.surahList) return;
        
        this.surahList.innerHTML = this.surahs.map(surah => `
            <div class="surah-item" data-surah-id="${surah.id}" onclick="app.selectSurah(${surah.id})">
                <div class="surah-number">${surah.id}</div>
                <div class="surah-info">
                    <div class="surah-name-arabic">${surah.name_arabic}</div>
                    <div class="surah-name-english">${surah.name_simple}</div>
                    <div class="surah-meta">${surah.revelation_place} • ${surah.verses_count} Ayahs</div>
                </div>
            </div>
        `).join('');
    }
    
    async selectSurah(surahId) {
        try {
            this.showLoadingInContent();
            
            // Update active surah in sidebar
            document.querySelectorAll('.surah-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-surah-id="${surahId}"]`)?.classList.add('active');
            
            // Load surah data
            const surah = this.surahs.find(s => s.id === surahId);
            if (!surah) throw new Error('Surah not found');
            
            this.currentSurah = surah;
            
            // Load ayahs
            await this.loadAyahs(surahId);
            
            // Update UI
            this.updateSurahHeader(surah);
            this.renderAyahs();
            this.showSurahContent();
            
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                this.toggleSidebar();
            }
            
            // Scroll to top
            this.scrollToTop();
            
        } catch (error) {
            console.error('Error selecting surah:', error);
            this.showToast('Failed to load Surah. Please try again.', 'error');
        }
    }
    
    async loadAyahs(surahId) {
        try {
            // Load Arabic text
            const arabicResponse = await fetch(`${this.API_BASE}/surah/${surahId}`);
            const arabicData = await arabicResponse.json();
            
            // Load translation if needed
            let translationData = null;
            if (this.settings.translation !== 'none') {
                const translationResponse = await fetch(`${this.API_BASE}/surah/${surahId}/${this.settings.translation}`);
                translationData = await translationResponse.json();
            }
            
            if (!arabicData.data || !arabicData.data.ayahs) {
                throw new Error('Invalid response format');
            }
            
            // Combine data
            this.ayahs = arabicData.data.ayahs.map((verse, index) => ({
                id: verse.number,
                verse_number: verse.numberInSurah,
                verse_key: `${surahId}:${verse.numberInSurah}`,
                text_uthmani: verse.text,
                translation: translationData && translationData.data && translationData.data.ayahs[index] 
                    ? translationData.data.ayahs[index].text : null,
                words: [] // Word by word will be loaded separately if needed
            }));
            
        } catch (error) {
            console.error('Error loading ayahs:', error);
            throw error;
        }
    }
    
    updateSurahHeader(surah) {
        if (this.surahTitle) {
            this.surahTitle.textContent = `${surah.name_simple} (${surah.name_arabic})`;
        }
        if (this.surahMetaInfo) {
            this.surahMetaInfo.textContent = `${surah.revelation_place} • ${surah.verses_count} Ayahs`;
        }
    }
    
    renderAyahs() {
        if (!this.ayahContainer) return;
        
        this.ayahContainer.innerHTML = this.ayahs.map(ayah => `
            <div class="ayah" data-ayah-id="${ayah.id}" data-verse-number="${ayah.verse_number}">
                <div class="ayah-header">
                    <div class="ayah-number">Ayah ${ayah.verse_number}</div>
                    <div class="ayah-actions">
                        <button class="ayah-btn" onclick="app.playAyah(${ayah.verse_number})" title="Play this ayah">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="ayah-btn" onclick="app.playFromAyah(${ayah.verse_number})" title="Play from this ayah">
                            <i class="fas fa-play-circle"></i>
                        </button>
                        <button class="ayah-btn" onclick="app.showTafsir('${ayah.verse_key}')" title="Show tafsir">
                            <i class="fas fa-comment-alt"></i>
                        </button>
                        <button class="ayah-btn ${this.isBookmarked(ayah.verse_key) ? 'bookmarked' : ''}" 
                                onclick="app.toggleBookmark('${ayah.verse_key}')" title="Bookmark this ayah">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
                
                <div class="ayah-text-arabic">${ayah.text_uthmani}</div>
                
                ${ayah.translation ? `<div class="ayah-translation ${this.settings.translation.startsWith('ur.') ? 'urdu' : ''}">${ayah.translation}</div>` : ''}
                
                <div class="word-by-word ${this.settings.wordByWord ? 'visible' : ''}">
                    <div class="word-container">
                        ${this.renderWordByWord(ayah.words)}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderWordByWord(words) {
        return words.map(word => `
            <div class="word-item">
                <div class="word-arabic">${word.text_uthmani}</div>
                <div class="word-translation">${word.translation?.text || ''}</div>
            </div>
        `).join('');
    }
    
    async playAyah(verseNumber) {
        try {
            const ayah = this.ayahs.find(a => a.verse_number === verseNumber);
            if (!ayah) return;
            
            this.audioState.currentIndex = verseNumber - 1;
            this.audioState.continuousPlay = false;
            
            await this.loadAndPlayAudio(ayah);
            this.showAudioPlayer();
            
        } catch (error) {
            console.error('Error playing ayah:', error);
            this.showToast('Failed to play ayah. Please try again.', 'error');
        }
    }
    
    async playFromAyah(verseNumber) {
        try {
            const ayah = this.ayahs.find(a => a.verse_number === verseNumber);
            if (!ayah) return;
            
            this.audioState.currentIndex = verseNumber - 1;
            this.audioState.continuousPlay = true;
            
            await this.loadAndPlayAudio(ayah);
            this.showAudioPlayer();
            
        } catch (error) {
            console.error('Error playing from ayah:', error);
            this.showToast('Failed to play ayah. Please try again.', 'error');
        }
    }
    
    async playSurah() {
        if (this.ayahs.length === 0) return;
        
        this.audioState.currentIndex = 0;
        this.audioState.continuousPlay = true;
        
        await this.loadAndPlayAudio(this.ayahs[0]);
        this.showAudioPlayer();
    }
    
    async loadAndPlayAudio(ayah) {
        try {
            // Show loading
            this.showAudioLoading();
            
            // Get audio URL
            const audioUrl = await this.getAudioUrl(ayah.verse_key);
            
            // Load audio
            this.audioElement.src = audioUrl;
            this.currentAyah = ayah;
            
            // Update UI
            this.updateCurrentAyahDisplay();
            this.highlightCurrentAyah();
            
            // Play audio
            await this.audioElement.play();
            this.isPlaying = true;
            this.updatePlayPauseButton();
            
            // Auto scroll to current ayah
            if (this.settings.autoScroll) {
                this.scrollToAyah(ayah.verse_number);
            }
            
        } catch (error) {
            console.error('Error loading audio:', error);
            this.showToast('Failed to load audio. Please try again.', 'error');
            this.hideAudioLoading();
        }
    }
    
    async getAudioUrl(verseKey) {
        try {
            // Extract surah and ayah from verse_key (format: "1:1")
            const [surahNum, ayahNum] = verseKey.split(':');
            
            // Use GitHub-hosted Quran audio service
            // Format: /<reciterNo>/<surahNo>_<ayahNo>.mp3
            const reciterMap = {
                '7': '2', // Mishary Rashid Alafasy
                '1': '1', // Abdul Basit
                '2': '3', // Saad Al-Ghamdi
                '4': '4', // Maher Al-Muaiqly
                '6': '5'  // Yasser Al-Dosari
            };
            
            const reciterNo = reciterMap[this.settings.reciter] || '2';
            
            // Construct audio URL using the provided format
            const audioUrl = `https://the-quran-project.github.io/Quran-Audio/Data/${reciterNo}/${surahNum}_${ayahNum}.mp3`;
            
            return audioUrl;
            
        } catch (error) {
            console.error('Error getting audio URL:', error);
            throw error;
        }
    }
    
    togglePlayPause() {
        if (!this.audioElement.src) return;
        
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
        } else {
            this.audioElement.play();
            this.isPlaying = true;
        }
        
        this.updatePlayPauseButton();
    }
    
    playPreviousAyah() {
        if (this.audioState.currentIndex > 0) {
            this.audioState.currentIndex--;
            const ayah = this.ayahs[this.audioState.currentIndex];
            this.loadAndPlayAudio(ayah);
        }
    }
    
    playNextAyah() {
        if (this.audioState.currentIndex < this.ayahs.length - 1) {
            this.audioState.currentIndex++;
            const ayah = this.ayahs[this.audioState.currentIndex];
            this.loadAndPlayAudio(ayah);
        } else if (this.settings.loopMode === 'surah') {
            this.audioState.currentIndex = 0;
            const ayah = this.ayahs[0];
            this.loadAndPlayAudio(ayah);
        }
    }
    
    handleAudioEnded() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
        
        if (this.settings.loopMode === 'ayah') {
            // Loop current ayah
            this.audioElement.currentTime = 0;
            this.audioElement.play();
            this.isPlaying = true;
            this.updatePlayPauseButton();
        } else if (this.audioState.continuousPlay) {
            // Play next ayah
            setTimeout(() => this.playNextAyah(), 1000);
        }
    }
    
    toggleLoop() {
        const modes = ['none', 'ayah', 'surah'];
        const currentIndex = modes.indexOf(this.settings.loopMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        this.settings.loopMode = modes[nextIndex];
        this.updateLoopButton();
        this.saveSettings();
        
        // Update settings modal
        if (this.loopModeSelect) {
            this.loopModeSelect.value = this.settings.loopMode;
        }
        
        const messages = {
            'none': 'Loop disabled',
            'ayah': 'Loop current ayah',
            'surah': 'Loop entire surah'
        };
        
        this.showToast(messages[this.settings.loopMode]);
    }
    
    updateLoopButton() {
        if (!this.loopToggleBtn) return;
        
        this.loopToggleBtn.classList.toggle('active', this.settings.loopMode !== 'none');
        
        const icon = this.loopToggleBtn.querySelector('i');
        if (icon) {
            icon.className = this.settings.loopMode === 'ayah' ? 'fas fa-redo' : 'fas fa-redo-alt';
        }
    }
    
    updatePlayPauseButton() {
        if (!this.playPauseBtn) return;
        
        const icon = this.playPauseBtn.querySelector('i');
        if (icon) {
            icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }
    
    updateCurrentAyahDisplay() {
        if (!this.currentAyahText || !this.currentAyah) return;
        
        this.currentAyahText.textContent = `${this.currentSurah.name_simple} - Ayah ${this.currentAyah.verse_number}`;
    }
    
    highlightCurrentAyah() {
        // Remove previous highlight
        document.querySelectorAll('.ayah.playing').forEach(el => {
            el.classList.remove('playing');
        });
        
        // Add highlight to current ayah
        if (this.currentAyah) {
            const ayahElement = document.querySelector(`[data-verse-number="${this.currentAyah.verse_number}"]`);
            if (ayahElement) {
                ayahElement.classList.add('playing');
            }
        }
    }
    
    scrollToAyah(verseNumber) {
        const ayahElement = document.querySelector(`[data-verse-number="${verseNumber}"]`);
        if (ayahElement) {
            ayahElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    updateAudioProgress() {
        if (!this.audioElement.duration) return;
        
        const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
        
        if (this.progressFill) {
            this.progressFill.style.width = `${progress}%`;
        }
        
        if (this.currentTime) {
            this.currentTime.textContent = this.formatTime(this.audioElement.currentTime);
        }
        
        if (this.duration) {
            this.duration.textContent = this.formatTime(this.audioElement.duration);
        }
    }
    
    seekAudio(event) {
        if (!this.audioElement.duration) return;
        
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        
        this.audioElement.currentTime = percentage * this.audioElement.duration;
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    showAudioPlayer() {
        if (this.audioPlayer) {
            this.audioPlayer.classList.remove('hidden');
        }
    }
    
    closeAudioPlayer() {
        if (this.audioPlayer) {
            this.audioPlayer.classList.add('hidden');
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
        }
        
        this.isPlaying = false;
        this.currentAyah = null;
        
        // Remove highlight
        document.querySelectorAll('.ayah.playing').forEach(el => {
            el.classList.remove('playing');
        });
    }
    
    changeReciter(reciterId) {
        this.settings.reciter = reciterId;
        this.saveSettings();
        this.showToast('Reciter changed successfully');
    }
    
    showAudioLoading() {
        // You can implement loading indicator here
    }
    
    hideAudioLoading() {
        // You can implement hiding loading indicator here
    }
    
    handleAudioError() {
        this.showToast('Failed to load audio. Please try again.', 'error');
        this.hideAudioLoading();
    }
    
    // Search functionality
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm) {
            this.clearSearch.classList.add('visible');
        } else {
            this.clearSearch.classList.remove('visible');
        }
        
        const surahItems = document.querySelectorAll('.surah-item');
        
        surahItems.forEach(item => {
            const arabicName = item.querySelector('.surah-name-arabic').textContent.toLowerCase();
            const englishName = item.querySelector('.surah-name-english').textContent.toLowerCase();
            const surahNumber = item.dataset.surahId;
            
            const matches = arabicName.includes(searchTerm) || 
                          englishName.includes(searchTerm) || 
                          surahNumber === searchTerm;
            
            item.style.display = matches ? 'flex' : 'none';
        });
    }
    
    clearSearchInput() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.clearSearch.classList.remove('visible');
            this.handleSearch('');
        }
    }
    
    // Word by word functionality
    toggleWordByWord() {
        this.settings.wordByWord = !this.settings.wordByWord;
        this.saveSettings();
        
        // Update button state
        this.wordByWordToggle?.classList.toggle('active', this.settings.wordByWord);
        
        // Update all word-by-word displays
        document.querySelectorAll('.word-by-word').forEach(element => {
            element.classList.toggle('visible', this.settings.wordByWord);
        });
        
        const message = this.settings.wordByWord ? 'Word by word enabled' : 'Word by word disabled';
        this.showToast(message);
    }
    
    // Tafsir functionality
    async showTafsir(verseKey) {
        try {
            this.showModalLoading('tafsir');
            
            // Load tafsir from AlQuran.cloud API
            const [surahNum, ayahNum] = verseKey.split(':');
            const response = await fetch(`${this.API_BASE}/ayah/${surahNum}:${ayahNum}/editions/quran-simple,en.jalalayn`);
            const data = await response.json();
            
            if (data.data && data.data.length >= 2) {
                const tafsir = {
                    text: data.data[1].text || 'Tafsir not available for this verse.'
                };
                this.displayTafsir(tafsir, verseKey);
            } else {
                // Fallback if tafsir API doesn't work
                const tafsir = {
                    text: `This is verse ${ayahNum} from Surah ${this.currentSurah ? this.currentSurah.name_simple : surahNum}. For detailed tafsir commentary, please consult authentic Islamic sources and scholars.`
                };
                this.displayTafsir(tafsir, verseKey);
            }
            
        } catch (error) {
            console.error('Error loading tafsir:', error);
            // Show fallback content instead of error
            const [surahNum, ayahNum] = verseKey.split(':');
            const tafsir = {
                text: `This is verse ${ayahNum} from Surah ${this.currentSurah ? this.currentSurah.name_simple : surahNum}. For detailed tafsir commentary, please consult authentic Islamic sources and scholars.`
            };
            this.displayTafsir(tafsir, verseKey);
        }
    }
    
    displayTafsir(tafsir, verseKey) {
        if (!this.tafsirContent) return;
        
        const [surahNum, ayahNum] = verseKey.split(':');
        const surahName = this.currentSurah ? this.currentSurah.name_simple : `Surah ${surahNum}`;
        
        this.tafsirContent.innerHTML = `
            <h4>${surahName} - Ayah ${ayahNum}</h4>
            <div class="tafsir-text">${tafsir.text}</div>
        `;
        
        this.openModal('tafsir');
    }
    
    // Bookmark functionality
    toggleBookmark(verseKey) {
        const isBookmarked = this.isBookmarked(verseKey);
        
        if (isBookmarked) {
            this.removeBookmark(verseKey);
            this.showToast('Bookmark removed');
        } else {
            this.addBookmark(verseKey);
            this.showToast('Bookmark added');
        }
        
        // Update bookmark button
        const button = document.querySelector(`[onclick="app.toggleBookmark('${verseKey}')"]`);
        if (button) {
            button.classList.toggle('bookmarked', !isBookmarked);
        }
    }
    
    addBookmark(verseKey) {
        const ayah = this.ayahs.find(a => a.verse_key === verseKey);
        if (!ayah) return;
        
        const bookmark = {
            verse_key: verseKey,
            surah_name: this.currentSurah.name_simple,
            surah_arabic: this.currentSurah.name_arabic,
            verse_number: ayah.verse_number,
            text: ayah.text_uthmani,
            translation: ayah.translation,
            timestamp: Date.now()
        };
        
        this.bookmarks.push(bookmark);
        this.saveBookmarks();
    }
    
    removeBookmark(verseKey) {
        this.bookmarks = this.bookmarks.filter(b => b.verse_key !== verseKey);
        this.saveBookmarks();
    }
    
    isBookmarked(verseKey) {
        return this.bookmarks.some(b => b.verse_key === verseKey);
    }
    
    renderBookmarksModal() {
        if (!this.bookmarksList) return;
        
        if (this.bookmarks.length === 0) {
            this.bookmarksList.innerHTML = '';
            this.noBookmarks?.classList.remove('hidden');
            return;
        }
        
        this.noBookmarks?.classList.add('hidden');
        
        this.bookmarksList.innerHTML = this.bookmarks.map(bookmark => `
            <div class="bookmark-item" onclick="app.goToBookmark('${bookmark.verse_key}')">
                <div class="bookmark-ayah">${bookmark.text}</div>
                <div class="bookmark-info">
                    <span>${bookmark.surah_name} - Ayah ${bookmark.verse_number}</span>
                    <button class="bookmark-delete" onclick="event.stopPropagation(); app.removeBookmarkFromModal('${bookmark.verse_key}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async goToBookmark(verseKey) {
        const [surahId] = verseKey.split(':');
        
        // Close bookmarks modal
        this.closeAllModals();
        
        // Select the surah
        await this.selectSurah(parseInt(surahId));
        
        // Scroll to the specific ayah
        setTimeout(() => {
            const ayahElement = document.querySelector(`[data-verse-key="${verseKey}"]`);
            if (ayahElement) {
                ayahElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // Highlight briefly
                ayahElement.style.background = 'hsl(var(--primary) / 0.1)';
                setTimeout(() => {
                    ayahElement.style.background = '';
                }, 2000);
            }
        }, 500);
    }
    
    removeBookmarkFromModal(verseKey) {
        this.removeBookmark(verseKey);
        this.renderBookmarksModal();
        this.showToast('Bookmark removed');
        
        // Update UI if currently viewing this surah
        const button = document.querySelector(`[onclick="app.toggleBookmark('${verseKey}')"]`);
        if (button) {
            button.classList.remove('bookmarked');
        }
    }
    
    // Theme functionality
    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveSettings();
        
        const message = this.settings.theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
        this.showToast(message);
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Update theme toggle icon
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.settings.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
    
    // Modal functionality
    openModal(type) {
        this.closeAllModals();
        
        const modal = document.getElementById(`${type}-modal`);
        if (!modal) return;
        
        // Populate modal content based on type
        if (type === 'bookmarks') {
            this.renderBookmarksModal();
        } else if (type === 'settings') {
            this.populateSettingsModal();
        }
        
        modal.classList.remove('hidden');
        
        // Focus management
        const firstFocusable = modal.querySelector('button, input, select');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
    
    populateSettingsModal() {
        if (this.translationSelect) {
            this.translationSelect.value = this.settings.translation;
        }
        if (this.tafsirSelect) {
            this.tafsirSelect.value = this.settings.tafsir;
        }
        if (this.loopModeSelect) {
            this.loopModeSelect.value = this.settings.loopMode;
        }
        if (this.autoScrollToggle) {
            this.autoScrollToggle.checked = this.settings.autoScroll;
        }
        if (this.reciterSelect) {
            this.reciterSelect.value = this.settings.reciter;
        }
    }
    
    showModalLoading(modalType) {
        const modal = document.getElementById(`${modalType}-modal`);
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '<div class="loading-spinner"></div><p>Loading...</p>';
            }
        }
        this.openModal(modalType);
    }
    
    // Settings functionality
    changeTranslation(translationId) {
        this.settings.translation = translationId;
        this.saveSettings();
        
        // Reload current surah if one is selected
        if (this.currentSurah) {
            this.loadAyahs(this.currentSurah.id).then(() => {
                this.renderAyahs();
            });
        }
        
        this.showToast('Translation updated');
    }
    
    changeTafsir(tafsirId) {
        this.settings.tafsir = tafsirId;
        this.saveSettings();
        this.showToast('Tafsir source updated');
    }
    
    changeLoopMode(loopMode) {
        this.settings.loopMode = loopMode;
        this.updateLoopButton();
        this.saveSettings();
        
        const messages = {
            'none': 'Loop disabled',
            'ayah': 'Loop current ayah enabled',
            'surah': 'Loop entire surah enabled'
        };
        
        this.showToast(messages[loopMode]);
    }
    
    toggleAutoScroll(enabled) {
        this.settings.autoScroll = enabled;
        this.saveSettings();
        
        const message = enabled ? 'Auto scroll enabled' : 'Auto scroll disabled';
        this.showToast(message);
    }
    
    // Mobile functionality
    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.sidebar?.classList.toggle('visible');
        } else {
            this.sidebar?.classList.toggle('hidden');
        }
    }
    
    // Keyboard navigation
    handleKeyboard(event) {
        // Escape key closes modals
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
        
        // Space bar toggles play/pause
        if (event.key === ' ' && !event.target.matches('input, textarea')) {
            event.preventDefault();
            this.togglePlayPause();
        }
        
        // Arrow keys for navigation
        if (event.key === 'ArrowLeft' && event.ctrlKey) {
            event.preventDefault();
            this.playPreviousAyah();
        }
        
        if (event.key === 'ArrowRight' && event.ctrlKey) {
            event.preventDefault();
            this.playNextAyah();
        }
    }
    
    // Utility functions
    scrollToTop() {
        if (this.surahContent) {
            this.surahContent.scrollTop = 0;
        }
    }
    
    showSurahContent() {
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'none';
        }
        if (this.surahContent) {
            this.surahContent.classList.remove('hidden');
        }
    }
    
    showLoadingInContent() {
        if (this.ayahContainer) {
            this.ayahContainer.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>Loading Surah...</p>
                </div>
            `;
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 300);
        }
    }
    
    // Toast notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <i class="fas ${this.getToastIcon(type)}"></i>
            <span>${message}</span>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener for close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Add to container
        this.toastContainer?.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => this.removeToast(toast), 5000);
    }
    
    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    getToastIcon(type) {
        const icons = {
            'info': 'fa-info-circle',
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-times-circle'
        };
        return icons[type] || icons.info;
    }
    
    // Storage functions
    saveSettings() {
        try {
            localStorage.setItem('quran-app-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('quran-app-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    saveBookmarks() {
        try {
            localStorage.setItem('quran-app-bookmarks', JSON.stringify(this.bookmarks));
        } catch (error) {
            console.error('Failed to save bookmarks:', error);
        }
    }
    
    loadBookmarks() {
        try {
            const saved = localStorage.getItem('quran-app-bookmarks');
            if (saved) {
                this.bookmarks = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
            this.bookmarks = [];
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuranApp();
});

// Service worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Handle online/offline status
window.addEventListener('online', () => {
    if (window.app) {
        window.app.showToast('You are back online', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.app) {
        window.app.showToast('You are currently offline', 'warning');
    }
});

// Prevent right-click context menu on production
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Handle visibility change for audio
document.addEventListener('visibilitychange', () => {
    if (window.app && window.app.audioElement && window.app.isPlaying) {
        if (document.hidden) {
            // Page is hidden, can pause if needed
        } else {
            // Page is visible again
        }
    }
});
