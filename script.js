// Global variables
let currentView = 'form';
let isAdminLoggedIn = false;
let suggestions = [];

// DOM elements
const homeBtn = document.getElementById('homeBtn');
const viewSuggestionsBtn = document.getElementById('viewSuggestionsBtn');
const adminBtn = document.getElementById('adminBtn');
const suggestionForm = document.getElementById('suggestionForm');
const suggestionsList = document.getElementById('suggestionsList');
const adminPanel = document.getElementById('adminPanel');
const suggestionFormElement = document.getElementById('suggestionFormElement');
const suggestionsContainer = document.getElementById('suggestionsContainer');
const categoryFilter = document.getElementById('categoryFilter');
const refreshBtn = document.getElementById('refreshBtn');
const adminPassword = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminContent = document.getElementById('adminContent');
const adminSuggestionsList = document.getElementById('adminSuggestionsList');
const charCount = document.getElementById('charCount');
const suggestionText = document.getElementById('suggestionText');
const totalSuggestions = document.getElementById('totalSuggestions');
const weeklySuggestions = document.getElementById('weeklySuggestions');
const sendWeeklyReportBtn = document.getElementById('sendWeeklyReportBtn');
const exportSuggestionsBtn = document.getElementById('exportSuggestionsBtn');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadSuggestions();
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation
    homeBtn.addEventListener('click', () => showView('form'));
    viewSuggestionsBtn.addEventListener('click', () => showView('suggestions'));
    adminBtn.addEventListener('click', () => showView('admin'));
    
    // Form submission
    suggestionFormElement.addEventListener('submit', handleFormSubmission);
    
    // Character count
    suggestionText.addEventListener('input', updateCharCount);
    
    // Filter and refresh
    categoryFilter.addEventListener('change', filterSuggestions);
    refreshBtn.addEventListener('click', loadSuggestions);
    
    // Admin
    adminLoginBtn.addEventListener('click', handleAdminLogin);
    sendWeeklyReportBtn.addEventListener('click', sendWeeklyReport);
    exportSuggestionsBtn.addEventListener('click', exportSuggestions);
}

// Navigation functions
function showView(view) {
    // Hide all sections
    suggestionForm.style.display = 'none';
    suggestionsList.style.display = 'none';
    adminPanel.style.display = 'none';
    
    // Show selected section
    switch(view) {
        case 'form':
            suggestionForm.style.display = 'block';
            currentView = 'form';
            homeBtn.style.display = 'none';
            break;
        case 'suggestions':
            suggestionsList.style.display = 'block';
            currentView = 'suggestions';
            homeBtn.style.display = 'inline-block';
            loadSuggestions();
            break;
        case 'admin':
            adminPanel.style.display = 'block';
            currentView = 'admin';
            homeBtn.style.display = 'inline-block';
            if (!isAdminLoggedIn) {
                adminContent.style.display = 'none';
            } else {
                loadAdminData();
            }
            break;
    }
    
    // Update button states
    updateNavButtons();
}

function updateNavButtons() {
    // Reset all buttons
    viewSuggestionsBtn.classList.remove('active');
    adminBtn.classList.remove('active');
    
    // Add active class to current view button
    if (currentView === 'suggestions') {
        viewSuggestionsBtn.classList.add('active');
    } else if (currentView === 'admin') {
        adminBtn.classList.add('active');
    }
}

// Form handling
function handleFormSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(suggestionFormElement);
    const suggestion = {
        text: formData.get('suggestion'),
        category: formData.get('category') || 'other',
        timestamp: new Date().toISOString()
    };
    
    // Validate suggestion
    if (!suggestion.text.trim()) {
        showMessage('Please enter a suggestion.', 'error');
        return;
    }
    
    if (suggestion.text.length > 1000) {
        showMessage('Suggestion is too long. Please keep it under 1000 characters.', 'error');
        return;
    }
    
    // Submit suggestion
    submitSuggestion(suggestion);
}

function submitSuggestion(suggestion) {
    fetch('/api/suggestions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(suggestion)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Thank you for your suggestion! It has been submitted anonymously.', 'success');
            suggestionFormElement.reset();
            updateCharCount();
            loadSuggestions(); // Refresh the list
        } else {
            showMessage('Error submitting suggestion. Please try again.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Error submitting suggestion. Please try again.', 'error');
    });
}

function updateCharCount() {
    const count = suggestionText.value.length;
    charCount.textContent = count;
    
    if (count > 900) {
        charCount.style.color = '#e74c3c';
    } else if (count > 700) {
        charCount.style.color = '#f39c12';
    } else {
        charCount.style.color = '#7f8c8d';
    }
}

// Suggestions loading and display
function loadSuggestions() {
    fetch('/api/suggestions')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                suggestions = data.suggestions;
                displaySuggestions(suggestions);
            } else {
                showMessage('Error loading suggestions.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error loading suggestions.', 'error');
        });
}

