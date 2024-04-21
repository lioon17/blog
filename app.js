const express = require('express');
const path = require('path');
const app = express();
const mysql = require('mysql');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer')
const cron = require('node-cron');
const morgan = require('morgan');
const multer  = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PORT = 3000;

// Set the view engine to EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));


const secretKey = crypto.randomBytes(64).toString('hex');
/*
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage: storage }); */
  
// Database connection
const dbConfig = ({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'blog',
});

const connection = mysql.createConnection(dbConfig);


connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});



// Session configuration
app.use(session({
    key: 'session_cookie_name',
    secret: 'your_secret_key',
    store: new MySQLStore({}, connection),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: false // Set to true if using https
    }
  }));

// Middleware to check if the user is logged in
function checkAuthentication(req, res, next) {
    if (req.session.loggedin) {
      next();
    } else {
      res.redirect('/login');
    }
  }

  function isAdmin(req, res, next) {
    if (req.session && req.session.loggedin && req.session.role === 'admin') {
        next(); // User is an admin, proceed to the next middleware/route handler
    } else {
        res.status(403).send('This page is not Accessible to users!!'); // User is not an admin, deny access
    }
}
// Routes
app.get('/', (req, res) => {
    res.render('pages/index1');
});

// Index route, protected by authentication
app.get('/index', checkAuthentication, (req, res) => {
    res.render('pages/index');
});

app.get('/article-page',checkAuthentication, (req, res) => {
    res.render('pages/article-page');
});

app.get('/about-us', (req, res) => {
    res.render('pages/about-us');
});

app.get('/dashboard', isAdmin, (req, res) => {
    res.render('pages/dashboard');
});

app.get('/login', (req, res) => {
    res.render('pages/login');
});


// Display page route with dynamic post ID
app.get('/display-page/:postId', (req, res) => {
    const postId = req.params.postId;

    // Query to fetch post data based on postId from the database
    const query = 'SELECT * FROM science_of_change WHERE id = ?';
    connection.query(query, [postId], (err, results) => {
        if (err) {
            console.error('Error fetching post data:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (results.length === 0) {
                res.status(404).send('Post not found');
            } else {
                const postData = results[0];
                res.render('pages/display-page', { post: postData });
            }
        }
    });
});

app.get('/image/:postId', (req, res) => {
    const postId = req.params.postId;
    // Query to fetch image data based on postId from the database
    const query = 'SELECT images FROM science_of_change WHERE id = ?';
    connection.query(query, [postId], (err, results) => {
        if (err) {
            console.error('Error fetching image data:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (results.length === 0 || !results[0].images) {
                res.status(404).send('Image not found');
            } else {
                const imageData = results[0].images;
                // Set response headers to indicate image content
                res.writeHead(200, {
                    'Content-Type': 'image/jpeg', // Adjust content type as per your image type
                    'Content-Length': imageData.length
                });
                res.end(imageData);
            }
        }
    });
});

app.get('/video/:postId', (req, res) => {
    const postId = req.params.postId;
    // Query to fetch video data based on postId from the database
    const query = 'SELECT video FROM science_of_change WHERE id = ?';
    connection.query(query, [postId], (err, results) => {
        if (err) {
            console.error('Error fetching video data:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (results.length === 0 || !results[0].video) {
                res.status(404).send('Video not found');
            } else {
                const videoData = results[0].video;
                // Set response headers to indicate video content
                res.writeHead(200, {
                    'Content-Type': 'video/mp4', // Adjust content type as per your video type
                    'Content-Length': videoData.length
                });
                res.end(videoData);
            }
        }
    });
});



