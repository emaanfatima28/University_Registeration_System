import { initAuth } from './auth.js';
import { initStudentDashboard } from './student.js';
import { initAdminDashboard } from './admin.js';

const loginSection = document.getElementById('login-section');
const studentDashboard = document.getElementById('student-dashboard');
const adminDashboard = document.getElementById('admin-dashboard');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  
  initStudentDashboard();
  initAdminDashboard();
  
  initTabs();
  
  checkAuthState();
});

function initTabs() {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Check authentication state
function checkAuthState() {
  const userType = localStorage.getItem('userType');
  const userId = localStorage.getItem('userId');
  
  if (userType && userId) {
    if (userType === 'student') {
      showStudentDashboard();
    } else if (userType === 'admin') {
      showAdminDashboard();
    }
  }
}

// Show student dashboard
export function showStudentDashboard() {
  loginSection.classList.remove('active');
  adminDashboard.classList.remove('active');
  studentDashboard.classList.add('active');
}

// Show admin dashboard
export function showAdminDashboard() {
  loginSection.classList.remove('active');
  studentDashboard.classList.remove('active');
  adminDashboard.classList.add('active');
}

// Show login section
export function showLoginSection() {
  studentDashboard.classList.remove('active');
  adminDashboard.classList.remove('active');
  loginSection.classList.add('active');
}

// Utility function to show notifications
export function showNotification(message, type = 'info') {
  const notificationContainer = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  notificationContainer.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notificationContainer.removeChild(notification);
    }, 300);
  }, 5000);
}

// Utility function to format time (HH:MM)
export function formatTime(timeString) {
  const date = new Date(`2000-01-01T${timeString}`);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Utility function to check for time conflicts
export function hasTimeConflict(course1, course2) {
  const days1 = course1.schedule.map(s => s.day);
  const days2 = course2.schedule.map(s => s.day);
  
  const sharedDays = days1.filter(day => days2.includes(day));
  
  if (sharedDays.length === 0) {
    return false; // No shared days
  }
  
  // Check time conflicts for shared days
  for (const day of sharedDays) {
    const schedule1 = course1.schedule.find(s => s.day === day);
    const schedule2 = course2.schedule.find(s => s.day === day);
    
    const start1 = new Date(`2000-01-01T${schedule1.startTime}`).getTime();
    const end1 = new Date(`2000-01-01T${schedule1.endTime}`).getTime();
    const start2 = new Date(`2000-01-01T${schedule2.startTime}`).getTime();
    const end2 = new Date(`2000-01-01T${schedule2.endTime}`).getTime();
    
    if ((start1 < end2) && (start2 < end1)) {
      return true; // Time conflict found
    }
  }
  
  return false; 
}

export async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`/api/${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    showNotification(error.message, 'error');
    throw error;
  }
}
