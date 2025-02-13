let statusStudent = 'Save';
let copy_std = [];
let validation = [];
let files_val = {
  Picture:'',
  'Birth Certificate':'',
  'Medical Report':''
}
const defaultImg = 'https://res.cloudinary.com/dz7qsbzlz/image/upload/v1738268783/fjpejzny5bdqszavbbgl.png';

/* Fetch and Load Student List Page */
async function studentList() {
  try {
    const response = await fetch('./Students.html');
    const data = await response.text();
    document.getElementById('pages').innerHTML = new DOMParser().parseFromString(data, 'text/html').body.innerHTML;
    statusStudent = 'Save';

    renderStudentTable();

    Array.from(document.querySelectorAll('th[name]')).forEach(th=>th.addEventListener('click',(e)=>{
      let prop = e.target.getAttribute('name')
      let students
      if(!copy_std.length){
      students = JSON.parse(localStorage.getItem('Students')) || [];
      }else{
        students = copy_std
      }

      if(!e.target.lastElementChild.classList.contains('fa-arrow-up')){
        e.target.lastElementChild.classList.add('fa-arrow-up')
        if(prop == 'Name' || prop == 'ID'){
          students.sort((a, b) => 
              b[prop].trim().toLowerCase().localeCompare(a[prop].trim().toLowerCase())
          );
        }else if(prop == 'Class'){
          students.sort((a, b) => 
              b['Class Section'].trim().toLowerCase().localeCompare(a['Class Section'].trim().toLowerCase())
          );
          students.sort((a, b) => 
              b['Current Grade'] - a['Current Grade']
          );
        }else if( prop =='Registration Date'){
          students.sort((a,b)=> new Date(b['Registration Date']) - new Date(a['Registration Date']))
        }
      }else if(e.target.lastElementChild.classList.contains('fa-arrow-up')){
        e.target.lastElementChild.classList.remove('fa-arrow-up')
        if(prop == 'Name' || prop == 'ID'){
          students.sort((a, b) => 
              a[prop].trim().toLowerCase().localeCompare(b[prop].trim().toLowerCase())
          );
        }else if(prop == 'Class'){
          students.sort((a, b) => 
              a['Class Section'].trim().toLowerCase().localeCompare(b['Class Section'].trim().toLowerCase())
          );
          students.sort((a, b) => 
              a['Current Grade'] - b['Current Grade']
          );
        }else if( prop =='Registration Date'){
          students.sort((a,b)=> new Date(a['Registration Date']) - new Date(b['Registration Date']))
        }
      }

      copy_std = students
      const tbody = document.querySelector('tbody');
      tbody.innerHTML = '';
      tbody.innerHTML = copy_std.map(studentRow).join('');
    }))

    Array.from(document.querySelectorAll('#filtering input')).forEach(input=>{
      input.checked ? input.parentElement.classList.add('select_filter'):input.parentElement.classList.remove('select_filter')
    })

    document.querySelector('input[name="row"]').addEventListener('click',(e)=>{
      document.querySelectorAll('.row-checkbox').forEach(input=>{
        input.checked = e.target.checked
        toggleRowSelection(input)
      })
    })
  } catch (error) {
    console.error('Error loading student list:', error);
  }
}

/* Generate Student Row */
const studentRow = (info) => `
  <tr>
      <td><input type="checkbox" class="row-checkbox" onchange="toggleRowSelection(this)"/></td>
      <td class="d-flex align-items-center">
          <img src="${info.Picture?.url || defaultImg}" alt="student_picture" class="student-picture"/>
          <div class="ms-2 d-flex flex-column justify-content-start align-items-start">
              <h6 class="student-name text-capitalize mb-1">${info.Name}</h6>
              <p class="student-email text-start mb-0" name="student_email">${info.Email}</p>
          </div>
      </td>
      <td><p class="student-id mb-0">${info.ID}</p></td>
      <td><p class="student-class mb-0">${info['Current Grade']}${info['Class Section']}</p></td>
      <td><p class="student-registration-date mb-0">${info['Registration Date']}</p></td>
      <td><p class="student-phone mb-0">${info['Phone Number'] || info['Parent Phone NO.1'] || info['Parent Phone NO.2'] || 'N/A'}</p></td>
      <td><p class="student-address text-capitalize mb-0">${info.Address || 'N/A'}</p></td>
      <td class='text-center'>
          <p class="student-status text-capitalize mb-0 d-inline-block" style='--color:${info['Status In System']=='regular'?'#67c8ec':info['Status In System']=='late'?'#ff414b':info['Status In System']=='graduated'?'#1a4200':'#ffae41'}'>${info['Status In System']}</p>
      </td>
      <td>
          <i class="fa-solid fa-pen-to-square" onclick="editStudent('${info.ID}')"></i>
          <i class="fa-solid fa-trash" onclick="deleteStudent('${info.ID}')"></i>
          <i class="fa-solid fa-ellipsis"></i>
      </td>
  </tr>
`;