function displaySuggestions(suggestionsToShow) {
    suggestionsContainer.innerHTML = '';
    
    if (suggestionsToShow.length === 0) {
        suggestionsContainer.innerHTML = '<p class="no-suggestions">No suggestions yet. Be the first to share your ideas!</p>';
        return;
    }
    
    suggestionsToShow.forEach(suggestion => {
        const suggestionCard = createSuggestionCard(suggestion);
        suggestionsContainer.appendChild(suggestionCard);
    });
}

function createSuggestionCard(suggestion) {
    const card = document.createElement('div');
    card.className = `suggestion-card ${suggestion.category}`;
    
    const date = new Date(suggestion.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    card.innerHTML = `
        <div class="suggestion-text">${escapeHtml(suggestion.text)}</div>
        <div class="suggestion-meta">
            <span class="suggestion-category">${suggestion.category.replace('_', ' ')}</span>
            <span class="suggestion-date">${formattedDate}</span>
        </div>
    `;
    
    return card;
}

function filterSuggestions() {
    const selectedCategory = categoryFilter.value;
    
    if (selectedCategory === '') {
        displaySuggestions(suggestions);
    } else {
        const filteredSuggestions = suggestions.filter(s => s.category === selectedCategory);
        displaySuggestions(filteredSuggestions);
    }
}

// Admin functions
function handleAdminLogin() {
    const password = adminPassword.value;
    
    if (!password) {
        showMessage('Please enter admin password.', 'error');
        return;
    }
    
    fetch('/api/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            isAdminLoggedIn = true;
            adminContent.style.display = 'block';
            adminPassword.value = '';
            loadAdminData();
            showMessage('Admin access granted.', 'success');
        } else {
            showMessage('Invalid admin password.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Error logging in.', 'error');
    });
}

function loadAdminData() {
    if (!isAdminLoggedIn) return;
    
    // Load admin suggestions list
    loadAdminSuggestions();
    
    // Update stats
    updateAdminStats();
}

function loadAdminSuggestions() {
    fetch('/api/admin/suggestions')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayAdminSuggestions(data.suggestions);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function displayAdminSuggestions(adminSuggestions) {
    adminSuggestionsList.innerHTML = '';
    
    if (adminSuggestions.length === 0) {
        adminSuggestionsList.innerHTML = '<p class="no-suggestions">No suggestions to display.</p>';
        return;
    }
    
    adminSuggestions.forEach(suggestion => {
        const card = createAdminSuggestionCard(suggestion);
        adminSuggestionsList.appendChild(card);
    });
}

function createAdminSuggestionCard(suggestion) {
    const card = document.createElement('div');
    card.className = 'admin-suggestion-card';
    
    const date = new Date(suggestion.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    card.innerHTML = `
        <div class="admin-suggestion-content">
            <div class="suggestion-text">${escapeHtml(suggestion.text)}</div>
            <div class="suggestion-meta">
                <span class="suggestion-category">${suggestion.category.replace('_', ' ')}</span>
                <span class="suggestion-date">${formattedDate}</span>
            </div>
        </div>
        <div class="admin-suggestion-actions">
            <button class="delete-btn" onclick="deleteSuggestion(${suggestion.id})">Delete</button>
        </div>
    `;
    
    return card;
}

function deleteSuggestion(id) {
    if (!confirm('Are you sure you want to delete this suggestion?')) {
        return;
    }
    
    fetch(`/api/admin/suggestions/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Suggestion deleted successfully.', 'success');
            loadAdminSuggestions();
            loadSuggestions(); // Refresh public view
            updateAdminStats();
        } else {
            showMessage('Error deleting suggestion.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Error deleting suggestion.', 'error');
    });
}

function updateAdminStats() {
    if (!isAdminLoggedIn) return;
    
    fetch('/api/admin/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                totalSuggestions.textContent = data.stats.total;
                weeklySuggestions.textContent = data.stats.weekly;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function sendWeeklyReport() {
    if (!isAdminLoggedIn) return;
    
    if (!confirm('Send weekly report to all crew members?')) {
        return;
    }
    
    fetch('/api/admin/send-weekly-report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Weekly report sent successfully!', 'success');
        } else {
            showMessage('Error sending weekly report.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Error sending weekly report.', 'error');
    });
}

function exportSuggestions() {
    if (!isAdminLoggedIn) return;
    
    fetch('/api/admin/export')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Create and download CSV file
                const csvContent = data.csv;
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mary-jean-ii-suggestions-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                showMessage('Suggestions exported successfully!', 'success');
            } else {
                showMessage('Error exporting suggestions.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error exporting suggestions.', 'error');
        });
}

// Utility functions
function showMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    messageContainer.appendChild(messageDiv);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make deleteSuggestion globally available
window.deleteSuggestion = deleteSuggestion;
