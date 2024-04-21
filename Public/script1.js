// Helper function to switch between the login and signup forms
function switchForm(formId) {
    document.getElementById('login-form').style.display = formId === 'login-form' ? 'block' : 'none';
    document.getElementById('signup-form').style.display = formId === 'signup-form' ? 'block' : 'none';
  }
  
// Function to handle the sign-up process
// Function to handle the sign-up process
function signUp(event) {
  event.preventDefault(); // Prevent the default form submission
  const username = document.querySelector('#signup-form input[type=text]').value;
  const email = document.querySelector('#signup-form input[type=email]').value;
  const password = document.querySelector('#signup-form input[type=password]').value;

  fetch('/signup', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json', // Use 'application/json' content type for POST request
      },
      body: JSON.stringify({ username, email, password }) // Send data as JSON string
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Signup failed');
      }
      return response.text();
  })
  .then(() => {
      // Reload the page after successful sign up
      window.location.reload();
  })
  .catch(error => {
      console.error('Error during signup:', error);
  });
}


  
  // Function to handle the login process
  function login(event) {
    event.preventDefault(); // Prevent the default form submission
    const email = document.querySelector('#login-form input[type=text]').value;
    const password = document.querySelector('#login-form input[type=password]').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login failed');
        }
        return response.json();
    })
    .then(data => {
        window.location.href = data.redirectTo;
    })
    .catch(error => {
        console.error('Error during login:', error);
    });
}

// Attach event listener to the login form submit button
document.getElementById('signup-form').addEventListener('submit', signUp);
document.getElementById('login-form').addEventListener('submit', login);

document.addEventListener('DOMContentLoaded', function() {
    // Find the homeLink element
    const homeLink = document.getElementById('homeLink');

    // Add a click event listener to the homeLink element
    homeLink.addEventListener('click', function() {
        // Navigate to the desired URL when the homeLink is clicked
        window.location.href = '/';
    });
});




function showSection(sectionId) {
    // List of all section IDs
    var sections = ["update-content", "settings", "analytics"];
  
    // Hide all sections
    sections.forEach(function(id) {
      var section = document.getElementById(id);
      if (section) {
        section.style.display = "none";
      }
    });
  
    // Show the requested section
    var selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
      selectedSection.style.display = "block";
    } else {
      console.error('Requested section does not exist in the DOM.');
    }
  }
  
  function updateContent() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const content = document.getElementById('content').value;
    const image = document.getElementById('image').value;
    const articleId = document.getElementById('article-id').value; // Get article ID from input field

    // Create data object to send to server
    const data = {
        title: title,
        author: author,
        content: content,
        image: image,
        articleId: articleId // Include article ID in data object
    };

    // Send POST request to server
    fetch('/update-content', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(message => {
        alert(message); // Show response message from server
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update content');
    });
}

