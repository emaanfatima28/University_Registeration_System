import { showNotification, apiRequest, formatTime, hasTimeConflict } from './main.js';

const courseFilterForm = document.getElementById('course-filter-form');
const courseSearch = document.getElementById('course-search');
const availableCoursesContainer = document.getElementById('available-courses');
const scheduleContainer = document.getElementById('schedule-container');
const scheduleBody = document.getElementById('schedule-body');
const selectedCoursesContainer = document.getElementById('selected-courses');
const registerCoursesBtn = document.getElementById('register-courses');

let allCourses = [];
let filteredCourses = [];
let selectedCourses = [];
let studentData = null;

export function initStudentDashboard() {
  document.addEventListener('student-login', async (e) => {
    studentData = e.detail;
    
    await loadCourses();
    loadRegisteredCourses();
    initializeSchedule();
    initEventListeners();
  });
  
  const userData = localStorage.getItem('userData');
  if (userData && localStorage.getItem('userType') === 'student') {
    studentData = JSON.parse(userData);
    
    loadCourses();
    loadRegisteredCourses();
    initializeSchedule();
    
    initEventListeners();
  }
}

function initEventListeners() {
  courseFilterForm.addEventListener('change', filterCourses);
  
  courseSearch.addEventListener('input', filterCourses);
  
  registerCoursesBtn.addEventListener('click', registerCourses);
}