/* Render Student List */
function renderStudentTable() {
  files_val = {
    Picture:'',
    'Birth Certificate':'',
    'Medical Report':''
  }
  const students = JSON.parse(localStorage.getItem('Students')) || [];
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = students.length 
    ? students.map(student => studentRow(student)).join('') 
    : `<p class='position-absolute text-center w-100 p-2 mt-4 fw-bolder bottom-6'>There is no student list to view</p>`;
}

/* Fetch and Load Add/Edit Student Page */
async function addStudentPage(id = null) {
  try {
    const response = await fetch('./Add Student.html');
    const data = await response.text();
    document.getElementById('pages').innerHTML = new DOMParser().parseFromString(data, 'text/html').body.innerHTML;

    setupFormListeners();
    
    if (statusStudent === 'Save') {
      generateStudentID();
    } else {
      populateFormData(id);
    }
  } catch (error){
    console.error('Error loading add student page:', error);
  }
}

/* Setup Form Listeners */
function setupFormListeners() {
  document.querySelector('input[name="Name"]').addEventListener('change', (e) => {
    let nameParts = e.target.value.split(' ');
    let id = document.querySelector('input[name="ID"]').value;
    let email = `${nameParts[2] || ''}${nameParts[0]?.slice(0,3) || ''}_${id.replace(/-/g, '')}@gmail.com`;
    document.querySelector('input[name="Email"]').value = email;
  });

  document.querySelector('input[name="Birth Date"]').addEventListener('change', (e) => {
    const gradeIs = (new Date().getFullYear() - new Date(`${e.target.value}`).getFullYear())- 6
    document.querySelector('select[name="Current Grade"]').value = gradeIs;
  });

  document.querySelector('select[name="Relationship"]').addEventListener('change', (e) => {
    if(e.target.value == 'other'){
      document.querySelector('input[name="other_relationship"]').classList.remove('hide')
    }else{
      document.querySelector('input[name="other_relationship"]').value = '';
      document.querySelector('input[name="other_relationship"]').classList.add('hide');
    }
  });

  document.querySelector('select[name="Student Status"]').addEventListener('change', (e) => {
    if(e.target.value == 'Repeating a Year'){
      document.querySelector('select[name="Status In System"]').value = 'late';
      document.querySelector('input[name="reason"]').value = 'Repeating a Year';
      document.querySelector('div[name="reason"]').classList.remove('hide');
    }else{
      document.querySelector('select[name="Status In System"]').value = 'regular'
      document.querySelector('input[name="reason"]').value = '';
      document.querySelector('div[name="reason"]').classList.add('hide');
    }
  });

    document.querySelector('select[name="Status In System"]').addEventListener('change', (e) => {
    if(e.target.value == 'late' || e.target.value == 'withdrawn'){
      document.querySelector('div[name="reason"]').classList.remove('hide');
    }else{
      document.querySelector('input[name="reason"]').value = '';
      document.querySelector('div[name="reason"]').classList.add('hide');
    }
  });

    document.querySelector('select[name="Health Status"]').addEventListener('change', (e) => {
    if(e.target.value == 'other'){
      document.querySelector('input[name="other_health_issue"]').classList.remove('hide')
    }else{
      document.querySelector('input[name="other_health_issue"]').value = '';
      document.querySelector('input[name="other_health_issue"]').classList.add('hide');
    }
  });
}

/* Generate Unique Student ID */
function generateStudentID() {
  const year = new Date().getFullYear();
  const middle = String(new Date().getHours() + new Date().getSeconds() + new Date().getMinutes()).padStart(3, '0');
  const last = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  
  document.querySelector('input[name="ID"]').value = `${year}-${middle}-${last}`;
  document.querySelector('input[name="Registration Date"]').value = new Date().toLocaleDateString();
}

