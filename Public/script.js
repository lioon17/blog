function showSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.display = 'flex';
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.display = 'none';

}  
function searchSidebar() {
    // Hide page items
    document.getElementById("pageItems").style.display = "none";

    var searchTerm = document.getElementById("sidebar-search-bar").value;
    fetch(`/search?term=${searchTerm}`)
        .then(response => response.json())
        .then(data => {
            // Clear previous search results
            document.getElementById("blogResults").innerHTML = "";

            // Display new search results
            data.forEach(entry => {
                var resultDiv = document.createElement("div");
                resultDiv.innerHTML = `
                    <h2>${entry.title}</h2>
                    <p>${entry.content}</p>
                    <p><strong>Author:</strong> ${entry.author}</p>
                    <p><strong>Date:</strong> ${entry.date}</p>
                    <p><a href="${entry.link}" target="_blank">Read more</a></p>
                `;
                document.getElementById("blogResults").appendChild(resultDiv);
            });
        })
        .catch(error => console.error('Error:', error));
        var results = document.getElementById('blogResults');
        results.classList.remove('hidden');
}

function searchMain() {
    // Hide page items
    document.getElementById("pageItems").style.display = "none";

    var searchTerm = document.getElementById("main-search-bar").value;
    fetch(`/search?term=${searchTerm}`)
        .then(response => response.json())
        .then(data => {
            // Clear previous search results
            document.getElementById("blogResults").innerHTML = "";

            // Display new search results
            data.forEach(entry => {
                var resultDiv = document.createElement("div");
                resultDiv.className = 'blog-entry';
                resultDiv.innerHTML = `
                  <h2>${entry.title}</h2>
                  <div class="author-date">
                    <span><strong>Author:</strong> ${entry.author}</span>
                    <span><strong>Date:</strong> ${entry.date}</span>
                  </div>
                  <p>${entry.content.split('\n')[0]}</p> <!-- This assumes the first paragraph is separated by a newline -->
                  <p><a href="${entry.link}" target="_blank">Read more</a></p>
                `;
                document.getElementById("blogResults").appendChild(resultDiv);
              });
              
        })
        .catch(error => console.error('Error:', error));
        var results = document.getElementById('blogResults');
        results.classList.remove('hidden');
}



document.addEventListener('DOMContentLoaded', function () {
    // Select all elements with the class 'read-more-btn'
    const readMoreButtons = document.querySelectorAll('.read-more-btn');

    // Iterate over each 'read-more-btn' element
    readMoreButtons.forEach(button => {
        // Add a click event listener to each button
        button.addEventListener('click', function () {
            // Get the post ID associated with this button from the data attribute
            const postId = this.dataset.postId;
            // Redirect to the display-page with the appropriate post ID
            window.location.href = `/display-page/${postId}`;
        });
    });

    const articleLinks = document.querySelectorAll('.article-link');

    articleLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();       
            const postId = this.getAttribute('href').split('=')[1];
            window.location.href = `/display-page/${postId}`;
        });
    });
});