// Load all available courses
async function loadCourses() {
  try {
    allCourses = await apiRequest('courses');
    filteredCourses = [...allCourses];
    renderCourses();
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Load student's registered courses
async function loadRegisteredCourses() {
  try {
    const registrations = await apiRequest(`students/${studentData._id}/registrations`);
    
    selectedCourses = [];
    
    registrations.forEach(reg => {
      const course = allCourses.find(c => c._id === reg.courseId);
      if (course) {
        selectedCourses.push(course);
      }
    });
    
    renderSelectedCourses();
    updateSchedule();
  } catch (error) {
    console.error('Error loading registrations:', error);
  }
}

// Filter courses based on form inputs
function filterCourses() {
  const department = document.getElementById('department-filter').value;
  const level = document.getElementById('level-filter').value;
  const timeOfDay = document.getElementById('time-filter').value;
  const daysCheckboxes = document.querySelectorAll('input[name="days"]:checked');
  const selectedDays = Array.from(daysCheckboxes).map(cb => cb.value);
  const seatsFilter = document.getElementById('seats-filter').value;
  const searchTerm = courseSearch.value.toLowerCase();
  
  filteredCourses = allCourses.filter(course => {
    if (department && course.department !== department) {
      return false;
    }
    
    if (level && course.level.toString() !== level) {
      return false;
    }
    
    if (timeOfDay) {
      const hasMatchingTime = course.schedule.some(schedule => {
        const startHour = parseInt(schedule.startTime.split(':')[0]);
        
        if (timeOfDay === 'morning' && (startHour >= 8 && startHour < 12)) {
          return true;
        } else if (timeOfDay === 'afternoon' && (startHour >= 12 && startHour < 16)) {
          return true;
        } else if (timeOfDay === 'evening' && (startHour >= 16 && startHour < 20)) {
          return true;
        }
        
        return false;
      });
      
      if (!hasMatchingTime) {
        return false;
      }
    }
    
    if (selectedDays.length > 0) {
      const courseDays = course.schedule.map(s => s.day);
      const hasMatchingDay = selectedDays.some(day => courseDays.includes(day));
      
      if (!hasMatchingDay) {
        return false;
      }
    }
    
    if (seatsFilter === 'available' && course.availableSeats <= 0) {
      return false;
    }
    
    if (searchTerm) {
      const matchesSearch = 
        course.code.toLowerCase().includes(searchTerm) ||
        course.title.toLowerCase().includes(searchTerm) ||
        course.department.toLowerCase().includes(searchTerm);
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    return true;
  });
  
  renderCourses();
}

function renderCourses() {
  availableCoursesContainer.innerHTML = '';
  
  if (filteredCourses.length === 0) {
    availableCoursesContainer.innerHTML = '<p class="text-center">No courses match your filters.</p>';
    return;
  }
  
  filteredCourses.forEach(course => {
    const isSelected = selectedCourses.some(c => c._id === course._id);
    const hasConflict = selectedCourses.some(c => c._id !== course._id && hasTimeConflict(c, course));
    
    const courseElement = document.createElement('div');
    courseElement.className = 'course-item';
    
    let seatStatusClass = 'seats-available';
    if (course.availableSeats <= 0) {
      seatStatusClass = 'seats-full';
    } else if (course.availableSeats <= 5) {
      seatStatusClass = 'seats-limited';
    }
    
    courseElement.innerHTML = `
      <div class="course-header">
        <div>
          <div class="course-title">${course.title}</div>
          <div class="course-code">${course.code}</div>
        </div>
        <div class="course-credits">${course.credits} Credits</div>
      </div>
      <div class="course-details">
        <div class="course-detail">
          <i class="fas fa-building"></i>
          <span>${course.department}</span>
        </div>
        <div class="course-detail">
          <i class="fas fa-layer-group"></i>
          <span>Level ${course.level}</span>
        </div>
        <div class="course-detail">
          <i class="fas fa-clock"></i>
          <span>${formatSchedule(course.schedule)}</span>
        </div>
      </div>
      ${course.prerequisites && course.prerequisites.length > 0 ? `
        <div class="course-prerequisites">
          <small>Prerequisites: ${course.prerequisites.map(p => p.code).join(', ')}</small>
        </div>
      ` : ''}
      <div class="course-actions">
        <div class="seats-info ${seatStatusClass}">
          <i class="fas fa-user-graduate"></i>
          <span>${course.availableSeats} seats available</span>
        </div>
        <div>
          ${!isSelected ? `
            <button class="btn btn-sm ${hasConflict ? 'btn-danger' : 'btn-primary'} add-course-btn" data-id="${course._id}" ${hasConflict ? 'disabled' : ''}>
              ${hasConflict ? 'Schedule Conflict' : 'Add Course'}
            </button>
          ` : `
            <button class="btn btn-sm btn-danger remove-course-btn" data-id="${course._id}">
              Remove Course
            </button>
          `}
          <button class="btn btn-sm subscribe-btn" data-id="${course._id}">
            <i class="fas fa-bell"></i> Subscribe
          </button>
        </div>
      </div>
    `;
    
    availableCoursesContainer.appendChild(courseElement);
  });
  
  document.querySelectorAll('.add-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id');
      addCourse(courseId);
    });
  });
  
  document.querySelectorAll('.remove-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id');
      removeCourse(courseId);
    });
  });
  
  document.querySelectorAll('.subscribe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id');
      subscribeToCourse(courseId);
    });
  });
}

function formatSchedule(schedule) {
  return schedule.map(s => {
    const day = s.day.charAt(0).toUpperCase() + s.day.slice(1, 3);
    return `${day} ${formatTime(s.startTime)}-${formatTime(s.endTime)}`;
  }).join(', ');
}

function addCourse(courseId) {
  const course = allCourses.find(c => c._id === courseId);
  
  if (!course) {
    return;
  }
  
  if (selectedCourses.some(c => c._id === courseId)) {
    showNotification('Course is already in your selection', 'warning');
    return;
  }
  
  const hasConflict = selectedCourses.some(c => hasTimeConflict(c, course));
  if (hasConflict) {
    showNotification('This course conflicts with your current schedule', 'error');
    return;
  }
  
  if (course.availableSeats <= 0) {
    showNotification('This course has no available seats', 'error');
    return;
  }
  
  if (course.prerequisites && course.prerequisites.length > 0) {
    showNotification('Please ensure you have completed all prerequisites for this course', 'warning');
  }
  
  selectedCourses.push(course);
  
  renderSelectedCourses();
  renderCourses();
  updateSchedule();
  
  showNotification(`Added ${course.code} to your selection`, 'success');
}

