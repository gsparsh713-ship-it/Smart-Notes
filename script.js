// ===== SMART NOTES APP ===== 
// Manages notes with local storage, filtering, and UI interactions

const STORAGE_KEY = 'smartNotesData';
let notes = [];
let currentEditingId = null;
let currentCategory = 'All';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    setupEventListeners();
    renderNotes();
    loadTheme();
});

// ===== LOCAL STORAGE =====
function loadNotes() {
    const stored = localStorage.getItem(STORAGE_KEY);
    notes = stored ? JSON.parse(stored) : [];
}

function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ===== THEME MANAGEMENT =====
function loadTheme() {
    const savedTheme = localStorage.getItem('smartNotesTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon();
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('smartNotesTheme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeBtn = document.getElementById('themeBtn');
    const isDark = document.body.classList.contains('dark-mode');
    themeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Modal controls
    document.querySelector('.btn-new-note').addEventListener('click', openCreateModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('noteModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('noteModal')) closeModal();
    });

    // Form submission
    document.getElementById('noteForm').addEventListener('submit', handleSaveNote);

    // Search
    document.getElementById('searchInput').addEventListener('input', renderNotes);

    // Category filters
    document.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.dataset.category;
            renderNotes();
        });
    });

    // Theme toggle
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
}

// ===== MODAL MANAGEMENT =====
function openCreateModal() {
    currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'Create New Note';
    document.getElementById('noteForm').reset();
    document.getElementById('color2').checked = true;
    document.getElementById('noteModal').classList.add('active');
}

function openEditModal(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    currentEditingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Note';
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteCategory').value = note.category;
    document.getElementById('noteContent').value = note.content;
    document.querySelector(`input[name="color"][value="${note.color}"]`).checked = true;
    document.getElementById('noteModal').classList.add('active');
}

function closeModal() {
    document.getElementById('noteModal').classList.remove('active');
    currentEditingId = null;
}

// ===== NOTE OPERATIONS =====
function handleSaveNote(e) {
    e.preventDefault();

    const title = document.getElementById('noteTitle').value.trim();
    const category = document.getElementById('noteCategory').value;
    const content = document.getElementById('noteContent').value.trim();
    const color = document.querySelector('input[name="color"]:checked').value;

    if (!title || !content) {
        showToast('Please fill in all fields!');
        return;
    }

    if (currentEditingId) {
        // Update existing note
        const note = notes.find(n => n.id === currentEditingId);
        if (note) {
            note.title = title;
            note.category = category;
            note.content = content;
            note.color = color;
            note.updatedAt = new Date().toISOString();
        }
        showToast('Note updated successfully!');
    } else {
        // Create new note
        const newNote = {
            id: Date.now(),
            title,
            category,
            content,
            color,
            pinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        notes.unshift(newNote);
        showToast('Note created successfully!');
    }

    saveNotes();
    closeModal();
    renderNotes();
}

function deleteNote(id) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(n => n.id !== id);
        saveNotes();
        renderNotes();
        showToast('Note deleted!');
    }
}

function togglePin(id) {
    event.stopPropagation();
    const note = notes.find(n => n.id === id);
    if (note) {
        note.pinned = !note.pinned;
        saveNotes();
        renderNotes();
        showToast(note.pinned ? 'Note pinned!' : 'Note unpinned!');
    }
}

// ===== RENDERING =====
function renderNotes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Filter notes
    let filtered = notes.filter(note => {
        const matchCategory = currentCategory === 'All' || note.category === currentCategory;
        const matchSearch = note.title.toLowerCase().includes(searchTerm) ||
                          note.content.toLowerCase().includes(searchTerm);
        return matchCategory && matchSearch;
    });

    // Sort by pinned first, then by date
    filtered.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const notesGrid = document.getElementById('notesGrid');

    if (filtered.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No notes found. Create your first note!</p>
            </div>
        `;
        return;
    }

    notesGrid.innerHTML = filtered.map(note => `
        <div class="note-card" style="background-color: ${note.color};">
            <div class="note-header">
                <span class="category-tag">${note.category}</span>
                <div class="note-actions">
                    <button class="pin-btn ${note.pinned ? 'pinned' : ''}" 
                            onclick="togglePin(${note.id}); event.stopPropagation();" 
                            title="${note.pinned ? 'Unpin' : 'Pin'}">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                    <button onclick="openEditModal(${note.id}); event.stopPropagation();" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteNote(${note.id}); event.stopPropagation();" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <h3>${escapeHtml(note.title)}</h3>
            <p class="note-preview">${escapeHtml(note.content)}</p>
            <div class="note-footer">
                <span class="timestamp">${formatDate(note.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

// ===== UTILITIES =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== SAMPLE DATA (Optional) =====
function addSampleNotes() {
    if (notes.length === 0) {
        notes = [
            {
                id: 1,
                title: 'Welcome to Smart Notes',
                category: 'Personal',
                content: 'This is your first note! You can:\n- Create new notes\n- Edit existing notes\n- Delete notes\n- Pin important notes\n- Filter by category\n- Search notes\n\nAll notes are saved in your browser!',
                color: '#FFF4E5',
                pinned: true,
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                updatedAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 2,
                title: 'Project Ideas',
                category: 'Ideas',
                content: 'Build a smart notes app with:\n✓ Local storage\n✓ Beautiful UI\n✓ Font Awesome icons\n✓ Dark mode\n✓ Responsive design\n✓ Search & filter',
                color: '#E5F4FF',
                pinned: false,
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                updatedAt: new Date(Date.now() - 7200000).toISOString()
            },
            {
                id: 3,
                title: 'Meeting Notes',
                category: 'Work',
                content: 'Team meeting agenda:\n1. Q1 Review\n2. New feature planning\n3. Resource allocation\n4. Timeline discussion',
                color: '#E5FFE5',
                pinned: false,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        saveNotes();
        renderNotes();
    }
}

// Uncomment to load sample notes on first visit:
// addSampleNotes();