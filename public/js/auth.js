import { showStudentDashboard, showAdminDashboard, showLoginSection, showNotification, apiRequest } from './main.js';

const studentLoginForm = document.getElementById('student-login-form');
const adminLoginForm = document.getElementById('admin-login-form');
const studentLogoutBtn = document.getElementById('student-logout');
const adminLogoutBtn = document.getElementById('admin-logout');
const studentNameElement = document.getElementById('student-name');
const adminNameElement = document.getElementById('admin-name');

export function initAuth() {
  // Student login form submission
  studentLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rollNumber = document.getElementById('student-roll').value.trim();
    
    if (!rollNumber) {
      showNotification('Please enter your roll number', 'error');
      return;
    }
    
    try {
      const data = await apiRequest('auth/student-login', 'POST', { rollNumber });
      
      localStorage.setItem('userType', 'student');
      localStorage.setItem('userId', data.student._id);
      localStorage.setItem('userData', JSON.stringify(data.student));
      
      studentNameElement.textContent = data.student.name;
      showStudentDashboard();
      showNotification('Login successful', 'success');
      
      studentLoginForm.reset();
      document.dispatchEvent(new CustomEvent('student-login', { detail: data.student }));
    } catch (error) {
      console.error('Student login error:', error);
    }
  });
  
  // Admin login form submission
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    
    if (!username || !password) {
      showNotification('Please enter both username and password', 'error');
      return;
    }
    
    try {
      const data = await apiRequest('auth/admin-login', 'POST', { username, password });
      
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('userId', data.admin._id);
      localStorage.setItem('userData', JSON.stringify(data.admin));
      
      adminNameElement.textContent = data.admin.name;
      showAdminDashboard();
      showNotification('Login successful', 'success');
      
      adminLoginForm.reset();
      
      document.dispatchEvent(new CustomEvent('admin-login', { detail: data.admin }));
    } catch (error) {
      console.error('Admin login error:', error);
    }
  });
  
  studentLogoutBtn.addEventListener('click', () => {
    logout();
  });
  
  adminLogoutBtn.addEventListener('click', () => {
    logout();
  });
}

function logout() {
  localStorage.removeItem('userType');
  localStorage.removeItem('userId');
  localStorage.removeItem('userData');
  
  showLoginSection();
  showNotification('Logged out successfully', 'info');
}
