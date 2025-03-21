import { showNotification, apiRequest, formatTime } from './main.js';

const coursesTable = document.getElementById('courses-table');
const addCourseBtn = document.getElementById('add-course-btn');
const courseModal = document.getElementById('course-modal');
const courseForm = document.getElementById('course-form');
const courseModalTitle = document.getElementById('course-modal-title');
const closeModalBtns = document.querySelectorAll('.close, .close-modal');
const studentSearch = document.getElementById('student-search');
const searchStudentBtn = document.getElementById('search-student-btn');
const studentDetails = document.getElementById('student-details');
const studentRegistrations = document.getElementById('student-registrations');
const overrideCourse = document.getElementById('override-course');
const addOverrideBtn = document.getElementById('add-override');
const reportCourse = document.getElementById('report-course');
const generateCourseReportBtn = document.getElementById('generate-course-report');
const generateSeatsReportBtn = document.getElementById('generate-seats-report');
const generatePrerequisitesReportBtn = document.getElementById('generate-prerequisites-report');
const reportResults = document.getElementById('report-results');
const adminTabs = document.querySelectorAll('.admin-tabs .tab-btn');
const adminTabContents = document.querySelectorAll('#admin-dashboard .tab-content');

let allCourses = [];
let allStudents = [];
let currentStudentId = null;

export function initAdminDashboard() {
  document.addEventListener('admin-login', async () => {
    await loadCourses();
    await loadStudents();
    
    initEventListeners();
  });
  
  const userData = localStorage.getItem('userData');
  if (userData && localStorage.getItem('userType') === 'admin') {
    loadCourses();
    loadStudents();
    
    initEventListeners();
  }
}

function initEventListeners() {
  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      adminTabs.forEach(t => t.classList.remove('active'));
      adminTabContents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  addCourseBtn.addEventListener('click', () => {
    openCourseModal();
  });
  
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(courseModal);
    });
  });
  
  courseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveCourse();
  });
  
  document.querySelectorAll('input[name="course-days"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const day = this.value;
      const startTimeInput = document.querySelector(`input[name="${day}-start"]`);
      const endTimeInput = document.querySelector(`input[name="${day}-end"]`);
      
      if (this.checked) {
        startTimeInput.disabled = false;
        endTimeInput.disabled = false;
      } else {
        startTimeInput.disabled = true;
        endTimeInput.disabled = true;
      }
    });
  });
  
  document.getElementById('add-prerequisite').addEventListener('click', addPrerequisiteField);
  
  searchStudentBtn.addEventListener('click', searchStudent);
  
  addOverrideBtn.addEventListener('click', addOverrideCourse);
  
  generateCourseReportBtn.addEventListener('click', generateCourseReport);
  generateSeatsReportBtn.addEventListener('click', generateSeatsReport);
  generatePrerequisitesReportBtn.addEventListener('click', generatePrerequisitesReport);
}

async function loadCourses() {
  try {
    allCourses = await apiRequest('courses');
    renderCoursesTable();
    populateCourseDropdowns();
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

async function loadStudents() {
  try {
    allStudents = await apiRequest('students');
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

function renderCoursesTable() {
  const tableBody = coursesTable.querySelector('tbody');
  tableBody.innerHTML = '';
  
  allCourses.forEach(course => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${course.code}</td>
      <td>${course.title}</td>
      <td>${course.department}</td>
      <td>${course.level}</td>
      <td>${formatSchedule(course.schedule)}</td>
      <td>${course.availableSeats} / ${course.totalSeats}</td>
      <td>
        <button class="btn btn-sm edit-course-btn" data-id="${course._id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger delete-course-btn" data-id="${course._id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  document.querySelectorAll('.edit-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id');
      openCourseModal(courseId);
    });
  });
  
  document.querySelectorAll('.delete-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id');
      deleteCourse(courseId);
    });
  });
}

function formatSchedule(schedule) {
  return schedule.map(s => {
    const day = s.day.charAt(0).toUpperCase() + s.day.slice(1, 3);
    return `${day} ${formatTime(s.startTime)}-${formatTime(s.endTime)}`;
  }).join(', ');
}

function populateCourseDropdowns() {
  overrideCourse.innerHTML = '<option value="">Select Course</option>';
  
  reportCourse.innerHTML = '<option value="">Select Course</option>';
  
  allCourses.forEach(course => {
    const option = document.createElement('option');
    option.value = course._id;
    option.textContent = `${course.code} - ${course.title}`;
    
    overrideCourse.appendChild(option.cloneNode(true));
    reportCourse.appendChild(option.cloneNode(true));
  });
}