/* Populate Form Data for Editing */
function populateFormData(id) {
  const students = JSON.parse(localStorage.getItem('Students')) || [];
  const student = students.find(s => s.ID === id);
  
  if (!student) return;

  document.querySelectorAll('form input, form select').forEach(input => {
    if (input.type === 'radio') {
      input.checked = student[input.name] === input.value;
    }else if(input.type === 'file'){
      files_val[input.getAttribute('name')] = student[input.getAttribute('name')]
      if(input.getAttribute('name') == 'Picture'){
        files_val[input.getAttribute('name')] && renderPicture();
      }else{
        files_val[input.getAttribute('name')]  && renderfiles(input);
      }
    }
    else {
      if(input.name == 'reason' && student[input.name]){
        document.querySelector('div[name="reason"]').classList.remove('hide');
      }else if(input.name == 'other_health_issue' && student[input.name]){
        document.querySelector('input[name="other_health_issue"]').classList.remove('hide')
      }else if(input.name == 'other_relationship' && student[input.name]){
        document.querySelector('input[name="other_relationship"]').classList.remove('hide')
      }
      input.value = student[input.name] || '';
    }
  });
}
/* Be Medical Report Required */
function beMedicalReportRequired(e){
  if(e.value == 'no health issues'){
    document.querySelector('input[name="Medical Report"]').removeAttribute('required');
  }else{
    document.querySelector('input[name="Medical Report"]').setAttribute('required',true);
  }

  if(e.value != 'other'){
    document.querySelector('input[name="other_health_issue"]').removeAttribute('required');

  }else{
    document.querySelector('input[name="other_health_issue"]').setAttribute('required',true);
  }
}
/* Be Reason Required */ 
function beReasonRequired(e){
  if( e.value != 'late' || e.value !='withdrawn'){
    document.querySelector('input[name="reason"]').removeAttribute('required');
  }else{
    document.querySelector('input[name="reason"]').setAttribute('required',true);
  }
}
/* Be Relationship Required */ 
function beRelationshipRequired(e){
  if(e.value != 'other'){
    document.querySelector('input[name="other_relationship"]').removeAttribute('required');
  }else{
    document.querySelector('input[name="other_relationship"]').setAttribute('required',true);
  }
}

/* Save Student Data */
function saveStudent() {
  validation = [];
  let students = JSON.parse(localStorage.getItem('Students')) || [];
  let formData = collectFormData();

  let form = document.querySelector('form');
  form.classList.add('was-validated');

  let readonlyInputs = document.querySelectorAll("input[readonly]");
  readonlyInputs.forEach(input => input.classList.remove("is-invalid") || input.classList.remove("is-valid"));

  Boolean(formData['Birth Certificate'])?document.querySelector('input[name="Birth Certificate"]').setAttribute('readonly',true) && document.querySelector('input[name="Birth Certificate"]').classList.add("is-valid"):''
  Boolean(formData['Medical_Report'])?document.querySelector('input[name="Medical_Report"]').setAttribute('readonly',true) && document.querySelector('input[name="Medical_Report"]').classList.add("is-valid"):''


  if(form.checkValidity() && validation.every(check=>check)){
    if(statusStudent === 'Save'){
      students.push(formData);
    }else{
      students = students.map(student => student.ID === formData.ID ? formData : student);
    }

    localStorage.setItem('Students', JSON.stringify(students));
    studentList();
  }
}

/* Collect Form Data */
function collectFormData() {
  let formData = {};

  document.querySelectorAll('form input, form select').forEach(input => {
    if (input.type === 'radio' && !input.checked) return;
    if (input.type !== 'file'){
      formData[input.name] = input.value
      if(input.name == 'Birth Date' || input.name == 'Name' || input.name == 'Name' || input.name == 'Parent Name' || input.name == 'Nationality' || input.name == 'Nationality ID' || input.name == 'Address' || input.name == 'Parent Address' || input.name == 'Previous School' || input.name == 'Reason'){
        validation.push(validationOnChange(input));
      }
    };
    if (input.type == 'file'){
      formData[input.name] = files_val[input.name];
      if((!Boolean(formData[input.name]) && input.name == 'Birth Certificate') || ( formData['Health Status'] != 'no health issues' && !Boolean(formData[input.name]) && input.name == 'Medical Report') || (Boolean(formData['other_health_issue']) && !Boolean(formData[input.name]) && input.name == 'Medical Report')){
        input.previousElementSibling.classList.add('is-error')
        validation.push(false)
      }else{
        input.previousElementSibling.classList.remove('is-error')
        validation.push(true)
      }
    }
  });

  return formData;
}

