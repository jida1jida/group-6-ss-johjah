require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static('public'));

//////////////////////////////////////
//ROUTES TO SERVE HTML FILES
//////////////////////////////////////
// Default route to serve logon.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/logon.html');
});

app.get('/logon', (req, res) => {
    res.sendFile(__dirname + '/public/logon.html');
});

// Route to serve dashboard.html
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

// Route to serve mainmenu.html
app.get('/mainmenu', (req, res) => {
    res.sendFile(__dirname + '/public/mainmenu.html');
});

// Route to serve meditation.html
app.get('/meditation', (req, res) => {
    res.sendFile(__dirname + '/public/meditation.html');
});

// Route to serve account.html
app.get('/account', (req, res) => {
    res.sendFile(__dirname + '/public/account.html');
})

//////////////////////////////////////
//END ROUTES TO SERVE HTML FILES
//////////////////////////////////////


/////////////////////////////////////////////////
//HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////
// Helper function to create a MySQL connection
async function createConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
}

// **Authorization Middleware: Verify JWT Token and Check User in Database**
async function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' });
        }

        try {
            const connection = await createConnection();

            // Query the database to verify that the email is associated with an active account
            const [rows] = await connection.execute(
                'SELECT email FROM user WHERE email = ?',
                [decoded.email]
            );

            await connection.end();  // Close connection

            if (rows.length === 0) {
                return res.status(403).json({ message: 'Account not found or deactivated.' });
            }

            req.user = decoded;  // Save the decoded email for use in the route
            next();  // Proceed to the next middleware or route handler
        } catch (dbError) {
            console.error(dbError);
            res.status(500).json({ message: 'Database error during authentication.' });
        }
    });
}
/////////////////////////////////////////////////
//END HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////


//////////////////////////////////////
//ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////
// Route: Create Account
app.post('/api/create-account', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password  || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required.' });
    }

    try {
        const connection = await createConnection();
        const hashedPassword = await bcrypt.hash(password, 10);  // Hash password

        const [result] = await connection.execute(
            'INSERT INTO user (email, password, prefname) VALUES (?, ?, ?)',
            [email, hashedPassword, name]
        );

        await connection.end();  // Close connection

        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'An account with this email already exists.' });
        } else {
            console.error(error);
            res.status(500).json({ message: 'Error creating account.' });
        }
    }
});

// Route: Logon
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const connection = await createConnection();

        const [rows] = await connection.execute(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );

        await connection.end();  // Close connection

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in.' });
    }
});

// Route: Get All Email Addresses and Prefnames
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();

        // Fetch both email and prefname from the database
        const [rows] = await connection.execute('SELECT email, prefname FROM user');

        await connection.end();  // Close connection

        // Map the result to include both email and prefname
        const usersList = rows.map((row) => ({
            email: row.email,
            prefname: row.prefname || ""  // In case prefname is not set, return an empty string
        }));

        res.status(200).json({ users: usersList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving user data.' });
    }
});

// Route: log a meditation session
app.post('/api/med-session', authenticateToken, async (req, res) => {
    const { duration, type } = req.body;
    const userEmail = req.user.email;

    // record session info
    try {
        const connection = await createConnection();
        
        // streak
        const [rows] = await connection.execute('SELECT last_session_date FROM user WHERE email = ?', [userEmail]);

        let new_streak = 1;
        const today = new Date().toISOString().split('T')[0];

        if (rows.length > 0 && rows[0].last_session_date) {
            const last_session_date = new Date(rows[0].last_session_date);
            const yesterday = new Date;
            yesterday.setDate(yesterday.getDate() - 1);

            if (last_session_date.toISOString().split('T')[0] === today) { // if last session date is today...
                new_streak = rows[0].streak; // streak is unchanged
            } else if (last_session_date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) { // if last session date is yesterday...
                new_streak = rows[0].streak + 1; // increment streak by 1
            }
        }
        
        // update streak
        await connection.execute(
            'update user set streak_count = ?, last_session_date = ? where email = ?',
            [new_streak, today, userEmail]
        );
        
        // log session
        await connection.execute(
            'insert into session_log (email, session_duration_seconds, session_type) values (?, ?, ?)',
            [userEmail, duration, type || null]
        );
        await connection.end();

        res.status(201).json({
            message: 'Meditation session logged successfully!'});
    } catch (error) {
        console.error('Error logging meditation session: ', error);
        res.status(500).json({message: 'Error logging session!'});
    }

});

//////////////////////////////////////
//END ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});