app.post('/subscribe', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    // Check if the email already exists in the database
    const checkEmailExistsQuery = 'SELECT * FROM newsletter_subscriptions WHERE email = ?';
    connection.query(checkEmailExistsQuery, [email], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error checking email existence:', checkErr);
            return res.status(500).json({ message: 'An error occurred while checking email existence.' });
        }

        if (checkResult.length > 0) {
            // Email already exists, return an error response
            return res.status(409).json({ message: 'Email is already subscribed.' });
        }

        // Email does not exist, proceed with insertion
        console.log(`New subscription: ${email}`);

        // Insert the email into the newsletter_subscriptions table
        const insertEmailQuery = 'INSERT INTO newsletter_subscriptions (email) VALUES (?)';
        connection.query(insertEmailQuery, [email], (insertErr, insertResult) => {
            if (insertErr) {
                console.error('Error inserting into the database:', insertErr);
                return res.status(500).json({ message: 'An error occurred while saving the subscription.' });
            }
            console.log('Inserted into the database:', insertResult);

            // Send a welcome email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'thirstylioon2@gmail.com',
                    pass: 'jdxi wdym cdps umeb',
                }
            });

            const mailOptions = {
                from: 'thirstylioon2@gmail',
                to: email,
                subject: 'Welcome to Our Newsletter!',
                text: 'Thank you for subscribing to our newsletter. Stay tuned for exciting updates!'
            };

            transporter.sendMail(mailOptions, (sendErr, info) => {
                if (sendErr) {
                    console.error('Error sending email:', sendErr);
                    return res.status(500).json({ message: 'An error occurred while sending the welcome email.' });
                }
                console.log('Email sent:', info.response);
                res.json({ message: 'Subscription successful! Welcome to our newsletter ^_^' });
            });
        });
    });
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'thirstylioon2@gmail.com',
        pass: 'jdxi wdym cdps umeb',
    }
});
/*
function sendEmail(mailOptions) {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
    });
  }
  
  // Usage example for contact request
  sendEmail({
    from: '"Your Name" <thirstylioon2@gmail.com>',
    to: 'leoninyangala@gmail.com',
    subject: 'New Contact Request',
    text: 'Hello world?', // Plain text body
    html: '<b>Hello world?</b>' // HTML body content
  });
  */