function openCourseModal(courseId = null) {
  courseForm.reset();
  document.getElementById('prerequisites-container').innerHTML = '';
  
  document.querySelectorAll('.time-inputs input').forEach(input => {
    input.disabled = true;
  });
  
  if (courseId) {
    
    const course = allCourses.find(c => c._id === courseId);
    
    if (!course) {
      return;
    }
    
    courseModalTitle.textContent = 'Edit Course';
    
    document.getElementById('course-id').value = course._id;
    document.getElementById('course-code').value = course.code;
    document.getElementById('course-title').value = course.title;
    document.getElementById('course-department').value = course.department;
    document.getElementById('course-level').value = course.level;
    document.getElementById('course-credits').value = course.credits;
    document.getElementById('course-description').value = course.description;
    document.getElementById('course-seats').value = course.totalSeats;
    
    course.schedule.forEach(schedule => {
      const dayCheckbox = document.querySelector(`input[name="course-days"][value="${schedule.day}"]`);
      if (dayCheckbox) {
        dayCheckbox.checked = true;
        
        const startTimeInput = document.querySelector(`input[name="${schedule.day}-start"]`);
        const endTimeInput = document.querySelector(`input[name="${schedule.day}-end"]`);
        
        startTimeInput.disabled = false;
        startTimeInput.value = schedule.startTime;
        
        endTimeInput.disabled = false;
        endTimeInput.value = schedule.endTime;
      }
    });
    
    if (course.prerequisites && course.prerequisites.length > 0) {
      course.prerequisites.forEach(prerequisite => {
        addPrerequisiteField(prerequisite._id);
      });
    }
  } else {
   
    courseModalTitle.textContent = 'Add New Course';
    document.getElementById('course-id').value = '';
  }
  
  courseModal.style.display = 'block';
}

function closeModal(modal) {
  modal.style.display = 'none';
}

function addPrerequisiteField(selectedId = '') {
  const container = document.getElementById('prerequisites-container');
  
  const field = document.createElement('div');
  field.className = 'prerequisite-field';
  
  const select = document.createElement('select');
  select.className = 'prerequisite-select';
  
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Select Prerequisite';
  select.appendChild(emptyOption);
  
  allCourses.forEach(course => {
    const option = document.createElement('option');
    option.value = course._id;
    option.textContent = `${course.code} - ${course.title}`;
    
    if (course._id === selectedId) {
      option.selected = true;
    }
    
    select.appendChild(option);
  });
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-sm btn-danger remove-prerequisite';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.addEventListener('click', function() {
    container.removeChild(field);
  });
  
  field.appendChild(select);
  field.appendChild(removeBtn);
  
  container.appendChild(field);
}

async function saveCourse() {
  const courseId = document.getElementById('course-id').value;
  const code = document.getElementById('course-code').value;
  const title = document.getElementById('course-title').value;
  const department = document.getElementById('course-department').value;
  const level = document.getElementById('course-level').value;
  const credits = document.getElementById('course-credits').value;
  const description = document.getElementById('course-description').value;
  const totalSeats = document.getElementById('course-seats').value;
  
  const schedule = [];
  document.querySelectorAll('input[name="course-days"]:checked').forEach(checkbox => {
    const day = checkbox.value;
    const startTime = document.querySelector(`input[name="${day}-start"]`).value;
    const endTime = document.querySelector(`input[name="${day}-end"]`).value;
    
    if (startTime && endTime) {
      schedule.push({ day, startTime, endTime });
    }
  });
  
  const prerequisites = [];
  document.querySelectorAll('.prerequisite-select').forEach(select => {
    if (select.value) {
      prerequisites.push(select.value);
    }
  });
  
  const courseData = {
    code,
    title,
    department,
    level,
    credits,
    description,
    totalSeats,
    schedule,
    prerequisites
  };
  
  try {
    if (courseId) {
      await apiRequest(`courses/${courseId}`, 'PUT', courseData);
      showNotification('Course updated successfully', 'success');
    } else {
    
      await apiRequest('courses', 'POST', courseData);
      showNotification('Course created successfully', 'success');
    }
    
    await loadCourses();
    
    closeModal(courseModal);
  } catch (error) {
    console.error('Error saving course:', error);
  }
}

async function deleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course?')) {
    return;
  }
  
  try {
    await apiRequest(`courses/${courseId}`, 'DELETE');
    
    showNotification('Course deleted successfully', 'success');
    
    await loadCourses();
  } catch (error) {
    console.error('Error deleting course:', error);
  }
}

async function searchStudent() {
  const rollNumber = studentSearch.value.trim();
  
  if (!rollNumber) {
    showNotification('Please enter a roll number', 'warning');
    return;
  }
  
  try {
    const student = await apiRequest(`students/roll/${rollNumber}`);
    
    if (!student) {
      showNotification('Student not found', 'error');
      return;
    }
    
    currentStudentId = student._id;
    
    studentDetails.style.display = 'block';
    studentDetails.innerHTML = `
      <div class="student-info">
        <div class="student-info-item">
          <span class="student-info-label">Name</span>
          <span class="student-info-value">${student.name}</span>
        </div>
        <div class="student-info-item">
          <span class="student-info-label">Roll Number</span>
          <span class="student-info-value">${student.rollNumber}</span>
        </div>
        <div class="student-info-item">
          <span class="student-info-label">Department</span>
          <span class="student-info-value">${student.department}</span>
        </div>
        <div class="student-info-item">
          <span class="student-info-label">Semester</span>
          <span class="student-info-value">${student.semester}</span>
        </div>
      </div>
    `;
    
    await loadStudentRegistrations(student._id);
  } catch (error) {
    console.error('Error searching student:', error);
  }
}