/* Edit Student */
function editStudent(id) {
  statusStudent = 'Edit';
  addStudentPage(id);
}

/* Delete Student */
function deleteStudent(id=document.querySelector('input[name="ID"]').value) {
  let students = JSON.parse(localStorage.getItem('Students')) || [];
  let updatedList = students.filter(student => student.ID !== id);
  
  localStorage.setItem('Students', JSON.stringify(updatedList));
  studentList();
}

/* Cancel Student Form */
function cancelStudent() {
  studentList();
}

/* Toggle Row Selection */
function toggleRowSelection(checkbox) {
  checkbox.closest('tr').classList.toggle('row-highlight');
}

/* Load Student List on Window Load */
window.onload = studentList;

//open file
function openFile(e){
  e.parentElement.parentElement.lastElementChild.click()
}

//get value of file when change
async function getFileVal(e){
  const promise = new Promise((resolve, reject) => {
    const file = e.files[0];
    const render = new FileReader();

    render.onload = (data)=>{
      files_val[e.getAttribute('name')] = {
        url: data.target.result,
        file_name:file.name,
        file_size:file.size
      }
      resolve();
    }
    render.readAsDataURL(file)
  })
 
  promise.then(()=>{
    if(e.getAttribute('name') == 'Picture'){
      renderPicture();
    }else{
      renderfiles(e);
    }
  })
}

//set picture form
function renderPicture(){
    if(Boolean(files_val["Picture"])){
      const image = document.querySelector(`img[name="Picture"]`);
      image.setAttribute('src',files_val.Picture.url);
      image.classList.remove('hide');

      image.previousElementSibling.classList.add('hide');
      image.parentElement.classList.remove('picture_bg')
      document.querySelector('.remove_pic').classList.remove('hide');
    }
}

//set file form
function renderfiles(e){
  let image , block_name;

  if(e.getAttribute('name') == 'Birth Certificate'){
      image = './image/certificate.png';
      block_name = '#Birth_Certificate';
  }else if(e.getAttribute('name') == 'Medical Report'){
      image = './image/Report.png';
      block_name = '#Medical_Report';
  }

  let upload_view = `
      <img src=${image} alt="image_upload" class='me-2' style='width:40px;height:40px' />
      <div class="info col">
          <p class="fw-bolder mb-0">${files_val[e.getAttribute('name')].file_name}</p>
          <p class="mb-0"><span>${(files_val[e.getAttribute('name')].file_size/1024).toFixed(2)}</span> KB</p>
      </div>
      <div class='col-1'>
          <a href='${files_val[e.getAttribute('name')].url}' download="${files_val[e.getAttribute('name')].file_name}" class='me-2'><i class="fa-solid fa-download"></i></a>
          <i class="fa-solid fa-trash" onclick="deleteFiles(this)"></i>
      </div>
  `;
  document.querySelector(block_name).parentElement.classList.remove('is-error')
  document.querySelector(block_name).innerHTML = upload_view;
  document.querySelector(block_name).classList.remove('hide');
  document.querySelector(`button[name='${e.getAttribute('name')}']`).classList.add('hide');
}

//delete file
function deleteFiles(e){
  let name = `${e.parentElement.parentElement.getAttribute('id').split('_').join(' ')}`
  document.querySelector(`input[name="${name}"]`).value = '';
  e.parentElement.parentElement.classList.add('hide')
  document.querySelector(`button[name='${name}']`).classList.remove('hide');

  files_val[name] = ''
}

//delete picture
function deletePicture(e){
  let name = e.getAttribute('name');
  e.classList.add('hide');
  document.querySelector(`img[name="${name}"]`).setAttribute('src','');
  document.querySelector(`img[name="${name}"]`).classList.add('hide');
  document.querySelector(`button[name="${name}"]`).classList.remove('hide');
  console.log( document.querySelector(`img[name="${name}"]`).parentElement)
  document.querySelector(`img[name="${name}"]`).parentElement.classList.add('picture_bg');

  files_val[name] = ''
}