function removeCourse(courseId) {
  selectedCourses = selectedCourses.filter(c => c._id !== courseId);

  renderSelectedCourses();
  renderCourses();
  updateSchedule();
  
  const course = allCourses.find(c => c._id === courseId);
  showNotification(`Removed ${course.code} from your selection`, 'info');
}

function renderSelectedCourses() {
  selectedCoursesContainer.innerHTML = '';
  
  if (selectedCourses.length === 0) {
    selectedCoursesContainer.innerHTML = '<p class="text-center">No courses selected.</p>';
    return;
  }
  
  selectedCourses.forEach(course => {
    const courseElement = document.createElement('div');
    courseElement.className = 'selected-course';
    
    courseElement.innerHTML = `
      <div class="selected-course-info">
        <div class="selected-course-title">${course.code} - ${course.title}</div>
        <div class="selected-course-details">
          ${formatSchedule(course.schedule)} | ${course.credits} Credits
        </div>
      </div>
      <button class="btn btn-sm btn-danger remove-selected-btn" data-id="${course._id}">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    selectedCoursesContainer.appendChild(courseElement);
  });
  
  document.querySelectorAll('.remove-selected-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id');
      removeCourse(courseId);
    });
  });
}

function initializeSchedule() {
  scheduleBody.innerHTML = '';
  
  const timeSlots = [];
  for (let hour = 8; hour < 20; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    timeSlots.push(`${hourStr}:00`);
  }
  
  timeSlots.forEach(time => {
    const row = document.createElement('div');
    
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';
    timeSlot.textContent = formatTime(time);
    row.appendChild(timeSlot);
    
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
      const daySlot = document.createElement('div');
      daySlot.className = 'day-slot';
      daySlot.setAttribute('data-day', day);
      daySlot.setAttribute('data-time', time);
      row.appendChild(daySlot);
    });
    
    scheduleBody.appendChild(row);
  });
}


function updateSchedule() {
 
  document.querySelectorAll('.schedule-item').forEach(item => item.remove());
  
  selectedCourses.forEach(course => {
    course.schedule.forEach(schedule => {
      const { day, startTime, endTime } = schedule;
      
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      const endHour = parseInt(endTime.split(':')[0]);
      const endMinute = parseInt(endTime.split(':')[1]);
      
      const startPosition = (startHour - 8) + (startMinute / 60);
      const duration = (endHour - startHour) + ((endMinute - startMinute) / 60);
      
      const scheduleItem = document.createElement('div');
      scheduleItem.className = 'schedule-item';
      scheduleItem.innerHTML = `${course.code} - ${course.title}`;
      scheduleItem.setAttribute('title', `${course.code} - ${course.title}\n${formatTime(startTime)} - ${formatTime(endTime)}`);
      
      scheduleItem.style.top = `${startPosition * 60}px`;
      scheduleItem.style.height = `${duration * 60}px`;
      
      const daySlots = document.querySelectorAll(`.day-slot[data-day="${day}"]`);
      
      if (daySlots.length > 0) {
        const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(day);
        if (dayIndex >= 0) {
          const targetSlot = daySlots[0].parentElement.children[dayIndex + 1];
          targetSlot.appendChild(scheduleItem);
        }
      }
    });
  });
}

async function registerCourses() {
  if (selectedCourses.length === 0) {
    showNotification('Please select at least one course to register', 'warning');
    return;
  }
  
  try {
    const courseIds = selectedCourses.map(course => course._id);
    await apiRequest(`students/${studentData._id}/register`, 'POST', { courseIds });
    
    showNotification('Courses registered successfully', 'success');
    
    await loadCourses();
  } catch (error) {
    console.error('Error registering courses:', error);
  }
}

function subscribeToCourse(courseId) {
  const course = allCourses.find(c => c._id === courseId);
  
  if (!course) {
    return;
  }
  
  showNotification(`You will be notified when seats become available for ${course.code}`, 'info');
}