async function loadStudentRegistrations(studentId) {
  try {
    const registrations = await apiRequest(`students/${studentId}/registrations`);
    
    const tableBody = studentRegistrations.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (registrations.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No registrations found.</td></tr>';
      return;
    }
    
    registrations.forEach(reg => {
      const course = allCourses.find(c => c._id === reg.courseId);
      
      if (!course) {
        return;
      }
      
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${course.code}</td>
        <td>${course.title}</td>
        <td>${course.department}</td>
        <td>${formatSchedule(course.schedule)}</td>
        <td>
          <button class="btn btn-sm btn-danger drop-registration-btn" data-id="${reg._id}">
            Drop
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    document.querySelectorAll('.drop-registration-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const registrationId = btn.getAttribute('data-id');
        dropRegistration(registrationId);
      });
    });
  } catch (error) {
    console.error('Error loading student registrations:', error);
  }
}

async function dropRegistration(registrationId) {
  if (!confirm('Are you sure you want to drop this course?')) {
    return;
  }
  
  try {
    await apiRequest(`registrations/${registrationId}`, 'DELETE');
    
    showNotification('Registration dropped successfully', 'success');
    
    await loadStudentRegistrations(currentStudentId);
    
    await loadCourses();
  } catch (error) {
    console.error('Error dropping registration:', error);
  }
}

async function addOverrideCourse() {
  if (!currentStudentId) {
    showNotification('Please search for a student first', 'warning');
    return;
  }
  
  const courseId = overrideCourse.value;
  
  if (!courseId) {
    showNotification('Please select a course', 'warning');
    return;
  }
  
  try {
    await apiRequest(`students/${currentStudentId}/override`, 'POST', { courseId });
    
    showNotification('Course added to student successfully', 'success');
    
    await loadStudentRegistrations(currentStudentId);
    
    await loadCourses();
  } catch (error) {
    console.error('Error adding override course:', error);
  }
}

async function generateCourseReport() {
  const courseId = reportCourse.value;
  
  if (!courseId) {
    showNotification('Please select a course', 'warning');
    return;
  }
  
  try {
    const report = await apiRequest(`reports/course-registrations/${courseId}`);
    const course = allCourses.find(c => c._id === courseId);
    
    reportResults.style.display = 'block';
    reportResults.innerHTML = `
      <h4>Students Registered for ${course.code} - ${course.title}</h4>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Name</th>
              <th>Department</th>
              <th>Semester</th>
            </tr>
          </thead>
          <tbody>
            ${report.students.length === 0 ? 
              '<tr><td colspan="4" class="text-center">No students registered for this course.</td></tr>' : 
              report.students.map(student => `
                <tr>
                  <td>${student.rollNumber}</td>
                  <td>${student.name}</td>
                  <td>${student.department}</td>
                  <td>${student.semester}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error generating course report:', error);
  }
}

async function generateSeatsReport() {
  try {
    const report = await apiRequest('reports/available-seats');
    
    reportResults.style.display = 'block';
    reportResults.innerHTML = `
      <h4>Courses with Available Seats</h4>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Title</th>
              <th>Department</th>
              <th>Available Seats</th>
              <th>Total Seats</th>
            </tr>
          </thead>
          <tbody>
            ${report.courses.length === 0 ? 
              '<tr><td colspan="5" class="text-center">No courses found.</td></tr>' : 
              report.courses.map(course => `
                <tr>
                  <td>${course.code}</td>
                  <td>${course.title}</td>
                  <td>${course.department}</td>
                  <td>${course.availableSeats}</td>
                  <td>${course.totalSeats}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error generating seats report:', error);
  }
}

async function generatePrerequisitesReport() {
  try {
    const report = await apiRequest('reports/prerequisites');
    
    reportResults.style.display = 'block';
    reportResults.innerHTML = `
      <h4>Students Missing Prerequisites</h4>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Name</th>
              <th>Course</th>
              <th>Missing Prerequisites</th>
            </tr>
          </thead>
          <tbody>
            ${report.students.length === 0 ? 
              '<tr><td colspan="4" class="text-center">No students missing prerequisites.</td></tr>' : 
              report.students.map(item => `
                <tr>
                  <td>${item.student.rollNumber}</td>
                  <td>${item.student.name}</td>
                  <td>${item.course.code} - ${item.course.title}</td>
                  <td>${item.missingPrerequisites.map(p => p.code).join(', ')}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error generating prerequisites report:', error);
  }
}