function downloadDocument() {
    const articleContent = document.querySelector('.first-container').innerText;
    const blob = new Blob([articleContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadPDF() {
    const element = document.querySelector('.first-container');
    html2pdf()
        .from(element)
        .save();
}

function shareArticle() {
    // Check if the Web Share API is supported
    if (navigator.share) {
        navigator.share({
            title: 'Title of the Article',
            text: 'Short description of the article',
            url: window.location.href
        })
        .then(() => console.log('Shared successfully'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
        // Fallback for browsers that don't support the Web Share API
        alert('Sharing functionality is not supported in this browser.');
    }
}


function likeArticle() {
    // Replace this with your liking functionality
    alert("Thanks for liking this article!");
}
 // Select elements
const commentSection = document.getElementById('comment-section');
const commentForm = document.getElementById('comment-form');

// Function to create a new comment element
function createComment(commenterName, commentText) {
    // Create comment container
    const commentDiv = document.createElement('div');
    commentDiv.classList.add('comment');

    // Create comment content
    const commentContent = document.createElement('div');
    commentContent.classList.add('comment-content');

    // Commenter name
    const commenterNameElement = document.createElement('p');
    commenterNameElement.classList.add('commenter-name');
    commenterNameElement.textContent = commenterName;

    // Comment text
    const commentTextElement = document.createElement('p');
    commentTextElement.classList.add('comment-text');
    commentTextElement.textContent = commentText;

    // Comment actions (reply and share icons)
    const commentActions = createCommentActions();

    // Reply form
    const replyForm = document.createElement('form');
    replyForm.classList.add('reply-form');
    replyForm.innerHTML = `
        <input type="hidden" name="replier-name" value="${commenterName}">
        <textarea placeholder="Write your reply here" class="reply-textarea"></textarea>
        <button class="reply" type="submit">Post Reply</button>
    `;
    replyForm.style.display = 'none'; // Initially hide reply form

    // Append elements
    commentContent.appendChild(commenterNameElement);
    commentContent.appendChild(commentTextElement);
    commentContent.appendChild(commentActions);
    commentContent.appendChild(replyForm); // Add reply form
    commentDiv.appendChild(commentContent);

    return commentDiv;
}

// Function to create comment actions (reply and share icons)
function createCommentActions() {
    const commentActionsDiv = document.createElement('div');
    commentActionsDiv.classList.add('comment-actions');

    // Reply icon
    const replyIcon = document.createElement('a');
    replyIcon.href = '#';
    replyIcon.classList.add('reply-icon');
    replyIcon.innerHTML = '<i class="fas fa-reply"></i> Reply';
    commentActionsDiv.appendChild(replyIcon);

    // Share icon
    const shareIcon = document.createElement('a');
    shareIcon.href = '#';
    shareIcon.classList.add('share-icon');
    shareIcon.innerHTML = '<i class="fas fa-share-alt"></i> Share';
    commentActionsDiv.appendChild(shareIcon);

    return commentActionsDiv;
}
// Event listener for submitting comments
commentForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    // Get commenter name and comment text from the form
    const commenterName = document.getElementById('commenter-name').value.trim();
    const commentText = document.getElementById('comment-text').value.trim();

    // Check if both commenter name and comment text are not empty
    if (commenterName !== '' && commentText !== '') {
        // Create a new comment element
        const newComment = createComment(commenterName, commentText);

        // Add the new comment to the comment section
        commentSection.appendChild(newComment);

        // Clear the form fields
        document.getElementById('commenter-name').value = '';
        document.getElementById('comment-text').value = '';
    } else {
        alert('Please enter your name and a non-empty comment.');
    }
});

// Event listener for submitting replies
commentSection.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    // Check if the submitted form is a reply form
    if (event.target.classList.contains('reply-form')) {
        // Get replier name and reply text from the form
        const replierName = event.target.querySelector('input[name="replier-name"]').value.trim();
        const replyText = event.target.querySelector('textarea').value.trim();

        // Check if both replier name and reply text are not empty
        if (replierName !== '' && replyText !== '') {
            // Create a new comment element for the reply
            const replyComment = createComment(replierName, replyText);

            // Insert the reply comment after the parent comment
            const parentComment = event.target.closest('.comment');
            parentComment.parentNode.insertBefore(replyComment, parentComment.nextSibling);

            // Hide the reply form and textarea
            event.target.style.display = 'none';
            event.target.querySelector('textarea').style.display = 'none';
        } else {
            alert('Please enter your name and a non-empty reply.');
        }
    }
});

// Event delegation for toggling reply forms
commentSection.addEventListener('click', function(event) {
    if (event.target.classList.contains('reply-icon')) {
        event.preventDefault(); // Prevent link default behavior

        // Toggle reply form visibility
        const replyForm = event.target.closest('.comment').querySelector('.reply-form');
        replyForm.style.display = 'block';

        // Show reply textarea
        const replyTextarea = replyForm.querySelector('textarea');
        replyTextarea.style.display = 'block';
        replyTextarea.focus(); // Focus on the textarea
    }
});


// Event delegation for liking comments
commentSection.addEventListener('click', function(event) {
    if (event.target.classList.contains('like-icon')) {
        event.preventDefault(); // Prevent link default behavior

        // Toggle like status
        event.target.classList.toggle('liked');
    }
});

// Event delegation for sharing comments
commentSection.addEventListener('click', function(event) {
    if (event.target.classList.contains('share-icon')) {
        event.preventDefault(); // Prevent link default behavior

        // Perform share action (you can implement this functionality as needed)
        alert('Share functionality will be implemented here.');
    }
});


document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('newsletter-form');
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission
        const emailInput = document.getElementById('email').value;
        // Here you can perform validation of the email address
        // If validation passes, you can send the email address to the server
        subscribeToNewsletter(emailInput);
    });
});

function subscribeToNewsletter(email) {
    // Send the email address to the server using fetch or XMLHttpRequest
    fetch('/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Display a success message to the user
        alert(data.message);
    })
    .catch(error => {
        console.error('Error subscribing to newsletter:', error);
        // Display an error message to the user
        alert('An error occurred while subscribing to the newsletter. Please try again later.');
    });
}


function sendNewsletter() {
    // Retrieve subscribed emails from the database
    const getSubscribedEmailsQuery = 'SELECT email FROM newsletter_subscriptions';
    connection.query(getSubscribedEmailsQuery, (err, results) => {
        if (err) {
            console.error('Error retrieving subscribed emails:', err);
            return;
        }

        if (results.length === 0) {
            console.log('No subscribed emails found.');
            return;
        }

        // Construct the email content (customize as needed)
        const newsletterContent = `
            <h1>Our Latest Newsletter</h1>
            <p>Dear valued subscriber,</p>
            <p>Here are some exciting updates from our company...</p>
            <p>Thank you for your continued support!</p>
        `;

        // Send the newsletter to each subscriber
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'thirstylioon2@gmail.com',
                pass: 'jdxi wdym cdps umeb',
            }
        });

        results.forEach(row => {
            const { email } = row;
            const mailOptions = {
                from: 'thirstylioon2@gmail.com',
                to: email,
                subject: 'Our Latest Newsletter',
                html: newsletterContent
            };

            transporter.sendMail(mailOptions, (sendErr, info) => {
                if (sendErr) {
                    console.error(`Error sending newsletter to ${email}:`, sendErr);
                } else {
                    console.log(`Newsletter sent to ${email}:`, info.response);
                }
            });
        });
    });
}

// Call the function to send the newsletter




$(document).ready(function () {
    // Functionality for the "Create Account" button
    $("#registerBtn").on("click", function () {
        // Capture the entered registration information
        var newUsername = $("#newUsername").val();
        var newEmail = $("#newEmail").val();
        var newPassword = $("#newPassword").val();

        // Send registration data to the server
        $.ajax({
            url: 'http://localhost:3000/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ newUsername: newUsername, newEmail: newEmail, newPassword: newPassword }),
            success: function (response) {
                console.log(response);
                alert(response.message);
            },
            error: function (error) {
                console.error(error);
                alert('Error during registration');
            }
        });
    });
})

function logout() {
    // Simulate a logout process
    // For example, destroy the session, clear cookies, etc.
    // Redirect to the login page
    window.location.href = '/logout';
}