const mailOptions = {
    from: 'thirstylioon2@gmail.com',
    subject: 'Our Latest Newsletter',
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Newsletter</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                padding: 20px;
            }
            .newsletter-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .newsletter-header {
                color: #333;
                text-align: center;
            }
            .newsletter-content {
                color: #666;
            }
            .product-image {
                width: 100%;
                height: auto;
                margin: 10px 0;
            }
            .offer-section {
                background-color: #e7f4ff;
                padding: 10px;
                margin: 10px 0;
                border-left: 5px solid #0077cc;
            }
            .footer {
                color: #666;
                text-align: center;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
    
        <div class="newsletter-container">
    
            <h1 class="newsletter-header">Our Latest Newsletter</h1>
    
            <div class="newsletter-content">
                <p>Dear Subscriber,</p>
    
                <p>Here are some highlights from our latest updates:</p>
    
                <section>
                    <h2>New Product Launches</h2>
                    <p>Discover our innovative new products that are set to revolutionize the industry. Detailed descriptions and features below:</p>
                    <!-- Placeholder for product details -->
                    <img class="product-image" src="images/new_product_1.jpeg" alt="New Product 1">
                    <img class="product-image" src="images/new_product_2.jpeg" alt="New Product 2">
                </section>
    <section>
        <h2>Upcoming Events</h2>
        <p>Don't miss out on our exciting upcoming events. Find out more about what's in store:</p>
        <!-- Placeholder for event details -->
        <a href="url-to-events-page.html">More about our events</a>
    </section>
    
    
                <section class="offer-section">
                    <h2>Exclusive Offers</h2>
                    <p>Take advantage of our exclusive offers available only to our valued subscribers:</p>
                    <!-- Placeholder for offer details -->
                    <img class="product-image" src="images/exclusive_offer_1.jpeg" alt="Exclusive Offer 1">
                    <img class="product-image" src="images/exclusive_offer_2.jpeg" alt="Exclusive Offer 2">
                </section>
    
                <p class="footer">Stay tuned for more exciting news and updates!</p>
    
                <p class="footer">Best regards,<br>The Newsletter Team</p>
            </div>
    
        </div>
    
    </body>
    </html>
    
    
    `
};
function sendNewsletter() {
// Retrieve email addresses from the database and send the newsletter
connection.query('SELECT email FROM newsletter_subscriptions', (err, rows) => {
    if (err) {
        console.error('Error retrieving emails from the database:', err);
        return;
    }

    // Iterate through the list of email addresses and send the newsletter to each one
    rows.forEach(row => {
        const recipientEmail = row.email;
        mailOptions.to = recipientEmail; // Set the recipient email dynamically
        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email to', recipientEmail, ':', error);
            } else {
                console.log('Email sent to', recipientEmail, ':', info.response);
            }
        });
    });
});

}
// Schedule the sendNewsletter function to run every day at 10 AM
cron.schedule('04 9 * * *', () => {
    sendNewsletter();
});




app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    const role = 'user'; // Default role for every new user

    // Generate a unique user ID
    const userId = uuidv4().substring(0, 8); // Use only the first 8 characters of the UUID

    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error hashing password');
        }

        // Insert user data into the database
        const sql = 'INSERT INTO users (user_id, username, email, password, role) VALUES (?, ?, ?, ?, ?)';
        connection.query(sql, [userId, username, email, hash, role], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server error');
            }
            res.redirect('/login');
        });
    });
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    connection.query(sql, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging in');
        }
        if (results.length === 0) {
            return res.status(401).send('No user found');
        }
        const user = results[0];
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error comparing passwords');
            }
            if (result) {
                req.session.loggedin = true;
                req.session.username = user.username;
                req.session.role = user.role; // Set the user's role in the session
                // Redirect based on role
                if (user.role === 'admin') {
                    res.status(200).json({ message: 'Admin login successful', redirectTo: '/dashboard' });
                } else {
                    res.status(200).json({ message: 'User login successful', redirectTo: '/index' });
                }
            } else {
                res.status(401).json({ error: 'Incorrect password' });
            }
        });
    });
}); 


  


// Logout route
app.get('/logout', (req, res) => {
    // Destroy the session in the database
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Error logging out');
      }
      // Redirect to the login page
      res.redirect('/login');
    });
  });
/* Route to handle file upload
app.post('/upload', upload.single('media'), (req, res) => {
    // Save file information to the database
    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }
  
    const { filename, path: filePath } = file;
    const insertQuery = 'INSERT INTO media_files (file_name, file_path) VALUES (?, ?)';
    connection.query(insertQuery, [filename, filePath], (err, results) => {
      if (err) {
        console.error('Error saving file to database: ' + err);
        return res.status(500).send('Error saving file to database.');
      }
      res.send('File uploaded and saved to database!');
    });
  });
  
  // Route to retrieve and serve files
  app.get('/media/:id', (req, res) => {
    const id = req.params.id;
    const selectQuery = 'SELECT * FROM media_files WHERE id = ?';
    connection.query(selectQuery, [id], (err, results) => {
      if (err) {
        console.error('Error retrieving file from database: ' + err);
        return res.status(500).send('Error retrieving file from database.');
      }
      if (results.length === 0) {
        return res.status(404).send('File not found.');
      }
      const file = results[0];
      res.sendFile(file.file_path);
    });
  });
  */
  app.get('/search', (req, res) => {
    const searchTerm = req.query.term;
    const sanitizedSearchTerm = connection.escape('%' + searchTerm + '%'); // Sanitize search term

    console.log('Sanitized search term:', sanitizedSearchTerm);

    const query = `SELECT * FROM science_of_change WHERE title LIKE ${sanitizedSearchTerm} OR content LIKE ${sanitizedSearchTerm}`;

    console.log('SQL query:', query);

    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
        }
    });
});

// Route to handle posting of new content
app.post('/update-content', (req, res) => {
    const { title, author, content, image, articleId } = req.body; // Get article ID from request body

    // Define the paths for both index.ejs and article-page.ejs
    const indexPath = './Views/Pages/index.ejs';
    const articlePath = './Views/Pages/article-page.ejs';
    const index1Path ='./Views/Pages/index1.ejs';
    console.log('Received data:', req.body); 
    // Read the file based on the article ID
    const filePath = articleId === '123' ? articlePath : indexPath;

    fs.readFile(indexPath, 'utf8', (err, indexData) => {
        if (err) {
            console.error('Error reading index file:', err);
            return res.status(500).send('Error reading index file');
        }

        fs.readFile(articlePath, 'utf8', (err, articleData) => {
            if (err) {
                console.error('Error reading article file:', err);
                return res.status(500).send('Error reading article file');
            }

            fs.readFile(index1Path, 'utf8', (err, index1Data) => {
                if (err) {
                    console.error('Error reading article file:', err);
                    return res.status(500).send('Error reading article file');
                }
            
            // Replace the specific items of the article with new values based on the article ID
            let updatedIndexContent = indexData.replace(new RegExp(`<h2 id="title-${articleId}">(.*?)<\/h2>`, 'g'), `<h2 id="title-${articleId}">${title}</h2>`)
                                                .replace(new RegExp(`<em class="author" id="author-${articleId}">(.*?)<\/em>`, 'g'), `<em class="author" id="author-${articleId}">Written by: ${author}</em>`)
                                                .replace(new RegExp(`<p id="content-${articleId}">([\\s\\S]*?)<\/p>`, 'g'), `<p id="content-${articleId}">${content}</p>`)
                                                .replace(new RegExp(`src="(.*?)" id="image-${articleId}"`, 'g'), `src="${image}" id="image-${articleId}"`);

            let updatedArticleContent = articleData.replace(new RegExp(`<h2 id="title-${articleId}">(.*?)<\/h2>`, 'g'), `<h2 id="title-${articleId}">${title}</h2>`)
                                                    .replace(new RegExp(`<em class="author" id="author-${articleId}">(.*?)<\/em>`, 'g'), `<em class="author" id="author-${articleId}">Written by: ${author}</em>`)
                                                    .replace(new RegExp(`<p id="content-${articleId}">([\\s\\S]*?)<\/p>`, 'g'), `<p id="content-${articleId}">${content}</p>`)
                                                    .replace(new RegExp(`src="(.*?)" id="image-${articleId}"`, 'g'), `src="${image}" id="image-${articleId}"`);

            let updatedIndex1Content = index1Data.replace(new RegExp(`<h2 id="title-${articleId}">(.*?)<\/h2>`, 'g'), `<h2 id="title-${articleId}">${title}</h2>`)
                                                .replace(new RegExp(`<em class="author" id="author-${articleId}">(.*?)<\/em>`, 'g'), `<em class="author" id="author-${articleId}">Written by: ${author}</em>`)
                                                .replace(new RegExp(`<p id="content-${articleId}">([\\s\\S]*?)<\/p>`, 'g'), `<p id="content-${articleId}">${content}</p>`)
                                                .replace(new RegExp(`src="(.*?)" id="image-${articleId}"`, 'g'), `src="${image}" id="image-${articleId}"`);

            // Write the updated content back to the files
            fs.writeFile(indexPath, updatedIndexContent, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing index file:', err);
                    return res.status(500).send('Error writing index file');
                }
                fs.writeFile(articlePath, updatedArticleContent, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing article file:', err);
                        return res.status(500).send('Error writing article file');
                    }
                    fs.writeFile(index1Path, updatedIndex1Content, 'utf8', (err) => {
                        if (err) {
                            console.error('Error writing index file:', err);
                            return res.status(500).send('Error writing index file');
                        }
                    res.send('Content updated successfully');
                    });
                    });
                });
            });
        });
    });
});
    
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