/*******************search***********************/
function searchByNameAndID(e){
  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  let students
  if(!copy_std.length){
   students = JSON.parse(localStorage.getItem('Students')) || [];
  }else{
    students = copy_std
  }

  let updatedList = students.filter(student => student['ID'].includes(e.value) || student['Name'].includes(capitalizeFirstLetter(e.value)));
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = updatedList.map(student=>studentRow(student)).join('')
}
/*******************filter***********************/
window.filtering_fun = function(e){
  let students = JSON.parse(localStorage.getItem('Students')) || [];
  copy_std = students;
  let newList = [];
  let properities;

    let block_id = e.parentElement.parentElement.parentElement.getAttribute('id');
    if(e.checked && e.value == 'All'){
      document.querySelectorAll(`#${block_id} input`).forEach(input=>input.checked = document.querySelector(`#${block_id} input[value="All"]`).checked)
    }else if(!e.checked && e.value != 'All'){
      document.querySelector(`#${block_id} input[value="All"]`).checked = false
    }

  ['Status','Grade','Section'].map(block=>{
    switch(block){
      case 'Status': properities = 'Status In System'
        break;
      case 'Grade': properities = 'Current Grade'
        break;
      case 'Section': properities = 'Class Section'
        break;
    }
    let input_checked = Array.from(document.querySelectorAll(`#${block} input`)).filter(input =>input.checked)
    let isOut = false;
    for(input of input_checked){
      if(input.value !== 'All'){
        newList.push(...copy_std.filter(std=>std[properities] == input.value))
      }else{
        newList.push(...copy_std.filter(std=>std[properities] != input.value));
        isOut = true;
      }

      if(isOut){
        break;
      }
    }
    if(Array.from(document.querySelectorAll(`#${block} input:not(input[value="All"])`)).every(input=>input.checked)){
      document.querySelector(`#${block} input[value="All"]`).checked = true
    }
    Array.from(document.querySelectorAll(`#${block} input`)).forEach(input =>{
      if(input.checked){
        input.parentElement.classList.remove('unselect_filter')
        input.parentElement.classList.add('select_filter')
      }else{
        input.parentElement.classList.remove('select_filter')
        input.parentElement.classList.add('unselect_filter')
      }
    })

    copy_std = newList
    newList = [];
  })


  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';
  tbody.innerHTML = copy_std.map(studentRow).join('');
}
function openFilter(){
  document.querySelector('#filtering').classList.toggle('hide')
}
function clearFilter(){
  Array.from(document.querySelectorAll('#filtering input')).forEach(input=>{
    input.checked = true 
    input.parentElement.classList.remove('unselect_filter')
    input.parentElement.classList.add('select_filter')
  })

  Array.from(document.querySelectorAll('th[name] i')).forEach(i=>i.classList.remove('fa-arrow-up'))
  renderStudentTable();
}
/*************Validation**************/
function validationOnChange(e){
  let input_name = e.getAttribute('name');
  let Reqex = /^$/;
  let isValid = true; 

  if (input_name == 'Birth Date') {
    if(!Boolean(e.value)){
      isValid = false;
    }else{
      const student_age = new Date().getFullYear() - new Date(e.value).getFullYear();
      if (student_age < 6) {
        e.classList.remove('is-valid');
        e.classList.add('is-invalid');
        isValid = false;
      } else {
        e.classList.remove('is-invalid');
        e.classList.add('is-valid');
      }
    }
  } else{
    switch (input_name) {
      case 'Name':
      case 'Parent Name':
        Reqex = /^[a-zA-Z]{3,} [a-zA-z]{3,} ([Aa]{1}[lL]{1}[-]?)?[A-Za-z]{3,}$/;
        break;
      case 'Nationality':
        Reqex = /^[a-zA-Z-]+$/;
        break;
      case 'Nationality ID':
        Reqex = /^[0-9]{10}$/;
        break;
      case 'Address':
        Reqex = /^[0-9a-zA-Z-, ]+$/;
        break;
      case 'Parent Address':
        Reqex = /^[0-9a-zA-Z-, ]*$/;
        break;
      case 'Previous School':
        Reqex = /^[0-9a-zA-Z ]+$/;
        break;
      case 'Reason':
      case'other_relationship':
        Reqex = /^[a-zA-Z ]+$/;
    }

    if (!Reqex.test(e.value)) {
      e.classList.remove('is-valid');
      e.classList.add('is-invalid');
      isValid = false;
    } else {
      e.classList.remove('is-invalid');
      e.classList.add('is-valid');
    }
  }

  return isValid; 
}
